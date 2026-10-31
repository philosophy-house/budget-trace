// [1]→ 一次資料の外部アーカイブ（Wayback Machine）登録。
// 使い方: bun run pipeline:archive [sourceId] [--force]
//
// 目的: 一次資料は発行元サイトから削除され得る（実例: 甲府市 R4・R5 当初予算資料は
// 市サイトから削除済みで Wayback にも無く入手不可になった）。raw 層の git アーカイブが
// 一義的な保全だが、それは「私たちの写し」でしかない。**第三者が検証できる中立な写し**
// として Wayback Machine（Internet Archive）にも登録し、スナップショット URL を
// data/archives.json（台帳・コミット対象）に記録する。
//
// 動作:
// 1. registry の全ソースの直リンク（urls）とランディングページを対象にする
// 2. CDX API で既存スナップショットを確認。あれば記録して終わり（登録済み）
// 3. 無ければ Save Page Now（https://web.archive.org/save/<url>）で登録を要求し、
//    CDX に現れるまでポーリングして記録する
// 4. --force は既存スナップショットがあっても新規登録を要求する
//    （直リンクが同じパスへ上書きされる資料 — kofu-zaisei-jokyo — の版の保全に使う）
//
// 行儀: 逐次実行・リクエスト間に間隔を置く（SPN の匿名レートリミットに配慮）。
// 失敗はエラーにせず台帳に記録しない（次回実行で再試行される）。
//
// 実行の作法（2026-10-31・docs/proposals/wayback-bottleneck.md の第1段・lib/archive-state.ts）:
// - **ワークツリーごとにロック**（`data/.archive.lock`）。2本目は止まる（`--wait` で空くまで待つ）。
//   待つだけなら `--wait-only`。derive はロックが生きていたら止まる
// - **SPN の要求の間隔はワークツリーをまたいで共有**（匿名の枠は IP ごと）
// - **全要求にタイムアウト**。**SPN が続けて落ちたら要求をやめる**（止まっている日に全件を試して
//   全件「未確認」にしない）。CDX が続けて引けなければ実行ごと止める
// - **試行の結末を型つきで記録**（git の共通ディレクトリの archive-attempts.jsonl）。
//   集計は `bun run pipeline:archive-attempts`
import { existsSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { SOURCES } from "./registry/sources";
import { DATA_DIR, readJson, readRawMeta } from "./lib/store";
import { MIB, VERIFIABLE_RE, classifyVerify } from "./lib/wayback";
import {
  acquireArchiveLock,
  readAttempts,
  recordAttempt,
  waitForArchiveLock,
  waitForSpnSlot,
  type AttemptOutcome,
} from "./lib/archive-state";
import { archivesLedgerSchema, type ArchiveEntry } from "./types";

const ARCHIVES_PATH = join(DATA_DIR, "archives.json");
const UA = "budget-trace archive step (github.com/philosophy-house/budget-trace)";
/**
 * SPN への要求の間隔（**全ワークツリーで共有**）。6秒では 429 が出た（§9b・2026-08-12）。
 * 公開文書の匿名の上限は毎分3件なので、それより少し空ける。`ARCHIVE_SPN_INTERVAL_MS` で上書きできる。
 */
const SPN_INTERVAL_MS = Number(process.env.ARCHIVE_SPN_INTERVAL_MS ?? 30_000);
const POLL_TRIES = 10;
const POLL_INTERVAL_MS = 6_000;
// タイムアウト。以前は無く、1件が1時間を超えて固まった（第21巡・2026-09-02）。
// SPN の取得時間の上限は公開文書で2分。照合のダウンロードは数十MBの PDF があるので長めに取る。
const CDX_TIMEOUT_MS = 60_000;
const SAVE_TIMEOUT_MS = 150_000;
const VERIFY_TIMEOUT_MS = 300_000;
// 429 の待ち直し（SPN・CDX とも）。日次の枠が尽きると翌日まで戻らない（§9b）ので、回数は少なく
const BACKOFF_MS = [60_000, 180_000];
// これだけ続けて SPN が落ちたら（spn-down・rate-limited）この実行では要求をやめる
const SPN_STOP_AFTER = 3;
// これだけ続けて CDX が引けなければ実行ごと止める（引けないと捕捉の有無が分からない）
const CDX_STOP_AFTER = 3;
// これだけ続けて「未確認」（pending・rejected）の URL は、発行元がクローラを弾いている疑いを出す
const SUSPECT_AFTER = 3;
// sha256 照合のダウンロードは**一時的な失敗が多い**（#137: Wayback は同じスナップショットでも
// 転送がランダムに途中で切れる — 港 H31 は 142KB で切れた5日後に同じ URL から全量 1.4MB が
// 取れて完全一致した）。1回の失敗を台帳に固定しない。
const VERIFY_TRIES = 3;
const VERIFY_RETRY_MS = 5_000;
// 最新の捕捉が不一致だったとき、過去の捕捉を何件まで照合するか（最新を含む）。
// 多数の捕捉が全部不一致の URL で毎回のダウンロードが際限なく増えないための上限。
const WALK_LIMIT = 4;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Snapshot = { timestamp: string; waybackUrl: string };

/**
 * CDX API で 200 スナップショットを**新しい順に**返す（最大 50 件）。
 *
 * 最新の1件だけでは足りない（2026-08-13・#214）— 打ち切られた捕捉より**古い完全な捕捉**が
 * ある URL が実在する（新宿 R5: 最新 2026-04 は 5MiB 打ち切りだが 2025-08 の捕捉は全量 12.4MB で
 * raw と完全一致）。しかも SPN の再保存では解消しない — 内容が既存の完全捕捉と同一だと Wayback は
 * **revisit 記録**（statuscode "-"）として保存し、このフィルタには**永遠に新しい 200 捕捉が
 * 現れない**（新宿 R5 で実測）。→ 呼び出し側が最新から順に照合し、一致する捕捉を台帳に採る。
 */
async function snapshots200(url: string, retry = true): Promise<Snapshot[]> {
  const api = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&limit=-50`;
  // ⚠ **引けなかったことを「捕捉が無い」にしない**（2026-10-31）。以前は `!res.ok` で [] を返していたので、
  //   CDX が 429/504 の間は全 URL が「未登録」に見えて SPN 要求に落ち、それも 429 で未確認になっていた（§9b）。
  //   429・5xx は待ち直し、それでも駄目なら CdxError で呼び出し側に知らせる。
  //   `retry: false` は SPN の後の待ち（呼び出し側が間隔を置いて何度も引く）用で、待ち直さない。
  const tries = retry ? BACKOFF_MS.length + 1 : 1;
  let last = "";
  for (let attempt = 0; attempt < tries; attempt++) {
    if (attempt > 0) await sleep(BACKOFF_MS[attempt - 1]!);
    let res: Response;
    try {
      res = await fetch(api, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(CDX_TIMEOUT_MS) });
    } catch (e) {
      last = `接続できない（${e instanceof Error ? e.message : String(e)}）`;
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      res.body?.cancel();
      last = `HTTP ${res.status}`;
      continue;
    }
    if (!res.ok) throw new CdxError(`HTTP ${res.status}`, res.status);
    const rows = (await res.json()) as string[][];
    if (!Array.isArray(rows) || rows.length < 2) return [];
    return rows
      .slice(1)
      .map((r) => ({ timestamp: r[1]!, waybackUrl: `https://web.archive.org/web/${r[1]}/${r[2]}` }))
      .reverse();
  }
  throw new CdxError(`${last}（${tries}回試行）`);
}

class CdxError extends Error {
  constructor(
    message: string,
    readonly http?: number,
  ) {
    super(`CDX が引けない: ${message}`);
  }
}

/**
 * 照合の結果は3通りある。**「対象外」と「できなかった」を undefined でひとまとめにしない**
 * （2026-07-16）— 台帳で両者が区別できず、江戸川 R8 が「検証できなかった」まま
 * 「魚拓が揃った」と報告されかけた。
 *   - `skipped`  … 照合対象外（HTML・設計どおり）。台帳にフィールドを置かない
 *   - `failed`   … 照合すべきなのにできなかった。`sha256Verified: false` を残す
 *   - `verified` … 照合が走った。`sha256Match` と診断用のバイト数を残す
 */
type VerifyResult =
  | { status: "skipped" }
  | { status: "failed"; reason: string }
  | {
      status: "verified";
      match: boolean;
      /**
       * コピーのバイト数（打ち切りの上限・不足量を出すため。台帳にも残して後から診断できるようにする）。
       * **一致した台帳エントリを再利用したときだけ undefined**（バイト数を残す前に登録された
       * 古いエントリ。一致の報告にバイト数は要らないので、これを埋めるためだけに
       * 数百件を再ダウンロードしない）。不一致はバイト数が無ければ必ず再照合する。
       */
      bytes?: number;
      /** raw のバイト数（不一致の原因診断はコピー単独では付かず、原本との差で見る） */
      rawBytes?: number;
      /**
       * 不一致の型。`match: true` なら "match"。
       *   - `truncated` … MiB 境界ちょうど＝**確実な打ち切り**。私たちの raw が正しい
       *   - `partial`   … raw より小さいが境界ではない＝**不完全な捕捉が濃厚**（ただし断定しない）
       *   - `other`     … 小さくもない＝**別版**の疑い。--force で再登録
       */
      kind: "match" | "truncated" | "partial" | "other";
    };

const filenameOf = (url: string) => decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
/**
 * その URL から取得した raw のエントリ。
 * ⚠⚠ **basename で引いてはいけない** — ファイル名の衝突を避けるために局名を前置した
 * ファイル（`iryo__0002_20260126.pdf`）は basename と一致せず、**同名別ディレクトリの
 * 別ファイルとハッシュを比べて「不一致」になる**（2026-08-06・横浜で偽陽性5件）。
 * raw-meta は取得元 URL を持っているので、**それで引く**（衝突しても一意に決まる）。
 * ⚠ **偽陽性を出すゲートは無視されるようになる**（§9o）ので放置しない。
 */
const rawFileOf = (sourceId: string, url: string) =>
  readRawMeta(sourceId)?.files.find((f) => f.fetchedFrom === url);
/** raw 側のバイト数（台帳のコピーと突き合わせて不一致の型を診断するため） */
const rawBytesOf = (sourceId: string, url: string) => rawFileOf(sourceId, url)?.bytes;

/**
 * sha256 照合の対象か。**registry の `kind` を正とする**（2026-07-23・#124 東京都で発見）。
 * 以前は URL の拡張子（VERIFIABLE_RE）だけで判定していたため、**拡張子の無い静的ファイル URL**
 * （東京都の Liferay 配信 `documents/d/zaimu/08-03sainyukanbetsu` ＝中身は CSV）が HTML 扱いで
 * **照合ごとスキップ**されていた。しかも健康診断も同じ正規表現を使うので、**「魚拓はあるが未照合」の
 * 7件が診断にも映らない**＝§9o の穴が判定の内側に空いていた型。
 * - `page`（HTML）は設計どおり照合しない（テンプレート差で揺れる）
 * - `pdf`/`csv`/`excel` は**拡張子に関係なく**照合する
 * - registry から消えたソースが台帳に残っている場合は従来どおり拡張子で判定（フォールバック）
 * ⚠ §9o: **verifySnapshot と末尾の健康診断は必ずこの同じ関数を使う**こと（別々に持つと恒久ノイズ）。
 */
const SRC_KIND = new Map(SOURCES.map((s) => [s.id, s.kind]));
const isVerifiable = (sourceId: string, url: string): boolean => {
  const kind = SRC_KIND.get(sourceId);
  if (kind == null) return VERIFIABLE_RE.test(filenameOf(url));
  return kind !== "page";
};

/**
 * コピーが raw（私たちが parse した版）と同一バイト列かを sha256 で突合する（file のみ）。
 * Wayback の `id_` 付き URL は原本のバイト列をそのまま返す。
 * 上書き型 URL の古いスナップショットを現行版と誤認する事故を検出できる
 * （実例: 財政事情 01ipankaikei.pdf の 2024 年版スナップショット）。
 *
 * **「照合できなかった」を黙って握り潰さない** — raw が無い・取得に失敗したときは
 * `failed` を返して台帳に `sha256Verified: false` を残す（照合対象外の HTML＝`skipped` とは別物）。
 */
async function verifySnapshot(sourceId: string, url: string, timestamp: string): Promise<VerifyResult> {
  const filename = filenameOf(url);
  // HTML ページはテンプレート差（トークン・広告タグ等）で取得時刻によりバイト列が
  // 揺れるため sha 突合の対象外（静的ファイルのみ検証する）＝設計どおりの skipped。
  // 判定は registry の kind（isVerifiable）— 拡張子の無い静的ファイル URL を取りこぼさない
  if (!isVerifiable(sourceId, url)) return { status: "skipped" };
  const meta = readRawMeta(sourceId);
  if (!meta) return { status: "failed", reason: "raw-meta が無い（未 fetch）" };
  // ⚠ **取得元 URL で引く**（basename だと衝突回避で改名したファイルを取り違える。上記 rawFileOf）
  const raw = rawFileOf(sourceId, url);
  if (!raw) return { status: "failed", reason: `raw に ${filename} が無い（取得元 ${url}）` };

  // ダウンロードの失敗は**一時的なことが多い**（#137）ので、1回で諦めて台帳に固定しない。
  // タイムスタンプはリダイレクトで更新され得るためループ内で持ち回る。
  let ts = timestamp;
  let lastReason = "";
  for (let attempt = 1; attempt <= VERIFY_TRIES; attempt++) {
    if (attempt > 1) await sleep(VERIFY_RETRY_MS);
    try {
      const res = await fetch(`https://web.archive.org/web/${ts}id_/${url}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
      });
      if (!res.ok) {
        lastReason = `コピーの取得が ${res.status}`;
        continue;
      }
      // **`id_` ガード**（#137 の穴①）: 要求したタイムスタンプに実体が無いと Wayback は
      // 最寄りのスナップショットへリダイレクトするが、その Location が `id_` を落とすことがある。
      // `id_` なし＝ビューア経由のバイト列は**書き換え済み**（リンク書換・ツールバー注入）なので、
      // raw と比較すると**必ず不一致＝「別版」と誤診**する。照合せず、リダイレクト先の
      // タイムスタンプに `id_` を付けて取り直す。
      const finalTs = res.url.match(/\/web\/(\d{14})(id_)?\//);
      if (finalTs && !finalTs[2]) {
        res.body?.cancel();
        lastReason = `Wayback が id_ なし（ビューア）URL へリダイレクト（${res.url}）— 書き換えが入るので照合しない`;
        if (finalTs[1] !== ts) {
          ts = finalTs[1]!; // 取り直しはリダイレクト先のスナップショットで
          continue;
        }
        continue;
      }
      // 本文はストリームで読む。途中で切れても**受信済みバイト数を診断に残す**
      // （arrayBuffer() は切断で全損し「何 bytes まで来ていたか」が分からない）。
      const body = await readBodyTolerant(res);
      if (!body.complete) {
        lastReason = `転送が途中で切れた（${body.buf.length.toLocaleString("en-US")}/${raw.bytes.toLocaleString("en-US")} bytes 受信・${body.error}）`;
        continue;
      }
      const buf = body.buf;
      const match = createHash("sha256").update(buf).digest("hex") === raw.sha256;
      return {
        status: "verified",
        match,
        bytes: buf.length,
        rawBytes: raw.bytes,
        kind: classifyVerify(match, buf.length, raw.bytes),
      };
    } catch (e) {
      lastReason = `コピーの取得に失敗（${e instanceof Error ? e.message : String(e)}）`;
    }
  }
  return { status: "failed", reason: `${lastReason}（${VERIFY_TRIES}回試行）` };
}

/**
 * 本文をストリームで読み、途中で切れたら**そこまでの受信分を持って**返す。
 * Wayback は健全なスナップショットでも転送がランダムに切れる（#137: 港 H31 が
 * 142KB → 1.3MB → 全量 1.4MB と試行ごとに揺れた実測）。`res.arrayBuffer()` だと
 * 切断が例外で全損し、「どこまで来ていたか」という唯一の診断材料が消える。
 */
async function readBodyTolerant(
  res: Response,
): Promise<{ buf: Buffer; complete: true } | { buf: Buffer; complete: false; error: string }> {
  const chunks: Uint8Array[] = [];
  const reader = res.body?.getReader();
  if (!reader) return { buf: Buffer.alloc(0), complete: false, error: "本文なし" };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return { buf: Buffer.concat(chunks), complete: true };
  } catch (e) {
    return { buf: Buffer.concat(chunks), complete: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// バイト数は**分かっているときだけ数字を出す**。undefined を 0 に潰すと
// 「0MiB で打ち切り」のような、それ自体が嘘の診断が出る（実際に一度出した）。
const fmtBytes = (n: number | undefined) => (n === undefined ? "不明" : `${n.toLocaleString("en-US")} bytes`);

/** 照合結果を人向けの1行にする（登録済み／登録完了の両方から呼ぶので文面を1か所に置く） */
function verifyNote(v: VerifyResult): string | null {
  if (v.status === "skipped") return null;
  if (v.status === "failed") return `⚠ sha256 を照合できなかった: ${v.reason}（台帳に sha256Verified: false を記録）`;
  const sizes = `コピー ${fmtBytes(v.bytes)}・原本 ${fmtBytes(v.rawBytes)}`;
  switch (v.kind) {
    case "match":
      return null;
    case "truncated":
      return `⚠ Wayback 側が MiB 境界（${v.bytes !== undefined ? `${v.bytes / MIB}MiB・` : ""}${sizes}）で打ち切っている。私たちの raw が正しい。SPN の保存は切られない（#214）ので --force で再保存 → 実体化（数十分〜十数時間。#214 で13時間の実測）後の再実行で解消できる見込み`;
    case "partial":
      return `⚠ コピーが原本より小さい（${sizes}）。Wayback が最後まで返していない（MiB 境界ではないので打ち切りとは断定できない）。→ **まず時間を置いて再照合**（保存直後は取り込み中で途中までしか返らず、同じスナップショットが後で完全に取れることがある）。それでも変わらなければ古い版か不完全な捕捉なので --force を試す`;
    case "other":
      return `⚠ コピーが raw と不一致（${sizes}）。別版の可能性。--force で現行版を再登録してください`;
  }
}

type SaveResult =
  | { outcome: "accepted"; http: number }
  | { outcome: "spn-down" | "rate-limited" | "rejected"; http?: number; detail: string };

/**
 * Save Page Now に登録を要求する（結果はポーリングで確認）。
 * **断られた理由を潰さない**（2026-10-31）— 以前は boolean で、520（SPN 全体の停止）も 429（回数の上限）も
 * 403（拒否）も同じ「未確認」になっていた。間隔は全ワークツリーで共有する（waitForSpnSlot）。
 */
async function requestSave(url: string): Promise<SaveResult> {
  let last: SaveResult = { outcome: "rate-limited", detail: "" };
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    if (attempt > 0) {
      console.log(`  … 429。${BACKOFF_MS[attempt - 1]! / 1000}秒待って再要求`);
      await sleep(BACKOFF_MS[attempt - 1]!);
    }
    await waitForSpnSlot(SPN_INTERVAL_MS);
    let res: Response;
    try {
      res = await fetch(`https://web.archive.org/save/${url}`, {
        headers: { "User-Agent": UA },
        redirect: "follow",
        signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
      });
    } catch (e) {
      return { outcome: "spn-down", detail: `接続できない・タイムアウト（${e instanceof Error ? e.message : String(e)}）` };
    }
    // 200 のほか、処理受付ページや 302 経由でも登録は進む。
    // ⚠ 2026-08-24 は 200 のまま本文で「You need to be logged in」を返した（メモリ spn-anonymous-disabled）
    // 先頭だけ読む — 受理されると捕捉のページへリダイレクトされ、PDF なら数十MBが返る
    const body = await readHead(res, 64 * 1024);
    if (res.ok) {
      if (/You need to be logged in/i.test(body)) {
        return { outcome: "spn-down", http: res.status, detail: "匿名の要求にログインを求められた" };
      }
      return { outcome: "accepted", http: res.status };
    }
    const jobFailed = /Job failed/i.test(body) ? "・本文「Job failed」" : "";
    if (res.status === 429) {
      last = { outcome: "rate-limited", http: 429, detail: "429（回数の上限）" };
      continue;
    }
    if (res.status >= 500) return { outcome: "spn-down", http: res.status, detail: `HTTP ${res.status}${jobFailed}` };
    return { outcome: "rejected", http: res.status, detail: `HTTP ${res.status}${jobFailed}` };
  }
  return { ...last, detail: `${last.detail}が待ち直しても続いた（${BACKOFF_MS.length + 1}回）` };
}

/** 本文の先頭 limit バイトだけを文字列で返し、残りは捨てる */
async function readHead(res: Response, limit: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let n = 0;
  try {
    while (n < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        n += value.length;
      }
    }
  } catch {
    /* 途中で切れても読めた分で判定する */
  } finally {
    reader.cancel().catch(() => {});
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** SPN を止めたときに状態を添える（待ち行列が詰まっているのか、匿名だけ落ちているのかの手掛かり） */
async function spnSystemStatus(): Promise<string> {
  try {
    const res = await fetch("https://web.archive.org/save/status/system", {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(15_000),
    });
    return `${res.status} ${(await res.text()).slice(0, 400)}`;
  } catch (e) {
    return `取得できない（${e instanceof Error ? e.message : String(e)}）`;
  }
}

function loadLedger(): ArchiveEntry[] {
  if (!existsSync(ARCHIVES_PATH)) return [];
  return archivesLedgerSchema.parse(readJson(ARCHIVES_PATH)).entries;
}

function saveLedger(entries: ArchiveEntry[]): void {
  entries.sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.url.localeCompare(b.url));
  // **一時ファイルに書いてから入れ替える**（2026-10-31）。4MB を直接上書きすると、書いている最中に
  // kill されたり別プロセスが読んだりしたとき、途中までの JSON が見える。rename は原子的。
  const tmp = `${ARCHIVES_PATH}.${process.pid}.tmp`;
  const doc = {
    note: "一次資料の Wayback Machine スナップショット台帳。再生成/追記: bun run pipeline:archive",
    entries,
  };
  writeFileSync(tmp, JSON.stringify(doc, null, 2) + "\n", "utf8");
  renameSync(tmp, ARCHIVES_PATH);
}

const cliArgs = process.argv.slice(2);
const arg = cliArgs.find((a) => !a.startsWith("--"));
const force = cliArgs.includes("--force");

// 待つだけ（derive の前などに）。`pgrep` の待ちループは自分のコマンドラインに当たる（メモリ wait-loop-matches-itself）
if (cliArgs.includes("--wait-only")) {
  await waitForArchiveLock();
  process.exit(0);
}

const targets = SOURCES.filter((s) => !s.fixture && (!arg || s.id === arg));
if (targets.length === 0) {
  console.error(`ソースが見つかりません: ${arg}`);
  process.exit(1);
}

await acquireArchiveLock(cliArgs, cliArgs.includes("--wait"));

const ledger = loadLedger();
// 逐次保存: 対象が多いと実行に時間がかかるため、1件ごとに台帳へ書く（中断しても進捗が残る）。
//
// ⚠ **書き込みのたびにディスクから読み直して併合する**（2026-07-16）。以前は起動時の
// `loadLedger()` のスナップショットをメモリで持ち回り、丸ごと上書きしていたため、
// **2つの archive を並行実行すると後勝ちで相手の登録が全部消えた**（実害: 特別区の平成年度を
// 収録中、大田4件の登録が江東・中央側のプロセスに消された）。しかも**各プロセスは「新規登録 2」と
// 成功を報告する**ので、台帳を見に行くまで気づけない＝§2-4 の「静かに壊れる」型。
// これは真のロックではない（read→write の間に別プロセスが書けば取りこぼす）が、
// **ファイル丸ごとの消失は防ぐ**。Wayback 待ちが数分あるので実用上はこれで足りる。
const upsert = (e: ArchiveEntry) => {
  const merged = loadLedger();
  for (const local of ledger) {
    const j = merged.findIndex((x) => x.sourceId === local.sourceId && x.url === local.url);
    if (j >= 0) merged[j] = local;
    else merged.push(local);
  }
  const i = merged.findIndex((x) => x.sourceId === e.sourceId && x.url === e.url);
  if (i >= 0) merged[i] = e;
  else merged.push(e);
  const k = ledger.findIndex((x) => x.sourceId === e.sourceId && x.url === e.url);
  if (k >= 0) ledger[k] = e;
  else ledger.push(e);
  saveLedger(merged);
};

let saved = 0;
let already = 0;
let failed = 0;
let skipped = 0;
let staleHtml = 0;
// 結末の内訳（試行の記録と同じ語彙）。「未確認」を1つの数にまとめない
const outcomes = new Map<AttemptOutcome, number>();
// SPN をやめた理由（やめていなければ null）。やめた後の URL は要求せず `skipped` にする
let spnStopped: string | null = null;
let spnFailStreak = 0;
let cdxFailStreak = 0;
let cdxStopped: string | null = null;
// この実行で未確認に終わった URL（最後に過去の試行と合わせ、「続けて未確認」を判定する）
const unconfirmed: { sourceId: string; url: string }[] = [];

/** ISO 8601 → Wayback の14桁（UTC）。日付だけのときは 0 時で埋める */
const toWaybackTs = (iso: string) => iso.replace(/[-:T]/g, "").slice(0, 14).padEnd(14, "0");
const waybackTsAgo = (ms: number) => toWaybackTs(new Date(Date.now() - ms).toISOString());

/**
 * HTML（landing・`kind: "page"` の file）が「使った版」以降であるための下限（2026-10-31）。
 * HTML は照合できないので、捕捉の日付で寄せるしかない。以前は CDX の最新の捕捉をそのまま記録して
 * いたため、**使った版より古い捕捉**を指すことがあり（議会の巡で毎回 --force で取り直した・#418〜#423）、
 * 逆に**再実行のたびに最新の捕捉へ動いて**いた。基準はその URL の raw の取得時刻、無ければ
 * その資料の最初の取得時刻（landing は raw に入れないことが多い）。
 */
const versionFloor = (sourceId: string, url: string): string | null => {
  const files = readRawMeta(sourceId)?.files ?? [];
  const own = files.find((f) => f.fetchedFrom === url);
  const at = own?.fetchedAt ?? files.map((f) => f.fetchedAt).sort()[0];
  return at ? toWaybackTs(at) : null;
};

outer: for (const source of targets) {
  const urls: { url: string; kind: "file" | "landing" }[] = [
    ...(source.urls ?? (source.url ? [source.url] : [])).map((u) => ({ url: u, kind: "file" as const })),
    ...(source.landingPage ? [{ url: source.landingPage, kind: "landing" as const }] : []),
  ];
  for (const { url, kind } of urls) {
    // WARP（国立国会図書館）／Wayback 由来の URL はそれ自体が恒久アーカイブなので登録しない
    if (url.includes("warp.ndl.go.jp") || url.includes("web.archive.org")) continue;
    const t0 = Date.now();
    const log = (outcome: AttemptOutcome, extra: { http?: number; detail?: string } = {}) => {
      outcomes.set(outcome, (outcomes.get(outcome) ?? 0) + 1);
      recordAttempt({ sourceId: source.id, url, kind, outcome, ms: Date.now() - t0, ...extra });
    };
    try {
    // 同じスナップショットを検証済みなら再ダウンロードしない
    const prior = ledger.find((x) => x.sourceId === source.id && x.url === url);
    const verify = async (timestamp: string, waybackUrl: string): Promise<VerifyResult> => {
      if (kind !== "file") return { status: "skipped" };
      // 同じスナップショットを照合済みなら台帳の記録を再利用する（再ダウンロードしない）。
      // ただし **不一致でバイト数が無いエントリは再照合する** — 診断（打ち切り／不完全／別版）が
      // バイト数に依存するため。一致しているエントリはバイト数が無くても再利用でよい
      // （一致の報告に要らない）。ここを分けないと、waybackBytes を足した初回の全実行で
      // **数百件の PDF を Wayback から再ダウンロード**することになる。
      const cacheable =
        prior?.waybackUrl === waybackUrl &&
        prior.sha256Match !== undefined &&
        (prior.sha256Match === true || prior.waybackBytes !== undefined);
      if (prior && cacheable) {
        const cachedKind = prior.sha256Match
          ? ("match" as const)
          : prior.waybackTruncated
            ? ("truncated" as const)
            : prior.waybackPartial
              ? ("partial" as const)
              : ("other" as const);
        return {
          status: "verified",
          match: prior.sha256Match!,
          bytes: prior.waybackBytes,
          rawBytes: rawBytesOf(source.id, url),
          kind: cachedKind,
        };
      }
      return await verifySnapshot(source.id, url, timestamp);
    };
    // 台帳へ書く判定。**「対象外（フィールド無し）」「照合できなかった（sha256Verified: false）」
    // 「照合した（sha256Match）」の3状態を潰さない**のがこの関数の仕事。
    const verdict = (v: VerifyResult) =>
      v.status === "skipped"
        ? {}
        : v.status === "failed"
          ? // 理由も台帳に残す（#137）— 理由なしの false は「発行元が差し替えた」と
            // 誤診される（実際に一度誤診しかけた）。一時的な転送切れと構造的な問題を
            // 台帳だけで区別できるようにする。
            { sha256Verified: false, sha256FailReason: v.reason }
          : {
              sha256Match: v.match,
              ...(v.bytes !== undefined ? { waybackBytes: v.bytes } : {}),
              ...(v.kind === "truncated" ? { waybackTruncated: true } : {}),
              ...(v.kind === "partial" ? { waybackPartial: true } : {}),
              // 照合が走ったら「そのときの raw」も錨として残す（types.ts の rawSha256 参照）
              ...(rawSha !== undefined ? { rawSha256: rawSha } : {}),
            };

    const rawSha = kind === "file" ? rawFileOf(source.id, url)?.sha256 : undefined;
    // HTML は照合しない（verifySnapshot の判定と同じ）。捕捉の日付で版を寄せる
    const htmlLike = kind !== "file" || !isVerifiable(source.id, url);
    const snaps = await snapshots200(url);
    cdxFailStreak = 0;
    const existing = snaps[0];
    if (existing && !force && htmlLike) {
      const floor = versionFloor(source.id, url);
      // snaps は新しい順。下限以降のうち**いちばん古い**＝使った版にいちばん近い捕捉を採る
      const fresh = floor ? snaps.filter((s) => s.timestamp >= floor) : snaps;
      const keep = prior ? fresh.find((s) => s.timestamp === prior.waybackTimestamp) : undefined;
      const pick = keep ?? (floor ? fresh[fresh.length - 1] : existing);
      if (pick) {
        upsert({
          sourceId: source.id, url, kind,
          waybackUrl: pick.waybackUrl, waybackTimestamp: pick.timestamp,
          checkedAt: new Date().toISOString(),
        });
        console.log(`✓ 登録済み ${source.id} ${kind}: ${pick.waybackUrl}${keep ? "（維持）" : ""}`);
        log("reused");
        already++;
        continue;
      }
      // 下限より古い捕捉しか無い。**既にある行はそのまま残す**（引数なしの全体実行で、古い行の
      // 数千件に一斉に SPN を投げないため。取り直すのは対象を指定した --force）。新しい行は SPN へ
      if (prior && snaps.some((s) => s.timestamp === prior.waybackTimestamp)) {
        upsert({ ...prior, checkedAt: new Date().toISOString() });
        console.log(`✓ 登録済み ${source.id} ${kind}: ${prior.waybackUrl}（⚠ 使った版 ${floor} より古い捕捉・--force で取り直す）`);
        log("reused", { detail: `使った版 ${floor} より古い捕捉のまま` });
        staleHtml++;
        already++;
        continue;
      }
      console.log(`  （CDX の最新の捕捉 ${existing.timestamp} は使った版 ${floor} より古いので SPN へ）`);
    } else if (existing && !force) {
      // **照合済みの捕捉は維持する**（再ダウンロードしない）。台帳の仕事は「raw と一致する写しの
      // 所在」を指すことで、新しい捕捉が現れても一致済みの記録は無効にならない。ただし
      // **raw が再取得で変わったら維持しない**（rawSha256 の錨・上書き型 URL の版違い検出を
      // 殺さないため）。捕捉が CDX から消えた場合も維持しない（指す先の存在確認を兼ねる）。
      if (
        kind === "file" &&
        prior?.sha256Match === true &&
        prior.rawSha256 !== undefined &&
        prior.rawSha256 === rawSha &&
        snaps.some((s) => s.timestamp === prior.waybackTimestamp)
      ) {
        upsert({ ...prior, checkedAt: new Date().toISOString() });
        console.log(`✓ 登録済み ${source.id} ${kind}: ${prior.waybackUrl}（照合済み・維持）`);
        log("reused");
        already++;
        continue;
      }
      // 最新の捕捉から照合し、不一致なら**過去の捕捉**を新しい順に試す（snapshots200 の
      // コメント参照 — 打ち切られた最新捕捉より古い完全捕捉が実在し、SPN の再保存は revisit に
      // 落ちて解消しない）。一致した捕捉を台帳に採る。walk は照合が実際に走って不一致だった
      // ときだけ（skipped / failed では回さない — 転送失敗で古い捕捉を無駄に舐めない）。
      let pick = existing;
      let match = await verify(existing.timestamp, existing.waybackUrl);
      if (match.status === "verified" && !match.match) {
        for (const s of snaps.slice(1, WALK_LIMIT)) {
          const alt = await verify(s.timestamp, s.waybackUrl);
          if (alt.status === "verified" && alt.match) {
            pick = s;
            match = alt;
            break;
          }
        }
      }
      upsert({
        sourceId: source.id, url, kind,
        waybackUrl: pick.waybackUrl, waybackTimestamp: pick.timestamp,
        checkedAt: new Date().toISOString(),
        ...verdict(match),
      });
      console.log(`✓ 登録済み ${source.id} ${kind}: ${pick.waybackUrl}`);
      if (pick !== existing)
        console.log(`  （最新の捕捉 ${existing.timestamp} は raw と不一致のため、一致する過去の捕捉を記録）`);
      const note = verifyNote(match);
      if (note) console.log(`  ${note}`);
      log("reused");
      already++;
      continue;
    }
    if (spnStopped) {
      console.log(`- 省略 ${source.id} ${kind}（この実行では SPN をやめた）`);
      log("skipped", { detail: spnStopped });
      skipped++;
      continue;
    }
    console.log(`↑ SPN 登録要求 ${source.id} ${kind}: ${url}`);
    // 要求より後の捕捉だけを「今回の登録」と認める。⚠ 以前は CDX の最新を拾っていたので、
    // --force で古い捕捉がある URL は、実体化の前に**古い捕捉を「登録完了」として記録**していた。
    // 1時間の幅は、SPN が直近の捕捉を新しく取らずに返す場合のため。
    const requestedFloor = waybackTsAgo(60 * 60 * 1000);
    const save = await requestSave(url);
    if (save.outcome !== "accepted") {
      console.log(`✗ 未確認 ${source.id} ${kind}: ${save.detail}（次回実行で再試行）`);
      log(save.outcome, { http: save.http, detail: save.detail });
      failed++;
      if (save.outcome === "rejected") {
        unconfirmed.push({ sourceId: source.id, url });
        continue;
      }
      // SPN 全体が落ちている型（520・接続できない・429 が続く）。続いたら、この実行では要求をやめる
      if (++spnFailStreak >= SPN_STOP_AFTER) {
        spnStopped = `${SPN_STOP_AFTER}回続けて失敗（最後: ${save.detail}）`;
        console.log(`\n⚠⚠ SPN が${spnStopped}。この実行では残りの URL に要求しない（CDX の既存の捕捉の照合は続ける）`);
        console.log(`  /save/status/system: ${await spnSystemStatus()}`);
        console.log(`  切り分けは handoff §4 の4本（save / availability / cdx / replay）。戻ったかは台帳の捕捉日で確かめる\n`);
      }
      continue;
    }
    spnFailStreak = 0;
    let snap: Snapshot | null = null;
    for (let t = 0; !snap && t <= POLL_TRIES; t++) {
      await sleep(POLL_INTERVAL_MS);
      try {
        snap = (await snapshots200(url, false)).find((s) => s.timestamp >= requestedFloor) ?? null;
      } catch {
        // 待っている間の CDX の失敗は、次の回で取り直す
      }
    }
    if (snap) {
      const match = await verify(snap.timestamp, snap.waybackUrl);
      upsert({
        sourceId: source.id, url, kind,
        waybackUrl: snap.waybackUrl, waybackTimestamp: snap.timestamp,
        checkedAt: new Date().toISOString(),
        ...verdict(match),
      });
      console.log(`✓ 登録完了 ${source.id} ${kind}: ${snap.waybackUrl}`);
      // 登録直後の不一致は SPN 反映待ちで古い版を拾っただけのこともあるので、その線を添える
      const note = verifyNote(match);
      if (note) console.log(`  ${note}`);
      if (match.status === "verified" && !match.match && match.kind !== "truncated") {
        console.log(`  （登録直後なので SPN 反映待ちで古い版を拾った可能性もある。時間を置いて再実行）`);
      }
      log("saved", { http: save.http });
      saved++;
    } else {
      // 受け付けられたが、待つ間に CDX に現れなかった（実体化の遅れ。数十分〜13時間の実例・§9b）
      console.log(`✗ 未確認 ${source.id} ${kind}（SPN は受け付けた・CDX に未反映。次回実行で拾う）`);
      log("pending", { http: save.http });
      unconfirmed.push({ sourceId: source.id, url });
      failed++;
    }
    } catch (e) {
      // ⚠⚠ **1本の失敗で全体を落とさない**（2026-08-06・#164 で実害）。
      //   329本のソース（横浜の事業計画書）で**最初の1本がタイムアウトしただけで
      //   プロセスが終了し、台帳に1件も登録されなかった**。ファイル数の多いソースでは
      //   ネットワークの一時失敗が必ず起きるので、**その1本だけ諦めて次へ進む**。
      //   台帳は毎回併合保存されるので、次回実行で未登録のものだけ再試行される。
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`✗ 失敗 ${source.id} ${kind}: ${msg}（次回実行で再試行）`);
      failed++;
      if (e instanceof CdxError) {
        log("cdx-error", { http: e.http, detail: msg });
        // CDX が引けないと捕捉の有無が分からず、SPN に落とすこともできない。続いたら止める
        if (++cdxFailStreak >= CDX_STOP_AFTER) {
          cdxStopped = `${CDX_STOP_AFTER}回続けて引けない（最後: ${msg}）`;
          console.log(`\n⚠⚠ CDX が${cdxStopped}。実行を止める`);
          break outer;
        }
      } else {
        log("error", { detail: msg });
      }
    }
  }
}

// 最後の一括保存も併合で行う（上の upsert と同じ理由 — 丸ごと上書きすると並行実行で相手を消す）
const final = loadLedger();
for (const local of ledger) {
  const j = final.findIndex((x) => x.sourceId === local.sourceId && x.url === local.url);
  if (j >= 0) final[j] = local;
  else final.push(local);
}
saveLedger(final);
console.log(`\n台帳: ${ARCHIVES_PATH}`);
console.log(
  `新規登録 ${saved} / 登録済み ${already} / 未確認 ${failed}${skipped ? ` / 省略 ${skipped}` : ""}（計 ${final.length} 件）`,
);
const breakdown = [...outcomes].map(([k, v]) => `${k} ${v}`).join("・");
if (breakdown) console.log(`  結末の内訳: ${breakdown}（記録: bun run pipeline:archive-attempts）`);
if (spnStopped) console.log(`⚠ SPN をやめた: ${spnStopped}。省略した ${skipped} 件は、SPN が戻ってから流し直す`);
if (cdxStopped) console.log(`⚠ CDX が止まったので途中で終えた: ${cdxStopped}`);
if (staleHtml) console.log(`⚠ 使った版より古い捕捉のままの HTML: ${staleHtml} 件（取り直すなら対象を指定して --force）`);

// **続けて未確認の URL**（2026-10-31）。SPN は受け付けるのに捕捉が現れない・4xx で断られる、が
// 実行をまたいで続くなら、遅れではなく**発行元がクローラを弾いている**疑い（東村山型・
// メモリ publisher-may-block-wayback）。SPN 全体の停止（spn-down 等）は数えない — 発行元のせいではない。
{
  const history = readAttempts();
  const counted = new Set<AttemptOutcome>(["reused", "saved", "pending", "rejected"]);
  const suspects = unconfirmed.filter(({ url }) => {
    const last = history.filter((a) => a.url === url && counted.has(a.outcome)).slice(-SUSPECT_AFTER);
    return last.length === SUSPECT_AFTER && last.every((a) => a.outcome === "pending" || a.outcome === "rejected");
  });
  if (suspects.length) {
    console.log(`\n⚠ ${SUSPECT_AFTER}回続けて未確認（遅れではなく発行元の拒否の疑い）: ${suspects.length} 件`);
    for (const s of suspects.slice(0, 10)) console.log(`    ${s.sourceId} — ${s.url}`);
    console.log(`  → UA を3通り当てて切り分ける（素の curl・archive.org_bot・ブラウザ。メモリ publisher-may-block-wayback）`);
  }
}

// **台帳全体の健康診断**（2026-07-16）。件数の報告だけでは「魚拓はあるが中身を照合していない」
// エントリが見えない — 実際に**岡山 R2・R3・R4 が `waybackUrl` を持ちながら `sha256Match` が
// 一度も付いていなかった**（登録時に照合が走らず、以後「登録済み」として素通りしていた）。
// **魚拓は消えた資料の最後の砦**なので、「あるつもりで中身が違う」を放置しない。
// ここは対象を絞った実行でも**台帳全体**を見る（1件ずつ流しても全体の穴に気づけるように）。
{
  // ⚠ 対象は `verifySnapshot` が実際に照合する種別だけ（VERIFIABLE_RE を共有している理由は
  // 定数側のコメントを参照）。
  const files = final.filter((e) => e.kind === "file" && isVerifiable(e.sourceId, e.url));
  // 未照合＝「照合できなかった（sha256Verified: false）」＋「一度も照合が走っていない
  // （フィールドごと無い）」。**どちらも「魚拓の中身を誰も見ていない」ことに変わりはない**ので
  // 同じ穴として出す（区別は台帳のフィールドが持つ）。
  const unverified = files.filter((e) => e.waybackUrl && e.sha256Match == null);
  const partial = files.filter((e) => e.waybackPartial);
  const mismatched = files.filter((e) => e.sha256Match === false && !e.waybackTruncated && !e.waybackPartial);
  if (unverified.length) {
    console.log(`\n⚠ 魚拓はあるが sha256 を照合していない原本: ${unverified.length} 件`);
    for (const e of unverified.slice(0, 10)) {
      const why =
        e.sha256Verified === false
          ? `照合を試みて失敗${e.sha256FailReason ? `: ${e.sha256FailReason}` : ""}`
          : "照合が走っていない";
      console.log(`    ${e.sourceId} — ${e.url.split("/").pop()}（${why}）`);
    }
    if (unverified.length > 10) console.log(`    …他 ${unverified.length - 10} 件`);
    console.log(`  → 対象を指定して再実行すると照合されます（例: bun run pipeline:archive ${unverified[0]!.sourceId}）`);
  }
  if (partial.length) {
    console.log(`\n⚠ 魚拓が原本より小さい（打ち切りとは断定できない・§9b）: ${partial.length} 件`);
    for (const e of partial.slice(0, 10)) {
      console.log(`    ${e.sourceId} — ${e.url.split("/").pop()}（コピー ${fmtBytes(e.waybackBytes)}）`);
    }
    console.log(`  → まず時間を置いて再照合してください（保存直後は取り込み中で途中までしか返らず、`);
    console.log(`     同じスナップショットが後で完全に取れることがある — 江戸川 R8 の実例）`);
  }
  if (mismatched.length) {
    console.log(`\n⚠ 魚拓が raw と不一致（小さくもない＝別版の疑い・§9b）: ${mismatched.length} 件`);
    for (const e of mismatched.slice(0, 10)) console.log(`    ${e.sourceId} — ${e.url.split("/").pop()}`);
  }
}
if (failed > 0) process.exitCode = 1;

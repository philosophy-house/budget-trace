// [1c]→ `pipeline:archive` の実行状態（ロック・SPN の間隔・試行の記録）。
//
// 2026-10-31（docs/proposals/wayback-bottleneck.md の第1段）。どれも「静かに壊れる」を
// 防ぐためのもので、守る範囲が違う:
//
// - **ロック**（`data/.archive.lock`・ワークツリーごと）… 同じ台帳を2本の archive が書かない。
//   derive は、これが生きていたら止まる（途中の台帳が coverage に焼かれ CI だけ落ちる型・
//   メモリ no-derive-during-archive）。待つ側は `pgrep` ではなくこのファイルを見る
//   （`pgrep` の待ちループは自分のコマンドラインに当たる・メモリ wait-loop-matches-itself）。
// - **SPN の間隔**（リポジトリ共通）… SPN の匿名の枠は **IP ごと**なので、同じ Mac のワークツリーを
//   いくつ並べても1つの枠を分け合っている（2026-10-31 17:47 に2セッションが同時に回し、
//   1分に4件を投げた）。要求の時刻をワークツリーをまたいで予約し、間隔を空ける。
// - **試行の記録**（リポジトリ共通・JSONL）… 「未確認」を型つきで残す。以前は画面に出すだけで、
//   未確認率も「3回続けて未確認」も人が巡の記録から数えていた。
//
// リポジトリ共通の置き場所は **git の共通ディレクトリ**（`git rev-parse --git-common-dir`。
// 本体の `.git`）。全ワークツリーから同じ場所に見え、ワークツリーを消しても残り、追跡されない。
// git が無い環境（CI のアーカイブ等）では `data/.archive-state/` に落ちる。
import { execFileSync } from "node:child_process";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, isAbsolute, join } from "node:path";
import { DATA_DIR } from "./store";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- ロック（ワークツリーごと） ---------------------------------------------

export const ARCHIVE_LOCK_PATH = join(DATA_DIR, ".archive.lock");

export type ArchiveLock = { pid: number; startedAt: string; argv: string[] };

/** PID が生きているか。EPERM は「別ユーザーのプロセスが居る」＝生きている */
export function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** ロックの中身。無い・壊れている・持ち主が死んでいる場合は null（死んだロックは消す） */
export function liveArchiveLock(): ArchiveLock | null {
  if (!existsSync(ARCHIVE_LOCK_PATH)) return null;
  let lock: ArchiveLock;
  try {
    lock = JSON.parse(readFileSync(ARCHIVE_LOCK_PATH, "utf8")) as ArchiveLock;
  } catch {
    rmSync(ARCHIVE_LOCK_PATH, { force: true });
    return null;
  }
  if (typeof lock.pid === "number" && isPidAlive(lock.pid)) return lock;
  // 持ち主が死んでいる（kill された等）。台帳は1件ごとに入れ替えで書くので、途中で
  // 死んでも壊れた状態では残らない（archive.ts の saveLedger）。ロックだけ片付ける。
  console.warn(`⚠ 持ち主の居ない archive のロックを片付けた（pid ${lock.pid}・${lock.startedAt} 開始）`);
  rmSync(ARCHIVE_LOCK_PATH, { force: true });
  return null;
}

const describeLock = (l: ArchiveLock) => `pid ${l.pid}・${l.startedAt} 開始・${l.argv.join(" ") || "（引数なし）"}`;

/**
 * ロックを取る。取れなければ、`wait` なら空くまで待ち、そうでなければ終了する。
 * 終了時（正常・例外・SIGINT/SIGTERM）に自分のロックを消す。
 */
export async function acquireArchiveLock(argv: string[], wait: boolean): Promise<void> {
  for (let announced = false; ; ) {
    const held = liveArchiveLock();
    if (!held) break;
    if (!wait) {
      console.error(
        `このワークツリーで別の pipeline:archive が動いている（${describeLock(held)}）。\n` +
          `台帳を2本で書かないため止めた。終わってから流すなら --wait を付ける。`,
      );
      process.exit(1);
    }
    if (!announced) console.log(`… 別の archive の終了を待つ（${describeLock(held)}）`);
    announced = true;
    await sleep(10_000);
  }
  const mine: ArchiveLock = { pid: process.pid, startedAt: new Date().toISOString(), argv };
  // wx: 待っている間に別のプロセスが先に取った場合は失敗させる（取り合いで2本にならない）
  try {
    writeFileSync(ARCHIVE_LOCK_PATH, JSON.stringify(mine) + "\n", { flag: "wx" });
  } catch {
    return acquireArchiveLock(argv, wait);
  }
  const release = () => {
    try {
      const cur = JSON.parse(readFileSync(ARCHIVE_LOCK_PATH, "utf8")) as ArchiveLock;
      if (cur.pid === process.pid) rmSync(ARCHIVE_LOCK_PATH, { force: true });
    } catch {
      /* 既に無い */
    }
  };
  process.on("exit", release);
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(sig, () => process.exit(sig === "SIGINT" ? 130 : 143));
  }
}

/** ロックが空くまで待つ（`--wait-only`）。待つ側が `pgrep` を書かなくて済むように */
export async function waitForArchiveLock(): Promise<void> {
  const held = liveArchiveLock();
  if (!held) return;
  console.log(`… archive の終了を待つ（${describeLock(held)}）`);
  while (liveArchiveLock()) await sleep(10_000);
}

/**
 * derive の入口で呼ぶ。archive が動いている間は止める。
 * ⚠ 途中の台帳で derive すると、その瞬間の件数が gen に焼かれ、**手元は通るのに CI だけ落ちる**
 * （2026-08-23 に踏んだ・メモリ no-derive-during-archive）。
 */
export function assertNoArchiveRunning(what: string): void {
  const held = liveArchiveLock();
  if (!held) return;
  throw new Error(
    `pipeline:archive が動いている（${describeLock(held)}）ので ${what} を止めた。\n` +
      `台帳が書きかけのまま gen に焼かれる。終わるのを待ってから流す:\n` +
      `  bun run pipeline:archive --wait-only && bun run pipeline:derive`,
  );
}

// ---- リポジトリ共通の置き場所 -------------------------------------------------

let sharedDirCache: string | null = null;
/** 全ワークツリーで共有する状態の置き場所（git の共通ディレクトリの下） */
export function sharedStateDir(): string {
  if (sharedDirCache) return sharedDirCache;
  let dir: string;
  try {
    const out = execFileSync("git", ["rev-parse", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    dir = join(isAbsolute(out) ? out : join(process.cwd(), out), "budget-trace");
  } catch {
    dir = join(DATA_DIR, ".archive-state");
  }
  mkdirSync(dir, { recursive: true });
  return (sharedDirCache = dir);
}

// ---- SPN の間隔（リポジトリ共通） --------------------------------------------

/**
 * 次に SPN へ要求してよい時刻を、全ワークツリーで共有する予約表から取り、その時刻まで待つ。
 * 予約表の読み書きは `mkdir` の排他（原子的）で囲む。排他が10秒より古ければ、持ち主が
 * 死んだとみなして消す（予約表の読み書きは一瞬で終わる）。
 */
export async function waitForSpnSlot(intervalMs: number): Promise<void> {
  const dir = sharedStateDir();
  const mutex = join(dir, "spn-pace.lock");
  const table = join(dir, "spn-pace.json");
  for (;;) {
    try {
      mkdirSync(mutex);
      break;
    } catch {
      try {
        if (Date.now() - statSync(mutex).mtimeMs > 10_000) rmSync(mutex, { recursive: true, force: true });
      } catch {
        /* 消えた */
      }
      await sleep(200);
    }
  }
  let slot: number;
  try {
    let nextAt = 0;
    try {
      nextAt = (JSON.parse(readFileSync(table, "utf8")) as { nextAt: number }).nextAt ?? 0;
    } catch {
      /* 初回 */
    }
    slot = Math.max(Date.now(), nextAt);
    writeFileSync(table, JSON.stringify({ nextAt: slot + intervalMs, by: process.pid }) + "\n");
  } finally {
    rmSync(mutex, { recursive: true, force: true });
  }
  const wait = slot - Date.now();
  if (wait > 0) await sleep(wait);
}

// ---- 認証つき SPN2 のキー -------------------------------------------------------

/**
 * archive.org の S3 形式のキー（`IA_S3_ACCESS_KEY` / `IA_S3_SECRET_KEY`）。無ければ null（匿名の SPN で動く）。
 * bun はカレントの `.env` を読むので、まず環境変数を見る。ワークツリーには `.env` が無いことが多いので、
 * 次に**本体のチェックアウトの `.env`**（git の共通ディレクトリの親）を読む。
 * ⚠ **値はどこにも出さない**（ログ・試行の記録・例外のメッセージのどれにも）。
 */
export function loadIaKeys(): { access: string; secret: string } | null {
  const fromEnv = (env: Record<string, string | undefined>) =>
    env.IA_S3_ACCESS_KEY && env.IA_S3_SECRET_KEY ? { access: env.IA_S3_ACCESS_KEY, secret: env.IA_S3_SECRET_KEY } : null;
  const direct = fromEnv(process.env);
  if (direct) return direct;
  let mainEnv: string;
  try {
    const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    mainEnv = join(common, "..", ".env");
  } catch {
    return null;
  }
  if (!existsSync(mainEnv)) return null;
  const parsed: Record<string, string> = {};
  for (const line of readFileSync(mainEnv, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m) parsed[m[1]!] = m[2]!.replace(/^(['"])(.*)\1$/, "$2");
  }
  return fromEnv(parsed);
}

// ---- SPN2 のジョブの控え（ワークツリーごと） -------------------------------------

/**
 * 認証つき SPN2 は登録要求に `job_id` を返す。**要求と結果の確認を分ける**ため、受け付けられたジョブを
 * ここに控え、同じ実行の後半か次の実行でまとめて確かめる（docs/proposals/wayback-bottleneck.md の第2段）。
 * 台帳と同じくワークツリーの持ち物（結果を書くのはこのワークツリーの台帳）なので `data/` に置く（追跡しない）。
 */
export const ARCHIVE_JOBS_PATH = join(DATA_DIR, ".archive-jobs.json");

export type QueuedJob = {
  sourceId: string;
  url: string;
  kind: "file" | "landing";
  jobId: string;
  /** 要求した時刻（ISO 8601） */
  requestedAt: string;
  /** SPN2 が成功を返した捕捉の時刻（Wayback の14桁）。CDX に載るのを待っている間だけ入る */
  capturedTs?: string;
};

export function readJobs(): QueuedJob[] {
  if (!existsSync(ARCHIVE_JOBS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(ARCHIVE_JOBS_PATH, "utf8")) as QueuedJob[];
  } catch {
    return [];
  }
}

export function writeJobs(jobs: QueuedJob[]): void {
  if (jobs.length === 0) {
    rmSync(ARCHIVE_JOBS_PATH, { force: true });
    return;
  }
  const tmp = `${ARCHIVE_JOBS_PATH}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(jobs, null, 2) + "\n");
  renameSync(tmp, ARCHIVE_JOBS_PATH);
}

// ---- 試行の記録（リポジトリ共通・JSONL） --------------------------------------

/**
 * 1 URL の結末。**「未確認」を1つにまとめない**（遅延・停止・拒否・回数の上限は対処が違う。
 * data-sources §9b・メモリ publisher-may-block-wayback）。
 *   - `reused`      … CDX の既存の捕捉を使った（SPN は呼んでいない）
 *   - `saved`       … SPN が受け付け、CDX に現れた
 *   - `pending`     … SPN は受け付けたが、待つ間に CDX に現れなかった（実体化の遅れ。次回拾える）
 *   - `spn-down`    … 520 などの 5xx・接続できない・タイムアウト・ログインを求められた
 *   - `rate-limited`… 429 が待ち直しても続いた
 *   - `rejected`    … 429 以外の 4xx
 *   - `skipped`     … SPN を止めた後なので要求しなかった
 *   - `cdx-error`   … CDX が引けなかった（捕捉の有無が分からないので SPN に落とさない）
 *   - `error`       … それ以外の例外
 */
export type AttemptOutcome =
  | "reused"
  | "saved"
  | "pending"
  | "spn-down"
  | "rate-limited"
  | "rejected"
  | "skipped"
  | "cdx-error"
  | "error";

export type Attempt = {
  at: string;
  worktree: string;
  pid: number;
  sourceId: string;
  url: string;
  kind: "file" | "landing";
  outcome: AttemptOutcome;
  http?: number;
  detail?: string;
  ms: number;
};

export const attemptsPath = () => join(sharedStateDir(), "archive-attempts.jsonl");

export function recordAttempt(a: Omit<Attempt, "at" | "worktree" | "pid">): void {
  const line: Attempt = { at: new Date().toISOString(), worktree: basename(process.cwd()), pid: process.pid, ...a };
  try {
    appendFileSync(attemptsPath(), JSON.stringify(line) + "\n");
  } catch (e) {
    // 記録できなくても登録は止めない（記録は診断用）
    console.warn(`⚠ 試行の記録に失敗: ${e instanceof Error ? e.message : String(e)}`);
  }
}

export function readAttempts(): Attempt[] {
  const p = attemptsPath();
  if (!existsSync(p)) return [];
  const out: Attempt[] = [];
  for (const line of readFileSync(p, "utf8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line) as Attempt);
    } catch {
      /* 書きかけの行 */
    }
  }
  return out;
}

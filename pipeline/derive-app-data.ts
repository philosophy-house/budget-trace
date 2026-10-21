// [3]→アプリ normalized データセットからアプリ用の静的モジュールを導出する。
// 現状の対象: 類似自治体比較（src/client/lib/similar.gen.ts）。
// 巨大な normalized JSON をクライアントに import せず、必要な断面だけを
// 決定的（タイムスタンプなし）に生成してコミットする。
// 使い方: bun run pipeline:derive
import {
  anyParsedDocSchema,
  archivesLedgerSchema,
  normalizedDatasetSchema,
  validationResultSchema,
  type NormalizedMuniAccount,
} from "./types";
import type { CouncilCompositionDoc, SourceEntry } from "./types";
import {
  DATA_DIR,
  normalizedPath,
  parsedPath,
  readJson,
  readRawMeta,
  validationPath,
} from "./lib/store";
import { eraYear, fyRank, fySeq } from "./lib/fy";
import { findSource, SOURCES } from "./registry/sources";
import { NO_GRANT_LICENSES } from "./registry/license-no-grant";
import { ROADMAP } from "./registry/roadmap";
import { UNRECORDABLE, UNRECORDABLE_CATEGORIES } from "./registry/unrecordable";
import { SKELETON_BUDGETS, type SkeletonBudget } from "./registry/skeleton-budgets";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SOURCE_ID = "soumu-shichoson-kessan-r6";
const SELF_CODE = "192015"; // 甲府市

// ---- 当初予算の本体（public/munibudgets/<団体コード>.json） -------------------
// ⚠ **gen から import しない**（#216）。本体はシャードへ出したので、gen には索引しか無い。
// derive 自身の出口ゲート（表示専用フィールドの汚染・/coverage の年度範囲・事業件数）は
// 本体が要るので、**書いたシャードを読み戻す**。decision の県シャードや coverage.json を
// 読み戻しているのと同じ作法で、「書いたものと検査するものが同一」であることが保証になる。
interface MuniBudgetShardYear {
  muniName: string;
  prefName: string;
  isPref: boolean;
  fy: string;
  projects: { name: string; description: string; kan: string | null; shisaku: string }[];
  execution?: { fyLabel: string }[];
  /** `/sources/<srcId>/<ファイル名>`。**どの資料がこの年度になったか**の唯一の手掛かりで、
   *  出口ゲート⑥（配線から消えた資料の検出）がここから srcId を回収する */
  sourceLocalUrl: string;
  /** 歳入・歳出が別ファイルの資料の歳出側（単一ファイルは null）。srcId は歳入側と同じ */
  expenditureEvidence?: { localUrl: string } | null;
}
function readMuniBudgetShards(): Record<string, MuniBudgetShardYear[]> {
  const dir = join(process.cwd(), "public", "munibudgets");
  if (!existsSync(dir)) return {};
  const out: Record<string, MuniBudgetShardYear[]> = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    out[f.replace(/\.json$/, "")] = readJson(join(dir, f)) as MuniBudgetShardYear[];
  }
  return out;
}

// ---- 外部アーカイブ台帳（data/archives.json） --------------------------------
// 画面のエビデンスリンクは**発行元の直リンクではなく Wayback のコピー**を優先する。
// 直リンクは中身だけ差し替えられ得るが、コピーはパース時点の版に固定されるため
// 透明性が高い（ユーザー方針 2026-07-12）。未登録の URL は直リンクにフォールバック。
const ARCHIVES = (() => {
  const p = join(DATA_DIR, "archives.json");
  if (!existsSync(p)) return {} as Record<string, string>;
  const entries = archivesLedgerSchema.parse(readJson(p)).entries;
  return Object.fromEntries(entries.map((e) => [e.url, e.waybackUrl]));
})();
/** URL → Wayback コピー（未登録なら元 URL のまま） */
const wayback = (url: string): string => ARCHIVES[url] ?? url;
/** 魚拓サービスの URL か（＝この URL 自体が保存版で、発行元の生 URL ではない） */
const isArchiveUrl = (url: string): boolean => /^https?:\/\/(web\.archive\.org|warp\.ndl\.go\.jp)\//.test(url);

// ---- ライセンス区分 --------------------------------------------------------
// license 原文から推定する（表記が揺れたら安全側の unverified に落ちる）:
//   open / permission-required / unverified
// permission-required は /coverage の区分表示だけでなく、**画面のエビデンスリンクを
// 自サーバーのコピーから発行元のディープリンクへ切り替える**（evidence-policy.gen.ts）
// 判定でもあるため、ここが緩むと許諾のない資料を配信リンクで見せることになる。
//
// 「無断で複製・転用することはできません」型の禁止文言も permission-required に落とす
// （2026-07-15 追加）。それまでの語彙は「要許可|非営利」だけで、この型の明示的な禁止が
// unverified（＝可否未確認・要確認）に落ちていた — 実態より緩い区分で、未確認の山に紛れる。
// unverified が「安全側」なのは open に対してだけで、禁止文言に対しては安全側ではない。
//
// ⚠ **この分類器は文脈を読まない**。license 欄に**適用されない規約の名前**を説明として書くと
// 語で拾って**逆の区分に落ちる**（2026-07-16 に実際に踏んだ: 熊本の license に
// 「公共データ利用規約は適用範囲外」と書いたら **open に分類された** ＝ 発行元が許諾していないのに
// 「自由に使える」と画面に出すところだった）。**license 欄には適用される条件だけを書き、
// 経緯は registry のコメントに置く**こと。
//
// **この分類器は「語彙を1つ足す」たびに同じ穴を再生産する**（2026-07-16・さいたまで再発）。
// さいたまの「無断使用・転載を禁止します」は、上の語彙（複製・転用）のどれにも当たらず
// unverified へ落ちた。発行元は市ごとに違う動詞を使う（使用／複製／転用／転載／改変／販売／
// 印刷配布）ので、**動詞を列挙するのではなく「無断」＋禁止の言い回しで捕まえる**。
// **禁止を先に判定する**（2026-07-16・特別区）。オープンデータ規約は「ポータル掲載データのみに
// 適用」と自ら範囲を限る書き方が定番で、その規約文を非 open な資料の license に取り違えて
// 書くと open へ誤判定される（§9g の実害）。**明示的な禁止文言は CC BY の言及に勝たせる**＝
// 取り違えたときに厳しい側へ落ちる。既存の open 13件は禁止文言を1つも含まないことを実測確認済み。
//
// CC BY を open に足した（2026-07-16・特別区）。特別区は**予算データそのものを CC BY の
// オープンデータとして出す区**が実在し（世田谷 CSV・練馬 XLSX・千代田はサイト全体・
// 東京都の決算 XLSX）、政令市20市の「ポータルの CC BY は予算書に及ばない」とは事情が違う。
// 語彙が無いままだと**初の真正 open が unverified として画面に出る**。
// **動詞と「禁止」の距離の上限を 10 → 20 に広げた**（2026-07-27・滋賀）。同じ穴の**2例目**:
// - 三重（2026-07-26）… `複製、転用等する事は法律で禁止` で**間が11文字**。当時は
//   「実際に適用される原文をもう1つ足す」（サイト共通フッター）で permission-required に落として回避した
// - 滋賀 …………………… `複製、転用することは、法律で禁止` で**間が12文字**。滋賀には足せる第2の原文が
//   無く（掲載ページのフッターは著作権ページへのリンクだけ）、回避できない
// どちらも**原文は明確に「許可なく複製・転用することは禁止」と書いている**ので、区分が
// **動詞と述語の距離という組版上の偶然**で決まっていた。`[^。]` が文をまたがせない制約は残るので、
// 20 に広げても「1文の中で禁止と言っている」ことは変わらない。
// ⚠ **広げても既存の区分は1件も動かない**ことを実測した（registry のライセンス原文86種に対し、
//   窓 10/15/20/25/30 のいずれでも差分0）。**次に語彙や窓を触るときも同じ実測をしてから入れること**。
// ⚠⚠ **「許可なく…できません／禁止します」の型を 2026-09-12 に足した**（石巻の偵察で判明）。
//   既存の語彙は `(?:転載|複製|二次利用|引用)` の**直後20字**しか見ないので、
//   **「著作権者の許可なく文章…の全部または一部を**利用すること**は禁止します」（小牧・春日井）や
//   「本市の事前の許可なく…**使用することはできません**」（石巻）が外れて `unverified` に落ちていた。
//   ⚠⚠ **`unverified` はアプリでは open と同じ経路**＝自サーバーの原本コピーを開く。
//   **制限的な license を unverified に落とすのは「開ける側へ倒す」こと**なので、この穴は実害がある。
//   ⇒ **実測**（2026-09-12・ライセンス原文の異なり266種）: 新語彙が当たるのは26種で、
//   **open の語彙（政府標準利用規約・CC BY 等）と競合するものは0**。区分が動くのは
//   **27ソースで、いずれも unverified → permission-required**（閉じる側）:
//   小牧10・春日井6（「許可なく…利用することは禁止します」）＋**新座10・埼玉県1**
//   （「**許可・承諾を得ないまま**ほかの媒体へ転載することは**できません**／**お断りします**」）。
//   ⚠ **「なく」には否定先読みを付けた** — `許可なくても利用可能ですが、改変は禁止します` のような
//   **許容の定型**（なくても／なくとも）を誤って閉じる側に倒さないため（レビューの指摘で合成文を実測）。
//   **次に語彙を触るときも同じ実測をしてから入れること**（§9g）。
//   ⚠⚠ **2026-09-12（第35巡）に窓を 30 → 40 字へ広げた**。石巻市の
//   「本市の事前の許可なく、私的利用および著作権法で認められた利用範囲を超えて使用することはできません」は
//   **「許可なく」と「できません」の間が33字**で、30字の窓から**3字だけ外れていた**。
//   同じ実測をやり直した結果: **異なるライセンス原文271件のうち新たに要許可へ移るのは1件（石巻の15ソース）だけ**で、
//   **open 側の語彙と衝突するものは0件**。⚠ **窓幅は「述語までの距離」でしかない**ので、
//   外れた原文が見つかるたびに実測して広げる（意訳して語を足すのとは別のこと）。
//   ⚠ **まだ拾えない原文がある**。**型に名前を付けない・件数も団体も列挙しない** —
//   「帰属表示」は①権利が誰に属するかの表示 ②引用元を明記せよという要求 の二義で、
//   群の名前にすると読む人ごとに切り方が変わる（レビューで実際に割れた）。
//   列挙も腐る（レビューが富山12・豊田2・名古屋7 の抜けを実測で見つけた）。
//   ⇒ **件数の正は `coverage.json` の `summary.licenseUnverified`、団体は `entities.<code>.sources[].licenseClass`**。共通点は**禁止・不許可を述べる述語が1つも無い**こと。
//   例: 米子（問い合わせ先だけ）・福岡県（権利の所在だけ）・四日市（引用元明記・改変不可・配布時は要確認）・
//   入間（`All Rights Reserved` だけ）。**これらは語彙では拾えない**（拾おうとすると意訳になる）。
// ⚠ **`非商業` を `非営利` の隣に足した**（2026-09-25・半田 §13-41）。半田の原文は「提供しているコンテンツを改変しない条件で複製や
//   これに類する行為を認めますので、**私的かつ非商業目的のみに限定して利用してください**」＋「転載、転用等を行う際は、必ず事前に…ご相談ください」
//   で、`非営利` と同じ制限を別の語で述べているのに `unverified`（＝自前の写しを開く側）に落ちていた。**意訳ではなく同義の語の追加**で、
//   実測で registry の license に `非商業` を含むのは半田だけ（移るのは半田の8ソースだけ・open 側との衝突0）。
// ⚠ **「許諾を得…必要」を足した**（2026-10-02・名古屋市会 §6-3）。原文「…個別に名古屋市の担当課の許諾を得ていただく
//   必要があります」は許可の要求そのものなのに、語彙（許可|承諾|同意 ＋ なく|を得ず）に当たらず unverified に落ちていた。
//   全 registry で動くのは名古屋の1件だけ（open 側との衝突0・レビューが実測）。
// ⚠ **`複製・転用` を読点の `複製、転用` にも広げた**（2026-10-07・酒田 §13-55）。原文「…著作権法で認められた場合を除き、複製、転用をすることはできません。」は
//   多治見の「無断で複製、転用することはできません」と「無断」の有無しか違わない制限的な文言なのに、中黒の語彙に当たらず unverified に落ちていた。
//   全 registry で区分が動くのは0件（実測・既存で `複製、転用` を含む原文は他の語でもう要許可に落ちている）。
// ⚠ **区分は `sourceLicenseClass(s)` で引く**（2026-10-21・#293）。`registry/license-no-grant.ts`（許諾の条項が無いと
//   人が判断した原文の台帳）はここでは見ないので、`licenseClassOf(s.license)` を直接呼ぶと台帳が効かない。
const NO_GRANT = new Set(NO_GRANT_LICENSES.map((l) => l.license));
const sourceLicenseClass = (s: SourceEntry): "open" | "permission-required" | "unverified" => {
  const byText = licenseClassOf(s.license);
  if (!NO_GRANT.has(s.license)) return byText;
  if (byText !== "unverified") {
    throw new Error(
      `${s.id}: license-no-grant.ts に載っている原文なのに、語彙だけで区分が "${byText}" になります。` +
        (byText === "open"
          ? "原文が open の語彙に当たる＝規約が割れています。原文を読み直して人が判断してください。"
          : "語彙だけで要許可に落ちるので、台帳の行は要りません。外してください。"),
    );
  }
  return "permission-required";
};
// 逆方向: 台帳の行がどの資料にも当たらない＝registry の原文が直されて台帳だけが残った（静かに開ける側へ戻る）
{
  const used = new Set(SOURCES.map((s) => s.license));
  const stale = NO_GRANT_LICENSES.filter((l) => !used.has(l.license));
  if (stale.length) {
    throw new Error(
      `license-no-grant.ts の ${stale.length} 行が registry のどの license とも一致しません（原文が直されたなら台帳も直す）:\n` +
        stale.map((l) => `  ${l.who}: ${l.license.slice(0, 60)}`).join("\n"),
    );
  }
}
const licenseClassOf =(lic: string): "open" | "permission-required" | "unverified" =>
  /(?:許可|承諾|同意|許諾)を得(?:て|る)[^。]{0,20}必要|要許可|非営利|非商業|無断|複製[・、]転用|転載を禁止|使用を禁止|(?:転載|複製|二次利用|引用)[^。]{0,20}(?:禁じ|禁止)|(?:許可|承諾|同意)(?:・(?:許可|承諾|同意))?(?:なく(?!ても|とも)|を得(?:ず|ない|ないまま))[^。]{0,40}(?:できません|禁じ|禁止|お断り)/.test(lic)
    ? "permission-required"
  : /政府標準利用規約|公共データ利用規約|クリエイティブ・コモンズ|CC[ -]?BY/i.test(lic) ? "open"
  : "unverified";
// 歳出構成の表示科目（この順で構成比を出し、残りは「その他」）
const MIX_COLS = ["民生費", "教育費", "土木費", "公債費"] as const;

// R6 のファイル構成（registry の urls と対応）。年度更新時はここも見直す。
// pair = 表示行の locator（概況）に対して、目的別歳出を供給した相方ファイル
const FILE_INFO: Record<string, { label: string; short: string; family: "city" | "town"; pair?: string }> = {
  "001061669.xlsx": { label: "都市別（1）概況", short: "都市別・概況", family: "city", pair: "001061671.xlsx" },
  "001061671.xlsx": { label: "都市別（3）目的別歳出内訳", short: "都市別・目的別", family: "city" },
  "001061674.xlsx": { label: "町村別（1）概況", short: "町村別・概況", family: "town", pair: "001061676.xlsx" },
  "001061676.xlsx": { label: "町村別（3）目的別歳出内訳", short: "町村別・目的別", family: "town" },
};
/** 索引の来歴（fx）が指すファイルの並び。index の files と同じ順 */
const SIM_FILES = Object.keys(FILE_INFO);
const SIMILAR_FY_LABEL = "令和6年度（普通会計決算）";

const ds = normalizedDatasetSchema.parse(
  readJson(normalizedPath("municipal-accounts", "R6", false)),
);

// 類似自治体比較は「軸を選んで比較相手を選ぶ」画面なので、特定の4市を導出時に
// 決め打ちせず、全1,741市町村の比較可能な断面を索引として書き出す（アプリ側で
// 軸ごとの距離を計算してサジェストする）。県シャードは県単位でしか引けず全国
// 横断の並べ替えができないため、この画面専用の索引を別に持つ。
// 静的 import すると全ページのバンドルに載るので、public/ に置いてこの画面で取得する。
const indexRows = ds.records
  .flatMap((r) => {
    if (!r.population || !r.expenditureTotal) return [];
    // 自己検証: Σ款 = 歳出総額（千円・厳密）。合わない行は決算シャードにも載らない
    // （＝ダッシュボードを開けない）ので、比較相手としても出さない
    const expSum = Object.values(r.expenditureByPurpose).reduce((a, b) => a + (b ?? 0), 0);
    if (expSum !== r.expenditureTotal) return [];
    const loc = r.sourceRef.locator;
    const info = FILE_INFO[loc.file];
    if (!info) throw new Error(`${r.muniCode}: 未知の locator ファイル ${loc.file}`);
    // 歳出構成比（MIX_COLS 順、残りは「その他」で合計をちょうど100にする）
    const mix: number[] = [];
    let rest = 100;
    for (const col of MIX_COLS) {
      const rounded = Math.round(((r.expenditureByPurpose[col] ?? 0) / r.expenditureTotal) * 1000) / 10;
      mix.push(rounded);
      rest -= rounded;
    }
    mix.push(Math.round(rest * 10) / 10);
    return [{
      c: r.muniCode,
      n: r.muniName,
      p: r.prefName,
      f: info.family,
      pop: r.population,
      exp: Math.round((r.expenditureTotal / 100_000) * 10) / 10, // 千円 → 億円
      // 1人あたり歳出（円）。決算シャード（ダッシュボード）と同じく資料の公表値を優先する
      pc: r.expenditurePerCapitaYen ?? Math.round((r.expenditureTotal * 1000) / r.population),
      fi: r.financialIndex ?? null,
      mix,
      fx: SIM_FILES.indexOf(loc.file),
      rw: loc.row,
    }];
  })
  .sort((a, b) => a.c.localeCompare(b.c));

if (!indexRows.some((r) => r.c === SELF_CODE)) {
  throw new Error(`類似自治体索引に ${SELF_CODE}（甲府市）がありません`);
}

const simDir = join(process.cwd(), "public", "decision");
mkdirSync(simDir, { recursive: true });
writeFileSync(
  join(simDir, "similar-index.json"),
  JSON.stringify({
    fy: "R6",
    fyLabel: SIMILAR_FY_LABEL,
    mixCols: [...MIX_COLS, "その他"],
    files: SIM_FILES.map((f) => ({ name: f, short: FILE_INFO[f]!.short })),
    munis: indexRows,
  }),
  "utf8",
);

// エビデンスカード: 表示行の locator が指しうるファイル（概況＋目的別歳出の相方）を
// raw-meta（sha256・取得日）と registry（URL）から組み立てる。比較相手は市にも町村にも
// なりうるので両方を載せ、画面側で「表示中の行が実際に使ったファイル」だけに絞る。
const rawMeta = readRawMeta(SOURCE_ID);
if (!rawMeta) throw new Error(`${SOURCE_ID}: raw-meta がありません（先に pipeline:fetch）`);
const source = findSource(SOURCE_ID);
const evidence = rawMeta.files
  .filter((f) => FILE_INFO[f.filename])
  .map((f) => ({
    family: FILE_INFO[f.filename]!.family,
    title: `${source.title} ${FILE_INFO[f.filename]!.label}`,
    type: "Excel",
    url: wayback(source.urls?.find((u) => u.endsWith(f.filename)) ?? source.landingPage ?? ""),
    localUrl: `/sources/${SOURCE_ID}/${f.filename}`,
    source: new URL(source.urls?.[0] ?? source.landingPage!).hostname,
    thumb: `${f.filename} ・ sha256 ${f.sha256.slice(0, 16)}… ・ ${f.fetchedAt.slice(0, 10)} 取得`,
  }));

const sourceLines = ds.sources
  .map((s) => ` *   - ${s.sourceId} sha256=${s.sha256.slice(0, 16)}…`)
  .join("\n");
const out = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 総務省「令和6年度 市町村別決算状況調」普通会計決算
/*
 * 来歴:
${sourceLines}
 * 比較行そのものは全国索引 public/decision/similar-index.json（全${indexRows.length}市町村）に
 * 書き出してあり、どの自治体をどの軸で比べるかはアプリ側で決める。ここは画面の
 * 定数（年度ラベル・構成比の科目・エビデンスカード）だけを持つ。
 */

export const SIMILAR_FY_LABEL = "${SIMILAR_FY_LABEL}";

/** 全国索引の取得先（この画面でだけフェッチする） */
export const SIMILAR_INDEX_URL = "/decision/similar-index.json";

export interface SimilarEvidence {
  /** このカードが裏付ける行の種別（市＝city／町村＝town） */
  family: "city" | "town";
  title: string;
  type: string;
  /** 一次資料へのリンク（Wayback コピー優先） */
  url: string;
  /** 自サーバー配信の原本コピー */
  localUrl: string;
  source: string;
  /** サムネイル枠に出す来歴（ファイル名・sha256・取得日） */
  thumb: string;
}

export const SIMILAR_EVIDENCE: SimilarEvidence[] = ${JSON.stringify(evidence, null, 2)};
`;

const dest = join(process.cwd(), "src/client/lib/similar.gen.ts");
writeFileSync(dest, out, "utf8");
console.log(`✓ 類似自治体比較を導出 → public/decision/similar-index.json（${indexRows.length}市町村）／ src/client/lib/similar.gen.ts`);

// ============================================================================
// 甲府市 当初予算（款別・複数年度）→ src/client/lib/kofu.gen.ts
// アプリの款レベルを予算資料パース値＋出典位置で供給する。年度ごとに同じ形の
// オブジェクトを作り、先頭（最新年度）を KOFU_BUDGET として互換エクスポートする。
// ============================================================================
// ダッシュボードの歳入表示グループ（款名の完全一致）。残りの款は「諸収入・その他」へ合算
const REVENUE_GROUPS = [
  "市税", "国庫支出金", "地方交付税", "県支出金", "地方消費税交付金", "繰入金", "寄附金", "市債",
] as const;

// 収録済みの当初予算資料（新しい年度順）。popFy = 1人あたり換算に使う住基人口の
// 決算状況調年度（決算状況調 R6 の人口 = 令7.1.1現在。予算年度の期首に最も近いものを選ぶ）
const BUDGET_YEARS = [
  { srcId: "kofu-yosansho-r8", fy: "R8", popFy: "R6" },
  { srcId: "kofu-yosansho-r7", fy: "R7", popFy: "R6" },
  { srcId: "kofu-yosansho-r6", fy: "R6", popFy: "R5" },
  // R5・R4 は市サイト消失後、WARP（国立国会図書館）の保存版から回収
  { srcId: "kofu-yosansho-r5", fy: "R5", popFy: "R4" },
  { srcId: "kofu-yosansho-r4", fy: "R4", popFy: "R3" },
  { srcId: "kofu-yosansho-r3", fy: "R3", popFy: "R2" },
  // R2 期首（令2.1.1）の人口は決算状況調 R1 が必要（未収録）。最も近い令3.1.1 を明示して使う
  { srcId: "kofu-yosansho-r2", fy: "R2", popFy: "R2" },
] as const;

const toOku = (thousandYen: number) => thousandYen / 100_000;
const yoyPctOf = (cur: number, prev: number | null): number | null =>
  prev != null && prev > 0 ? Math.round((cur / prev - 1) * 1000) / 10 : null;

interface KofuKanRowGen {
  name: string;
  v: number;
  prevV: number | null;
  yoy: number | null;
  ref: string;
  refLabel: string;
  /** 表示グループの内訳（実データの款）。「諸収入・その他」のみ持つ */
  children?: KofuKanRowGen[];
}

const popCache = new Map<string, { population: number; populationLabel: string }>();
function kofuPopulation(popFy: string): { population: number; populationLabel: string } {
  const cached = popCache.get(popFy);
  if (cached) return cached;
  const popDs = normalizedDatasetSchema.parse(
    readJson(normalizedPath("municipal-accounts", popFy, false)),
  );
  const rec = popDs.records.find((r) => r.muniCode === SELF_CODE);
  if (!rec?.population) throw new Error(`municipal-accounts ${popFy}: 甲府市の人口がありません`);
  const v = {
    population: rec.population,
    populationLabel: `住民基本台帳人口（令${Number(popFy.slice(1)) + 1}.1.1現在）`,
  };
  popCache.set(popFy, v);
  return v;
}

function buildKofuBudgetYear(entry: (typeof BUDGET_YEARS)[number]) {
  const { srcId, fy, popFy } = entry;
  // 検証ゲート: needs_review の parsed を derive に通さない
  const validation = validationResultSchema.parse(readJson(validationPath(srcId)));
  if (validation.status !== "ok") {
    throw new Error(`${srcId}: 検証が ${validation.status} のため derive しません`);
  }
  const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
  if (doc.docType !== "budget-book") {
    throw new Error(`${srcId}: budget-book ドキュメントではありません`);
  }
  const meta = readRawMeta(srcId);
  if (!meta) throw new Error(`${srcId}: raw-meta がありません（先に pipeline:fetch）`);
  const source = findSource(srcId);
  const optFiles = (source.parserOptions ?? {}) as { kanFile?: string; projectsFile?: string };
  const urlOf = (filename: string) =>
    source.urls?.find((u) => u.endsWith(`/${filename}`)) ?? source.urls?.[0] ?? source.landingPage ?? "";
  // 分冊形式（R2・R3）は款別一覧と主な事業が別ファイル。単一ファイル形式は同一
  const file = (optFiles.kanFile ? meta.files.find((f) => f.filename === optFiles.kanFile) : meta.files[0])!;
  const projFile =
    (optFiles.projectsFile ? meta.files.find((f) => f.filename === optFiles.projectsFile) : meta.files[0])!;
  const url = urlOf(file.filename);
  const projUrl = urlOf(projFile.filename);

  const kanRow = (
    name: string,
    amount: number,
    prevAmount: number | null,
    page: number,
    refLabel?: string,
  ): KofuKanRowGen => ({
    name,
    v: toOku(amount),
    prevV: prevAmount != null ? toOku(prevAmount) : null,
    yoy: yoyPctOf(amount, prevAmount),
    ref: `${file.filename}#p${page}`,
    refLabel: refLabel ?? `予算書 p.${page}`,
  });

  const expFacts = doc.facts.filter((f) => f.side === "expenditure");
  const revFacts = doc.facts.filter((f) => f.side === "revenue");

  const expenditure = expFacts
    .map((f) => kanRow(f.kanName, f.amount, f.prevAmount, f.locator.page ?? 0))
    .sort((a, b) => b.v - a.v);

  const groupedRevenue: KofuKanRowGen[] = REVENUE_GROUPS.map((g) => {
    const f = revFacts.find((x) => x.kanName === g);
    if (!f) throw new Error(`${srcId}: 歳入款「${g}」が parsed にありません（表示グループの款名を見直してください）`);
    return kanRow(f.kanName, f.amount, f.prevAmount, f.locator.page ?? 0);
  });
  const restFacts = revFacts.filter((f) => !(REVENUE_GROUPS as readonly string[]).includes(f.kanName));
  if (restFacts.length > 0) {
    const restPage = restFacts[0]!.locator.page ?? 0;
    groupedRevenue.push({
      ...kanRow(
        "諸収入・その他",
        restFacts.reduce((a, f) => a + f.amount, 0),
        restFacts.every((f) => f.prevAmount != null)
          ? restFacts.reduce((a, f) => a + (f.prevAmount ?? 0), 0)
          : null,
        restPage,
        `予算書 p.${restPage}（残り${restFacts.length}款の合算）`,
      ),
      // 合算グループだけは実データの款を内訳として持つ（ドリルダウン用）
      children: restFacts
        .map((f) => kanRow(f.kanName, f.amount, f.prevAmount, f.locator.page ?? 0))
        .sort((a, b) => b.v - a.v),
    });
  }
  const revenue = [...groupedRevenue].sort((a, b) => b.v - a.v);

  // 合算の自己検証（グループ化でこぼしていないか）
  const revSum = revenue.reduce((a, r) => a + r.v, 0);
  if (Math.abs(revSum - toOku(doc.revenueTotal)) > 1e-6) {
    throw new Error(`${srcId}: 歳入グループの和 ${revSum} が歳入合計 ${toOku(doc.revenueTotal)} と一致しません`);
  }

  const yoyTotal = yoyPctOf(doc.expenditureTotal, doc.prevExpenditureTotal);
  const pagesOpts = (source.parserOptions ?? {}) as {
    revenuePage?: number;
    expenditurePage?: number;
    projectPages?: { from: number; to: number };
  };
  const pop = kofuPopulation(popFy);
  const budget = {
    fy,
    fyLabel: `${eraYear(fy)}年度 当初予算`,
    population: pop.population,
    populationLabel: pop.populationLabel,
    totalOku: toOku(doc.expenditureTotal),
    prevTotalOku: doc.prevExpenditureTotal != null ? toOku(doc.prevExpenditureTotal) : null,
    yoyLabel: yoyTotal != null ? `${yoyTotal >= 0 ? "+" : ""}${yoyTotal.toFixed(1)}%` : "",
    // 前年度列の基準（R2 の一覧表は前年が「6月補正後予算額」であり当初でない）
    prevBasis: doc.prevBasis,
    // 前年度列の資料注記（R6:「令和5年度当初予算額は6月補正の政策的予算を含む」= R5 骨格予算）
    prevNote: doc.prevNote ?? "",
    sourceTitle: source.title,
    // リンクは Wayback コピー（パース時点の版に固定）。発行元の元 URL は originUrl。
    // sourceLocalUrl = 自サーバー配信のコピー（public/sources。ドロワーでその場レビュー）
    sourceUrl: wayback(url),
    originUrl: url,
    sourceLocalUrl: `/sources/${srcId}/${file.filename}`,
    pagesLabel: `p.${pagesOpts.revenuePage}–${pagesOpts.expenditurePage}`,
    revenue,
    expenditure,
    // 分冊形式では款別一覧・主な事業の両ファイルをエビデンスとして列挙する
    evidence: meta.files.map((f) => ({
      title: source.title + (meta.files.length > 1 ? `（${f.filename}）` : ""),
      type: "PDF",
      url: wayback(urlOf(f.filename)),
      localUrl: `/sources/${srcId}/${f.filename}`,
      source: url ? new URL(url).hostname : "",
      thumb: `${f.filename} ・ sha256 ${f.sha256.slice(0, 16)}… ・ ${f.fetchedAt.slice(0, 10)} 取得`,
    })),
  };
  return { budget, doc, file, url, projFile, projUrl, source, pagesOpts };
}

const budgetYears = BUDGET_YEARS.map(buildKofuBudgetYear);

const kofuOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市 当初予算資料 ${budgetYears.map((b) => b.budget.fy).join("・")}（各年度の sha256 は evidence 参照）
// 金額は億円（予算書の千円値を 1e5 で割った正確値）。yoy は前年度当初比%（小数1桁）

export interface KofuKanRow {
  name: string;
  /** 当初予算額（億円） */
  v: number;
  /** 前年度当初予算額（億円） */
  prevV: number | null;
  /** 前年度当初比（%） */
  yoy: number | null;
  /** 来歴（原資料ファイル内の位置。機械可読） */
  ref: string;
  /** 来歴の画面表示用ラベル */
  refLabel: string;
  /** 表示グループの内訳（実データの款）。「諸収入・その他」のみ持つ */
  children?: KofuKanRow[];
}

export interface KofuBudgetYear {
  /** 年度（"R8" など） */
  fy: string;
  fyLabel: string;
  population: number;
  populationLabel: string;
  totalOku: number;
  prevTotalOku: number | null;
  yoyLabel: string;
  /** 前年度額の基準。"補正後" の年（R2）は前年が当初予算額でない点に注意 */
  prevBasis: "当初" | "補正後";
  /** 前年度列の資料注記（原文。無ければ空文字） */
  prevNote: string;
  sourceTitle: string;
  /** リンク用 URL（Wayback コピー優先。パース時点の版に固定） */
  sourceUrl: string;
  /** 発行元の元 URL */
  originUrl: string;
  /** 自サーバー配信の原本コピー（/sources/...。ドロワーでのその場レビュー用） */
  sourceLocalUrl: string;
  pagesLabel: string;
  revenue: KofuKanRow[];
  expenditure: KofuKanRow[];
  evidence: { title: string; type: string; url: string; localUrl: string; source: string; thumb: string }[];
}

/** 収録済みの当初予算（新しい年度順） */
export const KOFU_BUDGET_YEARS: KofuBudgetYear[] = ${JSON.stringify(budgetYears.map((b) => b.budget), null, 2)};

/** 最新年度（互換用） */
export const KOFU_BUDGET: KofuBudgetYear = KOFU_BUDGET_YEARS[0]!;
`;

const kofuDest = join(process.cwd(), "src/client/lib/kofu.gen.ts");
writeFileSync(kofuDest, kofuOut, "utf8");
console.log(`✓ 甲府市 款別予算を導出 → src/client/lib/kofu.gen.ts（${budgetYears.map((b) => b.budget.fy).join("・")}）`);
for (const b of budgetYears) {
  console.log(
    `  ${b.budget.fy}: 総額 ${b.budget.totalOku}億円（前年比 ${b.budget.yoyLabel}） / 歳入 ${b.budget.revenue.length}グループ・歳出 ${b.budget.expenditure.length}款`,
  );
}

// ============================================================================
// 甲府市 決算の推移（決算状況調 R2〜R6）→ src/client/lib/trend.gen.ts
// ============================================================================
{
  const TREND_YEARS = ["R2", "R3", "R4", "R5", "R6"] as const;
  const trendRows = TREND_YEARS.map((fy) => {
    const srcId = `soumu-shichoson-kessan-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const src = findSource(srcId);
    const ds = normalizedDatasetSchema.parse(readJson(normalizedPath("municipal-accounts", fy, false)));
    const k = ds.records.find((r) => r.muniCode === SELF_CODE);
    if (!k?.expenditureTotal || !k.revenueTotal) throw new Error(`${srcId}: 甲府市のデータがありません`);
    return {
      fy,
      fyLabel: `${eraYear(fy)}年度`,
      expenditureTotalOku: toOku(k.expenditureTotal),
      revenueTotalOku: toOku(k.revenueTotal),
      population: k.population,
      financialIndex: k.financialIndex ?? null,
      keijoShushiPct: k.keijoShushiPct ?? null,
      jisshitsuKosaihiPct: k.jisshitsuKosaihiPct ?? null,
      byPurpose: Object.fromEntries(
        Object.entries(k.expenditureByPurpose).map(([name, v2]) => [name, toOku(v2 as number)]),
      ),
      landingUrl: wayback(src.landingPage ?? ""),
      ref: `${k.sourceRef.locator.file} ${k.sourceRef.locator.row}行目`,
    };
  });
  const trendOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 総務省「市町村別決算状況調」令和2〜6年度（普通会計決算）。金額は億円

export interface KofuTrendRow {
  fy: string;
  fyLabel: string;
  /** 歳出決算総額（億円） */
  expenditureTotalOku: number;
  /** 歳入決算総額（億円） */
  revenueTotalOku: number;
  /** 住民基本台帳人口 */
  population: number | null;
  financialIndex: number | null;
  keijoShushiPct: number | null;
  jisshitsuKosaihiPct: number | null;
  /** 款別歳出（億円） */
  byPurpose: Record<string, number>;
  /** 年度ページ（総務省） */
  landingUrl: string;
  /** 来歴（概況ファイル内の位置） */
  ref: string;
}

export const KOFU_TREND: KofuTrendRow[] = ${JSON.stringify(trendRows, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/trend.gen.ts"), trendOut, "utf8");
  console.log(
    `✓ 決算の推移を導出 → src/client/lib/trend.gen.ts（${trendRows[0]!.fyLabel}〜${trendRows[trendRows.length - 1]!.fyLabel}）`,
  );
}

// ============================================================================
// 甲府市 R6 決算の項レベル内訳（決算状況調）→ src/client/lib/detail.gen.ts
// R8 予算の項以下は原典未公開のため、款ドリルダウンには R6 決算の項内訳を
// 「参考」として年度を明示して出す（推計はしない）。
// ============================================================================
{
  const SOUMU_ID = "soumu-shichoson-kessan-r6";
  const soumuValidation = validationResultSchema.parse(readJson(validationPath(SOUMU_ID)));
  if (soumuValidation.status !== "ok") {
    throw new Error(`${SOUMU_ID}: 検証が ${soumuValidation.status} のため derive しません`);
  }
  const soumuDoc = anyParsedDocSchema.parse(readJson(parsedPath(SOUMU_ID)));
  if (soumuDoc.docType !== "municipal-accounts") throw new Error(`${SOUMU_ID}: municipal-accounts ではありません`);
  const kofuFact = soumuDoc.facts.find((f) => f.muniCode === SELF_CODE);
  if (!kofuFact?.expenditureByPurposeDetail) {
    throw new Error(`${SOUMU_ID}: 甲府市の項レベル内訳がありません（パーサ拡張前の parsed の可能性）`);
  }
  const soumuMeta = readRawMeta(SOUMU_ID);
  const soumuSource = findSource(SOUMU_ID);
  // 目的別歳出内訳ファイル（内訳の出典）の locator と sha256
  const mokutekiLoc = kofuFact.locators?.find((l) => l.file.includes("001061671")) ?? kofuFact.locator;
  const mokutekiFile = soumuMeta?.files.find((f) => f.filename === mokutekiLoc.file);
  const mokutekiUrl = wayback(
    soumuSource.urls?.find((u) => u.endsWith(mokutekiLoc.file)) ?? soumuSource.landingPage ?? "",
  );

  const byKan = Object.fromEntries(
    Object.entries(kofuFact.expenditureByPurposeDetail).map(([kan, kou]) => [
      kan,
      Object.entries(kou)
        .map(([name, v]) => ({ name, v: toOku(v) }))
        .sort((a, b) => b.v - a.v),
    ]),
  );
  const detailOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: ${soumuSource.title} 目的別歳出内訳（${mokutekiLoc.file} sha256=${mokutekiFile?.sha256.slice(0, 16) ?? "?"}… 行${mokutekiLoc.row}）
// 金額は億円（資料の千円値を 1e5 で割った正確値）。R6 決算であり R8 予算の内訳ではない

export const KOFU_R6_DETAIL: {
  fyLabel: string;
  /** 款名 → 項の一覧（金額降順） */
  byKan: Record<string, { name: string; v: number }[]>;
  sourceTitle: string;
  sourceUrl: string;
  /** 自サーバー配信の原本コピー */
  sourceLocalUrl: string;
  refLabel: string;
} = {
  fyLabel: "令和6年度 普通会計決算",
  byKan: ${JSON.stringify(byKan, null, 2)},
  sourceTitle: ${JSON.stringify(soumuSource.title)},
  sourceUrl: ${JSON.stringify(mokutekiUrl)},
  sourceLocalUrl: ${JSON.stringify(`/sources/${SOUMU_ID}/${mokutekiLoc.file}`)},
  refLabel: ${JSON.stringify(`${mokutekiLoc.file} ${mokutekiLoc.row}行目`)},
};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/detail.gen.ts"), detailOut, "utf8");
  console.log(`✓ R6 決算の項レベル内訳を導出 → src/client/lib/detail.gen.ts（${Object.keys(byKan).length}款）`);
}

// ============================================================================
// 甲府市 予算執行状況（複数年度）→ src/client/lib/execution.gen.ts
// R7 = 財政事情の公表（出納整理期間前の速報）。R6〜R1 = 決算状況の収入支出詳細
// （出納整理後の確定値）。R3 は市サイト消失後、WARP（国立国会図書館）の保存版から回収。
// ============================================================================
const EXEC_YEARS = [
  { srcId: "kofu-zaisei-jokyo-r7", fy: "R7" },
  { srcId: "kofu-kessan-syousai-r6", fy: "R6" },
  { srcId: "kofu-kessan-syousai-r5", fy: "R5" },
  { srcId: "kofu-kessan-syousai-r4", fy: "R4" },
  // R3 は市サイトから削除済みだったが WARP（国立国会図書館）の保存版から回収
  { srcId: "kofu-kessan-syousai-r3", fy: "R3" },
  { srcId: "kofu-kessan-syousai-r2", fy: "R2" },
  { srcId: "kofu-kessan-syousai-r1", fy: "R1" },
] as const;

function buildExecYear(entry: { srcId: string; fy: string; refLabelBase?: string }) {
  const { srcId, fy } = entry;
  const validation = validationResultSchema.parse(readJson(validationPath(srcId)));
  if (validation.status !== "ok") {
    throw new Error(`${srcId}: 検証が ${validation.status} のため derive しません`);
  }
  const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
  if (doc.docType !== "budget-execution") {
    throw new Error(`${srcId}: budget-execution ドキュメントではありません`);
  }
  const meta = readRawMeta(srcId);
  if (!meta) throw new Error(`${srcId}: raw-meta がありません（先に pipeline:fetch）`);
  const source = findSource(srcId);
  const file = meta.files[0]!;
  const url = source.urls?.[0] ?? source.landingPage ?? "";
  const isFinal = doc.basis === "確定";
  // 甲府（万円→千円）は toOku(/1e5)、山梨県（円）は yenToOku(/1e8）
  const okuOf = (n: number) => (doc.unit === "yen" ? n / 1e8 : n / 100_000);
  const refLabelBase = entry.refLabelBase ?? (isFinal ? "決算状況 収入支出詳細" : "財政事情");

  const row = (f: (typeof doc.facts)[number]) => ({
    name: f.name,
    budgetOku: okuOf(f.currentBudget),
    settledOku: okuOf(f.settled),
    ratePct: f.ratePct,
    ref: `${file.filename}#${f.locator.page != null ? `p${f.locator.page}` : `row${f.locator.row}`}`,
    refLabel: f.locator.page != null ? `${refLabelBase} p.${f.locator.page}` : `${refLabelBase} ${f.locator.row}行目`,
    // 市税などの内訳（予算現額のみの記載）
    ...(f.breakdown
      ? { breakdownNote: f.breakdown.map((b) => `${b.name} ${fmtBreakdownOku(b.currentBudget)}`).join("・") }
      : {}),
  });
  return {
    fy,
    basis: doc.basis,
    fyLabel: isFinal ? `${eraYear(fy)}年度（決算・確定値）` : `${eraYear(fy)}年度（${doc.asOf}）`,
    asOf: doc.asOf,
    asOfNote: isFinal
      ? "出納整理後の決算確定値。予算現額は補正・繰越を含むため当初予算とは一致しません"
      : "出納整理期間前の年度末速報値。予算現額は補正・繰越を含むため当初予算とは一致しません",
    population: doc.population,
    revenueBudgetTotalOku: okuOf(doc.revenueBudgetTotal),
    revenueSettledTotalOku: okuOf(doc.revenueSettledTotal),
    expenditureBudgetTotalOku: okuOf(doc.expenditureBudgetTotal),
    expenditureSettledTotalOku: okuOf(doc.expenditureSettledTotal),
    revenue: doc.facts.filter((f) => f.side === "revenue").map(row),
    expenditure: doc.facts.filter((f) => f.side === "expenditure").map(row),
    sourceTitle: source.title,
    // リンクは Wayback コピー優先（HTML ページ・上書き型 PDF とも版の固定が要る）
    sourceUrl: wayback(url),
    originUrl: url,
    // 自サーバー配信の原本コピー（PDF/HTML/Excel すべて。ドロワーが種別ごとに表示）
    sourceLocalUrl: `/sources/${srcId}/${file.filename}`,
    evidence: [
      {
        title: source.title,
        type: file.filename.toLowerCase().endsWith(".pdf") ? "PDF" : file.filename.toLowerCase().includes(".htm") ? "Web" : "Excel",
        url: wayback(url),
        localUrl: `/sources/${srcId}/${file.filename}`,
        source: url ? new URL(url).hostname : "",
        thumb: `${file.filename} ・ sha256 ${file.sha256.slice(0, 16)}… ・ ${file.fetchedAt.slice(0, 10)} 取得`,
      },
    ],
  };
}
// 内訳表示用の簡易整形（億円1桁。fmtOku 相当は gen 後の値なのでここで整形して埋め込む）
function fmtBreakdownOku(thousandYen: number): string {
  const oku = thousandYen / 100_000;
  return oku >= 1 ? `${oku >= 100 ? Math.round(oku).toLocaleString() : oku.toFixed(1)}億円` : `${Math.round(oku * 10000).toLocaleString()}万円`;
}

const execYears = EXEC_YEARS.map(buildExecYear);

const execOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市 財政事情の公表（R7・速報）／決算状況 収入支出詳細（R6〜R1・確定。R3 は資料消失により欠落）
// 金額は億円（資料の万円値を千円経由で変換した正確値）。率は資料記載値

export interface KofuExecRow {
  name: string;
  /** 予算現額（億円・補正/繰越込み） */
  budgetOku: number;
  /** 収入済額（歳入）/ 支出済額（歳出）（億円） */
  settledOku: number;
  /** 資料記載の収入率/執行率（%）。予算現額0の款は null */
  ratePct: number | null;
  ref: string;
  refLabel: string;
  /** 内訳（市税の税目別予算現額など。確定値ページのみ） */
  breakdownNote?: string;
}

export interface KofuExecutionYear {
  /** 年度（"R7" など） */
  fy: string;
  /** 済額の基準（速報 = 出納整理前 / 確定 = 決算値） */
  basis: "速報" | "確定";
  fyLabel: string;
  asOf: string;
  asOfNote: string;
  population: number | null;
  revenueBudgetTotalOku: number;
  revenueSettledTotalOku: number;
  expenditureBudgetTotalOku: number;
  expenditureSettledTotalOku: number;
  revenue: KofuExecRow[];
  expenditure: KofuExecRow[];
  sourceTitle: string;
  /** リンク用 URL（Wayback コピー優先） */
  sourceUrl: string;
  /** 発行元の元 URL */
  originUrl: string;
  /** 自サーバー配信の原本コピー（PDF のみ。HTML ページは空文字） */
  sourceLocalUrl: string;
  evidence: { title: string; type: string; url: string; localUrl: string; source: string; thumb: string }[];
}

/** 収録済みの執行状況（新しい年度順。R3 は資料消失により欠落） */
export const KOFU_EXECUTION_YEARS: KofuExecutionYear[] = ${JSON.stringify(execYears, null, 2)};

/** 最新年度（互換用） */
export const KOFU_EXECUTION: KofuExecutionYear = KOFU_EXECUTION_YEARS[0]!;
`;
writeFileSync(join(process.cwd(), "src/client/lib/execution.gen.ts"), execOut, "utf8");
console.log(
  `✓ 予算執行状況を導出 → src/client/lib/execution.gen.ts（${execYears
    .map((y) => `${y.fy}:${((y.expenditureSettledTotalOku / y.expenditureBudgetTotalOku) * 100).toFixed(1)}%${y.basis === "速報" ? "*" : ""}`)
    .join(" / ")}）`,
);

// ============================================================================
// 行政評価（事務事業評価）→ src/client/lib/evaluations.gen.ts
// 実施計画事業ごとの総合評価（H29〜R7 の9年度・計約1,500件）。
// 主な事業との紐付けは「予算名 = 予算書名」または「事業名の完全一致」のみ
// （曖昧マッチはしない — 誤った紐付けは誤エビデンスになるため）。
// ============================================================================
{
  const EVAL_YEARS = ["R7", "R6", "R5", "R4", "R3", "R2", "R1", "H30", "H29"] as const;
  const evalYears = EVAL_YEARS.map((fy) => {
    const srcId = `kofu-gyousei-hyouka-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "project-evaluation") throw new Error(`${srcId}: project-evaluation ではありません`);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません`);
    const src = findSource(srcId);
    const file = meta.files[0]!;
    const url = src.urls?.[0] ?? src.landingPage ?? "";
    return {
      fy,
      fyLabel: `${eraYear(fy)}年度`,
      sourceTitle: src.title,
      sourceUrl: wayback(url),
      originUrl: url,
      sourceLocalUrl: `/sources/${srcId}/${file.filename}`,
      items: doc.facts.map((f) => ({
        name: f.name,
        grade: f.grade,
        prevGrade: f.prevGrade,
        budgetName: f.budgetName,
        bu: f.bu,
        ka: f.ka,
        ref: `${file.filename}#${f.locator.page != null ? `p${f.locator.page}` : `${f.locator.sheet ?? ""}!${f.locator.row}`}`,
      })),
    };
  });
  const evalOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市 行政評価（事務事業評価）結果一覧 H29〜R7（形式の年度差は docs/data-sources.md）

export interface KofuEvaluationItem {
  /** 実施計画掲載事業名 / 事務事業名 */
  name: string;
  /** 総合評価（A〜F、完了、－=評価なし） */
  grade: string;
  prevGrade: string | null;
  /** 予算名（R6・R7 のみ。主な事業の予算書名と厳密一致で突合できる） */
  budgetName: string | null;
  bu: string | null;
  ka: string | null;
  /** 来歴（原資料ファイル内の位置） */
  ref: string;
}

export interface KofuEvaluationYear {
  fy: string;
  fyLabel: string;
  sourceTitle: string;
  /** リンク用 URL（Wayback コピー優先） */
  sourceUrl: string;
  originUrl: string;
  /** 自サーバー配信コピー（PDF のみ） */
  sourceLocalUrl: string;
  items: KofuEvaluationItem[];
}

/** 事務事業評価（新しい年度順） */
export const KOFU_EVALUATION_YEARS: KofuEvaluationYear[] = ${JSON.stringify(evalYears, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/evaluations.gen.ts"), evalOut, "utf8");
  console.log(
    `✓ 事務事業評価を導出 → src/client/lib/evaluations.gen.ts（${evalYears.map((y) => `${y.fy}:${y.items.length}`).join(" / ")}）`,
  );
}

// ============================================================================
// 議会の構成（予算議決時）→ src/client/lib/council.gen.ts
// 甲府市議会の会派別議席数＋当初予算の議決（会派名簿・審議結果の2 HTML）。
// 賛否は R7・R8 だけ（議員別表決結果一覧・kofu-gikai 0.3.0）。エビデンスは名簿と審議結果（R7・R8 は＋議員別表決結果一覧）
// （各 ①発行元 ②Wayback ③自サーバー配信）＋参考の会議録検索・議会だより。
// ============================================================================
/**
 * 賛否の表示シェイプ（会派ごとの内訳・集計）を組む。会派単位の表は、その会派の全員を同じ賛否として数える
 * （会派の列＝議席 − その会派で自分の列（議長・無所属など）を持つ議員。パーサの集計と同じ）。甲府と甲府以外で共通
 */
type CouncilVotesDoc = NonNullable<CouncilCompositionDoc["votes"]>;
function buildCouncilVotes(
  factions: { name: string; seats: number }[],
  vt: CouncilVotesDoc,
  source: { title: string; localUrl: string; originUrl: string; archiveUrl: string },
) {
  const STANCES = ["賛成", "反対", "賛成でない", "欠席", "退席", "棄権", "除斥", "議長", "不参加"] as const;
  const byFaction = factions.map((f) => {
    const cols = vt.columns.filter((c) => c.faction === f.name);
    const counts: Record<string, number> = {};
    const members: { name: string; stance: string }[] = [];
    for (const c of cols) {
      const n = vt.basis === "member" || c.member ? 1 : f.seats - vt.columns.filter((o) => o.faction === f.name && o.member).length;
      counts[c.stance] = (counts[c.stance] ?? 0) + n;
      if (c.member) members.push({ name: c.member, stance: c.stance });
    }
    return { faction: f.name, counts, members };
  });
  const tally: Record<string, number> = {};
  for (const bf of byFaction) for (const [k, n] of Object.entries(bf.counts)) tally[k] = (tally[k] ?? 0) + n;
  return {
    basis: vt.basis,
    ...(vt.unanimousText ? { unanimousText: vt.unanimousText } : {}),
    stances: STANCES.filter((k) => tally[k]),
    tally,
    byFaction,
    source,
  };
}

{
  const COUNCIL_FYS = ["R8", "R7", "R6", "R5", "R4", "R3", "R2"] as const;
  const councils = COUNCIL_FYS.map((fy) => {
    const srcId = `kofu-gikai-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "council-composition") throw new Error(`${srcId}: council-composition ではありません`);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません`);
    const src = findSource(srcId);
    const rosterFile = meta.files.find((f) => /kaiha/i.test(f.filename)) ?? meta.files[0]!;
    const resultFile = meta.files.find((f) => /kekka|shingi/i.test(f.filename)) ?? meta.files[1]!;
    const rosterOrigin = src.urls![0]!;
    const resultOrigin = src.urls![1]!;
    const asOfLabel = doc.asOf.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_m, y, mo, d) => `${y}年${Number(mo)}月${Number(d)}日`);
    return {
      fy,
      fyLabel: `${eraYear(fy)}年度 当初予算`,
      body: doc.body,
      seats: doc.seats,
      asOf: doc.asOf,
      asOfLabel,
      factions: doc.factions.map((f) => ({ name: f.name, seats: f.seats, isIndependent: f.isIndependent })),
      resolution: {
        billNo: doc.resolution.billNo,
        billName: doc.resolution.billName,
        sessionLabel: doc.resolution.sessionLabel,
        decidedDate: doc.resolution.decidedDate,
        decidedDateLabel: doc.resolution.decidedDateLabel,
        result: doc.resolution.result,
      },
      sourceTitle: src.title,
      // ①発行元 ②Wayback ③自サーバー配信（HTML はサンドボックス iframe で開く）
      roster: {
        title: "所属会派別議員名簿",
        localUrl: `/sources/${srcId}/${rosterFile.filename}`,
        originUrl: rosterOrigin,
        archiveUrl: wayback(rosterOrigin),
      },
      result: {
        title: `${doc.resolution.sessionLabel} 審議結果`,
        localUrl: `/sources/${srcId}/${resultFile.filename}`,
        originUrl: resultOrigin,
        archiveUrl: wayback(resultOrigin),
      },
      // 参考（二次エビデンス・パイプライン外の外部リンク）
      votesTable: doc.votesTableLink ? { title: doc.votesTableLink.title, originUrl: doc.votesTableLink.url } : null,
      // 賛否（kofu-gikai 0.3.0・R7・R8）。原典は議員別表決結果一覧（registry の urls の3つ目）
      ...(doc.votes
        ? (() => {
            // 照合に使った URL（parserOptions.votes.url）から引く。urls の並びに頼らない
            const vurl = (src.parserOptions as { votes: { url: string } }).votes.url;
            const vf = meta.files.find((f) => f.fetchedFrom === vurl);
            if (!vf) throw new Error(`${srcId}: 議員別表決結果一覧（${vurl}）の raw がありません`);
            return {
              votes: buildCouncilVotes(doc.factions, doc.votes, {
                title: doc.votes.sourceTitle,
                localUrl: `/sources/${srcId}/${vf.filename}`,
                originUrl: vurl,
                archiveUrl: wayback(vurl),
              }),
            };
          })()
        : {}),
      minutesUrl: "https://www.city.kofu.yamanashi.dbsr.jp/",
      newsletterUrl: "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html",
    };
  });
  // ---- 甲府以外（`council-transcribed`）。団体コード → 年度の新しい順 ----
  // 台帳は registry（parser: council-transcribed）そのもの。団体コードは scope の「団体コードNNNNNN」から取る
  // （手で並べる台帳を別に持つと載せ忘れが起きる）。取り違えは出口で議会名と団体名を突き合わせて止める
  const COUNCIL_SOURCES: { srcId: string; muniCode: string }[] = SOURCES.filter(
    (s) => s.parser === "council-transcribed" && !s.fixture,
  ).map((s) => {
    const code = s.scope.match(/団体コード(\d{6})/)?.[1];
    if (!code) throw new Error(`${s.id}: scope に「団体コードNNNNNN」がありません（議会の構成の配信先が決まらない）`);
    return { srcId: s.id, muniCode: code };
  });
  const muniCouncils: Record<string, unknown[]> = {};
  for (const { srcId, muniCode } of COUNCIL_SOURCES) {
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "council-composition") throw new Error(`${srcId}: council-composition ではありません`);
    const src = findSource(srcId);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません`);
    const opt = src.parserOptions as { roster: { url: string }; resolution: { url: string } };
    const fileOf = (url: string) => {
      const f = meta.files.find((x) => x.fetchedFrom === url);
      if (!f) throw new Error(`${srcId}: ${url} の raw ファイルがありません`);
      return f;
    };
    // 魚拓から取った原典は、魚拓そのものが「その版」なので発行元リンクにも魚拓を置く
    // （発行元の同じ URL は議決後に上書きされた別の版を指す）
    const ev = (url: string, title: string) => ({
      title,
      localUrl: `/sources/${srcId}/${fileOf(url).filename}`,
      originUrl: url,
      archiveUrl: url.startsWith("https://web.archive.org/") ? url : wayback(url),
    });
    const asOfLabel = doc.asOf.replace(/^(\d{4})-(\d{2})-(\d{2})$/, (_m, y, mo, d) => `${y}年${Number(mo)}月${Number(d)}日`);
    (muniCouncils[muniCode] ??= []).push({
      fy: doc.fiscalYear,
      fyLabel: `${eraYear(doc.fiscalYear)}年度 当初予算`,
      body: doc.body,
      seats: doc.seats,
      ...(doc.teisu != null ? { teisu: doc.teisu } : {}),
      asOf: doc.asOf,
      asOfLabel,
      // 原典の並び（議席番号順の賛否表の列など）は団体ごとにまちまちなので、議席の多い順・無所属は後ろにそろえる
      factions: doc.factions
        .map((f) => ({ name: f.name, seats: f.seats, isIndependent: f.isIndependent }))
        .sort((a, b) => Number(a.isIndependent) - Number(b.isIndependent) || b.seats - a.seats),
      resolution: {
        billNo: doc.resolution.billNo,
        billName: doc.resolution.billName,
        sessionLabel: doc.resolution.sessionLabel,
        decidedDate: doc.resolution.decidedDate,
        decidedDateLabel: doc.resolution.decidedDateLabel,
        result: doc.resolution.result,
      },
      sourceTitle: src.title,
      roster: ev(opt.roster.url, doc.rosterTitle ?? "会派別議員名簿"),
      result: ev(opt.resolution.url, doc.resultTitle ?? `${doc.resolution.sessionLabel} 議決結果`),
      minutesUrl: null,
      newsletterUrl: null,
      // 賛否（council-transcribed 0.6.0〜）。会派単位の表は、その会派の全員を同じ賛否として数える。
      // 修正可決などで採決が分かれる議会は voteParts（採決ごと）に出す（0.7.0）
      ...(() => {
        const build = (vt: CouncilVotesDoc, vurl: string) => buildCouncilVotes(doc.factions, vt, ev(vurl, vt.sourceTitle));
        const po = src.parserOptions as { votes?: { url: string }; votesParts?: { url: string; part: string }[] };
        if (doc.votes) return { votes: build(doc.votes, po.votes!.url) };
        if (doc.votesParts) {
          return {
            voteParts: doc.votesParts.map((vp) => ({
              part: vp.part,
              ...build(vp, po.votesParts!.find((x) => x.part === vp.part)!.url),
            })),
          };
        }
        return {};
      })(),
    });
  }
  for (const [code, list] of Object.entries(muniCouncils) as [string, { fy: string }[]][]) {
    // 同じ団体×年度が2本あると画面は先頭しか出さず、2本目が静かに消える
    const dup = list.find((c, i) => list.findIndex((d) => d.fy === c.fy) !== i);
    if (dup) throw new Error(`議会の構成 ${code} ${dup.fy}: 同じ年度の資料が2本あります（COUNCIL_SOURCES の重複）`);
    list.sort((a, b) => Number(b.fy.slice(1)) - Number(a.fy.slice(1)));
  }
  const councilOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市議会 所属会派別議員名簿（各予算の議決時点のバージョン）＋各年3月定例会 審議結果。
// 会派構成は名簿の更新日でバージョンを固定（過去分は Wayback スナップショット）。
// 甲府の賛否は R7・R8 を議員別表決結果一覧から収録。ほかの年度は審議結果のページに表へのリンクが無く未収録（votesTable で書き分ける）。

export interface CouncilFaction {
  name: string;
  seats: number;
  isIndependent: boolean;
}
export interface CouncilEvidence {
  title: string;
  /** 自サーバー配信の原本コピー（③・サンドボックス iframe で開く） */
  localUrl: string;
  /** 発行元（①） */
  originUrl: string;
  /** Wayback 魚拓（②） */
  archiveUrl: string;
}
export interface Council {
  /** 予算年度（この議会が議決した当初予算の年度。"R8" など） */
  fy: string;
  fyLabel: string;
  /** 議会名 */
  body: string;
  /** 現員（＝会派議席合計）。甲府は定数＝現員 */
  seats: number;
  /** 条例定数（原典で確かめた団体だけ。欠員があると seats より大きい） */
  teisu?: number;
  /** 会派構成の基準日 ISO（名簿の更新日） */
  asOf: string;
  asOfLabel: string;
  factions: CouncilFaction[];
  resolution: {
    billNo: string;
    billName: string;
    sessionLabel: string;
    decidedDate: string;
    decidedDateLabel: string;
    result: string;
  };
  sourceTitle: string;
  roster: CouncilEvidence;
  result: CouncilEvidence;
  /**
   * 当初予算の議決での賛否（甲府以外・原典で公表している議会だけ）。basis は原典の賛否表の列の単位
   * （member＝議員ごと、faction＝会派ごと。会派単位の表は会派の全員を同じ賛否として数える）
   */
  votes?: {
    basis: "member" | "faction";
    unanimousText?: string;
    stances: string[];
    tally: Record<string, number>;
    byFaction: { faction: string; counts: Record<string, number>; members: { name: string; stance: string }[] }[];
    source: CouncilEvidence;
  };
  /** 予算の議決が複数の採決に分かれる議会（修正可決: 修正案・修正部分を除く原案）の採決ごとの賛否 */
  voteParts?: {
    part: string;
    basis: "member" | "faction";
    /** 原典が「全会一致」の語だけで示した採決（数は議席から出したもの）。その原文 */
    unanimousText?: string;
    stances: string[];
    tally: Record<string, number>;
    byFaction: { faction: string; counts: Record<string, number>; members: { name: string; stance: string }[] }[];
    source: CouncilEvidence;
  }[];
  /**
   * 甲府だけ: 審議結果のページにある議員ごとの賛否の表（議員別表決結果一覧）。賛否そのものは未収録で、
   * 画面の注記を「非公表」と書かないための有無（R7・R8 にあり、R2〜R6 の審議結果のページには無い）
   */
  votesTable?: { title: string; originUrl: string } | null;
  /** 参考リンク（会議録検索・議会だより）。甲府だけが持つ */
  minutesUrl: string | null;
  newsletterUrl: string | null;
}
/** 互換の別名（甲府） */
export type KofuCouncil = Council;

/** 甲府市議会の構成（予算議決時）。新しい年度順（R8→R2）。 */
export const KOFU_COUNCIL_YEARS: Council[] = ${JSON.stringify(councils, null, 2)};

/** 最新（R8）。年度未指定時のフォールバック。 */
export const KOFU_COUNCIL: Council = KOFU_COUNCIL_YEARS[0]!;

/**
 * 甲府以外の議会の構成（予算議決時）。団体コード → 新しい年度順。
 * 会派と所属議員を名簿から書き写し、全員の氏名が原典の本文に出ることをパーサが確かめている
 * （\`council-transcribed\`・docs/data-sources.md §6-2）。**年度が合わなければ出さない**（別年度の構成で代用しない）。
 */
export const MUNI_COUNCIL_YEARS: Record<string, Council[]> = ${JSON.stringify(muniCouncils, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/council.gen.ts"), councilOut, "utf8");
  console.log(
    `✓ 議会の構成を導出 → src/client/lib/council.gen.ts（甲府 ${councils.length}年度 ${councils.map((c) => `${c.fy}:${c.factions.length}会派`).join(" ")}／ほか ${Object.keys(muniCouncils).length}団体）`,
  );
}

// ============================================================================
// 事業報告（成果）＝事務事業評価 詳細票（第2号様式）→ src/client/lib/report.gen.ts
// 予算→執行→成果を1事業で通して見られる詳細票。公表は各年サンプル数件のみ。
// 事業費（決算＋当初＋計画）・トータルコスト・成果指標の目標/実績・総合評価を持つ。
// ============================================================================
{
  const REPORT_FYS = ["R7", "R6"] as const;
  const reportYears = REPORT_FYS.map((fy) => {
    const srcId = `kofu-jigyou-houkoku-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "project-report") throw new Error(`${srcId}: project-report ではありません`);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません`);
    const src = findSource(srcId);
    const file = meta.files[0]!;
    const url = src.urls?.[0] ?? src.landingPage ?? "";
    return {
      fy,
      fyLabel: `${eraYear(fy)}年度`,
      targetFy: doc.targetFy,
      targetFyLabel: doc.targetFy ? `${eraYear(doc.targetFy)}年度` : "",
      sourceTitle: src.title,
      sourceUrl: wayback(url),
      originUrl: url,
      sourceLocalUrl: `/sources/${srcId}/${file.filename}`,
      reports: doc.facts.map((f) => ({
        no: f.no,
        name: f.name,
        buka: f.buka,
        kubun: f.kubun,
        implementation: f.implementation,
        grade: f.grade,
        score: f.score,
        cost: f.cost,
        indicators: f.indicators,
        ref: `${file.filename}#${f.locator.sheet ?? ""}`,
      })),
    };
  });
  const reportOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市 事務事業評価 詳細票（第2号様式）。公表は各年サンプル数件のみ。
// 全事業分の詳細票は情報公開請求（未収録＝リクエスト）。

export interface ReportCostYear {
  fy: string;
  kind: "決算" | "当初" | "計画";
  jigyohi: number | null;
  ippanZaigen: number | null;
  totalCost: number | null;
}
export interface ReportIndicator {
  category: "活動指標" | "成果指標";
  name: string;
  /** 目標値（年度順・最大5）。定性指標は null */
  targets: (number | null)[];
  /** 実績値（決算年度分） */
  actuals: (number | null)[];
}
export interface KofuReport {
  no: string;
  /** 事務事業名 */
  name: string;
  /** 担当（部室課） */
  buka: string;
  kubun: string | null;
  /** 事業実施結果（実施内容） */
  implementation: string | null;
  /** 総合評価（A〜F） */
  grade: string;
  /** 評価点（24点満点） */
  score: number | null;
  cost: ReportCostYear[];
  indicators: ReportIndicator[];
  /** 来歴（原資料内の位置） */
  ref: string;
}
export interface KofuReportYear {
  /** 評価年度 */
  fy: string;
  fyLabel: string;
  /** 対象（実績）年度 */
  targetFy: string;
  targetFyLabel: string;
  sourceTitle: string;
  /** リンク用 URL（Wayback コピー優先） */
  sourceUrl: string;
  originUrl: string;
  /** 自サーバー配信コピー（Excel はダウンロードカード） */
  sourceLocalUrl: string;
  reports: KofuReport[];
}

/** 事業報告（成果）＝事務事業評価 詳細票（新しい年度順） */
export const KOFU_REPORT_YEARS: KofuReportYear[] = ${JSON.stringify(reportYears, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/report.gen.ts"), reportOut, "utf8");
  console.log(
    `✓ 事業報告（成果）を導出 → src/client/lib/report.gen.ts（${reportYears.map((y) => `${y.fy}:${y.reports.length}件`).join(" / ")}）`,
  );
}

// ============================================================================
// 事業報告（成果）— 全量公開の自治体 → public/reports/<団体コード>.json
// 甲府は公表サンプル5件なので静的 gen（上）でよいが、**川崎は572事業**（parsed 2.1MB）で、
// 静的 import すると gen の合計（既に2.1MB）が倍になる。決算シャード・similar-index・
// coverage.json と同じく**その画面でだけフェッチする**（CLAUDE.md の配信方針）。
// 札幌（R7=666件）・横浜（R3〜R7）を足すときも同じ形に乗る。
// ============================================================================
{
  const REPORT_MUNI_SOURCES: {
    srcId: string;
    muniCode: string;
    muniName: string;
    /**
     * 事業報告の「歳出予算科目 07款…」の款番号を**どの年度の予算で款名に解決するか**。
     * 事業評価は**対象年度（実績年度）の款**を指すので、評価年度ではなく**対象年度の予算**を使う
     * （横浜の R7 評価＝令和6年度事業なので R6）。**推測しない** — 実データで
     * R6 と R8 の款番号→款名が完全一致することは確認済みだが、年度で変わり得る（R5 以前は18款）。
     */
    kanFromSrc?: string;
    /** 資料の呼び名。**市ごとに違う**ので決め打ちしない（#72 のメダリオン: 報告どおり尊重し丸めない） */
    docLabel: string;
    /**
     * 評価様式の説明文（カテゴリ評価を持たない資料のみ）。画面がそのまま出す。
     * **資料ごとに書く** — 横浜の「7軸のカテゴリ値」を札幌に使い回すと嘘になる（実害が出かけた）
     */
    evalNote?: string;
    /**
     * 原典の金額単位。**未指定＝千円**（既存3市はすべて千円）。「円」を指定すると
     * 千円へ換算してから配る（画面側の fmtOku/jigyohiFmt が「千円」を前提に固定係数
     * （/1e5 等）で億円化するため。§ derive の統一ルール）。
     * **換算は表示専用**（parsed の値・validate のゲートは原典の円のまま。二重に丸めない）。
     */
    unit?: "円";
  }[] = [
    { srcId: "kawasaki-jigyou-hyouka-r6", muniCode: "141305", muniName: "川崎市", docLabel: "事務事業評価シート" },
    // 札幌（#127・2026-07-23）。1事業1PDF×634本（一般会計）。款項目は持たない（kanFromSrc なし）
    {
      srcId: "sapporo-jigyou-hyouka-r7", muniCode: "011002", muniName: "札幌市", docLabel: "事業評価調書",
      evalNote: "この資料は総合評価や達成度の数値を持たず、見直し内容と今後の方向性を自由記述で自己評価しています。",
    },
    // **横浜は特別会計の事業を含む**（2,535事業中222件が16の特別会計）。scope が一般会計なので
    // 会計名（policy）で除外する。**会計名を持つのは横浜だけ**（川崎は全件が一般会計の想定）
    {
      srcId: "yokohama-jigyo-hyoka-r7", muniCode: "141003", muniName: "横浜市", kanFromSrc: "yokohama-yosansho-r6",
      docLabel: "事業評価書",
      evalNote: "この資料は総合評価や達成度の数値を持たず、7つの軸それぞれのカテゴリ値で自己分析しています。",
    },
    // さいたま（#161・2026-07-24）。行政報告書（決算に係る主要な施策の成果）R6・689事業
    // （一般会計676＋特別会計13。特別会計は policy="特別会計" で下記 inScope フィルタが除外する）。
    // **款名を報告書自身が内包する**ため kanFromSrc 不要（横浜と違い外部の予算解決に依存しない・
    // R6予算が罫線様式で未収録でも款ドリルへ紐付けられる）。原典の金額単位は円。
    {
      srcId: "saitama-jigyou-houkoku-r6", muniCode: "111007", muniName: "さいたま市", docLabel: "行政報告書",
      unit: "円",
      evalNote: "この資料は総合評価や達成度の数値を持たず、決算額の増減とあわせて成果を自由記述で自己評価しています。",
    },
    // 北九州（#161・2026-07-24）。行政評価の取組結果（事業評価）R6・198事業。
    // **款/項/目はこの資料に無い**（別資料の執行実績説明書にのみ款があり、決算額±事業名の
    // 近似一致で機械結合できる見込みだが未実装＝kanFromSrc なし）。評価は「順調/概ね順調/
    // やや遅れ/遅れ」の4段階（achievement/grade どちらの語彙にも当てはまらないため progress
    // フィールドに丸めず収める）。
    {
      srcId: "kitakyushu-jigyou-hyoka-r6", muniCode: "401005", muniName: "北九州市", docLabel: "行政評価の取組結果（事業評価）",
      evalNote: "この資料は達成度の数値の代わりに「順調」「概ね順調」「やや遅れ」「遅れ」の4段階で自己評価し、KPI（成果指標）の目標・実績もあわせて持ちます。",
    },
    // 京都府（#161・2026-07-30）。主要な施策の成果に関する報告書 R6・417施策。**都道府県で初の事業報告**。
    // **款で章立てされた資料**で、`measure` が `N款款名` なので**款名を報告書自身が内包する**
    // （⚠ **項・目は出していない** — 取りこぼしが避けられないため。§12）
    // （さいたまと同じ経路・kanFromSrc 不要）。docs §12。
    // ⚠ **原典が施策ごとの金額を印字しない**（金額は目レベル。執行額を持つのは417件中399件）。
    //   目の額を施策へ配ると二重計上になるので埋めていない（parsed の `noPerProjectCost` 宣言）。
    //   → **画面には「決算額を持たない事業」が並ぶ**ので、evalNote でその旨を必ず伝える。
    {
      srcId: "kyotofu-seika-houkoku-r6", muniCode: "260002", muniName: "京都府", docLabel: "主要な施策の成果に関する報告書",
      unit: "円",
      evalNote:
        "この資料は総合評価や達成度の数値を持たず、施策ごとの実施状況と成果を自由記述で報告しています。金額は款・項・目の単位で示されており、施策ごとの決算額は原典が執行額を記載しているものだけに載ります。",
    },
    // 杉並区（#163・2026-08-03）。事務事業評価シート R7・一般会計521事業。**特別区で初の事業報告**。
    // **款項目事業コードを持つ**ので `measure` は `NN款NN項NN目NNN事業`（款名は含まない＝
    // 款名は既収録の当初予算から引く。番号が歳出11款と一致することを実測済み）。
    // ⚠ **総合評価も達成度も持たない**（A〜F も点数も無い）。持つのは方向性2軸と成果指標。
    // ⚠ **Σ を歳出総額と並べてはいけない** — 人件費を各事業に配賦しつつ款08「職員費」でも
    //   別立てで載るため二重に載る（docs §10i-2）。
    {
      srcId: "suginami-jimujigyou-hyouka-r7", muniCode: "131156", muniName: "杉並区", docLabel: "事務事業評価シート",
      // 款名はシートに無い（番号だけ）ので、**同じ年度の当初予算から引く**（横浜と同じ経路）。
      // 番号が歳出11款と一致することはパーサ側とここの両方で効いてくる
      kanFromSrc: "suginami-yosansho-r7",
      // ⚠ `unit` は**「円建てなので千円へ換算する」宣言**。杉並は原典が千円なので**書かない**
      evalNote:
        "この資料は総合評価や達成度の数値を持たず、翌年度に向けた「事業コストの方向性」と「事業の改善の方向性」（複数回答）で方針を示し、活動指標・成果指標の計画と実績を4年分載せています。金額は事業費・人件費・財源内訳を6年分持ちますが、人件費は款「職員費」にも別立てで計上されるため、事業の総事業費を合計しても歳出総額にはなりません。",
    },
  ];
  const byMuni: Record<string, unknown> = {};
  for (const r of REPORT_MUNI_SOURCES) {
    const v = validationResultSchema.parse(readJson(validationPath(r.srcId)));
    if (v.status !== "ok") throw new Error(`${r.srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(r.srcId)));
    if (doc.docType !== "project-report") throw new Error(`${r.srcId}: project-report ではありません`);
    const meta = readRawMeta(r.srcId);
    if (!meta) throw new Error(`${r.srcId}: raw-meta がありません`);
    const src = findSource(r.srcId);
    const eraLabel = (c: string) => `${eraYear(c)}年度`;
    // 款番号 → 款名。**対象年度の予算から引く**（画面側で推測させない）。
    // これがあると「款ドリル → その款の事業 → 成果」が繋がる。**款項目を持つのは横浜だけ**
    const kanNames: Record<string, string> = {};
    if (r.kanFromSrc) {
      const kd = anyParsedDocSchema.parse(readJson(parsedPath(r.kanFromSrc)));
      if (kd.docType !== "budget-book") throw new Error(`${r.kanFromSrc}: budget-book ではありません`);
      // 款番号なしの款（廃止款の括弧書き）は款番号→款名の索引に載せられないので飛ばす
      for (const f of kd.facts) {
        if (f.side === "expenditure" && f.kanNo != null) kanNames[String(f.kanNo)] = f.kanName;
      }
    }
    // 画面に出す断面だけに絞る（parsed をそのまま配ると 2.1MB）。金額は千円のまま持ち、
    // 表示側で fmtOku/fmtYen に通す
    // **一般会計に絞る**（横浜は policy に会計名が入る。2,535 → 2,313）。
    // 会計名を持たない資料（川崎）は素通りさせる — 全件が一般会計の前提で収録している
    const inScope = doc.facts.filter((f) => !/会計$/.test(f.policy ?? "") || f.policy === "一般会計");
    // ⚠ **parsed に出す前に落とした件数も足す** — 会計欄を持たない資料（杉並）は
    //   ここでは除外が見えないので、パーサの宣言（`excludedCount`）を使う。
    //   足さないと画面が「全N事業が公表されています（サンプルではなく全量）」と過大に言う
    //   ⚠ **両方を持つ資料が来たら二重計上になる**（現状は横浜が前者のみ・杉並が後者のみ）。
    //   会計欄と parsed 前の除外が同居する資料を足すときは、どちらか一方に寄せること
    const excluded = doc.facts.length - inScope.length + (doc.excludedCount ?? 0);
    const reports = inScope.map((f) => {
      const file = meta.files.find((x) => x.filename === f.locator.file) ?? meta.files[0]!;
      return {
        code: f.code ?? f.no,
        name: f.name,
        buka: f.buka,
        policy: f.policy ?? "",
        measure: f.measure ?? "",
        // **達成度は数字が小さいほど良い**（甲府の A〜F とは向きが逆）。丸めず素の値を配る
        achievement: f.achievement ?? null,
        direction: f.direction ?? "",
        // 進捗の自己評価（北九州の「順調/概ね順調/やや遅れ/遅れ」）。achievement/grade の
        // どちらとも語彙が違うため別枠で持つ（§ pipeline/types.ts の progress コメント参照）
        progress: f.progress ?? "",
        // 款名（歳出予算科目の款番号を対象年度の予算で解決したもの）。解決できなければ null
        kanName: (() => {
          // 款名が measure 自身に内包される資料（さいたま。`2款総務費/1項…`）はそこから直接取る
          // → kanFromSrc（外部の予算解決）が無くても款ドリルへ紐付けられる
          // ⚠ 款だけの `10款教育費` も受ける（京都府 §12。項・目は未収録でも款ドリルへ紐付く）。
          // ⚠⚠ **横浜の `02款01項01目`（スラッシュ無し・番号だけ）を款名と誤読しないこと** —
          //   末尾 `$` を許した初版は `01項01目` を款名として捕獲し、**横浜2,313件の款ドリルを
          //   全滅させた**（レビューで発覚）。→ **款名は数字で始まらない**という制約を置く。
          const embedded = /^(\d+)款([^0-9/][^/]*?)(?:\/|$)/.exec(f.measure ?? "");
          if (embedded) return embedded[2]!.trim();
          const m = /^(\d+)款/.exec(f.measure ?? "");
          return m ? kanNames[String(Number(m[1]))] ?? null : null;
        })(),
        // 原典が円建ての資料は千円へ換算する（他市と単位を揃えて表示するため。r.unit 参照）
        cost: f.cost.map((c) => {
          const scale = r.unit === "円" ? 1000 : 1;
          const conv = (v: number | null | undefined) => (v == null ? null : v / scale);
          return {
            fy: c.fy,
            kind: c.kind,
            jigyohi: conv(c.jigyohi),
            jinkenhi: conv(c.jinkenhi),
            totalCost: conv(c.totalCost),
            ippanZaigen: conv(c.ippanZaigen),
            ...(c.isEstimate ? { est: 1 } : {}),
          };
        }),
        // エビデンス: 自サーバーの原本コピーを該当ページで開く（3層の③）
        ref: `/sources/${r.srcId}/${f.locator.file}#page=${f.locator.page}`,
        refLabel: `${f.locator.file} p.${f.locator.page}`,
      };
    });
    const achievementCounts: Record<string, number> = {};
    for (const x of reports) if (x.achievement != null) achievementCounts[String(x.achievement)] = (achievementCounts[String(x.achievement)] ?? 0) + 1;
    byMuni[r.muniCode] = {
      muniCode: r.muniCode,
      muniName: r.muniName,
      /** 一般会計以外（特別会計）で除外した事業数。0 なら会計の区別が無い資料 */
      excluded,
      docLabel: r.docLabel,
      /** 評価様式の説明（カテゴリ評価を持たない資料のみ）。無い資料は null */
      evalNote: r.evalNote ?? null,
      /**
       * **その資料が実際に持つ項目**。画面の説明文をこれで組み立てる。
       * 川崎と横浜で持ち物が違うのに川崎の文面を使い回すと**嘘になる**
       * （横浜は人件費・総コスト・達成度・方向性のいずれも持たない）。
       */
      has: {
        /**
         * **全事業が事業費を持つか**（2026-07-30・京都府）。false のときは画面の文面を
         * 「事業費」ではなく「原典が記載している事業のみ」に振り替える。
         * ⚠ 京都府は金額が目レベルにしか無く、施策ごとの決算額は執行額を書いた施策
         * （396件中177件）にしか無い。**「事業ごとに事業費が載っています」は嘘になる**。
         */
        jigyohiAll: reports.length > 0 && reports.every((x) => x.cost.some((c) => c.jigyohi != null)),
        jigyohiSome: reports.some((x) => x.cost.some((c) => c.jigyohi != null)),
        jinkenhi: reports.some((x) => x.cost.some((c) => c.jinkenhi != null)),
        totalCost: reports.some((x) => x.cost.some((c) => c.totalCost != null)),
        // ⚠ **人工（ninku）を持つのは川崎だけ** — 「1人当たり人件費 × 人工」という算定式は
        //   川崎の様式の記述なので、他資料に使い回すと嘘になる（レビューの指摘・#163）
        // ⚠ 母集団は**除外後の `reports`**（兄弟のフラグと揃える。除外側だけが人工を持つ
        //   資料が来たときに食い違わないようにする＝レビューの指摘）
        ninku: doc.facts
          .filter((f) => !/会計$/.test(f.policy ?? "") || f.policy === "一般会計")
          .some((x) => x.cost.some((c) => c.ninku != null)),
        achievement: reports.some((x) => x.achievement != null),
        direction: reports.some((x) => x.direction),
        progress: reports.some((x) => x.progress),
        /**
         * 歳出予算科目。事業を款ドリルへ紐付けられる資料。
         * ⚠ **`kanKoumoku` は「款・項・目」と言い切らない** — 京都府は**款だけ**（項・目は原典に
         * あるが取りこぼしが避けられず落とした。§12）。画面の文面はこの2つで振り替える。
         */
        kanKoumoku: reports.some((x) => /\d+款/.test(x.measure ?? "")),
        // ⚠ 横浜は `02款01項01目`（スラッシュ無し）なので**両方の書式**を受ける
        kanKoumokuFull: reports.some((x) => /\d+款[^/]*\/\d+項|\d+款\d+項/.test(x.measure ?? "")),
        estimate: reports.some((x) => x.cost.some((c) => (c as { est?: number }).est === 1)),
      },
      fy: doc.fiscalYear,
      fyLabel: eraLabel(doc.fiscalYear),
      sourceTitle: src.title,
      originUrl: src.urls?.[0] ?? src.landingPage ?? "",
      landingPage: src.landingPage ?? "",
      /** 達成度の凡例。**1が最良で5が最悪**（A〜F と向きが逆なので画面で必ず明示する） */
      achievementLabels: {
        "1": "目標を大きく上回って達成",
        "2": "目標を上回って達成",
        "3": "ほぼ目標どおり達成",
        "4": "目標を下回った",
        "5": "目標を大きく下回った",
      },
      directionLabels: {
        "Ⅰ": "現状のまま継続",
        "Ⅱ": "改善しながら継続",
        "Ⅲ": "事業規模拡大",
        "Ⅳ": "事業規模縮小",
        "Ⅴ": "事業廃止",
      },
      achievementCounts,
      reports,
    };
  }
  const dir = join(process.cwd(), "public/reports");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const sizes: string[] = [];
  for (const [code, data] of Object.entries(byMuni)) {
    const json = JSON.stringify(data);
    writeFileSync(join(dir, `${code}.json`), json, "utf8");
    sizes.push(`${(data as { muniName: string }).muniName}:${(json.length / 1024).toFixed(0)}KB`);
  }
  // 索引だけは静的に持つ（数十バイト）。**シャードが無い自治体でフェッチしない**ために要る
  const idxOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 事業報告（成果）を**全量公開**している自治体の団体コード → 件数。
// 実体は public/reports/<団体コード>.json（その画面でだけフェッチする。useProjectReports）。
// 甲府（公表サンプル5件）は静的 gen の report.gen.ts 側なのでここには入らない。

export const REPORT_MUNIS: Record<string, { name: string; fy: string; fyLabel: string; count: number }> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(byMuni).map(([code, d]) => {
        const x = d as { muniName: string; fy: string; fyLabel: string; reports: unknown[] };
        return [code, { name: x.muniName, fy: x.fy, fyLabel: x.fyLabel, count: x.reports.length }];
      }),
    ),
    null,
    2,
  )};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/reports-index.gen.ts"), idxOut, "utf8");
  console.log(
    `✓ 事業報告（全量公開の自治体）を導出 → public/reports/（${REPORT_MUNI_SOURCES.map((r) => `${r.muniName} ${(byMuni[r.muniCode] as { reports: unknown[] }).reports.length}件`).join(" / ")}・${sizes.join(" / ")}）`,
  );
}

// ============================================================================
// 統計書 財政章（款項×当初/最終/決算）→ src/client/lib/outturn.gen.ts
// 款別ドリルダウンの項テーブル（当初→最終→決算）の原典。単位は円 → 億円へ変換。
// R3 歳出の「当初予算額」列は原典側の誤植（R2 の値のコピー。歳入側は正しく、
// R5版・R4版の両方が同じ値 — 予算資料との突合で 14款中12款が R2 と一致）のため
// 採用せず null にする。
// ============================================================================
{
  const OUTTURN_YEARS = ["R6", "R5", "R4", "R3", "R2", "R1", "H30"] as const;
  const yenToOku = (yen: number) => yen / 1e8;
  const outturnYears = OUTTURN_YEARS.map((fy) => {
    const srcId = `kofu-toukei-zaisei-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "budget-outturn") throw new Error(`${srcId}: budget-outturn ではありません`);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません`);
    const src = findSource(srcId);
    const expFile = meta.files.find((f) => f.filename.includes("15-02"))!;
    const url = src.urls?.find((u) => u.includes("15-02")) ?? src.landingPage ?? "";
    const initialSuspect = fy === "R3"; // 歳出の当初列が原典誤植（上記コメント）
    const row = (f: (typeof doc.facts)[number]) => ({
      kan: f.kanName,
      kou: f.kouName,
      initialOku: initialSuspect && f.side === "expenditure" ? null : yenToOku(f.initialBudget),
      finalOku: yenToOku(f.finalBudget),
      settledOku: yenToOku(f.settled),
      execPct: f.finalBudget > 0 ? Math.round((f.settled / f.finalBudget) * 1000) / 10 : null,
      ref: `${f.locator.file}#${f.locator.sheet}!${f.locator.row}`,
    });
    return {
      fy,
      fyLabel: `${eraYear(fy)}年度`,
      initialNote: initialSuspect
        ? "歳出の当初予算額は原典（統計書）側の誤植（前年度値の再掲）と判定したため表示していません"
        : "",
      sourceTitle: src.title,
      sourceUrl: wayback(url),
      originUrl: url,
      sourceLocalUrl: `/sources/${srcId}/${expFile.filename}`,
      revenue: doc.facts.filter((f) => f.side === "revenue").map(row),
      expenditure: doc.facts.filter((f) => f.side === "expenditure").map(row),
      totals: {
        initialOku: initialSuspect ? null : yenToOku(doc.expenditureTotal.initial),
        finalOku: yenToOku(doc.expenditureTotal.final),
        settledOku: yenToOku(doc.expenditureTotal.settled),
      },
    };
  });
  const outturnOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市統計書「一般会計歳入歳出状況」各版（款項 × 当初/最終/決算。単位は億円 = 円/1e8）

export interface KofuOutturnRow {
  kan: string;
  /** 項名。null = 款の行 */
  kou: string | null;
  /** 当初予算額（億円）。R3 歳出は原典誤植のため null */
  initialOku: number | null;
  /** 最終予算額（億円・補正/繰越込み） */
  finalOku: number;
  /** 決算額（億円） */
  settledOku: number;
  /** 執行率 = 決算/最終（%・小数1桁） */
  execPct: number | null;
  ref: string;
}

export interface KofuOutturnYear {
  fy: string;
  fyLabel: string;
  /** 当初列に関する注記（R3 のみ） */
  initialNote: string;
  sourceTitle: string;
  sourceUrl: string;
  originUrl: string;
  sourceLocalUrl: string;
  revenue: KofuOutturnRow[];
  expenditure: KofuOutturnRow[];
  totals: { initialOku: number | null; finalOku: number; settledOku: number };
}

/** 款項の当初→最終→決算（新しい年度順） */
export const KOFU_OUTTURN_YEARS: KofuOutturnYear[] = ${JSON.stringify(outturnYears, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/outturn.gen.ts"), outturnOut, "utf8");
  console.log(
    `✓ 統計書 款項3点を導出 → src/client/lib/outturn.gen.ts（${outturnYears.map((y) => y.fy).join("・")}）`,
  );
}

// ---- 主な事業一覧（複数年度）→ src/client/lib/projects.gen.ts ----------------
{
  const projectYears = budgetYears
    .filter((b) => b.doc.projects && b.doc.projects.length > 0)
    .map((b) => ({
      fy: b.budget.fy,
      fyLabel: b.budget.fyLabel,
      projects: b.doc.projects!.map((p) => ({
        kan: p.kan,
        no: p.no,
        kubun: p.kubun,
        name: p.name,
        budgetBookName: p.budgetBookName,
        amountOku: toOku(p.amount),
        description: p.description,
        basicGoal: p.basicGoal,
        ...(p.basicGoalLabel ? { basicGoalLabel: p.basicGoalLabel } : {}),
        shisaku: p.shisaku,
        ref: `${b.projFile.filename}#p${p.locator.page}`,
        refLabel: `予算資料 p.${p.locator.page}`,
        // PDF のページアンカー付きリンク（Wayback コピー優先。フラグメントはコピーでも効く）
        refUrl: `${wayback(b.projUrl)}#page=${p.locator.page}`,
        // 自サーバー配信コピーの同ページ（ドロワー用）
        refLocalUrl: `/sources/${b.source.id}/${b.projFile.filename}#page=${p.locator.page}`,
      })),
      source: {
        title: b.source.title,
        url: wayback(b.projUrl),
        originUrl: b.projUrl,
        localUrl: `/sources/${b.source.id}/${b.projFile.filename}`,
        pagesLabel: b.pagesOpts.projectPages
          ? `p.${b.pagesOpts.projectPages.from}–${b.pagesOpts.projectPages.to}`
          : "",
      },
    }));
  if (projectYears.length === 0) throw new Error("主な事業が1年度分も導出できませんでした");
  const projOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市 当初予算資料「主な事業一覧」${projectYears.map((y) => y.fy).join("・")}
// 金額は億円（資料の千円値を 1e5 で割った正確値）

export interface KofuProject {
  /** 歳出款または特別会計名。箇条書き形式の年度（R2・R3）は記載が無く null */
  kan: string | null;
  /** 資料の掲載番号（全体で連番）。箇条書き形式は null */
  no: number | null;
  /** 新規/拡充（表形式の区分列）または繰越（箇条書きの◆） */
  kubun: "新規" | "拡充" | "繰越" | null;
  /** 事業名（【N】=KOFU NEXT ACTION、【連】=県央ネットやまなし関連） */
  name: string;
  /** 予算書上の事業名（資料の下段（ ）書き） */
  budgetBookName: string | null;
  /** 予算額（億円） */
  amountOku: number;
  description: string;
  /** 総合計画の基本目標（ひと/まち/魅力、基本目標1〜4、基本構想の推進。複数は「・」連結） */
  basicGoal: string;
  /** 基本目標の名称（箇条書き形式の見出しから。表形式には無い） */
  basicGoalLabel?: string;
  /** 総合計画の施策（箇条書き形式では「施策の柱」） */
  shisaku: string;
  ref: string;
  refLabel: string;
  /** 原資料 PDF の該当ページへのリンク（Wayback コピー優先） */
  refUrl: string;
  /** 自サーバー配信コピーの該当ページ（/sources/...#page=N。ドロワー用） */
  refLocalUrl: string;
}

export interface KofuProjectYear {
  /** 年度（"R8" など） */
  fy: string;
  fyLabel: string;
  projects: KofuProject[];
  /** url = Wayback コピー / originUrl = 発行元 / localUrl = 自サーバー配信コピー */
  source: { title: string; url: string; originUrl: string; localUrl: string; pagesLabel: string };
}

/** 収録済みの主な事業一覧（新しい年度順） */
export const KOFU_PROJECT_YEARS: KofuProjectYear[] = ${JSON.stringify(projectYears, null, 2)};

/** 最新年度（互換用） */
export const KOFU_PROJECTS: KofuProject[] = KOFU_PROJECT_YEARS[0]!.projects;

export const KOFU_PROJECTS_SOURCE = KOFU_PROJECT_YEARS[0]!.source;
`;
  writeFileSync(join(process.cwd(), "src/client/lib/projects.gen.ts"), projOut, "utf8");
  console.log(
    `✓ 主な事業一覧を導出 → src/client/lib/projects.gen.ts（${projectYears.map((y) => `${y.fy}:${y.projects.length}事業`).join(" / ")}）`,
  );
}

// ============================================================================
// 外部アーカイブ台帳（data/archives.json）→ src/client/lib/archives.gen.ts
// 出典タブで「魚拓（Wayback Machine スナップショット）」リンクを出すための断面。
// 台帳が無い環境でも derive は通す（空マップを生成）
// ============================================================================
{
  const archivesPath = join(DATA_DIR, "archives.json");
  const entries = existsSync(archivesPath)
    ? archivesLedgerSchema.parse(readJson(archivesPath)).entries
    : [];
  const byUrl = Object.fromEntries(entries.map((e) => [e.url, e.waybackUrl]));
  const archOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（台帳の更新は bun run pipeline:archive）
// 一次資料の元 URL → Wayback Machine スナップショット URL

export const WAYBACK_BY_URL: Record<string, string> = ${JSON.stringify(byUrl, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/archives.gen.ts"), archOut, "utf8");
  console.log(`✓ 外部アーカイブ台帳を導出 → src/client/lib/archives.gen.ts（${entries.length}件）`);
}

// ============================================================================
// 再利用が許諾されていない一次資料 → src/client/lib/evidence-policy.gen.ts
//
// エビデンス3層コピー（①git raw ②Wayback ③自サーバー配信）の**例外**を書き出す。
// 原則は「画面のリンクは常に③をドロワーで開く」（発行元の直リンクは中身だけ差し替えられ
// 得るため主リンクにしない）だが、**発行元が二次利用を許諾していない資料（要許可）は
// ③へのリンクを主リンクにしない** — 私たちの写しをそのまま読ませることが再配布に当たる。
// **写し自体は消さない**（来歴・SHA-256 照合・「何を持っているか」の開示は /coverage で続ける）。
// 変えるのは**リンクの向き先だけ**で、要許可の資料は発行元のディープリンクを開く
// （ユーザー方針 2026-07-16）。
//
// 向き先の決め方は「**実際にどこから取得したか**（raw-meta の fetchedFrom）」を第一の根拠に
// する。registry の url は最新版へ差し替わり得るが、fetchedFrom はその写しの出所そのもの。
//   - fetchedFrom が発行元の生 URL      → origin（発行元のその資料へ直リンク）
//   - fetchedFrom が魚拓（Wayback/WARP） → archive（**発行元から消えていて魚拓にしかない**
//                                          資料。取得時点で既に消えていた証拠なので魚拓へ繋ぐ）
//   - fetchedFrom が manual:（手動投入）  → 台帳の魚拓 → registry の URL の順で外部の宛先を探す
// **外部の宛先が1つも無い要許可資料は throw する**（＝リンクの持って行き先が無いまま
// 「発行元で開く」と表示するくらいなら derive を失敗させる。gen 同士の食い違いを止める
// 出口の整合チェックと同じ考え方）。
// ============================================================================
{
  type Link = { mode: "origin" | "archive"; target: "file" | "page"; href: string; license: string };
  const links: Record<string, Link> = {};
  // 振替先が「資料そのもの（PDF/Excel）」か「掲載ページ（HTML）」かを derive で決める。
  // 画面のリンク文言はこれに従う — `noDeepLink` の資料で「予算書PDFを開く」と書いてあるのに
  // HTML の掲載ページが開く、という**文言と実態のズレ**を1か所で潰すため（2026-07-26）。
  // noDeepLink は発行元がファイル直リンクを断っている＝振替先は必ず掲載ページ。それ以外は
  // 宛先が HTML のときだけページ扱いにする。**判らないものは file に寄せる** — 東京都のように
  // 拡張子の無い直ダウンロード URL（/documents/d/zaimu/08-03sainyukanbetsu）があり、これを
  // ページ扱いにすると今度は「掲載ページを開く」と書いてファイルが落ちてくる。file 側の文言は
  // 「発行元で開く ↗」＝何が開くかを主張しないので、判らないときの受け皿として安全。
  const isPageHref = (href: string) => /\.html?(?=$|[?#])/i.test(href);
  const missing: string[] = [];
  let sourceCount = 0;
  for (const s of SOURCES) {
    if (s.fixture) continue;
    if (sourceLicenseClass(s) !== "permission-required") continue;
    sourceCount++;
    const meta = readRawMeta(s.id);
    // registry 側の宛先（ファイル直リンク → ランディングページ）。fetchedFrom が使えないときの控え
    const registryUrl = s.urls?.[0] ?? s.url ?? s.landingPage ?? null;
    // **発行元がファイルへの直リンクを断っている資料**（SourceEntry.noDeepLink 参照・新宿）は
    // ランディングページへ向ける。**ここで landingPage が無いまま素通りさせない** — 静かに
    // 直リンクへ落ちると、発行元が断っている行為をこちらから行うことになる。
    if (s.noDeepLink && !s.landingPage) {
      throw new Error(
        `${s.id}: noDeepLink を立てているのに landingPage がありません。` +
          `発行元がファイルへの直リンクを断っている資料は、振替先のランディングページが必須です。`,
      );
    }
    for (const f of meta?.files ?? []) {
      const from = f.fetchedFrom;
      const link: Omit<Link, "target"> | null = s.noDeepLink
        ? // ⚠ **`noDeepLink` でも mode は宛先で決める**（2026-08-23・レビュー指摘）— ここだけ `origin` を
          //   決め打ちしていたため、**landingPage が魚拓の資料で「発行元で開く ↗」と表示して
          //   web.archive.org / warp.ndl.go.jp が開いていた**（水戸 H30・八尾 R5/R4/R3・所沢 R6/R5/R4 の7件）。
          //   文言は `mode` から作られる（`src/client/lib/data.ts` の `actionLabel`/`openLabel`）ので、
          //   **宛先の実態と mode を必ず一致させる**。他の分岐は最初からこう書いてある。
          { mode: isArchiveUrl(s.landingPage!) ? "archive" : "origin", href: s.landingPage!, license: s.license }
        : /^https?:/.test(from)
          ? { mode: isArchiveUrl(from) ? "archive" : "origin", href: from, license: s.license }
          : ARCHIVES[registryUrl ?? ""]
            ? { mode: "archive", href: ARCHIVES[registryUrl!]!, license: s.license }
            : registryUrl
              ? { mode: isArchiveUrl(registryUrl) ? "archive" : "origin", href: registryUrl, license: s.license }
              : null;
      if (!link) {
        missing.push(`${s.id}/${f.filename}`);
        continue;
      }
      links[`/sources/${s.id}/${f.filename}`] = {
        ...link,
        target: s.noDeepLink || isPageHref(link.href) ? "page" : "file",
      };
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `要許可の資料に外部リンクの宛先がありません（発行元 URL も魚拓も無い）: ${missing.join(", ")}\n` +
        `再利用が許諾されていない資料は自サーバーのコピーを主リンクにできません。` +
        `registry に url / landingPage を書くか、bun run pipeline:archive で魚拓を取ってください`,
    );
  }
  const archiveOnly = Object.values(links).filter((l) => l.mode === "archive").length;
  const policyOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive
// 発行元が二次利用を許諾していない一次資料（/coverage の「要許可」）の
// 自サーバー配信コピー → 発行元（消えている資料は魚拓）のディープリンク。
// 画面はこのキーに載っている資料だけ、ドロワーではなく外部リンクで開く。

export interface RestrictedEvidenceLink {
  /** origin = 発行元へ直リンク / archive = 発行元から消えており魚拓にしかない */
  mode: "origin" | "archive";
  /**
   * 振替先に何があるか。page = 掲載ページ（HTML）と判っているもの / file = それ以外。
   * 画面のリンク文言はこれに従う（「予算書PDFを開く」と書いて HTML が開くのを防ぐ）。
   */
  target: "file" | "page";
  href: string;
  /** 発行元が示している利用条件の原文（なぜ外部リンクなのかの根拠） */
  license: string;
}

/** キー: 自サーバー配信コピーのパス（/sources/<sourceId>/<filename>。フラグメント無し） */
export const RESTRICTED_EVIDENCE: Record<string, RestrictedEvidenceLink> = ${JSON.stringify(links, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/evidence-policy.gen.ts"), policyOut, "utf8");
  console.log(
    `✓ 要許可資料のリンク方針を導出 → src/client/lib/evidence-policy.gen.ts（${sourceCount}資料・${Object.keys(links).length}ファイル・うち魚拓へ${archiveOnly}）`,
  );
}

// ============================================================================
// 全国 決算シャード（総務省 決算状況調 R2〜R6）→ public/decision/<県コード>.json
//   ＋ 索引 src/client/lib/decision-index.gen.ts
// 全1,741市町村に「決算ベースのダッシュボード」を出すための断面。追加取得0。
// クライアントは県コードごとに1ファイルをフェッチ（選択時・キャッシュ）。金額は億円。
// 甲府（192015）は full 階層（予算ベースの詳細画面）なので decision には載るが
// アプリ側は full を優先する。
// ============================================================================
{
  const DECISION_YEARS = ["R6", "R5", "R4", "R3", "R2"] as const;
  // 千円 → 億円（万円精度に丸めてシャードを軽くする。表示は fmtOku でさらに丸める）
  const okuR = (thousandYen: number) => Math.round((thousandYen / 1e5) * 1e4) / 1e4;
  const mapOku = (o: Record<string, number | undefined>): Record<string, number> =>
    Object.fromEntries(
      Object.entries(o)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, okuR(v as number)]),
    );
  const mapOku2 = (o: Record<string, Record<string, number>>): Record<string, Record<string, number>> =>
    Object.fromEntries(Object.entries(o).map(([k, sub]) => [k, mapOku(sub)]));

  // fy → 出典 Excel カード（都市別/町村別の3ファイルずつ）＋概況ファイル名（family 判定用）
  const CARD_LABELS = [
    "都市別（1）概況",
    "都市別（2）歳入内訳",
    "都市別（3）目的別歳出内訳",
    "町村別（1）概況",
    "町村別（2）歳入内訳",
    "町村別（3）目的別歳出内訳",
  ];
  type Card = { title: string; type: string; url: string; localUrl: string; source: string; thumb: string };
  const decisionSources: Record<string, { city: Card[]; town: Card[]; cityGaikyo: string; townGaikyo: string }> = {};
  for (const fy of DECISION_YEARS) {
    const srcId = `soumu-shichoson-kessan-${fy.toLowerCase()}`;
    const src = findSource(srcId);
    const meta = readRawMeta(srcId);
    if (!meta) throw new Error(`${srcId}: raw-meta がありません（先に pipeline:fetch）`);
    const cards = (src.urls ?? [])
      .map((u, i) => {
        const filename = u.split("/").pop()!;
        const f = meta.files.find((x) => x.filename === filename);
        if (!f) return null;
        return {
          idx: i,
          title: `${src.title} ${CARD_LABELS[i]}`,
          type: "Excel",
          url: wayback(u),
          localUrl: `/sources/${srcId}/${filename}`,
          source: new URL(u).hostname,
          thumb: `${filename} ・ sha256 ${f.sha256.slice(0, 16)}… ・ ${f.fetchedAt.slice(0, 10)} 取得`,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c != null);
    decisionSources[fy] = {
      city: cards.filter((c) => c.idx < 3).map(({ idx: _i, ...r }) => r),
      town: cards.filter((c) => c.idx >= 3).map(({ idx: _i, ...r }) => r),
      cityGaikyo: (src.urls?.[0] ?? "").split("/").pop() ?? "",
      townGaikyo: (src.urls?.[3] ?? "").split("/").pop() ?? "",
    };
  }

  // 県コード → { 県名, 団体コード → { 市町村名, 年度→断面 } }
  const prefs = new Map<string, { prefName: string; munis: Map<string, { name: string; years: Record<string, unknown> }> }>();
  const prefCodes: Record<string, string> = {};
  // 不一致は**件数だけでなく中身を残す**（2026-07-16）。以前は数を数えるだけだったので、
  // **新しい不一致が出ても「2 → 3」に増えるだけで、どの自治体か分からなかった**。
  // 数だけの報告は「静かに壊れる」を招く（§2-4 と同じ轍。archive の「新規登録 2」も同型だった）。
  const expMismatches: string[] = [];
  const revMismatches: { label: string; diff: number; total: number }[] = [];

  // (4)性質別歳出・(5)地方債を年度ごとに団体コードで結合し、各年度スライスに付与する。億円。
  // R2〜R6 を収録済み。未取得の年度はスキップ（その年度はパネル非表示になる）。
  const seishitsuByYear = new Map<string, Map<string, { nature: Record<string, number>; bond: Record<string, number | null> | null }>>();
  for (const fy of DECISION_YEARS) {
    const srcId = `soumu-shichoson-seishitsu-${fy.toLowerCase()}`;
    if (!existsSync(parsedPath(srcId))) continue;
    const val = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (val.status !== "ok") throw new Error(`${srcId}: 検証が ${val.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(srcId)));
    if (doc.docType !== "municipal-nature") throw new Error(`${srcId}: municipal-nature ではありません`);
    const m = new Map<string, { nature: Record<string, number>; bond: Record<string, number | null> | null }>();
    for (const f of doc.facts) {
      const b = f.localBond;
      m.set(f.muniCode, {
        nature: mapOku(f.byNature),
        bond: b
          ? {
              balanceOku: okuR(b.balance),
              reserveOku: b.reserveTotal != null ? okuR(b.reserveTotal) : null,
              chouseiOku: b.reserveByType.財政調整基金 != null ? okuR(b.reserveByType.財政調整基金) : null,
              gensaiOku: b.reserveByType.減債基金 != null ? okuR(b.reserveByType.減債基金) : null,
              debtBurdenOku: b.debtBurdenFuture != null ? okuR(b.debtBurdenFuture) : null,
            }
          : null,
      });
    }
    seishitsuByYear.set(fy, m);
  }

  for (const fy of DECISION_YEARS) {
    const srcId = `soumu-shichoson-kessan-${fy.toLowerCase()}`;
    const v = validationResultSchema.parse(readJson(validationPath(srcId)));
    if (v.status !== "ok") throw new Error(`${srcId}: 検証が ${v.status} のため derive しません`);
    const ds = normalizedDatasetSchema.parse(readJson(normalizedPath("municipal-accounts", fy, false)));
    const dsrc = decisionSources[fy]!;
    for (const r of ds.records) {
      if (!r.population || !r.expenditureTotal) continue;
      // 自己検証: Σ款 = 歳出総額（千円・厳密）。合わない年度は採用しない
      const expSum = Object.values(r.expenditureByPurpose).reduce((a, b) => a + (b ?? 0), 0);
      if (expSum !== r.expenditureTotal) {
        expMismatches.push(`${fy} ${r.prefName} ${r.muniName}（${r.muniCode}）`);
        continue;
      }
      const rev = r.revenueByCategory ?? {};
      const revSum = Object.values(rev).reduce((a, b) => a + b, 0);
      // **歳入は歳出と違って除外しない** — 画面は科目和ベースで描くので、原典の合計欄と
      // 食い違っても内訳そのものは自己整合している（歳出は Σ が合わない＝内訳が壊れているので除外する）。
      // ただし**丸め（±数千円）と抽出の壊れ（桁が違う）は別物**なので分ける。
      // 以前は**どんなに大きくズレても警告のみで表示し続けていた** — 総務省の様式が変わって
      // 科目を1つ取り違えても、件数が1つ増えるだけで画面には出続ける穴だった。
      if (r.revenueTotal && revSum !== r.revenueTotal) {
        revMismatches.push({
          label: `${fy} ${r.prefName} ${r.muniName}（${r.muniCode}）`,
          diff: revSum - r.revenueTotal,
          total: r.revenueTotal,
        });
      }

      const prefCode = r.muniCode.slice(0, 2);
      prefCodes[r.prefName] = prefCode;
      let pref = prefs.get(prefCode);
      if (!pref) {
        pref = { prefName: r.prefName, munis: new Map() };
        prefs.set(prefCode, pref);
      }
      let muni = pref.munis.get(r.muniCode);
      if (!muni) {
        muni = { name: r.muniName, years: {} };
        pref.munis.set(r.muniCode, muni);
      }
      const loc = r.sourceRef.locator;
      const family = loc.file === dsrc.cityGaikyo ? "city" : "town";
      muni.years[fy] = {
        pop: r.population,
        expTotalOku: okuR(r.expenditureTotal),
        revTotalOku: r.revenueTotal != null ? okuR(r.revenueTotal) : null,
        perCapYen: r.expenditurePerCapitaYen ?? Math.round((r.expenditureTotal * 1000) / r.population),
        finIdx: r.financialIndex ?? null,
        keijo: r.keijoShushiPct ?? null,
        kosai: r.jisshitsuKosaihiPct ?? null,
        shorai: r.shoraiFutanPct ?? null,
        family,
        exp: mapOku(r.expenditureByPurpose),
        expDetail: mapOku2(r.expenditureByPurposeDetail ?? {}),
        rev: mapOku(rev),
        revDetail: mapOku2(r.revenueByCategoryDetail ?? {}),
        ref: { file: loc.file, row: loc.row },
        // 性質別歳出・地方債（R2〜R6 収録済み。年度ごとに結合）
        ...(seishitsuByYear.get(fy)?.has(r.muniCode)
          ? { nature: seishitsuByYear.get(fy)!.get(r.muniCode)!.nature, bond: seishitsuByYear.get(fy)!.get(r.muniCode)!.bond }
          : {}),
      };
    }
  }

  // 県シャードを書き出す（決定的: 団体コード昇順）
  const decDir = join(process.cwd(), "public", "decision");
  mkdirSync(decDir, { recursive: true });
  let fileCount = 0;
  let muniCount = 0;
  for (const [prefCode, pref] of [...prefs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const munis: Record<string, unknown> = {};
    for (const [code, m] of [...pref.munis.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      munis[code] = m;
      muniCount++;
    }
    const shard = { prefCode, prefName: pref.prefName, years: DECISION_YEARS, munis };
    writeFileSync(join(decDir, `${prefCode}.json`), JSON.stringify(shard), "utf8");
    fileCount++;
  }

  const prefCodeSorted = Object.fromEntries(
    Object.entries(prefCodes).sort((a, b) => a[1].localeCompare(b[1])),
  );
  const decIndexOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 全国 決算シャード（public/decision/<県コード>.json）の索引・出典メタ。
// 出典: 総務省「市町村別決算状況調」R2〜R6（普通会計決算）

export interface DecisionEvidenceCard {
  title: string;
  type: string;
  /** 一次資料へのリンク（Wayback コピー優先） */
  url: string;
  /** 自サーバー配信の原本コピー */
  localUrl: string;
  source: string;
  thumb: string;
}

/** 都道府県名 → 県コード（2桁）。決算シャードのファイル名になる */
export const PREF_CODES: Record<string, string> = ${JSON.stringify(prefCodeSorted, null, 2)};

/** 決算の収録年度（新しい順） */
export const DECISION_YEARS = ${JSON.stringify(DECISION_YEARS)} as const;

/** 年度 → 表示ラベル */
export const DECISION_FY_LABELS: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(DECISION_YEARS.map((fy) => [fy, `${eraYear(fy)}年度 決算`])),
    null,
    2,
  )};

/** full 階層（予算ベースの詳細画面を持つ）自治体の団体コード */
export const FULL_MUNIS: string[] = ${JSON.stringify([SELF_CODE])};

/** fy → 出典 Excel（都市別/町村別の3ファイルずつ）。エビデンスドロワー用 */
export const DECISION_SOURCES: Record<string, { city: DecisionEvidenceCard[]; town: DecisionEvidenceCard[] }> = ${JSON.stringify(
    Object.fromEntries(DECISION_YEARS.map((fy) => [fy, { city: decisionSources[fy]!.city, town: decisionSources[fy]!.town }])),
    null,
    2,
  )};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/decision-index.gen.ts"), decIndexOut, "utf8");
  console.log(
    `✓ 全国 決算シャードを導出 → public/decision/（${fileCount}県・${muniCount}市町村）／ src/client/lib/decision-index.gen.ts`,
  );
  if (expMismatches.length) {
    console.log(`  ⚠ Σ款≠歳出総額で除外した muni-年度: ${expMismatches.length}`);
    for (const l of expMismatches.slice(0, 10)) console.log(`      ${l}`);
    if (expMismatches.length > 10) console.log(`      …他 ${expMismatches.length - 10} 件`);
  }
  // **丸めと抽出の壊れを分ける**（2026-07-16）。原典側の丸めは実測で**全部 1千円**
  // （R5・R6 の伊賀市だけ。歳入総額 約500億に対して 0.000002%）。一方、科目を1つ取り違えれば
  // **百万〜億単位**でズレる。→ **1千円以内は原典の丸めとして warning、それを超えたら error で
  // derive を止める**（総務省の様式が変わったときに黙って画面へ出さない）。
  // §9c の「2サンプルから定数を決めて反証された」轍を踏まないよう、**根拠は分布の実測**に置く:
  // 全1,741市町村×5年度で不一致は2件、どちらも1千円ちょうど。
  const ROUNDING_LIMIT = 1; // 千円
  const material = revMismatches.filter((m) => Math.abs(m.diff) > ROUNDING_LIMIT);
  if (revMismatches.length) {
    console.log(`  ⚠ Σ歳入科目≠歳入総額（表示は科目和ベース）: ${revMismatches.length}`);
    for (const m of revMismatches) {
      console.log(`      ${m.label}: 差 ${m.diff > 0 ? "+" : ""}${m.diff.toLocaleString()}千円（総額 ${m.total.toLocaleString()}）`);
    }
  }
  if (material.length) {
    console.error("✗ 歳入科目の和が歳入総額と大きく食い違っています（原典の丸めでは説明できない差）:");
    for (const m of material) {
      console.error(`  - ${m.label}: 差 ${m.diff.toLocaleString()}千円。科目の取り違え・列ズレを疑うこと`);
    }
    throw new Error(`Σ歳入科目≠歳入総額（丸めで説明できない差）が ${material.length} 件`);
  }
}

// ============================================================================
// 類似市の当初予算（款別歳入歳出）→ src/client/lib/munibudgets.gen.ts
// 甲府の類似4市（豊川・山口・沼津・和泉）の当初予算を budget 階層として収録。
// 予算資料には主な事業・執行・評価が無いので款別歳入歳出＋前年当初比較のみ。
// 人口は総務省 R6 決算（最も近い全国統一値）。金額は億円。
// ============================================================================
{
  const BUDGET_SOURCES = [
    { srcId: "toyokawa-yosansho-r7", muniCode: "232076", muniName: "豊川市", prefName: "愛知県", isPref: false },
    { srcId: "yamaguchi-yosansho-r7", muniCode: "352039", muniName: "山口市", prefName: "山口県", isPref: false },
    { srcId: "numazu-yosansho-r7", muniCode: "222038", muniName: "沼津市", prefName: "静岡県", isPref: false },
    { srcId: "izumi-yosansho-r8", muniCode: "272191", muniName: "和泉市", prefName: "大阪府", isPref: false },
    // 山梨県内（甲府に次ぐ規模）
    { srcId: "fuefuki-yosansho-r8", muniCode: "192112", muniName: "笛吹市", prefName: "山梨県", isPref: false },
    { srcId: "fujiyoshida-yosansho-r8", muniCode: "192023", muniName: "富士吉田市", prefName: "山梨県", isPref: false },
    { srcId: "minami-alps-yosansho-r8", muniCode: "192082", muniName: "南アルプス市", prefName: "山梨県", isPref: false },
    { srcId: "hokuto-yosansho-r8", muniCode: "192091", muniName: "北杜市", prefName: "山梨県", isPref: false },
    { srcId: "otsuki-yosansho-r8", muniCode: "192066", muniName: "大月市", prefName: "山梨県", isPref: false },
    { srcId: "tsuru-yosansho-r8", muniCode: "192040", muniName: "都留市", prefName: "山梨県", isPref: false },
    { srcId: "koshu-yosansho-r8", muniCode: "192139", muniName: "甲州市", prefName: "山梨県", isPref: false },
    // 県内初の「町」（2026-07-15）。町村は資料が薄い想定だったが市と同型の様式だった
    { srcId: "fujikawaguchiko-yosansho-r8", muniCode: "194301", muniName: "富士河口湖町", prefName: "山梨県", isPref: false },
    // 政令指定都市（人口の多い順に整備。2026-07-15）。款は局ベースの独自体系で、
    // 同じ市の decision 階層（総務省決算の目的別）とは款名が一致しない — registry のコメント参照。
    // **同じ muniCode を複数年度ぶん並べる**（新しい順に整列されて MUNI_BUDGET_YEARS になる）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `yokohama-yosansho-${fy}`, muniCode: "141003", muniName: "横浜市", prefName: "神奈川県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nagoya-yosansho-${fy}`, muniCode: "231002", muniName: "名古屋市", prefName: "愛知県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sapporo-yosansetsumeisho-${fy}`, muniCode: "011002", muniName: "札幌市", prefName: "北海道", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `fukuoka-yosansho-${fy}`, muniCode: "401307", muniName: "福岡市", prefName: "福岡県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kawasaki-yosansho-${fy}`, muniCode: "141305", muniName: "川崎市", prefName: "神奈川県", isPref: false,
    })),
    // 大阪市は事項別明細書（款項目が同一表・182p）で他市と様式が違う → 専用パーサ osaka-yosansho
    { srcId: "osaka-yosansho-r8", muniCode: "271004", muniName: "大阪市", prefName: "大阪府", isPref: false },
    // さいたま市は横浜型（総括が単独ページ）で共通パーサに乗る。**款が総務省の目的別13款と一致**する初の政令市
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `saitama-yosansho-${fy}`, muniCode: "111007", muniName: "さいたま市", prefName: "埼玉県", isPref: false,
    })),
    // 広島市は予算書本体がスキャンOCR で使えず、財政局の記者発表資料「資料1」を使う → 専用パーサ
    { srcId: "hiroshima-yosansho-r8", muniCode: "341002", muniName: "広島市", prefName: "広島県", isPref: false },
    // 神戸市は**アプリ内で初のオープンライセンス自治体**（政府標準利用規約2.0準拠・CC BY 互換・商用可）
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `kobe-yosansho-${fy}`, muniCode: "281000", muniName: "神戸市", prefName: "兵庫県", isPref: false,
    })),
    // 京都市は**款体系が R2〜R8 で完全不変**（款番号も款名も同一）＝政令市では珍しく経年で款が繋がる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kyoto-yosansho-${fy}`, muniCode: "261009", muniName: "京都市", prefName: "京都府", isPref: false,
    })),
    // 北九州市。R2 だけ歳入26款で R3 以降は款番号が1つ繰下がる（福岡と同型）＝経年は款名で突合する
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kitakyushu-yosansho-${fy}`, muniCode: "401005", muniName: "北九州市", prefName: "福岡県", isPref: false,
    })),
    // 千葉市。**歳出が総務省の目的別13款と一致**（さいたまに次ぐ2例目）。
    // 過年度は R8 の次が R4 まで飛ぶ（間の年度は原典がスキャン/OCR/款名欠落。docs §8k）
    ...(["r8", "r4"] as const).map((fy) => ({
      srcId: `chiba-yosansho-${fy}`, muniCode: "121002", muniName: "千葉市", prefName: "千葉県", isPref: false,
    })),
    // 仙台市は born-digital が R8 が初年度（R2〜R7 の説明書は総括ページがスキャン）＝単年
    { srcId: "sendai-yosansho-r8", muniCode: "041009", muniName: "仙台市", prefName: "宮城県", isPref: false },
    // 堺市は予算書本体が全文アウトライン化でテキスト層が無く、議案書の予算案説明資料に逃げる（広島型）。
    // **歳出13款が総務省の目的別と一致**（さいたま・千葉に次ぐ3例目）。R5・R4 は原典が壊れていて飛ぶ
    ...(["r8", "r7", "r6", "r3", "r2"] as const).map((fy) => ({
      srcId: `sakai-yosansho-${fy}`, muniCode: "271403", muniName: "堺市", prefName: "大阪府", isPref: false,
    })),
    // 新潟市は**歳入が見開き2ページ型**（款名 p.8 / 金額 p.9）＝第5の型。docs §9e
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `niigata-yosansho-${fy}`, muniCode: "151009", muniName: "新潟市", prefName: "新潟県", isPref: false,
    })),
    // 浜松市。**印字 = 物理（オフセット0）**という政令市では珍しい様式。歳出13款が総務省の目的別と一致
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `hamamatsu-yosansho-${fy}`, muniCode: "221309", muniName: "浜松市", prefName: "静岡県", isPref: false,
    })),
    // 相模原市は予算書本体が面付けで表が2回描かれるため、主要施策説明書の款項別に逃げる。docs §8p
    { srcId: "sagamihara-yosansho-r8", muniCode: "141500", muniName: "相模原市", prefName: "神奈川県", isPref: false },
    // 熊本市は説明書（10.3MB・ヘッダ汚染あり）ではなく概要（1.8MB）を採る。docs §8q
    { srcId: "kumamoto-yosansho-r8", muniCode: "431001", muniName: "熊本市", prefName: "熊本県", isPref: false },
    // 岡山市は事項別明細書の総括が歳出にしか無く概要に逃げる。**款番号が1つも無い表**。docs §8r
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `okayama-yosangaiyou-${fy}`, muniCode: "331007", muniName: "岡山市", prefName: "岡山県", isPref: false,
    })),
    // 静岡市は**左右2側が同一ページ（横並び）**＝第6の型。docs §9j。これで全20政令市が揃う
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `shizuoka-yosansho-${fy}`, muniCode: "221007", muniName: "静岡市", prefName: "静岡県", isPref: false,
    })),
    // 東京特別区（2026-07-16）。**23区に統一様式は無く款体系が区ごとに全部違う** — registry の
    // 特別区の節を参照。制度由来の共通点（消防費なし・地方交付税なし・特別区交付金・特別区税/債）
    // だけが揃い、それ以外の款は各区が独自に立てている。
    // **R3 は欠番**（pdftotext -layout が款を静かに落とす。registry のコメント参照）。
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `chiyoda-yosansho-${fy}`, muniCode: "131016", muniName: "千代田区", prefName: "東京都", isPref: false,
    })),
    // 大田区は**特別区で最も素直**（同一 parserOptions・款体系も不変）。registry のコメント参照。
    // **H26〜H20 を追加した（2026-07-17）**ので、収録は **H20〜R8 の18年度・穴は H27 だけ**
    // （H27 は ToUnicode 全面欠落で `-raw` でも救えない）。**全自治体で文京の22年に次ぐ2位**。
    // ⚠ **H26・H25 は `textSource: "raw"` で読んでいる** — `-layout` が款9 の重なりを解こうとして
    //   行を割りカンマを剥離するため（Σ が巨大にずれて error で止まる＝静かには壊れない）。
    //   registry のコメントに実測を残した。**モードは Σ で選ばず人が原典と突き合わせて決める**。
    // ⚠ H24〜H20 は資料の単位が違い（概要冊子まるごと）、**H22 以前は款別表の側の順序が逆**。
    //   側の取り違えは **Σ では絶対に捕まらない**（歳入合計 = 歳出合計 は定義上いつも成立する）ので、
    //   **款名を全件目視して確認済み**（5年度×32款＝160件・§10f／registry のコメント）。
    // ⚠ **H20 の歳出款8 は `清掃費`**（H21 以降の `環境清掃費` への改称前。金額一致で確認済み）。
    //   款名で年度をまたいで結合すると H20 だけ繋がらないが、**別款ではなく改称**。
    // H27 は #159 の decodeGarble で復号収録（別冊「予算編成の概要」）＝ H20〜R8 の全year
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27",
      "h26", "h25", "h24", "h23", "h22", "h21", "h20"] as const).map((fy) => ({
      srcId: `ota-yosansho-${fy}`, muniCode: "131113", muniName: "大田区", prefName: "東京都", isPref: false,
    })),
    // 中央区は**款別専用の6ページ PDF**（歳入歳出が同一ページ＝samePage）。**見出しを強くすると
    // 款名が静かに壊れる**という逆説がある（registry のコメント参照）。
    // **H29 が現行サイトの最古**＝これで10年度が打ち止め。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `chuo-sokatsuhyo-${fy}`, muniCode: "131024", muniName: "中央区", prefName: "東京都", isPref: false,
    })),
    // 目黒区はプレス発表資料の資料編。**R2 の廃止税目行に kanNoless が必須**（無いと前年度 Σ が
    // 137,800千円 静かに欠ける＝validate は当年度しか見ない）。registry のコメント参照。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `meguro-yosanan-${fy}`, muniCode: "131105", muniName: "目黒区", prefName: "東京都", isPref: false,
    })),
    // 江東区は歳出見出しが特会と区別できず**誤ページでも Σ差0 で静かに通る**（守るのは validate の
    // 歳入合計=歳出合計 のみ）。歳入は強い見出しの代償で款1 が汚染されるため HeaderExtra が要る。
    // **H28 が現行サイトの最古**＝これで11年度が打ち止め（H29・H28 はパス基底ごと違う）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `koto-yosangaiyou-${fy}`, muniCode: "131083", muniName: "江東区", prefName: "東京都", isPref: false,
    })),
    // 渋谷区は**R4 以前が収録不可**（PDF が無く HTML は前年度列を持たない）。特別区債の款が全年度で
    // 存在しない起債ゼロ型で、特別区交付金 1.6% は23区最低クラス。
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `shibuya-yosansho-${fy}`, muniCode: "131130", muniName: "渋谷区", prefName: "東京都", isPref: false,
    })),
    // 葛飾区は**職員費の款を持つ**（全款から人件費を抜く名古屋・札幌型）ので他自治体と款別を
    // 直接比較すると民生費等が過小に見える。R8 は第6の折返し型で kanNoless が要る
    // （**H 年度では kanNoless は no-op**＝R8 の折返し型が無い）。H29・H28 は 2026-07-22 追加（#136）。
    // H28 の前年度列（H27）まで到達。H27 以前は年度インデックスに記事が無い＝現存最古で打ち止め。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `katsushika-yosangaiyou-${fy}`, muniCode: "131229", muniName: "葛飾区", prefName: "東京都", isPref: false,
    })),
    // 新宿区（2026-07-17 追加）。「予算の概要」巻末の款別総括表。**H13〜R8 の26年度＝収録中で最長**
    // （文京の22年を抜いた）。年度間クロスチェーンは H13→R8 の25リンクすべて一致。
    // ⚠ **同一 PDF の「補正後予算比較」表を誤読しても Σ・validate・前年度基準のどれも捕まえない**
    //   （款名までクリーンに通る）。**年度間クロスチェーンだけが検出する**＝ページを動かしたら必ず見る。
    // ⚠ **R5 は「予算(案)の概要」を採っている**（年度一覧のファイルはスキャン＋OCR で値が壊れる）。
    //   registry 初の(案)版。**R5案 当年度 = R6 前年度**で議会修正が無いことを確認済み。
    // ⚠ **発行元がファイルへの直リンクを断っている**（`noDeepLink`）ので、エビデンスの振替先は
    //   ランディングページ。registry 初のケース。
    // 歳出は R1〜R8 で13款不変・**職員費の款は無い**（人件費配賦型）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26", "h25",
      "h24", "h23", "h22", "h21", "h20", "h19", "h18", "h17", "h16", "h15", "h14",
      "h13"] as const).map((fy) => ({
      srcId: `shinjuku-yosan-gaiyou-${fy}`, muniCode: "131041", muniName: "新宿区", prefName: "東京都", isPref: false,
    })),
    // 北区（2026-07-17 追加）。「予算の概要」。**H24〜R8 の15年度が現存し 14年度を収録**
    // （**H25 のみ収録不可** — `-layout` は款15 を2行に割り `-raw` は合計行で throw する＝
    // どちらも大声で落ちる。大田 H26 と違い `textSource` では救えない。registry のコメント参照）。
    // **H24〜H28 は現行サイトから消滅し Wayback から回収**。
    // ⚠ **CropX が要るのは R6〜R8 だけ**（R5 以前は縦書き章タブが無く、付けると表を切り落とす）。
    // ⚠ **款名の脚注マーカー `(ｱ)`** を落とすためパーサに1行足した（H24・H26〜R5 の12年度で汚れ、
    //   **R6〜R8 はクリーン**＝新しい年度ほど汚れるわけではない）。放置すると **Σ も validate も
    //   止めないまま画面に `特別区債(ｱ)` と出て、年度間の款名結合が R5↔R6 で切れる**。
    // 歳出11款は H24〜R8 で完全不変・**職員費の款は無い**（大田・文京と同じ人件費配賦型）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26",
      "h24"] as const).map((fy) => ({
      srcId: `kita-yosangaiyou-${fy}`, muniCode: "131172", muniName: "北区", prefName: "東京都", isPref: false,
    })),
    // 台東区（2026-07-18 追加）。「予算案のポイント」【資料3】款別予算額。**H27〜R8 の12年度**。
    // R2・H31・H27 は歳入歳出が別ファイル＝revenueFile/expenditureFile（2026-07-23 #125）で収録。**職員費・公債費の款が無い**（公債費は諸支出金に内包）。
    // 収録に 2026-07-17 の3改修（款番号と款名下段の同一行折返し／象徴計上の1千円の款番号誤読／
    // `ほぼ皆増`）が要る＝registry のコメント参照。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27"] as const).map((fy) => ({
      srcId: `taito-kanbetsu-${fy}`, muniCode: "131067", muniName: "台東区", prefName: "東京都", isPref: false,
    })),
    // 港区（2026-07-18 追加）。「予算概要」歳入予算内訳表・目的別歳出予算内訳表。**R8〜H19 の20年度が
    // 現存し 18年度を収録**（**H29・H24 は震災復興基金の括弧2段組で合計行が割れ収録不可**）。
    // ⚠ **R2・R4・H31 の款名が部首の異体字（Kangxi）で壊れる**＝このリポジトリ初の「文字レベルで
    //   静かに壊れる」型。パーサの `fixRadicals` で正規化し、validate に部首レンジのゲートも追加した。
    // ⚠ 概要 PDF の歳入は特別区債=0 を行ごと省略するので歳入19款（区の CC BY CSV は20款）。
    // **職員費の款は無い**（配賦型）。特別区交付金 0.7%・公債費 R8 で1千円の実質不交付区（§10）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h28", "h27", "h26", "h25",
      "h23", "h22", "h21", "h20", "h19"] as const).map((fy) => ({
      srcId: `minato-yosangaiyou-${fy}`, muniCode: "131032", muniName: "港区", prefName: "東京都", isPref: false,
    })),
    // 荒川区（2026-07-23 追加・#125）。予算説明書の総括（ToUnicode 欠落を決定論的に復号・§10u）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `arakawa-setsumei-${fy}`, muniCode: "131181", muniName: "荒川区", prefName: "東京都", isPref: false,
    })),
    // 板橋区（2026-07-23 追加・#125）。予算の概要の総括表（百万円→千円へ ×1000 等価変換・
    // 他区より丸め粒度が粗い）。R4 以前はスキャン/ToUnicode 破損で収録不可。
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `itabashi-yosan-gaiyou-${fy}`, muniCode: "131199", muniName: "板橋区", prefName: "東京都", isPref: false,
    })),
    // 世田谷区（2026-07-23 追加・#125）。R8=見える化ボード CSV / H21〜R7=年度別当初予算データ XLS
    // （ID は setagaya-kanbetsu-* で統一＝資料またぎでもクロスチェーンが張れる・江戸川の前例）。
    // 23区で人口最大（92万）。職員費の款あり（歳出款9）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26",
      "h25", "h24", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `setagaya-kanbetsu-${fy}`, muniCode: "131121", muniName: "世田谷区", prefName: "東京都", isPref: false,
    })),
    // 品川区（2026-07-23 追加・#125）。事項別明細書の総括。R3 以前はスキャン/ToUnicode破損で不可。
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `shinagawa-kanbetsu-${fy}`, muniCode: "131091", muniName: "品川区", prefName: "東京都", isPref: false,
    })),
    // 練馬区（2026-07-23 追加・#125）。款別一覧表 XLSX（オープンデータ・CC BY）。H23〜R8 の16年。
    // 歳出は H23 が13款 → H24 の組織改正で現行14款（民生費・衛生費が無い独自体系）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26",
      "h25", "h24", "h23"] as const).map((fy) => ({
      srcId: `nerima-kanbetsu-${fy}`, muniCode: "131202", muniName: "練馬区", prefName: "東京都", isPref: false,
    })),
    // 墨田区（2026-07-22 追加・#124）。「予算概要」一般会計歳入歳出予算（案）款別表。
    // **H17〜R8 の22年が現行サイトに全year現存＝全year収録**（新宿26年に次ぐ2位タイ規模）。
    // **職員費の款は無い**（配賦型）。⚠ 歳出款7 は H19 以前「産業経済費」→ H20 から「産業観光費」
    // （H20 に旧名の括弧行 `(産業経済費)` が前年度額つきで残る＝年度をまたぐ款名結合の断層）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26",
      "h25", "h24", "h23", "h22", "h21", "h20", "h19", "h18", "h17"] as const).map((fy) => ({
      srcId: `sumida-yosangaiyou-${fy}`, muniCode: "131075", muniName: "墨田区", prefName: "東京都", isPref: false,
    })),
    // 豊島区は **R7 のみ欠番**（OCR レイヤの重なりで数字が壊れる＝非決定論的で修復不可）。
    // R4・R2・H31〜H29 は #159 の decodeGarble で復号収録。R2 以前は Wayback から回収。
    ...(["r8", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `toshima-yosansho-${fy}`, muniCode: "131164", muniName: "豊島区", prefName: "東京都", isPref: false,
    })),
    // 足立区。あらまし総括表。**R5〜R8 は列順が [前年度, 当年度] に反転**（prevColumnFirst・
    // registry のコメント参照）。R2〜R8 の当初チェーンは款単位で全件一致を確認済み
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `adachi-yosansho-${fy}`, muniCode: "131211", muniName: "足立区", prefName: "東京都", isPref: false,
    })),
    // 中野区。当初予算の概要。**表の直前の散文段落が款1 を汚す**ので HeaderExtra "[、。]" で
    // 句読点を含む行を落としている（R2 で実測・Σ差0 で素通りする型。registry のコメント参照）。
    // R2〜R8 の当初チェーンは6リンク×33款で全件一致（列順は標準・足立型の反転なし）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nakano-yosangaiyou-${fy}`, muniCode: "131148", muniName: "中野区", prefName: "東京都", isPref: false,
    })),
    // 江戸川区。**特別区で最長の12年**（H27〜R8）。R3・R2・H30 だけ資料が別（予算書が
    // ToUnicode 欠落で読めず「主要施策の概要」へ迂回・registry のコメント参照）。
    // 歳出18款で特別区最多。R3 で15款→18款に再編（ＳＤＧｓ推進費・産業経済費が皆増、
    // 新庁舎・大型施設建設推進費→新庁舎・施設整備費に改称＝前年列 95,297 が一致）。
    // H27→R8 の11リンクは総額・款単位とも全件一致
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `edogawa-yosansho-${fy}`, muniCode: "131237", muniName: "江戸川区", prefName: "東京都", isPref: false,
    })),
    ...(["r3", "r2"] as const).map((fy) => ({
      srcId: `edogawa-yoko-${fy}`, muniCode: "131237", muniName: "江戸川区", prefName: "東京都", isPref: false,
    })),
    { srcId: "edogawa-yosansho-h31", muniCode: "131237", muniName: "江戸川区", prefName: "東京都", isPref: false },
    { srcId: "edogawa-yoko-h30", muniCode: "131237", muniName: "江戸川区", prefName: "東京都", isPref: false },
    ...(["h29", "h28", "h27"] as const).map((fy) => ({
      srcId: `edogawa-yosansho-${fy}`, muniCode: "131237", muniName: "江戸川区", prefName: "東京都", isPref: false,
    })),
    // 杉並区。**職員費の款を持つ**（歳出の18.5%）＝他自治体と款別を直接比較すると民生費等が
    // 過小に見える（千代田・世田谷・葛飾と同じ。§10）。R3・R2 だけ資料が別
    // （予算書がスキャンのため区政経営計画書へ迂回・registry のコメント参照）。
    // R2〜R8 の当初チェーンは6リンク×31款で全件一致（経路をまたぐ R4→R3 も含む）
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `suginami-yosansho-${fy}`, muniCode: "131156", muniName: "杉並区", prefName: "東京都", isPref: false,
    })),
    ...(["r3", "r2"] as const).map((fy) => ({
      srcId: `suginami-keikakusho-${fy}`, muniCode: "131156", muniName: "杉並区", prefName: "東京都", isPref: false,
    })),
    // 文京区。**収録中で最長の22年（H16〜R8）**＝江戸川の12年を超えて年度の深さが全自治体トップ。
    // 当初予算総括表。**歳出12款は23年間まったく不変**・**職員費の款は無い**（人件費配賦型なので
    // 他自治体と款別を直接比較できる）。H25 のみスキャン＋OCR で parse が throw するため**欠番**
    // （§9l の年度チェーンは連続年度のみなので H26→H24 は自動で飛ぶ）。
    // ⚠ **前年度列は歳出だけ「組み替え後」**（発行元が前年を当年度の款体系へ restate する）。
    //   21リンク中8リンクの歳出が款レベルで動くが**Σ差は必ず0**＝款間の付替え。歳入は21リンク
    //   すべて款単位で一致。年度チェーンは総額しか見ないので素通りする（registry のコメント参照）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26",
      "h24", "h23", "h22", "h21", "h20", "h19", "h18", "h17", "h16"] as const).map((fy) => ({
      srcId: `bunkyo-sokatsuhyo-${fy}`, muniCode: "131059", muniName: "文京区", prefName: "東京都", isPref: false,
    })),
    // 都道府県エンティティ（県全体）。人口は県内市町村の合計から算出
    { srcId: "yamanashi-yosansho-r8", muniCode: "190004", muniName: "山梨県", prefName: "山梨県", isPref: true },
    // 2026-07-25 追加の4府県。団体コードは総務省「全国地方公共団体コード」の原本 Excel から引いた。
    // ⚠ 県庁所在市と取り違えない（埼玉県 110001 ≠ さいたま市 111007 / 千葉県 120006 ≠ 千葉市 121002 /
    //   神奈川県 140007 ≠ 横浜市 141003 / 大阪府 270008 ≠ 大阪市 271004）。
    { srcId: "saitama-ken-yosangaiyou-r8", muniCode: "110001", muniName: "埼玉県", prefName: "埼玉県", isPref: true },
    { srcId: "chiba-ken-yosansho-r8", muniCode: "120006", muniName: "千葉県", prefName: "千葉県", isPref: true },
    { srcId: "kanagawa-yosansho-r8", muniCode: "140007", muniName: "神奈川県", prefName: "神奈川県", isPref: true },
    { srcId: "osakafu-aramashi-yosan-r8", muniCode: "270008", muniName: "大阪府", prefName: "大阪府", isPref: true },
    // 2026-07-25 の第2弾。⚠ 道県と道府県庁所在市を取り違えない
    //（北海道 010006 ≠ 札幌市 011002 / 広島県 340006 ≠ 広島市 341002 /
    //  福岡県 400009 ≠ 福岡市 401307 ≠ 北九州市 401005）。
    { srcId: "hokkaido-yosan-gaiyou-r8", muniCode: "010006", muniName: "北海道", prefName: "北海道", isPref: true },
    { srcId: "hiroshimaken-yosansho-r8", muniCode: "340006", muniName: "広島県", prefName: "広島県", isPref: true },
    { srcId: "fukuoka-ken-yosangaiyou-r8", muniCode: "400009", muniName: "福岡県", prefName: "福岡県", isPref: true },
    // 2026-07-25 の第3弾。⚠ 県と県庁所在市を取り違えない
    //（宮城県 040002 ≠ 仙台市 041009 / 新潟県 150002 ≠ 新潟市 151009 / 熊本県 430005 ≠ 熊本市 431001）。
    { srcId: "miyagiken-yosansho-r8", muniCode: "040002", muniName: "宮城県", prefName: "宮城県", isPref: true },
    { srcId: "niigataken-yosan-keisu-r8", muniCode: "150002", muniName: "新潟県", prefName: "新潟県", isPref: true },
    { srcId: "kumamoto-ken-setsumeisho-r8", muniCode: "430005", muniName: "熊本県", prefName: "熊本県", isPref: true },
    // 2026-07-25 第4弾（パーサ一般化で乗った2府県）。⚠ 京都府 260002 ≠ 京都市 261009 /
    //    岡山県 330001 ≠ 岡山市 331007。
    { srcId: "kyotofu-tosho-gaiyou-r8", muniCode: "260002", muniName: "京都府", prefName: "京都府", isPref: true },
    { srcId: "okayamaken-yosan-setsumei-r8", muniCode: "330001", muniName: "岡山県", prefName: "岡山県", isPref: true },
    // 2026-07-25 第5弾。⚠ 県と県内市を取り違えない（栃木県 090000 ≠ 宇都宮市 092011 /
    //    岐阜県 210005 ≠ 岐阜市 212016 / 長野県 200000 ≠ 長野市 202011 / 山口県 350001 ≠ 山口市 352039）。
    { srcId: "ibaraki-ken-yosan-kankeisiryou-r8", muniCode: "080004", muniName: "茨城県", prefName: "茨城県", isPref: true },
    { srcId: "tochigiken-yosansho-r8", muniCode: "090000", muniName: "栃木県", prefName: "栃木県", isPref: true },
    { srcId: "naganoken-yosansho-r8", muniCode: "200000", muniName: "長野県", prefName: "長野県", isPref: true },
    { srcId: "gifuken-yosan-keisu-r8", muniCode: "210005", muniName: "岐阜県", prefName: "岐阜県", isPref: true },
    { srcId: "yamaguchiken-yosan-setsumeisho-r8", muniCode: "350001", muniName: "山口県", prefName: "山口県", isPref: true },
    // 2026-07-26 第6弾。⚠ 県と県内市を取り違えない（群馬県 100005 ≠ 前橋市 102016 /
    //    福島県 070009 ≠ 福島市 072010 / 三重県 240001 ≠ 津市 242012 / 鹿児島県 460001 ≠ 鹿児島市 462012）。
    //    ⚠ 三重は当初 R7 だけだった（R8 が ToUnicode 欠落で読めなかったため）が、2026-07-26 に
    //      復号を直して **R8 を追加した**（＝三重だけ2年度。年度切替が効く。registry のコメント参照）。
    { srcId: "fukushimaken-yosansho-r8", muniCode: "070009", muniName: "福島県", prefName: "福島県", isPref: true },
    { srcId: "gunma-ken-yosansetsumeisho-r8", muniCode: "100005", muniName: "群馬県", prefName: "群馬県", isPref: true },
    { srcId: "mieken-yosan-gaiyou-r8", muniCode: "240001", muniName: "三重県", prefName: "三重県", isPref: true },
    { srcId: "mieken-yosan-gaiyou-r7", muniCode: "240001", muniName: "三重県", prefName: "三重県", isPref: true },
    { srcId: "kagoshima-ken-yosan-setsumeisho-r8", muniCode: "460001", muniName: "鹿児島県", prefName: "鹿児島県", isPref: true },
    // 2026-07-26 第7弾（パーサ改修で開いた県）。⚠ **愛知県 230006 ≠ 名古屋市 231002**。
    { srcId: "aichi-yosan-setsumeisho-r8", muniCode: "230006", muniName: "愛知県", prefName: "愛知県", isPref: true },
    // 2026-07-27 第8弾。⚠ 県と県庁所在市を取り違えない（滋賀県 250007 ≠ 大津市 252018 /
    //    奈良県 290009 ≠ 奈良市 292010 / 愛媛県 380008 ≠ 松山市 382019 /
    //    長崎県 420000 ≠ 長崎市 422011 / 青森県 020001 ≠ 青森市 022012）。
    //    ⚠ **偵察は愛媛を 380003 と報告してきたが実在しないコード**だった（正 380008）。
    { srcId: "shiga-ken-yosansho-r8", muniCode: "250007", muniName: "滋賀県", prefName: "滋賀県", isPref: true },
    { srcId: "nara-ken-yosansetsumeisho-r8", muniCode: "290009", muniName: "奈良県", prefName: "奈良県", isPref: true },
    { srcId: "ehime-yosan-setsumeisho-r8", muniCode: "380008", muniName: "愛媛県", prefName: "愛媛県", isPref: true },
    { srcId: "nagasaki-ken-yosan-setsumeisho-r8", muniCode: "420000", muniName: "長崎県", prefName: "長崎県", isPref: true },
    { srcId: "aomori-ken-kanbetsu-sokatsu-r8", muniCode: "020001", muniName: "青森県", prefName: "青森県", isPref: true },
    // 2026-07-27 第9弾。⚠ 県と県庁所在市を取り違えない（岩手県 030007 ≠ 盛岡市 032018 /
    //    石川県 170003 ≠ 金沢市 172014 / 大分県 440001 ≠ 大分市 442011 / 宮崎県 450006 ≠ 宮崎市 452017）。
    //    ⚠ **収録指示側が岩手を 030001 と書いていたが原本に存在しないコード**だった（偵察が訂正）。
    //    ⚠ **山形は収録不可**（当初予算の款別資料が全年度スキャン＋OCR で款名・金額とも破損）。
    { srcId: "iwate-ken-yosan-setsumeisho-r8", muniCode: "030007", muniName: "岩手県", prefName: "岩手県", isPref: true },
    { srcId: "ishikawa-ken-yosan-gaiyou-r8", muniCode: "170003", muniName: "石川県", prefName: "石川県", isPref: true },
    { srcId: "oita-ken-zaisei-jokyo-r8", muniCode: "440001", muniName: "大分県", prefName: "大分県", isPref: true },
    { srcId: "miyazaki-ken-yosansho-r8", muniCode: "450006", muniName: "宮崎県", prefName: "宮崎県", isPref: true },
    // 2026-07-27 第10弾。⚠ 県と県庁所在市を取り違えない（富山県 160008 ≠ 富山市 162019 /
    //    香川県 370002 ≠ 高松市 372013 / 秋田県 050008 ≠ 秋田市 052019 /
    //    和歌山県 300004 ≠ 和歌山市 302015 / 佐賀県 410004 ≠ 佐賀市 412015）。
    //    ⚠ **和歌山は県エンティティで2件目の `open`**（愛媛はカタログ登載だが、和歌山は
    //    サイト全体の利用規約が CC BY 互換＝根拠の系統が違う）。
    { srcId: "toyama-ken-yosansetsumeisho-r8", muniCode: "160008", muniName: "富山県", prefName: "富山県", isPref: true },
    { srcId: "kagawa-ken-zaisei-jijo-r8", muniCode: "370002", muniName: "香川県", prefName: "香川県", isPref: true },
    { srcId: "akita-ken-setsumeisho-sokatsu-r8", muniCode: "050008", muniName: "秋田県", prefName: "秋田県", isPref: true },
    { srcId: "wakayama-ken-yosan-shiryo-r8", muniCode: "300004", muniName: "和歌山県", prefName: "和歌山県", isPref: true },
    { srcId: "saga-ken-yosansho-r8", muniCode: "410004", muniName: "佐賀県", prefName: "佐賀県", isPref: true },
    // 2026-07-30 第11弾＝**47都道府県の一巡**（収録可能な44県がこれで揃う。収録不可は兵庫・沖縄・山形）。
    //    ⚠ 県と県庁所在市を取り違えない（福井県 180009 ≠ 福井市 182010 / 徳島県 360007 ≠ 徳島市 362018 /
    //    高知県 390003 ≠ 高知市 392014 / 島根県 320005 ≠ 松江市 322016 / 鳥取県 310000 ≠ 鳥取市 312011）。
    //    ⚠ **団体コードは総務省の原本 Excel から実引きした**（偵察の申告・依頼側のプロンプトを根拠にしない）。
    //    ⚠ **鳥取は 310000**（チェックディジットの算式では 310001 になるが原本が 310000）。
    //    ⚠ 高知は歳出18款で**款体系が標準でない**（危機管理費・産業振興推進費 等）。標準款へ寄せない。
    { srcId: "fukui-ken-yosansho-r8", muniCode: "180009", muniName: "福井県", prefName: "福井県", isPref: true },
    { srcId: "tokushima-ken-yosan-gaiyou-keisu-r8", muniCode: "360007", muniName: "徳島県", prefName: "徳島県", isPref: true },
    { srcId: "kochi-ken-zaisei-jokyo-r8", muniCode: "390003", muniName: "高知県", prefName: "高知県", isPref: true },
    { srcId: "shimane-ken-kamoku-mokuteki-r8", muniCode: "320005", muniName: "島根県", prefName: "島根県", isPref: true },
    { srcId: "tottori-ken-yosan-gaiyou-bunseki-r8", muniCode: "310000", muniName: "鳥取県", prefName: "鳥取県", isPref: true },
    { srcId: "shizuokaken-zaisei-aramashi-157", muniCode: "220001", muniName: "静岡県", prefName: "静岡県", isPref: true },
    // 東京都（2026-07-22 追加・#124）。予算概要CSV（H29〜R8 の10年）。PDF は全経路パース不可のため
    // CSV が唯一の経路（registry のコメント参照）。歳出は款再編が2回（R5・R6）あり款名結合が切れる。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `tokyo-yosangaiyou-${fy}`, muniCode: "130001", muniName: "東京都", prefName: "東京都", isPref: true,
    })),
    // 中核市（人口の多い順に整備。2026-08-22・loop.md の第1巡）。候補は「総務省の人口 × BUDGET_SOURCES に無い
    // 団体」で機械的に出した（船橋・川口・鹿児島市・八王子・姫路）。款体系は総務省の目的別標準。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1"] as const).map((fy) => ({
      srcId: `funabashi-yosan-gaiyou-${fy}`, muniCode: "122041", muniName: "船橋市", prefName: "千葉県", isPref: false,
    })),
    // 川口は R8 のみ（R3〜R7 は非テキスト PDF・unrecordable.ts）
    { srcId: "kawaguchi-yosan-gaiyou-r8", muniCode: "112038", muniName: "川口市", prefName: "埼玉県", isPref: false },
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `kagoshima-yosangaiyo-${fy}`, muniCode: "462012", muniName: "鹿児島市", prefName: "鹿児島県", isPref: false,
    })),
    // 八王子は R8〜R4（R3・R2 はパーサ改修待ち・H31 以前は年度延伸なので未収録。registry のコメント参照）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `hachioji-yosan-gaiyou-${fy}`, muniCode: "132012", muniName: "八王子市", prefName: "東京都", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `himeji-yosan-soukatsu-${fy}`, muniCode: "282014", muniName: "姫路市", prefName: "兵庫県", isPref: false,
    })),
    // 中核市 第2弾（2026-08-22・loop.md の第2巡）。宇都宮・西宮は偵察したがパーサ改修が要るため未収録（unrecordable.ts）。
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: fy === "r8" ? "matsudo-yosan-setsumeisho-r8" : `matsudo-sankouhyou-${fy}`,
      muniCode: "122076", muniName: "松戸市", prefName: "千葉県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `matsuyama-yosan-soukatsu-${fy}`, muniCode: "382019", muniName: "松山市", prefName: "愛媛県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `ichikawa-yosansho-${fy}`, muniCode: "122033", muniName: "市川市", prefName: "千葉県", isPref: false,
    })),
    // 第2弾の見送り2市（#226 のパーサ改修後・2026-08-22 第3巡）。宇都宮 R3 は案のため未収録（unrecordable.ts）
    ...(["r8", "r7", "r6", "r5", "r4", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `utsunomiya-yosan-taikou-${fy}`, muniCode: "092011", muniName: "宇都宮市", prefName: "栃木県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29"] as const).map((fy) => ({
      srcId: `nishinomiya-yosan-gaiyou-${fy}`, muniCode: "282049", muniName: "西宮市", prefName: "兵庫県", isPref: false,
    })),
    // 中核市 第3弾（2026-08-22・loop.md の第4巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `oita-shi-yosan-gaiyou-${fy}`, muniCode: "442011", muniName: "大分市", prefName: "大分県", isPref: false,
    })),
    // 東大阪は R8・R7 のみ（R6〜R4 は総括が図形化・R3 以前は款別資料なし＝unrecordable.ts）
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `higashiosaka-yosansho-${fy}`, muniCode: "272272", muniName: "東大阪市", prefName: "大阪府", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `amagasaki-yosan-gaiyou-${fy}`, muniCode: "282022", muniName: "尼崎市", prefName: "兵庫県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30"] as const).map((fy) => ({
      srcId: `fukuyama-yosan-sankou-${fy}`, muniCode: "342076", muniName: "福山市", prefName: "広島県", isPref: false,
    })),
    // 倉敷は R7 を除く（歳出が3行組み＝unrecordable.ts）
    ...(["r8", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `kurashiki-yosan-gaiyo-${fy}`, muniCode: "332020", muniName: "倉敷市", prefName: "岡山県", isPref: false,
    })),
    // 中核市 第4弾（2026-08-23・loop.md の第5巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `takamatsu-yosan-gaiyou-${fy}`, muniCode: "372013", muniName: "高松市", prefName: "香川県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `fujisawa-yosansho-${fy}`, muniCode: "142051", muniName: "藤沢市", prefName: "神奈川県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kashiwa-yosan-setsumeisho-${fy}`, muniCode: "122173", muniName: "柏市", prefName: "千葉県", isPref: false,
    })),
    // 町田は R8 のみ（R7 以前は3行組みで throw＝unrecordable.ts）
    { srcId: "machida-yosansho-r8", muniCode: "132098", muniName: "町田市", prefName: "東京都", isPref: false },
    // 金沢は R5・R4 のみ（R8〜R6・H30 はスキャン／図形化・あらましは歳入が集約12区分＝unrecordable.ts）
    ...(["r5", "r4"] as const).map((fy) => ({
      srcId: `kanazawa-yosangaiyou-${fy}`, muniCode: "172014", muniName: "金沢市", prefName: "石川県", isPref: false,
    })),
    // 中核市 第5弾（2026-08-23・loop.md の第6巡）
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `gifu-yosan-setsumeisho-${fy}`, muniCode: "212016", muniName: "岐阜市", prefName: "岐阜県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `miyazaki-shi-yosan-gaiyou-${fy}`, muniCode: "452017", muniName: "宮崎市", prefName: "宮崎県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27"] as const).map((fy) => ({
      srcId: `toyama-shi-giangaiyou-${fy}`, muniCode: "162019", muniName: "富山市", prefName: "富山県", isPref: false,
    })),
    // 豊中は R2 を除く（資料がスキャン＝unrecordable.ts）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r1", "h30"] as const).map((fy) => ({
      srcId: `toyonaka-kanbetsu-${fy}`, muniCode: "272035", muniName: "豊中市", prefName: "大阪府", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `toyota-yosan-kanren-${fy}`, muniCode: "232114", muniName: "豊田市", prefName: "愛知県", isPref: false,
    })),
    // 中核市 第6弾（2026-08-23・loop.md の第7巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `okazaki-yosan-gaiyou-${fy}`, muniCode: "232025", muniName: "岡崎市", prefName: "愛知県", isPref: false,
    })),
    // 長崎市は R6・R4・R3（化け）・H31（スキャン）・H28（鎖が割れる）を除く＝unrecordable.ts
    ...(["r8", "r7", "r5", "r2", "h30", "h29"] as const).map((fy) => ({
      srcId: `nagasaki-shi-yosansho-${fy}`, muniCode: "422011", muniName: "長崎市", prefName: "長崎県", isPref: false,
    })),
    // 枚方市は R6（スキャン＋OCR 破損）を除く。R4 以前は「概要」がウェブに無い＝鎖は R8↔R7 のみで R5 は孤立
    ...(["r8", "r7", "r5"] as const).map((fy) => ({
      srcId: `hirakata-yosan-gaiyou-${fy}`, muniCode: "272108", muniName: "枚方市", prefName: "大阪府", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `yokosuka-yosan-gaiyou-${fy}`, muniCode: "142018", muniName: "横須賀市", prefName: "神奈川県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `suita-yosangaku-${fy}`, muniCode: "272051", muniName: "吹田市", prefName: "大阪府", isPref: false,
    })),
    // 中核市 第7弾（2026-08-23・loop.md の第8巡）
    // ⚠ 長野市の H29 だけ srcId の接頭辞が違う（説明書に歳入総括が無く「概要」で代替した）ので鎖が2本に割れる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `nagano-shi-yosan-setsumeisho-${fy}`, muniCode: "202011", muniName: "長野市", prefName: "長野県", isPref: false,
    })),
    { srcId: "nagano-shi-yosan-gaiyou-h29", muniCode: "202011", muniName: "長野市", prefName: "長野県", isPref: false },
    // 一宮市は R4・R2・H31〜H27（化け）を除く＝鎖は R8-R7-R6-R5 / R3 / H26-H25 の3本
    ...(["r8", "r7", "r6", "r5", "r3", "h26", "h25"] as const).map((fy) => ({
      srcId: `ichinomiya-yosansho-${fy}`, muniCode: "232033", muniName: "一宮市", prefName: "愛知県", isPref: false,
    })),
    // 和歌山市は R6・R5・R4（スキャン）を除く。R3・R2 は年度ページが消えている
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `wakayama-shi-yosan-naiji-${fy}`, muniCode: "302015", muniName: "和歌山市", prefName: "和歌山県", isPref: false,
    })),
    // 豊橋市は R7・R4・R2（括弧書きが片側だけの行で款が落ちる＝パーサが throw する）と H31 以前（化け・スキャン）を除く
    ...(["r8", "r6", "r5", "r3"] as const).map((fy) => ({
      srcId: `toyohashi-yosan-gaiyou-${fy}`, muniCode: "232017", muniName: "豊橋市", prefName: "愛知県", isPref: false,
    })),
    // 高崎市は R4・H31・H28・H27・H24（アウトライン化）と H20（款別でない）を除く＝鎖は5本
    ...(["r8", "r7", "r6", "r5", "r3", "r2", "h30", "h29", "h26", "h25", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `takasaki-yosan-gaiyou-${fy}`, muniCode: "102024", muniName: "高崎市", prefName: "群馬県", isPref: false,
    })),
    // 中核市 第8弾（2026-08-23・loop.md の第9巡）
    // 奈良市は H31・H30・H29（議会修正前の案のまま）と H27 以前（4行組み）を除く。H28 は孤立するが値を2方向で裏取り済み
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h28"] as const).map((fy) => ({
      srcId: `nara-shi-yosanan-gaiyou-${fy}`, muniCode: "292010", muniName: "奈良市", prefName: "奈良県", isPref: false,
    })),
    // H31〜H29 は同じ年度ページの「分冊」（一括の概要は議会修正前の案のまま・分冊だけが修正後）
    ...(["h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `nara-shi-yosanan-bunsatsu-${fy}`, muniCode: "292010", muniName: "奈良市", prefName: "奈良県", isPref: false,
    })),
    // 川越市は R1 の参考資料が回収できず（発行元 404・Wayback も0件）鎖が R8〜R2 で切れる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kawagoe-yosan-sankou-${fy}`, muniCode: "112011", muniName: "川越市", prefName: "埼玉県", isPref: false,
    })),
    // 高槻市は R3 以前が発行元からも Wayback からも消えている。R5・R4 は Wayback の写しが唯一の経路
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `takatsuki-yosan-gaikyo-${fy}`, muniCode: "272078", muniName: "高槻市", prefName: "大阪府", isPref: false,
    })),
    // 大津市は R3 を落とした（前年度基準が確認できず、R2 が無いのでクロスチェーンも張られない）。R7 以前は WARP が唯一の写し
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `otsu-yosansho-${fy}`, muniCode: "252018", muniName: "大津市", prefName: "滋賀県", isPref: false,
    })),
    // 所沢市は R3（議会修正前の案）を除く。R6 以前は Wayback の写しが唯一の経路。R2 は読めるが孤立するので見送り
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `tokorozawa-yosan-siryo-${fy}`, muniCode: "112089", muniName: "所沢市", prefName: "埼玉県", isPref: false,
    })),
    // 中核市など 第9弾（2026-08-23・loop.md の第10巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `maebashi-yosan-siryou-${fy}`, muniCode: "102016", muniName: "前橋市", prefName: "群馬県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `asahikawa-yosanan-gaiyou-${fy}`, muniCode: "012041", muniName: "旭川市", prefName: "北海道", isPref: false,
    })),
    // 那覇市は R6（数字が抽出で消える）・R3/R2（アウトライン化）・H29 以前（前年度列なし）を除く＝鎖が2本に割れる
    ...(["r8", "r7", "r5", "r4"] as const).map((fy) => ({
      srcId: `naha-yosansho-${fy}`, muniCode: "472018", muniName: "那覇市", prefName: "沖縄県", isPref: false,
    })),
    // 越谷市。⚠ R7 だけ概要がアウトライン化で読めず「査定状況」PDF で代替＝接頭辞が違うのでクロスチェーンが2リンク外れる
    ...(["r8", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `koshigaya-yosan-gaiyou-${fy}`, muniCode: "112224", muniName: "越谷市", prefName: "埼玉県", isPref: false,
    })),
    { srcId: "koshigaya-yosan-satei-r7", muniCode: "112224", muniName: "越谷市", prefName: "埼玉県", isPref: false },
    // 郡山市。⚠ R8 の前年度は「R7 当初＋6月送り分」（R7 が骨格予算）なので prevBasis: 補正後
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `koriyama-yosan-gaiyou-${fy}`, muniCode: "072036", muniName: "郡山市", prefName: "福島県", isPref: false,
    })),
    // 中核市など 第10弾（2026-08-23・loop.md の第11巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `yokkaichi-yosan-siryou-${fy}`, muniCode: "242021", muniName: "四日市市", prefName: "三重県", isPref: false,
    })),
    // ⚠ H21 は原典の「歳入合計（前年度）」が誤植（記載 115,691,713 に対し Σ款 = 115,691,813）で、
    //    収録すると derive の年度間クロスチェーンが H20 との間で止まる（宇都宮 R3・長崎 H28 と同じ扱いで落とす）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h20"] as const).map((fy) => ({
      srcId: `iwaki-yosan-gaiyou-${fy}`, muniCode: "072044", muniName: "いわき市", prefName: "福島県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `akashi-yosansho-${fy}`, muniCode: "282031", muniName: "明石市", prefName: "兵庫県", isPref: false,
    })),
    // 高知市は R7・R6（3行組で throw）・R2（議会修正＋ガーブル）・H31（Σ 差0 のまま款名が化ける）を除く
    ...(["r8", "r5", "r4", "r3", "h30"] as const).map((fy) => ({
      srcId: `kochi-shi-yosan-gaiyou-${fy}`, muniCode: "392014", muniName: "高知市", prefName: "高知県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `kasugai-yosan-gaiyou-${fy}`, muniCode: "232068", muniName: "春日井市", prefName: "愛知県", isPref: false,
    })),
    // 中核市など 第11弾（2026-08-23・loop.md の第12巡）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `kurume-yosangaiyo-${fy}`, muniCode: "402036", muniName: "久留米市", prefName: "福岡県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `morioka-yosan-soukatsu-${fy}`, muniCode: "032018", muniName: "盛岡市", prefName: "岩手県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `akita-shi-yosansho-${fy}`, muniCode: "052019", muniName: "秋田市", prefName: "秋田県", isPref: false,
    })),
    // 津市は R5 以前が全ページ スキャン画像で収録不可
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `tsu-shi-yosansho-${fy}`, muniCode: "242012", muniName: "津市", prefName: "三重県", isPref: false,
    })),
    // 水戸市は R3（歳入が集約）・H31（テキスト層破損）が収録不可、H30 は Wayback から
    ...(["r8", "r7", "r6", "r5", "r4", "h30"] as const).map((fy) => ({
      srcId: `mito-yosangaiyou-${fy}`, muniCode: "082015", muniName: "水戸市", prefName: "茨城県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `fukushima-shi-yosan-gaiyou-${fy}`, muniCode: "072010", muniName: "福島市", prefName: "福島県", isPref: false,
    })),
    // 青森市は R2 以前が発行元から消えており魚拓にも無い（未確認なので unrecordable には載せていない）
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `aomorishi-yosan-gaiyou-${fy}`, muniCode: "022012", muniName: "青森市", prefName: "青森県", isPref: false,
    })),
    // 市原市は R1 が原典の呼称どおり西暦表記（2019年度）。H20 以前は未確認
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1",
      "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21",
    ] as const).map((fy) => ({
      srcId: `ichihara-yosansho-${fy}`, muniCode: "122190", muniName: "市原市", prefName: "千葉県", isPref: false,
    })),
    // 八尾市は R1 以前がスキャン画像、R2 は化け（どちらも自分で確かめていないので unrecordable には載せていない）
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `yao-yosansho-${fy}`, muniCode: "272124", muniName: "八尾市", prefName: "大阪府", isPref: false,
    })),
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2",
      "h31", "h30", "h29", "h28", "h27", "h26", "h25",
    ] as const).map((fy) => ({
      srcId: `tsukuba-yosan-gaiyou-${fy}`, muniCode: "082201", muniName: "つくば市", prefName: "茨城県", isPref: false,
    })),
    // 平塚市は R8（概要がスキャン画像・予算書は字化け）と H31〜H27（款別歳入の表が無い）が収録不可
    ...(["r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `hiratsuka-yosan-gaiyou-${fy}`, muniCode: "142034", muniName: "平塚市", prefName: "神奈川県", isPref: false,
    })),
    // 福井市は H31 以前が発行元から消えている（魚拓にはあるが横展開優先で今回は現行サイトの7年度）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `fukui-shi-yosan-gaiyou-${fy}`, muniCode: "182010", muniName: "福井市", prefName: "福井県", isPref: false,
    })),
    // 長岡市は R6 のみ収録不可（款別ページだけ文字が図形化）
    ...(["r8", "r7", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nagaoka-yosansho-${fy}`, muniCode: "152021", muniName: "長岡市", prefName: "新潟県", isPref: false,
    })),
    // 加古川市は H31〜H29 が収録不可（原本が消え、魚拓が全捕捉とも 1 MiB 打ち切り）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kakogawa-yosanpoint-${fy}`, muniCode: "282103", muniName: "加古川市", prefName: "兵庫県", isPref: false,
    })),
    // 徳島市は市長選が4年ごと（H24・H28・R2・R6 が骨格予算）で、その翌年度の前年度列は肉付補正後
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2",
      "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24",
    ] as const).map((fy) => ({
      srcId: `tokushima-shi-kanbetsu-${fy}`, muniCode: "362018", muniName: "徳島市", prefName: "徳島県", isPref: false,
    })),
    // 草加市は市議会サイトの参考資料が R8〜R6 の3年度だけ（予算書は罫線セルでパーサ側の宿題）
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `soka-yosan-sankou-${fy}`, muniCode: "112216", muniName: "草加市", prefName: "埼玉県", isPref: false,
    })),
    // 大和市は H27 以前に歳入の款別表が無い
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28",
    ] as const).map((fy) => ({
      srcId: `yamato-yosan-fuzoku-${fy}`, muniCode: "142131", muniName: "大和市", prefName: "神奈川県", isPref: false,
    })),
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29",
    ] as const).map((fy) => ({
      srcId: `fuji-shi-yosan-fuzoku-${fy}`, muniCode: "222101", muniName: "富士市", prefName: "静岡県", isPref: false,
    })),
    // 茅ヶ崎市は H25・H23 が収録不可、H20 以前は PDF が無く HTML 表のみ
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1",
      "h30", "h29", "h28", "h27", "h26", "h24", "h22", "h21",
    ] as const).map((fy) => ({
      srcId: `chigasaki-yosan-soukatsu-${fy}`, muniCode: "142077", muniName: "茅ヶ崎市", prefName: "神奈川県", isPref: false,
    })),
    // 調布市は H30 以前が旧ドメイン（未調査）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `chofu-yosan-gaiyou-${fy}`, muniCode: "132080", muniName: "調布市", prefName: "東京都", isPref: false,
    })),
    // 下関市は R5〜R8 の総括 PDF がアウトライン化されているので、その4年度だけ概要ルート
    ...(["r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `shimonoseki-yosansho-${fy}`, muniCode: "352012", muniName: "下関市", prefName: "山口県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `shimonoseki-yosan-gaiyou-${fy}`, muniCode: "352012", muniName: "下関市", prefName: "山口県", isPref: false,
    })),
    // 松本市は R2・H31・H30 が説明書未公開で主要事務事業説明資料ルート
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `matsumoto-yosansho-${fy}`, muniCode: "202029", muniName: "松本市", prefName: "長野県", isPref: false,
    })),
    // 佐世保市は R3〜H24 の多くがスキャン画像
    ...(["r8", "r7", "r6", "r5", "r4", "h25", "h23", "h21", "h20", "h19"] as const).map((fy) => ({
      srcId: `sasebo-yosansetsumei-${fy}`, muniCode: "422029", muniName: "佐世保市", prefName: "長崎県", isPref: false,
    })),
    // 上尾市（R3 は修正後の差替えファイルを使う）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ageo-yosan-gaiyou-${fy}`, muniCode: "112194", muniName: "上尾市", prefName: "埼玉県", isPref: false,
    })),
    // 佐賀市は R7・R6 が文字化け（パーサ側の宿題）・R4/R3 がスキャン画像
    ...(["r8", "r5"] as const).map((fy) => ({
      srcId: `saga-shi-yosan-gaiyou-${fy}`, muniCode: "412015", muniName: "佐賀市", prefName: "佐賀県", isPref: false,
    })),
    // 春日部市は R7・R5〜R3 が本文アウトライン化
    ...(["r8", "r6"] as const).map((fy) => ({
      srcId: `kasukabe-yosan-gaiyou-${fy}`, muniCode: "112143", muniName: "春日部市", prefName: "埼玉県", isPref: false,
    })),
    // 宝塚市は R8〜R4 が予算説明書ルート・H25〜H17 が予算編成大要ルート（見出しも合計ラベルも別）
    ...(["r8", "r7", "r6", "r5", "r4", "h25", "h24", "h23", "h22", "h19", "h18", "h17"] as const).map((fy) => ({
      srcId: `takarazuka-yosansho-${fy}`, muniCode: "282146", muniName: "宝塚市", prefName: "兵庫県", isPref: false,
    })),
    // 山形市は明細書が使えず財政課「財政状況 資料編」ルート（R7 版は発行元が上書きしたので魚拓から）
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `yamagata-shi-zaisei-siryou-${fy}`, muniCode: "062014", muniName: "山形市", prefName: "山形県", isPref: false,
    })),
    // ⚠ 太田市（群馬 102059）は大田区（東京 131113・スラグ `ota`）と別団体。スラグは `ota-gunma`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `otagunma-yosangaiyou-${fy}`, muniCode: "102059", muniName: "太田市", prefName: "群馬県", isPref: false,
    })),
    // ⚠ 厚木は R5 に肉付後版の別 PDF があるので、当初版を使っていることを年度追加のたびに確かめる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `atsugi-yosangaiyou-${fy}`, muniCode: "142123", muniName: "厚木市", prefName: "神奈川県", isPref: false,
    })),
    // ⚠ 八戸の R3 は現行サイトから消えており魚拓からのみ取得している
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `hachinohe-yosan-gaiyou-${fy}`, muniCode: "022039", muniName: "八戸市", prefName: "青森県", isPref: false,
    })),
    // ⚠ 東京都府中市 132063。広島県府中市 342084 とは別団体なのでスラグは `fuchu-tokyo`
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29",
      "h28", "h27", "h26", "h25", "h24", "h23", "h22",
    ] as const).map((fy) => ({
      srcId: `fuchu-tokyo-aramashi-${fy}`, muniCode: "132063", muniName: "府中市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 流山は R2 がパーサ側の宿題（当年度セルが空欄の廃止款）なので飛ばしている
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r1", "h30", "h29", "h28",
      "h27", "h26", "h25", "h24", "h23", "h22", "h21", "h20",
    ] as const).map((fy) => ({
      srcId: `nagareyama-yosansho-${fy}`, muniCode: "122203", muniName: "流山市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 伊勢崎は H30・H28 が文字化けでパーサ側の宿題
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h29", "h27", "h26", "h25", "h24", "h23",
    ] as const).map((fy) => ({
      srcId: `isesaki-yosangaiyou-${fy}`, muniCode: "102041", muniName: "伊勢崎市", prefName: "群馬県", isPref: false,
    })),
    // ⚠ 呉は R3 がスキャン画像で鎖が切れる
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `kure-yosan-kiso-${fy}`, muniCode: "342025", muniName: "呉市", prefName: "広島県", isPref: false,
    })),
    // ⚠ 西東京は R2 以前が WARP からの取得
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26", "h25", "h24",
    ] as const).map((fy) => ({
      srcId: `nishitokyo-yosangaiyou-${fy}`, muniCode: "132292", muniName: "西東京市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 八千代は H29 が収録不可なので H30↔H28 で鎖が切れる
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30",
      "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21", "h18",
    ] as const).map((fy) => ({
      srcId: `yachiyo-yosangaiyou-${fy}`, muniCode: "122211", muniName: "八千代市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 伊丹は様式が3世代（R8〜R6 別ページ・R5 別ページ・R4〜H30 縦積み）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `itami-yosangaiyou-${fy}`, muniCode: "282073", muniName: "伊丹市", prefName: "兵庫県", isPref: false,
    })),
    // ⚠ 小平は R7・R5 が総括表だけ図形化で収録不可（鎖が2か所切れる）
    ...(["r8", "r6", "r4", "r3", "r2", "r1"] as const).map((fy) => ({
      srcId: `kodaira-yosansho-${fy}`, muniCode: "132110", muniName: "小平市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 熊谷は R8〜R2 が予算分析表・H31〜H23 が予算に関する説明書の2経路
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kumagaya-yosan-bunseki-${fy}`, muniCode: "112020", muniName: "熊谷市", prefName: "埼玉県", isPref: false,
    })),
    ...(["h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23"] as const).map((fy) => ({
      srcId: `kumagaya-yosan-setsumeisho-${fy}`, muniCode: "112020", muniName: "熊谷市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 松江は島根県内で初の市町村。R8〜R4 が概要・R3〜H24 が会計別 PDF
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26", "h25", "h24",
    ] as const).map((fy) => ({
      srcId: `matsue-yosangaiyou-${fy}`, muniCode: "322016", muniName: "松江市", prefName: "島根県", isPref: false,
    })),
    // ⚠ 鈴鹿は R8〜H31 が予算書（議案等一覧）・H30 だけ WARP の当初予算資料
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `suzuka-yosansho-${fy}`, muniCode: "242071", muniName: "鈴鹿市", prefName: "三重県", isPref: false,
    })),
    { srcId: "suzuka-yosan-shiryou-h30", muniCode: "242071", muniName: "鈴鹿市", prefName: "三重県", isPref: false },
    // ⚠ 三鷹は H27 が骨格予算（H28 に prevNote）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `mitaka-yosangaiyou-${fy}`, muniCode: "132047", muniName: "三鷹市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 安城は1ページ PDF ペア（分冊形式）。R3 以前は未回収
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `anjo-kanbetsu-yosan-${fy}`, muniCode: "232122", muniName: "安城市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 日野は R8〜H16 の23年度が同一様式（R8 だけ横並びで CropX）
    ...([
      "r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27",
      "h26", "h25", "h24", "h23", "h22", "h21", "h20", "h19", "h18", "h17", "h16",
    ] as const).map((fy) => ({
      srcId: `hino-yosansho-soukatsu-${fy}`, muniCode: "132128", muniName: "日野市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 東広島は R4〜R2 が Wayback からの取得
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `higashihiroshima-setsumeisho-${fy}`, muniCode: "342122", muniName: "東広島市", prefName: "広島県", isPref: false,
    })),
    // ⚠ 岸和田は R4・R3・H31 が収録不可（鎖が2か所切れる）
    ...(["r8", "r7", "r6", "r5", "r2", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `kishiwada-yosansho-${fy}`, muniCode: "272027", muniName: "岸和田市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 小田原は R8〜R5 の4年（R4 以前はスキャン画像）。R7 のウェブ掲載は「（原案）」＝R8 の前年度列（議会修正後）と3款ずれる（総額は同じ・R8 に prevNote）
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `odawara-yosansho-${fy}`, muniCode: "142069", muniName: "小田原市", prefName: "神奈川県", isPref: false,
    })),
    // ⚠ 立川は R8〜H29 が予算書（R6・H31・H30 は decodeGarble）・H28 だけ概要で代替（予算書がスキャン）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `tachikawa-yosansho-${fy}`, muniCode: "132021", muniName: "立川市", prefName: "東京都", isPref: false,
    })),
    { srcId: "tachikawa-yosan-gaiyou-h28", muniCode: "132021", muniName: "立川市", prefName: "東京都", isPref: false },
    // ⚠ 鎌倉は R8・R7 のみ（R6 以前は画像/OCR 破損。CSV ルートは判断待ち）
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `kamakura-yosansho-${fy}`, muniCode: "142042", muniName: "鎌倉市", prefName: "神奈川県", isPref: false,
    })),
    // ⚠ 習志野は R8〜H27 の12年（HeaderExtra 必須・特別会計3本の同名総括を同梱）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27"] as const).map((fy) => ({
      srcId: `narashino-yosansho-${fy}`, muniCode: "122165", muniName: "習志野市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 浦安は R8〜R3 の6年（R7・R3 が骨格予算→R8・R4 に prevNote。R2 以前はスキャン／概要系列はパーサ手当て待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `urayasu-yosansho-${fy}`, muniCode: "122271", muniName: "浦安市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 西尾は概要 PDF 10年（現行は R8 のみ・R7〜H29 は WARP）。ライセンスは判定語に当たらず unverified（判断待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `nishio-yosan-gaiyou-${fy}`, muniCode: "232131", muniName: "西尾市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 出雲は既存パーサで通る9年のみ（R7〜H31・H25・H22〜H20 はパーサ手当て待ち）。H26 の前年度は6月補正後（prevBasis 明示）
    ...(["r8", "h30", "h29", "h28", "h27", "h26", "h24", "h23", "h18"] as const).map((fy) => ({
      srcId: `izumo-yosangaiyou-${fy}`, muniCode: "322032", muniName: "出雲市", prefName: "島根県", isPref: false,
    })),
    // ⚠ 佐倉は R8〜H19 の18年（H24 はパーサ手当て待ち・H22 は別様式）。R6・R2・H28・H20 は前年度が6月補正後（prevBasis 明示）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h23", "h21", "h20", "h19"] as const).map((fy) => ({
      srcId: `sakura-yosan-setsumei-${fy}`, muniCode: "122122", muniName: "佐倉市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 苫小牧は予算書の総括 12年（H28・H27 は画像）。R2 は CropX・H26 は歳出前年度の5款不一致を prevNote。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h26", "h25"] as const).map((fy) => ({
      srcId: `tomakomai-yosansho-${fy}`, muniCode: "012131", muniName: "苫小牧市", prefName: "北海道", isPref: false,
    })),
    // ⚠ 小山は予算書の総括 9年（R4 以前は decodeGarble・R2 は末尾型の廃款印）。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `oyama-yosansho-${fy}`, muniCode: "092088", muniName: "小山市", prefName: "栃木県", isPref: false,
    })),
    // ⚠ 磐田は R8・R7 が説明資料（CropX）、R6〜H30 が予算書の総括（R3〜H30 は WARP）、H29〜H26 が総括3頁 PDF（WARP）。R2 は原案→R3 に prevNote
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `iwata-yosan-setsumei-${fy}`, muniCode: "222119", muniName: "磐田市", prefName: "静岡県", isPref: false,
    })),
    ...(["r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `iwata-yosansho-${fy}`, muniCode: "222119", muniName: "磐田市", prefName: "静岡県", isPref: false,
    })),
    ...(["h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `iwata-soukatsu-${fy}`, muniCode: "222119", muniName: "磐田市", prefName: "静岡県", isPref: false,
    })),
    // ⚠ 新座は予算書の総括（見開き spread）9年＋R2 は概要で代替。R4/R3/H31/H30 はスキャン。ライセンスは判定語に当たらず unverified（判断待ち）
    ...(["r8", "r7", "r6", "r5", "h29", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `niiza-yosansho-${fy}`, muniCode: "112305", muniName: "新座市", prefName: "埼玉県", isPref: false,
    })),
    { srcId: "niiza-yosangaiyou-r2", muniCode: "112305", muniName: "新座市", prefName: "埼玉県", isPref: false },
    // ⚠ 日立は「予算の概要」の款別表 15年（H26〜H24 は歳入・歳出の2ファイル型）。ライセンスは open に読める根拠あり（判断待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `hitachi-yosan-gaiyou-${fy}`, muniCode: "082023", muniName: "日立市", prefName: "茨城県", isPref: false,
    })),
    // ⚠ 弘前は予算書の総括 R8〜R4（予算書の掲載は R4 から）。R8 は骨格予算（自身の年）
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `hirosaki-yosansho-${fy}`, muniCode: "022021", muniName: "弘前市", prefName: "青森県", isPref: false,
    })),
    // ⚠ 帯広は事項別明細書 5年（R7/R6/R3 は復号）＋説明資料 R5/R4＋編成概要 R2/H31。R5・H31 は前年度が6月補正後（prevBasis 明示）
    ...(["r8", "r7", "r6", "r3", "h30"] as const).map((fy) => ({
      srcId: `obihiro-yosansho-${fy}`, muniCode: "012076", muniName: "帯広市", prefName: "北海道", isPref: false,
    })),
    ...(["r5", "r4"] as const).map((fy) => ({
      srcId: `obihiro-yosan-setsumei-${fy}`, muniCode: "012076", muniName: "帯広市", prefName: "北海道", isPref: false,
    })),
    ...(["r2", "h31"] as const).map((fy) => ({
      srcId: `obihiro-yosan-gaiyou-${fy}`, muniCode: "012076", muniName: "帯広市", prefName: "北海道", isPref: false,
    })),
    // ⚠ 都城は説明資料にテキスト層がある6年だけ（R8/R7 を含む8年はスキャン・予算書は歳出がパス描画）。kanNoless・前年先行・年度ごとの CropX
    ...(["r6", "r4", "r3", "h30", "h26", "h25"] as const).map((fy) => ({
      srcId: `miyakonojo-yosan-setsumei-${fy}`, muniCode: "452025", muniName: "都城市", prefName: "宮崎県", isPref: false,
    })),
    // ⚠ 高岡は予算書の総括 R8〜R2（復号・kanNoless）＋ WARP の会計別予算 H30〜H28（前年先行）。R1 はパーサ手当て待ち
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `takaoka-yosansho-${fy}`, muniCode: "162027", muniName: "高岡市", prefName: "富山県", isPref: false,
    })),
    // ⚠ 松阪は「当初予算説明資料」の款別構成表 13年（R1・H29 はスキャン、H22 は前年度が肉付け後、H23 は `*` 印がパーサ手当て待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h30", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `matsusaka-yosan-setsumei-${fy}`, muniCode: "242047", muniName: "松阪市", prefName: "三重県", isPref: false,
    })),
    // ⚠ ひたちなかは「予算の概要」の款別総括 7年（前年度が左＝prevColumnFirst）。H31 は化け・H30/H29 はスキャン
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `hitachinaka-yosan-gaiyou-${fy}`, muniCode: "082210", muniName: "ひたちなか市", prefName: "茨城県", isPref: false,
    })),
    // ⚠ 秦野は「予算のあらまし」6年＋R5 は「予算資料」（あらましの款別表が画像）。R3・R2・R5 は WARP 起点。noDeepLink
    ...(["r8", "r7", "r6", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `hadano-yosan-aramashi-${fy}`, muniCode: "142115", muniName: "秦野市", prefName: "神奈川県", isPref: false,
    })),
    { srcId: "hadano-yosan-siryou-r5", muniCode: "142115", muniName: "秦野市", prefName: "神奈川県", isPref: false },
    // ⚠ 宇部は「当初予算（案）の概要」4年（R4・R3 は WARP 起点）。open（年度ページの CC BY 4.0 ブロック直下に PDF）。R7/R5/R2 は化け・R1 はパーサ都合
    ...(["r8", "r6", "r4", "r3"] as const).map((fy) => ({
      srcId: `ube-yosan-gaiyou-${fy}`, muniCode: "352021", muniName: "宇部市", prefName: "山口県", isPref: false,
    })),
    // ⚠ 大垣は予算明細書の総括 R8〜R2（R5〜R2 は Wayback 起点）＋当初予算の概要 H31〜H23（H25 はパーサ手当て待ち・H28 以前は前年度が左）。R3 が骨格 → R4 に prevNote
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ogaki-yosanmeisai-${fy}`, muniCode: "212024", muniName: "大垣市", prefName: "岐阜県", isPref: false,
    })),
    ...(["h31", "h30", "h29", "h28", "h27", "h26", "h24", "h23"] as const).map((fy) => ({
      srcId: `ogaki-yosangaiyou-${fy}`, muniCode: "212024", muniName: "大垣市", prefName: "岐阜県", isPref: false,
    })),
    // ⚠ 釧路は「予算（案）の概要」の款別総括 9年（歳出16款＝港湾費・職員費を含む釧路固有）。R1 年度は資料の表紙が「平成31年度」なので h31
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `kushiro-yosan-gaiyou-${fy}`, muniCode: "012068", muniName: "釧路市", prefName: "北海道", isPref: false,
    })),
    // ⚠ 栃木市は「（当初）予算のあらまし」9年。歳入の款名末尾に脚注 `(※n)`・R4 歳出に円グラフのラベル → パーサ改修で収録（§13-28）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `tochigi-shi-yosan-aramashi-${fy}`, muniCode: "092037", muniName: "栃木市", prefName: "栃木県", isPref: false,
    })),
    // ⚠ 刈谷は年度で資料の型が3つ（主要事業の概要 R8/R7・予算説明書 R6〜R4・WARP の2ファイル型 R3〜H30）
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `kariya-syuyojigyo-${fy}`, muniCode: "232106", muniName: "刈谷市", prefName: "愛知県", isPref: false,
    })),
    ...(["r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `kariya-yosan-setsumeisho-${fy}`, muniCode: "232106", muniName: "刈谷市", prefName: "愛知県", isPref: false,
    })),
    ...(["r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `kariya-jikobetsu-meisaisho-${fy}`, muniCode: "232106", muniName: "刈谷市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 野田は予算説明書の総括 9年（R8・H29 は復号）。R2 は無印の廃止款でパーサ手当て待ち
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `noda-yosan-setsumeisho-${fy}`, muniCode: "122084", muniName: "野田市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 川西は予算説明書の総括 7年（H30〜H28 は復号）。前年度列は当初だが毎年 組替後 → R7・R6・H30 に事実だけの prevNote
    ...(["r7", "r6", "r5", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `kawanishi-yosan-setsumeisho-${fy}`, muniCode: "282171", muniName: "川西市", prefName: "兵庫県", isPref: false,
    })),
    // ⚠ 上田は「当初予算の概要」の款別 7年。円グラフの凡例が款名に食い込むので CropX 必須（歳出は Σ 差0 のまま壊れる型）。R8・R4 は骨格予算（当年度側）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ueda-yosan-gaiyou-${fy}`, muniCode: "202037", muniName: "上田市", prefName: "長野県", isPref: false,
    })),
    // ⚠ 東村山は予算書の総括 5年（R6〜R4 は歳入だけ見開き＝revenueSpread）＋R3 は予算概要（予算書がスキャン）。HeaderExtra は側で分ける
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `higashimurayama-yosansho-${fy}`, muniCode: "132136", muniName: "東村山市", prefName: "東京都", isPref: false,
    })),
    { srcId: "higashimurayama-yosan-gaiyou-r3", muniCode: "132136", muniName: "東村山市", prefName: "東京都", isPref: false },
    // ⚠ 久喜は説明書の総括 13年（R4〜H25 は WARP 起点・R2 は `廃` 接頭の廃止款）＋H30 は予算の概要（明細書が ASCII 域の化け）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h29", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `kuki-yosansho-${fy}`, muniCode: "112321", muniName: "久喜市", prefName: "埼玉県", isPref: false,
    })),
    { srcId: "kuki-yosangaiyou-h30", muniCode: "112321", muniName: "久喜市", prefName: "埼玉県", isPref: false },
    // ⚠ 小牧は「当初予算の概要」の款別表 10年（H29 は WARP 起点）。R8 だけ歳入歳出が同一ページで CropX。
    //    款「国有提供施設等所在市町村助成交付金」が3行に割れるので kanNameContinues 必須（款番号が年度で動く）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `komaki-yosansho-${fy}`, muniCode: "232190", muniName: "小牧市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 狭山は予算説明書冒頭の「歳入歳出予算比較表」13年（R2〜H26 は WARP 起点・H26 だけ別ファイルの p.14/15）。
    //    同じ冊子の事項別明細書 総括を採ると歳出の款1 が財源内訳ヘッダと連結する（Σ 差0 のまま壊れる型）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `sayama-yosan-setsumeisho-${fy}`, muniCode: "112151", muniName: "狭山市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 朝霞は予算説明書の総括表 12年（R2 は廃止款の当年度セルが空欄でパーサ手当て待ち）。
    //    revenueHeaderExtra が無いと歳入の款1 が `総括表割合対する割合市税` になる（Σ 差0 のまま壊れる型）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "h31", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `asaka-yosansho-${fy}`, muniCode: "112275", muniName: "朝霞市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 武蔵野は予算参考資料の前年度比較 18年（今のところ最長）。歳出の款6 は原典が `農業費`。
    //    ⚠⚠ R6 は初版と修正版の2本があり **どちらも Σ4系統差0 で通る** — 正版は年度間クロスチェックだけが決める
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `musashino-yosan-sankou-${fy}`, muniCode: "132039", muniName: "武蔵野市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 各務原は計数資料の款別比較 8年。R8〜R6 は「主な増減要因」欄の `（皆減）` を切るため CropX 必須。
    //    ⚠⚠ 別冊子の予算説明書 総括は Σ 差0 のまま款11 災害復旧費 が欠ける（14款→13款）ので採らない
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `kakamigahara-yosan-keisu-${fy}`, muniCode: "212130", muniName: "各務原市", prefName: "岐阜県", isPref: false,
    })),
    // ⚠ 今治は記者発表資料の「一般会計款別予算額調」6年（無指定で素通りする）。
    //    ⚠⚠ 同じ内容の「概要版」は R6〜R4 で歳出の款5 が `衛生費労働費` になるのに Σ 差0 のまま通る。採らない
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `imabari-yosansho-${fy}`, muniCode: "382027", muniName: "今治市", prefName: "愛媛県", isPref: false,
    })),
    // ⚠ 多摩は予算書の総括5年＋R3 は予算の概要（予算書が発行元にも Wayback にも WARP にも無い）。
    //    歳出の款6 は原典が `農林業費`
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `tama-yosansho-${fy}`, muniCode: "132241", muniName: "多摩市", prefName: "東京都", isPref: false,
    })),
    { srcId: "tama-yosan-gaiyou-r3", muniCode: "132241", muniName: "多摩市", prefName: "東京都", isPref: false },
    // ⚠ 三郷は「当初予算の概要」の款別構成比較表 13年＋H25/H24 は予算書の総括（概要に表が無い年度）。
    //    発行元がトップページ以外へのリンクに連絡を求めているので noDeepLink（振替先は年度ページ）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `misato-yosan-gaiyou-${fy}`, muniCode: "112372", muniName: "三郷市", prefName: "埼玉県", isPref: false,
    })),
    ...(["h25", "h24"] as const).map((fy) => ({
      srcId: `misato-yosansho-soukatsu-${fy}`, muniCode: "112372", muniName: "三郷市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 沖縄市は説明書の総括 7年。款9 は kanNameContinues + AcrossBlank が無いと
    //    `国有提供施設等所在市町村` に切れる（Σ 差0 のまま）。R8・R5 は前年度が骨格予算で prevNote つき
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `okinawa-shi-yosansho-${fy}`, muniCode: "472115", muniName: "沖縄市", prefName: "沖縄県", isPref: false,
    })),
    // ⚠ 入間は年度で冊子が2系統（R7・R6 だけ予算書の総括・他は予算の概要）。
    //    概要側は HeaderExtra が無いと款1 が `歳入市税`／`歳出議会費` になる（Σ 差0 のまま）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26"] as const).map((fy) => ({
      srcId: `iruma-yosansho-${fy}`, muniCode: "112259", muniName: "入間市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 戸田は「当初予算の概要」の款別集計表 11年（H29・H28 は WARP が唯一の写し）。
    //    H31 だけ新設款の前年度セルが全角ダッシュで dashAsZero が要る（warning 止まりで derive まで流れる型）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `toda-yosan-gaiyou-${fy}`, muniCode: "112241", muniName: "戸田市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 米子は「予算の概要」の一般会計予算の内訳 17年（今のところ最長）。
    //    ⚠⚠ **前年度基準が年度で変わる**（市長選の翌年度 R8・R4・H30・H26・H22 だけ6月補正後）。
    //    歳入の左端に縦書きラベルがあり CropX 必須（境界 76 では H22 に効かない）。款番号は印字されない
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22"] as const).map((fy) => ({
      srcId: `yonago-yosan-gaiyou-${fy}`, muniCode: "312029", muniName: "米子市", prefName: "鳥取県", isPref: false,
    })),
    // ⚠⚠ 海老名は予算書の総括 6年＋R2 は説明資料（予算書がスキャン）。
    //    **同じ PDF の後半に特別会計の同型総括表があり、当てると Σ 差0 のまま国保の数字が入る**（款名も正しいので目視でも気づけない）
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `ebina-yosansho-${fy}`, muniCode: "142158", muniName: "海老名市", prefName: "神奈川県", isPref: false,
    })),
    { srcId: "ebina-yosan-setsumei-r2", muniCode: "142158", muniName: "海老名市", prefName: "神奈川県", isPref: false },
    // ⚠⚠ 守口は3ヵ年表なので amountIntIndex/prevIntIndex が必須（省くと歳出が Σ 差0 のまま2年前を収録する）。
    //    R7 は原案と修正後が並び、どちらも Σ 差0。R8 の前年度列と一致する修正後を採る。R6 は参考資料が化けるので概要から
    ...(["r8", "r7", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `moriguchi-yosan-sankou-${fy}`, muniCode: "272094", muniName: "守口市", prefName: "大阪府", isPref: false,
    })),
    { srcId: "moriguchi-yosan-gaiyou-r6", muniCode: "272094", muniName: "守口市", prefName: "大阪府", isPref: false },
    // ⚠ 草津は当初予算概要の款別総括表 13年（歳入歳出が同一ページ＝samePage）。H26 がスキャンで欠け H25 は孤立する。
    //    H28・H27・H25 は市サイトから消えていて BODIK にしか無い（そこでは CC BY だが開ける側へ倒さない）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h25"] as const).map((fy) => ({
      srcId: `kusatsu-yosan-gaiyou-${fy}`, muniCode: "252069", muniName: "草津市", prefName: "滋賀県", isPref: false,
    })),
    // ⚠ 土浦は予算の概要の歳入/歳出内訳 12年。見出しを `款別` にしないと R4・R3 で款1 が `款別市税` になる（Σ 差0 のまま）。
    //    発行元が添付ファイルへの直リンクを名指しで禁止しているので noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27"] as const).map((fy) => ({
      srcId: `tsuchiura-yosan-gaiyou-${fy}`, muniCode: "082031", muniName: "土浦市", prefName: "茨城県", isPref: false,
    })),
    // ---- 第33巡（2026-09-11・§13-35）: 足利・藤枝・古河・箕面・桑名 ----
    // ⚠⚠ 足利の R7 だけ予算説明書から採る — 予算案資料は `-layout` が款名の字を版面順に散らし
    //    `地譲与税方`・`衛費生` になるのに **Σ は4系統とも差0 で throw しない**（汚染ゲートの語彙にも当たらない）
    ...(["r8", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29"] as const).map((fy) => ({
      srcId: `ashikaga-yosanan-${fy}`, muniCode: "092029", muniName: "足利市", prefName: "栃木県", isPref: false,
    })),
    { srcId: "ashikaga-yosansetsumeisho-r7", muniCode: "092029", muniName: "足利市", prefName: "栃木県", isPref: false },
    // ⚠ 藤枝は4年度だけ（11年分あるがテキスト層は R8・R7・R6・H30 の4年だけ。R5〜R2・H31・H29・H28 がスキャン）。
    //    R8・H30 は歳入と歳出が同一ページの左右なので CropX が要る。⚠ H30 は前後がスキャンで鎖が張れない
    ...(["r8", "r7", "r6", "h30"] as const).map((fy) => ({
      srcId: `fujieda-soukatsu-${fy}`, muniCode: "222143", muniName: "藤枝市", prefName: "静岡県", isPref: false,
    })),
    // ⚠ 古河は R7 がアウトライン化で中抜けになる。歳入の総括が2ページにまたがるので revenuePages が必須
    ...(["r8", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `koga-ibaraki-yosansho-${fy}`, muniCode: "082040", muniName: "古河市", prefName: "茨城県", isPref: false,
    })),
    // ⚠⚠ 箕面は18年度。**全年度・両側で CropX が必須**（表側の縦ラベルが歳入は款名に1文字混じり
    //    Σ 差0 のまま壊れ、歳出は款が丸ごと落ちる）。⚠ H27 で発行元が款を組み替えており、
    //    H27 の前年度列は H26 の当年度と歳出7款が違う（差の和は0・原典どおり）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h21"] as const).map((fy) => ({
      srcId: `minoh-yosangaiyou-${fy}`, muniCode: "272205", muniName: "箕面市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 桑名は歳出ページに合計行が2つ（款別と性質別で同額）。性質別を採ると Σ が倍になり error で落ちる。
    //    H30〜H28 は市サイトから消えていて Wayback にしか無い
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `kuwana-yosan-soukatsu-${fy}`, muniCode: "242055", muniName: "桑名市", prefName: "三重県", isPref: false,
    })),
    // ---- 第34巡（2026-09-12・§13-36）: 成田・周南・焼津・諫早・木更津 ----
    // ⚠ 成田は `revenueHeading` を `一般会計予算` にしないと H24・H20 だけ款1 が汚れる（Σ 差0 のまま）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24", "h23", "h22", "h20"] as const).map((fy) => ({
      srcId: `narita-yosan-gaiyou-${fy}`, muniCode: "122114", muniName: "成田市", prefName: "千葉県", isPref: false,
    })),
    // ⚠⚠ 周南は比較表の右に「主な増減事業」が並び、CropX を外すと歳出が Σ 差0 のまま款名に事業名が混ざる。
    //    窓は年度ごとに違う（共通値は存在しない）。⚠ R4 だけ概要の歳入ページがラスタ画像なので予算書から採る
    ...(["r8", "r7", "r6", "r5", "r3", "r2", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `shunan-yosangaiyou-${fy}`, muniCode: "352152", muniName: "周南市", prefName: "山口県", isPref: false,
    })),
    { srcId: "shunan-yosansho-r4", muniCode: "352152", muniName: "周南市", prefName: "山口県", isPref: false },
    // ⚠ 焼津の H31 は発行元から消えていて Wayback から採る。H30 はアウトライン化で収録不可
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `yaizu-soukatsu-${fy}`, muniCode: "222127", muniName: "焼津市", prefName: "静岡県", isPref: false,
    })),
    // ⚠⚠ 諫早は H28 以前が縦積みで `samePage` 必須（外すと歳出に歳入21款が入り Σ 差0 で通る）。
    //    ⚠ R5 以前は現行サイトから消えていて WARP にしか無い。⚠ R4 で款体系が全面改組されている
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "h30", "h29", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `isahaya-kanbetsu-${fy}`, muniCode: "422045", muniName: "諫早市", prefName: "長崎県", isPref: false,
    })),
    // ⚠⚠ 木更津は歳出だけ当年度と前年度の間に財源内訳2列が挟まるので amountIntIndex を歳出側だけ指定する。
    //    歳入に指定すると皆増の行で前年度が当年度の値になり前年度 Σ が割れる（warning 止まりで derive まで流れる）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29"] as const).map((fy) => ({
      srcId: `kisarazu-yosan-gaiyo-${fy}`, muniCode: "122068", muniName: "木更津市", prefName: "千葉県", isPref: false,
    })),
    ...(["h30", "h29", "h28"] as const).map((fy) => ({
      srcId: `takaoka-kaikeibetsu-yosan-${fy}`, muniCode: "162027", muniName: "高岡市", prefName: "富山県", isPref: false,
    })),
    // ---- 第35巡（2026-09-12・§13-37）: 石巻・稲沢・我孫子・座間 ----
    // ⚠ 石巻の R3 は骨格予算なので R4 に prevNote が要る（skeleton-budgets.ts が順方向で検査する）。
    //    ⚠ R6 だけ歳入に revenueCropX が要り、H25 は decodeGarble が要る。H23・H22 はスキャンで収録不可
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `ishinomaki-soukatsu-${fy}`, muniCode: "042021", muniName: "石巻市", prefName: "宮城県", isPref: false,
    })),
    // ⚠⚠ 稲沢は `revenueHeading` をページ冒頭の表題にすると款1 が `歳入市税` になる（Σ 差0 のまま）。`歳入` にする。
    //    ⚠ 歳出は災害復旧費が欠番で款番号が飛ぶ（連番チェックは §9f で撤去済みなので validate は無言）。H29〜H27 は桁割れで収録不可
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h26", "h25"] as const).map((fy) => ({
      srcId: `inazawa-yosansetumei-${fy}`, muniCode: "232203", muniName: "稲沢市", prefName: "愛知県", isPref: false,
    })),
    // ⚠⚠ 我孫子は R8 の歳入だけ廃止款が款番号を持たないので `kanNoless` が要る（外すと前年度 Σ が warning 止まりで流れる）。
    //    ⚠ 同じ PDF に特別会計の同型総括が3本あり見出しが完全に同一。物理ページだけが頼りで、年度ごとにずれる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "h31", "h30"] as const).map((fy) => ({
      srcId: `abiko-yosansho-${fy}`, muniCode: "122220", muniName: "我孫子市", prefName: "千葉県", isPref: false,
    })),
    // ⚠⚠ 座間は歳入の款9 が名前欄を非空のまま下段へ続くので `kanNameContinues` が要る（外すと款名が切れて Σ 差0 で通る）。
    //    ⚠ 同じ PDF に特別会計の同型総括が3本あり、見出しも合計ラベルも一般会計と同一。R5・R4 は文字が取れず収録不可
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `zama-yosansho-${fy}`, muniCode: "142166", muniName: "座間市", prefName: "神奈川県", isPref: false,
    })),
    // ---- 第36巡（2026-09-12・§13-38）: 尾道・富士宮・瀬戸・青梅・うるま ----
    // ⚠⚠ 尾道は縦書きの表側ラベルが款名に1文字混入する（`歳ゴルフ場利用税交付金`）。外しても Σ 差0 で通る。
    //    ⚠ H31 はスキャンで収録不可なので H30↔R2 の鎖はここで切れる
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h30", "h29", "h28", "h27", "h26", "h25", "h24"] as const).map((fy) => ({
      srcId: `onomichi-yosangaiyou-${fy}`, muniCode: "342050", muniName: "尾道市", prefName: "広島県", isPref: false,
    })),
    // ⚠⚠ 富士宮は歳入・歳出が別ファイル。⚠ R3 以前は発行元から消えていて Wayback から採る。
    //    ⚠ H25 の歳出だけ「当年度が0でないのに皆減」の行があり列指定で推測を止めている
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30", "h29", "h28", "h27", "h26", "h25"] as const).map((fy) => ({
      srcId: `fujinomiya-kanbetsu-${fy}`, muniCode: "222071", muniName: "富士宮市", prefName: "静岡県", isPref: false,
    })),
    // ⚠⚠ 瀬戸は R8 だけ `-layout` でも通ってしまう（臨財債の括弧書きが無い年度）。年度ごとに当てること。
    //    ⚠ R6 の前年度列は骨格予算の肉付け後（prevBasis 補正後）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `seto-yosan-gaiyou-${fy}`, muniCode: "232041", muniName: "瀬戸市", prefName: "愛知県", isPref: false,
    })),
    // ⚠⚠ 青梅は予算書も総括も款別の表がアウトライン化されていて取れず（条文や第2表は文字で読める）、説明資料だけが入口。
    //    ⚠ 同じ発行元でも描き方が2種（H31 は Form XObject・R8 は直接パス）＝`Do` の数だけを目印にしない
    //    ⚠ 歳出は2段組で crop と字下げ上限の両方が要る（どちらを外しても Σ が大きくずれて error）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ome-yosan-setsumei-${fy}`, muniCode: "132055", muniName: "青梅市", prefName: "東京都", isPref: false,
    })),
    // ⚠⚠ うるまは見出しの開き括弧が年度で半角／全角に割れる。⚠ 歳入合計＝歳出合計なので側の取り違えは Σ で捕まらない。
    //    ⚠ R4・R2・H31 はパーサ待ちで収録していない（R4 は桁割れ・R2/H31 は無印の廃止款行）
    ...(["r8", "r7", "r6", "r5", "r3"] as const).map((fy) => ({
      srcId: `uruma-yosansho-${fy}`, muniCode: "472131", muniName: "うるま市", prefName: "沖縄県", isPref: false,
    })),
    // ---- 第37巡（2026-09-25・§13-39）: 小金井・岩国・飯塚・霧島・大崎 ----
    // ⚠⚠ 小金井は表の直前の散文が款1 に連結する（HeaderExtra 必須・外しても Σ 差0）。R8 は原典の転記誤りで収録不可
    ...(["r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `koganei-yosan-gaiyou-${fy}`, muniCode: "132101", muniName: "小金井市", prefName: "東京都", isPref: false,
    })),
    // ⚠⚠ 岩国は合計行の列指定が R8・R7 だけ要り、R6 以前に付けると逆に壊れる（どちらも前年度 Σ の warning 止まり）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `iwakuni-yosangaiyou-${fy}`, muniCode: "352080", muniName: "岩国市", prefName: "山口県", isPref: false,
    })),
    // ⚠⚠ 飯塚 R6 は文字化けで decodeGarbleBand＋復号表4字。R4〜R2 は発行元から消えていて WARP から採る
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `iizuka-yosan-shiryo-${fy}`, muniCode: "402052", muniName: "飯塚市", prefName: "福岡県", isPref: false,
    })),
    // ⚠⚠ 霧島は HeaderExtra を外すと表題と財源内訳の列見出しが款1 に連結する（Σ 差0）。R2 はパーサ待ち（款番号 0 の廃止款）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "h31"] as const).map((fy) => ({
      srcId: `kirishima-yosansho-${fy}`, muniCode: "462187", muniName: "霧島市", prefName: "鹿児島県", isPref: false,
    })),
    // ⚠⚠ 大崎は同じ PDF に特別会計の同型総括が 8〜11 本あり見出しも合計ラベルも同一。物理ページが頼り（年度で3通り）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `osaki-yosan-setsumeisho-${fy}`, muniCode: "042153", muniName: "大崎市", prefName: "宮城県", isPref: false,
    })),
    // ---- 第38巡（2026-09-25・§13-40）: 八代・伊勢・橿原・江別・鴻巣 ----
    // ⚠⚠ 八代は歳入・歳出が1ページに縦積み（samePage・両側 `合計`）。H31 の款18 は原典の字で `寄付金`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `yatsushiro-yosan-gaiyo-${fy}`, muniCode: "432024", muniName: "八代市", prefName: "熊本県", isPref: false,
    })),
    // ⚠⚠ 伊勢は款11 の下段が空行を挟む（kanNameContinuesAcrossBlank・外すと Σ 差0 のまま切れる）。R8 は一括版（分冊はアウトライン化）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ise-shi-yosansho-${fy}`, muniCode: "242039", muniName: "伊勢市", prefName: "三重県", isPref: false,
    })),
    // ⚠⚠ 橿原 R8 は議会修正後の版（初版も Σ 差0 で通る）。R6 は概要がアウトライン化で記者会見資料から（別 srcId）
    ...(["r8", "r7", "r5"] as const).map((fy) => ({
      srcId: `kashihara-yosan-gaiyou-${fy}`, muniCode: "292052", muniName: "橿原市", prefName: "奈良県", isPref: false,
    })),
    { srcId: "kashihara-yosan-houdou-r6", muniCode: "292052", muniName: "橿原市", prefName: "奈良県", isPref: false },
    // ⚠⚠ 江別 R5 は骨格予算（skeleton-budgets.ts）で R6 に prevNote。R3 は発行元から削除済みで Wayback から
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `ebetsu-yosansho-soukatsu-${fy}`, muniCode: "012173", muniName: "江別市", prefName: "北海道", isPref: false,
    })),
    // ⚠⚠ 鴻巣は HeaderExtra を外すと款1 が `（歳入）市税` になる（Σ 差0）。⚠ ライセンス条項がサイトに無い（unverified・人の判断待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h30"] as const).map((fy) => ({
      srcId: `konosu-yosan-sankou-${fy}`, muniCode: "112178", muniName: "鴻巣市", prefName: "埼玉県", isPref: false,
    })),
    // ---- 第39巡（2026-09-25・§13-41）: 鶴岡・生駒・東久留米・松原・半田 ----
    // ⚠⚠ 鶴岡 R8 だけ款名が下の行へ折り返す（kanNameContinues・外すと Σ 差0 のまま壊れる）。R7 は議会修正後の議決版。R4 はスキャン
    ...(["r8", "r7", "r6", "r5", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `tsuruoka-yosan-shiryo-${fy}`, muniCode: "062031", muniName: "鶴岡市", prefName: "山形県", isPref: false,
    })),
    // ⚠ 生駒は見出し2語だけで全年度が通る。款5 `産業経済費` は独自の款
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `ikoma-yosan-gaiyou-${fy}`, muniCode: "292095", muniName: "生駒市", prefName: "奈良県", isPref: false,
    })),
    // ⚠⚠ 東久留米 R6 は明細書がスキャンで概要から（別 srcId）。R2 だけ kanNoless（外すと前年度 Σ の warning 止まり）
    ...(["r8", "r7", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `higashikurume-yosansho-soukatsu-${fy}`, muniCode: "132225", muniName: "東久留米市", prefName: "東京都", isPref: false,
    })),
    { srcId: "higashikurume-yosan-gaiyou-r6", muniCode: "132225", muniName: "東久留米市", prefName: "東京都", isPref: false },
    // ⚠ 松原 R3・R2 は画像のみで収録不可
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `matsubara-yosan-gaiyou-${fy}`, muniCode: "272175", muniName: "松原市", prefName: "大阪府", isPref: false,
    })),
    // ⚠⚠ 半田は歳入の自主財源の款に `※`（kanNameSuffixStrip・外すと Σ 差0 のまま汚れる）。ライセンスは `非商業` で要許可
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `handa-yosan-kamokubetu-${fy}`, muniCode: "232050", muniName: "半田市", prefName: "愛知県", isPref: false,
    })),
    // ---- 第40巡（2026-09-26・§13-42）: 那須塩原・浦添・大東（門真・昭島はライセンスの人の判断待ちで見送り） ----
    // ⚠⚠ 那須塩原は同じ冊子に特別会計の同型総括が続く（物理ページで指す）。R6〜H31 は revenueHeaderExtra が無いと款1 に表題が付く（Σ 差0）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31"] as const).map((fy) => ({
      srcId: `nasushiobara-yosan-gaiyou-${fy}`, muniCode: "092134", muniName: "那須塩原市", prefName: "栃木県", isPref: false,
    })),
    // ⚠⚠ 浦添は歳入・歳出が別ファイル。列見出し「備考」が款1 に付く（Σ 差0）。R2 は原典の誤植で見送り（人の判断待ち）
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `urasoe-tousho-hikaku-${fy}`, muniCode: "472085", muniName: "浦添市", prefName: "沖縄県", isPref: false,
    })),
    // ⚠⚠ 大東 R8・R7 は議会修正後の概要（予算書は原案なので使わない）。R5 は原案しか無く見送り（人の判断待ち）。R4〜R2 は画像
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `daito-yosan-gaiyou-${fy}`, muniCode: "272183", muniName: "大東市", prefName: "大阪府", isPref: false,
    })),
    // ---- 第41巡（2026-09-27・§13-43）: 廿日市・掛川・ふじみ野・延岡・唐津 ----
    // ⚠ 廿日市 R8〜R5 は予算説明資料、R4 は予算書の総括（別 srcId）。R3・R2 はアウトライン化で収録不可
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `hatsukaichi-yosansetsumei-${fy}`, muniCode: "342131", muniName: "廿日市市", prefName: "広島県", isPref: false,
    })),
    { srcId: "hatsukaichi-yosansho-r4", muniCode: "342131", muniName: "廿日市市", prefName: "広島県", isPref: false },
    // ⚠ 掛川 R8〜R4 は予算書の総括、R3・R2 は予算書がスキャンなので当初予算案の概要（別 srcId）。noDeepLink（文書へのリンクを名指しで断る）
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `kakegawa-yosansho-${fy}`, muniCode: "222135", muniName: "掛川市", prefName: "静岡県", isPref: false,
    })),
    ...(["r3", "r2"] as const).map((fy) => ({
      srcId: `kakegawa-yosangaiyo-${fy}`, muniCode: "222135", muniName: "掛川市", prefName: "静岡県", isPref: false,
    })),
    // ⚠⚠ ふじみ野は歳出の財源内訳の列見出し4語が款1 に付く（Σ 差0）。ライセンスが割れていて要許可へ倒した
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `fujimino-yosansho-${fy}`, muniCode: "112453", muniName: "ふじみ野市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠⚠ 延岡 R5 の前年度列は R4（骨格）の肉付後（prevBasis 補正後＋prevNote）。R5 は専決処分で成立。R7〜R5 は WARP
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `nobeoka-yosan-gaiyou-${fy}`, muniCode: "452033", muniName: "延岡市", prefName: "宮崎県", isPref: false,
    })),
    // ⚠⚠ 唐津 R7・R3 は骨格予算で R8・R4 に prevNote。R6 は議会ページの版（財政課の版は文字化け）。R3・R2 は WARP
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `karatsu-yosan-gaiyou-${fy}`, muniCode: "412023", muniName: "唐津市", prefName: "佐賀県", isPref: false,
    })),
    // ---- 第42巡（2026-09-27・§13-44）: 富士見・東海・佐野・防府・白山 ----
    // ⚠ 富士見 R2 は番号も印も無い廃止款（#301 のパーサ修正で読めるようになり第45巡で収録）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `fujimi-yosansho-${fy}`, muniCode: "112356", muniName: "富士見市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠⚠ 東海 R7・R3 は骨格予算で R8・R4 の前年度列は「６月現計」（prevBasis 補正後＋prevNote）。歳入・歳出が別ファイル。noDeepLink
    // ⚠ 東海 R2 は行頭の 0 の廃止款（#301 のパーサ修正で読めるようになり第45巡で収録）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `tokaishi-kanbetsu-hikaku-${fy}`, muniCode: "232220", muniName: "東海市", prefName: "愛知県", isPref: false,
    })),
    // ⚠⚠ 佐野は表題行「一般会計」が款1 に付く（Σ 差0）。ライセンスが割れていて要許可へ倒した
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sano-yosan-kanbetsu-${fy}`, muniCode: "092045", muniName: "佐野市", prefName: "栃木県", isPref: false,
    })),
    // ⚠ 防府 R7〜R2 は WARP（発行元は R8 だけ残す）。R3 はテキスト層なしで未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `hofu-yosan-sanko-${fy}`, muniCode: "352063", muniName: "防府市", prefName: "山口県", isPref: false,
    })),
    // ⚠⚠ 白山は章見出し「2 一般会計」が款1 に付く（Σ 差0）。資料への直リンクを断る ⇒ noDeepLink。R2 はスキャン
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `hakusan-ippan-huhyou-${fy}`, muniCode: "172103", muniName: "白山市", prefName: "石川県", isPref: false,
    })),
    // ---- 第43巡（2026-09-27・§13-45）: 長浜・別府・加須・春日・印西 ----
    // ⚠⚠ 長浜 R8・R4 は骨格予算＋同時提出の政策補正で、当初（A 列）を採る。R5 の前年度列は R4 の当初＋補正第1号（prevBasis 補正後）。
    //   R7 は概要の議案第8号が否決 ⇒ 成立した議案第54号の予算書（別 srcId）
    ...(["r8", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nagahama-yosan-gaiyou-keisuu-${fy}`, muniCode: "252034", muniName: "長浜市", prefName: "滋賀県", isPref: false,
    })),
    { srcId: "nagahama-ippan-yosansho-gian54-r7", muniCode: "252034", muniName: "長浜市", prefName: "滋賀県", isPref: false },
    // ⚠⚠ 別府 R5・R1 は骨格予算で R6・R2 の前年度列は肉付け後（prevBasis 補正後）。R8〜R6 は説明資料、R5〜R2 は総括説明資料（別 srcId）。ライセンスが割れていて要許可へ倒した
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `beppu-yosanan-setsumei-${fy}`, muniCode: "442020", muniName: "別府市", prefName: "大分県", isPref: false,
    })),
    ...(["r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `beppu-yosanan-sokatsu-${fy}`, muniCode: "442020", muniName: "別府市", prefName: "大分県", isPref: false,
    })),
    // ⚠ 加須は noDeepLink（リンク先をトップページに指定する指示形）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kazo-yosan-point-${fy}`, muniCode: "112101", muniName: "加須市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠⚠ 春日は財源内訳の列見出し4語が款に付く（Σ 差0）。R2 は WARP、R3 は OCR のみで未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `kasuga-yosan-setsumei-${fy}`, muniCode: "402184", muniName: "春日市", prefName: "福岡県", isPref: false,
    })),
    // ⚠⚠ 印西は歳出の備考列を CropX で落とす（R2 の余裕は約1pt・外すと Σ 差0 のまま款名が汚れる）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `inzai-yosan-gaiyou-${fy}`, muniCode: "122319", muniName: "印西市", prefName: "千葉県", isPref: false,
    })),
    // ---- 第44巡（2026-09-27・§13-46）: 会津若松・彦根・北見・奥州 ----
    // ⚠ 会津若松 R4〜R2 は Wayback の写し（年度ページごと消えている）。ライセンスが割れていて要許可へ倒した
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `aizuwakamatsu-yosangaiyo-${fy}`, muniCode: "072028", muniName: "会津若松市", prefName: "福島県", isPref: false,
    })),
    // ⚠ 彦根 R7〜R2 は WARP（年度ページを毎年上書き）。R2 は議会の修正可決後の額
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `hikone-kakukaikei-yosan-${fy}`, muniCode: "252026", muniName: "彦根市", prefName: "滋賀県", isPref: false,
    })),
    // ⚠⚠ 北見 R6〜R4 は ToUnicode 欠落で decodeGarble（復号表に21字追加・款名に効くのは「道」だけ）。R2 は廃止款の行と原典の転記誤りで未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `kitami-yosansho-setsumei-${fy}`, muniCode: "012084", muniName: "北見市", prefName: "北海道", isPref: false,
    })),
    // ⚠⚠ 奥州 R4・R8 は骨格予算。R5 の前年度列は「６月補正後」（パーサが自動で補正後と判定）。列見出し「名称」が款1 に付く（Σ 差0）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `oshu-yosan-gaiyou-${fy}`, muniCode: "032158", muniName: "奥州市", prefName: "岩手県", isPref: false,
    })),
    // ---- 第46巡（2026-09-27・§13-48）: #300 のパーサ修正で鎌ケ谷 ----
    // ⚠⚠ 鎌ケ谷は脚注マーカー（注N）と R5・R4 の歳入合計行の整数 100（totalAmountIntIndex を側ごとに）。R3・R2 は Wayback
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kamagaya-yosan-gaiyou-${fy}`, muniCode: "122246", muniName: "鎌ケ谷市", prefName: "千葉県", isPref: false,
    })),
    // ---- 第47巡（2026-09-28・§13-49） ----
    // ⚠ 富田林 R8〜R4 は予算書の総括、R3・R2 は予算書がスキャンなので予算付属説明資料（別 srcId・kanIndentMax）
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `tondabayashi-yosansho-${fy}`, muniCode: "272141", muniName: "富田林市", prefName: "大阪府", isPref: false,
    })),
    ...(["r3", "r2"] as const).map((fy) => ({
      srcId: `tondabayashi-yosan-fuzoku-${fy}`, muniCode: "272141", muniName: "富田林市", prefName: "大阪府", isPref: false,
    })),
    // ⚠⚠ 取手 R5・R1 は骨格で R6・R2 の前年度列は骨格の当初額（prevNote）。見出し「総括」と財源内訳の列見出しが款1 に付く（Σ 差0）。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `toride-ippan-yosansho-${fy}`, muniCode: "082171", muniName: "取手市", prefName: "茨城県", isPref: false,
    })),
    // ⚠⚠ 羽曳野 R8 は ToUnicode 欠落（復号表に3字追加）＋歳入だけ -raw・totalNoLabel。R3 は数字の帯の化け。R4 は新型の化けで未収録
    ...(["r8", "r7", "r6", "r5", "r3", "r2"] as const).map((fy) => ({
      srcId: `habikino-yosansho-${fy}`, muniCode: "272221", muniName: "羽曳野市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 三田は議会の予算案説明資料（prevColumnFirst）。R6 は修正可決で原案しか款別が無く、R7 は款別表が無い（どちらも未収録）
    ...(["r8", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sanda-yosan-an-setsumei-${fy}`, muniCode: "282197", muniName: "三田市", prefName: "兵庫県", isPref: false,
    })),
    // ---- 第48巡（2026-09-28・§13-50） ----
    // ⚠ 大牟田 R2 の款9 は原典どおり「自動車取得税交付金⇒環境性能割交付金」
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `omuta-kanbetsu-hikaku-${fy}`, muniCode: "402028", muniName: "大牟田市", prefName: "福岡県", isPref: false,
    })),
    // ⚠⚠ 一関の歳入は自主財源／依存財源の順（款番号が昇順でない warning は八千代と同じ扱い）・縦書きラベルを CropX で落とす。R2 は第49巡で追加
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ichinoseki-yosan-gaiyou-${fy}`, muniCode: "032093", muniName: "一関市", prefName: "岩手県", isPref: false,
    })),
    // ⚠ 三島 R8・R2 は decodeGarble、R2 は歳入だけ -raw。R4・R3 は左右2段で未収録
    ...(["r8", "r7", "r6", "r5", "r2"] as const).map((fy) => ({
      srcId: `mishima-yosansho-${fy}`, muniCode: "222062", muniName: "三島市", prefName: "静岡県", isPref: false,
    })),
    // ⚠⚠ 小松 R7・R3 は骨格で R8・R4 の前年度列は6月補正後（prevBasis 補正後＋prevNote）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `komatsu-yosan-setsumeisho-${fy}`, muniCode: "172031", muniName: "小松市", prefName: "石川県", isPref: false,
    })),
    // ⚠⚠ 多治見は歳入・歳出が別ファイル。自主／依存の列（kanNameSuffixStrip）と項の内訳行（kanIndentMax）。R5 骨格で R6 に prevNote。R3・R2 は WARP
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `tajimi-yosan-shukeihyo-${fy}`, muniCode: "212041", muniName: "多治見市", prefName: "岐阜県", isPref: false,
    })),
    // ---- 第49巡（2026-09-28・§13-51） ----
    // ⚠⚠ 西条の歳入は折返し款名の下段に見えない全角「１」が詰めてある（stripChars）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `saijo-yosan-gaiyou-${fy}`, muniCode: "382060", muniName: "西条市", prefName: "愛媛県", isPref: false,
    })),
    // ⚠⚠ 池田の歳入は3行に分かれる款名（kanNameContinues を年度ごと）・右の増減内容の列を CropX で落とす。R3 は修正可決後の版
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ikeda-osaka-yosangaiyou-${fy}`, muniCode: "272043", muniName: "池田市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 伊勢原 R7・R6・R2 は予算書がスキャンで未収録
    ...(["r8", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `isehara-yosansho-${fy}`, muniCode: "142140", muniName: "伊勢原市", prefName: "神奈川県", isPref: false,
    })),
    // ⚠⚠ 桐生は列が前年度→当年度の順（prevColumnFirst）・自主財源の「＊」を落とす。R2 は WARP・R1 骨格で R2 に prevNote
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kiryu-yosangaiyou-${fy}`, muniCode: "102032", muniName: "桐生市", prefName: "群馬県", isPref: false,
    })),
    // ⚠ 宜野湾は R8〜R5 が予算書の総括・R4・R3 が概要 PDF。R2 は未収録
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `ginowan-yosansho-${fy}`, muniCode: "472051", muniName: "宜野湾市", prefName: "沖縄県", isPref: false,
    })),
    ...(["r4", "r3"] as const).map((fy) => ({
      srcId: `ginowan-yosan-gaiyo-${fy}`, muniCode: "472051", muniName: "宜野湾市", prefName: "沖縄県", isPref: false,
    })),
    // ---- 第50巡（2026-09-28・§13-52） ----
    // ⚠⚠ 小樽の歳出は「金額行／(給) 組替行／計」の3行組（salaryRegroupRows・#307）。款13 職員給与費は独立款
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `otaru-yosan-setsumei-${fy}`, muniCode: "012033", muniName: "小樽市", prefName: "北海道", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kani-yosan-gaiyou-${fy}`, muniCode: "212148", muniName: "可児市", prefName: "岐阜県", isPref: false,
    })),
    // ⚠ 大村 R2 は Wayback。R6 当初は決算の71%（総務費を補正で大きく積む）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `omura-yosangaiyou-${fy}`, muniCode: "422053", muniName: "大村市", prefName: "長崎県", isPref: false,
    })),
    // ⚠ 坂戸は現行サイトが直近3年度だけ（R5・R4・R2 は WARP・R3 は Wayback）。R7 以前は表題が款1 に付く（HeaderExtra）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sakado-yosangaiyou-${fy}`, muniCode: "112399", muniName: "坂戸市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠⚠ 筑西 R7 は骨格で R8 に prevNote。R6 は原案しか無く、R3・R2 はアウトライン化で未収録
    ...(["r8", "r7", "r5", "r4"] as const).map((fy) => ({
      srcId: `chikusei-yosansho-${fy}`, muniCode: "082279", muniName: "筑西市", prefName: "茨城県", isPref: false,
    })),
    // ---- 第51巡（2026-10-01・§13-53） ----
    // ⚠⚠ 鹿屋 R4・R8 が骨格で R5 に prevNote。R2 は廃止款（印つき・当年度空欄）が読めず未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `kanoya-yosan-setsumei-${fy}`, muniCode: "462039", muniName: "鹿屋市", prefName: "鹿児島県", isPref: false,
    })),
    // ⚠⚠ 佐久 R8〜R6 は左の注記・グラフを CropX で落とす。R7 骨格で R8 に prevNote。R4〜R2 はスキャン
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `saku-yosan-setsumei-${fy}`, muniCode: "202177", muniName: "佐久市", prefName: "長野県", isPref: false,
    })),
    // ⚠⚠ 泉佐野 R8・R3 は decodeGarble（R3 は帯も）。R5・H31 骨格で R6・R2 に prevNote。ふるさと納税で当初が決算の75%
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `izumisano-yosan-gaiyou-${fy}`, muniCode: "272132", muniName: "泉佐野市", prefName: "大阪府", isPref: false,
    })),
    // ⚠⚠ 河内長野 R5 は議会修正後の版（33395）。R2 は Wayback
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kawachinagano-yosan-hikaku-${fy}`, muniCode: "272167", muniName: "河内長野市", prefName: "大阪府", isPref: false,
    })),
    // ---- 第52巡（2026-10-02・§13-54） ----
    // ⚠⚠ 四街道 R4 骨格で R5 に prevNote。見出しと HeaderExtra の組（無いと款1 が汚れる）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `yotsukaido-yosansho-${fy}`, muniCode: "122289", muniName: "四街道市", prefName: "千葉県", isPref: false,
    })),
    // ⚠⚠ 宗像は総括に款と項が混在（kanIndentMax）・合計ラベル「計」を stripChars で消して totalNoLabel。R4 骨格で R5 に prevNote
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `munakata-yosansho-${fy}`, muniCode: "402206", muniName: "宗像市", prefName: "福岡県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `azumino-yosansho-${fy}`, muniCode: "202207", muniName: "安曇野市", prefName: "長野県", isPref: false,
    })),
    // ⚠⚠ 津山 R8・R4 が骨格で R5 に prevNote。サイトは SPA・R8・R7 の PDF は Azure Blob
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `tsuyama-yosansho-${fy}`, muniCode: "332038", muniName: "津山市", prefName: "岡山県", isPref: false,
    })),
    // ---- 第53巡（2026-10-07・§13-55） ----
    // ⚠ 島田 R5〜R2 は合冊（最初の総括が一般会計）。R2 の前年度列は議会修正後の H31 当初
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `shimada-yosansho-${fy}`, muniCode: "222097", muniName: "島田市", prefName: "静岡県", isPref: false,
    })),
    // ⚠ 日進 R2 は予算書の総括がスキャンで概要の款別一覧表
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `nisshin-yosansho-${fy}`, muniCode: "232301", muniName: "日進市", prefName: "愛知県", isPref: false,
    })),
    { srcId: "nisshin-yosan-gaiyou-r2", muniCode: "232301", muniName: "日進市", prefName: "愛知県", isPref: false },
    // ⚠ 酒田 R4 は2面付けで歳入に CropX。R2 は予算書が無く未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `sakata-yosansho-${fy}`, muniCode: "062049", muniName: "酒田市", prefName: "山形県", isPref: false,
    })),
    // ⚠ 芦屋は R8・R7・R2 だけ（R6〜R3 はスキャン）。R8 の廃止款は款番号つきの当年度空欄
    ...(["r8", "r7", "r2"] as const).map((fy) => ({
      srcId: `ashiya-yosansho-${fy}`, muniCode: "282065", muniName: "芦屋市", prefName: "兵庫県", isPref: false,
    })),
    // ---- 第54巡（2026-10-21・§13-57） ----
    // ⚠ 稲城は1ページに歳入・歳出を縦に積む調書。`revenueHeaderExtra: "^分$"` が無いと款1 が `分市税`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `inagi-yosan-${fy}`, muniCode: "132250", muniName: "稲城市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 神栖は open（説明書がオープンデータのページに CC BY 4.0 で登載）。R3 は総括が図形化で未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `kamisu-yosan-setsumei-${fy}`, muniCode: "082325", muniName: "神栖市", prefName: "茨城県", isPref: false,
    })),
    // ⚠ 八潮 R5 は議会修正後の概要（予算書は原案）。`noDeepLink`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `yashio-yosan-gaiyou-${fy}`, muniCode: "112348", muniName: "八潮市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 大府 R3・R2 は WARP。R2 は予算書にテキスト層が無く補足説明資料
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `obu-yosansho-${fy}`, muniCode: "232238", muniName: "大府市", prefName: "愛知県", isPref: false,
    })),
    { srcId: "obu-yosan-hosoku-r2", muniCode: "232238", muniName: "大府市", prefName: "愛知県", isPref: false },
    // ⚠ 鹿沼は概要の「歳入の内訳」（自主財源→依存財源の順で款番号なし）。R2 は Wayback
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kanuma-yosan-${fy}`, muniCode: "092053", muniName: "鹿沼市", prefName: "栃木県", isPref: false,
    })),
    // ---- 第62巡（2026-10-22・§13-68） ----
    // ⚠ 交野 R2 は decodeGarble が廃止款の印 × で止まる（#354）。`noDeepLink`
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `katano-yosansho-${fy}`, muniCode: "272302", muniName: "交野市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 本庄 R3・R2 は WARP
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `honjo-yosansho-${fy}`, muniCode: "112119", muniName: "本庄市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 蕨は概要（予算書はスキャン画像）。R5〜R2 は WARP
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `warabi-yosan-gaiyou-${fy}`, muniCode: "112232", muniName: "蕨市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 柏崎 R4 は予算書の総括（概要は Wayback にだけある）。R3・R2 は WARP。`noDeepLink`
    ...(["r8", "r7", "r6", "r5", "r3", "r2"] as const).map((fy) => ({
      srcId: `kashiwazaki-yosan-gaiyou-${fy}`, muniCode: "152056", muniName: "柏崎市", prefName: "新潟県", isPref: false,
    })),
    { srcId: "kashiwazaki-yosansho-r4", muniCode: "152056", muniName: "柏崎市", prefName: "新潟県", isPref: false },
    // ⚠ 志木は R3 以降 open（政府標準利用規約）・R2 は掲載時点の規約が確かめられず閉じる側
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `shiki-yosansho-${fy}`, muniCode: "112283", muniName: "志木市", prefName: "埼玉県", isPref: false,
    })),
    // ---- 第59巡（2026-10-22・§13-64） ----
    // ⚠ 大和郡山は R8・R4 だけ（他はテキスト層の二重化・見開きの廃止款で #347）
    ...(["r8", "r4"] as const).map((fy) => ({
      srcId: `yamatokoriyama-yosan-setsumeisho-${fy}`, muniCode: "292036", muniName: "大和郡山市", prefName: "奈良県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `takayama-yosansho-${fy}`, muniCode: "212032", muniName: "高山市", prefName: "岐阜県", isPref: false,
    })),
    // ⚠ 長岡京は license-no-grant.ts で要許可・`noDeepLink`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nagaokakyo-yosansho-${fy}`, muniCode: "262099", muniName: "長岡京市", prefName: "京都府", isPref: false,
    })),
    // ⚠ 狛江 R4〜R2 は WARP の総括表
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `komae-yosan-${fy}`, muniCode: "132195", muniName: "狛江市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 近江八幡 R5 の前年度列は R4（骨格）の肉付け後。R3 は歳出総括の文字が取れず未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `omihachiman-yosansho-${fy}`, muniCode: "252042", muniName: "近江八幡市", prefName: "滋賀県", isPref: false,
    })),
    // ---- 第56巡（2026-10-22・§13-61） ----
    // ⚠ 射水は款番号が `1款` 形式（`kanNamePrefixStrip`）・内訳行を `kanIndentMax` で外す（字下げは年度で違う）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `imizu-yosan-gaiyou-${fy}`, muniCode: "162116", muniName: "射水市", prefName: "富山県", isPref: false,
    })),
    // ⚠ 花巻 R5 の前年度列は R4（骨格）の5月補正後。R4・R3 は明細書の総括（見開き）。R2 は画像で未収録。`noDeepLink`
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `hanamaki-yosan-gaiyou-${fy}`, muniCode: "032051", muniName: "花巻市", prefName: "岩手県", isPref: false,
    })),
    ...(["r4", "r3"] as const).map((fy) => ({
      srcId: `hanamaki-yosan-meisai-${fy}`, muniCode: "032051", muniName: "花巻市", prefName: "岩手県", isPref: false,
    })),
    // ⚠ 坂井は歳入・歳出が1ページに左右に並ぶ（CropX の境界は年度ごと）。R4 は骨格
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sakai-fukui-yosan-gaiyou-${fy}`, muniCode: "182109", muniName: "坂井市", prefName: "福井県", isPref: false,
    })),
    // ⚠ あまは R4・R8 が骨格。ライセンスは license-no-grant.ts で要許可・`noDeepLink`
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `ama-yosansho-${fy}`, muniCode: "232378", muniName: "あま市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 袋井は右端の増減理由を CropX で落とす。R4 は廃止款の3行組で未収録（パーサ）
    ...(["r8", "r7", "r6", "r5", "r3", "r2"] as const).map((fy) => ({
      srcId: `fukuroi-yosan-kanbetsu-${fy}`, muniCode: "222160", muniName: "袋井市", prefName: "静岡県", isPref: false,
    })),
    // ---- ライセンスの判断待ちで見送っていた市（2026-10-21・#293・§13-56） ----
    // ⚠ 糸島の R5 の前年度列は R4（骨格）の6月補正後。R8 は当年度空欄の廃止款を含む
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `itoshima-yosan-gaiyou-${fy}`, muniCode: "402303", muniName: "糸島市", prefName: "福岡県", isPref: false,
    })),
    // ⚠ 飯田 R8・R7 は右の説明の列を CropX で落とす
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `iida-yosan-gaiyou-${fy}`, muniCode: "202053", muniName: "飯田市", prefName: "長野県", isPref: false,
    })),
    // ⚠ 筑紫野は R8 しかウェブに無い
    { srcId: "chikushino-yosan-shiryo-r8", muniCode: "402176", muniName: "筑紫野市", prefName: "福岡県", isPref: false },
    // ⚠ 上越は款の間に市債・公債費の内訳が挟まる3行組（parenAltRows・detailRowsAfterKan・#294）。H30・H29 はテキスト層が化けて未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2", "h31", "h28", "h27"] as const).map((fy) => ({
      srcId: `joetsu-yosan-gaiyou-${fy}`, muniCode: "152226", muniName: "上越市", prefName: "新潟県", isPref: false,
    })),
    // ⚠ 千歳の歳出は「金額行／款名行／(一般財源) 行」の3行組で前年度の列が款ごとに動く（amountsAboveName・prevAfterBreakdown・#312）。R6・R2 の前年度列は6月補正後
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `chitose-yosan-setsumei-${fy}`, muniCode: "012246", muniName: "千歳市", prefName: "北海道", isPref: false,
    })),
    // ⚠ 昭島は R7〜R2 が掲載時点の旧規約で要許可、R8 だけが PDL1.0 で open（2026-10-22 の人の判断・docs §13-59）。R6 だけ kanNoless
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `akishima-yosansho-${fy}`, muniCode: "132071", muniName: "昭島市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 東近江は R7・R3 が骨格（R8 に prevNote、R4 は前年度列が補正後）。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `higashiomi-yosan-gaiyou-${fy}`, muniCode: "252131", muniName: "東近江市", prefName: "滋賀県", isPref: false,
    })),
    // ---- 甲賀・三原・高砂・摂津・亀岡（2026-10-22・§13-62） ----
    // ⚠ 甲賀は歳入の款名に自主財源◇・依存財源◆の印（kanNamePrefixStrip）。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `koka-shiga-yosan-shiryo-${fy}`, muniCode: "252093", muniName: "甲賀市", prefName: "滋賀県", isPref: false,
    })),
    // ⚠ 三原は概要の右端の増減要因を CropX 440 で落とす（540 だと款名が静かに壊れる）。license-no-grant で要許可・noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `mihara-yosan-gaiyou-${fy}`, muniCode: "342041", muniName: "三原市", prefName: "広島県", isPref: false,
    })),
    // ⚠ 高砂は R4 を収録しない（概要が原案訂正の前）。R6 は骨格予算で R7 に prevNote
    ...(["r8", "r7", "r6", "r5", "r3", "r2"] as const).map((fy) => ({
      srcId: `takasago-yosan-gaiyou-${fy}`, muniCode: "282162", muniName: "高砂市", prefName: "兵庫県", isPref: false,
    })),
    // ⚠ 摂津 R5・R4 は地方譲与税の構成比の誤印字を amountTypos で空白にする（金額には触らない）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `settsu-yosan-soukatsu-${fy}`, muniCode: "272248", muniName: "摂津市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 亀岡 R2 は款名の注記記号「※」を kanNameSuffixStrip で落とす
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kameoka-yosan-shiryohen-${fy}`, muniCode: "262064", muniName: "亀岡市", prefName: "京都府", isPref: false,
    })),
    // ---- 2026-10-22・§13-59: 規約の本文が利用を許諾していて人の判断待ちだった江南・丸亀・門真（本文をフッターの定型文に優先する） ----
    // ⚠ 江南は R7・R8 が政府標準利用規約準拠で open、R6〜R2 は掲載時点の旧規約で要許可。R6・R2 に骨格の prevNote
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `konan-yosansho-${fy}`, muniCode: "232173", muniName: "江南市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 丸亀は CC BY 2.1 JP で open。R3 は修正後の 1240
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `marugame-yosan-taikou-${fy}`, muniCode: "372021", muniName: "丸亀市", prefName: "香川県", isPref: false,
    })),
    // ⚠ 門真は条件つきの許諾で unverified（台帳に載せない）。R8・R6・R5・R3・R2 は decodeGarble
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kadoma-yosansho-${fy}`, muniCode: "272230", muniName: "門真市", prefName: "大阪府", isPref: false,
    })),
    // ---- 第58巡（2026-10-22・§13-63） ----
    // ⚠ 守山は縦書きの表側「歳／入／出」を kanNamePrefixStrip で落とす。R2 は WARP（現行サイトの R2 は R3 のファイル）。R6 に R5 骨格の prevNote。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `moriyama-yosan-gaiyou-${fy}`, muniCode: "252077", muniName: "守山市", prefName: "滋賀県", isPref: false,
    })),
    // ⚠ 茂原は R8〜R4 が予算書（R8 は decodeGarble）、R3・R2 が概要。R6・R2 が骨格（R7 に prevNote・R3 は前年度列が補正後）
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `mobara-yosansho-${fy}`, muniCode: "122106", muniName: "茂原市", prefName: "千葉県", isPref: false,
    })),
    ...(["r3", "r2"] as const).map((fy) => ({
      srcId: `mobara-toushogaiyou-${fy}`, muniCode: "122106", muniName: "茂原市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 北名古屋は R8〜R4 が decodeGarble、R3・R2 は WARP。R4 は語の無い骨格（R5 に prevNote）。ライセンスは license-no-grant
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kitanagoya-yosansho-${fy}`, muniCode: "232343", muniName: "北名古屋市", prefName: "愛知県", isPref: false,
    })),
    // ⚠ 東大和は1ページに歳入・歳出を縦に積む総括表。R2 はスキャン画像で未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `higashiyamato-yosan-gaiyo-${fy}`, muniCode: "132209", muniName: "東大和市", prefName: "東京都", isPref: false,
    })),
    // ⚠ 和光 R6 は議会修正で、読める表が原案だけのため未収録
    ...(["r8", "r7", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `wako-yosan-gaiyou-${fy}`, muniCode: "112291", muniName: "和光市", prefName: "埼玉県", isPref: false,
    })),
    // ---- 第61巡（2026-10-22・§13-66） ----
    // ⚠ 名取は license-no-grant・noDeepLink。R3・R2 はスキャンで未収録
    ...(["r8", "r7", "r6", "r5", "r4"] as const).map((fy) => ({
      srcId: `natori-yosan-setsumei-${fy}`, muniCode: "042072", muniName: "名取市", prefName: "宮城県", isPref: false,
    })),
    // ⚠ 君津は R8〜R6 が予算書、R5〜R2 が概要（縦書きの財源区分を revenueCropX で落とす）。noDeepLink
    ...(["r8", "r7", "r6"] as const).map((fy) => ({
      srcId: `kimitsu-yosansho-${fy}`, muniCode: "122254", muniName: "君津市", prefName: "千葉県", isPref: false,
    })),
    ...(["r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kimitsu-yosangaiyou-${fy}`, muniCode: "122254", muniName: "君津市", prefName: "千葉県", isPref: false,
    })),
    // ⚠ 木津川は textSource raw。R5 骨格（R6 に prevNote）。R2 は化けで未収録
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `kizugawa-yosansho-${fy}`, muniCode: "262145", muniName: "木津川市", prefName: "京都府", isPref: false,
    })),
    // ⚠ あきる野は kanNameContinues 必須。R2 は修正可決後の当初予算資料。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3"] as const).map((fy) => ({
      srcId: `akiruno-yosansho-${fy}`, muniCode: "132284", muniName: "あきる野市", prefName: "東京都", isPref: false,
    })),
    { srcId: "akiruno-tousho-yosan-shiryou-r2", muniCode: "132284", muniName: "あきる野市", prefName: "東京都", isPref: false },
    // ⚠ 香芝は R6（open）・R3・R2 だけ。R7・R5・R4 は総括が訂正前、R8 は化けで未収録
    ...(["r6", "r3", "r2"] as const).map((fy) => ({
      srcId: `kashiba-yosan-setsumei-${fy}`, muniCode: "292109", muniName: "香芝市", prefName: "奈良県", isPref: false,
    })),
    // ---- 第55巡（2026-10-22・§13-60） ----
    // ⚠ 新発田は歳入の直前の段落を `revenueHeaderExtra: "[、。]"`、歳出の右の「主な事務事業」の列を CropX で落とす。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `shibata-yosan-gaiyou-${fy}`, muniCode: "152064", muniName: "新発田市", prefName: "新潟県", isPref: false,
    })),
    // ⚠ 東松山は R8〜R5 だけ（R4〜R2 の総括はスキャン画像）
    ...(["r8", "r7", "r6", "r5"] as const).map((fy) => ({
      srcId: `higashimatsuyama-yosan-soukatsu-${fy}`, muniCode: "112127", muniName: "東松山市", prefName: "埼玉県", isPref: false,
    })),
    // ⚠ 三条 R4 のファイル名は R3yosangaiyou_no2.pdf（中身は R4）。noDeepLink
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `sanjo-yosan-gaiyou-${fy}`, muniCode: "152048", muniName: "三条市", prefName: "新潟県", isPref: false,
    })),
    // ⚠ 北上は R8・R7 だけ（R6〜R2 の総括は文字がアウトライン化）。R5・H31 は骨格予算
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `kitakami-yosansho-${fy}`, muniCode: "032069", muniName: "北上市", prefName: "岩手県", isPref: false,
    })),
    // ⚠ 薩摩川内は歳出の財源内訳の列見出しが款1 に付く型（見出しと expenditureHeaderExtra の両方が要る）。ライセンスは台帳で要許可
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `satsumasendai-yosansho-${fy}`, muniCode: "462152", muniName: "薩摩川内市", prefName: "鹿児島県", isPref: false,
    })),
    // ---- 中津・貝塚・四国中央・横手・越前（2026-10-22・§13-65） ----
    // ⚠ 中津 R8・R7 は説明書（R7 の比較表は商工費・土木費が予算書と110千円ずれる）、R6〜R2 は対前年度比較表（R2 は WARP）
    ...(["r8", "r7"] as const).map((fy) => ({
      srcId: `nakatsu-yosansetsumeisho-${fy}`, muniCode: "442038", muniName: "中津市", prefName: "大分県", isPref: false,
    })),
    ...(["r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `nakatsu-yosan-taizennen-${fy}`, muniCode: "442038", muniName: "中津市", prefName: "大分県", isPref: false,
    })),
    // ⚠ 貝塚は R4・R8 が骨格（R5 に prevNote）。ライセンスは門真と同文で unverified
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `kaizuka-yosansho-${fy}`, muniCode: "272086", muniName: "貝塚市", prefName: "大阪府", isPref: false,
    })),
    // ⚠ 四国中央は大綱の款別。次のページに同じ合計の性質別
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `shikokuchuo-yosan-taiko-${fy}`, muniCode: "382132", muniName: "四国中央市", prefName: "愛媛県", isPref: false,
    })),
    // ⚠ 横手 R5 は予算書が原案と修正後の2層 PDF なので概要
    ...(["r8", "r7", "r6", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `yokote-yosansho-${fy}`, muniCode: "052035", muniName: "横手市", prefName: "秋田県", isPref: false,
    })),
    { srcId: "yokote-yosan-gaiyou-r5", muniCode: "052035", muniName: "横手市", prefName: "秋田県", isPref: false },
    // ⚠ 越前 R6・R5 は歳入ページに別文書の透明テキストが重なる（revenueCropX）。R8 は骨格的予算
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `echizenshi-yosansho-soukatsu-${fy}`, muniCode: "182095", muniName: "越前市", prefName: "福井県", isPref: false,
    })),
    // ---- 第60巡（2026-10-22・§13-67） ----
    // ⚠ 綾瀬は R8・R7・R6・R4（R5 は文字層の二重化・R3・R2 はウェブに無い）。R6 は歳入が予算書・歳出が概要の2ファイル。款10 は kanNameContinues
    ...(["r8", "r7", "r6", "r4"] as const).map((fy) => ({
      srcId: `ayase-yosansho-${fy}`, muniCode: "142182", muniName: "綾瀬市", prefName: "神奈川県", isPref: false,
    })),
    // ⚠ 牛久 R3 は議会修正で概要が原案のまま（未収録）。ライセンスは台帳で要許可
    ...(["r8", "r7", "r6", "r5", "r4", "r2"] as const).map((fy) => ({
      srcId: `ushiku-yosan-gaiyou-${fy}`, muniCode: "082198", muniName: "牛久市", prefName: "茨城県", isPref: false,
    })),
    // ⚠ 尾張旭 R5 は骨格予算（R6 に prevNote）
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `owariasahi-yosansho-${fy}`, muniCode: "232262", muniName: "尾張旭市", prefName: "愛知県", isPref: false,
    })),
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `gotemba-yosan-gaiyou-${fy}`, muniCode: "222151", muniName: "御殿場市", prefName: "静岡県", isPref: false,
    })),
    // ⚠ 知多は款と項が同じ表に並ぶ（kanIndentMax: 2）。R4〜R2 は Wayback
    ...(["r8", "r7", "r6", "r5", "r4", "r3", "r2"] as const).map((fy) => ({
      srcId: `chita-yosan-gaiyou-${fy}`, muniCode: "232246", muniName: "知多市", prefName: "愛知県", isPref: false,
    })),
  ] as const;
  // budget 階層で決算＋執行率も収録できた自治体（款別 予算現額/決算額/執行率）。
  // 当初予算（BUDGET_SOURCES）と別年度でよい（山梨県: 当初R8 に対し 決算はR6 が最新）。
  const MUNI_EXEC_SOURCES: Record<string, { srcId: string; fy: string; refLabelBase: string }> = {
    "190004": { srcId: "yamanashi-kessan-r6", fy: "R6", refLabelBase: "決算の状況" },
    // 新宿区（2026-07-23 追加・#138）。当初予算26年 + 執行 R6 で「執行」の2例目（区で初）
    "131041": { srcId: "shinjuku-kessan-taisho-r6", fy: "R6", refLabelBase: "款別予算決算対照表" },
  };
  const popDs = normalizedDatasetSchema.parse(readJson(normalizedPath("municipal-accounts", "R6", false)));
  const TOP_REVENUE = 8; // 歳入ドーナツの上位款数（残りは「その他」に集約し内訳を children に）

  const budgets = BUDGET_SOURCES.map((b) => {
    const validation = validationResultSchema.parse(readJson(validationPath(b.srcId)));
    if (validation.status !== "ok") throw new Error(`${b.srcId}: 検証が ${validation.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(b.srcId)));
    if (doc.docType !== "budget-book") throw new Error(`${b.srcId}: budget-book ではありません`);
    const meta = readRawMeta(b.srcId);
    if (!meta) throw new Error(`${b.srcId}: raw-meta がありません`);
    const src = findSource(b.srcId);
    // 歳入・歳出が別ファイルの資料は**ファイルを側で引く**（#257）。以前は `meta.files[0]`（＝歳入 PDF）を
    // 全款のエビデンスにしていたので、歳出の款を開いても歳入 PDF が出ていた。
    // ⚠ **側のファイルは parsed の locator（行ごとの `file`）から決める**（2026-09-10）。#259 は registry の
    //   `parserOptions.revenueFile`/`expenditureFile` を見ていたが、それは kofu-yosansho パーサの語彙で、
    //   **側をファイルで分ける別パーサ**（東京都の CSV・練馬の xlsx・世田谷の CSV＝27年度分）は
    //   オプション名が違うので `files[0]` に落ちたままだった。locator は「実際に読んだファイル」そのもの
    //   なのでパーサに依らない（事業報告と同じ作法）。parserOptions は**突合にだけ使う**（書いてあれば
    //   locator と一致すること — ファイル取り違えを黙って通さない）
    const sideFile = (side: "revenue" | "expenditure") => {
      const names = [...new Set(doc.facts.filter((f) => f.side === side).map((f) => f.locator.file))];
      if (names.length !== 1) {
        throw new Error(
          `${b.srcId}: ${side === "revenue" ? "歳入" : "歳出"}の款が ${names.length} ファイルにまたがっています（${names.join(", ")}）。` +
            `側ごとのエビデンスを1ファイルに決められません`,
        );
      }
      const f = meta.files.find((x) => x.filename === names[0]);
      if (!f) throw new Error(`${b.srcId}: parsed の locator が指す ${names[0]} が raw-meta にありません`);
      return f;
    };
    const file = sideFile("revenue");
    const expSideFile = sideFile("expenditure");
    // 単一ファイル（歳入・歳出が同じファイル）は null ＝ 従来どおり
    const expFile = expSideFile.filename === file.filename ? null : expSideFile;
    {
      const po = (src.parserOptions ?? {}) as { kanFile?: unknown; revenueFile?: unknown; expenditureFile?: unknown };
      const expect = [
        ["kanFile", po.kanFile, file.filename],
        ["revenueFile", po.revenueFile, file.filename],
        ["expenditureFile", po.expenditureFile, expSideFile.filename],
      ] as const;
      for (const [key, want, got] of expect) {
        if (want != null && want !== got) {
          throw new Error(`${b.srcId}: registry の parserOptions.${key}（${String(want)}）と parsed の locator（${got}）が一致しません`);
        }
      }
    }
    const url = src.urls?.[0] ?? src.landingPage ?? "";
    // 歳出側の発行元 URL は registry の urls からファイル名で引く（無ければ取得来歴の fetchedFrom。
    // `manual:` の手動投入は URL でないので従来の宛先に落とす）
    const expUrl = expFile
      ? (src.urls?.find((u) => u.endsWith(`/${expFile.filename}`)) ??
        (/^https?:/.test(expFile.fetchedFrom) ? expFile.fetchedFrom : null) ??
        url)
      : "";
    // 都道府県エンティティの人口は県内市町村（団体コード先頭2桁一致）の住基人口の合計
    const prefCode = b.muniCode.slice(0, 2);
    const popRec = b.isPref
      ? {
          population: popDs.records
            .filter((r) => r.muniCode.slice(0, 2) === prefCode && r.population)
            .reduce((a, r) => a + (r.population ?? 0), 0),
        }
      : popDs.records.find((r) => r.muniCode === b.muniCode);
    if (!popRec?.population) throw new Error(`${b.srcId}: 総務省R6に ${b.muniName}(${b.muniCode}) の人口がありません`);
    // **団体コードと自治体名が総務省の実データと一致するか**（2026-07-16 追加）。
    // 浜松市を **221007（＝静岡市のコード）** で登録していた事故を受けて足した。
    // コードが「実在する別の自治体」だと **人口だけが黙って別人のものになる**（浜松の1人あたりが
    // 静岡の人口で割られて約16.5%過大になっていた）。Σ は款別の話なので通り、
    // 画面にも「浜松市 … 672,775人」と**それらしく**出るため、目視でも見落とした。
    // 名前で突合すれば一撃で落ちる。
    if (!b.isPref) {
      const rec = popDs.records.find((r) => r.muniCode === b.muniCode);
      if (rec && rec.muniName !== b.muniName) {
        throw new Error(
          `${b.srcId}: 団体コード ${b.muniCode} は総務省R6では「${rec.muniName}」です（registry は「${b.muniName}」）。` +
            `コードの取り違えです — 人口が別の自治体のものになり、1人あたりが静かに狂います`,
        );
      }
    }

    const row = (f: (typeof doc.facts)[number]) => ({
      name: f.kanName,
      v: toOku(f.amount),
      prevV: f.prevAmount != null ? toOku(f.prevAmount) : null,
      yoy: yoyPctOf(f.amount, f.prevAmount),
    });
    const expenditure = doc.facts.filter((f) => f.side === "expenditure").map(row).sort((a, b2) => b2.v - a.v);
    // 歳入は款数が多い（20超）ので上位 TOP_REVENUE ＋「その他」に集約（内訳は children）
    const revAll = doc.facts.filter((f) => f.side === "revenue").map(row).sort((a, b2) => b2.v - a.v);
    const revenue =
      revAll.length > TOP_REVENUE + 1
        ? [
            ...revAll.slice(0, TOP_REVENUE),
            {
              name: "その他",
              v: revAll.slice(TOP_REVENUE).reduce((a, r) => a + r.v, 0),
              prevV: revAll.slice(TOP_REVENUE).every((r) => r.prevV != null)
                ? revAll.slice(TOP_REVENUE).reduce((a, r) => a + (r.prevV ?? 0), 0)
                : null,
              yoy: null,
              children: revAll.slice(TOP_REVENUE),
            },
          ]
        : revAll;

    // 主な事業（豊川・和泉・山口を収録。他の budget 市は空配列）。金額降順。
    // 款が取れる市（豊川）は款ドリルで全件使うので全件、款のない市（和泉・山口）は
    // ダッシュボード一覧用に上位 PROJECT_CAP 件へ絞る（山口の事業別は700超あるため）
    const PROJECT_CAP = 60;
    // ⚠ **主な事業が別 docType で来る自治体がある**（#164・横浜の事業計画書）。
    //   `budget-book` は歳入歳出総額を必須にしており、款別表を持たない事業計画書は
    //   そこに入らない（`budget-projects` を新設した理由）。ここで同じ形へ合流させる。
    const extProjects = (() => {
      const ps = SOURCES.find(
        (x) => x.parser === "yokohama-jigyou-keikaku" && x.fiscalYear === doc.fiscalYear && x.scope.includes(b.muniCode),
      );
      if (!ps) return [];
      const v = validationResultSchema.parse(readJson(validationPath(ps.id)));
      if (v.status !== "ok") throw new Error(`${ps.id}: 検証が ${v.status} のため derive しません`);
      const pd = anyParsedDocSchema.parse(readJson(parsedPath(ps.id)));
      if (pd.docType !== "budget-projects") throw new Error(`${ps.id}: budget-projects ではありません`);
      // 款名は同じ年度の款別（この doc 自身）から引く
      const kanName = new Map<string, string>();
      for (const f of doc.facts) {
        if (f.side === "expenditure" && f.kanNo != null) kanName.set(String(f.kanNo), f.kanName);
      }
      return pd.facts.map((x) => ({
        name: x.name,
        amount: x.amount,
        // ⚠ 款名が引けない事業は**款なし**にする（推測で当てない）
        kan: kanName.get(String(Number(x.kanNo))) ?? null,
        shisaku: "",
        // ⚠ **一律「拡充」にしない**（レビューで発覚）。目次の丸印は新規と拡充を区別せず、
        //   前年度0の事業まで拡充バッジが付いていた。詳細シートで具体化できたものだけ使う
        kubun: x.kubun === "新規" ? ("新規" as const) : x.kubun === "拡充" ? ("拡充" as const) : null,
        prevAmount: x.prevAmount ?? undefined,
        description: "",
        locator: x.locator,
        srcId: ps.id,
        srcTitle: ps.title,
      }));
    })();
    const projectsAll = (doc.projects ?? [])
      .map((p) => ({
        name: p.name,
        amountOku: toOku(p.amount),
        kan: p.kan,
        // 施策（山梨県の中項目《…》など）。無い様式は空文字
        shisaku: p.shisaku || "",
        kubun: p.kubun,
        prevAmountOku: p.prevAmount != null ? toOku(p.prevAmount) : null,
        description: p.description || "",
        refLabel: `${src.title} p.${p.locator.page ?? "?"}`,
        refLocalUrl: `/sources/${b.srcId}/${p.locator.file}#page=${p.locator.page ?? 1}`,
      }))
      .concat(
        extProjects.map((p) => ({
          name: p.name,
          amountOku: toOku(p.amount),
          kan: p.kan,
          shisaku: p.shisaku,
          kubun: p.kubun,
          prevAmountOku: p.prevAmount != null ? toOku(p.prevAmount) : null,
          description: p.description,
          refLabel: `${p.srcTitle} p.${p.locator.page ?? "?"}`,
          refLocalUrl: `/sources/${p.srcId}/${p.locator.file}#page=${p.locator.page ?? 1}`,
        })),
      )
      .sort((a, b2) => b2.amountOku - a.amountOku);
    // 款が取れる市（豊川）は款ドリルで全件、都道府県（施策別に全件見せる）も全件、
    // 款のない市（和泉・山口・700超）はダッシュボード一覧用に上位 PROJECT_CAP 件へ
    const projects =
      projectsAll.some((p) => p.kan) || b.isPref ? projectsAll : projectsAll.slice(0, PROJECT_CAP);

    const yoyTotal = yoyPctOf(doc.expenditureTotal, doc.prevExpenditureTotal);
    return {
      muniCode: b.muniCode,
      muniName: b.muniName,
      prefName: b.prefName,
      // 都道府県エンティティか（類似自治体比較を出さない・ラベルを変える）
      isPref: b.isPref,
      projects,
      // 決算＋執行率（収録できた自治体のみ。当初予算とは別年度でよい）
      execution: MUNI_EXEC_SOURCES[b.muniCode] ? [buildExecYear(MUNI_EXEC_SOURCES[b.muniCode]!)] : [],
      fy: doc.fiscalYear,
      fyLabel: `${eraYear(doc.fiscalYear)}年度 当初予算`,
      population: popRec.population,
      // 都道府県は「県内」で決め打ちにしない（大阪府・東京都で「府民1人あたり…県内市町村」と
      // ちぐはぐになる）。団体名の末字から 都/道/府/県 を取って言い換える（2026-07-25）
      populationLabel: b.isPref
        ? `${b.muniName.slice(-1)}内市区町村の住民基本台帳人口の合計（総務省 令和6年度決算）`
        : "住民基本台帳人口（総務省 令和6年度決算）",
      totalOku: toOku(doc.expenditureTotal),
      prevTotalOku: doc.prevExpenditureTotal != null ? toOku(doc.prevExpenditureTotal) : null,
      yoyLabel: yoyTotal != null ? `${yoyTotal >= 0 ? "+" : ""}${yoyTotal.toFixed(1)}%` : "",
      prevBasis: doc.prevBasis,
      // 前年度列の基準が当初でないときの根拠（札幌 R6・R2 の骨格予算 → 肉付後）。
      // 資料に注記が無いケースは registry の parserOptions.prevNote で与えている
      prevNote: doc.prevNote ?? "",
      revenue,
      expenditure,
      sourceTitle: src.title,
      sourceUrl: wayback(url),
      originUrl: url,
      sourceLocalUrl: `/sources/${b.srcId}/${file.filename}`,
      // 分冊形式（歳入・歳出が別ファイル）のときだけ歳出側のコピー（#257）。1ファイルの資料は null
      expenditureEvidence: expFile
        ? {
            localUrl: `/sources/${b.srcId}/${expFile.filename}`,
            originUrl: expUrl,
            sourceUrl: wayback(expUrl),
          }
        : null,
      pagesLabel: "款別歳入歳出",
      evidence: [
        {
          title: expFile ? `${src.title}（歳入）` : src.title,
          type: "PDF",
          url: wayback(url),
          localUrl: `/sources/${b.srcId}/${file.filename}`,
          source: url ? new URL(url).hostname : "",
          thumb: `${file.filename} ・ sha256 ${file.sha256.slice(0, 16)}… ・ ${file.fetchedAt.slice(0, 10)} 取得`,
        },
        ...(expFile
          ? [
              {
                title: `${src.title}（歳出）`,
                type: "PDF",
                url: wayback(expUrl),
                localUrl: `/sources/${b.srcId}/${expFile.filename}`,
                source: expUrl ? new URL(expUrl).hostname : "",
                thumb: `${expFile.filename} ・ sha256 ${expFile.sha256.slice(0, 16)}… ・ ${expFile.fetchedAt.slice(0, 10)} 取得`,
              },
            ]
          : []),
      ],
    };
  });

  {
    const split = budgets.filter((x) => x.expenditureEvidence);
    const sameUrl = split.filter((x) => x.expenditureEvidence!.originUrl === x.originUrl);
    console.log(
      `  ・歳入・歳出が別ファイルの年度: ${split.length}（歳出側のエビデンスを持つ` +
        `${sameUrl.length ? `・うち歳出の発行元 URL をファイル単位で引けず歳入側と同じ宛先: ${sameUrl.length}` : ""}）`,
    );
  }

  // budget 階層は1自治体＝複数年度になり得る（政令市は R2〜R8 の7年前後さかのぼれる）。
  // 年度は**新しい順**に並べる（画面の年度ドロップダウンの並び・既定の選択がこの順に依存する）。
  // 比較は fyRank（pipeline/lib/fy.ts・R > H）。
  const byCodeYears: Record<string, typeof budgets> = {};
  for (const b of budgets) (byCodeYears[b.muniCode] ??= []).push(b);
  for (const [code, ys] of Object.entries(byCodeYears)) {
    ys.sort((a, z) => fyRank(z.fy) - fyRank(a.fy));
    const dup = ys.map((y) => y.fy).filter((fy, i, all) => all.indexOf(fy) !== i);
    if (dup.length) throw new Error(`${code}: 同じ年度が重複しています（${dup.join(",")}）`);
  }
  // 最新年度だけの索引。市区町村選択・類似比較・coverage・routing は「その自治体の代表値」しか
  // 要らないのでこちらを使う（複数年度化しても既存の消費側を壊さないための互換レイヤ）
  const muniBudgetsOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 甲府の類似4市（豊川・山口・沼津・和泉）の当初予算（款別歳入歳出・前年当初比較つき）。
// budget 階層: 予算資料に主な事業・執行・評価が無いため款別＋前年比較のみ。金額は億円

export interface MuniKanRow {
  name: string;
  /** 当年度予算額（億円） */
  v: number;
  /** 前年度予算額（億円） */
  prevV: number | null;
  /** 対前年度（%） */
  yoy: number | null;
  /** 「その他」集約の内訳（実款） */
  children?: MuniKanRow[];
}

export interface MuniProject {
  name: string;
  /** 予算額（億円） */
  amountOku: number;
  /** 属する款（豊川など款が取れる様式のみ。和泉の重点事業は null） */
  kan: string | null;
  /** 施策（山梨県の中項目《…》など施策別グルーピング。無い様式は空文字） */
  shisaku: string;
  /** 新規/拡充/繰越 */
  kubun: "新規" | "拡充" | "繰越" | null;
  /** 前年度予算額（億円。事業単位の前年度がある豊川のみ、他は null） */
  prevAmountOku: number | null;
  description: string;
  refLabel: string;
  /** 自サーバー配信の原本コピー（#page=N 付き） */
  refLocalUrl: string;
}

/** 決算＋執行率の1行（款別）。KofuExecRow と同形 */
export interface MuniExecRow {
  name: string;
  /** 予算現額（億円・補正/繰越込み） */
  budgetOku: number;
  /** 収入済額（歳入）/ 支出済額（歳出）（億円） */
  settledOku: number;
  /** 資料記載の収入率/執行率（%）。予算現額0の款は null */
  ratePct: number | null;
  ref: string;
  refLabel: string;
  /** 内訳（甲府の市税内訳など。山梨県決算にはないので通常 undefined） */
  breakdownNote?: string;
}

/** 決算＋執行率の1年度分（款別歳入歳出・KofuExecutionYear と同形） */
export interface MuniExecutionYear {
  fy: string;
  basis: "速報" | "確定";
  fyLabel: string;
  asOf: string;
  asOfNote: string;
  population: number | null;
  revenueBudgetTotalOku: number;
  revenueSettledTotalOku: number;
  expenditureBudgetTotalOku: number;
  expenditureSettledTotalOku: number;
  revenue: MuniExecRow[];
  expenditure: MuniExecRow[];
  sourceTitle: string;
  sourceUrl: string;
  originUrl: string;
  sourceLocalUrl: string;
  evidence: { title: string; type: string; url: string; localUrl: string; source: string; thumb: string }[];
}

export interface MuniBudget {
  muniCode: string;
  muniName: string;
  prefName: string;
  /** 都道府県エンティティ（県全体）か。市町村比較・主な事業は出さない */
  isPref: boolean;
  fy: string;
  fyLabel: string;
  population: number;
  populationLabel: string;
  totalOku: number;
  prevTotalOku: number | null;
  yoyLabel: string;
  prevBasis: "当初" | "補正後";
  /** 前年度列に関する資料注記。基準が「当初」でないときの根拠を画面に出す。無ければ空文字 */
  prevNote: string;
  revenue: MuniKanRow[];
  expenditure: MuniKanRow[];
  /** 主な事業（豊川・和泉のみ。他市は空配列） */
  projects: MuniProject[];
  /** 決算＋執行率（山梨県のみ。当初予算とは別年度。他は空配列） */
  execution: MuniExecutionYear[];
  sourceTitle: string;
  sourceUrl: string;
  originUrl: string;
  sourceLocalUrl: string;
  /**
   * 歳入・歳出が別ファイルの分冊形式（revenueFile/expenditureFile）の歳出側のコピー（#257）。
   * sourceLocalUrl は歳入側。1ファイルの資料は null（画面は sourceLocalUrl だけを使う）
   */
  expenditureEvidence: { localUrl: string; originUrl: string; sourceUrl: string } | null;
  pagesLabel: string;
  evidence: { title: string; type: string; url: string; localUrl: string; source: string; thumb: string }[];
}

/**
 * 団体コード → 当初予算の索引。**本体は載せない**（#216）。
 *
 * ⚠⚠ **予算の中身をここに焼き込まないこと**。全エンティティ・全年度を TS モジュールで持つと
 * バンドルが 6.8MB になり、**ビルドのほぼ全部がその解析時間**になる（実測: 6.8MB で
 * Compiled in 3.2min、重複込みの 8.9MB では 6.0min。**サイズに対して超線形に効く**）。
 * 本体は public/munibudgets/《団体コード》.json から useMuniBudgets が実行時に取る
 * （decision 階層の県シャードと同じ作法）。
 *
 * ここに置いてよいのは**サーバ側で同期的に要るものだけ** — サイトマップ（sitemap.ts）と
 * URL 解決（routing.ts）はビルド時に全団体の名前を引くので、フェッチでは間に合わない。
 */
export interface MuniBudgetIndexEntry {
  muniName: string;
  prefName: string;
  /** 都道府県エンティティ（県全体）か */
  isPref: boolean;
  /** 収録年度（新しい順）。年度ドロップダウンはこれで作る */
  fys: string[];
  /** いずれかの年度に主な事業があるか（トップの「収録の深さ」の段割り用） */
  hasProjects: boolean;
}

export const MUNI_BUDGET_INDEX: Record<string, MuniBudgetIndexEntry> = ${JSON.stringify(
    Object.fromEntries(
      Object.entries(byCodeYears).map(([code, ys]) => [
        code,
        {
          muniName: ys[0]!.muniName,
          prefName: ys[0]!.prefName,
          isPref: !!ys[0]!.isPref,
          fys: ys.map((y) => y.fy),
          hasProjects: ys.some((y) => (y.projects?.length ?? 0) > 0),
        },
      ]),
    ),
    null,
    2,
  )};

/** budget 階層（予算ベースの款別ダッシュボードを持つ）自治体の団体コード */
export const BUDGET_MUNIS: string[] = ${JSON.stringify(Object.keys(byCodeYears))};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/munibudgets.gen.ts"), muniBudgetsOut, "utf8");

  // 本体は団体コードごとのシャードへ（決定的: 年度は新しい順、キーは団体コード昇順）
  const mbDir = join(process.cwd(), "public", "munibudgets");
  rmSync(mbDir, { recursive: true, force: true });
  mkdirSync(mbDir, { recursive: true });
  for (const [code, ys] of Object.entries(byCodeYears).sort((a, z) => a[0].localeCompare(z[0]))) {
    writeFileSync(join(mbDir, `${code}.json`), JSON.stringify(ys), "utf8");
  }
  console.log(
    `✓ 類似市の当初予算を導出 → src/client/lib/munibudgets.gen.ts（${Object.values(byCodeYears)
      .map((ys) => `${ys[0]!.muniName}:${ys[0]!.totalOku.toFixed(0)}億${ys.length > 1 ? `(${ys.length}年度)` : ""}`)
      .join(" / ")}）`,
  );
}


// ============================================================================
// 当初予算の款項目（項以下の内訳）→ src/client/lib/budgetdetail.gen.ts（#191）
// ============================================================================
// **プロジェクト初の「款より下」**。全自治体で款別（第1階層）までしか収録できておらず、
// `/roadmap` の later「款より下（項・目・節）の内訳」はここで初めて実データが入る。
//
// ⚠ **節・細節は載せない**（parsed には在る）。歳出の節は**地方自治法の性質別区分**
//   （報酬・給料・委託料…）で款項目の目的別とは軸が違い、**款ドリルの下に並べると
//   「目的別の内訳」と誤読させる**。しかも R8 歳出だけで節1,857・細節4,571 行あり、
//   静的 import する gen に入れるとバンドルに載る（決算シャードと同じ理由で避ける）。
//   性質別のクロス集計は別の画面として起こすべきもの。
// ⚠ **一般会計だけ**（画面が一般会計なので）。parsed は全17会計を持っている。
{
  // #191 の CSV 版（R6〜R8・当年度のみ）と #192 の XLSX 版（R5〜R3・**前年度つき**）の両方
  const DETAIL_PARSERS = new Set(["yokohama-yosan-meisai-csv", "yokohama-setsumeisho-xlsx"]);
  const detailSources = SOURCES.filter((s) => DETAIL_PARSERS.has(s.parser));
  // ⚠ prevV は**資料によって無い**（CSV 版は当年度のみ）。無いことを 0 で表さない
  type Moku = { name: string; v: number; prevV: number | null };
  type Ko = { name: string; v: number; prevV: number | null; moku: Moku[] };
  type Entry = {
    fy: string; fyLabel: string;
    /** 側 → 款名 → 項（金額降順・各項の下に目） */
    byKan: Record<"revenue" | "expenditure", Record<string, Ko[]>>;
    sourceTitle: string; localUrl: string; refLabel: string;
    originUrl: string; archiveUrl: string;
  };
  const byCode: Record<string, Entry[]> = {};
  /** 年度をまたぐ突合のために、款レベルの合計だけ控えておく（下の ★★ で使う） */
  const detailTotals: { code: string; fy: string; id: string; cur: [number, number]; prev: [number | null, number | null] }[] = [];
  /** 款行の前年度額（款別一覧の前年度当初額との突合に使う） */
  const detailKanPrev: { id: string; fy: string; code: string; printed: Record<string, number> }[] = [];
  for (const src of detailSources) {
    const v = validationResultSchema.parse(readJson(validationPath(src.id)));
    if (v.status !== "ok") throw new Error(`${src.id}: 検証が ${v.status} のため derive しません`);
    const doc = anyParsedDocSchema.parse(readJson(parsedPath(src.id)));
    if (doc.docType !== "budget-detail") throw new Error(`${src.id}: budget-detail ではありません`);
    const meta = readRawMeta(src.id);
    if (!meta) throw new Error(`${src.id}: raw-meta がありません（先に pipeline:fetch）`);
    const file = meta.files[0]!;
    // scope から団体コードを引く（他の gen と同じ作法）
    const m = src.scope.match(/団体コード(\d{6})/);
    if (!m) throw new Error(`${src.id}: scope から団体コードを読めません（${src.scope}）`);
    const code = m[1]!;

    const byKan = { revenue: {}, expenditure: {} } as Entry["byKan"];
    for (const side of ["revenue", "expenditure"] as const) {
      const leaves = doc.facts.filter((f) => f.side === side && f.accountCode === "01");
      const kanMap: Record<string, Record<string, Record<string, { v: number; p: number | null }>>> = {};
      // ⚠⚠ **項の前年度は Σ目で作ってはいけない**（#192 のレビューで発覚）。当年度に廃止された目は
      //   行ごと消えるので、Σ目prev は項行prev より小さくなり、**前年比が符号ごと逆になる項が出る**
      //   （R5 歳出「選挙費」は実際は減なのに +50.1% と出ていた）。**原典の項行の値をそのまま使う**。
      const koPrinted: Record<string, number | null> = {};
      for (const f of leaves) {
        const bucket = ((kanMap[f.kanName] ??= {})[f.koName] ??= {});
        const cell = (bucket[f.mokuName] ??= { v: 0, p: null });
        cell.v += f.amount;
        // ⚠ 前年度は**全部の葉が持つとは限らない**（皆増は空）。持っているものだけ足す
        if (f.prevAmount != null) cell.p = (cell.p ?? 0) + f.prevAmount;
        koPrinted[`${f.kanName}/${f.koName}`] = f.koPrevAmount;
      }
      byKan[side] = Object.fromEntries(
        Object.entries(kanMap).map(([kan, kos]) => [
          kan,
          Object.entries(kos)
            .map(([ko, mokus]) => {
              const vals = Object.values(mokus);
              const printed = koPrinted[`${kan}/${ko}`];
              return {
                name: ko,
                v: vals.reduce((a, b) => a + b.v, 0) / 1e5, // 千円 → 億円
                prevV: printed == null ? null : printed / 1e5,
                moku: Object.entries(mokus)
                  .map(([nm, m]) => ({ name: nm, v: m.v / 1e5, prevV: m.p == null ? null : m.p / 1e5 }))
                  .sort((a, b) => b.v - a.v),
              };
            })
            .sort((a, b) => b.v - a.v),
        ]),
      );
    }
    // 款行の前年度額（款別一覧の前年度当初額と突合するために控える）
    const kanPrinted: Record<string, number> = {};
    for (const f of doc.facts) {
      if (f.accountCode !== "01" || f.kanPrevAmount == null) continue;
      kanPrinted[`${f.side}/${f.kanName}`] = f.kanPrevAmount;
    }
    detailKanPrev.push({ id: src.id, fy: src.fiscalYear, code, printed: kanPrinted });
    detailTotals.push({
      code, fy: src.fiscalYear, id: src.id,
      cur: [doc.generalRevenueTotal, doc.generalExpenditureTotal],
      prev: [doc.prevRevenueTotal, doc.prevExpenditureTotal],
    });
    (byCode[code] ??= []).push({
      fy: src.fiscalYear,
      fyLabel: `${eraYear(src.fiscalYear)}年度 当初予算`,
      byKan,
      sourceTitle: src.title,
      localUrl: `/sources/${src.id}/${file.filename}`,
      refLabel: file.filename,
      originUrl: src.urls![0]!,
      archiveUrl: wayback(src.urls![0]!),
    });
  }
  for (const list of Object.values(byCode)) list.sort((a, b) => fyRank(b.fy) - fyRank(a.fy));

  // ★ 出口の突合: 款ごとの Σ項 が、同じ年度の**既収録の款別**（munibudgets の元＝budget-book）と一致する。
  //   これが揃わないと「款は A なのに項の合計は B」という画面になる。
  for (const [code, list] of Object.entries(byCode)) {
    for (const e of list) {
      const bb = SOURCES.find(
        (s) => s.parser === "kofu-yosansho" && s.fiscalYear === e.fy && s.scope.includes(code),
      );
      // ⚠ **見つからなければ落とす**。この突合は**唯一の外部 Σ 錨**であり、
      //   「単位＝千円」の確定根拠でもある（原典は単位を書いていない）。黙ってスキップすると、
      //   款別が別パーサの自治体に detail を足した瞬間に**錨が無言で消える**。
      if (!bb) {
        throw new Error(
          `${code} ${e.fy}: 款項目（detail）を収録しているのに、突合できる款別（budget-book）が見つかりません。` +
            `Σ項 = 款額 はこの資料の唯一の外部の錨（単位の確定根拠でもある）なので、無いまま通さない`,
        );
      }
      const bdoc = anyParsedDocSchema.parse(readJson(parsedPath(bb.id)));
      if (bdoc.docType !== "budget-book") continue;
      for (const side of ["revenue", "expenditure"] as const) {
        for (const [kan, kos] of Object.entries(e.byKan[side])) {
          // ⚠ **当年度だけ**突合する。前年度は当年度に廃止された目のぶん葉が少ないので閉じない
          const got = Math.round(kos.reduce((a, k) => a + k.v, 0) * 1e5);
          const want = bdoc.facts.find((f) => f.side === side && f.kanName === kan)?.amount;
          if (want == null) throw new Error(`${bb.id}: 款項目の款「${kan}」(${side}) が款別一覧にありません`);
          if (got !== want) {
            throw new Error(
              `${bb.id}: 款「${kan}」(${side}) の Σ項 ${got.toLocaleString()} が款別一覧の ` +
                `${want.toLocaleString()} と一致しません（差 ${(got - want).toLocaleString()}）`,
            );
          }
          // ★ **前年度も同じ年度の款別一覧と突合する**（#192 のレビューで足した）。
          //   ⚠ 年度チェーン（下の ★★）は**前の年度が収録済みの年度しか守れない**ので、
          //   鎖の端（R3）は素通りしていた。こちらは**同じ年度の別資料**と突合するので端も守れる。
          const printedPrev = detailKanPrev.find((x) => x.code === code && x.fy === e.fy)?.printed[`${side}/${kan}`];
          const wantPrev = bdoc.facts.find((f) => f.side === side && f.kanName === kan)?.prevAmount;
          if (printedPrev != null && wantPrev != null && printedPrev !== wantPrev) {
            throw new Error(
              `${bb.id}: 款「${kan}」(${side}) の**前年度**額が款項目 ${printedPrev.toLocaleString()} / ` +
                `款別一覧 ${wantPrev.toLocaleString()} で食い違います（差 ${(printedPrev - wantPrev).toLocaleString()}）`,
            );
          }
        }
      }
    }
  }

  // ★★ 年度をまたぐ突合: **ある年度の「前年度」合計 = 前の年度の資料の「当年度」合計**。
  //   validate は1資料の中しか見ないので、ここでしか張れない。**前年度列がこの資料の価値**
  //   （#192 の目的）なので、列を取り違えたまま通すと画面の前年比が全部ずれる。
  //   ⚠ **項・目のレベルでは同じ等式が成り立たない**（実測）。原典の前年度額は
  //     **当年度の科目体系に組み替えたもの**で、廃止された項は行ごと消えるため、
  //     R5 の前年（項）と R4 の当年（項）は 115項中12項が食い違う。**款の合計だけが閉じる**。
  {
    const byCodeTotals: Record<string, typeof detailTotals> = {};
    for (const t of detailTotals) (byCodeTotals[t.code] ??= []).push(t);
    let chained = 0;
    for (const list of Object.values(byCodeTotals)) {
      for (const t of list) {
        const prevFy = list.find((x) => fyRank(x.fy) === fyRank(t.fy) - 1);
        if (!prevFy) continue; // 前の年度が未収録（R2 以前・R7）なら鎖はそこで切れる
        for (const [i, label] of [[0, "歳入"], [1, "歳出"]] as const) {
          const want = t.prev[i];
          if (want == null) continue; // 前年度列を持たない資料（CSV 版）
          if (want !== prevFy.cur[i]) {
            throw new Error(
              `${t.id} の${label}「前年度」合計 ${want.toLocaleString()} が、` +
                `${prevFy.id} の「当年度」合計 ${prevFy.cur[i].toLocaleString()} と一致しません` +
                `（差 ${(want - prevFy.cur[i]).toLocaleString()}）。列の取り違えか年度の取り違えを疑うこと`,
            );
          }
          chained++;
        }
      }
    }
    if (detailTotals.length > 0) console.log(`  款項目の年度チェーン: ${chained} 本（前年度合計 = 前年の当年度合計）`);
  }

  const out = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// **款より下（項・目）の内訳**。金額は億円（原典の千円値を 1e5 で割った正確値）。
// ⚠ 節・細節は載せていない（歳出の節は性質別区分で款項目の目的別とは軸が違う。parsed には在る）。
// ⚠ 一般会計のみ（parsed は全17会計を持つ）。

/** ⚠ prevV は資料によって null（CSV 版 R6〜R8 は当年度のみ。XLSX 版 R5〜R3 は前年度つき） */
export type BudgetDetailKo = { name: string; v: number; prevV: number | null; moku: { name: string; v: number; prevV: number | null }[] };
export type BudgetDetailYear = {
  fy: string;
  fyLabel: string;
  byKan: Record<"revenue" | "expenditure", Record<string, BudgetDetailKo[]>>;
  sourceTitle: string;
  localUrl: string;
  refLabel: string;
  originUrl: string;
  archiveUrl: string;
};

/** 団体コード → 年度（新しい順）。款ドリルの「項・目の内訳」が使う */
export const BUDGET_DETAIL: Record<string, BudgetDetailYear[]> = ${JSON.stringify(byCode, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/budgetdetail.gen.ts"), out, "utf8");
  const n = Object.values(byCode).flat();
  console.log(
    `✓ 款項目（項以下の内訳）を導出 → src/client/lib/budgetdetail.gen.ts（` +
      n.map((e) => `${e.fy}:歳入${Object.values(e.byKan.revenue).flat().length}項/歳出${Object.values(e.byKan.expenditure).flat().length}項`).join(" / ") +
      `）`,
  );
}

// ============================================================================
// データ整備状況 → public/coverage.json（/coverage ページが取得する）
//
// 「全1,741市町村を網羅した ○× 一覧（手付かずも含む）」＋「原本の保管情報」＋
// 「③再配布のライセンス区分」を1つの JSON にまとめる。ToDo（空欄＝未収録）と
// 情報公開（何を保管しているか）とリスク開示（要許可なのに配信中か）を兼ねる。
//
// **バンドルに入れず public/ に置く**理由: 全市町村を載せると 130KB 級になり、
// 静的 import すると全ページのバンドルに乗ってしまう。このページでだけ取得する。
//
// ライセンス区分は license 原文から推定（表記が揺れたら安全側の unverified に落ちる）:
//   open / permission-required / unverified
// このブロックは他ブロックが書いた gen とシャードを読むので**必ず最後に置く**。
// ============================================================================
{
  const { KOFU_BUDGET_YEARS } = await import("../src/client/lib/kofu.gen");
  const { KOFU_PROJECT_YEARS } = await import("../src/client/lib/projects.gen");
  const { KOFU_REPORT_YEARS } = await import("../src/client/lib/report.gen");
  const { KOFU_COUNCIL_YEARS, MUNI_COUNCIL_YEARS } = await import("../src/client/lib/council.gen");
  const { KOFU_EXECUTION_YEARS } = await import("../src/client/lib/execution.gen");
  const { KOFU_EVALUATION_YEARS } = await import("../src/client/lib/evaluations.gen");
  const { KOFU_OUTTURN_YEARS } = await import("../src/client/lib/outturn.gen");
  const { BUDGET_DETAIL } = await import("../src/client/lib/budgetdetail.gen");
  const BUDGET_DETAIL_FOR_COVERAGE: Record<string, { fy: string; koCount: number; mokuCount: number }[]> =
    Object.fromEntries(
      Object.entries(BUDGET_DETAIL).map(([code, years]) => [
        code,
        years.map((e) => {
          const kos = [...Object.values(e.byKan.revenue), ...Object.values(e.byKan.expenditure)].flat();
          return { fy: e.fy, koCount: kos.length, mokuCount: kos.reduce((a, k) => a + k.moku.length, 0) };
        }),
      ]),
    );
  const { MUNI_BUDGET_INDEX, BUDGET_MUNIS } = await import("../src/client/lib/munibudgets.gen");
  const MUNI_BUDGET_YEARS = readMuniBudgetShards();
  // 出口ゲート: 議会の構成は「表示年度と同じ年度」だけを画面に出すので、予算の収録年度に無い年度の
  // 構成は**配信しても誰にも見えない**（静かに消える型）。団体が budget 階層に居ることもここで見る
  for (const [code, list] of Object.entries(MUNI_COUNCIL_YEARS)) {
    const ys = MUNI_BUDGET_YEARS[code];
    if (!ys) throw new Error(`議会の構成 ${code}: budget 階層の団体ではありません（画面に出ない）`);
    for (const c of list) {
      if (!ys.some((y) => y.fy === c.fy)) {
        throw new Error(`議会の構成 ${code} ${c.fy}: 当初予算にその年度が無いので画面に出ません`);
      }
      const name = MUNI_BUDGET_INDEX[code]?.muniName;
      if (name && !c.body.startsWith(name)) {
        throw new Error(`議会の構成 ${code}: 議会名「${c.body}」が団体名「${name}」で始まりません（団体コードの取り違え）`);
      }
    }
  }
  const { PREF_CODES } = await import("../src/client/lib/decision-index.gen");
  const { DECISION_YEARS } = await import("../src/client/lib/decision-index.gen");

  // 列（この順で ○× を並べる）。kessan は全市町村が持つ
  const DATASETS = [
    { key: "kessan", label: "決算", full: "決算（総務省・決算状況調）" },
    { key: "budget", label: "予算", full: "当初予算（款別・前年当初比）" },
    { key: "projects", label: "事業", full: "事業単位（主な事業）" },
    { key: "report", label: "成果", full: "事業報告（成果指標・コスト）" },
    { key: "council", label: "議会", full: "議会の構成（予算議決時）" },
    { key: "execution", label: "執行", full: "執行・決算（自治体の確定値）" },
    { key: "evaluation", label: "評価", full: "事務事業評価" },
    { key: "outturn", label: "統計", full: "統計書（款項×当初/最終/決算）" },
    { key: "detail", label: "内訳", full: "款より下の内訳（項・目）" },
  ] as const;

  const srcs = SOURCES.filter((s) => !s.fixture);
  const archiveEntries = (() => {
    const p = join(DATA_DIR, "archives.json");
    if (!existsSync(p)) return [];
    return archivesLedgerSchema.parse(readJson(p)).entries;
  })();
  // ライセンス区分（licenseClassOf）はファイル冒頭に置いてある — この区分は /coverage の
  // 表示だけでなく、画面のエビデンスリンクを自サーバーのコピーから発行元へ切り替える
  // 判定（evidence-policy.gen.ts）でもあるため、両方から使う。

  const KNOWN = [
    { code: "192015", name: "甲府市", pref: "山梨県" },
    ...BUDGET_MUNIS.map((c) => {
      const b = MUNI_BUDGET_INDEX[c]!;
      return { code: c, name: b.muniName, pref: b.prefName };
    }),
  ];
  const entityOf = (s: (typeof srcs)[number]): { scopeKind: "national" | "entity" | "unknown"; code?: string } => {
    if (/^全市町村/.test(s.scope)) return { scopeKind: "national" };
    const byCode = s.scope.match(/団体コード(\d{6})/)?.[1];
    if (byCode && KNOWN.some((k) => k.code === byCode)) return { scopeKind: "entity", code: byCode };
    const nm = (s.scope.split("（")[0] ?? "").replace(/議会$/, "").trim();
    const hit = KNOWN.find((k) => k.name === nm);
    return hit ? { scopeKind: "entity", code: hit.code } : { scopeKind: "unknown" };
  };
  // 「この資料が画面のどこで使われているか」。/sources（データ出典）に出す。
  // **パーサ（＝資料の種別）から導く** — 資料は増え続けるので、資料ごとに手で書くと必ず実態とズレる
  // （旧 SOURCES は甲府市＋総務省だけを手で並べた配列で、政令市18団体97資料が載っていなかった）。
  const USED_BY_PARSER: Record<string, string> = {
    "kofu-yosansho": "ダッシュボード／款別ドリルダウン／前年比較",
    "osaka-yosansho": "ダッシュボード／款別ドリルダウン／前年比較",
    "hiroshima-yosansho": "ダッシュボード／款別ドリルダウン／前年比較",
    "tokyo-yosangaiyou-csv": "ダッシュボード／款別ドリルダウン／前年比較",
    "yokohama-yosan-meisai-csv": "款別ドリルダウンの項・目の内訳（当初予算）",
    "yokohama-setsumeisho-xlsx": "款別ドリルダウンの項・目の内訳（当初予算・前年度つき）",
    "yokohama-jigyou-keikaku": "主な事業（款項目つき・当初予算）",
    "nerima-kanbetsu-xlsx": "ダッシュボード／款別ドリルダウン／前年比較",
    "arakawa-setsumei": "ダッシュボード／款別ドリルダウン／前年比較",
    "setagaya-mieruka-csv": "ダッシュボード／款別ドリルダウン／前年比較",
    "setagaya-tousho-xls": "ダッシュボード／款別ドリルダウン／前年比較",
    "soumu-shichoson-kessan": "全市町村の決算ダッシュボード／款別・歳入内訳／1人あたり／類似自治体比較",
    "soumu-shichoson-seishitsu": "財政指標／性質別歳出",
    "kofu-kessan-syousai": "予算執行状況（決算・確定値）",
    "kofu-zaisei-jokyo": "予算執行状況（速報）",
    "kofu-toukei-zaisei": "款別ドリルダウンの項テーブル（当初→最終→決算→執行率）",
    "kofu-gikai": "議会の構成（会派別議席・議決）",
    "council-transcribed": "議会の構成（会派別議席・議決）",
    "kofu-gyousei-hyouka": "主な事業の評価バッジ",
    "kofu-jigyou-houkoku": "事業報告（成果）",
    "kawasaki-jigyou-hyouka": "事業報告（成果）",
    "sapporo-jigyou-hyouka": "事業報告（成果）",
    "yokohama-jigyo-hyoka": "事業報告（成果）",
    "suginami-jimujigyou-hyouka": "事業報告（成果）",
    "saitama-jigyou-houkoku": "事業報告（成果）",
    "kitakyushu-jigyou-hyoka": "事業報告（成果）",
    "kyotofu-seika-houkoku": "事業報告（成果）",
    "yamanashi-kessan": "予算執行状況（款別 執行率）",
    "shinjuku-kessan-taisho": "予算執行状況（款別 執行率）",
  };
  const sourceCard = (s: (typeof srcs)[number]) => {
    const meta = readRawMeta(s.id);
    const files = (meta?.files ?? []).map((f) => ({
      filename: f.filename,
      sha256: f.sha256.slice(0, 12) + "…",
      bytes: f.bytes,
      fetchedAt: f.fetchedAt.slice(0, 10),
      localUrl: `/sources/${s.id}/${f.filename}`,
    }));
    const arch = archiveEntries.filter((a) => a.sourceId === s.id && a.kind === "file");
    const originUrl = s.urls?.[0] ?? s.url ?? s.landingPage ?? "";
    const isArchiveOrigin = /web\.archive\.org|warp\.ndl\.go\.jp/.test(originUrl);
    const used = USED_BY_PARSER[s.parser];
    if (!used) {
      throw new Error(
        `${s.id}: パーサ "${s.parser}" が USED_BY_PARSER に未登録です。` +
          `/sources に「何に使っているか」を出せません（derive-app-data.ts の USED_BY_PARSER に追加してください）`,
      );
    }
    return {
      sourceId: s.id, title: s.title, publisher: s.publisher, fiscalYear: s.fiscalYear, kind: s.kind,
      used,
      license: s.license, licenseClass: sourceLicenseClass(s),
      originUrl, landingPage: s.landingPage ?? null, files,
      archived: arch.length > 0 || isArchiveOrigin,
      archiveOrigin: isArchiveOrigin,
      // ⚠ 魚拓リンクには **sha256 が不一致と分かっている捕捉を出さない**（2026-09-03・三鷹 R8）。
      //   `attach_37785_1.pdf` のような「今年度用に毎年上書きされる URL」では、台帳の捕捉が**同じ URL に置かれていた
      //   別年度の文書**であることがあり、`arch[0]` をそのまま出すと「令和8年度」のカードの魚拓が令和3年度の PDF を開いた。
      //   優先順: sha256 一致 → 未照合（一致・不一致が未確定）→ 無し。**不一致（false）は落とす**。
      //   ⚠ `archived` のバッジは従来どおり「エントリがある」で点く（照合済みかは `shaVerified` が別に持つ）。
      archiveUrl:
        (arch.find((a) => a.sha256Match === true) ?? arch.find((a) => a.sha256Match !== false))?.waybackUrl ??
        (isArchiveOrigin ? originUrl : null),
      shaVerified: arch.some((a) => a.sha256Match === true),
    };
  };

  const range = (fys: string[]) =>
    fys.length === 0 ? "—" : fys.length === 1 ? fys[0]! : `${fys[fys.length - 1]}〜${fys[0]}（${fys.length}年度）`;
  const kessanRange = range([...DECISION_YEARS]);

  // 収録済み13団体の詳細（データセットごとの中身＋その団体の資料）
  const entityDetail: Record<string, {
    name: string; pref: string; tier: string; isPref: boolean;
    detail: Record<string, string>;
    sources: ReturnType<typeof sourceCard>[];
  }> = {};
  // 事業報告（成果）を収録している自治体 → 中身の説明。**full 以外にも付く**。
  // 以前は full（甲府）だけが d.report を持ち、川崎の572事業を収録しても /coverage が
  // 「成果 ×」と出た（＝収録済みを未収録と偽る）。/coverage は「実際の収録内容」を示すページなので、
  // **レジストリ＋parsed（＝実際に収録したもの）から導く**（2026-07-15）。
  // **新しい事業報告パーサを足したらここにも足す** — 忘れると /coverage が「収録済みを未収録」と
  // 偽る（実際に横浜で踏んだ。2,313事業を収録したのに「成果 ×」と出た）。
  const REPORT_PARSERS = new Set([
    "kofu-jigyou-houkoku", "kawasaki-jigyou-hyouka", "yokohama-jigyo-hyoka", "sapporo-jigyou-hyouka",
    "saitama-jigyou-houkoku", "kitakyushu-jigyou-hyoka", "kyotofu-seika-houkoku",
    "suginami-jimujigyou-hyouka",
  ]);
  const reportDetailByCode: Record<string, string> = {};
  for (const s of srcs) {
    if (!REPORT_PARSERS.has(s.parser)) continue;
    const code = entityOf(s).code;
    if (!code) continue;
    const parsed = readJson(parsedPath(s.id)) as {
      docType?: string;
      facts?: { policy?: string | null }[];
    };
    if (parsed.docType !== "project-report") continue;
    // **画面に出している数と揃える** — scope は一般会計なので、特別会計の事業は数えない
    // （横浜は 2,535 中222件が特別会計。生の件数を出すと /coverage が 2,535、画面が 2,313 で食い違う）。
    // 会計名を持たない資料（甲府・川崎）は素通り＝全件が一般会計の前提で収録している
    const facts = (parsed.facts ?? []).filter((f) => !/会計$/.test(f.policy ?? "") || f.policy === "一般会計");
    const n = facts.length;
    const prev = reportDetailByCode[code];
    const one = `${s.fiscalYear}:${n}件`;
    reportDetailByCode[code] = prev ? `${prev} / ${one}` : one;
  }

  for (const k of KNOWN) {
    const isFull = k.code === "192015";
    const mb = MUNI_BUDGET_YEARS[k.code]?.[0] ?? null;
    const d: Record<string, string> = { kessan: kessanRange };
    if (isFull) {
      d.budget = range(KOFU_BUDGET_YEARS.map((b) => b.fy));
      d.projects = `${range(KOFU_PROJECT_YEARS.map((y) => y.fy))}・計${KOFU_PROJECT_YEARS.reduce((a, y) => a + y.projects.length, 0)}件`;
      d.report = `${KOFU_REPORT_YEARS.map((y) => `${y.fyLabel}${y.reports.length}件`).join(" / ")}（公表サンプルのみ）`;
      d.council = `${range(KOFU_COUNCIL_YEARS.map((c) => c.fy))}・議決つき`;
      d.execution = range(KOFU_EXECUTION_YEARS.map((e) => e.fy));
      d.evaluation = `${range(KOFU_EVALUATION_YEARS.map((y) => y.fy))}・約1,500件`;
      d.outturn = range(KOFU_OUTTURN_YEARS.map((y) => y.fy));
    } else if (mb) {
      // **最新年度だけを書かない** — 政令市は R2〜R8 の7年前後を収録しており、`mb.fyLabel` を
      // 使うと /coverage が「令和8年度」としか言わず実態を過少申告する（2026-07-15 修正）。
      // full と同じく収録年度の範囲を出す
      const ys = MUNI_BUDGET_YEARS[k.code] ?? [mb];
      d.budget = `${range(ys.map((y) => y.fy))}・前年当初比つき`;
      // 事業報告（成果）は budget 階層でも収録し得る（川崎 R6・572事業）
      if (reportDetailByCode[k.code]) d.report = reportDetailByCode[k.code]!;
      if (mb.projects.length > 0) d.projects = `${mb.projects.length}件`;
      // 款より下（項・目）の内訳（#191）。**款別とは別の資料**なので独立した列にしている
      {
        const bd = BUDGET_DETAIL_FOR_COVERAGE[k.code];
        if (bd?.length) {
          d.detail = `${range(bd.map((e) => e.fy))}・${bd[0]!.koCount}項/${bd[0]!.mokuCount}目`;
        }
      }
      if ((mb.execution?.length ?? 0) > 0) d.execution = mb.execution!.map((e) => e.fyLabel).join("・");
      // 議会の構成（予算議決時・council-transcribed）。**予算の収録年度に無い年度は数えない**
      // （画面は表示年度と同じ年度の構成だけを出すので、/coverage もそれに合わせる）
      {
        const cs = (MUNI_COUNCIL_YEARS[k.code] ?? []).filter((c) => ys.some((y) => y.fy === c.fy));
        if (cs.length) d.council = `${range(cs.map((c) => c.fy))}・議決つき`;
      }
    }
    entityDetail[k.code] = {
      name: k.name, pref: k.pref, tier: isFull ? "full" : "budget", isPref: !!mb?.isPref,
      detail: d,
      sources: srcs.filter((s) => entityOf(s).code === k.code).map(sourceCard),
    };
  }

  // ---- 調べたが収録できなかった記録 → coverage.json の unrecordable ------------
  // `/coverage` の × は既定では「まだ手を付けていない」の意味なので、**調べたうえで収録
  // できないと判定したもの**を区別して出す（これまで docs にしか無く、読者には空欄の理由が
  // 見えなかった）。台帳は pipeline/registry/unrecordable.ts。ここでやることは3つ:
  //   ① **団体コードの同一性検査**（§9h の浜松＝静岡市コードの型。実在する別自治体のコードは
  //      静かに紛れ込むので、存在ではなく名前との一致を見る）
  //   ② **収録済みになっていないかの照合** — 「できない」の判定は実際にくつがえる
  //      （豊島 R4・R2 と大田 H27 は #159 の復号で収録できた）。収録できた記録が台帳に
  //      残り続けると `/coverage` が嘘をつくので、**収録済みなら throw して derive を止める**
  //   ③ 表示用の断面（年度ラベル・分類ラベル・自治体ごとの索引）を作る
  const unrecordable = (() => {
    const dsKeys = new Set(DATASETS.map((d) => d.key));
    const catKeys = new Set(UNRECORDABLE_CATEGORIES.map((c) => c.key));
    const muniByCode = new Map(ds.records.map((r) => [r.muniCode, r]));
    // 都道府県エンティティのコード（例 280003 = 兵庫県）。市区町村台帳には居ないので
    // JIS X 0402 の検査数字で検算する（src/client/lib/data.ts の muniCode6 と同じ定義）。
    const prefEntityCode = (pref2: string) => {
      const c = `${pref2}000`;
      const sum = [6, 5, 4, 3, 2].reduce((a, w, i) => a + Number(c[i]) * w, 0);
      return c + String((11 - (sum % 11)) % 10);
    };
    const prefByEntityCode = new Map(
      Object.entries(PREF_CODES).map(([name, code]) => [prefEntityCode(code), name]),
    );

    return UNRECORDABLE.map((u) => {
      const where = `unrecordable「${u.name} ${u.dataset}」`;
      if (!dsKeys.has(u.dataset as (typeof DATASETS)[number]["key"])) {
        throw new Error(`${where}: dataset "${u.dataset}" は /coverage の列にありません（${[...dsKeys].join("/")}）`);
      }
      if (u.categories.length === 0 || u.categories.some((c) => !catKeys.has(c))) {
        throw new Error(`${where}: categories が空か未知の分類です（${u.categories.join(",")}）`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(u.checkedOn)) throw new Error(`${where}: checkedOn は YYYY-MM-DD で書いてください`);
      if (u.fiscalYears.length === 0 && !u.fyUpTo && !u.fyNote) {
        throw new Error(`${where}: 対象年度が空です（fiscalYears / fyUpTo / fyNote のどれかは要る）`);
      }

      // ① 団体コード ↔ 名前の同一性
      const isPrefEntity = prefByEntityCode.has(u.code);
      const trueName = isPrefEntity ? prefByEntityCode.get(u.code)! : muniByCode.get(u.code)?.muniName;
      if (!trueName) {
        throw new Error(
          `${where}: 団体コード ${u.code} が総務省台帳（municipal-accounts R6）にも都道府県エンティティにもありません。` +
            `記憶で書かず data/normalized/municipal-accounts/R6.json から実引きしてください`,
        );
      }
      if (trueName !== u.name) {
        throw new Error(
          `${where}: 団体コード ${u.code} は「${trueName}」です（台帳と食い違っています）。` +
            `実在する別の自治体のコードは静かに紛れ込むので必ず突合してください（§9h の浜松＝静岡市コード）`,
        );
      }
      const prefName = isPrefEntity ? trueName : muniByCode.get(u.code)!.prefName;

      // ② 収録済みになっていないか（＝この記録はもう古くないか）
      // ⚠ **年度ごとに収録できる列は年度で照合する**（budget と detail）。
      //   それ以外（report・evaluation…）は資料まるごとの収録なので、下の粗い照合でよい。
      //   detail を粗いほうに入れると「R8・R6 は収録済みだから R7 の記録も古い」と誤判定する
      //   （#191 で実際にそうなった）。
      const YEARWISE = new Set(["budget", "detail"]);
      const collectedFys: string[] = !YEARWISE.has(u.dataset)
        ? []
        : u.dataset === "detail"
          ? (BUDGET_DETAIL[u.code] ?? []).map((e) => e.fy)
          : u.code === SELF_CODE
            ? KOFU_BUDGET_YEARS.map((b) => b.fy)
            : (MUNI_BUDGET_YEARS[u.code] ?? []).map((y) => y.fy);
      const stale = [
        ...collectedFys.filter((fy) => u.fiscalYears.includes(fy)),
        ...(u.fyUpTo ? collectedFys.filter((fy) => fySeq(fy) <= fySeq(u.fyUpTo!)) : []),
      ];
      if (stale.length > 0) {
        throw new Error(
          `${where}: 「収録できない」と記録されている ${[...new Set(stale)].join("・")} を実際には収録しています。` +
            `判定はくつがえります（豊島 R4・大田 H27 の前例）ので、unrecordable.ts の該当行を削るか年度を狭めてください`,
        );
      }
      if (!YEARWISE.has(u.dataset) && entityDetail[u.code]?.detail[u.dataset]) {
        throw new Error(
          `${where}: 「収録できない」と記録されているのに /coverage の「${u.dataset}」が収録済みになっています` +
            `（${entityDetail[u.code]!.detail[u.dataset]}）。unrecordable.ts の該当行を見直してください`,
        );
      }

      // ③ 表示用の断面。年度ラベルは資料の呼称（H/R）をそのまま年号へ開く
      const parts: string[] = [];
      if (u.fiscalYears.length > 0) {
        parts.push([...u.fiscalYears].sort((a, b) => fyRank(b) - fyRank(a)).map((fy) => `${eraYear(fy)}年度`).join("・"));
      }
      if (u.fyUpTo) parts.push(`${eraYear(u.fyUpTo)}年度以前`);
      if (u.fiscalYears.length === 0 && !u.fyUpTo && u.fyNote) parts.push(u.fyNote);
      return {
        code: u.code, name: u.name, pref: prefName, isPref: isPrefEntity,
        dataset: u.dataset,
        datasetLabel: DATASETS.find((d) => d.key === u.dataset)!.full,
        fyLabel: parts.join(" / "),
        categories: u.categories,
        reason: u.reason,
        url: u.url ?? null,
        checkedOn: u.checkedOn,
        ref: u.ref,
      };
    }).sort((a, b) => a.pref.localeCompare(b.pref, "ja") || a.code.localeCompare(b.code) || a.dataset.localeCompare(b.dataset));
  })();
  /** 団体コード → 収録できないと判定したデータセットの集合（表の印を差し替えるのに使う） */
  const unrecordableByCode = new Map<string, Set<string>>();
  for (const u of unrecordable) {
    const set = unrecordableByCode.get(u.code) ?? new Set<string>();
    set.add(u.dataset);
    unrecordableByCode.set(u.code, set);
  }

  // ⚠ **書き出す前に検査する** — 「調べたが収録できなかった」理由も**プレーンテキストとして**描画される（`/coverage` と
  // 市区町村選択の両方）。**roadmap と同じ規約を機械的に守らせる**（#236）— registry の
  // コメントには `**` を書いてよいが、**`reason` は市民が読む本文**なので落とす。
  for (const u of UNRECORDABLE) {
    if (u.reason.includes("**") || /\[.+\]\(.+\)/.test(u.reason) || u.reason.includes("⚠")) {
      throw new Error(
        `unrecordable「${u.name}（${u.code}）${u.dataset}」の reason: Markdown 記法（** や リンク）と` +
          `保守者向けの印（⚠）は画面にそのまま出ます。強調も注意喚起も registry のコメント側に書いてください`,
      );
    }
  }

  // ---- 「調べたが収録できない」を全画面へ配る → src/client/lib/unrecordable.gen.ts ----
  // **/coverage だけが知っていても足りない**（2026-07-29）。読者が実際に歩くのは
  // 市区町村選択とダッシュボードで、そこでは「調べたが収録できない」団体が
  // **未着手の団体とまったく同じ「準備中」「決算ベース」**に見えていた。さらに
  // **取れないと分かっているものへリクエストを起票させていた** — /coverage が
  // 「調べたが収録できない列はリクエスト先から外す」と決めたのと正反対のことを、
  // 同じデータについてやっていた。
  //
  // coverage.json（882KB）は /coverage と /sources でしか取らない方針なので、
  // **判定だけを抜いた数KBの gen** を別に焼いて静的 import で配る。
  // ⚠ **収録できたら上の検証が throw する**仕組みはそのまま効く（記録が腐らない）。
  {
    const byCode: Record<string, Record<string, { fyLabel: string; reason: string; checkedOn: string }[]>> = {};
    for (const u of unrecordable) {
      ((byCode[u.code] ??= {})[u.dataset] ??= []).push({
        fyLabel: u.fyLabel, reason: u.reason, checkedOn: u.checkedOn,
      });
    }
    // 「1年度も収録できていない」＝画面の案内を差し替えるべきもの。収録済みで
    // 一部年度だけ不可（/coverage の ○*）は**現状の案内で正しい**ので混ぜない。
    // 判定は entityDetail（＝/coverage の ○ と同じ源）で行う。
    const wholly: Record<string, string[]> = {};
    for (const [code, byDs] of Object.entries(byCode)) {
      const keys = Object.keys(byDs).filter((k) => !entityDetail[code]?.detail[k]);
      if (keys.length > 0) wholly[code] = keys.sort();
    }
    const out = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
//
// **調べたが収録できなかった記録** — 台帳は pipeline/registry/unrecordable.ts。
// /coverage は coverage.json から同じ内容を出しているが、**あちらは 882KB あって
// /coverage と /sources でしか取得しない**ので、判定だけを抜いたこれを静的 import で配る。
//
// 使い道は「まだ手を付けていない（×）」と「調べたが取れない（—）」の**書き分け**。
// ⚠ **取れないと分かっているものへリクエストを誘導しない**こと（読者の手間を無駄にする）。
// ⚠ **「できない」は永久の事実ではない** — 判定は実際にくつがえる（豊島 R4・大田 H27）。
// 文面は確認日つきの実測として出すこと。

export interface UnrecordableNote {
  /** 対象年度の表示（例「令和8年度・令和7年度」「平成29年度以前」） */
  fyLabel: string;
  /** 理由。docs/data-sources.md からの転記（推測を断定で書かない） */
  reason: string;
  /** YYYY-MM-DD。判定は確認日時点の実測であって恒久の事実ではない */
  checkedOn: string;
}

/** 団体コード → データセット（/coverage の列と同じキー）→ 記録 */
export const UNRECORDABLE_BY_CODE: Record<string, Record<string, UnrecordableNote[]>> = ${JSON.stringify(byCode, null, 2)};

/**
 * 団体コード → **1年度も収録できていない**データセットのキー。
 * 収録済みで一部年度だけ不可（/coverage の ○*）は含まない — そちらは
 * 「収録済み」の案内のままで正しいので、画面の文言を差し替える対象ではない。
 */
export const UNRECORDABLE_WHOLLY: Record<string, string[]> = ${JSON.stringify(wholly, null, 2)};
`;
    writeFileSync(join(process.cwd(), "src/client/lib/unrecordable.gen.ts"), out, "utf8");
    console.log(
      `✓ 収録できない記録を導出 → src/client/lib/unrecordable.gen.ts（${Object.keys(byCode).length}団体・` +
        `うち1年度も収録できていないのは ${Object.keys(wholly).length}団体: ` +
        Object.entries(wholly)
          .map(([c, ks]) => `${unrecordable.find((u) => u.code === c)!.name}の${ks.join("・")}`)
          .join(" / ") +
        `）`,
    );
  }

  // 全1,741市町村を都道府県ごとに。f = 各データセットの 1/0（DATASETS の順）
  // u = 「調べたが収録できない」記録があるかの 1/0（同じ順。f と直交する — 収録済みの
  //     データセットでも、その中の特定年度が収録できない場合がある）
  const prefs = Object.entries(PREF_CODES).map(([name, code]) => {
    const shardPath = join(process.cwd(), "public/decision", `${code}.json`);
    const munis = existsSync(shardPath)
      ? Object.entries((readJson(shardPath) as { munis?: Record<string, { name: string }> }).munis ?? {})
      : [];
    const unrecMark = (c: string) => {
      const set = unrecordableByCode.get(c);
      return DATASETS.map((d) => (set?.has(d.key) ? 1 : 0)).join("");
    };
    const rows = munis.map(([c, m]) => {
      const e = entityDetail[c];
      const f = DATASETS.map((d) => (d.key === "kessan" ? 1 : e && e.detail[d.key] ? 1 : 0)).join("");
      return { c, n: m.name, f, u: unrecMark(c) };
    });
    // 県エンティティ（山梨県の当初予算など。市町村シャードには居ない）を先頭に足す。
    // **収録できないと判定しただけの県も出す**（兵庫・沖縄）— 記録があるのに行が無いと
    // 表の上では「そもそも存在しない」ことになり、判定を開示した意味が無くなる
    const prefEntityCodes = [
      ...KNOWN.filter((k) => entityDetail[k.code]?.isPref && k.pref === name).map((k) => k.code),
      ...unrecordable.filter((x) => x.isPref && x.pref === name).map((x) => x.code),
    ];
    const prefEntities = [...new Set(prefEntityCodes)].map((c) => {
      const e = entityDetail[c];
      const f = DATASETS.map((d) => (d.key === "kessan" ? 0 : e?.detail[d.key] ? 1 : 0)).join("");
      return { c, n: `${name}（県全体）`, f, u: unrecMark(c) };
    });
    return { name, code, munis: [...prefEntities, ...rows] };
  });

  const national = srcs.filter((s) => entityOf(s).scopeKind === "national").map(sourceCard);
  const unclassified = srcs.filter((s) => entityOf(s).scopeKind === "unknown").map(sourceCard);
  const allCards = [...Object.values(entityDetail).flatMap((e) => e.sources), ...national, ...unclassified];
  const summary = {
    sourceCount: allCards.length,
    fileCount: allCards.reduce((a, c) => a + c.files.length, 0),
    archivedCount: allCards.filter((c) => c.archived).length,
    shaVerifiedCount: allCards.filter((c) => c.shaVerified).length,
    licenseOpen: allCards.filter((c) => c.licenseClass === "open").length,
    licensePermission: allCards.filter((c) => c.licenseClass === "permission-required").length,
    licenseUnverified: allCards.filter((c) => c.licenseClass === "unverified").length,
    fullCount: Object.values(entityDetail).filter((e) => e.tier === "full").length,
    budgetCount: Object.values(entityDetail).filter((e) => e.tier === "budget").length,
    muniCount: prefs.reduce((a, p) => a + p.munis.filter((m) => !m.n.includes("（県全体）")).length, 0),
    prefCount: prefs.filter((p) => p.munis.length > 0).length,
    kessanRange,
    // 「調べたが収録できない」の件数。**手で書かない** — registry の配列から数える
    unrecordableCount: unrecordable.length,
    unrecordableEntityCount: new Set(unrecordable.map((u) => u.code)).size,
  };
  // 分類ごとの件数（1件が複数の分類を持つことがあるので合計は unrecordableCount と一致しない）
  const unrecordableCategories = UNRECORDABLE_CATEGORIES.map((c) => ({
    ...c,
    count: unrecordable.filter((u) => u.categories.includes(c.key)).length,
  }));

  const out = {
    datasets: DATASETS, summary, prefs, entities: entityDetail, national, unclassified,
    unrecordable, unrecordableCategories,
  };
  const dir = join(process.cwd(), "public");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "coverage.json"), JSON.stringify(out), "utf8");
  const kb = (JSON.stringify(out).length / 1024).toFixed(0);
  console.log(
    `✓ データ整備状況を導出 → public/coverage.json（${summary.muniCount}市町村・${summary.sourceCount}資料・要許可${summary.licensePermission}・未確認${summary.licenseUnverified}・${kb}KB）`,
  );
  // **件数だけの報告にしない**（§9n）— どの団体のどれが収録不可なのかを出す
  console.log(
    `  収録できなかった記録 ${summary.unrecordableCount}件 / ${summary.unrecordableEntityCount}団体: ` +
      unrecordable.map((u) => `${u.name}${u.fyLabel ? `(${u.fyLabel})` : ""}の${u.dataset}`).join(" / "),
  );

  // ---- データの注意（自治体ごと）→ src/client/lib/caveats.gen.ts ----------------
  // **「この数値のここが不確か」を画面に出す。** 手で書かない —
  // `validate` の warning が既に「我々が把握している不確かさ」を機械可読で持っているので、
  // それをそのまま自治体へ割り当てる（手書きの注意書きは必ず実態とズレる。今日それを何度も見た）。
  // 原文をそのまま出す（メダリオンの原則: 発行元が報告したもの・我々が検出したものを丸めない）。
  // error は derive に来ない（検証ゲートで止まる）ので、ここに出るのは warning だけ。
  {
    // validate の原文は開発者向け（「款の前年度の和 1112829999 が…」）で市民には読めない。
    // **原文は残したまま**、パターンから一行の言い換えを付ける。
    // 「報告したものをそのまま尊重する」のは**数値を丸めない**という意味であって、
    // 説明を不親切にする理由ではない。**個別の文面を手で持たない**（分類だけをコードで持つので
    // warning が増えても実態とズレない）。未知のパターンは null＝原文だけ出す。
    const plainOf = (m: string): string | null => {
      if (m.includes("款の前年度の和")) {
        return "廃止された税目の行が、款の番号を持たないため前年度の合計に含められていません。表示している前年度の各款の額と、資料に載っている前年度の合計がわずかに合いません（当年度は一致しています）。";
      }
      if (m.includes("総コスト")) {
        return "人件費が「職員1人あたり人件費 × 人工」で計算されているため、事業費＋人件費と資料の総コストが1千円ずれています（原典の丸め）。";
      }
      if (m.includes("款番号が連番ではありません")) {
        return "款の番号に欠番があります。資料どおりで、取りこぼしではありません。";
      }
      // 八千代（§13-19）— 原典が款番号順ではなく「自主財源→依存財源」の順に並べる様式。
      // ⚠ 検証の原文は「行の取り違えの可能性」と書くが、**収録時に款番号と款名の対応を
      //   全年度目視して実態どおりと確かめてある**。原文は残しつつ、その旨を市民向けに言い換える。
      if (m.includes("款番号が昇順ではありません")) {
        return "款が、番号の順ではなく資料の並び（市の自前の収入 → 国や県から来る収入、など）のまま載っています。資料どおりで、行の取り違えではありません。";
      }
      if (m.includes("予算額が0")) {
        return "予算額が0の事業が載っています。資料どおりです。";
      }
      if (m.includes("重複しています")) {
        return "同じ事業名が複数回出てきます。資料が別の分類で再掲している可能性があります。";
      }
      if (m.includes("歳入科目の和")) {
        return "発行元（総務省）の資料上で、歳入科目の合計が1千円合いません。原典どおりに載せています。";
      }
      if (m.includes("記載率")) {
        return "資料に載っている率と、金額から計算し直した率がわずかに違います。";
      }
      if (m.includes("指標の実績値が全て null")) {
        return "成果指標の実績値が資料にまだ記載されていません（新規事業などで集計中の可能性）。目標値のみ載せています。";
      }
      return null;
    };
    const byCode: Record<string, { source: string; title: string; fy: string; plain: string | null; message: string }[]> = {};
    let n = 0;
    for (const s of srcs) {
      const code = entityOf(s).code;
      if (!code) continue; // 全国資料（総務省）は自治体に紐付かない
      // 未検証のソース（parse 前）はまだ注意を出せない
      let issues: { level: string; message: string }[];
      try {
        issues = validationResultSchema.parse(readJson(validationPath(s.id))).issues;
      } catch {
        continue;
      }
      for (const i of issues) {
        if (i.level !== "warning") continue;
        (byCode[code] ??= []).push({
          source: s.id, title: s.title, fy: s.fiscalYear,
          plain: plainOf(i.message), // 市民向けの一行（原文は message に残す）
          message: i.message,
        });
        n++;
      }
    }
    const out = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
//
// **データの注意** — 自治体ごとの「ここが不確か」。ダッシュボードに出す。
// **手で書かない**: \`validate\` の warning（＝検証ゲートが検出した不整合のうち、
// 原典側の事情と説明できるもの）をそのまま割り当てている。error は検証ゲートで止まり
// derive に来ないので、ここに出るのは warning だけ。
// 文面は validate の原文のまま（発行元が報告したもの・我々が検出したものを丸めない）。

export interface Caveat {
  /** レジストリの sourceId（どの資料の話か） */
  source: string;
  title: string;
  fy: string;
  /** 市民向けの一行。パターンから導出（未知のパターンは null → 原文だけ出す） */
  plain: string | null;
  /** validate が出した原文。**丸めずそのまま残す** */
  message: string;
}

/** 団体コード → データの注意。注意の無い自治体はキーごと存在しない */
export const CAVEATS: Record<string, Caveat[]> = ${JSON.stringify(byCode, null, 2)};
`;
    writeFileSync(join(process.cwd(), "src/client/lib/caveats.gen.ts"), out, "utf8");
    console.log(
      `✓ データの注意を導出 → src/client/lib/caveats.gen.ts（${Object.keys(byCode).length}自治体・計${n}件。validate の warning から）`,
    );
  }

  // ---- /roadmap（進捗と計画）→ src/client/lib/roadmap.gen.ts ------------------
  // **進捗の数字は1つも手で書かない** — coverage と同じ実データ（上の summary・gen 各種）から出す。
  // 手書きなのは計画（pipeline/registry/roadmap.ts）だけ。roadmap は数KBなので静的 import でよい
  // （coverage.json は130KB級なのでフェッチしているが、こちらはその必要がない）。
  // ⚠ **甲府（full）もここに含める**。かつては画面側の JSX に甲府の行をべた書きして
  // いたが、**ソートの外に置かれるので7年度なのに2年度の自治体より後ろに出ていた**
  // （2026-07-29 修正）。団体名も手書きだった＝この節が繰り返し踏んでいる型。
  // 甲府は full 階層なので MUNI_BUDGET_YEARS ではなく KOFU_BUDGET_YEARS を持つ。
  const budgetDepth = [
    ...Object.entries(MUNI_BUDGET_YEARS).map(([code, ys]) => ({
      name: ys[0]!.muniName, code, years: ys.length, range: range(ys.map((y) => y.fy)),
    })),
    {
      name: KNOWN.find((k) => k.code === SELF_CODE)!.name,
      code: SELF_CODE,
      years: KOFU_BUDGET_YEARS.length,
      range: range(KOFU_BUDGET_YEARS.map((b) => b.fy)),
    },
  ]
    .filter((d) => d.years > 1)
    // 同年度数は団体コード順（＝地理順）で解く。件数だけで並べると年度を足すたびに
    // 同数グループの中の順序が不定に入れ替わり、差分がノイズになる
    .sort((a, z) => z.years - a.years || a.code.localeCompare(z.code));
  const progress = {
    // 3階層のカバレッジ
    fullCount: summary.fullCount,
    budgetCount: summary.budgetCount,
    muniCount: summary.muniCount,
    prefCount: summary.prefCount,
    // 資料とエビデンス
    sourceCount: summary.sourceCount,
    fileCount: summary.fileCount,
    archivedCount: summary.archivedCount,
    // ライセンス区分（隠さず出す）
    licenseOpen: summary.licenseOpen,
    licensePermission: summary.licensePermission,
    licenseUnverified: summary.licenseUnverified,
    // 年度の深さ
    kessanRange,
    kofuBudgetRange: range(KOFU_BUDGET_YEARS.map((b) => b.fy)),
    kofuBudgetYears: KOFU_BUDGET_YEARS.length,
    /** 当初予算を複数年度収録している自治体（年度の多い順） */
    budgetDepth,
    /** full 甲府で収録済みのデータ種別（種別名 → 中身の説明） */
    kofuDetail: entityDetail["192015"]?.detail ?? {},
  };
  // 計画は画面に**プレーンテキストとして**描画される（Markdown を解釈しない）。
  // registry に `**強調**` を書くとアスタリスクごと表示される（実際に踏んだ）。
  // 同様に「時期を約束しない」ルールも機械的に守らせる — 公開ページなので後から効いてくる。
  for (const r of ROADMAP) {
    for (const [k, text] of Object.entries({ title: r.title, why: r.why, needs: r.needs })) {
      if (text.includes("**") || /\[.+\]\(.+\)/.test(text)) {
        throw new Error(
          `roadmap「${r.title}」の ${k}: Markdown 記法（** や リンク）は画面にそのまま出ます。プレーンテキストで書いてください`,
        );
      }
      if (/令和\d+年(度)?(まで|中|内)に|\d+月までに|今年度中に|来年度中に/.test(text)) {
        throw new Error(
          `roadmap「${r.title}」の ${k}: 時期を約束する表現が入っています。一次資料の入手可否は発行元次第なので、` +
            `「何を・なぜ・何が要るか」だけを書いてください（pipeline/registry/roadmap.ts 冒頭のルール）`,
        );
      }
      // 3つ目のルール「**進捗の数字をここに書かない**」も機械的に守らせる（2026-07-16）。
      // 宣言だけで検査が無く、実際に **`why` に「全1,741市町村」と手書きされていた**
      // （＝下の progress.muniCount と同じ値。市町村合併で片方だけ古くなる）。
      //
      // **数字一般を禁じない** — 「札幌は R7 だけで666件」のような**外部の事実**（未収録資料の規模）は
      // 計画の判断材料として要る。禁じるべきは**進捗タイルと同じ数字の二重管理**だけ。
      // → **derive が今まさに算出した値と一致する数字**だけを落とす。自己調整するので偽陽性が出ず、
      //   実態が動けば手書きのほうが自動的に検出される。
      for (const [n, unit] of [
        [progress.muniCount, "市町村"],
        [progress.budgetCount, "団体"],
        [progress.sourceCount, "件"],
      ] as const) {
        for (const form of [`${n}${unit}`, `${n.toLocaleString()}${unit}`]) {
          if (text.includes(form)) {
            throw new Error(
              `roadmap「${r.title}」の ${k}: 「${form}」は derive が実データから算出している進捗の数字です。` +
                `手書きすると必ず実態とズレます（roadmap.ts 冒頭のルール2）。数字を書かずに表現してください`,
            );
          }
        }
      }
    }
  }
  const roadmapOut = `// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 進捗（progress）は coverage.json と同じ実データから算出する。**手書きの数字は1つも無い。**
// 計画（plan）は pipeline/registry/roadmap.ts の内容をそのまま載せる（唯一の手書き）。

export interface RoadmapItem {
  title: string;
  status: "now" | "next" | "later";
  why: string;
  needs: string;
  ref?: string;
}

export const ROADMAP_PROGRESS = ${JSON.stringify(progress, null, 2)} as const;

export const ROADMAP_PLAN: RoadmapItem[] = ${JSON.stringify(ROADMAP, null, 2)};
`;
  writeFileSync(join(process.cwd(), "src/client/lib/roadmap.gen.ts"), roadmapOut, "utf8");
  console.log(
    `✓ 進捗と計画を導出 → src/client/lib/roadmap.gen.ts（進捗は実データから算出 / 計画 ${ROADMAP.length}件: ` +
      `now ${ROADMAP.filter((r) => r.status === "now").length} / next ${ROADMAP.filter((r) => r.status === "next").length} / later ${ROADMAP.filter((r) => r.status === "later").length}）`,
  );
}

// ============================================================================
// 生成物どうしの整合チェック（derive の出口）
// ============================================================================
// **なぜ要るか**: `validate` は parsed の自己整合（Σ・算術）を守るが、**gen 同士の食い違いは
// 誰も見ていない**。2026-07-15 の1セッションで「収録済みなのに実態とズレる」型を**4回**踏んだ:
//   1. フッターの出典が「甲府市 当初予算資料 R2–R8」固定 → 全1,741自治体で甲府と表示（#62）
//   2. /coverage の予算列が最新年度のみ → 7年度あるのに「令和8年度」と過少申告（#65）
//   3. /coverage が横浜の成果を「×」→ REPORT_PARSERS への足し忘れ（#75）
//   4. /coverage が 2,535・画面が 2,313 で食い違う → 特別会計を数えていた（#75）
// いずれも**画面を見るまで気づけなかった**。ここで機械的に落とす。
// **error は throw する** — 黙って壊れた gen を出すくらいなら derive を失敗させる。
{
  const problems: string[] = [];
  const cov = readJson(join(process.cwd(), "public/coverage.json")) as {
    entities: Record<string, { name: string; detail: Record<string, string> }>;
    prefs: { name: string; munis: { c: string; n: string; u: string }[] }[];
    datasets: { key: string }[];
    unrecordable: { code: string; name: string; dataset: string; fyLabel: string }[];
  };
  const { REPORT_MUNIS } = await import("../src/client/lib/reports-index.gen");
  const { MUNI_BUDGET_INDEX, BUDGET_MUNIS } = await import("../src/client/lib/munibudgets.gen");
  const MUNI_BUDGET_YEARS = readMuniBudgetShards();
  const { FULL_MUNIS } = await import("../src/client/lib/decision-index.gen");

  // ① /coverage の「成果」の件数 = 実際に配信しているシャードの件数
  //    （生の parsed 件数を出して画面と食い違った実例がある）
  for (const [code, idx] of Object.entries(REPORT_MUNIS)) {
    const shard = readJson(join(process.cwd(), `public/reports/${code}.json`)) as { reports: unknown[] };
    if (shard.reports.length !== idx.count) {
      problems.push(
        `${idx.name}: 索引の件数 ${idx.count} とシャード public/reports/${code}.json の件数 ${shard.reports.length} が違います`,
      );
    }
    const detail = cov.entities[code]?.detail?.report ?? "";
    if (!detail.includes(String(idx.count))) {
      problems.push(
        `${idx.name}: /coverage の成果「${detail || "（無し）"}」に配信件数 ${idx.count} が出ていません` +
          `（収録済みを未収録と偽る／件数が食い違う）`,
      );
    }
  }

  // ①' 「調べたが収録できない」の記録は、必ず表の行として出る
  //     記録だけあって行が無いと、表の上では「そもそも存在しない自治体」になり、
  //     判定を開示した意味が消える（県エンティティは市町村シャードに居ないので実際に起こり得る）
  {
    const dsIndex = new Map(cov.datasets.map((d, i) => [d.key, i]));
    const rowByCode = new Map(cov.prefs.flatMap((p) => p.munis.map((m) => [m.c, m] as const)));
    for (const u of cov.unrecordable) {
      const row = rowByCode.get(u.code);
      if (!row) {
        problems.push(`${u.name}（${u.code}）: 収録できない記録があるのに /coverage の表に行がありません`);
        continue;
      }
      const i = dsIndex.get(u.dataset);
      if (i === undefined || row.u[i] !== "1") {
        problems.push(`${u.name}（${u.code}）: 収録できない記録の「${u.dataset}」が表の印に反映されていません`);
      }
    }
  }

  // ② 事業報告を収録した自治体は、必ず /coverage の「成果」に出る
  //    （REPORT_PARSERS への足し忘れで静かに「×」になる）
  for (const s of SOURCES.filter((x) => !x.fixture)) {
    const m = /団体コード(\d{6})/.exec(s.scope ?? "");
    if (!m) continue;
    let docType: string | undefined;
    try {
      docType = (readJson(parsedPath(s.id)) as { docType?: string }).docType;
    } catch {
      continue; // 未 parse のソースは対象外
    }
    if (docType !== "project-report") continue;
    if (!cov.entities[m[1]!]?.detail?.report) {
      problems.push(
        `${s.id}: 事業報告を収録しているのに /coverage の ${cov.entities[m[1]!]?.name ?? m[1]} に「成果」が出ていません` +
          `（derive の REPORT_PARSERS に足し忘れていませんか）`,
      );
    }
  }

  // ②' 索引に載っている自治体は必ず当初予算のシャードが配信されている（#216）
  //     本体を public/munibudgets/ へ出したので、**索引だけあってシャードが無いと
  //     ダッシュボードが空で開く**（バンドルに焼いていた頃は原理的に起きなかった型）。
  //     索引の年度もシャードの年度と一致していること — ズレると年度ドロップダウンに
  //     出るのに選ぶと落ちる。
  for (const code of BUDGET_MUNIS) {
    const idx = MUNI_BUDGET_INDEX[code]!;
    const shard = MUNI_BUDGET_YEARS[code];
    if (!shard?.length) {
      problems.push(`${idx.muniName}（${code}）: 当初予算の索引にあるのに public/munibudgets/${code}.json がありません`);
      continue;
    }
    const a = idx.fys.join(",");
    const b = shard.map((y) => y.fy).join(",");
    if (a !== b) {
      problems.push(`${idx.muniName}（${code}）: 索引の年度（${a}）と配信シャードの年度（${b}）が食い違っています`);
    }
  }

  // ③ 画面に出る自治体は必ず URL スラグを持つ（無いと共有リンクが壊れる）
  const slugs = readFileSync(join(process.cwd(), "src/client/lib/routing.ts"), "utf8");
  for (const code of [...BUDGET_MUNIS, ...FULL_MUNIS]) {
    if (!slugs.includes(`"${code}"`)) {
      const name = MUNI_BUDGET_INDEX[code]?.muniName ?? code;
      problems.push(`${name}（${code}）: routing.ts の MUNI_SLUGS にローマ字スラグがありません（URL が団体コードになります）`);
    }
  }

  // ③' 逆方向: スラグを持つ自治体は必ず budget か full で配信されている（2026-09-12・handoff §4）
  //     ③ は `BUDGET_MUNIS ⊂ MUNI_SLUGS` の片方向なので、**スラグは残ったまま配信が消えた**
  //     （座間の実例）を素通りする。`routing.ts` では **MUNI_SLUGS に居ないこと自体が decision 階層の
  //     判定**（`isDecision = !!muniCode && !MUNI_SLUGS[code]`）なので、スラグがあるのに予算が無い
  //     団体は「予算があるはずの自治体として振る舞うのに中身が無い」状態になる。⑥ とは独立した網で、
  //     どちらも同じ事故を単独で落とせる（⑥ は資料側から、③' は配線側から見ている）。
  {
    const block = slugs.slice(slugs.indexOf("const MUNI_SLUGS"), slugs.indexOf("};", slugs.indexOf("const MUNI_SLUGS")));
    const wired = new Set([...BUDGET_MUNIS, ...FULL_MUNIS]);
    const found = [...block.matchAll(/"(\d{6})":\s*"([a-z0-9-]+)"/g)];
    // 字面から切り出しているので、**書き方が変わって切り出しが縮むとこのゲートだけ静かに無効化される**
    // （③ は「全文に含まれるか」しか見ないので、`MUNI_SLUGS` の外に出ていても気づかない）。
    // ③ が全団体のスラグを保証している以上、**切り出しの中にも全団体が居るはず**。少なければ切り出しが壊れている。
    if (found.length < wired.size) {
      throw new Error(
        `routing.ts の MUNI_SLUGS から ${found.length} 件しか読めません（配信中は ${wired.size} 団体）。` +
          `切り出し（const MUNI_SLUGS 〜 };）か行の書き方が変わっていませんか。このままではスラグの逆方向ゲートが無効になります`,
      );
    }
    for (const m of found) {
      if (!wired.has(m[1]!)) {
        problems.push(
          `${m[1]}（スラグ /${m[2]}）: routing.ts の MUNI_SLUGS にあるのに当初予算を配信していません。` +
            `derive の BUDGET_SOURCES から行が消えていませんか（消えると decision 扱いになり、` +
            `unrecordable の記録がある団体では画面が「収録不可」と断言します・handoff §4）`,
        );
      }
    }
  }

  // ④ 年度間クロスチェーン: 連続する年度の「前年度列の合計」= 前年の「当年度の合計」
  //
  // **これが唯一、列の取り違えを捕まえる網**（2026-07-16 にゲート化）。validate は
  // parsed の自己整合しか見ないので、**歳入と歳出の列を丸ごと取り違えても Σ は両側とも差0 で
  // 素通りする**（足立で実際に起きた。あらまし R5〜R8 だけ列順が [前年度, 当年度] に反転して
  // いたのを、収録時の手作業のクロスチェックだけが見つけた）。同じ穴は**大田 H22〜H20 の
  // 「歳入と歳出の（1）（2）が逆」**にもあり、そこでは Σ ですら守れない
  // （**歳入合計 = 歳出合計 は定義上いつも成立する**）。
  //
  // **款ごとの差は見ない** — 原典が前年度列を新体系へ組み替える（restated）のは正常で、
  // 実測すると 44系列 125リンク中 15リンクが款レベルで動く（名古屋 R3 の職員費新設 274億・
  // 横浜 R6 の局再編・札幌 R4 の労働費→経済費 統合・福岡 R4 の2款付け替え等）。
  // **いずれも総額は一致する**ので、総額だけを見ればノイズ0で列の取り違えだけが落ちる。
  //
  // **総額が違ってよいのは、原典が別基準だと明示している場合だけ**（骨格予算＝市長選の年）。
  // その2件は `prevBasis`（札幌 R6・R2 = 補正後）か `prevNote`（甲府 R6 = 原典の注記
  // 「6月補正における政策的予算を含む」）を持つので、**説明が無い総額不一致だけ**を error にする。
  {
    // 同じ資料系列（= srcId から年度サフィックスを落としたもの）ごとに年度順で鎖を張る。
    // registry から組む（BUDGET_SOURCES は別ブロックのスコープ）。fixture は除く。
    const chains = new Map<string, { fy: string; srcId: string }[]>();
    for (const s of SOURCES) {
      if (s.fixture || !existsSync(parsedPath(s.id))) continue;
      const m = /^(.*)-(r\d+|h\d+)$/.exec(s.id);
      if (!m) continue;
      const arr = chains.get(m[1]!) ?? [];
      arr.push({ fy: m[2]!.toUpperCase(), srcId: s.id });
      chains.set(m[1]!, arr);
    }
    let links = 0;
    for (const [, years] of chains) {
      years.sort((a, z) => fyRank(a.fy) - fyRank(z.fy));
      for (let i = 1; i < years.length; i++) {
        const nw = years[i]!;
        const od = years[i - 1]!;
        // 欠番（収録できなかった年度）はまたがない — 鎖が張れるのは連続年度だけ。
        // 判定は fySeq（連番）。fyRank だと H31→R2 の差が 971 になり**改元の境界だけ
        // リンクが張れない**（#145 — 東京都・特別区9系列で実際に欠けていた）。
        if (fySeq(nw.fy) - fySeq(od.fy) !== 1) continue;
        const n = anyParsedDocSchema.parse(readJson(parsedPath(nw.srcId)));
        const o = anyParsedDocSchema.parse(readJson(parsedPath(od.srcId)));
        if (n.docType !== "budget-book" || o.docType !== "budget-book") continue;
        links++;
        const explained = n.prevBasis !== "当初" || !!n.prevNote;
        for (const [label, got, want] of [
          ["歳入", n.prevRevenueTotal, o.revenueTotal],
          ["歳出", n.prevExpenditureTotal, o.expenditureTotal],
        ] as const) {
          if (got == null || got === want) continue;
          if (explained) continue;
          problems.push(
            `${nw.srcId}: ${label}の前年度列の合計 ${got.toLocaleString()} が ` +
              `${od.srcId} の当年度合計 ${want.toLocaleString()} と違います（差 ${(got - want).toLocaleString()}）。` +
              `列の取り違え（足立型の列順反転・大田型の歳入歳出逆）を疑うこと。` +
              `原典が別基準（骨格予算等）なら parserOptions の prevBasis / prevNote で明示する`,
          );
        }
      }
    }
    if (problems.length === 0) console.log(`  年度間クロスチェーン: ${links} リンク（列の取り違えなし）`);
  }

  // ⑤ 骨格予算の翌年度に説明があるか（pipeline/registry/skeleton-budgets.ts）
  //
  // **④ が構造的に見ない領域**（2026-09-10 の棚卸し・docs §13-32）。骨格予算の翌年度は前年度列が
  // 骨格の当初額そのものなので④の総額は一致し、`prevBasis:"当初"` のまま `prevNote` が空でも
  // 何も鳴らない。それでいて画面の「対前年度（当初比）」は発行元の公表値（肉付け後基準）と
  // 食い違う（千葉県 R8: 画面 +7.1% / 県 +3.0%）。**§11k の規約「前年度側が骨格なら prevNote」を
  // 人が全団体を読み直す以外に守る手が無く、14件落ちていた。**
  //
  // 台帳（骨格の年度）を正として2方向に照合する:
  //   順方向: 台帳の年度 Y の翌年度 Y+1 が収録済みなのに説明が無い → throw（落ちている）
  //   逆方向: prevNote が骨格に触れているのに台帳に無い → throw（台帳が腐っている）
  // 「説明」は④と同じ判定（`prevBasis !== "当初" || prevNote`）。前年度列が肉付け後なら
  // `prevBasis` で、当初のままなら `prevNote` で説明する（どちらかは台帳で決めない）。
  {
    const skeleton = new Map<string, SkeletonBudget>();
    const muniByCode = new Map(ds.records.map((r) => [r.muniCode, r.muniName]));
    const { PREF_CODES } = await import("../src/client/lib/decision-index.gen");
    const prefEntityCode = (pref2: string) => {
      const c = `${pref2}000`;
      const sum = [6, 5, 4, 3, 2].reduce((a, w, i) => a + Number(c[i]) * w, 0);
      return c + String((11 - (sum % 11)) % 10);
    };
    const prefByEntityCode = new Map(Object.entries(PREF_CODES).map(([name, code]) => [prefEntityCode(code), name]));
    for (const s of SKELETON_BUDGETS) {
      const trueName = prefByEntityCode.get(s.code) ?? muniByCode.get(s.code);
      if (!trueName) throw new Error(`skeleton-budgets「${s.name} ${s.fy}」: 団体コード ${s.code} が総務省台帳にも都道府県にもありません`);
      if (trueName !== s.name) throw new Error(`skeleton-budgets「${s.name} ${s.fy}」: 団体コード ${s.code} は「${trueName}」です（取り違え）`);
      const key = `${s.code}:${fySeq(s.fy)}`;
      if (skeleton.has(key)) throw new Error(`skeleton-budgets「${s.name} ${s.fy}」: 同じ年度が二重に載っています`);
      skeleton.set(key, s);
    }
    // 収録済みの budget-book を団体コード×年度で引く。団体コードは registry の scope から
    // （甲府だけ scope に無い＝full 階層で BUDGET_SOURCES にも居ないので固定）
    const codeOf = (s: (typeof SOURCES)[number]) =>
      /団体コード\s*(\d{6})/.exec(s.scope)?.[1] ?? (s.id.startsWith("kofu-") ? "192015" : null);
    const KOKKAKU_WORDS = /骨格|第一次編成|準骨格|肉付/;
    let checked = 0;
    for (const s of SOURCES) {
      if (s.fixture || !existsSync(parsedPath(s.id))) continue;
      const doc = anyParsedDocSchema.parse(readJson(parsedPath(s.id)));
      if (doc.docType !== "budget-book") continue;
      const code = codeOf(s);
      // 団体コードが読めない budget-book を黙って飛ばすと、このゲートだけ静かに無効化される
      if (!code) throw new Error(`${s.id}: scope から団体コードを読めません（骨格予算ゲートの対象から外れる）: ${s.scope}`);
      const seq = fySeq(doc.fiscalYear);
      const explained = doc.prevBasis !== "当初" || !!doc.prevNote;
      const prevIsSkeleton = skeleton.get(`${code}:${seq - 1}`);
      if (prevIsSkeleton) {
        checked++;
        if (!explained) {
          problems.push(
            `${s.id}: 前年度（${prevIsSkeleton.fy}）は骨格予算です（${prevIsSkeleton.evidence}）が、` +
              `prevBasis が「当初」のまま prevNote がありません。画面の「対前年度（当初比）」が発行元の公表値と食い違います。` +
              `前年度列が肉付け後なら parserOptions.prevBasis:"補正後"、当初額なら prevNote に「前年度は骨格予算」と書く（§11k・§13-32）`,
          );
        }
      }
      // 逆方向。注記の文言から当年度側/前年度側を推測しない（「本年度」「この年度」で始まらない当年度側の
      // 注記があり得て、推測を外すと**存在しない骨格年度を台帳に書かせる**方向に鳴る）。
      // 両方を見て、両方無いときだけ、両方を名指しして鳴らす。
      // ⚠ これは語彙の網なので、骨格の語を使わずに事情を説明する注記（宝塚 R4/R8「市長改選前に編成」・
      //   甲府 R6・佐倉 R6・米子 H22）は対象外。**台帳の腐り止めであって網羅の保証ではない**。
      if (doc.prevNote && KOKKAKU_WORDS.test(doc.prevNote)) {
        if (!skeleton.has(`${code}:${seq}`) && !skeleton.has(`${code}:${seq - 1}`)) {
          problems.push(
            `${s.id}: prevNote が骨格予算に触れていますが、この年度（${doc.fiscalYear}）も前年度も pipeline/registry/skeleton-budgets.ts に載っていません。` +
              `注記が前年度の話なら前年度を、当年度の話ならこの年度を、**原典で確かめてから**台帳に書く（周期から書かない）`,
          );
        }
      }
    }
    if (problems.length === 0) console.log(`  骨格予算の翌年度: ${checked} 件（説明の無いものなし・台帳 ${SKELETON_BUDGETS.length} 年度）`);
  }

  // ⑥ 収録した当初予算は必ず配信されている（＝**配線から消えた**資料を落とす。2026-09-12・handoff §4）
  //
  // **なぜ要るか**: ここまでのゲートは全部「載っているものが正しいか」を見ていて、
  // **載っていたものが消えたか**を誰も見ていない。③（画面に出る自治体は必ずスラグを持つ）は
  // `BUDGET_MUNIS ⊂ MUNI_SLUGS` の片方向で、**スラグはあるのに BUDGET_MUNIS に居ない**は素通りする。
  //
  // 2026-09-12 の第36巡で実際に起きた: 新しい巡のブロックを `BUDGET_SOURCES` に差し込むスクリプトが
  // **直前の座間市（142166）の spread 3行を追加ではなく置換**し、前の巡で収録したばかりの
  // 座間 R8〜R6 が配信から消えた。registry の3ソース・parsed・validation・`MUNI_SLUGS` の
  // `"142166": "zama"` は**全部残っていた**ので、`typecheck` も `build` もここまでのゲートも全部通り、
  // レビュー3巡のうち2巡も気づかなかった。画面では座間が「決算のみ」になり、`unrecordable.ts` に
  // R5・R4 の記録がある団体なので **UI が「×（未着手）」ではなく「収録不可」と断言**する
  // ＝公開すれば誤った開示になる。唯一の兆候は coverage の件数が期待より1少ないことだけだった。
  //
  // `unrecordable.ts` の逆方向照合（「収録できない」と書いた資料を実は収録していないか）と同じ形で、
  // **parsed を正として配信物を照合する**。docType が `budget-book` で検証が ok なら、その資料は
  // 必ずどこかの画面に出ているはず — 出ていなければ配線が抜けている。
  //
  // 突合は**書いたシャードから srcId を回収して**行う（在メモリの `BUDGET_SOURCES` と比べるのではない）。
  // 「書いたものと検査するものが同一」なので、配線の抜けだけでなく下流で落ちた場合も同じ網に掛かる。
  // full 階層の甲府は `BUDGET_SOURCES` ではなく `kofu.gen.ts` 経由で配信されるので、そちらも数える
  // （＝**除外リストを持たない**。除外リストは腐るし、腐っても静かなので同じ型を呼ぶ）。
  {
    const { KOFU_BUDGET_YEARS } = await import("../src/client/lib/kofu.gen");
    const srcIdOf = (localUrl: string) => /^\/sources\/([^/]+)\//.exec(localUrl)?.[1] ?? null;
    const delivered = new Map<string, string>(); // srcId → 出ている場所（エラー文のため）
    for (const [code, years] of Object.entries(MUNI_BUDGET_YEARS)) {
      for (const y of years) {
        for (const u of [y.sourceLocalUrl, y.expenditureEvidence?.localUrl]) {
          const id = u ? srcIdOf(u) : null;
          if (id) delivered.set(id, `public/munibudgets/${code}.json`);
        }
      }
    }
    for (const y of KOFU_BUDGET_YEARS) {
      const id = srcIdOf(y.sourceLocalUrl);
      if (id) delivered.set(id, "src/client/lib/kofu.gen.ts");
    }
    let wired = 0;
    for (const s of SOURCES) {
      if (s.fixture || !existsSync(parsedPath(s.id))) continue;
      if (anyParsedDocSchema.parse(readJson(parsedPath(s.id))).docType !== "budget-book") continue;
      // 検証が ok でないものは**検証ゲートが意図して止めている**（needs_review を normalize に通さない）
      // ので、配信されていなくて正しい。未検証も同じ扱い。
      if (!existsSync(validationPath(s.id))) continue;
      if (validationResultSchema.parse(readJson(validationPath(s.id))).status !== "ok") continue;
      if (delivered.has(s.id)) {
        wired++;
        continue;
      }
      problems.push(
        `${s.id}: 当初予算（${s.scope}）を収録して検証も ok なのに、どこにも配信されていません。` +
          `derive の BUDGET_SOURCES に足し忘れていませんか（既にあった行を**置換**してしまった実例があります・handoff §4）。` +
          `意図的に配信しない資料なら fixture: true にするか、収録そのものを取り消してください`,
      );
    }
    if (problems.length === 0) console.log(`  配信されている当初予算: ${wired} 件（収録済みで未配信のものなし）`);
  }

  // --------------------------------------------------------------------------
  // ② 表示専用フィールドの汚染（#190）
  // --------------------------------------------------------------------------
  // **なぜ要るか**: Σ が立つのは金額だけで、**事業名・説明・所管課・款名は金額でないので
  // どのゲートも守備範囲に入らない**（handoff §2-4）。2026-07-30〜08-01 の特別区3区の収録で、
  // **1件も検証ゲートが鳴らないまま画面に出ていた**汚染を6つ踏んだ:
  //   北区   説明の末尾に印字ノンブル `-60-`（34件）
  //   港区   掲載頁の数字を「うちレベルアップ分」として金額表示（110件）／列見出しが1行目に食い込む
  //   新宿   金額が事業名の頭に（`940,788区営住宅`）／事業名の完全二重化（36件）／
  //          ダッシュのクラスを広げすぎて長音が消える（`サービス`→`サビス`・15件）
  // 以前にも 川崎の所属名572件が空・横浜の所属名456件が汚染・横浜R3の款名破損があり、
  // **すべて「画面を見て」見つかっている**。字面で取れるものはここで落とす。
  //
  // ⚠ **これは目視の代わりにならない**（issue #190 が明記）。語彙・字面の網なので、
  //   未知の壊れ方は捕まらない。「新しい資料は款名と事業名を全件目視する」の規約は変わらない。
  {
    const DASH_CLS = "[-\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212]";
    /** name = 事業名や款名など「短い見出し」／ text = 説明など自由文 */
    const RULES: { id: string; on: ("name" | "text")[]; hit: (s: string) => boolean; why: string }[] = [
      {
        id: "印字ノンブル",
        on: ["name", "text"],
        hit: (s) => new RegExp(`${DASH_CLS}\\s*\\d{1,3}\\s*${DASH_CLS}\\s*$`).test(s),
        why: "ページ下端の印字ノンブル（`- 60 -`）が本文の x 帯に入って混ざった型。y で切らずテキストで落とす",
      },
      {
        id: "列見出しの語",
        on: ["name"],
        hit: (s) => /(事業名|予算額|特定財源|掲載頁|（款名）|（千円）|単位：千円|所管課)/.test(s),
        why: "表の列見出しが1行目のデータに食い込んだ型。表の上端を定数で置くと、節タイトルのあるページで起きる",
      },
      {
        id: "生の金額が見出しに",
        on: ["name"],
        hit: (s) => /^\d{1,3}(,\d{3})+|\d{1,3}(,\d{3})+$/.test(s),
        why: "右寄せの金額は桁が多いと左端が名前の帯に入る。列は left ではなく right（left+width）で決める",
      },
      {
        id: "見出しの完全二重化",
        on: ["name"],
        hit: (s) => s.length >= 8 && s.length % 2 === 0 && s.slice(0, s.length / 2) === s.slice(s.length / 2),
        why: "同じ名前がグループ見出しとしても出る様式で二重に拾った型",
      },
      {
        id: "部首の異体字",
        on: ["name", "text"],
        hit: (s) => [...s].some((c) => { const o = c.codePointAt(0)!; return o >= 0x2e80 && o <= 0x2fdf; }),
        why: "Kangxi Radicals / CJK部首補助。見た目がほぼ同じで Σ も語彙ゲートも通る（港区 §10n）",
      },
    ];
    const dirty: string[] = [];
    let scanned = 0;
    const look = (where: string, field: string, kind: "name" | "text", v: unknown) => {
      if (typeof v !== "string" || !v) return;
      scanned++;
      for (const r of RULES) {
        if (r.on.includes(kind) && r.hit(v)) {
          dirty.push(`${where} の ${field}「${v.slice(0, 40)}」: ${r.id} — ${r.why}`);
        }
      }
    };
    for (const [code, years] of Object.entries(MUNI_BUDGET_YEARS)) {
      for (const b of years) {
        for (const p of b.projects ?? []) {
          const w = `${b.muniName}(${code}) ${b.fy}`;
          look(w, "事業名", "name", p.name);
          look(w, "説明", "text", p.description);
          look(w, "款", "name", p.kan);
          look(w, "施策", "text", p.shisaku);
        }
      }
    }
    for (const code of Object.keys(REPORT_MUNIS)) {
      const shard = readJson(join(process.cwd(), `public/reports/${code}.json`)) as {
        muniName: string; reports: Record<string, unknown>[];
      };
      for (const r of shard.reports) {
        const w = `${shard.muniName}(${code}) 事業報告`;
        look(w, "事業名", "name", r.name);
        look(w, "所管", "text", r.buka);
        look(w, "款", "name", r.kanName);
      }
    }
    if (dirty.length) {
      // 件数だけでなく**何が**を必ず出す（handoff §2-3「件数だけの報告をやめた」）
      for (const d of dirty.slice(0, 30)) problems.push(`表示専用フィールドの汚染: ${d}`);
      if (dirty.length > 30) problems.push(`表示専用フィールドの汚染: 他 ${dirty.length - 30} 件`);
    } else {
      console.log(`  表示専用フィールドの汚染: なし（${scanned.toLocaleString()} 文字列を検査）`);
    }
  }

  // --------------------------------------------------------------------------
  // ③ 系列色は必ず seriesColor を通す（#190・#186 の再発防止）
  // --------------------------------------------------------------------------
  // PALETTE は12色しかなく、**款が13以上ある団体は95エンティティ中73**もある。
  // `PALETTE[i % length]` を直接書くと**同じドーナツの中に同じ色**ができ、凡例でも見分けられない。
  // ⚠ **数値リテラルの添字は禁じない**（`PALETTE[0]` のような固定5色は一周しようがない）。
  //   危ないのは**変数で引く**ケースだけなので、そこだけを落とす。
  {
    const offenders: string[] = [];
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(join(dir, e.name)) : e.name.endsWith(".ts") || e.name.endsWith(".tsx") ? [join(dir, e.name)] : [],
      );
    for (const f of walk(join(process.cwd(), "src/client"))) {
      if (f.endsWith(join("lib", "data.ts"))) continue; // seriesColor の実装そのもの
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(/PALETTE\s*\[\s*([^\]]+)\]/g)) {
        if (!/^\d+$/.test(m[1]!.trim())) {
          offenders.push(`${f.replace(process.cwd() + "/", "")}: \`PALETTE[${m[1]!.trim()}]\``);
        }
      }
    }
    if (offenders.length) {
      for (const o of offenders) {
        problems.push(
          `系列色を PALETTE から直接引いています（${o}）— **必ず D.seriesColor(i) を通す**。` +
            `PALETTE は12色しかなく、款13以上の団体で同じチャート内に同色ができる`,
        );
      }
    }
  }

  if (problems.length > 0) {
    console.error("✗ 生成物どうしの整合チェックで問題が見つかりました:");
    for (const p of problems) console.error(`  - ${p}`);
    throw new Error(`生成物の整合チェックに失敗（${problems.length}件）`);
  }
  console.log(
    `✓ 生成物どうしの整合チェック（/coverage の件数 = 配信シャードの件数 / 事業報告の収録漏れ / URL スラグ（両方向） / 年度間クロスチェーン / 骨格予算の翌年度 / 収録済み当初予算の配信漏れ / 表示専用フィールドの汚染 / 系列色）`,
  );
}

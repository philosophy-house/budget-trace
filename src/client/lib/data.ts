// ============================================================================
// 予算トレース — データレイヤー
// 収録データはすべて一次資料由来の実データ（生成モジュール *.gen.ts。
// 再生成は bun run pipeline:derive）。ダミー・推計値は置かない。
// - 款レベル歳入・歳出／前年度当初額: 甲府市 令和8年度当初予算（案）資料
// - 主な事業（83件）: 同資料「主な事業一覧」
// - 人口・類似自治体比較: 総務省 令和6年度 市町村別決算状況調
// ============================================================================
import { KOFU_BUDGET, KOFU_BUDGET_YEARS, type KofuBudgetYear, type KofuKanRow } from './kofu.gen';
import { KOFU_EXECUTION, KOFU_EXECUTION_YEARS } from './execution.gen';
import { WAYBACK_BY_URL } from './archives.gen';
import { RESTRICTED_EVIDENCE } from './evidence-policy.gen';
import { KOFU_EVALUATION_YEARS } from './evaluations.gen';
import { KOFU_OUTTURN_YEARS } from './outturn.gen';

// ---- 型 --------------------------------------------------------------------
export interface BudgetNode {
  name: string;
  v: number;
  children?: BudgetNode[];
}

export interface Municipality {
  name: string;
  total: number;
  yoy: string;
  year: string;
  pop: number;
  revenue: BudgetNode[];
  expenditure: BudgetNode[];
}

// ---- パレット --------------------------------------------------------------
export const P_BLUE = ['#55BBE4','#31586E','#6FC5E9','#84A0B0','#0F5E84','#A9D9EC','#527E96','#C5DFEC','#0C82B4','#93AEBD','#8494A0','#3EA9D8'];
// Okabe-Ito ベース（色覚多様性対応）+ 補助色
export const P_VIVID = ['#0072B2','#E69F00','#009E73','#CC79A7','#56B4E9','#D55E00','#7B5AA6','#8C564B','#66A61E','#B8A016','#17A2B8','#5C6B77'];

export let PALETTE: string[] = P_VIVID;
export function setPalette(mode: string) {
  PALETTE = mode === '青系' ? P_BLUE : P_VIVID;
}

// ---- 地域 ------------------------------------------------------------------
export const REGIONS = [
  { name:'北海道', color:'#DCE4EE', prefs:[['北海道',14,1]] },
  { name:'東北', color:'#D9E8E1', prefs:[['青森県',14,2],['秋田県',13,3],['岩手県',14,3],['山形県',13,4],['宮城県',14,4],['福島県',13,5]] },
  { name:'関東', color:'#F0E4D3', prefs:[['群馬県',12,6],['栃木県',13,6],['茨城県',14,6],['埼玉県',12,7],['千葉県',14,7],['東京都',13,7],['神奈川県',12,8]] },
  { name:'中部', color:'#E6DFEE', prefs:[['新潟県',12,5],['富山県',10,6],['石川県',9,6],['福井県',9,7],['長野県',11,6],['岐阜県',10,7],['山梨県',11,7],['静岡県',11,8],['愛知県',10,8]] },
  { name:'近畿', color:'#DCE9EC', prefs:[['滋賀県',8,7],['京都府',7,7],['兵庫県',6,7],['大阪府',7,8],['奈良県',8,8],['三重県',9,8],['和歌山県',7,9]] },
  { name:'中国', color:'#EAE8D6', prefs:[['鳥取県',5,7],['島根県',4,7],['岡山県',5,8],['広島県',4,8],['山口県',3,8]] },
  { name:'四国', color:'#F0DEDC', prefs:[['香川県',5,9],['徳島県',6,9],['愛媛県',4,9],['高知県',5,10]] },
  { name:'九州・沖縄', color:'#E4E0D6', prefs:[['福岡県',2,9],['佐賀県',1,9],['長崎県',1,10],['大分県',3,9],['熊本県',2,10],['宮崎県',3,10],['鹿児島県',2,11],['沖縄県',1,13]] },
];

export const YAMANASHI_MUNIS = ['甲府市','富士吉田市','都留市','山梨市','大月市','韮崎市','南アルプス市','北杜市','甲斐市','笛吹市','上野原市','甲州市','中央市','市川三郷町','身延町','富士川町','昭和町','忍野村','山中湖村','富士河口湖町'];

// ---- 甲府市 当初予算（すべて予算書パース値。R8〜R6 の複数年度） ---------------
const toNode = (r: KofuKanRow): BudgetNode => ({
  name: r.name,
  v: r.v,
  children: r.children?.map(toNode),
});

export function muniFromBudget(b: KofuBudgetYear): Municipality {
  return {
    name: '甲府市',
    total: b.totalOku,
    yoy: b.yoyLabel,
    year: b.fyLabel,
    pop: b.population,
    revenue: b.revenue.map(toNode),
    expenditure: b.expenditure.map(toNode),
  };
}

/** 最新年度（互換用） */
export const KOFU: Municipality = muniFromBudget(KOFU_BUDGET);

// 用語解説（インラインヘルプ）
export const GLOSS: Record<string, string> = {
  '歳入':'1年間に入ってくるお金。税金、国・県からの交付金・補助金、借入（市債）などで構成されます。',
  '歳出':'1年間に使うお金。予算では歳入と同額になるように編成されます。',
  '款':'予算書の大分類。歳出なら民生費・教育費など、歳入なら市税・国庫支出金などに分かれます。',
};

// 実データの生成モジュール（来歴付き）
// 公開サイトの素性（ドメイン・プライバシーポリシー）。画面から D.PRIVACY_URL で引く
export { SITE_URL, SITE_NAME, PRIVACY_URL, OPERATOR_NAME, OPERATOR_URL } from './site';
export { SIMILAR_FY_LABEL, SIMILAR_INDEX_URL, SIMILAR_EVIDENCE, type SimilarEvidence } from './similar.gen';
// 類似自治体比較（軸で選ぶ）。比較行そのものは全国索引を取得して組み立てる
export {
  SIMILAR_AXES, DEFAULT_SIMILAR_AXIS, DEFAULT_PEER_COUNT, SUGGEST_COUNT, BAND_SIZE,
  isSimilarAxis, axisOf, axisDistance, rankPeers, bandAverage, searchMunis, familyLabel,
  refOf, refLabelOf, type SimilarAxis, type SimilarAxisKey,
} from './similar';
export type { SimilarIndex, SimilarIndexRow } from '../hooks/useSimilarIndex';
export { KOFU_BUDGET, KOFU_BUDGET_YEARS, type KofuBudgetYear } from './kofu.gen';
export { KOFU_PROJECTS, KOFU_PROJECTS_SOURCE, KOFU_PROJECT_YEARS } from './projects.gen';
export { KOFU_EXECUTION, KOFU_EXECUTION_YEARS, type KofuExecutionYear } from './execution.gen';
export { KOFU_R6_DETAIL } from './detail.gen';
// 款より下（項・目）の内訳。⚠ 節・細節は入っていない（性質別の軸なので別物・#191）
export { BUDGET_DETAIL, type BudgetDetailKo, type BudgetDetailYear } from './budgetdetail.gen';
export { KOFU_TREND } from './trend.gen';
export { KOFU_EVALUATION_YEARS, type KofuEvaluationYear } from './evaluations.gen';
export { KOFU_COUNCIL, KOFU_COUNCIL_YEARS, MUNI_COUNCIL_YEARS, type Council, type KofuCouncil, type CouncilFaction } from './council.gen';
export { KOFU_REPORT_YEARS, type KofuReportYear, type KofuReport, type ReportIndicator, type ReportCostYear } from './report.gen';
export { KOFU_OUTTURN_YEARS, type KofuOutturnYear } from './outturn.gen';

// 全国 決算（総務省 決算状況調・全1,741市町村）の索引・ビルダ
import { FULL_MUNIS, PREF_CODES } from './decision-index.gen';
export { PREF_CODES, DECISION_YEARS, DECISION_FY_LABELS, FULL_MUNIS, DECISION_SOURCES, type DecisionEvidenceCard } from './decision-index.gen';
export {
  buildDecisionView,
  findMuniCodeByName,
  type DecisionShard,
  type DecisionView,
  type DecisionNode,
} from './decision';

// budget 階層（類似4市の当初予算・款別歳入歳出＋前年比較）
// ⚠ 予算の本体は gen に無い（#216 で public/munibudgets/ へ出した）。年度の中身が要る画面は
//    `useMuniBudgets(団体コード)` で取る。ここから引けるのは索引（名前・県名・収録年度）だけ。
import { BUDGET_MUNIS, MUNI_BUDGET_INDEX } from './munibudgets.gen';
export { BUDGET_MUNIS, MUNI_BUDGET_INDEX, type MuniBudgetIndexEntry, type MuniBudget, type MuniKanRow, type MuniProject, type MuniExecutionYear, type MuniExecRow } from './munibudgets.gen';

/**
 * カバレッジ階層。
 * - full = 予算ベースの詳細（主な事業・執行・評価・補正・前年比較）＝甲府
 * - budget = 当初予算の款別＋前年当初比較のみ＝類似4市
 * - decision = 総務省決算ベース＝全1,741市町村
 */
export function tierOf(muniCode: string | null | undefined): 'full' | 'budget' | 'decision' {
  if (!muniCode) return 'decision';
  if (FULL_MUNIS.includes(muniCode)) return 'full';
  if (BUDGET_MUNIS.includes(muniCode)) return 'budget';
  return 'decision';
}
/**
 * 地図の GeoJSON は**5桁**の団体コード（`19201`）、我々のデータは**6桁**（`192015`）を使う。
 * 6桁目は検査数字で、JIS X 0402 の定義は「11 から『Σ(各桁×重み6,5,4,3,2) を 11 で割った余り』を
 * 引いた数の**1の位**」（余り0→11→1・余り1→10→0）。
 * **全1,741市町村の実データ（総務省 R6 決算）で検算して一致0件・5桁の重複なしを確認済み**
 * （2026-07-15。丸め方を「10以上は0」と誤ると164件外れる）。
 */
export function muniCode6(code5: string | number): string {
  const c = String(code5).padStart(5, "0");
  if (!/^\d{5}$/.test(c)) throw new Error(`団体コード（5桁）として解釈できません: ${code5}`);
  const sum = [6, 5, 4, 3, 2].reduce((a, w, i) => a + Number(c[i]) * w, 0);
  return c + String((11 - (sum % 11)) % 10);
}

/** 都道府県名 → 県コード（2桁）。未収録（地図に無い名前）は null */
export function prefCodeOf(prefName: string | null | undefined): string | null {
  return prefName ? PREF_CODES[prefName] ?? null : null;
}

// データ出典（/sources）の一覧は **coverage.json から作る**（レジストリ＋魚拓台帳の自動生成）。
// かつてここに SOURCES という手書きの配列があったが、甲府市＋総務省だけを並べたもので、
// budget 階層18団体・97資料のうち大半が載っていなかった（2026-07-15 に撤去）。
// 資料は増え続けるので、画面に出す一覧を手で保守しない。

// 未収録資料のリクエスト（リクエスト駆動の情報公開請求 — docs/data-strategy.md）。
// 賛同が貯まったものから請求・収録する。台帳は GitHub Issues（ラベル: 資料リクエスト）
const REPO = 'https://github.com/philosophy-house/budget-trace';
/**
 * 資料リクエスト Issue の起票 URL。GitHub の issue form は URL クエリで
 * フィールド（id 一致）をプリフィルできるため、「どの画面の・何が・なぜ欲しいか」の
 * 文脈を reason に埋めて、データが無い箇所からその場で起票できるようにする
 */
export function buildRequestUrl(subject: string, reason?: string, publisher = '甲府市'): string {
  const params = new URLSearchParams({
    template: 'source-request.yml',
    title: `[資料リクエスト] ${subject}`,
    'source-name': subject,
    publisher,
    ...(reason ? { reason } : {}),
  });
  return `${REPO}/issues/new?${params.toString()}`;
}
const requestUrl = (title: string) => buildRequestUrl(title);
export const REQUEST_LIST_URL = `${REPO}/issues?q=${encodeURIComponent('is:issue label:資料リクエスト sort:reactions-+1-desc')}`;
export const UNCOLLECTED = [
  { title: '事務事業評価票（全事業分・各年度）', why: '事業単位の執行額（決算3年分・財源内訳）と成果指標。公開はサンプル数枚のみ', requestUrl: requestUrl('事務事業評価票（全事業分・各年度）') },
  { title: '主要な施策の成果報告書（各年度）', why: '決算に添付される法定書類（自治法233条5項）。施策・事業ごとの執行実績。ウェブ未掲載', requestUrl: requestUrl('主要な施策の成果報告書（各年度）') },
  { title: '予算書 本編（款項目節・各年度）', why: '款より深い「項・目・節」の内訳。ウェブ未公開', requestUrl: requestUrl('予算書 本編（款項目節・各年度）') },
  { title: '補正予算書（各年度）', why: '当初予算と予算現額（補正後）の差を補正ごとに追える', requestUrl: requestUrl('補正予算書（各年度）') },
];

// ---- エビデンスのリンク方針 -------------------------------------------------
// 原則: 画面のリンクは自サーバー配信の原本コピー（③）をドロワーで開く。
// 例外: 発行元が二次利用を許諾していない資料（/coverage の「要許可」）は、コピーは
// 来歴のために残したまま**リンクだけ発行元へディープリンク**する。発行元から消えていて
// 魚拓にしかない資料は魚拓へ繋ぐ（どちらかは derive が取得元から判定済み）。
export interface RestrictedEvidence {
  mode: 'origin' | 'archive';
  /** 発行元（または魚拓）のディープリンク。PDF は #page=N を引き継ぐ */
  href: string;
  /** 発行元が示している利用条件の原文 */
  license: string;
  /** 振替先に何があるか。page = 掲載ページ（HTML）と判っているもの / file = それ以外 */
  target: 'file' | 'page';
  /** リンクの文言（「原本を開く」と言い切れないので、どこへ出るかを書く） */
  actionLabel: string;
  /** 単独で立つリンクの文言（「（…）」の中に入れない用。どこへ出るかを言い切る） */
  openLabel: string;
}

/**
 * 自サーバー配信コピーの URL（`/sources/...`。`#page=N` 付き可）→ 外部リンクの宛先。
 * null = 許諾の問題が無い資料なので、これまでどおりコピーをドロワーで開いてよい。
 */
export function restrictedEvidence(localUrl: string | null | undefined): RestrictedEvidence | null {
  if (!localUrl) return null;
  const m = localUrl.match(/^([^#]*)(?:#page=(\d+))?$/);
  const path = m?.[1] ?? localUrl;
  const e = RESTRICTED_EVIDENCE[path];
  if (!e) return null;
  // ページ指定はブラウザの PDF ビューアが解釈する。PDF 以外に付けても意味が無いので付けない
  const page = m?.[2];
  const href = page && /\.pdf$/i.test(e.href) ? `${e.href}#page=${page}` : e.href;
  return {
    mode: e.mode,
    href,
    license: e.license,
    target: e.target,
    actionLabel: e.mode === 'archive' ? '魚拓で開く ↗' : '発行元で開く ↗',
    // 掲載ページ（HTML）へ振り替える資料は「掲載ページ」と言う — 資料そのものが開くと読ませない
    openLabel:
      e.mode === 'archive'
        ? '魚拓で開く ↗'
        : e.target === 'page'
          ? '発行元の掲載ページを開く ↗'
          : '発行元で開く ↗',
  };
}

/** エビデンスのリンク先（要許可なら発行元・魚拓、それ以外はコピー） */
export function evidenceHref(localUrl: string): string {
  return restrictedEvidence(localUrl)?.href ?? localUrl;
}

/** エビデンスのリンク文言。「（原本を開く）」と書けるのは③を開く資料だけ */
export function evidenceAction(localUrl: string | null | undefined): string {
  return restrictedEvidence(localUrl)?.actionLabel ?? '原本を開く';
}

/**
 * 単独で立つエビデンスリンクの文言（「予算書PDFを開く」のように資料の種類を名乗るもの）。
 * **自サーバーのコピーをドロワーで開くときだけ** copyLabel（資料の種類）を名乗ってよい。
 * 要許可で発行元へ振り替える資料は、出典チップと同じ語彙で「どこが開くか」を書く
 * （`noDeepLink` の資料は掲載ページ＝HTML が開くので「予算書PDFを開く」は嘘になる）。
 */
export function evidenceOpenLabel(localUrl: string | null | undefined, copyLabel: string): string {
  return restrictedEvidence(localUrl)?.openLabel ?? copyLabel;
}

/**
 * 自サーバーのコピーがドロワーで何として開くか（PDF ビューア / HTML / ダウンロードカード）。
 * ドロワーの分岐（BudgetTraceView の `viewer`）と同じ拡張子判定にしてある。判らない形式は
 * null を返し、呼び出し側は形式を名乗らない（款別の資料は PDF が460件・Excel/CSV が42件あり、
 * 「予算書PDFを開く」と決め打つと Excel の資料で文言と実態がズレる）。
 */
export function evidenceFormatLabel(localUrl: string | null | undefined): string | null {
  if (!localUrl) return null;
  const path = localUrl.split('#')[0]!;
  if (/\.pdf$/i.test(path)) return 'PDF';
  if (/\.html?$/i.test(path)) return 'HTML';
  if (/\.xlsx?$|\.xlsm$/i.test(path)) return 'Excel';
  if (/\.csv$/i.test(path)) return 'CSV';
  if (/\.zip$/i.test(path)) return 'ZIP';
  return null;
}

// ---- ヘルパー --------------------------------------------------------------
// 年度ラベル（fyEraLabel / prevFyEraLabel）は ./fy に置いて re-export する。
// decision.ts からも使うが、data.ts → decision.ts の import があるため直接引くと循環する。
export { fyEraLabel, prevFyEraLabel } from './fy';
// ⚠⚠ **億に換算済みの float を素朴に足さない**（#232）。gen の `v` / `amountOku` は
// **千円の整数を 1e5 で割った億**（derive の `toOku`）なので、`reduce` でそのまま足すと
// **加算順序で最下位ビットが揺れ**、`fmtOku` の丸めの向きが割れる。症状は
// **「同じ額が画面の2か所で1つ違う数字になる」**で、**金額データは正しいので検証ゲートも
// 汚染ゲートも見ていない**（2026-09-11 の実測で 歳入合計≠歳出合計25年度・合計≠総額カード32年度・
// 款計1件・「掲載なし」の 0円 36款）。⇒ **千円の整数に戻して足し、最後に1度だけ億へ返す。**
// ⚠ 割れる境界は `fmtOku` の段ごとに違う（≥1兆は 0.005兆・≥100億は 0.5億・1〜100億は 0.05億・
// <1億は万円）ので「N+0.5 億のときだけ」と覚えない。
// ⚠ **`v` が千円単位であることは derive 側の約束**。円単位の資料を款別に入れるなら、
// この丸めが千円未満を黙って落とすので先に見直すこと。
// ⚠ **`decision.ts` からはまだ引けない** — この `data.ts` が `./decision` を import しているので
// 循環する。使うなら `fyEraLabel` と同じように別ファイルへ切り出すこと（→ handoff §5 の `0j`）。
export const sumOku = (vs: number[]): number =>
  vs.reduce((a, b) => a + Math.round(b * 1e5), 0) / 1e5;
export function fmtOku(v: number): string {
  if (v >= 10000) return (v/10000).toFixed(2) + '兆円';
  if (v >= 1) return (v >= 100 ? Math.round(v).toLocaleString() : v.toFixed(1)) + '億円';
  // **0 でない額を「0万円」と出さない**（2026-07-17）。原典の**象徴計上**（款を残すために
  // 1〜4千円だけ計上する行。杉並の諸支出金 2,000円・神戸の災害復旧費 1,000円・山梨県内5市の
  // 災害復旧費 3,000円 など7件）は 万円へ丸めると 0 になり、**画面上「計上なし」と読める**。
  // 原典は 0 と象徴計上を区別しているので、こちらで潰してはいけない（CLAUDE.md「数値を丸めない」）。
  // 真の 0（皆減で当年度が 0 の款）は「0万円」のままにする — こちらは丸めでなく事実。
  if (v > 0 && Math.round(v * 10000) === 0) return Math.round(v * 1e8).toLocaleString() + '円';
  return Math.round(v*10000).toLocaleString() + '万円';
}
export function pctOf(v: number, total: number): string { return (v/total*100).toFixed(1) + '%'; }
// 円 → 万円（1万円未満は円のまま。町村の1人あたり・小さな金額で桁を潰さない）
export function fmtYen(yen: number): string {
  return yen >= 10000 ? (yen/1e4).toFixed(1) + '万円' : Math.round(yen).toLocaleString() + '円';
}
// 億円 → 1人あたり金額
export function fmtPerCap(oku: number, pop: number): string {
  return fmtYen(oku * 1e8 / pop);
}
// 人口（1万人未満の町村は「人」のまま。0.1万人 では実態が読めない）
export function fmtPop(pop: number): string {
  return pop >= 10000 ? (pop/1e4).toFixed(1) + '万人' : Math.round(pop).toLocaleString() + '人';
}
export function hash(s: string): number { let h = 0; for (let i=0;i<s.length;i++) { h = (h*31 + s.charCodeAt(i)) >>> 0; } return h; }
export function fadeColor(c: string): string { return `color-mix(in srgb, ${c} 26%, #F2F6F9)`; }
/**
 * 系列の i 番目の色。**PALETTE を直接 `[i % length]` で引かないこと** — 必ずこれを通す。
 *
 * PALETTE は12色しかないので、款が13以上ある団体では色が一周し、**同じドーナツの中に
 * 同色のスライスが2つ**できて凡例のスウォッチでも見分けられなかった（2026-07-29 修正。
 * 東京都の歳出18款で6色が2回ずつ・**95エンティティ中73／417断面中198が該当**）。
 *
 * 直し方は**色相を新設せず周ごとに明度を振る**（CLAUDE.md の「PALETTE 以外の系列色を
 * 新設しない」＝ Okabe-Ito ベースの色覚多様性対応を壊さないため）。2周目を**はっきり淡く**
 * してあるのは、1周目の彩度が高い色と「層」として見分けさせるためで、中途半端に淡くすると
 * 別の色相の1周目（例: 淡くした青 と 空色）と紛れる。
 *
 * 実データの最大は東京都の18款＝2周目までだが、3周目以降も定義しておく（款が増えても
 * 静かに同色へ戻らないように）。`fadeColor` と入れ子になるが color-mix は入れ子で使える。
 */
export function seriesColor(i: number): string {
  const base = PALETTE[i % PALETTE.length];
  const lap = Math.floor(i / PALETTE.length);
  if (lap === 0) return base;
  if (lap === 1) return `color-mix(in srgb, ${base} 45%, #FFFFFF)`;
  if (lap === 2) return `color-mix(in srgb, ${base} 60%, #000000)`;
  return `color-mix(in srgb, ${base} 25%, #FFFFFF)`;
}
export function donutBg(items: BudgetNode[], hi: number | null): string {
  const total = items.reduce((a,b)=>a+b.v,0);
  let acc = 0; const stops: string[] = [];
  items.forEach((it,i)=>{ const from = acc/total*100; acc += it.v; const to = acc/total*100; const col = seriesColor(i); stops.push(`${(hi==null||hi===i)?col:fadeColor(col)} ${from.toFixed(2)}% ${to.toFixed(2)}%`); });
  return `conic-gradient(${stops.join(', ')})`;
}

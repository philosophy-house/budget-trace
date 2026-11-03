// ============================================================================
// データパイプラインの型定義
//
// 4層モデル: sources（資料レジストリ）→ raw（不変ファイル）→ parsed（位置情報付き
// 抽出結果）→ normalized（標準分類へマッピングした比較可能データ）
// 各層の受け渡しはすべて Zod で検証する。
// ============================================================================
import { z } from "zod";

// ---- [0] 資料レジストリ ----------------------------------------------------
export const sourceEntrySchema = z.object({
  /** 一意なID（kebab-case）。data/ 配下のディレクトリ名になる */
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  publisher: z.string(),
  /** ファイルへの直リンク。null = 手動投入（ingest-local）のみ */
  url: z.url().nullable(),
  /** 1ソースが複数ファイルで構成される場合の直リンク一覧（url より優先） */
  urls: z.array(z.url()).optional(),
  /** 人間が確認するランディングページ（直リンクが変わったときの起点） */
  landingPage: z.url().optional(),
  /**
   * **発行元がファイルへの直リンクを断っている**（2026-07-17・新宿）。
   *
   * true にすると、要許可資料のエビデンスの振替先（`evidence-policy.gen.ts`）が
   * **ファイルの直リンクではなく `landingPage`** になる。**`landingPage` が必須**になる。
   *
   * 新宿区の原文（`/kusei/about.html`・確認日 2026-07-17）:
   *   「また、一部のコンテンツ（画像やＰＤＦ等）にリンクを設定することはおやめください。」
   * 要許可の資料は「写しは残したままリンクだけ発行元へ」振り替える設計（data-strategy.md）だが、
   * **その振替先が既定では raw-meta の `fetchedFrom`（＝PDF の直リンク）**なので、素で収録すると
   * **発行元が明示的に断っている行為をこちらから行う**ことになる。→ ランディングページへ向ける。
   *
   * ⚠ **ライセンス原文から自動判定しないこと**。§9g の実害（適用されない規約の名前を license に
   *   書いたら分類器が語で拾って逆の区分に落ちた）と同じ穴で、**リンクの可否は規約の書き方が
   *   自治体ごとに違いすぎる**（北区は「トップページ推奨」＝禁止ではない。新宿は「おやめください」＝
   *   依頼形だが明示）。**人が原文を読んで判断した結果をここに書く**。判断の根拠は registry の
   *   コメントに原文で残すこと。
   */
  noDeepLink: z.boolean().optional(),
  /**
   * 原本の種別。⚠ **zip は 2026-08-02（#191・横浜の款項目節 CSV）で足した** —
   * 中身は CSV だが**落ちてくるファイルは zip** なので、`csv` と偽ると
   * ①魚拓の sha256 突合が別物を指す ②/sources の表示が実物と食い違う。
   * archive の `isVerifiable` は `page` 以外を検証対象にするので zip もそのまま乗る。
   */
  kind: z.enum(["excel", "csv", "pdf", "page", "zip"]),
  /** 会計年度（例: "R6"） */
  fiscalYear: z.string().regex(/^[RH]\d+$/),
  scope: z.string(),
  license: z.string(),
  /** pipeline/parsers/index.ts に登録したパーサのキー */
  parser: z.string(),
  parserOptions: z.record(z.string(), z.unknown()).optional(),
  /** true = 開発用フィクスチャ。normalized は _fixtures/ に隔離される */
  fixture: z.boolean().optional(),
});
export type SourceEntry = z.infer<typeof sourceEntrySchema>;

// ---- [1] raw メタデータ ------------------------------------------------------
// バイナリ本体は data/raw/<sourceId>/（gitignore）。このメタだけコミットして
// 「いつ・どこから・どのハッシュのファイルを取得したか」の来歴を固定する。
export const rawFileMetaSchema = z.object({
  filename: z.string(),
  sha256: z.string().length(64),
  bytes: z.number().int().positive(),
  fetchedAt: z.string(), // ISO 8601
  /** 取得元URL、または "manual:<元ファイル名>"（手動投入） */
  fetchedFrom: z.string(),
  /**
   * 取得したバイト列に手を加えて持っているときの印（2026-10-02・議会の構成）。sha256 は**加えた後**のもの。
   * - "gunzip": 魚拓（id_）が gzip の本文をそのまま返したので展開した（発行元が配ったのは展開後の HTML）
   * - "ext:.html" / "ext:.pdf" / "ext:.json": URL に拡張子が無いので、中身を見てファイル名に付けた（ビューアは拡張子で見分ける）
   */
  transform: z.array(z.string()).optional(),
});
export const rawMetaSchema = z.object({
  sourceId: z.string(),
  files: z.array(rawFileMetaSchema).min(1),
});
export type RawMeta = z.infer<typeof rawMetaSchema>;

// ---- [1b] 外部アーカイブ台帳（data/archives.json） ----------------------------
// 一次資料の Wayback Machine スナップショット。raw 層（私たちの写し）に加えて
// 第三者が検証できる中立な写しの所在を記録する。pipeline/archive.ts が書く。
export const archiveEntrySchema = z.object({
  sourceId: z.string(),
  /** アーカイブ対象の元 URL（直リンクまたはランディングページ） */
  url: z.string().url(),
  kind: z.enum(["file", "landing"]),
  /** スナップショット URL（https://web.archive.org/web/<ts>/<url>） */
  waybackUrl: z.string().url(),
  /** スナップショットのタイムスタンプ（YYYYMMDDhhmmss） */
  waybackTimestamp: z.string(),
  /** この台帳エントリを最後に確認した日時（ISO 8601） */
  checkedAt: z.string(),
  /**
   * コピーの sha256 が raw（私たちが parse した版）と一致するか。
   * file のみ・**照合が実際に走った場合だけ**入る。false の意味は3つあり、
   * `waybackTruncated` / `waybackPartial` で区別する。
   */
  sha256Match: z.boolean().optional(),
  /**
   * **照合を試みたが実行できなかった**（コピーの取得に失敗・raw に対応ファイルが無い等）。
   * これが `true` になることはない — **`false` だけが意味を持つ**明示フィールドで、
   * 「照合して一致した」と「照合できていない」が**どちらもフィールド無しで区別できない**
   * 状態を消すために置く（2026-07-16。江戸川 R8 が実際にこの状態になり、件数だけ見て
   * 「魚拓が揃った」と誤って報告しかけた）。
   *
   * **HTML ページは対象外＝設計どおり**なので、こちらは付けない（フィールドごと無い）。
   * 区別: フィールド無し＝照合対象外 / `false`＝照合すべきなのにできなかった。
   */
  sha256Verified: z.boolean().optional(),
  /**
   * 照合できなかった理由（`sha256Verified: false` のときだけ）。**理由なしの false は
   * 「発行元が差し替えた」と誤診される**（#137 — 実際は Wayback の転送がランダムに途中で
   * 切れただけの一時的失敗が、理由なしの false として5件残っていた）。一時的な失敗
   * （転送切れ・HTTP エラー）と構造的な問題（raw に対応ファイルが無い）を台帳だけで
   * 区別できるようにする。
   */
  sha256FailReason: z.string().optional(),
  /** コピーの実バイト数。不一致の原因を後から診断するために残す（照合が走った file のみ） */
  waybackBytes: z.number().int().nonnegative().optional(),
  /**
   * **照合したときの raw の sha256**（照合が走った file のみ・2026-08-13・#214）。
   * `sha256Match` は「そのときの raw」との比較結果でしかない。台帳は最新でない過去の
   * スナップショット（打ち切られた最新捕捉より古い完全捕捉）を指せる（archive.ts の
   * `snapshots200` 参照）ため、照合済みのエントリは再ダウンロードせずに維持するが、
   * **raw が再取得で変わったらその維持を無効にする**錨としてこれを残す（上書き型 URL —
   * kofu-zaisei-jokyo — で古い一致が「現行版と一致」と読まれる事故を防ぐ）。
   */
  rawSha256: z.string().length(64).optional(),
  /**
   * **スナップショットが Wayback 側で MiB 境界ちょうどで切り詰められている**
   * （＝発行元の差し替えではない）。上限は1つではない（神戸 R8 24MB→5MiB /
   * 浜松 R5 3.9MB→1MiB）ため、境界そのもの（1 MiB の倍数）で判定する。
   *
   * **`sha256Match: false` の意味は3つあって助言が食い違う**ので、混ぜてはいけない:
   *   - `waybackTruncated: true` … Wayback 側のコピーが切れている。**私たちの raw は正しい**。
   *     打ち切りはクロール捕捉に固有で **SPN の保存は切られない**（2026-08-12・#214 で 5 MiB 超も
   *     無傷を実測）ため、--force で SPN 再保存 → 実体化後に再実行すると解消できる。
   *   - `waybackPartial: true` … コピーが raw より小さいが MiB 境界ではない。
   *     不完全な捕捉が濃厚だが、**古い版が単に小さいだけの可能性**も残る（断定しない）。
   *   - どちらも無い … スナップショットが**別版**（発行元が差し替えた等）を指している。
   *     --force で現行版の再登録が要る。
   */
  waybackTruncated: z.boolean().optional(),
  /**
   * **コピーが raw より小さいが MiB 境界ではない**（2026-07-16。江戸川 R8 の魚拓が
   * 142,235 bytes / 原本 4,820,529 bytes）。`waybackTruncated` の MiB 境界判定は
   * **確実な打ち切りしか捕まえない**ため、これに漏れた不完全な捕捉が
   * 「別版の可能性。--force で再登録を」＝**原因が正反対の助言**に落ちていた。
   * 打ち切りと違って断定はできない（古い版が小さいだけのこともある）ので、
   * `waybackTruncated` とは別のフィールドにして可能性の提示に留める。
   */
  waybackPartial: z.boolean().optional(),
});
export type ArchiveEntry = z.infer<typeof archiveEntrySchema>;
export const archivesLedgerSchema = z.object({
  note: z.string(),
  entries: z.array(archiveEntrySchema),
});

// ---- [2] parsed --------------------------------------------------------------
// 抽出した事実は必ず locator（どのファイルのどの位置から来たか）を持つ。
// UI のエビデンス表示・監査はここに依存する。
export const locatorSchema = z.object({
  file: z.string(),
  sheet: z.string().optional(),
  row: z.number().int().optional(), // 1-origin（Excelの表示行）
  page: z.number().int().optional(), // PDF 用
});
export type Locator = z.infer<typeof locatorSchema>;

/** 決算状況調の1自治体分。金額の単位は千円（資料の単位のまま保持する） */
export const muniAccountFactSchema = z.object({
  muniCode: z.string().regex(/^\d{6}$/), // 全国地方公共団体コード（JIS X 0402）
  prefName: z.string(),
  muniName: z.string(),
  population: z.number().int().nullable(),
  revenueTotal: z.number().nullable(),
  expenditureTotal: z.number().nullable(),
  /** 目的別歳出（議会費・総務費・民生費…）。キーは資料の科目名そのまま */
  expenditureByPurpose: z.record(z.string(), z.number()),
  /** 目的別歳出の項レベル内訳（款名 → 項名 → 千円）。資料に内訳列がある款のみ */
  expenditureByPurposeDetail: z
    .record(z.string(), z.record(z.string(), z.number()))
    .optional(),
  /** 歳入の科目別（地方税・地方交付税・国庫支出金…）。キーは資料の科目名そのまま */
  revenueByCategory: z.record(z.string(), z.number()).optional(),
  /** 歳入の内訳（科目名 → 内訳名 → 千円）。「うち〜」の部分列挙を含むことに注意 */
  revenueByCategoryDetail: z
    .record(z.string(), z.record(z.string(), z.number()))
    .optional(),
  /** 面積（km²・概況の記載値） */
  areaKm2: z.number().optional(),
  /** 産業構造（令和2年国調・%） */
  industryPct: z
    .object({ primary: z.number(), secondary: z.number(), tertiary: z.number() })
    .optional(),
  /** 財政力指数 */
  financialIndex: z.number().optional(),
  /** 経常収支比率（%） */
  keijoShushiPct: z.number().optional(),
  /** 実質公債費比率（%） */
  jisshitsuKosaihiPct: z.number().optional(),
  /** 将来負担比率（%）。「-」の団体は欠損 */
  shoraiFutanPct: z.number().optional(),
  /** 主たる出典位置（概況ファイルの行）。normalized の sourceRef になる */
  locator: locatorSchema,
  /** 複数ファイルから合成した場合の全出典位置（locator を含む） */
  locators: z.array(locatorSchema).optional(),
});
export type MuniAccountFact = z.infer<typeof muniAccountFactSchema>;

export const parsedDocSchema = z.object({
  /** ドキュメント種別。既存ファイルとの互換のため default 付き */
  docType: z.literal("municipal-accounts").default("municipal-accounts"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("thousandYen"),
  facts: z.array(muniAccountFactSchema),
});
export type ParsedDoc = z.infer<typeof parsedDocSchema>;

// ---- [2'] parsed: 予算書（款別） ---------------------------------------------
// 自治体の当初予算書・予算資料から抽出した款別の歳入・歳出。単位は千円。
export const budgetLineFactSchema = z.object({
  side: z.enum(["revenue", "expenditure"]),
  /**
   * 款番号。**null は「原典が款番号を振っていない」**（捏造しない）。
   * 例: 大阪市 R8 歳入末尾の廃止款 `（自動車取得税交付金）` は括弧書きで番号を持たないが、
   * 前年度額 1 千円が歳入合計に含まれるので、落とすと Σ が合わない。
   */
  kanNo: z.number().int().positive().nullable(),
  kanName: z.string().min(1),
  /** 当年度当初予算額（千円） */
  amount: z.number(),
  /** 前年度当初予算額（千円）。資料に無ければ null */
  prevAmount: z.number().nullable(),
  locator: locatorSchema,
});
export type BudgetLineFact = z.infer<typeof budgetLineFactSchema>;

/** 予算資料「主な事業一覧」の1事業 */
export const budgetProjectFactSchema = z.object({
  /**
   * 属するセクション: 歳出款（例: "総務費"）または特別会計名（例: "介護保険事業特別会計"）。
   * R2・R3 の箇条書き形式には款の記載が無く null
   */
  kan: z.string().min(1).nullable(),
  /** 款内の掲載番号（資料の No. 列）。箇条書き形式には無く null */
  no: z.number().int().positive().nullable(),
  /** 区分列（新規/拡充）または箇条書きのマーカー（◆=繰越）。無印は null */
  kubun: z.enum(["新規", "拡充", "繰越"]).nullable(),
  /** 事業名（【N】【連】マーカー含む、資料の表記のまま） */
  name: z.string().min(1),
  /** 下段（ ）書きの予算書上の事業名 */
  budgetBookName: z.string().nullable(),
  /** 予算額（千円） */
  amount: z.number(),
  /** 前年度予算額（千円）。豊川の事業別表など事業単位で前年度が載る様式のみ */
  prevAmount: z.number().optional(),
  /** 内容列の全文（箇条書き形式では ★/◆ の補足行。無い事業は空文字） */
  description: z.string(),
  /** 基本目標（ひと/まち/魅力、基本目標1〜4、基本構想の推進。複数は「・」連結） */
  basicGoal: z.string(),
  /** 基本目標の名称（箇条書き形式の見出しに記載がある場合のみ） */
  basicGoalLabel: z.string().optional(),
  /** 総合計画の施策（箇条書き形式では「施策の柱」） */
  shisaku: z.string(),
  locator: locatorSchema,
});
export type BudgetProjectFact = z.infer<typeof budgetProjectFactSchema>;

// ---- [2e] parsed: 主な事業だけの独立資料（款項目つき） ------------------------
// **`budget-book` に載せられない主な事業**（2026-08-04・#164・横浜の局別事業計画書）。
// `budgetBookDocSchema` は `revenueTotal`/`expenditureTotal` を必須にしており、
// **款別歳入歳出表を持たない資料**（局ごとに分割された事業計画書）を入れる場所が無い。
// 総額を捏造して通すのは論外なので、#191 の `budget-detail` と同じ判断で別 docType にする。
//
// ⚠ **これは「主な事業」であって事業報告（成果）ではない** — 当初予算の事業一覧で、
//   決算も成果指標も持たない。`project-report` とは別物。
export const budgetProjectLineSchema = z.object({
  /** 会計名（原典の `歳出予算科目` の会計。一般会計以外は derive で落とす） */
  accountName: z.string().min(1),
  /** 款・項・目の番号（原典のまま。名前は既収録の款別・款項目から引く） */
  kanNo: z.string().min(1),
  koNo: z.string().nullable(),
  mokuNo: z.string().nullable(),
  /** 所管（局・統括本部名） */
  bureau: z.string().min(1),
  name: z.string().min(1),
  /** 事業費（千円） */
  amount: z.number(),
  /** うち市債＋一般財源（千円） */
  shisaiIppan: z.number().nullable(),
  /** 前年度の事業費・市債＋一財（千円）。⚠ **廃止事業は当年度が 0 で前年度だけ入る** */
  prevAmount: z.number().nullable(),
  prevShisaiIppan: z.number().nullable(),
  /** 新規・拡充の印（原典は丸印）。無印は null */
  kubun: z.string().nullable(),
  /** 計画書の頁（廃止事業はハイフン）。原典の表示のまま */
  page: z.string().nullable(),
  /**
   * **目次ではなく詳細シートから拾った事業**（#164）。目次に1行も載らない目があるため。
   * ⚠ `page` の有無では区別できない — **目次にも頁を持たない行がある**（職員人件費・委員報酬）。
   * 検証で「Σ事業 = 目の計」を張るのは目次由来だけなので、その切り分けにこの印を使う。
   */
  fromDetail: z.boolean().optional(),
  locator: locatorSchema,
});
export type BudgetProjectLine = z.infer<typeof budgetProjectLineSchema>;

export const budgetProjectsDocSchema = z.object({
  docType: z.literal("budget-projects"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("thousandYen"),
  fiscalYear: z.string(),
  /**
   * 目ごとの「計」（原典が印字する）。**Σ事業 = 計** が最初の検証ゲートで、
   * さらに derive が **計 = 既収録の款項目明細の目** を突合する。
   */
  totals: z.array(
    z.object({
      accountName: z.string().min(1),
      kanNo: z.string().min(1),
      koNo: z.string().nullable(),
      mokuNo: z.string().nullable(),
      bureau: z.string().min(1),
      amount: z.number(),
      prevAmount: z.number().nullable(),
      locator: locatorSchema,
    }),
  ),
  facts: z.array(budgetProjectLineSchema),
});
export type BudgetProjectsDoc = z.infer<typeof budgetProjectsDocSchema>;

export const budgetBookDocSchema = z.object({
  docType: z.literal("budget-book"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("thousandYen"),
  fiscalYear: z.string(),
  /** 会計名（現状は一般会計のみ） */
  account: z.string(),
  /** 資料記載の歳入合計・歳出合計（千円）。内訳の和との照合は validate が行う */
  revenueTotal: z.number(),
  expenditureTotal: z.number(),
  prevRevenueTotal: z.number().nullable(),
  prevExpenditureTotal: z.number().nullable(),
  /**
   * 前年度列の基準。通常は「当初」だが、R2 の款別一覧表は
   * 「令和元年度 6月補正後予算額」との比較（パーサが資料から自動検出）
   */
  prevBasis: z.enum(["当初", "補正後"]).default("当初"),
  /**
   * 前年度列に関する資料注記（あれば原文のまま）。
   * 例: R6 資料「※令和5年度当初予算額は、6月補正における政策的予算（KOFU NEXT ACTION）を含む」
   * — R5 は改選年の骨格予算のため、R6 の前年列は R5 資料の総額と一致しない（両者とも正）
   */
  prevNote: z.string().optional(),
  facts: z.array(budgetLineFactSchema),
  /** 「主な事業一覧」ページの抽出結果（ページ指定がある場合のみ） */
  projects: z.array(budgetProjectFactSchema).optional(),
  /**
   * 事業の No が**項ごとに 1 へリセットする**様式（北区の `７ 主要事業`・2026-07-30）。
   * 既定（未宣言）は甲府と同じ「資料を通した連番」で、validate は No の重複を error にする。
   * ⚠ **宣言した資料だけ**その2つの検査を外す（京都府 §12 の `noPerProjectCost` と同じ作法）。
   * 外しても網は弱くならない — **パーサ側が「項ごとに 1..M」をより厳しく検査**しており、
   * さらに原典の宣言件数（`総務費 67事業`）と Σ項合計＝款額の等式で二重に張っている。
   */
  projectNoResetsPerKo: z.boolean().optional(),
});
export type BudgetBookDoc = z.infer<typeof budgetBookDocSchema>;

// ---- [2''] parsed: 予算執行状況（財政事情の公表） ------------------------------
// 地方自治法に基づく年2回の財政事情公表から抽出した款別の予算現額・収入/支出済額。
// 単位は千円（資料の万円を変換）。
export const executionLineFactSchema = z.object({
  side: z.enum(["revenue", "expenditure"]),
  /** 款名（資料表記から空白を除去） */
  name: z.string().min(1),
  /** 予算現額（千円） */
  currentBudget: z.number(),
  /** 収入済額（歳入）/ 支出済額（歳出）（千円） */
  settled: z.number(),
  /** 資料記載の収入率/執行率（%）。予算現額0の款は null */
  ratePct: z.number().nullable(),
  /** 内訳行（決算状況「収入支出詳細」の市税内訳など。予算現額のみ記載） */
  breakdown: z.array(z.object({ name: z.string().min(1), currentBudget: z.number() })).optional(),
  locator: locatorSchema,
});
export type ExecutionLineFact = z.infer<typeof executionLineFactSchema>;

export const budgetExecutionDocSchema = z.object({
  docType: z.literal("budget-execution"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  // 甲府（財政事情・収入支出詳細）は万円→千円で thousandYen、
  // 山梨県（決算の状況）は原典が円のため yen（整数で厳密一致を保つ）
  unit: z.enum(["thousandYen", "yen"]),
  /** 対象会計年度（例: "R7"） */
  fiscalYear: z.string(),
  account: z.string(),
  /** 基準日（例: "令和8年3月31日現在"）または "決算（確定値）" */
  asOf: z.string(),
  /**
   * 済額の基準。速報 = 財政事情の公表（出納整理期間前の年度末値）、
   * 確定 = 決算状況の収入支出詳細（出納整理後の決算値）
   */
  basis: z.enum(["速報", "確定"]).default("速報"),
  /** 基準日現在の人口（資料記載） */
  population: z.number().nullable(),
  /** 資料記載の合計行（千円）。内訳の和との照合は validate が行う */
  revenueBudgetTotal: z.number(),
  revenueSettledTotal: z.number(),
  expenditureBudgetTotal: z.number(),
  expenditureSettledTotal: z.number(),
  facts: z.array(executionLineFactSchema),
});
export type BudgetExecutionDoc = z.infer<typeof budgetExecutionDocSchema>;

// ---- [2'''] parsed: 行政評価（事務事業評価） -----------------------------------
// 実施計画事業ごとの総合評価（A〜F）。年度により形式が違う（docs/data-sources.md）。
// 評価年度 = 実施計画の年度（例: R6 評価 = 第9次実施計画 = R6 年度事業）。
export const projectEvaluationFactSchema = z.object({
  /** 実施計画掲載事業名 / 事務事業名 */
  name: z.string().min(1),
  /** 総合評価（A〜F、完了。新規等で評価なしは "－"） */
  grade: z.string().regex(/^([A-F－]|完了)$/),
  /** 前回評価（無い年度・新規は null） */
  prevGrade: z.string().nullable(),
  /** 評価点の合計（R3 形式のみ） */
  scoreTotal: z.number().nullable(),
  /** 担当（部・課）。無い形式は null */
  bu: z.string().nullable(),
  ka: z.string().nullable(),
  /** 施策（一覧形式のみ） */
  shisaku: z.string().nullable(),
  /** 区分（主要事業/一般事業など。無い形式は null） */
  kubun: z.string().nullable(),
  /** 事業の目的（様式形式のみ） */
  purpose: z.string().nullable(),
  /** 予算名（実施計画一覧シートから join。R6・R7 のみ）— 主な事業の予算書名と突合できる */
  budgetName: z.string().nullable(),
  locator: locatorSchema,
});
export type ProjectEvaluationFact = z.infer<typeof projectEvaluationFactSchema>;

export const projectEvaluationDocSchema = z.object({
  docType: z.literal("project-evaluation"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  /** 評価年度（= 実施計画の年度） */
  fiscalYear: z.string(),
  /** 資料の様式・実施計画次数などの注記 */
  formNote: z.string(),
  facts: z.array(projectEvaluationFactSchema),
});
export type ProjectEvaluationDoc = z.infer<typeof projectEvaluationDocSchema>;

// ---- [2''''] parsed: 統計書 財政章（款項×当初/最終/決算） ----------------------
// 甲府市統計書「一般会計歳入歳出状況」。款＋項レベルで当初予算額・最終予算額
// （補正・繰越込みの予算現額）・決算額の3点が取れる唯一のウェブ公開資料。単位は円。
export const outturnLineFactSchema = z.object({
  side: z.enum(["revenue", "expenditure"]),
  kanName: z.string().min(1),
  /** 項名。null = 款の行 */
  kouName: z.string().nullable(),
  /** 当初予算額（円） */
  initialBudget: z.number(),
  /** 最終予算額（円・補正/繰越込み） */
  finalBudget: z.number(),
  /** 決算額（円） */
  settled: z.number(),
  locator: locatorSchema,
});
export type OutturnLineFact = z.infer<typeof outturnLineFactSchema>;

export const budgetOutturnDocSchema = z.object({
  docType: z.literal("budget-outturn"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("yen"),
  /** データの会計年度（統計書の版とはズレる — 版-2年度） */
  fiscalYear: z.string(),
  account: z.string(),
  /** 総額行（円） */
  revenueTotal: z.object({ initial: z.number(), final: z.number(), settled: z.number() }),
  expenditureTotal: z.object({ initial: z.number(), final: z.number(), settled: z.number() }),
  facts: z.array(outturnLineFactSchema),
});
export type BudgetOutturnDoc = z.infer<typeof budgetOutturnDocSchema>;

// 総務省 決算状況調(4)性質別歳出＋(5)地方債。1自治体1レコード。千円。
export const municipalNatureFactSchema = z.object({
  muniCode: z.string().regex(/^\d{6}$/),
  /** 主要14性質（人件費・扶助費・普通建設事業費・公債費…）→ 千円 */
  byNature: z.record(z.string(), z.number()),
  /** Σ主要14性質（＝歳出総額。概況と突合できる） */
  natureTotal: z.number(),
  /** 地方債現在高ほか（(5)ファイル。無い自治体は null） */
  localBond: z
    .object({
      balance: z.number(),
      reserveTotal: z.number().nullable(),
      reserveByType: z.object({
        財政調整基金: z.number().nullable(),
        減債基金: z.number().nullable(),
        その他特定目的基金: z.number().nullable(),
      }),
      debtBurdenFuture: z.number().nullable(),
      publicEnterpriseTransfer: z.number().nullable(),
    })
    .nullable(),
  locator: locatorSchema,
});
export type MunicipalNatureFact = z.infer<typeof municipalNatureFactSchema>;

export const municipalNatureDocSchema = z.object({
  docType: z.literal("municipal-nature"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("thousandYen"),
  fiscalYear: z.string(),
  facts: z.array(municipalNatureFactSchema),
});
export type MunicipalNatureDoc = z.infer<typeof municipalNatureDocSchema>;

// ---- 議会の構成（予算議決時）: 会派別議席数＋当初予算の議決 -------------------
// 甲府市議会の所属会派別議員名簿（会派→議席数）と、令和8年3月定例会 審議結果
// （一般会計当初予算の議案番号・議決日・結果）。甲府の賛否は未収録（R7・R8 は「議員別表決結果一覧」が
// 公表されている。リンクの有無だけを votesTableLink に持つ）— 推測で埋めない。
export const councilFactionFactSchema = z.object({
  /** 会派名（無所属は議員名で一意化） */
  name: z.string().min(1),
  /** 議席数（名簿の実員数を数えた値） */
  seats: z.number().int().positive(),
  /** 無所属（会派に属さない議員）か */
  isIndependent: z.boolean(),
  /**
   * 所属議員の氏名（`council-transcribed` のみ）。名簿から書き写し、パーサが原典の本文に
   * **全員の名前が出ること**を確かめている。議席数はこの人数（申告の人数ではない）。
   */
  members: z.array(z.string().min(1)).optional(),
  locator: locatorSchema,
});
export type CouncilFactionFact = z.infer<typeof councilFactionFactSchema>;

export const councilResolutionSchema = z.object({
  /** 議案番号（例: 議案第5号） */
  billNo: z.string().min(1),
  /** 件名（例: 令和8年度甲府市一般会計予算） */
  billName: z.string().min(1),
  /** 会期（例: 令和8年3月定例会） */
  sessionLabel: z.string().min(1),
  /** 議決日 ISO（例: 2026-03-25） */
  decidedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** 議決日 和暦表記（例: 令和8年3月25日） */
  decidedDateLabel: z.string().min(1),
  /** 結果（例: 可決） */
  result: z.string().min(1),
  locator: locatorSchema,
});

export const councilVotesSchema = z.object({
      basis: z.enum(["member", "faction"]),
      /** 原典が記号でなく「全会一致」の語だけで示した採決（賛成の数は議席から出した数）。その原文 */
      unanimousText: z.string().optional(),
      sourceTitle: z.string(),
      sourceFile: z.string(),
      /** 列ごとの賛否。faction は registry の会派名（無所属は「無所属（氏名）」の表示名） */
      columns: z.array(
        z.object({
          label: z.string(),
          faction: z.string(),
          member: z.string().optional(),
          stance: z.enum(["賛成", "反対", "賛成でない", "欠席", "退席", "棄権", "除斥", "議長", "不参加"]),
        }),
      ),
    });

export const councilCompositionDocSchema = z.object({
  docType: z.literal("council-composition"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  /** 予算年度（議決対象の当初予算の年度） */
  fiscalYear: z.string(),
  /** 議会名（例: 甲府市議会） */
  body: z.string().min(1),
  /** 定数（＝会派の議席合計。当市は現員=定数=32） */
  seats: z.number().int().positive(),
  /** 会派構成の基準日 ISO（名簿の更新日） */
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /**
   * 条例定数（`council-transcribed` のみ・任意）。欠員があると `seats`（＝現員＝会派の和）より大きい。
   * 原典で定数を確かめた団体だけが持つ（無い団体は「現員」とだけ表示する）。
   */
  teisu: z.number().int().positive().optional(),
  factions: z.array(councilFactionFactSchema),
  /** 会派制を採らない議会（町村議会に多い）。factions は「会派なし」1件＝全議員 */
  noFactions: z.boolean().optional(),
  /**
   * 名簿の基準日から議決までに議席を離れた議員（`council-transcribed` 0.8.23〜）。factions の members には居ない。
   * 原文（url の原典）で氏名・辞職などの語・日付を照合済み。画面は「（1月31日の辞職を除く）」と出す
   */
  departures: z
    .array(
      z.object({
        name: z.string(),
        faction: z.string(),
        kind: z.enum(["辞職", "失職", "逝去", "死去"]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        dateLabel: z.string(),
        title: z.string(),
        url: z.string(),
        locator: z.object({ file: z.string() }),
      }),
    )
    .optional(),
  resolution: councilResolutionSchema,
  /** 名簿・議決結果の原典の呼び名（画面の出典チップ。`council-transcribed` のみ） */
  rosterTitle: z.string().optional(),
  resultTitle: z.string().optional(),
  /** 審議結果のページにある「議員別表決結果一覧」へのリンク（`kofu-gikai` 0.2.0・あれば）。賛否そのものは未収録 */
  votesTableLink: z.object({ title: z.string(), url: z.string() }).optional(),
  /**
   * 当初予算の議決での賛否（2026-10-02・`council-transcribed` のみ）。原典の賛否表の**列見出しの並び**と
   * **予算の行の記号の並び**を書き写し、パーサが原典と突き合わせたもの。
   * basis: "member" ＝列が議員1人ずつ／"faction" ＝列が会派（無所属は1人ずつのことが多い）
   */
  votes: councilVotesSchema.optional(),
  /** 予算の議決が複数の採決に分かれるとき（修正可決: 修正案・修正部分を除く原案）の採決ごとの賛否（0.7.0） */
  votesParts: z.array(councilVotesSchema.extend({ part: z.string() })).optional(),
});
export type CouncilCompositionDoc = z.infer<typeof councilCompositionDocSchema>;

// ---- 事業報告（成果）: 事務事業評価 詳細票（第2号様式） -----------------------
// 甲府市が公表した個別事業の詳細票。事業費（決算3年＋当初＋計画）・トータルコスト
// （人件費込み）・成果指標の目標値/実績値・総合評価・実施内容/成果説明を持つ。
// 予算→執行→成果を1事業で通して見られる唯一の一次資料（公表は各年数件のサンプルのみ）。
export const projectReportCostYearSchema = z.object({
  fy: z.string(), // "R3" など
  /**
   * 甲府は「決算/当初/計画」。川崎は「予算額/決算額/計画事業費」で、**予算額が当初とは限らない**
   * （資料には「予算額」としか書かれていない）ため "当初" に丸めず "予算" を別に持つ。
   */
  /**
   * ⚠ 杉並は **「予算額 / 実績額」**（#163）。**`実績` を `決算` へ丸めない** — 原典が
   * 「決算額」と書いていないうえ、評価年度（R7）の実績額は全件 `-`（未確定）で、
   * 決算と呼べるのは過年度分だけ。原文の語のまま持つ。
   */
  kind: z.enum(["決算", "当初", "計画", "予算", "実績"]),
  /** 事業費（千円）。川崎の「事業費 A」 */
  jigyohi: z.number().nullable(),
  /** 一般財源（千円） */
  ippanZaigen: z.number().nullable(),
  /** トータルコスト＝事業費＋概算人件費（千円）。川崎の「総コスト (A+B)」 */
  totalCost: z.number().nullable(),
  /** 人件費（千円）。川崎の「人件費 B」＝ 職員1人当たり人件費 × 人工。甲府は総額に含み内訳を出さない */
  jinkenhi: z.number().nullable().optional(),
  /** 人工（人）。川崎のみ */
  ninku: z.number().nullable().optional(),
  /** 財源内訳（千円）。川崎のみ。国庫支出金＋市債＋その他特財＋一般財源 = 事業費A が検証ゲート */
  kokkoShishutsukin: z.number().nullable().optional(),
  shisai: z.number().nullable().optional(),
  sonotaTokuzai: z.number().nullable().optional(),
  /**
   * 特定財源の総額（千円）。札幌の「うち特定財源」（内訳なしの1値）。
   * ⚠ **一般財源 = 事業費 − 特定財源 を導出してはならない** — 札幌は人件費を職員費の款に
   * 配賦する体系のため、国庫負担金等の特定財源が（物件費ベースの）事業費を**超える調書が実在**する
   * （公立保育所等運営費: 事業費 1,212,230 / 特定財源 1,894,054・R5 決算）。原文のまま持つ。
   */
  tokuteiZaigen: z.number().nullable().optional(),
  /**
   * 財源内訳（千円）。**杉並の3本**（#163）。⚠ **川崎の `kokkoShishutsukin`/`shisai`/
   * `sonotaTokuzai` に寄せない** — 杉並は「国**・都**からの補助金」で国庫単独ではなく、
   * 市債の欄がそもそも無い。**特定財源 = ①+②+③** が検証ゲート。
   */
  jueki: z.number().nullable().optional(),
  kokuToHojokin: z.number().nullable().optional(),
  sonotaHojokin: z.number().nullable().optional(),
  /** 決算額が見込み（評価年度のため確定値でない）か。川崎 R6 の決算額が該当 */
  isEstimate: z.boolean().optional(),
});
export const projectReportIndicatorSchema = z.object({
  /** 活動指標 / 成果指標 */
  category: z.enum(["活動指標", "成果指標"]),
  name: z.string().min(1),
  /** 目標値（年度順・最大5）。数値化できない指標は null */
  targets: z.array(z.number().nullable()),
  /** 実績値（決算年度分・目標より少ない）。 */
  actuals: z.array(z.number().nullable()),
  /**
   * 達成率（%・年度順）。杉並が印字する（#163）。⚠ **実績÷計画で導出しない** — 原典が
   * 印字した値をそのまま持ち、**導出値との一致を validate の証人に使う**。
   */
  rates: z.array(z.number().nullable()).optional(),
  /**
   * 成果指標の分類（杉並・#163）。実測の語彙: 行政サービス成果指標 / 社会成果（課題）指標 /
   * 利用者満足度指標 / 区民満足度指標。**丸めない**。持たない資料・活動指標は null。
   */
  classification: z.string().nullable().optional(),
});
export const projectReportFactSchema = z.object({
  /** 評価票の通し番号（シート名） */
  no: z.string(),
  /** 事務事業名 */
  name: z.string().min(1),
  /** 担当（部室課の原文） */
  buka: z.string(),
  /** 区分（継続/主要/総合戦略 など） */
  kubun: z.string().nullable(),
  /** 事業実施結果（評価対象年度の実施内容） */
  implementation: z.string().nullable(),
  /**
   * 総合評価（甲府の第2号様式: A〜F。完了は F 扱い）。
   * **評価体系は自治体で違う** — 川崎は達成度1〜5＋方向性区分Ⅰ〜Ⅴで A〜F も点数も無いため null。
   * 他市の評価を A〜F へ丸めない（評価の意味が変わる）。
   */
  grade: z.string().regex(/^[A-F]$/).nullable(),
  /** 評価点（甲府: 24点満点）。持たない自治体は null */
  score: z.number().nullable(),
  /** 事務事業コード（川崎: 8桁・**年度をまたいで安定**するので経年追跡に使える）。甲府は持たない */
  code: z.string().nullable().optional(),
  /**
   * 達成度（川崎: 1〜5。1=目標を大きく上回って達成 … 5=大きく下回った）。甲府は持たない。
   * 数字が小さいほど良い＝A〜F と向きが違う点に注意
   */
  achievement: z.number().int().min(1).max(5).nullable().optional(),
  /** 今後の事業の方向性（川崎: Ⅰ現状のまま継続 / Ⅱ改善しながら継続 / Ⅲ事業規模拡大 / Ⅳ事業規模縮小 / Ⅴ終了） */
  direction: z.string().nullable().optional(),
  /**
   * 事業の改善の方向性（杉並の「Ⅱ.」・#163）。⚠ **複数回答**なので配列
   * （実測 590事業で延べ613）。`direction` は「Ⅰ.事業コストの方向性」（単一回答）で別軸。
   */
  improvementDirections: z.array(z.string()).optional(),
  /**
   * 進捗の自己評価（北九州: 順調／概ね順調／やや遅れ／遅れ の4段階）。
   * `achievement`（1〜5の数値・川崎）や `grade`（A〜Fの1文字・甲府）のどちらにも当てはまらない
   * 語彙のため新設。**丸めない**（例: 「概ね順調」を「順調」に寄せない）。
   */
  progress: z.string().nullable().optional(),
  /**
   * 資料が載せている「差引（増減）」（千円）。横浜の事業決算額の表が持つ。
   * **検算専用** — validate が「差引 = 当年度 − 前年度」で列の対応を確かめる（実測 1,508/1,508 厳密一致）。
   */
  costDiff: z.number().nullable().optional(),
  /** 政策・施策（川崎の政策体系。款とは別軸） */
  policy: z.string().nullable().optional(),
  measure: z.string().nullable().optional(),
  /** コスト経年（年度順） */
  cost: z.array(projectReportCostYearSchema),
  /** 成果・活動指標 */
  indicators: z.array(projectReportIndicatorSchema),
  locator: locatorSchema,
});
export type ProjectReportFact = z.infer<typeof projectReportFactSchema>;
export const projectReportDocSchema = z.object({
  docType: z.literal("project-report"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  /** 評価年度（評価票の作成年度） */
  fiscalYear: z.string(),
  /** 対象（実績）年度 */
  targetFy: z.string(),
  /**
   * **原典が事業ごとの金額を印字しない資料**（2026-07-30・京都府 §12）。
   *
   * true のとき validate は「コスト経年が空」を error にしない。
   * ⚠ **パーサが原典を見て宣言する**もので、既定は false（宣言しない限りゲートは効いたまま）。
   * これを立てるのは「原典に無い金額を推計で埋めない」ことの裏返しであって、
   * **抽出に失敗したことの言い訳に使ってはいけない**。
   *
   * 京都府「主要な施策の成果に関する報告書」は**金額が目レベルにしか無く**、施策ごとの額は
   * 本文の `３ 執行額 …円` を持つ施策（417件中399件）にしか存在しない。
   * **1つの目に複数の施策がぶら下がるので、目の金額を施策へ配ると二重計上になる**。
   *
   * ⚠ **列ずれの検出（`cost` があるのに全年度 null）は宣言の有無に関わらず効く** —
   * ゲートの本来の目的はそちらなので、この宣言で緩むのは「そもそも cost が無い」場合だけ。
   */
  noPerProjectCost: z.boolean().optional(),
  /**
   * **パーサが parsed に出す前に落とした件数**（杉並・#163）。
   * ⚠ derive は既定では `policy` の会計名で除外を数える（横浜方式）が、**会計欄を持たない資料**では
   * それができない。宣言しないと画面が「全N事業が公表されています（サンプルではなく全量）」と
   * **過大に言う**（除外の但し書きが出ない）。
   */
  excludedCount: z.number().int().nonnegative().optional(),
  facts: z.array(projectReportFactSchema),
});
export type ProjectReportDoc = z.infer<typeof projectReportDocSchema>;

// ---- [2''''] parsed: 当初予算の款項目節（項以下の内訳） ------------------------
// **プロジェクト初の「款より下」に届く層**（2026-08-02・#191・横浜）。全自治体で款別
// （第1階層）までしか収録できておらず、`/roadmap` の later「款より下（項・目・節）の内訳」は
// 甲府市の原典（予算書本編）がウェブ未公開で止まっていた。
//
// **なぜ budget-book に載せられないか**: `budgetLineFactSchema` は `kanNo`/`kanName` しか持たず、
// **項・目・節を入れる場所が無い**。budget-book を壊さずに階層を持つため別 docType にする。
//
// **葉ノードだけを持つ**（原典が小計行を持たないため。⚠ 例外は下記の `総計` 行で、
// **これは parse 時に落とす** — 残すと二重計上になる）。上位階層の額は葉の和で作る。
export const budgetDetailFactSchema = z.object({
  side: z.enum(["revenue", "expenditure"]),
  /** 会計コード（横浜は `01` が一般会計。⚠ R6 はゼロ埋めされないので parse 側で揃える） */
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  /** 款・項・目（番号は原典の桁のまま。名称は原典どおり） */
  kanNo: z.string().min(1),
  kanName: z.string().min(1),
  koNo: z.string().min(1),
  koName: z.string().min(1),
  mokuNo: z.string().min(1),
  mokuName: z.string().min(1),
  /** 節。⚠ **歳出の節は地方自治法の性質別区分**（報酬・給料・委託料…）で、款項目の目的別とは軸が違う */
  setsuNo: z.string().min(1),
  setsuName: z.string().min(1),
  /** 細節（歳出のみ。歳入には無い） */
  saisetsuNo: z.string().nullable(),
  saisetsuName: z.string().nullable(),
  /** 金額（千円）。⚠ 原典は単位をどこにも書いていないので registry の `unit` で宣言する */
  amount: z.number(),
  /**
   * 前年度額（千円）。**資料によって在ったり無かったりする**ので nullable。
   * 横浜の CSV 版（R6〜R8）は当年度しか持たず、**XLSX 版（R5 以前）は前年度列を持つ**（#192）。
   * ⚠ **無いことを 0 で表さない**（0 は「前年度は0円」という別の主張になる）。
   */
  prevAmount: z.number().nullable(),
  /**
   * **この葉が属する項・款の行に印字された前年度額**（千円）。同じ項の葉には同じ値が入る。
   *
   * ⚠⚠ **葉の前年度を足しても項・款の前年度にはならない**（実測・#192）。原典の前年度額は
   * **当年度の科目体系に組み替えたもの**で、**当年度に廃止された目は行ごと消える**が、その額は
   * **項・款の行にだけ残る**（R5 歳出「選挙費」は 項行 2,833,438 に対し Σ目 1,499,819）。
   * Σ目で項の前年比を作ると**符号が逆になる項が出る**（R5 選挙費は実際は減なのに +50.1% と出た）。
   * → **項・款の前年比は必ずこの値を使う**。持たない資料（CSV 版）は null。
   */
  koPrevAmount: z.number().nullable(),
  kanPrevAmount: z.number().nullable(),
  locator: locatorSchema,
});
export type BudgetDetailFact = z.infer<typeof budgetDetailFactSchema>;

export const budgetDetailDocSchema = z.object({
  docType: z.literal("budget-detail"),
  sourceId: z.string(),
  parser: z.string(),
  parserVersion: z.string(),
  parsedAt: z.string(),
  unit: z.literal("thousandYen"),
  fiscalYear: z.string(),
  /** 一般会計の歳入合計・歳出合計（葉の和）。全会計ではなく**一般会計**なのは画面が一般会計だから */
  generalRevenueTotal: z.number(),
  generalExpenditureTotal: z.number(),
  /** 全会計の合計（原典の `総計` 行と突合するために持つ） */
  allRevenueTotal: z.number(),
  allExpenditureTotal: z.number(),
  /**
   * 前年度の合計（千円）。**前年度列を持つ資料だけ**（#192 の XLSX 版）。無ければ null。
   * ⚠ **歳入と歳出で食い違う年度が実在する**（横浜 R2・H31）ので validate が突合する。
   */
  prevRevenueTotal: z.number().nullable(),
  prevExpenditureTotal: z.number().nullable(),
  /**
   * 原典の `総計` 行の値（横浜は R8・R7 の**歳出にだけ**在る。無ければ null）。
   * ⚠ **歳入側も必ず持つ** — 現状の原典には無いが、出たときに「検証の錨に使える数字を
   * 黙って捨てる」ことになるため（レビュー指摘）。validate が在るほうだけ突合する。
   */
  statedRevenueTotal: z.number().nullable(),
  statedExpenditureTotal: z.number().nullable(),
  facts: z.array(budgetDetailFactSchema),
});
export type BudgetDetailDoc = z.infer<typeof budgetDetailDocSchema>;

/** parse/validate が受け取り得る全ドキュメント型 */
export const anyParsedDocSchema = z.union([
  budgetBookDocSchema,
  budgetDetailDocSchema,
  budgetProjectsDocSchema,
  budgetExecutionDocSchema,
  projectEvaluationDocSchema,
  budgetOutturnDocSchema,
  municipalNatureDocSchema,
  councilCompositionDocSchema,
  projectReportDocSchema,
  parsedDocSchema,
]);
export type AnyParsedDoc = z.infer<typeof anyParsedDocSchema>;

// ---- 検証ゲート ---------------------------------------------------------------
export const validationIssueSchema = z.object({
  level: z.enum(["error", "warning"]),
  muniCode: z.string().optional(),
  message: z.string(),
});
export const validationResultSchema = z.object({
  sourceId: z.string(),
  validatedAt: z.string(),
  /** needs_review のソースは normalize を通さない（--force を除く） */
  status: z.enum(["ok", "needs_review"]),
  issues: z.array(validationIssueSchema),
});
export type ValidationResult = z.infer<typeof validationResultSchema>;

// ---- [3] normalized -----------------------------------------------------------
// 比較可能レイヤ。自治体は団体コード、歳出は目的別の標準科目キーで揃える。
export const STANDARD_PURPOSES = [
  "議会費", "総務費", "民生費", "衛生費", "労働費", "農林水産業費", "商工費",
  "土木費", "消防費", "警察費", "教育費", "災害復旧費", "公債費", "諸支出金",
  "前年度繰上充用金", "その他",
] as const;
export const standardPurposeSchema = z.enum(STANDARD_PURPOSES);
export type StandardPurpose = z.infer<typeof standardPurposeSchema>;

export const normalizedMuniAccountSchema = z.object({
  muniCode: z.string().regex(/^\d{6}$/),
  prefName: z.string(),
  muniName: z.string(),
  fiscalYear: z.string(),
  population: z.number().int().nullable(),
  /** 金額は千円で統一 */
  revenueTotal: z.number().nullable(),
  expenditureTotal: z.number().nullable(),
  expenditureByPurpose: z.partialRecord(standardPurposeSchema, z.number()),
  /** 目的別歳出の項レベル内訳（款名 → 項名 → 千円） */
  expenditureByPurposeDetail: z
    .record(z.string(), z.record(z.string(), z.number()))
    .optional(),
  /** 歳入の科目別（資料の標準科目名のまま） */
  revenueByCategory: z.record(z.string(), z.number()).optional(),
  /** 歳入の内訳（「うち〜」の部分列挙を含む） */
  revenueByCategoryDetail: z
    .record(z.string(), z.record(z.string(), z.number()))
    .optional(),
  /** 基本情報・財政指標（概況の記載値） */
  areaKm2: z.number().optional(),
  industryPct: z
    .object({ primary: z.number(), secondary: z.number(), tertiary: z.number() })
    .optional(),
  financialIndex: z.number().optional(),
  keijoShushiPct: z.number().optional(),
  jisshitsuKosaihiPct: z.number().optional(),
  shoraiFutanPct: z.number().optional(),
  /** 1人あたり歳出（円）。population が無い場合は null */
  expenditurePerCapitaYen: z.number().nullable(),
  /** 来歴: どのソースのどの位置から来たか */
  sourceRef: z.object({ sourceId: z.string(), sha256: z.string(), locator: locatorSchema }),
});
export type NormalizedMuniAccount = z.infer<typeof normalizedMuniAccountSchema>;

export const normalizedDatasetSchema = z.object({
  dataset: z.literal("municipal-accounts"),
  fiscalYear: z.string(),
  unit: z.literal("thousandYen"),
  generatedAt: z.string(),
  sources: z.array(z.object({ sourceId: z.string(), sha256: z.string() })),
  records: z.array(normalizedMuniAccountSchema),
});
export type NormalizedDataset = z.infer<typeof normalizedDatasetSchema>;

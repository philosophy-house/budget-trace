// このファイルは自動生成です。手で編集しないこと。
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

export const MUNI_BUDGET_INDEX: Record<string, MuniBudgetIndexEntry> = {
  "100005": {
    "muniName": "群馬県",
    "prefName": "群馬県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "102016": {
    "muniName": "前橋市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "102024": {
    "muniName": "高崎市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2",
      "H30",
      "H29",
      "H26",
      "H25",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "102032": {
    "muniName": "桐生市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "102041": {
    "muniName": "伊勢崎市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H29",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23"
    ],
    "hasProjects": false
  },
  "102059": {
    "muniName": "太田市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "102075": {
    "muniName": "館林市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "102091": {
    "muniName": "藤岡市",
    "prefName": "群馬県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "110001": {
    "muniName": "埼玉県",
    "prefName": "埼玉県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "111007": {
    "muniName": "さいたま市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "112011": {
    "muniName": "川越市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112020": {
    "muniName": "熊谷市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23"
    ],
    "hasProjects": false
  },
  "112038": {
    "muniName": "川口市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "112062": {
    "muniName": "行田市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112071": {
    "muniName": "秩父市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112089": {
    "muniName": "所沢市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "112097": {
    "muniName": "飯能市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "112101": {
    "muniName": "加須市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112119": {
    "muniName": "本庄市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112127": {
    "muniName": "東松山市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "112143": {
    "muniName": "春日部市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R6"
    ],
    "hasProjects": false
  },
  "112151": {
    "muniName": "狭山市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "112178": {
    "muniName": "鴻巣市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "112194": {
    "muniName": "上尾市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112216": {
    "muniName": "草加市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "112224": {
    "muniName": "越谷市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "112232": {
    "muniName": "蕨市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112241": {
    "muniName": "戸田市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "112259": {
    "muniName": "入間市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "112275": {
    "muniName": "朝霞市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "112283": {
    "muniName": "志木市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112291": {
    "muniName": "和光市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112305": {
    "muniName": "新座市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R2",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "112313": {
    "muniName": "桶川市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112321": {
    "muniName": "久喜市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "112330": {
    "muniName": "北本市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R2"
    ],
    "hasProjects": false
  },
  "112348": {
    "muniName": "八潮市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112356": {
    "muniName": "富士見市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112372": {
    "muniName": "三郷市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "112381": {
    "muniName": "蓮田市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112399": {
    "muniName": "坂戸市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112411": {
    "muniName": "鶴ケ島市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "112437": {
    "muniName": "吉川市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "112453": {
    "muniName": "ふじみ野市",
    "prefName": "埼玉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "120006": {
    "muniName": "千葉県",
    "prefName": "千葉県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "121002": {
    "muniName": "千葉市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R4"
    ],
    "hasProjects": false
  },
  "122033": {
    "muniName": "市川市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "122041": {
    "muniName": "船橋市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1"
    ],
    "hasProjects": false
  },
  "122068": {
    "muniName": "木更津市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "122076": {
    "muniName": "松戸市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "122084": {
    "muniName": "野田市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "122106": {
    "muniName": "茂原市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122114": {
    "muniName": "成田市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H20"
    ],
    "hasProjects": false
  },
  "122122": {
    "muniName": "佐倉市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H23",
      "H21",
      "H20",
      "H19"
    ],
    "hasProjects": false
  },
  "122131": {
    "muniName": "東金市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122165": {
    "muniName": "習志野市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "122173": {
    "muniName": "柏市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122190": {
    "muniName": "市原市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "122203": {
    "muniName": "流山市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20"
    ],
    "hasProjects": false
  },
  "122211": {
    "muniName": "八千代市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H18"
    ],
    "hasProjects": false
  },
  "122220": {
    "muniName": "我孫子市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "122246": {
    "muniName": "鎌ケ谷市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122254": {
    "muniName": "君津市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122271": {
    "muniName": "浦安市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "122289": {
    "muniName": "四街道市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122297": {
    "muniName": "袖ケ浦市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122301": {
    "muniName": "八街市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122319": {
    "muniName": "印西市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122327": {
    "muniName": "白井市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "122360": {
    "muniName": "香取市",
    "prefName": "千葉県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "130001": {
    "muniName": "東京都",
    "prefName": "東京都",
    "isPref": true,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "131016": {
    "muniName": "千代田区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "131024": {
    "muniName": "中央区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "131032": {
    "muniName": "港区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H28",
      "H27",
      "H26",
      "H25",
      "H23",
      "H22",
      "H21",
      "H20",
      "H19"
    ],
    "hasProjects": true
  },
  "131041": {
    "muniName": "新宿区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20",
      "H19",
      "H18",
      "H17",
      "H16",
      "H15",
      "H14",
      "H13"
    ],
    "hasProjects": true
  },
  "131059": {
    "muniName": "文京区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20",
      "H19",
      "H18",
      "H17",
      "H16"
    ],
    "hasProjects": false
  },
  "131067": {
    "muniName": "台東区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "131075": {
    "muniName": "墨田区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20",
      "H19",
      "H18",
      "H17"
    ],
    "hasProjects": false
  },
  "131083": {
    "muniName": "江東区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "131091": {
    "muniName": "品川区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "131105": {
    "muniName": "目黒区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "131113": {
    "muniName": "大田区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20"
    ],
    "hasProjects": false
  },
  "131121": {
    "muniName": "世田谷区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "131130": {
    "muniName": "渋谷区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "131148": {
    "muniName": "中野区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "131156": {
    "muniName": "杉並区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "131164": {
    "muniName": "豊島区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "131172": {
    "muniName": "北区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H24"
    ],
    "hasProjects": true
  },
  "131181": {
    "muniName": "荒川区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "131199": {
    "muniName": "板橋区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "131202": {
    "muniName": "練馬区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23"
    ],
    "hasProjects": false
  },
  "131211": {
    "muniName": "足立区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "131229": {
    "muniName": "葛飾区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "131237": {
    "muniName": "江戸川区",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "132012": {
    "muniName": "八王子市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132021": {
    "muniName": "立川市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "132039": {
    "muniName": "武蔵野市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "132047": {
    "muniName": "三鷹市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "132055": {
    "muniName": "青梅市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132063": {
    "muniName": "府中市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22"
    ],
    "hasProjects": false
  },
  "132071": {
    "muniName": "昭島市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132080": {
    "muniName": "調布市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "132098": {
    "muniName": "町田市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "132101": {
    "muniName": "小金井市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132110": {
    "muniName": "小平市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R4",
      "R3",
      "R2",
      "R1"
    ],
    "hasProjects": false
  },
  "132128": {
    "muniName": "日野市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21",
      "H20",
      "H19",
      "H18",
      "H17",
      "H16"
    ],
    "hasProjects": false
  },
  "132136": {
    "muniName": "東村山市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "132152": {
    "muniName": "国立市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132187": {
    "muniName": "福生市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132195": {
    "muniName": "狛江市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132209": {
    "muniName": "東大和市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "132217": {
    "muniName": "清瀬市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "132225": {
    "muniName": "東久留米市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "132233": {
    "muniName": "武蔵村山市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132241": {
    "muniName": "多摩市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "132250": {
    "muniName": "稲城市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132284": {
    "muniName": "あきる野市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "132292": {
    "muniName": "西東京市",
    "prefName": "東京都",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "140007": {
    "muniName": "神奈川県",
    "prefName": "神奈川県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "141003": {
    "muniName": "横浜市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": true
  },
  "141305": {
    "muniName": "川崎市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "141500": {
    "muniName": "相模原市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": true
  },
  "142018": {
    "muniName": "横須賀市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "142034": {
    "muniName": "平塚市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "142042": {
    "muniName": "鎌倉市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "142051": {
    "muniName": "藤沢市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "142069": {
    "muniName": "小田原市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "142077": {
    "muniName": "茅ヶ崎市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H24",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "142085": {
    "muniName": "逗子市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "142115": {
    "muniName": "秦野市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "142123": {
    "muniName": "厚木市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "142131": {
    "muniName": "大和市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "142140": {
    "muniName": "伊勢原市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "142158": {
    "muniName": "海老名市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "142166": {
    "muniName": "座間市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "142182": {
    "muniName": "綾瀬市",
    "prefName": "神奈川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R4"
    ],
    "hasProjects": false
  },
  "150002": {
    "muniName": "新潟県",
    "prefName": "新潟県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "151009": {
    "muniName": "新潟市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "152021": {
    "muniName": "長岡市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "152048": {
    "muniName": "三条市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "152056": {
    "muniName": "柏崎市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "152064": {
    "muniName": "新発田市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "152137": {
    "muniName": "燕市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "152226": {
    "muniName": "上越市",
    "prefName": "新潟県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "160008": {
    "muniName": "富山県",
    "prefName": "富山県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "162019": {
    "muniName": "富山市",
    "prefName": "富山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "162027": {
    "muniName": "高岡市",
    "prefName": "富山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "162116": {
    "muniName": "射水市",
    "prefName": "富山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "170003": {
    "muniName": "石川県",
    "prefName": "石川県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "172014": {
    "muniName": "金沢市",
    "prefName": "石川県",
    "isPref": false,
    "fys": [
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "172031": {
    "muniName": "小松市",
    "prefName": "石川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "172065": {
    "muniName": "加賀市",
    "prefName": "石川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "172103": {
    "muniName": "白山市",
    "prefName": "石川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "180009": {
    "muniName": "福井県",
    "prefName": "福井県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "182010": {
    "muniName": "福井市",
    "prefName": "福井県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "182028": {
    "muniName": "敦賀市",
    "prefName": "福井県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "182079": {
    "muniName": "鯖江市",
    "prefName": "福井県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "182095": {
    "muniName": "越前市",
    "prefName": "福井県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "182109": {
    "muniName": "坂井市",
    "prefName": "福井県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "190004": {
    "muniName": "山梨県",
    "prefName": "山梨県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": true
  },
  "192023": {
    "muniName": "富士吉田市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": true
  },
  "192040": {
    "muniName": "都留市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "192066": {
    "muniName": "大月市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "192082": {
    "muniName": "南アルプス市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "192091": {
    "muniName": "北杜市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "192112": {
    "muniName": "笛吹市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": true
  },
  "192139": {
    "muniName": "甲州市",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "194301": {
    "muniName": "富士河口湖町",
    "prefName": "山梨県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "200000": {
    "muniName": "長野県",
    "prefName": "長野県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "202011": {
    "muniName": "長野市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "202029": {
    "muniName": "松本市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "202037": {
    "muniName": "上田市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "202053": {
    "muniName": "飯田市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "202096": {
    "muniName": "伊那市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "202151": {
    "muniName": "塩尻市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "202177": {
    "muniName": "佐久市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "202185": {
    "muniName": "千曲市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "202207": {
    "muniName": "安曇野市",
    "prefName": "長野県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "210005": {
    "muniName": "岐阜県",
    "prefName": "岐阜県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "212016": {
    "muniName": "岐阜市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "212024": {
    "muniName": "大垣市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H24",
      "H23"
    ],
    "hasProjects": false
  },
  "212032": {
    "muniName": "高山市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "212041": {
    "muniName": "多治見市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "212067": {
    "muniName": "中津川市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "212091": {
    "muniName": "羽島市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "212130": {
    "muniName": "各務原市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "212148": {
    "muniName": "可児市",
    "prefName": "岐阜県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "220001": {
    "muniName": "静岡県",
    "prefName": "静岡県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "221007": {
    "muniName": "静岡市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "221309": {
    "muniName": "浜松市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": true
  },
  "222038": {
    "muniName": "沼津市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R7"
    ],
    "hasProjects": false
  },
  "222062": {
    "muniName": "三島市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R2"
    ],
    "hasProjects": false
  },
  "222071": {
    "muniName": "富士宮市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "222089": {
    "muniName": "伊東市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "222097": {
    "muniName": "島田市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "222101": {
    "muniName": "富士市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "222119": {
    "muniName": "磐田市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "222127": {
    "muniName": "焼津市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "222135": {
    "muniName": "掛川市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "222143": {
    "muniName": "藤枝市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "H30"
    ],
    "hasProjects": false
  },
  "222151": {
    "muniName": "御殿場市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "222160": {
    "muniName": "袋井市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "222216": {
    "muniName": "湖西市",
    "prefName": "静岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "230006": {
    "muniName": "愛知県",
    "prefName": "愛知県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "231002": {
    "muniName": "名古屋市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232017": {
    "muniName": "豊橋市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R5",
      "R3"
    ],
    "hasProjects": false
  },
  "232025": {
    "muniName": "岡崎市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "232033": {
    "muniName": "一宮市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "232041": {
    "muniName": "瀬戸市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232050": {
    "muniName": "半田市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "232068": {
    "muniName": "春日井市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "232076": {
    "muniName": "豊川市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R7"
    ],
    "hasProjects": true
  },
  "232084": {
    "muniName": "津島市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232092": {
    "muniName": "碧南市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232106": {
    "muniName": "刈谷市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "232114": {
    "muniName": "豊田市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "232122": {
    "muniName": "安城市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "232131": {
    "muniName": "西尾市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "232149": {
    "muniName": "蒲郡市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232157": {
    "muniName": "犬山市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232165": {
    "muniName": "常滑市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "232173": {
    "muniName": "江南市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232190": {
    "muniName": "小牧市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "232203": {
    "muniName": "稲沢市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "232220": {
    "muniName": "東海市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232238": {
    "muniName": "大府市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232246": {
    "muniName": "知多市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232254": {
    "muniName": "知立市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232262": {
    "muniName": "尾張旭市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232297": {
    "muniName": "豊明市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232301": {
    "muniName": "日進市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232327": {
    "muniName": "愛西市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232335": {
    "muniName": "清須市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "232343": {
    "muniName": "北名古屋市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232360": {
    "muniName": "みよし市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232378": {
    "muniName": "あま市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "232386": {
    "muniName": "長久手市",
    "prefName": "愛知県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "240001": {
    "muniName": "三重県",
    "prefName": "三重県",
    "isPref": true,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "242012": {
    "muniName": "津市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "242021": {
    "muniName": "四日市市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "242039": {
    "muniName": "伊勢市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "242047": {
    "muniName": "松阪市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H30",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "242055": {
    "muniName": "桑名市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "242071": {
    "muniName": "鈴鹿市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "242080": {
    "muniName": "名張市",
    "prefName": "三重県",
    "isPref": false,
    "fys": [
      "R8",
      "R2"
    ],
    "hasProjects": false
  },
  "250007": {
    "muniName": "滋賀県",
    "prefName": "滋賀県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "252018": {
    "muniName": "大津市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "252026": {
    "muniName": "彦根市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "252034": {
    "muniName": "長浜市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "252042": {
    "muniName": "近江八幡市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "252069": {
    "muniName": "草津市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H25"
    ],
    "hasProjects": false
  },
  "252077": {
    "muniName": "守山市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "252085": {
    "muniName": "栗東市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "252093": {
    "muniName": "甲賀市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "252131": {
    "muniName": "東近江市",
    "prefName": "滋賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "260002": {
    "muniName": "京都府",
    "prefName": "京都府",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "261009": {
    "muniName": "京都市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "262013": {
    "muniName": "福知山市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "262021": {
    "muniName": "舞鶴市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "262064": {
    "muniName": "亀岡市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "262072": {
    "muniName": "城陽市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "262099": {
    "muniName": "長岡京市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "262111": {
    "muniName": "京田辺市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "262145": {
    "muniName": "木津川市",
    "prefName": "京都府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "270008": {
    "muniName": "大阪府",
    "prefName": "大阪府",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "271004": {
    "muniName": "大阪市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "271403": {
    "muniName": "堺市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272027": {
    "muniName": "岸和田市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R2",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26"
    ],
    "hasProjects": false
  },
  "272035": {
    "muniName": "豊中市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R1",
      "H30"
    ],
    "hasProjects": false
  },
  "272043": {
    "muniName": "池田市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272051": {
    "muniName": "吹田市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "272060": {
    "muniName": "泉大津市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272078": {
    "muniName": "高槻市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "272086": {
    "muniName": "貝塚市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272094": {
    "muniName": "守口市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "272108": {
    "muniName": "枚方市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5"
    ],
    "hasProjects": false
  },
  "272124": {
    "muniName": "八尾市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "272132": {
    "muniName": "泉佐野市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272141": {
    "muniName": "富田林市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272167": {
    "muniName": "河内長野市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272175": {
    "muniName": "松原市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "272183": {
    "muniName": "大東市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "272191": {
    "muniName": "和泉市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": true
  },
  "272205": {
    "muniName": "箕面市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "272213": {
    "muniName": "柏原市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272221": {
    "muniName": "羽曳野市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272230": {
    "muniName": "門真市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272248": {
    "muniName": "摂津市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272264": {
    "muniName": "藤井寺市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272272": {
    "muniName": "東大阪市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "272281": {
    "muniName": "泉南市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "272302": {
    "muniName": "交野市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "272311": {
    "muniName": "大阪狭山市",
    "prefName": "大阪府",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "281000": {
    "muniName": "神戸市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "282014": {
    "muniName": "姫路市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "282022": {
    "muniName": "尼崎市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "282031": {
    "muniName": "明石市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282049": {
    "muniName": "西宮市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "282065": {
    "muniName": "芦屋市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R2"
    ],
    "hasProjects": false
  },
  "282073": {
    "muniName": "伊丹市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "282090": {
    "muniName": "豊岡市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282103": {
    "muniName": "加古川市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282146": {
    "muniName": "宝塚市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "H25",
      "H24",
      "H23",
      "H22",
      "H19",
      "H18",
      "H17"
    ],
    "hasProjects": false
  },
  "282154": {
    "muniName": "三木市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282162": {
    "muniName": "高砂市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282171": {
    "muniName": "川西市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "282197": {
    "muniName": "三田市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282235": {
    "muniName": "丹波市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "282294": {
    "muniName": "たつの市",
    "prefName": "兵庫県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "290009": {
    "muniName": "奈良県",
    "prefName": "奈良県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "292010": {
    "muniName": "奈良市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "292028": {
    "muniName": "大和高田市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "292036": {
    "muniName": "大和郡山市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R8",
      "R4"
    ],
    "hasProjects": false
  },
  "292044": {
    "muniName": "天理市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "292052": {
    "muniName": "橿原市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "292095": {
    "muniName": "生駒市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "292109": {
    "muniName": "香芝市",
    "prefName": "奈良県",
    "isPref": false,
    "fys": [
      "R6",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "300004": {
    "muniName": "和歌山県",
    "prefName": "和歌山県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "302015": {
    "muniName": "和歌山市",
    "prefName": "和歌山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "302031": {
    "muniName": "橋本市",
    "prefName": "和歌山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "302082": {
    "muniName": "紀の川市",
    "prefName": "和歌山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "310000": {
    "muniName": "鳥取県",
    "prefName": "鳥取県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "312029": {
    "muniName": "米子市",
    "prefName": "鳥取県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22"
    ],
    "hasProjects": false
  },
  "320005": {
    "muniName": "島根県",
    "prefName": "島根県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "322016": {
    "muniName": "松江市",
    "prefName": "島根県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "322032": {
    "muniName": "出雲市",
    "prefName": "島根県",
    "isPref": false,
    "fys": [
      "R8",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H24",
      "H23",
      "H18"
    ],
    "hasProjects": false
  },
  "330001": {
    "muniName": "岡山県",
    "prefName": "岡山県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "331007": {
    "muniName": "岡山市",
    "prefName": "岡山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "332020": {
    "muniName": "倉敷市",
    "prefName": "岡山県",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "332038": {
    "muniName": "津山市",
    "prefName": "岡山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "332089": {
    "muniName": "総社市",
    "prefName": "岡山県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "340006": {
    "muniName": "広島県",
    "prefName": "広島県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "341002": {
    "muniName": "広島市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "342025": {
    "muniName": "呉市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "342041": {
    "muniName": "三原市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "342050": {
    "muniName": "尾道市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "342076": {
    "muniName": "福山市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30"
    ],
    "hasProjects": false
  },
  "342122": {
    "muniName": "東広島市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "342131": {
    "muniName": "廿日市市",
    "prefName": "広島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "350001": {
    "muniName": "山口県",
    "prefName": "山口県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "352012": {
    "muniName": "下関市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "352021": {
    "muniName": "宇部市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "352039": {
    "muniName": "山口市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R7"
    ],
    "hasProjects": true
  },
  "352063": {
    "muniName": "防府市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "352071": {
    "muniName": "下松市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "352080": {
    "muniName": "岩国市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "352152": {
    "muniName": "周南市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "352161": {
    "muniName": "山陽小野田市",
    "prefName": "山口県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "360007": {
    "muniName": "徳島県",
    "prefName": "徳島県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "362018": {
    "muniName": "徳島市",
    "prefName": "徳島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "362042": {
    "muniName": "阿南市",
    "prefName": "徳島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6"
    ],
    "hasProjects": false
  },
  "370002": {
    "muniName": "香川県",
    "prefName": "香川県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "372013": {
    "muniName": "高松市",
    "prefName": "香川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H21"
    ],
    "hasProjects": false
  },
  "372021": {
    "muniName": "丸亀市",
    "prefName": "香川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "372056": {
    "muniName": "観音寺市",
    "prefName": "香川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "372081": {
    "muniName": "三豊市",
    "prefName": "香川県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "380008": {
    "muniName": "愛媛県",
    "prefName": "愛媛県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "382019": {
    "muniName": "松山市",
    "prefName": "愛媛県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "382027": {
    "muniName": "今治市",
    "prefName": "愛媛県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "382035": {
    "muniName": "宇和島市",
    "prefName": "愛媛県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "382060": {
    "muniName": "西条市",
    "prefName": "愛媛県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "382132": {
    "muniName": "四国中央市",
    "prefName": "愛媛県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "390003": {
    "muniName": "高知県",
    "prefName": "高知県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "392014": {
    "muniName": "高知市",
    "prefName": "高知県",
    "isPref": false,
    "fys": [
      "R8",
      "R5",
      "R4",
      "R3",
      "H30"
    ],
    "hasProjects": false
  },
  "400009": {
    "muniName": "福岡県",
    "prefName": "福岡県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "401005": {
    "muniName": "北九州市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": true
  },
  "401307": {
    "muniName": "福岡市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402028": {
    "muniName": "大牟田市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402036": {
    "muniName": "久留米市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "402052": {
    "muniName": "飯塚市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402079": {
    "muniName": "柳川市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "402109": {
    "muniName": "八女市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402133": {
    "muniName": "行橋市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402168": {
    "muniName": "小郡市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402176": {
    "muniName": "筑紫野市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "402184": {
    "muniName": "春日市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "402206": {
    "muniName": "宗像市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402214": {
    "muniName": "太宰府市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402231": {
    "muniName": "古賀市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402249": {
    "muniName": "福津市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "402303": {
    "muniName": "糸島市",
    "prefName": "福岡県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "410004": {
    "muniName": "佐賀県",
    "prefName": "佐賀県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "412015": {
    "muniName": "佐賀市",
    "prefName": "佐賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R5"
    ],
    "hasProjects": false
  },
  "412023": {
    "muniName": "唐津市",
    "prefName": "佐賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "412031": {
    "muniName": "鳥栖市",
    "prefName": "佐賀県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "420000": {
    "muniName": "長崎県",
    "prefName": "長崎県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "422011": {
    "muniName": "長崎市",
    "prefName": "長崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R2",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "422029": {
    "muniName": "佐世保市",
    "prefName": "長崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "H25",
      "H23",
      "H21",
      "H20",
      "H19"
    ],
    "hasProjects": false
  },
  "422045": {
    "muniName": "諫早市",
    "prefName": "長崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "422053": {
    "muniName": "大村市",
    "prefName": "長崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "430005": {
    "muniName": "熊本県",
    "prefName": "熊本県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "431001": {
    "muniName": "熊本市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "432024": {
    "muniName": "八代市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "432067": {
    "muniName": "玉名市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "432130": {
    "muniName": "宇城市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "432156": {
    "muniName": "天草市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "432164": {
    "muniName": "合志市",
    "prefName": "熊本県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "440001": {
    "muniName": "大分県",
    "prefName": "大分県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "442011": {
    "muniName": "大分市",
    "prefName": "大分県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "442020": {
    "muniName": "別府市",
    "prefName": "大分県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "442038": {
    "muniName": "中津市",
    "prefName": "大分県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "442046": {
    "muniName": "日田市",
    "prefName": "大分県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "442054": {
    "muniName": "佐伯市",
    "prefName": "大分県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "450006": {
    "muniName": "宮崎県",
    "prefName": "宮崎県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "452017": {
    "muniName": "宮崎市",
    "prefName": "宮崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "452025": {
    "muniName": "都城市",
    "prefName": "宮崎県",
    "isPref": false,
    "fys": [
      "R6",
      "R4",
      "R3",
      "H30",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "452033": {
    "muniName": "延岡市",
    "prefName": "宮崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "452068": {
    "muniName": "日向市",
    "prefName": "宮崎県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "460001": {
    "muniName": "鹿児島県",
    "prefName": "鹿児島県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "462012": {
    "muniName": "鹿児島市",
    "prefName": "鹿児島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "462039": {
    "muniName": "鹿屋市",
    "prefName": "鹿児島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "462152": {
    "muniName": "薩摩川内市",
    "prefName": "鹿児島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "462187": {
    "muniName": "霧島市",
    "prefName": "鹿児島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "H31"
    ],
    "hasProjects": false
  },
  "462250": {
    "muniName": "姶良市",
    "prefName": "鹿児島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "472018": {
    "muniName": "那覇市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "472051": {
    "muniName": "宜野湾市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "472085": {
    "muniName": "浦添市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "472093": {
    "muniName": "名護市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "472107": {
    "muniName": "糸満市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "472115": {
    "muniName": "沖縄市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "472123": {
    "muniName": "豊見城市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "472131": {
    "muniName": "うるま市",
    "prefName": "沖縄県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3"
    ],
    "hasProjects": false
  },
  "011002": {
    "muniName": "札幌市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "041009": {
    "muniName": "仙台市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "010006": {
    "muniName": "北海道",
    "prefName": "北海道",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "040002": {
    "muniName": "宮城県",
    "prefName": "宮城県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "080004": {
    "muniName": "茨城県",
    "prefName": "茨城県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "090000": {
    "muniName": "栃木県",
    "prefName": "栃木県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "070009": {
    "muniName": "福島県",
    "prefName": "福島県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "020001": {
    "muniName": "青森県",
    "prefName": "青森県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "030007": {
    "muniName": "岩手県",
    "prefName": "岩手県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "050008": {
    "muniName": "秋田県",
    "prefName": "秋田県",
    "isPref": true,
    "fys": [
      "R8"
    ],
    "hasProjects": false
  },
  "092011": {
    "muniName": "宇都宮市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "012041": {
    "muniName": "旭川市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "072036": {
    "muniName": "郡山市",
    "prefName": "福島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "072044": {
    "muniName": "いわき市",
    "prefName": "福島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24",
      "H23",
      "H22",
      "H20"
    ],
    "hasProjects": false
  },
  "032018": {
    "muniName": "盛岡市",
    "prefName": "岩手県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "052019": {
    "muniName": "秋田市",
    "prefName": "秋田県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "082015": {
    "muniName": "水戸市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "H30"
    ],
    "hasProjects": false
  },
  "072010": {
    "muniName": "福島市",
    "prefName": "福島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28"
    ],
    "hasProjects": false
  },
  "022012": {
    "muniName": "青森市",
    "prefName": "青森県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "082201": {
    "muniName": "つくば市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "062014": {
    "muniName": "山形市",
    "prefName": "山形県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "022039": {
    "muniName": "八戸市",
    "prefName": "青森県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "012131": {
    "muniName": "苫小牧市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H26",
      "H25"
    ],
    "hasProjects": false
  },
  "092088": {
    "muniName": "小山市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "082023": {
    "muniName": "日立市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "022021": {
    "muniName": "弘前市",
    "prefName": "青森県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "012076": {
    "muniName": "帯広市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "082210": {
    "muniName": "ひたちなか市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012068": {
    "muniName": "釧路市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "092037": {
    "muniName": "栃木市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30"
    ],
    "hasProjects": false
  },
  "082031": {
    "muniName": "土浦市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27"
    ],
    "hasProjects": false
  },
  "092029": {
    "muniName": "足利市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "R1",
      "H30",
      "H29"
    ],
    "hasProjects": false
  },
  "082040": {
    "muniName": "古河市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "042021": {
    "muniName": "石巻市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31",
      "H30",
      "H29",
      "H28",
      "H27",
      "H26",
      "H25",
      "H24"
    ],
    "hasProjects": false
  },
  "042153": {
    "muniName": "大崎市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "012173": {
    "muniName": "江別市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "062031": {
    "muniName": "鶴岡市",
    "prefName": "山形県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "092134": {
    "muniName": "那須塩原市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2",
      "H31"
    ],
    "hasProjects": false
  },
  "092045": {
    "muniName": "佐野市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "072028": {
    "muniName": "会津若松市",
    "prefName": "福島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012084": {
    "muniName": "北見市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "032158": {
    "muniName": "奥州市",
    "prefName": "岩手県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082171": {
    "muniName": "取手市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "032093": {
    "muniName": "一関市",
    "prefName": "岩手県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012033": {
    "muniName": "小樽市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082279": {
    "muniName": "筑西市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "062049": {
    "muniName": "酒田市",
    "prefName": "山形県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "082325": {
    "muniName": "神栖市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "092053": {
    "muniName": "鹿沼市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "062103": {
    "muniName": "天童市",
    "prefName": "山形県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5"
    ],
    "hasProjects": false
  },
  "092169": {
    "muniName": "下野市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082112": {
    "muniName": "常総市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R2"
    ],
    "hasProjects": false
  },
  "042137": {
    "muniName": "栗原市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "082228": {
    "muniName": "鹿嶋市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "052043": {
    "muniName": "大館市",
    "prefName": "秋田県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "092100": {
    "muniName": "大田原市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "072079": {
    "muniName": "須賀川市",
    "prefName": "福島県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "032051": {
    "muniName": "花巻市",
    "prefName": "岩手県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "012246": {
    "muniName": "千歳市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "042072": {
    "muniName": "名取市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4"
    ],
    "hasProjects": false
  },
  "082082": {
    "muniName": "龍ケ崎市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "012050": {
    "muniName": "室蘭市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R7",
      "R6",
      "R5",
      "R3"
    ],
    "hasProjects": false
  },
  "062022": {
    "muniName": "米沢市",
    "prefName": "山形県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "042129": {
    "muniName": "登米市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082244": {
    "muniName": "守谷市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012319": {
    "muniName": "恵庭市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "052108": {
    "muniName": "由利本荘市",
    "prefName": "秋田県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082058": {
    "muniName": "石岡市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3"
    ],
    "hasProjects": false
  },
  "032069": {
    "muniName": "北上市",
    "prefName": "岩手県",
    "isPref": false,
    "fys": [
      "R8",
      "R7"
    ],
    "hasProjects": false
  },
  "052035": {
    "muniName": "横手市",
    "prefName": "秋田県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "092061": {
    "muniName": "日光市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "082198": {
    "muniName": "牛久市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R2"
    ],
    "hasProjects": false
  },
  "082163": {
    "muniName": "笠間市",
    "prefName": "茨城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "092096": {
    "muniName": "真岡市",
    "prefName": "栃木県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012106": {
    "muniName": "岩見沢市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "052124": {
    "muniName": "大仙市",
    "prefName": "秋田県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "042099": {
    "muniName": "多賀城市",
    "prefName": "宮城県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "022063": {
    "muniName": "十和田市",
    "prefName": "青森県",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012351": {
    "muniName": "石狩市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  },
  "012343": {
    "muniName": "北広島市",
    "prefName": "北海道",
    "isPref": false,
    "fys": [
      "R8",
      "R7",
      "R6",
      "R5",
      "R4",
      "R3",
      "R2"
    ],
    "hasProjects": false
  }
};

/** budget 階層（予算ベースの款別ダッシュボードを持つ）自治体の団体コード */
export const BUDGET_MUNIS: string[] = ["100005","102016","102024","102032","102041","102059","102075","102091","110001","111007","112011","112020","112038","112062","112071","112089","112097","112101","112119","112127","112143","112151","112178","112194","112216","112224","112232","112241","112259","112275","112283","112291","112305","112313","112321","112330","112348","112356","112372","112381","112399","112411","112437","112453","120006","121002","122033","122041","122068","122076","122084","122106","122114","122122","122131","122165","122173","122190","122203","122211","122220","122246","122254","122271","122289","122297","122301","122319","122327","122360","130001","131016","131024","131032","131041","131059","131067","131075","131083","131091","131105","131113","131121","131130","131148","131156","131164","131172","131181","131199","131202","131211","131229","131237","132012","132021","132039","132047","132055","132063","132071","132080","132098","132101","132110","132128","132136","132152","132187","132195","132209","132217","132225","132233","132241","132250","132284","132292","140007","141003","141305","141500","142018","142034","142042","142051","142069","142077","142085","142115","142123","142131","142140","142158","142166","142182","150002","151009","152021","152048","152056","152064","152137","152226","160008","162019","162027","162116","170003","172014","172031","172065","172103","180009","182010","182028","182079","182095","182109","190004","192023","192040","192066","192082","192091","192112","192139","194301","200000","202011","202029","202037","202053","202096","202151","202177","202185","202207","210005","212016","212024","212032","212041","212067","212091","212130","212148","220001","221007","221309","222038","222062","222071","222089","222097","222101","222119","222127","222135","222143","222151","222160","222216","230006","231002","232017","232025","232033","232041","232050","232068","232076","232084","232092","232106","232114","232122","232131","232149","232157","232165","232173","232190","232203","232220","232238","232246","232254","232262","232297","232301","232327","232335","232343","232360","232378","232386","240001","242012","242021","242039","242047","242055","242071","242080","250007","252018","252026","252034","252042","252069","252077","252085","252093","252131","260002","261009","262013","262021","262064","262072","262099","262111","262145","270008","271004","271403","272027","272035","272043","272051","272060","272078","272086","272094","272108","272124","272132","272141","272167","272175","272183","272191","272205","272213","272221","272230","272248","272264","272272","272281","272302","272311","281000","282014","282022","282031","282049","282065","282073","282090","282103","282146","282154","282162","282171","282197","282235","282294","290009","292010","292028","292036","292044","292052","292095","292109","300004","302015","302031","302082","310000","312029","320005","322016","322032","330001","331007","332020","332038","332089","340006","341002","342025","342041","342050","342076","342122","342131","350001","352012","352021","352039","352063","352071","352080","352152","352161","360007","362018","362042","370002","372013","372021","372056","372081","380008","382019","382027","382035","382060","382132","390003","392014","400009","401005","401307","402028","402036","402052","402079","402109","402133","402168","402176","402184","402206","402214","402231","402249","402303","410004","412015","412023","412031","420000","422011","422029","422045","422053","430005","431001","432024","432067","432130","432156","432164","440001","442011","442020","442038","442046","442054","450006","452017","452025","452033","452068","460001","462012","462039","462152","462187","462250","472018","472051","472085","472093","472107","472115","472123","472131","011002","041009","010006","040002","080004","090000","070009","020001","030007","050008","092011","012041","072036","072044","032018","052019","082015","072010","022012","082201","062014","022039","012131","092088","082023","022021","012076","082210","012068","092037","082031","092029","082040","042021","042153","012173","062031","092134","092045","072028","012084","032158","082171","032093","012033","082279","062049","082325","092053","062103","092169","082112","042137","082228","052043","092100","072079","032051","012246","042072","082082","012050","062022","042129","082244","012319","052108","082058","032069","052035","092061","082198","082163","092096","012106","052124","042099","022063","012351","012343"];

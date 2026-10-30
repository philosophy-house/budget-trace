// 議会の構成（予算議決時）— 名簿から書き写した会派・議員を、原典の本文と突き合わせるパーサ。
//
// 甲府（`kofu-gikai`）は名簿が `<h2>会派名（N名）</h2>`＋表の HTML なので機械的に数えられるが、
// 他の議会は名簿が PDF・議会だより（縦組み）・会派欄つきの議員一覧…と様式が割れており、
// 1議会ごとにパーサを書くと割に合わない（2026-10-01 に山梨県内9団体を偵察して確認。docs §6-2）。
//
// そこで **会派と所属議員の氏名を registry（parserOptions）に書き写し**、パーサが原典と突き合わせる:
//   ① **各議員がその会派の範囲に載っていること**（会派名から次の会派名までの区間、または registry に
//      書いた会派の枠の座標を pdftotext で切り出した範囲）。枠のときは**他の会派の議員が枠に居ないこと**も見る。
//      ⚠ 「名簿のどこかにある」だけだと、正しい氏名を誤った会派に書いても通る（レビューで実測・2026-10-01）
//   ② **名簿が印字している人数**（`declared`）が書き写した人数と一致すること。印字が無い名簿は
//      `noDeclaredCount` を明示し、代わりに定数（`teisu`）との一致で1人の書き落としを捕まえる
//   ③ 基準日の表記が名簿に出ること・基準日 ≤ 議決日・（任意）議決当日の資料に全議員の氏名が出ること
//   ④ 議案番号が件名の**直前**に、結果と議決月日が件名の**直後**に出ること
// **議席数は書き写した氏名の人数**。1つでも合わなければ throw する＝書き写しの誤りは静かに通らない。
//
// ⚠ 議決時点の名簿であることは基準日 ≤ 議決日 と ③の任意の確認でしか見られない。名簿が議決後に
//   更新されていたら Wayback の議決前のスナップショットを原典にする（甲府と同じ）。議決時点の構成が
//   確定できない議会は**収録しない**（推測で埋めない）。
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { z } from "zod";
import { readRawMeta } from "../lib/store";
import type { CouncilCompositionDoc, CouncilFactionFact, SourceEntry } from "../types";

export const PARSER_VERSION = "0.8.15";

/** 名前の字が原典に無くても書ける、会派に属さない議員の呼び名（`nameAbsentReason`） */
const INDEPENDENT_NAMES = ["無所属", "無所属議員", "無会派", "会派に属さない議員", "会派に所属しない議員", "会派に所属していない議員", "会派を構成しない議員"];
/** 2人以上の independent の会派に理由なしで書ける呼び名（INDEPENDENT_NAMES と、原典の語の「諸派」など。「無会派（輝き）」のような括弧書きも） */
const INDEPENDENT_GROUP_NAMES = [...INDEPENDENT_NAMES, "諸派", "会派所属無し", "会派に属しない議員", "会派に属さない", "会派に所属しない"];
const isIndependentGroupName = (name: string) => INDEPENDENT_GROUP_NAMES.some((n) => name === n || name.startsWith(`${n}（`) || name.startsWith(`${n}(`));

const factionSchema = z
  .object({
    name: z.string().min(1),
    members: z.array(z.string().min(1)).min(1),
    independent: z.boolean().optional(),
    /** 会派名が原典で行をまたいで割れているとき、突き合わせに使う断片（例: 「煌・フォーラ」「ム21」） */
    nameParts: z.array(z.string().min(1)).optional(),
    /**
     * 会派の枠（PDF の座標 pt・`pdftotext -x -y -W -H` に渡す）。段組み・表の名簿は「次の会派名まで」の
     * 区間が組版で崩れるので、枠で切る。座標は `pdftotext -bbox` で会派名・氏名の位置を見て決める
     */
    box: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
    page: z.number().int().positive().optional(),
    /** 名簿が印字している人数の原文（例: 「（15）」「４人」）。数字を取り出して人数と照合する */
    declared: z.string().optional(),
    /** 名簿に人数の印字が無い（`declared` を書けない）ことの明示 */
    noDeclaredCount: z.literal(true).optional(),
    /**
     * 会派ごとに名簿のページが分かれている議会（京都）。この会派はこの URL の本文全体を範囲にする。
     * URL は registry の urls に並べること。`asOfText` はそのページの基準日の原文
     */
    url: z.string().url().optional(),
    asOfText: z.string().optional(),
    /**
     * 議員ごとに会派の略称が付く名簿（熊本「大石 浩文（議長） 自民党 期数：…」）。各議員の氏名の直後
     * `labelWindow` 字で**最初に出る会派の略称**がこの会派の `label` であることを見る（区間・枠の代わり）
     */
    label: z.string().optional(),
    /** `declared` を名簿ではなく別の原典（議決当日の会派別賛否の「（14）」など）で照合する。その URL */
    declaredIn: z.string().url().optional(),
    /** declaredIn の原典での会派の略称（広島「自民党・市民クラブ」）。declared はこの略称か会派名を含むこと */
    abbr: z.string().optional(),
    /**
     * 人数の網（declared・teisu・labelSuffix）がどれも掛けられない会派で、それでも収録する理由（原典の事情）。
     * 書けば通るが、**1人の書き落としは捕まらない**ことを registry で明示するためのもの
     */
    noCountReason: z.string().min(10).optional(),
    /**
     * 印字された人数に含まれない所属議員（新潟「翔政会 20 人（翔政会の人数は議長を除いた人数です）」の議長）。
     * members の部分集合で、`declared` の数 = members − これ を要求する
     */
    declaredExcludes: z.array(z.string().min(1)).optional(),
    /**
     * 無所属の枠に名前の字が入らないときの理由（日進: 表決態度一覧の岩渕議員の列の上の会派欄が空／草加・足立: 表頭の「無所属」が
     * 複数の列にまたがる結合セルで、1人ずつの枠には字の一部しか入らない）。
     * 書けるのは independent で、名前が `INDEPENDENT_NAMES` の語のときだけ（実在の会派名を照合なしで書かせない）
     */
    nameAbsentReason: z.string().min(20).optional(),
    /**
     * nameAbsentReason の枠と同じファイルに、名前を照合している枠が無いときの理由（印西: 無所属の枠だけが別の原典の注記の行）。
     * 兄弟の枠が無いと、枠の端をずらしたかどうかを位置で確かめられない
     */
    noSiblingReason: z.string().min(20).optional(),
    /**
     * 無所属の呼び名でない名前の会派を、2人以上で independent にする理由（成田: 名簿が「会派」と「会派外」に分かれ、
     * 日本共産党の2人は「会派外」）。1人の会派（一人会派・川越の日本維新の会など）は要らない（0.8.13）
     */
    independentReason: z.string().min(20).optional(),
  })
  // 実在の会派に independent を付けると、同じ名前の会派を2つ書く網（0.8.13）を抜けて、無会派の議員を
  // その会派名で出せた（藤枝の公明党・2人＝静岡・茨城の巡のレビューで実測）。呼び名でない2人以上の会派には理由を求める
  .refine((f) => !f.independent || f.members.length < 2 || isIndependentGroupName(f.name) || f.independentReason != null, {
    message: `2人以上の会派を independent にできるのは、名前が無所属の呼び名（${INDEPENDENT_GROUP_NAMES.join("・")}）のときか independentReason を書いたときだけです`,
  })
  .refine((f) => (f.declared != null) !== (f.noDeclaredCount === true), {
    message: "declared（印字された人数）か noDeclaredCount: true のどちらか一方が要ります",
  })
  .refine((f) => f.noSiblingReason == null || f.nameAbsentReason != null, { message: "noSiblingReason は nameAbsentReason の枠にだけ書けます" })
  .refine((f) => f.nameAbsentReason == null || (f.independent === true && INDEPENDENT_NAMES.includes(f.name)), {
    message: `nameAbsentReason は independent で、名前が ${INDEPENDENT_NAMES.join("・")} のどれかのときだけ書けます`,
  });

const votesSchema = z.object({
    url: z.string().url(),
    title: z.string().min(1),
    basis: z.enum(["member", "faction"]),
    legend: z.record(z.string().min(1), z.enum(["賛成", "反対", "賛成でない", "欠席", "退席", "棄権", "除斥", "議長", "不参加"])),
    /** 凡例の原文。凡例が2か所に分かれる原典（前橋「（○賛成、●反対）」と「議長は…「／」で表示」）は配列で */
    legendText: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    /** 記号が予算の行の頭（anchor）の**前**に来る原典（北杜の縦組み: -raw で「記号の並び＋可決＋件名」）は "before" */
    anchorSide: z.enum(["after", "before"]).optional(),
    /**
     * 予算の行の記号の並びの途中に割り込む、凡例に無い字（吹田: 縦書きの注記「議長につき、採決には加わっていません。」の
     * 1字「決」が記号の間に入る）。ここに書いた字だけを読み飛ばす。理由を registry のコメントに書く
     */
    ignoreChars: z.string().optional(),
    anchor: z.string().min(1),
    /**
     * anchor が件名（resolution.billName）を名指さないとき（「採決」「可決」の行の頭・表の列見出し・行番号）に、anchor の行が
     * 当初の一般会計予算の行であることを示す原文（0.8.8）。賛否表の本文に続けて出て、件名（または議案番号・「令和N年度…一般会計予算」）を含むこと。
     * - key なし: text は anchor をちょうど1回含み、記号はその anchor の出現（text の中のもの）から読む（八王子「可決以下の46議案について…第5号議案令和8年度八王子市一般会計予算」）
     * - key あり: key は anchor の中の行番号・列番号（名古屋「(2)」・板橋「1」）。text は key で始まり、key の直後から件名までの間に
     *   key と同じ形（数字を入れ替えた語）が無いこと（名古屋「(2)は、次の1件です。【3月19日議決】令和8年度一般会計予算」）
     */
    anchorEvidence: z
      .object({
        text: z.string().min(1),
        key: z.string().min(1).optional(),
        /** 本文の key で、anchor の key の外に入る列見出し・委員会名（板橋「付託委員会」「予算審査特別委員会」）。ここに書いた語と団体の字だけを許す */
        headings: z.array(z.string().min(1)).optional(),
      })
      .optional(),
    /**
     * 件名も議案番号も賛否表の行に無く、行の見出しが会計の名前だけの原典（東村山: 縦書きの「令和8年度予算」の枠の中の行「一般会計」）の理由。
     * anchor は「一般会計」そのもの（補正・特別会計・号数を含まない）で、記号は anchor の**直後から**始まり、そう読める出現が各抽出で1つだけであること
     * （補正の行「一般会計（第６号）」は号数を挟むので読まない）。⚠ 年度は件名と結び付かない（同じ表に別年度の「一般会計」の行が無いことを目視する）
     */
    anchorWeakReason: z.string().min(20).optional(),
    maxGap: z.number().int().nonnegative().max(80).optional(),
    /**
     * HTML の表: "row"/"column" ＝ anchor のセルと同じ行／列の、凡例の字（語）だけのセルの並び。
     * "memberRows" ＝ 議員が1行ずつの表（岡山・熊本）。anchor は予算の**列の見出し**のセル、columns の氏名の行の
     * その列のセルを columns の順に並べたものが symbols。凡例の語は「賛成」「反対」のような語でもよい
     */
    table: z.enum(["row", "column", "memberRows"]).optional(),
    /** symbols を語の並びで書くとき（「賛成,反対,…」）の区切り。無ければ1字ずつ */
    symbolSep: z.string().optional(),
    symbols: z.string().min(1).optional(),
    /**
     * 予算の行が記号でなく「全会一致」の文字だけの原典（奈良の「修正部分を除く原案」）。この原文が anchor の直後 maxGap 字
     * 以内にあることを確かめ、全会派を賛成として数える（議長は blank で外す）。symbols・columns・legend は使わない
     */
    unanimousText: z.string().min(1).optional(),
    /** 列見出しが1字（縦組みで姓の頭の字しか取れない＝倉敷）のときの理由。書かないと1字の見出しは throw（順の照合が弱いため） */
    headerWeakReason: z.string().min(10).optional(),
    /**
     * 列見出しを**座標で**照合する（PDF のみ・0.8.0）。各列の記号の真上（同じ x）にある語を上から順につないだ本文に、
     * その列の見出しが含まれることを求める。会派の列は結合セル（会派名の見出しの下に記号1つ）、議長・無所属は氏名の縦書き、
     * のように見出しの行が列ごとに違う表（甲府）は、本文の並びでは照合できないため
     */
    headerBbox: z.literal(true).optional(),
    /** 列見出し。member: label＝議員名（名簿の表記）。faction: label＝原典の会派の表記、faction＝registry の会派名 */
    /**
     * 見出しが会派名・氏名と一致しない（含まれない）列（「無所属２」「共産」以外の略称など）は、対応を示す原文 evidence が要る
     * （京都「無所属２ ＝井﨑敦子議員」）。evidence は賛否表か名簿に出て、見出しと氏名（会派名）を両方含むこと
     */
    columns: z
      .array(z.object({ label: z.string().min(1), faction: z.string().optional(), member: z.string().optional(), evidence: z.string().optional() }))
      .default([]),
    /**
     * 記号の字が無い列（議長の欄が空欄・斜線＝草加・長崎・大分）。symbols・columns には入れず、ここに議員名と賛否を書く。
     * evidence（氏名を含む、議長であること等の原文。例「議長 鈴木由和」）が賛否表か名簿に出ることを確かめ、名簿の全員との照合ではこの議員も数える
     */
    blank: z
      .array(
        z.object({
          label: z.string().min(1),
          stance: z.enum(["議長", "欠席", "退席", "除斥", "不参加"]),
          evidence: z.string().min(1),
          /** evidence を探す原典（urls の中）。無ければ賛否表と名簿 */
          evidenceUrl: z.string().url().optional(),
          /**
           * stance「議長」で evidence に「議長」の語が無いとき（歴代議長の一覧の行「第85代 髙林修 令和7年5月～」）、
           * その原典の見出しの原文（「歴代議長」等・「議長」を含むこと）。同じ原典にあることを確かめる
           */
          evidenceHeading: z.string().optional(),
        }),
      )
      .optional(),
    /** 列見出しが賛否表と別の原典にあるとき（無ければ url） */
    headerUrl: z.string().url().optional(),
    tally: z
      .object({ text: z.string().min(1), counts: z.record(z.string(), z.number().int().nonnegative()) })
      .optional(),
    /**
     * 会派単位の表で議長を特定できない理由。会派単位の表は会派の議席で数えるので、議長（採決に加わらない）を
     * blank か議長の列で外さないと、議長が会派の賛否に数えられる（京都で実測）。外せないときだけ理由を書く
     */
    noChairReason: z.string().min(10).optional(),
  });

const optionsSchema = z.object({
  /** 議会名（例: 山梨県議会） */
  body: z.string().min(1),
  /** 会派構成の基準日 ISO（名簿に印字された「○年○月○日現在」等） */
  asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** 基準日の原文表記。名簿の本文に出ることを確かめる */
  asOfText: z.string().min(1),
  /**
   * 条例定数（任意）。`teisuText` が `teisuUrl`（無ければ名簿・議決結果）の本文に出ることを確かめ、
   * **現員 = 定数 − 欠員** を要求する（人数の印字が無い名簿で、1人の書き落としを捕まえる網）
   */
  teisu: z.number().int().positive().optional(),
  teisuText: z.string().optional(),
  teisuUrl: z.string().url().optional(),
  vacancies: z.number().int().nonnegative().optional(),
  /** 欠員の原文が定数と別のページにあるとき（堺: 区別のページ「北区　定員9人（欠員1人）」）。無ければ teisuUrl で探す */
  vacanciesUrl: z.string().url().optional(),
  /**
   * 欠員の原文が「早良区、西区はそれぞれ欠員１人」の形のとき（福岡）、「それぞれ」の前に並ぶ地名。
   * 全部が vacanciesText に出ることを確かめ、欠員 = 印字の数 × 地名の数 として照合する
   */
  vacanciesPlaces: z.array(z.string().min(1)).optional(),
  /** 欠員の原文（vacancies > 0 のとき必須。teisuText と同じ原典で照合する） */
  vacanciesText: z.string().optional(),
  /** 欠員の原文が区ごとなど複数に分かれるとき（新潟「東区（定数8人、欠員1人）」「中央区（…欠員1人）」）。各「欠員N」の和 = vacancies */
  vacanciesTexts: z.array(z.string().min(1)).optional(),
  /**
   * 議会全体の人数の網（2026-10-02・レビューで「会派を丸ごと落としても通る」を実測）。teisu が掛けられない議会は、
   * 次のどれかで**原典に載っている全員・全会派を書き写したか**を見る:
   * - memberMarker: 名簿（-layout とページ全体）に**議員1人につき1回**出る語の正規表現（熊本「期数」）。出現数 = 現員
   * - factionMarker: 名簿に**会派ごとに1回**出る語の正規表現（「\\(\\d+人\\)」「【会派連絡先」）。出現数 = 会派の数（同名の無所属は1つ）
   * - totalText: 総数を印字した原文（「現員数37人」「出席議員（３８名）」）。数 = 現員
   */
  memberMarker: z.string().optional(),
  /**
   * memberMarker を名簿ではなく別の原典で数える（長崎: 議決当日の賛否表の予算の行の印＝出席して表決した議員ごとに1つ）。
   * 印の付かない議員（議長など）は memberMarkerExcludes に**氏名で**書く（members の中の人であること）
   */
  memberMarkerUrl: z.string().url().optional(),
  memberMarkerExcludes: z.array(z.string().min(1)).optional(),
  factionMarker: z.string().optional(),
  totalText: z.object({ text: z.string().min(1), url: z.string().url().optional() }).optional(),
  /** 議会全体の人数の網がどれも掛けられない理由（原典の事情）。書けば通るが、会派ごとの書き落としは捕まらない */
  noTotalReason: z.string().min(10).optional(),
  noFactions: z.boolean().optional(),
  roster: z.object({
    url: z.string().url(),
    title: z.string().min(1),
    /** 議決当日の資料（賛否一覧など）。**全議員の氏名がここにも出ること**を確かめる（議決時点の在籍の裏付け） */
    confirmUrls: z.array(z.string().url()).optional(),
    /**
     * 名簿（PDF）が**議決前のページからリンクされていた**ことの裏付け（静岡: 議決前の魚拓の名簿ページに
     * 「静岡市議会会派別名簿（令和7年4月25日現在）」のリンク）。text がその本文に出ることを見る
     */
    linkedFrom: z.object({ url: z.string().url(), text: z.string().min(1) }).optional(),
  }),
  factions: z.array(factionSchema).min(1),
  /**
   * 当初予算の議決の賛否（0.6.0）。賛否表の**列見出しの並び**（columns）と、予算の行の**記号の並び**（symbols）を書き写す。
   * パーサが確かめること:
   * - 凡例の原文（legendText）が原典にあること。symbols の各字が legend にあること
   * - 予算の行の記号: anchor（行の頭の原文）の直後 maxGap 字以内で始まる、凡例の字だけの連なりが symbols と完全に一致すること
   *   （HTML の表なら table: "row"/"column" で、anchor を含むセルと同じ行／列の、凡例の字だけのセルの並び）
   * - 列見出し（columns の label）が原典にその順で出ること
   * - basis "member": 列の議員が名簿の全員とちょうど対応すること／"faction": 全会派を列が覆うこと
   * - tally（印字された賛成・反対などの数）があれば、記号から数えた数と一致すること
   */
  votes: votesSchema.optional(),
  /**
   * 予算の議決が複数の採決に分かれるとき（修正可決: 「修正案」と「修正部分を除く原案」）の採決ごとの賛否（0.7.0）。
   * 各要素は votes と同じ書き方に、part（画面に出す部分の名前）と partText（その採決の行の原文の語。
   * anchor に含まれるか、anchor を含んで原典に続けて出ること。0.7.2 で「前後40字」を廃止）を足す。votes と同時には使わない
   */
  votesParts: z
    .array(votesSchema.extend({ part: z.enum(["修正案", "修正部分を除く原案"]), partText: z.string().min(1) }))
    .length(2)
    .optional(),
  /** label 方式の窓（字数・既定20） */
  labelWindow: z.number().int().positive().max(60).optional(),
  /**
   * label 方式の人数の照合。名簿の本文（-layout）で「略称＋labelSuffix」（熊本「熊本自民期数」）の出現数が
   * その会派の人数と一致すること（凡例の略称は suffix が付かないので数えない）
   */
  labelSuffix: z.string().optional(),
  /**
   * 略称の照合（氏名の直後の略称）を名簿ではなくこの原典で行う（熊本: 名簿 PDF は氏名の行と略称の行が分かれて
   * 組まれ、氏名の直後に略称が来ない。議決当日の賛否一覧は「氏名 略称」の並び）。人数（labelSuffix）は名簿で数える
   */
  labelUrl: z.string().url().optional(),
  resolution: z.object({
    url: z.string().url(),
    title: z.string().min(1),
    /**
     * 議決の事実が1つの原典に揃わないときの補助の原典（例: 北杜は議会だよりに議案番号が無く、
     * 議事日程にある）。突き合わせは url ＋ alsoUrls の本文で行う。画面の出典チップは url だけ。
     */
    alsoUrls: z.array(z.string().url()).optional(),
    /** 件名の近くに無くてよい項目（原典の組版で離れるもの。理由を registry のコメントに書く） */
    farOk: z.array(z.enum(["billNo", "decidedDate"])).optional(),
    /**
     * 結果語の位置。既定は件名の直後。賛否表の行が「…○○可決＋件名…」と組まれる原典（北杜の議会だより）は "before"
     */
    resultSide: z.enum(["after", "before"]).optional(),
    /** 件名の直後の窓（字数・既定60）。件名と結果の間に付議委員会が並ぶ原典（名古屋）で広げる */
    afterWindow: z.number().int().positive().max(200).optional(),
    /**
     * HTML の議決結果の表での照合（近接の代わり）。件名を含むセルと**同じ行**（row）または**同じ列**（column・
     * 1列が1議案の転置表＝福岡）のセルに、議案番号（セル全体が一致）・結果（セル全体が一致）・議決日
     * （`decidedDateText` があればそれ、無ければ M月D日 を含むセル）があること。
     * `farOk: ["decidedDate"]` を併用すると議決日は表の外（見出し）で探す（広島「令和8年3月26日議決」）
     */
    table: z.enum(["row", "column"]).optional(),
    /**
     * 結果が件名の行に無く、**一覧の見出し**で決まる原典（南アルプスの議会だより「◆全会一致で承認・可決・同意した議案」）。
     * 件名と同じ本文に `heading` があり、件名の直後に結果語が無い（賛否表の行ではない）こと。
     * 画面の `result` は heading に含まれる語でなければならない
     */
    resultBlock: z.object({ heading: z.string().min(1) }).optional(),
    /**
     * `farOk: ["decidedDate"]` のときの議決日の原文（例: 「3月23日開催」「３月１６日（月)午前１０時開議」）。
     * 月日だけで探すと本文の別の日付に当たる（レビューで実測）ので、前後の字ごと書く。M月D日を含むこと
     */
    decidedDateText: z.string().optional(),
    billNo: z.string().min(1),
    billName: z.string().min(1),
    sessionLabel: z.string().min(1),
    decidedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** 結果。**原典の語のまま**（「原案可決」を「可決」に丸めない・合成語を作らない） */
    result: z.string().min(1),
  }),
});
export type CouncilTranscribedOptions = z.infer<typeof optionsSchema>;

/**
 * 突き合わせ用の正規化。空白を全部落とし NFKC をかけ、PDF の抽出で揺れる異体字を寄せる。
 * ⚠ **書き写す側も同じ関数を通す**ので、ここで寄せた字は registry でどちらで書いてもよい。
 */
const VARIANTS: Record<string, string> = { 髙: "高", 﨑: "崎", 𠮷: "吉", 葊: "廣", 濵: "濱", 德: "徳", 栁: "柳", 惠: "恵", 伹: "但" };
export function norm(s: string): string {
  return (
    s
      .normalize("NFKC")
      // 異体字セレクタ（IVS・SVS）は NFKC で消えない（名古屋「辻󠄀まさお」の U+E0100）
      .replace(/[\u{E0100}-\u{E01EF}︀-️]/gu, "")
      .replace(/[髙﨑𠮷葊濵德栁惠伹]/gu, (c) => VARIANTS[c] ?? c)
      // 丸は「〇」(U+3007) と「○」(U+25CB) が同じ原典の凡例と表で混ざる（松江・盛岡・倉敷）。賛否の記号として寄せる
      .replace(/[\u3007\u25EF]/g, "\u25CB")
      // 「◯」(U+25EF・大和の凡例) も同じ丸。ダッシュ類（―‐−—–－・NFKC 後の -）も凡例と表で字が違う（伊勢原: 凡例「－」・表「―」）ので
      // 1つの字に寄せる（長音「ー」は寄せない＝氏名・会派名に出る）
      .replace(/[\u2015\u2010\u2212\u2014\u2013\uFF0D-]/g, "\u2015")
      .replace(/[\s　]+/g, "")
  );
}

const NAMED_ENTITIES: Record<string, string> = { nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', times: "×", minus: "−", ndash: "–", mdash: "—", cir: "○", bull: "•" };
function htmlText(html: string): string {
  return (
    html
      .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "")
      // 賛否を画像で示す表（熊本 sansei.gif）は alt の文字を本文に出す
      .replace(/<img[^>]*\balt=["']([^"']*)["'][^>]*>/gi, " $1 ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(\w+);/g, (m, n: string) => NAMED_ENTITIES[n.toLowerCase()] ?? m)
      .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
  );
}

const isPdf = (f: { filename: string }) => /\.pdf$/i.test(f.filename);

function pdftotext(path: string, args: string[]): string {
  return execFileSync("pdftotext", [...args, "-enc", "UTF-8", path, "-"], {
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "ignore"],
  }).toString("utf8");
}

type BboxWord = { page: number; x0: number; y0: number; x1: number; y1: number; text: string };
/**
 * pdftotext -tsv の語（ページ・座標・正規化前の字）。⚠ -bbox は甲府 R7 の PDF で落ちる（poppler 26.04・メタデータの処理で
 * std::out_of_range）ので -tsv を使う。level 5 が語
 */
function bboxWords(path: string): BboxWord[] {
  const out: BboxWord[] = [];
  for (const line of pdftotext(path, ["-tsv"]).split(/\r?\n/).slice(1)) {
    const c = line.split("\t");
    if (c.length < 12 || c[0] !== "5") continue;
    const [x, y, w, h] = [+c[6]!, +c[7]!, +c[8]!, +c[9]!];
    out.push({ page: +c[1]!, x0: x, y0: y, x1: x + w, y1: y + h, text: c.slice(11).join("\t") });
  }
  return out;
}
/**
 * 座標による列見出しの照合（headerBbox）。予算の行（anchor を含む行）の anchor より右の記号の語を x の順に読み、
 * symbols と一致すること、かつ各記号の真上の語（中心が ±4pt、または語の幅に記号の中心が入る）を上から順につないだ本文に
 * その列の見出しが含まれること。いずれかの行で満たせば null、満たさなければ理由を返す
 */
function bboxHeaderError(path: string, anchorN: string, keys: string[], sym: string[], labelsN: string[]): string | null {
  const words = bboxWords(path);
  const cx = (w: BboxWord) => (w.x0 + w.x1) / 2;
  let reason = `予算の行（「${anchorN}」）が座標の読みで見つかりません`;
  // 記号の並びが合った行の理由（列見出しの不一致）を、ほかの行（附帯決議の行など）の記号の不一致より優先して返す
  let headerReason: string | null = null;
  for (const w of words) {
    // anchor は1語に収まるか、同じ行の続く語をつないで現れること
    // 同じ行: 縦の中心の差が文字の高さの6割（最低4pt）以内。上端で比べると、記号だけ数pt高く組まれた列（江東の新時代）を落とした
    const cy = (o: BboxWord) => (o.y0 + o.y1) / 2;
    const tol = Math.max(4, (w.y1 - w.y0) * 0.6);
    const line = words.filter((o) => o.page === w.page && Math.abs(cy(o) - cy(w)) <= tol).sort((a, b) => a.x0 - b.x0);
    const from = line.indexOf(w);
    let acc = "";
    let end = -1;
    for (let k = from; k < line.length && acc.length < anchorN.length + 20; k++) {
      acc += norm(line[k]!.text);
      if (acc.includes(anchorN)) { end = k; break; }
    }
    // anchor はこの語から始まること（この語が anchor を含むか、anchor の頭の部分であること）
    const wn = norm(w.text);
    if (end < 0 || !wn.length || !(wn.includes(anchorN) || anchorN.startsWith(wn))) continue;
    {
      const joined = line.slice(from).map((o) => norm(o.text)).join("");
      if (isAmendTail(anchorN, joined.slice(joined.indexOf(anchorN) + anchorN.length))) continue;
    }
    const symWords = line.slice(end + 1).filter((o) => keys.includes(norm(o.text)));
    if (symWords.map((o) => norm(o.text)).join("|") !== sym.join("|")) {
      reason = `座標で読んだ予算の行の記号（${symWords.map((o) => o.text).join("")}）が symbols と一致しません`;
      continue;
    }
    const above = words.filter((o) => o.page === w.page && o.y1 <= w.y0 + 0.5);
    const bad: string[] = [];
    symWords.forEach((sw, i) => {
      const x = cx(sw);
      const col = above
        .filter((o) => Math.abs(cx(o) - x) <= 4 || (o.x0 - 2 <= x && x <= o.x1 + 2))
        .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
      const text = norm(col.map((o) => o.text).join(""));
      if (!text.includes(labelsN[i]!)) bad.push(`${i + 1}列目（x=${x.toFixed(1)}）の真上は「${text}」で、見出し「${labelsN[i]}」を含みません`);
    });
    if (!bad.length) return null;
    headerReason = bad.join(" / ");
  }
  return headerReason ?? reason;
}

/**
 * 原典の読み。`views` は抽出モードごと×ページごとの正規化済み本文（区間・近接の判定はモードをまたがない）。
 * PDF は -layout と -raw の両方（組版でどちらかが崩れるため）、HTML は1つ。
 */
export function readDoc(f: { path: string; filename: string }): { views: { page: number; text: string }[]; pages: number } {
  if (isPdf(f)) {
    const views: { page: number; text: string }[] = [];
    let pages = 0;
    for (const mode of ["-layout", "-raw"]) {
      const ps = pdftotext(f.path, [mode]).split("\f");
      pages = Math.max(pages, ps.length);
      ps.forEach((p, i) => views.push({ page: i + 1, text: norm(p) }));
    }
    return { views, pages };
  }
  return { views: [{ page: 1, text: norm(htmlText(readHtml(f.path))) }], pages: 1 };
}

/** HTML を読む。魚拓（id_）は gzip の本文をそのまま返すことがある（広島・横浜で実測）ので展開する */
function readHtml(path: string): string {
  const raw = readFileSync(path);
  const b = raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;
  // meta の charset で読み分ける（gijiroku.com 系・草加市議会のサイトは Shift_JIS）
  const cs = b.subarray(0, 2048).toString("latin1").match(/charset=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  const enc = cs && /^(shift_jis|sjis|x-sjis|windows-31j|cp932)$/.test(cs) ? "shift_jis" : cs === "euc-jp" ? "euc-jp" : "utf-8";
  return new TextDecoder(enc).decode(b);
}

/** 本文中の日付を「M月D日」にそろえて取り出す（「3月27日」「R8.3.27」の両方） */
function dateTokens(s: string): string[] {
  const n = norm(s);
  return [
    ...[...n.matchAll(/(\d+)月(\d+)日/g)].map((m) => `${Number(m[1])}月${Number(m[2])}日`),
    // 「R8.3.27」「8.3.26」「8. 3.23」（元号の字の無い年.月.日・正規化で空白は落ちている）
    ...[...n.matchAll(/(?<![\d.])R?\d{1,2}\.(\d{1,2})\.(\d{1,2})(?![\d.])/g)].map((m) => `${Number(m[1])}月${Number(m[2])}日`),
    // 「3/24」
    ...[...n.matchAll(/(?<![\d/])(\d{1,2})\/(\d{1,2})(?![\d/])/g)].map((m) => `${Number(m[1])}月${Number(m[2])}日`),
    // 「R08/3/11」（三郷の議決結果一覧表・元号の頭文字つきの年/月/日）。「3/24」は前後に / を許さないので別に取る
    ...[...n.matchAll(/(?<![\dA-Za-z/])R\d{1,2}\/(\d{1,2})\/(\d{1,2})(?![\d/])/g)].map((m) => `${Number(m[1])}月${Number(m[2])}日`),
  ];
}

/** HTML → テーブルの行列（セルは正規化済み）。rowspan/colspan は展開しない */
function htmlTables(html: string): string[][][] {
  const noScript = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, "");
  return (noScript.match(/<table[\s\S]*?<\/table>/gi) ?? []).map((t) => {
    // rowspan / colspan を展開して、列の位置がそろった格子にする（岡山の会派のセル・議長の行）
    const grid: string[][] = [];
    const pending: (string | undefined)[][] = [];
    (t.match(/<tr[\s\S]*?<\/tr>/gi) ?? []).forEach((tr, ri) => {
      const row: string[] = [];
      const carry = pending[ri] ?? [];
      let ci = 0;
      const cells = tr.match(/<t[hd][\s\S]*?<\/t[hd]>/gi) ?? [];
      for (const c of cells) {
        while (carry[ci] !== undefined) row[ci] = carry[ci++]!;
        const text = norm(htmlText(c));
        const rs = Number(c.match(/rowspan=["']?(\d+)/i)?.[1] ?? 1);
        const cs = Number(c.match(/colspan=["']?(\d+)/i)?.[1] ?? 1);
        for (let k = 0; k < cs; k++) {
          row[ci + k] = text;
          for (let r = 1; r < rs; r++) ((pending[ri + r] ??= [])[ci + k] = text);
        }
        ci += cs;
      }
      while (carry[ci] !== undefined) row[ci] = carry[ci++]!;
      grid.push(row.map((x) => x ?? ""));
    });
    return grid;
  });
}

function toWareki(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return `令和${y - 2018}年${m}月${d}日`;
}

/** 窓の中で最初に出る結果語とその位置 */
function m0Index(w: string, re: RegExp): { word: string; index: number } | null {
  const m = new RegExp(re.source).exec(w);
  return m ? { word: m[0], index: m.index } : null;
}

/** 「（15）」「４人」「6」→ 15 / 4 / 6。数字がちょうど1つでなければ null */
function declaredNumber(s: string): number | null {
  const ds = norm(s).match(/\d+/g);
  return ds && ds.length === 1 ? Number(ds[0]) : null;
}

// ---- 賛否（0.6.0〜） ----
export type VoteCol = { label: string; faction: string; member?: string; stance: "賛成" | "反対" | "賛成でない" | "欠席" | "退席" | "棄権" | "除斥" | "議長" | "不参加" };
export type VotesOut = { basis: "member" | "faction"; sourceTitle: string; sourceFile: string; columns: VoteCol[]; unanimousText?: string };
/** 賛否の書き写し（registry の parserOptions.votes）。`kofu-gikai` も同じ書き方で使う */
export const votesInputSchema = votesSchema;
export type VotesInput = z.infer<typeof votesSchema>;
/** 凡例の意味の語（legend の値 → 凡例の原文での言い方）。凡例の組の照合に使う */
const STANCE_WORDS: Record<string, string[]> = {
  賛成: ["賛成"],
  反対: ["反対"],
  賛成でない: ["賛成でない"],
  欠席: ["欠席"],
  退席: ["退席", "退場"],
  棄権: ["棄権"],
  除斥: ["除斥"],
  議長: ["議長", "採決に加わら", "裁決に加わら", "表決に加わら", "議決に加わら"],
  不参加: ["不参加", "不在"],
};
/**
 * 凡例の照合用の正規化: 記号を含まない括弧の中の補足（「欠席（退席）」「賛成【可決・…】」）を落とし、字形の違う記号
 * （✕×・―－-）をそろえる。凡例全体を包む括弧（倉敷「（○：賛成、×：反対…）」）は記号を含むので残す
 */
function legendNorm(t: string, keys: string[]): string {
  let x = norm(t).replace(/[「」『』"]/g, "").replace(/[✕✖╳]/g, "×").replace(/[―‐−—–-]/g, "－");
  const kn = keys.map((k) => norm(k).replace(/[✕✖╳]/g, "×").replace(/[―‐−—–-]/g, "－"));
  for (let prev = ""; prev !== x; ) {
    prev = x;
    x = x.replace(/（[^（）]*）|\([^()]*\)|【[^【】]*】/g, (g) => (kn.some((k) => g.includes(k)) ? g.replace(/^[（(【]/, "\u0001").replace(/[）)】]$/, "\u0002") : ""));
  }
  return x.replace(/[\u0001\u0002]/g, "");
}
/**
 * 凡例の原文の中で、記号 k が意味 v を指すか。記号の直後が「：＝…・は→」なら後ろの語（10字以内の最初の意味の語）、
 * 直前が「＝は」なら前の語（「者」を飛ばして10字以内の最後の意味の語）、どちらでもなければ近い方の語（12字以内）を読む。
 * 原文に k が何度出ても、1か所でも v を指せばよい
 */
function legendPairOk(texts: string[], k: string, v: string, keys: string[]): boolean {
  const own = STANCE_WORDS[v] ?? [v];
  const all = Object.values(STANCE_WORDS).flat().sort((a, b) => b.length - a.length);
  const kn = legendNorm(k, []);
  const firstIn = (str: string) => all.map((w) => ({ w, d: str.indexOf(w) })).filter((x) => x.d >= 0).sort((a, b) => a.d - b.d || b.w.length - a.w.length)[0];
  const lastIn = (str: string) => all.map((w) => ({ w, d: str.lastIndexOf(w) >= 0 ? str.length - (str.lastIndexOf(w) + w.length) : -1 })).filter((x) => x.d >= 0).sort((a, b) => a.d - b.d || b.w.length - a.w.length)[0];
  for (const t of texts.map((x) => legendNorm(x, keys))) {
    for (let i = t.indexOf(kn); i >= 0; i = t.indexOf(kn, i + 1)) {
      const after = t.slice(i + kn.length);
      const before = t.slice(0, i);
      const fwd = /^[:：＝=…・.は→⇒]+/.exec(after);
      let word: string | undefined;
      if (fwd) word = firstIn(after.slice(fwd[0].length, fwd[0].length + 10))?.w;
      // 語が先に来る書き方（「賛成＝○」「賛成者は○」「賛成・・・○」新宿）は前の語
      else if (/[＝=は・….:：]$/.test(before)) word = lastIn(before.replace(/[＝=は・….:：]+$/, "").replace(/者$/, "").slice(-10))?.w;
      else {
        const f = firstIn(after.slice(0, 12));
        const b = lastIn(before.slice(-12));
        word = !f ? b?.w : !b ? f.w : f.d <= b.d ? f.w : b.w;
      }
      if (word && own.includes(word)) return true;
    }
  }
  return false;
}
/**
 * 記号の無い列を議長以外の事情（欠席・退席など）で外す原文の検査（0.8.2）。事情の語が**氏名より前**にあり、語と氏名の間が
 * 25字以内で、間に挟む議席番号（「N番」）が1つまでであること。語と氏名を含むだけだと、出席議員の欄の最後の氏名から次の
 * 「欠席議員（１名）」の見出しまでをまたぐ原文で、出席議員を欠席にすり替えられた（大田の会議録の組版・レビューで実測）
 */
function absenceEvidenceOk(evidence: string, label: string, stance: string): boolean {
  const ev = norm(evidence);
  const name = norm(label);
  const ni = ev.indexOf(name);
  if (ni < 0) return false;
  return (STANCE_WORDS[stance] ?? [stance]).some((w) => {
    const wi = ev.lastIndexOf(w, ni);
    if (wi < 0 || wi + w.length > ni) return false;
    const between = ev.slice(wi + w.length, ni);
    // 間に「出席」「なし」を挟まない（「欠席議員 な し」の直後に出席議員の欄が続く組版で、出席議員を欠席にできる＝レビュー2巡目の指摘）
    return between.length <= 25 && (between.match(/\d+番/g) ?? []).length <= 1 && !/出席|なし|無し/.test(between);
  });
}
/**
 * 件名・anchor の出現のうち、予算そのものでなく「予算に対する修正案・附帯決議」の行（直後6字以内に「に対する」「修正案」等が続く）か。
 * 件名・anchor 自体が修正の語を含む（修正可決の votesParts など）ときは除かない（0.8.5〜0.8.6）
 */
function isAmendTail(headN: string, after: string): boolean {
  if (/修正|に対する/.test(headN)) return false;
  return /^.{0,6}(に対する|の修正|修正案|修正動議|附帯決議)/.test(after);
}
/** t の i から len 字の出現が、数字の途中で切れていないか（「市56」を「市567」に・「1予算」を「31予算」に当てない） */
function digitEdgeOk(t: string, i: number, len: number): boolean {
  const d = (c: string | undefined) => c !== undefined && /\d/.test(c);
  return !(d(t[i]) && d(t[i - 1])) && !(d(t[i + len - 1]) && d(t[i + len]));
}
/** n の出現のうち数字の途中で切れていないものの位置 */
function boundedAll(t: string, n: string): number[] {
  const out: number[] = [];
  for (let i = t.indexOf(n); i >= 0; i = t.indexOf(n, i + 1)) if (digitEdgeOk(t, i, n.length)) out.push(i);
  return out;
}
const reiwaYears = (s: string) => [...s.matchAll(/令和(\d+)年度/g)].map((m) => String(Number(m[1])));
/** 「N年度」の N（令和・西暦の別なく）。「和7年度…」と「令」を欠いて切った anchor でも年度を読む（レビュー1巡目・福岡で前年度の専決処分の行が通った） */
const KANJI_DIGIT: Record<string, number> = { 元: 1, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
/** 漢数字の年（「七」「十二」「元」）を数に。漢数字の年度も「年度なし」として素通りさせない（レビュー2巡目） */
function kanjiNum(k: string): number {
  if (k === "元") return 1;
  const [a, b] = k.split("十") as [string, string | undefined];
  if (b === undefined) return KANJI_DIGIT[a] ?? NaN;
  return (a ? (KANJI_DIGIT[a] ?? NaN) : 1) * 10 + (b ? (KANJI_DIGIT[b] ?? NaN) : 0);
}
const fiscalYears = (s: string) =>
  [...s.matchAll(/(\d+|[元一二三四五六七八九十]+)年度/g)].map((m) => String(/\d/.test(m[1]!) ? Number(m[1]) : kanjiNum(m[1]!)));
/** 当初の一般会計予算の行でないことを示す語。anchor の出現の前後（行の頭から記号まで）にあれば、その出現は読まない */
const NOT_BUDGET_ROW = /補正|修正|に対する|に関する|特別会計|事業会計|専決|附帯決議|付帯決議/;
/**
 * 語が当初の一般会計予算を名指すか（0.8.8）。「一般会計予算」か、「当初予算」と「一般会計」の両方（西東京の表「令和8年度｜当初予算｜一般会計」）を含み、
 * 補正・特別会計・修正の語を含まず、令和の年度を書くなら件名の年度と合うこと
 */
function namesBudget(sN: string, billNameN: string): boolean {
  if (!(sN.includes("一般会計予算") || (sN.includes("当初予算") && sN.includes("一般会計")))) return false;
  if (/補正|特別会計|事業会計|修正|に対する/.test(sN)) return false;
  const ys = fiscalYears(sN);
  const by = fiscalYears(billNameN);
  return ys.every((y) => by.includes(y));
}
/** 原文の中の、議決の件名への言及（件名・数字だけでない議案番号・「令和N年度…一般会計予算」）の位置 */
/**
 * 件名の直前の窓 `before` に、議案番号 `billNoN` が**件名に最も近い番号として**あるか（0.8.11）。
 * - 数字の途中に当てない（「議案2」が「議案29」に、「1」が「19」に当たっていた）
 * - その出現から件名までの間に**別の数字**があれば、件名に最も近い番号はそちら。松原は -layout で前の行の
 *   多行セルが崩れ、件名の直前20字が「議案第3号〃〃〃2号)令和議案第4号」になって「議案第3号」が通った
 *   （0.8.10 は後ろの「第N号」だけを見ていたので、「議案第3」と号を落とすと通った・坂戸の「第23号1号)」も同じ型）
 * - 括弧で囲まれた数字は議案番号に数えない（羽曳野「…下水道事業会計補正予算(第4号)」の補正の号数・
 *   豊橋の議会だよりの会派の人数「(5)」が窓に入って通った）
 * いずれもレビュー2巡目で実測。
 */
export function nearestBillNo(before: string, billNoN: string): boolean {
  const startsDigit = /^\d/.test(billNoN);
  const endsDigit = /\d$/.test(billNoN);
  for (let at = before.lastIndexOf(billNoN); at >= 0; at = at > 0 ? before.lastIndexOf(billNoN, at - 1) : -1) {
    const end = at + billNoN.length;
    if (startsDigit && /\d/.test(before[at - 1] ?? "")) continue;
    if (endsDigit && /\d/.test(before[end] ?? "")) continue;
    // 原典で番号の直後が「号」なら、書き写しも「号」まで書く（0.8.14）。「議案第９」と号を落とした書き写しが通った
    // （福津・丹波・尼崎・加古川・小美玉で作業者が実測）。数字だけの番号（調布「25.」）は原典にも号が無い型なので対象外
    if (endsDigit && !/^\d+$/.test(billNoN) && before[end] === "号") return false;
    // 番号の語の途中で切った書き写しを通さない（0.8.14・レビュー1〜2巡目で実測）。後ろ: 「第1号」「第1号議」（原典「第1号議案」）、
    // 前: 「案第12号」（原典「議案第12号」）・「1号議案」（「第1号議案」）・「第10号」（「高予第10号」）
    if (/[号議]$/.test(billNoN) && /^[議案]/.test(before.slice(end))) return false;
    // 前は語彙の網（一般則「直前が漢字・かなでない」は正規化で空白が落ちるので既存の88行が落ちた）。⚠ 一覧に無い接頭字の途中切り
    // （「予第10号」＝原典「高予第10号」）は通る（3巡目のレビュー）
    const prev = before[at - 1] ?? "";
    if (/^案/.test(billNoN) && prev === "議") return false;
    if (/^\d/.test(billNoN) && prev === "第") return false;
    if (/^第/.test(billNoN) && /[案予議発報請認諮同専]/.test(prev)) return false;
    // 件名に最も近い出現だけを見る（これより前の出現は、後ろに別の数字があるかで既に負けている）
    const tail = before.slice(end);
    if (/\d/.test(tail)) return false;
    // 出現から件名までに閉じ括弧だけがある＝出現は括弧の中（短い番号は窓が「4号)」のように開き括弧の手前で切れる）
    if (/[)）]/.test(tail) && !/[(（]/.test(tail) && !/[)）]$/.test(billNoN)) return false;
    // 数字だけの番号は件名の**すぐ前**に限る（府中の議会だより「2・3面▶令和8年度府中市一般会計予算」の面の数字が通った）。
    // 番号の後ろの「号」「.」だけは許す（調布の会議結果「25.令和8年度調布市一般会計予算」）
    if (/^\d+$/.test(billNoN) && !/^[号.]?$/.test(tail)) return false;
    return true;
  }
  return false;
}

function billMention(eN: string, bill: { billNo: string; billName: string }): { start: number; end: number } | null {
  const nameN = norm(bill.billName);
  const noN = norm(bill.billNo);
  const cands: { start: number; end: number }[] = [];
  const ni = eN.indexOf(nameN);
  if (ni >= 0) cands.push({ start: ni, end: ni + nameN.length });
  if (/\D/.test(noN) && /\d/.test(noN)) for (const i of boundedAll(eN, noN)) cands.push({ start: i, end: i + noN.length });
  for (const y of reiwaYears(nameN)) {
    const m = new RegExp(`令和${y}年度[^\\d補特修]{0,12}?一般会計予算`).exec(eN);
    if (m) cands.push({ start: m.index, end: m.index + m[0].length });
  }
  return cands.sort((a, b) => a.start - b.start)[0] ?? null;
}
/** 賛否表の記号として出る非漢字の字（既存 registry の凡例から。／・－は日付や空欄にも出るので入れない） */
const VOTE_MARKS = /[○〇●◎◯×✕✖△▲▽□■◇◆]/gu;
/** verifyVotes が名簿・会派・原典を引くための文脈。パーサごとに名簿の読み方は違うが、賛否の照合は1つにする */
export interface VotesCtx {
  sourceId: string;
  /** 会派ごとの議員（原典の表記）。name は registry／パーサの会派名 */
  factionsOpt: { name: string; members: string[] }[];
  /** 表示用の会派（factionsOpt と同じ順）。無所属は「無所属（氏名）」 */
  factions: { name: string; seats: number }[];
  /** 名簿の本文（evidence の照合に使う） */
  rosterViews: { page: number; text: string }[];
  fileFor: (url: string) => { path: string; filename: string };
  /** 照合の不一致をここに積む（呼び出し側がまとめて throw する） */
  missing: string[];
  /** 議決の件名と議案番号（照合済みのもの）。単一の採決の anchor をこれに結び付ける（0.8.8） */
  bill: { billNo: string; billName: string };
}
/** 1回の採決の賛否を原典と突き合わせる（votes・votesParts の各要素・kofu-gikai で共通） */
export function verifyVotes(ctx: VotesCtx, vo: VotesInput): VotesOut {
  const { sourceId, factionsOpt, factions, rosterViews, fileFor, missing } = ctx;
  // 単一の採決（votes・kofu-gikai）の anchor は修正の語を含めない。isAmendTail の「anchor 自体が修正の語を含めば除外しない」は
  // 修正可決の採決ごと（votesParts の part あり）のためのもので、単一の votes で anchor を「…に対する修正案」まで伸ばすと
  // 修正案の行の記号が予算の賛否として通った（朝霞・レビュー3巡目）
  // 「附帯決議」は語として入れない — 名古屋の anchor「（2）附帯決議を付して修正可決」は予算の行の結果の語そのもの（予算への附帯決議の
  // 別の行は「…に対する附帯決議」なので「に対する」で落ちる）
  if ((vo as { part?: string }).part == null && /修正案|修正動議|に対する/.test(norm(vo.anchor))) {
    missing.push(`賛否の anchor「${vo.anchor}」に修正案・附帯決議の語があります（当初予算の行の語にする。修正可決は votesParts で書く）`);
  }
  const has = (views: { text: string }[], needle: string) => views.some((v) => v.text.includes(norm(needle)));
  const vf = fileFor(vo.url);
  const vdoc = readDoc(vf);
  // ---- anchor と議決の件名の結び付き（0.8.8） ----
  // anchor は「予算の行の頭」の原文でしかなく、件名と結び付いていなかった — 別の議案の行（特別会計・条例）を anchor にして
  // その行の記号を写すと予算の賛否として通った（朝霞で国保・介護・水道の3通りを実測・レビュー4巡目）。単一の採決では次のどれかを要求する:
  // ① anchor が当初の一般会計予算を名指す（namesBudget）か件名を含む ② anchor が議案番号そのもの（番号の飾りの字だけを足したもの）
  // ③ anchorEvidence（anchor の行が件名の行であることを示す原文）。修正可決の採決ごと（votesParts）は partText の照合が別にある
  /** 記号を読んでよい anchor の出現（③ の key なしのとき）。null は制限なし */
  let allowedAt: Set<string> | null = null;
  /** anchorWeakReason の読み: 記号は anchor の直後から始まり、そう読める出現が各抽出で1つだけ */
  let weakTight = false;
  /** ① で結び付けたとき: 出現の前後（行の頭から記号まで）に補正・修正・特別会計・別年度の語があれば読まない（語を跨いで切った anchor・レビュー1巡目） */
  let nameCtx = false;
  /** ② だけで結び付けたとき: 記号は番号の直後から始まり、番号の前は語の続きでない（「議員提出議案第1号」「補正予算(第3号)」を読まない） */
  let noTight = false;
  /** ③ key ありで結び付けたとき: key は「番号 ↔ 件名」を示すだけで anchor のどの出現かを絞らないので、記号は anchor の直後から・行の語に補正等が無い出現だけ（表はセル＝anchor）。
   *  これが無いと key を議案番号の数字にするだけで ② の抜け道（「議員提出議案第1号」の行）が開き直した（レビュー2巡目・10団体） */
  let keyTight = false;
  const single = (vo as { part?: string }).part == null;
  if (single) {
    const aN = norm(vo.anchor);
    const nameN = norm(ctx.bill.billName);
    const noN = norm(ctx.bill.billNo);
    const byName = namesBudget(aN, nameN) || (aN.includes(nameN) && !/補正|修正|に対する/.test(aN));
    // 数字だけの議案番号（「1」「27」）は原典のどこにでも出るので結び付きにならない（レビュー1巡目: 広島・北九州・秋田・福岡で別の行が通った）
    const byNo =
      /\d/.test(noN) && /\D/.test(noN) && boundedAll(aN, noN).length === 1 && /^[第号議案市区町村県甲乙]*$/.test(aN.replace(noN, ""));
    let byEvidence = false;
    const ev = vo.anchorEvidence;
    if (ev) {
      const eN = norm(ev.text);
      const kN = norm(ev.key ?? vo.anchor);
      const errs: string[] = [];
      if (eN.length > 120) errs.push(`120字まで`);
      // 記号の並び（2字以上の連なり）を挟まないこと — 挟めば別の行まで伸ばしている
      const markChars = new Set([...Object.keys(vo.legend).map(norm).filter((k) => k.length === 1 && !/\p{Script=Han}/u.test(k)), ..."○〇●◎◯×✕✖△▲▽□■◇◆"]);
      if ([...eN].some((c, i) => markChars.has(c) && markChars.has(eN[i + 1] ?? ""))) errs.push(`記号の並びを含みます`);
      // 語の凡例（「賛成」「反対」「欠席」）の並びも記号の並び。3つ以上続けば別の行の記号を飲み込んでいる（大田で国保の行が通った＝レビュー1巡目）。
      // 凡例の原文「○:賛成×:反対」は2つまでしか続かない
      const tokRe = new RegExp(`(?:${[...new Set([...Object.keys(vo.legend).map(norm).filter((k) => k.length >= 2 || !/\p{Script=Han}/u.test(k)), ...markChars])].map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}){3,}`);
      if (tokRe.test(eN)) errs.push(`凡例の語・記号の並びを含みます`);
      // key は anchor の中の番号（数字を含み、anchor そのものでない）。key＝anchor にすると key なしの「原文の中の出現だけを読む」が外れた（レビュー1巡目）
      if (ev.key && (kN === aN || !/\d/.test(kN))) errs.push(`key「${ev.key}」は anchor の中の番号（数字を含み anchor 全体でない語）にする`);
      // 本文（表でない）の key は行番号そのもの: 数字だけで、anchor の中で「第…号」「(…)」「問…」「…期」の一部でなく、key の外の anchor の語が
      // 列見出し・委員会名・団体の字だけであること。key は「番号 ↔ 件名」を示すだけなので、key の数字を含む別の行の頭（「議案第1号…定数条例…否決」
      // 「諮問第1号…」「(1)条例案40…」「第1期工事)」）を anchor にすると、その行の記号が通った（レビュー3巡目・7団体）
      if (ev.key && !vo.table && boundedAll(aN, kN).length === 1) {
        const at = boundedAll(aN, kN)[0]!;
        const outside = aN.slice(0, at) + "|" + aN.slice(at + kN.length);
        // key の外に許す語は registry で宣言した列見出し・委員会名（headings）と団体の字だけ（語のブラックリストは「不採択」「円」のような
        // 語彙の外の語で抜けた＝レビュー4巡目。「漢字12字＋委員会」の形で許すと任意の語を吸えた＝レビュー5巡目）
        // headings は宣言するだけでは何でも書ける（anchor の残りを丸ごと書いて秋田の諮問の行が通った＝レビュー6巡目）。列見出し・委員会名の形
        // （12字まで・「…委員会」か「番号」で終わる・議案の種類や結果の語を含まない）に限る
        for (const h of ev.headings ?? []) {
          const hN = norm(h);
          if (hN.length > 12 || !/(委員会|番号)$/.test(hN) || NOT_BUDGET_ROW.test(hN) || /議案|条例|請願|陳情|諮問|同意|承認|認定|選任|採択|可決|否決|件|号/.test(hN))
            errs.push(`headings「${h}」は列見出し・委員会名（12字まで・「…委員会」「番号」で終わり、議案の種類・結果の語を含まない）にする`);
        }
        let rest = outside;
        for (const h of [...(ev.headings ?? [])].map(norm).sort((x, y) => y.length - x.length)) rest = rest.split(h).join("");
        if (
          !/^\d+$/.test(kN) ||
          /[第(（問号]$/.test(aN.slice(0, at)) ||
          /^[号)）期]/.test(aN.slice(at + kN.length)) ||
          !/^[市区町村県甲乙|]*$/.test(rest) ||
          NOT_BUDGET_ROW.test(outside)
        )
          errs.push(`本文の key「${ev.key}」は数字だけの行番号にし、anchor の key の外は列見出し・委員会名・団体の字だけにする`);
      }
      if (ev.key && boundedAll(aN, kN).length !== 1) errs.push(`key「${ev.key}」が anchor にちょうど1回（数字の途中でなく）含まれません`);
      const kAt = boundedAll(eN, kN);
      if (kAt.length !== 1) errs.push(`${ev.key ? "key" : "anchor"}「${ev.key ?? vo.anchor}」を原文にちょうど1回含みません`);
      if (ev.key && kAt[0] !== 0) errs.push(`原文が key「${ev.key}」で始まりません`);
      const m = billMention(eN, ctx.bill);
      // 本文の key の原文は「行番号＋件名」: key の直後がそのまま件名の言及であること。「10,000円の使われ方 令和8年度一般会計予算」
      // 「陳情2件が審議されました…一般会計予算」のように番号でない数字から件名まで伸ばせた（レビュー4巡目・台東・府中）
      if (ev.key && !vo.table && m && m.start !== kN.length) errs.push(`本文の key「${ev.key}」の直後が件名（議案番号・「令和N年度…一般会計予算」）ではありません`);
      if (!m) errs.push(`件名「${ctx.bill.billName}」（議案番号「${ctx.bill.billNo}」・令和の年度つきの「一般会計予算」）を含みません`);
      if (m && ev.key && kAt.length === 1) {
        // key の直後から件名までに、key と同じ形の語（数字を入れ替えたもの）があれば、件名は別の番号の行のもの
        const shape = new RegExp(kN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\d+/g, "\\d+"));
        if (m.start < kN.length || shape.test(eN.slice(kN.length, m.start))) errs.push(`key「${ev.key}」の後ろに件名が無いか、間に別の番号があります`);
      }
      // 原文の出現。件名の直後に「に対する修正案」等が続くもの（修正案の行）は数えない
      const occ: { vi: number; at: number }[] = [];
      vdoc.views.forEach((v, vi) => {
        for (let p = v.text.indexOf(eN); p >= 0; p = v.text.indexOf(eN, p + 1)) {
          if (!digitEdgeOk(v.text, p, eN.length)) continue; // 「56令和…」を「156令和…」に当てない
          // 件名の直後16字に「に関する付帯決議」「特別会計」等が続く出現も件名の行ではない（isAmendTail の語彙だけでは「に関する」「付帯決議」が漏れた＝レビュー5巡目）
          if (m && (isAmendTail("", v.text.slice(p + m.end)) || NOT_BUDGET_ROW.test(v.text.slice(p + m.end, p + m.end + 16)))) continue;
          occ.push({ vi, at: p });
        }
      });
      if (!occ.length) errs.push(`${vf.filename} の本文に続けて出ません`);
      if (errs.length) missing.push(`anchorEvidence「${ev.text}」: ${errs.join("・")}`);
      else {
        byEvidence = true;
        if (!ev.key) allowedAt = new Set(occ.map((o) => `${o.vi}:${o.at + kAt[0]!}`));
        else keyTight = true;
      }
    }
    if (vo.anchorWeakReason) {
      if (aN !== "一般会計" || vo.table || vo.anchorSide === "before" || vo.unanimousText) {
        missing.push(`anchorWeakReason は本文の行の見出しが「一般会計」だけの原典にだけ使えます（anchor「${vo.anchor}」）`);
      } else weakTight = true;
    }
    // 制限は重ねて掛ける（③ を足して ② の制限を外せないように）
    if (byName) nameCtx = true;
    else if (byNo) noTight = true;
    if (!byName && !byNo && !byEvidence && !weakTight) {
      missing.push(
        `賛否の anchor「${vo.anchor}」が議決の件名「${ctx.bill.billName}」（議案番号「${ctx.bill.billNo}」）と結び付きません — ` +
          `anchor を件名の行の語にするか、anchorEvidence に anchor と件名が同じ行にあることを示す原文を書く`,
      );
    }
  }
  const billYears = fiscalYears(norm(ctx.bill.billName));
  /** 行の頭から記号までの語 win が、当初の一般会計予算の行と矛盾しないか（nameCtx） */
  const rowWordsOk = (win: string) => !NOT_BUDGET_ROW.test(win) && fiscalYears(win).every((y) => billYears.includes(y));
  /** anchor の出現 i（views[vi]）の記号を予算の行として数えてよいか。列見出しの順の照合は表の性質なので、同じ記号の並びの別の出現（別の抽出）でもよい */
  const allowed = (vi: number, i: number) => allowedAt == null || allowedAt.has(`${vi}:${i}`);
  // 本文の窓で読む原典（表でない）の anchor は「予算の行の語」に限る。記号の並びや次の行の頭まで anchor に飲み込ませると、
  // 直後・直前の検査（記号の並び・全会一致の間）をすり抜けられた（レビュー3巡目）。漢字の凡例（議・除）は語として anchor に入る（松本・明石）
  if (vo.table && isPdf(vf)) throw new Error(`${sourceId}: votes.table は HTML の賛否表にだけ使えます（PDF は anchor の直後を読む）`);
  // 全会一致の要素は表でも本文の窓で読むので、同じ検査を掛ける（table を付けて検査を外せた＝レビュー4巡目）
  if (!vo.table || vo.unanimousText) {
    const aN0 = norm(vo.anchor);
    // 上限は既存の最長（松本29字）＋少し。40字だと前の行の「全会一致」から飲み込ませた anchor（奈良でちょうど40字）が通った
    if (aN0.length > 32) missing.push(`anchor「${vo.anchor}」が長すぎます（32字まで）`);
    if (/全会一致|満場一致/.test(aN0)) missing.push(`anchor「${vo.anchor}」に別の行の結果（全会一致）が含まれます`);
    // 書き写し側の legend だけでなく固定の記号クラスでも見る（legend を「賛成」「反対」の語にすると ○× を見なくなった＝レビュー4巡目）
    const bad = [
      // 漢字1字の凡例（議・除）だけは語として anchor に入る。「賛成」「反対」「欠席」などの語の凡例は記号と同じ（大田で予算の行の記号を飲み込んだ anchor が通った＝レビュー1巡目）
      ...Object.keys(vo.legend).map(norm).filter((k) => !(k.length === 1 && /^\p{Script=Han}/u.test(k)) && aN0.includes(k)),
      ...(aN0.match(VOTE_MARKS) ?? []),
    ];
    if (bad.length) missing.push(`anchor「${vo.anchor}」に凡例の記号（${bad.join("・")}）が含まれます`);
  }
  // 凡例の原文。凡例が印字されていない原典は、凡例の語がそのまま賛否の語である（セルが「賛成」「反対」）場合だけ認める
  if (vo.legendText == null) {
    const self = Object.entries(vo.legend).every(([k, v]) => norm(k).includes(v));
    if (!self) missing.push(`凡例の原文（legendText）がありません — 記号（○×など）の意味は原典の凡例で確かめる`);
  }
  for (const lt of vo.legendText == null ? [] : Array.isArray(vo.legendText) ? vo.legendText : [vo.legendText]) {
    if (!has(vdoc.views, lt)) missing.push(`${vf.filename}: 凡例の原文「${lt}」が見つかりません`);
  }
  // 記号と意味の組が凡例の原文と合うこと（0.8.0）。原文が原典にあるだけでは、legend の「○＝反対・×＝賛成」の入れ替えが通った
  if (vo.legendText != null) {
    for (const [k, v] of Object.entries(vo.legend)) {
      if (norm(k).includes(v)) continue; // 記号そのものが意味の語（「賛成」の列に「賛成」）
      if (!legendPairOk([vo.legendText].flat(), k, v, Object.keys(vo.legend)))
        missing.push(`凡例「${k}：${v}」が凡例の原文（legendText）で確かめられません（記号の指す語が「${v}」でない）`);
    }
  }
  if (vo.unanimousText) {
    // 凡例の原文が要る（原典が賛否を記号で示す表であることの裏付け。legend を語にして検査を外せた＝レビュー4巡目）
    if (vo.legendText == null) missing.push(`unanimousText を使う要素は legendText（凡例の原文）が要ります`);
    else if (![vo.legendText].flat().some((lt) => Object.keys(vo.legend).some((k) => norm(lt).includes(norm(k)))))
      missing.push(`legendText に凡例の記号が1つも含まれません（原典にある任意の語では凡例の裏付けにならない）`);
    if (vo.symbols || vo.columns.length) missing.push(`unanimousText と symbols・columns は同時に使わない`);
    const aN = norm(vo.anchor);
    const uN = norm(vo.unanimousText);
    const gap = vo.maxGap ?? 40;
    const near = vdoc.views.some((v, vi) => {
      for (let i = v.text.indexOf(aN); i >= 0; i = v.text.indexOf(aN, i + 1)) {
        if (!digitEdgeOk(v.text, i, aN.length) || !allowed(vi, i) || isAmendTail(aN, v.text.slice(i + aN.length))) continue;
        const w = v.text.slice(i + aN.length, i + aN.length + gap + uN.length);
        const at = w.indexOf(uN);
        if (at < 0) continue;
        // anchor と「全会一致」の間に記号の並びや次の行の頭があれば、それは別の行の全会一致（賛否が割れた行を全会一致と書けた＝レビューで実測）
        const between = w.slice(0, at);
        if (Object.keys(vo.legend).map(norm).some((k) => between.includes(k)) || new RegExp(VOTE_MARKS.source).test(between) || /議案|報告|請願|陳情|第\d+号/.test(between)) continue;
        return true;
      }
      return false;
    });
    if (!near) missing.push(`${vf.filename}: 「${vo.unanimousText}」が予算の行（「${vo.anchor}」）の直後${gap}字にありません`);
    const mf = new Map<string, { display: string; raw: string }>();
    factionsOpt.forEach((f, i) => f.members.forEach((m) => mf.set(norm(m), { display: factions[i]!.name, raw: m })));
    const ucols: VoteCol[] = [];
    for (const b of vo.blank ?? []) {
      const m = mf.get(norm(b.label));
      const evViews = b.evidenceUrl ? readDoc(fileFor(b.evidenceUrl)).views : [...vdoc.views, ...rosterViews];
      if (!m) missing.push(`記号の無い列「${b.label}」が名簿の議員にいません`);
      if (!has(evViews, b.evidence) || !norm(b.evidence).includes(norm(b.label)) || (b.stance === "議長" && !norm(b.evidence).replace(/副議長/g, "").includes("議長")) || (b.stance !== "議長" && !absenceEvidenceOk(b.evidence, b.label, b.stance))) {
        missing.push(`「${b.label}」の原文「${b.evidence}」が原典に無いか、氏名・「議長」を含みません`);
      }
      if (m) ucols.push({ label: b.label, faction: m.display, member: m.raw, stance: b.stance });
    }
    if (!ucols.some((c) => c.stance === "議長") && !vo.noChairReason) missing.push(`全会一致の行でも議長は blank で外す（無理なら noChairReason）`);
    for (const f of factions) ucols.push({ label: f.name, faction: f.name, stance: "賛成" });
    // 原典の印字は「全会一致」だけで、賛成の数は議席から出した数。画面でそれと分かるよう原文を持たせる
    return { basis: "faction", sourceTitle: vo.title, sourceFile: vf.filename, columns: ucols, unanimousText: vo.unanimousText };
  }
  if (!vo.symbols) throw new Error(`${sourceId}: votes には symbols（または unanimousText）が要ります`);
  const legend = new Map(Object.entries(vo.legend).map(([k, v]) => [norm(k), v] as const));
  // 記号は1字とは限らない（八尾「※1」・語の「賛成」）ので、凡例の語を長い順に当てて区切る
  const keys = [...legend.keys()].sort((x, y) => y.length - x.length);
  const tokenize = (t: string, ignore = ""): string[] | null => {
    const out: string[] = [];
    let i = 0;
    while (i < t.length) {
      const k = keys.find((kk) => t.startsWith(kk, i));
      if (k) { out.push(k); i += k.length; continue; }
      if (ignore.includes(t[i]!)) { i++; continue; }
      return null;
    }
    return out;
  };
  const symTokens = vo.symbolSep ? vo.symbols.split(vo.symbolSep).map(norm) : tokenize(norm(vo.symbols));
  if (!symTokens || symTokens.some((x) => !legend.has(x))) missing.push(`symbols「${vo.symbols}」を凡例の語で区切れません`);
  const sym = symTokens ?? [];
  if (sym.length !== vo.columns.length) missing.push(`symbols は ${sym.length}個、列見出しは ${vo.columns.length}列`);
  // 1字の列見出しは順の照合が弱い（同じ頭の字の議員の入れ替えが通る）ので理由を要求する
  if (vo.columns.some((c) => norm(c.label).length < 2) && !vo.headerWeakReason) missing.push(`1字の列見出しがあります — headerWeakReason に理由を書く`);
  // 予算の行の記号
  const anchorN = norm(vo.anchor);
  const labelsN = vo.columns.map((c) => norm(c.label));
  const inOrder = (text: string) => {
    let pos = 0;
    for (const l of labelsN) {
      const k = text.indexOf(l, pos);
      if (k < 0) return false;
      pos = k + l.length;
    }
    return true;
  };
  let rowOk = false;
  let headerOk = false;
  if (vo.table) {
    if (isPdf(vf)) throw new Error(`${sourceId}: votes.table は HTML の賛否表にだけ使えます`);
    // 表のセルは本文の位置と対応しないので、anchorEvidence（key なし）は anchor が本文にちょうど1回出て、それが原文の中のときだけ認める
    if (allowedAt) {
      const at = vdoc.views.flatMap((v, vi) => boundedAll(v.text, anchorN).map((i) => `${vi}:${i}`));
      if (at.length !== 1 || !allowedAt.has(at[0]!)) missing.push(`anchor「${vo.anchor}」が本文に${at.length}回出ます（表の anchorEvidence は、本文に1回だけ出る anchor にだけ使えます）`);
    }
    // 表の anchor のセル。① はセル全体の語（「令和7年度…一般会計予算の補正に関する専決処分について」を読まない）、② はセルが番号そのもの
    const cellOk = (c: string) =>
      boundedAll(c, anchorN).length > 0 &&
      !isAmendTail(anchorN, c.slice(c.indexOf(anchorN) + anchorN.length)) &&
      (!nameCtx || rowWordsOk(c)) &&
      (!(noTight || keyTight) || c === anchorN);
    for (const t of htmlTables(readHtml(vf.path))) {
      if (vo.table === "memberRows") {
        // 予算の列の見出しセルの位置を取り、columns の氏名の行のその列のセルを並べる
        for (let ri = 0; ri < t.length; ri++) {
          const ci = t[ri]!.findIndex((c) => cellOk(c));
          if (ci < 0) continue;
          const seq: string[] = [];
          const rowsOrder: number[] = [];
          for (const l of labelsN) {
            const r = t.findIndex((row, k) => k > ri && row.some((c) => c === l || c.startsWith(l)));
            rowsOrder.push(r);
            seq.push(r >= 0 ? (t[r]![ci] ?? "") : "");
          }
          if (seq.join("|") === sym.join("|")) rowOk = true;
          if (rowsOrder.every((r, k) => r > 0 && (k === 0 || r > rowsOrder[k - 1]!))) headerOk = true;
        }
      } else {
        t.forEach((row, ri) =>
          row.forEach((cell, ci) => {
            if (!cellOk(cell)) return;
            const line = vo.table === "row" ? row.slice(ci + 1) : t.slice(ri + 1).map((rw) => rw[ci] ?? "");
            const seq = line.filter((c) => c.length > 0 && legend.has(c));
            if (seq.join("|") === sym.join("|")) {
              rowOk = true;
              // 列見出しは、予算の行より上の**1行**（転置表なら左の**1列**）の中にその順で並ぶこと。
              // 表全体の本文だと、rowspan を展開した見出し行が2回出て隣の入れ替えが通る（千葉で実測）
              const heads =
                vo.table === "row"
                  ? t.slice(0, ri).map((r) => r.join(""))
                  : Array.from({ length: ci }, (_x, k) => t.map((r) => r[k] ?? "").join(""));
              if (heads.some((h) => inOrder(h))) headerOk = true;
            }
          }),
        );
      }
    }
  } else {
    // key ありの anchor は本文の各抽出に1回まで（行番号の行は表に1つ）
    if (keyTight) {
      for (const v of vdoc.views) {
        const n = boundedAll(v.text, anchorN).length;
        if (n > 1) missing.push(`${vf.filename} p.${v.page}: key ありの anchor「${vo.anchor}」が ${n} 回出ます（行番号の行は1つに決まること）`);
      }
    }
    if (weakTight) {
      for (const v of vdoc.views) {
        let n = 0;
        for (let i = v.text.indexOf(anchorN); i >= 0; i = v.text.indexOf(anchorN, i + 1)) if (keys.some((k) => v.text.startsWith(k, i + anchorN.length))) n++;
        if (n > 1) missing.push(`${vf.filename} p.${v.page}: 「${vo.anchor}」の直後に記号が続く行が ${n} つあります（anchorWeakReason は行が1つに決まる原典にだけ使えます）`);
      }
    }
    const gap = vo.maxGap ?? 40;
    const before = vo.anchorSide === "before";
    const isWordChar = (c: string | undefined) =>
      c !== undefined && /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(c) && !keys.some((k) => k.startsWith(c));
    // 語の頭（末尾）として免除するのは、凡例の字そのものが漢字（議・欠・除・退）のときだけ。
    // ○・×・〇などは続く字が何でも記号 — 免除すると「…〇 可決」の末尾の〇を1つ落とした書き写しが通る（レビューで長野・明石に実測）
    const hanKey = (k: string) => /^\p{Script=Han}/u.test(k);
    /** t[p] が記号（凡例の語の頭・固定の記号クラス）か。行の頭・行の終わりの目印 */
    const isMarkAt = (t: string, p: number) => keys.some((k) => t.startsWith(k, p)) || new RegExp(VOTE_MARKS.source, "u").test(t[p] ?? "");
    for (const [vi, v] of vdoc.views.entries()) {
      for (let i = v.text.indexOf(anchorN); i >= 0; i = v.text.indexOf(anchorN, i + 1)) {
        if (!digitEdgeOk(v.text, i, anchorN.length)) continue;
        let counts = allowed(vi, i);
        // 修正案の行（anchor の直後に「に対する修正案」等）は予算の行ではない（朝霞で修正案の行の記号が予算の賛否として通った＝レビュー2巡目）
        if (isAmendTail(anchorN, v.text.slice(i + anchorN.length))) continue;
        // "before": 記号は anchor の前に来る。anchor の前の本文を逆順にして同じ手順で読み、最後に戻す
        if (before) {
          const head = v.text.slice(0, i);
          const tail = v.text.slice(0, i);
          let e = tail.length;
          let g = 0;
          while (e > 0 && g <= gap && !keys.some((k) => tail.endsWith(k, e))) { e--; g++; }
          if (g > gap) continue;
          // ② だけの結び付きは before 側では読まない。① は記号の後ろから anchor の後ろの語（次の記号まで・10字まで）までを見る
          if (noTight || keyTight) counts = false;
          if (nameCtx) {
            let f = i + anchorN.length;
            while (f < v.text.length && f - i - anchorN.length < 10 && !isMarkAt(v.text, f)) f++;
            if (!rowWordsOk(v.text.slice(e, f))) counts = false;
          }
          const got: string[] = [];
          let j = e;
          while (j > 0 && got.length < sym.length) {
            const k = keys.find((kk) => tail.endsWith(kk, j));
            if (k) { got.unshift(k); j -= k.length; continue; }
            if ((vo.ignoreChars ?? "").includes(tail[j - 1]!)) { j--; continue; }
            break;
          }
          // 直前の字が凡例の字でも、さらに前が凡例でない漢字なら語の末尾（「…議」）であって記号ではない
          const prevIsSym = keys.some((k) => tail.endsWith(k, j) && !(hanKey(k) && isWordChar(tail[j - k.length - 1])));
          if (got.join("|") === sym.join("|") && !prevIsSym) {
            if (counts) rowOk = true;
            if (inOrder(head.slice(0, j))) headerOk = true;
          }
          continue;
        }
        const rest = v.text.slice(i + anchorN.length);
        let st = 0;
        while (st < rest.length && st <= gap && !keys.some((k) => rest.startsWith(k, st))) st++;
        if (st > gap || (weakTight && st !== 0)) continue;
        if (noTight && (st !== 0 || /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}A-Za-z(（]/u.test(v.text[i - 1] ?? ""))) counts = false;
        if (keyTight && st !== 0) counts = false;
        if (nameCtx || keyTight) {
          let b = i;
          while (b > 0 && i - b < 10 && !isMarkAt(v.text, b - 1)) b--;
          if (!rowWordsOk(v.text.slice(b, i + anchorN.length + st))) counts = false;
        }
        const got: string[] = [];
        let j = st;
        while (j < rest.length && got.length < sym.length) {
          const k = keys.find((kk) => rest.startsWith(kk, j));
          if (k) { got.push(k); j += k.length; continue; }
          if ((vo.ignoreChars ?? "").includes(rest[j]!)) { j++; continue; }
          break;
        }
        // 直後の字が凡例の字でも、続く字が凡例でない漢字なら次の行の語の頭（「議案第44号」の「議」）であって記号ではない（八戸・松本で実測）
        const nextIsSym = keys.some((k) => rest.startsWith(k, j) && !(hanKey(k) && isWordChar(rest[j + k.length])));
        if (got.join("|") === sym.join("|") && !nextIsSym) {
          if (counts) rowOk = true;
          // 列見出しは、この行より前（同じ抽出・同じページ）にその順で出ること
          if (inOrder(v.text.slice(0, i))) headerOk = true;
        }
      }
    }
  }
  if (!rowOk) missing.push(`${vf.filename}: 予算の行（「${vo.anchor}」の${vo.table ? "表" : "直後"}）の記号の並びが symbols と一致しません`);
  if (vo.headerUrl) headerOk = readDoc(fileFor(vo.headerUrl)).views.some((v) => inOrder(v.text));
  if (vo.headerBbox) {
    if (!isPdf(vf) || vo.table || vo.headerUrl) missing.push(`headerBbox は PDF の本文（table・headerUrl なし）にだけ使えます`);
    else {
      const err = bboxHeaderError(vf.path, anchorN, keys, sym, labelsN);
      headerOk = err == null;
      if (err) missing.push(`${vf.filename}: 列見出しの座標の照合 — ${err}`);
    }
  }
  // 1字の見出し（縦組みで姓の頭の字だけ）は、本文全体だと氏名の2字目以降の行の字に当たって入れ替えが通る（倉敷で実測）。
  // **-layout の同じ1行の中に**その順で並ぶことまで求める
  if (headerOk && vo.columns.some((c) => norm(c.label).length < 2) && isPdf(vf)) {
    const lines = pdftotext(vf.path, ["-layout"]).split(/\r?\n/).map(norm);
    if (!lines.some((ln) => inOrder(ln))) {
      headerOk = false;
      missing.push(`${vf.filename}: 1字の列見出しが -layout の同じ1行の中にその順で並びません`);
    }
  }
  if (rowOk && !headerOk) missing.push(`${vo.headerUrl ?? vf.filename}: 列見出しが${vo.headerUrl ? "原典" : vo.table ? "同じ表" : "予算の行より前"}にその順で出ません`);
  // 列 → 会派・議員
  const memberFaction = new Map<string, { display: string; raw: string }>();
  factionsOpt.forEach((f, i) => f.members.forEach((m) => memberFaction.set(norm(m), { display: factions[i]!.name, raw: m })));
  const cols: VoteCol[] = [];
  vo.columns.forEach((c, i) => {
    const stance = legend.get(sym[i] ?? "") ?? "不参加";
    // 見出しと会派・議員の対応: 見出しが会派名・氏名に含まれる（略称が正式名の一部）か、対応を示す原文があること
    {
      const l = norm(c.label);
      const target = norm(c.member ?? c.faction ?? c.label);
      const bound = target.includes(l) || l.includes(target);
      // 略称（見出しが正式名の一部）は、その略称がほかの列の会派名・氏名に含まれないこと。「クラブ」を政友クラブ・市民クラブの
      // 両方に使うと、列の帰属を入れ替えても見出しの照合が通った（0.8.0 のレビューで実測・0.6.0 からの穴）
      // 1字の見出し（縦組みの姓の頭の字）は headerWeakReason で弱さを申告済みの別の型なので除く（2字以上の略称だけを見る）
      // evidence で結び付ける列（bound が偽）も同じ: 見出し「政友クラブ」を faction「市民クラブ」に evidence（名簿の区間）で
      // 結び付けると、正式名の見出しを交差させた入れ替えが通った（レビュー2巡目）。見出しがほかの列の名前と一致・包含されるなら不可
      // 例外: evidence が原典の略称の定義そのもの（福岡「自民：自由民主党福岡市議団」）＝「見出し＋区切り（：＝・…など）＋正式名」の形で、
      // 見出しがほかの列の正式名そのものではないとき。短さだけで認めると、見出し行で隣り合う会派名「市民クラブ公明党」を evidence にした
      // 交差が通った（レビュー3巡目）
      const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const defForm = c.evidence != null && new RegExp(`^${esc(l)}[:：＝=・…．.→]{1,4}${esc(target)}$`).test(norm(c.evidence));
      const exactClash = vo.columns.some((o) => o !== c && norm(o.member ?? o.faction ?? o.label) === l);
      const tightDef = defForm && !exactClash;
      if (l !== target && l.length >= 2 && !tightDef) {
        const clash = vo.columns.filter((o) => {
          const t2 = norm(o.member ?? o.faction ?? o.label);
          return o !== c && t2 !== target && (t2.includes(l) || l.includes(t2));
        });
        if (clash.length) missing.push(`見出し「${c.label}」がほかの列（${clash.map((o) => o.member ?? o.faction).join("・")}）の名前にも含まれ、列を特定できません — 正式名か evidence で書く`);
      }
      if (!bound) {
        if (!c.evidence) missing.push(`賛否の列「${c.label}」と「${c.member ?? c.faction}」の対応を示す原文（evidence）がありません`);
        else {
          const ev = norm(c.evidence);
          if (!ev.includes(l) || !ev.includes(target)) missing.push(`evidence「${c.evidence}」に見出し「${c.label}」と「${c.member ?? c.faction}」の両方が含まれません`);
          if (!has(vdoc.views, c.evidence) && !has(rosterViews, c.evidence)) missing.push(`evidence「${c.evidence}」が賛否表にも名簿にもありません`);
        }
      }
    }
    if (vo.basis === "member") {
      const key = norm(c.member ?? c.label);
      const mf = memberFaction.get(key);
      if (!mf) missing.push(`賛否の列「${c.label}」が名簿の議員にいません`);
      else cols.push({ label: c.label, faction: mf.display, member: mf.raw, stance });
    } else if (c.member) {
      const mf = memberFaction.get(norm(c.member));
      if (!mf) missing.push(`賛否の列「${c.label}」の議員「${c.member}」が名簿にいません`);
      else cols.push({ label: c.label, faction: mf.display, member: mf.raw, stance });
    } else {
      const fname = c.faction ?? c.label;
      const fi = factionsOpt.findIndex((f, j) => f.name === fname || factions[j]!.name === fname);
      if (fi < 0) missing.push(`賛否の列「${c.label}」の会派「${fname}」が registry にありません`);
      else cols.push({ label: c.label, faction: factions[fi]!.name, stance });
    }
  });
  for (const b of vo.blank ?? []) {
    const mf = memberFaction.get(norm(b.label));
    if (!mf) missing.push(`記号の無い列「${b.label}」が名簿の議員にいません`);
    const evViews = b.evidenceUrl ? readDoc(fileFor(b.evidenceUrl)).views : [...vdoc.views, ...rosterViews];
    if (!has(evViews, b.evidence)) missing.push(`記号の無い列「${b.label}」の原文「${b.evidence}」が${b.evidenceUrl ? "指定の原典" : "賛否表にも名簿にも"}ありません`);
    // 誰が記号の無い列なのかを原典で特定するため、原文は氏名を含むこと（「議長は採決に加わりません」だけでは誰か分からない）
    if (!norm(b.evidence).includes(norm(b.label))) missing.push(`記号の無い列の原文「${b.evidence}」に氏名「${b.label}」が含まれません`);
    // 議長として外すなら、原文が議長であることを言っていること（氏名だけだと別の議員にすり替えても通る＝レビューで7団体実測）
    // 「副議長」も「議長」の字を含むので、取り除いてから探す（副議長を議長として外す書き写しが通った＝2巡目のレビュー）
    const chairWord = (x: string) => norm(x).replace(/副議長/g, "").includes("議長");
    // 欠席・退席などで外すときも、原文がその事情を言っていること（氏名だけ・出席欄の「45番 佐藤なおみ」でも通った＝大田で実測）
    if (b.stance !== "議長" && !absenceEvidenceOk(b.evidence, b.label, b.stance)) {
      missing.push(`記号の無い列「${b.label}」を「${b.stance}」とする原文「${b.evidence}」は、「${b.stance}」の語が氏名の直前（25字以内・議席番号は1つまで）にありません`);
    }
    if (b.stance === "議長" && !chairWord(b.evidence)) {
      if (!b.evidenceHeading || !chairWord(b.evidenceHeading) || norm(b.evidenceHeading).includes("副議長")) {
        missing.push(`議長の原文「${b.evidence}」に「議長」の語がありません — 歴代議長の一覧なら evidenceHeading に見出しの原文を`);
      } else {
        // 見出しの後ろに原文があり、その間に「副議長」の語を挟まないこと（正副議長の一覧で副議長の欄を取らない）
        const hN = norm(b.evidenceHeading);
        const eN = norm(b.evidence);
        const ok = evViews.some((v) => {
          for (let h = v.text.indexOf(hN); h >= 0; h = v.text.indexOf(hN, h + 1)) {
            const e = v.text.indexOf(eN, h + hN.length);
            if (e >= 0 && !v.text.slice(h + hN.length, e).includes("副議長")) return true;
          }
          return false;
        });
        if (!ok) missing.push(`議長の原文「${b.evidence}」が見出し「${b.evidenceHeading}」の下（副議長の欄より前）にありません`);
      }
    }
    if (mf) cols.push({ label: b.label, faction: mf.display, member: mf.raw, stance: b.stance });
  }
  // 議員の列は1人1回まで
  const memberCols = cols.filter((c) => c.member).map((c) => norm(c.member!));
  if (new Set(memberCols).size !== memberCols.length) missing.push(`賛否の列に同じ議員が重複しています`);
  if (vo.basis === "member") {
    const seen = new Set(memberCols);
    const lacking = [...memberFaction.keys()].filter((m) => !seen.has(m));
    if (lacking.length) missing.push(`賛否の列に名簿の議員がいません: ${lacking.slice(0, 5).join("・")}`);
  } else {
    const covered = new Set(cols.map((c) => c.faction));
    const lacking = factions.filter((f) => !covered.has(f.name)).map((f) => f.name);
    if (lacking.length) missing.push(`賛否の列が覆っていない会派: ${lacking.join("・")}`);
    if (!cols.some((c) => c.stance === "議長") && !vo.noChairReason) {
      missing.push(`会派単位の表で議長が外れていません — blank（議長）で外すか、外せない理由を noChairReason に`);
    }
    // 会派の列は「会派の議席 − その会派で自分の列（議長・無所属など）を持つ議員」を数える（議長を二重・賛成に数えない）
    for (const f of factions) {
      const own = cols.filter((c) => c.faction === f.name && c.member).length;
      const fcols = cols.filter((c) => c.faction === f.name && !c.member).length;
      if (fcols > 1) missing.push(`会派「${f.name}」に会派の列が2つあります`);
      if (fcols === 0 && own !== f.seats) missing.push(`会派「${f.name}」は議員の列が ${own}人ぶんしか無く、議席 ${f.seats} を覆いません`);
    }
  }
  const countOf = (c: VoteCol) =>
    c.member ? 1 : (factions.find((f) => f.name === c.faction)?.seats ?? 0) - cols.filter((o) => o.faction === c.faction && o.member).length;
  if (vo.tally) {
    if (!has(vdoc.views, vo.tally.text)) missing.push(`${vf.filename}: 賛否の数の原文「${vo.tally.text}」が見つかりません`);
    for (const [st, n] of Object.entries(vo.tally.counts)) {
      const got = cols.filter((c) => c.stance === st).reduce((a, c) => a + countOf(c), 0);
      if (got !== n) missing.push(`賛否の数: ${st} は記号から ${got}、原典の印字は ${n}`);
    }
  }
  return { basis: vo.basis, sourceTitle: vo.title, sourceFile: vf.filename, columns: cols };
}

export function parseCouncilTranscribed(
  files: { path: string; filename: string }[],
  source: SourceEntry,
  /** ドライラン（`pipeline:try-council`）用。URL → 手元のファイル。本番は raw-meta の fetchedFrom で引く */
  resolveFile?: (url: string) => { path: string; filename: string } | undefined,
): CouncilCompositionDoc {
  const opt = optionsSchema.parse(source.parserOptions);
  const meta = resolveFile ? null : readRawMeta(source.id);
  if (!resolveFile && !meta) throw new Error(`${source.id}: raw-meta がありません（先に pipeline:fetch）`);
  const fileFor = (url: string) => {
    if (resolveFile) {
      const f = resolveFile(url);
      if (!f) throw new Error(`${source.id}: ${url} の手元のファイルがありません（spec の files に書く）`);
      return f;
    }
    const m = meta!.files.find((f) => f.fetchedFrom === url);
    const f = m && files.find((x) => x.filename === m.filename);
    if (!f) throw new Error(`${source.id}: ${url} の raw ファイルがありません`);
    return f;
  };
  const missing: string[] = [];
  const has = (views: { text: string }[], needle: string) => views.some((v) => v.text.includes(norm(needle)));
  const pageOf = (views: { page: number; text: string }[], needle: string) =>
    views.find((v) => v.text.includes(norm(needle)))?.page ?? null;

  // ---- 名簿 ----
  const rosterFile = fileFor(opt.roster.url);
  const roster = readDoc(rosterFile);
  {
    const pools = [roster.views, ...opt.factions.filter((f) => f.url).map((f) => readDoc(fileFor(f.url!)).views)];
    if (!pools.some((v) => has(v, opt.asOfText))) missing.push(`${rosterFile.filename}: 基準日「${opt.asOfText}」が本文に見つかりません`);
  }

  const allNames = opt.factions.map((f) => (f.nameParts ?? [f.name]).map(norm));
  /** 会派 i の範囲（モード×ページごと）。枠があれば切り出し、無ければ会派名から次の会派名まで */
  const sectionsOf = (i: number): string[] => {
    const f = opt.factions[i]!;
    // url と box の両方があれば、その URL の PDF を枠で切る（印西: 会派ページの本文全体だと他の会派の議員も入り、
    // 枠の外の照合が常に鳴る／枠の照合が効かないまま合流の書き写しが通る＝0.8.9・レビューで実測）
    const boxFile = f.url ? fileFor(f.url) : rosterFile;
    if (f.url && !f.box) {
      const doc = readDoc(boxFile);
      if (f.asOfText && !has(doc.views, f.asOfText)) missing.push(`${f.url}: 基準日「${f.asOfText}」が本文に見つかりません`);
      return doc.views.map((v) => v.text);
    }
    if (f.box) {
      if (!isPdf(boxFile)) throw new Error(`${source.id}: box は PDF の名簿にだけ使えます（${f.name}）`);
      if (f.url && f.asOfText && !has(readDoc(boxFile).views, f.asOfText)) missing.push(`${f.url}: 基準日「${f.asOfText}」が本文に見つかりません`);
      const [x, y, w, h] = f.box;
      const pg = String(f.page ?? 1);
      return ["-layout", "-raw"].map((mode) =>
        norm(pdftotext(boxFile.path, [mode, "-f", pg, "-l", pg, "-x", String(x), "-y", String(y), "-W", String(w), "-H", String(h)])),
      );
    }
    const head = allNames[i]![0]!;
    // 会派名が他の会派名の中に含まれる（豊中「無所属」⊂「大阪維新の会・無所属議員団」、吹田「参政党」⊂「吹田党・参政党議員団」）
    // とき、長い方の会派名の中の出現は区間の始まりにしない
    const longer = allNames.map((ns) => ns[0]!).filter((nm) => nm !== head && nm.includes(head));
    const insideLonger = (t: string, st: number) =>
      longer.some((nm) => {
        const off = nm.indexOf(head);
        return t.startsWith(nm, st - off);
      });
    const out: string[] = [];
    for (const v of roster.views) {
      for (let st = v.text.indexOf(head); st >= 0; st = v.text.indexOf(head, st + 1)) {
        if (insideLonger(v.text, st)) continue;
        const ends = allNames
          .map((ns, j) => (j === i ? -1 : v.text.indexOf(ns[0]!, st + head.length)))
          .filter((e) => e > st);
        out.push(v.text.slice(st, ends.length ? Math.min(...ends) : v.text.length));
      }
    }
    return out;
  };

  // 同じ名前の会派は、全部が independent のとき（一人会派・無所属を1人ずつ並べる型）だけ書ける（0.8.13）。
  // 区間方式で無会派を実在の会派名に書き換えると、同じ名前の区間に氏名があるので通った（静岡・茨城の巡で実測）
  for (const [n, fs] of Map.groupBy(opt.factions, (f) => norm(f.name))) {
    if (fs.length > 1 && fs.some((f) => !f.independent)) missing.push(`会派「${fs[0]!.name}」が ${fs.length} 回出ます — 同じ名前は independent の会派どうしでだけ書けます（${n}）`);
  }
  const seen = new Map<string, string>();
  const factions: CouncilFactionFact[] = opt.factions.map((f, i) => {
    const sections = sectionsOf(i);
    // 略称が「会派：○○」の形（名簿の欄見出しつき）なら、○○は会派名そのもの（0.8.13）。名前だけを名簿の
    // 別の欄（政党）の語に書き換えても、略称の照合と名前の出現の照合を両方通った（坂東で実測）
    // 欄見出しつきの略称は「会派：」だけ（「政党：公明党」に替えると見出しの照合を抜けた＝レビューで実測）
    // 1つでも「会派：」つきの略称があれば全部に求める（見出しを外した「公明党」は、名簿の「政党：公明党」に当たって通った＝2巡目のレビュー）
    const labelHead = f.label != null ? norm(f.label).match(/^([^：:]{1,8})[：:]/) : null;
    const headedRoster = opt.factions.some((g) => g.label != null && /^会派[：:]/.test(norm(g.label)));
    if (headedRoster && f.label != null && !labelHead) {
      missing.push(`${f.name}: 略称「${f.label}」に「会派：」がありません（同じ名簿のほかの略称は「会派：」つき）`);
    } else if (labelHead && labelHead[1] !== "会派") {
      missing.push(`${f.name}: 略称「${f.label}」の欄見出しは「会派：」だけ書けます（「${labelHead[1]}：」は会派の欄ではありません）`);
    } else if (labelHead && norm(f.label!).slice(labelHead[0].length) !== norm(f.name)) {
      missing.push(`${f.name}: 略称「${f.label}」は「会派：」の後ろが会派名と一致しません`);
    }
    // 無所属の枠も名前を照合する（0.8.12）。0.8.11 までは independent を飛ばしていて、枠・ページの方式では
    // 無所属の名前を実在の会派名に書き換えても、会派を independent にして「無会派」と書いても通った（愛知の巡のレビューで実測）
    // 名前の字が無い枠は、理由に枠の残り（枠の本文から所属議員の氏名を除いた字）を引用させる。引用はパーサが計算し直して
    // 突き合わせる — 自由記述のままだと、実在の会派の枠を「無会派」と書いて理由を足すだけで通った（2巡目のレビューで実測）。
    // 残りに他の会派の名前が入っていれば、枠の取り違えなので落とす
    if (f.nameAbsentReason) {
      if (!f.box) missing.push(`${f.name}: nameAbsentReason は枠（box）の会派にだけ書けます`);
      // -layout と -raw の両方の残りを切り詰めずに引用させる（先頭だけ・片方だけだと、枠を賛否の行まで伸ばして
      // -raw で会派名を記号の後ろへ押し出すと通った＝3巡目のレビュー）
      const rest = sections.map((s) => f.members.reduce((t, m) => t.split(norm(m)).join(""), s).trim());
      const part = (r: string) => (r ? `氏名のほか「${r}」だけ` : "氏名だけ");
      const quote = rest.every((r) => r === rest[0]) ? `枠の本文は${part(rest[0]!)}` : `枠の本文は -layout で${part(rest[0]!)}、-raw で${part(rest[1]!)}`;
      if (!f.nameAbsentReason.includes(quote)) {
        missing.push(`${rosterFile.filename}: factions[${i}]「${f.name}」の nameAbsentReason は枠の残りを引用すること（「${quote}」を含める）`);
      }
      allNames.forEach((ns, j) => {
        if (j === i) return;
        for (const part of ns) if (rest.some((r) => r.includes(part))) missing.push(`${rosterFile.filename}: 会派「${f.name}」の枠に会派名「${part}」が入っています（枠か書き写しの誤り）`);
      });
      // 枠の端を会派名の行の内側へずらすと、引用は氏名だけになって会派の取り違えが通る（4巡目のレビュー: 瀬戸・日進・西尾・稲沢で実測）。
      // 名前を照合している同じファイル・同じページの枠と縦（y・h）か横（x・w）の範囲がそろっていること。そろわなければ、兄弟の枠の端から
      // この枠までの帯に字が無いこと（会派名がはみ出していないこと）。兄弟はページで絞らない — 表頭が全ページに同じ座標で繰り返す
      // 賛否表では、枠のページを変えると兄弟が0件になって帯の照合が抜けた（5巡目のレビュー: 西尾・日進）
      if (f.box) {
        const [x, y, w, h] = f.box;
        const sibs = opt.factions
          .filter((g) => g.box && !g.nameAbsentReason && (g.url ?? null) === (f.url ?? null))
          .map((g) => ({ b: g.box!, page: g.page ?? 1 }));
        if (!sibs.length) {
          if (!f.noSiblingReason) missing.push(`${rosterFile.filename}: 会派「${f.name}」の枠と同じファイルに名前を照合している枠が無い（noSiblingReason が要る）`);
        } else {
          const same = sibs.filter((s) => s.page === (f.page ?? 1)).map((s) => s.b);
          const all = sibs.map((s) => s.b);
          const yAligned = same.some((b) => b[1] === y && b[3] === h);
          const xAligned = same.some((b) => b[0] === x && b[2] === w);
          const pg = String(f.page ?? 1);
          const crop = (bx: number, by: number, bw: number, bh: number) =>
            bw <= 0 || bh <= 0 ? "" : norm(pdftotext((f.url ? fileFor(f.url) : rosterFile).path, ["-raw", "-f", pg, "-l", pg, "-x", String(bx), "-y", String(by), "-W", String(bw), "-H", String(bh)])).trim();
          // 帯から議員の氏名・無所属の呼び名・数字と記号を除いて、字が残れば会派名のはみ出しとみなす
          const allMembers = opt.factions.flatMap((g) => g.members.map(norm)).sort((p, q) => q.length - p.length);
          const strip = (t: string) =>
            [...allMembers, ...INDEPENDENT_NAMES.map(norm).sort((p, q) => q.length - p.length)].reduce((u, n) => u.split(n).join(""), t).replace(/[\d０-９()（）、。,.・\s期人名]/g, "");
          const bands: string[] = [];
          if (!yAligned && xAligned) {
            // 会派ごとの塊が縦に積まれる名簿（安城）: すぐ上の塊の下端からこの枠の上端までの帯（会派名「（N人）」の行）を見る
            // （x・w がそろうだけだと、上端を下げて会派名を外しても通った＝5巡目のレビュー）
            // すぐ上の塊は同じ列のどの会派の枠でもよい（無所属の塊が続く安城で、上の無所属の議員の役職の行まで帯に入っていた）
            const column = opt.factions.filter((g) => g !== f && g.box && (g.url ?? null) === (f.url ?? null) && (g.page ?? 1) === (f.page ?? 1)).map((g) => g.box!);
            const above = column.filter((b) => b[0] === x && b[2] === w && b[1] + b[3] <= y);
            const bottom = above.length ? Math.max(...above.map((b) => b[1] + b[3])) : Math.min(...all.map((b) => b[1]));
            bands.push(crop(x, bottom, w, y - bottom));
          } else if (!yAligned) {
            const top = Math.min(...all.map((b) => b[1]));
            const left = Math.min(...all.map((b) => b[0]));
            // 兄弟の枠が y をそろえていれば会派が列に並ぶ表（上の帯に会派名）、x をそろえていれば行に並ぶ表（左の帯に会派名）
            const cols = all.some((b) => all.some((c) => c !== b && c[1] === b[1]));
            const rows = all.some((b) => all.some((c) => c !== b && c[0] === b[0]));
            if (cols || !rows) bands.push(crop(x, top, w, y - top));
            if (rows || !cols) bands.push(crop(left, y, x - left, h));
          }
          const left = bands.map(strip).filter(Boolean);
          if (left.length) missing.push(`${rosterFile.filename}: 会派「${f.name}」の枠は名前を照合している枠と範囲がそろわず、兄弟の枠の端からこの枠までの帯に字がある（「${left.join("」「")}」）`);
        }
      }
    }
    if (!opt.noFactions && !f.nameAbsentReason) {
      for (const part of allNames[i]!) {
        if (!sections.some((s) => s.includes(part))) missing.push(`${rosterFile.filename}: 会派名「${part}」が${f.box ? "枠" : "本文"}に見つかりません`);
      }
      // 枠には他の会派の名前も入らないこと（上の会派の枠を伸ばして下の会派名の行を飲み込み、下の会派を無所属へ取り違えると通った＝6巡目のレビュー）。
      // 自分の名前に含まれる名前（「無所属」⊂「無所属議員の会」）と、縦書きを1字ずつに割った nameParts（戸田「り」）は数えない
      if (f.box) {
        const own = allNames[i]!;
        allNames.forEach((ns, j) => {
          if (j === i || opt.factions[j]!.nameAbsentReason) return;
          for (const part of ns) {
            if (part.length < 2 || own.some((o) => o.includes(part))) continue;
            if (sections.some((s) => s.includes(part))) missing.push(`${rosterFile.filename}: 会派「${f.name}」の枠に会派名「${part}」が入っています（枠か書き写しの誤り）`);
          }
        });
      }
    }
    for (const m of f.members) {
      const key = norm(m);
      const dup = seen.get(key);
      if (dup) missing.push(`議員「${m}」が「${dup}」と「${f.name}」に重複`);
      seen.set(key, f.name);
      if (f.label != null) {
        // 氏名の直後で最初に出る会派の略称がこの会派のものであること（略称どうしの部分一致は長い方を優先）
        const labels = opt.factions.filter((g) => g.label).map((g) => norm(g.label!)).sort((x, y) => y.length - x.length);
        const LW = opt.labelWindow ?? 20;
        const labelViews = opt.labelUrl ? readDoc(fileFor(opt.labelUrl)).views : roster.views;
        const ok = labelViews.some((v) => {
          for (let at = v.text.indexOf(key); at >= 0; at = v.text.indexOf(key, at + 1)) {
            const w = v.text.slice(at + key.length, at + key.length + LW);
            let best: { pos: number; lab: string } | null = null;
            for (const lab of labels) {
              // 原典で直前に「会派」以外の欄見出し（「政党：」）が付いた出現は略称に数えない（0.8.13）。書き写しの略称から
              // 「会派：」を全部外し、会派名を政党の欄の語にすると通った（坂東・3巡目のレビュー）
              for (let pos = w.indexOf(lab); pos >= 0; pos = w.indexOf(lab, pos + 1)) {
                // 直前の欄（「政党:」「会派:」）の中の出現は、欄の頭から始まり、その欄が「会派」のときだけ数える
                // （「会派:坂東市公明党」の中の「公明党」も数えない）
                const abs = at + key.length + pos;
                const field = v.text.slice(Math.max(0, abs - 30), abs).match(/(会派名?|政党|党派|所属)[：:]([^：:]*)$/);
                if (field && !/^(会派名?|政党|党派|所属)[：:]/.test(lab) && (field[2] !== "" || !field[1].startsWith("会派"))) continue;
                if (best == null || pos < best.pos) best = { pos, lab };
                break;
              }
            }
            if (best?.lab === norm(f.label!)) return true;
          }
          return false;
        });
        if (!ok) missing.push(`${opt.labelUrl ?? rosterFile.filename}: 議員「${m}」の直後${LW}字の会派の略称が「${f.label}」ではありません`);
      } else if (!sections.some((s) => s.includes(key))) {
        missing.push(`${rosterFile.filename}: 議員「${m}」が会派「${f.name}」の${f.box ? "枠" : "区間（会派名から次の会派名まで）"}に見つかりません`);
      }
    }
    // 同じ略称を持つ会派（熊本の無所属を1人ずつ並べる場合）は合計で照合する。最初の会派でだけ数える
    if (f.label != null && opt.labelSuffix && opt.factions.findIndex((g) => g.label === f.label) === i) {
      const lab = norm(f.label);
      const pat = lab + norm(opt.labelSuffix);
      const expect = opt.factions.filter((g) => g.label === f.label).reduce((a, g) => a + g.members.length, 0);
      // 長い略称が短い略称で終わる（「熊本自民」と「自民」）ときに二重に数えないよう、直前の字で区切る
      const longer = opt.factions.filter((g) => g.label && norm(g.label) !== lab && norm(g.label).endsWith(lab)).map((g) => norm(g.label!));
      const cnt = Math.max(
        ...roster.views.map((v) => {
          let c = 0;
          for (let at = v.text.indexOf(pat); at >= 0; at = v.text.indexOf(pat, at + 1)) {
            if (!longer.some((o) => v.text.slice(Math.max(0, at - (o.length - lab.length)), at).concat(lab) === o)) c++;
          }
          return c;
        }),
      );
      if (cnt !== expect) missing.push(`${rosterFile.filename}: 略称「${f.label}${opt.labelSuffix}」は名簿に ${cnt} 回、書き写しは ${expect}人`);
    }
    // 枠のときは、他の会派の議員が枠に入っていないこと（書き写しの会派違いを両側から捕まえる）
    if (f.box) {
      opt.factions.forEach((g, j) => {
        if (j === i) return;
        for (const m of g.members) {
          if (sections.some((s) => s.includes(norm(m)))) {
            missing.push(`${rosterFile.filename}: 会派「${f.name}」の枠に「${g.name}」の議員「${m}」が入っています（枠か書き写しの誤り）`);
          }
        }
      });
    }
    if (f.declared != null) {
      const n = declaredNumber(f.declared);
      if (n == null) missing.push(`${f.name}: declared「${f.declared}」から人数を1つに読めません`);
      else {
        const ex = f.declaredExcludes ?? [];
        for (const e of ex) if (!f.members.some((m) => norm(m) === norm(e))) missing.push(`${f.name}: declaredExcludes「${e}」が members にありません`);
        if (n !== f.members.length - ex.length) missing.push(`${f.name}: 名簿の印字は ${n}人、書き写しは ${f.members.length - ex.length}人${ex.length ? `（${ex.join("・")}を除く）` : ""}`);
      }
      const dN = norm(f.declared!);
      if (f.declaredIn) {
        // 別の原典では区間が無いので、印字は**会派の名前（略称）ごと**書かせる（「（1）」だけだと本文のどこかの数字に当たる。
        // 広島の 1人会派が5つ並ぶ型でレビューが指摘）
        if (![norm(f.name), ...(f.abbr ? [norm(f.abbr)] : [])].some((nm) => dN.startsWith(nm))) {
          missing.push(`${f.name}: declaredIn の declared「${f.declared}」は会派名か略称（abbr）で始める（入れ替えを捕まえるため）`);
        }
        if (!has(readDoc(fileFor(f.declaredIn)).views, f.declared!)) missing.push(`${f.declaredIn}: 会派「${f.name}」の人数の印字「${f.declared}」が見つかりません`);
      } else if (f.box || f.url) {
        if (!sections.some((s) => s.includes(dN))) missing.push(`${rosterFile.filename}: 会派「${f.name}」の人数の印字「${f.declared}」が${f.box ? "枠" : "ページ"}に見つかりません`);
      } else {
        // 区間方式では会派名の直後 80 字に限る（「（1）」が区間内の別の数字に当たらないように）
        const head = allNames[i]![0]!;
        if (!sections.some((s) => s.startsWith(head) && s.slice(0, head.length + 80).includes(dN))) {
          missing.push(`${rosterFile.filename}: 会派「${f.name}」の人数の印字「${f.declared}」が会派名の直後80字に見つかりません`);
        }
      }
    }
    const page = isPdf(rosterFile) ? (f.page ?? pageOf(roster.views, f.members[0]!)) : null;
    return {
      name: f.independent && f.members.length === 1 ? `${f.name}（${f.members[0]}）` : f.name,
      seats: f.members.length,
      isIndependent: !!f.independent,
      members: f.members,
      locator: { file: rosterFile.filename, ...(page != null ? { page } : { row: i + 1 }) },
    };
  });
  const seats = factions.reduce((s, f) => s + f.seats, 0);
  // 人数の網（印字・定数・略称の数）がどこにも無い書き写しは通さない — 1人の書き落としが誰にも捕まらない
  const unguarded = opt.factions.filter((f) => f.declared == null && !(f.label != null && opt.labelSuffix) && !f.noCountReason);
  if (unguarded.length && opt.teisu == null) {
    missing.push(`人数の網が無い会派があります（${unguarded.map((f) => f.name).join("・")}）— declared か teisu か labelSuffix が要ります`);
  }
  // 議会全体の人数の網
  const countIn = (views: { text: string }[], re: string) => Math.max(0, ...views.map((v) => (v.text.match(new RegExp(re, "g")) ?? []).length));
  const rosterAll = [...roster.views, ...opt.factions.filter((f) => f.url).flatMap((f) => readDoc(fileFor(f.url!)).views)];
  if (opt.memberMarker) {
    const views = opt.memberMarkerUrl ? readDoc(fileFor(opt.memberMarkerUrl)).views : roster.views;
    const ex = opt.memberMarkerExcludes ?? [];
    const all = opt.factions.flatMap((f) => f.members.map(norm));
    for (const e of ex) if (!all.includes(norm(e))) missing.push(`memberMarkerExcludes「${e}」が members にありません`);
    const c = countIn(views, opt.memberMarker);
    if (c + ex.length !== seats) {
      missing.push(`議員ごとの印「${opt.memberMarker}」は ${c} 回${ex.length ? `＋印の無い ${ex.length}人` : ""}、書き写しは ${seats}人`);
    }
  }
  if (opt.factionMarker) {
    const c = countIn(roster.views, opt.factionMarker);
    const n = new Set(opt.factions.map((f) => f.name)).size;
    if (c !== n) missing.push(`${rosterFile.filename}: 会派ごとの印「${opt.factionMarker}」は名簿に ${c} 回、書き写しは ${n}会派`);
  }
  if (opt.totalText) {
    const tv = opt.totalText.url ? readDoc(fileFor(opt.totalText.url)).views : rosterAll;
    if (!has(tv, opt.totalText.text)) missing.push(`総数の原文「${opt.totalText.text}」が見つかりません`);
    if (declaredNumber(opt.totalText.text) !== seats) missing.push(`総数の原文「${opt.totalText.text}」の数が現員 ${seats} と合いません`);
  }
  if (opt.teisu == null && !opt.memberMarker && !opt.factionMarker && !opt.totalText && !opt.noTotalReason) {
    missing.push(`議会全体の人数の網がありません — teisu・memberMarker・factionMarker・totalText のどれか（無理なら noTotalReason）`);
  }
  if (opt.roster.linkedFrom) {
    const lf = opt.roster.linkedFrom;
    if (!has(readDoc(fileFor(lf.url)).views, lf.text)) missing.push(`${lf.url}: 名簿へのリンク「${lf.text}」が見つかりません`);
  }

  // 議決当日の資料に全議員が出ること（議決時点の在籍の裏付け）
  for (const u of opt.roster.confirmUrls ?? []) {
    const cf = fileFor(u);
    const doc = readDoc(cf);
    for (const f of opt.factions) {
      for (const m of f.members) if (!has(doc.views, m)) missing.push(`${cf.filename}: 議員「${m}」が議決当日の資料に見つかりません`);
    }
  }

  // ---- 議決 ----
  const r = opt.resolution;
  // 画面は「その予算を議決した議会」として出すので、当初の一般会計予算の議決に限る（別の議案の正しい事実を拒む）
  // 「…一般会計予算に対する修正案」も一般会計予算の字を含むので拒む（件名を修正案に書き換えて否決の議決が通った＝レビュー2巡目）
  if (!norm(r.billName).includes("一般会計予算") || /補正|修正案|修正動議|に対する|附帯決議/.test(norm(r.billName))) {
    missing.push(`件名「${r.billName}」は当初の一般会計予算ではありません`);
  }
  const resultFile = fileFor(r.url);
  const mainResult = readDoc(resultFile);
  const resultViews = [
    ...mainResult.views,
    // 補助の原典はページ番号を持たせない（locator は主の原典の範囲だけ）
    ...(r.alsoUrls ?? []).flatMap((u) => readDoc(fileFor(u)).views.map((v) => ({ page: 0, text: v.text }))),
  ];

  if (opt.teisu != null) {
    if (!opt.teisuText) throw new Error(`${source.id}: teisu には teisuText（原典の表記）が要ります`);
    const tv = opt.teisuUrl ? readDoc(fileFor(opt.teisuUrl)).views : [...roster.views, ...resultViews];
    if (!has(tv, opt.teisuText)) missing.push(`定数の表記「${opt.teisuText}」が原典に見つかりません`);
    // 定数の数そのものも原文に結び付ける（0.8.15・佐久で実測: 1人を書き落として teisu を 1 減らすと、teisuText が原典にあるだけで通った）。
    // 現員・在籍・出席・欠員の直後の数は定数に数えない（レビューで実測: 牛久「現員数は２１名（定数２２名」で teisu を現員の 21 にして
    // 1人を書き落とすと、欠員 1 との引き算が合って通った）
    const teisuN = norm(opt.teisuText);
    // 表の見出しが「条例定数 現員数 19人 19人」と並ぶ型（十日町）は、直前に「定数」もあるので数える
    const teisuNums = [...teisuN.matchAll(/\d+/g)].filter((m) => {
      const pre = teisuN.slice(Math.max(0, m.index! - 6), m.index!);
      return pre.includes("定数") || !/(現員|現在数|在籍|出席|欠員)/.test(pre);
    });
    if (!teisuNums.some((m) => Number(m[0]) === opt.teisu)) {
      missing.push(`teisu ${opt.teisu} が teisuText「${opt.teisuText}」の定数の数字にありません（原典の数を算用数字で含む表記を書く。現員・在籍・出席・欠員の直後の数は数えない）`);
    }
    if ((opt.vacancies ?? 0) > 0 && opt.vacanciesTexts?.length) {
      const vv = opt.vacanciesUrl ? readDoc(fileFor(opt.vacanciesUrl)).views : tv;
      let sum = 0;
      if (new Set(opt.vacanciesTexts.map(norm)).size !== opt.vacanciesTexts.length) missing.push(`vacanciesTexts に同じ原文が重複しています`);
      for (const t of opt.vacanciesTexts) {
        if (!has(vv, t)) missing.push(`欠員の表記「${t}」が原典に見つかりません`);
        const m = norm(t).match(/欠員(\d+)/);
        if (!m) missing.push(`vacanciesTexts「${t}」に「欠員N」がありません`);
        else sum += Number(m[1]);
      }
      if (sum !== opt.vacancies) missing.push(`vacanciesTexts の欠員の和 ${sum} が vacancies ${opt.vacancies} と合いません`);
    } else if ((opt.vacancies ?? 0) > 0) {
      if (!opt.vacanciesText) throw new Error(`${source.id}: vacancies には vacanciesText（原典の表記）が要ります`);
      const vv = opt.vacanciesUrl ? readDoc(fileFor(opt.vacanciesUrl)).views : tv;
      if (!has(vv, opt.vacanciesText)) missing.push(`欠員の表記「${opt.vacanciesText}」が原典に見つかりません`);
      const places = opt.vacanciesPlaces ?? [];
      if (places.length && !norm(opt.vacanciesText).includes("それぞれ")) missing.push(`vacanciesPlaces は「それぞれ」を含む原文にだけ使う`);
      for (const pl of places) if (!norm(opt.vacanciesText).includes(norm(pl))) missing.push(`vacanciesText に地名「${pl}」がありません`);
      const per = declaredNumber(opt.vacanciesText);
      if (per == null || per * Math.max(1, places.length) !== opt.vacancies) {
        missing.push(`vacanciesText「${opt.vacanciesText}」${places.length ? `× ${places.length}か所` : ""}が欠員 ${opt.vacancies} と合いません`);
      }
    }
    const expect = opt.teisu - (opt.vacancies ?? 0);
    if (seats !== expect) missing.push(`現員 ${seats} が 定数 ${opt.teisu} − 欠員 ${opt.vacancies ?? 0} = ${expect} と合いません（書き落とし？）`);
  }

  // 議案番号は件名の**直前**、結果・議決月日は件名の**直後**だけを見る（2026-10-01）。
  // 一覧には別の議案が並ぶので「本文のどこかにある」では誤りが素通りし（笛吹で「議案第19号」が通った）、
  // 前後で見ると隣の行の値に当たる（直前の議案の議決日「3月12日」が通った・レビューで実測）。
  // 原典の組版で件名から離れる項目だけ `farOk` で外す（外した項目は本文のどこかにあることだけを見る）。
  const BEFORE = 20;
  const AFTER = r.afterWindow ?? 60;
  const nameN = norm(r.billName);
  const billNoN = norm(r.billNo);
  /**
   * 件名の出現のうち、予算そのものでなく「予算に対する修正案・附帯決議」の行（件名の直後に「に対する」「修正案」等が続く）は数えない。
   * 加須・朝霞は修正案の行（否決）が予算の件名を前方一致で含み、結果を「否決」と書いても通った（レビューで実測）
   */
  const notAmend = (after: string) => !isAmendTail(nameN, after);
  /** 件名の出現のうち、直前に議案番号があるもの（farOk の billNo なら全出現） */
  const anchors: { text: string; at: number; page: number }[] = [];
  for (const v of resultViews) {
    for (let i = v.text.indexOf(nameN); i >= 0; i = v.text.indexOf(nameN, i + 1)) {
      if (!notAmend(v.text.slice(i + nameN.length))) continue;
      // 「1」「議1」のような短い番号は直前の数字に紛れるので、件名の**すぐ前**（番号の長さ＋2字）に限る
      const win = billNoN.length <= 3 ? billNoN.length + 2 : BEFORE;
      // 件名が議案番号で始まる書き方（南アルプス「議案26一般会計予算」）のときだけ件名の頭も窓に含める。
      // 「件名のどこかに番号の字がある」で広げると、1桁の番号が「令和８年度」の８に当たる（草加で実測）
      const before = v.text.slice(Math.max(0, i - win), i + (nameN.startsWith(billNoN) ? billNoN.length : 0));
      if (r.farOk?.includes("billNo") || nearestBillNo(before, billNoN)) anchors.push({ text: v.text, at: i, page: v.page });
    }
  }
  if (!resultViews.some((v) => v.text.includes(nameN))) {
    missing.push(`${resultFile.filename}: 件名「${r.billName}」が本文に見つかりません`);
  } else if (anchors.length === 0 && !r.table) {
    missing.push(`${resultFile.filename}: 議案番号「${r.billNo}」が件名の直前${BEFORE}字に見つかりません`);
  }
  if (r.farOk?.includes("billNo") && !has(resultViews, r.billNo)) {
    missing.push(`${resultFile.filename}: 議案番号「${r.billNo}」が本文に見つかりません`);
  }
  const after = (needle: string, what: string, key: "result" | "decidedDate") => {
    const n = norm(needle);
    if (key === "decidedDate" && r.farOk?.includes(key)) {
      if (!r.decidedDateText) throw new Error(`${source.id}: farOk の decidedDate には decidedDateText（原典の前後の字ごと）が要ります`);
      // 月日が**ちょうど1つ**の原文に限る（「2月20日〜3月23日開催」なら会期の初日でも通ってしまう）
      const dates = dateTokens(r.decidedDateText);
      if (dates.length !== 1 || dates[0] !== n) {
        missing.push(`decidedDateText「${r.decidedDateText}」は議決月日「${needle}」をただ1つ含む原文にする（含む月日: ${dates.join("・") || "なし"}）`);
      }
      if (!has(resultViews, r.decidedDateText)) missing.push(`${resultFile.filename}: ${what}「${r.decidedDateText}」が本文に見つかりません`);
      return;
    }
    if (r.table) return; // 表の照合で見る
    // 議決日は「M月D日」のほか「8.3.26」「R8.3.27」「3/24」の形でも窓の中にあればよい（札幌の表の議決日の欄）
    const inWin = (w: string) => w.includes(n) || (key === "decidedDate" && dateTokens(w).includes(n));
    if (anchors.length && !anchors.some((a) => inWin(a.text.slice(a.at + nameN.length, a.at + nameN.length + AFTER)))) {
      missing.push(`${resultFile.filename}: ${what}「${needle}」が件名の直後${AFTER}字に見つかりません`);
    }
  };
  // ---- 結果 ----
  const resultN = norm(r.result);
  // 結果を見る起点。議案番号が補助の原典にしか無い（北杜）と、主の原典の件名は議案番号つきの起点に
  // 入らない。主の原典に起点が無ければ、主の原典での件名の出現を起点にする
  const mainAnchors = anchors.filter((a) => a.page > 0);
  const resAnchors = mainAnchors.length
    ? mainAnchors
    : mainResult.views.flatMap((v) => {
        const out: { text: string; at: number; page: number }[] = [];
        for (let i = v.text.indexOf(nameN); i >= 0; i = v.text.indexOf(nameN, i + 1)) if (notAmend(v.text.slice(i + nameN.length))) out.push({ text: v.text, at: i, page: v.page });
        return out;
      });
  if (r.table) {
    // HTML の表: 件名のセルと同じ行（列）のセルに、議案番号・結果（セル全体が一致）・議決日があること
    if (isPdf(resultFile)) throw new Error(`${source.id}: table は HTML の議決結果にだけ使えます`);
    const md = `${Number(r.decidedDate.slice(5, 7))}月${Number(r.decidedDate.slice(8, 10))}日`;
    const farDate = r.farOk?.includes("decidedDate");
    let found = false;
    for (const t of htmlTables(readHtml(resultFile.path))) {
      t.forEach((row, ri) =>
        row.forEach((cell, ci) => {
          if (!cell.includes(nameN) || !notAmend(cell.slice(cell.indexOf(nameN) + nameN.length))) return;
          const line = r.table === "row" ? t[ri]! : t.map((rw) => rw[ci] ?? "");
          // 番号が件名と同じセルの頭に入る原典がある（熊本「議第３号 令和８ 年度熊本市一般会計予算」）
          const okNo = r.farOk?.includes("billNo") || line.some((c) => c === billNoN || (c.includes(nameN) && c.startsWith(billNoN)));
          const okRes = line.some((c) => c === resultN);
          const okDate = farDate || line.some((c) => (r.decidedDateText ? c.includes(norm(r.decidedDateText)) : true) && dateTokens(c).includes(md));
          if (okNo && okRes && okDate) found = true;
        }),
      );
    }
    if (!found) {
      missing.push(
        `${resultFile.filename}: 表で件名「${r.billName}」と同じ${r.table === "row" ? "行" : "列"}に議案番号「${r.billNo}」・結果「${r.result}」${farDate ? "" : `・議決日「${md}」`}のセルがそろいません`,
      );
    }
  } else if (r.resultBlock) {
    // 件名が見出し（例: ◆全会一致で承認・可決・同意した議案）の一覧に属すること
    const headN = norm(r.resultBlock.heading);
    if (!headN.includes(resultN)) missing.push(`結果「${r.result}」が見出し「${r.resultBlock.heading}」の語ではありません`);
    // 見出しに含まれる結果語のうち最長のものと一致すること（「修正可決確定した議案」に「可決」は丸め・明石で実測）
    const words = [...headN.matchAll(/原案のとおり可決|原案どおり可決|原案可決|修正可決|可決|否決/g)].map((m) => m[0]);
    const longest = words.filter((w) => !words.some((o) => o !== w && o.includes(w)));
    if (longest.length && !longest.includes(resultN)) missing.push(`結果「${r.result}」は見出しの結果語「${longest.join("・")}」を丸めています`);
    // 見出しは「承認・可決・同意」のように複数の語を並べる。予算の議決に当たる語だけを許す
    if (!/^(原案のとおり可決|原案どおり可決|原案可決|修正可決|可決|否決)$/.test(resultN)) missing.push(`結果「${r.result}」は予算の議決の語ではありません`);
    // ⚠ 見出しと一覧の並び順は抽出モードで変わる（-layout と -raw で見出しが一覧の前にも後にも出る）ので、
    //   「見出しの前に件名がある」では帰属を縛れない（2026-10-01 に実測）。代わりに、件名と同じ本文に見出しがあり、
    //   **件名の直後に結果語が無い**（＝自前の結果を持つ賛否表の行ではない）ことを見る。南アルプスの議案27は
    //   同じページの賛否表に「議案27 国民健康保険特別会計予算 可決 〇〇×…」と出るのでここで落ちる
    // 見出しを原典より短く書き写す（「修正可決確定した議案」を「可決確定した議案」と書く）と最長語の照合をすり抜けるので、
    // 本文で見出しの直前が結果語の接頭辞（原案のとおり・原案・修正）で終わっていたら throw（2巡目のレビュー）
    const headCut = resAnchors.some((a) => {
      for (let i = a.text.indexOf(headN); i >= 0; i = a.text.indexOf(headN, i + 1)) {
        if (/(原案のとおり|原案どおり|原案|修正)$/.test(a.text.slice(Math.max(0, i - 6), i))) return true;
      }
      return false;
    });
    if (headCut) missing.push(`見出し「${r.resultBlock.heading}」が原典より短い（直前に「原案」「修正」などがある）`);
    const ok = resAnchors.some((a) => {
      if (!a.text.includes(headN)) return false;
      const w = a.text.slice(a.at + nameN.length, a.at + nameN.length + AFTER);
      return !/原案可決|修正可決|可決|否決/.test(w);
    });
    if (!ok) missing.push(`${resultFile.filename}: 件名が見出し「${r.resultBlock.heading}」の一覧に属していません`);
  } else {
    // 結果は原典の語のまま — 窓の中で件名に最も近い結果語が、書き写した語と同じであること
    // 「原案どおり可決」（可児）も原典の語のまま書く（0.8.15・それまでは「可決」に丸めて書くしかなかった）
    const RE = /原案のとおり可決|修正のとおり可決|原案どおり可決|修正どおり可決|原案可決|修正可決|可決|否決|承認|同意|認定|採択/g;
    const ok = resAnchors.some((a) => {
      if (r.resultSide === "before") {
        const w = a.text.slice(Math.max(0, a.at - BEFORE), a.at);
        const all = [...w.matchAll(RE)];
        return all.length > 0 && all[all.length - 1]![0] === resultN;
      }
      const w = a.text.slice(a.at + nameN.length, a.at + nameN.length + AFTER);
      // 「附帯決議を付して修正可決」のように結果語の前に句が付く原典がある（名古屋）。最も近い結果語が
      // 書き写した結果の末尾と同じで、書き写した結果そのものが窓にあること
      // 結果語の後ろの括弧書き（盛岡「可決(多数)」・前橋）だけは書き写してよい。前置き（「附帯決議を付して修正可決」）は
      // 近接では「修正可決」との区別が付かない（レビューで実測）ので、表（セル全体の一致）でだけ認める
      const at = m0Index(w, RE);
      if (at == null) return false;
      const m = at.word;
      // 原典が結果語の直後に括弧書き（「可決（多数）」）を付けているなら、それも書き写すこと（丸めない・大分で実測）
      // 括弧の中が日付（つくば「原案可決(3/25)」）なら結果語の一部ではない
      if (m === resultN) {
        const sfx = w.slice(at.index + m.length).match(/^[(（]([^)）]{1,10})[)）]/);
        return !sfx || /^\d{1,2}[/月.]\d{1,2}日?$/.test(sfx[1]!);
      }
      return resultN.startsWith(m) && /^[(（][^)）]{1,10}[)）]$/.test(resultN.slice(m.length)) && w.slice(at.index).startsWith(resultN);
    });
    const side = r.resultSide === "before" ? `直前${BEFORE}字` : `直後${AFTER}字`;
    if (!ok) missing.push(`${resultFile.filename}: 結果「${r.result}」が件名の${side}で最も近い結果語と一致しません`);
  }
  if (!has(resultViews, r.sessionLabel)) missing.push(`${resultFile.filename}: 会期「${r.sessionLabel}」が本文に見つかりません`);
  const [, mo, d] = r.decidedDate.split("-").map(Number) as [number, number, number];
  after(`${mo}月${d}日`, "議決月日", "decidedDate");
  if (opt.asOf > r.decidedDate) {
    missing.push(`名簿の基準日 ${opt.asOf} が議決日 ${r.decidedDate} より後（議決時点の名簿ではない）`);
  }

  // ---- 賛否（0.6.0〜・照合は verifyVotes） ----
  let votesOut: VotesOut | undefined;
  let partsOut: (VotesOut & { part: string })[] | undefined;
  if (opt.votes && opt.votesParts) throw new Error(`${source.id}: votes と votesParts は同時に使わない`);
  const vctx: VotesCtx = { sourceId: source.id, factionsOpt: opt.factions, factions, rosterViews: roster.views, fileFor, missing, bill: { billNo: r.billNo, billName: r.billName } };
  if (opt.votes) votesOut = verifyVotes(vctx, opt.votes);
  if (opt.votesParts) {
    partsOut = opt.votesParts.map((vp) => {
      const out = verifyVotes(vctx, vp);
      // その採決が「どの部分」か: partText が anchor に含まれること。
      // 「anchor の前後40字」では、2つの採決の行が隣り合う原典で part の入れ替えが通る（松本・奈良で実測）
      // 例外は anchor が partText の一部で、partText が原典に続けて出るとき（明石: -layout で「修正部分を／除いた原案」が
      // 記号の行の上下に割れるので anchor は「除いた原案」、-raw では続けて出る）
      const pN = norm(vp.partText);
      const aN = norm(vp.anchor);
      // 例外経路の partText は anchor より10字を超えて長くしない（遠くの語まで伸ばせると part の判定をすり替えられる）
      const bound = (aN.includes(pN) && pN.length > 0) || (pN.includes(aN) && pN.length <= aN.length + 10 && readDoc(fileFor(vp.url)).views.some((v) => v.text.includes(pN)));
      if (!bound) missing.push(`採決「${vp.part}」の原文「${vp.partText}」が予算の行の語（anchor「${vp.anchor}」）に含まれません`);
      // part（画面の名前）は partText から決まること。part だけを入れ替えると修正案と原案の賛否が画面で逆になる（レビューで実測）
      // 判定は anchor（記号の並びを読んだ行の語）と partText の両方で一致すること。partText だけだと遠くの「除」で入れ替えが通った（レビュー2巡目）
      const isRest = pN.includes("除") && aN.includes("除");
      const isAmend = !pN.includes("除") && !aN.includes("除") && pN.includes("修正");
      if ((vp.part === "修正部分を除く原案" && !isRest) || (vp.part === "修正案" && !isAmend))
        missing.push(`採決「${vp.part}」と原文「${vp.partText}」が合いません（「修正部分を除く原案」は「除」を含む原文、「修正案」は「除」を含まず「修正」を含む原文）`);
      return { part: vp.part, ...out };
    });
    if (new Set(partsOut.map((p) => p.part)).size !== partsOut.length) missing.push(`votesParts の part が重複しています`);
  }

  if (missing.length) throw new Error(`${source.id}: 書き写しが原典と合いません\n  - ${missing.join("\n  - ")}`);

  // 議案番号が補助の原典にしか無い原典（北杜）でも、結果を照合した主の原典の件名の位置をページにする
  const billPage = isPdf(resultFile) ? (anchors.find((a) => a.page > 0)?.page ?? resAnchors.find((a) => a.page > 0)?.page ?? null) : null;
  return {
    docType: "council-composition",
    sourceId: source.id,
    parser: source.parser,
    parserVersion: PARSER_VERSION,
    parsedAt: new Date().toISOString(),
    fiscalYear: source.fiscalYear,
    body: opt.body,
    seats,
    asOf: opt.asOf,
    ...(opt.teisu != null ? { teisu: opt.teisu } : {}),
    factions,
    ...(opt.noFactions ? { noFactions: true } : {}),
    resolution: {
      billNo: r.billNo,
      billName: r.billName,
      sessionLabel: r.sessionLabel,
      decidedDate: r.decidedDate,
      decidedDateLabel: toWareki(r.decidedDate),
      result: r.result,
      locator: { file: resultFile.filename, ...(billPage != null ? { page: billPage } : {}) },
    },
    ...(votesOut ? { votes: votesOut } : {}),
    ...(partsOut ? { votesParts: partsOut } : {}),
    rosterTitle: opt.roster.title,
    resultTitle: opt.resolution.title,
  };
}

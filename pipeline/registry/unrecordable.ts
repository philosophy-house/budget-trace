// 「調べたが収録できなかった」記録の台帳。
//
// これまで docs/data-sources.md にしか無かった判定を構造化して `/coverage` に出す。
// **読者にとって「まだ調べていない（×）」と「調べたが収録できない」は意味が全然違う** —
// 前者は ToDo、後者は一次資料そのものの事情なので、区別できないと空欄の意味が読めない。
//
// ---- 書くときのルール（守らないと台帳が嘘になる）----------------------------
//
// 1. **理由を創作しない。** docs/data-sources.md に書いてあることの転記だけにする。
//    「たぶんスキャンだから」のような推測を断定で書かない。理由が特定できていない年度は
//    **この台帳に載せない**（載せなければ `/coverage` では通常の × ＝ まだ調べていない扱いになる）。
//
// 2. **「できない」を永久の事実として書かない。** これは `checkedOn` 時点の実測記録である。
//    判定は実際にくつがえっている — 豊島区 R4・R2 と大田区 H27 は「ToUnicode 全面欠落で
//    修復不可」と書かれていたのが、共通の復号層（#159）でのちに収録できた。
//    → 文面は「この方法では取れなかった」であって「未来永劫取れない」ではない。
//
// 3. **団体コードは総務省の一次資料から引く**（`data/normalized/municipal-accounts/R6.json`）。
//    記憶や推測で書かない。実在する別自治体のコードを書いても誰も気づけない
//    （浜松市を静岡市のコードで登録して1人あたりを16.5%狂わせた前科がある）。
//    → derive が `name` と総務省台帳を突合し、食い違えば throw する。
//    都道府県エンティティは市区町村台帳に居ないので、**JIS X 0402 の検査数字**で検算する。
//
// 4. **収録できたらこの記録を消す。** derive が「その団体・その年度・そのデータ種別を
//    実際に収録していないか」を機械的に照合し、収録済みなら **throw して derive を止める**。
//    記録が静かに腐ることは無い（＝ルール2 の担保）。
//
// 5. 件数は書かない。`/coverage` の集計は derive がこの配列から算出する。

/**
 * 収録できなかった原因の分類。**原因の型が違えば打ち手も違う**ので分けている:
 * - `no-material` … そもそも該当する資料がウェブに無い（発行元が公開していない／消えている）
 * - `scanned-image` … 紙をスキャンした画像で、機械可読なテキストが無い
 * - `broken-text-layer` … テキスト層はあるが壊れている（ToUnicode 欠落・OCR レイヤの重なり等）
 * - `format-mismatch` … 資料はあるが様式が要件を満たさない（款別でない／前年度額の列が無い等）
 * - `parser-unsupported` … 原典は健全だが、こちらの抽出が対応していない（＝我々の側の事情）
 */
export type UnrecordableCategory =
  | "no-material"
  | "scanned-image"
  | "broken-text-layer"
  | "format-mismatch"
  | "parser-unsupported";

/** 画面に出す分類名。**この順で並べる**（原因が発行元側 → こちら側 の順） */
export const UNRECORDABLE_CATEGORIES: { key: UnrecordableCategory; label: string; note: string }[] = [
  { key: "no-material", label: "資料が存在しない", note: "該当する資料がウェブ上に見つからない（発行元が公開していない・掲載が消えている）" },
  { key: "scanned-image", label: "スキャン画像", note: "紙をスキャンした画像で、機械可読なテキストが入っていない" },
  { key: "broken-text-layer", label: "テキスト層の破損", note: "テキストは入っているが壊れている（文字化け・数字の脱落・二重レイヤ）" },
  { key: "format-mismatch", label: "様式が要件を満たさない", note: "資料はあるが、款別でない・前年度額の列が無いなど、収録に必要な形になっていない" },
  { key: "parser-unsupported", label: "パーサ未対応", note: "原典は健全だが、こちらの抽出処理が対応していない（＝我々の側の事情）" },
];

export interface UnrecordableRecord {
  /** 団体コード6桁。市区町村は総務省台帳から実引き、都道府県はエンティティコード（例 280003 = 兵庫県） */
  code: string;
  /** 団体名。derive が総務省台帳／都道府県名と突合する（取り違えの検出） */
  name: string;
  /** `/coverage` のデータセット列の key（budget / projects / report / evaluation …） */
  dataset: string;
  /** 対象年度。列挙できるものはすべて列挙する（derive が収録済みでないことを年度単位で照合する） */
  fiscalYears: string[];
  /** 「〜以前」で線を引くしかない場合の下限側の境界（この年度を含む）。fiscalYears と併用可 */
  fyUpTo?: string;
  /** 年度を特定できない場合の表記（原典の言い方をそのまま）。fiscalYears が空のときだけ使う */
  fyNote?: string;
  /** 分類（複数該当する場合は該当するものを全部。先頭を主分類として並べに使う） */
  categories: UnrecordableCategory[];
  /** 理由（docs からの転記。1〜3文） */
  reason: string;
  /** 根拠 URL（判定の対象になった資料そのもの、または年度一覧）。無ければ省略する */
  url?: string;
  /** 確認日（YYYY-MM-DD）。この記録は「この日の実測」であって恒久の事実ではない */
  checkedOn: string;
  /** 詳細の在り処（docs のセクション） */
  ref: string;
}

export const UNRECORDABLE: UnrecordableRecord[] = [
  // ==== 中核市 第5弾（2026-08-23・loop.md 第6巡・docs §13-6）==================================
  {
    code: "272108", name: "枚方市", dataset: "budget", fiscalYears: ["R6"],
    categories: ["scanned-image"],
    reason:
      "「令和6年度当初予算の概要」は JBIG2 スキャン＋OCR で、款別の前年度比較表（物理 p.17 / p.23）の款名が抽出できず" +
      "金額が「6 72, 492」と桁ごとに割れる。同年度の一般会計予算説明書の総括（物理 p.12〜19）も同じ OCR 破損で、" +
      "Wayback の写しは発行元とバイト単位で同一（sha256 一致）。R8・R7・R5 は同じ資料で収録済み" +
      "（R4 以前は「概要」自体がウェブに無く、議会資料室の公開が令和4年5月開会議会から）。",
    url: "https://www.city.hirakata.osaka.jp/soshiki/8-4-0-0-0_2.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-7",
  },
  {
    code: "072044", name: "いわき市", dataset: "budget", fiscalYears: ["H21"],
    categories: ["format-mismatch"],
    reason:
      "資料も抽出も健全だが、原典の「歳入合計（前年度）」が誤植している — 記載 115,691,713 に対し款の和は" +
      "115,691,813（+100）で、H20 の当年度合計 115,691,813 と突き合わせると Σ 側が正しい。収録すると derive の" +
      "年度間クロスチェーンが H20 との間で止まるため落とした（宇都宮 R3・長崎 H28 と同じ扱い）。" +
      "款別の値そのものは正しいので、原典が訂正されるか合計を持たない別資料が見つかれば収録できる。" +
      "R8〜H22 と H20 は同じ資料で収録済み。",
    url: "https://www.city.iwaki.lg.jp/www/genre/1000100000314/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-11",
  },
  {
    code: "282103", name: "加古川市", dataset: "budget",
    fiscalYears: ["H31", "H30", "H29"],
    categories: ["broken-text-layer"],
    reason:
      "「予算のポイント」が発行元から削除されており（現在は 404）、外部アーカイブの写しが" +
      "どの捕捉も 1 MiB ちょうどで打ち切られている（原本は 1.3〜1.7MB）。" +
      "平成31年度と平成30年度は PDF として開くことすらできず、平成29年度は開くものの" +
      "款別集計のあるページが空になる。原本が消えているため取り直しもできない。" +
      "同じ年度の「予算概要」もスキャン画像。令和2年度以降は同じ資料で収録済み。",
    url: "https://www.city.kakogawa.lg.jp/soshikikarasagasu/kikakubu/zaiseika/yosan/1529392713015.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-14",
  },
  {
    code: "152021", name: "長岡市", dataset: "budget",
    fiscalYears: ["R6"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算（案）計数資料編」のうち、款別の表があるページ（歳入款別・歳出目的別・地方債の3ページ）だけ" +
      "文字が図形に変換されており、pdftotext の抽出が節番号の1文字（5バイト）しか返らない" +
      "（同じ資料の他のページは3,000〜4,000字が正常に取れる。画像は1枚も無いのでスキャンではない）。" +
      "外部アーカイブの3つの写しと、差し替え前後の2つのファイルをすべて確認したが、どれも同じ状態だった。" +
      "代わりの「予算に関する説明書」は数字の桁区切りが「37, 459, 000」と読点の後ろに空白が入るため" +
      "桁ごとに割れて合計が桁違いにずれる。R8・R7・R5〜R2 は同じ資料で収録済み。",
    url: "https://www.city.nagaoka.niigata.jp/shisei/cate03/zaisei/r06yosan.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-14",
  },
  {
    code: "282146", name: "宝塚市", dataset: "budget",
    fiscalYears: ["R3", "H21"],
    categories: ["scanned-image"],
    reason:
      "この2年度は資料が全ページ スキャン画像で、文字として取り出せる中身が無い" +
      "（令和3年度の予算説明書は640ページに画像が640枚で0字、平成21年度の予算編成大要は63ページに63枚で0字。収録時に実測）。" +
      "令和3年度は予算の概要（16ページ・画像802枚・0字）も同じ状態で、代わりになる資料が無い。" +
      "文字を読み取る処理もかかっていないため、数値を取り出す手立てがない。",
    url: "https://www.city.takarazuka.hyogo.jp/1060687/1060727/1000137/1012635.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "282146", name: "宝塚市", dataset: "budget",
    fiscalYears: ["R2", "H27", "H20"],
    categories: ["broken-text-layer"],
    reason:
      "この3年度は資料に文字が入っているものの壊れていて、款の名前が1つも読み取れない" +
      "（令和2年度は取り出した4万2千字のうち1万4千字が判読不能な記号、平成27年度と平成20年度は" +
      "別の壊れ方で「市税」「議会費」「民生費」がいずれも0回。収録時に実測）。" +
      "この年度の予算編成大要・予算説明書は発行元に無く、代わりになる資料が無い。",
    url: "https://www.city.takarazuka.hyogo.jp/1060687/1060727/1000137/1012635.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "282146", name: "宝塚市", dataset: "budget",
    fiscalYears: ["H31", "H30", "H29", "H28", "H26"],
    categories: ["format-mismatch"],
    reason:
      "この5年度は予算の概要の文字は健全に取り出せるが、款ごとに金額を並べた表が入っていない" +
      "（「民生費」と金額が同じ行に並ぶ箇所が、平成31年度の億円単位に丸めたグラフの1か所だけで、" +
      "ほかの4年度は0か所。収録時に実測）。" +
      "款ごとの表を載せている予算説明書と予算編成大要は、この年度は発行元に無い。",
    url: "https://www.city.takarazuka.hyogo.jp/1060687/1060727/1000137/1012635.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "062014", name: "山形市", dataset: "budget",
    fiscalYears: ["R6"],
    categories: ["broken-text-layer"],
    reason:
      "この年度は候補になる資料がすべて読み取れない。当初予算の明細書と説明附属書は、" +
      "紙に印刷すれば読めるが文字として取り出すと数字が1つも出てこない状態で作られている" +
      "（収録時に実測。スキャン画像ではない）。内示会資料は集計表の部分だけが同じ状態で、" +
      "議案の総括表には前年度と比べる列が無い。" +
      "財政課の「財政状況 資料編」はこの年度の版が発行元から削除され、魚拓にも残っていない。" +
      "令和8年度と令和7年度は同じ資料で収録済み。",
    url: "https://www.city.yamagata-yamagata.lg.jp/shiseijoho/zaisei/1013833/index.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "112143", name: "春日部市", dataset: "budget",
    fiscalYears: ["R7", "R5", "R4", "R3"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算の概要」がこの4年度とも文字を図形に変換した状態で作られており、" +
      "本文の文字が1つも取り出せない（抽出できる文字数は全ページ合計で48字・0字・0字・0字。収録時に実測）。" +
      "スキャン画像ではないので読み取り誤りの心配は無いが、数値を取り出す手立てがない。" +
      "同じ年度の予算書・事業別概要書も同じ状態で、代わりになる資料が無い。" +
      "令和3年度のダイジェスト版は文字が取れるものの、金額が億円単位に丸められ小さい款が「その他」にまとめられている。" +
      "令和8年度と令和6年度は同じ資料で収録済み。",
    url: "https://www.city.kasukabe.lg.jp/shiseijoho/yosan_kessan_zaiseijokyo/8211.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "272027", name: "岸和田市", dataset: "budget",
    fiscalYears: ["R4", "R3"],
    categories: ["broken-text-layer"],
    reason:
      "この2年度は予算書の文字が壊れていて数値を取り出せない。令和4年度は396ページの文字は入っているが" +
      "数字がページ番号ぶんの1,040個しか無く、金額が1つも取り出せない（漢字も別の符号で入っていて、" +
      "ほかの資料で使っている復元表とは別の系統）。令和3年度は370ページで取り出せる文字が1,315字だけ・" +
      "画像も0枚で、文字が図形に変換されている（収録時に実測）。" +
      "令和8年度〜令和5年度・令和2年度・平成30年度〜平成26年度は同じ予算書で収録済み。",
    url: "https://www.city.kishiwada.lg.jp/life/6/35/145/",
    checkedOn: "2026-09-03", ref: "docs/data-sources.md §13-21",
  },
  {
    code: "272027", name: "岸和田市", dataset: "budget",
    fiscalYears: ["H31"],
    categories: ["format-mismatch"],
    reason:
      "この年度の予算に関する説明書には歳入の総括表はあるが、歳出を款ごとにまとめた総括表のページが無く、" +
      "前年度と比べられる歳出の表が見つからない（161ページを走査して「歳出」の総括の語が0回。収録時に実測）。" +
      "別冊の「各種調書等」も全ページ文字が入っていない。前後の年度は同じ予算書で収録済み。",
    url: "https://www.city.kishiwada.lg.jp/page/13-h31-yosan.html",
    checkedOn: "2026-09-03", ref: "docs/data-sources.md §13-21",
  },
  {
    code: "132110", name: "小平市", dataset: "budget",
    fiscalYears: ["R7", "R5"],
    categories: ["broken-text-layer"],
    reason:
      "この2年度は予算書のうち、款ごとの表が載る総括表の2ページだけが文字を図形に変換した状態で作られていて、" +
      "文字として取り出せるのがページ番号だけ（令和7年度は19・20ページ、令和5年度は18・19ページで、" +
      "それぞれ7字。前後のページは3千字前後が取り出せる。収録時に実測）。" +
      "スキャン画像ではないので読み取り誤りの心配は無いが、数値を取り出す手立てがない。" +
      "同じ年度の「予算（案）の概要」は歳出の款は読めるが、歳入がいくつかの款をまとめた表になっていて款ごとにならない。" +
      "令和8年度・令和6年度・令和4年度〜令和元年度は同じ予算書で収録済み。",
    url: "https://www.city.kodaira.tokyo.jp/kurashi/index07011001.html",
    checkedOn: "2026-09-02", ref: "docs/data-sources.md §13-20",
  },
  {
    code: "342025", name: "呉市", dataset: "budget",
    fiscalYears: ["R3"],
    categories: ["scanned-image"],
    reason:
      "この年度は、款ごとの表が載る「当初予算基礎資料」も予算書も紙をスキャンした画像で、" +
      "文字として取り出せる中身が無い（基礎資料は14ページに画像が14枚で14字。収録時に実測）。" +
      "文字を読み取る処理もかかっていないため、数値を取り出す手立てがない。" +
      "同じ年度の「当初予算のポイント」は文字が取れるものの、金額が百万円単位に丸められ、" +
      "歳入の款が13にまとめられていて、款ごとの金額が合計と合わない。" +
      "令和8年度から令和4年度と令和2年度は同じ資料で収録済み。",
    url: "https://www.city.kure.lg.jp/soshiki/89/",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-19",
  },
  {
    code: "122211", name: "八千代市", dataset: "budget",
    fiscalYears: ["H29", "H19"],
    categories: ["format-mismatch"],
    reason:
      "この2年度は冊子の「予算の概要」が発行されておらず、款ごとに前年度と比べられる表が無い。" +
      "平成29年度は広報紙面をそのまま載せた1ページの資料で、会計ごとの総額と円グラフだけ" +
      "（収録時に実測）。平成19年度はページに文章が載っているだけで資料そのものが無い。" +
      "ほかの18年度は同じ「予算の概要」で収録済み。",
    url: "https://www.city.yachiyo.lg.jp/site/yachiyo-zaisei/list265-335.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-19",
  },
  {
    code: "122211", name: "八千代市", dataset: "budget",
    fiscalYears: ["H20"],
    categories: ["broken-text-layer"],
    reason:
      "この年度は資料に文字が入っているものの壊れていて、款の名前も見出しも読み取れない" +
      "（款ごとの表のページから取り出せた漢字が0字。収録時に実測）。" +
      "金額のほうは壊れていないが、どの款の金額なのかが判別できない。" +
      "ほかの資料で使っている文字化けの復元表とも別の系統で、そのままでは戻せない。" +
      "ほかの18年度は同じ「予算の概要」で収録済み。",
    url: "https://www.city.yachiyo.lg.jp/site/yachiyo-zaisei/2451.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-19",
  },
  {
    code: "272159", name: "寝屋川市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5"],
    categories: ["format-mismatch", "scanned-image"],
    reason:
      "款ごとに前年度と比べられる資料が歳出の分しかなく、歳入の分が公開されていない。" +
      "当初予算書は紙をスキャンした画像で、" +
      "文字として取り出せる中身が無い（令和8年度の歳入の冊子は92ページに画像が92枚で0字、" + "令和8年度と令和7年度の議案の冊子も同じ状態。収録時に3冊を実測）。" +
      "市のホームページに載っている歳入の内訳は7つに大きくまとめた円グラフの画像で、款ごとになっていない。" +
      "オープンデータとして公開されている当初予算のデータも歳出の分だけで、" +
      "一覧を検索しても歳入のデータは無い（収録時に実測）。" +
      "款ごとの歳出と前年度当初との比較は「当初予算編成状況」の別紙4で読み取れるので、" +
      "歳入の資料が公開されれば収録できる。",
    url: "https://www.city.neyagawa.osaka.jp/organization_list/zaimu/zaiseika/yosan/toushoyosanhenseijyoukyou/index.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-18",
  },
  {
    code: "412015", name: "佐賀市", dataset: "budget",
    fiscalYears: ["R4", "R3"],
    categories: ["scanned-image"],
    reason:
      "「当初予算の概要」がこの2年度とも全ページ スキャン画像で、1ページに画像が1枚ずつ入っており、" +
      "文字として取り出せる中身が無い（令和4年度は17ページで17字、令和3年度は15ページで15字。収録時に実測）。" +
      "文字を読み取る処理もかかっていないため、数値を取り出す手立てがない。" +
      "同じ年度の別冊「当初予算資料」にも款ごとの表は入っていない。令和8年度と令和5年度は同じ資料で収録済み。",
    url: "https://www.city.saga.lg.jp/shisei/gyoseiunei/5/1/index.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-17",
  },
  {
    code: "422029", name: "佐世保市", dataset: "budget",
    fiscalYears: ["R3", "R2", "H31", "H30", "H29", "H28", "H27", "H26", "H24"],
    categories: ["scanned-image"],
    reason:
      "「当初予算説明資料」がこの9年度とも全ページ スキャン画像で、1ページに画像が1枚ずつ入っており、" +
      "文字として取り出せる中身がほとんど無い（平成29年度に67字が残るほかは、空白を除くと0字）。" +
      "文字を読み取る処理もかかっていないため、数値を取り出す手立てがない。収録時にすべての年度を取得して実測した。" +
      "令和8〜4年度と平成25年度以前は同じ資料で収録済み。",
    url: "https://www.city.sasebo.lg.jp/zaimu/zaisei/yosansetsumei.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-16",
  },
  {
    code: "422029", name: "佐世保市", dataset: "budget",
    fiscalYears: ["H22"],
    categories: ["no-material"],
    reason:
      "この年度だけ「当初予算説明資料」が発行元に掲載されておらず、記者発表資料しかない。" +
      "その記者発表資料には文字はあるが、款ごとの歳入歳出の表が含まれていない" +
      "（「市税」「地方交付税」「議会費」「民生費」がいずれも0回。収録時に実測）。" +
      "前後の年度は同じ資料の系列で収録済み。",
    url: "https://www.city.sasebo.lg.jp/zaimu/zaisei/yosansetsumei.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-16",
  },
  {
    code: "142077", name: "茅ヶ崎市", dataset: "budget",
    fiscalYears: ["H25", "H23"],
    categories: ["broken-text-layer"],
    reason:
      "歳入の総括表で、款16「財産収入」の金額の桁区切りのカンマだけが別の文字要素として下の行に落ちており、" +
      "抽出すると金額が2行に割れてその款が丸ごと読み取れない（平成25年度は当年度48,475千円・前年度50,512千円、" +
      "平成23年度は49,927千円・65,549千円が欠ける）。抽出方法を変えても合計行が見つからなくなるだけで解決しない。" +
      "歳出側は同じ年度でも正常。前後の年度は同じ資料で収録済み。",
    url: "https://www.city.chigasaki.kanagawa.jp/zaisei/1008506/index.html",
    checkedOn: "2026-08-24", ref: "docs/data-sources.md §13-15",
  },
  {
    code: "142034", name: "平塚市", dataset: "budget",
    fiscalYears: ["R8"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "「当初予算の概要」がこの年度だけ全47ページのスキャン画像で、pdftotext の抽出が全文47字・" +
      "PDF に埋め込みフォントが1つも無い（R7 以前は18万字前後で健全）。" +
      "代わりの「一般会計当初予算書」には文字があるが、総括ページの構成比が款の行から切り離されて" +
      "別の行に落ちるため金額の並びが崩れ、さらに文字の対応表が壊れていて歳出の款8 が「士木費」" +
      "（正しくは土木費）になる。金額そのものを信用できないため決定的に読み取れない。" +
      "R7〜R2 は同じ「当初予算の概要」で収録済み。",
    url: "https://www.city.hiratsuka.kanagawa.jp/keikaku/page-c_02405.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-14",
  },
  {
    code: "142034", name: "平塚市", dataset: "budget",
    fiscalYears: ["H31", "H30", "H29", "H28", "H27"],
    categories: ["format-mismatch"],
    reason:
      "この年度群の「当初予算の概要」には歳入を款ごとに並べた表が無く、自主財源・依存財源にまとめた" +
      "表しか載っていない（「使用料及び手数料」「交通安全対策特別交付金」「分担金及び負担金」が" +
      "5年度ともファイル全体で0回。収録時に実測）。歳出は目的別の表があるが、歳入が取れないため" +
      "歳入と歳出をそろえて収録できない。R7〜R2 は同じ資料で収録済み。",
    url: "https://www.city.hiratsuka.kanagawa.jp/keikaku/page-c_02405.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-14",
  },
  {
    code: "082015", name: "水戸市", dataset: "budget",
    fiscalYears: ["R3"],
    categories: ["format-mismatch"],
    reason:
      "「当初予算の概要」の（2）一般会計歳入内訳が、この年度だけ款2〜10 を「2〜10 地方譲与税等 7,964,000」の1行に" +
      "まとめており、款ごとの額が取れない（歳出の（3）予算総括は13款そろっており正常）。" +
      "代わりの「予算に関する説明書」は、総括ページの金額が1文字も抽出できず款名も別系統で化ける" +
      "（サブセットフォント由来でオフセットが等差でないため復号もできない）。R8〜R4 は同じ資料で収録済み。",
    url: "https://www.city.mito.lg.jp/page/5714.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-13",
  },
  {
    code: "082015", name: "水戸市", dataset: "budget",
    fiscalYears: ["H31"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算の概要」の款別ページ（物理3〜6ページ）だけテキスト層が壊れており、日本語が1文字も無く" +
      "数字も「9 9 9 * *」のようなラテン文字の並びになる（PDF 全体では46万字が抽出でき、2ページ目には" +
      "日本語が439字あるので全面ではない）。画像ではなく、文字の対応表が壊れている状態。" +
      "発行元の現行サイトにこの年度は無く、外部アーカイブの写しで確認した。",
    url: "https://web.archive.org/web/20220309025719/https://www.city.mito.lg.jp/000271/000273/000282/000367/p020007.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-13",
  },
  {
    code: "402036", name: "久留米市", dataset: "budget",
    fiscalYears: ["H29"],
    categories: ["broken-text-layer"],
    reason:
      "「予算の概要」の一般会計予算（目的別）は H30〜R8 と同じ様式で款別＋前年当初比較を持つが、" +
      "H29 はテキスト層が金額のカンマ・小数点の直後に空白を入れる（市税が「39, 758, 003」・" +
      "利子割交付金が「51, 000」）ため、桁ごとに別の数値として割れて合計が桁違いにずれる。" +
      "pdftotext の -layout・-raw のどちらでも同じ空白が残る（グリフ単位の字送りなので抽出方式では回避できない）。" +
      "数字の間の「, 」を畳む処理を足せば開く見込みだが、既存の全資料への影響を確かめる必要がある。" +
      "H28 以前（発行元は平成16年度まで置いている）は年度ごとに確かめていないため、この記録には含めない。",
    url: "https://www.city.kurume.fukuoka.jp/1100keikaku/2070zaisei/3010yosan/4130yosan29/2017-0224-1528-6.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-12",
  },
  {
    code: "242012", name: "津市", dataset: "budget",
    fiscalYears: ["R5", "R4", "R3", "R2", "H31", "H30", "H29", "H28", "H27", "H26", "H25", "H24", "H23"],
    categories: ["scanned-image"],
    reason:
      "「当初予算書」が H23〜R5 の13年度とも全ページ スキャン画像で、pdftotext の抽出文字数が1ファイル全文で" +
      "300〜1,700字（ノンブル等のみ。R6 以降は約16,000字以上で健全）。同年度の「当初予算の概要」も、" +
      "H30・H31・R2・R4 は末尾3ページ（円グラフ等）にしかテキスト層が無く款別予算額調書のページは画像、" +
      "H20〜H29・R3・R5 の概要は全文0字。決定的パースができない。R8・R7・R6 は同じ資料で収録済み。",
    url: "https://www.info.city.tsu.mie.jp/shisei/zaisei/1005573/1005575.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-12",
  },
  {
    code: "272116", name: "茨木市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3"],
    categories: ["broken-text-layer", "parser-unsupported"],
    reason:
      "款別＋前年当初比較を持つのは予算書の事項別明細書 総括だけだが、その（歳出）側は6年度とも" +
      "表全体がベクタのアウトラインで描かれておりテキストが1文字も無い（R8 は当該 XObject の BT が2個＝" +
      "ノンブルのみ・曲線 15,051 本。スキャンではないので pdfimages は0件）。R7・R6 は代わりに OCR レイヤが乗るが" +
      "数字が「107, 400, 000」とカンマ後で分かち書きされ Σ が +6,065,484 ずれて落ちる。" +
      "同じ予算書の事項別明細の款行には健全な款別＋前年度額があり Σ款＝合計が当年度・前年度とも差0 になるが、" +
      "その範囲には合計行が無く、既存パーサは「歳出合計 行が見つかりません」で throw する。" +
      "さらに R8・R5 の明細は ToUnicode 欠落の化け（荒川族）で GARBLE_CHAR_MAP に 項・明・細・書・法・人・" +
      "ゴ・ル・フ・府 の10字が足りず throw し、R3 は数字まで化けて1ページ内に3系統以上の帯がある。" +
      "⇒ マップの追加と「合計行を持たない明細から款行だけ拾う」経路の2点を足せば開く見込み。",
    url: "https://www.city.ibaraki.osaka.jp/kikou/kikaku/zaisei/menu/yosan/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-12",
  },
  {
    code: "272116", name: "茨木市", dataset: "budget",
    fiscalYears: ["R2", "R1", "H30", "H29", "H28", "H27", "H26", "H25"],
    categories: ["format-mismatch"],
    reason:
      "R2 以前は「予算書データ」ページ自体が無く（現存は R8〜R3 の6年）、年度ページにあるのは「当初予算の概要」だけ。" +
      "概要の一般会計予算総括表は（歳入）側にしか前年度額が無く、（歳出）側は款×性質別（人件費・物件費・扶助費…）で" +
      "前年度列が存在しない。R8・R4・R2 で同一構成を確認した。" +
      "なお概要の備考欄「前年度予算」は当初と一致しない（R7 の市税は 50,608,061 だが R6 の当初は 50,360,000）ので、" +
      "概要ルートを採るときは款を1つ見て「当初だ」と判断してはいけない（大津・郡山と同型の3例目）。",
    url: "https://www.city.ibaraki.osaka.jp/kikou/kikaku/zaisei/menu/yosan/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-12",
  },
  {
    code: "392014", name: "高知市", dataset: "budget", fiscalYears: ["R7", "R6"],
    categories: ["parser-unsupported"],
    reason:
      "R7・R6 の巻末［資料］の款別表は、原典の注記「※上段（ ）書きは満期一括償還及び起債借換による影響額を除いた数値」" +
      "のとおり一部の款が3行組（（ ）書きの上段／款名行／本体行）になっており、款の金額が款名行と次行にセル単位で分かれる" +
      "（該当は R7 の歳入19繰入金・22市債・歳入合計と歳出12公債費・歳出合計、R6 の歳入19繰入金・歳入合計と歳出12公債費・" +
      "歳出合計）。列は x が同じで y だけ違うため CropX でも -raw でも組み直せず、既存パーサは throw する" +
      "（静かには壊れない）。座標で行を組み直す改修を足せば開く見込み。R8・R5・R4・R3・H30 は同じ資料で収録済み。",
    url: "https://www.city.kochi.kochi.jp/soshiki/3/yosan07.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-11",
  },
  {
    code: "392014", name: "高知市", dataset: "budget", fiscalYears: ["R2", "H31"],
    categories: ["broken-text-layer", "format-mismatch"],
    reason:
      "R2 は当初予算が議会で修正可決された年度で資料が2つに割れている。前年度当初列を持つ「概要」は値が修正前の原案" +
      "（歳入合計 147,600,000）で、しかもテキスト層が全面ガーブル（数字がサブセットフォントの制御文字で固定オフセットの" +
      "帯ではないため decodeGarble も効かない）。可決額を載せた「修正可決後」PDF（合計 147,555,800）は列が" +
      "［原案／修正可決後／差］だけで前年度当初列を持たない。H31 は金額が正しく抽出でき Σ が4系統とも差0 になるが、" +
      "款名が11件化ける（利子割交付金→匏子割交付□・民生費→□生費 など）。U+FFFD は validate の KANNAME_JUNK_RE にも" +
      "部首ゲートにも当たらないため検出されず、目視だけが網。",
    url: "https://www.city.kochi.kochi.jp/soshiki/3/yosan02.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-11",
  },
  {
    code: "242021", name: "四日市市", dataset: "budget", fiscalYears: ["H31"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算資料」の全ページが ToUnicode 欠落のサブセットフォントで抽出時に化け（平成→ᖹᡂ）、既存の復号帯" +
      "（荒川・豊島族の −0x1D、三重県 R8 の +0x3EAC）のいずれにも乗らない（等差にならずサブセットの並び順に依存する）。" +
      "同年度の「当初予算の概要」は健全だが款別が円グラフの画像だけで表が無い。R8〜R2 は同じ資料で収録済み。",
    url: "https://www.city.yokkaichi.lg.jp/www/contents/1001000000530/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-11",
  },

  {
    code: "472018", name: "那覇市", dataset: "budget",
    fiscalYears: ["R6", "R3", "R2", "H31", "H30"],
    categories: ["broken-text-layer"],
    reason:
      "R6・H31・H30 は「予算に関する説明書」の総括表の数字が ToUnicode を持たない非埋め込みフォントで描かれており、" +
      "抽出時に金額が1つも現れない（漢字も別系統で化ける）。R3・R2 は本文がアウトライン化されていてテキスト層が" +
      "柱のノンブルだけ。いずれも印刷面には表があり、200dpi 描画で R6 の歳入22款・当年度合計 174,789,000 と" +
      "R3 の市税 49,197,273 を目視確認した（公表値は年度をまたいで動いていない）。代替も無い — 「なはしのよさんのはなし」は" +
      "款別でなく、Wayback CDX にも R6 の PDF の捕捉が0件。R8・R7・R5・R4 は同じ資料で収録済み。",
    url: "https://www.city.naha.okinawa.jp/admin/nahashizaisei/1004386/1004391/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-10",
  },
  {
    code: "472018", name: "那覇市", dataset: "budget",
    fiscalYears: ["H29", "H28", "H27", "H26", "H25"],
    categories: ["format-mismatch"],
    reason:
      "掲載されているのは「一般会計予算書」（16〜18ページ・第1表 歳入歳出予算ほか）だけで、" +
      "前年度予算額の列を持つ事項別明細書の総括が含まれない。H28・H27 は加えて文字化け、H26・H25 は CCITT スキャン画像。",
    url: "https://www.city.naha.okinawa.jp/admin/nahashizaisei/1004386/1004391/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-10",
  },
  {
    code: "112089", name: "所沢市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["format-mismatch"],
    reason:
      "当初予算の款別が機械可読で読めるのは議案資料だけだが、R3 のそれは議会修正前の案（歳入歳出 107,440,000千円）。" +
      "可決額は 107,400,000千円で、市が公表する修正内容のとおり歳入款23 市債と歳出款8 土木費が各 △40,000 違う" +
      "（全款を突合して不一致がこの2款だけであることを確認）。R4 資料の前年度列は修正後の値なので、案のまま収録すると" +
      "年度間クロスチェーンが割れる。修正後の款別を載せた機械可読資料は無い（R3 の予算書 PDF はスキャンで、" +
      "読み替え表は別 PDF）。R8〜R4 は同じ議案資料で収録済み。",
    url: "https://www.city.tokorozawa.saitama.jp/shiseijoho/zaisei/yosan/kakotousyoyosan/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-9",
  },
  {
    code: "272078", name: "高槻市", dataset: "budget", fiscalYears: ["R3", "R2"],
    categories: ["no-material"],
    reason:
      "「予算の概況」ページは常に直近3年度分しか置かず、落ちた年度は PDF ごとサーバーから消える。R3・R2 の款別 PDF は" +
      "発行元が 404 で、Wayback の CDX にも捕捉が1件も無い（attachment 6本と旧サイトの年度ページを実測）。" +
      "R1 以前はそもそもウェブ掲載の痕跡が見つからない。R8〜R4 は収録済み（R5・R4 は Wayback の写しが唯一の経路）。",
    url: "https://www.city.takatsuki.osaka.jp/soshiki/7/56048.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-9",
  },
  {
    code: "102024", name: "高崎市", dataset: "budget",
    fiscalYears: ["R4", "H31", "H28", "H27", "H24", "H20"],
    categories: ["broken-text-layer", "format-mismatch"],
    reason:
      "R4・H31・H28・H27・H24 の「当初予算の概要及び主要事業」は本文の文字がすべてアウトライン化されており" +
      "（pdftotext の抽出に CJK が0字で、取れるのは印字ノンブルだけ。全面スキャンではなく埋め込み画像は装飾のみ）、" +
      "決定的なパースができない。歳入・歳出の款別表と前年当初比較は印刷面には存在する（H31 は 200dpi 描画で" +
      "22款・合計 168,140,000 を目視確認）。H20 は歳入が11区分（交付金＝款3〜9 の合計・その他）に集約されており" +
      "款別歳入ではない。R8〜R5・R3・R2・H30・H29・H26・H25・H23〜H21 の13年度は同じ資料で収録済み。",
    url: "https://www.city.takasaki.gunma.jp/soshiki/15/",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "232033", name: "一宮市", dataset: "budget",
    fiscalYears: ["R4", "R2", "H31", "H30", "H29", "H28", "H27"],
    categories: ["broken-text-layer"],
    reason:
      "「一般会計予算書及び予算説明書」は7年度ともテキスト層はあるが ToUnicode が欠落しており、款名は" +
      "MS-Mincho サブセットのグリフ ID がそのまま Latin-1 域の文字として出力され、数字は真の字 −0x2A の帯に落ちている。" +
      "荒川・豊島族の GARBLE_CHAR_MAP とは別系統で、サブセット順に依存するため文書ごとにマップが違い共通マップの" +
      "拡張では開かない。R2 は Wayback の捕捉も発行元と同一の化けた PDF。同年度の「予算概要説明資料」は読めるが" +
      "款名ページと金額ページが見開きで分かれる様式で、既存の見開き分岐は金額ページ側にヘッダ除外も合計行での" +
      "打ち切りも通していないため行数が合わず throw する。R8〜R5・R3・H26・H25 は同じ資料で収録済み。",
    url: "https://www.city.ichinomiya.aichi.jp/zaimu/zaisei/1044383/1000242/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "302015", name: "和歌山市", dataset: "budget", fiscalYears: ["R3", "R2"],
    categories: ["no-material"],
    reason:
      "2021-11-30 時点の予算インデックスには令和3年度・令和2年度の年度ページへのリンクがあったが、" +
      "両ページとも現在 404 で、Wayback にも当該ページ・PDF の捕捉が1件も無い（CDX が空）。" +
      "発行元から掲載が消えており、写しも見つからない。R8・R7 は同じ資料で収録済み。",
    url: "https://www.city.wakayama.wakayama.jp/shisei/zaisei/1033880/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "302015", name: "和歌山市", dataset: "budget", fiscalYears: ["R6", "R5", "R4"],
    categories: ["scanned-image"],
    reason:
      "「予算内示資料」が CCITT グループ4 のスキャン画像でテキスト層を持たない（pdftotext の出力が 73 / 80 / 74 バイト）。" +
      "同じ年度の議会提出議案 PDF も同じスキャンで代替にならない。R3・R2 は年度ページが現行サイトから削除され" +
      "Wayback にも捕捉が無い。R8・R7 は同じ資料で収録済み。",
    url: "https://www.city.wakayama.wakayama.jp/shisei/zaisei/1033880/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "232017", name: "豊橋市", dataset: "budget", fiscalYears: ["R7", "R4", "R2"],
    categories: ["parser-unsupported"],
    reason:
      "原典は健全だが既存パーサが款を取りこぼす。豊橋は前年度補正の前倒し繰越を含む額を括弧で上段に置く様式で、" +
      "両年度とも括弧がある行は既存の折返し分岐が拾うのに、片側だけ括弧の行では款名行の整数が1個になり" +
      "どの分岐にも入らず行ごと落ちる（R7 は歳出款2、R4 は歳入款16・21・23＋歳出款8・10、R2 は歳出款10。" +
      "合計行が同じ形になる年度もある）。Σ が割れるのでパーサは throw し、静かには壊れない。" +
      "片側だけ括弧の行を組む opt-in を足せば開く見込みで、開けば豊橋は R8〜R2 の7年度が連続する。" +
      "R8・R6・R5・R3 は同じ資料で収録済み。",
    url: "https://www.city.toyohashi.lg.jp/8815.htm",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "232017", name: "豊橋市", dataset: "budget", fiscalYears: ["H31", "H30", "H29", "H28"],
    categories: ["broken-text-layer", "scanned-image"],
    reason:
      "「予算概要説明資料」は H31・H30 が PDF のテキスト層の全文字 U+FFFD（ToUnicode が無く、固定オフセットの" +
      "化けでもないため decodeGarble でも復元できない）、H29・H28 はスキャン画像で pdftotext が本文0文字。" +
      "R8・R6・R5・R3 は同じ資料で収録済み。",
    url: "https://www.city.toyohashi.lg.jp/8815.htm",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-8",
  },
  {
    code: "422011", name: "長崎市", dataset: "budget", fiscalYears: ["R6", "R4", "R3", "H31", "H28"],
    categories: ["broken-text-layer", "scanned-image", "format-mismatch"],
    reason:
      "R6・R4 は ToUnicode 欠落の化け（荒川・豊島と同一族の −0x1D 帯）で、GARBLE_CHAR_MAP に漢字約72字の追加が要る" +
      "（追加すれば開く見込み。数字だけ自前復号して前年度列と一致することは偵察が確認）。R3 はさらに表題行だけ +0x3EAC の" +
      "別の帯が混在し、decodeGarbleBand が側ごとに1オフセットしか取れないためマップ追加だけでは開かない（三重 R8 型）。" +
      "H31 は CCITT スキャンでテキスト層が無い。H28 は刊行物自体は自己整合するが、H29 の前年度列と民生費・地方交付税の" +
      "2款が各 −1,380 ずれており（議会修正前の値と考えられる・宇都宮 R3 と同型）、収録すると年度間クロスチェーンが割れる。" +
      "R8・R7・R5・R2・H30・H29 は同じ資料で収録済み。",
    url: "https://www.city.nagasaki.lg.jp/life/7/52/",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-7",
  },
  {
    code: "452017", name: "宮崎市", dataset: "budget", fiscalYears: ["H31", "H30", "H29", "H28", "H27"],
    categories: ["format-mismatch"],
    reason:
      "「当初予算案の概要」の同じ表は H31 以前も存在し既存パーサで読めるが、単位が百万円で、さらに旧宮崎市域と" +
      "清武町域の2組の列が右に続く様式になっている。R2 の前年度列（千円の実額）と款単位で一致しないため、" +
      "収録すると年度間クロスチェーンが R2↔H31 で割れる（H31 の前年度列も「肉付け後」）。R8〜R2 は千円の同型で収録済み。" +
      "H26 以前も同じ様式（H27 で実測）。",
    url: "https://www.city.miyazaki.miyazaki.jp/city/finance/budget/",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-6",
  },
  {
    code: "232114", name: "豊田市", dataset: "budget", fiscalYears: ["R3", "R2", "H31"],
    categories: ["scanned-image"],
    reason:
      "当初予算関連資料・予算説明書とも CCITT スキャンで pdftotext が0〜43文字しか返さない（発行元からは削除済みで、" +
      "Wayback とオープンデータカタログの写しも同一のスキャン）。H30〜H28 は Wayback にテキスト層つきで残り同じ設定で" +
      "読めるが、R3・R2 が埋まらないので年度の鎖が切れる。R8〜R4 は同じ資料の健全な版で収録済み。",
    url: "https://www.city.toyota.aichi.jp/shisei/yosan/1073321/1004776.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-6",
  },
  {
    code: "272035", name: "豊中市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["scanned-image"],
    reason:
      "款別歳入歳出＋前年当初比較の資料がウェブに無い。年度ページが載せる予算書・予算説明書の総括は本文が CCITT スキャン画像で" +
      "pdftotext がノンブルしか返さず、R3〜R8 と R1・H30 にある「各会計款別内訳」（議案参考資料／単体 PDF）は R2 だけ掲載が無い" +
      "（予算ページ・議会の令和2年案件ページとも）。この欠落で年度間クロスチェーンが R3〜R8 と R1・H30 の2本に割れる。",
    url: "https://www.city.toyonaka.osaka.jp/joho/zaisei/yosan/reiwa2yosan.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-6",
  },
  {
    code: "162019", name: "富山市", dataset: "budget", fiscalYears: ["H26", "H25"],
    categories: ["broken-text-layer"],
    reason:
      "議案概要の「歳入 款別構成」は、款10 地方交付税の金額が原典のテキスト層でセル内2行に分断されており" +
      "（21 400 ＋ ,400,000）、歳入Σが 21,399,979千円（H25 は 21,649,979千円）不足する。既存の joinWrappedAmounts は" +
      "末尾がカンマのトークンを前提にしているので効かない。歳出側は健全。H24 以前の議案概要には款別構成の表そのものが" +
      "無い（H24〜H18 を全部取って実測）。R8〜H27 は同じ資料で収録済み。",
    url: "https://www.city.toyama.lg.jp/shisei/yosan/1010829/1003081.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-6",
  },
  {
    code: "212016", name: "岐阜市", dataset: "budget", fiscalYears: ["R5", "R4", "R3", "R2", "H31", "H30"],
    categories: ["scanned-image"],
    reason:
      "予算説明書が R5 はスキャン＋OCR で、-layout は数字の並びが崩れ -raw は1文字ずつ空白区切り（6 7 , 1 3 5 , 9 6 2）に" +
      "なるため金額として読めず、款名にも OCR 誤りがある（利子割交付金 → 利 子 割 父 『 付 金）。R4 以前はテキスト層が無い" +
      "（CCITT の画像のみ）。年度ページ本文には HTML の款別表があるが金額が「634億3,349万5千円」形式で既存パーサでは読めず、" +
      "さらに R1 の前年度列は原典自身が「当初＋6月補正」と注記している（H30 が骨格予算）。R8・R7・R6 は健全な版で収録済み。",
    url: "https://www.city.gifu.lg.jp/info/zaisei/1007720/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-6",
  },
  // ==== 中核市 第4弾（2026-08-23・loop.md 第5巡・docs §13-5）==================================
  {
    code: "172014", name: "金沢市", dataset: "budget", fiscalYears: ["R8", "R7", "R6", "H30"],
    categories: ["scanned-image"],
    reason:
      "「金沢市予算概要」の一般会計款別表が R8・R7・R6 は CCITT スキャン＋OCR のテキスト層で、金額が壊れて読めない" +
      "（84,497,1801・46.フ など）。H30 は文字が図形化されていて pdftotext が款別表のページから何も返さない。" +
      "代替の「予算のあらまし」は歳入が原典の時点で12区分に集約されており（交付金＝款3〜11の合計、その他＝寄附金・" +
      "繰越金・諸収入等の合計）款別歳入ではないため採らない。R6 はあらまし自体が発行元から消え魚拓にも無い。" +
      "R5・R4 は同じ資料の健全な版で収録済み。",
    url: "https://www4.city.kanazawa.lg.jp/shiseijoho/gyozaisei/zaisei_yosan_kessan/2/13057.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-5",
  },
  {
    code: "132098", name: "町田市", dataset: "budget", fiscalYears: ["R7", "R6", "R5", "R4", "R3", "R2"],
    categories: ["parser-unsupported"],
    reason:
      "予算書がウェブに載っているのは R8 の年度ページだけで、R7 以前は「予算概要説明書」しか無い。" +
      "その歳出（目的別）内訳表が「金額行 → 款番号＋款名行 → 構成比行」の3行組みで、款名行に整数が1つも無いため" +
      "既存パーサが款を1件も抽出できず throw する（R7・R6・R5・R4・R3・R2 の各歳出ページに try-parse を当てて実測）。" +
      "歳入側は単行なので読める。倉敷 R7 と同じ「3行組み」の型で、パーサに opt-in を足せば開く見込み。",
    url: "https://www.city.machida.tokyo.jp/shisei/gyouzaisei/siyosan/index.html",
    checkedOn: "2026-08-23", ref: "docs/data-sources.md §13-5",
  },
  // ==== 中核市 第3弾（2026-08-22・loop.md 第4巡・docs §13-4）==================================
  {
    code: "332020", name: "倉敷市", dataset: "budget", fiscalYears: ["R7"],
    categories: ["parser-unsupported"],
    reason:
      "当初予算概要版 p.5 の歳出（目的別）だけが「前年度額の行 → 款名＋当年度額の行 → 括弧書きの補正後比較の行」の3行組みで、" +
      "款行が整数1個・前年度行が名前なし整数1個になり、既存パーサでは款行が1件も取れない（歳入 p.3 は読める）。" +
      "他の年度（R8・R6〜R3）は同じ資料の通常の1行組みで収録済み。",
    url: "https://www.city.kurashiki.okayama.jp/cityinfo/finance/1011778/1015416.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13-4",
  },
  {
    code: "272272", name: "東大阪市", dataset: "budget", fiscalYears: ["R6", "R5", "R4"],
    categories: ["scanned-image"],
    reason:
      "一般会計予算書の事項別明細書 総括（R6/R5/R4 とも p.17〜）は本文がアウトライン化された図形で、" +
      "PDF の内容ストリームがパス（m/l/c）だけ・文字は各ページのノンブル1個・画像0枚＝テキスト層が無く決定的パース不可。" +
      "R4 の予算書は現行サイトから消えており WARP（2024-08）にしか無い。R3 以前は予算書が未掲載で、" +
      "「予算の概要」は性質別・財源別の表のみ＝款別資料が存在しない。R8・R7 は同じ資料で収録済み。",
    url: "https://www.city.higashiosaka.lg.jp/0000000529.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13-4",
  },
  {
    code: "272272", name: "東大阪市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["format-mismatch"],
    reason:
      "R3 以前は予算書（事項別明細書の総括）がウェブ未掲載で、掲載されている「予算の概要」は性質別・財源別の表のみ" +
      "（市税・地方交付税など款名に似た行が並ぶが款別ではない）。R3 の概要は Wayback と WARP にも同じ構成で残っており、" +
      "款別＋前年当初比較の資料が存在しない。R2 以前は未確認。",
    url: "https://www.city.higashiosaka.lg.jp/0000000529.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13-4",
  },
  {
    code: "442011", name: "大分市", dataset: "budget", fiscalYears: ["H28", "H27", "H26", "H25", "H24"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "「当初予算（案）の概要」PDF が H28・H27・H24 は複合機スキャン（テキスト層なし）、H26・H25 は Canon の OCR で" +
      "見出し〈歳入〉や金額が壊れている（「苗日」「∠ゝ 12,770,000」）。R8〜H29 は同じ資料で収録済み。",
    url: "https://www.city.oita.oita.jp/shisejoho/kekakuzaise/shinozaise/yosan/index.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13-4",
  },
  // ==== 中核市 第2弾（2026-08-22・loop.md 第2巡→第3巡・docs §13-3）=========================
  // 宇都宮・西宮の parser-unsupported は #226 の改修で収録できたため外した（第3巡）。残るのは原典側の事情だけ。
  {
    code: "092011", name: "宇都宮市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["format-mismatch"],
    reason:
      "「当初予算案の大綱」は議会修正前の「案」（一般会計 229,000,000千円）で、可決された当初予算は修正後の 229,140,000千円" +
      "（同ページの「令和３年第２回市議会定例会予算（修正案）総括表」）。R4 の大綱の前年度列と市統計書 17-3 はどちらも" +
      "修正後なので、案のまま収録すると年度間のクロスチェックが R4↔R3 で食い違う（歳入4款・歳出 教育費 +140,000）。" +
      "修正後の款別は統計書 17-3 XLSX（CC BY）にあるが別様式で未収録。R8〜R4・R2〜H28 は同じ資料で収録済み。",
    url: "https://www.city.utsunomiya.lg.jp/shisei/johokokai/zaisei/1010664.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13-3",
  },
  // ==== 中核市（2026-08-22・loop.md 第1巡・docs §13）==============================
  {
    code: "112038", name: "川口市", dataset: "budget", fiscalYears: ["R7", "R6", "R5", "R4", "R3"],
    categories: ["scanned-image"],
    reason:
      "年度ページの「予算概要」PDF（R7_yosanngaiyou.pdf ほか）は DocuWorks 出力の非テキスト PDF で、" +
      "pdftotext の全文が 55〜63 文字しか無い（R7 63・R6 57・R5 55・R4 59・R3 61）。" +
      "R7 の「当初予算書 一般会計」（426p）も同様で、Wayback の R7 写しも同一バイナリ。" +
      "R8 は同名の PDF にテキスト層があり収録済み。R2 以前は年度一覧に無い。",
    url: "https://www.city.kawaguchi.lg.jp/soshiki/01020/030/3/index.html",
    checkedOn: "2026-08-22", ref: "docs/data-sources.md §13",
  },
  // ==== 横浜市の款項目節（2026-08-02・#191・docs §8d-2）=============================
  {
    code: "141003", name: "横浜市", dataset: "detail", fiscalYears: ["R7"],
    categories: ["format-mismatch"],
    reason:
      "款項目節 CSV の歳入だけが歳出より 379,539千円 大きく、同じ CSV の中で歳入 Σ ≠ 歳出 Σ になっている" +
      "（一般会計 1,984,787,527 対 1,984,407,988）。予算は均衡編成なので資料内部で矛盾している。" +
      "既収録の款別・R8 の前年度列とは歳出側だけが一致するため、歳入 CSV が単独で外れていると考えられる。" +
      "原因は未確認。R8・R6 は同じ資料で差0 なので収録済み。",
    url: "https://www.city.yokohama.lg.jp/city-info/zaisei/jokyo/yosan/r7/r7.files/r7sainyu_saisyutsu.zip",
    checkedOn: "2026-08-02", ref: "docs/data-sources.md §8d-2",
  },
  // ==== 横浜市の款項目（XLSX 版・2026-08-03・#192・docs §8d-3）======================
  {
    code: "141003", name: "横浜市", dataset: "detail", fiscalYears: ["R2", "H31"],
    categories: ["format-mismatch"],
    reason:
      "予算に関する説明書 XLSX の「前年度」列が、歳入と歳出で合計が食い違っている" +
      "（R2 は歳入 1,759,429,383 対 歳出 1,761,506,383 で差 2,077,000、" +
      "H31 は歳入 1,713,697,299 対 歳出 1,726,435,299 で差 12,738,000）。" +
      "当年度の列は両側とも一致し既収録の款別とも差0 なので、前年度列だけが外れている。" +
      "前年度列こそがこの資料を CSV 版より優先して収録する理由なので、そこが検証できない年度は入れない。" +
      "原因は未確認。R5・R4・R3 は同じ資料で両列とも差0 なので収録済み。",
    url: "https://www.city.yokohama.lg.jp/city-info/zaisei/jokyo/yosan/r2/r2.files/r2ippan.zip",
    checkedOn: "2026-08-03", ref: "docs/data-sources.md §8d-3",
  },
  // ==== 山梨県内の市（2026-07-14・docs §「山梨県内 budget 市を横に拡大」）===========
  {
    code: "192074", name: "韮崎市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["format-mismatch"],
    reason: "当初予算の一般会計は円グラフのみで、款別の表が資料に無い。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md 山梨県内 budget 市を横に拡大",
  },
  {
    code: "192104", name: "甲斐市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["format-mismatch"],
    reason: "当初予算の一般会計は円グラフのみで、款別の表が資料に無い。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md 山梨県内 budget 市を横に拡大",
  },
  {
    code: "192058", name: "山梨市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["scanned-image"],
    reason: "当初予算の概要がスキャン画像 PDF でテキスト層が無い（R8 は未公開）。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md 山梨県内 budget 市を横に拡大",
  },
  {
    code: "192147", name: "中央市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["format-mismatch"],
    reason: "公開されているのは269ページの予算説明書のみで、款別の概況表が無い。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md 山梨県内 budget 市を横に拡大",
  },
  {
    code: "192121", name: "上野原市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["format-mismatch"],
    reason: "款別＋前年比較はあるが HTML のみで PDF が無く、かつ前年（R7）が骨格予算。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md 山梨県内 budget 市を横に拡大",
  },
  {
    code: "192082", name: "南アルプス市", dataset: "projects", fiscalYears: ["R8"],
    categories: ["no-material"],
    reason: "公開されているのは377ページの予算書本編（事項別明細書）のみで、主な事業の一覧が無い。",
    checkedOn: "2026-07-14", ref: "docs/data-sources.md §7",
  },

  // ==== 東京特別区（docs §10 の「収録できなかった年度と理由」）=====================
  {
    code: "131016", name: "千代田区", dataset: "budget", fiscalYears: ["R3"],
    categories: ["parser-unsupported"],
    reason:
      "pdftotext -layout が款を静かに落とす（保健福祉費が丸ごと消える）。原典は壊れておらず -tsv には座標付きで存在するが、" +
      "読むには抽出モード・行の許容幅・括弧付きの第2系列の3つのオプションが要り、1年度のために足すには割に合わないと判断して見送った。" +
      "別の資料が同じ仕組みを要求したら再開する。",
    url: "https://web.archive.org/web/20210620211256if_/https://www.city.chiyoda.lg.jp/documents/27081/r3yosangaikyo_1.pdf",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10・registry の千代田ブロック",
  },
  {
    code: "131130", name: "渋谷区", dataset: "budget", fiscalYears: [], fyUpTo: "R4",
    categories: ["format-mismatch"],
    reason:
      "予算説明書 PDF の公表が R5 開始。R4 以前の HTML は款別はあるが前年度額の列が無く（増減率のみ）、" +
      "当初予算（款別＋前年当初比）の要件を満たさない。消えたのではなく最初から無いことを Wayback で確認済み。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §10",
  },
  {
    code: "131164", name: "豊島区", dataset: "budget", fiscalYears: ["R7"],
    categories: ["broken-text-layer"],
    reason:
      "原本のレイヤに OCR のレイヤが重なり数字が壊れる（ー70,593,082 ＝ 170,593,082）。置換が一貫しておらず、" +
      "同じ区の R4・R2 を救った復号（決定論的な文字マップ）でも直せなかった。",
    checkedOn: "2026-07-22", ref: "docs/data-sources.md §10d・§10e",
  },
  {
    code: "131164", name: "豊島区", dataset: "budget", fiscalYears: [], fyUpTo: "H28",
    categories: ["scanned-image"],
    reason: "分冊の総括表にテキスト層が無い（画像）。",
    checkedOn: "2026-07-22", ref: "docs/data-sources.md §10d",
  },
  {
    code: "131059", name: "文京区", dataset: "budget", fiscalYears: ["H25"],
    categories: ["scanned-image"],
    reason:
      "現行サイトの H25 がスキャン＋OCR で、歳入合計の行が見つからず parse が止まる。Wayback の捕捉も0件で別版が無い。" +
      "前後の H26・H24 は収録済み。",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10j",
  },
  {
    code: "131172", name: "北区", dataset: "budget", fiscalYears: ["H25"],
    categories: ["parser-unsupported"],
    reason:
      "-layout は款15 都支出金を2行に割り（Σ が 7,249,317 千円不足）、-raw は合計行の金額がラベルより前に出て止まる。" +
      "どちらの抽出モードでも取れなかった。前後の H24・H26 は収録済み。",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10l",
  },
  {
    code: "131024", name: "中央区", dataset: "budget", fiscalYears: [], fyUpTo: "H28",
    categories: ["no-material"],
    reason: "現行サイトに存在しない（年度一覧の最古が H29）。Wayback／WARP は未探索。",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10・§10f",
  },
  {
    code: "131083", name: "江東区", dataset: "budget", fiscalYears: [], fyUpTo: "H27",
    categories: ["no-material"],
    reason: "現行サイトに存在しない（年度一覧の最古が H28）。Wayback／WARP は未探索。",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10・§10f",
  },
  {
    code: "131113", name: "大田区", dataset: "budget", fiscalYears: [], fyUpTo: "H19",
    categories: ["no-material"],
    reason: "現行サイトに存在しない（年度一覧の最古が H20）。Wayback／WARP は未探索。",
    checkedOn: "2026-07-17", ref: "docs/data-sources.md §10・§10f",
  },
  {
    code: "131229", name: "葛飾区", dataset: "budget", fiscalYears: [], fyUpTo: "H27",
    categories: ["no-material"],
    reason:
      "現行サイトに存在しない（年度インデックスの予算概要の最古が H28。2026-07-22 に全件を実際に辿って確認）。" +
      "Wayback／WARP は未探索。",
    checkedOn: "2026-07-22", ref: "docs/data-sources.md §10・§10f",
  },
  {
    code: "131091", name: "品川区", dataset: "budget", fiscalYears: ["R3", "H31", "H30"],
    categories: ["scanned-image"],
    reason: "スキャン＋OCR で崩れている。発行元が近年までスキャン入稿のため、WARP を掘っても同じスキャンしか出ない見込み。",
    checkedOn: "2026-07-23", ref: "docs/data-sources.md §10s",
  },
  {
    code: "131091", name: "品川区", dataset: "budget", fiscalYears: ["R2"],
    categories: ["broken-text-layer", "scanned-image"],
    reason:
      "歳出の総括は豊島区と同型のガーブルで復号できるが、歳入の総括はスキャン＋OCR の崩れ（数字が行割れ・l／I の混入）で別の破損型。" +
      "片側だけでは収録できない。",
    checkedOn: "2026-07-23", ref: "docs/data-sources.md §10s",
  },
  {
    code: "131091", name: "品川区", dataset: "budget", fiscalYears: ["H29"],
    categories: ["scanned-image"],
    reason: "OCR の無いスキャン。",
    checkedOn: "2026-07-23", ref: "docs/data-sources.md §10s",
  },
  {
    code: "131091", name: "品川区", dataset: "budget", fiscalYears: [], fyUpTo: "H28",
    categories: ["no-material"],
    reason: "事項別明細書が未掲載。",
    checkedOn: "2026-07-23", ref: "docs/data-sources.md §10s",
  },
  {
    code: "131199", name: "板橋区", dataset: "budget", fiscalYears: ["R4", "R3", "R2"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "予算の概要を含め、その年度の資料がすべてスキャン画像または ToUnicode 欠落で、テキストとして取り出せない" +
      "（Wayback の捕捉でも実測）。H31 以前は実ファイル未検査。",
    checkedOn: "2026-07-23", ref: "docs/data-sources.md §10t",
  },
  {
    code: "131032", name: "港区", dataset: "budget", fiscalYears: ["H29", "H24"],
    categories: ["parser-unsupported"],
    reason: "震災復興基金の括弧2段組で合計行が割れる（どちらの年度も抽出が止まる）。",
    checkedOn: "2026-07-18", ref: "docs/data-sources.md §10n",
  },
  {
    code: "131237", name: "江戸川区", dataset: "report", fiscalYears: ["R6"],
    categories: ["broken-text-layer"],
    reason:
      "主要施策の成果の R6 は、R5 版が丸ごと不可視のレイヤで重なっており、pdftotext が -layout／-tsv とも2版を混ぜて返す。" +
      "可視レイヤだけを抜く一般的な方法は見つかっていない。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §10h",
  },
  {
    code: "131237", name: "江戸川区", dataset: "report", fiscalYears: ["H30", "H29"],
    categories: ["broken-text-layer"],
    reason:
      "主要施策の成果の ToUnicode が部分破損しており、事業名・所管課は読めるが表の半角数字が丸ごと欠落する" +
      "（成果指標の実績値が取れない）。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §10h",
  },

  // ==== 政令指定都市（docs §8）====================================================
  {
    code: "271403", name: "堺市", dataset: "budget", fiscalYears: ["R5"],
    categories: ["broken-text-layer"],
    reason: "歳入だけがフォントの ToUnicode を持たず数字が丸ごと脱落する（歳出のページは無傷）。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §8m",
  },
  {
    code: "271403", name: "堺市", dataset: "budget", fiscalYears: ["R4"],
    categories: ["broken-text-layer"],
    reason: "全面が文字化けし（➨ࠉ㈈ᨻつᶍẚ㍑⾲）、数字も脱落する。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §8m",
  },
  {
    code: "341002", name: "広島市", dataset: "report", fiscalYears: ["R6", "R5", "R4", "R3", "R2", "R1"],
    categories: ["scanned-image"],
    reason:
      "「主要な施策の成果」はウェブ掲載されているがスキャン OCR で、同一の数値が 489,884 と 489,384 に化ける（R6 民生関係で実測）。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §8g",
  },
  {
    code: "121002", name: "千葉市", dataset: "report", fiscalYears: [], fyNote: "ウェブ掲載されている年度",
    categories: ["broken-text-layer"],
    reason:
      "成果説明書はウェブ掲載されているが、ToUnicode 欠落で金額セルの数字が丸ごと脱落する一方、本文の説明文中の数字は出るため" +
      "「一部だけ正しい」状態になる。",
    checkedOn: "2026-07-16", ref: "docs/data-sources.md §8k",
  },

  // ==== 都道府県エンティティ（docs §11）===========================================
  {
    code: "280003", name: "兵庫県", dataset: "budget", fiscalYears: ["R8"],
    categories: ["no-material", "format-mismatch"],
    reason:
      "歳入の款別がウェブ上に存在しない。当初予算の別冊は歳出13款＋前年当初を持つが、歳入は「県税等／地方特例交付金等／" +
      "地方交付税等／国庫支出金／県債／その他の収入」の6財源区分だけで、予算書・予算に関する説明書はウェブ公開されていない" +
      "（県議会の議案ページ・予算特別委員会・会計課の決算書ページをすべて確認）。6区分を款として載せることはしない。",
    checkedOn: "2026-07-25", ref: "docs/data-sources.md §11b",
  },
  {
    // 小田原市（142069）。R5〜R8 は予算書の「一般会計予算額構成比一覧表」で収録済み。R4 以前の予算書は
    // すべてスキャン画像（自分で実測: 先頭40ページの文字数0・数字0・フォント0、各ページ1画像。H30 だけ140dpi の分割画像）。
    // 予算特別委員会の「予算説明資料」も R4 は款別表なし・R3〜H31 は画像で代替にならない。H25 以前は予算書の掲載自体が無い。
    code: "142069", name: "小田原市", dataset: "budget",
    fiscalYears: ["R4", "R3", "R2", "H31", "H30", "H29", "H28", "H27", "H26"],
    categories: ["scanned-image"],
    reason:
      "予算書 PDF（R4: 226p・R3: 612p・R2: 614p・H31: 584p・H30: 592p・H29: 584p・H28: 589p・H27: 588p・H26: 58p）が" +
      "すべて紙のスキャン画像で、pdftotext の出力が先頭40ページで0文字・埋め込みフォント0・各ページ1画像。" +
      "款別＋前年度比較の表（一般会計予算額構成比一覧表・事項別明細書の総括）は紙面にはあるが機械可読でない。" +
      "予算特別委員会の予算説明資料（H28〜R8）も R4 はテキスト層があるが款別表が無く、R3 以前は画像。",
    checkedOn: "2026-09-03", ref: "docs/data-sources.md §13-22",
  },
  {
    // 宇治市（262048）。当初予算資料は「予算概要」（H22〜R8 の17年）と「一般会計予算書および予算説明書」（H31〜R8 の8年）と
    // 豊富だが、**全27ファイルが複合機スキャン**（Producer: RICOH MP 6055 / KONICA MINOLTA bizhub 654e / SkyPDF）。
    // 自分で実測: 予算書8本は文字0・数字0・フォント0・各ページ1画像。概要17本は文字0〜275（ページ番号スタンプのみ）・数字0。
    // 唯一テキスト層がある R8 市長記者会見資料には款別表が無い。⚠ 成果説明書（H22〜R6・Word 生成・テキスト層あり）と
    // 決算概要はテキスト層があるので、事業報告の系列は将来の候補。
    code: "262048", name: "宇治市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3", "R2", "R1", "H30", "H29", "H28", "H27", "H26", "H25", "H24", "H23", "H22"],
    categories: ["scanned-image"],
    reason:
      "「予算概要」（H22〜R8 の17年分）と「一般会計予算書および予算説明書」（H31〜R8 の8年分）がいずれも複合機スキャンの" +
      "1ページ1画像 PDF（CCITT 200dpi）で、pdftotext の出力はページ番号スタンプまたは空（予算書8本は0文字・埋め込みフォント0）。" +
      "款別＋前年度比較の表自体は存在する（予算書 物理 p.13/14 の事項別明細書 総括・予算概要の第4表/第6表）が機械可読でない。" +
      "try-parse は「歳入」の見出しがありませんで throw する（R8・H31 実測）。",
    checkedOn: "2026-09-03", ref: "docs/data-sources.md §13-22",
  },
  {
    // 鳥取市（312011）。款別総括（歳入22款・歳出12款・本年度/前年度/比較）は予算書「歳入歳出予算事項別明細書 １総括」にあるが、
    // 予算書は R8〜R4 の分冊が全部スキャン画像（自分で実測: 文字0・フォント0・Producer eDocument Library 2.6）。R3 以前の予算書は未取得。
    // テキスト層のある「予算（案）の概要」（R8〜H26・13年）は歳出12款は揃うが、歳入が10区分の集約表（①市税 ２地方交付税 ３地方特例交付金
    // ４地方譲与税等 ⑤分担金･負担金 ⑥使用料･手数料 ７国･県支出金 ⑧財産収入 ９市債 ⑩その他）で款ごとの額が取れない
    // （偵察が総括の画像と突合: 地方譲与税等＝款2〜9＋12の和・その他＝款18〜21の和）。大阪府「10区分再分類表」・水戸 R3 と同型。
    // ⚠ 同じ概要 p.1 の性質別歳出・自主/依存の計が款別歳出と同じ Σ ＝ページ取り違えが差0 で通る型。
    // ⚠ 「資料2 歳入・歳出の主な増減」（テキスト層あり）に22款の額が矢印様式で散在しており、新パーサを書けば再構成できる余地はある
    //    （地方譲与税は4譲与税の和・繰入金は①＋②の和で復元）。判断が変われば記録を外す。
    // ⚠ ライセンスは PDL1.0（公共データ利用規約）＝ open。骨格予算は R8・R4（市長選）で原典明記。
    code: "312011", name: "鳥取市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3", "R2", "H31", "H30", "H29", "H28", "H27", "H26"],
    categories: ["format-mismatch", "scanned-image"],
    reason:
      "款別総括（歳入22款・歳出12款・本年度/前年度/比較）は予算書「歳入歳出予算事項別明細書 １総括」にあるが、" +
      "予算書は R8〜R4 の実測で全分冊がスキャン画像（pdftotext 0字・埋め込みフォント0・Producer は eDocument Library 2.6）。" +
      "テキスト層のある「予算（案）の概要」（R8〜H26）は歳出12款は揃うが、歳入が市税・地方交付税・地方特例交付金・地方譲与税等・" +
      "分担金負担金・使用料手数料・国県支出金・財産収入・市債・その他の10区分に集約されており款ごとの額が取れない（H26〜H31 は「地方譲与税等」が「その他交付金」の名・R3〜H26 の WARP 版も同じ10区分を実測）。",
    checkedOn: "2026-09-03", ref: "docs/data-sources.md §13-22",
  },
  {
    // 鎌倉市（142042）。R8・R7 は「予算に関する説明書」の総括で収録済み。R6 以前の同じ説明書は機械可読でない（自分で実測）。
    // ⚠ オープンデータ CSV（R6〜H16・CC BY 4.0・節レベル）は別ルートとして存在する。`査定現在額` の Σ は当初総額に一致するが
    //   `前年当初額` は R5 以外で Σ が合わない（R6 歳出は 456 行が 0）＝前年度列を印字した一次資料ではない。
    //   前年度を前年度 CSV から組む「年度チェーン」設計を採るかは判断待ち（採れば R6〜H16 が開く・§13-23）。
    code: "142042", name: "鎌倉市", dataset: "budget",
    fiscalYears: ["R6", "R5", "R4", "R3", "R2", "H31", "H30"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "「一般会計予算に関する説明書」の総括（p.5 歳入・p.6 歳出）は R6・H31・H30 が画像のみ（p.5-6 の pdftotext 文字数6＝ノンブルだけ・" +
      "各ページ1画像）。R5〜R2 は OCR 層があるが「歳」が「'」「.」「威」に化けて合計行のラベルが崩れ try-parse が throw し、" +
      "数字も l,8i9,223（正 1,819,223）の型で壊れる（R5 寄附金の前年度額で実測）。R8・R7 だけがネイティブテキスト。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-23",
  },
  {
    // 浦安市（122271）。R8〜R3 は予算書の総括で収録済み。⚠ R2 の予算書もスキャンだが「当初予算案の概要」に款別表があり、
    // 皆減行の `－` 構成比が dashAsZero で整数列をずらす**パーサ側の都合**で読めないだけなので記録しない（§13-23 に申し送り）。
    // H30・H27〜H20・H18〜H16 も概要/一般会計予算 PDF に款別表がある（横展開優先で未収録）ので記録しない。
    code: "122271", name: "浦安市", dataset: "budget",
    fiscalYears: ["R1", "H29", "H28", "H19"],
    categories: ["scanned-image"],
    reason:
      "予算書がスキャン画像（自分で実測: R1 139p・H29 152p・H28 152p の先頭40ページで金額らしい数字が0個・各ページ1画像）で、" +
      "代替になる「当初予算案の概要」も R1（96p・先頭40p 256字）・H29（36p・228字）は全頁画像、H28 は歳入目的別の p.12 だけが画像" +
      "（7字・1画像）で歳入が取れない。H19 の概要は80p で0字（全頁画像）、他に款別資料が無い。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-23",
  },
  {
    // 出雲市（322032）。R8・H30〜H26・H24・H23・H18 は「予算の概要」で収録済み。⚠ R7〜H31・H25・H22〜H20 は資料はあるが
    // 既存パーサの都合（字間スペース・皆減の内数行・空セル）で読めないだけなので記録しない（§13-23 に申し送り）。H17 は PDF が無く
    // 年度ページ HTML に総額のみ（未収録・未確認のため記録しない）。
    code: "322032", name: "出雲市", dataset: "budget", fiscalYears: ["H19"],
    categories: ["scanned-image"],
    reason: "「一般会計・特別会計予算の概要」（H19yosan.pdf・27p）がスキャン画像で、pdftotext の出力は空白と改ページのみ（可読文字0）・画像462（各ページ十数枚の帯画像）。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-23",
  },
  {
    // 苫小牧市（012131）。R8〜H29・H26・H25 は「一般会計予算書」の総括で収録済み。H28・H27 の予算書は全ページ画像（自分で実測）。
    // ⚠ H28 の「主要事業の概要」等に款別の当初額があるかは未確認（予算書が読めない理由だけを書く）。
    code: "012131", name: "苫小牧市", dataset: "budget", fiscalYears: ["H28", "H27"],
    categories: ["scanned-image"],
    reason:
      "「一般会計予算書」（H28: 257p・H27: 249p）が全ページスキャン画像で、総括のページ（p.13〜14）の pdftotext 出力が0字・埋め込みフォント0・各ページ1画像。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-24",
  },
  {
    // 新座市（112305）。R8〜R5・H29〜H25 は予算書の総括、R2 は予算概要で収録済み。4年度は予算書も概要もスキャン（自分で実測）。
    code: "112305", name: "新座市", dataset: "budget", fiscalYears: ["R4", "R3", "H31", "H30"],
    categories: ["scanned-image"],
    reason:
      "「一般会計予算書」も「予算概要」もスキャン画像で、pdftotext で金額が1つも出ない（先頭40ページで R4 予算書 0字・画像176／概要 16字、" +
      "R3 予算書 335字（ノンブルのみ）／概要 0字、H31（令和元年度）予算書 1,910字・金額0／概要 0字、H30 予算書 338字／概要 0字）。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-24",
  },
  {
    // 都城市（452025）。R6・R4・R3・H30・H26・H25 は「当初予算説明資料」で収録済み。残る8年度は説明資料がスキャン（自分で実測: 文字0・フォント0）。
    // ⚠ R8〜R5 は議会ページに予算書があるが、歳入歳出予算事項別明細書「総括」の**歳出ページがパス描画でテキストなし**（R8 p.58-59 文字8＝ノンブルのみ・
    //   歳入 p.56-57 は 1,311字）→ 既存パーサでは読めない。R4 以前の予算書はウェブに無い。
    code: "452025", name: "都城市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R5", "R2", "H31", "H29", "H28", "H27"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "「当初予算説明資料（No.2）」がスキャン画像（pdftotext 0字・埋め込みフォント0。R8 は 600dpi CCITT 18画像、R7 160画像、R5 327画像、" +
      "R2/H31 40画像、H29 153画像、H28 36画像、H27 30画像）。R8・R7・R5 は議会ページの予算書も歳出総括がパス描画でテキストが無い" +
      "（R8 p.58-59 の pdftotext が8字＝ノンブルのみ・画像0）ため読めない。",
    checkedOn: "2026-09-09", ref: "docs/data-sources.md §13-25",
  },
  {
    // 松阪市（242047）。R8〜R2・H30・H28〜H24 は「当初予算説明資料」の款別構成表で収録済み。H31・H29 の説明資料はスキャン画像（発行元表記は「平成31年度」なので H31。同巡のひたちなかと揃える）。
    //   H29 は同年度の予算書（テキスト層あり）に事項別明細書総括があるが罫線文字の表で款行が1件も取れない（偵察が try-parse で実測）。
    //   ⚠ H23 は自主財源の印 `*` が款番号の前に付き8款が廃止款扱いで落ちる＝パーサ都合なので記録しない（registry コメント・§13-27）。
    code: "242047", name: "松阪市", dataset: "budget", fiscalYears: ["H31", "H29"],
    categories: ["scanned-image"],
    reason:
      "「当初予算説明資料」が全ページ 600dpi の CCITT 画像で、pdftotext の抽出が資料全体で約1,100字（平成31年度・158p＝1,135字／平成29年度・166p＝1,199字。自分で実測）。" +
      "平成29年度は「一般会計当初予算」（予算書）にテキスト層があるが、事項別明細書総括が罫線文字（┃│）で組まれた表で款行が1件も抽出できない。",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-27",
  },
  {
    code: "242047", name: "松阪市", dataset: "budget", fiscalYears: ["H22"],
    categories: ["format-mismatch"],
    reason:
      "「平成22年度当初予算説明資料」の款別構成表の比較列が「平成21年度 肉付け後」で、前年度当初との比較になっていない。",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-27",
  },
  {
    // ひたちなか市（082210）。R8〜R2 は「予算の概要」で収録済み。H31 は概要のテキスト層が化け、H30・H29 は概要・予算書ともスキャン（自分で実測）。
    //   H28〜H18 の年度ページは現行 404 で Wayback（2022-07 捕捉）にのみ残る（H28・H27 の概要はスキャン・H26 はテキスト層あり）。
    //   孤立年度の H26 は横展開優先の方針で見送り＝「調べたが収録できない」ではないので記録しない。
    code: "082210", name: "ひたちなか市", dataset: "budget", fiscalYears: ["H31", "H30", "H29"],
    categories: ["broken-text-layer", "scanned-image"],
    reason:
      "平成31年度は「予算の概要」（24p・埋め込みフォント48）の款別総括ページ（p.5・p.8）のテキスト層が化けて款名が出ない（pdftotext で款番号と" +
      "金額の一部だけが残り款名は空・化け字）。平成30・29年度は「予算の概要」（22p/21p）も「一般会計」の予算書（191p/187p）も" +
      "pdftotext が約20〜190字（改ページのみ）・埋め込みフォント0のスキャン画像。",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-27",
  },
  {
    // 宇部市（352021）。R8・R6・R4・R3 は「当初予算（案）の概要」で収録済み。R7・R5 は概要 PDF が全面文字化け、R2 は歳出ページだけ化け（自分で実測）。
    //   H30 も化け・H29 は混在（平成は横展開優先で追わず記録しない）。⚠ R1 は文字層が正常で本文行が合計行の pre-scan に選ばれる＝パーサ都合なので記録しない（§13-27）。
    code: "352021", name: "宇部市", dataset: "budget", fiscalYears: ["R7", "R5", "R2"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算（案）の概要」の PDF が ToUnicode 欠落で文字化けする（埋め込みフォントの ToUnicode がすべて無く、pdftotext の出力が" +
      "「䊡䚷௧࿴䠓ᖺᗘ…」のような別の文字になる）。令和7・5年度は歳入・歳出とも化け、令和2年度は歳入ページ（p.4）は正常で歳出ページ（p.9）だけ化ける。" +
      "既存の復号表（GARBLE_CHAR_MAP）に無い字（△・皆・全角数字帯など）が多く、表の上の本文段落も復号対象になるため decodeGarble でも通らない（偵察が実測）。",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-27",
  },
  {
    // 川西市（282171）。R7・R6・R5・H31・H30〜H28 は「予算説明書」の総括で収録済み。R4〜R2 は総括ページのテキストが取れない（偵察が実測）。
    //   ⚠ R8 は歳入「環境性能割交付金」が款番号なし・当年度セル空・印も「皆減」の語も無い廃止款で行ごと落ちる＝パーサ都合なので記録しない。
    code: "282171", name: "川西市", dataset: "budget", fiscalYears: ["R4", "R3", "R2"],
    categories: ["broken-text-layer"],
    reason:
      "「一般会計・特別会計予算説明書」の「歳入歳出予算事項別明細書 １ 総括」のページからテキストが取り出せない。" +
      "令和4年度は歳入のページ（p.11）の pdftotext が空で、令和3・2年度は歳入・歳出の両ページがページ番号以外は空（画像も無く、文字がアウトライン化されている）。" +
      "同年度の「予算の概要」の款別表は説明文の列が款名に連結する様式で、こちらも既存の抽出に乗らない。",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-28",
  },
  {
    // 山形県 060003（⚠ 山形市 062014 と別物）。**資料は要件を形式上すべて満たしているのに、
    // 発行元の PDF 化工程だけが理由で機械可読でない**という型。**手で OCR の破損を直せば
    // Σ が4系統とも差0 で閉じる**＝原典の数字自体は正しい。
    code: "060003", name: "山形県", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R3"],
    categories: ["scanned-image", "broken-text-layer"],
    reason:
      "当初予算の款別資料（予算に関する説明書の総括4ページ）は款別・前年度当初列・単位千円をすべて備えているが、" +
      "全年度が複合機スキャン（pdfinfo の Creator が Apeos C7580 等）で、OCR のテキスト層が壊れている。" +
      "款名が9件破損し（利子割清算金→「利子生ι?圭算金」・土木費→「士木費」・農林水産業費→「辰林水産業費」・" +
      "議会費→「会議費」など）、款が4件丸ごと落ちる（款番号 11 がローマ数字 Ⅱ に化けて款行と判定されない・" +
      "繰越金は行ごと消失・労働費は「5,斗働費」のカンマで番号検出が壊れる）。金額も破損する" +
      "（125,477,109 → 125,47フ,109 とカタカナのフになる。R5〜R7 では前年度列の款金額まで壊れる）。" +
      "誤植のピンポイント指定（amountTypos）では年度ごとに数十箇所を列挙することになり、" +
      "原典の写しではなく人手の再入力になるため採らなかった。R3 はテキスト層自体が無い（pdftotext が4バイト）。",
    checkedOn: "2026-07-27", ref: "docs/data-sources.md §11j",
  },
  {
    code: "470007", name: "沖縄県", dataset: "budget", fiscalYears: ["R8"],
    categories: ["no-material", "format-mismatch"],
    reason:
      "歳入の款別＋前年当初がウェブ上に存在しない。説明資料の歳入表は9区分＋その他の再分類表で、16款のうち7款が「その他」に" +
      "丸められている（合計は一致してしまうため、合計が合うことは款別である証明にならない）。歳出は款別＋前年当初があるが" +
      "単位が億円で、前年度の合計が丸めにより1ずれる。",
    checkedOn: "2026-07-26", ref: "docs/data-sources.md §11f",
  },
  {
    code: "010006", name: "北海道", dataset: "budget", fiscalYears: ["R7"],
    categories: ["scanned-image"],
    reason: "予算の概要 PDF がスキャン画像。",
    checkedOn: "2026-07-25", ref: "docs/data-sources.md §11b",
  },
  {
    code: "460001", name: "鹿児島県", dataset: "budget", fiscalYears: ["R7", "R6", "R5"],
    categories: ["broken-text-layer"],
    reason:
      "予算に関する説明書は born-digital だがテキスト層が無く、pdftotext が 30〜50バイトしか返さない。R8 が初のテキスト層あり。",
    checkedOn: "2026-07-26", ref: "docs/data-sources.md §11f",
  },
  {
    code: "330001", name: "岡山県", dataset: "report", fiscalYears: [], fyNote: "全年度",
    categories: ["no-material"],
    reason: "事業単位の成果がウェブに無い（施策評価シートに事業費が1つも載らない）。情報公開請求の領域。",
    checkedOn: "2026-07-25", ref: "docs/data-sources.md §11c",
  },
  {
    // 上田市（202037）。R8〜R2 は「当初予算の概要」の款別で収録済み（§13-29）。
    // ⚠ H27 は数字だけ取れて款名が1つも取れない（＝「読めるが使えない」型）。復号では解けない。
    code: "202037", name: "上田市", dataset: "budget", fiscalYears: ["H27"],
    categories: ["broken-text-layer"],
    reason:
      "「平成27年度当初予算の概要」（89ページ）はテキスト層があり金額は取れるが、日本語が1文字も出ない" +
      "（全ページの非 ASCII は ○ ◎ △ ☆ ※ ① ⑴ ⑵ ― の9種の記号だけ）。款名の欄が空になり款が1つも取れない。" +
      "この年度は概要のほかに款別の候補が無い（年度ページの節は補正・専決の概要6本と当初予算の概要・予算編成方針だけで、予算書も予算説明書も載っていない）。",
    url: "https://www.city.ueda.nagano.jp/uploaded/attachment/1981.pdf",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-29",
  },
  {
    // 上田市（202037）。H20 だけ当初予算の概要が year ページに無い（補正・専決・編成方針はある）。
    code: "202037", name: "上田市", dataset: "budget", fiscalYears: ["H20"],
    categories: ["no-material"],
    reason:
      "予算のページの「平成20年度予算」の節に「当初予算の概要」のリンクが無い（補正予算の概要・専決予算の概要・予算編成方針だけ）。" +
      "前後の平成22・21・19・18年度には当初予算の概要がある。",
    url: "https://www.city.ueda.nagano.jp/soshiki/zaisei/1256.html",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-29",
  },
  {
    // 朝霞市（112275）。R8〜R3・H31〜H26 の12年度は予算説明書の総括表で収録済み（§13-30）。
    // ⚠ 原典は健全で、こちらの抽出が「廃止款の当年度セルが完全な空欄」に対応していないだけ。
    //    Σ が割れて error で止まるので静かには壊れない。
    code: "112275", name: "朝霞市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "歳入の廃止款「自動車取得税交付金」が行頭 △ の印つきで、当年度セルが 0 でも - でも「皆減」でもなく完全な空欄。" +
      "整数が [前年度, 増減] の2個になるため列を左に1つずらして読み、当年度 Σ が +40,000・前年度 Σ が -80,000 で割れる。" +
      "既存パーサは error で止まる（静かには壊れない）。前年度セル向けの prevBlankAsZero と対称の当年度版を足せば開く見込み。",
    url: "https://www.city.asaka.lg.jp/uploaded/attachment/60774.pdf",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-30",
  },
  {
    // 武蔵野市（132039）。R8〜H21 の18年度は予算参考資料で収録済み（§13-30）。
    // ⚠ H20 だけ歳入・歳出が同一 A3 ページに横並びで、廃止款の書き方も他年度と違う。
    code: "132039", name: "武蔵野市", dataset: "budget", fiscalYears: ["H20"],
    categories: ["parser-unsupported"],
    reason:
      "歳入・歳出が同一の A3 ページに横並びで（CropX で分離できることは実測）、末尾に款番号を持たない廃止款" +
      "「特別地方消費税交付金」（当年度0・前年度1）がある。H21 以降の同型には「皆減」の語があるがこの年度の表には" +
      "その欄が無いため拾えず、前年度 Σ が -1 で割れる。既存パーサは error で止まる（静かには壊れない）。",
    url: "https://www.city.musashino.lg.jp/shiseijoho/zaisei/zaiseijokyo/yosangaiyou/1010214.html",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-30",
  },
  {
    // 三郷市（112372）。R8〜H24（H23 を除く）は「当初予算の概要」の款別構成比較表と予算書の総括で収録済み（§13-31）。
    // ⚠ 発行元に他の候補が無いことまで確かめた（概要は文章だけで表を持たない）。
    code: "112372", name: "三郷市", dataset: "budget", fiscalYears: ["H23"],
    categories: ["scanned-image"],
    reason:
      "「予算説明書総括」（12ページ）も「一般会計予算書」（9ページ）もスキャン画像で、pdftotext の可読文字が0・埋め込みフォントも0。" +
      "同年度の「当初予算の概要」（7ページ）はテキスト層があるが本文が説明の文章だけで款別構成比較表を持たない（各ページを開いて確認）。",
    url: "https://www.city.misato.lg.jp/soshiki/zaimu/zaisei/1/1542.html",
    checkedOn: "2026-09-10", ref: "docs/data-sources.md §13-31",
  },
  {
    // 入間市（112259）。R8〜H26 の13年度は「予算の概要」と予算書の総括で収録済み（§13-31）。
    // ⚠ H25 は別の理由（GARBLE_CHAR_MAP 外の化け字）で、**新しい復号マップを作れば開く見込みがある**ので記録しない。
    code: "112259", name: "入間市", dataset: "budget", fiscalYears: ["H24"],
    categories: ["scanned-image"],
    reason:
      "「平成24年度予算の概要（主な事業）」（20ページ）も「一般会計予算書」（9ページ）も CCITT のスキャン画像で、" +
      "pdftotext の可読文字が0・埋め込みフォントも0。",
    url: "https://www.city.iruma.saitama.jp/soshiki/zaiseka/gyozaisei/yosan/h24/tosyo/index.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-31",
  },
  {
    // 深谷市（112186）。**budget 階層に1年度も入れていない**団体。
    // ⚠ 偵察は H24〜H26 の「一般会計当初予算要求・査定状況」（Wayback のみ）なら款別×前年当初が取れると
    //    実測したが、R8 との間に12年の空白ができ、**市民が開いて見えるのが2012〜2014年度だけになる**ので
    //    横展開優先の方針に照らして採らなかった（§13-33）。
    code: "112186", name: "深谷市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3", "R2", "H31", "H30"],
    categories: ["format-mismatch"],
    reason:
      "毎年出ている「予算資料」の一般会計歳入・歳出款別内訳は列が「款／予算額／構成比」だけで、前年度の額を持たない" +
      "（令和8年度の p.15 を開いて実測）。前年度額があるのは款を8区分に丸めた推移表だけで、款別の前年当初比較にならない。" +
      "同じ年度に出ている『当初予算書』はスキャン画像で文字が取り出せない、と偵察が報告している（この点だけは自分では未確認）。",
    url: "https://www.city.fukaya.saitama.jp/shisei/zaiseiyosangyozaisei/zaisei/zaisei_yosan/1389851437763.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-33",
  },
  {
    // 土浦市（082031）。R8〜H27 の12年度は「予算の概要」で収録済み（§13-33）。
    // ⚠ H25〜H20 も偵察が Σ 差0 を実測しているが、H26 で鎖が切れるので採っていない（記録しない）。
    code: "082031", name: "土浦市", dataset: "budget", fiscalYears: ["H26"],
    categories: ["parser-unsupported"],
    reason:
      "歳出に印の無い廃止款（諸支出金・款番号の欄が空で伸率が「▲ 100.0」）があり、廃止款の分岐に入らず行ごと落ちる。" +
      "前年度 Σ が 1,611,880千円 不足して error で止まる（静かには壊れない）。行頭の印に頼らず款番号欄の空きで判定できれば開く見込み。",
    url: "https://www.city.tsuchiura.lg.jp/shisei/zaseikeikaku-yosan/yosan/h26/page005656.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-33",
  },
  {
    // 藤枝市（222143）。R8・R7・R6・H30 は「歳入歳出予算事項別明細書 １ 総括」で収録済み（§13-35）。
    // ⚠ 発行元の年度一覧は H28〜R8 の11年あるが、テキスト層があるのは4年だけ。
    code: "222143", name: "藤枝市", dataset: "budget",
    fiscalYears: ["R5", "R4", "R3", "R2", "H31", "H29", "H28"],
    categories: ["scanned-image"],
    reason:
      "当初予算説明資料の総括も同年度の予算書もスキャン画像で、文字が1字も取り出せない" +
      "（埋め込みフォント0・可読文字0を実測）。同じ年度ページにある「当初予算の概要」は性質別・財源別だけで" +
      "款別の表を持たないので代わりにならない。画像を目で読めば数字は取れるが、機械での抽出はできない。",
    url: "https://www.city.fujieda.shizuoka.jp/soshiki/zaiseikeiei/zaisei/oshirase/yosan/index.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-35",
  },
  {
    // 古河市（082040）。R8・R6〜R3 は予算書の総括で収録済み（§13-35）。
    // ⚠ R7 だけ中抜けになる。⚠ R8 の前年度列が R7 の当年度列と全款一致することは画像で確認済み。
    code: "082040", name: "古河市", dataset: "budget",
    fiscalYears: ["R7", "R2", "H31"],
    categories: ["broken-text-layer"],
    reason:
      "予算書に同じ「歳入歳出予算事項別明細書 総括」があるのに、本文がアウトライン化されていて" +
      "取り出せる文字がページ番号だけしかない（画像ではないので復号でも直らない）。",
    url: "https://www.city.ibaraki-koga.lg.jp/soshiki/zaisei/2/index.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-35",
  },
  {
    // 古河市（082040）の H30 以前。⚠ 上の R7・R2・H31 とは理由が違うので分けて記録する。
    code: "082040", name: "古河市", dataset: "budget",
    fiscalYears: ["H30", "H29", "H28", "H27", "H26", "H25", "H24"],
    categories: ["scanned-image"],
    reason: "予算書がスキャン画像で、取り出せる文字が0字（実測）。",
    url: "https://www.city.ibaraki-koga.lg.jp/soshiki/zaisei/2/index.html",
    checkedOn: "2026-09-11", ref: "docs/data-sources.md §13-35",
  },
  {
    // 成田市（122114）。H20・H22〜R8 の18年度は「当初予算の概要」で収録済み（§13-36）。
    // ⚠ H21 の款別値は H22 の前年度列に入っているので、鎖の値としては欠けていない。
    code: "122114", name: "成田市", dataset: "budget",
    fiscalYears: ["H21"],
    categories: ["scanned-image"],
    reason:
      "「平成21年度当初予算の概要」がスキャン画像で、取り出せる文字が27字しかない（実測）。",
    url: "https://www.city.narita.chiba.jp/shisei/page085300.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-36",
  },
  {
    // 周南市（352152）。H25〜R8 のうち10年度は収録済み（§13-36）。
    // ⚠ この4年度が抜けるので、鎖は H25〜H27 と R2〜R8 の2本に割れる。
    code: "352152", name: "周南市", dataset: "budget",
    fiscalYears: ["H31", "H30", "H29", "H28"],
    categories: ["scanned-image"],
    reason:
      "当初予算の概要・予算説明参考資料・予算書のいずれもスキャン画像で、埋め込みフォントが0本（実測）。" +
      "H30 の予算書だけは一部にテキスト層があるが、歳出の総括ページが帯状の画像で、片側しか取り出せない。",
    url: "https://www.city.shunan.lg.jp/soshiki/11/2575.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-36",
  },
  {
    // 焼津市（222127）。R8〜R2 と H31 の8年度は収録済み（§13-36）。
    // ⚠ H30 の表の中身は H31 の前年度列と21款すべて一致することを偵察が画像で確認しており、鎖の値は欠けていない。
    code: "222127", name: "焼津市", dataset: "budget",
    fiscalYears: ["H30"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算（案）の概要」の款別表がアウトライン化されていて、取り出せる文字が0字（画像ではないので復号でも直らない）。",
    url: "https://www.city.yaizu.lg.jp/city-info/finance/tosho-yosan.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-36",
  },
  {
    // 石巻市（042021）。R8〜H24 の15年度は収録済み（§13-37）。
    // H23 の当初予算は震災の年で、3月24日の専決処分として公表されている。
    code: "042021", name: "石巻市", dataset: "budget",
    fiscalYears: ["H23"],
    categories: ["scanned-image"],
    reason:
      "予算書と一般会計歳入の説明書がどちらも紙のスキャンで、39ページと52ページのどちらからも文字が1字も取り出せない。" +
      "H24 以降にある一般会計だけの総括ファイルも無く、説明書が款ごとの分冊になっている。",
    url: "https://www.city.ishinomaki.lg.jp/cont/10103000/7137/7137.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 石巻市（042021）H22。スキャンに OCR の文字が載っているが認識が壊れている。
    code: "042021", name: "石巻市", dataset: "budget",
    fiscalYears: ["H22"],
    categories: ["broken-text-layer"],
    reason:
      "説明書はスキャン画像に文字認識の層が載っているが、認識そのものが壊れている。" +
      "目次の時点で土木費が別の2文字に、災害復旧費が途中で英字に、使用料が判読できない綴りになる。" +
      "款名をそのまま信じられないので、総括の表も裏取りなしには使えない。",
    url: "https://www.city.ishinomaki.lg.jp/cont/10103000/6281/6281.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 稲沢市（232203）。R8〜R2・H31・H30・H26・H25 の11年度は収録済み（§13-37）。
    // 資料そのものは収録済み年度と同じ「予算説明資料」の前年度比較表で、様式も同じ。
    code: "232203", name: "稲沢市", dataset: "budget",
    fiscalYears: ["H29", "H28", "H27"],
    categories: ["broken-text-layer"],
    reason:
      "前年度比較表のうち、国庫支出金と諸収入の金額だけが先頭の桁のまとまりを別の行に描かれている。" +
      "百万円台の桁が行をまたいで割れるため、款の金額が1桁の数として読み取られ、合計が数百万円ずれる。" +
      "レイアウト保持でも描画順でも同じ割れ方をするので、取り出し方を変えても直らなかった。",
    url: "https://www.city.inazawa.aichi.jp/0000005502.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 我孫子市（122220）。R8〜R3・H31・H30 の8年度は収録済み（§13-37）。
    // ⚠ これは原典ではなくこちらの事情。復号そのものは通っており、歳入合計まで読めている。
    code: "122220", name: "我孫子市", dataset: "budget",
    fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "予算書の文字が全体にずれた符号で入っているが、こちらの復号のしくみで款名も金額も元に戻り、" +
      "歳入合計まで読めるところまで来ている。止まっているのは、ページ下の印字されたページ番号に使われている" +
      "見慣れない字種が復号表に載っていないためで、原典の側の問題ではない。",
    url: "https://www.city.abiko.chiba.jp/shisei/zaisei/yosansho/R2tousyoyosannsyo.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 我孫子市（122220）H29〜H25。予算書・説明書とも紙のスキャン。
    // ⚠ H29〜H27 は同じ表の Excel 版が発行元にあるが、既存の Excel パーサとは列構成が違う。
    code: "122220", name: "我孫子市", dataset: "budget",
    fiscalYears: ["H29", "H28", "H27", "H26", "H25"],
    categories: ["scanned-image"],
    reason:
      "予算説明書が紙のスキャンで、73ページから582ページある各年度のどれからも文字がほとんど取り出せない" +
      "（H29・H28・H27・H26 は1字も出ず、H25 は582ページで134字）。" +
      "H29・H28・H27 には同じ表の表計算ファイルが併載されているが、こちらが対応している表計算の様式とは列の並びが違う。",
    url: "https://www.city.abiko.chiba.jp/shisei/zaisei/yosansho/index.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 座間市（142166）。R8・R7・R6 の3年度は収録済み（§13-37）。
    code: "142166", name: "座間市", dataset: "budget",
    fiscalYears: ["R5", "R4"],
    categories: ["broken-text-layer"],
    reason:
      "R5 は予算書176ページ全体を通して日本語の文字が1字も取り出せず、数字だけが出てくる。" +
      "R4 は184ページのうち日本語が出るのは前半の29ページだけで、総括を含む明細書の部分は記号の並びになる。" +
      "どちらも款名が取れないので、金額が読めても款に結び付けられない。",
    url: "https://www.city.zama.kanagawa.jp/shisei/zaisei/yosan/1009994.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 座間市（142166）R3・R2。発行元の予算ページに当初予算書そのものが無い。
    code: "142166", name: "座間市", dataset: "budget",
    fiscalYears: ["R3", "R2"],
    categories: ["no-material"],
    reason:
      "発行元の予算のページに載っているのは当初予算の総額と主な施策を述べるページだけで、" +
      "款別の表を含む当初予算書が置かれていない。予算書が並ぶのは R4 からになっている。",
    url: "https://www.city.zama.kanagawa.jp/shisei/zaisei/yosan/1009994.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 国分寺市（132144）。第35巡の候補だったが1年度も収録できていない。
    // ⚠ 実測したのは R8・R6・R3 の3年度だけ。ほかの年度は台帳に載せない（＝まだ調べていない扱い）。
    code: "132144", name: "国分寺市", dataset: "budget",
    fiscalYears: ["R8"],
    categories: ["broken-text-layer"],
    reason:
      "予算書は紙のスキャンに文字認識の層を載せたもので、歳出の総括は読めるが歳入の総括が読めない。" +
      "歳入では金額が桁のまとまりの途中で行に割れ、さらに数字がアルファベットとして認識されている箇所がある。" +
      "見た目には数字に見えるので、そのまま取り込むと誤りに気づけない。",
    url: "https://www.city.kokubunji.tokyo.jp/shisei/zaisei/yosan/1037132.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 国分寺市（132144）R6・R3。文字認識の層すら無い。
    code: "132144", name: "国分寺市", dataset: "budget",
    fiscalYears: ["R6", "R3"],
    categories: ["scanned-image"],
    reason:
      "予算書が紙のスキャンで、文字認識の層も入っていない。" +
      "R6 は一般会計の説明書159ページから取り出せる文字が1,708字しかなく、R3 は総括表の3ページから1字も出ない。",
    url: "https://www.city.kokubunji.tokyo.jp/shisei/zaisei/yosan/index.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-37",
  },
  {
    // 尾道市（342050）。H24〜R8 の14年度は収録済み（§13-38）。H31 でだけ鎖が切れる。
    // ⚠ H31 の款別値は H30 と R2 の間に入るので、鎖の両端は収録できているが繋がらない。
    code: "342050", name: "尾道市", dataset: "budget",
    fiscalYears: ["H31"],
    categories: ["scanned-image"],
    reason:
      "当初予算の概要が紙のスキャンで、64ページのどこからも文字が1字も取り出せない。" +
      "埋め込まれた書体も1つも入っていないため、文字を復元する手だてがない。",
    url: "https://www.city.onomichi.hiroshima.jp/soshiki/3/24012.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-38",
  },
  {
    // 瀬戸市（232041）。R8〜R2 の7年度は収録済み（§13-38）。
    // ⚠ H30〜H18 は2段組の別様式で、crop を年度ごとに実測すれば読める見込み（横展開優先で未収録）。
    code: "232041", name: "瀬戸市", dataset: "budget",
    fiscalYears: ["H29", "H28"],
    categories: ["scanned-image"],
    reason:
      "当初予算の概要が紙のスキャンで、176ページと45ページのどちらからも文字が1字も取り出せない。" +
      "同じ年度の総括表には文字が入っているが、会計ごとの総額が3行あるだけで款別の内訳がない。",
    url: "https://www.city.seto.aichi.jp/bunya/yosan/index.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-38",
  },
  {
    // 青梅市（132055）。R8〜R2 の7年度は収録済み（§13-38）。
    // ⚠ H30 以前は現行サイトから消えており、Wayback にも旧年度ページの捕捉が無い（WARP は未調査）。
    code: "132055", name: "青梅市", dataset: "budget",
    fiscalYears: ["H31"],
    categories: ["broken-text-layer"],
    reason:
      "この年度だけ当初予算の説明資料が掲載されておらず、ほかの年度と同じ形の表が見当たらない。" +
      "載っているのは予算書と予算に関する説明書だけで、そのどちらも款別の金額が並ぶページの文字が" +
      "図形として描かれていて、文字として読み取れない。" +
      "同じ予算書でも、条文のページや債務負担行為・市債の表は文字として入っていて読める。",
    url: "https://www.city.ome.tokyo.jp/site/omezaisei/119109.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-38",
  },
  {
    // うるま市（472131）。R8・R7・R6・R5・R3 の5年度は収録済み（§13-38）。
    code: "472131", name: "うるま市", dataset: "budget",
    fiscalYears: ["H24", "H23"],
    categories: ["scanned-image"],
    reason:
      "「うるま市の予算」が紙のスキャンで、10ページと9ページのどちらからも文字が1字も取り出せない。" +
      "埋め込まれた書体も1つも入っていない。",
    url: "https://www.city.uruma.lg.jp/1003001000/contents/26791.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-38",
  },
  {
    // うるま市（472131）R4・R2・H31。⚠ 原典は健全で、こちらの抽出が届いていない。
    code: "472131", name: "うるま市", dataset: "budget",
    fiscalYears: ["R4", "R2", "H31"],
    categories: ["parser-unsupported"],
    reason:
      "原典は読める状態で、こちらの取り出し方が追いついていない。" +
      "R4 は歳入のページで文字の送りが詰まっており、金額が桁の途中で行に割れてしまう。" +
      "R2 と H31 は、廃止された款の行に款番号も目印も「皆減」の語もないため、その行だけが落ちる。",
    url: "https://www.city.uruma.lg.jp/shiseijouhou/yosanzaisei/yosankessan/ippankaikei/index.html",
    checkedOn: "2026-09-12", ref: "docs/data-sources.md §13-38",
  },
  // ==== 中核市など 第35弾（2026-09-25・loop.md 第37巡・docs §13-39）==================================
  {
    // 小金井市（132101）R8。R7〜R2 の6年度は収録済み（§13-39）。
    // ⚠ 原典（発行元の概要）の転記誤り。印字に無い数値を入れることになるので amountTypos で埋めない。
    code: "132101", name: "小金井市", dataset: "budget",
    fiscalYears: ["R8"],
    categories: ["format-mismatch"],
    reason:
      "当初予算の概要の歳入の表で、使用料及び手数料の行に款番号と前年度の額が無く、増減率の欄が計算エラーの表示になっている。" +
      "款番号の無いこの行を款として数えられないので当年度の款の合計が総額と合わず、前年度の合計も前年度の当初予算額と違う額で印字されている。" +
      "款別の数字が載るほかの資料は、予算書の総括が文字として取り出せず、予算説明資料は紙のスキャンで、代わりにならなかった。",
    url: "https://www.city.koganei.lg.jp/shisei/zaiseiyosan/yosan/yosanhensei/R8tousyoyosanhensei.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-39",
  },
  {
    // 霧島市（462187）R2。R8〜R3・H31 の7年度は収録済み（§13-39）。
    // ⚠ 原典は健全で、こちらの抽出が「款番号の欄に 0 を置く廃止款」に対応していないだけ。
    code: "462187", name: "霧島市", dataset: "budget",
    fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "歳入の表の最後にある廃止された款（自動車取得税交付金）の行が、款番号の欄に 0 を置き、目印も「皆減」の語も持たない。" +
      "こちらの抽出はこの書き方に対応しておらず、その行だけが落ちて前年度の歳入の合計が合わなくなる。",
    url: "https://www.city-kirishima.jp/zaisei/shise/yosan/yosan/r2/r2tosho.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-39",
  },
  // ==== 中核市など 第36弾（2026-09-25・loop.md 第38巡・docs §13-40）==================================
  {
    // 江別市（012173）R2。R8〜R3 の6年度は収録済み（§13-40）。
    // ⚠ 予算書が見つからないこと（no-material）と、代わりの概要がこちらの抽出で読めないこと（parser-unsupported）の2つ。
    code: "012173", name: "江別市", dataset: "budget",
    fiscalYears: ["R2"],
    categories: ["no-material", "parser-unsupported"],
    reason:
      "予算書は発行元のページが消えていて、ウェブの保存記録にも見つからなかった。" +
      "代わりの当初予算案概要は、歳入の款別の表と同じページに地方交付税などの別の表があり、こちらの抽出がその表の合計を款別の表の合計と取り違えるため読めない。",
    url: "https://www.city.ebetsu.hokkaido.jp/site/zaisei/86222.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-40",
  },
  {
    // 橿原市（292052）R4〜R2。R8〜R5 の4年度は収録済み（§13-40）。
    code: "292052", name: "橿原市", dataset: "budget",
    fiscalYears: ["R4", "R3", "R2"],
    categories: ["no-material"],
    reason:
      "発行元の予算のページは最新の年度だけを載せる方式で、この3年度の資料はすでに消えている。" +
      "当時のページは画面を後から組み立てる作りだったため、ウェブの保存記録（国立国会図書館・Internet Archive）にも資料の中身が残っていなかった。",
    url: "https://www.city.kashihara.nara.jp/soshiki/1044/gyomu/2/2291.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-40",
  },
  // ==== 中核市など 第37弾（2026-09-25・loop.md 第39巡・docs §13-41）==================================
  {
    // 松原市（272175）R3・R2。R8〜R4 の5年度は収録済み（§13-41）。
    // ⚠ R2 は紙のスキャンではなく、組版ソフトから表を画像として書き出したもの（どちらも文字が入っていない点は同じ）。
    code: "272175", name: "松原市", dataset: "budget",
    fiscalYears: ["R3", "R2"],
    categories: ["scanned-image"],
    reason:
      "令和3年度の当初予算の概要は紙をスキャンした画像で、令和2年度は表が画像として書き出されている。" +
      "どちらも文字の情報が入っておらず、表の数字を機械で読み取れない。同じ年度の款別の表を載せた別の資料も見つからなかった。",
    url: "https://www.city.matsubara.lg.jp/docs/page2958.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-41",
  },
  {
    // 鶴岡市（062031）R4。R8〜R5・R3・R2・H31 は収録済み（§13-41）。
    code: "062031", name: "鶴岡市", dataset: "budget",
    fiscalYears: ["R4"],
    categories: ["scanned-image"],
    reason:
      "当初予算資料はページを画像として貼り合わせたもので、文字の情報が入っていない。" +
      "ウェブの保存記録（国立国会図書館・Internet Archive）の写しも同じファイルで、同じ年度の参考資料は款別の表に前年度の額が無く代わりにならない。",
    url: "https://www.city.tsuruoka.lg.jp/shisei/shiyakusyo/zaisei/yosan.html",
    checkedOn: "2026-09-25", ref: "docs/data-sources.md §13-41",
  },
  // ==== 中核市など 第38弾（2026-09-26・loop.md 第40巡・docs §13-42）==================================
  {
    // 浦添市（472085）R2。R8〜R3 の6年度は収録済み（§13-42）。
    // ⚠ 原典の誤植（数字の並びの入れ替わり）。正しい値は同じ年度の予算書に印字されているが、別の資料の値で差し替える前例が無いので人の判断に回した。
    code: "472085", name: "浦添市", dataset: "budget",
    fiscalYears: ["R2"],
    categories: ["format-mismatch"],
    reason:
      "款別の対前年度比較表で、歳入の市債と歳入合計の額が、翌年度の資料の前年度の列（同じ年度の当初予算額）より90千円少ない（数字の並びが入れ替わった誤植とみられる）。" +
      "この年度の予算書の総括は文字が正しく取り出せないため、比較表の数字を正しい額に置き換えてよいかを確かめてから収録する。",
    url: "https://www.city.urasoe.lg.jp/doc/609e7b803d59ae2434bfe9b8/",
    checkedOn: "2026-09-26", ref: "docs/data-sources.md §13-42",
  },
  {
    // 大東市（272183）R5。R8〜R6 は収録済み（§13-42）。
    // ⚠ 議会修正で可決した年度で、公開されている款別の表が修正前の原案だけ。修正後の款別の全表は R6 の前年度列にしか無い。
    code: "272183", name: "大東市", dataset: "budget",
    fiscalYears: ["R5"],
    categories: ["format-mismatch"],
    reason:
      "この年度の当初予算は議会で修正されて成立したが、公開されている款別の表（予算概要・予算書）は修正前の原案のもので、成立した予算の額と4つの款で合わない。" +
      "成立した額の款別の表は翌年度の資料の前年度の列にしか載っていない。",
    url: "https://www.city.daito.lg.jp/soshiki/4/43842.html",
    checkedOn: "2026-09-26", ref: "docs/data-sources.md §13-42",
  },
  {
    // 大東市（272183）R4〜R2。
    code: "272183", name: "大東市", dataset: "budget",
    fiscalYears: ["R4", "R3", "R2"],
    categories: ["scanned-image"],
    reason:
      "予算概要も予算書も全ページが画像で、ページ番号以外の文字の情報が入っていない。" +
      "国立国会図書館の保存記録にある令和2年度の写しも同じ画像のファイルだった。",
    url: "https://www.city.daito.lg.jp/life/6/30/129/",
    checkedOn: "2026-09-26", ref: "docs/data-sources.md §13-42",
  },
  // ==== 中核市など 第39弾（2026-09-27・loop.md 第41巡・docs §13-43）==================================
  {
    // ふじみ野市（112453）R2。R8〜R3 の6年度は収録済み（§13-43）。
    code: "112453", name: "ふじみ野市", dataset: "budget",
    fiscalYears: ["R2"],
    categories: ["scanned-image"],
    reason:
      "当初予算書は全ページが画像で、文字の情報が入っていない。" +
      "同じ年度の予算の概要は歳入の款をまとめて載せていて款別になっておらず、予算の内訳の明細書にも款ごとの総括が無い。",
    url: "https://www.city.fujimino.saitama.jp/soshikiichiran/zaiseika/zaiseikakari/yosan/ippankaikei/index.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-43",
  },
  {
    // 廿日市市（342131）R3・R2。R8〜R4 は収録済み（§13-43）。
    code: "342131", name: "廿日市市", dataset: "budget",
    fiscalYears: ["R3", "R2"],
    categories: ["broken-text-layer"],
    reason:
      "予算書は文字が図形として描かれていて、文字の情報として取り出せない。令和3年度の予算説明資料も同じで、令和2年度の予算説明資料は掲載されていない。" +
      "同じ年度の当初予算の概要は歳入を7つの区分にまとめていて、款別になっていない。",
    url: "https://www.city.hatsukaichi.hiroshima.jp/soshiki/2/63280.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-43",
  },
  {
    // 延岡市（452033）R4〜R2。R8〜R5 は収録済み（§13-43）。
    code: "452033", name: "延岡市", dataset: "budget",
    fiscalYears: ["R4", "R3", "R2"],
    categories: ["no-material"],
    reason:
      "款別に前年度と比べた当初予算の表が、発行元のサイトにもウェブの保存記録にも見つからなかった。" +
      "令和4年度は施政方針の文章だけ、令和3年度は当初予算のページが無く、令和2年度は円グラフの画像だけが載っている。",
    url: "https://www.city.nobeoka.miyazaki.jp/life/3/22/96/",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-43",
  },
  {
    // 新居浜市（382051）。R8〜R2 の全年度（§13-44）。
    code: "382051", name: "新居浜市", dataset: "budget",
    fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3", "R2"],
    categories: ["format-mismatch", "scanned-image"],
    reason:
      "当初予算の概要の比較表は市税目別・地方交付税・市債・財政調整基金・性質別・経費別の6つだけで、款別に前年度と並べた表が無い（款別構成比は円グラフと上位3款の金額だけ）。" +
      "予算書はウェブに掲載されておらず、市議会の当初予算議案はスキャン画像で、第1表も当年度の額だけ。",
    url: "https://www.city.niihama.lg.jp/soshiki/zaisei/yosan.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-44",
  },
  {
    // 防府市（352063）R3。R8〜R4・R2 は収録済み（§13-44）。
    code: "352063", name: "防府市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["scanned-image"],
    reason:
      "当初予算参考資料は案・確定版とも総括表を含む前半28ページに文字の情報が入っていない。" +
      "同じ年度の当初予算の概要は歳入を区分にまとめていて款別になっていない。",
    url: "https://www.city.hofu.yamaguchi.jp/soshiki/9/yosan.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-44",
  },
  {
    // 白山市（172103）R2。R8〜R3 は収録済み（§13-44）。
    code: "172103", name: "白山市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["scanned-image"],
    reason:
      "当初予算の一般会計附表（歳入・歳出の款別予算額調）が紙をスキャンした画像で、文字の情報が入っていない。予算書も同じく画像だけ。",
    url: "https://www.city.hakusan.lg.jp/shisei/zaisei/1003544/1003560.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-44",
  },
  {
    // 春日市（402184）R3。R8〜R4・R2 は収録済み（§13-45）。
    code: "402184", name: "春日市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["scanned-image"],
    reason:
      "現在掲載されている予算に関する説明書は紙から取り込み直したもので、文字認識で付けた文字しか入っておらず、合計の行や款の名前が読み取れない。" +
      "当初に掲載されていた版はウェブの保存記録にあるが、2ページ目以降に文字の情報が入っていない。",
    url: "https://www.city.kasuga.fukuoka.jp/shisei/zaiseijoukyou/yosan/1004507.html",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-45",
  },
  {
    // 北見市（012084）R2。R8〜R3 は収録済み（§13-46）。
    // ⚠ 廃止款の行（行頭の全角 0）は #301 で読めるようになった（§13-47）。残るのは原典の転記誤り＝浦添 R2 と同じく人の判断待ち。
    code: "012084", name: "北見市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["format-mismatch"],
    reason:
      "総括表の前年度列の諸収入と市債が、同じ冊子の款別の明細と79,300千円ずつ食い違っている（合計は同じ）。" +
      "総括表の数字を別の箇所の数字で書き換えることになるため、収録を見送っている。",
    url: "https://www.city.kitami.lg.jp/administration/detail.php?content=7925",
    checkedOn: "2026-09-27", ref: "docs/data-sources.md §13-47",
  },
  {
    // 羽曳野市（272221）R4。R8〜R5・R3・R2 は収録済み（§13-49）。
    code: "272221", name: "羽曳野市", dataset: "budget", fiscalYears: ["R4"],
    categories: ["broken-text-layer"],
    reason:
      "予算書の数字が、ページやフォントごとに違う番号の文字として埋め込まれていて、文字として取り出すと数字がすべて読めない記号になる。" +
      "漢字は正しく取り出せ、同じ年度の予算の概要は1枚の図で款別の表が無い。",
    url: "https://www.city.habikino.lg.jp/soshiki/soumu/zaisei/zaiseijokyo/habikinosiyosannsyo/index.html",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-49",
  },
  {
    // 三田市（282197）R7・R6。R8・R5〜R2 は収録済み（§13-49）。
    code: "282197", name: "三田市", dataset: "budget", fiscalYears: ["R7", "R6"],
    categories: ["broken-text-layer", "format-mismatch"],
    reason:
      "予算書と予算説明書の総括の表は文字が取り出せない形式で埋め込まれている。市議会の資料は令和7年度が会計別の総額だけで、令和6年度は議会で修正される前の原案の数字。" +
      "修正後の款別を載せた「わかりやすい予算」は歳入を財源の区分ごとにまとめていて款別になっていない。",
    url: "https://www.city.sanda.lg.jp/soshiki/9/gyomu/gyozaisei/zaisei_yosan_kessan/yosan/index.html",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-49",
  },
  {
    // 三島市（222062）R4・R3。R8〜R5・R2 は収録済み（§13-50）。
    // ⚠ 原典は健全（復号すれば読める）。こちらの抽出が「1物理ページの左右2段にまたがる表」に対応していないだけ。
    code: "222062", name: "三島市", dataset: "budget", fiscalYears: ["R4", "R3"],
    categories: ["parser-unsupported"],
    reason:
      "予算書が見開き2面を1ページに収めた版で、歳入の総括の表が1ページの左右2段（左に款1〜18、右に款19〜23と合計）に分かれている。" +
      "既存パーサは1ページの表を1列の帯としてしか読めず、左右の段が1行に混ざる。",
    url: "https://www.city.mishima.shizuoka.jp/life/5/27/135/",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-50",
  },
  {
    // 大野城市（402192）R8〜R2。1年度も収録できていない（§13-51）。
    code: "402192", name: "大野城市", dataset: "budget", fiscalYears: ["R8", "R7", "R6", "R5", "R4", "R3", "R2"],
    categories: ["format-mismatch", "no-material"],
    reason:
      "市が公開している当初予算の資料は「当初予算（ダイジェスト）」だけで、款別の比較は民生費・総務費など6つの款と「その他」にまとめた棒グラフ（令和5年度以降は画像、令和4年度以前はPDF）であり、金額も万円単位に丸められている。" +
      "予算書・予算説明書は現行のサイト・旧サイト（Wayback）・議会のサイトのいずれにも掲載が無い。",
    url: "https://www.city.onojo.fukuoka.jp/list00259.html",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-51",
  },
  {
    // 伊勢原市（142140）R7・R6・R2。R8・R5〜R3 は収録済み（§13-51）。
    code: "142140", name: "伊勢原市", dataset: "budget", fiscalYears: ["R7", "R6", "R2"],
    categories: ["scanned-image"],
    reason:
      "一般会計予算書が紙をスキャンした画像のPDFで、文字として取り出せない。款別の前年度比較を載せた別の資料（予算の概要）は広報の1ページで、款別の表が無い。",
    url: "https://www.city.isehara.kanagawa.jp/categories/bunya/shisei/gyosei/yosan/",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-51",
  },
  {
    // 宜野湾市（472051）R2。R8〜R3 は収録済み（§13-51）。
    // ⚠ 原典は健全で、こちらの抽出が「番号つきの新設款で前年度と比較のセルが空白・整数が1個」の行に対応していないだけ。
    code: "472051", name: "宜野湾市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "予算書は掲載が無く、予算の概要の歳入で新しく設けられた款「法人事業税交付金」の行が前年度と比較の欄が空白で「皆増」とだけ書かれていて、既存パーサがこの行を読めず隣の款とつながる。" +
      "歳入の合計が 63,194千円合わなくなる。",
    url: "https://www.city.ginowan.lg.jp/soshiki/kikaku/2/1/2/8/2469.html",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-51",
  },
  {
    // 筑西市（082279）R6。R8・R7・R5・R4 は収録済み（§13-52）。
    code: "082279", name: "筑西市", dataset: "budget", fiscalYears: ["R6"],
    categories: ["format-mismatch"],
    reason:
      "市が公開している一般会計予算書は議会で修正される前の原案で、修正は6ページの別の資料にしか載っていない。修正で総額と繰入金・市債・教育費の3つの款の額が変わっている。" +
      "修正後の「予算の概要」は歳出の款が一部しか載っていない。",
    url: "https://www.city.chikusei.lg.jp/gyousei/zai-kaikei-kansa/zaisei/yosan/page011294.html",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-52",
  },
  {
    // 筑西市（082279）R3・R2。
    code: "082279", name: "筑西市", dataset: "budget", fiscalYears: ["R3", "R2"],
    categories: ["broken-text-layer"],
    reason:
      "予算書の文字が図形に変換されていて、ページ番号以外は文字として取り出せない。「予算の概要」には款別の表の全部が無く、主な増減だけが載っている。",
    url: "https://www.city.chikusei.lg.jp/gyousei/zai-kaikei-kansa/zaisei/yosan/",
    checkedOn: "2026-09-28", ref: "docs/data-sources.md §13-52",
  },
  {
    // 鹿屋市（462039）R2。R8〜R3 は収録済み（§13-53）。
    // ⚠ 原典は健全で、こちらの抽出が「廃止の印つきで当年度が空欄」の行に対応していないだけ（第49巡の手当ては印の無い行が対象）。
    code: "462039", name: "鹿屋市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "予算書と予算に関する説明書は文字を取り出せない画像のPDFで、読める資料は「当初予算の概要」の対前年度比較表だけ。" +
      "その表の廃止された款「○【廃款】自動車取得税交付金」が当年度の欄が空欄のため既存パーサが当年度を読み違え、歳入の当年度の合計が 40,000千円合わなくなる。",
    url: "https://www.city.kanoya.lg.jp/zaimu/yosan/r2/r2_tousyo.html",
    checkedOn: "2026-10-01", ref: "docs/data-sources.md §13-53",
  },
  {
    // 佐久市（202177）R4・R3・R2。R8〜R5 は収録済み（§13-53）。
    code: "202177", name: "佐久市", dataset: "budget", fiscalYears: ["R4", "R3", "R2"],
    categories: ["scanned-image"],
    reason:
      "予算説明資料と当初予算の概要が紙をスキャンした画像のPDFで、文字として取り出せない。予算書は年度のページに掲載が無い。",
    url: "https://www.city.saku.nagano.jp/shisei/zaisei/yosan/index.html",
    checkedOn: "2026-10-01", ref: "docs/data-sources.md §13-53",
  },
  {
    // 酒田市（062049）R2。R8〜R3 は収録済み（§13-55）。
    code: "062049", name: "酒田市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["parser-unsupported"],
    reason:
      "一般会計予算書がウェブに掲載されていない。款別の前年度比較が載っている「当初予算資料」の表は3年度分を並べた表で、新しく設けられた款や廃止された款の古い年度の欄が空欄のため列が詰まり、既存パーサが前年度の列を取り違える。",
    url: "https://www.city.sakata.lg.jp/shisei/zaisei/yosan_R2nendo.html",
    checkedOn: "2026-10-07", ref: "docs/data-sources.md §13-55",
  },
  {
    // 芦屋市（282065）R6〜R3。R8・R7・R2 は収録済み（§13-55）。
    code: "282065", name: "芦屋市", dataset: "budget", fiscalYears: ["R6", "R5", "R4", "R3"],
    categories: ["scanned-image"],
    reason:
      "款別の前年度比較を載せた一般会計予算説明書が紙をスキャンした画像のPDFで、文字として取り出せない。" +
      "令和3年度は議会で予算が修正されていて、文字の残る資料（予算資料・予算の概要）はどれも修正前の数字。",
    url: "https://www.city.ashiya.lg.jp/zaisei/kako_yosan.html",
    checkedOn: "2026-10-07", ref: "docs/data-sources.md §13-55",
  },
  {
    // 神栖市（082325）R3。R8〜R4・R2 は収録済み（§13-57）。
    // 説明書 r3ippankaikeisetsumeisyo.pdf（177ページ・Adobe Acrobat 8.1 Combine Files）の p.1〜2 は pdftotext が1文字、pdffonts・pdfimages とも0件。p.3 以降は文字がある。
    code: "082325", name: "神栖市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["broken-text-layer"],
    reason:
      "一般会計予算に関する説明書のうち、款ごとの前年度比較が載る総括の2ページだけが文字を図形に変換した状態で作られていて、文字として取り出せない（画像も入っていない）。" +
      "一般会計予算書の第1表は款と項の金額だけで、前年度の額が無い。",
    url: "https://www.city.kamisu.ibaraki.jp/opendata/1003175/1003304.html",
    checkedOn: "2026-10-21", ref: "docs/data-sources.md §13-57",
  },
  {
    // 上越市（152226）H30・H29。R8〜H31・H28・H27 は収録済み（§13-22・#294）。
    code: "152226", name: "上越市", dataset: "budget", fiscalYears: ["H30", "H29"],
    categories: ["broken-text-layer"],
    reason:
      "「当初予算の概要」（国立国会図書館の WARP に保存された版）の文字が別の字に化けていて、" +
      "金額の数字は埋め込まれていないフォントで描かれているため1つも取り出せない。",
    url: "https://warp.ndl.go.jp/20191018/20191016211217/https://www.city.joetsu.niigata.jp/soshiki/zaisei/zaisei-30-yosan-index.html",
    checkedOn: "2026-10-21", ref: "docs/data-sources.md §13-22",
  },
  {
    // 和光市（112291）R6。R8・R7・R5〜R2 は収録済み（§13-63）。
    // 年度ページ（/shisei/zaisei/1006866/1010434/1010438.html）に「令和6年和光市議会3月定例会において、一般会計当初予算（案）の修正があり…」。
    // 概要は「各資料は原案に基づき作成しています」。【修正】版 r6ippanshusei.pdf の総括は原案のスキャン画像に赤字の修正値だけを重ねたもの。
    code: "112291", name: "和光市", dataset: "budget", fiscalYears: ["R6"],
    categories: ["format-mismatch"],
    reason:
      "市議会3月定例会で一般会計当初予算（案）が修正されて可決されたが、文字として読める款別の表（予算の概要）は修正前の原案（一般会計 31,850,000千円）のもので、" +
      "可決された当初予算は修正後の 31,248,000千円（令和7年度の資料の前年度の列）。修正後の予算書は総括のページが画像に修正値を書き加えたもので、款別の金額を文字として取り出せない。",
    url: "https://www.city.wako.lg.jp/shisei/zaisei/1006866/1010434/1010438.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-63",
  },
  {
    // 東大和市（132209）R2。R8〜R3 は収録済み（§13-63）。
    // 予算概要 20200217-135155.pdf は 67 ページで pdftotext の全文が 67 バイト・pdffonts 0件（2026-10-22 に自分で確認）。
    code: "132209", name: "東大和市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["scanned-image"],
    reason:
      "予算概要は紙をスキャンした画像の PDF で、文字として取り出せない。予算書の総括の PDF も数字の字形に文字の対応が無く、金額を取り出せない。",
    url: "https://www.city.higashiyamato.lg.jp/shisei/zaisei/1004304/1004317/index.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-63",
  },
  {
    // 高砂市（282162）R4。R8〜R5・R3・R2 は収録済み（§13-62）。
    // 概要 20220216-5.pdf の当年度 36,496,125 は原案訂正の前。議決額 36,468,186 は R5 の前年度列・財政事情 R4 予算（20220530-3.pdf）と款単位一致（繰入金・総務費が 27,939 ずつ違う）。
    // 財政事情の版には前年度の額が無い。R4 の予算書は年度ページに掲載が無い。原案訂正は議会だより第217号（/material/files/group/85/25.pdf）。
    code: "282162", name: "高砂市", dataset: "budget", fiscalYears: ["R4"],
    categories: ["format-mismatch"],
    reason:
      "市が公開している「予算の概要」は、市長が議会の審議中に予算案を訂正する前の数字のままで、繰入金と総務費の額が成立した予算と違う。" +
      "成立した予算の款ごとの額は財政事情の公表資料に載っているが、そちらには前年度の額が無い。",
    url: "https://www.city.takasago.lg.jp/gyoseisite/shiseijoho/gyozaisei/4/6/6251.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-62",
  },
  {
    // 花巻市（032051）R2。R8〜R3 は収録済み（§13-61）。
    // 予算書 02yosan.pdf（45ページ）・事項別明細書 02yosan_ippan.pdf（228ページ）とも先頭20ページで pdftotext 0字・pdffonts 0件・画像あり（2026-10-22 に自分で取得して実測）。
    code: "032051", name: "花巻市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["scanned-image"],
    reason:
      "一般会計予算書と予算事項別明細書がどちらも文字の層が無い画像で作られている。" +
      "文字が取れる参考資料は歳入の款別だけで歳出の款別が無く、広報のあらましは万円単位で前年度の額が無い。",
    url: "https://www.city.hanamaki.iwate.jp/shisei/shisei/yosan_kessan/1008155/index.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-61",
  },
  {
    // 袋井市（222160）R4。R8〜R5・R3・R2 は収録済み（§13-61）。パーサの issue に積んだ。
    code: "222160", name: "袋井市", dataset: "budget", fiscalYears: ["R4"],
    categories: ["parser-unsupported"],
    reason:
      "歳入の款別集計表の末尾にある廃止された款（自動車取得税交付金・当年度0千円・前年度1千円）が、名前の上段・金額の行・名前の下段の3行に分かれて組まれていて、" +
      "こちらの抽出処理では款名を正しく組み立てられない。原典の表は健全。",
    url: "https://www.city.fukuroi.shizuoka.jp/soshiki/6/2/zaisei/1422534504181.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-61",
  },
  {
    // 北上市（032069）R6〜R2。R8・R7 は収録済み（§13-60）。
    // 予算書（R6 2024-01-01.pdf・R5 2023-01-01.pdf・R4 2022-0202.pdf・R3 r3ippann1.pdf・R2 r2ippan1.pdf）の総括 物理 p.15〜18 は pdftotext がノンブルだけ・pdfimages 0件（文字をアウトライン化）。
    // 概要（予算（案）の概要）は歳入を「地方譲与税等※」の1行に集約（注記の内訳は地方譲与税・利子割交付金…と年度で並びが違う。R2 は自動車取得税交付金を含む）。
    code: "032069", name: "北上市", dataset: "budget", fiscalYears: ["R6", "R5", "R4", "R3", "R2"],
    categories: ["broken-text-layer", "format-mismatch"],
    reason:
      "一般会計予算書のうち、款ごとの前年度比較が載る総括のページが文字を図形に変換した状態で作られていて、ページ番号のほかは文字として取り出せない（画像も入っていない）。" +
      "予算（案）の概要にも款別の表はあるが、歳入の地方譲与税や各種の交付金を「地方譲与税等」の1行にまとめていて、款ごとの額が載っていない。",
    url: "https://www.city.kitakami.iwate.jp/life/shisei/zaisei/yosan/index.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-60",
  },
  {
    // 東松山市（112127）R4〜R2。R8〜R5 は収録済み（§13-60）。
    // 総括 R4 /uploaded/attachment/1049.pdf（フォント0・画像5）・R3 1031.pdf（文字はノンブルだけ・画像5）・R2 は WARP の 002_soukatsu.pdf（フォント0・画像5）。
    code: "112127", name: "東松山市", dataset: "budget", fiscalYears: ["R4", "R3", "R2"],
    categories: ["scanned-image"],
    reason:
      "一般会計予算説明書の総括（款ごとの前年度比較）が紙をスキャンした画像だけの PDF で、文字として取り出せない。" +
      "令和2年度は市のサイトから消えていて、国立国会図書館の WARP に残る写しもスキャン画像。",
    url: "https://www.city.higashimatsuyama.lg.jp/soshiki/4/1056.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-60",
  },
  {
    // 名取市（042072）R3・R2。R8〜R4 は収録済み（§13-66）。
    // R3 の説明書 11384.pdf は p.4（歳入の総括）が CCITT のスキャン画像でテキスト6字（p.5 の歳出の総括は文字がある）。R2 の説明書(1) 11291.pdf は p.5 以降のテキストが計12字。
    code: "042072", name: "名取市", dataset: "budget", fiscalYears: ["R3", "R2"],
    categories: ["scanned-image"],
    reason:
      "予算に関する説明書のうち、款ごとの前年度比較が載る総括のページが紙をスキャンした画像で、文字として取り出せない" +
      "（令和3年度は歳入側だけ、令和2年度は本文全体）。予算書・予算資料もほぼ画像で、概要には款別の表が無い。",
    url: "https://www.city.natori.miyagi.jp/page/5131.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-66",
  },
  {
    // 木津川市（262145）R2。R8〜R3 は収録済み（§13-66）。
    // 予算書 /cmsfiles/contents/0000000/41/ の総括 p.12・p.13 は ToUnicode 欠落の化け。decodeGarble は柱のダッシュ U+0336 で throw し、p.13 は重なった二重のテキスト層で復号表に無い字が多数出る。
    code: "262145", name: "木津川市", dataset: "budget", fiscalYears: ["R2"],
    categories: ["broken-text-layer"],
    reason:
      "一般会計予算書の総括のページの文字が別の字に化けていて、歳出のページは文字の層が二重に重なっている。" +
      "この化け方はこちらの復号の対応表に無い字を含み、款ごとの金額を正しく取り出せない。",
    url: "https://www.city.kizugawa.lg.jp/0000000041.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-66",
  },
  {
    // 香芝市（292109）R7・R5・R4。R6・R3・R2 は収録済み（§13-66）。
    // 本体の説明書（24988・14947・10215.pdf）の総括は「一部訂正」前の数字。訂正後は別ファイル（24989・15204・10640.pdf）に変わった行だけ。翌年度の前年度列は訂正後と一致。
    code: "292109", name: "香芝市", dataset: "budget", fiscalYears: ["R7", "R5", "R4"],
    categories: ["format-mismatch"],
    reason:
      "予算に関する説明書の総括は、後から一部訂正される前の数字のままで（令和7年度 34,760,000千円に対し訂正後 34,548,000千円など）、" +
      "訂正後の額は変わった行だけを並べた別の資料にしか載っていない。款ごとの前年度比較を訂正後の額でそろえた表が無い。",
    url: "https://www.city.kashiba.lg.jp/soshiki/8/6311.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-66",
  },
  {
    // 香芝市（292109）R8。説明書 31777.pdf の総括 p.5・p.6 は ToUnicode 欠落。数字は既知の帯（ASCII−0x1D）だが、款名の化け方が GARBLE_CHAR_MAP に無い変種で、
    // 本物のかな（「あ」＝諸・「わ」＝議など）に化ける字を含み isSuspectGarble が素通りさせる。decodeGarble は U+0480 ほかで throw。
    code: "292109", name: "香芝市", dataset: "budget", fiscalYears: ["R8"],
    categories: ["parser-unsupported"],
    reason:
      "予算に関する説明書の総括のページの文字が別の字に化けていて、款の名前の化け方がこちらの復号の対応表に無い（本物のひらがなに化けている字もある）。" +
      "金額の数字は読めるが、款の名前を確かめずに収録はしない。",
    url: "https://www.city.kashiba.lg.jp/soshiki/8/6311.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-66",
  },
  {
    // 大和郡山市（292036）R7・R6・R5・R3・R2。R8・R4 は収録済み（§13-64）。パーサの issue #347。
    // R7・R6・R5・R3 は説明書の総括に同一のテキスト層が x 方向に約22.7pt ずれて2重に入る。R2 は歳入の見開きで番号なしの廃止款が款名ページから落ちる。
    code: "292036", name: "大和郡山市", dataset: "budget", fiscalYears: ["R7", "R6", "R5", "R3", "R2"],
    categories: ["parser-unsupported"],
    reason:
      "令和7・6・5・3年度の予算に関する説明書は、款別の総括のページに同じ文字の層が少し横にずれて二重に入っていて、こちらの抽出処理では表を正しく読み取れない。" +
      "令和2年度は歳入の総括が左右2ページに分かれていて、廃止された款の行に番号が無いため、款名と金額の行をこちらの抽出処理で対応づけられない。原典の表は健全。",
    url: "https://www.city.yamatokoriyama.lg.jp/soshiki/zaiseika/shinozaisei/1/yosan/1490.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-64",
  },
  {
    // 近江八幡市（252042）R3。R8〜R4・R2 は収録済み（§13-64）。
    // 予算書 R3_ippan_yosan.pdf の歳出総括 p.20 は pdftotext 4字（ノンブル）・非埋め込みの MSPGothic 1つ・画像0（2026-10-22 に実測）。歳入 p.18〜19 は読める。
    code: "252042", name: "近江八幡市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["broken-text-layer"],
    reason:
      "一般会計予算書の歳出の総括（款ごとの前年度比較）のページだけ、ページ番号のほかに文字として取り出せない（画像も入っていない）。" +
      "代わりになる資料も無く、第1表は当年度の款項だけ、予算の概要は構成のグラフだけで前年度の額が無い。",
    url: "https://www.city.omihachiman.lg.jp/gyosei/gyozaisei/yosan/17908.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-64",
  },
  {
    // 牛久市（082198）R3。R8〜R4・R2 は収録済み（§13-67）。
    // 議案第18号に対する修正案「第１条中「２８，４６３，０００千円」を「２８，０１０，９５３千円」に改める。」（/data/doc/1616734624_doc_21_0.pdf）。
    // 概要（1614146964_doc_21_0.pdf）は原案で、款6 法人事業税交付金の行は整数が1つしかなく落ちる。予算書（1616734582_doc_21_0.pdf）の総括 p.11/12 は原案の額に取り消し線を引いて
    // 修正後の額を書き足した版面で、decodeGarble で読むと原案の額が Σ 差0 で通る（静かに誤る）。
    code: "082198", name: "牛久市", dataset: "budget", fiscalYears: ["R3"],
    categories: ["format-mismatch"],
    reason:
      "議会で一般会計予算が修正されたが、市が公開している当初予算案の概要は修正前の原案のまま。" +
      "予算書の総括は原案の額に取り消し線を引いて修正後の額を書き足した版面で、修正後の款ごとの額を文字として正しく取り出せない。",
    url: "https://www.city.ushiku.lg.jp/shisei/shinotorikumi/keikaku-zeisei-shisaku-kaikaku/yosan-kessan/yosan/page009643.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-67",
  },
  {
    // 綾瀬市（142182）R5。R8・R7・R6・R4 は収録済み（§13-67）。
    // 予算書 r5yosansyo.pdf の歳入総括 p.19 は poppler で文字が二重に出る（`歳歳入入`・`1133,,447788,,026`）。見出しも取れず throw。概要 r5gaiyo.pdf の〔歳入〕は款を合算した12区分。
    code: "142182", name: "綾瀬市", dataset: "budget", fiscalYears: ["R5"],
    categories: ["broken-text-layer", "format-mismatch"],
    reason:
      "予算書のうち歳入の款ごとの前年度比較が載る総括のページが、同じ文字が二重に重なった状態で作られていて、文字として正しく取り出せない。" +
      "予算の概要の歳入の表は款をまとめた区分で、款ごとの額が載っていない。",
    url: "https://www.city.ayase.kanagawa.jp/soshiki/zaiseika/zaisei/14542.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-67",
  },
  {
    // 綾瀬市（142182）R3・R2。現行サイトの財政ページに年度が無く、r3yosansyo.pdf 等を推測で叩いて 404。Wayback の CDX（material/files/group/6/・旧サイト /hp/）に予算 PDF 0件。WARP は館内限定（403）。
    code: "142182", name: "綾瀬市", dataset: "budget", fiscalYears: ["R3", "R2"],
    categories: ["no-material"],
    reason:
      "市のサイトに当初予算の資料が残っておらず、インターネットアーカイブにも見当たらない。" +
      "国立国会図書館の WARP では、この市のサイトは館内でしか閲覧できない。",
    url: "https://www.city.ayase.kanagawa.jp/soshiki/zaiseika/zaisei/index.html",
    checkedOn: "2026-10-22", ref: "docs/data-sources.md §13-67",
  },
];

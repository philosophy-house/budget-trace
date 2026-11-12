// ToUnicode の無い IPAMincho（003.03）サブセットのグリフ ID 復号（2026-11-12・諏訪 R8・R6・R5・#400）
//
// 諏訪の予算説明書は款の総括表が `HIPKPH+IPAMincho`（CID TrueType・Identity-H・ToUnicode なし）で組まれていて、
// pdftotext が出すコードポイントが**グリフ ID そのもの**（数字・カンマ・△まで全部）。既存の `GARBLE_CHAR_MAP`
// （荒川系の共通マップ）とはキーが衝突する（0xE6D が向こうでは「割」・こちらでは「利」など8字）ので、共通マップに
// 足さず**フォントごとの表**として分ける。
//
// 表は IPAmj ではなく **IPA明朝 ver.003.03 の ipam.ttf**（IPA フォントライセンス v1.0）の cmap を逆引きして作った:
// グリフ ID → そのグリフを指す Unicode のうち**最小の符号**（CJK 互換漢字より統合漢字が先に来る）。
// 載せているのは諏訪 R8 p.37/38・R6 p.6/7・R5 p.5/6 に**実際に出た字だけ**（表に無い字は throw する＝静かに通さない）。
// 生成手順（再現用）: fontTools で `TTFont("ipam.ttf").getBestCmap()` を `getGlyphID` で逆引きし、上のページの
// pdftotext -layout の出力に現れたコードポイントを引く。3年度とも全字が引け、Σ は款別で差0。
//
// ⚠ ページ番号は別フォント（IPAGothic・非埋め込み・UniJIS-UTF16-H）で、素の ASCII のまま出る。表に無い字のうち
//   **ASCII の数字と「-」だけ**を素通しにする（ページ番号「18」「- 18 -」の形）。それ以外の ASCII は throw — グリフ ID が
//   0x21〜0x7E の帯の字（ipam.ttf でこの帯にもグリフがある）が別の字のまま静かに通らないようにする（第103巡のレビュー）。
//   ⚠ 空白・改行（0x20・0x0A・0x0C・0x0D・0x09）は区別できないので素通しのまま。今回の3年度で生テキストに出た ASCII はページ番号だけ。
// ⚠ グリフ ID がアラビア文字・ヘブライ文字の帯に落ちると、pdftotext が RLE(U+202B)〜PDF(U+202C) で囲んで
//   **視覚順＝逆順**に出す。`decodeGarbleBase` と同じく区間を反転して論理順へ戻す。

export const IPAMINCHO_GID_MAP: Record<number, string> = {
  0xc6: " ", // 同じグリフに 2 符号
  0xce: "(",
  0xcf: ")",
  0xd2: ",",
  0xd6: "0",
  0xd7: "1",
  0xd8: "2",
  0xd9: "3",
  0xda: "4",
  0xdb: "5",
  0xdc: "6",
  0xdd: "7",
  0xde: "8",
  0xdf: "9",
  0x184: "　",
  0x1e5: "△",
  0x218: "１",
  0x287: "び",
  0x2bb: "ゴ",
  0x2dc: "フ",
  0x2f2: "ル",
  0x391: "安",
  0x39b: "位",
  0x3b8: "育",
  0x3ff: "衛",
  0x408: "越",
  0x40c: "円",
  0x47c: "会",
  0x4bc: "較",
  0x4c4: "額",
  0x4cd: "割",
  0x4d0: "括",
  0x4dd: "株",
  0x505: "款",
  0x50b: "環",
  0x53a: "寄",
  0x569: "議",
  0x57f: "及",
  0x5b0: "境",
  0x5b8: "教",
  0x5cb: "業",
  0x5e5: "金",
  0x60c: "繰",
  0x638: "計",
  0x668: "県",
  0x68a: "庫",
  0x6b1: "交",
  0x6b7: "公",
  0x6c6: "工",
  0x6fd: "項",
  0x704: "合",
  0x70e: "国",
  0x73f: "債",
  0x74b: "歳",
  0x754: "細",
  0x75d: "財",
  0x771: "策",
  0x793: "産",
  0x794: "算",
  0x7a1: "使",
  0x7ab: "子",
  0x7ad: "市",
  0x7b2: "支",
  0x7cf: "事",
  0x7e7: "式",
  0x821: "手",
  0x834: "収",
  0x865: "出",
  0x87f: "所",
  0x886: "書",
  0x889: "諸",
  0x899: "商",
  0x8b6: "消",
  0x8df: "場",
  0x8ec: "譲",
  0x91e: "人",
  0x936: "水",
  0x945: "数",
  0x95c: "性",
  0x967: "生",
  0x976: "税",
  0x998: "千",
  0x9bd: "前",
  0x9c1: "全",
  0x9fa: "総",
  0xa3b: "対",
  0xa7a: "単",
  0xa7d: "担",
  0xa98: "地",
  0xaf3: "通",
  0xb54: "渡",
  0xb5e: "度",
  0xb5f: "土",
  0xb7b: "当",
  0xb7e: "等",
  0xb92: "働",
  0xba3: "得",
  0xba6: "特",
  0xbe1: "入",
  0xbf0: "年",
  0xbfe: "能",
  0xc01: "農",
  0xc1c: "配",
  0xc85: "比",
  0xc90: "費",
  0xc96: "備",
  0xcd2: "付",
  0xce6: "負",
  0xcea: "附",
  0xd07: "分",
  0xd27: "別",
  0xd58: "方",
  0xd5a: "法",
  0xd82: "防",
  0xd95: "本",
  0xdc8: "民",
  0xdca: "務",
  0xdd7: "明",
  0xdf1: "木",
  0xe32: "予",
  0xe34: "与",
  0xe46: "用",
  0xe6d: "利",
  0xe94: "料",
  0xea6: "林",
  0xeb6: "例",
  0xedc: "労",
};

/** グリフ ID の帯ごとの表（Options.decodeGlyphIds で名前を指定する） */
export const GLYPH_ID_MAPS: Record<string, Record<number, string>> = {
  "IPAMincho-003.03": IPAMINCHO_GID_MAP,
};

/** ページ全文をグリフ ID の表で復号する。**表に無い字（素の印字可能 ASCII と空白・改行を除く）は列挙して throw** */
export function decodeGlyphIdText(s: string, font: string, where: string): string {
  const map = GLYPH_ID_MAPS[font];
  if (!map) throw new Error(`${where}: decodeGlyphIds — 未知のフォント名「${font}」`);
  let out = "";
  let rtl: string[] | null = null;
  const unknown = new Set<string>();
  for (const ch of s) {
    const o = ch.codePointAt(0)!;
    if (o === 0x202b) { rtl = []; continue; }
    if (o === 0x202c) {
      if (rtl) { out += rtl.reverse().join(""); rtl = null; }
      continue;
    }
    if ((o >= 0x202a && o <= 0x202e) || (o >= 0x2066 && o <= 0x2069)) continue;
    let mapped: string;
    if (ch === "\n" || ch === "\f" || ch === " " || ch === "\r" || ch === "\t") mapped = ch;
    else if (map[o] != null) mapped = map[o]!;
    else if ((o >= 0x30 && o <= 0x39) || o === 0x2d) mapped = ch; // ページ番号の数字と「-」だけ
    else {
      unknown.add(`${ch}(U+${o.toString(16).toUpperCase()})`);
      mapped = ch;
    }
    if (rtl) rtl.push(mapped);
    else out += mapped;
  }
  if (rtl) out += rtl.reverse().join("");
  if (unknown.size > 0) {
    throw new Error(
      `${where}: decodeGlyphIds（${font}）の表に無い字があります: ${[...unknown].join(" ")}。` +
        `ipam.ttf の cmap から引いて足す前に、健全な資料（他年度・概要）と突合して真の字を確かめること`,
    );
  }
  return out;
}

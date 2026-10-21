// パスベースのURLルーティング（各画面に共有可能な ASCII の実URLを割り当てる）。
//
//   /                          トップ（全国マップ）
//   /yamanashi                 市区町村選択（screen=muni）
//   /yamanashi/kofu            ダッシュボード（screen=dash）
//   /yamanashi/kofu/compare    前年比較（画面スラグを1つ足す）
//   /nagano/202011             decision 自治体（ローマ字未整備なので団体コード）
//   /sources                   データ出典（自治体スコープ外のときのみ）
//   /coverage                  データ整備状況（自治体×データセットの ○×・エビデンス保管・ライセンス）
//   /roadmap                   進捗と計画（プロジェクト全体の現在地とロードマップ）
//
// マルチバイト（日本語）のパスは共有時に %XX へエンコードされ視認性が悪いため、
// 都道府県は定型ローマ字、収録済み自治体（full/budget）は手当てしたローマ字スラグ、
// 残りの decision 自治体は団体コード（読みデータが無いため）を使う。
// 画面内の細かな状態（表示年度・ドリル位置・単位）はクエリに載せてパスを短く保つ。
import { PREF_CODES } from "./decision-index.gen";
import { MUNI_BUDGET_INDEX, BUDGET_MUNIS } from "./munibudgets.gen";

export interface RouteState {
  screen: string;
  pref: string | null;
  muni: string | null;
  muniCode?: string;
  budgetFy?: string;
  reportNo?: string;
  drillSide: string;
  drillPath: string[];
  theme: string | null;
  execFy?: string;
  execSide?: string;
  compSide?: string;
  simAxis?: string;
  simVs?: string[];
  unit?: string;
}

// 都道府県名 → ローマ字スラグ（47・ヘボン式・長音記号なし）
const PREF_ROMAJI: Record<string, string> = {
  北海道: "hokkaido", 青森県: "aomori", 岩手県: "iwate", 宮城県: "miyagi", 秋田県: "akita",
  山形県: "yamagata", 福島県: "fukushima", 茨城県: "ibaraki", 栃木県: "tochigi", 群馬県: "gunma",
  埼玉県: "saitama", 千葉県: "chiba", 東京都: "tokyo", 神奈川県: "kanagawa", 新潟県: "niigata",
  富山県: "toyama", 石川県: "ishikawa", 福井県: "fukui", 山梨県: "yamanashi", 長野県: "nagano",
  岐阜県: "gifu", 静岡県: "shizuoka", 愛知県: "aichi", 三重県: "mie", 滋賀県: "shiga",
  京都府: "kyoto", 大阪府: "osaka", 兵庫県: "hyogo", 奈良県: "nara", 和歌山県: "wakayama",
  鳥取県: "tottori", 島根県: "shimane", 岡山県: "okayama", 広島県: "hiroshima", 山口県: "yamaguchi",
  徳島県: "tokushima", 香川県: "kagawa", 愛媛県: "ehime", 高知県: "kochi", 福岡県: "fukuoka",
  佐賀県: "saga", 長崎県: "nagasaki", 熊本県: "kumamoto", 大分県: "oita", 宮崎県: "miyazaki",
  鹿児島県: "kagoshima", 沖縄県: "okinawa",
};
const PREF_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PREF_ROMAJI).map(([name, slug]) => [slug, name]),
);

// 収録済み自治体（full=甲府 + budget 12）の団体コード → ローマ字スラグ。
// 県エンティティ（山梨県の当初予算・190004）は市区町村選択 /yamanashi と衝突しないよう ken。
const MUNI_SLUGS: Record<string, string> = {
  "192015": "kofu", "192112": "fuefuki", "192023": "fujiyoshida", "192082": "minami-alps",
  "192091": "hokuto", "192066": "otsuki", "192040": "tsuru", "192139": "koshu",
  "194301": "fujikawaguchiko",
  // 中核市（2026-08-22）。鹿児島市は県と同じ語だが県は `ken` なので衝突しない（静岡市と同型）
  "122041": "funabashi", "112038": "kawaguchi", "462012": "kagoshima", "132012": "hachioji", "282014": "himeji",
  "122076": "matsudo", "382019": "matsuyama", "122033": "ichikawa",
  "092011": "utsunomiya", "282049": "nishinomiya",
  "442011": "oita", "272272": "higashiosaka", "282022": "amagasaki",
  "342076": "fukuyama", "332020": "kurashiki",
  "372013": "takamatsu",
  "142051": "fujisawa", "122173": "kashiwa",
  "132098": "machida",
  "172014": "kanazawa",
  "212016": "gifu",
  "452017": "miyazaki",
  "162019": "toyama",
  "272035": "toyonaka",
  "232114": "toyota",
  "232025": "okazaki",
  "422011": "nagasaki",
  "272108": "hirakata",
  "142018": "yokosuka",
  "272051": "suita",
  "202011": "nagano",
  "232033": "ichinomiya",
  "302015": "wakayama",
  "232017": "toyohashi",
  "102024": "takasaki",
  "292010": "nara",
  "112011": "kawagoe",
  "272078": "takatsuki",
  "252018": "otsu",
  "112089": "tokorozawa",
  "102016": "maebashi",
  "012041": "asahikawa",
  "472018": "naha",
  "112224": "koshigaya",
  "072036": "koriyama",
  "242021": "yokkaichi",
  "072044": "iwaki",
  "282031": "akashi",
  "392014": "kochi",
  "232068": "kasugai",
  "402036": "kurume",
  "032018": "morioka",
  "052019": "akita",
  "242012": "tsu",
  "082015": "mito",
  "072010": "fukushima",
  "022012": "aomori",
  "122190": "ichihara",
  "272124": "yao",
  "082201": "tsukuba",
  "142034": "hiratsuka",
  "182010": "fukui",
  "152021": "nagaoka",
  "282103": "kakogawa",
  "362018": "tokushima",
  "112216": "soka",
  "142131": "yamato",
  "222101": "fuji",
  "142077": "chigasaki",
  "132080": "chofu",
  "352012": "shimonoseki",
  "202029": "matsumoto",
  "422029": "sasebo",
  "112194": "ageo",
  "412015": "saga", // ⚠ 佐賀県 410004 は "ken" スラグなので衝突しない
  "112143": "kasukabe", // ⚠ 春日井市 232068 = "kasugai" と別物
  "282146": "takarazuka",
  "062014": "yamagata", // ⚠ 山形県 060003 は "ken" スラグなので衝突しない
  "102059": "ota-gunma", // ⚠ 大田区 131113 が "ota" を使っているので衝突を避ける
  "142123": "atsugi",
  "022039": "hachinohe",
  "132063": "fuchu-tokyo", // ⚠ 広島県府中市 342084 が未収録なだけなので `fuchu` 単独は使わない
  "122203": "nagareyama",
  "102041": "isesaki",
  "342025": "kure",
  "132292": "nishitokyo",
  "122211": "yachiyo",
  "282073": "itami",
  "132110": "kodaira",
  "112020": "kumagaya",
  "322016": "matsue",
  "242071": "suzuka",
  "132047": "mitaka",
  "232122": "anjo",
  "132128": "hino",
  "342122": "higashihiroshima",
  "272027": "kishiwada",
  "142069": "odawara",
  "132021": "tachikawa",
  "142042": "kamakura",
  "122165": "narashino",
  "122271": "urayasu",
  "232131": "nishio",
  "322032": "izumo",
  "122122": "sakura",
  "012131": "tomakomai",
  "092088": "oyama",
  "222119": "iwata",
  "112305": "niiza",
  "082023": "hitachi",
  "022021": "hirosaki",
  "012076": "obihiro",
  "452025": "miyakonojo",
  "162027": "takaoka",
  "242047": "matsusaka",
  "082210": "hitachinaka",
  "142115": "hadano",
  "352021": "ube",
  "212024": "ogaki",
  "012068": "kushiro",
  "092037": "tochigi",
  "232106": "kariya",
  "122084": "noda",
  "282171": "kawanishi",
  "202037": "ueda",
  "132136": "higashimurayama",
  "112321": "kuki",
  "232190": "komaki",
  "112151": "sayama",
  "112275": "asaka",
  "132039": "musashino",
  "212130": "kakamigahara",
  "382027": "imabari",
  "132241": "tama",
  "112372": "misato",
  "112259": "iruma",
  "112241": "toda",
  "312029": "yonago",
  "142158": "ebina",
  "272094": "moriguchi",
  "252069": "kusatsu",
  "082031": "tsuchiura",
  "092029": "ashikaga",
  "222143": "fujieda",
  "082040": "koga",
  "272205": "minoh",
  "242055": "kuwana",
  "122114": "narita",
  "352152": "shunan",
  "222127": "yaizu",
  "422045": "isahaya",
  "122068": "kisarazu",
  "042021": "ishinomaki",
  "232203": "inazawa",
  "122220": "abiko",
  "142166": "zama",
  "342050": "onomichi",
  "222071": "fujinomiya",
  "232041": "seto",
  "132055": "ome",
  "472131": "uruma",
  "132101": "koganei",
  "352080": "iwakuni",
  "402052": "iizuka",
  "462187": "kirishima",
  "042153": "osaki",
  "432024": "yatsushiro",
  "242039": "ise",
  "292052": "kashihara",
  "012173": "ebetsu",
  "112178": "konosu",
  "062031": "tsuruoka",
  "292095": "ikoma",
  "132225": "higashikurume",
  "272175": "matsubara",
  "232050": "handa",
  "092134": "nasushiobara",
  "472085": "urasoe",
  "272183": "daito",
  "342131": "hatsukaichi",
  "222135": "kakegawa",
  "112453": "fujimino",
  "452033": "nobeoka",
  "412023": "karatsu",
  "112356": "fujimi",
  "232220": "tokai",
  "092045": "sano",
  "352063": "hofu",
  "172103": "hakusan",
  "252034": "nagahama",
  "442020": "beppu",
  "112101": "kazo",
  "402184": "kasuga",
  "122319": "inzai",
  "072028": "aizuwakamatsu",
  "252026": "hikone",
  "012084": "kitami",
  "032158": "oshu",
  "122246": "kamagaya",
  "272141": "tondabayashi",
  "082171": "toride",
  "272221": "habikino",
  "282197": "sanda",
  "402028": "omuta",
  "032093": "ichinoseki",
  "222062": "mishima",
  "172031": "komatsu",
  "212041": "tajimi",
  "382060": "saijo",
  "272043": "ikeda",
  "142140": "isehara",
  "102032": "kiryu",
  "472051": "ginowan",
  "012033": "otaru",
  "212148": "kani",
  "422053": "omura",
  "112399": "sakado",
  "082279": "chikusei",
  "462039": "kanoya",
  "202177": "saku",
  "272132": "izumisano",
  "272167": "kawachinagano",
  "122289": "yotsukaido",
  "402206": "munakata",
  "202207": "azumino",
  "332038": "tsuyama",
  "222097": "shimada",
  "232301": "nisshin",
  "062049": "sakata",
  "282065": "ashiya",
  "132250": "inagi",
  "082325": "kamisu",
  "112348": "yashio",
  "232238": "obu",
  "092053": "kanuma",
  "402303": "itoshima",
  "202053": "iida",
  "402176": "chikushino",
  "152226": "joetsu",
  "012246": "chitose",
  "132071": "akishima",
  "252131": "higashiomi",
  "252093": "koka",
  "342041": "mihara",
  "282162": "takasago",
  "272248": "settsu",
  "262064": "kameoka",
  "472115": "okinawa", // ⚠ 沖縄県 470007 は "ken" スラグなので衝突しない（富山市・佐賀市と同じ規則）
  "232076": "toyokawa", "352039": "yamaguchi", "222038": "numazu", "272191": "izumi",
  // 政令指定都市（2026-07-15）
  "141003": "yokohama", "231002": "nagoya", "011002": "sapporo",
  "401307": "fukuoka", "141305": "kawasaki", "271004": "osaka",
  "111007": "saitama",
  "341002": "hiroshima",
  "281000": "kobe",
  "261009": "kyoto",
  "401005": "kitakyushu",
  "121002": "chiba",
  "041009": "sendai",
  "271403": "sakai",
  "151009": "niigata",
  "221309": "hamamatsu",
  "141500": "sagamihara",
  "431001": "kumamoto",
  "331007": "okayama",
  "221007": "shizuoka",
  // 東京特別区（2026-07-16）
  "131016": "chiyoda",
  "131024": "chuo",
  "131083": "koto",
  "131105": "meguro",
  "131113": "ota",
  "131130": "shibuya",
  "131164": "toshima",
  "131229": "katsushika",
  "131148": "nakano",
  "131237": "edogawa",
  "131156": "suginami",
  "131059": "bunkyo",
  "131041": "shinjuku",
  "131067": "taito",
  "131032": "minato",
  "131172": "kita",
  "131211": "adachi",
  "131075": "sumida",
  "131202": "nerima",
  "131181": "arakawa",
  "131199": "itabashi",
  "131121": "setagaya",
  "131091": "shinagawa",
  "130001": "ken",
  "190004": "ken",
  // 都道府県エンティティ（2026-07-25）。⚠ 県庁所在市と取り違えない —
  // 埼玉県 110001 / さいたま市 111007、千葉県 120006 / 千葉市 121002 は別団体で
  // スラグも `/saitama/ken` と `/saitama/saitama` に分かれる。
  "110001": "ken",
  "120006": "ken",
  "140007": "ken",
  "270008": "ken",
  // 2026-07-25 第2弾。⚠ 北海道 010006 ≠ 札幌市 011002 / 広島県 340006 ≠ 広島市 341002 /
  //    福岡県 400009 ≠ 福岡市 401307 ≠ 北九州市 401005
  "010006": "ken",
  "340006": "ken",
  "400009": "ken",
  // 2026-07-25 第3弾。⚠ 宮城県 040002 ≠ 仙台市 041009 / 新潟県 150002 ≠ 新潟市 151009 /
  //    熊本県 430005 ≠ 熊本市 431001
  "040002": "ken",
  "150002": "ken",
  "430005": "ken",
  // 2026-07-25 第4弾。⚠ 京都府 260002 ≠ 京都市 261009 / 岡山県 330001 ≠ 岡山市 331007
  "260002": "ken",
  "330001": "ken",
  // 2026-07-25 第5弾。⚠ 栃木県 090000 ≠ 宇都宮市 092011 / 岐阜県 210005 ≠ 岐阜市 212016 /
  //    長野県 200000 ≠ 長野市 202011 / 山口県 350001 ≠ 山口市 352039
  "080004": "ken",
  "090000": "ken",
  "200000": "ken",
  "210005": "ken",
  "350001": "ken",
  // 2026-07-26 第6弾。⚠ 群馬県 100005 ≠ 前橋市 102016 / 福島県 070009 ≠ 福島市 072010 /
  //    三重県 240001 ≠ 津市 242012 / 鹿児島県 460001 ≠ 鹿児島市 462012
  "070009": "ken",
  "100005": "ken",
  "240001": "ken",
  "460001": "ken",
  // 2026-07-26 第7弾。⚠ 愛知県 230006 ≠ 名古屋市 231002
  "230006": "ken",
  "220001": "ken", // ⚠ 静岡県 220001 ≠ 静岡市 221007 ≠ 浜松市 221309
  // 2026-07-27 第8弾。⚠ 滋賀県 250007 ≠ 大津市 252018 / 奈良県 290009 ≠ 奈良市 292010 /
  //    愛媛県 380008 ≠ 松山市 382019 / 長崎県 420000 ≠ 長崎市 422011 / 青森県 020001 ≠ 青森市 022012
  "020001": "ken",
  "250007": "ken",
  "290009": "ken",
  "380008": "ken",
  "420000": "ken",
  // 2026-07-27 第9弾。⚠ 岩手県 030007 ≠ 盛岡市 032018 / 石川県 170003 ≠ 金沢市 172014 /
  //    大分県 440001 ≠ 大分市 442011 / 宮崎県 450006 ≠ 宮崎市 452017
  "030007": "ken",
  "170003": "ken",
  "440001": "ken",
  "450006": "ken",
  // 2026-07-27 第10弾。⚠ 富山県 160008 ≠ 富山市 162019 / 香川県 370002 ≠ 高松市 372013 /
  //    秋田県 050008 ≠ 秋田市 052019 / 和歌山県 300004 ≠ 和歌山市 302015 / 佐賀県 410004 ≠ 佐賀市 412015
  "050008": "ken",
  "160008": "ken",
  "300004": "ken",
  "370002": "ken",
  "410004": "ken",
  // 2026-07-30 第11弾（47都道府県の一巡）。⚠ 福井県 180009 ≠ 福井市 182010 /
  //    徳島県 360007 ≠ 徳島市 362018 / 高知県 390003 ≠ 高知市 392014 /
  //    島根県 320005 ≠ 松江市 322016 / 鳥取県 310000 ≠ 鳥取市 312011
  "180009": "ken",
  "310000": "ken",
  "320005": "ken",
  "360007": "ken",
  "390003": "ken",
};

interface KnownMuni { code: string; name: string; pref: string; slug: string; }
const KNOWN_MUNIS: KnownMuni[] = (() => {
  const list: KnownMuni[] = [{ code: "192015", name: "甲府市", pref: "山梨県", slug: "kofu" }];
  for (const c of BUDGET_MUNIS) {
    const b = MUNI_BUDGET_INDEX[c];
    if (b && MUNI_SLUGS[c]) list.push({ code: c, name: b.muniName, pref: b.prefName, slug: MUNI_SLUGS[c]! });
  }
  return list;
})();

const PREF_NAMES = new Set(Object.keys(PREF_CODES));
const APP_SLUGS = new Set(["drill", "compare", "themes", "execution", "similar", "sources"]);
// 自治体スコープを持たない全体ページ（/sources /coverage /roadmap）
const GLOBAL_SLUGS = new Set(["sources", "coverage", "roadmap"]);

/** 自治体の URL セグメント（収録済み＝ローマ字スラグ、それ以外＝団体コード） */
function muniSegment(code: string | undefined, muni: string | null): string | null {
  if (code && MUNI_SLUGS[code]) return MUNI_SLUGS[code]!;
  if (code) return code; // decision 自治体は団体コード
  return muni; // コード未解決時は名前（decision 冷リンクの一時状態。通常は起きない）
}

/**
 * 県名 + 自治体名 → 団体コード（収録済み＝full/budget のみ）。無ければ undefined。
 * **県内でしか引かない**ので、コードを渡す原則（同名の府中市が東京と広島にある等）は崩れない。
 * 地図の政令市はここで解決する — 地図データには区の図形しか無く市のコードが取れないため。
 */
export function codeByPrefAndName(prefName: string | null, muniName: string | null): string | undefined {
  if (!prefName || !muniName) return undefined;
  return KNOWN_MUNIS.find((k) => k.pref === prefName && k.name === muniName)?.code;
}

/** pref 名 + muni セグメント → 収録済み自治体（full/budget）。無ければ null */
function knownByMuniSegment(prefName: string | null, seg: string): KnownMuni | undefined {
  if (!prefName) return undefined;
  return KNOWN_MUNIS.find((k) => k.pref === prefName && k.slug === seg);
}

const first = (v: string | string[] | undefined): string | undefined =>
  Array.isArray(v) ? v[0] : v;

/** state → パス（+クエリ）。先頭 / つき。 */
export function stateToPath(t: RouteState): string {
  const seg: string[] = [];
  const q = new URLSearchParams();
  const prefSlug = t.pref ? PREF_ROMAJI[t.pref] : undefined;
  if (t.screen === "top") {
    // ルート
  } else if (t.screen === "muni") {
    if (prefSlug) seg.push(prefSlug);
  } else if (t.screen === "coverage" || t.screen === "roadmap") {
    seg.push(t.screen); // 常に全体ページ（自治体スコープを持たない）
  } else if (t.screen === "sources" && !t.muni) {
    seg.push("sources");
  } else {
    // 自治体スコープの画面（dash はスラグ無し）
    if (prefSlug) seg.push(prefSlug);
    const ms = muniSegment(t.muniCode, t.muni);
    if (ms) seg.push(ms);
    if (t.screen !== "dash") seg.push(t.screen);
  }
  if (t.budgetFy) q.set("fy", t.budgetFy);
  if (t.screen === "dash" && t.reportNo) q.set("rno", t.reportNo);
  if (t.screen === "drill") {
    if (t.drillSide && t.drillSide !== "exp") q.set("side", t.drillSide);
    if (t.drillPath.length) q.set("path", t.drillPath.join("/"));
  }
  if (t.screen === "themes" && t.theme) q.set("theme", t.theme);
  if (t.screen === "execution") {
    if (t.execFy) q.set("efy", t.execFy);
    if (t.execSide && t.execSide !== "exp") q.set("eside", t.execSide);
  }
  if (t.screen === "compare" && t.compSide && t.compSide !== "exp") q.set("cside", t.compSide);
  if (t.screen === "similar") {
    // 比較軸と比較相手（団体コード）。共有すると同じ比較表が開く
    if (t.simAxis && t.simAxis !== "pop") q.set("axis", t.simAxis);
    if (t.simVs?.length) q.set("vs", t.simVs.join(","));
  }
  if (t.unit === "per") q.set("unit", "per");
  // ドリルパス（日本語）はクエリなので encodeURIComponent される。パスセグメントは ASCII。
  const path = "/" + seg.map(encodeURIComponent).join("/");
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

/** パスセグメント + クエリ → state。未知パスは top に丸める。 */
export function pathToState(
  rawSegments: string[],
  query: Record<string, string | string[] | undefined> = {},
): RouteState {
  const segments = rawSegments
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .filter(Boolean);
  const g = (k: string) => first(query[k]);

  let screen = "top";
  let pref: string | null = null;
  let muni: string | null = null;
  let muniCode: string | undefined;

  if (segments.length === 0) {
    screen = "top";
  } else if (segments.length === 1 && GLOBAL_SLUGS.has(segments[0]!)) {
    screen = segments[0]!;
  } else if (PREF_BY_SLUG[segments[0]!]) {
    pref = PREF_BY_SLUG[segments[0]!]!;
    if (segments.length === 1) {
      screen = "muni";
    } else {
      const seg1 = segments[1]!;
      const known = knownByMuniSegment(pref, seg1);
      if (known) {
        muni = known.name;
        muniCode = known.code;
      } else if (/^\d{6}$/.test(seg1)) {
        // decision 自治体は団体コード。名前は県シャード取得後に解決する
        muniCode = seg1;
      } else {
        // 未知の自治体セグメント → 市区町村選択に丸める
        screen = "muni";
      }
      if (muni !== null || muniCode) {
        const slug = segments[2];
        screen = slug && APP_SLUGS.has(slug) ? slug : "dash";
      }
    }
  } else if (PREF_NAMES.has(segments[0]!)) {
    // 後方互換: 旧・日本語パス（/山梨県/甲府市…）も受ける
    pref = segments[0]!;
    if (segments.length === 1) {
      screen = "muni";
    } else {
      muni = segments[1]!;
      const k = KNOWN_MUNIS.find((x) => x.pref === pref && x.name === muni);
      muniCode = k?.code;
      const slug = segments[2];
      screen = slug && APP_SLUGS.has(slug) ? slug : "dash";
    }
  } else {
    screen = "top"; // 未知のパス
  }

  return {
    screen,
    pref,
    muni,
    muniCode,
    budgetFy: g("fy") ?? undefined,
    reportNo: g("rno") ?? undefined,
    drillSide: g("side") ?? "exp",
    drillPath: g("path")?.split("/").filter(Boolean) ?? [],
    theme: g("theme") ?? null,
    execFy: g("efy") ?? undefined,
    execSide: g("eside") ?? "exp",
    compSide: g("cside") ?? "exp",
    simAxis: g("axis") ?? undefined,
    // 団体コード（6桁）以外は捨てる。未指定なら軸のサジェストが既定で載る
    simVs: g("vs")?.split(",").filter((c) => /^\d{6}$/.test(c)) ?? undefined,
    unit: g("unit") === "per" ? "per" : "total",
  };
}

/** location.pathname / location.search から state を作る（popstate 用） */
export function locationToState(pathname: string, search: string): RouteState {
  const segments = pathname.split("/").filter(Boolean);
  const query = Object.fromEntries(new URLSearchParams(search));
  return pathToState(segments, query);
}

const SCREEN_LABELS: Record<string, string> = {
  muni: "市区町村を選ぶ",
  dash: "予算ダッシュボード",
  drill: "款・項・目・節",
  compare: "前年比較",
  themes: "政策テーマ",
  execution: "予算執行状況",
  similar: "類似自治体との比較",
  sources: "データ出典・更新日",
  coverage: "データ整備状況",
  roadmap: "進捗と計画",
};

/** 共有時のページタイトル（link preview 用） */
export function pageTitle(t: RouteState): string {
  const base = "予算トレース";
  if (t.screen === "top") return `${base} — 地方自治体の予算執行可視化`;
  const label = SCREEN_LABELS[t.screen] ?? "";
  if (t.screen === "muni" && t.pref) return `${t.pref}の市区町村 — ${base}`;
  if (t.muni) {
    // decision 自治体（ローマ字スラグを持たない＝総務省決算ベース）のダッシュボードは
    // 画面見出しと同じ「決算」。予算収録済み（full/budget）は「予算」
    const isDecision = !!t.muniCode && !MUNI_SLUGS[t.muniCode];
    const sub = t.screen === "dash" ? (isDecision ? "決算" : "予算") : label;
    return `${t.muni}の${sub} — ${base}`;
  }
  return label ? `${label} — ${base}` : base;
}

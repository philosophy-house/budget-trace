/**
 * 公開サイトの素性。**ドメインをここ1か所に持つ** — OGP・canonical・robots・sitemap が
 * すべてこれを基準にするので、別々に直書きすると必ずどれかが古いままになる
 * （このプロジェクトが繰り返し踏んでいる「手書きの二重管理」と同じ型）。
 *
 * 2026-07-30 に独自ドメイン `budget-trace.phh.jp` へ移行した。Vercel の
 * `budget-trace-tawny.vercel.app` は引き続き生きているが、**正典はこちら**
 * （canonical をこのドメインに向けているので、検索エンジンには1本化して見える）。
 */
export const SITE_URL = "https://budget-trace.phh.jp";
export const SITE_NAME = "予算トレース";

/**
 * プライバシーポリシー。**www.phh.jp のものを正典にする**（2026-07-30 のユーザー判断）。
 * 事業者は同じ合同会社 哲學舎で、計測の仕組み（GTM・GA4・同意バナー・同意 Cookie）も
 * 完全に同一なので、ポリシーを2つに分けると必ず片方が古くなる。
 * ⚠ **絶対 URL で持つ** — www.phh.jp のバナーは相対パス `/privacy` を書いているが、
 * こちらで相対にすると budget-trace.phh.jp に存在しないページを指す。
 */
export const PRIVACY_URL = "https://www.phh.jp/privacy";

/**
 * 運営元（合同会社 哲學舎）とそのサイト。フッターから辿れるようにする（2026-11-17）。
 * 検索から来る人の多くはこのサイトに直接着くが、運営元へのリンクがプライバシーポリシーしか
 * 無く、誰が作っているサイトかが分からなかった。
 * ⚠ **www 付きで持つ** — phh.jp は www.phh.jp へ転送されており、www.phh.jp 側の canonical も www。
 */
export const OPERATOR_NAME = "合同会社 哲學舎";
export const OPERATOR_URL = "https://www.phh.jp";
export const SITE_TITLE = `${SITE_NAME} — 地方自治体の予算執行可視化`;
export const SITE_DESCRIPTION =
  "税金のゆくえを、執行まで。地方公共団体の予算（歳入・歳出）から執行率・支出先・事業報告までを一次資料付きで確認できるプロトタイプ。";

/**
 * OGP 画像（`public/og.png`）。**数字を焼き込んでいない** — 収録が進むと必ず古くなるため
 * （このプロジェクトの「進捗の数字を手書きしない」原則と同じ）。
 *
 * 再生成の手順は docs/handoff.md「公開用の設定」節。生成は手元だけで行い、
 * **本番に Google Fonts への実行時フェッチを持ち込まない**（成果物の PNG だけを置く）。
 *
 * ⚠ layout と各ページの両方で明示すること。Next は `openGraph` / `twitter` を
 * **フィールド単位でなくオブジェクトごと**子で置き換えるので、片方だけだと画像が落ちる。
 */
export const OG_IMAGE = {
  url: "/og.png",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — 税金のゆくえを、執行まで。`,
} as const;

// data/raw の一次資料 PDF を public/sources/<sourceId>/ へ同期する（dev / build の前段）。
// アプリのエビデンスリンクは自サーバーのこのコピーを開く（ドロワーでその場レビュー）。
// - コピー元は git にコミット済みの raw（sha256 で来歴固定）なので、public 側は
//   生成物として gitignore し、二重コミットしない
// - PDF・HTML・Excel を同期する（PDF はドロワーで描画、HTML はサンドボックス iframe、
//   Excel はコピーのダウンロード）
//
// **要許可（permission-required）の資料は同期しない**（2026-07-17）。画面のリンクが
// 発行元へ振り替わる資料（`RESTRICTED_EVIDENCE`）は、コピーを置いても**誰も開けない**。
// 実測で **829MB 中 667MB（80%）が開けないまま Vercel へ配られていた**。
//
// ⚠ **判定を再実装しないこと** — アプリ（`D.evidenceHref` / `openViewer`）が読むのと
//   **同じ `RESTRICTED_EVIDENCE` を import する**のが肝。同じ1つの表を両者が見るので、
//   「アプリが開こうとするのに public に無い」（＝404）が**原理的に起きない**。
//   ここで licenseClass を引き直したりパスを組み直したりすると、その保証が消える。
//
// **エビデンス3層コピーは壊れない** — public/sources は複製ではなく derive された配信物で、
// 記録としての原本は①の git raw。発行元が資料を消してリンクを自分のコピーへ戻すときは、
// 区分を変えて derive → sync すれば復活する（raw は git にあるので1コマンド）。
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { RESTRICTED_EVIDENCE } from "../src/client/lib/evidence-policy.gen";
import { isServedRaw } from "./lib/served-raw";

const RAW_DIR = join(process.cwd(), "data", "raw");
const OUT_DIR = join(process.cwd(), "public", "sources");

rmSync(OUT_DIR, { recursive: true, force: true });

let count = 0;
let skipped = 0;
let skippedBytes = 0;
const seenRestricted = new Set<string>();
if (existsSync(RAW_DIR)) {
  for (const sourceId of readdirSync(RAW_DIR)) {
    const srcDir = join(RAW_DIR, sourceId);
    if (!statSync(srcDir).isDirectory()) continue;
    for (const filename of readdirSync(srcDir)) {
      const served = isServedRaw(sourceId, filename);
      if (served === "skip") continue;
      const localUrl = `/sources/${sourceId}/${filename}`;
      if (served === "restricted") {
        // リンクは発行元（消えている資料は魚拓）へ向く＝このコピーは到達不能なので配らない
        seenRestricted.add(localUrl);
        skipped++;
        skippedBytes += statSync(join(srcDir, filename)).size;
        continue;
      }
      mkdirSync(join(OUT_DIR, sourceId), { recursive: true });
      copyFileSync(join(srcDir, filename), join(OUT_DIR, sourceId, filename));
      count++;
    }
  }
}
const mb = (b: number) => `${(b / 1048576).toFixed(0)}MB`;
console.log(
  `✓ 一次資料を public/sources へ同期（${count} ファイル）` +
    `／要許可のため未配信 ${skipped} ファイル・${mb(skippedBytes)}（リンクは発行元へ）`,
);

// 台帳が実体より進んでいないかの確認。RESTRICTED_EVIDENCE のキーは raw の実ファイルから
// derive しているので、raw に無いキーが残っていたら**方針が古い**（資料を消した・改名した）。
// 404 は起きない側の不整合なので throw せず警告に留める（raw を部分取得した状態でも dev は回る）。
const staleKeys = Object.keys(RESTRICTED_EVIDENCE).filter((k) => !seenRestricted.has(k));
if (staleKeys.length > 0) {
  console.warn(
    `⚠ リンク方針に raw が無いキーが ${staleKeys.length} 件（方針が古いか raw が未取得）:\n` +
      staleKeys.slice(0, 5).map((k) => `    ${k}`).join("\n") +
      (staleKeys.length > 5 ? `\n    … 他 ${staleKeys.length - 5} 件` : ""),
  );
}

// PDF.js のワーカーも public へ同梱する（ドロワーの PDF ビューア用。
// iframe のブラウザ内蔵ビューアは Safari で1ページ目しか描画されないため、
// PDF.js でアプリ内描画する。CDN からはフェッチしない — オフライン方針）
const WORKER_SRC = join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const WORKER_OUT = join(process.cwd(), "public", "vendor", "pdf.worker.min.mjs");
mkdirSync(join(process.cwd(), "public", "vendor"), { recursive: true });
copyFileSync(WORKER_SRC, WORKER_OUT);
console.log("✓ PDF.js ワーカーを public/vendor へ同期");

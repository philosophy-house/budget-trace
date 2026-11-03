// 本番デプロイで取り出す raw のパス（git の追跡ファイルから、配るものだけ）を1行ずつ出す。
// blob を取らずに一覧できるよう、作業ツリーではなく `git ls-tree` を読む（.github/workflows/deploy.yml）
import { execFileSync } from "node:child_process";
import { isServedRaw } from "./lib/served-raw";

const out = execFileSync("git", ["-c", "core.quotePath=false", "ls-tree", "-r", "--name-only", "HEAD", "data/raw"], { maxBuffer: 1 << 28 }).toString();
for (const p of out.split("\n")) {
  const [, , sourceId, filename, ...rest] = p.split("/");
  if (!sourceId || !filename || rest.length) continue;
  if (isServedRaw(sourceId, filename) === "served") console.log(p);
}

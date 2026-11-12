// ワークツリーの data/raw（一次資料の原本・全体で約 14GB）を取り出す範囲を切り替える。
//
// 使い方:
//   bun run worktree:slim             # data/raw を取り出さない（ワークツリーが約 1.4GB になる）
//   bun run worktree:raw <id...>      # その資料の raw だけ取り出す（parse し直すとき）
//   bun run worktree:raw --parser <p> # そのパーサの全資料の raw を取り出す（パーサを変えたあとの全件 parse）
//   bun run worktree:raw --all        # 全部取り出す（元に戻す）
//
// 並列の巡がそれぞれ 14GB を取り出してディスクが尽きた（2026-11-12）。derive・型検査・ビルドは raw を読まない
// （CI も raw なしで回している）。fetch / ingest は書く前に自分でその資料を対象に入れる（lib/store.ts）。
// 設定はワークツリーごと（extensions.worktreeConfig）なので、本体のチェックアウトや他のワークツリーには及ばない。
import { execFileSync } from "node:child_process";
import { SOURCES } from "./registry/sources";

const git = (args: string[]) => execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const args = process.argv.slice(2);

if (args[0] === "slim") {
  const dirty = git(["status", "--porcelain", "--", "data/raw"]).trim();
  if (dirty) {
    console.error(`data/raw にコミットしていない変更があります。先にコミットしてください:\n${dirty}`);
    process.exit(1);
  }
  git(["sparse-checkout", "set", "--no-cone", "/*", "!/data/raw/"]);
  console.log("✓ data/raw を取り出さない設定にした（このワークツリーだけ）。戻すには bun run worktree:raw --all");
} else if (args.includes("--all")) {
  git(["sparse-checkout", "disable"]);
  console.log("✓ data/raw を全部取り出した");
} else {
  const p = args.indexOf("--parser");
  const ids = p >= 0 ? SOURCES.filter((s) => s.parser === args[p + 1]).map((s) => s.id) : args;
  const unknown = ids.filter((id) => !SOURCES.some((s) => s.id === id));
  if (ids.length === 0 || unknown.length > 0) {
    console.error(unknown.length ? `ソースが見つかりません: ${unknown.join(", ")}` : "sourceId か --parser <名前> か --all を渡してください");
    process.exit(1);
  }
  if (git(["config", "--get", "core.sparseCheckout"]).trim() !== "true") {
    console.log("このワークツリーは data/raw を全部取り出しています（何もしない）");
  } else {
    execFileSync("git", ["sparse-checkout", "add", "--stdin"], { input: ids.map((id) => `/data/raw/${id}/`).join("\n"), stdio: ["pipe", "inherit", "inherit"] });
    console.log(`✓ ${ids.length} 資料の raw を取り出した`);
  }
}

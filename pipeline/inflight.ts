// 別セッションが進めている仕事（main にまだ入っていないもの）の一覧。**仕事を選ぶ前に必ず回す**（loop.md §0）。
//
// 使い方:
//   bun run pipeline:inflight              # 一覧だけ
//   bun run pipeline:inflight 香川 愛媛 kagawa   # 語を渡すと、当たったものを示して exit 1
//
// 見るのは3つ（どれも origin/main との差だけ）:
//   1. open の PR（draft を含む）
//   2. PR の無い作業ブランチ（直近3日に push されたもの。マージ・クローズ済みの PR のブランチは除く）
//   3. このマシンの他のワークツリー（コミット前の変更を含む）
// それぞれについて、タイトル・ブランチ名と、registry（`pipeline/registry/sources.ts`）に足した
// `id` / `title` を出す。語の照合はこれら全部に対して行う（部分一致）。
//
// ⚠ **見えるのは push 済みのものと、このマシンのワークツリーだけ**。クラウドのセッションや別の
// マシンの手元の作業は見えないので、着手したらすぐ draft PR で宣言する（loop.md §0）。
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const REGISTRY = "pipeline/registry/sources.ts";
const RECENT_DAYS = 3;

function sh(cmd: string, args: string[], cwd?: string): string {
  try {
    return execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
  } catch {
    return "";
  }
}

/** diff の追加行から registry の id と title を拾う */
function addedEntries(diff: string): string[] {
  const out: string[] = [];
  for (const line of diff.split("\n")) {
    // 年度をまとめた行は id がテンプレート（`kurobe-yosan-gaiyou-${fy.toLowerCase()}`）
    const m = line.match(/^\+\s+(id|title):\s*["`]([^"`]+)["`]/);
    if (m) out.push(`${m[1]}: ${m[2]}`);
  }
  return out;
}

type Item = { kind: string; label: string; entries: string[]; files: string[] };
const items: Item[] = [];

sh("git", ["fetch", "origin", "--prune", "-q"]);
const self = resolve(sh("git", ["rev-parse", "--show-toplevel"]).trim());
// 自分のブランチの PR・ブランチは照合しない（宣言した draft PR に自分で当たる）
const selfBranch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();

// 1. open の PR
type Pr = { number: number; title: string; headRefName: string; isDraft: boolean; state: string };
const prsAll = JSON.parse(sh("gh", ["pr", "list", "--state", "all", "--limit", "200", "--json", "number,title,headRefName,isDraft,state"]) || "[]") as Pr[];
const closedHeads = new Set(prsAll.filter((p) => p.state !== "OPEN").map((p) => p.headRefName));
const openHeads = new Set<string>();
for (const p of prsAll.filter((p) => p.state === "OPEN")) {
  openHeads.add(p.headRefName);
  if (p.headRefName === selfBranch) continue;
  const ref = `origin/${p.headRefName}`;
  items.push({
    kind: p.isDraft ? "PR（draft）" : "PR",
    label: `#${p.number} ${p.title}  [${p.headRefName}]`,
    entries: addedEntries(sh("git", ["diff", `origin/main...${ref}`, "--", REGISTRY])),
    files: sh("git", ["diff", "--name-only", `origin/main...${ref}`]).split("\n").filter(Boolean),
  });
}

// 2. PR の無い作業ブランチ
const since = Date.now() / 1000 - RECENT_DAYS * 86400;
for (const line of sh("git", ["for-each-ref", "refs/remotes/origin", "--format=%(committerdate:unix)\t%(refname:short)\t%(subject)"]).split("\n")) {
  const [ts, ref, subject] = line.split("\t");
  if (!ref || ref === "origin/main" || ref === "origin" || Number(ts) < since) continue;
  const head = ref.replace(/^origin\//, "");
  if (head === selfBranch || openHeads.has(head) || closedHeads.has(head)) continue;
  if (sh("git", ["rev-list", "-1", `origin/main..${ref}`]).trim() === "") continue;
  items.push({
    kind: "ブランチ（PR なし）",
    label: `${head} — ${subject}`,
    entries: addedEntries(sh("git", ["diff", `origin/main...${ref}`, "--", REGISTRY])),
    files: sh("git", ["diff", "--name-only", `origin/main...${ref}`]).split("\n").filter(Boolean),
  });
}

// 3. このマシンの他のワークツリー
for (const block of sh("git", ["worktree", "list", "--porcelain"]).split("\n\n")) {
  const path = block.match(/^worktree (.+)$/m)?.[1];
  if (!path || resolve(path) === self) continue;
  const branch = block.match(/^branch refs\/heads\/(.+)$/m)?.[1] ?? "(detached)";
  if (branch === "main") continue;
  const base = sh("git", ["merge-base", "HEAD", "origin/main"], path).trim();
  if (!base) continue;
  // 作業ツリー（コミット前を含む）が分岐点から変えたファイルのうち、いまの main とも違うもの。
  // squash マージ済みのブランチに残ったワークツリーは分岐点から見ると差があるが、main とは同じになる。
  const vsMain = new Set(sh("git", ["diff", "--name-only", "origin/main"], path).split("\n").filter(Boolean));
  const files = sh("git", ["diff", "--name-only", base], path).split("\n").filter((f) => f && vsMain.has(f));
  const untracked = sh("git", ["ls-files", "--others", "--exclude-standard"], path).split("\n").filter(Boolean);
  if (files.length === 0 && untracked.length === 0) continue;
  items.push({
    kind: "ワークツリー",
    label: `${path}  [${branch}]`,
    // main との差の追加行（main 側が先に進んだぶんは削除行に出るので拾わない）
    entries: addedEntries(sh("git", ["diff", "origin/main", "--", REGISTRY], path)),
    files: [...files, ...untracked.map((f) => `${f}（未追跡）`)],
  });
}

const terms = process.argv.slice(2);
const hits: string[] = [];
if (items.length === 0) console.log("main に入っていない仕事は見つかりません（push 済み・このマシンのワークツリーの範囲）。");
for (const it of items) {
  console.log(`■ ${it.kind}: ${it.label}`);
  for (const e of it.entries.slice(0, 60)) console.log(`    ${e}`);
  if (it.entries.length > 60) console.log(`    …ほか ${it.entries.length - 60} 行`);
  if (it.entries.length === 0) {
    const shown = it.files.slice(0, 8);
    console.log(`    （registry の追加なし）変更: ${shown.join(", ")}${it.files.length > shown.length ? ` …ほか ${it.files.length - shown.length} 件` : ""}`);
  }
  // 部分一致なので「saga」が「sagae」（寒河江）にも当たる。当たった行を出して、人が見分けられるようにする
  for (const t of terms) {
    const lines = [it.label, ...it.entries, ...it.files].filter((l) => l.includes(t));
    if (lines.length > 0) hits.push(`「${t}」 ← ${it.kind}: ${it.label}\n      当たった行: ${lines.slice(0, 3).join(" ／ ")}${lines.length > 3 ? ` …ほか ${lines.length - 3} 行` : ""}`);
  }
}
if (terms.length > 0) {
  if (hits.length > 0) {
    console.log("\n⚠ 別の仕事と重なっています（部分一致なので、当たった行を見て別の団体への誤爆でないかを確かめる）。重なっていれば着手しないか、相手と分担を決めてから進めること:");
    for (const h of hits) console.log(`  ${h}`);
    process.exit(1);
  }
  console.log(`\n重なりなし: ${terms.join("・")}`);
}

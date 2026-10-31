// [1d]→ `pipeline:archive` の試行の記録（lib/archive-state.ts）を集計する。
// 使い方: bun run pipeline:archive-attempts [--since YYYY-MM-DD] [--url <部分一致>]
//
// 「未確認」を型ごとに数える（2026-10-31）。以前は archive が画面に出すだけで、未確認率は
// 台帳からも数えられなかった（docs/proposals/wayback-bottleneck.md §2-4）。
// 記録は全ワークツリーで共有（git の共通ディレクトリ）なので、並行のセッションの分も入る。
import { attemptsPath, readAttempts, type AttemptOutcome } from "./lib/archive-state";

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const since = opt("--since");
const urlPart = opt("--url");

const jstDay = (iso: string) => new Date(new Date(iso).getTime() + 9 * 3600_000).toISOString().slice(0, 10);
const rows = readAttempts().filter(
  (a) => (!since || jstDay(a.at) >= since) && (!urlPart || a.url.includes(urlPart)),
);
console.log(`記録: ${attemptsPath()}（${rows.length} 件）`);
if (rows.length === 0) process.exit(0);

const ORDER: AttemptOutcome[] = [
  "reused", "saved", "pending", "spn-down", "rate-limited", "rejected", "skipped", "cdx-error", "error",
];
const byDay = new Map<string, Map<AttemptOutcome, number>>();
for (const a of rows) {
  const d = jstDay(a.at);
  const m = byDay.get(d) ?? new Map<AttemptOutcome, number>();
  m.set(a.outcome, (m.get(a.outcome) ?? 0) + 1);
  byDay.set(d, m);
}
// SPN を呼んだ試行のうち、捕捉が取れなかった割合（reused・skipped・cdx-error・error は SPN を呼んでいない）
const SPN_CALLED: AttemptOutcome[] = ["saved", "pending", "spn-down", "rate-limited", "rejected"];
console.log(`\n日（JST）\t${ORDER.join("\t")}\tSPN の未確認率`);
for (const [d, m] of [...byDay].sort(([a], [b]) => a.localeCompare(b))) {
  const called = SPN_CALLED.reduce((s, k) => s + (m.get(k) ?? 0), 0);
  const miss = called - (m.get("saved") ?? 0);
  const rate = called ? `${((miss / called) * 100).toFixed(0)}%（${miss}/${called}）` : "—";
  console.log(`${d}\t${ORDER.map((k) => m.get(k) ?? 0).join("\t")}\t${rate}`);
}

// 時間ごとの SPN の結末（止まった時間帯を見つけるため）。直近の日だけ
const lastDay = [...byDay.keys()].sort().at(-1)!;
const byHour = new Map<number, Map<AttemptOutcome, number>>();
for (const a of rows) {
  if (jstDay(a.at) !== lastDay || !SPN_CALLED.includes(a.outcome)) continue;
  const h = new Date(new Date(a.at).getTime() + 9 * 3600_000).getUTCHours();
  const m = byHour.get(h) ?? new Map<AttemptOutcome, number>();
  m.set(a.outcome, (m.get(a.outcome) ?? 0) + 1);
  byHour.set(h, m);
}
if (byHour.size) {
  console.log(`\n${lastDay} の時間ごと（SPN を呼んだ試行）`);
  for (const [h, m] of [...byHour].sort(([a], [b]) => a - b)) {
    console.log(`  ${String(h).padStart(2, "0")}時\t${[...m].map(([k, v]) => `${k} ${v}`).join("・")}`);
  }
}

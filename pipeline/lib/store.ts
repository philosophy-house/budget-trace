// data/ 階層の入出力ヘルパ。
// - data/raw/<sourceId>/         バイナリ本体（原本アーカイブとしてコミット。
//                                フィクスチャの raw だけ gitignore・再生成可能）
// - data/raw-meta/<sourceId>.json 取得来歴（コミット対象。ハッシュで raw を固定）
// - data/parsed/<sourceId>.json   抽出結果（コミット対象）
// - data/parsed/<sourceId>.validation.json 検証結果
// - data/normalized/<dataset>/<fy>.json     比較可能データ（コミット対象）
// - data/normalized/_fixtures/…             フィクスチャ由来の隔離出力
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { rawMetaSchema, type RawMeta } from "../types";

export const DATA_DIR = join(process.cwd(), "data");
export const rawDir = (sourceId: string) => join(DATA_DIR, "raw", sourceId);
export const rawMetaPath = (sourceId: string) => join(DATA_DIR, "raw-meta", `${sourceId}.json`);
export const parsedPath = (sourceId: string) => join(DATA_DIR, "parsed", `${sourceId}.json`);
export const validationPath = (sourceId: string) =>
  join(DATA_DIR, "parsed", `${sourceId}.validation.json`);
export const normalizedPath = (dataset: string, fiscalYear: string, fixture: boolean) =>
  join(DATA_DIR, "normalized", ...(fixture ? ["_fixtures"] : []), dataset, `${fiscalYear}.json`);

// data/raw を取り出していないワークツリー（`bun run worktree:slim`・sparse-checkout）かどうか。
// raw は1本 14GB あり、並列の巡のワークツリーごとに取り出すとディスクが尽きる（2026-11-12）。
let sparse: boolean | null = null;
const git = (args: string[]) =>
  execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
export function isSparseWorktree(): boolean {
  if (sparse === null) {
    try {
      sparse = git(["config", "--get", "core.sparseCheckout"]) === "true";
    } catch {
      sparse = false;
    }
  }
  return sparse;
}
/**
 * その資料の raw を sparse-checkout の対象に入れる。**raw を書く前に呼ぶ** — 対象の外に書いたファイルは
 * `git add` が黙って拒む（`--sparse` が要る）ので、raw-meta だけがコミットされて原本が落ちる。
 */
export function includeRawInSparseCheckout(sourceId: string): void {
  if (!isSparseWorktree()) return;
  const pattern = `/data/raw/${sourceId}/`;
  if (git(["sparse-checkout", "list"]).split("\n").includes(pattern)) return;
  git(["sparse-checkout", "add", pattern]);
}

export function sha256Of(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

export function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n", "utf8");
}

export function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readRawMeta(sourceId: string): RawMeta | null {
  const p = rawMetaPath(sourceId);
  if (!existsSync(p)) return null;
  return rawMetaSchema.parse(readJson(p));
}

/**
 * ファイルを raw 層に登録する（fetch / ingest-local 共通）。
 * 既存メタとハッシュが違う場合は「資料が更新された」ことを警告して上書きする。
 */
export function registerRawFile(
  sourceId: string,
  srcFilePath: string,
  fetchedFrom: string,
  transform?: string[],
): { meta: RawMeta; changed: boolean } {
  const dir = rawDir(sourceId);
  includeRawInSparseCheckout(sourceId);
  mkdirSync(dir, { recursive: true });
  const filename = basename(srcFilePath);
  const dest = join(dir, filename);
  if (srcFilePath !== dest) copyFileSync(srcFilePath, dest);

  const entry = {
    filename,
    sha256: sha256Of(dest),
    bytes: readFileSync(dest).byteLength,
    fetchedAt: new Date().toISOString(),
    fetchedFrom,
    ...(transform?.length ? { transform } : {}),
  };

  const prev = readRawMeta(sourceId);
  const prevEntry = prev?.files.find((f) => f.filename === filename);
  const changed = !!prevEntry && prevEntry.sha256 !== entry.sha256;
  if (changed) {
    console.warn(
      `⚠ ${sourceId}/${filename}: ハッシュが前回と異なります（資料が更新された可能性）。\n` +
        `  旧: ${prevEntry!.sha256}\n  新: ${entry.sha256}`,
    );
  }

  const files = [...(prev?.files.filter((f) => f.filename !== filename) ?? []), entry];
  const meta: RawMeta = rawMetaSchema.parse({ sourceId, files });
  writeJson(rawMetaPath(sourceId), meta);
  return { meta, changed };
}

/** raw 層のファイルがメタのハッシュと一致するか検証してからパスを返す */
export function resolveRawFile(sourceId: string, filename: string): string {
  const meta = readRawMeta(sourceId);
  const entry = meta?.files.find((f) => f.filename === filename);
  if (!meta || !entry) {
    throw new Error(
      `${sourceId} の raw メタがありません。先に pipeline:fetch か pipeline:ingest を実行してください。`,
    );
  }
  const path = join(rawDir(sourceId), filename);
  if (!existsSync(path)) {
    throw new Error(
      `${path} がありません。` +
        (isSparseWorktree()
          ? `このワークツリーは data/raw を取り出していません。bun run worktree:raw ${sourceId} で取り出してください。`
          : `fetch/ingest で再取得してください（フィクスチャは pipeline:fixture で再生成）。`),
    );
  }
  const actual = sha256Of(path);
  if (actual !== entry.sha256) {
    throw new Error(
      `${path} のハッシュがメタと一致しません。来歴が壊れています。\n` +
        `  メタ: ${entry.sha256}\n  実体: ${actual}`,
    );
  }
  return path;
}

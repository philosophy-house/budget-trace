// raw のどのファイルを public/sources へ配るか（sync-public-sources と本番デプロイの取り出しで共有する）。
//
// 本番デプロイ（.github/workflows/deploy.yml）は、data/raw のうち**配るファイルだけ**を取り出してビルドする
// （2026-11-03）。raw は 13.97 GiB あり、Vercel の git 連携は作業ツリー全体を clone するので、clone が
// ビルドの上限時間を超えて本番が出なくなった。配るのは 0.83 GiB（555 ファイル）で、残りは要許可の資料＝
// 画面のリンクが発行元へ振り替わり誰も開けない写し。判定を2か所に持つと「取り出さなかったのに sync が
// 配ろうとする」がずれるので、**この関数だけを使う**
import { RESTRICTED_EVIDENCE } from "../../src/client/lib/evidence-policy.gen";

/** "served" ＝ public/sources へ配る、"restricted" ＝ 要許可で配らない、"skip" ＝ 配信の対象外の種類・フィクスチャ */
export function isServedRaw(sourceId: string, filename: string): "served" | "restricted" | "skip" {
  if (sourceId.startsWith("fixture-") || !/\.(pdf|html?|xlsx?|csv)$/i.test(filename)) return "skip";
  return RESTRICTED_EVIDENCE[`/sources/${sourceId}/${filename}`] ? "restricted" : "served";
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# はじめに

このリポジトリ（または新しいセッション）が初めてなら、本書の次に [docs/handoff.md](docs/handoff.md) を読むこと — 全体像・主要な決定事項の経緯・横断的な暗黙知・現在の状態・残タスクを集約している。

# プロジェクト概要

**予算トレース** — 地方自治体の予算（歳入・歳出）から補正・執行率・支出先・事業報告までを一次資料（エビデンス）付きでたどれる可視化サイト。甲府市の令和8年度当初予算をサンプル収録している。

- Claude Design のプロトタイプ（`project/予算トレース.dc.html`）を Next.js に本実装したもの。`project/` は**元デザインの参照用アーカイブ**であり、編集・import しない（`tsconfig.json` でも除外済み）。プロトタイプ時代の会話ログ `chats/` は 2026-07-18 に追跡から外した（必要なら git 履歴にある）。
- **データの来歴ルール**: アプリに載せる数値は**すべて一次資料由来の実データのみ**（款別歳入歳出・前年度額・主な事業83件は甲府市 R8 当初予算案資料、人口・類似自治体比較は総務省 R6 決算状況調）。ダミー・推計値は置かない（2026-07-12 に全ダミーを排除済み）。一次資料が無い機能（項以下の内訳・補正・執行率・事業詳細など）は実装せず「未収録」とし、資料を収録してから追加する。

# コマンド

パッケージマネージャは **bun**（lockfile は `bun.lock`）。npm / yarn / pnpm を使わず、`package-lock.json` を生成しないこと。

**依存の約束事**（2026-07-14 に Next 16 + React 19 へ更新。`bun audit` は 0 件を維持する）:
- **Excel を読むパーサは `import * as XLSX from "../lib/xlsx"`**（`"xlsx"` を直接 import しない）。SheetJS は
  0.18.5 を最後に npm 公開を停止しており、脆弱性修正済みの版を**公式 CDN から devDependency として**入れている。
  その ESM ビルドは `readFile`/`writeFile` が fs を自動で掴まないため、`pipeline/lib/xlsx.ts` で一度だけ
  `set_fs` して re-export している。直接 import すると "Cannot access file …" で落ちる。
- `postcss` は Next が 8.4.31 を固定するが脆弱性があるため package.json の `overrides` で 8.x 最新へ上げている。
  **Next 16.2.12 でもまだ 8.4.31 固定なので、この overrides は外せない**（2026-08-01 実測）。
- `sharp` も `overrides` で 0.35 系へ上げている（2026-08-01・#196）。**Next は sharp を
  `optionalDependencies: ^0.34.5` で連れてくる**が libvips 由来の脆弱性があるため。
  ⚠ **このアプリは `next/image` も `next/og` も `sharp` も使っていない**（grep で0件）ので
  画像最適化は動かず実質デッドコードだが、依存ツリーに残る以上 `bun audit` には出る。
  **next 側の宣言範囲外の版を入れている**ので、**Next を上げたときは必ず `bun audit` と `build` で確かめる**。
- React 19 でグローバル `JSX` 名前空間が廃止 → `React.JSX.IntrinsicElements` を使う。
- Next 15 以降 **`params` / `searchParams` は Promise** → catch-all ルートでは `await` してから使う。

```bash
bun install        # 依存インストール
bun run dev        # 開発サーバ (http://localhost:3000)
bun run build      # 本番ビルド（型チェック込み）
bun run start      # 本番サーバ
bun run typecheck  # tsc --noEmit

# データパイプライン（一次資料の収集。詳細は docs/architecture.md §10）
bun run pipeline:fetch [sourceId]               # レジストリのURLから raw を取得
bun run pipeline:ingest <sourceId> <file>       # 手動取得ファイルの投入
bun run pipeline:parse <sourceId>               # raw → parsed（locator 付き抽出）
bun run pipeline:try-parse <parser> <file...> --opts '<JSON>'  # registry を触らずパーサを試す（偵察用ドライラン）
bun run pipeline:validate <sourceId>            # 整合チェック（検証ゲート）
bun run pipeline:normalize <sourceId> [--force] # parsed → normalized（比較可能化）
bun run pipeline:fixture                        # e2e 検証用フィクスチャ生成
bun run pipeline:derive                         # normalized → アプリ用生成モジュール（*.gen.ts）＋ public/ の静的 JSON
bun run pipeline:archive [sourceId] [--force]   # Wayback Machine へ登録（魚拓台帳 data/archives.json）
```

- テストランナーは未導入。サーバー層を導入するときに Vitest + Testcontainers を [docs/architecture.md](docs/architecture.md) の方針で入れる。
- 地図形状データは `public/mapdata/` に同梱済み（都道府県 SVG + 全47都道府県の市区町村 GeoJSON）。**CDN からの実行時フェッチに戻さない**（オフライン動作・サンドボックス動作のため）。

# 現在の構成（ビッグピクチャー）

現状は**サーバーレスの UI プロトタイプ**。画面遷移はコンポーネント内 state（`st.screen`）で管理しつつ、**パスベースの ASCII 実URL**に同期する（`/yamanashi/kofu/compare` など。ディープリンク・共有・戻る/進む対応）。全パスは catch-all ルート `src/app/[[...slug]]/page.tsx` が受け、`src/client/lib/routing.ts` の `pathToState` でサーバ側から初期 state を解決して `BudgetTrace` に渡す（共有リンクでも初回からその画面が出る＝トップのチラつき無し）。**URL は視認性のため ASCII**: 都道府県は定型ローマ字（`yamanashi`）、収録済み自治体（full/budget）は手当てしたローマ字スラグ（`kofu`・`fuefuki`・県エンティティは `ken`）、読みデータの無い decision 自治体は団体コード（`/nagano/202011`）。旧・日本語パス（`/山梨県/甲府市`）も後方互換で受け、ローマ字へ自動正規化する。画面内の細かな状態（年度・ドリル位置・単位）はクエリに載せる。decision 自治体はコード↔名前を県シャード取得後に相互解決。ディレクトリは [docs/architecture.md](docs/architecture.md) の `src/` レイアウトへ移行済み（`src/server/` `src/shared/` `src/test/` はスケルトンのみ）。

**カバレッジ階層**: 自治体は3階層（`D.tierOf` が `'full'|'budget'|'decision'`）。**full**（甲府市のみ・予算＋主な事業/執行/評価/補正）、**budget**（18エンティティ＝政令市5＋類似4市＋山梨県内7市1町＋山梨県・当初予算の款別＋前年当初比較。**政令市は R2〜R8 の7年前後を収録し年度切替に対応**・`munibudgets.gen.ts` の `MUNI_BUDGET_YEARS`）、**decision**（全1,741市町村・総務省決算ベース）。判定は団体コード（`FULL_MUNIS`／`BUDGET_MUNIS`）。decision は款別歳出（→項）・歳入科目（→内訳）・1人あたり・財政指標・類似比較・決算経年まで。full 専用画面（主な事業・執行・評価・補正）は budget/decision では出さずリクエストチップにする（前年比較は full+budget）。詳細・配信モデルは [docs/data-strategy.md](docs/data-strategy.md)。

- `src/client/components/BudgetTrace.tsx` — アプリ本体。全 state と算出ロジック（プロトタイプの `renderVals` 相当）。年度スケール・補正反映・1人あたり換算・ドリルダウン木の解決などは**すべてここで計算し、描画用の値オブジェクト `v` にまとめて**渡す。tier（full/decision）でデータ源を差し替え（full=`kofu.gen` 等の静的 import、decision=`useDecisionData` で県シャードをフェッチ→`buildDecisionView`）、full 専用画面・ドリル拡張は `isDecision` でゲートする。
- `src/client/lib/decision.ts` / `src/client/hooks/useDecisionData.ts` / `src/client/lib/decision-index.gen.ts` — decision 階層。`useDecisionData(県コード)` が `public/decision/<県コード2桁>.json`（総務省決算の県シャード・選択時フェッチ・モジュールキャッシュ）を取得し、`buildDecisionView` がダッシュボード/ドリルの表示シェイプ（`BudgetNode` 互換）に変換する。索引・PREF_CODES・出典メタは `decision-index.gen.ts`（`bun run pipeline:derive` で再生成）。
- `src/client/components/BudgetTraceView.tsx` — 全画面（トップ / 市区町村選択 / ダッシュボード / 款別ドリルダウン / 前年比較 / 政策テーマ / 類似自治体 / 出典）の JSX。ロジックを持たない。
- `src/client/lib/similar.ts` / `src/client/hooks/useSimilarIndex.ts` — 類似自治体比較。**比較軸（人口／財政規模／1人あたり歳出／財政力指数／歳出構成）を選んでから相手を選ぶ**方式で、`useSimilarIndex` が全国索引 `public/decision/similar-index.json`（全1,741市町村・この画面でだけフェッチ）を取得し、`similar.ts` が軸ごとの距離・サジェスト・帯平均を計算する。**特定の比較相手を derive で決め打ちしない**（旧実装は甲府＋4市の静的リストを全自治体で使い回していた）。
- `src/client/lib/data.ts` — 実データ生成モジュール（`kofu.gen.ts` / `projects.gen.ts` / `similar.gen.ts` / `decision-index.gen.ts`、`bun run pipeline:derive` で再生成）の re-export と整形関数（`fmtOku` / `fmtPerCap` / `fmtYen` / `fmtPop` / `donutBg` 等）、階層判定（`tierOf` / `prefCodeOf`）。チャート色 `PALETTE` は**モジュール変数を `setPalette()` で切り替える**方式なので、描画前に呼ばれる順序に注意。サーバー層導入時に型→`src/shared/`、データ→ API へ分割する。
- `src/client/components/JapanMap.tsx` — 日本地図（地域→都道府県→市区町村ズーム、島しょ部の別枠、エリアズーム、フリーワード検索）。SVG を直接 DOM 操作する React 管理外領域があるため、変更時は `boxRef` 配下と React 描画の境界を崩さないこと。
- `src/client/components/ui.tsx` — `S()`（CSS 文字列→style オブジェクト。プロトタイプの inline style を逐語移植するためのヘルパ）、`HoverBox`（style-hover 相当）、`CountUpNum`（数値カウントアップ）。既存画面のスタイルは `S("...")` の文字列を**プロトタイプと diff 可能な形で維持**する。
- `pipeline/registry/roadmap.ts` / `src/client/lib/roadmap.gen.ts` — `/roadmap`（進捗と計画）。**進捗の数字は1つも手書きしない** — coverage と同じ実データから derive が算出する（手書きの数字は必ず実態とズレる）。**手書きは計画（`registry/roadmap.ts`）だけ**で、公開ページなので「時期を約束しない」「進捗の数字を書かない」「done を書かない」の3ルールを derive が機械的に検査する（Markdown 記法・時期の約束は throw）。
- `pipeline/registry/unrecordable.ts` — **「調べたが収録できなかった」記録**（`/coverage` に出る）。
  `/coverage` の `×` は「まだ手を付けていない」の意味なので、**一次資料を調べたうえで収録できないと
  判定したもの**は別の印（`—`）と一覧で開示する。**理由は docs/data-sources.md からの転記だけにする**
  （推測を断定で書かない。理由が特定できていない年度は載せない）。**「できない」を永久の事実として
  書かない** — 判定は実際にくつがえる（豊島 R4・R2 と大田 H27 は #159 の復号で収録できた）ので、
  記録は確認日時点の実測として書く。**団体コードは総務省 R6.json から実引きする**（derive が名前と
  突合して throw する）。**収録できたのに記録が残っていると derive が止まる**ので静かに腐らない。
  件数・分類ごとの内訳は derive が算出する（手書きしない）。
- `pipeline/registry/skeleton-budgets.ts` — **「その年度の当初予算は骨格予算だった」記録**。
  前年度が骨格なら翌年度に `prevNote`（前年度列が肉付け後なら `prevBasis:"補正後"`）を置く規約
  （§11k）は、**Σ にも validate にも年度間クロスチェーンにも掛からない**ので、2026-09-10 の棚卸しで
  14件落ちていた（docs §13-32）。derive がこの台帳を正に**順方向**（台帳の年度の翌年度が収録済みなのに
  説明が無い → throw）と**逆方向**（`prevNote` が骨格に触れているのに台帳に無い → throw）で照合する。
  **原典で確かめた年度だけを書く** — 市長選の周期や首長の交代から生成しない（再選の年に骨格・
  交代の年に通常、の両方が実在する）。**骨格の年度そのものが未収録でも書く**（翌年度を足した瞬間に鳴る）。
- `src/client/lib/caveats.gen.ts` — **データの注意**（ダッシュボードの「データの注意」セクション）。
  **手で書かない** — `validate` の warning（＝検証ゲートが検出し、原典側の事情と説明できるもの）を
  derive が自治体へ割り当てる。error は検証ゲートで止まり derive に来ないので、出るのは warning だけ。
  **検証の原文をそのまま残し**、パターンから導いた市民向けの一行を併記する（個別の文面を手で持たない）。
  **「報告されたものをそのまま尊重する」＝数値を丸めない**という意味であり、説明を不親切にする理由ではない。
- `src/app/globals.css` — inline style では書けない media query を `data-mq="..."` 属性で上書きするモバイル最適化。新しいグリッド行を足すときは対応する `data-mq` ルールも確認する。

# データパイプライン

一次資料は `pipeline/`（バッチ）で **sources（台帳）→ raw（不変・原本コミット・ハッシュ来歴）→ parsed（locator 付き抽出）→ normalized（団体コード・標準科目で比較可能化）→ gen（アプリ用断面）** の層で扱う（メダリオンの Bronze/Silver/Gold に相当）。**各資料の取得手順・構造のクセは [docs/data-sources.md](docs/data-sources.md)** に記録してあり、資料を追加・更新したら必ず追記する。多自治体への展開方針（3層戦略）は [docs/data-strategy.md](docs/data-strategy.md)。規約は [docs/architecture.md](docs/architecture.md) §10。特に: 検証ゲート（`needs_review` を normalize に通さない）、フィクスチャ隔離（`data/normalized/_fixtures/` をアプリから import しない）、未知の科目を黙って「その他」に寄せない。

**検証は2段ある**（どちらも「静かに壊れる」を防ぐためのもので、守備範囲が違う）:
- **`pipeline:validate`** — **parsed の自己整合**（Σ＝内訳の和・算術）。`error` があれば normalize/derive へ進まない
- **`pipeline:derive` の出口の整合チェック** — **gen 同士の食い違い**（/coverage の件数＝配信シャードの件数・
  事業報告の収録漏れ・URL スラグ）。**validate は gen 同士を見ない**ため、2026-07-15 の1セッションで
  「収録済みなのに実態とズレる」型を4回踏んだ（フッターの出典が甲府固定・/coverage の予算列が最新年度のみ・
  /coverage が横浜の成果を「×」・件数が画面と食い違う）。**問題があれば throw して derive を失敗させる**
- **出口ゲートは両方向に張る**（2026-09-12・#283）。「載っているものが正しいか」だけでなく
  **「載っていたものが消えていないか」**も見る。第36巡で `BUDGET_SOURCES` の座間3行がスクリプトに
  置換されて消えたとき、registry・parsed・スラグは残っていたので全ゲートが素通りした。
  いまは**検証 ok の budget-book は必ず配信されていること**と、**`MUNI_SLUGS` の団体は必ず予算を配信
  していること**を derive が照合する。**意図的に配信しない資料は `fixture: true`**（除外リストは作らない）。
  詳細は docs/handoff.md §4・docs/architecture.md §10
- **どちらも「表示専用の項目」を完全には守れない**（金額でないので Σ が立たない）。
  **2026-08-01 に derive へ「表示専用フィールドの汚染ゲート」を足した**（#190）— 全 gen の表示文字列を
  走査し、**印字ノンブル・列見出しの語・生の金額が見出しに・完全二重化・部首の異体字**の5つを落とす。
  ⚠ **これは目視の代わりにならない** — 語彙と字面の網なので**未知の壊れ方は捕まらない**し、
  「所管が全件空」（川崎572件）の型は**様式依存なので入れていない**。
  **新しい資料は款名と事業名を全件目視すること**（規約は変わらない）

**資料の発見・収録・レビューは3つの再利用可能な手続きに切り出してある**（毎回 docs から手順を組み立て直さない）:
- **発見** — `source-scout` サブエージェント（`.claude/agents/source-scout.md`）。「○○市の款別＋前年当初比較 PDF はどこか」を調べ、直リンク・物理ページ・見出し語・ライセンス原文・`parserOptions` の見込みまで報告する。**registry・data は書き換えない**。複数自治体は1体ずつ**並列**で起動する。
- **収録** — `/ingest-source` スキル（`.claude/skills/ingest-source/SKILL.md`）。registry 登録 → fetch → parse → validate → archive → derive → アプリ配線（`BUDGET_SOURCES`・`MUNI_SLUGS`）→ レビュー → docs 追記を通す。
- **レビュー** — `ingest-reviewer` サブエージェント（`.claude/agents/ingest-reviewer.md`）。収録 PR の前に、検証ゲートが守らない領域（款名の全件目視・表示専用項目・団体コード同一性・ライセンス振替・画面目視）を検査して所見を報告する。**ファイルは書き換えない**。**frontmatter でモデルを Fable 5 に固定してある**ので、収録をより軽いモデルのセッションで進めても、レビューだけは常に Fable 5 が担う。
- **自律運転** — [loop.md](loop.md)。`/loop loop.md に従って次の1巡を進める` で、上の3つを**1巡＝1 PR**の単位で人が居ない間に回すときの手順書（仕事の選び方・マージ条件・止まる条件）。**知識は持たせない**（正は docs）— 順番・境界・止まり方だけを書く。

# アーキテクチャ規約

サーバーサイド（実データ取込・複数自治体対応・認証など）を書き始める前に、必ず [docs/architecture.md](docs/architecture.md) を読むこと。要点（non-negotiables）:

- Next.js は UI + Route Handler のみ。サーバーは **Hono** を `app/api/[[...route]]/route.ts` にマウントする。
- クライアント⇄サーバー通信は **Hono RPC**（`hc<AppType>`）。クライアントから `fetch` を直接呼ばず、`src/client/hooks/` の **React Query** フック経由。
- バックエンドは `src/server/domains/[domain]/` に置き、`interface.ts` / `repository.ts` / `service.ts` / `route.ts` の4ファイル構成。`interface.ts` は具体実装（DB / Hono / Inversify / SDK）を import しない。
- DI は **Inversify**。コンテナ外で Service / Repository を `new` しない。
- 認可は route で **CASL**（`ability.can(...)`）。Service は認可を知らない。
- `any` 禁止。`unknown` で受けて絞り込む。
- DB は全環境 **PostgreSQL**。Repository を触るテストは **Testcontainers** の実 Postgres で走らせる（モック不可）。

# UI デザイン

**このプロジェクトの既存デザインを尊重する**（専用のデザインシステム文書は置かない。実装が仕様）。UI を追加・変更するときは既存画面の視覚言語に合わせること: IBM Plex Sans JP + IBM Plex Mono、白カード + `#DFE7EC` ボーダー、アクセント `#1798D0`、チャートは `PALETTE`（Okabe-Ito ベースの色覚多様性対応・`src/client/lib/data.ts`）以外の系列色を新設しない。**系列の色は必ず `D.seriesColor(i)` で引く**（`PALETTE[i % length]` を直接書かない）— PALETTE は12色しかなく、款が13以上ある団体（東京都の歳出は18款。**95エンティティ中73が該当**）で**同じチャート内に同色のスライスができる**。`seriesColor` は色相を増やさず**周ごとに明度を振って**これを避ける。**数値は必ず IBM Plex Mono**、金額整形は `fmtOku` / `fmtPerCap` を再利用する。出典チップ（エビデンス）を伴わない数値表示を新設しない。**エビデンス3層コピーの原則**（[docs/data-strategy.md](docs/data-strategy.md) に正式ルール）: 一次資料は ①git raw ②Wayback ③自サーバー配信（`public/sources/`）の3つの写しを持ち、**画面のリンクは原則③をドロワーで開く**（PDF=PdfViewer、HTML=サンドボックス iframe、Excel=ダウンロードカード）。発行元・Wayback への直リンクを主リンクにしない — 両者はドロワー内の補助リンク。新しい資料を収録したら fetch → `pipeline:archive`（即時）→ sync（自動）の順で3層を揃える。**例外は「要許可」（`licenseClass === "permission-required"`）の資料**（2026-07-16）: 写しは残したまま**リンクだけ発行元へディープリンク**する（発行元から消えていて魚拓にしかない資料は魚拓へ）。宛先は取得元（raw-meta の `fetchedFrom`）から derive が決めて `evidence-policy.gen.ts` に書き出し、クライアントは `D.evidenceHref` / `D.evidenceAction` と `openViewer` の1か所で振り替える。**エビデンスを開く新しい導線を足すときは必ず `openViewer` を通す**（直接 `/sources/...` を href に置かない）。**歳入・歳出が別ファイルの資料がある**（東京都・練馬・日立 H26〜H24 など78年度分。#257）— `MuniBudget.sourceLocalUrl` は歳入側で、歳出側は `expenditureEvidence`（単一ファイルは null）。側が決まる場面（款別ドリル）では側のファイルを引くこと。derive は側のファイルを **parsed の locator から**決める（registry の `revenueFile` 等はパーサ固有の語彙なので、それで数えると別パーサの資料が漏れる）。アニメーションは `prefers-reduced-motion` に対応させる。

## Enter キーは IME 変換確定を無視する

日本語ファーストのアプリなので、`Enter` で動作する **すべての** `onKeyDown`（検索確定・フォーム送信・ダイアログ確定）は、IME（漢字変換）の確定 Enter で発火してはならない。ハンドラ先頭でガードする:

```ts
onKeyDown={(e) => {
  // IME 変換確定の Enter (isComposing / keyCode 229) では発火しない。
  if (e.nativeEvent.isComposing || e.keyCode === 229) return;
  if (e.key === "Enter" /* && modifiers… */) { e.preventDefault(); doThing(); }
}}
```

`isComposing` が現行ブラウザ、`keyCode === 229` が古い実装のカバーで、両方のチェックが意図的。現状 Enter ハンドラは存在しない（地図検索は入力即時フィルタ）が、追加する場合は必ずこの形にする。

# デプロイ

**Vercel（構築済み）**。チーム `philosophyhouse` のプロジェクト `budget-trace`。GitHub 連携済みで、`main` への push で本番へ自動デプロイされる。**PR では Preview デプロイを作らない**（`vercel.json` の `git.deploymentEnabled` で `main` 以外を止めてある。2026-08-10）— ビルドは実測6分で、そのほぼ全部が `munibudgets.gen.ts`（8.9MB）のバンドル時間。Hobby プランは同時ビルド1本なので、push のたびに本番デプロイがこれに待たされていた。**PR の門番は代わりに GitHub Actions（`.github/workflows/ci.yml`）が担う**（型検査・derive の出口ゲート・gen の最新性・本番と同じビルド）。ブランチで Preview を見たいときは `bunx vercel` で手動デプロイする。本番 URL: **https://budget-trace.phh.jp**（独自ドメイン・2026-07-30〜。`budget-trace-tawny.vercel.app` も生きているが canonical はこちらへ向けている）。ビルド設定はデフォルトの Next.js プリセット + bun（`bun.lock` 自動検出）。環境変数は現状不要。CLI 操作は `bunx vercel`（`.vercel/` と `.env*` は gitignore）。

⚠ **いまは `main` への push で本番デプロイが自動では走らない**（2026-10-10 時点）。リポジトリを `philosophy-house/budget-trace` へ移転してから、Vercel のプロジェクトの GitHub 連携先が移転前の `chan-shiro/budget-trace` のままになっている（原因の見立て・未確認）。**連携を直すまでは、PR を squash マージしたら毎回 `bunx vercel api` で本番デプロイを手で出す** — 手順・確かめ方・踏んだこと（`vercel api` の出力の先頭が JSON でなく、POST を二重に出した）は [docs/handoff.md](docs/handoff.md) §6「本番の手動再デプロイ」。docs だけの変更なら出さなくてよい。連携を直したら、この注意書きと handoff の節を消す。

## 公開用の設定（ドメイン・OGP・計測）

**ドメインは `src/client/lib/site.ts` の1か所に持つ**。OGP・canonical・robots・sitemap がすべてこれを基準にするので、別々に直書きしない。

- **OGP** — `layout.tsx` が既定、`[[...slug]]/page.tsx` の `generateMetadata` が画面ごとの `title`・`canonical`・`og:url` を上書きする。⚠ **Next は `openGraph` / `twitter` をフィールド単位でなくオブジェクトごと子で置き換える**ので、**画像は両方で明示する**（片方だけだと `og:image` が黙って消える。実際に踏んだ）
- **canonical は `stateToPath` で正規化してから入れる** — 旧・日本語パス（`/山梨県/甲府市`）で来ても `/yamanashi/kofu` を正典として指す。クエリ（`?fy=` 等）は画面内の状態なので載せない
- **OG 画像 `public/og.png`** は静的にコミットしてある。**数字を焼き込まない**（収録が進むと古くなる）。再生成が要るときは `src/app/og-gen/route.tsx` を一時的に作って `next/og` の `ImageResponse` で焼き、`curl localhost:PORT/og-gen -o public/og.png` した後に**ルートを削除する** — 本番に Google Fonts への実行時フェッチを持ち込まないため（手順は docs/handoff.md）
- **GTM**（`GTM-MQRPKN33`・コンテナは `*.phh.jp` を対象）は `layout.tsx` に直書き（依存を増やさない）。**`process.env.VERCEL_ENV === "production"` のときだけ読み込む** — Preview デプロイや dev で読むと公開前の試行が計測に混ざる
- **Cookie 同意は `www.phh.jp` と同じ仕組み・同じ Cookie**（`vanilla-cookieconsent` + Google Consent Mode v2）。⚠ **`cc_cookie` を `.phh.jp`（親ドメイン）に置くのが要点** — どちらかで同意すればもう一方では訊かれない。**名前・ドメイン・カテゴリ名のどれかがズレると共有が黙って壊れる**（利用者はサブドメインごとに同じ質問をされる）
- ⚠ **Consent Mode の既定値は GTM より前に入れる**（`beforeInteractive`）。後から入れると GTM は「既定＝granted」として一度発火してしまう
- **プライバシーポリシーは `www.phh.jp/privacy` が正典**（`PRIVACY_URL`）。事業者も計測の仕組みも同一なので、ポリシーを2つに分けない。⚠ **絶対 URL で持つ** — 相対 `/privacy` にすると budget-trace 側の存在しないページを指す
- **`robots.ts` は `/sources/` を除外している** — エビデンスの原本コピーを配信しているディレクトリで、**発行元の資料が発行元より上位に出かねない**ため。配信用の大きな JSON（`/decision/` `/reports/` `coverage.json`）も同様
- **`sitemap.ts` は URL を必ず `stateToPath` に作らせる**（手で組むとスラグの手当てと二重管理になり、サイトマップだけが 404 を指す）。収録が増えれば黙って追随する

## `main` へ直接 push しない（non-negotiable）

`main` への push は**そのまま本番デプロイ**になる（自動デプロイが止まっている間も、連携が戻れば同じなので扱いは変えない）。変更は必ず作業ブランチ → PR（**CI の緑で確認**）→ squash マージの順で入れる。ユーザーが「マージしよう」と言った場合も、`main` への直接 push ではなく **PR を作る**の意味に解釈する。`git push origin main` / `main` 上での直接コミットは、ユーザーがその都度明示的に指示しない限り実行しない。

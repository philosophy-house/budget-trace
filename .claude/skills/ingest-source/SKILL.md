---
name: ingest-source
description: 一次資料を「予算トレース」に収録する手続き（registry 登録 → fetch → parse → validate → archive → derive → アプリ配線 → docs 追記）を最後まで通す。新しい自治体を budget 階層に追加するとき、既存自治体・資料の新年度版を追加するとき、発見済みの資料を実際にアプリへ載せるときに使う。資料がどこにあるか未確定なら、先に source-scout サブエージェントで発見フェーズを回す。
---

# 一次資料の収録

[docs/data-sources.md](../../../docs/data-sources.md) 冒頭のチェックリストを実行可能にしたもの。
規約は [docs/architecture.md](../../../docs/architecture.md) §10、方針は
[docs/data-strategy.md](../../../docs/data-strategy.md)。

## 大原則（迷ったらここへ戻る）

1. **実データのみ**。一次資料が無い箇所はダミー・推計で埋めず「未収録」にする
2. **検証ゲートが安全を作る**。`validate` が error を出したら normalize/derive に進まない。
   ゲートを緩めるのではなく、パーサか資料の理解を直す
3. **未知の科目を黙って「その他」に寄せない**
4. **発見・クセは必ず docs/data-sources.md に記録してから終える**（発見コストを二度払わない）

## 0. 入力を確定する

必要なもの: 直リンク URL・ランディングページ・団体コード（6桁）・年度・ライセンス原文・
歳入/歳出の**物理**ページ番号・見出し語。

これらが揃っていなければ**先に `source-scout` サブエージェントを起動する**（自治体ごとに
1体・複数自治体なら並列）。scout のレポートがそのまま以降の入力になる。

scout は**4点セット**（①当初予算の款別＋前年当初比較 ②過年度 ③主な事業 ④事業報告（成果））を
既定で調べて返す。**スコープを「款別だけ」に絞って起動しない** — 同じサイトを後から
調べ直すことになる（2026-07-15 の政令市5市で実際にそうなった）。1つの自治体で①〜④が
揃っていれば、収録も1つの PR にまとめる。

## 1. registry に登録する

`pipeline/registry/sources.ts` にエントリを追加。id は `発行元-資料名-年度` の kebab-case
（例 `otsuki-yosansho-r8`）。既存エントリの直上コメントに倣い、**その資料固有のクセを
コメントで書く**（ページ・合計ラベル・ノイズの所在）。

- `url` は単一直リンク、複数ファイルなら `urls`（`url: null` にする）
- `scope` は `○○市（一般会計・団体コード192066）` 形式 — `/coverage` がここから対象を解決する。
  **団体コードは記憶や推測で書かない。必ず一次資料から引く**:

  ```bash
  python3 -c "import json;print([(r['muniCode'],r['muniName'],r['population']) for r in json.load(open('data/normalized/municipal-accounts/R6.json'))['records'] if r['muniName']=='○○市'])"
  ```

  存在しないコードは `/coverage` の「未分類」に出るので気づける（山口市で検出）。だが
  **実在する別の自治体のコードを書いた場合は誰も気づけない** — 静かにその自治体へ紐付き、
  1人あたり金額が他市の人口で計算される（北杜市に甲斐市の 192104 を割り当てていた実例・
  2026-07-15 修正。data-sources.md 参照）
- `license` は**発行元の表記を原文のまま**。区分（open / permission-required / unverified）は
  derive が原文から自動判定するので、要約・意訳しない。**この区分は表示ラベルだけの話ではない** —
  permission-required と判定された資料は、画面のリンクが自サーバーのコピー（ドロワー）ではなく
  **発行元へのディープリンク**に切り替わる（`evidence-policy.gen.ts`）。適用されない規約の名前を
  説明として書くと逆の区分に落ちるので、**適用される条件だけ**を書き、経緯は registry のコメントへ
- `parser` は `pipeline/parsers/index.ts` のキー。款別歳入歳出は `kofu-yosansho` を共用する

## 2. fetch（raw を固定する）

```bash
bun run pipeline:fetch <sourceId>
```

sha256・取得日時が raw-meta に固定される。**raw はコミットする**（原本アーカイブ）。
政府系サイトはクラウド環境から 403 になる（ローカルなら通る）。ダメなら手動DL →
`bun run pipeline:ingest <sourceId> <file>`。

## 3. parse → validate

```bash
bun run pipeline:parse <sourceId>
bun run pipeline:validate <sourceId>
```

**パーサを書く/直す前に構造を見る**: PDF は `pdftotext -layout`（表が崩れるなら `-tsv` の
単語座標）、Excel は `sheet_to_json(header:1)` で行列を目視。テキスト層のある PDF は
**決定的パースを最優先**し、LLM 抽出は最後の手段。

既存パーサ（`kofu-yosansho` 等）を直すときは **`parserOptions` で吸収できないか先に考える**。

パーサ本体を触ったら、**既存の全ソースを再 parse し、`parsedAt` 以外の差分が無いことを確認する**。
**その年度の当初予算が骨格予算なら `pipeline/registry/skeleton-budgets.ts` に書く**（原典の言い回しと根拠つき）。
書いておけば、翌年度を収録したときに `prevNote` を落としても derive が止める。⚠ 前年度側の `prevNote` は
**注記を書くだけでなく台帳にも書く**（逆方向の照合で止まる）。骨格かどうかは**原典で確かめる**
（周期・交代から推し量らない。docs §13-32）。

**`validate` が通るだけでは不十分** — optional フィールド（`prevNote` 等）の欠落は検出されない
（`fd3a500` の打切りが甲府 R6 の資料注記を巻き添えにし、再生成しなかったため長く露見しなかった実例）:

```bash
# 同じパーサを使う全ソースを列挙して再 parse → validate
python3 - <<'EOF' > /tmp/ids.txt
import re
s = open('pipeline/registry/sources.ts').read()
for m in re.finditer(r'id:\s*"([^"]+)"[^}]*?parser:\s*"kofu-yosansho"', s, re.S):
    print(m.group(1))
EOF
while IFS= read -r id; do
  bun run pipeline:parse "$id" > /dev/null 2>&1
  bun run pipeline:validate "$id" 2>&1 | grep -E "✓|✗" | tail -1
done < /tmp/ids.txt

# 実データが動いていないことの確認（parsedAt 以外の差分が出たら回帰）
git diff --unified=0 data/parsed/*.json | grep '^[-+]' | grep -v '^[-+][-+]' | grep -v parsedAt
```

**zsh は変数を単語分割しない** — `for id in $ids` は全 ID を1つとして渡す。上記の `while read` を使う。

`status: needs_review` のまま先へ進まない。warning は内容を読んで、**原典側の誤り**なら
docs に記録して許容（実例: 伊賀市の1千円不整合、統計書 R3 歳出の前年値コピー）。

## 4. archive（Wayback へ即登録）

```bash
bun run pipeline:archive <sourceId>
```

**取得したら即座に**。発行元の削除は現実に起きる（甲府市 R4・R5 予算資料が実例。削除後は
登録もできない）。`sha256Match: false` は別版を指している印 → `--force` で再登録。
同一パスへ上書きされる資料（財政事情）は版が変わるたび `--force`。
`web.archive.org` / WARP 由来の URL は対象外（それ自体が恒久アーカイブ）。

③自サーバー配信（`public/sources/`）は `pipeline/sync-public-sources.ts` が dev/build 前段で
自動。**新しい形式を足したらドロワーの表示手段**（PDF=PdfViewer / HTML=HtmlViewer /
その他=ダウンロードカード）**も確認する**。

## 5. derive → アプリ配線

```bash
bun run pipeline:derive
```

**新しい自治体を budget 階層に追加する場合は、3か所すべてを配線する**（1つでも欠けると
画面に出ない／URL が壊れる）:

1. `pipeline/derive-app-data.ts` の `BUDGET_SOURCES` に
   `{ srcId, muniCode, muniName, prefName, isPref }` を追加
2. `src/client/lib/routing.ts` の `MUNI_SLUGS` に `団体コード → ローマ字スラグ` を追加
   （県エンティティは `ken` — 市区町村選択のパスと衝突するため）
3. 決算＋執行率も収録できたなら `MUNI_EXEC_SOURCES` にも追加（当初予算と別年度でよい）

`coverage.json` は derive が生成する — **コミットが必要**（build は derive を走らせない）。

## 6. 検証（画面まで）

```bash
bun run typecheck
```

**新しい自治体を足したら、まず gen の `population` を総務省の当該自治体の人口と突合する** —
団体コードの取り違えが数値に現れる唯一の場所（他は全部それらしく見えてしまう）:

```bash
grep -A 12 '"<団体コード>": {' src/client/lib/munibudgets.gen.ts | grep 'muniName\|population'
```

`bun run dev` で該当自治体の画面を開き、**金額・前年比・エビデンスリンク（ドロワー）**を確認する。
注意: **dev 起動中に `bun run build` すると dev が壊れる**（同じ `.next` を使うため）。

## 6b. レビューを受ける（PR を作る前に）

`ingest-reviewer` サブエージェントを1体起動し、今回の収録一式（registry・parsed・gen・配線・docs）を
レビューさせる。**このエージェントは frontmatter でモデルが固定されており、セッションを
どのモデルで回していても Opus 5.5 で走る**（収録を軽いモデルで進める運用のための検査段。2026-10-22 に Fable 5 固定から変更）。

- 所見は鵜呑みにせず**自分で再現してから**直す（レビュー側も誤ることがある）
- CONFIRMED の所見を直し切るまで PR を作らない。PLAUSIBLE は判断を PR 本文に残す

## 7. docs を更新して終える（省略しない）

- `docs/data-sources.md`: 見つけ方・取得手順・**構造のクセ**・検証結果・ライセンス確認日を追記。
  収録**不可**と判断した自治体も理由つきで記録する（韮崎・甲斐＝円グラフのみ、山梨市＝スキャン画像、
  中央＝予算説明書のみ、といった既存の記録に倣う）
- `docs/data-strategy.md` / `docs/handoff.md`: 階層・件数・現在地が変わったら更新
- 新しい様式差をパーサに足したなら、**何を一般化したか**を data-sources.md に書く

## よくある失敗

| 症状 | 原因 |
| --- | --- |
| 款1に変な行が混ざる | ページ冒頭のタイトル行 → `revenueHeading` に指定して読み飛ばす |
| 合計行を取りこぼす | 合計行判定を見出しスキップより先に置く（「歳入」は「歳入合計」の部分文字列） |
| ドーナツ凡例が款に化ける | 合計行の手前で打切る（本物の合計＝整数金額が最多の行） |
| ページがずれる | 印字ページ番号と PDF 物理ページのズレ（+2 など）。registry は物理ページ |
| `Cannot access file …` | `"xlsx"` を直接 import した → `import * as XLSX from "../lib/xlsx"` |
| `/coverage` に「未分類」 | registry の `scope` の団体コード誤記 |

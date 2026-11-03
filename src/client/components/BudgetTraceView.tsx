"use client";

import React from "react";
import JapanMap from "./JapanMap";
import { HoverBox, S } from "./ui";
import PdfViewer from "./PdfViewer";
import HtmlViewer from "./HtmlViewer";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 事業報告カード内の年度ストリップ（コスト経年・各指標）は同じ列割りで縦に揃えている。
// 狭い画面では各ストリップが個別に横スクロールして列がズレるので、位置を揃える。
// React の onScroll はバブルしない（17+）ので、親ではなく各ストリップに付けること。
// scrollLeft は React の管理外なので直接代入してよい。値が一致したら止まるので往復しない。
const syncYearStrips = (el: HTMLElement) => {
  el.closest("[data-reportcard]")?.querySelectorAll("[data-yearstrip]").forEach((o) => {
    const other = o as HTMLElement;
    if (other !== el && other.scrollLeft !== el.scrollLeft) other.scrollLeft = el.scrollLeft;
  });
};

export default function BudgetTraceView({ v }: { v: any }) {
  // 主な事業1行（一覧・施策グループ共用）。説明があれば事業名の下に淡色で1行
  const projRow = (p: any, i: number) => (
    <button key={i} onClick={p.refOpen} style={S("width:100%; text-align:left; display:grid; grid-template-columns:auto auto 1fr auto auto; align-items:baseline; gap:10px; padding:9px 14px; border:none; background:none; cursor:pointer; border-top:1px solid #F0F4F7; font-family:'IBM Plex Sans JP',sans-serif;")}>
      {p.kan ? <span style={S("font-size:11px; color:#5C6B77; font-family:'IBM Plex Mono',monospace; align-self:center; white-space:nowrap;")}>{p.kan}</span> : <span></span>}
      {p.kubun ? <span style={S(`font-size:10px; font-weight:700; border-radius:999px; padding:1px 8px; align-self:center; color:${p.kubun === "新規" ? "#0F76A3" : "#C25400"}; border:1px solid ${p.kubun === "新規" ? "#B9E0F2" : "#EFD4BE"};`)}>{p.kubun}</span> : <span></span>}
      <span style={S("min-width:0;")}>
        <span style={S("display:block; font-size:13px; color:#14181C;")}>{p.name}</span>
        {p.desc && <span style={S("display:block; font-size:11.5px; color:#7C8B96; line-height:1.5; margin-top:2px;")}>{p.desc}</span>}
      </span>
      <span style={S("font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:600; align-self:center;")}>{p.amountFmt}</span>
      <span style={S("font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:#5C6B77; width:96px; text-align:right; align-self:center;")}>{p.sub}</span>
    </button>
  );
  return (
    <div style={S("min-height:100vh; background:#F7FAFC; color:#14181C; font-family:'IBM Plex Sans JP',sans-serif; font-size:15px; line-height:1.65;")}>

      {/* ============ TOP ============ */}
      {v.isTop && (
        <div data-screen-label="トップ（自治体選択）" style={S("min-height:100vh; display:flex; flex-direction:column;")}>
          <header data-mq-pad="" style={S("display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 32px; flex-wrap:wrap;")}>
            <div style={S("display:flex; align-items:baseline; gap:10px;")}>
              <span style={S("font-weight:700; font-size:17px; letter-spacing:0.02em;")}>予算トレース</span>
            </div>
          </header>

          <div data-mq="hero" style={S("flex:1; width:min(1160px,100%); margin:0 auto; padding:32px; display:flex; gap:48px; align-items:center; flex-wrap:wrap; animation:fadeUp .4s ease both;")}>
            <div style={S("flex:1 1 380px; min-width:300px;")}>
              <h1 style={S("margin:0 0 18px; font-size:clamp(32px,4vw,48px); font-weight:700; line-height:1.28;")}>税金のゆくえを、<br />執行まで。</h1>
              <p style={S("margin:0 0 30px; color:#5C6B77; max-width:44ch;")}>款別の内訳から主な事業、前年比較、類似自治体との比較までを一次資料（エビデンス）付きで確認できます。</p>
              <div style={S("display:flex; gap:28px; margin-bottom:34px; flex-wrap:wrap;")}>
                {v.heroStats.map((h: any, i: number) => (
                  <div key={i}>
                    <div style={S("font-family:'IBM Plex Mono',monospace; font-size:24px; font-weight:600;")}>{h.num}</div>
                    <div style={S("font-size:12px; color:#5C6B77;")}>{h.label}</div>
                  </div>
                ))}
              </div>
              <HoverBox as="button" onClick={v.openKofuLink} data-mq="cta" style={S("background:#14181C; color:#F7FAFC; border:none; border-radius:10px; padding:14px 26px; font-size:15px; font-weight:600; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("background:#1798D0;")}>甲府市のサンプルを見る →</HoverBox>
            </div>
            <div style={S("flex:1 1 420px; min-width:300px;")}>
              <JapanMap onSelect={v.onPrefSelect} onSelectMuni={v.onMuniSelect} colorMode={v.mapColorMode} />
            </div>
          </div>

          {/* 収録の深さから選ぶ。段の割り当て・件数は**収録データから自動生成**（手書きの列挙をしない —
              coverageLevels 参照）。自治体名は変わらないので、深い順に全部並べてそのまま入口にする。
              段の中は**都道府県ブロック**と**市区町村ブロック（都道府県ごとに束ねる）**に割る。
              都道府県チップは淡い塗り・市区町村チップは白で、形からも種別が読めるようにする
              （添え書きの「都道府県」に頼っていた頃は、隣り合う2つの区別が本文を読まないと付かなかった）。 */}
          <section data-mq-pad="" style={S("width:min(1160px,100%); margin:0 auto; padding:0 32px 44px; animation:fadeUp .4s ease both;")}>
            <h2 style={S("margin:0 0 4px; font-size:16px; font-weight:700;")}>収録の深さから選ぶ</h2>
            <p style={S("margin:0 0 14px; font-size:12.5px; color:#5C6B77;")}>どこまで深く収録できているかは自治体ごとに違います。深い順に並べています（この一覧は収録データから自動生成）。都道府県（県全体の会計）は<strong style={S("color:#14181C; font-family:'IBM Plex Mono',monospace;")}>{v.coveragePrefDone}</strong>/<span style={S("font-family:'IBM Plex Mono',monospace;")}>{v.coveragePrefTotal}</span> を収録しています。</p>
            {v.coverageLevels.map((g: any, i: number) => (
              <div key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:14px 18px; margin-bottom:10px;")}>
                <div style={S("display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; margin-bottom:11px;")}>
                  <h3 style={S("margin:0; font-size:13.5px; font-weight:700;")}>{g.title}</h3>
                  <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#0F76A3; border:1px solid #B9E0F2; border-radius:999px; padding:1px 9px;")}>{g.prefCount + g.muniCount}団体</span>
                  <span style={S("font-size:11.5px; color:#8494A0;")}>{g.note}</span>
                </div>

                {/* 都道府県（県全体の会計）。名前自体が県名なので添え書きは持たせない */}
                {g.prefCount > 0 && (
                  <>
                    <div style={S("font-size:11px; font-weight:700; color:#5C6B77; margin-bottom:6px;")}>都道府県 <span style={S("font-family:'IBM Plex Mono',monospace; font-weight:400; color:#8494A0;")}>{g.prefCount}</span></div>
                    <div style={S(`display:flex; gap:6px; flex-wrap:wrap; ${g.muniCount > 0 ? "margin-bottom:13px;" : ""}`)}>
                      {g.prefs.map((m: any, j: number) => (
                        <HoverBox as="button" key={j} onClick={m.open} style={S("border:1px solid #C6D2DA; background:#F1F6F9; border-radius:999px; padding:5px 13px; cursor:pointer; font-size:13px; font-weight:600; color:#14181C; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; background:#FFFFFF;")}>{m.name}</HoverBox>
                      ))}
                    </div>
                  </>
                )}

                {/* 市区町村。所属する都道府県ごとに束ねる（束の頭に県名があるのでチップに県名は書かない）。
                    束は**行を占有せず流し込む** — 1県1行にすると仙台市・千葉市のような1団体の県が
                    1行を丸ごと使い、デスクトップで縦が倍以上に伸びる。束ごと wrap させれば
                    東京23区のような大きな束は自分の中で折り返し、小さな束は横に並ぶ。 */}
                {g.muniCount > 0 && (
                  <>
                    <div style={S("font-size:11px; font-weight:700; color:#5C6B77; margin-bottom:6px;")}>市区町村 <span style={S("font-family:'IBM Plex Mono',monospace; font-weight:400; color:#8494A0;")}>{g.muniCount}</span></div>
                    <div style={S("display:flex; flex-wrap:wrap; gap:7px 18px; align-items:center;")}>
                      {g.muniGroups.map((mg: any, j: number) => (
                        <span key={j} style={S("display:flex; flex-wrap:wrap; gap:6px; align-items:center;")}>
                          <span style={S("font-size:11px; color:#8494A0; white-space:nowrap;")}>{mg.pref}</span>
                          {mg.munis.map((m: any, k: number) => (
                            <HoverBox as="button" key={k} onClick={m.open} style={S("border:1px solid #DFE7EC; background:#FFFFFF; border-radius:999px; padding:5px 13px; cursor:pointer; font-size:13px; font-weight:600; color:#14181C; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0;")}>{m.name}</HoverBox>
                          ))}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
            <p style={S("margin:6px 2px 0; font-size:12px; color:#5C6B77;")}>そのほかの全{v.coverageDecisionCount}市区町村も、総務省の決算ベース（款別歳出・歳入内訳・1人あたり・類似自治体比較）で閲覧できます — 上の日本地図か検索から選んでください。</p>
          </section>

          {/* 収録資料は増えていくので、フッターで個別に列挙しない（すぐ実態とズレる）。
              網羅的な収録状況は /coverage が実データから自動生成する — そちらへ誘導する。 */}
          <footer data-mq-pad="" style={S("padding:18px 32px; border-top:1px solid #DFE7EC; font-size:12px; color:#5C6B77; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;")}>
            <span>本サイトはプロトタイプです。掲載数値はすべて一次資料由来の実データで、画面のどの数値も原本まで遡れます。
              <button onClick={v.goSources} style={S("border:none; background:none; padding:0; margin-left:8px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>データ出典・更新日 →</button>
              <button onClick={v.goCoverage} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>データ整備状況・ライセンス →</button>
              <button onClick={v.goRoadmap} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>進捗と計画 →</button>
              <a href={v.privacyUrl} target="_blank" rel="noopener noreferrer" style={S("margin-left:12px; color:#1798D0; font-size:12px;")}>プライバシーポリシー ↗</a>{v.openCookiePrefs && <button onClick={v.openCookiePrefs} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>Cookie 設定</button>}
            </span>
            <span style={S("font-family:'IBM Plex Mono',monospace;")}>v0.1 / 2026-07</span>
          </footer>
        </div>
      )}

      {/* ============ 市区町村選択 ============ */}
      {v.isMuni && (
        <div data-screen-label="市区町村選択" data-mq-pad="" style={S("min-height:100vh; width:min(880px,100%); margin:0 auto; padding:28px 32px 64px; animation:fadeUp .35s ease both;")}>
          <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; color:#5C6B77; font-size:13px; cursor:pointer; padding:0; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>← 日本地図へ戻る</HoverBox>
          <h1 style={S("margin:18px 0 6px; font-size:32px; font-weight:700;")}>{v.muniPrefName}</h1>
          <p style={S("margin:0 0 28px; color:#5C6B77; font-size:14px;")}>{v.muniIntro}</p>

          <HoverBox as="button" onClick={v.prefAllOpen} title={v.prefAllTitle || undefined} style={S(`width:100%; text-align:left; display:flex; align-items:center; justify-content:space-between; gap:12px; background:${v.prefAllBg}; color:${v.prefAllFg}; border:1px solid ${v.prefAllBd}; border-radius:12px; padding:18px 22px; cursor:pointer; margin-bottom:22px; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("border-color:#1798D0;")}>
            <span>
              <span style={S("display:block; font-size:17px; font-weight:700;")}>{v.muniPrefName}全体（都道府県レベル）</span>
              <span style={S("display:block; font-size:12.5px; opacity:0.75; margin-top:2px;")}>{v.prefAllNote}</span>
            </span>
            <span style={S("font-family:'IBM Plex Mono',monospace; font-size:12px; border:1px solid currentColor; border-radius:999px; padding:3px 10px; white-space:nowrap;")}>{v.prefAllBadge}</span>
          </HoverBox>

          {v.muniLoading && (
            <div style={S("padding:40px 0; text-align:center; color:#8494A0; font-size:13.5px;")}>市区町村の一覧を読み込んでいます…</div>
          )}
          <div style={S("display:grid; grid-template-columns:repeat(auto-fill, minmax(190px,1fr)); gap:10px;")}>
            {v.muniList.map((m: any, i: number) => (
              m.requestUrl ? (
                <HoverBox as="a" key={i} href={m.requestUrl} target="_blank" rel="noopener noreferrer" style={S(`text-align:left; display:flex; flex-direction:column; gap:6px; background:${m.bg}; border:1px solid ${m.bd}; border-radius:12px; padding:14px 16px; cursor:pointer; color:${m.fg}; text-decoration:none; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("border-color:#1798D0; text-decoration:none;")}>
                  <span style={S("font-size:15px; font-weight:600;")}>{m.name}</span>
                  <span style={S(`font-family:'IBM Plex Mono',monospace; font-size:11px; color:${m.badgeFg};`)}>{m.badge}</span>
                </HoverBox>
              ) : (
                // title は「調べたが収録できない」団体にだけ付く（理由と確認日）
                <HoverBox as="button" key={i} onClick={m.open} title={m.title || undefined} style={S(`text-align:left; display:flex; flex-direction:column; gap:6px; background:${m.bg}; border:1px solid ${m.bd}; border-radius:12px; padding:14px 16px; cursor:${m.cursor}; color:${m.fg}; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("border-color:#1798D0;")}>
                  <span style={S("font-size:15px; font-weight:600;")}>{m.name}</span>
                  <span style={S(`font-family:'IBM Plex Mono',monospace; font-size:11px; color:${m.badgeFg};`)}>{m.badge}</span>
                </HoverBox>
              )
            ))}
          </div>
          {v.prefIsEmpty && (
            <div style={S("margin-top:18px; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:18px 22px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;")}>
              <span style={S("font-size:13.5px; color:#5C6B77;")}>この都道府県の自治体はまだ収録していません。リクエストが貯まった自治体から収録します。</span>
              <a href={v.prefRequestUrl} target="_blank" rel="noopener noreferrer" style={S("font-size:12.5px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:6px 16px; text-decoration:none; white-space:nowrap;")}>この県の収録をリクエスト ↗</a>
            </div>
          )}
        </div>
      )}

      {/* ============ アプリ共通ヘッダー ============ */}
      {/* ==== データ整備状況（進捗・エビデンス保管・ライセンス） ====
           「どこまで収録できたか（ToDo）」「何を保管しているか（情報公開）」
           「再配布にライセンス上の懸念があるか」を実データから出す全体ページ。 */}
      {/* ==== 進捗と計画（/roadmap）====
          進捗の数字は roadmap.gen.ts が実データから算出したもの。**ここに数字をベタ書きしない** —
          手書きの数字は必ず実態とズレる（フッターの「SOURCE: 甲府市 当初予算資料 R2–R8」固定表示、
          /coverage の予算列が最新年度のみ、で2回踏んだ）。計画も registry の1か所だけが手書き。 */}
      {v.isRoadmap && (
        <div data-screen-label="進捗と計画" data-mq-pad="" style={S("min-height:100vh; width:min(1160px,100%); margin:0 auto; padding:28px 28px 64px; animation:fadeUp .35s ease both;")}>
          <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; color:#5C6B77; font-size:13px; cursor:pointer; padding:0; margin-bottom:14px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>← トップへ戻る</HoverBox>
          <div style={S("margin-bottom:18px;")}>
            <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>進捗と計画</h1>
            <p style={S("margin:0 0 8px; color:#5C6B77; font-size:13.5px; line-height:1.8; max-width:78ch;")}>
              このサイトが「いまどこまで来ていて、次に何をするか」を公開しています。<strong style={S("color:#14181C;")}>下の進捗の数字はすべて実際の収録データから自動生成</strong>しているので、実態とズレません。
            </p>
            <p style={S("margin:0; color:#5C6B77; font-size:12.5px; line-height:1.8; max-width:78ch;")}>
              計画に<strong style={S("color:#14181C;")}>時期は書きません</strong> — 一次資料が手に入るかは発行元次第で（情報公開請求が要る資料や、消えてしまった資料があります）、私たちの側で約束できないためです。
              <button onClick={v.goCoverage} style={S("border:none; background:none; padding:0; margin-left:6px; color:#1798D0; font-size:12.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>自治体ごとの ○× はデータ整備状況へ →</button>
            </p>
          </div>

          {/* 進捗: 3階層のカバレッジ */}
          <h2 style={S("margin:0 0 8px; font-size:15px; font-weight:700;")}>いまどこまで来ているか</h2>
          <div style={S("display:grid; grid-template-columns:repeat(auto-fit, minmax(148px,1fr)); gap:10px; margin-bottom:14px;")}>
            {[
              { k: "詳細まで収録", v: `${v.rm.progress.fullCount}団体`, s: "予算→事業→成果→議会（甲府市）" },
              { k: "予算（款別）収録", v: `${v.rm.progress.budgetCount}団体`, s: "当初予算＋前年当初比" },
              { k: "決算で閲覧可", v: `${v.rm.progress.muniCount.toLocaleString()}市町村`, s: `${v.rm.progress.prefCount}都道府県・${v.rm.progress.kessanRange}` },
              { k: "一次資料", v: `${v.rm.progress.sourceCount}件`, s: `原本${v.rm.progress.fileCount}ファイル・魚拓${v.rm.progress.archivedCount}` },
            ].map((c: any, i: number) => (
              <div key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:12px 14px;")}>
                <div style={S("font-size:11px; color:#5C6B77; margin-bottom:3px;")}>{c.k}</div>
                <div style={S("font-size:18px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{c.v}</div>
                <div style={S("font-size:10.5px; color:#8494A0; margin-top:2px; line-height:1.5;")}>{c.s}</div>
              </div>
            ))}
          </div>

          <div data-mq="rmcols" style={S("display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px;")}>
            {/* 甲府＝1自治体を深く掘るとどうなるか */}
            <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:16px 18px;")}>
              <h3 style={S("margin:0 0 4px; font-size:13.5px; font-weight:700;")}>1自治体を深く掘るとこうなる（甲府市）</h3>
              <p style={S("margin:0 0 10px; font-size:11.5px; color:#8494A0; line-height:1.7;")}>予算から成果までを1つの自治体で通した見本です。他の自治体もこの深さを目指します。</p>
              {v.rm.kofuRows.map((r: any, i: number) => (
                <div key={i} style={S("display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px solid #ECF2F6; font-size:12px;")}>
                  <span style={S("color:#14181C; font-weight:600; white-space:nowrap;")}>{r.label}</span>
                  <span style={S("color:#5C6B77; font-family:'IBM Plex Mono',monospace; font-size:11px; text-align:right;")}>{r.detail}</span>
                </div>
              ))}
            </section>

            {/* 予算の年度の深さ */}
            <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:16px 18px;")}>
              <h3 style={S("margin:0 0 4px; font-size:13.5px; font-weight:700;")}>当初予算を複数年度そろえた自治体</h3>
              <p style={S("margin:0 0 10px; font-size:11.5px; color:#8494A0; line-height:1.7;")}>年度を切り替えて経年で追えます。1年度のみの自治体は載せていません。</p>
              {v.rm.depth.map((d: any, i: number) => (
                <div key={i} style={S("display:flex; justify-content:space-between; gap:12px; padding:6px 0; border-bottom:1px solid #ECF2F6; font-size:12px;")}>
                  <span style={S("color:#14181C; font-weight:600;")}>{d.name}</span>
                  <span style={S("color:#5C6B77; font-family:'IBM Plex Mono',monospace; font-size:11px;")}>{d.range}</span>
                </div>
              ))}
              {/* ⚠ ここに甲府市の行をべた書きしていた（2026-07-29 撤去）— ソートの外に
                  置かれるので7年度なのに2年度の自治体より後ろに出ており、団体名も手書き
                  だった。depth は derive が甲府（full）を含めて年度の多い順に並べる。 */}
            </section>
          </div>

          {/* 計画 */}
          <h2 style={S("margin:0 0 4px; font-size:15px; font-weight:700;")}>次に何をするか</h2>
          <p style={S("margin:0 0 10px; color:#5C6B77; font-size:12.5px; line-height:1.8; max-width:78ch;")}>
            「何を・なぜ・何が要るか」を書いています。<strong style={S("color:#14181C;")}>欲しい資料はリクエストできます</strong> — 👍 の多いものから着手します。
            <a href={v.requestListUrl} target="_blank" rel="noopener noreferrer" style={S("color:#1798D0; text-decoration:none; margin-left:6px;")}>リクエスト一覧 ↗</a>
          </p>
          {v.rm.groups.map((g: any) => (
            <section key={g.status} style={S("margin-bottom:16px;")}>
              <div style={S("display:flex; align-items:baseline; gap:10px; margin-bottom:8px; flex-wrap:wrap;")}>
                <span style={S(
                  "font-size:11.5px; font-weight:700; border-radius:999px; padding:3px 12px; " +
                  (g.status === "now"
                    ? "background:#1798D0; color:#FFFFFF;"
                    : g.status === "next"
                      ? "background:#E8F4FA; color:#0F76A3; border:1px solid #BFE0EF;"
                      : "background:#F1F5F8; color:#5C6B77; border:1px solid #DFE7EC;"),
                )}>{g.title}</span>
                <span style={S("font-size:11.5px; color:#8494A0;")}>{g.note}</span>
              </div>
              {g.items.map((it: any, i: number) => (
                <div key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:13px 16px; margin-bottom:8px;")}>
                  <div style={S("font-size:13.5px; font-weight:700; color:#14181C; margin-bottom:5px;")}>{it.title}</div>
                  <p style={S("margin:0 0 6px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:82ch;")}>{it.why}</p>
                  <p style={S("margin:0; font-size:11.5px; color:#8494A0; line-height:1.8; max-width:82ch;")}>
                    <span style={S("color:#5C6B77; font-weight:600;")}>要るもの: </span>{it.needs}
                    {it.ref && <span style={S("font-family:'IBM Plex Mono',monospace; font-size:10.5px; margin-left:6px; color:#9DACB7;")}>（{it.ref}）</span>}
                  </p>
                </div>
              ))}
            </section>
          ))}

          {/* ライセンスの現在地（隠さない） */}
          <section style={S("background:#F7FAFC; border:1px solid #DFE7EC; border-radius:14px; padding:16px 18px;")}>
            <h3 style={S("margin:0 0 6px; font-size:13.5px; font-weight:700;")}>一次資料の利用条件（{v.rm.progress.sourceCount}件）</h3>
            <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:82ch;")}>
              資料の消失・差し替えに備えて原本のコピーを自サーバーから配信しているため、利用条件の確認は避けて通れません。区分は隠さず全件公開しています。
            </p>
            <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
              {[
                { k: "再配布可", n: v.rm.progress.licenseOpen, c: "#0F7B4F", b: "#E7F5EE", d: "政府標準利用規約など" },
                { k: "要許可", n: v.rm.progress.licensePermission, c: "#8A4B1F", b: "#FFF8F2", d: "許諾未取得のまま配信中＝リスクを開示" },
                { k: "未確認", n: v.rm.progress.licenseUnverified, c: "#5C6B77", b: "#F1F5F8", d: "原文を調べれば区分が動く（棚卸しは計画にあり）" },
              ].map((x: any, i: number) => (
                <div key={i} style={S(`background:${x.b}; border:1px solid #DFE7EC; border-radius:10px; padding:9px 13px; min-width:150px;`)}>
                  <div style={S(`font-size:11px; color:${x.c}; font-weight:700;`)}>{x.k} {x.n}件</div>
                  <div style={S("font-size:10.5px; color:#8494A0; margin-top:2px; line-height:1.5;")}>{x.d}</div>
                </div>
              ))}
            </div>
            <button onClick={v.goCoverage} style={S("border:none; background:none; padding:0; margin-top:10px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>資料ごとの区分・原文はデータ整備状況へ →</button>
          </section>
        </div>
      )}

      {v.isCoverage && (
        <div data-screen-label="データ整備状況" data-mq-pad="" style={S("min-height:100vh; width:min(1160px,100%); margin:0 auto; padding:28px 28px 64px; animation:fadeUp .35s ease both;")}>
          <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; color:#5C6B77; font-size:13px; cursor:pointer; padding:0; margin-bottom:14px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>← トップへ戻る</HoverBox>
          <div style={S("margin-bottom:18px;")}>
            <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>データ整備状況</h1>
            <p style={S("margin:0 0 8px; color:#5C6B77; font-size:13.5px; line-height:1.8; max-width:78ch;")}>全国{v.cov.ready ? v.cov.summary.muniCount.toLocaleString() : "1,741"}市町村を都道府県別に網羅した一覧です。手付かずの自治体も載せています（<strong style={S("color:#14181C;")}>×＝これからのToDo</strong>）。一次資料を調べたうえで<strong style={S("color:#8A4B1F;")}>収録できないと判定したもの（—）</strong>は理由と確認日つきで別に開示しています。レジストリと魚拓台帳から自動生成しているため、常に実際の収録内容と一致します。各県の件数はこの{v.cov.ready ? v.cov.summary.muniCount.toLocaleString() : "1,741"}市町村の内訳で、都道府県会計そのもの（各県の先頭にある「〜（県全体）」の行）は市町村とは別に数えています。</p>
            <p style={S("margin:0; color:#5C6B77; font-size:12.5px; line-height:1.8; max-width:78ch;")}>
              <strong style={S("color:#14181C;")}>未収録（×）はその場でリクエストできます</strong> — 各行の「＋リクエスト」から、その自治体・その資料の収録リクエストを起票できます（GitHub Issue・👍 の多い順に着手します）。
              <a href={v.requestListUrl} target="_blank" rel="noopener noreferrer" style={S("color:#1798D0; text-decoration:none; margin-left:6px;")}>リクエスト一覧 ↗</a>
            </p>
          </div>

          {!v.cov.ready ? (
            <div style={S("padding:60px 0; text-align:center; color:#8494A0; font-size:13px;")}>
              {v.cov.error ? `読み込みに失敗しました: ${v.cov.error}` : "読み込み中…"}
            </div>
          ) : (
            <>
              {/* サマリ */}
              <div style={S("display:grid; grid-template-columns:repeat(auto-fit, minmax(148px,1fr)); gap:10px; margin-bottom:18px;")}>
                {[
                  { k: "詳細まで収録", v: `${v.cov.summary.fullCount}団体`, s: "予算→事業→成果→議会" },
                  { k: "予算（款別）収録", v: `${v.cov.summary.budgetCount}団体`, s: "当初予算＋前年当初比" },
                  { k: "決算で閲覧可", v: `${v.cov.summary.muniCount.toLocaleString()}市町村`, s: `${v.cov.summary.prefCount}都道府県・${v.cov.summary.kessanRange}` },
                  { k: "一次資料", v: `${v.cov.summary.sourceCount}件`, s: `原本${v.cov.summary.fileCount}ファイル・魚拓${v.cov.summary.archivedCount}` },
                  // 「まだ調べていない」と「調べたが収録できない」は意味が違う。件数は derive が算出する
                  { k: "調べたが収録できない", v: `${v.cov.unrecCount}件`, s: `${v.cov.unrecEntityCount}団体・理由と確認日つき` },
                ].map((c: any, i: number) => (
                  <div key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:12px 14px;")}>
                    <div style={S("font-size:11px; color:#5C6B77; margin-bottom:3px;")}>{c.k}</div>
                    <div style={S("font-size:18px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{c.v}</div>
                    <div style={S("font-size:10.5px; color:#8494A0; margin-top:2px; line-height:1.5;")}>{c.s}</div>
                  </div>
                ))}
              </div>

              {/* ライセンス上の注意。**初期は閉じる** — 要許可の資料が増えて一覧が長くなり、
                  本題（自治体×データセットの網羅一覧）を押し下げていたため。
                  ネイティブの details/summary を使う（キーボード操作・スクリーンリーダー・
                  ブラウザ内検索が素で効く。自前の開閉 state を持つとこれらを作り直すことになる）。
                  **畳んでも件数はサマリ行に出したままにする** — 隠すのが目的ではなく、
                  「リスクは開示しつつ、読みたい人が開く」形にするのが目的。 */}
              <details style={S("background:#FFF8F2; border:1px solid #EFD4BE; border-radius:14px; padding:0; margin-bottom:18px;")}>
                <summary style={S("cursor:pointer; padding:13px 18px; list-style:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap;")}>
                  <span style={S("font-size:14px; font-weight:700; color:#8A4B1F;")}>⚠ エビデンス・コピーのライセンス上の懸念</span>
                  <span style={S("display:flex; gap:6px; flex-wrap:wrap;")}>
                    {[
                      { n: v.cov.summary.licensePermission, l: "要許可", c: "#8A4B1F", b: "#EFD4BE" },
                      { n: v.cov.summary.licenseUnverified, l: "未確認", c: "#5C6B77", b: "#DFE7EC" },
                      { n: v.cov.summary.licenseOpen, l: "再配布可", c: "#0F76A3", b: "#B9E0F2" },
                    ].map((x: any, i: number) => (
                      <span key={i} style={S(`font-size:11px; border:1px solid ${x.b}; color:${x.c}; border-radius:999px; padding:2px 10px; background:#FFFFFF; white-space:nowrap;`)}>{x.l} <strong style={S("font-family:'IBM Plex Mono',monospace;")}>{x.n}</strong>件</span>
                    ))}
                  </span>
                  <span style={S("font-size:11.5px; color:#8A4B1F; margin-left:auto; white-space:nowrap;")}>詳しく ▾</span>
                </summary>
                <div style={S("padding:0 18px 16px;")}>
                  <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:80ch;")}>
                    資料の消失・差し替えに備え、原本のコピーを自サーバーから配信しています（エビデンス3層の③）。総務省資料は政府標準利用規約で再配布できますが、<strong style={S("color:#14181C;")}>自治体資料は多くが「利用条件は同サイト参照」で再配布可否が未確認</strong>です。次の資料は<strong style={S("color:#8A4B1F;")}>二次利用に許諾が必要と明記</strong>されているため、<strong style={S("color:#14181C;")}>画面のリンクはコピーではなく発行元（発行元から消えている資料は Wayback の魚拓）へ直接つないでいます</strong>。コピーは来歴の検証（下のファイル名・SHA-256・取得日）のために保管を続けており、発行元からの申し出があれば速やかに③の配信を停止します。
                  </p>
                  {v.cov.permissionSources.map((s2: any, i: number) => (
                    <div key={i} style={S("display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; background:#FFFFFF; border:1px solid #EFD4BE; border-radius:8px; padding:7px 11px; margin-top:5px;")}>
                      <span style={S("font-size:12px; font-weight:600; color:#14181C;")}>{s2.publisher}｜{s2.title}</span>
                      <span style={S("font-size:10.5px; color:#8A4B1F;")}>{s2.license}</span>
                    </div>
                  ))}
                </div>
              </details>

              {/* ==== 調べたが収録できなかった記録 ====
                  表の × は既定では「まだ手を付けていない（ToDo）」の意味なので、**調べたうえで
                  収録できないと判定したもの**をここで開示する。ライセンスの節と同じ作法:
                  ネイティブの details/summary・初期は閉じる・**畳んでも件数と分類はサマリ行に出す**。
                  件数は derive が registry（pipeline/registry/unrecordable.ts）から算出したもの。 */}
              <details style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:0; margin-bottom:18px;")}>
                <summary style={S("cursor:pointer; padding:13px 18px; list-style:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap;")}>
                  <span style={S("font-size:14px; font-weight:700; color:#14181C;")}>調べたが収録できなかった記録 <span style={S("font-family:'IBM Plex Mono',monospace;")}>{v.cov.unrecCount}</span>件</span>
                  <span style={S("display:flex; gap:6px; flex-wrap:wrap;")}>
                    {v.cov.unrecGroups.map((c: any, i: number) => (
                      <span key={i} title={c.note} style={S("font-size:11px; border:1px solid #DFE7EC; color:#5C6B77; border-radius:999px; padding:2px 10px; background:#FBFDFE; white-space:nowrap;")}>{c.label} <strong style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{c.count}</strong></span>
                    ))}
                  </span>
                  <span style={S("font-size:11.5px; color:#5C6B77; margin-left:auto; white-space:nowrap;")}>詳しく ▾</span>
                </summary>
                <div style={S("padding:0 18px 16px;")}>
                  <p style={S("margin:0 0 12px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:80ch;")}>
                    下の表の <span style={S("color:#DFE7EC;")}>×</span> は<strong style={S("color:#14181C;")}>まだ手を付けていない</strong>という意味です。それとは別に、<strong style={S("color:#14181C;")}>一次資料を実際に調べたうえで収録できないと判定したもの</strong>がここにあります（表では <strong style={S("color:#8A4B1F;")}>—</strong> で示します）。
                    <br />
                    <strong style={S("color:#14181C;")}>これは確認日時点の実測であって、恒久的にできないという意味ではありません</strong> — 「壊れていて修復できない」と記録していた資料が、その後の復号処理で実際に収録できるようになった例があります。収録できたときに記録が残り続けないよう、生成時に「本当にまだ収録していないか」を機械的に照合しています。
                  </p>
                  {v.cov.unrecGroups.map((c: any, gi: number) => (
                    <div key={gi} style={S(`${gi > 0 ? "margin-top:14px;" : ""}`)}>
                      <div style={S("font-size:12.5px; font-weight:700; color:#14181C;")}>{c.label} <span style={S("font-weight:400; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>{c.count}</span></div>
                      <div style={S("font-size:11px; color:#8494A0; line-height:1.7; margin-bottom:6px;")}>{c.note}</div>
                      {c.items.map((u: any, i: number) => (
                        <div key={i} style={S("background:#FBFDFE; border:1px solid #DFE7EC; border-radius:8px; padding:8px 11px; margin-top:5px;")}>
                          <div style={S("display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:baseline;")}>
                            <span style={S("font-size:12.5px; font-weight:600; color:#14181C;")}>
                              {u.name}
                              <span style={S("font-size:9.5px; color:#C6D2DA; margin-left:6px; font-family:'IBM Plex Mono',monospace;")}>{u.code}</span>
                              <span style={S("font-size:11px; color:#5C6B77; font-weight:400; margin-left:8px;")}>{u.datasetLabel}</span>
                            </span>
                            <span style={S("font-size:11px; color:#8A4B1F; font-family:'IBM Plex Mono',monospace;")}>{u.fyLabel}</span>
                          </div>
                          <p style={S("margin:4px 0 0; font-size:11.5px; color:#5C6B77; line-height:1.8;")}>{u.reason}</p>
                          <div style={S("display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-top:4px; font-size:10px; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>
                            <span>{u.checkedOn} 確認</span>
                            <span>{u.catLabels}</span>
                            {u.url && <a href={u.url} target="_blank" rel="noopener noreferrer" style={S("color:#0F76A3; text-decoration:none;")}>判定した資料 ↗</a>}
                            <span>{u.ref}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </details>

              {/* ==== 都道府県（県全体）の当初予算 ====
                  下の一覧は市町村を県ごとに畳んでいるので、**県エンティティ自身の収録状況は
                  47個のアコーディオンを全部開かないと読めなかった**（見出しのバッジも
                  「予算資料 N団体」で県が含まれるか分からない）。都道府県は分母が 47 に固定で
                  一巡が見えるものなので、到達度として一覧の上に出す。
                  作法は上の2つの details と同じ（初期は閉じる・畳んでも件数は summary に出す）。
                  件数は cov.prefSummary が実データから算出したもの（手書きしない）。 */}
              <details style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:0; margin-bottom:18px;")}>
                <summary style={S("cursor:pointer; padding:13px 18px; list-style:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap;")}>
                  <span style={S("font-size:14px; font-weight:700; color:#14181C;")}>都道府県（県全体）の当初予算 <span style={S("font-family:'IBM Plex Mono',monospace; color:#0F76A3;")}>{v.cov.prefSummary.done}</span><span style={S("font-family:'IBM Plex Mono',monospace; color:#8494A0;")}>/{v.cov.prefSummary.total}</span></span>
                  <span style={S("display:flex; gap:6px; flex-wrap:wrap;")}>
                    {[
                      { l: "収録", n: v.cov.prefSummary.done, c: "#0F76A3", b: "#B9E0F2" },
                      { l: "調べたが収録できない", n: v.cov.prefSummary.unrec, c: "#8A4B1F", b: "#EFD4BE" },
                      { l: "未着手", n: v.cov.prefSummary.todo, c: "#5C6B77", b: "#DFE7EC" },
                    ].map((x: any, i: number) => (
                      <span key={i} style={S(`font-size:11px; border:1px solid ${x.b}; color:${x.c}; border-radius:999px; padding:2px 10px; background:#FBFDFE; white-space:nowrap;`)}>{x.l} <strong style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{x.n}</strong></span>
                    ))}
                  </span>
                  <span style={S("font-size:11.5px; color:#5C6B77; margin-left:auto; white-space:nowrap;")}>詳しく ▾</span>
                </summary>
                <div style={S("padding:0 18px 16px;")}>
                  <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:80ch;")}>
                    都道府県は<strong style={S("color:#14181C;")}>県全体（都道府県会計）の当初予算</strong>を款別に収録しています。市町村と違って分母が {v.cov.prefSummary.total} で固定なので、一巡までの残りがそのまま見えます。各県の詳しい内容は下の一覧でその県を開くと、先頭の「〜（県全体）」の行にあります。
                  </p>
                  <div style={S("display:flex; gap:6px; flex-wrap:wrap;")}>
                    {v.cov.prefSummary.items.map((p: any, i: number) => (
                      <span
                        key={i}
                        title={p.ok ? (p.title ? `収録済み（一部の年度は収録できません）\n${p.title}` : "収録済み") : p.unrec ? `調べたが収録できません\n${p.title}` : "未収録（まだ手を付けていません）"}
                        style={S(`display:inline-flex; align-items:baseline; gap:5px; border:1px solid ${p.ok ? "#B9E0F2" : p.unrec ? "#EFD4BE" : "#DFE7EC"}; background:${p.ok ? "#FFFFFF" : "#FBFDFE"}; border-radius:999px; padding:3px 11px; white-space:nowrap;`)}
                      >
                        <span style={S(`font-size:12px; font-weight:700; color:${p.ok ? "#1798D0" : p.unrec ? "#8A4B1F" : "#C6D2DA"};`)}>{p.ok ? "○" : p.unrec ? "—" : "×"}{p.partial && <sup style={S("color:#8A4B1F; font-size:9px;")}>*</sup>}</span>
                        <span style={S(`font-size:12.5px; color:${p.ok ? "#14181C" : "#8494A0"};`)}>{p.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </details>

              {/* ==== 網羅一覧（1つの表） ==== */}
              <div style={S("display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:10px;")}>
                <div style={S("display:flex; align-items:center; gap:8px; flex-wrap:wrap;")}>
                  <input
                    value={v.cov.q}
                    onChange={(e) => v.cov.setQ(e.target.value)}
                    placeholder="自治体名・都道府県・団体コードで検索"
                    aria-label="自治体を検索"
                    style={S("border:1px solid #C6D2DA; border-radius:999px; padding:7px 15px; font-size:13px; width:min(320px, 70vw); font-family:'IBM Plex Sans JP',sans-serif; color:#14181C; background:#FFFFFF;")}
                  />
                  {v.cov.q && <span style={S("font-size:12px; color:#5C6B77;")}><strong style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.cov.matched.toLocaleString()}</strong>件</span>}
                </div>
                <div style={S("display:flex; gap:6px;")}>
                  <HoverBox as="button" onClick={v.cov.expandAll} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:5px 12px; font-size:11.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>すべて展開</HoverBox>
                  <HoverBox as="button" onClick={v.cov.collapseAll} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:5px 12px; font-size:11.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>すべて閉じる</HoverBox>
                </div>
              </div>

              {/* 列の凡例 */}
              <div style={S("display:flex; gap:10px; flex-wrap:wrap; font-size:10.5px; color:#8494A0; margin-bottom:6px;")}>
                {v.cov.datasets.map((d: any, i: number) => (
                  <span key={i}><strong style={S("color:#5C6B77;")}>{d.label}</strong> = {d.full}</span>
                ))}
              </div>
              {/* 印の凡例 — 「まだ調べていない」と「調べたが収録できない」を読者が区別できるようにする */}
              <div style={S("display:flex; gap:14px; flex-wrap:wrap; font-size:10.5px; color:#8494A0; margin-bottom:8px;")}>
                <span><strong style={S("color:#1798D0; font-size:12px;")}>○</strong> 収録済み</span>
                <span><strong style={S("color:#8A4B1F; font-size:12px;")}>—</strong> 調べたが収録できない（理由は上の記録）</span>
                <span><strong style={S("color:#C6D2DA; font-size:12px;")}>×</strong> 未収録（まだ手を付けていない）</span>
                <span><strong style={S("color:#1798D0; font-size:12px;")}>○<sup style={S("color:#8A4B1F;")}>*</sup></strong> 収録済みだが一部の年度は収録できない</span>
                <span><strong style={S("color:#C6D2DA; font-size:12px;")}>·</strong> 対象外（この団体には存在しないデータ）</span>
              </div>

              <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; overflow:hidden;")}>
                {v.cov.groups.length === 0 && (
                  <div style={S("padding:40px; text-align:center; color:#8494A0; font-size:13px;")}>該当する自治体がありません</div>
                )}
                {v.cov.groups.map((g: any, gi: number) => (
                  <div key={gi} style={S(`${gi > 0 ? "border-top:1px solid #ECF2F6;" : ""}`)}>
                    {/* 都道府県の行（クリックで開閉） */}
                    <HoverBox
                      as="button"
                      onClick={g.toggle}
                      style={S("width:100%; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 14px; background:#FBFDFE; border:none; cursor:pointer; text-align:left; font-family:'IBM Plex Sans JP',sans-serif;")}
                      hoverStyle={S("background:#F1F6F9;")}
                    >
                      <span style={S("display:flex; align-items:center; gap:8px;")}>
                        <span style={S(`color:#8494A0; font-size:10px; transform:rotate(${g.open ? "90deg" : "0deg"}); display:inline-block; transition:transform .15s;`)}>▶</span>
                        <span style={S("font-size:13.5px; font-weight:700; color:#14181C;")}>{g.name}</span>
                        {/* この数は**市町村の数**（1,741 の内訳）。県全体エンティティは
                            右の「県全体」バッジが受け持つので、ここには含めない */}
                        <span title="この県の市町村の数（都道府県会計そのものは右の「県全体」で示しています）" style={S("font-size:11px; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>{g.count}<span style={S("font-family:'IBM Plex Sans JP',sans-serif;")}>市町村</span></span>
                      </span>
                      {/* 「県全体」と「市区町村」は別の話なので畳んだ状態でも分けて出す
                          （旧「予算資料 N団体」は県自身が含まれるかが読めなかった） */}
                      <span style={S("display:flex; align-items:center; gap:6px; flex-wrap:wrap; justify-content:flex-end;")}>
                        <span
                          title={g.prefEnt.ok ? "県全体（都道府県会計）の当初予算を収録済み" : g.prefEnt.unrec ? "県全体の当初予算は調べたが収録できません" : "県全体の当初予算は未収録（まだ手を付けていません）"}
                          style={S(`font-size:10.5px; color:${g.prefEnt.ok ? "#0F76A3" : g.prefEnt.unrec ? "#8A4B1F" : "#8494A0"}; border:1px solid ${g.prefEnt.ok ? "#B9E0F2" : g.prefEnt.unrec ? "#EFD4BE" : "#DFE7EC"}; border-radius:999px; padding:1px 9px; white-space:nowrap;`)}
                        >県全体 <strong style={S("font-family:'IBM Plex Mono',monospace;")}>{g.prefEnt.ok ? "○" : g.prefEnt.unrec ? "—" : "×"}</strong></span>
                        {g.deep > 0 && <span style={S("font-size:10.5px; color:#0F76A3; border:1px solid #B9E0F2; border-radius:999px; padding:1px 9px; white-space:nowrap;")}>市区町村 {g.deep}団体</span>}
                      </span>
                    </HoverBox>

                    {/* 市町村の行（○×） */}
                    {g.open && (
                      <div style={S("overflow-x:auto;")}>
                        <table style={S("width:100%; border-collapse:collapse; font-size:12px; min-width:560px;")}>
                          <thead>
                            <tr>
                              <th style={S("text-align:left; padding:6px 14px; border-bottom:1px solid #ECF2F6; font-size:10.5px; font-weight:600; color:#8494A0; white-space:nowrap;")}>自治体</th>
                              {v.cov.datasets.map((d: any, i: number) => (
                                <th key={i} title={d.full} style={S("padding:6px 4px; border-bottom:1px solid #ECF2F6; font-size:10.5px; font-weight:600; color:#8494A0; width:44px; text-align:center;")}>{d.label}</th>
                              ))}
                              <th style={S("padding:6px 14px; border-bottom:1px solid #ECF2F6; font-size:10.5px; font-weight:600; color:#8494A0; text-align:right; white-space:nowrap;")}>資料</th>
                            </tr>
                          </thead>
                          <tbody>
                            {g.rows.map((m: any, mi: number) => (
                              <React.Fragment key={mi}>
                                <tr>
                                  <td style={S("padding:7px 14px; border-bottom:1px solid #F4F8FA; white-space:nowrap;")}>
                                    <span style={S(`color:#14181C; ${m.tier ? "font-weight:600;" : ""}`)}>{m.name}</span>
                                    <span style={S("font-size:9.5px; color:#C6D2DA; margin-left:6px; font-family:'IBM Plex Mono',monospace;")}>{m.code}</span>
                                    {m.tier && <span style={S(`font-size:9px; font-weight:700; margin-left:6px; border-radius:4px; padding:0 5px; color:${m.tier === "full" ? "#0F76A3" : "#5C6B77"}; border:1px solid ${m.tier === "full" ? "#B9E0F2" : "#DFE7EC"};`)}>{m.tier === "full" ? "詳細" : "款別"}</span>}
                                  </td>
                                  {/* ○＝収録済み／—＝調べたが収録できない／×＝まだ手を付けていない。
                                      収録済みでも一部年度が収録できない場合があるので ○ の右肩に * を付ける
                                      （どちらも title に理由と確認日を出す） */}
                                  {m.marks.map((mk: any, ki: number) => (
                                    <td
                                      key={ki}
                                      title={[
                                        mk.na
                                          ? "対象外 — 総務省の決算状況調は市町村が対象の調査で、都道府県会計は含まれません"
                                          : mk.ok ? mk.detail || "収録済み" : mk.unrec.length ? "調べたが収録できません" : "未収録（まだ手を付けていません）",
                                        ...mk.unrec.map((u: any) => `【${u.fyLabel}】${u.reason}（${u.checkedOn} 確認）`),
                                      ].join("\n")}
                                      style={S("padding:7px 4px; border-bottom:1px solid #F4F8FA; text-align:center;")}
                                    >
                                      {/* 対象外（この団体には構造的に存在しないデータセット）は
                                          × と別の印にする — × は「これからの ToDo」の意味なので */}
                                      {mk.na ? (
                                        <span style={S("color:#C6D2DA; font-size:12px;")}>·</span>
                                      ) : mk.ok ? (
                                        <span style={S("color:#1798D0; font-weight:700; font-size:13px;")}>○{mk.unrec.length > 0 && <sup style={S("color:#8A4B1F; font-size:9px;")}>*</sup>}</span>
                                      ) : mk.unrec.length > 0 ? (
                                        <span style={S("color:#8A4B1F; font-weight:700; font-size:13px;")}>—</span>
                                      ) : (
                                        <span style={S("color:#DFE7EC; font-size:12px;")}>×</span>
                                      )}
                                    </td>
                                  ))}
                                  <td style={S("padding:7px 14px; border-bottom:1px solid #F4F8FA; text-align:right; white-space:nowrap;")}>
                                    <span style={S("display:inline-flex; gap:6px; align-items:center; justify-content:flex-end;")}>
                                      {m.sourceCount > 0 && (
                                        <HoverBox as="button" onClick={m.toggleSources} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:1px 9px; font-size:10.5px; cursor:pointer; font-family:'IBM Plex Mono',monospace;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>{m.sourceCount}{m.sourcesOpen ? " ▲" : " ▼"}</HoverBox>
                                      )}
                                      {/* 未収録があればその場でリクエスト（この表がそのまま参加導線になる） */}
                                      {m.requestUrl && (
                                        <HoverBox
                                          as="a"
                                          href={m.requestUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={`${m.name}の未収録（${m.missLabel}）の収録をリクエストする`}
                                          style={S("border:1px solid #DFE7EC; color:#8494A0; border-radius:999px; padding:1px 9px; font-size:10.5px; text-decoration:none; white-space:nowrap;")}
                                          hoverStyle={S("border-color:#1798D0; color:#1798D0;")}
                                        >＋リクエスト</HoverBox>
                                      )}
                                    </span>
                                  </td>
                                </tr>
                                {/* 資料（エビデンスの保管情報）— この自治体の行の中に畳む */}
                                {m.sourcesOpen && m.sources.length > 0 && (
                                  <tr>
                                    <td colSpan={v.cov.datasets.length + 2} style={S("padding:0 14px 10px; background:#FBFDFE; border-bottom:1px solid #F4F8FA;")}>
                                      {m.sources.map((src: any, si: number) => (
                                        <div key={si} style={S(`padding:7px 0; ${si > 0 ? "border-top:1px solid #ECF2F6;" : ""}`)}>
                                          <div style={S("display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:baseline;")}>
                                            <span style={S("font-size:11.5px; color:#14181C;")}>{src.title}</span>
                                            <span style={S("display:flex; gap:5px; flex-wrap:wrap;")}>
                                              <span style={S(`font-size:9.5px; font-weight:700; border-radius:5px; padding:1px 6px; white-space:nowrap; color:${src.licenseClass === "permission-required" ? "#8A4B1F" : src.licenseClass === "open" ? "#0F76A3" : "#5C6B77"}; border:1px solid ${src.licenseClass === "permission-required" ? "#EFD4BE" : src.licenseClass === "open" ? "#B9E0F2" : "#DFE7EC"};`)}>
                                                {src.licenseClass === "permission-required" ? "要許可" : src.licenseClass === "open" ? "再配布可" : "条件未確認"}
                                              </span>
                                              {src.archived && <span style={S("font-size:9.5px; color:#5C6B77; border:1px solid #DFE7EC; border-radius:5px; padding:1px 6px; white-space:nowrap;")}>{src.archiveOrigin ? "原本が魚拓" : "魚拓済"}{src.shaVerified ? "・照合✓" : ""}</span>}
                                            </span>
                                          </div>
                                          {src.files.map((f: any, fi: number) => (
                                            <div key={fi} style={S("display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-top:2px; font-size:10px; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>
                                              <a href={f.href} onClick={(ev) => { ev.preventDefault(); f.open(); }} style={S("color:#0F76A3; text-decoration:none; cursor:pointer;")}>{f.filename}</a>
                                              <span>sha256 {f.sha256}</span>
                                              <span>{(f.bytes / 1024).toFixed(0)}KB</span>
                                              <span>{f.fetchedAt} 取得</span>
                                            </div>
                                          ))}
                                        </div>
                                      ))}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 全国共通の資料（総務省）— 自治体に紐づかないのでここだけ別枠 */}
              <div style={S("margin-top:14px; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:12px 14px;")}>
                <div style={S("font-size:12.5px; font-weight:700; color:#14181C; margin-bottom:4px;")}>全国共通の資料（総務省）<span style={S("font-weight:400; color:#8494A0;")}> {v.cov.national.length}件</span></div>
                <p style={S("margin:0; font-size:11px; color:#8494A0; line-height:1.7;")}>上の表の「決算」列（全{v.cov.summary.muniCount.toLocaleString()}市町村・{v.cov.summary.kessanRange}）はこれらの資料が根拠です。政府標準利用規約準拠で再配布可。</p>
              </div>
              {v.cov.unclassified.length > 0 && (
                <div style={S("margin-top:10px; background:#FFF8F2; border:1px solid #EFD4BE; border-radius:12px; padding:12px 14px;")}>
                  <div style={S("font-size:12.5px; font-weight:700; color:#8A4B1F;")}>未分類の資料 {v.cov.unclassified.length}件（要メンテ）</div>
                  <p style={S("margin:4px 0 0; font-size:11px; color:#5C6B77;")}>{v.cov.unclassified.map((u: any) => u.sourceId).join(" / ")}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {v.isApp && (
        <div style={S("min-height:100vh; display:flex; flex-direction:column;")}>
          {/* 自治体スコープを持たない /sources ではヘッダーごと出さない — パンくず・年度
              セレクタ・タブ・単位切替はどれも「いま見ている自治体」のものなので、
              全473資料を横断するページに載ると誤った文脈になる（/coverage・/roadmap と同じ扱い） */}
          {v.showAppHeader && (
          <header style={S("background:#FFFFFF; border-bottom:1px solid #DFE7EC; position:sticky; top:0; z-index:10;")}>
            <div data-mq-pad="" data-mq="head" style={S("width:min(1160px,100%); margin:0 auto; padding:12px 28px 0; display:flex; flex-direction:column; gap:8px;")}>
              <div style={S("display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;")}>
                <div style={S("display:flex; align-items:center; gap:14px; flex-wrap:wrap;")}>
                  <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; padding:0; cursor:pointer; font-weight:700; font-size:15px; color:#14181C; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>予算トレース</HoverBox>
                  <span style={S("color:#C6D2DA;")}>/</span>
                  <nav style={S("display:flex; align-items:center; gap:6px; font-size:13px; color:#5C6B77;")}>
                    <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; padding:0; cursor:pointer; color:#5C6B77; font-size:13px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>日本</HoverBox>
                    <span>›</span>
                    <HoverBox as="button" onClick={v.goMuniSelect} style={S("border:none; background:none; padding:0; cursor:pointer; color:#5C6B77; font-size:13px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>{v.crumbPref}</HoverBox>
                    <span>›</span>
                    <span style={S("color:#14181C; font-weight:600;")}>{v.crumbMuni}</span>
                  </nav>
                </div>
                <div data-mq="hctrl" style={S("display:flex; align-items:center; gap:8px; flex-wrap:wrap;")}>
                  <div style={S("display:inline-flex; border:1px solid #DFE7EC; border-radius:999px; overflow:hidden; background:#FFFFFF;")}>
                    {v.unitTabs.map((ut: any, i: number) => (
                      <button key={i} onClick={ut.pick} style={S(`border:none; background:${ut.bg}; color:${ut.fg}; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}>{ut.label}</button>
                    ))}
                  </div>
                  <select
                    value={v.yearSel}
                    onChange={(e) => v.pickYear(e.target.value)}
                    aria-label="表示する当初予算の年度"
                    style={S("font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#5C6B77; background:#ECF2F6; border:none; border-radius:999px; padding:4px 12px; white-space:nowrap; cursor:pointer; appearance:auto;")}
                  >
                    {v.yearOptions.map((o: any) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <nav data-mq="tabs" style={S("display:flex; gap:4px; overflow-x:auto;")}>
                {v.navTabs.map((t: any, i: number) => (
                  <HoverBox as="button" key={i} onClick={t.open} style={S(`border:none; background:none; padding:10px 14px 12px; cursor:pointer; font-size:14px; font-weight:${t.fw}; color:${t.fg}; border-bottom:2.5px solid ${t.ul}; white-space:nowrap; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("color:#1798D0;")}>{t.label}</HoverBox>
                ))}
              </nav>
            </div>
          </header>
          )}

          <main data-mq-pad="" style={S("flex:1; width:min(1160px,100%); margin:0 auto; padding:28px 28px 72px;")}>

            {/* ==== ダッシュボード ==== */}
            {/* シャード取得待ち。**自治体のデータを読む画面はすべて**ここで止める — 以前は
                ダッシュボードだけが見ており、ドリル・前年比較などは取得完了まで甲府市の数値と
                出典を出していた（2026-09-25 修正） */}
            {v.loading && (
              <div data-screen-label="自治体データ（読み込み中）" style={S("padding:80px 0; text-align:center; color:#8494A0; font-size:14px; animation:fadeUp .35s ease both;")}>
                {v.loadingLabel}
              </div>
            )}
            {v.isDash && !v.loading && (
              <div data-screen-label="自治体ダッシュボード" style={S("animation:fadeUp .35s ease both;")}>
                <div style={S("display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:24px;")}>
                  <div>
                    <h1 style={S("margin:0 0 4px; font-size:28px; font-weight:700;")}>{v.dashTitle}</h1>
                    <p style={S("margin:0; color:#5C6B77; font-size:13.5px;")}>{v.dashSubtitle}</p>
                  </div>
                  <div data-mq="ralign" style={S("text-align:right;")}>
                    <div style={S("font-family:'IBM Plex Mono',monospace; font-size:34px; font-weight:600; line-height:1.1;")}>{v.totalFmtAnim}</div>
                    <div style={S("font-size:12.5px; color:#5C6B77;")}>{v.yoyCaption} <span style={S("color:#0F76A3; font-weight:600;")}>{v.yoy}</span></div>
                    <div style={S("font-size:12px; color:#5C6B77; margin-top:3px;")}>{v.perCapitaLine}</div>
                  </div>
                </div>

                <div style={S("display:grid; grid-template-columns:repeat(auto-fit, minmax(340px,1fr)); gap:18px; margin-bottom:26px;")}>
                  {v.dashPanels.map((pn: any, i: number) => (
                    <section key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:22px 24px;")}>
                      <div style={S("display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;")}>
                        <div style={S("display:flex; align-items:center; gap:7px;")}>
                          <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>{pn.title}</h2>
                          <button onMouseEnter={pn.gloss} onClick={pn.gloss} onMouseLeave={v.hideTip} style={S("width:17px; height:17px; border-radius:50%; border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; font-size:11px; line-height:1; cursor:help; padding:0; font-family:'IBM Plex Mono',monospace;")}>?</button>
                        </div>
                        <HoverBox as="button" onClick={pn.openDrill} style={S("border:none; background:none; color:#1798D0; font-size:12.5px; font-weight:600; cursor:pointer; padding:0; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("text-decoration:underline;")}>款・項・目・節で見る →</HoverBox>
                      </div>
                      <div style={S("display:flex; gap:22px; align-items:center; flex-wrap:wrap;")}>
                        <div onMouseMove={pn.tipMove} onClick={pn.tipMove} onMouseLeave={v.hideTip} style={S(`width:170px; height:170px; border-radius:50%; background:${pn.donutBg}; position:relative; flex-shrink:0; cursor:pointer;`)}>
                          <span data-anim="donutcover" style={S("position:absolute; inset:0; border-radius:50%; background:#FFFFFF; pointer-events:none;")}></span>
                          <div style={S("position:absolute; inset:34px; border-radius:50%; background:#FFFFFF; display:flex; flex-direction:column; align-items:center; justify-content:center;")}>
                            <span style={S("font-size:10.5px; color:#5C6B77;")}>{pn.centerLabel}</span>
                            <span style={S("font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:600;")}>{pn.centerAmt}</span>
                          </div>
                        </div>
                        <div style={S("flex:1; min-width:200px; display:flex; flex-direction:column;")}>
                          {pn.legend.map((lg: any, j: number) => (
                            <HoverBox as="button" key={j} onClick={lg.open} onMouseEnter={lg.hoverOn} onMouseLeave={lg.hoverOff} style={S("display:flex; align-items:center; gap:9px; border:none; background:none; padding:5px 6px; cursor:pointer; border-radius:7px; text-align:left; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("background:#ECF2F6;")}>
                              <span style={S(`width:10px; height:10px; border-radius:3px; background:${lg.sw}; flex-shrink:0;`)}></span>
                              <span style={S("flex:1; font-size:13px; color:#14181C;")}>{lg.name}</span>
                              <span style={S("font-family:'IBM Plex Mono',monospace; font-size:12.5px;")}>{lg.amtFmt}</span>
                              <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77; width:44px; text-align:right;")}>{lg.pctFmt}</span>
                            </HoverBox>
                          ))}
                        </div>
                      </div>
                    </section>
                  ))}
                </div>

                {/* 政策テーマ・注目の事業は予算資料（主な事業一覧）が要る full 専用（甲府） */}
                {v.isFull && (
                <section style={S("margin-bottom:26px;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>政策テーマ別に見る</h2>
                    <HoverBox as="button" onClick={v.goThemes} style={S("border:none; background:none; color:#1798D0; font-size:12.5px; font-weight:600; cursor:pointer; padding:0; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("text-decoration:underline;")}>すべてのテーマ →</HoverBox>
                  </div>
                  <div style={S("display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:10px;")}>
                    {v.themeStrip.map((th: any, i: number) => (
                      <HoverBox as="button" key={i} onClick={th.open} style={S("text-align:left; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:14px 16px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0;")}>
                        <span style={S("display:block; font-size:14px; font-weight:600; margin-bottom:2px;")}>{th.name}</span>
                        <span style={S("display:block; font-size:11px; color:#5C6B77; margin-bottom:6px;")}>{th.sub2}</span>
                        <span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:15px;")}>{th.totalFmt}</span>
                        <span style={S("display:block; font-size:11.5px; color:#5C6B77;")}>{th.count}事業 ・ {th.sub}</span>
                      </HoverBox>
                    ))}
                  </div>
                  <p style={S("margin:10px 2px 0; font-size:12px; color:#5C6B77;")}>第七次甲府市総合計画の基本目標別に、予算資料「主な事業一覧」掲載事業の予算額を集計しています。</p>
                </section>
                )}

                {(v.isFull || v.isBudget) && v.featured.length > 0 && (
                <section>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>注目の事業（予算額上位）</h2>
                  </div>
                  <div style={S("display:grid; grid-template-columns:repeat(auto-fit, minmax(280px,1fr)); gap:12px;")}>
                    {v.featured.map((f: any, i: number) => (
                      <div key={i} style={S("text-align:left; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:18px 20px;")}>
                        <span style={S("display:flex; align-items:center; gap:8px; margin-bottom:6px;")}>
                          <span style={S("font-size:11.5px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>{f.kanPath}</span>
                          {f.kubun && <span style={S(`font-size:10.5px; font-weight:700; border-radius:999px; padding:1px 9px; color:${f.kubun === "新規" ? "#0F76A3" : "#C25400"}; border:1px solid ${f.kubun === "新規" ? "#B9E0F2" : "#EFD4BE"};`)}>{f.kubun}</span>}
                        </span>
                        <span style={S("display:block; font-size:15px; font-weight:700; margin-bottom:8px; color:#14181C;")}>{f.name}</span>
                        <span style={S("display:block; font-size:12px; color:#5C6B77; margin-bottom:8px;")}>予算 <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C; font-weight:600;")}>{f.budgetFmt}</span>（{f.sub}）</span>
                        <span style={S("display:block; font-size:11.5px; color:#5C6B77; line-height:1.6;")}>{f.desc}</span>
                      </div>
                    ))}
                  </div>
                  {v.hasProjCoverage && (
                  <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:14px 20px; margin-top:14px;")}>
                    <div style={S("display:flex; justify-content:space-between; gap:12px; font-size:12px; color:#5C6B77; margin-bottom:6px; flex-wrap:wrap;")}>
                      <span>事業単位のエビデンスあり <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C; font-weight:600;")}>{v.projCoverageCoveredFmt}</span>（総額の {v.projCoveragePct}%・{v.projCoverageCount}事業）</span>
                      <span>事業掲載なし（款・項レベルのみ） <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.projCoverageRestFmt}</span></span>
                    </div>
                    <div style={S("display:flex; height:10px; border-radius:999px; overflow:hidden; background:#E3EBF0;")}>
                      <span data-anim="bar" style={S(`width:${v.projCoverageBarW}%; background:#1798D0;`)}></span>
                    </div>
                    <p style={S("margin:8px 0 0; font-size:11.5px; color:#5C6B77;")}>「主な事業一覧」に掲載された事業だけが内容・施策つきで説明されています。残りの予算は款別（一部は決算の項別）までの内訳です。</p>
                  </div>
                  )}
                </section>
                )}

                {/* 議会の構成（予算議決時）— 甲府（full）＋議決時点の構成を確かめた budget 階層の議会。
                    会派別議席数＋当初予算の議決＋賛否（収録済みの団体）。甲府の賛否は未収録。 */}
                {v.council && (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:22px 24px; margin:26px 0;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>議会の構成（予算議決時）</h2>
                    <span style={S("font-size:12.5px; color:#5C6B77;")}>{v.council.body} ・ {v.council.seatsLabel} <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.council.seatsShown}</span>{v.council.vacancyLabel && <> ・ {v.council.vacancyLabel}</>} ・ {v.council.asOfLabel}現在{v.council.departureLabel}</span>
                  </div>
                  <div style={S("display:flex; gap:30px; flex-wrap:wrap;")}>
                    <div style={S("flex:2 1 380px; min-width:300px;")}>
                      <div style={S("display:flex; height:16px; border-radius:999px; overflow:hidden; margin-bottom:14px; background:#E3EBF0;")}>
                        {v.council.factions.map((cp: any, i: number) => (
                          <span key={i} data-anim="bar" onMouseMove={cp.tipMove} onClick={cp.tipMove} onMouseLeave={v.hideTip} style={S(`width:${cp.w}%; background:${cp.sw}; cursor:pointer;`)}></span>
                        ))}
                      </div>
                      <div style={S("display:flex; flex-direction:column;")}>
                        {v.council.factions.map((cp: any, i: number) => (
                          <div key={i} data-mq="council" style={S("display:grid; grid-template-columns:14px minmax(140px,1fr) 70px; align-items:center; gap:10px; padding:7px 4px; border-bottom:1px solid #ECF2F6; font-size:13px;")}>
                            <span style={S(`width:10px; height:10px; border-radius:3px; background:${cp.sw};`)}></span>
                            <span style={S("font-weight:600; display:flex; align-items:center; gap:8px; flex-wrap:wrap;")}>
                              {cp.name}
                              {cp.stanceLabel && (
                                <span style={S(`font-size:11px; font-weight:600; border-radius:999px; padding:1px 8px; white-space:nowrap; ${cp.stanceTone === "yes" ? "background:#E3F4FC; color:#0F76A3;" : cp.stanceTone === "no" ? "background:#FDECEA; color:#B3261E;" : "background:#F1F6F9; color:#5C6B77;"}`)}>{cp.stanceLabel}</span>
                              )}
                            </span>
                            <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{cp.seatsLabel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={S("flex:1 1 240px; min-width:220px;")}>
                      <div style={S("background:#F1F6F9; border-radius:12px; padding:16px 18px; margin-bottom:12px;")}>
                        <div style={S("display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;")}>
                          <span style={S("font-size:11.5px; font-weight:700; background:#E3F4FC; color:#0F76A3; border-radius:999px; padding:3px 11px;")}>{v.council.resolution.result}</span>
                          <span style={S("font-size:12px; color:#5C6B77;")}>{v.council.resolution.sessionLabel}（{v.council.resolution.decidedDateLabel}）</span>
                        </div>
                        <div style={S("font-size:13px; font-weight:600; color:#14181C; line-height:1.6;")}>{v.council.resolution.billNo}　{v.council.resolution.billName}</div>
                        {v.council.voteTallies.map((vt: any, k: number) => (
                          <div key={k} style={S("margin-top:10px; font-size:12.5px; color:#14181C;")}>{vt.part ? `${vt.part}の賛否` : "賛否"} <span style={S("font-family:'IBM Plex Mono',monospace;")}>{vt.label}</span></div>
                        ))}
                        <p style={S("margin:10px 0 0; font-size:11px; color:#8494A0; line-height:1.7;")}>{v.council.voteNote}</p>
                      </div>
                      <div style={S("display:flex; gap:6px; flex-wrap:wrap; font-size:11.5px;")}>
                        <HoverBox as="button" onClick={v.council.rosterOpen} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:3px 11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif; font-size:11.5px;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>出典：{v.council.rosterTitle}（{v.council.rosterAction}）</HoverBox>
                        <HoverBox as="button" onClick={v.council.resultOpen} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:3px 11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif; font-size:11.5px;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>出典：{v.council.resultTitle}（{v.council.resultAction}）</HoverBox>
                        {v.council.departureChips.map((dc: any, k: number) => <HoverBox key={k} as="button" onClick={dc.open} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:3px 11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif; font-size:11.5px;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>出典：{dc.title}（{dc.action}）</HoverBox>)}
                        {v.council.voteOpen && <HoverBox as="button" onClick={v.council.voteOpen} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:3px 11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif; font-size:11.5px;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>出典：{v.council.voteSourceTitle}（{v.council.voteAction}）</HoverBox>}
                        {v.council.newsletterUrl && <a href={v.council.newsletterUrl} target="_blank" rel="noopener noreferrer" style={S("border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:3px 11px; text-decoration:none;")}>議会だより ↗</a>}
                        {v.council.minutesUrl && <a href={v.council.minutesUrl} target="_blank" rel="noopener noreferrer" style={S("border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:3px 11px; text-decoration:none;")}>会議録検索 ↗</a>}
                      </div>
                    </div>
                  </div>
                </section>
                )}

                {/* データの注意 — 「この数値のここが不確か」を隠さず出す。
                    **手で書いていない**: validate の warning（検証ゲートが検出し、原典側の事情と
                    説明できるもの）を derive がそのまま自治体へ割り当てている。
                    初期は閉じる（本題を押し下げないため）が、**件数はサマリ行に出したまま**にする
                    ——隠すのが目的ではなく「不確かさは開示しつつ、読みたい人が開く」形にするのが目的。
                    /coverage のライセンス懸念と同じ扱い。 */}
                {v.caveats && (
                <details style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:0; margin:26px 0;")}>
                  <summary style={S("cursor:pointer; padding:13px 20px; list-style:none; display:flex; align-items:center; gap:10px; flex-wrap:wrap;")}>
                    <span style={S("font-size:14px; font-weight:700; color:#14181C;")}>データの注意</span>
                    <span style={S("font-size:11.5px; border:1px solid #DFE7EC; color:#5C6B77; border-radius:999px; padding:2px 10px; background:#F7FAFC; white-space:nowrap;")}>
                      <strong style={S("font-family:'IBM Plex Mono',monospace;")}>{v.caveats.count}</strong>件
                    </span>
                    <span style={S("font-size:11.5px; color:#8494A0;")}>この自治体の数値で、原典と完全には突き合わないところ</span>
                    <span style={S("font-size:11.5px; color:#5C6B77; margin-left:auto; white-space:nowrap;")}>詳しく ▾</span>
                  </summary>
                  <div style={S("padding:0 20px 16px;")}>
                    <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77; line-height:1.85; max-width:80ch;")}>
                      収録した数値は「合計＝内訳の和」などで自動検証しています。<strong style={S("color:#14181C;")}>一致しなかったものは隠さずここに出します</strong>。多くは原典側の丸めや、資料の書き方によって私たちが拾えていない行です。検証が通らなかった資料はそもそも収録していません（この一覧に出るのは、内容を確認して許容したものだけです）。
                    </p>
                    {v.caveats.items.map((c: any, i: number) => (
                      <div key={i} style={S("background:#F7FAFC; border:1px solid #ECF2F6; border-radius:8px; padding:9px 12px; margin-top:6px;")}>
                        <div style={S("font-size:11px; color:#8494A0; margin-bottom:3px;")}>
                          <span style={S("font-family:'IBM Plex Mono',monospace;")}>{c.fyLabel}</span> ・ {c.title}
                        </div>
                        {c.plain
                          ? <>
                              <div style={S("font-size:12.5px; color:#14181C; line-height:1.8;")}>{c.plain}</div>
                              {/* 検証の原文も併記する（丸めた説明だけにしない — 数字を確かめたい人のため） */}
                              <div style={S("font-size:10.5px; color:#8494A0; line-height:1.7; margin-top:4px; font-family:'IBM Plex Mono',monospace;")}>{c.message}</div>
                            </>
                          : <div style={S("font-size:12px; color:#3A4750; line-height:1.75;")}>{c.message}</div>}
                      </div>
                    ))}
                  </div>
                </details>
                )}

                {/* 事業報告（成果）— **全量公開**の自治体（川崎 572件）。
                    甲府の詳細票セクション（下）とは**別にする** — 評価体系が違い、
                    川崎の達成度は**数字が小さいほど良い**（甲府の A〜F と向きが逆）。
                    既存のバッジへ丸めると意味が反転するので、凡例を必ず添えて素の値を出す。
                    572件あるので一覧＋検索＋ページング（/sources と同じ形）。 */}
                {v.repAll && (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:22px 24px; margin:26px 0;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:6px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>事業報告（成果）</h2>
                    <span style={S("font-size:12px; color:#5C6B77;")}>{v.repAll.ready ? v.repAll.docLabel : "評価シート"} — 予算→執行→成果を1事業で追える</span>
                  </div>
                  {!v.repAll.ready ? (
                    <div style={S("padding:40px 0; text-align:center; color:#8494A0; font-size:13px;")}>
                      {v.repAll.error ? `読み込みに失敗しました: ${v.repAll.error}` : "読み込み中…"}
                    </div>
                  ) : (
                  <>
                    <p style={S("margin:0 0 14px; font-size:12px; color:#8494A0; line-height:1.7;")}>
                      <strong style={S("color:#14181C;")}>{v.repAll.fyLabel}の全{v.repAll.total}事業</strong>が公表されています（サンプルではなく全量）。事業ごとに {v.repAll.holds} が載っています。
                      {v.repAll.has.estimate && <>決算額は評価年度のため<strong style={S("color:#14181C;")}>見込み</strong>です。</>}
                      {v.repAll.excluded > 0 && <>一般会計の事業のみを載せています（特別会計の{v.repAll.excluded}事業は除いています）。</>}
                      {/* 評価様式の説明は derive が資料ごとに書く（横浜の7軸の文面を他市へ使い回さない） */}
                      {v.repAll.evalNote && <>{v.repAll.evalNote}</>}
                    </p>

                    {/* 達成度の分布。**1が最良で5が最悪**＝甲府の A〜F と向きが逆なので必ず明示する。
                        **達成度を持たない資料（横浜）では出さない** — 見出しだけ残ると中身ゼロの箱になる */}
                    {v.repAll.has.achievement && (
                    <div style={S("background:#F7FAFC; border:1px solid #DFE7EC; border-radius:12px; padding:12px 14px; margin-bottom:14px;")}>
                      <div style={S("font-size:11.5px; color:#5C6B77; margin-bottom:8px;")}>達成度の内訳（<strong style={S("color:#14181C;")}>1 が最も良く、5 が最も悪い</strong>）</div>
                      <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
                        {v.repAll.dist.map((d: any) => (
                          <span key={d.k} style={S("display:inline-flex; align-items:baseline; gap:6px; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:999px; padding:4px 12px;")}>
                            <strong style={S("font-family:'IBM Plex Mono',monospace; font-size:12.5px; color:#0F76A3;")}>{d.k}</strong>
                            <span style={S("font-size:11.5px; color:#5C6B77;")}>{d.label}</span>
                            <strong style={S("font-family:'IBM Plex Mono',monospace; font-size:12px; color:#14181C;")}>{d.n}</strong>
                            <span style={S("font-size:10.5px; color:#9DACB7;")}>{d.pct}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    )}

                    <div style={S("display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:10px;")}>
                      <input
                        value={v.repAll.q}
                        onChange={(e) => v.repAll.setQ(e.target.value)}
                        placeholder="事業名・所属・政策・施策・事務事業コードで検索"
                        aria-label="事業を検索"
                        style={S("border:1px solid #C6D2DA; border-radius:999px; padding:7px 15px; font-size:13px; width:min(340px, 70vw); font-family:'IBM Plex Sans JP',sans-serif; color:#14181C; background:#FFFFFF;")}
                      />
                      <span style={S("font-size:12px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>
                        {v.repAll.hits === v.repAll.total ? `${v.repAll.total}件` : `${v.repAll.hits} / ${v.repAll.total}件`}
                        {v.repAll.hits > 0 && <span style={S("color:#8494A0;")}>（{v.repAll.from}–{v.repAll.to}）</span>}
                      </span>
                    </div>

                    {v.repAll.hits === 0 && (
                      <p style={S("padding:28px 0; text-align:center; color:#8494A0; font-size:13px;")}>「{v.repAll.q}」に一致する事業はありません。</p>
                    )}
                    {v.repAll.rows.map((r: any) => (
                      <div key={r.code} data-mq="rep" style={S("display:grid; grid-template-columns:1fr 92px 150px 110px; gap:12px; padding:11px 0; border-bottom:1px solid #ECF2F6; align-items:center;")}>
                        <span style={S("min-width:0;")}>
                          <a href={r.ref} onClick={(e) => { e.preventDefault(); r.open(); }} style={S("font-size:13px; font-weight:600; cursor:pointer;")}>{r.name}</a>
                          <span style={S("display:block; font-size:10.5px; color:#8494A0; margin-top:2px;")}>
                            <span style={S("font-family:'IBM Plex Mono',monospace;")}>{r.code}</span> ・ {r.buka}{r.measure && ` ・ ${r.measure}`}
                          </span>
                        </span>
                        <span>
                          {r.achievement != null && (
                            <span title={r.achievementLabel} style={S(
                              "display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:700; border-radius:999px; padding:2px 10px; " +
                              (r.achievement <= 2 ? "background:#E7F5EE; color:#0F7B4F; border:1px solid #BFE3D0;"
                                : r.achievement === 3 ? "background:#E8F4FA; color:#0F76A3; border:1px solid #BFE0EF;"
                                : "background:#FFF8F2; color:#8A4B1F; border:1px solid #EFD4BE;"),
                            )}>達成度 {r.achievement}</span>
                          )}
                          {/* 進捗の自己評価（北九州の4段階: 順調/概ね順調/やや遅れ/遅れ）。
                              achievement を持たない資料でのみ出す（同じ枠を使い回す） */}
                          {r.achievement == null && r.progress && (
                            <span style={S(
                              "display:inline-block; font-family:'IBM Plex Sans JP',sans-serif; font-size:12px; font-weight:700; border-radius:999px; padding:2px 10px; " +
                              (r.progress === "順調" ? "background:#E7F5EE; color:#0F7B4F; border:1px solid #BFE3D0;"
                                : r.progress === "概ね順調" ? "background:#E8F4FA; color:#0F76A3; border:1px solid #BFE0EF;"
                                : "background:#FFF8F2; color:#8A4B1F; border:1px solid #EFD4BE;"),
                            )}>{r.progress}</span>
                          )}
                        </span>
                        <span style={S("font-size:11.5px; color:#5C6B77;")} title={r.directionLabel}>
                          {r.direction && <><strong style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{r.direction}</strong> {r.directionLabel}</>}
                        </span>
                        <span style={S("text-align:right;")}>
                          {r.amount != null && (
                            <>
                              <span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; color:#14181C;")}>{v.repAll.fmt(r.amount)}</span>
                              <span style={S("display:block; font-size:10px; color:#9DACB7;")}>{r.amountKind}・{r.costLabel}</span>
                            </>
                          )}
                        </span>
                      </div>
                    ))}

                    {v.repAll.pages > 1 && (
                      <div style={S("display:flex; align-items:center; justify-content:center; gap:8px; margin-top:14px; flex-wrap:wrap;")}>
                        <button onClick={() => v.repAll.setPage(v.repAll.page - 1)} disabled={v.repAll.page <= 1}
                          style={S(`border:1px solid #C6D2DA; background:#FFFFFF; border-radius:999px; padding:5px 14px; font-size:12.5px; font-family:'IBM Plex Sans JP',sans-serif; ${v.repAll.page <= 1 ? "color:#C6D2DA; cursor:default;" : "color:#3A4750; cursor:pointer;"}`)}>← 前へ</button>
                        <span style={S("font-size:12.5px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>{v.repAll.page} / {v.repAll.pages}</span>
                        <button onClick={() => v.repAll.setPage(v.repAll.page + 1)} disabled={v.repAll.page >= v.repAll.pages}
                          style={S(`border:1px solid #C6D2DA; background:#FFFFFF; border-radius:999px; padding:5px 14px; font-size:12.5px; font-family:'IBM Plex Sans JP',sans-serif; ${v.repAll.page >= v.repAll.pages ? "color:#C6D2DA; cursor:default;" : "color:#3A4750; cursor:pointer;"}`)}>次へ →</button>
                      </div>
                    )}
                    {/* 総コストの説明は**総コストを持つ資料だけ**。横浜（事業費のみ）に出すと嘘になる。
                        ⚠ **算定式まで使い回さない** — 「1人当たり人件費 × 人工」は川崎の様式の記述で、
                        杉並は `常勤職員分(再任用含)` と `上記以外の職員` の2本（算定は未確認）。
                        文面は資料が持つもの（`costNote`）から出す（レビューの指摘・#163） */}
                    <p style={S("margin:12px 2px 0; font-size:11.5px; color:#8494A0; line-height:1.7;")}>事業名をクリックすると原本（{v.repAll.sourceTitle}）の該当ページを開きます。{v.repAll.costNote}</p>
                  </>
                  )}
                </section>
                )}

                {/* 事業報告（成果）＝事務事業評価 詳細票。full 専用（甲府）。予算→執行→成果を1事業で通す。
                    ヘッダの年度ドロップダウンに連動して1年度分だけ出し、事務事業はタブで切り替える。 */}
                {v.report && (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:22px 24px; margin:26px 0;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:6px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>事業報告（成果）</h2>
                    <span style={S("font-size:12px; color:#5C6B77;")}>事務事業評価 詳細票 — 予算→執行→成果を1事業で追える</span>
                  </div>
                  <p style={S("margin:0 0 14px; font-size:12px; color:#8494A0; line-height:1.7;")}>甲府市が詳細票を公表した事業のみ（各年数件）。事業費（決算→当初→計画）・トータルコスト（人件費込み）・成果指標の目標／実績・総合評価が載っています。全事業分は情報公開請求（未収録＝リクエスト）。</p>

                  <div style={S("display:flex; align-items:baseline; gap:10px; margin-bottom:10px; flex-wrap:wrap;")}>
                    <h3 style={S("margin:0; font-size:13.5px; font-weight:700; color:#14181C;")}>{v.report.fyLabel}評価<span style={S("font-weight:400; color:#5C6B77;")}>（対象 {v.report.targetFyLabel}実績）</span></h3>
                    <HoverBox as="button" onClick={v.report.sourceOpen} style={S("font-size:11.5px; border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:2px 11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>出典：詳細票（{v.report.sourceAction}）</HoverBox>
                  </div>
                  {/* 選択中の予算年度に評価が無く、最新の詳細票へフォールバックしたときだけ理由を出す */}
                  {v.report.fallbackNote && (
                    <p style={S("margin:0 0 12px; font-size:11.5px; color:#5C6B77; background:#F4F8FB; border:1px solid #DFE7EC; border-radius:8px; padding:7px 11px; line-height:1.7;")}>{v.report.fallbackNote}</p>
                  )}

                  {/* 事務事業タブ（1事業ずつ評価・実績を通して読ませる） */}
                  <div style={S("display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;")}>
                    {v.report.tabs.map((t: any, ti: number) => (
                      <HoverBox key={ti} as="button" onClick={t.pick} style={S(`display:inline-flex; align-items:center; gap:7px; border:1px solid ${t.active ? "#14181C" : "#DFE7EC"}; background:${t.active ? "#14181C" : "#FFFFFF"}; color:${t.active ? "#F7FAFC" : "#5C6B77"}; border-radius:999px; padding:6px 14px; font-size:12.5px; font-weight:${t.active ? "700" : "500"}; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={t.active ? S("") : S("border-color:#1798D0; color:#1798D0;")}>
                        {t.label}
                        <span style={S(`font-size:10px; font-weight:700; font-family:'IBM Plex Mono',monospace; border-radius:5px; padding:0 5px; color:${t.active ? "#F7FAFC" : "#0F76A3"}; border:1px solid ${t.active ? "#5C6B77" : "#B9E0F2"};`)}>{t.grade}</span>
                      </HoverBox>
                    ))}
                  </div>

                  <div data-reportcard style={S("background:#FBFDFE; border:1px solid #E3EBF0; border-radius:14px; padding:18px 20px;")}>
                    <div style={S("display:flex; align-items:flex-start; justify-content:space-between; gap:14px; flex-wrap:wrap; margin-bottom:4px;")}>
                      <div>
                        <div style={S("font-size:15.5px; font-weight:700; color:#14181C; line-height:1.4;")}>{v.report.item.name}</div>
                        <div style={S("font-size:11px; color:#8494A0; margin-top:3px;")}>{v.report.item.buka}{v.report.item.kubun ? ` ・ ${v.report.item.kubun}` : ""}</div>
                      </div>
                      {/* 総合評価: 記号だけでは伝わらないので 24点満点の点数とバーを併記する */}
                      <div style={S("flex-shrink:0; min-width:132px; border:1px solid #B9E0F2; background:#F4FAFD; border-radius:10px; padding:7px 11px;")}>
                        <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:8px;")}>
                          <span style={S("font-size:10px; color:#5C6B77;")}>総合評価</span>
                          <span style={S("font-size:16px; font-weight:700; color:#0F76A3; font-family:'IBM Plex Mono',monospace; line-height:1;")}>{v.report.item.grade}</span>
                        </div>
                        {v.report.item.score != null && (
                          <>
                            <div style={S("height:5px; border-radius:999px; background:#DDEBF3; overflow:hidden; margin:6px 0 3px;")}>
                              <span data-anim="bar" style={S(`display:block; height:100%; width:${v.report.item.scorePct}%; background:#1798D0;`)}></span>
                            </div>
                            <div style={S("font-size:10px; color:#5C6B77; font-family:'IBM Plex Mono',monospace; text-align:right;")}>{v.report.item.score} / 24点</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 事業実施結果（市がその年度に何をしたかの記述） */}
                    {v.report.item.impl && (
                      <div style={S("margin:12px 0 14px;")}>
                        <div style={S("font-size:10px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.1em; color:#8494A0; margin-bottom:4px;")}>事業実施結果（{v.report.targetFyLabel}）</div>
                        <p style={S("margin:0; font-size:12.5px; color:#14181C; line-height:1.9;")}>{v.report.item.impl}</p>
                      </div>
                    )}

                    {/* コスト経年（上=事業費／下=トータルコスト・人件費込み）。表示中の予算年度の列を強調 */}
                    <div style={S("display:flex; justify-content:space-between; font-size:9.5px; color:#8494A0; margin-bottom:3px;")}>
                      <span>事業費 <span style={S("color:#B0BCC6;")}>／ トータル（人件費込）</span></span>
                      <span>{v.unitLabel}</span>
                    </div>
                    <div data-yearstrip onScroll={(e) => syncYearStrips(e.currentTarget)} style={S("display:flex; gap:4px; margin-bottom:16px; overflow-x:auto;")}>
                      {v.report.item.cost.map((c: any, ci: number) => (
                        <div key={ci} style={S(`flex:1 0 64px; text-align:center; padding:6px 4px; border-radius:8px; background:${c.kindLabel === "決算" ? "#EEF5F9" : c.kindLabel === "当初" ? "#FFF6EC" : "#F4F6F8"}; border:${c.current ? "1.5px solid #1798D0" : "1.5px solid transparent"};`)}>
                          <div style={S(`font-size:9.5px; color:${c.current ? "#0F76A3" : "#8494A0"}; font-weight:${c.current ? "700" : "400"};`)}>{c.fy}・{c.kindLabel}</div>
                          <div style={S("font-size:12px; font-weight:600; color:#14181C; font-family:'IBM Plex Mono',monospace;")}>{c.jigyohiFmt}</div>
                          <div style={S("font-size:10px; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>{c.totalFmt}</div>
                        </div>
                      ))}
                    </div>

                    {/* 指標: コスト経年と同じ列割りで年度ごとの 実績／目標 を出す（どの年に届いたかが読める） */}
                    <div style={S("font-size:10px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.1em; color:#8494A0; margin-bottom:6px;")}>指標の目標と実績</div>
                    {v.report.item.indicators.map((ind: any, ii: number) => (
                      <div key={ii} style={S("margin-bottom:12px;")}>
                        <div style={S("font-size:11.5px; color:#5C6B77; margin-bottom:4px; line-height:1.6;")}>
                          <span style={S(`font-size:9.5px; font-weight:700; border-radius:5px; padding:0 5px; margin-right:5px; color:${ind.category === "成果指標" ? "#0F76A3" : "#5C6B77"}; border:1px solid ${ind.category === "成果指標" ? "#B9E0F2" : "#DFE7EC"};`)}>{ind.category === "成果指標" ? "成果" : "活動"}</span>{ind.name}
                        </div>
                        <div data-yearstrip onScroll={(e) => syncYearStrips(e.currentTarget)} style={S("display:flex; gap:4px; overflow-x:auto;")}>
                          {ind.years.map((y: any, yi: number) => (
                            <div key={yi} style={S(`flex:1 0 64px; text-align:center; padding:5px 4px; border-radius:8px; background:${y.pending ? "#F7F9FA" : "#FFFFFF"}; border:${y.current ? "1.5px solid #1798D0" : "1.5px solid #EEF3F6"};`)}>
                              <div style={S(`font-size:9.5px; color:${y.current ? "#0F76A3" : "#8494A0"}; font-weight:${y.current ? "700" : "400"};`)}>{y.fy}・{y.kindLabel}</div>
                              <div style={S(`font-size:12.5px; font-weight:600; font-family:'IBM Plex Mono',monospace; color:${y.pending ? "#B0BCC6" : y.over ? "#0F76A3" : "#14181C"};`)}>{y.actualFmt}</div>
                              <div style={S("height:4px; border-radius:999px; background:#EEF3F6; overflow:hidden; margin:3px 2px;")}>
                                {!y.pending && <span data-anim="bar" style={S(`display:block; height:100%; width:${y.barW}%; background:${y.over ? "#1798D0" : "#84A0B0"};`)}></span>}
                              </div>
                              <div style={S("font-size:9.5px; color:#8494A0; font-family:'IBM Plex Mono',monospace;")}>目標{y.targetFmt}</div>
                              <div style={S(`font-size:9.5px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:${y.pending ? "transparent" : y.over ? "#0F76A3" : "#5C6B77"};`)}>{y.pct != null ? `${y.pct}%` : "—"}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <p style={S("margin:10px 0 0; font-size:10.5px; color:#9DACB7; line-height:1.7;")}>実績は決算年度分のみ（当初・計画の年度は目標のみ）。{v.report.item.ref}</p>
                  </div>
                </section>
                )}

                {/* 表示年度に触れている詳細票が1件も無い年度。黙って消さずリクエスト導線にする */}
                {v.reportMissing && (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin:26px 0;")}>
                  <h2 style={S("margin:0 0 8px; font-size:16px; font-weight:700;")}>事業報告（成果）</h2>
                  <p style={S("margin:0 0 12px; font-size:12.5px; color:#5C6B77; line-height:1.7;")}>{v.reportMissing.note}</p>
                  <a href={v.reportMissing.requestUrl} target="_blank" rel="noopener noreferrer" style={S("display:inline-block; font-size:12.5px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:6px 16px; text-decoration:none;")}>この年度の詳細票の収録をリクエスト ↗</a>
                </section>
                )}

                {/* budget 階層の主な事業。山梨県は施策別グループ、款のない市は上位一覧 */}
                {v.isBudget && v.hasBudgetProjects && (
                <section style={S("margin-top:26px;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px; gap:12px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>{v.hasBudgetProjectGroups ? "主な事業（施策別）" : "主な事業（予算額上位）"}</h2>
                    <span style={S("font-size:11.5px; color:#9DACB7; font-family:'IBM Plex Mono',monospace;")}>{v.budgetProjectsCountLabel}</span>
                  </div>
                  {v.hasBudgetProjectGroups ? (
                    v.budgetProjectGroups.map((g: any, gi: number) => (
                      <div key={gi} style={S("margin-bottom:16px;")}>
                        <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:0 4px 6px;")}>
                          <span style={S("font-size:13.5px; font-weight:700; color:#1798D0;")}>《{g.shisaku}》</span>
                          <span style={S("font-size:11px; color:#9DACB7; font-family:'IBM Plex Mono',monospace; white-space:nowrap;")}>{g.count}事業 ・ {g.totalFmt}</span>
                        </div>
                        <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:2px 6px;")}>
                          {g.rows.map((p: any, i: number) => projRow(p, i))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:2px 6px;")}>
                      {v.budgetProjectRows.map((p: any, i: number) => projRow(p, i))}
                    </div>
                  )}
                  <p style={S("margin:10px 2px 0; font-size:12px; color:#5C6B77;")}>
                    <a href={v.budgetProjectsSourceUrl} onClick={(e) => { e.preventDefault(); v.budgetProjectsSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.budgetProjectsSourceLabel}（{v.budgetProjectsSourceAction}）</a>
                  </p>
                </section>
                )}

                {/* 性質別歳出（決算・総務省(4)）＋地方債現在高（(5)）。R6 のみ */}
                {v.isDecision && v.hasNature && (
                <section style={S("margin-bottom:26px;")}>
                  <div style={S("display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px;")}>
                    <h2 style={S("margin:0; font-size:16px; font-weight:700;")}>性質別の歳出（なにに使ったか・決算）</h2>
                    <span style={S("font-size:11.5px; color:#9DACB7; font-family:'IBM Plex Mono',monospace;")}>{v.natureFyLabel}</span>
                  </div>
                  <div style={S("display:grid; grid-template-columns:repeat(auto-fit, minmax(320px,1fr)); gap:18px;")}>
                    <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:16px 20px;")}>
                      {v.natureRows.map((r: any, i: number) => (
                        <div key={i} style={S("display:flex; align-items:center; gap:9px; padding:4px 0;")}>
                          <span style={S(`width:9px; height:9px; border-radius:2px; background:${r.sw}; flex-shrink:0;`)}></span>
                          <span style={S("flex:1; font-size:12.5px; color:#14181C;")}>{r.name}</span>
                          <span style={S("width:74px; height:6px; border-radius:999px; background:#EEF3F6; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${r.barW}%; background:${r.sw};`)}></span></span>
                          <span style={S("font-family:'IBM Plex Mono',monospace; font-size:12px; width:82px; text-align:right;")}>{r.amtFmt}</span>
                          <span style={S("font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:#5C6B77; width:44px; text-align:right;")}>{r.pctFmt}</span>
                        </div>
                      ))}
                      <p style={S("margin:8px 2px 0; font-size:11px; color:#9DACB7;")}>人件費・扶助費・普通建設事業費などの性質別内訳（総務省 決算状況調(4)）。</p>
                    </div>
                    <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:14px; padding:16px 20px; align-self:start;")}>
                      <div style={S("font-size:13px; font-weight:700; margin-bottom:10px;")}>地方債・基金の状況（決算末）</div>
                      {v.bondItems.map((b: any, i: number) => (
                        <div key={i} style={S(`display:flex; justify-content:space-between; gap:12px; padding:5px 0; ${b.strong ? "border-bottom:1px solid #EEF3F6;" : ""}`)}>
                          <span style={S(`font-size:12.5px; color:${b.strong ? "#14181C" : "#5C6B77"};`)}>{b.name}</span>
                          <span style={S(`font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:${b.strong ? "600" : "400"};`)}>{b.v}</span>
                        </div>
                      ))}
                      <p style={S("margin:8px 2px 0; font-size:11px; color:#9DACB7;")}>総務省 決算状況調(5)地方債。</p>
                    </div>
                  </div>
                </section>
                )}

                {/* 決算ベース（総務省・decision 階層）: 予算資料で得られる機能の案内＋リクエスト導線 */}
                {v.isDecision && (
                <section style={S("background:#F0F7FB; border:1px solid #CFE0EA; border-radius:14px; padding:18px 22px; margin-bottom:6px;")}>
                  <h2 style={S("margin:0 0 8px; font-size:15px; font-weight:700;")}>この自治体は総務省の決算データで収録しています</h2>
                  <p style={S("margin:0 0 12px; font-size:12.5px; color:#5C6B77; line-height:1.7;")}>
                    款別歳出（→項）・歳入科目（→内訳）・1人あたり・財政指標・類似自治体比較・決算の経年（R2〜R6）を確認できます。
                    当初予算・補正・主な事業・執行状況・事務事業評価などの<strong style={S("color:#14181C;")}>予算資料ベースの詳細は未収録</strong>です
                    {/* 収録済み自治体を並べ書きしない — 手書きの列挙は増えるたびにズレる。/coverage が実データから出す一覧へ誘導する */}
                    （収録済みの自治体は<a href="/coverage" onClick={(e) => { e.preventDefault(); v.goCoverage(); }} style={S("color:#0F76A3; cursor:pointer;")}>データ整備状況</a>を参照）。
                  </p>
                  {/* リクエストできるのは「まだ手を付けていない」ものだけ。**調べたうえで
                      収録できないと判定した団体では、リクエストの代わりに理由を出す** —
                      取れないと分かっているものを起票させるのは読者の手間を無駄にする
                      （/coverage が同じ理由でリクエスト先から外している）。
                      ⚠ **恒久の事実として書かない**（判定は実際にくつがえる）ので確認日を添える。 */}
                  {v.decisionRequestUrl ? (
                    <a href={v.decisionRequestUrl} target="_blank" rel="noopener noreferrer" style={S("display:inline-block; font-size:12.5px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:6px 16px; text-decoration:none;")}>この自治体の予算資料の収録をリクエスト ↗</a>
                  ) : (
                    <div style={S("background:#FFF8F2; border:1px solid #EFD4BE; border-radius:10px; padding:11px 14px;")}>
                      <div style={S("font-size:12.5px; font-weight:700; color:#8A4B1F; margin-bottom:4px;")}>当初予算は一次資料を調べたうえで収録できないと判定しています</div>
                      {v.decisionUnrec.map((u: any, i: number) => (
                        <p key={i} style={S("margin:0; font-size:11.5px; color:#5C6B77; line-height:1.8;")}>
                          <span style={S("font-family:'IBM Plex Mono',monospace; color:#8A4B1F;")}>{u.fyLabel}</span> — {u.reason}
                          <span style={S("font-family:'IBM Plex Mono',monospace; color:#8494A0; margin-left:6px;")}>（{u.checkedOn} 確認）</span>
                        </p>
                      ))}
                      <p style={S("margin:6px 0 0; font-size:11px; color:#8494A0; line-height:1.7;")}>これは確認日時点の実測であって、恒久的にできないという意味ではありません（資料が差し替わったり、抽出の手当てが増えれば収録できるようになります）。</p>
                    </div>
                  )}
                </section>
                )}

                {/* budget 階層（類似4市）: 当初予算のみ収録。事業・執行・評価は未収録 */}
                {v.isBudget && (
                <section style={S("background:#F0F7FB; border:1px solid #CFE0EA; border-radius:14px; padding:18px 22px; margin-bottom:6px;")}>
                  <h2 style={S("margin:0 0 8px; font-size:15px; font-weight:700;")}>{v.budgetPanelTitle}</h2>
                  <p style={S("margin:0 0 12px; font-size:12.5px; color:#5C6B77; line-height:1.7;")}>{v.budgetPanelBody}</p>
                  {/* 全機能収録済みならリクエストするものが無いのでチップを出さない */}
                  {v.budgetRequestUrl && (
                  <a href={v.budgetRequestUrl} target="_blank" rel="noopener noreferrer" style={S("display:inline-block; font-size:12.5px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:6px 16px; text-decoration:none;")}>{v.budgetRequestLabel}</a>
                  )}
                </section>
                )}

                <p style={S("margin:14px 2px 0; font-size:12px; color:#5C6B77;")}>
                  <a href={v.dashSourceUrl} onClick={(e) => { e.preventDefault(); v.dashSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.dashSourceLabel}（{v.dashSourceAction}）</a>
                  {/* 歳入・歳出が別ファイルの資料だけ、歳出側の補助リンク（#257） */}
                  {v.dashSourceExpUrl && (
                    <>
                      {" ／ "}
                      <a href={v.dashSourceExpUrl} onClick={(e) => { e.preventDefault(); v.dashSourceExpOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>歳出（{v.dashSourceExpAction}）</a>
                    </>
                  )}
                </p>
              </div>
            )}

            {/* ==== 款・項・目・節ドリルダウン ==== */}
            {v.isDrill && !v.loading && (
              <div data-screen-label="款・項・目・節ドリルダウン" style={S("animation:fadeUp .35s ease both;")}>
                <div style={S("display:flex; align-items:center; gap:8px; margin-bottom:18px; flex-wrap:wrap;")}>
                  <div style={S("display:inline-flex; border:1px solid #DFE7EC; border-radius:999px; overflow:hidden; background:#FFFFFF;")}>
                    {v.drillSideTabs.map((stb: any, i: number) => (
                      <button key={i} onClick={stb.pick} style={S(`border:none; background:${stb.bg}; color:${stb.fg}; padding:7px 18px; font-size:13px; font-weight:600; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}>{stb.label}</button>
                    ))}
                  </div>
                  <span style={S("display:inline-flex; align-items:center; gap:6px; font-size:12px; color:#5C6B77;")}>款を選ぶと内訳（歳入の合算グループ）や主な事業（歳出）を表示します
                    <button onMouseEnter={v.gKan} onClick={v.gKan} onMouseLeave={v.hideTip} style={S("width:17px; height:17px; border-radius:50%; border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; font-size:11px; line-height:1; cursor:help; padding:0; font-family:'IBM Plex Mono',monospace;")}>?</button>
                  </span>
                </div>

                <div style={S("display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:20px; font-size:14px;")}>
                  {v.drillCrumbs.map((c: any, i: number) => (
                    <React.Fragment key={i}>
                      <HoverBox as="button" onClick={c.jump} style={S(`border:none; background:${c.bg}; color:${c.fg}; font-weight:${c.fw}; border-radius:8px; padding:5px 12px; cursor:pointer; font-size:13.5px; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("color:#1798D0;")}>{c.label}</HoverBox>
                      <span style={S(`color:#C6D2DA; display:${c.sep};`)}>›</span>
                    </React.Fragment>
                  ))}
                  <span style={S("margin-left:auto; font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#5C6B77; background:#ECF2F6; border-radius:999px; padding:4px 12px;")}>この階層：{v.drillLevelLabel}</span>
                </div>

                <div style={S("display:flex; gap:24px; flex-wrap:wrap;")}>
                  <div style={S("flex:0 0 auto; display:flex; flex-direction:column; align-items:center; gap:14px;")}>
                    <div onMouseMove={v.drillTipMove} onClick={v.drillTipMove} onMouseLeave={v.hideTip} style={S(`width:220px; height:220px; border-radius:50%; background:${v.drillDonutBg}; position:relative; cursor:pointer;`)}>
                      <span data-anim="donutcover" style={S("position:absolute; inset:0; border-radius:50%; background:#F7FAFC; pointer-events:none;")}></span>
                      <div style={S("position:absolute; inset:44px; border-radius:50%; background:#F7FAFC; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;")}>
                        <span style={S("font-size:11px; color:#5C6B77; max-width:110px; line-height:1.4;")}>{v.drillTitle}</span>
                        <span style={S("font-family:'IBM Plex Mono',monospace; font-size:19px; font-weight:600;")}>{v.drillTotalFmt}</span>
                        <span style={S("font-size:10.5px; color:#5C6B77;")}>{v.drillSub}</span>
                      </div>
                    </div>
                    <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:12px; padding:12px 16px; max-width:240px;")}>
                      <div style={S("font-size:11px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.12em; color:#5C6B77; margin-bottom:5px;")}>EVIDENCE</div>
                      <div style={S("font-size:12.5px; line-height:1.6;")}>{v.drillEvidence}</div>
                      <a href={v.drillPdfUrl} onClick={(e) => { e.preventDefault(); (v.drillSourceOpen ?? v.dashSourceOpen)(); }} style={S("font-size:12px; cursor:pointer;")}>{v.drillEvidenceAction}</a>
                    </div>
                  </div>

                  <div style={S("flex:1; min-width:320px;")}>
                    {v.drillRows.map((r: any, i: number) => (
                      <HoverBox as="button" key={i} onClick={r.open} onMouseEnter={r.hoverOn} onMouseLeave={r.hoverOff} data-mq="drill" style={S(`width:100%; display:grid; grid-template-columns:14px minmax(120px,1.4fr) 2fr 92px 56px 20px; align-items:center; gap:12px; border:none; border-bottom:1px solid #E3EBF0; background:none; padding:12px 8px; cursor:${r.cursor}; text-align:left; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("background:#ECF2F6;")}>
                        <span style={S(`width:11px; height:11px; border-radius:3px; background:${r.sw};`)}></span>
                        <span style={S("font-size:14px; font-weight:600; color:#14181C;")}>{r.name}</span>
                        <span style={S("height:8px; border-radius:999px; background:#E3EBF0; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${r.barW}%; background:${r.sw};`)}></span></span>
                        <span style={S("text-align:right;")}><span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:13.5px;")}>{r.amtFmt}</span><span style={S("display:block; font-size:10px; color:#5C6B77;")}>{r.sub}</span></span>
                        <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#5C6B77; text-align:right;")}>{r.pctFmt}</span>
                        <span style={S("color:#9DACB7; font-size:14px;")}>{r.arrow}</span>
                      </HoverBox>
                    ))}

                    {v.hasOutturn && (
                      <div style={S("margin-top:8px;")}>
                        <h3 style={S("margin:0 0 4px; font-size:14px; font-weight:700;")}>項別の当初 → 最終（補正後）→ 決算（{v.outturnFyLabel}）</h3>
                        {v.outturnInitialNote && <p style={S("margin:0 0 8px; font-size:11.5px; color:#C25400;")}>※ {v.outturnInitialNote}</p>}
                        <div style={S("overflow-x:auto;")}>
                          <div style={S("min-width:560px;")}>
                            <div style={S("display:grid; grid-template-columns:minmax(140px,1.6fr) repeat(4, minmax(84px,1fr)); gap:10px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:6px;")}>
                              <span>項</span><span style={S("text-align:right;")}>当初予算</span><span style={S("text-align:right;")}>最終予算</span><span style={S("text-align:right;")}>決算</span><span style={S("text-align:right;")}>執行率</span>
                            </div>
                            {v.outturnRows.map((orw: any, i: number) => (
                              <div key={i} title={orw.ref} style={S("display:grid; grid-template-columns:minmax(140px,1.6fr) repeat(4, minmax(84px,1fr)); gap:10px; padding:9px 0; border-bottom:1px solid #ECF2F6; font-size:12.5px; align-items:center;")}>
                                <span style={S("font-weight:600; display:inline-flex; align-items:center; gap:7px;")}><span style={S(`width:9px; height:9px; border-radius:3px; background:${orw.sw};`)}></span>{orw.name}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{orw.initialFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{orw.finalFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{orw.settledFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right; font-weight:600;")}>{orw.execFmt}</span>
                              </div>
                            ))}
                            {v.outturnKan && (
                              <div style={S("display:grid; grid-template-columns:minmax(140px,1.6fr) repeat(4, minmax(84px,1fr)); gap:10px; padding:9px 0; font-size:12.5px; align-items:center; font-weight:700;")}>
                                <span>款計</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{v.outturnKan.initialFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{v.outturnKan.finalFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{v.outturnKan.settledFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{v.outturnKan.execFmt}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p style={S("margin:8px 2px 0; font-size:12px; color:#5C6B77;")}>
                          <a href={v.outturnSourceUrl} onClick={(e) => { e.preventDefault(); v.outturnSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.outturnSourceLabel}（{v.outturnSourceAction}）</a>
                        </p>
                      </div>
                    )}
                    {/* **款より下（項・目）の実データ**（#191）。決算の参考表示ではなく、
                        表示中の年度の当初予算そのもの。項をクリックすると目まで開く。 */}
                    {v.hasBudgetDetail && (
                      <div style={S("margin-top:8px;")}>
                        <h3 style={S("margin:0 0 4px; font-size:14px; font-weight:700;")}>項・目の内訳（{v.budgetDetailFyLabel}）</h3>
                        <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77;")}>
                          この款の予算を項・目まで分解しています（款計 {v.budgetDetailKanTotalFmt}）。項をクリックすると目の内訳が開きます。
                          {/* ⚠ 前年比を出す年度では、それが**原典の前年度列**であることを必ず添える（#192）。
                              原典は当年度の科目体系に組み替えた前年度額を載せており、前の年度の画面の額とは
                              一致しない項がある。断らずに出すと「どちらかが間違っている」と読まれる。 */}
                          {v.budgetDetailHasPrev && "前年比は原典の前年度額（当年度の科目に組み替えたもの）との比較です。"}
                        </p>
                        <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:11px; padding:6px 16px;")}>
                          {v.budgetDetailRows.map((r: any, i: number) => (
                            <details key={i} style={S("border-bottom:1px solid #ECF2F6;")}>
                              <summary data-mq={v.budgetDetailHasPrev ? "drilld" : "drill"} style={S(`display:grid; grid-template-columns:14px minmax(120px,1.4fr) 2fr 92px 56px ${v.budgetDetailHasPrev ? "62px " : ""}20px; align-items:center; gap:12px; padding:10px 0; cursor:pointer; list-style:none;`)}>
                                <span style={S(`width:11px; height:11px; border-radius:3px; background:${r.sw};`)}></span>
                                <span style={S("font-size:13.5px; font-weight:600; color:#14181C;")}>{r.name}</span>
                                <span style={S("height:8px; border-radius:999px; background:#E3EBF0; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${r.barW}%; background:${r.sw};`)}></span></span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; font-size:13px; text-align:right;")}>{r.amtFmt}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#5C6B77; text-align:right;")}>{r.pctFmt}</span>
                                {v.budgetDetailHasPrev && (
                                  <span title={`前年度 ${r.prevFmt}`} style={S(`font-family:'IBM Plex Mono',monospace; font-size:11.5px; text-align:right; color:${r.yoyFg};`)}>{r.yoyFmt}</span>
                                )}
                                <span style={S("font-size:11px; color:#8494A0;")}>▾</span>
                              </summary>
                              <div style={S("padding:2px 0 10px 26px;")}>
                                {r.moku.map((m: any, j: number) => (
                                  <div key={j} data-mq={v.budgetDetailHasPrev ? "drilldm" : undefined} style={S(`display:grid; grid-template-columns:minmax(120px,1.6fr) 92px 56px${v.budgetDetailHasPrev ? " 62px" : ""}; align-items:center; gap:12px; padding:5px 0;`)}>
                                    <span style={S("font-size:12.5px; color:#37454F;")}>{m.name}</span>
                                    <span style={S("font-family:'IBM Plex Mono',monospace; font-size:12px; text-align:right; color:#37454F;")}>{m.amtFmt}</span>
                                    <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#8494A0; text-align:right;")}>{m.pctFmt}</span>
                                    {v.budgetDetailHasPrev && (
                                      <span style={S(`font-family:'IBM Plex Mono',monospace; font-size:11px; text-align:right; color:${m.yoyFg};`)}>{m.yoyFmt}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          ))}
                        </div>
                        <p style={S("margin:8px 2px 0; font-size:12px; color:#5C6B77;")}>
                          <a href={v.budgetDetailSourceUrl} onClick={(e) => { e.preventDefault(); v.budgetDetailSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.budgetDetailSourceLabel}（{v.budgetDetailSourceAction}）</a>
                        </p>
                      </div>
                    )}
                    {!v.hasOutturn && v.hasR6Detail && (
                      <div style={S("margin-top:8px;")}>
                        <h3 style={S("margin:0 0 4px; font-size:14px; font-weight:700;")}>項別の内訳（{v.r6DetailFyLabel}）</h3>
                        <p style={S("margin:0 0 10px; font-size:12px; color:#5C6B77;")}>{v.compCurLabel}予算の項別内訳は原典未公開のため、直近の決算値を参考として表示しています。決算計 {v.r6DetailKanTotalFmt}。<a href={v.r6DetailRequestUrl} target="_blank" rel="noopener noreferrer" style={S("margin-left:8px; font-size:11px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:2px 10px; text-decoration:none; white-space:nowrap;")}>この年度の項別内訳をリクエスト ↗</a></p>
                        <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:11px; padding:6px 16px;")}>
                          {v.r6DetailRows.map((r: any, i: number) => (
                            <div key={i} data-mq="drill" style={S("display:grid; grid-template-columns:14px minmax(120px,1.4fr) 2fr 92px 56px 20px; align-items:center; gap:12px; border-bottom:1px solid #ECF2F6; padding:10px 0;")}>
                              <span style={S(`width:11px; height:11px; border-radius:3px; background:${r.sw};`)}></span>
                              <span style={S("font-size:13.5px; font-weight:600; color:#14181C;")}>{r.name}</span>
                              <span style={S("height:8px; border-radius:999px; background:#E3EBF0; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${r.barW}%; background:${r.sw};`)}></span></span>
                              <span style={S("font-family:'IBM Plex Mono',monospace; font-size:13px; text-align:right;")}>{r.amtFmt}</span>
                              <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#5C6B77; text-align:right;")}>{r.pctFmt}</span>
                              <span></span>
                            </div>
                          ))}
                        </div>
                        <p style={S("margin:8px 2px 0; font-size:12px; color:#5C6B77;")}>
                          <a href={v.r6DetailSourceUrl} onClick={(e) => { e.preventDefault(); v.r6DetailSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.r6DetailSourceLabel}（{v.r6DetailSourceAction}）</a>
                        </p>
                      </div>
                    )}

                    {/* ⚠ 項・目を収録した款でこれを出すと「未収録」と嘘をつく（#191 で実際に出た） */}
                    {v.drillNoChildrenNote && !v.hasRealProjects && !v.hasR6Detail && !v.hasBudgetDetail && (
                      <p style={S("margin:8px 2px 0; font-size:12.5px; color:#5C6B77;")}>この款の項・目・節の内訳は未収録です（予算書本編の収録後に追加予定）。</p>
                    )}

                    {/* 款ドリル →「この款の事業報告（成果）」。**款項目を持つ資料だけ**（横浜のみ）。
                        予算の款 → 事業 → 成果 が一本で繋がる唯一の場所。他市は局＝組織であって
                        款ではないので紐付けを諦めており、ダッシュボードの一覧で見せている。 */}
                    {v.drillReports && (
                      <div style={S("margin-top:24px;")}>
                        <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:8px;")}>
                          <h3 style={S("margin:0; font-size:14px; font-weight:700;")}>この款の事業と成果（{v.drillReports.fyLabel}）</h3>
                          <span style={S("font-size:11.5px; color:#8494A0;")}>{v.drillReports.docLabel}より・この款に <strong style={S("font-family:'IBM Plex Mono',monospace; color:#5C6B77;")}>{v.drillReports.total}</strong>事業（{v.drillReports.sortLabel}の大きい順に{v.drillReports.shown}件）</span>
                        </div>
                        {v.drillReports.rows.map((r: any, i: number) => (
                          <div key={i} data-mq="rep" style={S("display:grid; grid-template-columns:1fr 110px; gap:12px; padding:9px 0; border-bottom:1px solid #ECF2F6; align-items:center;")}>
                            <span style={S("min-width:0;")}>
                              <a href={r.ref} onClick={(e) => { e.preventDefault(); r.open(); }} style={S("font-size:13px; font-weight:600; cursor:pointer;")}>{r.name}</a>
                              <span style={S("display:block; font-size:10.5px; color:#8494A0; margin-top:2px;")}>
                                <span style={S("font-family:'IBM Plex Mono',monospace;")}>{r.measure}</span> ・ {r.buka}
                              </span>
                            </span>
                            <span style={S("text-align:right;")}>
                              <span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:700; color:#14181C;")}>{r.amtFmt}</span>
                              <span style={S("display:block; font-size:10px; color:#9DACB7;")}>{r.fyLabel}</span>
                            </span>
                          </div>
                        ))}
                        <p style={S("margin:9px 2px 0; font-size:11.5px; color:#8494A0; line-height:1.7;")}>
                          事業名をクリックすると原本の該当ページを開きます。この款の全事業はダッシュボードの「事業報告（成果）」で検索できます。
                        </p>
                      </div>
                    )}

                    {v.hasRealProjects && (
                      <div style={S("margin-top:24px;")}>
                        <h3 style={S("margin:0 0 10px; font-size:14px; font-weight:700;")}>この款の主な事業（予算資料より）</h3>
                        <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:11px; padding:12px 16px; margin-bottom:10px;")}>
                          <div style={S("display:flex; justify-content:space-between; gap:12px; font-size:12px; color:#5C6B77; margin-bottom:6px; flex-wrap:wrap;")}>
                            <span>事業単位のエビデンスあり <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C; font-weight:600;")}>{v.realProjectsCoveredFmt}</span>（款の {v.realProjectsCoveredPct}%）</span>
                            <span>事業掲載なし（詳細不明） <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.realProjectsUncoveredFmt}</span>{v.uncoveredRequestUrl && <a href={v.uncoveredRequestUrl} target="_blank" rel="noopener noreferrer" style={S("margin-left:10px; font-size:11px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:2px 10px; text-decoration:none; white-space:nowrap;")}>この内訳をリクエスト ↗</a>}</span>
                          </div>
                          <div style={S("display:flex; height:10px; border-radius:999px; overflow:hidden; background:#E3EBF0;")}>
                            <span data-anim="bar" style={S(`width:${v.realProjectsCoveredBarW}%; background:#1798D0;`)}></span>
                          </div>
                        </div>
                        <div style={S("display:flex; flex-direction:column; gap:8px;")}>
                          {v.realProjects.map((rp: any, i: number) => (
                            <div key={i} style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:11px; padding:12px 16px;")}>
                              <div style={S("display:flex; align-items:baseline; justify-content:space-between; gap:14px;")}>
                                <span style={S("display:inline-flex; align-items:center; gap:8px; min-width:0;")}>
                                  {rp.kubun && <span style={S(`font-size:10.5px; font-weight:700; border-radius:999px; padding:1px 9px; white-space:nowrap; color:${rp.kubun === "新規" ? "#0F76A3" : "#C25400"}; border:1px solid ${rp.kubun === "新規" ? "#B9E0F2" : "#EFD4BE"};`)}>{rp.kubun}</span>}
                                  <span style={S("font-size:14px; font-weight:600;")}>{rp.name}</span>{rp.evaluation && <span title={`事務事業評価 ${rp.evaluation.grade}（${rp.evaluation.fyLabel}・出典: ${rp.evaluation.sourceTitle} ${rp.evaluation.ref}）`} style={S("font-size:10.5px; font-weight:700; color:#5C6B77; border:1px solid #C6D2DA; border-radius:6px; padding:1px 7px; white-space:nowrap; font-family:'IBM Plex Mono',monospace;")}>評価 {rp.evaluation.grade}</span>}
                                </span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; font-size:13px; white-space:nowrap;")}>{rp.amountFmt}</span>
                              </div>
                              <div style={S("font-size:11.5px; color:#5C6B77; margin-top:4px; line-height:1.6;")}>{rp.desc}</div>
                              <div style={S("display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; font-size:11px; color:#5C6B77;")}>
                                {rp.goal && <span>基本目標: {rp.goal}</span>}
                                {rp.shisaku && <span>施策: {rp.shisaku}</span>}
                                <a href={rp.refUrl} onClick={(e) => { e.preventDefault(); rp.refOpen(); }} title={rp.refTitle} style={S("font-family:'IBM Plex Mono',monospace; color:#0F76A3; cursor:pointer;")}>{rp.refLabel}</a>
                                {rp.bookName && <span style={S("font-family:'IBM Plex Mono',monospace; color:#8494A0;")}>予算書名{rp.bookName}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p style={S("margin:10px 2px 0; font-size:12px; color:#5C6B77;")}>
                          <a href={v.realProjectsSourceUrl} onClick={(e) => { e.preventDefault(); v.realProjectsSourceOpen(); }} style={S("color:#5C6B77; cursor:pointer;")}>{v.realProjectsSourceLabel}（{v.realProjectsSourceAction}）</a>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ==== 前年比較 ==== */}
            {v.isCompare && !v.loading && (
              <div data-screen-label="予算の前年比較" style={S("animation:fadeUp .35s ease both;")}>
                <div style={S("display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:20px;")}>
                  <div>
                    <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>前年度との比較</h1>
                    <p style={S("margin:0; color:#5C6B77; font-size:13.5px;")}>{v.compPrevLabel} と {v.compCurLabel} の当初予算を款ごとに比較します（{v.compBasisNote}）。{v.compPrevNote &&<span style={S("display:block; font-size:11.5px; color:#9DACB7; margin-top:2px;")}>{v.compPrevNote}</span>}</p>
                  </div>
                  <div style={S("display:inline-flex; border:1px solid #DFE7EC; border-radius:999px; overflow:hidden; background:#FFFFFF;")}>
                    {v.compTabs.map((ct: any, i: number) => (
                      <button key={i} onClick={ct.pick} style={S(`border:none; background:${ct.bg}; color:${ct.fg}; padding:8px 20px; font-size:13px; font-weight:600; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}>{ct.label}</button>
                    ))}
                  </div>
                </div>

                <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:22px; display:flex; gap:34px; align-items:center; flex-wrap:wrap;")}>
                  <div><div style={S("font-size:12px; color:#5C6B77;")}>{v.compPrevLabel}</div><div style={S("font-family:'IBM Plex Mono',monospace; font-size:24px; font-weight:600; color:#5C6B77;")}>{v.compPrevTotal}</div></div>
                  <span style={S("color:#9DACB7; font-size:20px;")}>→</span>
                  <div><div style={S("font-size:12px; color:#5C6B77;")}>{v.compCurLabel}</div><div style={S("font-family:'IBM Plex Mono',monospace; font-size:28px; font-weight:600;")}>{v.compCurTotal}</div><div style={S("font-size:10.5px; color:#5C6B77;")}>{v.compSub}</div></div>
                  <div style={S("margin-left:auto; text-align:right;")}>
                    <div style={S(`font-family:'IBM Plex Mono',monospace; font-size:22px; font-weight:600; color:${v.compTotalFg};`)}>{v.compTotalDelta}</div>
                    <div style={S("font-size:12px; color:#5C6B77;")}>増減（{v.compTotalPct}）</div>
                  </div>
                </div>

                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px;")}>
                  <div style={S("display:flex; gap:16px; font-size:11.5px; color:#5C6B77; margin-bottom:12px;")}>
                    <span style={S("display:inline-flex; align-items:center; gap:5px;")}><span style={S("width:18px; height:7px; border-radius:999px; background:#C6D2DA;")}></span>{v.compPrevLabel}</span>
                    <span style={S("display:inline-flex; align-items:center; gap:5px;")}><span style={S("width:18px; height:7px; border-radius:999px; background:#0072B2;")}></span>{v.compCurLabel}</span>
                  </div>
                  <div data-mq="comp" style={S("display:grid; grid-template-columns:14px minmax(110px,1fr) 2.2fr 92px 92px 110px; gap:12px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:8px;")}>
                    <span></span><span>款</span><span></span><span style={S("text-align:right;")}>前年度</span><span style={S("text-align:right;")}>今年度</span><span style={S("text-align:right;")}>増減</span>
                  </div>
                  {v.compRows.map((cr: any, i: number) => (
                    <HoverBox as="button" key={i} onClick={cr.open} data-mq="comp" style={S(`width:100%; display:grid; grid-template-columns:14px minmax(110px,1fr) 2.2fr 92px 92px 110px; gap:12px; padding:12px 0; border:none; border-bottom:1px solid #ECF2F6; background:none; font-size:13px; align-items:center; cursor:pointer; text-align:left; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("background:#F1F6F9;")}>
                      <span style={S(`width:10px; height:10px; border-radius:3px; background:${cr.sw};`)}></span>
                      <span style={S("font-weight:600;")}>{cr.name}</span>
                      <span style={S("display:flex; flex-direction:column; gap:4px;")}>
                        <span style={S("display:block; height:7px; border-radius:999px; background:#ECF2F6; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${cr.prevW}%; background:#C6D2DA;`)}></span></span>
                        <span style={S("display:block; height:7px; border-radius:999px; background:#ECF2F6; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${cr.curW}%; background:${cr.sw};`)}></span></span>
                      </span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right; color:#5C6B77;")}>{cr.prevFmt}</span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{cr.curFmt}</span>
                      <span style={S(`font-family:'IBM Plex Mono',monospace; text-align:right; font-weight:600; color:${cr.deltaFg};`)}>{cr.deltaFmt}</span>
                    </HoverBox>
                  ))}
                  <p style={S("margin:12px 2px 0; font-size:12px; color:#5C6B77;")}>{v.compFootNote}</p>
                </section>
              </div>
            )}

            {/* ==== 政策テーマ ==== */}
            {v.isThemes && !v.loading && (
              <div data-screen-label="政策テーマ別ビュー" style={S("animation:fadeUp .35s ease both;")}>
                <section data-mq-pad="" style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:18px; padding:26px 30px; margin-bottom:24px;")}>
                  <div style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; letter-spacing:0.18em; color:#0F76A3; margin-bottom:10px;")}>POLICY THEMES — 総合計画の基本目標別に見る</div>
                  <p style={S("margin:0 0 14px; font-size:15px; line-height:1.9; max-width:76ch;")}>{v.themesIntro}</p>
                  <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
                    <a href={v.dashSourceUrl} onClick={(e) => { e.preventDefault(); v.dashSourceOpen(); }} style={S("font-size:12px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:4px 12px; text-decoration:none; cursor:pointer;")}>出典：{v.dashSourceTitle}（{v.dashSourceAction}）</a>
                  </div>
                </section>

                <p style={S("margin:0 0 14px; font-size:13px; color:#5C6B77;")}>基本目標は会計上の款・項とは別軸です。複数の基本目標を持つ事業は各目標に計上しています。</p>

                <div style={S("display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:10px; margin-bottom:28px;")}>
                  {v.themeCards.map((tc: any, i: number) => (
                    <HoverBox as="button" key={i} onClick={tc.open} style={S(`text-align:left; background:${tc.bg}; border:1.5px solid ${tc.bd}; border-radius:13px; padding:15px 16px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)} hoverStyle={S("border-color:#1798D0;")}>
                      <span style={S("display:block; font-size:14px; font-weight:700; margin-bottom:2px; color:#14181C;")}>{tc.name}</span>
                      <span style={S("display:block; font-size:11px; color:#5C6B77; margin-bottom:7px;")}>{tc.sub2}</span>
                      <span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:16px;")}>{tc.totalFmt}</span>
                      <span style={S("display:block; font-size:11.5px; color:#5C6B77;")}>{tc.count}事業 ・ {tc.sub}</span>
                    </HoverBox>
                  ))}
                </div>

                {v.hasTheme && (
                  <section data-mq-pad="" style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:18px; padding:26px 30px;")}>
                    <div style={S("display:flex; align-items:flex-start; justify-content:space-between; gap:18px; flex-wrap:wrap; margin-bottom:6px;")}>
                      <div>
                        <h2 style={S("margin:0 0 8px; font-size:22px; font-weight:700;")}>{v.themeName}</h2>
                        <p style={S("margin:0; color:#5C6B77; font-size:14px; max-width:64ch; line-height:1.8;")}>{v.themeIntent} <a href={v.themeRequestUrl} target="_blank" rel="noopener noreferrer" style={S("font-size:11px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:2px 10px; text-decoration:none; white-space:nowrap;")}>事業の執行実績・成果をリクエスト ↗</a></p>
                      </div>
                      <div style={S("text-align:right;")}>
                        <div style={S("font-family:'IBM Plex Mono',monospace; font-size:26px; font-weight:600;")}>{v.themeTotalFmt}</div>
                        <div style={S("font-size:12px; color:#5C6B77;")}>{v.themeCount}事業の予算合計 ・ 市民1人あたり <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C; font-weight:600;")}>{v.themePer}</span></div>
                      </div>
                    </div>

                    <div style={S("margin:18px 0 22px;")}>
                      <div style={S("font-size:12px; color:#5C6B77; margin-bottom:8px;")}>会計項目（款）別の内訳 — 政策テーマ ⇄ 款・項・目・節 は相互に集計できます</div>
                      <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
                        {v.themeKanChips.map((kc: any, i: number) => (
                          <HoverBox as="button" key={i} onClick={kc.open} style={S("display:inline-flex; align-items:center; gap:7px; border:1px solid #DFE7EC; background:#F7FAFC; border-radius:999px; padding:5px 13px; font-size:12.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>
                            <span style={S(`width:9px; height:9px; border-radius:3px; background:${kc.sw};`)}></span>{kc.name} <span style={S("font-family:'IBM Plex Mono',monospace;")}>{kc.amtFmt}</span>
                          </HoverBox>
                        ))}
                      </div>
                    </div>

                    <div style={S("display:flex; flex-direction:column; gap:9px;")}>
                      {v.themeProjects.map((tp: any, i: number) => (
                        <div key={i} data-mq="tproj" style={S("display:grid; grid-template-columns:minmax(200px,2fr) minmax(140px,1.2fr) 96px 110px; align-items:center; gap:14px; border:1px solid #E3EBF0; background:#F7FAFC; border-radius:12px; padding:14px 18px; text-align:left;")}>
                          <span>
                            <span style={S("display:flex; align-items:center; gap:8px;")}>
                              {tp.kubun && <span style={S(`font-size:10.5px; font-weight:700; border-radius:999px; padding:1px 9px; white-space:nowrap; color:${tp.kubun === "新規" ? "#0F76A3" : "#C25400"}; border:1px solid ${tp.kubun === "新規" ? "#B9E0F2" : "#EFD4BE"};`)}>{tp.kubun}</span>}
                              <span style={S("font-size:14.5px; font-weight:700; color:#14181C;")}>{tp.name}</span>{tp.evaluation && <span title={`事務事業評価 ${tp.evaluation.grade}（${tp.evaluation.fyLabel}・出典: ${tp.evaluation.sourceTitle} ${tp.evaluation.ref}）`} style={S("font-size:10.5px; font-weight:700; color:#5C6B77; border:1px solid #C6D2DA; border-radius:6px; padding:1px 7px; white-space:nowrap; font-family:'IBM Plex Mono',monospace;")}>評価 {tp.evaluation.grade}</span>}
                            </span>
                            <span style={S("display:block; font-size:11.5px; color:#5C6B77; margin-top:2px; line-height:1.6;")}>{tp.summary}</span>
                          </span>
                          <span style={S("font-size:11.5px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>{tp.kanPath}</span>
                          <span style={S("text-align:right;")}><span style={S("display:block; font-family:'IBM Plex Mono',monospace; font-size:13.5px;")}>{tp.budgetFmt}</span><span style={S("display:block; font-size:10px; color:#5C6B77;")}>{tp.sub}</span></span>
                          <span>
                            <span style={S("display:block; font-size:10.5px; color:#5C6B77;")}>施策</span>
                            <span style={S("display:block; font-size:11.5px; color:#14181C; line-height:1.5;")}>{tp.shisaku}</span>
                            <a href={tp.refUrl} onClick={(e) => { e.preventDefault(); tp.refOpen(); }} style={S("display:block; font-size:10px; color:#0F76A3; font-family:'IBM Plex Mono',monospace; margin-top:2px; cursor:pointer;")}>{tp.refLabel}</a>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ==== 予算執行状況（財政事情の公表） ==== */}
            {v.isExecution && !v.loading && (
              <div data-screen-label="予算執行状況" style={S("animation:fadeUp .35s ease both;")}>
                <div style={S("display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:20px;")}>
                  <div>
                    <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>予算執行状況</h1>
                    <p style={S("margin:0; color:#5C6B77; font-size:13.5px;")}>{v.execFyLabel} ・ 款ごとに「予算はこうでした → ここまで使われました」を確認できます。</p>
                  </div>
                  <div style={S("display:inline-flex; border:1px solid #DFE7EC; border-radius:999px; overflow:hidden; background:#FFFFFF;")}>
                    {v.execTabs.map((et: any, i: number) => (
                      <button key={i} onClick={et.pick} style={S(`border:none; background:${et.bg}; color:${et.fg}; padding:8px 20px; font-size:13px; font-weight:600; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}>{et.label}</button>
                    ))}
                  </div>
                </div>

                <div style={S("display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:18px;")}>
                  <span style={S("font-size:12px; color:#5C6B77;")}>年度</span>
                  <div style={S("display:inline-flex; border:1px solid #DFE7EC; border-radius:999px; overflow:hidden; background:#FFFFFF;")}>
                    {v.execYearTabs.map((yt: any, i: number) => (
                      <button key={i} onClick={yt.pick} style={S(`border:none; background:${yt.bg}; color:${yt.fg}; padding:6px 14px; font-size:12px; font-weight:600; cursor:pointer; font-family:'IBM Plex Mono',monospace;`)}>{yt.label}</button>
                    ))}
                  </div>
                  <span style={S("font-size:11.5px; color:#9DACB7;")}>{v.execGapNote}</span>
                </div>

                <div style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:22px; display:flex; align-items:center; gap:26px; flex-wrap:wrap;")}>
                  <div>
                    <div style={S("font-size:12px; color:#5C6B77;")}>一般会計 {v.execSideLabel}の{v.execRateLabel}</div>
                    <div style={S("font-family:'IBM Plex Mono',monospace; font-size:38px; font-weight:600; line-height:1.1;")}>{v.execOverallRate}</div>
                  </div>
                  <div style={S("flex:1; min-width:220px;")}>
                    <div style={S("height:12px; border-radius:999px; background:#E3EBF0; overflow:hidden;")}>
                      <div data-anim="bar" style={S(`height:100%; width:${v.execOverallBarW}%; background:linear-gradient(90deg,#1798D0,#55BBE4); border-radius:999px;`)}></div>
                    </div>
                    <div style={S("display:flex; justify-content:space-between; font-size:11.5px; color:#5C6B77; margin-top:6px;")}>
                      <span>予算現額 <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.execBudgetFmt}</span></span>
                      <span>{v.execSettledColLabel} <span style={S("font-family:'IBM Plex Mono',monospace; color:#14181C;")}>{v.execSettledFmt}</span></span>
                    </div>
                  </div>
                </div>

                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:22px;")}>
                  <div data-mq="hist" style={S("display:grid; grid-template-columns:minmax(110px,1fr) 2fr 100px 100px 64px 90px; gap:12px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:8px;")}>
                    <span>款</span><span>{v.execRateLabel}</span><span style={S("text-align:right;")}>予算現額</span><span style={S("text-align:right;")}>{v.execSettledColLabel}</span><span style={S("text-align:right;")}>率</span><span style={S("text-align:right;")}>残額</span>
                  </div>
                  {v.execRows.map((hr: any, i: number) => (
                    <div key={i} data-mq="hist" title={hr.breakdownNote ? `${hr.ref}\n内訳（予算現額）: ${hr.breakdownNote}` : hr.ref} style={S("display:grid; grid-template-columns:minmax(110px,1fr) 2fr 100px 100px 64px 90px; gap:12px; padding:12px 0; border-bottom:1px solid #ECF2F6; font-size:13px; align-items:center;")}>
                      <span style={S("font-weight:600; display:inline-flex; align-items:center; gap:8px;")}><span style={S(`width:10px; height:10px; border-radius:3px; background:${hr.sw};`)}></span>{hr.name}</span>
                      <span style={S("display:block; height:8px; border-radius:999px; background:#E3EBF0; overflow:hidden;")}><span data-anim="bar" style={S(`display:block; height:100%; width:${hr.barW}%; background:${hr.sw};`)}></span></span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{hr.budgetFmt}</span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{hr.settledFmt}</span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right; font-weight:600;")}>{hr.rateFmt}</span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right; color:#5C6B77;")}>{hr.restFmt}</span>
                    </div>
                  ))}
                  <p style={S("margin:12px 2px 0; font-size:12px; color:#5C6B77;")}>{v.execAsOfNote}。残額＝予算現額−{v.execSettledColLabel}。</p>
                </section>

                {v.showTrend && (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:22px;")}>
                  <h2 style={S("margin:0 0 4px; font-size:16px; font-weight:700;")}>決算の推移（普通会計・令和2〜6年度）</h2>
                  <p style={S("margin:0 0 16px; font-size:12.5px; color:#5C6B77;")}>総務省「市町村別決算状況調」による確定決算の経年推移です。</p>
                  <div style={S("display:flex; align-items:stretch; gap:12px; height:170px; max-width:560px;")}>
                    {v.trendBars.map((tb: any, i: number) => (
                      <div key={i} style={S("flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:5px;")}>
                        <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#3A4750;")}>{tb.amtFmt}</span>
                        <div style={S("width:100%; max-width:52px; height:110px; display:flex; align-items:flex-end; justify-content:center;")}>
                          <div data-anim="vbar" title={tb.ref} style={S(`width:100%; height:${tb.h}%; background:${tb.bg}; border-radius:6px 6px 0 0;`)}></div>
                        </div>
                        <a href={tb.landingUrl} target="_blank" rel="noopener noreferrer" style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77;")}>{tb.label}</a>
                      </div>
                    ))}
                  </div>
                  <div style={S("margin-top:18px; overflow-x:auto;")}>
                    <div style={S("display:grid; grid-template-columns:minmax(120px,1.4fr) repeat(5, minmax(72px,1fr)); gap:10px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:7px; min-width:520px;")}>
                      <span>指標</span>
                      {v.trendYearLabels.map((y: string, i: number) => (<span key={i} style={S("text-align:right; font-family:'IBM Plex Mono',monospace;")}>{y}</span>))}
                    </div>
                    {v.trendIndicators.map((ti: any, i: number) => (
                      <div key={i} style={S("display:grid; grid-template-columns:minmax(120px,1.4fr) repeat(5, minmax(72px,1fr)); gap:10px; padding:9px 0; border-bottom:1px solid #ECF2F6; font-size:12.5px; align-items:center; min-width:520px;")}>
                        <span style={S("font-weight:600;")}>{ti.name}</span>
                        {ti.vals.map((val: string, j: number) => (<span key={j} style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{val}</span>))}
                      </div>
                    ))}
                  </div>
                  <p style={S("margin:10px 2px 0; font-size:12px; color:#5C6B77;")}>
                    <a href={v.trendSourceUrl} target="_blank" rel="noopener noreferrer" style={S("color:#5C6B77;")}>出典：総務省「市町村別決算状況調」各年度（年度ラベルから各年度ページへ） ↗</a>
                  </p>
                </section>
                )}

                {v.showEvidence && (
                  <section>
                    <h3 style={S("margin:0 0 12px; font-size:14px; font-weight:700;")}>エビデンス（一次資料）</h3>
                    <div style={S("display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:12px;")}>
                      {v.execEvidence.map((he: any, i: number) => (
                        <HoverBox as="a" key={i} href={he.href} onClick={(e: any) => { e.preventDefault(); he.open(); }} style={S("display:block; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:13px; overflow:hidden; text-decoration:none; color:#14181C; cursor:pointer;")} hoverStyle={S("border-color:#1798D0; text-decoration:none;")}>
                          <span style={S("display:flex; align-items:center; justify-content:center; height:96px; background:repeating-linear-gradient(45deg,#ECF2F6 0 10px,#E1EAF0 10px 20px); font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77; text-align:center; padding:0 14px; line-height:1.5;")}>{he.thumb}</span>
                          <span style={S("display:block; padding:12px 15px;")}>
                            <span style={S("display:inline-block; font-size:10.5px; font-weight:600; color:#1798D0; border:1px solid #B9E0F2; border-radius:999px; padding:1px 9px; margin-bottom:6px;")}>{he.type}</span>
                            <span style={S("display:block; font-size:13px; font-weight:600; line-height:1.5;")}>{he.title}</span>
                            <span style={S("display:block; font-size:11px; color:#5C6B77; margin-top:3px; font-family:'IBM Plex Mono',monospace;")}>{he.source}</span>
                          </span>
                        </HoverBox>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ==== 類似自治体との比較 ==== */}
            {v.isSimilar && !v.loading && (
              <div data-screen-label="類似自治体との比較" style={S("animation:fadeUp .35s ease both;")}>
                <div style={S("margin-bottom:20px;")}>
                  <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>類似自治体との比較</h1>
                  <p style={S("margin:0; color:#5C6B77; font-size:13.5px;")}>まず「何で比べるか」を選ぶと、その軸で近い自治体を全国から提案します。比較相手は検索して自由に足し引きできます（{v.simFyLabel}の実データ）。</p>
                </div>

                {v.simLoading && (
                  <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:16px; font-size:13px; color:#5C6B77;")}>全国の決算データを読み込んでいます…</section>
                )}
                {v.simError && (
                  <section style={S("background:#FFF7F0; border:1px solid #F0C9A6; border-radius:16px; padding:20px 24px; margin-bottom:16px; font-size:13px; color:#8A4B00;")}>{v.simError}</section>
                )}
                {v.simMissing && (
                  <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:16px; font-size:13px; color:#5C6B77;")}>この自治体は決算資料の款別歳出が総額と一致せず、比較できる断面を作れていないため未収録です。</section>
                )}

                {v.simReady && (
                  <>
                    {/* 比較軸 → 比較相手 の順で選ぶ */}
                    <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:18px 24px 20px; margin-bottom:12px;")}>
                      <div style={S("font-size:11px; color:#5C6B77; margin-bottom:9px;")}>① 何で比べるか（比較軸）</div>
                      <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
                        {v.simAxes.map((a: any) => (
                          <HoverBox
                            as="button"
                            key={a.key}
                            onClick={a.select}
                            aria-pressed={a.active}
                            style={S(`border:1.5px solid ${a.active ? "#1798D0" : "#C6D2DA"}; background:${a.active ? "#E3F4FC" : "#FFFFFF"}; color:${a.active ? "#0F76A3" : "#5C6B77"}; font-weight:${a.active ? "700" : "500"}; border-radius:999px; padding:6px 15px; font-size:12.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}
                            hoverStyle={S("border-color:#1798D0; color:#0F76A3;")}
                          >{a.label}</HoverBox>
                        ))}
                      </div>
                      <p style={S("margin:10px 2px 0; font-size:12px; color:#5C6B77;")}>{v.simPoolLabel}{v.simAxisDesc}に提案しています。</p>
                    </section>

                    <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:18px 24px 20px; margin-bottom:16px;")}>
                      <div style={S("display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:9px;")}>
                        <div style={S("font-size:11px; color:#5C6B77;")}>② 誰と比べるか（クリックで表に出し入れ）</div>
                        {v.simCustom && (
                          <HoverBox as="button" onClick={v.simReset} style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:4px 12px; font-size:11.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>提案の4団体に戻す</HoverBox>
                        )}
                      </div>
                      <div style={S("display:flex; gap:8px; flex-wrap:wrap;")}>
                        {v.simSuggest.map((sg: any) => (
                          <HoverBox
                            as="button"
                            key={sg.code}
                            onClick={sg.toggle}
                            aria-pressed={sg.selected}
                            style={S(`display:inline-flex; align-items:center; gap:7px; border:1.5px solid ${sg.selected ? "#1798D0" : "#C6D2DA"}; background:${sg.selected ? "#E3F4FC" : "#FFFFFF"}; color:#14181C; border-radius:999px; padding:5px 13px; font-size:12.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;`)}
                            hoverStyle={S("border-color:#1798D0;")}
                          >
                            <span style={S(`color:${sg.selected ? "#0F76A3" : "#9DACB7"}; font-weight:700;`)}>{sg.selected ? "✓" : "＋"}</span>
                            {/* 同名の市区町村（府中市・北区…）があるので県名まで出す */}
                            <span style={S("font-size:11px; color:#5C6B77;")}>{sg.pref}</span>
                            <span style={S(`font-weight:${sg.selected ? "700" : "500"};`)}>{sg.name}</span>
                            <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77;")}>{sg.axisVal}</span>
                          </HoverBox>
                        ))}
                      </div>
                      <div style={S("margin-top:14px;")}>
                        <input
                          value={v.simQ}
                          onChange={(e) => v.setSimQ(e.target.value)}
                          placeholder="全国の市区町村を名前で検索して足す"
                          aria-label="比較相手を検索"
                          style={S("border:1px solid #C6D2DA; border-radius:999px; padding:7px 15px; font-size:13px; width:min(320px, 70vw); font-family:'IBM Plex Sans JP',sans-serif; color:#14181C; background:#FFFFFF;")}
                        />
                        {v.simQ && (
                          <div style={S("display:flex; gap:8px; flex-wrap:wrap; margin-top:10px;")}>
                            {v.simResults.length === 0 && <span style={S("font-size:12px; color:#5C6B77;")}>該当する自治体がありません。</span>}
                            {v.simResults.map((r: any) => (
                              <HoverBox as="button" key={r.code} onClick={r.add} style={S("display:inline-flex; align-items:center; gap:7px; border:1px solid #C6D2DA; background:#FFFFFF; color:#14181C; border-radius:999px; padding:5px 13px; font-size:12.5px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0;")}>
                                <span style={S("color:#9DACB7; font-weight:700;")}>＋</span>
                                <span>{r.pref}{r.name}</span>
                                <span style={S("font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77;")}>{r.axisVal}</span>
                                {r.crossFamily && <span style={S("font-size:10.5px; color:#8A4B00; background:#FFF3E6; border-radius:999px; padding:1px 7px;")}>{r.crossFamily}</span>}
                              </HoverBox>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>

                    <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-bottom:16px;")}>
                      <div data-mq="sim-h" style={S("display:grid; grid-template-columns:minmax(120px,1.2fr) 80px 100px 110px 2fr; gap:12px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:8px;")}>
                        <span>自治体</span><span style={S("text-align:right;")}>人口</span><span style={S("text-align:right;")}>一般会計</span><span style={S("text-align:right;")}>1人あたり歳出</span><span>歳出構成（ホバー／タップで内訳）</span>
                      </div>
                      {v.similarRows.map((sr: any) => (
                        <div key={sr.key} data-mq="sim" style={S(`display:grid; grid-template-columns:minmax(120px,1.2fr) 80px 100px 110px 2fr; gap:12px; padding:12px 8px; border-bottom:1px solid #ECF2F6; font-size:13px; align-items:center; background:${sr.bg}; border-radius:8px;`)}>
                          <span style={S("display:flex; flex-direction:column; gap:2px; min-width:0;")}>
                            <span style={S("display:inline-flex; align-items:center; gap:8px; flex-wrap:wrap;")}>
                              {sr.sub && <span style={S("font-size:11px; color:#5C6B77;")}>{sr.sub}</span>}
                              {sr.clickable ? (
                                <HoverBox as="button" onClick={sr.open} style={S(`border:none; background:none; padding:0; font-size:13px; font-weight:${sr.fw}; color:#14181C; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif; text-align:left;`)} hoverStyle={S("color:#1798D0;")}>{sr.name} →</HoverBox>
                              ) : (
                                <span style={S(`font-weight:${sr.fw};`)}>{sr.name}</span>
                              )}
                              {sr.badge && <span style={S("font-size:10.5px; color:#0F76A3; font-weight:700;")}>{sr.badge}</span>}
                              {sr.remove && (
                                <HoverBox as="button" onClick={sr.remove} aria-label={`${sr.name}を比較から外す`} style={S("border:1px solid #DFE7EC; background:#FFFFFF; color:#9DACB7; border-radius:999px; width:18px; height:18px; line-height:1; padding:0; font-size:11px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#C25400; color:#C25400;")}>×</HoverBox>
                              )}
                            </span>
                            {sr.axisVal && <span style={S("font-family:'IBM Plex Mono',monospace; font-size:10.5px; color:#5C6B77;")}>{sr.axisVal}</span>}
                            <span title={sr.ref} style={S("font-family:'IBM Plex Mono',monospace; font-size:10px; color:#8494A0; font-weight:400;")}>{sr.refLabel}</span>
                          </span>
                          <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{sr.pop}</span>
                          <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right;")}>{sr.totalFmt}</span>
                          <span style={S("font-family:'IBM Plex Mono',monospace; text-align:right; font-weight:600;")}>{sr.perCap}</span>
                          <span style={S("display:flex; height:16px; border-radius:999px; overflow:hidden; background:#ECF2F6;")}>
                            {sr.segs.map((sg: any, j: number) => (
                              <span key={j} data-anim="bar" onMouseMove={sg.tipMove} onClick={sg.tipMove} onMouseLeave={v.hideTip} style={S(`width:${sg.w}%; background:${sg.sw}; cursor:pointer;`)}></span>
                            ))}
                          </span>
                        </div>
                      ))}
                      <div style={S("display:flex; gap:14px; flex-wrap:wrap; margin-top:12px; font-size:11.5px; color:#5C6B77;")}>
                        {v.simLegend.map((sl: any, i: number) => (
                          <span key={i} style={S("display:inline-flex; align-items:center; gap:5px;")}><span style={S(`width:10px; height:10px; border-radius:3px; background:${sl.sw};`)}></span>{sl.name}</span>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                <section style={S("margin-bottom:16px;")}>
                  <h3 style={S("margin:0 0 12px; font-size:14px; font-weight:700;")}>エビデンス（一次資料）</h3>
                  <div style={S("display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:12px;")}>
                    {v.similarEvidence.map((ev: any, i: number) => (
                      <HoverBox as="a" key={i} href={ev.href} onClick={(e: any) => { e.preventDefault(); ev.open(); }} style={S("display:block; background:#FFFFFF; border:1px solid #DFE7EC; border-radius:13px; overflow:hidden; text-decoration:none; color:#14181C;")} hoverStyle={S("border-color:#1798D0; text-decoration:none;")}>
                        <span style={S("display:flex; align-items:center; justify-content:center; height:110px; background:repeating-linear-gradient(45deg,#ECF2F6 0 10px,#E1EAF0 10px 20px); font-family:'IBM Plex Mono',monospace; font-size:11px; color:#5C6B77; text-align:center; padding:0 14px; line-height:1.5;")}>{ev.thumb}</span>
                        <span style={S("display:block; padding:12px 15px;")}>
                          <span style={S("display:inline-block; font-size:10.5px; font-weight:600; color:#1798D0; border:1px solid #B9E0F2; border-radius:999px; padding:1px 9px; margin-bottom:6px;")}>{ev.type}</span>
                          <span style={S("display:block; font-size:13px; font-weight:600; line-height:1.5;")}>{ev.title}</span>
                          <span style={S("display:block; font-size:11px; color:#5C6B77; margin-top:3px; font-family:'IBM Plex Mono',monospace;")}>{ev.source}</span>
                        </span>
                      </HoverBox>
                    ))}
                  </div>
                </section>

                <div style={S("display:flex; gap:6px; flex-wrap:wrap;")}>
                  <span style={S("font-size:11.5px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:3px 11px;")}>出典：令和6年度 市町村別決算状況調（総務省）</span>
                  <span style={S("font-size:11.5px; border:1px solid #C6D2DA; color:#5C6B77; border-radius:999px; padding:3px 11px;")}>地方財政状況調査（決算統計）</span>
                </div>
                <p style={S("margin:12px 2px 0; font-size:12px; color:#5C6B77;")}>1人あたり歳出が高い＝非効率とは限りません。面積・高齢化率・保有施設などの条件が異なります。軸はこの資料で公表されている値だけを使っており、産業構造や地理条件は含みません。</p>
              </div>
            )}

            {/* ==== データ出典・更新日 ==== */}
            {v.isSources && !v.loading && (
              <div data-screen-label="データ出典・更新日" style={S("animation:fadeUp .35s ease both;")}>
                {/* 戻り先は来た経路に合わせる。自治体のダッシュボードから来たなら
                    そこへ、/sources を直接開いたならトップへ（戻る先が無いのに
                    「ダッシュボードへ戻る」と言うと、行ったことのない甲府市へ飛ぶ） */}
                {v.isGlobalSources ? (
                  <HoverBox as="button" onClick={v.goTop} style={S("border:none; background:none; color:#5C6B77; font-size:13px; cursor:pointer; padding:0; margin-bottom:14px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>← トップへ戻る</HoverBox>
                ) : (
                  <HoverBox as="button" onClick={v.goDash} style={S("border:none; background:none; color:#5C6B77; font-size:13px; cursor:pointer; padding:0; margin-bottom:14px; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("color:#1798D0;")}>← ダッシュボードへ戻る</HoverBox>
                )}
                <div style={S("margin-bottom:14px;")}>
                  <h1 style={S("margin:0 0 6px; font-size:24px; font-weight:700;")}>データ出典・更新日</h1>
                  <p style={S("margin:0; color:#5C6B77; font-size:13.5px; line-height:1.8; max-width:78ch;")}>このサイトで使用している<strong style={S("color:#14181C;")}>一次資料の全件</strong>と最終確認日の一覧です。すべての数値はこれらの資料まで遡れます。レジストリと魚拓台帳から自動生成しているため、資料を追加すればここにも必ず現れます。</p>
                </div>
                {!v.src.ready ? (
                  <div style={S("padding:60px 0; text-align:center; color:#8494A0; font-size:13px;")}>
                    {v.src.error ? `読み込みに失敗しました: ${v.src.error}` : "読み込み中…"}
                  </div>
                ) : (
                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px;")}>
                  {/* 検索。97件（今後も増える）を1画面に流し込まず、絞ってから読ませる */}
                  <div style={S("display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px;")}>
                    <input
                      value={v.src.q}
                      onChange={(e) => v.src.setQ(e.target.value)}
                      placeholder="資料名・発行元・年度・使用箇所で検索"
                      aria-label="一次資料を検索"
                      style={S("border:1px solid #C6D2DA; border-radius:999px; padding:7px 15px; font-size:13px; width:min(340px, 70vw); font-family:'IBM Plex Sans JP',sans-serif; color:#14181C; background:#FFFFFF;")}
                    />
                    <span style={S("font-size:12px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>
                      {v.src.hits === v.src.total ? `${v.src.total}件` : `${v.src.hits} / ${v.src.total}件`}
                      {v.src.hits > 0 && <span style={S("color:#8494A0;")}>（{v.src.from}–{v.src.to} を表示）</span>}
                    </span>
                  </div>
                  <div data-mq="src" style={S("display:grid; grid-template-columns:minmax(200px,2fr) 70px minmax(140px,1.4fr) 100px minmax(160px,1.6fr); gap:12px; font-size:11px; color:#5C6B77; border-bottom:1px solid #DFE7EC; padding-bottom:8px;")}>
                    <span>資料名</span><span>種別</span><span>発行元</span><span>最終確認日</span><span>使用箇所</span>
                  </div>
                  {v.src.hits === 0 && (
                    <p style={S("padding:28px 0; text-align:center; color:#8494A0; font-size:13px;")}>「{v.src.q}」に一致する資料はありません。</p>
                  )}
                  {v.src.rows.map((src: any) => (
                    <div key={src.sourceId} data-mq="src" style={S("display:grid; grid-template-columns:minmax(200px,2fr) 70px minmax(140px,1.4fr) 100px minmax(160px,1.6fr); gap:12px; padding:11px 0; border-bottom:1px solid #ECF2F6; font-size:13px; align-items:center;")}>
                      <span style={S("display:flex; flex-direction:column; gap:2px;")}>
                        {src.open ? (
                          <a href={src.href} onClick={(e) => { e.preventDefault(); src.open(); }} style={S("font-weight:600; cursor:pointer;")}>{src.title}（{src.action}）</a>
                        ) : (
                          <a href={src.originUrl} target="_blank" rel="noopener noreferrer" style={S("font-weight:600;")}>{src.title} ↗</a>
                        )}
                        <span style={S("display:flex; gap:8px; flex-wrap:wrap; align-items:center;")}>
                          {src.originUrl && (
                            <a href={src.originUrl} target="_blank" rel="noopener noreferrer" style={S("font-size:11px; color:#5C6B77; text-decoration:none;")}>発行元 ↗</a>
                          )}
                          {src.archiveUrl && (
                            <a href={src.archiveUrl} target="_blank" rel="noopener noreferrer" style={S("font-size:11px; color:#5C6B77; text-decoration:none;")}>魚拓 ↗</a>
                          )}
                          {src.licenseClass === "permission-required" && (
                            <span style={S("font-size:10px; color:#8A4B1F; border:1px solid #EFD4BE; border-radius:999px; padding:0 7px;")}>要許可</span>
                          )}
                        </span>
                      </span>
                      <span><span style={S("display:inline-block; font-size:10.5px; font-weight:600; color:#0F76A3; border:1px solid #B9E0F2; border-radius:999px; padding:1px 9px;")}>{src.type}</span></span>
                      <span style={S("font-size:12.5px; color:#5C6B77;")}>{src.org}<span style={S("color:#9DACB7; font-family:'IBM Plex Mono',monospace; font-size:11px; margin-left:5px;")}>{src.fy}</span></span>
                      <span style={S("font-family:'IBM Plex Mono',monospace; font-size:12px;")}>{src.date}</span>
                      <span style={S("font-size:12px; color:#5C6B77;")}>{src.used}</span>
                    </div>
                  ))}
                  {/* ページング */}
                  {v.src.pages > 1 && (
                    <div style={S("display:flex; align-items:center; justify-content:center; gap:8px; margin-top:14px; flex-wrap:wrap;")}>
                      <button onClick={() => v.src.setPage(v.src.page - 1)} disabled={v.src.page <= 1}
                        style={S(`border:1px solid #C6D2DA; background:#FFFFFF; border-radius:999px; padding:5px 14px; font-size:12.5px; font-family:'IBM Plex Sans JP',sans-serif; ${v.src.page <= 1 ? "color:#C6D2DA; cursor:default;" : "color:#3A4750; cursor:pointer;"}`)}>← 前へ</button>
                      <span style={S("font-size:12.5px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>{v.src.page} / {v.src.pages}</span>
                      <button onClick={() => v.src.setPage(v.src.page + 1)} disabled={v.src.page >= v.src.pages}
                        style={S(`border:1px solid #C6D2DA; background:#FFFFFF; border-radius:999px; padding:5px 14px; font-size:12.5px; font-family:'IBM Plex Sans JP',sans-serif; ${v.src.page >= v.src.pages ? "color:#C6D2DA; cursor:default;" : "color:#3A4750; cursor:pointer;"}`)}>次へ →</button>
                    </div>
                  )}
                  <p style={S("margin:12px 2px 0; font-size:12px; color:#5C6B77; line-height:1.8;")}>資料名をクリックすると<strong style={S("color:#14181C;")}>収録時点の原本コピー</strong>をその場で開きます（発行元の直リンクは中身だけ差し替えられ得るため、主リンクにしていません）。発行元の元ページと Wayback Machine の魚拓は補助リンクです。ただし<strong style={S("color:#8A4B1F;")}>「要許可」の資料はコピーを開かず、発行元（消えている資料は魚拓）へ直接つなぎます</strong>。原本はリポジトリにもアーカイブされ、取得時の SHA-256 ハッシュで来歴を検証できます。利用条件の区分は<button onClick={v.goCoverage} style={S("border:none; background:none; padding:0; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>データ整備状況</button>で全件公開しています。</p>
                </section>
                )}

                <section style={S("background:#FFFFFF; border:1px solid #DFE7EC; border-radius:16px; padding:20px 24px; margin-top:20px;")}>
                  <h2 style={S("margin:0 0 6px; font-size:16px; font-weight:700;")}>未収録の資料をリクエストする</h2>
                  <p style={S("margin:0 0 14px; font-size:12.5px; color:#5C6B77; line-height:1.8;")}>ウェブに公開されていない一次資料は、リクエストが貯まったものから情報公開請求などで取得し、検証つきで収録します。賛同は各リクエストの 👍 リアクションでお願いします。請求から収録までの経緯もすべて公開されます。</p>
                  {v.uncollected.map((u: any, i: number) => (
                    <div key={i} data-mq="src" style={S("display:flex; align-items:center; justify-content:space-between; gap:14px; padding:10px 0; border-bottom:1px solid #ECF2F6; font-size:13px; flex-wrap:wrap;")}>
                      <span style={S("min-width:0;")}>
                        <span style={S("display:block; font-weight:600;")}>{u.title}</span>
                        <span style={S("display:block; font-size:11.5px; color:#5C6B77; margin-top:1px;")}>{u.why}</span>
                      </span>
                      <a href={u.requestUrl} target="_blank" rel="noopener noreferrer" style={S("font-size:12px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:5px 14px; text-decoration:none; white-space:nowrap;")}>この資料をリクエスト ↗</a>
                    </div>
                  ))}
                  <p style={S("margin:12px 2px 0; font-size:11.5px; color:#9DACB7;")}>リクエスト一覧は <a href={v.requestListUrl} target="_blank" rel="noopener noreferrer" style={S("color:#5C6B77;")}>GitHub の「資料リクエスト」ラベル ↗</a> で確認できます。</p>
                </section>
              </div>
            )}

          </main>

          <footer data-mq-pad="" style={S("border-top:1px solid #DFE7EC; padding:16px 28px; font-size:12px; color:#5C6B77; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;")}>
            <span>予算トレース — プロトタイプ。掲載数値はすべて一次資料由来の実データです（補正・執行率は資料収録後に追加予定）。<button onClick={v.goSources} style={S("border:none; background:none; padding:0; margin-left:8px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>データ出典・更新日一覧 →</button><button onClick={v.goCoverage} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>データ整備状況・ライセンス →</button><button onClick={v.goRoadmap} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>進捗と計画 →</button><a href={v.privacyUrl} target="_blank" rel="noopener noreferrer" style={S("margin-left:12px; color:#1798D0; font-size:12px;")}>プライバシーポリシー ↗</a>{v.openCookiePrefs && <button onClick={v.openCookiePrefs} style={S("border:none; background:none; padding:0; margin-left:12px; color:#1798D0; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")}>Cookie 設定</button>}</span>
            <span style={S("font-family:'IBM Plex Mono',monospace;")}>{v.sourceLabel ? `SOURCE: ${v.sourceLabel}` : "v0.1 / 2026-07"}</span>
          </footer>
        </div>
      )}

      {/* ==== 一次資料ドロワー（自サーバー配信の原本コピーをその場でレビュー） ==== */}
      {v.viewer && (
        <div role="dialog" aria-modal="true" aria-label={`一次資料: ${v.viewer.title}`} style={S("position:fixed; inset:0; z-index:300;")}>
          <div onClick={v.closeViewer} style={S("position:absolute; inset:0; background:rgba(20,24,28,0.45);")} />
          <div data-anim="drawer" style={S("position:absolute; left:0; right:0; bottom:0; height:min(78vh, 100%); background:#FFFFFF; border-top:1px solid #DFE7EC; border-radius:16px 16px 0 0; display:flex; flex-direction:column; box-shadow:0 -14px 44px rgba(20,24,28,0.22); overflow:hidden;")}>
            <div data-mq-pad="" style={S("display:flex; align-items:center; justify-content:space-between; gap:14px; padding:12px 22px; border-bottom:1px solid #DFE7EC; flex-wrap:wrap;")}>
              <div style={S("min-width:0;")}>
                <div style={S("font-size:13.5px; font-weight:700; color:#14181C; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;")}>{v.viewer.title}</div>
                <div style={S("font-size:11px; color:#5C6B77; font-family:'IBM Plex Mono',monospace;")}>{v.viewer.sub} ・ 収録時アーカイブの原本コピー</div>
              </div>
              <div style={S("display:flex; align-items:center; gap:10px; flex-wrap:wrap; font-size:11.5px;")}>
                <a href={v.viewer.tabUrl} target="_blank" rel="noopener noreferrer" style={S("color:#0F76A3; text-decoration:none;")}>新しいタブで開く ↗</a>
                {/* ⚠ `archiveUrl` は「魚拓があればそれ・無ければ発行元 URL」というフォールバック値
                    （derive の `wayback()` が `ARCHIVES[url] ?? url` を返す）。**魚拓が無い資料では
                    発行元 URL がそのまま入る**ので、素で出すと「魚拓（Wayback）」というラベルの
                    リンクが発行元を指す（2026-07-25・北海道 R8 で発覚）。実際に魚拓の URL の
                    ときだけ出す。 */}
                {/(?:web\.archive\.org|warp\.ndl\.go\.jp)/.test(v.viewer.archiveUrl ?? "") && <a href={v.viewer.archiveUrl} target="_blank" rel="noopener noreferrer" style={S("color:#5C6B77; text-decoration:none;")}>魚拓（Wayback）↗</a>}
                {v.viewer.originUrl && <a href={v.viewer.originUrl} target="_blank" rel="noopener noreferrer" style={S("color:#5C6B77; text-decoration:none;")}>発行元 ↗</a>}
                <HoverBox as="button" onClick={v.closeViewer} aria-label="閉じる" style={S("border:1px solid #C6D2DA; background:#FFFFFF; color:#5C6B77; border-radius:999px; padding:5px 14px; font-size:12px; cursor:pointer; font-family:'IBM Plex Sans JP',sans-serif;")} hoverStyle={S("border-color:#1798D0; color:#1798D0;")}>閉じる ✕</HoverBox>
              </div>
            </div>
            {/\.pdf$/i.test(v.viewer.url) ? (
              <PdfViewer url={v.viewer.url} page={v.viewer.page} />
            ) : /\.html?$/i.test(v.viewer.url) ? (
              /* HTML の原本コピー。スクリプト禁止のサンドボックスで素の表組みを表示し、
                 最初の表へ自動スクロールする（HtmlViewer） */
              <HtmlViewer url={v.viewer.url} title={v.viewer.title} />
            ) : (
              <div style={S("flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; background:#ECF2F6; padding:24px; text-align:center;")}>
                <p style={S("margin:0; font-size:13.5px; color:#5C6B77; max-width:48ch; line-height:1.8;")}>この形式（Excel など）はブラウザでプレビューできません。収録時にアーカイブした原本のコピーをダウンロードして確認できます。</p>
                <a href={v.viewer.url} download style={S("font-size:13px; border:1px solid #1798D0; color:#0F76A3; border-radius:999px; padding:8px 20px; text-decoration:none; background:#FFFFFF;")}>原本のコピーをダウンロード ↓</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==== チャート近傍ツールチップ ==== */}
      {v.tipShow && (
        <div style={S(`position:fixed; left:${v.tipX}px; top:${v.tipY}px; transform:translate(-50%,-100%); background:#14181C; color:#F7FAFC; border-radius:9px; padding:8px 12px; font-size:12.5px; line-height:1.5; pointer-events:none; z-index:999; box-shadow:0 6px 18px rgba(20,24,28,0.25); white-space:nowrap;`)}>
          <span style={S(`display:flex; align-items:center; gap:7px; font-weight:700;`)}><span style={S(`width:9px; height:9px; border-radius:3px; background:${v.tipSw};`)}></span>{v.tipTitle}</span>
          <span style={S("display:block; font-family:'IBM Plex Mono',monospace;")}>{v.tipAmtLine}</span>
          <span style={S("display:block; max-width:270px; white-space:normal; font-weight:400; opacity:0.92; line-height:1.65;")}>{v.tipDesc}</span>
        </div>
      )}

    </div>
  );
}

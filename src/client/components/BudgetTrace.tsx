"use client";

import React from "react";
import { CountUpNum } from "./ui";
import * as D from "@/client/lib/data";
import { useDecisionData } from "@/client/hooks/useDecisionData";
import { useCoverage } from "@/client/hooks/useCoverage";
import { useProjectReports } from "@/client/hooks/useProjectReports";
import { useMuniBudgets } from "@/client/hooks/useMuniBudgets";
import { REPORT_MUNIS } from "@/client/lib/reports-index.gen";
// データの注意（validate の warning から derive が生成。手書きしない）
import { CAVEATS } from "@/client/lib/caveats.gen";
import { useSimilarIndex } from "@/client/hooks/useSimilarIndex";
import { stateToPath, locationToState, codeByPrefAndName, type RouteState } from "@/client/lib/routing";
// 進捗（実データから derive が算出）と計画（pipeline/registry/roadmap.ts が唯一の手書き）。
// 数KBなので静的 import でよい（882KB の coverage.json はフェッチしている）
import { ROADMAP_PROGRESS, ROADMAP_PLAN } from "@/client/lib/roadmap.gen";
// 「調べたが収録できない」判定。**/coverage だけが知っていても足りない** — 読者が実際に
// 歩くのは市区町村選択とダッシュボードで、そこで未着手の団体と同じ顔をしていた（14KB）
import { UNRECORDABLE_BY_CODE, UNRECORDABLE_WHOLLY } from "@/client/lib/unrecordable.gen";
import BudgetTraceView from "./BudgetTraceView";

// `sumOku`（億の float を素朴に足さない・#232）は `data.ts` の `fmtOku` の隣にある。
// ⚠ **`decision.ts` から引くとまだ循環する** — `data.ts` は `./decision` を import しているので、
//   `decision.ts` で使うなら `fyEraLabel` と同じように別ファイルへ切り出すこと（→ handoff §5 の `0j`）。
const sumOku = D.sumOku;

const {
  GLOSS, SIMILAR_EVIDENCE,
  KOFU_BUDGET_YEARS, KOFU_PROJECT_YEARS, KOFU_EXECUTION_YEARS, KOFU_EVALUATION_YEARS, KOFU_OUTTURN_YEARS, KOFU_R6_DETAIL, KOFU_TREND, KOFU_COUNCIL, KOFU_COUNCIL_YEARS, MUNI_COUNCIL_YEARS, KOFU_REPORT_YEARS,
  muniFromBudget, fmtOku, pctOf, fmtPerCap, fmtPop, fmtYen, fadeColor, donutBg, setPalette,
} = D;
type SimilarAxisKey = D.SimilarAxisKey;

/* eslint-disable @typescript-eslint/no-explicit-any */

interface St {
  screen: string;
  pref: string | null;
  muni: string | null;
  /** 選択自治体の団体コード（6桁）。full 階層=甲府は "192015"、decision 階層は各コード */
  muniCode?: string;
  drillSide: string;
  drillPath: string[];
  theme: string | null;
  searchQ: string;
  unit?: string;
  compSide?: string;
  execSide?: string;
  /** 予算執行状況タブの表示年度（"R7" など。未指定は最新） */
  execFy?: string;
  /** 表示中の当初予算年度（"R8" など。未指定は最新年度） */
  budgetFy?: string;
  /** 事業報告（成果）で開いている事務事業の番号（詳細票の No。未指定は先頭） */
  reportNo?: string;
  /** 類似自治体比較の比較軸（"pop" など。未指定は人口） */
  simAxis?: string;
  /** 類似自治体比較で表に載せている比較相手（団体コード）。未指定は軸のサジェスト上位 */
  simVs?: string[];
  /** 類似自治体比較の検索語（任意の自治体を比較相手に足す） */
  simQ?: string;
  /** データ整備状況の検索語 */
  covQ?: string;
  srcQ?: string;
  srcPage?: number;
  repQ?: string;
  repPage?: number;
  /** データ整備状況で展開中の都道府県 */
  covOpen?: string[];
  /** データ整備状況で資料を開いている自治体（団体コード） */
  covMuni?: string | null;
  /** 一次資料ドロワー（自サーバー配信の原本コピーをその場でレビュー） */
  viewer?: {
    /** 自サーバーのコピー URL（/sources/...。フラグメントなし） */
    url: string;
    /** 初期表示ページ（1-origin） */
    page: number;
    /** 「新しいタブで開く」用 URL（#page=N 付き） */
    tabUrl: string;
    title: string;
    /** 位置・来歴の補足（例: "主な事業一覧 p.17"） */
    sub: string;
    /** 発行元の元 URL（最新版に差し替わっている可能性あり） */
    originUrl: string;
    /** Wayback Machine のコピー */
    archiveUrl: string;
  } | null;
  tip?: any;
}

const DEFAULT_ST: St = {
  screen: "top", pref: null, muni: null,
  drillSide: "exp", drillPath: [], theme: null,
  searchQ: "", unit: "total", compSide: "exp", tip: null,
  simQ: "", covQ: "", covOpen: [], covMuni: null, srcQ: "", srcPage: 1, repQ: "", repPage: 1,
};

// 総合計画の基本目標（= 政策テーマ）。各年度の主な事業の basicGoal から集計する。
// R8〜は第七次総合計画（ひと/まち/魅力）。それ以前（第六次: 基本目標1〜4・
// 基本構想の推進）は事業データから動的に目標一覧を作る
const PLAN_BY_FY: Record<string, { plan: string; goals?: { name: string; label: string }[] }> = {
  R8: {
    plan: "第七次甲府市総合計画",
    goals: [
      { name: "ひと", label: "未来に輝く『ひと』を育む" },
      { name: "まち", label: "安全・安心で快適な『まち』を創る" },
      { name: "魅力", label: "都市機能と自然が調和する甲府の『魅力』を磨く" },
    ],
  },
  R7: { plan: "第六次甲府市総合計画" },
  R6: { plan: "第六次甲府市総合計画" },
  R5: { plan: "第六次甲府市総合計画" },
  R4: { plan: "第六次甲府市総合計画" },
  R3: { plan: "第六次甲府市総合計画" },
  R2: { plan: "第六次甲府市総合計画" },
};

export default function BudgetTrace({ initial, consentEnabled }: { initial?: Partial<St>; consentEnabled?: boolean } = {}) {
  // 初期 state はサーバ側でパスから解決済み（初回描画から正しい画面＝チラつき無し）
  const [st, setStRaw] = React.useState<St>({ ...DEFAULT_ST, ...(initial ?? {}) });
  const tipTimer = React.useRef<any>(null);

  const setSt = (patch: Partial<St>) => setStRaw((s) => ({ ...s, ...patch }));
  const nav = (patch: Partial<St>) => {
    setSt(patch);
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  };

  // --- URL 同期（ディープリンク） ---
  // 各画面をパスに反映し、共有・リロード・ブラウザバックに対応する。初期 state は
  // サーバ側（catch-all ルート）でパスから解決済みなので、マウント時の復元は不要
  // （＝共有リンクを開いても初回からその画面が出る／トップのチラつきが無い）。
  const patchFromLocation = (): Partial<St> => {
    const r = locationToState(location.pathname, location.search) as Partial<St>;
    return { ...r, viewer: null, tip: null };
  };
  const urlReady = React.useRef(false);
  const lastScreen = React.useRef(st.screen);
  React.useEffect(() => {
    // popstate（戻る/進む）でパスから state を復元する
    urlReady.current = true;
    const onPop = () => setStRaw((prev) => ({ ...prev, ...patchFromLocation() }));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  React.useEffect(() => {
    if (!urlReady.current) return;
    const url = stateToPath(st as RouteState);
    if (`${location.pathname}${location.search}` === url) return;
    // 画面遷移は履歴に積む（戻るで前の画面へ）。同一画面内の切替は置き換え
    if (st.screen !== lastScreen.current) history.pushState(null, "", url);
    else history.replaceState(null, "", url);
    lastScreen.current = st.screen;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.screen, st.pref, st.muni, st.muniCode, st.budgetFy, st.reportNo, st.drillSide, st.drillPath, st.theme, st.execFy, st.execSide, st.compSide, st.simAxis, st.simVs, st.unit]);

  // --- 一次資料ドロワー ---
  // 呼び出し側は #page=N 付き URL を渡してよい（ここで分離して PDF.js ビューアへ渡す）
  //
  // **発行元が二次利用を許諾していない資料（要許可）はドロワーで開かない** — 私たちの写しを
  // そのまま読ませることが再配布に当たるため、発行元（消えていて魚拓にしかない資料は魚拓）の
  // ディープリンクを新しいタブで開く。写し自体は来歴のために残してあり、/coverage で
  // 「何を持っているか」と利用条件は開示し続ける（ユーザー方針 2026-07-16）。
  // エビデンスを開く経路はすべてこの関数を通るので、判定はここ1か所に置く。
  const openViewer = (p: Omit<NonNullable<St["viewer"]>, "page" | "tabUrl">) => {
    const restricted = D.restrictedEvidence(p.url);
    if (restricted) {
      window.open(restricted.href, "_blank", "noopener,noreferrer");
      return;
    }
    const m = p.url.match(/^([^#]*)(?:#page=(\d+))?$/);
    setSt({ viewer: { ...p, url: m?.[1] ?? p.url, page: m?.[2] ? Number(m[2]) : 1, tabUrl: p.url } });
  };
  /** エビデンスの href（要許可なら発行元・魚拓の直リンク、それ以外は自サーバーのコピー） */
  const evHref = (localUrl: string) => D.evidenceHref(localUrl);
  /** エビデンスのリンク文言。要許可の資料に「原本を開く」と書かない */
  const evAction = (localUrl: string | null | undefined) => D.evidenceAction(localUrl);
  /**
   * 単独で立つエビデンスリンクの文言。**開くものと文言を一致させる**ための1か所。
   * コピーをドロワーで開くときだけ資料の種類（PDF/Excel…）を名乗り、要許可で発行元へ
   * 振り替える資料は「発行元の掲載ページを開く ↗」等に振り替える（2026-07-26）。
   */
  const evOpenLabel = (localUrl: string | null | undefined, noun: string) =>
    D.evidenceOpenLabel(localUrl, `${noun}${D.evidenceFormatLabel(localUrl) ? `（${D.evidenceFormatLabel(localUrl)}）` : ""}を開く`);
  const closeViewer = () => setSt({ viewer: null });
  const viewerOpen = !!st.viewer;
  React.useEffect(() => {
    if (!viewerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStRaw((s) => ({ ...s, viewer: null }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen]);

  // --- チャート近傍ツールチップ（ホバー／タップ） ---
  const showTip = (e: any, title: string, amt: string, pct: string, sw: string, desc?: string, hover?: any) => {
    setSt({ tip: { x: e.clientX, y: e.clientY - 12, title, amt, pct, sw, desc: desc || "", hover: hover || null } });
    clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setSt({ tip: null }), 3200);
  };
  const hideTip = () => { clearTimeout(tipTimer.current); setSt({ tip: null }); };
  const mkDonutTip = (items: any[], total: number, pop: number, key: string) => (e: any) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy), R = rect.width / 2;
    if (dist > R || dist < R * 0.58) { setSt({ tip: null }); return; }
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;
    let acc = 0, seg = items[items.length - 1], idx = items.length - 1;
    for (let i = 0; i < items.length; i++) {
      acc += (items[i].v / total) * 360;
      if (deg <= acc) { seg = items[i]; idx = i; break; }
    }
    showTip(e, seg.name, fmtOku(seg.v), pctOf(seg.v, total), D.seriesColor(idx),
      pop ? `1人あたり ${fmtPerCap(seg.v, pop)}` : "", key ? { key, idx } : null);
  };
  const mkSegTip = (title: string, amt: string, pct: string, sw: string, hover?: any) => (e: any) => showTip(e, title, amt, pct, sw, "", hover);
  const mkGloss = (term: string) => (e: any) => showTip(e, term, "", "", "#1798D0", GLOSS[term]);

  // ========================================================================
  // renderVals 相当
  // ========================================================================
  const s = st;
  const props = { colorMode: "カラフル", showEvidence: true };
  const showEvidence = props.showEvidence ?? true;
  const mapColorMode = props.colorMode ?? "カラフル";
  setPalette(mapColorMode);
  const screen = s.screen;
  const isApp = ["dash", "drill", "compare", "themes", "execution", "similar", "sources"].includes(screen);
  // データ整備状況は自治体スコープを持たない全体ページ（シャード取得も不要）
  const isCoverage = screen === "coverage";
  const isRoadmap = screen === "roadmap";
  const isSources = screen === "sources";
  // `/sources` は**自治体スコープを持つ形（/yamanashi/kofu/sources）と持たない形（/sources）の
  // 2つの URL がある**（routing.ts の stateToPath がそう振り分けている）。後者で来たときは
  // 全473資料を横断する全体ページなので、**甲府市の文脈（パンくず・年度セレクタ・タブ）を
  // 背負ってはいけない** — 直接開くと `日本 › 山梨県 › 甲府市` が出ていた（2026-07-29 修正）。
  // /coverage・/roadmap と同じく、素の「← トップへ戻る」だけにする。
  const isGlobalSources = isSources && !s.muni;
  // /coverage と /sources はどちらも「全資料の台帳」が要る。同じ coverage.json を共有する
  // （useCoverage はモジュールキャッシュを持つので、両方を見ても取得は1回）
  const { data: covData, loading: covLoading, error: covError } = useCoverage(isCoverage || isSources);

  // --- カバレッジ階層 ---
  // full = 甲府市（予算ベースの詳細: 主な事業・執行・評価・補正・前年当初比較）。
  // budget = 類似4市（当初予算の款別＋前年当初比較のみ・静的 gen）。
  // decision = 総務省 決算状況調ベース（全1,741市町村・県シャードを選択時に取得）。
  const prefName = s.pref || "山梨県";
  const prefCode = D.prefCodeOf(prefName);
  const muniCode = s.muniCode ?? null;
  const tier = D.tierOf(muniCode);
  const isFull = tier === "full";
  // シャードを取得する場面: 市区町村選択（グリッド描画）／ decision 自治体の閲覧
  const needShard = !!prefCode && (screen === "muni" || (isApp && tier === "decision"));
  const { shard, loading: shardLoading } = useDecisionData(needShard ? prefCode : null);
  const decisionView = React.useMemo(
    () =>
      isApp && tier === "decision" && shard && shard.prefCode === prefCode && muniCode
        ? D.buildDecisionView(shard, muniCode, s.budgetFy ?? "")
        : null,
    [isApp, tier, shard, prefCode, muniCode, s.budgetFy],
  );
  const isDecision = !!decisionView;
  // decision 自治体だがまだ表示できない（シャード取得待ち・名前解決前）
  const decisionPending = isApp && tier === "decision" && !decisionView;

  // 事業報告（成果）の全量公開シャード。**索引にある自治体をダッシュボードで見ているときだけ**取得する
  // （696KB。決算シャード・coverage.json と同じ方針）
  const reportMuni = isApp && muniCode && REPORT_MUNIS[muniCode] ? muniCode : null;
  const { data: repData, loading: repLoading, error: repError } = useProjectReports(reportMuni);

  // budget 階層（当初予算）。政令市は R2〜R8 の7年前後を収録しているので、full（甲府）と同じく
  // **年度ドロップダウンで切り替える**。1年度しか無い自治体は要素1つの配列。
  // ⚠ **本体は gen ではなく実行時フェッチ**（#216。決算シャードと同じ形）。名前・県名・収録年度は
  //   索引 `D.MUNI_BUDGET_INDEX` から同期で引けるが、金額は取得後にしか出せない。
  const budgetMuni = tier === "budget" && muniCode ? muniCode : null;
  const { years: muniBudgetYears } = useMuniBudgets(budgetMuni);
  const muniBudget = muniBudgetYears?.length
    ? muniBudgetYears.find((b) => b.fy === s.budgetFy) ?? muniBudgetYears[0]!
    : null;
  const isBudget = !!muniBudget;
  // 取得中（索引には居るのに本体がまだ無い）。decisionPending と同じ扱いでローディングを出す
  const budgetPending = !!budgetMuni && !muniBudget;
  // どちらかの取得待ち。⚠ この間 `data` は甲府（kofuData）へフォールバックしているので、
  // **自治体のデータを読む画面・ヘッダーはすべてこれで止める**（他の自治体の数値と出典を
  // 一瞬でも出さない。2026-09-25 修正）。全体ページの /sources は自治体を持たないので対象外
  const muniPending = !isGlobalSources && (decisionPending || budgetPending);
  // 都道府県エンティティ（県全体）か。市町村向けの機能（類似自治体比較・主な事業）は出さない。
  // **索引から引く** — 本体の取得を待たずに決まる（画面のゲートが取得中にちらつかない）
  const isPref = !!(budgetMuni && D.MUNI_BUDGET_INDEX[budgetMuni]?.isPref);
  // この都道府県の「県全体」エンティティ（市区町村選択の県全体ボタン用）
  const prefEntity = (() => {
    const hit = Object.entries(D.MUNI_BUDGET_INDEX).find(([, b]) => b.isPref && b.prefName === prefName);
    return hit ? { muniCode: hit[0], muniName: hit[1].muniName } : null;
  })();

  // 収録済み（full）の年度は当初予算の収録年度（R8〜R6・R3〜R2）から選択
  const budget = KOFU_BUDGET_YEARS.find((b) => b.fy === s.budgetFy) ?? KOFU_BUDGET_YEARS[0]!;
  // 議会の構成は「その予算を議決した議会」を表示年度に連動させる（無ければ最新へフォールバック）
  const councilForFy = KOFU_COUNCIL_YEARS.find((c) => c.fy === budget.fy) ?? KOFU_COUNCIL;
  // 甲府以外（budget 階層）の議会の構成。**表示年度と同じ年度の構成だけ**を出す — 甲府と違い
  // 最新へフォールバックしない（別の年度の議会を「その予算を議決した議会」として見せない）
  const shownCouncil: D.Council | null = isFull
    ? councilForFy
    : muniBudget && muniCode
      ? (MUNI_COUNCIL_YEARS[muniCode]?.find((c) => c.fy === muniBudget.fy) ?? null)
      : null;
  // 賛否は採決ごとの並びに揃える（ふつうは1つ。修正可決で採決が分かれる議会は voteParts の数だけ）
  const vparts: { part: string | null; basis: "member" | "faction"; unanimousText?: string; stances: string[]; tally: Record<string, number>; byFaction: { faction: string; counts: Record<string, number> }[]; source: D.Council["roster"] }[] =
    !shownCouncil ? [] : shownCouncil.votes ? [{ part: null, ...shownCouncil.votes }] : (shownCouncil.voteParts ?? []);
  const projYear = KOFU_PROJECT_YEARS.find((y) => y.fy === budget.fy);
  const KOFU_PROJECTS = React.useMemo(() => projYear?.projects ?? [], [projYear]);
  const KOFU_PROJECTS_SOURCE = projYear?.source ?? { title: "", url: "", originUrl: "", localUrl: "", pagesLabel: "" };
  const kofuData = React.useMemo(() => muniFromBudget(budget), [budget]);
  // 表示データ: decision=ビルダ出力 / budget=類似4市の当初予算 gen / full（甲府）=予算パース値
  const data: D.Municipality = decisionView
    ? {
        name: decisionView.name,
        total: decisionView.total,
        yoy: decisionView.yoy,
        year: decisionView.fyLabel,
        pop: decisionView.pop,
        revenue: decisionView.revenue,
        expenditure: decisionView.expenditure,
      }
    : muniBudget
      ? {
          name: muniBudget.muniName,
          total: muniBudget.totalOku,
          yoy: muniBudget.yoyLabel,
          year: muniBudget.fyLabel,
          pop: muniBudget.population,
          revenue: muniBudget.revenue,
          expenditure: muniBudget.expenditure,
        }
      : kofuData;
  // フッター右の SOURCE 表示。**表示中の自治体・階層の出典**を出す。
  // 以前は「甲府市 当初予算資料 R2–R8」を固定表示しており、横浜市を見ていても decision 階層の
  // 全1,741市町村を見ていても甲府の資料を出典として示していた（2026-07-15 修正）。
  // 資料は増えるので個別に列挙しない（トップのフッターと同じ方針）— 発行元と年度だけを出し、
  // 網羅的な収録状況は /coverage（実データから自動生成）へ誘導する。
  // 自治体スコープを持たない画面（/sources・/coverage）では出典が定まらないので出さない。
  const sourceLabel: string | null = isDecision
    ? `総務省 市町村別決算状況調 ${D.DECISION_YEARS[D.DECISION_YEARS.length - 1]}–${D.DECISION_YEARS[0]}`
    : isBudget
      ? `${muniBudget!.muniName} ${muniBudget!.fyLabel}`
      : isFull
        ? `甲府市 当初予算資料 ${KOFU_BUDGET_YEARS[KOFU_BUDGET_YEARS.length - 1]!.fy}–${KOFU_BUDGET_YEARS[0]!.fy}`
        : null;

  // 当初予算ベース（full＝甲府 or budget＝類似4市）。決算（decision）と対比
  const isPredose = isFull || isBudget;
  const goalProjects = (goal: string) => KOFU_PROJECTS.filter((p) => p.basicGoal.split("・").includes(goal));
  // 政策テーマの目標一覧（R8 はラベル付き定義、過年度は事業データから動的に）
  const planInfo = PLAN_BY_FY[budget.fy] ?? { plan: "甲府市総合計画" };
  const GOALS = React.useMemo(
    () =>
      planInfo.goals ??
      Array.from(new Set(KOFU_PROJECTS.flatMap((p) => p.basicGoal.split("・").filter(Boolean))))
        // 「基本目標1〜4」を先に、「基本構想の推進」等はその後ろに
        .sort((a, b) => {
          const num = (g: string) => (/^基本目標/.test(g) ? 0 : 1);
          return num(a) - num(b) || a.localeCompare(b, "ja");
        })
        // 見出しの名称が資料にある年度（R2・R3 の箇条書き形式）はラベルに使う
        .map((name) => ({
          name,
          label: KOFU_PROJECTS.find((p) => p.basicGoal === name && p.basicGoalLabel)?.basicGoalLabel ?? "",
        })),
    [planInfo.goals, KOFU_PROJECTS],
  );
  // 事務事業評価（同年度の評価を予算名 or 事業名の完全一致でだけ紐付ける — 曖昧マッチしない）
  const evalYear = KOFU_EVALUATION_YEARS.find((y) => y.fy === budget.fy);
  const evalFor = React.useMemo(() => {
    const byKey = new Map<string, { grade: string; ref: string; fyLabel: string; sourceTitle: string }>();
    for (const it of evalYear?.items ?? []) {
      const val = { grade: it.grade, ref: it.ref, fyLabel: evalYear!.fyLabel, sourceTitle: evalYear!.sourceTitle };
      if (it.budgetName) byKey.set(`b:${it.budgetName}`, val);
      byKey.set(`n:${it.name}`, val);
    }
    return (p: { name: string; budgetBookName: string | null }) =>
      (p.budgetBookName ? byKey.get(`b:${p.budgetBookName}`) : undefined) ??
      byKey.get(`n:${p.name}`) ??
      (p.budgetBookName ? byKey.get(`n:${p.budgetBookName}`) : undefined) ??
      null;
  }, [evalYear]);
  const accent = "#1798D0";

  // --- 表示単位（総額 / 1人あたり） ---
  const unit = s.unit || "total";
  const isPer = unit === "per";
  const fmtV = (oku: number) => (isPer ? fmtPerCap(oku, data.pop) + "/人" : fmtOku(oku));
  const subV = (oku: number) => (isPer ? "総額 " + fmtOku(oku) : fmtPerCap(oku, data.pop) + "/人");
  const unitTabs = [
    { label: "総額", pick: () => setSt({ unit: "total" }), bg: !isPer ? "#14181C" : "#FFFFFF", fg: !isPer ? "#F7FAFC" : "#5C6B77" },
    { label: "1人あたり", pick: () => setSt({ unit: "per" }), bg: isPer ? "#14181C" : "#FFFFFF", fg: isPer ? "#F7FAFC" : "#5C6B77" },
  ];

  const revItems = data.revenue;
  const expItems = data.expenditure;
  const totalNow = data.total; // 歳出（決算 or 予算）総額
  // 歳入・歳出それぞれの構成比の分母。予算（full）は均衡するので等しいが、
  // 決算（decision）は歳入決算 ≠ 歳出決算なので側ごとに分母を分ける
  // ⚠ **`sumOku` を使う**（#232・モジュール冒頭のコメント）。素朴に足すと
  //   「歳入と歳出は同額で編成されます」の直下に**1億円違う2つの数字**が出る
  //   （岡崎 R8 は歳入 1548.5 / 歳出 1548.4999999999998。表示で割れるのは**25年度**・
  //   **総額カードとの食い違いは32年度**で、どちらも直した後は0。2026-09-11 実測）。
  const revSum = sumOku(revItems.map((x: any) => x.v));
  const expSum = sumOku(expItems.map((x: any) => x.v));
  const yearLabel = data.year;

  const openMuni = (muniName: string, code: string) => () =>
    nav({ screen: "dash", muni: muniName, muniCode: code, drillPath: [], theme: null, budgetFy: undefined });

  // --- ホバー強調（強調セグメント以外を淡色化） ---
  const hoverFor = (key: string) => (s.tip && s.tip.hover && s.tip.hover.key === key ? s.tip.hover.idx : null);
  const hoverOnFn = (key: string, idx: number) => () => setSt({ tip: { hover: { key, idx } } });

  // --- muni select ---
  // シャード（総務省 決算・全1,741市町村）からその県の市町村一覧を作る。全県が
  // 最低でも decision（決算ベース）で閲覧可。甲府だけ full（予算ベースの詳細）。
  const muniEntries =
    shard && shard.prefCode === prefCode
      ? Object.entries(shard.munis).map(([code, m]) => ({ code, name: (m as { name: string }).name }))
      : [];
  // decision 自治体へパスで直接来た場合、団体コード（/nagano/202011）か名前（旧・日本語パス）の
  // 片方しか無い。県シャード取得後にもう片方を引き当てて state に補い、名前を画面に出せるようにする。
  React.useEffect(() => {
    if (!isApp || muniEntries.length === 0) return;
    if (!s.muniCode && s.muni) {
      const hit = muniEntries.find((e) => e.name === s.muni);
      if (hit) setSt({ muniCode: hit.code });
    } else if (s.muniCode && !s.muni) {
      const hit = muniEntries.find((e) => e.code === s.muniCode);
      if (hit) setSt({ muni: hit.name });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isApp, s.muniCode, s.muni, muniEntries.length]);
  // 「一次資料を調べたうえで収録できないと判定した」ものを引く。**「まだ手を付けていない」と
  // 読者にとって意味が全然違う**（/coverage の × と — の書き分けと同じ）ので、案内の文言と
  // リクエスト導線をここで分ける。1年度も収録できていないものだけが対象（一部年度のみ不可＝
  // /coverage の ○* は「収録済み」の案内のままで正しい）。
  const unrecOf = (code: string, dataset: string) =>
    (UNRECORDABLE_WHOLLY[code] ?? []).includes(dataset) ? UNRECORDABLE_BY_CODE[code]?.[dataset] ?? [] : [];
  // 記録は**確認日時点の実測**であって恒久の事実ではない（豊島 R4・大田 H27 は後から収録できた）
  const unrecTitle = (notes: { fyLabel: string; reason: string; checkedOn: string }[]) =>
    notes.map((u) => `【${u.fyLabel}】${u.reason}（${u.checkedOn} 確認）`).join("\n");
  // この都道府県の「県全体」の当初予算が収録不可と判定されているか（山形・兵庫・沖縄）。
  // **未収録の県には prefEntity が無い**ので、県エンティティのコードは県コード2桁から
  // JIS X 0402 の検査数字で組み立てる（derive の prefEntityCode と同じ定義）
  const prefUnrec = (() => {
    const pc = D.prefCodeOf(prefName);
    return pc ? unrecOf(D.muniCode6(`${pc}000`), "budget") : [];
  })();
  const muniList = muniEntries.map(({ code, name }) => {
    const t = D.tierOf(code);
    // decision 階層で当初予算が「調べたが収録できない」団体は、**未着手の団体と
    // 同じ「決算ベース（総務省）」に見えていた**（2026-07-29 修正）
    const unrec = t === "decision" ? unrecOf(code, "budget") : [];
    const badge =
      t === "full"
        ? `収録済 当初予算${KOFU_BUDGET_YEARS.length}年度分＋決算`
        : t === "budget"
          ? "当初予算＋決算（総務省）"
          : unrec.length > 0
            ? "決算のみ（予算は収録不可）"
            : "決算ベース（総務省）";
    const strong = t !== "decision";
    return {
      name,
      badge,
      badgeFg: strong ? accent : unrec.length > 0 ? "#8A4B1F" : "#4B95C4",
      bg: "#FFFFFF",
      bd: strong ? accent : unrec.length > 0 ? "#EFD4BE" : "#CFE0EA",
      fg: "#14181C",
      cursor: "pointer",
      // 理由と確認日は title で開示する（カードを厚くせず、知りたい人には届く）
      title: unrec.length > 0 ? `当初予算は調べたうえで収録できないと判定しています\n${unrecTitle(unrec)}` : "",
      open: openMuni(name, code),
      requestUrl: "", // 全市町村が閲覧可能なのでリクエスト不要
    };
  });
  const muniLoading = needShard && screen === "muni" && shardLoading && muniEntries.length === 0;
  // 都道府県レベルの予算（県全体）は未収録なのでリクエストへ。
  // ⚠ **調べたうえで収録できないと判定した県では出さない**（山形・兵庫・沖縄）—
  // 取れないと分かっているものを ToDo として起票させるのは読者の手間を無駄にする
  // （/coverage が同じ理由でリクエスト先から外している）。判定は下の prefUnrec で行う。
  const prefRequestUrl = D.buildRequestUrl(
    `${prefName}（都道府県）の予算・決算資料の収録`,
    `自治体リクエスト: ${prefName} の県全体（都道府県会計）を収録してほしい（市区町村選択画面より）`,
    prefName,
  );

  // --- dashboard panels ---
  const mkLegend = (items: any[], side: string, total: number) => {
    const hv = hoverFor(side);
    return items.map((it, i) => ({
      name: it.name, amtFmt: fmtV(it.v), pctFmt: pctOf(it.v, total),
      sw: hv == null || hv === i ? D.seriesColor(i) : fadeColor(D.seriesColor(i)),
      hoverOn: hoverOnFn(side, i), hoverOff: hideTip,
      open: () => nav({ screen: "drill", drillSide: side, drillPath: [it.name] }),
    }));
  };
  const dashPanels = [
    { title: "歳入（どこから来るお金か）", donutBg: donutBg(revItems, hoverFor("rev")), centerLabel: "歳入合計", centerAmt: <CountUpNum value={revSum} fmt={fmtV} />, legend: mkLegend(revItems, "rev", revSum), openDrill: () => nav({ screen: "drill", drillSide: "rev", drillPath: [] }), tipMove: mkDonutTip(revItems, revSum, data.pop, "rev"), gloss: mkGloss("歳入") },
    { title: "歳出（なにに使うお金か）", donutBg: donutBg(expItems, hoverFor("exp")), centerLabel: "歳出合計", centerAmt: <CountUpNum value={expSum} fmt={fmtV} />, legend: mkLegend(expItems, "exp", expSum), openDrill: () => nav({ screen: "drill", drillSide: "exp", drillPath: [] }), tipMove: mkDonutTip(expItems, expSum, data.pop, "exp"), gloss: mkGloss("歳出") },
  ];

  // --- 政策テーマ（総合計画の基本目標 × 83事業の実データ集計） ---
  const openTheme = (name: string) => () => nav({ screen: "themes", theme: name });
  const goalCards = GOALS.map((g) => {
    const ps = goalProjects(g.name);
    const total = sumOku(ps.map((p) => p.amountOku)); // #232（画面に出る額はすべて `sumOku`）
    return { goal: g, ps, total };
  });
  const themeStrip = goalCards.map(({ goal, ps, total }) => ({
    name: `『${goal.name}』`, sub2: goal.label,
    totalFmt: fmtV(total), sub: subV(total), count: String(ps.length), open: openTheme(goal.name),
  }));

  // --- 注目の事業（予算額上位・実データ）。full=甲府 / budget=類似市（muniBudget.projects）---
  const projectsForDisplay: {
    name: string; kan: string | null; kubun: string | null;
    amountOku: number; prevAmountOku?: number | null; description: string;
    shisaku?: string; refLabel?: string; refLocalUrl?: string;
  }[] = isBudget ? (muniBudget!.projects ?? []) : isFull ? KOFU_PROJECTS : [];
  const featured = [...projectsForDisplay]
    .sort((a, b) => b.amountOku - a.amountOku)
    .slice(0, 3)
    .map((p) => ({
      name: p.name, kanPath: p.kan ?? p.shisaku ?? "", kubun: p.kubun ?? "",
      budgetFmt: fmtV(p.amountOku), sub: subV(p.amountOku), desc: p.description,
    }));
  // 主な事業1行の描画用オブジェクト（一覧・施策グループで共用）
  const toProjRow = (p: (typeof projectsForDisplay)[number]) => ({
    name: p.name,
    kan: p.kan ?? "",
    kubun: p.kubun ?? "",
    amountFmt: fmtV(p.amountOku),
    sub: p.prevAmountOku != null ? `前年 ${fmtOku(p.prevAmountOku)}` : subV(p.amountOku),
    desc: p.description,
    refLabel: p.refLabel ?? "",
    refOpen: p.refLocalUrl
      ? () => openViewer({
          url: p.refLocalUrl!, title: muniBudget!.sourceTitle, sub: p.refLabel ?? "主な事業",
          originUrl: muniBudget!.originUrl, archiveUrl: muniBudget!.sourceUrl,
        })
      : () => {},
  });
  // budget 階層の「主な事業一覧」（款のない和泉も含め上位を一覧。full は款ドリル/テーマで見せる）
  // 主な事業の出典（款別と別資料のことがある）。事業の refLabel が資料名を含むときだけ使う
  const dashProjRef = (muniBudget?.projects ?? [])[0];
  const dashProjSrcName = (dashProjRef?.refLabel ?? "").replace(/\s*p\.\d+$/, "");
  const dashProjSrcUrl =
    dashProjSrcName.length > 8 && dashProjRef?.refLocalUrl ? dashProjRef.refLocalUrl : "";
  const budgetProjectRows = isBudget
    ? [...projectsForDisplay].sort((a, b) => b.amountOku - a.amountOku).slice(0, 20).map(toProjRow)
    : [];
  // 施策別グループ（山梨県＝中項目《…》別に全件）。資料の施策順を保ち、グループ内は金額降順。
  // 施策の無い市（和泉・山口）は空 → View は従来の一覧を出す
  const budgetProjectGroups =
    isBudget && projectsForDisplay.some((p) => p.shisaku)
      ? (() => {
          const order: string[] = [];
          const map = new Map<string, typeof projectsForDisplay>();
          for (const p of projectsForDisplay) {
            const key = p.shisaku || "その他";
            if (!map.has(key)) { map.set(key, []); order.push(key); }
            map.get(key)!.push(p);
          }
          return order.map((key) => {
            const rows = map.get(key)!;
            return {
              shisaku: key,
              count: rows.length,
              totalFmt: fmtV(sumOku(rows.map((p: any) => p.amountOku))), // #232
              rows: [...rows].sort((a, b) => b.amountOku - a.amountOku).map(toProjRow),
            };
          });
        })()
      : [];

  // --- drill（款 → 内訳/主な事業） ---
  const side = s.drillSide;
  const rootItems = side === "rev" ? revItems : expItems;
  let nodeItems: any[] = rootItems; let nodeTotal = side === "rev" ? revSum : expSum; let nodeName = side === "rev" ? "歳入合計" : "歳出合計";
  const pathNodes: any[] = [];
  s.drillPath.forEach((nm) => {
    const found = nodeItems.find((n) => n.name === nm);
    if (!found) return;
    pathNodes.push(found);
    nodeName = found.name; nodeTotal = found.v;
    nodeItems = found.children ?? [];
  });
  const depth = pathNodes.length;
  // 款は「実データの内訳・主な事業・R6決算の項内訳」のいずれかがあれば掘れる。
  // decision（総務省決算）は款→項の children を持つのでそれで判定する（full 専用の
  // 主な事業・R6決算内訳による掘り下げは甲府のみ）
  // ⚠ **detail を引く年度は「表示中の木の年度」**。`budget.fy` は**甲府の年度リストで解決される**ので、
  //   甲府に無い年度を持つ自治体では**木と違う年度の内訳**が出うる（`muniBudget` は自前の年度リストで
  //   解決し、無ければ最新へフォールバックする）。掘れるかの判定と描画の**両方が同じキーを使う**こと。
  const detailFy = muniBudget?.fy ?? budget.fy;
  // ⚠ **款項目（#191/#192）を持つ款も掘れる** — この判定は `children` の有無で見ているが、
  //   `BUDGET_DETAIL` は munibudgets の木とは別の gen なので `children` が付かない。
  //   教えないと、**画面には項・目パネルが出るのに、そこへ入る導線が無い**（レビューの3巡目で発覚。
  //   「その他」に畳まれた歳入17款が URL 直打ちでしか見えなかった）。
  //   「その他」の子も款なので、**depth 0 と「その他」直下の depth 1** の両方で見る。
  const detailKansHere: Record<string, unknown> | null = (() => {
    if (depth !== 0 && !(depth === 1 && nodeName === "その他")) return null;
    const e = (muniCode ? D.BUDGET_DETAIL[muniCode] : undefined)?.find((x) => x.fy === detailFy);
    return e && Object.hasOwn(e.byKan, side === "exp" ? "expenditure" : "revenue")
      ? e.byKan[side === "exp" ? "expenditure" : "revenue"]
      : null;
  })();
  const canDrillDeeper = (it: any) =>
    !!(it.children && it.children.length > 0) ||
    (!!detailKansHere && Object.hasOwn(detailKansHere, it.name)) ||
    (isFull &&
      side === "exp" &&
      depth === 0 &&
      (!!KOFU_R6_DETAIL.byKan[it.name] || KOFU_PROJECTS.some((p) => p.kan === it.name)));
  const drillCrumbs: any[] = [{ label: side === "rev" ? "歳入" : "歳出", jump: () => setSt({ drillPath: [] }), bg: depth === 0 ? "#14181C" : "transparent", fg: depth === 0 ? "#F7FAFC" : "#5C6B77", fw: depth === 0 ? "700" : "500", sep: s.drillPath.length ? "inline" : "none" }];
  s.drillPath.forEach((nm, i) => {
    const last = i === s.drillPath.length - 1;
    drillCrumbs.push({ label: nm, jump: () => setSt({ drillPath: s.drillPath.slice(0, i + 1) }), bg: last ? "#14181C" : "transparent", fg: last ? "#F7FAFC" : "#5C6B77", fw: last ? "700" : "500", sep: last ? "none" : "inline" });
  });
  const dHover = hoverFor("drill");
  const donutItems = nodeItems.length > 0 ? nodeItems : pathNodes.length > 0 ? [pathNodes[pathNodes.length - 1]] : rootItems;
  const drillRows = nodeItems.map((it, i) => {
    const clickable = canDrillDeeper(it);
    return {
      name: it.name, amtFmt: fmtV(it.v),
      sub: subV(it.v),
      pctFmt: pctOf(it.v, nodeTotal), barW: ((it.v / (nodeItems[0].v || 1)) * 100).toFixed(1),
      sw: dHover == null || dHover === i ? D.seriesColor(i) : fadeColor(D.seriesColor(i)),
      hoverOn: hoverOnFn("drill", i), hoverOff: hideTip,
      cursor: clickable ? "pointer" : "default", arrow: clickable ? "›" : "",
      open: clickable ? () => setSt({ drillPath: [...s.drillPath, it.name] }) : () => {},
    };
  });
  const drillEvidence = isDecision
    ? `${decisionView!.primaryEvidence?.title ?? "総務省 市町村別決算状況調"}${depth > 0 ? `「${nodeName}」` : ""}`
    : isBudget
      ? `${muniBudget!.sourceTitle}${depth > 0 ? `「${nodeName}」` : ""}`
      : `${budget.sourceTitle} ${budget.pagesLabel}${depth > 0 ? `「${nodeName}」` : ""}`;
  const drillSideTabs = [
    { label: "歳出", pick: () => setSt({ drillSide: "exp", drillPath: [] }), bg: side === "exp" ? "#14181C" : "#FFFFFF", fg: side === "exp" ? "#F7FAFC" : "#5C6B77" },
    { label: "歳入", pick: () => setSt({ drillSide: "rev", drillPath: [] }), bg: side === "rev" ? "#14181C" : "#FFFFFF", fg: side === "rev" ? "#F7FAFC" : "#5C6B77" },
  ];

  // --- themes 詳細 ---
  const themeCards = goalCards.map(({ goal, ps, total }) => ({
    name: `『${goal.name}』`, sub2: goal.label, totalFmt: fmtV(total), sub: subV(total), count: String(ps.length),
    open: openTheme(goal.name), bg: s.theme === goal.name ? "#E3F4FC" : "#FFFFFF", bd: s.theme === goal.name ? accent : "#DFE7EC",
  }));
  const curGoal = GOALS.find((g) => g.name === s.theme);
  let themeVals: any = { hasTheme: false, themeName: "", themeIntent: "", themeTotalFmt: "", themeCount: "", themeKanChips: [], themeProjects: [], themePer: "", themeSub: "" };
  if (curGoal) {
    const ps = goalProjects(curGoal.name);
    const total = sumOku(ps.map((p) => p.amountOku)); // #232
    // 款チップ（款別ドリルへのリンク）。款の記載が無い年度（R2・R3）はチップなし
    // ⚠ 千円の整数で足してから億へ戻す（#232）。チップの額も画面に出る。
    const kanAggSen: Record<string, number> = {};
    ps.forEach((p) => { if (p.kan != null) kanAggSen[p.kan] = (kanAggSen[p.kan] || 0) + Math.round(p.amountOku * 1e5); });
    const kanAgg: Record<string, number> = Object.fromEntries(
      Object.entries(kanAggSen).map(([k, v]) => [k, v / 1e5]),
    );
    const kanIdx = (nm: string) => Math.max(0, data.expenditure.findIndex((k) => k.name === nm));
    themeVals = {
      hasTheme: true,
      // 「基本目標1」のように名前自体が「基本目標」で始まる年度では接頭辞を重ねない
      themeName: curGoal.label
        ? `${curGoal.name.startsWith("基本") ? `『${curGoal.name}』` : `基本目標『${curGoal.name}』`} — ${curGoal.label}`
        : `『${curGoal.name}』`,
      themeIntent: `${planInfo.plan}の基本目標「${curGoal.name}」に紐づく主な事業（予算資料の主な事業一覧に掲載された ${ps.length}事業）の集計です。複数の基本目標を持つ事業は各目標に計上しています。`,
      themeTotalFmt: fmtV(total), themeSub: subV(total), themeCount: String(ps.length),
      themePer: fmtPerCap(total, data.pop),
      themeKanChips: Object.entries(kanAgg).map(([nm, v]) => ({ name: nm, amtFmt: fmtV(v), sw: D.seriesColor(kanIdx(nm)), open: () => nav({ screen: "drill", drillSide: "exp", drillPath: [nm] }) })),
      themeRequestUrl: D.buildRequestUrl(
        "事務事業評価票（全事業分・各年度）",
        `政策テーマ「${curGoal.name}」の事業について、事業費の決算額・成果指標の実績（評価詳細票）まで見たい`,
      ),
      themeProjects: ps.map((p) => ({
        evaluation: evalFor(p),
        name: p.name, summary: p.description, kanPath: p.kan ?? p.shisaku, kubun: p.kubun ?? "",
        budgetFmt: fmtV(p.amountOku), sub: subV(p.amountOku), shisaku: p.shisaku,
        refLabel: p.refLabel, refUrl: evHref(p.refLocalUrl),
        refOpen: () => openViewer({
          url: p.refLocalUrl, title: KOFU_PROJECTS_SOURCE.title, sub: `主な事業一覧 ${p.refLabel}`,
          originUrl: KOFU_PROJECTS_SOURCE.originUrl, archiveUrl: p.refUrl,
        }),
      })),
    };
  }

  // --- compare (前年比較・予算書の前年度当初額をそのまま使用) ---
  // full=甲府 or budget=類似4市。どちらも款行に prevV を持つ（予算書の前年度当初額）
  const compSrc = isBudget ? muniBudget! : budget;
  const compSide = s.compSide || "exp";
  const compKans = compSide === "rev" ? compSrc.revenue : compSrc.expenditure;
  const compCurSum = compSrc.totalOku;
  const compPrevSum = compSrc.prevTotalOku ?? 0;
  const compMax = Math.max(...compKans.map((it) => it.v));
  const compRows = compKans.map((it, i) => {
    const prev = it.prevV ?? 0;
    const g = prev > 0 ? (it.v / prev - 1) * 100 : 0;
    const dd = it.v - prev;
    const up = dd >= 0;
    return {
      name: it.name, sw: D.seriesColor(i),
      prevFmt: fmtV(prev), curFmt: fmtV(it.v),
      prevW: ((prev / compMax) * 100).toFixed(1), curW: ((it.v / compMax) * 100).toFixed(1),
      deltaFmt: (up ? "+" : "−") + fmtV(Math.abs(dd)) + "（" + (up ? "+" : "−") + Math.abs(g).toFixed(1) + "%）",
      deltaFg: up ? "#0F76A3" : "#C25400",
      open: () => nav({ screen: "drill", drillSide: compSide, drillPath: [it.name] }),
    };
  });
  const compDelta = compCurSum - compPrevSum;
  const compTabs = [
    { label: "歳出", pick: () => setSt({ compSide: "exp" }), bg: compSide === "exp" ? "#14181C" : "#FFFFFF", fg: compSide === "exp" ? "#F7FAFC" : "#5C6B77" },
    { label: "歳入", pick: () => setSt({ compSide: "rev" }), bg: compSide === "rev" ? "#14181C" : "#FFFFFF", fg: compSide === "rev" ? "#F7FAFC" : "#5C6B77" },
  ];

  // --- 予算執行状況（full=甲府 R7速報〜R1確定。budget=山梨県 R6決算・確定） ---
  const execSide = s.execSide || "exp";
  // 執行データ源: full=甲府（KOFU_EXECUTION_YEARS・複数年度）、budget=その自治体の
  // 決算（現状は山梨県のみ・当初予算とは別年度）。持たない階層は空 → 執行画面を出さない。
  const execSource: D.MuniExecutionYear[] = isFull
    ? (KOFU_EXECUTION_YEARS as unknown as D.MuniExecutionYear[])
    : muniBudget?.execution ?? [];
  const hasExec = execSource.length > 0;
  // 執行データを持たない階層向けの空スタブ（isExecution=false なので描画されない）
  const EMPTY_EXEC_YEAR: D.MuniExecutionYear = {
    fy: "", basis: "確定", fyLabel: "", asOf: "", asOfNote: "", population: null,
    revenueBudgetTotalOku: 0, revenueSettledTotalOku: 0,
    expenditureBudgetTotalOku: 0, expenditureSettledTotalOku: 0,
    revenue: [], expenditure: [],
    sourceTitle: "", sourceUrl: "", originUrl: "", sourceLocalUrl: "", evidence: [],
  };
  // 年度の既定はヘッダの年度ドロップダウンに追従する（full の過去年度閲覧時）。
  // ピルで明示選択したらそちらが優先。budget は単一年度。
  const execYear =
    execSource.find((y) => y.fy === s.execFy) ??
    execSource.find((y) => y.fy === budget.fy) ??
    execSource[0] ??
    EMPTY_EXEC_YEAR;
  const execRows0 = execSide === "rev" ? execYear.revenue : execYear.expenditure;
  const execBudgetTotal = execSide === "rev" ? execYear.revenueBudgetTotalOku : execYear.expenditureBudgetTotalOku;
  const execSettledTotal = execSide === "rev" ? execYear.revenueSettledTotalOku : execYear.expenditureSettledTotalOku;
  const execOverallRate = (execSettledTotal / execBudgetTotal) * 100;
  const execRows = execRows0.map((r, i) => ({
    name: r.name, sw: D.seriesColor(i),
    budgetFmt: fmtOku(r.budgetOku), settledFmt: fmtOku(r.settledOku),
    rateFmt: r.ratePct != null ? r.ratePct.toFixed(1) + "%" : "—",
    barW: r.ratePct != null ? Math.min(100, r.ratePct).toFixed(1) : "0",
    restFmt: fmtOku(Math.max(0, r.budgetOku - r.settledOku)),
    refLabel: r.refLabel, ref: r.ref,
    breakdownNote: r.breakdownNote ?? "",
  }));
  const execTabs = [
    { label: "歳出", pick: () => setSt({ execSide: "exp" }), bg: execSide === "exp" ? "#14181C" : "#FFFFFF", fg: execSide === "exp" ? "#F7FAFC" : "#5C6B77" },
    { label: "歳入", pick: () => setSt({ execSide: "rev" }), bg: execSide === "rev" ? "#14181C" : "#FFFFFF", fg: execSide === "rev" ? "#F7FAFC" : "#5C6B77" },
  ];

  // --- 事業報告（成果）＝事務事業評価 詳細票。full（甲府）のみ ---
  // ヘッダの年度ドロップダウンに連動する。公表は各年サンプル数件なので全年度分は揃わない:
  //   ① 同じ評価年度の詳細票があればそれ（R7予算 → R7評価）
  //   ② 無ければ、その予算年度をコスト経年に含む最新の詳細票へフォールバック
  //      （R8予算 → R8計画 列を持つ R7評価。R8 の評価は R8 中に行われるためまだ存在しない）
  //   ③ どちらも無ければ未収録 → リクエスト導線
  const reportYear = React.useMemo(() => {
    if (!isFull) return null;
    const withItems = KOFU_REPORT_YEARS.filter((y) => y.reports.length > 0);
    return (
      withItems.find((y) => y.fy === budget.fy) ??
      // KOFU_REPORT_YEARS は新しい年度順なので、先頭一致＝その年度に触れている最新の詳細票
      withItems.find((y) => y.reports.some((r) => r.cost.some((c) => c.fy === budget.fy))) ??
      null
    );
  }, [isFull, budget.fy]);
  // タブ（事務事業）の選択。年度をまたぐと No が変わるので、無ければ先頭へ落とす
  const reportItem =
    reportYear?.reports.find((r) => r.no === s.reportNo) ?? reportYear?.reports[0] ?? null;
  // フォールバック時（②）の注記。ズレの理由は年度の前後で別物なので言い分ける:
  //   予算年度 > 評価年度 → その年度の評価はまだ行われていない（評価は年度終了後）
  //   予算年度 < 評価年度 → 評価自体はあったが詳細票が未収録（公表は各年サンプル数件）
  // どちらも「表示中の詳細票がその年度をどの列で載せているか」を添えて対応を明示する。
  const reportFallbackNote = (() => {
    if (!reportYear || reportYear.fy === budget.fy) return "";
    const fyNum = (fy: string) => Number(fy.replace(/^R/, "")) || 0;
    const shortFy = budget.fyLabel.replace(" 当初予算", "");
    const col = reportYear.reports[0]?.cost.find((c) => c.fy === budget.fy)?.kind ?? null;
    const shown = `${reportYear.fyLabel}評価（対象 ${reportYear.targetFyLabel}実績）`;
    const where = col ? `${shortFy}を「${col}」の列に載せている` : "";
    return fyNum(budget.fy) > fyNum(reportYear.fy)
      ? `${shortFy}の評価はまだ行われていません（事務事業評価は年度終了後）。${where}最新の${shown}を表示しています。`
      : `${shortFy}の詳細票は未収録です（甲府市が詳細票を公表するのは各年サンプル数件のみ）。${where}${shown}を表示しています。`;
  })();

  // --- 決算の推移（決算状況調 R2〜R6・実データ） ---
  const trendMax = Math.max(...KOFU_TREND.map((r) => r.expenditureTotalOku));
  const trendBars = KOFU_TREND.map((r, i) => ({
    label: r.fy, fyLabel: r.fyLabel,
    amtFmt: fmtOku(r.expenditureTotalOku),
    h: ((r.expenditureTotalOku / trendMax) * 100).toFixed(1),
    bg: i === KOFU_TREND.length - 1 ? accent : "#B8D9EA",
    landingUrl: r.landingUrl, ref: r.ref,
  }));
  const trendIndicators = [
    { name: "歳入決算総額", vals: KOFU_TREND.map((r) => fmtOku(r.revenueTotalOku)) },
    { name: "人口（住基）", vals: KOFU_TREND.map((r) => (r.population != null ? (r.population / 10000).toFixed(1) + "万人" : "—")) },
    { name: "財政力指数", vals: KOFU_TREND.map((r) => (r.financialIndex != null ? r.financialIndex.toFixed(2) : "—")) },
    { name: "経常収支比率", vals: KOFU_TREND.map((r) => (r.keijoShushiPct != null ? r.keijoShushiPct.toFixed(1) + "%" : "—")) },
    { name: "実質公債費比率", vals: KOFU_TREND.map((r) => (r.jisshitsuKosaihiPct != null ? r.jisshitsuKosaihiPct.toFixed(1) + "%" : "—")) },
    // 歳出執行率 = 支出済額/予算現額（決算状況 収入支出詳細の確定値。R3 は資料消失で欠落）
    { name: "歳出執行率（確定）", vals: KOFU_TREND.map((r) => {
      const e = KOFU_EXECUTION_YEARS.find((y) => y.fy === r.fy && y.basis === "確定");
      return e ? ((e.expenditureSettledTotalOku / e.expenditureBudgetTotalOku) * 100).toFixed(1) + "%" : "—";
    }) },
  ];
  const trendYearLabels = KOFU_TREND.map((r) => r.fy);

  // --- header nav ---
  // decision（総務省決算）は款別ドリルダウン・類似自治体まで。前年比較・政策テーマ・
  // 予算執行状況は予算資料が要る full 専用（甲府）。
  const navDefsFull: [string, string, () => void][] = [
    ["ダッシュボード", "dash", () => nav({ screen: "dash" })],
    ["款別ドリルダウン", "drill", () => nav({ screen: "drill" })],
    ["前年比較", "compare", () => nav({ screen: "compare" })],
    ["政策テーマ", "themes", () => nav({ screen: "themes" })],
    ["予算執行状況", "execution", () => nav({ screen: "execution" })],
    ["類似自治体", "similar", () => nav({ screen: "similar" })],
  ];
  // budget（類似市）は前年比較まで（主な事業・政策テーマ・執行は資料なし）。
  // 都道府県エンティティ（県全体）は市町村の類似自治体比較を出さない
  const navDefsBudget: [string, string, () => void][] = [
    ["ダッシュボード", "dash", () => nav({ screen: "dash" })],
    ["款別ドリルダウン", "drill", () => nav({ screen: "drill" })],
    ["前年比較", "compare", () => nav({ screen: "compare" })],
    // 決算＋執行率を収録した budget 自治体（山梨県）のみ執行タブを出す
    ...(hasExec ? ([["予算執行状況", "execution", () => nav({ screen: "execution" })]] as [string, string, () => void][]) : []),
    ...(isPref ? [] : ([["類似自治体", "similar", () => nav({ screen: "similar" })]] as [string, string, () => void][])),
  ];
  const navDefsDecision: [string, string, () => void][] = [
    ["ダッシュボード", "dash", () => nav({ screen: "dash" })],
    ["款別ドリルダウン", "drill", () => nav({ screen: "drill" })],
    ["類似自治体", "similar", () => nav({ screen: "similar" })],
  ];
  // 階層は索引から同期で決まるので、取得待ちの budget 自治体にも budget のタブを出す
  const navDefs = isFull ? navDefsFull : tier === "budget" ? navDefsBudget : navDefsDecision;
  const navTabs = navDefs.map(([label, key, open]) => ({ label, open, fg: screen === key ? "#14181C" : "#5C6B77", fw: screen === key ? "700" : "500", ul: screen === key ? accent : "transparent" }));

  // 専用画面を指す URL に来たら、その階層で出せない画面はダッシュボードにフォールバック。
  // 政策テーマ・予算執行は full 専用。前年比較は full+budget（decision のみ不可）
  const gatedToDash =
    (isDecision && ["compare", "themes", "execution"].includes(screen)) ||
    // budget は政策テーマ不可。執行は決算を収録した自治体（hasExec）のみ許可
    (isBudget && (screen === "themes" || (screen === "execution" && !hasExec))) ||
    // 都道府県は市町村の類似自治体比較を出さない
    (isPref && screen === "similar");

  // ========================================================================
  // 類似自治体との比較 — 「何で比べるか（軸）」を選んでから比較相手を選ぶ。
  // 行は表示中の自治体を基準に組み立てる（以前は導出時に決め打ちした甲府市＋4市の
  // 静的リストを全自治体で使い回していたため、どの自治体を見ても甲府市が「このまち」
  // として出ていた）。全国索引はこの画面でだけ取得する（260KB・全1,741市町村）。
  // 軸ごとの距離計算・帯平均は lib/similar.ts。
  // ========================================================================
  const simOn = screen === "similar" && !gatedToDash;
  const { data: simIndex, loading: simLoading, error: simError } = useSimilarIndex(simOn);
  const simAxisKey: SimilarAxisKey = D.isSimilarAxis(s.simAxis) ? s.simAxis : D.DEFAULT_SIMILAR_AXIS;
  const simSelf = simIndex && muniCode ? simIndex.munis.find((m) => m.c === muniCode) ?? null : null;
  // 軸で近い順の全国母集団（同じ種別のみ）。サジェスト・帯平均の両方がここから出る
  const simRanked = React.useMemo(
    () => (simIndex && simSelf ? D.rankPeers(simIndex, simSelf, simAxisKey) : []),
    [simIndex, simSelf, simAxisKey],
  );
  const simVals = (() => {
    const axis = D.axisOf(simAxisKey);
    const base = {
      simAxes: D.SIMILAR_AXES.map((a) => ({
        key: a.key, label: a.label, desc: a.desc, active: a.key === simAxisKey,
        // 軸を変えると既定のサジェストも変わるので、手動で選んだ相手はリセットする
        select: () => setSt({ simAxis: a.key, simVs: undefined, simQ: "" }),
      })),
      simAxisDesc: axis.desc,
      simLoading, simError,
      simQ: s.simQ ?? "",
      setSimQ: (val: string) => setSt({ simQ: val }),
      simResults: [] as any[],
      simSuggest: [] as any[],
      simPoolLabel: "",
      simCustom: !!s.simVs,
      simReset: () => setSt({ simVs: undefined, simQ: "" }),
      similarRows: [] as any[],
      simLegend: [] as any[],
      similarEvidence: [] as any[],
      simFyLabel: simIndex?.fyLabel ?? D.SIMILAR_FY_LABEL,
      simReady: false,
      // 索引に無い自治体（Σ款≠歳出総額で決算シャードにも載らない団体）
      simMissing: !!simIndex && !simSelf,
    };
    if (!simIndex || !simSelf) return base;

    const cols = [D.PALETTE[0], D.PALETTE[1], D.PALETTE[2], D.PALETTE[4], "#C6D2DA"];
    // 人口・財政規模・1人あたり歳出は比較表に列があるので、行内で軸の値を繰り返さない。
    // 財政力指数・歳出構成は表に出ない値で並んでいるので、行にも根拠として出す
    const axisInTable = simAxisKey === "pop" || simAxisKey === "exp" || simAxisKey === "perCap";
    /** 軸の値そのもの（サジェストの並びが腑に落ちるよう、行にも同じ値を出す） */
    const axisLabel = (m: D.SimilarIndexRow): string => {
      switch (simAxisKey) {
        case "pop": return fmtPop(m.pop);
        case "exp": return fmtOku(m.exp);
        case "perCap": return fmtYen(m.pc);
        case "finIdx": return m.fi != null ? m.fi.toFixed(2) : "—";
        case "mix": {
          const d = D.axisDistance(simSelf, m, "mix");
          return d == null ? "—" : `差 ${d.toFixed(1)}pt`;
        }
      }
    };
    const vsCodes = s.simVs ?? simRanked.slice(0, D.DEFAULT_PEER_COUNT).map((m) => m.c);
    const selected = new Set(vsCodes);
    const toggle = (code: string) => {
      const next = selected.has(code) ? vsCodes.filter((c) => c !== code) : [...vsCodes, code];
      setSt({ simVs: next });
    };
    const band = simRanked.slice(0, D.BAND_SIZE);
    const avg = D.bandAverage(simIndex, simSelf, simAxisKey, band);
    const vsRows = vsCodes.flatMap((c) => {
      const m = simIndex.munis.find((x) => x.c === c);
      return m ? [m] : []; // 未知のコード（手で URL を書き換えた等）は黙って落とす
    });

    /** 索引の1行 → 表示行 */
    const toRow = (m: D.SimilarIndexRow, self: boolean) => {
      const sHover = hoverFor("sim-" + m.c);
      return {
        key: m.c, name: m.n, sub: m.p, self,
        pop: fmtPop(m.pop), totalFmt: fmtOku(m.exp), perCap: fmtYen(m.pc),
        // 歳出構成軸の基準行は「差 0.0pt」にしかならないので出さない（構成は帯グラフが示す）
        axisVal: axisInTable || (self && simAxisKey === "mix") ? "" : `${axis.label} ${axisLabel(m)}`,
        ref: D.refOf(simIndex, m), refLabel: D.refLabelOf(simIndex, m),
        bg: self ? "#E3F4FC" : "transparent", fw: self ? "700" : "500",
        badge: self ? "このまち" : "",
        clickable: !self,
        open: self ? () => {} : () => nav({
          screen: "dash", muni: m.n, muniCode: m.c, pref: m.p,
          drillPath: [], theme: null, budgetFy: undefined,
        }),
        // 比較相手は表からも外せる（サジェストのチップと同じ選択状態を共有する）
        remove: self ? null : () => toggle(m.c),
        segs: m.mix.map((p, i) => ({
          w: String(p), sw: sHover == null || sHover === i ? cols[i] : fadeColor(cols[i]),
          tipMove: mkSegTip(`${m.n}・${simIndex.mixCols[i]}`, p + "%", "歳出構成比", cols[i]!, { key: "sim-" + m.c, idx: i }),
        })),
      };
    };
    /** 帯平均の行（実在の自治体ではないので導出値と明示し、リンクも張らない） */
    const avgRow = avg
      ? (() => {
          const sHover = hoverFor("sim-avg");
          return {
            key: "__avg", name: avg.name, sub: "", self: false, avg: true,
            pop: fmtPop(avg.pop), totalFmt: fmtOku(avg.exp), perCap: fmtYen(avg.pc),
            axisVal: "",
            ref: avg.note, refLabel: `帯内${avg.count}団体から算出（導出値）`,
            bg: "transparent", fw: "500", badge: "", clickable: false, open: () => {}, remove: null,
            segs: avg.mix.map((p, i) => ({
              w: String(p), sw: sHover == null || sHover === i ? cols[i] : fadeColor(cols[i]),
              tipMove: mkSegTip(`${avg.name}・${simIndex.mixCols[i]}`, p + "%", "歳出構成比", cols[i]!, { key: "sim-avg", idx: i }),
            })),
          };
        })()
      : null;

    const rows = [toRow(simSelf, true), ...vsRows.map((m) => toRow(m, false)), ...(avgRow ? [avgRow] : [])];
    // エビデンスは「表示中の行が実際に使ったファイル」だけに絞る（市だけなら町村別は出さない）
    const families = new Set([simSelf.f, ...vsRows.map((m) => m.f), ...(avgRow ? [simSelf.f] : [])]);
    const poolCount = simIndex.munis.filter((m) => m.f === simSelf.f).length;

    return {
      ...base,
      simReady: true,
      simPoolLabel: `全国の${poolCount.toLocaleString("ja-JP")}${D.familyLabel(simSelf.f)}から`,
      simSuggest: simRanked.slice(0, D.SUGGEST_COUNT).map((m) => ({
        code: m.c, name: m.n, pref: m.p, axisVal: axisLabel(m),
        selected: selected.has(m.c), toggle: () => toggle(m.c),
      })),
      simResults: D.searchMunis(simIndex, s.simQ ?? "", new Set([simSelf.c, ...selected])).map((m) => ({
        code: m.c, name: m.n, pref: m.p, axisVal: axisLabel(m),
        // 種別が違う相手は財政構造が違うので、選べるが注意書きを添える
        crossFamily: m.f !== simSelf.f ? `${D.familyLabel(m.f)}（種別が違います）` : "",
        add: () => setSt({ simVs: [...vsCodes, m.c], simQ: "" }),
      })),
      similarRows: rows,
      simLegend: simIndex.mixCols.map((n, i) => ({ name: n, sw: cols[i] })),
      similarEvidence: SIMILAR_EVIDENCE.filter((ev) => families.has(ev.family)).map((ev) => ({
        ...ev,
        href: evHref(ev.localUrl),
        open: () => openViewer({
          url: ev.localUrl, title: ev.title, sub: ev.thumb,
          originUrl: "https://www.soumu.go.jp/iken/zaisei/r06_shichouson.html", archiveUrl: ev.url,
        }),
      })),
    };
  })();

  // --- トップの「収録の深さから選ぶ」 -----------------------------------------
  // 進捗を手書きしない原則（/roadmap・heroStats と同じ）: 段の割り当ては収録済み gen
  // （MUNI_BUDGET_INDEX・REPORT_MUNIS）から毎回組み立てるので、
  // 自治体を収録すれば黙って正しい段に載る。
  // 各自治体は**最も深い到達点の段にだけ**載せる。「事業報告 ⊃ 主な事業 ⊃ 款別」の
  // 入れ子ではない（横浜・川崎は主な事業一覧を持たずに事業報告を持つ）ので、
  // 階段ではなく到達点で束ねる。
  //
  // **段の中は「都道府県」と「市区町村」に割る**（2026-07-28）。都道府県エンティティが
  // 2 → 39 に増えて、団体コード順のフラットな並びだと**県と市区町村が交互に混ざり**、
  // 見た目も同一（添え書きが県名か「都道府県」かの違いだけ）で読めなくなっていた。
  // 市区町村はさらに**所属する都道府県で束ねる** — 東京23区が23個のチップとして
  // 段の1/4を占めて視覚を支配していたのが「東京都」1行に収まる。件数が増えても
  // 市区町村は自分の県の行に吸収されるので、伸びるのは行の長さだけになる。
  const coverageLevels = (() => {
    // ⚠ **索引だけで組む**（#216） — 段の割り当てに要るのは名前・県名・isPref と
    //    「いずれかの年度に事業があるか」だけで、金額は要らない。ここで本体を触ると
    //    トップページが全99団体ぶんのシャードを取りに行くことになる。
    const entries = Object.entries(D.MUNI_BUDGET_INDEX)
      .map(([code, b]) => {
        return {
          code,
          name: b.muniName,
          pref: b.prefName,
          isPref: !!b.isPref,
          level: REPORT_MUNIS[code] ? 2 : b.hasProjects ? 1 : 0,
        };
      })
      .sort((a, b) => a.code.localeCompare(b.code));
    const all = [{ code: "192015", name: "甲府市", pref: "山梨県", isPref: false, level: 2 }, ...entries];
    type Ent = (typeof all)[number];
    const chip = (e: Ent) => ({
      name: e.name,
      open: () => nav({ screen: "dash", pref: e.pref, muni: e.name, muniCode: e.code, drillPath: [], theme: null, budgetFy: undefined }),
    });
    const mk = (level: number) => {
      const inLevel = all.filter((e) => e.level === level);
      const prefs = inLevel.filter((e) => e.isPref);
      const munis = inLevel.filter((e) => !e.isPref);
      // 県の並びは**団体コードの上2桁**（＝北から南の定型順）。県名の五十音でも
      // 収録順でもなく、/coverage の一覧・日本地図と同じ並びに揃える。
      const byPref = new Map<string, { pref: string; munis: ReturnType<typeof chip>[] }>();
      for (const e of munis) {
        const key = e.code.slice(0, 2);
        const g = byPref.get(key) ?? { pref: e.pref, munis: [] };
        g.munis.push(chip(e));
        byPref.set(key, g);
      }
      return {
        prefs: prefs.map(chip),
        prefCount: prefs.length,
        muniCount: munis.length,
        muniGroups: [...byPref.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([, g]) => g),
      };
    };
    return [
      { title: "事業報告（成果）まで", note: "予算 → 事業 → 成果を1事業ずつたどれる（甲府市は執行・評価・議会の構成まで）", ...mk(2) },
      { title: "主な事業まで", note: "款別の内訳に加えて、主な事業の一覧と説明つき", ...mk(1) },
      { title: "当初予算（款別）まで", note: "歳入・歳出の款別内訳と前年当初比較", ...mk(0) },
    ];
  })();

  // 予算資料ベースの機能のうち、この団体で収録済みのもの。budget 階層の案内パネルと
  // リクエストチップは**この実態から組み立てる**。固定文言だと、横浜・川崎の事務事業評価
  // （572件・2,313件を表示している真下で「事務事業評価は未収録」）や山梨県の主な事業
  // （施策別74事業を表示しながら「主な事業一覧は未収録」）のように、**収録済みの機能を
  // 「未収録・リクエスト」と案内する**矛盾が起きる（2026-07-16 修正）。
  // 「〇民1人あたり」の〇を自治体種別で出し分ける。「市民」決め打ちだと山梨県（県民）・
  // 千代田区など特別区（区民）・富士河口湖町（町民）で誤る（2026-07-16 修正）
  const capitaWho = (() => {
    const last = data.name.slice(-1);
    return ({ 都: "都民", 道: "道民", 府: "府民", 県: "県民", 区: "区民", 町: "町民", 村: "村民" } as Record<string, string>)[last] ?? "市民";
  })();

  const hasBudgetProjectsData = isBudget && (muniBudget!.projects?.length ?? 0) > 0;
  const budgetMissing = [
    ...(hasBudgetProjectsData ? [] : [isPref ? "主な事業（施策別）" : "主な事業一覧"]),
    ...(hasExec ? [] : ["決算・執行状況"]),
    // 事務事業評価は市町村の制度なので、都道府県では未収録リストに載せない
    ...(reportMuni || isPref ? [] : ["事務事業評価"]),
  ];

  // ドリル画面とダッシュボード末尾の出典が指す一次資料（自サーバー配信コピーのパス）。
  // href・文言・開く動作を同じ1つの URL から作る（別々に組むとリンク先と文言がズレる）
  const dashEvidenceLocalUrl = isDecision
    ? decisionView!.primaryEvidence?.localUrl ?? ""
    : isBudget
      ? muniBudget!.sourceLocalUrl
      : budget.sourceLocalUrl;
  // 歳入・歳出が別ファイルの分冊形式（日立 H26〜H24・台東・品川など）の budget 市は、ドリル画面の側に
  // 合わせて歳出側のコピーを指す（#257）。ダッシュボードは両側を出すので sourceLocalUrl（歳入）＋
  // 歳出の補助リンク（dashSourceExp*）にする
  const drillExpEvidence =
    isBudget && s.drillSide === "exp" && muniBudget!.expenditureEvidence ? muniBudget!.expenditureEvidence : null;
  const drillEvidenceLocalUrl = drillExpEvidence ? drillExpEvidence.localUrl : dashEvidenceLocalUrl;

  const v: any = {
    isTop: screen === "top", isMuni: screen === "muni", isApp,
    isDash: screen === "dash" || gatedToDash, isDrill: screen === "drill",
    // 政策テーマ・執行は full 専用。前年比較は full+budget（decision 不可）
    isThemes: screen === "themes" && isFull, isCompare: screen === "compare" && !isDecision,
    // 執行画面は full（甲府）＋ 決算を収録した budget（山梨県）
    isExecution: screen === "execution" && (isFull || (isBudget && hasExec)),
    // 決算ベース（総務省・decision 階層）の自治体か。予算資料ベースの full 画面は出さない
    isDecision,
    // 予算のみ収録（budget 階層・類似市）。主な事業/執行/評価は未収録
    isBudget,
    // full（甲府）: 主な事業・政策テーマ・執行まで出す
    isFull,
    // 都道府県エンティティ（県全体）か
    isPref,
    // budget 案内パネルの本文（都道府県は市町村向け文言を出さない）。
    // 確認できるもの・未収録のものは**この団体の収録実態（budgetMissing）から組み立てる**
    budgetPanelTitle: isPref
      ? `${data.name}（都道府県会計）の当初予算を収録しています`
      : "この自治体は当初予算（款別）を収録しています",
    budgetPanelBody: (() => {
      const can = isPref
        ? [
            "款別の歳入・歳出",
            "前年当初比較",
            // 「県内」で決め打ちしない（北海道・大阪府・東京都でちぐはぐになる）。
            // 団体名の末字から 都/道/府/県 を取る（gen の populationLabel と同じ考え方）
            `1人あたり（${data.name.slice(-1)}内市区町村人口合計）`,
            ...(hasExec ? [`${execYear.fyLabel}の款別決算・執行率`] : []),
            ...(hasBudgetProjectsData ? ["主な事業（施策別）"] : []),
          ]
        : [
            "款別の歳入・歳出",
            "前年当初比較",
            "1人あたり",
            "類似自治体比較",
            "決算の経年（総務省）",
            ...(hasBudgetProjectsData ? ["主な事業一覧"] : []),
            ...(reportMuni ? ["事務事業評価（事業報告）"] : []),
          ];
      return `${can.join("・")}を確認できます。${budgetMissing.length > 0 ? `${budgetMissing.join("・")}は未収録です。` : ""}`;
    })(),
    // シャード取得待ち（ダッシュボードでスケルトンを出す）。decision の県シャードと
    // budget の当初予算シャード（#216）はどちらも実行時フェッチなので同じ扱い
    loading: muniPending,
    loadingLabel: budgetPending ? "当初予算データを読み込んでいます…" : "決算データを読み込んでいます…",
    // decision 自治体の未収録機能（主な事業・執行・評価・補正）のその場リクエスト。
    // ⚠ **当初予算を調べたうえで収録できないと判定した団体では出さない**（山梨市・韮崎市・
    // 甲斐市・上野原市・中央市）。/coverage は同じ理由でリクエスト先から外しているのに、
    // 読者が実際に開くこの画面では出し続けていた（2026-07-29 修正）
    decisionRequestUrl: isDecision && unrecOf(muniCode ?? "", "budget").length === 0
      ? D.buildRequestUrl(
          `${data.name}の予算資料（当初予算・主な事業・執行状況）の収録`,
          `自治体リクエスト: ${prefName} ${data.name} は決算ベース（総務省）で収録済み。当初予算・主な事業・執行状況などの予算資料も見たい`,
          data.name,
        )
      : "",
    // リクエストの代わりに出す説明（理由と確認日）。**恒久の事実として書かない**
    decisionUnrec: isDecision
      ? unrecOf(muniCode ?? "", "budget").map((u) => ({ fyLabel: u.fyLabel, reason: u.reason, checkedOn: u.checkedOn }))
      : [],
    decisionEvidence: isDecision
      ? (decisionView!.evidence ?? []).map((ev) => ({
          ...ev,
          open: () => openViewer({
            url: ev.localUrl, title: ev.title, sub: ev.thumb,
            originUrl: "https://www.soumu.go.jp/iken/zaisei/r06_shichouson.html", archiveUrl: ev.url,
          }),
        }))
      : [],
    // 性質別歳出（決算・R6のみ・総務省(4)）。人件費/扶助費/普通建設費…をバー表示
    hasNature: isDecision && !!decisionView!.nature,
    natureFyLabel: isDecision ? `${decisionView!.fyLabel}（性質別）` : "",
    natureRows:
      isDecision && decisionView!.nature
        ? decisionView!.nature.map((n, i) => ({
            name: n.name,
            amtFmt: fmtV(n.v),
            pctFmt: pctOf(n.v, decisionView!.total),
            barW: ((n.v / (decisionView!.nature![0]?.v || 1)) * 100).toFixed(1),
            sw: D.seriesColor(i),
          }))
        : [],
    // 地方債現在高ほか（決算・R6のみ・総務省(5)）
    bondItems:
      isDecision && decisionView!.bond
        ? [
            { name: "地方債現在高", v: fmtOku(decisionView!.bond.balanceOku), strong: true },
            { name: "積立金現在高", v: decisionView!.bond.reserveOku != null ? fmtOku(decisionView!.bond.reserveOku) : "—", strong: false },
            { name: "うち財政調整基金", v: decisionView!.bond.chouseiOku != null ? fmtOku(decisionView!.bond.chouseiOku) : "—", strong: false },
            { name: "債務負担行為（翌年度以降）", v: decisionView!.bond.debtBurdenOku != null ? fmtOku(decisionView!.bond.debtBurdenOku) : "—", strong: false },
          ]
        : [],
    // budget 階層の未収録機能のリクエスト。**未収録のもの（budgetMissing）だけ**を頼む
    // （全部収録済みならチップ自体を出さない — View 側で budgetRequestUrl の有無を見る）
    budgetRequestUrl:
      isBudget && budgetMissing.length > 0
        ? D.buildRequestUrl(
            `${data.name}${isPref ? "（都道府県）" : ""}の${budgetMissing.join("・")}の収録`,
            `自治体リクエスト: ${isPref ? "" : `${prefName} `}${data.name} は当初予算（款別）ほかを収録済み。${budgetMissing.join("・")}も見たい`,
            data.name,
          )
        : "",
    budgetRequestLabel: budgetMissing.length > 0 ? `${budgetMissing.join("・")}の収録をリクエスト ↗` : "",
    execTabs, execRows,
    // 年度切替（full=甲府は複数年度。budget=山梨県は単一年度なので1ピル）
    execYearTabs: execSource.map((y) => ({
      label: `${y.fy}${y.basis === "速報" ? "（速報）" : ""}`,
      pick: () => setSt({ execFy: y.fy }),
      bg: y.fy === execYear.fy ? "#14181C" : "#FFFFFF",
      fg: y.fy === execYear.fy ? "#F7FAFC" : "#5C6B77",
    })),
    // full（甲府）は R3 が資料消失で WARP 回収の注記。budget は当初予算と別年度の注記
    execGapNote: isFull
      ? "令和3年度は発行元サイトから削除済みのため、国立国会図書館 WARP の保存版から収録しています"
      : `決算は最新の${execYear.fyLabel}を収録しています（当初予算とは年度が異なります）`,
    execFyLabel: execYear.fyLabel, execAsOfNote: execYear.asOfNote,
    execSideLabel: execSide === "rev" ? "歳入" : "歳出",
    execRateLabel: execSide === "rev" ? "収入率" : "執行率",
    execSettledColLabel: execSide === "rev" ? "収入済額" : "支出済額",
    execOverallRate: execOverallRate.toFixed(1) + "%",
    execOverallBarW: Math.min(100, execOverallRate).toFixed(1),
    execBudgetFmt: fmtOku(execBudgetTotal), execSettledFmt: fmtOku(execSettledTotal),
    // エビデンスは自サーバーの原本コピーをドロワーで開く（HTML はサンドボックス表示）。
    // 要許可の資料だけは発行元へのディープリンクになる（openViewer / evHref）
    execEvidence: execYear.evidence.map((he) => ({
      ...he,
      href: evHref(he.localUrl),
      open: () => openViewer({
        url: he.localUrl, title: he.title, sub: he.thumb,
        originUrl: execYear.originUrl, archiveUrl: he.url,
      }),
    })),
    execSourceUrl: evHref(execYear.sourceLocalUrl),
    execSourceOpen: () => openViewer({
      url: execYear.sourceLocalUrl, title: execYear.sourceTitle, sub: execYear.fyLabel,
      originUrl: execYear.originUrl, archiveUrl: execYear.sourceUrl,
    }),
    trendBars, trendIndicators, trendYearLabels,
    trendSourceUrl: KOFU_TREND[KOFU_TREND.length - 1]?.landingUrl ?? "",
    // 決算の推移は KOFU_TREND（甲府の総務省決算）ベース。full（甲府）だけで出す
    showTrend: isFull,
    // 議会の構成（予算議決時）。甲府＋議決時点の構成を確かめた budget 階層の議会（council.gen の
    // MUNI_COUNCIL_YEARS）。会派別議席数の横バー＋一覧＋議決チップ。賛否は収録済みの議会・年度だけ（甲府は R7・R8）。
    council: shownCouncil
      ? {
          body: shownCouncil.body,
          // 甲府は定数＝現員。他の議会は原典で定数を確かめた団体だけ「定数」、無ければ「現員」
          seatsLabel: isFull ? "定数" : shownCouncil.teisu != null ? "定数" : "現員",
          seatsShown: isFull ? shownCouncil.seats : (shownCouncil.teisu ?? shownCouncil.seats),
          vacancyLabel:
            !isFull && shownCouncil.teisu != null && shownCouncil.teisu > shownCouncil.seats
              ? `欠員 ${shownCouncil.teisu - shownCouncil.seats}`
              : null,
          // 甲府は R7・R8 の賛否を議員別表決結果一覧から収録（kofu-gikai 0.3.0）。それ以外の年度は未収録 —
          // ⚠ 「非公表」と書かない（審議結果のページに表へのリンクが無いことしか確かめていない。docs §6）
          voteNote: isFull && !vparts.length
            ? shownCouncil?.votesTable
              ? `議員ごとの賛否は、市議会が「${shownCouncil.votesTable.title}」で公表していますが、まだ収録していません。`
              : "会派・議員ごとの賛否は未収録です（この年度の審議結果のページには、議員ごとの賛否の表へのリンクがありません）。"
            : vparts.length
              ? isFull
                ? // 甲府の原典は議員別の表で、会派全員が同じ賛否の列を発行元が結合している（docs §6）
                  "議員ごとの賛否（議決当日の議員別表決結果一覧）。会派全員が同じ賛否の列は、原典で1つにまとめられています。"
                : // 採決ごとに記録の単位が違うことがある（奈良: 原案は全会一致で会派ごと、修正案は議員ごと）
                (vparts.every((vp) => vp.basis === vparts[0]!.basis)
                  ? (vparts[0]!.basis === "member" ? "議員ごとの賛否" : "会派ごとの賛否") + "（議決の賛否表）。"
                  : `採決ごとの賛否（議決の賛否表）。${vparts.map((vp) => `${vp.part}は${vp.basis === "member" ? "議員ごと" : "会派ごと"}`).join("、")}の記録です。`) +
                (vparts.some((vp) => vp.basis === "faction") ? "会派の列は、その会派の議員（議長などを除く）を同じ賛否として数えています。" : "") +
                (vparts.length > 1 ? "修正可決のため、採決ごとに分けて出しています。" : "")
              : "会派・議員ごとの賛否は未収録です。",
          // 賛否の集計（採決ごと）。賛成・反対を先に、欠席・議長などは括弧で
          voteTallies: vparts.map((vp) => {
            const t = vp.tally;
            const main = ["賛成", "反対", "賛成でない"].filter((k) => t[k]).map((k) => `${k}${t[k]}`).join("・");
            const rest = vp.stances.filter((k) => !["賛成", "反対", "賛成でない"].includes(k)).map((k) => `${k}${t[k]}`).join("・");
            const label = rest ? `${main}（${rest}）` : main;
            // 原典は「全会一致」の語だけ — 数は議席から出したものなので、そう分かるように書く
            return { part: vp.part, label: vp.unanimousText ? `${vp.unanimousText}（議席から数えて ${label}）` : label };
          }),
          voteSourceTitle: vparts[0]?.source.title ?? null,
          voteAction: vparts[0] ? evAction(vparts[0].source.localUrl) : null,
          // 賛否表が議決結果と同じ原典なら、出典チップを重ねて出さない（横浜）
          voteOpen: vparts[0] && vparts[0].source.localUrl !== shownCouncil.result.localUrl
            ? () =>
                openViewer({
                  url: vparts[0]!.source.localUrl, title: vparts[0]!.source.title,
                  sub: shownCouncil.resolution.decidedDateLabel, originUrl: vparts[0]!.source.originUrl,
                  archiveUrl: vparts[0]!.source.archiveUrl,
                })
            : null,
          seats: shownCouncil.seats,
          asOfLabel: shownCouncil.asOfLabel,
          fyLabel: shownCouncil.fyLabel,
          factions: shownCouncil.factions.map((f, i) => {
            const sw = D.seriesColor(i);
            const pct = ((f.seats / shownCouncil.seats) * 100).toFixed(1);
            // 会派の賛否: 1つだけなら「賛成」「反対」、割れていれば「賛成3・反対1」（欠席・議長などは数に入れず括弧で）。
            // 採決が分かれる議会（修正可決）は、採決どうしで同じなら1つ、違えば「修正案 反対／原案 賛成」
            const perPart = vparts.map((vp) => {
              const vc = vp.byFaction.find((b) => b.faction === f.name)?.counts;
              if (!vc) return null;
              const yn = ["賛成", "反対", "賛成でない"].filter((k) => vc[k]);
              const other = Object.keys(vc).filter((k) => !["賛成", "反対", "賛成でない"].includes(k));
              const label =
                (yn.length === 1 ? yn[0]! : yn.map((k) => `${k}${vc[k]}`).join("・")) +
                (other.length ? `${yn.length ? "（" : ""}${other.map((k) => `${k}${vc[k]}`).join("・")}${yn.length ? "）" : ""}` : "");
              const tone = yn.length === 1 ? (yn[0] === "賛成" ? "yes" : "no") : yn.length > 1 ? "mixed" : "none";
              return { part: vp.part, label, tone };
            });
            const pp = perPart.filter((x): x is NonNullable<typeof x> => x != null);
            const same = pp.length > 0 && pp.every((x) => x.label === pp[0]!.label);
            const stanceLabel = !pp.length ? null : same ? pp[0]!.label : pp.map((x) => `${x.part} ${x.label}`).join("／");
            const stanceTone = !pp.length ? null : same ? pp[0]!.tone : "mixed";
            return {
              name: f.name,
              stanceLabel,
              stanceTone,
              seatsLabel: `${f.seats}議席`,
              w: pct,
              sw,
              tipMove: mkSegTip(f.name, `${f.seats}議席`, `${pct}%`, sw, { key: "council", idx: i }),
            };
          }),
          resolution: shownCouncil.resolution,
          sourceTitle: shownCouncil.sourceTitle,
          // 甲府は従来の固定ラベル（「会派別議員名簿」「○定例会 審議結果」）。他は原典の呼び名
          rosterTitle: isFull ? "会派別議員名簿" : shownCouncil.roster.title,
          resultTitle: isFull ? `${shownCouncil.resolution.sessionLabel} 審議結果` : shownCouncil.result.title,
          rosterAction: evAction(shownCouncil.roster.localUrl),
          resultAction: evAction(shownCouncil.result.localUrl),
          rosterOpen: () =>
            openViewer({
              url: shownCouncil.roster.localUrl, title: shownCouncil.roster.title,
              sub: `${shownCouncil.asOfLabel}現在`, originUrl: shownCouncil.roster.originUrl,
              archiveUrl: shownCouncil.roster.archiveUrl,
            }),
          resultOpen: () =>
            openViewer({
              url: shownCouncil.result.localUrl, title: shownCouncil.result.title,
              sub: shownCouncil.resolution.decidedDateLabel, originUrl: shownCouncil.result.originUrl,
              archiveUrl: shownCouncil.result.archiveUrl,
            }),
          minutesUrl: shownCouncil.minutesUrl,
          newsletterUrl: shownCouncil.newsletterUrl,
          // 名簿の基準日から議決までに議席を離れた議員（council-transcribed 0.8.23）。名簿の「○月○日現在」の人数と
          // 議決時の人数（会派の議席の和）が違う理由を、基準日の横に「（1月31日の辞職を除く）」と出す。原文は出典チップで開く
          departureLabel: (() => {
            const deps = "departures" in shownCouncil ? (shownCouncil.departures ?? []) : [];
            if (!deps.length) return null;
            // 同じ日・同じ理由は1つにまとめて人数を添える（和歌山県: 2月18日に2人が辞職）
            const groups = new Map<string, number>();
            for (const d of [...deps].sort((a, b) => a.date.localeCompare(b.date))) groups.set(`${d.dateLabel}の${d.kind}`, (groups.get(`${d.dateLabel}の${d.kind}`) ?? 0) + 1);
            return `（${[...groups].map(([k, n]) => (n > 1 ? `${k}${n}人` : k)).join("・")}を除く）`;
          })(),
          departureChips: ("departures" in shownCouncil ? (shownCouncil.departures ?? []) : [])
            .filter((d, i, all) => all.findIndex((o) => o.source.localUrl === d.source.localUrl) === i)
            .map((d) => ({
              title: d.source.title,
              action: evAction(d.source.localUrl),
              open: () =>
                openViewer({
                  url: d.source.localUrl, title: d.source.title,
                  sub: `${d.dateLabel}の${d.kind}`, originUrl: d.source.originUrl,
                  archiveUrl: d.source.archiveUrl,
                }),
            })),
        }
      : null,
    // 事業報告（成果）＝事務事業評価 詳細票。full（甲府）のみ。予算→執行→成果を1事業で通す。
    // 表示年度に連動して1年度分だけ出し、事務事業はタブで切り替える（全事業を並べると
    // 1事業あたりの評価・実績が読めないため）。年度の解決は reportYear を参照。
    report:
      reportYear && reportItem
        ? {
            fyLabel: reportYear.fyLabel,
            targetFyLabel: reportYear.targetFyLabel,
            // 予算年度と評価年度がズレたとき（②のフォールバック）だけ理由を明示する
            fallbackNote: reportFallbackNote,
            sourceUrl: evHref(reportYear.sourceLocalUrl),
            sourceAction: evAction(reportYear.sourceLocalUrl),
            sourceOpen: () =>
              openViewer({
                url: reportYear.sourceLocalUrl, title: reportYear.sourceTitle,
                sub: `${reportYear.fyLabel}（対象 ${reportYear.targetFyLabel}）`,
                originUrl: reportYear.originUrl, archiveUrl: reportYear.sourceUrl,
              }),
            tabs: reportYear.reports.map((r) => ({
              label: r.name,
              grade: r.grade,
              active: r.no === reportItem.no,
              pick: () => setSt({ reportNo: r.no }),
            })),
            item: {
              no: reportItem.no,
              name: reportItem.name,
              buka: reportItem.buka,
              kubun: reportItem.kubun,
              grade: reportItem.grade,
              score: reportItem.score,
              scorePct: reportItem.score != null ? Math.round((reportItem.score / 24) * 100) : null,
              impl: reportItem.implementation,
              ref: reportItem.ref,
              // 事業費・トータルコスト（千円）は総額/1人あたりトグルに追従（÷10万で億へ）。
              // 表示中の予算年度に一致する列を強調し、予算↔成果の年度対応を分かるようにする。
              cost: reportItem.cost.map((c) => ({
                fy: c.fy,
                kindLabel: c.kind,
                current: c.fy === budget.fy,
                jigyohiFmt: c.jigyohi != null ? fmtV(c.jigyohi / 100000) : "—",
                totalFmt: c.totalCost != null ? fmtV(c.totalCost / 100000) : "—",
              })),
              // 指標は targets/actuals がコスト経年（cost）と 1:1 で並ぶ。年度ごとに
              // 目標→実績を出して、どの年に届いた／届かなかったかを読めるようにする。
              indicators: reportItem.indicators.map((ind) => ({
                category: ind.category,
                name: ind.name,
                years: reportItem.cost.map((c, i) => {
                  const target = ind.targets[i] ?? null;
                  const actual = ind.actuals[i] ?? null;
                  const pct = target != null && target !== 0 && actual != null
                    ? Math.round((actual / target) * 100)
                    : null;
                  return {
                    fy: c.fy,
                    kindLabel: c.kind,
                    current: c.fy === budget.fy,
                    targetFmt: target != null ? target.toLocaleString() : "—",
                    actualFmt: actual != null ? actual.toLocaleString() : "—",
                    // 実績が未到来の年度（当初・計画）は目標だけ。バーは出さない
                    pending: actual == null,
                    pct,
                    barW: pct != null ? Math.min(100, pct) : 0,
                    over: pct != null && pct >= 100,
                  };
                }),
              })),
            },
          }
        : null,
    // 詳細票がまったく無い年度（R2 など）。黙って消さずリクエスト導線に変える
    reportMissing:
      isFull && !reportYear
        ? {
            note: `${budget.fyLabel.replace(" 当初予算", "")}の事業費・成果を載せた事務事業評価 詳細票は未収録です。甲府市が詳細票を公表するのは各年サンプル数件のみで、収録済みの詳細票（${KOFU_REPORT_YEARS.filter((y) => y.reports.length > 0).map((y) => `${y.fyLabel}評価`).join("・")}）はいずれもこの年度に触れていません。`,
            requestUrl: D.buildRequestUrl(
              "事務事業評価 詳細票（事業報告・成果）",
              `年度リクエスト: 甲府市 ${budget.fyLabel} の事業について、事業費の決算額・成果指標の目標／実績・総合評価（詳細票）を見たい`,
            ),
          }
        : null,
    showEvidence,
    // トップの3つの数字は **roadmap.gen.ts が実データから算出したもの**（/roadmap・/coverage と同じ源）。
    // 手書きにすると必ず実態とズレる — 「当初予算まで収録」は 甲府＋4市だった頃の 5 が
    // 政令市20市を収録し終えた後も残っていた。当初予算が見られるのは full + budget の全団体。
    heroStats: [
      { num: ROADMAP_PROGRESS.prefCount.toLocaleString(), label: "都道府県" },
      { num: ROADMAP_PROGRESS.muniCount.toLocaleString(), label: "市区町村（決算収録）" },
      { num: (ROADMAP_PROGRESS.fullCount + ROADMAP_PROGRESS.budgetCount).toLocaleString(), label: "当初予算まで収録" },
    ],
    onPrefSelect: (name: string) => nav({ screen: "muni", pref: name }),
    // 「収録の深さから選ぶ」（トップ）。段の割り当ては収録データから自動（coverageLevels 参照）
    coverageLevels,
    coverageDecisionCount: ROADMAP_PROGRESS.muniCount.toLocaleString(),
    // フッターの公開用リンク。プライバシーポリシーは www.phh.jp が正典（同じ事業者・
    // 同じ計測の仕組みなので2つに分けない）。Cookie 設定は**バナーを出す環境でだけ**出す
    // （dev や Preview では同意バナー自体が無いので、押しても何も起きないボタンになる）
    privacyUrl: D.PRIVACY_URL,
    openCookiePrefs: consentEnabled
      ? () => { void import("vanilla-cookieconsent").then((cc) => cc.showPreferences()); }
      : null,
    // 都道府県の到達度は**段をまたぐ**（山梨県だけ「主な事業まで」の段にいる）ので、
    // 段の中でなくセクションの導入に出す。分母 47 も derive 由来（手書きしない）
    coveragePrefDone: coverageLevels.reduce((a, g) => a + g.prefCount, 0),
    coveragePrefTotal: ROADMAP_PROGRESS.prefCount,
    mapColorMode,
    onMuniSelect: (pfName: string, muniName: string | null, code5?: string) => {
      // 地図で市区町村をクリックしたら、その自治体のダッシュボードへ直行する。
      // 以前は**甲府だけ**を名指しでダッシュボードへ送り、他は全部「市区町村選択」の一覧へ
      // 落としていた（全1,741市町村が決算ベースで見られるようになった後も残っていた）。
      // 地図は GeoJSON の5桁コードを持っているので、6桁へ変換すればどの自治体にも直行できる。
      if (!muniName) { nav({ screen: "muni", pref: pfName }); return; } // 「県全体」チップ
      // 政令市だけはコードが来ない（地図データに区の図形しか無く、市の図形＝コードが無い）。
      // 県内で名前から引く。ここで引けなくても muni 名で遷移し、県シャード取得後に
      // コード↔名前の相互解決が拾う（decision 冷リンクと同じ経路）。
      const code = code5 ? D.muniCode6(code5) : codeByPrefAndName(pfName, muniName);
      nav({ screen: "dash", pref: pfName, muni: muniName, muniCode: code, drillPath: [], theme: null, budgetFy: undefined });
    },
    searchQ: s.searchQ,
    openKofuLink: (e: any) => { if (e && e.preventDefault) e.preventDefault(); nav({ screen: "dash", muni: "甲府市", muniCode: "192015", pref: "山梨県", budgetFy: undefined }); },
    goTop: () => nav({ screen: "top" }), goMuniSelect: () => nav({ screen: "muni", muni: null, muniCode: undefined }),
    muniPrefName: prefName,
    // 市区町村選択画面: シャード取得中はローディング、全県が決算ベースで閲覧可
    muniLoading,
    muniIntro:
      prefName === "山梨県"
        ? `甲府市は当初予算ベースの詳細（主な事業・執行・評価・前年比較）まで収録。${muniEntries.filter((e) => D.tierOf(e.code) === "budget").map((e) => e.name).join("・")}は当初予算（款別・前年当初比較）まで、他の市町村は総務省の決算ベースで閲覧できます。`
        : muniEntries.some((e) => D.tierOf(e.code) === "budget")
          ? `${muniEntries.filter((e) => D.tierOf(e.code) === "budget").map((e) => e.name).join("・")}は当初予算（款別・前年当初比較）まで収録。他の市町村は総務省の決算ベースで閲覧できます。`
          : `${prefName}の市区町村は総務省の決算ベース（款別歳出・歳入内訳・1人あたり・類似比較）で閲覧できます。予算資料ベースの詳細は収録リクエストできます。`,
    // 「県全体（都道府県レベル）」ボタン。県の当初予算エンティティがあれば飛べる
    prefAllOpen: prefEntity
      ? () => nav({ screen: "dash", muni: prefEntity.muniName, muniCode: prefEntity.muniCode, pref: prefName, drillPath: [], theme: null, budgetFy: undefined })
      : () => {},
    prefAllBg: prefEntity ? "#FFFFFF" : prefUnrec.length > 0 ? "#FFF8F2" : "#F0F5F8",
    prefAllFg: prefEntity ? "#14181C" : prefUnrec.length > 0 ? "#8A4B1F" : "#8494A0",
    prefAllBd: prefEntity ? accent : prefUnrec.length > 0 ? "#EFD4BE" : "#DFE7EC",
    // 「準備中」は**これから手を付ける**という約束に読める。調べたうえで取れないと
    // 判定した県（山形・兵庫・沖縄）で出すと、いつまでも来ないものを待たせることになる
    prefAllBadge: prefEntity ? "当初予算 収録済" : prefUnrec.length > 0 ? "収録不可" : "準備中",
    prefAllNote: prefEntity
      ? `${prefName}（都道府県会計）の当初予算を款別で閲覧できます`
      : prefUnrec.length > 0
        ? `一次資料を調べたうえで収録できないと判定しています（${prefUnrec[0].checkedOn} 確認）`
        : "都道府県（県全体）レベルの会計データは未収録です",
    // 理由の全文は title に出す。**恒久の事実ではない**ので確認日を必ず添える
    prefAllTitle: prefUnrec.length > 0 ? unrecTitle(prefUnrec) : "",
    muniList,
    // 取れないと分かっている県ではリクエストを出さない（読者の手間を無駄にしない）
    prefRequestUrl: prefUnrec.length > 0 ? "" : prefRequestUrl,
    // 全市町村が最低でも決算ベースで閲覧可能になったので、空県カードは出さない
    prefIsEmpty: false,
    crumbPref: s.pref || "山梨県",
    // 都道府県エンティティは名前が県名そのものなので、そのまま出すと
    // 「日本 › 東京都 › 東京都」と同じ語が2回並ぶ。末尾は**この画面が何か**にする。
    // 中段（県名）は市区町村一覧へのリンクなので、2段に潰さず残す。
    // 語は /coverage の「〜（県全体）」に合わせる（都・道・府でも「県全体」で統一）
    // 取得待ちの間 `data` は甲府なので、名前は URL（s.muni）か索引から引く
    crumbMuni: isPref
      ? "県全体"
      : muniPending
        ? s.muni || (budgetMuni ? D.MUNI_BUDGET_INDEX[budgetMuni]?.muniName : "") || ""
        : data.name || s.muni || "甲府市",
    yearLabel,
    // 年度切り替え。full=当初予算(複数年)、budget=当初予算(1年)、decision=決算年度
    // 取得待ちの間は甲府の年度を並べない（選べる年度はまだ分からない）
    yearOptions: muniPending
      ? [{ value: "__pending", label: "読み込み中…" }]
      : isDecision
      ? [
          ...decisionView!.availableFys.map((fy) => ({ value: fy, label: D.DECISION_FY_LABELS[fy] ?? `${D.fyEraLabel(fy)} 決算` })),
          { value: "__request", label: "＋ 他の年度をリクエスト…" },
        ]
      : isBudget
        ? [
            ...muniBudgetYears!.map((b) => ({ value: b.fy, label: b.fyLabel })),
            { value: "__request", label: "＋ 他の年度をリクエスト…" },
          ]
        : [
            ...KOFU_BUDGET_YEARS.map((b) => ({ value: b.fy, label: b.fyLabel })),
            { value: "__request", label: "＋ 他の年度をリクエスト…" },
          ],
    yearSel: muniPending ? "__pending" : isDecision ? decisionView!.fy : isBudget ? muniBudget!.fy : budget.fy,
    pickYear: (fy: string) => {
      if (fy === "__request") {
        window.open(
          isDecision
            ? D.buildRequestUrl(
                `${data.name}の未収録年度の資料`,
                `年度リクエスト: ${prefName} ${data.name} の、総務省決算（R2〜R6）に無い年度を見たい`,
                data.name,
              )
            : isBudget
              ? D.buildRequestUrl(
                  `${data.name}の未収録年度の当初予算`,
                  `年度リクエスト: ${prefName} ${data.name} の、収録済み（${muniBudget!.fyLabel}）以外の年度を見たい`,
                  data.name,
                )
              : D.buildRequestUrl(
                  "当初予算・決算資料（未収録の年度）",
                  `年度リクエスト: 現在の収録（当初予算 R2〜R8・執行 R1〜R7）に無い年度を見たい`,
                ),
          "_blank",
          "noopener",
        );
        return; // 選択状態は変えない
      }
      setSt({ budgetFy: fy, drillPath: [], theme: null, execFy: undefined, reportNo: undefined });
    },
    navTabs,
    dashTitle: isDecision ? `${data.name}の決算` : `${data.name}の予算`,
    dashSubtitle: isDecision
      ? "普通会計 決算（総務省 市町村別決算状況調） ・ 款別歳出と歳入科目の内訳"
      : "一般会計 当初予算 ・ 歳入と歳出は同額で編成されます",
    totalFmt: fmtV(totalNow),
    totalFmtAnim: <CountUpNum value={totalNow} fmt={fmtV} />,
    yoy: data.yoy,
    // ⚠⚠ **budget 階層でも年度ごとの `prevBasis` を見る**（2026-08-24・収録レビューが下関 R8 で発見）。
    //   従来は budget を一律「当初比」と書いていたため、**前年度列が肉付補正後の年度で
    //   「対前年度（当初比）」と偽って出ていた**（下関 R8 の +4.7% は骨格＋6月肉付補正後との比）。
    //   ⚠ 前年比較画面は正しく注記まで出しており、**ダッシュボードだけが不整合**だった。
    //   ⚠⚠ **該当年度をここに列挙しない** — `public/munibudgets/*.json` の `prevBasis === "補正後"` が正で、
    //   grep で数えられる（2026-08-24 時点で9団体16年度）。**手書きの列挙は初日から腐る**（§2-3）:
    //   最初にこのコメントへ「札幌 R6/R2・徳島 R8・佐世保 H20・下関 R8」と書いたが、
    //   **徳島の補正後は R7/R3/H29/H25 であって R8 ではなく**、郡山・宮崎・高槻・大分・大津の12年度が漏れていた
    //   （収録レビューが実データで指摘）。
    yoyCaption: isDecision
      ? "対前年度（決算比）"
      : (isBudget ? muniBudget!.prevBasis : budget.prevBasis) === "補正後"
        ? "対前年度（補正後予算比）"
        : isBudget
          ? "対前年度（当初比）"
          : "対前年度",
    // 政策テーマ・注目の事業は主な事業一覧が要る full 専用
    // 注目の事業は full（甲府）＋budget（豊川・和泉）で出す。政策テーマは full 専用
    dashPanels, themeStrip: isFull ? themeStrip : [], featured: isFull || isBudget ? featured : [],
    // budget 階層の主な事業一覧（款のない和泉も含む）。full は款ドリル/テーマで見せる
    hasBudgetProjects: isBudget && budgetProjectRows.length > 0,
    budgetProjectRows,
    // 施策別グループ（山梨県）。空なら View は従来の一覧を出す
    budgetProjectGroups,
    hasBudgetProjectGroups: budgetProjectGroups.length > 0,
    budgetProjectsCountLabel: isBudget ? `全${projectsForDisplay.length}事業` : "",
    // ⚠ **主な事業が款別と別の資料から来る自治体がある**（#164・横浜の事業計画書）。
    //   款別の資料名を出すと**データと出典が食い違う**（レビューで発覚。ドリルだけ直して
    //   ダッシュボードが直っていなかった）。事業の refLabel が資料名を含むならそちらを出す。
    budgetProjectsSourceLabel: isBudget ? `出典：${dashProjSrcName || muniBudget!.sourceTitle}` : "",
    budgetProjectsSourceUrl: isBudget
      ? evHref(dashProjSrcUrl || muniBudget!.sourceLocalUrl)
      : "",
    budgetProjectsSourceAction: isBudget
      ? evAction(dashProjSrcUrl || muniBudget!.sourceLocalUrl)
      : "",
    // ⚠ **文言・href と「開く」を一致させる**（2巡目レビューで発覚。ドリルだけ直して
    //   ダッシュボードは href だけ差し替わり、クリックすると款別が開いていた）
    budgetProjectsSourceOpen: isBudget
      ? () =>
          openViewer({
            url: dashProjSrcUrl || muniBudget!.sourceLocalUrl,
            title: dashProjSrcName || muniBudget!.sourceTitle,
            sub: "主な事業",
            originUrl: muniBudget!.originUrl,
            archiveUrl: muniBudget!.sourceUrl,
          })
      : () => {},
    goThemes: () => nav({ screen: "themes" }),
    drillSideTabs, drillCrumbs, drillLevelLabel: depth === 0 ? "款" : "内訳",
    drillTitle: nodeName, drillTotalFmt: fmtOku(nodeTotal), drillDonutBg: donutBg(donutItems, hoverFor("drill")),
    drillRows, drillEvidence,
    // 款詳細の項テーブル: 表示中の予算年度と一致する統計書データ（当初→最終→決算）が
    // あればそれを出す。無い年度（R7・R8 = 決算前）は従来どおり R6 決算の項内訳を参考表示
    ...(() => {
      const outturn = isFull ? KOFU_OUTTURN_YEARS.find((y) => y.fy === budget.fy) : undefined;
      const oRows = side === "exp" && depth === 1 && outturn
        ? outturn.expenditure.filter((r) => r.kan === nodeName && r.kou != null)
        : [];
      const oKan = outturn?.expenditure.find((r) => r.kan === nodeName && r.kou == null);
      return {
        hasOutturn: oRows.length > 0,
        outturnFyLabel: outturn ? `${outturn.fyLabel}（統計書・確定）` : "",
        outturnInitialNote: outturn?.initialNote ?? "",
        outturnRows: oRows.map((r, i) => ({
          name: r.kou,
          initialFmt: r.initialOku != null ? fmtOku(r.initialOku) : "―",
          finalFmt: fmtOku(r.finalOku),
          settledFmt: fmtOku(r.settledOku),
          execFmt: r.execPct != null ? r.execPct.toFixed(1) + "%" : "―",
          sw: D.seriesColor(i),
          ref: r.ref,
        })),
        outturnKan: oKan
          ? {
              initialFmt: oKan.initialOku != null ? fmtOku(oKan.initialOku) : "―",
              finalFmt: fmtOku(oKan.finalOku),
              settledFmt: fmtOku(oKan.settledOku),
              execFmt: oKan.execPct != null ? oKan.execPct.toFixed(1) + "%" : "―",
            }
          : null,
        outturnSourceLabel: outturn ? `出典：${outturn.sourceTitle}` : "",
        outturnSourceUrl: outturn ? evHref(outturn.sourceLocalUrl) : "",
        outturnSourceAction: evAction(outturn?.sourceLocalUrl),
        outturnSourceOpen: outturn
          ? () => openViewer({
              url: outturn.sourceLocalUrl, title: outturn.sourceTitle, sub: `${outturn.fyLabel} 一般会計歳入歳出状況（歳出）`,
              originUrl: outturn.originUrl, archiveUrl: outturn.sourceUrl,
            })
          : null,
      };
    })(),
    // **款より下（項・目）の実データ**（#191・横浜）。**当該年度の当初予算そのもの**なので、
    // 下の R6 決算の参考表示（甲府）とは別物。両方が同時に立つことはない（甲府は full・横浜は budget）。
    // ⚠ 節・細節は出さない — 歳出の節は**性質別区分**で款項目の目的別とは軸が違い、
    //   款の下に並べると「目的別の内訳」と誤読させる（gen にも入れていない）。
    ...(() => {
      const detailYears = muniCode ? D.BUDGET_DETAIL[muniCode] : undefined;
      const entry = detailYears?.find((e) => e.fy === detailFy); // ⚠ 掘れる判定と同じキーで引く
      // ⚠ **款は depth 1 とは限らない** — 上位8款に入らなかった款は「その他」に畳まれて
      //   **depth 2** に落ちる（歳入で起きる。実測: 横浜 R4 の「財産収入」390億）。
      //   `depth === 1` だけで見ていたため、**収録済みなのに「未収録です」と出ていた**
      //   （#191 から在った穴。#192 で前年比が乗って実害の面積が広がりレビューが発見）。
      //   ⚠ 「その他」の子だけを許す — 単に depth 2 を許すと**項名が款名と衝突**しうる。
      const isKanNode = depth === 1 || (depth === 2 && s.drillPath[0] === "その他");
      const kos = entry && isKanNode ? entry.byKan[side === "exp" ? "expenditure" : "revenue"][nodeName] ?? [] : [];
      // ⚠ **画面に出る**（「この款の予算を項・目まで分解しています（款計 …）」）ので `sumOku`。
      //   素朴に足すと横浜 R5 歳入「地方特例交付金」が**見出し 52.5億円・款計 52.4億円**に割れた（#232）。
      const kanTotal = sumOku(kos.map((k) => k.v));
      // **前年比は資料が前年度列を持つ年度だけ**（#192・横浜 R5〜R3 の XLSX 版）。
      // ⚠ **前年度額は原典が当年度の科目体系に組み替えたもの**なので、
      //   「前の年度の画面に出ている当年度額」とは一致しない項がある（実測 115項中12項）。
      //   それでも**前年比としてはこちらが正しい**（同じ器で比べたもの）。
      const hasPrev = kos.some((k) => k.prevV != null);
      // 前年比の書式は compare 画面と同じ約束（+ / − と #0F76A3 / #C25400）
      const yoy = (v: number, prev: number | null) => {
        if (prev == null || prev === 0) return { fmt: "皆増", fg: "#5C6B77" };
        const g = (v / prev - 1) * 100;
        return { fmt: (g >= 0 ? "+" : "−") + Math.abs(g).toFixed(1) + "%", fg: g >= 0 ? "#0F76A3" : "#C25400" };
      };
      return {
        hasBudgetDetail: kos.length > 0,
        budgetDetailFyLabel: entry?.fyLabel ?? "",
        budgetDetailKanTotalFmt: fmtOku(kanTotal),
        budgetDetailHasPrev: hasPrev,
        budgetDetailRows: kos.map((k, i) => ({
          name: k.name,
          amtFmt: fmtOku(k.v),
          pctFmt: pctOf(k.v, kanTotal),
          barW: ((k.v / (kos[0]?.v || 1)) * 100).toFixed(1),
          sw: D.seriesColor(i),
          yoyFmt: hasPrev ? yoy(k.v, k.prevV).fmt : "",
          yoyFg: hasPrev ? yoy(k.v, k.prevV).fg : "",
          prevFmt: k.prevV == null ? "—" : fmtOku(k.prevV),
          // 目は多い項があるので、画面では項を開いたときだけ出す（View 側で details に入れる）
          moku: k.moku.map((m) => ({
            name: m.name, amtFmt: fmtOku(m.v), pctFmt: pctOf(m.v, k.v),
            yoyFmt: hasPrev ? yoy(m.v, m.prevV).fmt : "",
            yoyFg: hasPrev ? yoy(m.v, m.prevV).fg : "",
          })),
        })),
        budgetDetailSourceLabel: entry ? `出典：${entry.sourceTitle}（${entry.refLabel}）` : "",
        budgetDetailSourceUrl: entry ? evHref(entry.localUrl) : "",
        budgetDetailSourceAction: entry ? evAction(entry.localUrl) : "",
        budgetDetailSourceOpen: entry
          ? () => openViewer({
              url: entry.localUrl, title: entry.sourceTitle, sub: entry.refLabel,
              originUrl: entry.originUrl, archiveUrl: entry.archiveUrl,
            })
          : () => {},
      };
    })(),
    // R8 予算の項以下は原典未公開のため、R6 決算の項内訳を年度明示で参考表示する
    ...(() => {
      const rows = isFull && side === "exp" && depth === 1 ? KOFU_R6_DETAIL.byKan[nodeName] ?? [] : [];
      const kanTotal = sumOku(rows.map((r) => r.v)); // 「決算計 …」として画面に出る（#232）
      return {
        hasR6Detail: rows.length > 0,
        r6DetailFyLabel: KOFU_R6_DETAIL.fyLabel,
        r6DetailRows: rows.map((r, i) => ({
          name: r.name, amtFmt: fmtOku(r.v), pctFmt: pctOf(r.v, kanTotal),
          barW: ((r.v / (rows[0]?.v || 1)) * 100).toFixed(1),
          sw: D.seriesColor(i),
        })),
        r6DetailKanTotalFmt: fmtOku(kanTotal),
        r6DetailRequestUrl: D.buildRequestUrl(
          `予算書 本編（款項目節・${D.fyEraLabel(budget.fy)}）`,
          `款別ドリルダウンの「${nodeName}」で、${D.fyEraLabel(budget.fy)}予算の項別内訳を見たい（現在は直近決算の参考表示のみ）`,
        ),
        r6DetailSourceUrl: evHref(KOFU_R6_DETAIL.sourceLocalUrl),
        r6DetailSourceAction: evAction(KOFU_R6_DETAIL.sourceLocalUrl),
        r6DetailSourceOpen: () => openViewer({
          url: KOFU_R6_DETAIL.sourceLocalUrl, title: KOFU_R6_DETAIL.sourceTitle,
          sub: KOFU_R6_DETAIL.refLabel,
          originUrl: "https://www.soumu.go.jp/iken/zaisei/r06_shichouson.html", archiveUrl: KOFU_R6_DETAIL.sourceUrl,
        }),
        r6DetailSourceLabel: `出典：${KOFU_R6_DETAIL.sourceTitle} 目的別歳出内訳（${KOFU_R6_DETAIL.refLabel}）`,
      };
    })(),
    drillNoChildrenNote: depth > 0 && nodeItems.length === 0,
    // 款ドリル →「この款の事業報告（成果）」。**款項目を持つ資料だけ**（横浜のみ）。
    // 予算の款 → 事業 → 成果 を一本で繋ぐ。事業報告の款番号は**対象年度の予算**で
    // 款名に解決済み（derive 側。画面では推測しない）
    drillReports: (() => {
      if (side !== "exp" || depth !== 1 || !repData?.has.kanKoumoku) return null;
      /** 金額が入っている最後の年度（未確定の年度を代表値にしない） */
      const repLast = (r: (typeof repData.reports)[number]) =>
        [...r.cost].reverse().find((c) => c.jigyohi != null) ?? r.cost[r.cost.length - 1];
      const rows = repData.reports.filter((r) => r.kanName === nodeName);
      if (rows.length === 0) return null;
      const SHOW = 8;
      return {
        fyLabel: repData.fyLabel,
        docLabel: repData.docLabel,
        total: rows.length,
        shown: Math.min(SHOW, rows.length),
        // ⚠ **「決算額」と直書きしない** — 代表値に使う年度の語は資料で違う（杉並は予算/実績）
        sortLabel: `${repLast(rows[0]!)?.kind ?? "決算"}額`,
        // ⚠ **「最後の cost」を代表値にしてはいけない** — 杉並（#163）は最新年度の実績額が
        //   全件 `-`（評価年度なので未確定）で、素で取ると**金額が全行空になる**（実測）。
        //   **金額が入っている最後の年度**を代表にする。
        //   ⚠ **ラベルの「決算」も直書きしない** — 資料によって語が違う（杉並は 予算/実績）。
        rows: [...rows]
          .sort((a, b) => (repLast(b)?.jigyohi ?? 0) - (repLast(a)?.jigyohi ?? 0))
          .slice(0, SHOW)
          .map((r) => {
            const last = repLast(r);
            return {
              name: r.name,
              buka: r.buka,
              measure: r.measure,
              amtFmt: last?.jigyohi != null ? fmtV(last.jigyohi / 1e5) : "",
              fyLabel: last
                ? `${last.fy === repData.fy ? repData.fyLabel : D.fyEraLabel(last.fy)}${last.kind ?? "決算"}`
                : "",
              ref: evHref(r.ref),
              open: () =>
                openViewer({
                  url: r.ref,
                  title: repData.sourceTitle,
                  sub: `${r.name}（${r.refLabel}）`,
                  originUrl: repData.originUrl,
                  archiveUrl: repData.originUrl,
                }),
            };
          }),
      };
    })(),
    // 款ドリルの「この款の主な事業」（歳出・款レベル）。full=甲府 / budget=豊川（款あり）。
    // 和泉は款が取れない様式なので款ドリルには出さず、ダッシュボードの主な事業一覧で見せる
    ...(() => {
      const rows: any[] =
        side === "exp" && depth === 1
          ? isFull
            ? KOFU_PROJECTS.filter((p) => p.kan === nodeName)
            : isBudget
              ? muniBudget!.projects.filter((p) => p.kan === nodeName)
              : []
          : [];
      // ⚠ 差が `uncovered` として画面に出る。素朴に足すと**款を事業が100%覆うときに
      //   1e-13 の残差が残り**、`fmtOku` の象徴計上の枝に落ちて「**0円**」と出る（#232）。
      const covered = sumOku(rows.map((p) => p.amountOku));
      const uncovered = Math.max(0, nodeTotal - covered);
      // ⚠ **主な事業が款別と別の資料から来る自治体がある**（#164・横浜の事業計画書）。
      //   出典は款別の資料名ではなく**その事業の refLabel が指す資料**を出す
      const projTitle = isBudget ? muniBudget!.sourceTitle : KOFU_PROJECTS_SOURCE.title;
      // ⚠ refLabel が資料名を含まない自治体がある（甲府は `予算資料 p.14` という汎用文字列）。
      //   そのまま使うと**従来の資料名入りラベルから劣化する**（レビューで発覚）。
      //   → **款別と違う資料から来ているときだけ**差し替える
      const projRefName = rows[0]?.refLabel?.replace(/\s*p\.\d+$/, "") ?? "";
      const projSrcLabel = projRefName.length > 8 ? projRefName : projTitle;
      return {
        hasRealProjects: rows.length > 0,
        realProjects: rows.map((p) => ({
          evaluation: isFull ? evalFor(p) : null,
          no: p.no ?? null, kubun: p.kubun ?? "", name: p.name,
          bookName: p.budgetBookName ? `（${p.budgetBookName}）` : "",
          amountFmt: fmtOku(p.amountOku),
          desc: p.description ?? "",
          goal: p.basicGoal ?? "", shisaku: p.shisaku ?? "",
          refLabel: p.refLabel, refTitle: p.ref ?? "", refUrl: evHref(p.refLocalUrl),
          refOpen: () => openViewer({
            url: p.refLocalUrl, title: projTitle, sub: `主な事業 ${p.refLabel}`,
            originUrl: isBudget ? muniBudget!.originUrl : KOFU_PROJECTS_SOURCE.originUrl,
            archiveUrl: isBudget ? muniBudget!.sourceUrl : p.refUrl,
          }),
        })),
        realProjectsCoveredFmt: fmtOku(covered),
        realProjectsCoveredPct: nodeTotal > 0 ? ((covered / nodeTotal) * 100).toFixed(1) : "0",
        realProjectsCoveredBarW: nodeTotal > 0 ? Math.min(100, (covered / nodeTotal) * 100).toFixed(1) : "0",
        realProjectsUncoveredFmt: fmtOku(uncovered),
        uncoveredRequestUrl:
          isFull && uncovered > 0.005
            ? D.buildRequestUrl(
                `予算書 本編（款項目節・${D.fyEraLabel(budget.fy)}）`,
                `款別ドリルダウンの「${nodeName}」で、主な事業一覧に掲載のない ${fmtOku(uncovered)} の内訳（項・目・節、事業別）を知りたい`,
              )
            : "",
        realProjectsSourceUrl: evHref(
          projRefName.length > 8 && rows[0]?.refLocalUrl
            ? rows[0].refLocalUrl
            : isBudget
              ? muniBudget!.sourceLocalUrl
              : KOFU_PROJECTS_SOURCE.localUrl,
        ),
        realProjectsSourceAction: evAction(
          projRefName.length > 8 && rows[0]?.refLocalUrl
            ? rows[0].refLocalUrl
            : isBudget
              ? muniBudget!.sourceLocalUrl
              : KOFU_PROJECTS_SOURCE.localUrl,
        ),
        realProjectsSourceLabel: `出典：${projSrcLabel}`,
        // ⚠ **文言と開くものを一致させる**（data.ts の原則）。ラベルを事業の資料名にしたのに
        //   開くのが款別のままだった（レビューで発覚）
        realProjectsSourceOpen: () => openViewer({
          url:
            projRefName.length > 8 && rows[0]?.refLocalUrl
              ? rows[0].refLocalUrl
              : isBudget
                ? muniBudget!.sourceLocalUrl
                : KOFU_PROJECTS_SOURCE.localUrl,
          title: projSrcLabel, sub: "主な事業",
          originUrl: isBudget ? muniBudget!.originUrl : KOFU_PROJECTS_SOURCE.originUrl,
          archiveUrl: isBudget ? muniBudget!.sourceUrl : KOFU_PROJECTS_SOURCE.url,
        }),
      };
    })(),
    // 全体のエビデンス充足度（一般会計の款に属する主な事業の合計 vs 歳出総額）
    ...(() => {
      const general = isFull ? KOFU_PROJECTS.filter((p) => budget.expenditure.some((k) => k.name === p.kan)) : [];
      const covered = sumOku(general.map((p) => p.amountOku)); // #232（上と同じ理由）
      return {
        hasProjCoverage: general.length > 0,
        projCoverageCoveredFmt: fmtOku(covered),
        projCoverageCount: String(general.length),
        projCoveragePct: ((covered / budget.totalOku) * 100).toFixed(1),
        projCoverageBarW: Math.min(100, (covered / budget.totalOku) * 100).toFixed(1),
        projCoverageRestFmt: fmtOku(Math.max(0, budget.totalOku - covered)),
      };
    })(),
    // エビデンスは自サーバーのコピーをドロワーで開く（発行元・Wayback はドロワー内の補助リンク）
    viewer: s.viewer ?? null,
    closeViewer,
    drillPdfUrl: evHref(drillEvidenceLocalUrl),
    // ドリル画面の EVIDENCE リンク文言。**「予算書PDFを開く」で固定しない** — 要許可の資料は
    // 発行元の掲載ページ（HTML）へ振り替わり、コピー自体も Excel/CSV のことがある（2026-07-26）
    drillEvidenceAction: evOpenLabel(drillEvidenceLocalUrl, isDecision ? "決算資料" : "予算書"),
    dashSourceLabel: isDecision
      ? `出典：${decisionView!.primaryEvidence?.title ?? "総務省 市町村別決算状況調"}（${decisionView!.refLabel}）`
      : isBudget
        ? `出典：${muniBudget!.sourceTitle}${muniBudget!.expenditureEvidence ? " 歳入" : ""}`
        : `出典：${budget.sourceTitle} ${budget.pagesLabel}`,
    dashSourceUrl: evHref(dashEvidenceLocalUrl),
    // リンク文言（要許可の資料は「原本を開く」ではなく「発行元で開く」）
    dashSourceAction: evAction(dashEvidenceLocalUrl),
    // 分冊形式の budget 市だけ、ダッシュボードに歳出側の補助リンクを出す（#257）
    dashSourceExpUrl: isBudget && muniBudget!.expenditureEvidence ? evHref(muniBudget!.expenditureEvidence.localUrl) : "",
    dashSourceExpAction: isBudget && muniBudget!.expenditureEvidence ? evAction(muniBudget!.expenditureEvidence.localUrl) : "",
    dashSourceExpOpen:
      isBudget && muniBudget!.expenditureEvidence
        ? () => openViewer({
            url: muniBudget!.expenditureEvidence!.localUrl, title: `${muniBudget!.sourceTitle}（歳出）`,
            sub: `${muniBudget!.fyLabel} ・ 款別歳出`,
            originUrl: muniBudget!.expenditureEvidence!.originUrl, archiveUrl: muniBudget!.expenditureEvidence!.sourceUrl,
          })
        : () => {},
    // ドリル画面の EVIDENCE リンクの開く動作。分冊形式で歳出側に居るときだけ歳出のコピーを開く（#257）
    drillSourceOpen: drillExpEvidence
      ? () => openViewer({
          url: drillExpEvidence.localUrl, title: `${muniBudget!.sourceTitle}（歳出）`,
          sub: `${muniBudget!.fyLabel} ・ 款別歳出`,
          originUrl: drillExpEvidence.originUrl, archiveUrl: drillExpEvidence.sourceUrl,
        })
      : null,
    dashSourceTitle: isDecision ? decisionView!.primaryEvidence?.title ?? "総務省 市町村別決算状況調" : isBudget ? muniBudget!.sourceTitle : budget.sourceTitle,
    dashSourceOpen: isDecision
      ? (decisionView!.primaryEvidence
          ? () => openViewer({
              url: decisionView!.primaryEvidence!.localUrl,
              title: decisionView!.primaryEvidence!.title,
              sub: `${decisionView!.fyLabel} ・ ${decisionView!.refLabel}`,
              originUrl: "https://www.soumu.go.jp/iken/zaisei/r06_shichouson.html",
              archiveUrl: decisionView!.primaryEvidence!.url,
            })
          : () => {})
      : isBudget
        ? () => openViewer({
            url: muniBudget!.sourceLocalUrl, title: muniBudget!.sourceTitle,
            sub: `${muniBudget!.fyLabel} ・ 款別歳入歳出`,
            originUrl: muniBudget!.originUrl, archiveUrl: muniBudget!.sourceUrl,
          })
        : () => openViewer({
            // 表紙でなく款別一覧の先頭ページ（pagesLabel の最初の数値）から開く
            url: `${budget.sourceLocalUrl}#page=${budget.pagesLabel.match(/\d+/)?.[0] ?? 1}`,
            title: budget.sourceTitle, sub: `款別一覧 ${budget.pagesLabel}`,
            originUrl: budget.originUrl, archiveUrl: budget.sourceUrl,
          }),
    themesIntro: `${planInfo.plan}の基本目標（${GOALS.map((g) => `「${g.name}」`).join("")}）別に、予算資料「主な事業一覧」に掲載された${KOFU_PROJECTS.length}事業を、資料記載の基本目標・施策の紐付けどおりに集計しています。`,
    drillTipMove: mkDonutTip(donutItems, nodeTotal, data.pop, "drill"),
    drillSub: subV(nodeTotal),
    tipShow: !!(s.tip && s.tip.title), tipX: s.tip ? s.tip.x : 0, tipY: s.tip ? s.tip.y : 0,
    tipTitle: s.tip ? s.tip.title : "", tipSw: s.tip ? s.tip.sw : "#14181C",
    tipAmtLine: s.tip && s.tip.amt ? `${s.tip.amt}（${s.tip.pct}）` : "",
    tipDesc: s.tip ? s.tip.desc || "" : "",
    hideTip,
    gKan: mkGloss("款"),
    perCapitaLine: isPer
      ? `総額 ${fmtOku(totalNow)}`
      : `${capitaWho}1人あたり ${((totalNow * 1e8) / data.pop / 1e4).toFixed(1)}万円（${isDecision ? "住民基本台帳人口" : isBudget ? muniBudget!.populationLabel : budget.populationLabel} ${data.pop.toLocaleString()}人）`,
    unitTabs,
    unitLabel: isPer ? "1人あたり" : "総額",
    isSimilar: screen === "similar", isSources,
    // 全体ページとして開いた /sources ではアプリヘッダー（パンくず・年度・タブ・単位切替）を
    // 出さない。どれも自治体スコープのものなので、横断ページに載ると誤った文脈になる
    showAppHeader: !isGlobalSources,
    isGlobalSources,
    isCoverage,
    goCoverage: () => nav({ screen: "coverage", pref: null, muni: null, muniCode: undefined }),
    // データ整備状況: 全1,741市町村を都道府県ごとに ○× で網羅する単一の表。
    // 手付かずの自治体も必ず載せる（空欄＝ToDo が見えることがこのページの価値）。
    cov: (() => {
      const q = (s.covQ ?? "").trim();
      const openPrefs = s.covOpen ?? [];
      const d = covData;
      if (!d) return { loading: covLoading, error: covError, ready: false as const };
      const ents = d.entities;
      // 「調べたが収録できない」記録を団体コードで引けるようにする（表の印に添える）
      const unrecByCode = new Map<string, typeof d.unrecordable>();
      for (const u of d.unrecordable) {
        const list = unrecByCode.get(u.code) ?? [];
        list.push(u);
        unrecByCode.set(u.code, list);
      }
      // 検索は自治体名・都道府県名・団体コードに前方/部分一致（入力即時フィルタ）
      const hit = (name: string, code: string, pref: string) =>
        !q || name.includes(q) || pref.includes(q) || code.startsWith(q);
      // 都道府県エンティティ（県全体）の行かどうか。**名前の「（県全体）」でなく団体コードの
      // 構造で判定する** — JIS X 0402 の都道府県コードは `PP000C`（3〜5桁目が 000）で、
      // 市区町村がこの形を取ることはない。ラベルの文言が変わっても壊れない。
      const isPrefRow = (code: string) => code.slice(2, 5) === "000";
      // 「決算」列（総務省・決算状況調）は**市町村が対象**の調査なので、県全体エンティティに
      // 対しては構造的に存在しない。× を出すと「まだ手を付けていない ToDo」に読めるため
      // 対象外の印にする（リクエストの宛先からも外す）
      const isNA = (code: string, dsKey: string) => dsKey === "kessan" && isPrefRow(code);
      const budgetIdx = d.datasets.findIndex((ds) => ds.key === "budget");
      // 都道府県（県全体）の当初予算の到達度。**47件のアコーディオンを開かないと
      // 分からなかった**ので一覧の上にサマリとして出す（2026-07-28）。件数は数えず
      // ここで実データから算出する（手書きの数字は必ず実態とズレる）
      const prefEntities = d.prefs.map((p) => {
        const row = p.munis.find((m) => isPrefRow(m.c));
        const ok = row ? row.f[budgetIdx] === "1" : false;
        const unrec = row ? row.u[budgetIdx] === "1" : false;
        return {
          name: p.name,
          code: row?.c ?? "",
          ok,
          // 収録済みでも一部年度が収録できないことがある（トップの ○* と同じ）
          partial: ok && unrec,
          unrec: !ok && unrec,
          title: row
            ? (unrecByCode.get(row.c) ?? [])
                .filter((u) => u.dataset === "budget")
                .map((u) => `【${u.fyLabel}】${u.reason}（${u.checkedOn} 確認）`)
                .join("\n")
            : "",
        };
      });
      const prefSummary = {
        total: prefEntities.length,
        done: prefEntities.filter((p) => p.ok).length,
        unrec: prefEntities.filter((p) => p.unrec).length,
        todo: prefEntities.filter((p) => !p.ok && !p.unrec).length,
        items: prefEntities,
      };
      const groups = d.prefs
        .map((p) => {
          const prefMatched = !q || p.name.includes(q);
          const rows = p.munis.filter((m) => prefMatched || hit(m.n, m.c, p.name));
          return { pref: p, rows, prefMatched };
        })
        .filter((g) => g.rows.length > 0)
        .map((g) => {
          // 検索中はヒットした県を自動で開く（探して即見えるように）
          const open = q ? true : openPrefs.includes(g.pref.name);
          // 県全体エンティティは「1,741市町村の網羅」の外側なので、件数からも
          // 「市区町村 N団体」からも外す（導入文の 1,741 と Σ が合うようにする）
          const deep = g.rows.filter((m) => ents[m.c] && !isPrefRow(m.c)).length;
          // 検索の「N件」は**実際に出ている行の数**にする。市町村だけを数えると、
          // 県エンティティのコード（例 190004）で検索したときに行が1つ出ているのに
          // 「0件」と出る（見えているものと数が食い違う）
          const shown = g.rows.length;
          // 見出しの「県全体」印は**検索で絞られても変わらない**（その県の性質なので、
          // 絞り込みの結果でなく元の一覧から引く）
          const prefEnt = prefEntities.find((p) => p.name === g.pref.name)!;
          return {
            name: g.pref.name,
            code: g.pref.code,
            count: g.rows.filter((m) => !isPrefRow(m.c)).length,
            shown,
            deep,
            prefEnt,
            open,
            toggle: () =>
              setSt({
                covOpen: openPrefs.includes(g.pref.name)
                  ? openPrefs.filter((x) => x !== g.pref.name)
                  : [...openPrefs, g.pref.name],
              }),
            rows: open
              ? g.rows.map((m) => {
                  const e = ents[m.c];
                  // 未収録の列 → その場でリクエスト（＝この表がそのまま参加導線になる）。
                  // **「調べたが収録できない」と判定した列はリクエスト先から外す** — 資料の
                  // 事情で取れないものを ToDo として起票させるのは読者の手間を無駄にする
                  const missing = d.datasets.filter(
                    (ds, i) => m.f[i] !== "1" && m.u[i] !== "1" && !isNA(m.c, ds.key),
                  );
                  const missLabel = missing.map((x) => x.label).join("・");
                  const unrecOf = (key: string) => unrecByCode.get(m.c)?.filter((u) => u.dataset === key) ?? [];
                  return {
                    code: m.c,
                    name: m.n,
                    tier: e?.tier ?? null,
                    // 列ごとの ○×（true=収録済み）と、収録済みなら中身の説明。
                    // `unrec` があれば「まだ調べていない（×）」ではなく「調べたが収録できない」。
                    // `na` は「この団体には構造的に存在しないデータセット」（県全体の決算）
                    marks: d.datasets.map((ds, i) => ({
                      key: ds.key,
                      ok: m.f[i] === "1",
                      na: isNA(m.c, ds.key),
                      detail: e?.detail[ds.key] ?? "",
                      unrec: m.u[i] === "1" ? unrecOf(ds.key) : [],
                    })),
                    missingCount: missing.length,
                    missLabel,
                    requestUrl: missing.length
                      ? D.buildRequestUrl(
                          `${m.n}の${missLabel}の収録`,
                          `データ整備状況より: ${g.pref.name} ${m.n}（団体コード ${m.c}）の「${missing.map((x) => x.full).join("」「")}」が未収録。収録してほしい`,
                          m.n.replace(/（県全体）$/, ""),
                        )
                      : "",
                    sourceCount: e?.sources.length ?? 0,
                    sourcesOpen: s.covMuni === m.c,
                    toggleSources: () => setSt({ covMuni: s.covMuni === m.c ? null : m.c }),
                    sources: (e?.sources ?? []).map((src) => ({
                      ...src,
                      files: src.files.map((f) => ({
                        ...f,
                        // 要許可の資料は写しを開かず発行元へ出る（写しは残っているので
                        // ファイル名・ハッシュ・取得日はこれまでどおり開示する）
                        href: evHref(f.localUrl),
                        open: () =>
                          openViewer({
                            url: f.localUrl, title: src.title, sub: `${f.filename} ・ ${f.fetchedAt} 取得`,
                            originUrl: src.originUrl, archiveUrl: src.archiveUrl ?? src.originUrl,
                          }),
                      })),
                    })),
                  };
                })
              : [],
          };
        });
      const matched = groups.reduce((a, g) => a + g.shown, 0);
      return {
        ready: true as const,
        loading: false,
        error: null,
        summary: d.summary,
        datasets: d.datasets,
        q,
        setQ: (val: string) => setSt({ covQ: val }),
        groups,
        matched,
        // 都道府県（県全体）の当初予算の到達度。件数・内訳は実データから算出（上記）
        prefSummary,
        allOpen: openPrefs.length > 0 && !q,
        expandAll: () => setSt({ covOpen: d.prefs.map((p) => p.name) }),
        collapseAll: () => setSt({ covOpen: [] }),
        // ライセンス上の懸念（③の再配布に許諾が要る資料）
        permissionSources: [...Object.values(d.entities).flatMap((e) => e.sources), ...d.national].filter(
          (x) => x.licenseClass === "permission-required",
        ),
        national: d.national,
        unclassified: d.unclassified,
        // 「調べたが収録できなかった」記録。分類ごとにまとめて出す（原因の型が違えば
        // 打ち手も違うので、自治体順に並べるより分類で束ねたほうが読める）。
        // **件数は derive が registry から算出したもの**（ここで数え直さない）
        unrecCount: d.summary.unrecordableCount,
        unrecEntityCount: d.summary.unrecordableEntityCount,
        unrecGroups: d.unrecordableCategories
          .map((c) => ({
            ...c,
            // 主分類（categories の先頭）で束ねる。複数分類の記録は先頭の組にだけ出る
            items: d.unrecordable
              .filter((u) => u.categories[0] === c.key)
              .map((u) => ({
                ...u,
                // 分類ラベル（複数該当ならすべて）。key → label は derive が持っている
                catLabels: u.categories
                  .map((k) => d.unrecordableCategories.find((x) => x.key === k)?.label ?? k)
                  .join("・"),
              })),
          }))
          .filter((c) => c.items.length > 0),
      };
    })(),
    goSources: () => nav({ screen: "sources" }), goDash: () => nav({ screen: "dash" }),
    // 類似自治体との比較（軸で選ぶ）は simVals にまとめてある
    ...simVals,
    uncollected: D.UNCOLLECTED,
    requestListUrl: D.REQUEST_LIST_URL,
    sourceLabel,
    // --- データの注意 -------------------------------------------------------
    // 「この数値のここが不確か」を隠さずダッシュボードに出す。**手で書かない** —
    // validate の warning（＝検証ゲートが検出し、原典側の事情と説明できるもの）をそのまま出す。
    // 表示年度に関わらずその自治体の全資料ぶんを出す（年度を切り替えて初めて効く注意もあるため）。
    caveats: (() => {
      const list = muniCode ? CAVEATS[muniCode] ?? [] : [];
      if (list.length === 0) return null;
      return {
        count: list.length,
        items: list.map((c) => ({
          fyLabel: D.fyEraLabel(c.fy),
          title: c.title,
          plain: c.plain, // 市民向けの一行（未知のパターンは null）
          message: c.message, // 検証の原文。丸めず併記する
        })),
      };
    })(),
    // --- 事業報告（成果）の全量公開（川崎 572件）------------------------------
    // 甲府の `report`（公表サンプル5件・A〜F の総合評価）とは**別のセクション**にする。
    // 評価体系が違う（川崎は達成度1〜5＋方向性Ⅰ〜Ⅴ で、**達成度は数字が小さいほど良い**＝
    // A〜F と向きが逆）ので、既存のバッジへ丸めると意味が反転する。
    repAll: (() => {
      if (!reportMuni) return null;
      if (!repData) return { ready: false as const, loading: repLoading, error: repError };
      const q = (s.repQ ?? "").trim();
      const rows = repData.reports.filter(
        (r) => !q || r.name.includes(q) || r.buka.includes(q) || r.policy.includes(q) || r.measure.includes(q) || r.code.startsWith(q),
      );
      const PER = 20;
      const pages = Math.max(1, Math.ceil(rows.length / PER));
      const page = Math.min(Math.max(1, s.repPage ?? 1), pages);
      const start = (page - 1) * PER;
      // 評価年度の決算（見込み含む）を代表値にする。無ければ同年度の予算。
      // それも無い資料（横浜の R7 評価はコストが R5・R6 決算のみ）は**最新年度の決算**へ
      // フォールバックする — 評価年度決め打ちだと横浜の全行で金額が出ない（2026-07-16 修正）
      const pick = (r: (typeof repData.reports)[number]) => {
        const fy = repData.fy;
        return (
          r.cost.find((c) => c.fy === fy && c.kind === "決算") ??
          r.cost.find((c) => c.fy === fy && c.kind === "予算") ??
          [...r.cost].reverse().find((c) => c.kind === "決算") ??
          r.cost[r.cost.length - 1] ??
          null
        );
      };
      return {
        ready: true as const,
        loading: false,
        error: null,
        muniName: repData.muniName,
        fyLabel: repData.fyLabel,
        // 総コストの説明。⚠ **算定式は資料ごとに違う**ので文面を使い回さない（#163）
        costNote: !repData.has.totalCost
          ? ""
          : repData.has.ninku
            ? "総コストは事業費＋人件費（職員1人当たり人件費 × 人工）です。"
            : "総コストは事業費＋人件費です。",
        sourceTitle: repData.sourceTitle,
        docLabel: repData.docLabel,
        // 評価様式の説明（カテゴリ評価を持たない資料のみ・derive が資料ごとに書く）
        evalNote: repData.evalNote ?? null,
        excluded: repData.excluded,
        has: repData.has,
        // **その資料が持つ項目だけを並べる**（川崎の文面を横浜に使い回すと嘘になる）
        holds: [
          // ⚠ **「事業費」を決め打ちしない** — 原典が事業ごとの金額を持たない資料がある
          // （京都府は金額が款・項・目の単位で、施策ごとの決算額は執行額を書いた施策だけ）。
          // 決め打ちだと「事業ごとに事業費が載っています」が嘘になる（川崎の文面を横浜へ
          // 使い回しかけた §derive の has 参照と同じ型の事故）。
          ...(repData.has.jigyohiAll
            ? ["事業費"]
            : repData.has.jigyohiSome
              ? ["事業費（原典が記載している事業のみ）"]
              : []),
          ...(repData.has.jinkenhi ? ["人件費"] : []),
          ...(repData.has.totalCost ? ["総コスト（人件費込み）"] : []),
          ...(repData.has.achievement ? ["達成度"] : []),
          ...(repData.has.progress ? ["進捗評価"] : []),
          ...(repData.has.direction ? ["今後の方向性"] : []),
          // ⚠ 京都府は**款だけ**（項・目は原典にあるが取りこぼしが避けられず落とした）。
          //   「款・項・目」と決め打ちすると嘘になるので、資料が持つ深さで振り替える。
          ...(repData.has.kanKoumokuFull
            ? ["歳出予算科目（款・項・目）"]
            : repData.has.kanKoumoku
              ? ["歳出予算科目（款）"]
              : []),
        ].join("・"),
        total: repData.reports.length,
        hits: rows.length,
        page,
        pages,
        from: rows.length === 0 ? 0 : start + 1,
        to: Math.min(start + PER, rows.length),
        q,
        setQ: (val: string) => setSt({ repQ: val, repPage: 1 }),
        setPage: (n: number) => setSt({ repPage: Math.min(Math.max(1, n), pages) }),
        achievementLabels: repData.achievementLabels,
        directionLabels: repData.directionLabels,
        // 金額は総額/1人あたりトグルに追従させる（成果指標は金額でないので per capita 化しない）。
        // シャードは千円なので億円へ直してから既存の整形に通す
        fmt: (thousandYen: number) => fmtV(thousandYen / 1e5),
        // 達成度の分布（発行元の集計と一致することを確認済み）。1が最良
        dist: Object.entries(repData.achievementCounts)
          .sort((a, b) => Number(a[0]) - Number(b[0]))
          .map(([k, n]) => ({
            k,
            n,
            label: repData.achievementLabels[k] ?? k,
            pct: ((n / repData.reports.length) * 100).toFixed(1),
          })),
        rows: rows.slice(start, start + PER).map((r) => {
          const c = pick(r);
          return {
            code: r.code,
            name: r.name,
            buka: r.buka,
            policy: r.policy,
            measure: r.measure,
            achievement: r.achievement,
            achievementLabel: r.achievement != null ? repData.achievementLabels[String(r.achievement)] ?? "" : "",
            progress: r.progress,
            direction: r.direction,
            directionLabel: r.direction ? repData.directionLabels[r.direction] ?? "" : "",
            // 表示金額。単位トグルに追従させる（金額なので per capita 化してよい）。
            // 総コスト（人件費込み）を持たない資料（横浜は事業費のみ）では事業費へフォールバック
            // する — totalCost 決め打ちだと横浜の全2,313行で金額列が空になる（2026-07-16 修正）
            amount: c?.totalCost ?? c?.jigyohi ?? null,
            amountKind: c?.totalCost != null ? "総コスト" : "事業費",
            // 年度はフォールバック先の行自身のもので表示する（評価年度と一致するとは限らない）
            costLabel: c ? `${c.fy === repData.fy ? repData.fyLabel : D.fyEraLabel(c.fy)}${c.kind}${c.est ? "（見込）" : ""}` : "",
            // href にも入れる（onClick だけだと中クリック・キーボードでリンクとして扱えない）。
            // 要許可の資料は発行元のディープリンクへ振り替わる
            ref: evHref(r.ref),
            refLabel: r.refLabel,
            open: () =>
              openViewer({
                url: r.ref,
                title: repData.sourceTitle,
                sub: `${r.name}（${r.refLabel}）`,
                originUrl: repData.originUrl,
                archiveUrl: repData.originUrl,
              }),
          };
        }),
      };
    })(),
    // --- /roadmap（進捗と計画）---------------------------------------------
    // 進捗の数字は **roadmap.gen.ts が実データから算出したもの**（手書きの数字は無い）。
    // 計画だけが手書き（pipeline/registry/roadmap.ts）。ここでは並べ替えと表示整形のみ行う
    isRoadmap,
    goRoadmap: () => nav({ screen: "roadmap", pref: null, muni: null, muniCode: undefined }),
    rm: (() => {
      const p = ROADMAP_PROGRESS;
      const label: Record<string, string> = {
        kessan: "決算", budget: "当初予算", projects: "主な事業", report: "事業報告（成果）",
        council: "議会の構成", execution: "予算執行", evaluation: "事務事業評価", outturn: "統計書 款項",
      };
      return {
        progress: p,
        // 甲府（full）で何がどこまで収録できているか＝「1自治体を深く掘るとどうなるか」の見本
        kofuRows: Object.entries(p.kofuDetail).map(([k, v]) => ({ label: label[k] ?? k, detail: v as string })),
        // 当初予算を複数年度収録している自治体（年度の多い順）
        depth: p.budgetDepth,
        groups: (["now", "next", "later"] as const).map((st) => ({
          status: st,
          title: { now: "着手している", next: "次にやる", later: "その先" }[st],
          note: {
            now: "いま手を動かしているもの",
            next: "前提が揃っていて、次に着手するもの",
            later: "やりたいが、前提が未確定 or 発行元の判断待ちのもの",
          }[st],
          items: ROADMAP_PLAN.filter((r) => r.status === st),
        })),
      };
    })(),
    // データ出典: **収録している全資料**を出す。以前は data.ts の SOURCES（甲府市＋総務省だけを
    // 手で並べた配列）を使っており、budget 階層18団体の資料が1件も載っていなかった
    // （2026-07-15 修正）。coverage.json はレジストリと魚拓台帳から自動生成されるので、
    // 資料を足せば黙って増える＝実態とズレない。
    src: (() => {
      const d = covData;
      if (!d) return { loading: covLoading, error: covError, ready: false as const };
      const all = [
        ...Object.values(d.entities).flatMap((e) => e.sources),
        ...d.national,
        ...d.unclassified,
      ];
      const q = (s.srcQ ?? "").trim();
      // 資料名・発行元・年度・使用箇所に部分一致（入力即時フィルタ）
      const rows = all.filter(
        (c) => !q || c.title.includes(q) || c.publisher.includes(q) || c.fiscalYear.includes(q) || c.used.includes(q),
      );
      const PER = 25;
      const pages = Math.max(1, Math.ceil(rows.length / PER));
      const page = Math.min(Math.max(1, s.srcPage ?? 1), pages); // 検索で件数が減ったら範囲内へ丸める
      const start = (page - 1) * PER;
      const view = rows.slice(start, start + PER);
      return {
        ready: true as const,
        loading: false,
        error: null,
        total: all.length,
        hits: rows.length,
        page,
        pages,
        from: rows.length === 0 ? 0 : start + 1,
        to: Math.min(start + PER, rows.length),
        q,
        setQ: (val: string) => setSt({ srcQ: val, srcPage: 1 }), // 検索したら1ページ目へ
        setPage: (n: number) => setSt({ srcPage: Math.min(Math.max(1, n), pages) }),
        rows: view.map((c) => {
          const f = c.files[0];
          return {
            sourceId: c.sourceId,
            title: c.title,
            type: c.kind === "pdf" ? "PDF" : c.kind === "html" ? "Web" : c.kind === "excel" ? "Excel" : c.kind,
            org: c.publisher,
            fy: c.fiscalYear,
            date: f?.fetchedAt ?? "",
            used: c.used,
            licenseClass: c.licenseClass,
            localUrl: f?.localUrl ?? null,
            href: f?.localUrl ? evHref(f.localUrl) : null,
            action: evAction(f?.localUrl),
            originUrl: c.originUrl,
            archiveUrl: c.archiveUrl,
            // ドロワーで自サーバーの原本コピーを開く（エビデンス3層の③。発行元・魚拓は補助リンク）。
            // 要許可の資料だけは openViewer が発行元（魚拓）へのディープリンクに振り替える
            open: f?.localUrl
              ? () =>
                  openViewer({
                    url: f.localUrl,
                    title: c.title,
                    sub: `${c.publisher}・${c.fiscalYear}`,
                    originUrl: c.originUrl,
                    archiveUrl: c.archiveUrl ?? c.originUrl,
                  })
              : null,
          };
        }),
      };
    })(),
    themeCards, ...themeVals,
    compTabs, compRows,
    // 前年ラベル。full=甲府 or budget=類似4市（compSrc）の年度・基準を使う。
    // R2 の前年（令和元年度）は「6月補正後予算額」との比較なので基準を明示する。
    // 年号またぎ（R2→令和元・H31 等）は D.prevFyEraLabel が吸収する
    compPrevLabel:
      D.prevFyEraLabel(compSrc.fy) +
      (compSrc.prevBasis === "補正後" ? "（補正後予算額）" : ""),
    compCurLabel: D.fyEraLabel(compSrc.fy),
    // 比較の基準を文章でも言う。**「前年度当初額を使用」と決め打ちしない** — 前年度列が当初でない
    // 資料がある（甲府 R2 の6月補正後・札幌 R6/R2 の骨格予算→肉付後）。基準と文章が食い違うと
    // 「補正後予算額」ラベルの隣で「当初額を使用」と書く自己矛盾になる（2026-07-15 修正）
    compBasisNote:
      compSrc.prevBasis === "補正後"
        ? "前年度は当初額ではなく補正後予算額"
        : "予算資料の前年度当初額を使用",
    // 表の末尾の脚注も同じ基準で出し分ける（2026-08-22・大分 R6/R2 で露出。見出し側だけ直して脚注が「当初予算同士」の
    // ままだった＝上と同じ自己矛盾）
    compFootNote:
      compSrc.prevBasis === "補正後"
        ? "増減は前年度の補正後予算額との比較。行をクリックすると款の内訳へ移動します。"
        : "増減は当初予算同士の比較。行をクリックすると款の内訳へ移動します。",
    // 前年度列の資料注記（甲府 R6:「※令和5年度当初予算額は6月補正の政策的予算を含む」）
    compPrevNote: (compSrc as { prevNote?: string }).prevNote ? `※資料注記: ${(compSrc as { prevNote?: string }).prevNote}` : "",
    compPrevTotal: fmtV(compPrevSum), compCurTotal: fmtV(compCurSum), compSub: subV(compCurSum),
    compTotalDelta: (compDelta >= 0 ? "+" : "−") + fmtV(Math.abs(compDelta)),
    compTotalPct: (compDelta >= 0 ? "+" : "−") + ((Math.abs(compDelta) / compPrevSum) * 100).toFixed(1) + "%",
    compTotalFg: compDelta >= 0 ? "#0F76A3" : "#C25400",
  };

  return <BudgetTraceView v={v} />;
}

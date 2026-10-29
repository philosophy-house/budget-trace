// このファイルは自動生成です。手で編集しないこと。
// 再生成: bun run pipeline:derive（pipeline/derive-app-data.ts）
// 出典: 甲府市議会 所属会派別議員名簿（各予算の議決時点のバージョン）＋各年3月定例会 審議結果。
// 会派構成は名簿の更新日でバージョンを固定（過去分は Wayback スナップショット）。
// 甲府の賛否は R7・R8 を議員別表決結果一覧から収録。ほかの年度は審議結果のページに表へのリンクが無く未収録（votesTable で書き分ける）。

export interface CouncilFaction {
  name: string;
  seats: number;
  isIndependent: boolean;
}
export interface CouncilEvidence {
  title: string;
  /** 自サーバー配信の原本コピー（③・サンドボックス iframe で開く） */
  localUrl: string;
  /** 発行元（①） */
  originUrl: string;
  /** Wayback 魚拓（②） */
  archiveUrl: string;
}
export interface Council {
  /** 予算年度（この議会が議決した当初予算の年度。"R8" など） */
  fy: string;
  fyLabel: string;
  /** 議会名 */
  body: string;
  /** 現員（＝会派議席合計）。甲府は定数＝現員 */
  seats: number;
  /** 条例定数（原典で確かめた団体だけ。欠員があると seats より大きい） */
  teisu?: number;
  /** 会派構成の基準日 ISO（名簿の更新日） */
  asOf: string;
  asOfLabel: string;
  factions: CouncilFaction[];
  resolution: {
    billNo: string;
    billName: string;
    sessionLabel: string;
    decidedDate: string;
    decidedDateLabel: string;
    result: string;
  };
  sourceTitle: string;
  roster: CouncilEvidence;
  result: CouncilEvidence;
  /**
   * 当初予算の議決での賛否（甲府以外・原典で公表している議会だけ）。basis は原典の賛否表の列の単位
   * （member＝議員ごと、faction＝会派ごと。会派単位の表は会派の全員を同じ賛否として数える）
   */
  votes?: {
    basis: "member" | "faction";
    unanimousText?: string;
    stances: string[];
    tally: Record<string, number>;
    byFaction: { faction: string; counts: Record<string, number>; members: { name: string; stance: string }[] }[];
    source: CouncilEvidence;
  };
  /** 予算の議決が複数の採決に分かれる議会（修正可決: 修正案・修正部分を除く原案）の採決ごとの賛否 */
  voteParts?: {
    part: string;
    basis: "member" | "faction";
    /** 原典が「全会一致」の語だけで示した採決（数は議席から出したもの）。その原文 */
    unanimousText?: string;
    stances: string[];
    tally: Record<string, number>;
    byFaction: { faction: string; counts: Record<string, number>; members: { name: string; stance: string }[] }[];
    source: CouncilEvidence;
  }[];
  /**
   * 甲府だけ: 審議結果のページにある議員ごとの賛否の表（議員別表決結果一覧）。賛否そのものは未収録で、
   * 画面の注記を「非公表」と書かないための有無（R7・R8 にあり、R2〜R6 の審議結果のページには無い）
   */
  votesTable?: { title: string; originUrl: string } | null;
  /** 参考リンク（会議録検索・議会だより）。甲府だけが持つ */
  minutesUrl: string | null;
  newsletterUrl: string | null;
}
/** 互換の別名（甲府） */
export type KofuCouncil = Council;

/** 甲府市議会の構成（予算議決時）。新しい年度順（R8→R2）。 */
export const KOFU_COUNCIL_YEARS: Council[] = [
  {
    "fy": "R8",
    "fyLabel": "令和8年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2025-05-01",
    "asOfLabel": "2025年5月1日",
    "factions": [
      {
        "name": "政和こうふ",
        "seats": 10,
        "isIndependent": false
      },
      {
        "name": "こうふ明水会",
        "seats": 5,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 3,
        "isIndependent": false
      },
      {
        "name": "政友クラブ",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "市民クラブ",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "無所属（山田弘之）",
        "seats": 1,
        "isIndependent": true
      },
      {
        "name": "無所属（村松裕美）",
        "seats": 1,
        "isIndependent": true
      }
    ],
    "resolution": {
      "billNo": "議案第5号",
      "billName": "令和8年度甲府市一般会計予算",
      "sessionLabel": "令和8年3月定例会",
      "decidedDate": "2026-03-25",
      "decidedDateLabel": "令和8年3月25日",
      "result": "可決"
    },
    "sourceTitle": "令和8年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r8/h270512kaihabetu.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20260714124525/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和8年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r8/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0803/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20260714124615/https://www.city.kofu.yamanashi.jp/gijichosa/r0803/shingikekka.html"
    },
    "votesTable": {
      "title": "議員別表決結果一覧",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0803/documents/r8-3hyouketsu2.pdf"
    },
    "votes": {
      "basis": "faction",
      "stances": [
        "賛成",
        "反対",
        "議長"
      ],
      "tally": {
        "賛成": 25,
        "議長": 1,
        "反対": 6
      },
      "byFaction": [
        {
          "faction": "政和こうふ",
          "counts": {
            "賛成": 9,
            "議長": 1
          },
          "members": [
            {
              "name": "岡政吉",
              "stance": "議長"
            }
          ]
        },
        {
          "faction": "こうふ明水会",
          "counts": {
            "賛成": 5
          },
          "members": []
        },
        {
          "faction": "公明党",
          "counts": {
            "賛成": 4
          },
          "members": []
        },
        {
          "faction": "こうふ未来",
          "counts": {
            "賛成": 4
          },
          "members": []
        },
        {
          "faction": "日本共産党",
          "counts": {
            "反対": 3
          },
          "members": []
        },
        {
          "faction": "政友クラブ",
          "counts": {
            "賛成": 2
          },
          "members": []
        },
        {
          "faction": "市民クラブ",
          "counts": {
            "反対": 2
          },
          "members": []
        },
        {
          "faction": "無所属（山田弘之）",
          "counts": {
            "賛成": 1
          },
          "members": [
            {
              "name": "山田弘之",
              "stance": "賛成"
            }
          ]
        },
        {
          "faction": "無所属（村松裕美）",
          "counts": {
            "反対": 1
          },
          "members": [
            {
              "name": "村松裕美",
              "stance": "反対"
            }
          ]
        }
      ],
      "source": {
        "title": "令和8年3月定例会 議員別表決結果一覧",
        "localUrl": "/sources/kofu-gikai-r8/r8-3hyouketsu2.pdf",
        "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0803/documents/r8-3hyouketsu2.pdf",
        "archiveUrl": "https://web.archive.org/web/20260714124639/https://www.city.kofu.yamanashi.jp/gijichosa/r0803/documents/r8-3hyouketsu2.pdf"
      }
    },
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R7",
    "fyLabel": "令和7年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2023-11-28",
    "asOfLabel": "2023年11月28日",
    "factions": [
      {
        "name": "政和こうふ",
        "seats": 10,
        "isIndependent": false
      },
      {
        "name": "政友クラブ",
        "seats": 7,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 3,
        "isIndependent": false
      },
      {
        "name": "市民クラブ",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "無所属（山田弘之）",
        "seats": 1,
        "isIndependent": true
      },
      {
        "name": "無所属（村松裕美）",
        "seats": 1,
        "isIndependent": true
      }
    ],
    "resolution": {
      "billNo": "議案第2号",
      "billName": "令和7年度甲府市一般会計予算",
      "sessionLabel": "令和7年3月定例会",
      "decidedDate": "2025-03-25",
      "decidedDateLabel": "令和7年3月25日",
      "result": "可決"
    },
    "sourceTitle": "令和7年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r7/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20240910021519id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20240910021519id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和7年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r7/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0703/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20260714133655/https://www.city.kofu.yamanashi.jp/gijichosa/r0703/shingikekka.html"
    },
    "votesTable": {
      "title": "議員別表決結果一覧",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0703/documents/r7-3hyouketsur.pdf"
    },
    "votes": {
      "basis": "faction",
      "stances": [
        "賛成",
        "反対",
        "欠席",
        "議長"
      ],
      "tally": {
        "賛成": 25,
        "議長": 1,
        "欠席": 1,
        "反対": 5
      },
      "byFaction": [
        {
          "faction": "政和こうふ",
          "counts": {
            "賛成": 10
          },
          "members": []
        },
        {
          "faction": "政友クラブ",
          "counts": {
            "賛成": 6,
            "議長": 1
          },
          "members": [
            {
              "name": "長沼達彦",
              "stance": "議長"
            }
          ]
        },
        {
          "faction": "公明党",
          "counts": {
            "欠席": 1,
            "賛成": 3
          },
          "members": [
            {
              "name": "兵道顕司",
              "stance": "欠席"
            }
          ]
        },
        {
          "faction": "こうふ未来",
          "counts": {
            "賛成": 4
          },
          "members": []
        },
        {
          "faction": "日本共産党",
          "counts": {
            "反対": 3
          },
          "members": []
        },
        {
          "faction": "市民クラブ",
          "counts": {
            "反対": 2
          },
          "members": []
        },
        {
          "faction": "無所属（山田弘之）",
          "counts": {
            "賛成": 1
          },
          "members": [
            {
              "name": "山田弘之",
              "stance": "賛成"
            }
          ]
        },
        {
          "faction": "無所属（村松裕美）",
          "counts": {
            "賛成": 1
          },
          "members": [
            {
              "name": "村松裕美",
              "stance": "賛成"
            }
          ]
        }
      ],
      "source": {
        "title": "令和7年3月定例会 議員別表決結果一覧",
        "localUrl": "/sources/kofu-gikai-r7/r7-3hyouketsur.pdf",
        "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0703/documents/r7-3hyouketsur.pdf",
        "archiveUrl": "https://web.archive.org/web/20260714133721/https://www.city.kofu.yamanashi.jp/gijichosa/r0703/documents/r7-3hyouketsur.pdf"
      }
    },
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R6",
    "fyLabel": "令和6年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2023-11-28",
    "asOfLabel": "2023年11月28日",
    "factions": [
      {
        "name": "政和こうふ",
        "seats": 10,
        "isIndependent": false
      },
      {
        "name": "政友クラブ",
        "seats": 7,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 3,
        "isIndependent": false
      },
      {
        "name": "市民クラブ",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "無所属（山田弘之）",
        "seats": 1,
        "isIndependent": true
      },
      {
        "name": "無所属（村松裕美）",
        "seats": 1,
        "isIndependent": true
      }
    ],
    "resolution": {
      "billNo": "議案第2号",
      "billName": "令和6年度甲府市一般会計予算",
      "sessionLabel": "令和6年3月定例会",
      "decidedDate": "2024-03-25",
      "decidedDateLabel": "令和6年3月25日",
      "result": "可決"
    },
    "sourceTitle": "令和6年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r6/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20231202080331id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20231202080331id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和6年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r6/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0603/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20260513161136/https://www.city.kofu.yamanashi.jp/gijichosa/r0603/shingikekka.html"
    },
    "votesTable": null,
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R5",
    "fyLabel": "令和5年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2022-05-30",
    "asOfLabel": "2022年5月30日",
    "factions": [
      {
        "name": "政友クラブ",
        "seats": 10,
        "isIndependent": false
      },
      {
        "name": "創政こうふ",
        "seats": 9,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 5,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "社会民主党",
        "seats": 1,
        "isIndependent": false
      },
      {
        "name": "無所属（山田弘之）",
        "seats": 1,
        "isIndependent": true
      }
    ],
    "resolution": {
      "billNo": "議案第1号",
      "billName": "令和5年度甲府市一般会計予算",
      "sessionLabel": "令和5年3月定例会",
      "decidedDate": "2023-03-23",
      "decidedDateLabel": "令和5年3月23日",
      "result": "可決"
    },
    "sourceTitle": "令和5年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r5/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20221129001525id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20221129001525id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和5年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r5/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0503/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20260116054107/https://www.city.kofu.yamanashi.jp/gijichosa/r0503/shingikekka.html"
    },
    "votesTable": null,
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R4",
    "fyLabel": "令和4年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2021-05-13",
    "asOfLabel": "2021年5月13日",
    "factions": [
      {
        "name": "政友クラブ",
        "seats": 10,
        "isIndependent": false
      },
      {
        "name": "創政こうふ",
        "seats": 9,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 5,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "こうふクラブ",
        "seats": 2,
        "isIndependent": false
      }
    ],
    "resolution": {
      "billNo": "議案第3号",
      "billName": "令和4年度甲府市一般会計予算",
      "sessionLabel": "令和4年3月定例会",
      "decidedDate": "2022-03-24",
      "decidedDateLabel": "令和4年3月24日",
      "result": "可決"
    },
    "sourceTitle": "令和4年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r4/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20211130030844id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20211130030844id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和4年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r4/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0403/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20260610022754/https://www.city.kofu.yamanashi.jp/gijichosa/r0403/shingikekka.html"
    },
    "votesTable": null,
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R3",
    "fyLabel": "令和3年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2019-08-02",
    "asOfLabel": "2019年8月2日",
    "factions": [
      {
        "name": "政友クラブ",
        "seats": 11,
        "isIndependent": false
      },
      {
        "name": "創政こうふ",
        "seats": 8,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 5,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "こうふクラブ",
        "seats": 2,
        "isIndependent": false
      }
    ],
    "resolution": {
      "billNo": "議案第1号",
      "billName": "令和3年度甲府市一般会計予算",
      "sessionLabel": "令和3年3月定例会",
      "decidedDate": "2021-03-23",
      "decidedDateLabel": "令和3年3月23日",
      "result": "可決"
    },
    "sourceTitle": "令和3年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r3/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20191114183718id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20191114183718id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和3年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r3/shingikekka.html",
      "originUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/r0303/shingikekka.html",
      "archiveUrl": "https://web.archive.org/web/20240227080640/https://www.city.kofu.yamanashi.jp/gijichosa/r0303/shingikekka.html"
    },
    "votesTable": null,
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  },
  {
    "fy": "R2",
    "fyLabel": "令和2年度 当初予算",
    "body": "甲府市議会",
    "seats": 32,
    "asOf": "2019-08-02",
    "asOfLabel": "2019年8月2日",
    "factions": [
      {
        "name": "政友クラブ",
        "seats": 11,
        "isIndependent": false
      },
      {
        "name": "創政こうふ",
        "seats": 8,
        "isIndependent": false
      },
      {
        "name": "公明党",
        "seats": 5,
        "isIndependent": false
      },
      {
        "name": "こうふ未来",
        "seats": 4,
        "isIndependent": false
      },
      {
        "name": "日本共産党",
        "seats": 2,
        "isIndependent": false
      },
      {
        "name": "こうふクラブ",
        "seats": 2,
        "isIndependent": false
      }
    ],
    "resolution": {
      "billNo": "議案第1号",
      "billName": "令和2年度甲府市一般会計予算",
      "sessionLabel": "令和2年3月定例会",
      "decidedDate": "2020-03-24",
      "decidedDateLabel": "令和2年3月24日",
      "result": "可決"
    },
    "sourceTitle": "令和2年度 甲府市議会の構成（会派別議席数）と当初予算の議決",
    "roster": {
      "title": "所属会派別議員名簿",
      "localUrl": "/sources/kofu-gikai-r2/h270512kaihabetu.html",
      "originUrl": "https://web.archive.org/web/20191114183718id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html",
      "archiveUrl": "https://web.archive.org/web/20191114183718id_/https://www.city.kofu.yamanashi.jp/gikai-somu/shise/gikai/mebo/h270512kaihabetu.html"
    },
    "result": {
      "title": "令和2年3月定例会 審議結果",
      "localUrl": "/sources/kofu-gikai-r2/shinngikekka.html",
      "originUrl": "https://web.archive.org/web/20200813113035id_/https://www.city.kofu.yamanashi.jp/gijichosa/r0203/shinngikekka.html",
      "archiveUrl": "https://web.archive.org/web/20200813113035id_/https://www.city.kofu.yamanashi.jp/gijichosa/r0203/shinngikekka.html"
    },
    "votesTable": null,
    "minutesUrl": "https://www.city.kofu.yamanashi.dbsr.jp/",
    "newsletterUrl": "https://www.city.kofu.yamanashi.jp/gijichosa/shise/gikai/koho/r08.html"
  }
];

/** 最新（R8）。年度未指定時のフォールバック。 */
export const KOFU_COUNCIL: Council = KOFU_COUNCIL_YEARS[0]!;

/**
 * 甲府以外の議会の構成（予算議決時）。団体コード → 新しい年度順。
 * 会派と所属議員を名簿から書き写し、全員の氏名が原典の本文に出ることをパーサが確かめている
 * （`council-transcribed`・docs/data-sources.md §6-2）。**年度が合わなければ出さない**（別年度の構成で代用しない）。
 */
export const MUNI_COUNCIL_YEARS: Record<string, Council[]> = {
  "102016": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "前橋市議会",
      "seats": 38,
      "teisu": 38,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "前橋高志会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "前橋令明",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "日本共産党前橋市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党前橋市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "まえばし市民クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "前橋豊輪",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "七星",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "なないろ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "暁鐘",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属クラブ",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第15号",
        "billName": "令和８年度前橋市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決(多数)"
      },
      "sourceTitle": "令和8年度 前橋市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和8年3月23日現在）",
        "localUrl": "/sources/maebashi-shigikai-r8/13314.html",
        "originUrl": "https://web.archive.org/web/20260326164618id_/https://www.city.maebashi.gunma.jp/gikai/1/13314.html",
        "archiveUrl": "https://web.archive.org/web/20260326164618id_/https://www.city.maebashi.gunma.jp/gikai/1/13314.html"
      },
      "result": {
        "title": "議案の議決結果（令和８年２月臨時会及び第１回定例会）",
        "localUrl": "/sources/maebashi-shigikai-r8/r823.pdf",
        "originUrl": "https://www.city.maebashi.gunma.jp/material/files/group/85/r823.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001172029/https://www.city.maebashi.gunma.jp/material/files/group/85/r823.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "102024": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "高崎市議会",
      "seats": 38,
      "teisu": 38,
      "asOf": "2024-10-29",
      "asOfLabel": "2024年10月29日",
      "factions": [
        {
          "name": "新風会",
          "seats": 19,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "たかさき未来",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "超党派の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党高崎市議会議員団",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２８号",
        "billName": "令和８年度高崎市一般会計予算",
        "sessionLabel": "令和８年第２回定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 高崎市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派一覧（令和6年10月29日）",
        "localUrl": "/sources/takasaki-shigikai-r8/2244.html",
        "originUrl": "https://web.archive.org/web/20260307001842id_/https://www.city.takasaki.gunma.jp/site/gikai/2244.html",
        "archiveUrl": "https://web.archive.org/web/20260307001842id_/https://www.city.takasaki.gunma.jp/site/gikai/2244.html"
      },
      "result": {
        "title": "令和８年第２回定例会 議案等審議結果一覧",
        "localUrl": "/sources/takasaki-shigikai-r8/39050.pdf",
        "originUrl": "https://www.city.takasaki.gunma.jp/uploaded/attachment/39050.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182452/https://www.city.takasaki.gunma.jp/uploaded/attachment/39050.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112011": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "川越市議会",
      "seats": 36,
      "teisu": 36,
      "asOf": "2025-09-09",
      "asOfLabel": "2025年9月9日",
      "factions": [
        {
          "name": "初雁自由政令会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "川越志政会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "川越政策フォーラム",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "川越未来の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本維新の会（柳沢貴雄）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "れいわ新選組（小林透）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（伊藤正子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（村山博紀）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（川口啓介）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（小林薫）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案 29",
        "billName": "令和８年度川越市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 川越市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員一覧表（令和7年9月9日現在）",
        "localUrl": "/sources/kawagoe-shigikai-r8/1007626.html",
        "originUrl": "https://web.archive.org/web/20251213125425id_/https://www.city.kawagoe.saitama.jp/shigikai/giin/1007626.html",
        "archiveUrl": "https://web.archive.org/web/20251213125425id_/https://www.city.kawagoe.saitama.jp/shigikai/giin/1007626.html"
      },
      "result": {
        "title": "議会だより（令和8年5月1日発行）議案議決結果一覧表",
        "localUrl": "/sources/kawagoe-shigikai-r8/0805shigikai4.pdf",
        "originUrl": "https://www.city.kawagoe.saitama.jp/_res/projects/default_project/_page_/001/021/435/0805shigikai4.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001172326/https://www.city.kawagoe.saitama.jp/_res/projects/default_project/_page_/001/021/435/0805shigikai4.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112089": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "所沢市議会",
      "seats": 33,
      "teisu": 33,
      "asOf": "2025-05-15",
      "asOfLabel": "2025年5月15日",
      "factions": [
        {
          "name": "自由民主党・維新・参政・無所属の会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "至誠自民クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党所沢市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民クラブ未来",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "さきがけ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "立憲リベラルの会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党・れいわ新選組",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第42号",
        "billName": "令和8年度所沢市一般会計予算",
        "sessionLabel": "令和８年第２回（２月）定例会議",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 所沢市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派一覧（会派構成表 令和7年5月現在・更新日 2025年5月15日）",
        "localUrl": "/sources/tokorozawa-shigikai-r8/kaihaitiran.html",
        "originUrl": "https://web.archive.org/web/20260310023149id_/https://www.city.tokorozawa.saitama.jp/shigikai/shokai/kaihaitiran.html",
        "archiveUrl": "https://web.archive.org/web/20260310023149id_/https://www.city.tokorozawa.saitama.jp/shigikai/shokai/kaihaitiran.html"
      },
      "result": {
        "title": "市長提出議案の審議結果［令和８年第２回（２月）定例会議］",
        "localUrl": "/sources/tokorozawa-shigikai-r8/shityokekka_R8.3.24_2.pdf",
        "originUrl": "https://www.city.tokorozawa.saitama.jp/shigikai/shingi/r8dai2/R8_dai2kai_kekka.files/shityokekka_R8.3.24_2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009031106/https://www.city.tokorozawa.saitama.jp/shigikai/shingi/r8dai2/R8_dai2kai_kekka.files/shityokekka_R8.3.24_2.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 28,
          "反対": 4,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "自由民主党・維新・参政・無所属の会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "斉藤かおり",
                "stance": "賛成"
              },
              {
                "name": "神戸鉄郎",
                "stance": "賛成"
              },
              {
                "name": "佐野允彦",
                "stance": "賛成"
              },
              {
                "name": "大庭祥照",
                "stance": "賛成"
              },
              {
                "name": "前田浩昭",
                "stance": "賛成"
              },
              {
                "name": "入沢豊",
                "stance": "賛成"
              },
              {
                "name": "石原昂",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "植竹成年",
                "stance": "賛成"
              },
              {
                "name": "大久保竜一",
                "stance": "賛成"
              },
              {
                "name": "川辺浩直",
                "stance": "賛成"
              },
              {
                "name": "亀山恭子",
                "stance": "賛成"
              },
              {
                "name": "山口浩美",
                "stance": "賛成"
              },
              {
                "name": "福原浩昭",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "至誠自民クラブ",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "谷口雅典",
                "stance": "賛成"
              },
              {
                "name": "大石健一",
                "stance": "賛成"
              },
              {
                "name": "大舘隆行",
                "stance": "賛成"
              },
              {
                "name": "秋田孝",
                "stance": "賛成"
              },
              {
                "name": "斎藤由紀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党所沢市議団",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "小林澄子",
                "stance": "反対"
              },
              {
                "name": "中井めぐみ",
                "stance": "反対"
              },
              {
                "name": "花岡健太",
                "stance": "反対"
              },
              {
                "name": "矢作いづみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市民クラブ未来",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "松本明信",
                "stance": "賛成"
              },
              {
                "name": "中毅志",
                "stance": "賛成"
              },
              {
                "name": "青木利幸",
                "stance": "賛成"
              },
              {
                "name": "粕谷不二夫",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "さきがけ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "島田一隆",
                "stance": "賛成"
              },
              {
                "name": "長谷川礼奈",
                "stance": "賛成"
              },
              {
                "name": "荻野泰男",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲リベラルの会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "石本亮三",
                "stance": "賛成"
              },
              {
                "name": "末吉美帆子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党・れいわ新選組",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "長岡恵子",
                "stance": "賛成"
              },
              {
                "name": "赤川洋二",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "市長提出議案の審議結果［令和８年第２回（２月）定例会議］",
          "localUrl": "/sources/tokorozawa-shigikai-r8/shityokekka_R8.3.24_2.pdf",
          "originUrl": "https://www.city.tokorozawa.saitama.jp/shigikai/shingi/r8dai2/R8_dai2kai_kekka.files/shityokekka_R8.3.24_2.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009031106/https://www.city.tokorozawa.saitama.jp/shigikai/shingi/r8dai2/R8_dai2kai_kekka.files/shityokekka_R8.3.24_2.pdf"
        }
      }
    }
  ],
  "112101": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "加須市議会",
      "seats": 24,
      "asOf": "2025-12-10",
      "asOfLabel": "2025年12月10日",
      "factions": [
        {
          "name": "令和会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "新政会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党加須市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党加須市議会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "りっけん",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "はじめの一歩",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第2号議案",
        "billName": "令和8年度加須市一般会計予算",
        "sessionLabel": "令和8年第1回加須市議会定例会",
        "decidedDate": "2026-03-09",
        "decidedDateLabel": "令和8年3月9日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 加須市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "加須市議会会派一覧（令和7年12月10日現在）",
        "localUrl": "/sources/kazo-shigikai-r8/kazoshigikai_kaihameibo_2025_1210.pdf",
        "originUrl": "https://www.city.kazo.lg.jp/material/files/group/48/kazoshigikai_kaihameibo_2025_1210.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009043112/https://www.city.kazo.lg.jp/material/files/group/48/kazoshigikai_kaihameibo_2025_1210.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会情報（議案等の審議結果一覧表）",
        "localUrl": "/sources/kazo-shigikai-r8/43175.html",
        "originUrl": "https://www.city.kazo.lg.jp/soshiki/gikai/teirei/reiwa7nennteireikai/43175.html",
        "archiveUrl": "https://web.archive.org/web/20260422154515/https://www.city.kazo.lg.jp/soshiki/gikai/teirei/reiwa7nennteireikai/43175.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112151": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "狭山市議会",
      "seats": 22,
      "teisu": 22,
      "asOf": "2025-06-06",
      "asOfLabel": "2025年6月6日",
      "factions": [
        {
          "name": "健政会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "創造",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新政みらい",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "光と風",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（三浦和也）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（千葉良秋）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第20号",
        "billName": "令和８年度狭山市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 狭山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（2025年6月6日現在）",
        "localUrl": "/sources/sayama-shigikai-r8/kaihameibo.html",
        "originUrl": "https://web.archive.org/web/20260314132549id_/https://www.city.sayama.saitama.jp/gikai/meibo/kaihameibo.html",
        "archiveUrl": "https://web.archive.org/web/20260314132549id_/https://www.city.sayama.saitama.jp/gikai/meibo/kaihameibo.html"
      },
      "result": {
        "title": "令和8年第1回定例会【議案】",
        "localUrl": "/sources/sayama-shigikai-r8/R8_01gian.html",
        "originUrl": "https://www.city.sayama.saitama.jp/gikai/teireikai/gianitiran/R8_01gian.html",
        "archiveUrl": "https://web.archive.org/web/20261009031731/https://www.city.sayama.saitama.jp/gikai/teireikai/gianitiran/R8_01gian.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112178": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "鴻巣市議会",
      "seats": 24,
      "teisu": 24,
      "asOf": "2025-11-21",
      "asOfLabel": "2025年11月21日",
      "factions": [
        {
          "name": "新未来こうのす",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "明誠会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "かいえんたい",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "こうのす未来",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "社民党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "鴻巣維新の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "30",
        "billName": "令和８年度鴻巣市一般会計予算",
        "sessionLabel": "令和８年３月鴻巣市議会定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 鴻巣市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派構成（令和7年11月21日現在・2026-02-12 の魚拓）",
        "localUrl": "/sources/konosu-shigikai-r8/2604.html",
        "originUrl": "https://web.archive.org/web/20260212003439id_/https://www.city.kounosu.saitama.jp/site/gikai/2604.html",
        "archiveUrl": "https://web.archive.org/web/20260212003439id_/https://www.city.kounosu.saitama.jp/site/gikai/2604.html"
      },
      "result": {
        "title": "令和８年３月 鴻巣市議会定例会議決結果番号表",
        "localUrl": "/sources/konosu-shigikai-r8/25906.pdf",
        "originUrl": "https://www.city.kounosu.saitama.jp/uploaded/attachment/25906.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009043211/https://www.city.kounosu.saitama.jp/uploaded/attachment/25906.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 20,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "新未来こうのす",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "小泉晋史",
                "stance": "賛成"
              },
              {
                "name": "藤村孝志",
                "stance": "賛成"
              },
              {
                "name": "中西耕二郎",
                "stance": "賛成"
              },
              {
                "name": "高橋亜紀",
                "stance": "賛成"
              },
              {
                "name": "後藤耕佑",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "明誠会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "芝嵜和好",
                "stance": "賛成"
              },
              {
                "name": "田中克美",
                "stance": "賛成"
              },
              {
                "name": "金子雄一",
                "stance": "賛成"
              },
              {
                "name": "古山大輔",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "潮田幸子",
                "stance": "賛成"
              },
              {
                "name": "川崎葉子",
                "stance": "賛成"
              },
              {
                "name": "茂利博之",
                "stance": "賛成"
              },
              {
                "name": "橋本稔",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "かいえんたい",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "秋谷修",
                "stance": "賛成"
              },
              {
                "name": "大塚佳之",
                "stance": "賛成"
              },
              {
                "name": "坂本国広",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "こうのす未来",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "金澤孝太郎",
                "stance": "賛成"
              },
              {
                "name": "織田京子",
                "stance": "賛成"
              },
              {
                "name": "市ノ川徳宏",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "竹田悦子",
                "stance": "反対"
              },
              {
                "name": "諏訪三津枝",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "社民党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "西尾綾子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "矢島洋文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "鴻巣維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "羽鳥健",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "こうのす議会だより第82号 賛否が分かれた議案",
          "localUrl": "/sources/konosu-shigikai-r8/26692.pdf",
          "originUrl": "https://www.city.kounosu.saitama.jp/uploaded/attachment/26692.pdf",
          "archiveUrl": "https://web.archive.org/web/20260519072940/https://www.city.kounosu.saitama.jp/uploaded/attachment/26692.pdf"
        }
      }
    }
  ],
  "112194": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "上尾市議会",
      "seats": 30,
      "teisu": 30,
      "asOf": "2026-03-19",
      "asOfLabel": "2026年3月19日",
      "factions": [
        {
          "name": "あげお志誠ネットワーク",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "政策フォーラム・市民の声あげお",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党上尾市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党上尾市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "凛結会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（秋山かほる）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（佐藤恵理子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第5号",
        "billName": "令和8年度上尾市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 上尾市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "賛否が分かれた議案・請願と議決結果（令和8年上尾市議会3月定例会・会派名と議員名の見出し）",
        "localUrl": "/sources/ageo-shigikai-r8/116928.pdf",
        "originUrl": "https://www.city.ageo.lg.jp/uploaded/attachment/116928.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009032216/https://www.city.ageo.lg.jp/uploaded/attachment/116928.pdf"
      },
      "result": {
        "title": "令和8年3月定例会提出議案の議決結果",
        "localUrl": "/sources/ageo-shigikai-r8/416967.html",
        "originUrl": "https://www.city.ageo.lg.jp/site/shigikai/416967.html",
        "archiveUrl": "https://web.archive.org/web/20260617001033/https://www.city.ageo.lg.jp/site/shigikai/416967.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112216": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "草加市議会",
      "seats": 27,
      "asOf": "2026-03-18",
      "asOfLabel": "2026年3月18日",
      "factions": [
        {
          "name": "草加自民党・無所属の会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "ＳＯＫＡ新政",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "市民共同",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属議員（平野厚子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（川﨑久範）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属議員（吉沢哲夫）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第７号議案",
        "billName": "令和８年度草加市一般会計予算",
        "sessionLabel": "令和８年２月定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 草加市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "本会議の議決結果（令和8年2月定例会3月18日分）審議結果一覧（会派構成／議員名）",
        "localUrl": "/sources/soka-shigikai-r8/Kg571_kekka.pdf",
        "originUrl": "http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182648/http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf"
      },
      "result": {
        "title": "本会議の議決結果（令和8年2月定例会3月18日分）",
        "localUrl": "/sources/soka-shigikai-r8/Kg571_kekka.pdf",
        "originUrl": "http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182648/http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 25,
          "議長": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "草加自民党・無所属の会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "田中宣光",
                "stance": "賛成"
              },
              {
                "name": "木村忠義",
                "stance": "賛成"
              },
              {
                "name": "矢部正平",
                "stance": "賛成"
              },
              {
                "name": "小川利八",
                "stance": "賛成"
              },
              {
                "name": "芝野勝利",
                "stance": "賛成"
              },
              {
                "name": "松井優美子",
                "stance": "賛成"
              },
              {
                "name": "白石孝雄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "ＳＯＫＡ新政",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "吉岡健",
                "stance": "賛成"
              },
              {
                "name": "佐藤利器",
                "stance": "賛成"
              },
              {
                "name": "平山杏香",
                "stance": "賛成"
              },
              {
                "name": "関一幸",
                "stance": "賛成"
              },
              {
                "name": "田川浩司",
                "stance": "賛成"
              },
              {
                "name": "並木正成",
                "stance": "賛成"
              },
              {
                "name": "鈴木由和",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "広田丈夫",
                "stance": "賛成"
              },
              {
                "name": "石川祐一",
                "stance": "賛成"
              },
              {
                "name": "堀込彰二",
                "stance": "賛成"
              },
              {
                "name": "金井俊治",
                "stance": "賛成"
              },
              {
                "name": "森覚",
                "stance": "賛成"
              },
              {
                "name": "藤原みどり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民共同",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "斉藤雄二",
                "stance": "賛成"
              },
              {
                "name": "佐藤憲和",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "菊地慶太",
                "stance": "賛成"
              },
              {
                "name": "中島綾菜",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属議員（平野厚子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "平野厚子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属議員（川﨑久範）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "川﨑久範",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属議員（吉沢哲夫）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "吉沢哲夫",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "本会議の議決結果（令和8年2月定例会3月18日分）審議結果一覧",
          "localUrl": "/sources/soka-shigikai-r8/Kg571_kekka.pdf",
          "originUrl": "http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001182648/http://www.soka-shigikai.jp/voices/GikaiDoc/attach/Congress/Kg571_kekka.pdf"
        }
      }
    }
  ],
  "112224": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "越谷市議会",
      "seats": 31,
      "asOf": "2025-11-21",
      "asOfLabel": "2025年11月21日",
      "factions": [
        {
          "name": "NEXT越谷",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党越谷市議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "自由民主党越谷市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "こしがや無所属の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "立憲民主党越谷市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党越谷市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 2,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第25号議案",
        "billName": "令和8年度越谷市一般会計予算について",
        "sessionLabel": "令和8年３月定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 越谷市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（会派一覧 令和7年(2025年)11月21日現在）",
        "localUrl": "/sources/koshigaya-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20260415105315id_/https://www.city.koshigaya.saitama.jp/gikai/giin/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260415105315id_/https://www.city.koshigaya.saitama.jp/gikai/giin/kaiha.html"
      },
      "result": {
        "title": "令和8年３月定例会 審議結果",
        "localUrl": "/sources/koshigaya-shigikai-r8/gikaikekka80318.pdf",
        "originUrl": "https://www.city.koshigaya.saitama.jp/gikai/singi/gian/giketsu/files/gikaikekka80318.pdf",
        "archiveUrl": "https://web.archive.org/web/20260613034257/https://www.city.koshigaya.saitama.jp/gikai/singi/gian/giketsu/files/gikaikekka80318.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "反対": 7,
          "賛成": 23,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "NEXT越谷",
            "counts": {
              "反対": 7
            },
            "members": [
              {
                "name": "浅古高志",
                "stance": "反対"
              },
              {
                "name": "金井直樹",
                "stance": "反対"
              },
              {
                "name": "松島孝夫",
                "stance": "反対"
              },
              {
                "name": "武藤智",
                "stance": "反対"
              },
              {
                "name": "野口高明",
                "stance": "反対"
              },
              {
                "name": "立澤貴明",
                "stance": "反対"
              },
              {
                "name": "横井聖美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "公明党越谷市議団",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "竹内栄治",
                "stance": "賛成"
              },
              {
                "name": "瀬賀恭子",
                "stance": "賛成"
              },
              {
                "name": "畑谷茂",
                "stance": "議長"
              },
              {
                "name": "久保田茂",
                "stance": "賛成"
              },
              {
                "name": "藤部徳治",
                "stance": "賛成"
              },
              {
                "name": "和泉田宏幸",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党越谷市議団",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "野口佳司",
                "stance": "賛成"
              },
              {
                "name": "伊藤治",
                "stance": "賛成"
              },
              {
                "name": "島田玲子",
                "stance": "賛成"
              },
              {
                "name": "小林豊代子",
                "stance": "賛成"
              },
              {
                "name": "清田巳喜男",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "こしがや無所属の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "白川秀嗣",
                "stance": "賛成"
              },
              {
                "name": "菊地貴光",
                "stance": "賛成"
              },
              {
                "name": "大野恭子",
                "stance": "賛成"
              },
              {
                "name": "斎藤豪人",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党越谷市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "後藤孝江",
                "stance": "賛成"
              },
              {
                "name": "小口高寛",
                "stance": "賛成"
              },
              {
                "name": "土屋来夢",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党越谷市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "工藤秀次",
                "stance": "賛成"
              },
              {
                "name": "山田大助",
                "stance": "賛成"
              },
              {
                "name": "大和田哲",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小林成好",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "清水泉",
                "stance": "賛成"
              },
              {
                "name": "大田ちひろ",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年３月定例会 審議結果",
          "localUrl": "/sources/koshigaya-shigikai-r8/gikaikekka80318.pdf",
          "originUrl": "https://www.city.koshigaya.saitama.jp/gikai/singi/gian/giketsu/files/gikaikekka80318.pdf",
          "archiveUrl": "https://web.archive.org/web/20260613034257/https://www.city.koshigaya.saitama.jp/gikai/singi/gian/giketsu/files/gikaikekka80318.pdf"
        }
      }
    }
  ],
  "112241": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "戸田市議会",
      "seats": 24,
      "teisu": 25,
      "asOf": "2026-03-11",
      "asOfLabel": "2026年3月11日",
      "factions": [
        {
          "name": "戸田の会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "政策TODA",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党戸田市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "平政会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "りっけん戸田",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "保守の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２２号",
        "billName": "令和８年度戸田市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-11",
        "decidedDateLabel": "令和8年3月11日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 戸田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員別採決状況及び議決結果一覧：令和８年３月定例会（会派名・議員名の見出し）",
        "localUrl": "/sources/toda-shigikai-r8/DownLoadTempuFile_dataId_0000054203_fileId_48e00997ad364e7eb59f57a6e294041e_fileName_giketsukekkaitiranR080311_pdf.pdf",
        "originUrl": "https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf",
        "archiveUrl": "https://web.archive.org/web/20260313053117/https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf"
      },
      "result": {
        "title": "議員別採決状況及び議決結果一覧：令和８年３月定例会",
        "localUrl": "/sources/toda-shigikai-r8/DownLoadTempuFile_dataId_0000054203_fileId_48e00997ad364e7eb59f57a6e294041e_fileName_giketsukekkaitiranR080311_pdf.pdf",
        "originUrl": "https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf",
        "archiveUrl": "https://web.archive.org/web/20260313053117/https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "戸田の会",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "辺見智子",
                "stance": "賛成"
              },
              {
                "name": "小沼さゆり",
                "stance": "賛成"
              },
              {
                "name": "宮内そうこ",
                "stance": "賛成"
              },
              {
                "name": "佐藤太信",
                "stance": "賛成"
              },
              {
                "name": "野澤茂雅",
                "stance": "賛成"
              },
              {
                "name": "矢澤青河",
                "stance": "賛成"
              },
              {
                "name": "浅生和英",
                "stance": "賛成"
              },
              {
                "name": "酒井いくろう",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "政策TODA",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "小山大輔",
                "stance": "賛成"
              },
              {
                "name": "古屋としみつ",
                "stance": "賛成"
              },
              {
                "name": "そごう拓也",
                "stance": "賛成"
              },
              {
                "name": "細田昌孝",
                "stance": "賛成"
              },
              {
                "name": "遠藤英樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "三浦のぶお",
                "stance": "賛成"
              },
              {
                "name": "三輪なお子",
                "stance": "議長"
              },
              {
                "name": "竹内正明",
                "stance": "賛成"
              },
              {
                "name": "石川清明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党戸田市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "花井あきこ",
                "stance": "賛成"
              },
              {
                "name": "むとう葉子",
                "stance": "賛成"
              },
              {
                "name": "本田哲",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "平政会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "斎藤直子",
                "stance": "賛成"
              },
              {
                "name": "榎本守明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "りっけん戸田",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小金沢優",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "保守の会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "河合ゆうすけ",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "議員別採決状況及び議決結果一覧：令和８年３月定例会",
          "localUrl": "/sources/toda-shigikai-r8/DownLoadTempuFile_dataId_0000054203_fileId_48e00997ad364e7eb59f57a6e294041e_fileName_giketsukekkaitiranR080311_pdf.pdf",
          "originUrl": "https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf",
          "archiveUrl": "https://web.archive.org/web/20260313053117/https://www2.city.toda.saitama.jp/gikai/toda-f9fzqijq2awo0kaj/DownLoadTempuFile?dataId=0000054203&fileId=48e00997ad364e7eb59f57a6e294041e&fileName=giketsukekkaitiranR080311.pdf"
        }
      }
    }
  ],
  "112259": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "入間市議会",
      "seats": 21,
      "asOf": "2026-03-16",
      "asOfLabel": "2026年3月16日",
      "factions": [
        {
          "name": "自由民主党入間市議団",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "公明党入間市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党入間市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "市民の声",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民フォーラム",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第31号",
        "billName": "令和８年度入間市一般会計予算",
        "sessionLabel": "令和８年３月定例会（第１回）",
        "decidedDate": "2026-03-16",
        "decidedDateLabel": "令和8年3月16日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 入間市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "いるま市議会だより第214号（令和８年３月定例会号）賛否が分かれた議案等の会派見出し",
        "localUrl": "/sources/iruma-shigikai-r8/gikai214.pdf",
        "originUrl": "https://www.city.iruma.saitama.jp/material/files/group/50/gikai214.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009033202/https://www.city.iruma.saitama.jp/material/files/group/50/gikai214.pdf"
      },
      "result": {
        "title": "入間市議会 議案詳細情報（議案第31号）",
        "localUrl": "/sources/iruma-shigikai-r8/g07_Giketsu_View.asp_SrchID_3262_Sflg_2_kword1_kword2_.html",
        "originUrl": "https://www3.city.iruma.saitama.jp/voices/g07_Giketsu_View.asp?SrchID=3262&Sflg=2&kword1=&kword2=",
        "archiveUrl": "https://www3.city.iruma.saitama.jp/voices/g07_Giketsu_View.asp?SrchID=3262&Sflg=2&kword1=&kword2="
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "議長": 1,
          "賛成": 16,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "自由民主党入間市議団",
            "counts": {
              "議長": 1,
              "賛成": 9
            },
            "members": [
              {
                "name": "横田淳一",
                "stance": "議長"
              },
              {
                "name": "宮岡治郎",
                "stance": "賛成"
              },
              {
                "name": "小島清人",
                "stance": "賛成"
              },
              {
                "name": "内村忠久",
                "stance": "賛成"
              },
              {
                "name": "古仲リカ",
                "stance": "賛成"
              },
              {
                "name": "長谷川渉",
                "stance": "賛成"
              },
              {
                "name": "双木小百合",
                "stance": "賛成"
              },
              {
                "name": "大野勉",
                "stance": "賛成"
              },
              {
                "name": "池畠司",
                "stance": "賛成"
              },
              {
                "name": "吉田賢一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党入間市議団",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "永澤美恵子",
                "stance": "賛成"
              },
              {
                "name": "向口文恵",
                "stance": "賛成"
              },
              {
                "name": "末次正",
                "stance": "賛成"
              },
              {
                "name": "栗山英美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党入間市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "安道佳子",
                "stance": "反対"
              },
              {
                "name": "佐藤匡",
                "stance": "反対"
              },
              {
                "name": "田山雅子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市民の声",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "町田健治",
                "stance": "賛成"
              },
              {
                "name": "山川さおり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民フォーラム",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "野口哲次",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "細田智也",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "いるま市議会だより第214号 賛否が分かれた議案等",
          "localUrl": "/sources/iruma-shigikai-r8/gikai214.pdf",
          "originUrl": "https://www.city.iruma.saitama.jp/material/files/group/50/gikai214.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009033202/https://www.city.iruma.saitama.jp/material/files/group/50/gikai214.pdf"
        }
      }
    }
  ],
  "112275": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "朝霞市議会",
      "seats": 23,
      "asOf": "2025-12-18",
      "asOfLabel": "2025年12月18日",
      "factions": [
        {
          "name": "進政会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "あさか未来",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "立憲・歩みの会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 5,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第3号",
        "billName": "令和８年度（２０２６年度）朝霞市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 朝霞市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "委員会・会派名簿（令和7年12月18日現在）",
        "localUrl": "/sources/asaka-shigikai-r8/iinkaimeibo2023.html",
        "originUrl": "https://www.city.asaka.lg.jp/site/shigikai/iinkaimeibo2023.html",
        "archiveUrl": "https://web.archive.org/web/20261009033327/https://www.city.asaka.lg.jp/site/shigikai/iinkaimeibo2023.html"
      },
      "result": {
        "title": "令和８年第１回定例会 議案審議結果表",
        "localUrl": "/sources/asaka-shigikai-r8/108679.pdf",
        "originUrl": "https://www.city.asaka.lg.jp/uploaded/attachment/108679.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009033406/https://www.city.asaka.lg.jp/uploaded/attachment/108679.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "進政会",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "石原茂",
                "stance": "賛成"
              },
              {
                "name": "野本一幸",
                "stance": "議長"
              },
              {
                "name": "増田ともみ",
                "stance": "賛成"
              },
              {
                "name": "陶山憲雅",
                "stance": "賛成"
              },
              {
                "name": "獅子倉晴樹",
                "stance": "賛成"
              },
              {
                "name": "ごん純一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "あさか未来",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "田原亮",
                "stance": "賛成"
              },
              {
                "name": "福川鷹子",
                "stance": "賛成"
              },
              {
                "name": "飯倉一樹",
                "stance": "賛成"
              },
              {
                "name": "西明",
                "stance": "賛成"
              },
              {
                "name": "高堀亮太郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "利根川仁志",
                "stance": "賛成"
              },
              {
                "name": "岡﨑和広",
                "stance": "賛成"
              },
              {
                "name": "遠藤光博",
                "stance": "賛成"
              },
              {
                "name": "駒牧容子",
                "stance": "賛成"
              },
              {
                "name": "宮林智美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲・歩みの会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "黒川滋",
                "stance": "反対"
              },
              {
                "name": "本田麻希子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 2,
              "賛成": 3
            },
            "members": [
              {
                "name": "田辺淳",
                "stance": "反対"
              },
              {
                "name": "石川啓子",
                "stance": "反対"
              },
              {
                "name": "外山麻貴",
                "stance": "賛成"
              },
              {
                "name": "兼本尚昌",
                "stance": "賛成"
              },
              {
                "name": "渡部竜二",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議案審議結果表",
          "localUrl": "/sources/asaka-shigikai-r8/108679.pdf",
          "originUrl": "https://www.city.asaka.lg.jp/uploaded/attachment/108679.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009033406/https://www.city.asaka.lg.jp/uploaded/attachment/108679.pdf"
        }
      }
    }
  ],
  "112305": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "新座市議会",
      "seats": 26,
      "asOf": "2026-02-20",
      "asOfLabel": "2026年2月20日",
      "factions": [
        {
          "name": "未来を創る会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "自民・維新の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民と語る会",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第27号",
        "billName": "令和８年度新座市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 新座市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "党・会派別名簿（令和8年2月20日現在）",
        "localUrl": "/sources/niiza-shigikai-r8/toukaiha.html",
        "originUrl": "https://www.city.niiza.lg.jp/soshiki/52/toukaiha.html",
        "archiveUrl": "https://web.archive.org/web/20261009033741/https://www.city.niiza.lg.jp/soshiki/52/toukaiha.html"
      },
      "result": {
        "title": "令和８年第１回定例会 議案の審議結果（市長提出議案）",
        "localUrl": "/sources/niiza-shigikai-r8/71060.pdf",
        "originUrl": "https://www.city.niiza.lg.jp/uploaded/attachment/71060.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009033505/https://www.city.niiza.lg.jp/uploaded/attachment/71060.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "未来を創る会",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "島田久仁代",
                "stance": "賛成"
              },
              {
                "name": "鈴木芳宗",
                "stance": "議長"
              },
              {
                "name": "よねはしゆうた",
                "stance": "賛成"
              },
              {
                "name": "伊藤信太郎",
                "stance": "賛成"
              },
              {
                "name": "山口歩",
                "stance": "賛成"
              },
              {
                "name": "川村よしひさ",
                "stance": "賛成"
              },
              {
                "name": "田口訓子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自民・維新の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "池田貞雄",
                "stance": "賛成"
              },
              {
                "name": "鈴木明子",
                "stance": "賛成"
              },
              {
                "name": "助川昇",
                "stance": "賛成"
              },
              {
                "name": "嶋野加代",
                "stance": "賛成"
              },
              {
                "name": "堀内博史",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "白井忠雄",
                "stance": "賛成"
              },
              {
                "name": "鈴木秀一",
                "stance": "賛成"
              },
              {
                "name": "野中弥生",
                "stance": "賛成"
              },
              {
                "name": "佐藤重忠",
                "stance": "賛成"
              },
              {
                "name": "谷地田庸子",
                "stance": "賛成"
              },
              {
                "name": "伊藤智砂子",
                "stance": "賛成"
              },
              {
                "name": "片山敏子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民と語る会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "高邑朋矢",
                "stance": "反対"
              },
              {
                "name": "上田美小枝",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "石島陽子",
                "stance": "反対"
              },
              {
                "name": "笠原進",
                "stance": "反対"
              },
              {
                "name": "小野大輔",
                "stance": "反対"
              },
              {
                "name": "黒田実樹",
                "stance": "反対"
              },
              {
                "name": "小野由美子",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議案の審議結果（市長提出議案）",
          "localUrl": "/sources/niiza-shigikai-r8/71060.pdf",
          "originUrl": "https://www.city.niiza.lg.jp/uploaded/attachment/71060.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009033505/https://www.city.niiza.lg.jp/uploaded/attachment/71060.pdf"
        }
      }
    }
  ],
  "112321": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "久喜市議会",
      "seats": 24,
      "asOf": "2025-03-12",
      "asOfLabel": "2025年3月12日",
      "factions": [
        {
          "name": "久喜みらいの会",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "公明党久喜市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民の政治を進める会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党久喜市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 3,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第89号",
        "billName": "令和8年度久喜市一般会計予算について",
        "sessionLabel": "令和8年2月定例会議",
        "decidedDate": "2026-03-03",
        "decidedDateLabel": "令和8年3月3日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 久喜市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（更新日 2025年3月12日）",
        "localUrl": "/sources/kuki-shigikai-r8/1006419.html",
        "originUrl": "https://web.archive.org/web/20250820162324id_/https://www.city.kuki.lg.jp/shigikai/giinnmeibo/1006419.html",
        "archiveUrl": "https://web.archive.org/web/20250820162324id_/https://www.city.kuki.lg.jp/shigikai/giinnmeibo/1006419.html"
      },
      "result": {
        "title": "令和8年2月定例会議 議案・議決結果",
        "localUrl": "/sources/kuki-shigikai-r8/1011952.html",
        "originUrl": "https://www.city.kuki.lg.jp/shigikai/gian_kekka/1010605/1010610/1011952.html",
        "archiveUrl": "https://web.archive.org/web/20261009033838/https://www.city.kuki.lg.jp/shigikai/gian_kekka/1010605/1010610/1011952.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 15,
          "欠席": 1,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "久喜みらいの会",
            "counts": {
              "賛成": 9,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "樋口智洋",
                "stance": "賛成"
              },
              {
                "name": "奈良政宏",
                "stance": "賛成"
              },
              {
                "name": "瀬川泰祐",
                "stance": "賛成"
              },
              {
                "name": "榎本英明",
                "stance": "欠席"
              },
              {
                "name": "川内鴻輝",
                "stance": "賛成"
              },
              {
                "name": "成田ルミ子",
                "stance": "賛成"
              },
              {
                "name": "園部茂雄",
                "stance": "賛成"
              },
              {
                "name": "春山千明",
                "stance": "賛成"
              },
              {
                "name": "大谷和子",
                "stance": "賛成"
              },
              {
                "name": "新井兼",
                "stance": "賛成"
              },
              {
                "name": "上條哲弘",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党久喜市議団",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "岡崎克巳",
                "stance": "賛成"
              },
              {
                "name": "丹野郁夫",
                "stance": "賛成"
              },
              {
                "name": "山田正義",
                "stance": "賛成"
              },
              {
                "name": "大橋きよみ",
                "stance": "賛成"
              },
              {
                "name": "斉藤広子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民の政治を進める会",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "川辺美信",
                "stance": "反対"
              },
              {
                "name": "猪股和雄",
                "stance": "反対"
              },
              {
                "name": "田村栄子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党久喜市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "渡辺昌代",
                "stance": "反対"
              },
              {
                "name": "杉野修",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に属さない議員",
            "counts": {
              "反対": 2,
              "賛成": 1
            },
            "members": [
              {
                "name": "宮崎亜希",
                "stance": "反対"
              },
              {
                "name": "瀬田博文",
                "stance": "賛成"
              },
              {
                "name": "貴志信智",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年2月定例会議 市長提出議案とその結果",
          "localUrl": "/sources/kuki-shigikai-r8/r8.2_giketsu.pdf",
          "originUrl": "https://www.city.kuki.lg.jp/_res/projects/default_project/_page_/001/011/952/r8.2_giketsu.pdf",
          "archiveUrl": "https://web.archive.org/web/20260304200554/https://www.city.kuki.lg.jp/_res/projects/default_project/_page_/001/011/952/r8.2_giketsu.pdf"
        }
      }
    }
  ],
  "112356": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "富士見市議会",
      "seats": 21,
      "teisu": 21,
      "asOf": "2026-03-18",
      "asOfLabel": "2026年3月18日",
      "factions": [
        {
          "name": "２１・未来クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "草の根",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無会派（堀航大）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（根岸操）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（伊勢田幸正）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第24号",
        "billName": "令和８年度富士見市一般会計予算",
        "sessionLabel": "令和8年第1回（3月）定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 富士見市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案等の審議結果（議員賛否一覧）令和8年第1回（3月）定例会",
        "localUrl": "/sources/fujimi-shigikai-r8/sanpi202603.pdf",
        "originUrl": "https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009034316/https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf"
      },
      "result": {
        "title": "議案等の審議結果（議員賛否一覧）令和8年第1回（3月）定例会",
        "localUrl": "/sources/fujimi-shigikai-r8/sanpi202603.pdf",
        "originUrl": "https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009034316/https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "２１・未来クラブ",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "松本剛",
                "stance": "賛成"
              },
              {
                "name": "小泉陽",
                "stance": "賛成"
              },
              {
                "name": "佐野正幸",
                "stance": "賛成"
              },
              {
                "name": "田中栄志",
                "stance": "賛成"
              },
              {
                "name": "斉藤隆浩",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "草の根",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "村元寛",
                "stance": "賛成"
              },
              {
                "name": "加賀奈々恵",
                "stance": "賛成"
              },
              {
                "name": "熊谷麗",
                "stance": "賛成"
              },
              {
                "name": "勝山祥",
                "stance": "議長"
              },
              {
                "name": "今成優太",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "篠田剛",
                "stance": "賛成"
              },
              {
                "name": "篠原通裕",
                "stance": "賛成"
              },
              {
                "name": "山下淑子",
                "stance": "賛成"
              },
              {
                "name": "深瀬優子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "木村邦憲",
                "stance": "反対"
              },
              {
                "name": "宮尾玲",
                "stance": "反対"
              },
              {
                "name": "須崎悦子",
                "stance": "反対"
              },
              {
                "name": "川畑勝弘",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（堀航大）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "堀航大",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（根岸操）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "根岸操",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（伊勢田幸正）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "伊勢田幸正",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等の審議結果（議員賛否一覧）令和8年第1回（3月）定例会",
          "localUrl": "/sources/fujimi-shigikai-r8/sanpi202603.pdf",
          "originUrl": "https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009034316/https://www.city.fujimi.saitama.jp/shigikai/shingi/sannpiichiran/sanpiichiran2026.files/sanpi202603.pdf"
        }
      }
    }
  ],
  "112372": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "三郷市議会",
      "seats": 23,
      "asOf": "2026-03-11",
      "asOfLabel": "2026年3月11日",
      "factions": [
        {
          "name": "新政会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "21世紀クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "創政MISATO",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（篠田隆彦）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案21",
        "billName": "令和８年度三郷市一般会計予算",
        "sessionLabel": "３月定例会",
        "decidedDate": "2026-03-11",
        "decidedDateLabel": "令和8年3月11日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 三郷市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和8年3月定例会会派別賛否（みさと市議会だより第205号 審議結果と賛否）",
        "localUrl": "/sources/misato-shigikai-r8/R803sanpi.pdf",
        "originUrl": "https://www.city.misato.lg.jp/material/files/group/57/R803sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009034601/https://www.city.misato.lg.jp/material/files/group/57/R803sanpi.pdf"
      },
      "result": {
        "title": "令和8年3月定例会 議決結果一覧表",
        "localUrl": "/sources/misato-shigikai-r8/R8_3_giketukekkaitirann.pdf",
        "originUrl": "https://www.city.misato.lg.jp/material/files/group/57/R8_3_giketukekkaitirann.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009034724/https://www.city.misato.lg.jp/material/files/group/57/R8_3_giketukekkaitirann.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 19,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "新政会",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "佐々木修",
                "stance": "賛成"
              },
              {
                "name": "宇治由紀子",
                "stance": "賛成"
              },
              {
                "name": "寺沢美紗",
                "stance": "賛成"
              },
              {
                "name": "西尾秀貴",
                "stance": "賛成"
              },
              {
                "name": "沖原優子",
                "stance": "賛成"
              },
              {
                "name": "竹内嘉洋",
                "stance": "賛成"
              },
              {
                "name": "武居弘治",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "21世紀クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "渡邉雅人",
                "stance": "賛成"
              },
              {
                "name": "柳瀬勝彦",
                "stance": "賛成"
              },
              {
                "name": "菊名裕",
                "stance": "賛成"
              },
              {
                "name": "柴田吾一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "鈴木深太郎",
                "stance": "賛成"
              },
              {
                "name": "鳴海和美",
                "stance": "賛成"
              },
              {
                "name": "西村寿美枝",
                "stance": "賛成"
              },
              {
                "name": "桑原洋昭",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "創政MISATO",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "佐藤裕之",
                "stance": "賛成"
              },
              {
                "name": "髙橋誠一",
                "stance": "賛成"
              },
              {
                "name": "日髙千穂",
                "stance": "賛成"
              },
              {
                "name": "鈴木優作",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "共産党",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "工藤智加子",
                "stance": "反対"
              },
              {
                "name": "深川智加",
                "stance": "反対"
              },
              {
                "name": "紺野伊久子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（篠田隆彦）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "篠田隆彦",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月定例会会派別賛否（審議結果と賛否）",
          "localUrl": "/sources/misato-shigikai-r8/R803sanpi.pdf",
          "originUrl": "https://www.city.misato.lg.jp/material/files/group/57/R803sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009034601/https://www.city.misato.lg.jp/material/files/group/57/R803sanpi.pdf"
        }
      }
    }
  ],
  "112399": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "坂戸市議会",
      "seats": 19,
      "asOf": "2026-03-19",
      "asOfLabel": "2026年3月19日",
      "factions": [
        {
          "name": "民政クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "民主の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "さかど新政会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（田中栄）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（小澤弘）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第２４号",
        "billName": "令和８年度坂戸市一般会計予算を定める件",
        "sessionLabel": "坂戸市議会３月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 坂戸市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "さかど市議会だより No.180（令和8年5月1日発行）会派別の議員（令和８年３月19日現在）",
        "localUrl": "/sources/sakado-shigikai-r8/36142.pdf",
        "originUrl": "https://www.city.sakado.lg.jp/uploaded/attachment/36142.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009035051/https://www.city.sakado.lg.jp/uploaded/attachment/36142.pdf"
      },
      "result": {
        "title": "坂戸市議会３月定例会議案審議結果",
        "localUrl": "/sources/sakado-shigikai-r8/34919.pdf",
        "originUrl": "https://www.city.sakado.lg.jp/uploaded/attachment/34919.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009035141/https://www.city.sakado.lg.jp/uploaded/attachment/34919.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "112453": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "ふじみ野市議会",
      "seats": 21,
      "teisu": 21,
      "asOf": "2026-03-18",
      "asOfLabel": "2026年3月18日",
      "factions": [
        {
          "name": "青藍会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "自由清進の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない（金濵高顕）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない（民部佳代）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第２４号議案",
        "billName": "令和８年度ふじみ野市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 ふじみ野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年第１回定例会の提出議案等と審議結果",
        "localUrl": "/sources/fujimino-shigikai-r8/r8_1teirei_sanpi.pdf",
        "originUrl": "https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009035223/https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf"
      },
      "result": {
        "title": "令和８年第１回定例会の提出議案等と審議結果",
        "localUrl": "/sources/fujimino-shigikai-r8/r8_1teirei_sanpi.pdf",
        "originUrl": "https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009035223/https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "青藍会",
            "counts": {
              "賛成": 8,
              "議長": 1
            },
            "members": [
              {
                "name": "野口一也",
                "stance": "賛成"
              },
              {
                "name": "田中早苗",
                "stance": "賛成"
              },
              {
                "name": "川島秀男",
                "stance": "賛成"
              },
              {
                "name": "前田広子",
                "stance": "賛成"
              },
              {
                "name": "鈴木宏樹",
                "stance": "賛成"
              },
              {
                "name": "板倉篤",
                "stance": "賛成"
              },
              {
                "name": "加藤恵一",
                "stance": "議長"
              },
              {
                "name": "小林憲人",
                "stance": "賛成"
              },
              {
                "name": "山田敏夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由清進の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "小林久美",
                "stance": "賛成"
              },
              {
                "name": "坪田敏孝",
                "stance": "賛成"
              },
              {
                "name": "近藤善則",
                "stance": "賛成"
              },
              {
                "name": "原田雄一",
                "stance": "賛成"
              },
              {
                "name": "鈴木啓太郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "古越孝子",
                "stance": "賛成"
              },
              {
                "name": "鈴木美恵",
                "stance": "賛成"
              },
              {
                "name": "川畑京子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "床井紀範",
                "stance": "反対"
              },
              {
                "name": "塚越洋一",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に属さない（金濵高顕）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "金濵高顕",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない（民部佳代）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "民部佳代",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会の提出議案等と審議結果",
          "localUrl": "/sources/fujimino-shigikai-r8/r8_1teirei_sanpi.pdf",
          "originUrl": "https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009035223/https://www.city.fujimino.saitama.jp/material/files/group/35/r8_1teirei_sanpi.pdf"
        }
      }
    }
  ],
  "121002": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "千葉市議会",
      "seats": 50,
      "teisu": 50,
      "asOf": "2025-04-07",
      "asOfLabel": "2025年4月7日",
      "factions": [
        {
          "name": "自由民主党千葉市議会議員団",
          "seats": 17,
          "isIndependent": false
        },
        {
          "name": "立憲民主・無所属千葉市議会議員団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "公明党千葉市議会議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党千葉市議会議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本維新の会ちば",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（黒澤和泉）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（大平真弘）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（蛭田浩文）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（櫻井崇）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "15",
        "billName": "令和8年度千葉市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 千葉市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（更新日 2025年4月7日）",
        "localUrl": "/sources/chiba-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20251018071933id_/https://www.city.chiba.jp/shigikai/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20251018071933id_/https://www.city.chiba.jp/shigikai/kaiha.html"
      },
      "result": {
        "title": "令和8年第1回定例会市長提出議案議決結果",
        "localUrl": "/sources/chiba-shigikai-r8/sichoteisyutu2601.html",
        "originUrl": "https://www.city.chiba.jp/shigikai/sichoteisyutu2601.html",
        "archiveUrl": "https://web.archive.org/web/20260418042512/https://www.city.chiba.jp/shigikai/sichoteisyutu2601.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 41,
          "議長": 1,
          "反対": 8
        },
        "byFaction": [
          {
            "faction": "自由民主党千葉市議会議員団",
            "counts": {
              "賛成": 16,
              "議長": 1
            },
            "members": [
              {
                "name": "松坂吉則",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "立憲民主・無所属千葉市議会議員団",
            "counts": {
              "賛成": 11
            },
            "members": []
          },
          {
            "faction": "公明党千葉市議会議員団",
            "counts": {
              "賛成": 8
            },
            "members": []
          },
          {
            "faction": "日本共産党千葉市議会議員団",
            "counts": {
              "反対": 7
            },
            "members": []
          },
          {
            "faction": "日本維新の会ちば",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無所属（黒澤和泉）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "黒澤和泉",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（大平真弘）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大平真弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（蛭田浩文）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "蛭田浩文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（櫻井崇）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "櫻井崇",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会議決結果（賛否）表",
          "localUrl": "/sources/chiba-shigikai-r8/sichoteisyutu2601.html",
          "originUrl": "https://www.city.chiba.jp/shigikai/sichoteisyutu2601.html",
          "archiveUrl": "https://web.archive.org/web/20260418042512/https://www.city.chiba.jp/shigikai/sichoteisyutu2601.html"
        }
      }
    }
  ],
  "122033": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "市川市議会",
      "seats": 42,
      "teisu": 42,
      "asOf": "2026-03-05",
      "asOfLabel": "2026年3月5日",
      "factions": [
        {
          "name": "公明党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "創生市川・自民党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "未来市川",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "新しい流れ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "れいわ・無所属・共生の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "地域政党チームいちかわ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "いちかわ市民クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派（太田丈之）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（越川雅史）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第59号",
        "billName": "令和8年度市川市一般会計予算",
        "sessionLabel": "令和8年2月市川市議会定例会",
        "decidedDate": "2026-03-05",
        "decidedDateLabel": "令和8年3月5日",
        "result": "多数可決"
      },
      "sourceTitle": "令和8年度 市川市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年２月市川市議会定例会 議員別表決結果一覧（令和８年3月5日採決）",
        "localUrl": "/sources/ichikawa-shigikai-r8/43401.pdf",
        "originUrl": "https://www.city.ichikawa.lg.jp/uploaded/attachment/43401.pdf",
        "archiveUrl": "https://web.archive.org/web/20260729033849/https://www.city.ichikawa.lg.jp/uploaded/attachment/43401.pdf"
      },
      "result": {
        "title": "令和8年2月市川市議会定例会 議案等の審議結果一覧",
        "localUrl": "/sources/ichikawa-shigikai-r8/32594.html",
        "originUrl": "https://www.city.ichikawa.lg.jp/site/gikai/32594.html",
        "archiveUrl": "https://web.archive.org/web/20260729001829/https://www.city.ichikawa.lg.jp/site/gikai/32594.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "122041": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "船橋市議会",
      "seats": 49,
      "asOf": "2026-03-25",
      "asOfLabel": "2026年3月25日",
      "factions": [
        {
          "name": "市民民主連合",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "結",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "清風会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "飛翔",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市政会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和8年度船橋市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 船橋市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議決結果（令和8年第1回定例会）の会派構成（令和8年3月25日）",
        "localUrl": "/sources/funabashi-shigikai-r8/p145453.html",
        "originUrl": "https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453.html",
        "archiveUrl": "https://web.archive.org/web/20261001180932/https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453.html"
      },
      "result": {
        "title": "議決結果（令和8年第1回定例会）",
        "localUrl": "/sources/funabashi-shigikai-r8/p145453.html",
        "originUrl": "https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453.html",
        "archiveUrl": "https://web.archive.org/web/20261001180932/https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 41,
          "議長": 1,
          "欠席": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "市民民主連合",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "大沢たかのり",
                "stance": "賛成"
              },
              {
                "name": "中谷あやの",
                "stance": "賛成"
              },
              {
                "name": "池沢みちよ",
                "stance": "賛成"
              },
              {
                "name": "高橋けんたろう",
                "stance": "賛成"
              },
              {
                "name": "三橋さぶろう",
                "stance": "賛成"
              },
              {
                "name": "川井洋基",
                "stance": "賛成"
              },
              {
                "name": "浦田秀夫",
                "stance": "賛成"
              },
              {
                "name": "神田廣栄",
                "stance": "賛成"
              },
              {
                "name": "斉藤誠",
                "stance": "賛成"
              },
              {
                "name": "岡田とおる",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 8,
              "欠席": 1
            },
            "members": [
              {
                "name": "葛生正文",
                "stance": "賛成"
              },
              {
                "name": "草場智泉",
                "stance": "賛成"
              },
              {
                "name": "上田美穂",
                "stance": "欠席"
              },
              {
                "name": "鈴木心一",
                "stance": "賛成"
              },
              {
                "name": "木村修",
                "stance": "賛成"
              },
              {
                "name": "松橋浩嗣",
                "stance": "賛成"
              },
              {
                "name": "橋本和子",
                "stance": "賛成"
              },
              {
                "name": "松嵜裕次",
                "stance": "賛成"
              },
              {
                "name": "鈴木いくお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "結",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "米原まさと",
                "stance": "賛成"
              },
              {
                "name": "青木はるか",
                "stance": "賛成"
              },
              {
                "name": "市川たけし",
                "stance": "賛成"
              },
              {
                "name": "林としのり",
                "stance": "賛成"
              },
              {
                "name": "藤代清七郎",
                "stance": "賛成"
              },
              {
                "name": "小平奈緒",
                "stance": "賛成"
              },
              {
                "name": "いとう紀子",
                "stance": "賛成"
              },
              {
                "name": "浅野賢也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "清風会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "島田たいぞう",
                "stance": "賛成"
              },
              {
                "name": "杉川浩",
                "stance": "賛成"
              },
              {
                "name": "七戸俊治",
                "stance": "賛成"
              },
              {
                "name": "滝口宏",
                "stance": "賛成"
              },
              {
                "name": "鈴木和美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "かなみつ理恵",
                "stance": "反対"
              },
              {
                "name": "神子そよ子",
                "stance": "反対"
              },
              {
                "name": "松崎さち",
                "stance": "反対"
              },
              {
                "name": "金沢和子",
                "stance": "反対"
              },
              {
                "name": "岩井友子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "飛翔",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "かいさち",
                "stance": "賛成"
              },
              {
                "name": "今仲きいこ",
                "stance": "賛成"
              },
              {
                "name": "佐藤つぐみ",
                "stance": "賛成"
              },
              {
                "name": "齊藤和夫",
                "stance": "賛成"
              },
              {
                "name": "大沢ひろゆき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市政会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "滝口一馬",
                "stance": "賛成"
              },
              {
                "name": "日色健人",
                "stance": "賛成"
              },
              {
                "name": "渡辺賢次",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 1,
              "賛成": 3
            },
            "members": [
              {
                "name": "はまの太郎",
                "stance": "反対"
              },
              {
                "name": "三宅けいこ",
                "stance": "賛成"
              },
              {
                "name": "佐々木克敏",
                "stance": "賛成"
              },
              {
                "name": "朝倉幹晴",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会 議案等に対する賛否について（令和8年3月25日議決）",
          "localUrl": "/sources/funabashi-shigikai-r8/8-3-25.pdf",
          "originUrl": "https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453_d/fil/8-3-25.pdf",
          "archiveUrl": "https://web.archive.org/web/20260515063422/https://www.city.funabashi.lg.jp/assembly/001/39/02/p145453_d/fil/8-3-25.pdf"
        }
      }
    }
  ],
  "122076": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "松戸市議会",
      "seats": 42,
      "asOf": "2026-02-09",
      "asOfLabel": "2026年2月9日",
      "factions": [
        {
          "name": "公明党",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "清風まつど",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "松戸志政会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "政策実現フォーラム・社民",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属（湯浅文）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（柿沼光利）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（戸張友子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（二階堂剛）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（鴫原舞）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（鴈野聡）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第６９号",
        "billName": "令和８年度松戸市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 松戸市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "まつど議会だより 第265号（令和8年5月1日発行）8面 会派別一覧（令和８年２月９日現在）",
        "localUrl": "/sources/matsudo-shigikai-r8/matsudo_gikai_265.pdf",
        "originUrl": "https://www.city.matsudo.chiba.jp/gikai/gikaidayori/gikaidayorireiwa6.files/matsudo_gikai_265.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021003345/https://www.city.matsudo.chiba.jp/gikai/gikaidayori/gikaidayorireiwa6.files/matsudo_gikai_265.pdf"
      },
      "result": {
        "title": "令和8年3月定例会審議結果",
        "localUrl": "/sources/matsudo-shigikai-r8/202603teireikai3.pdf",
        "originUrl": "https://www.city.matsudo.chiba.jp/gikai/kaigi_kekka/shingikekka.files/202603teireikai3.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021003518/https://www.city.matsudo.chiba.jp/gikai/kaigi_kekka/shingikekka.files/202603teireikai3.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 36,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 10
            },
            "members": [
              {
                "name": "飯箸公明",
                "stance": "賛成"
              },
              {
                "name": "高橋伸之",
                "stance": "賛成"
              },
              {
                "name": "芦田満春",
                "stance": "賛成"
              },
              {
                "name": "丹呉顕子",
                "stance": "賛成"
              },
              {
                "name": "井出昌子",
                "stance": "賛成"
              },
              {
                "name": "鈴木智明",
                "stance": "賛成"
              },
              {
                "name": "岩瀬麻理",
                "stance": "賛成"
              },
              {
                "name": "松尾尚",
                "stance": "賛成"
              },
              {
                "name": "伊東英一",
                "stance": "賛成"
              },
              {
                "name": "織原正幸",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "清風まつど",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "市川恵一",
                "stance": "賛成"
              },
              {
                "name": "大橋博",
                "stance": "賛成"
              },
              {
                "name": "田中睦生",
                "stance": "賛成"
              },
              {
                "name": "石塚裕",
                "stance": "賛成"
              },
              {
                "name": "大和山太郎",
                "stance": "賛成"
              },
              {
                "name": "岡本優子",
                "stance": "賛成"
              },
              {
                "name": "中村典子",
                "stance": "賛成"
              },
              {
                "name": "渋谷剛士",
                "stance": "議長"
              },
              {
                "name": "杉山由祥",
                "stance": "賛成"
              },
              {
                "name": "末松裕人",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "松戸志政会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "石井勇",
                "stance": "賛成"
              },
              {
                "name": "西田善昭",
                "stance": "賛成"
              },
              {
                "name": "広瀬優斗",
                "stance": "賛成"
              },
              {
                "name": "大塚健児",
                "stance": "賛成"
              },
              {
                "name": "大谷茂範",
                "stance": "賛成"
              },
              {
                "name": "鈴木大介",
                "stance": "賛成"
              },
              {
                "name": "深山能一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "政策実現フォーラム・社民",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "増田薫",
                "stance": "賛成"
              },
              {
                "name": "原裕二",
                "stance": "賛成"
              },
              {
                "name": "竹内幸枝",
                "stance": "賛成"
              },
              {
                "name": "ＤＥＬＩ",
                "stance": "賛成"
              },
              {
                "name": "工藤鈴子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "ミール計恵",
                "stance": "反対"
              },
              {
                "name": "宇津野史行",
                "stance": "反対"
              },
              {
                "name": "嶋村新一",
                "stance": "反対"
              },
              {
                "name": "山口正子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（湯浅文）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "湯浅文",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（柿沼光利）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "柿沼光利",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（戸張友子）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "戸張友子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（二階堂剛）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "二階堂剛",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（鴫原舞）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鴫原舞",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（鴈野聡）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鴈野聡",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月定例会 賛否が分かれた市長提出議案に対する議員個人の賛否",
          "localUrl": "/sources/matsudo-shigikai-r8/2026_3_sanpi.pdf",
          "originUrl": "https://www.city.matsudo.chiba.jp/gikai/kaigi_kekka/sanpikoukai/2026_3_sanpi.files/2026_3_sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20260418172340/https://www.city.matsudo.chiba.jp/gikai/kaigi_kekka/sanpikoukai/2026_3_sanpi.files/2026_3_sanpi.pdf"
        }
      }
    }
  ],
  "122084": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "野田市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2025-06-10",
      "asOfLabel": "2025年6月10日",
      "factions": [
        {
          "name": "政清会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "六諭会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "民主連合",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "のだみらい",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党野田市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民ネットワーク",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "野田の明日を考える会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "いちいの会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和8年度一般会計予算",
        "sessionLabel": "令和8年第2回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 野田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（更新日 令和7年6月10日）",
        "localUrl": "/sources/noda-shigikai-r8/1028151.html",
        "originUrl": "https://web.archive.org/web/20260218150539id_/https://www.city.noda.chiba.jp/gikai/1028150/1028151.html",
        "archiveUrl": "https://web.archive.org/web/20260218150539id_/https://www.city.noda.chiba.jp/gikai/1028150/1028151.html"
      },
      "result": {
        "title": "審議結果 令和8年3月定例会（定例会議案等の審議結果一覧）",
        "localUrl": "/sources/noda-shigikai-r8/1050107.html",
        "originUrl": "https://www.city.noda.chiba.jp/gikai/1028233/1028235/1050107.html",
        "archiveUrl": "https://web.archive.org/web/20260423003140/https://www.city.noda.chiba.jp/gikai/1028233/1028235/1050107.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "122114": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "成田市議会",
      "seats": 29,
      "asOf": "2025-06-06",
      "asOfLabel": "2025年6月6日",
      "factions": [
        {
          "name": "政友クラブ",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "豪政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "リベラル成田",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": true
        },
        {
          "name": "虹と緑（会津素子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "暁真世（星野慎太郎）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "30",
        "billName": "令和8年度成田市一般会計予算",
        "sessionLabel": "令和8年3月 成田市議会定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 成田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派等別名簿（更新日 2025年6月6日）",
        "localUrl": "/sources/narita-shigikai-r8/page243000.html",
        "originUrl": "https://web.archive.org/web/20250907182237id_/https://www.city.narita.chiba.jp/gikai/page243000.html",
        "archiveUrl": "https://web.archive.org/web/20250907182237id_/https://www.city.narita.chiba.jp/gikai/page243000.html"
      },
      "result": {
        "title": "令和8年3月 成田市議会定例会審議案件一覧",
        "localUrl": "/sources/narita-shigikai-r8/bill_2026-3.html",
        "originUrl": "https://www.city.narita.chiba.jp/gikai/bill_2026-3.html",
        "archiveUrl": "https://web.archive.org/web/20260312201045/https://www.city.narita.chiba.jp/gikai/bill_2026-3.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 25,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "政友クラブ",
            "counts": {
              "賛成": 13,
              "議長": 1
            },
            "members": [
              {
                "name": "中島達也",
                "stance": "賛成"
              },
              {
                "name": "小泉英樹",
                "stance": "賛成"
              },
              {
                "name": "中島圭介",
                "stance": "賛成"
              },
              {
                "name": "別府弘隆",
                "stance": "賛成"
              },
              {
                "name": "飯嶋重一",
                "stance": "賛成"
              },
              {
                "name": "葛生孝浩",
                "stance": "賛成"
              },
              {
                "name": "眞野義行",
                "stance": "賛成"
              },
              {
                "name": "藤崎勇一",
                "stance": "賛成"
              },
              {
                "name": "鳥海直樹",
                "stance": "賛成"
              },
              {
                "name": "神崎勝",
                "stance": "賛成"
              },
              {
                "name": "秋山忍",
                "stance": "賛成"
              },
              {
                "name": "石渡孝春",
                "stance": "賛成"
              },
              {
                "name": "宇都宮高明",
                "stance": "賛成"
              },
              {
                "name": "荒木博",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "豪政会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "鬼澤雅弘",
                "stance": "賛成"
              },
              {
                "name": "飯島照明",
                "stance": "賛成"
              },
              {
                "name": "神崎利一",
                "stance": "賛成"
              },
              {
                "name": "村嶋照等",
                "stance": "賛成"
              },
              {
                "name": "上田信博",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "細貝正安",
                "stance": "賛成"
              },
              {
                "name": "一山貴志",
                "stance": "賛成"
              },
              {
                "name": "水上幸彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "リベラル成田",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "海保茂喜",
                "stance": "賛成"
              },
              {
                "name": "伊藤竹夫",
                "stance": "賛成"
              },
              {
                "name": "油田清",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "荒川さくら",
                "stance": "反対"
              },
              {
                "name": "鵜澤治",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "虹と緑（会津素子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "会津素子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "暁真世（星野慎太郎）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "星野慎太郎",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月定例会議決結果詳細（令和8年3月定例会審議案件一覧（詳細））",
          "localUrl": "/sources/narita-shigikai-r8/000217235.pdf",
          "originUrl": "https://www.city.narita.chiba.jp/content/000217235.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021003941/https://www.city.narita.chiba.jp/content/000217235.pdf"
        }
      }
    }
  ],
  "122122": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "佐倉市議会",
      "seats": 28,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "さくら会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "自由民主さくら",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民ネットワーク",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "公開と改革",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（稲田敏昭）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和８年度佐倉市一般会計予算",
        "sessionLabel": "令和８年２月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 佐倉市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "佐倉市議会だより第120号（令和8年5月1日発行）2月定例会 議案賛否一覧",
        "localUrl": "/sources/sakura-shigikai-r8/Kh110_sakurashigikaidayori_120.pdf",
        "originUrl": "https://sakurashigikai.gijiroku.com/voices/gikaidoc/attach/koho/Kh110_sakurashigikaidayori_120.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021003749/https://sakurashigikai.gijiroku.com/voices/gikaidoc/attach/koho/Kh110_sakurashigikaidayori_120.pdf"
      },
      "result": {
        "title": "市長提出議案 議決結果（議案第1号 令和８年度佐倉市一般会計予算）",
        "localUrl": "/sources/sakura-shigikai-r8/g07_Giketsu_View.asp_db4f6bd9c1b6.html",
        "originUrl": "https://sakurashigikai.gijiroku.com/g07_Giketsu_View.asp?SrchID=2743",
        "archiveUrl": "https://web.archive.org/web/20261021003820/https://sakurashigikai.gijiroku.com/g07_Giketsu_View.asp?SrchID=2743"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 17,
          "議長": 1,
          "反対": 9,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "さくら会",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "齋藤寛之",
                "stance": "賛成"
              },
              {
                "name": "密本成章",
                "stance": "賛成"
              },
              {
                "name": "望月圧子",
                "stance": "賛成"
              },
              {
                "name": "斎藤明美",
                "stance": "賛成"
              },
              {
                "name": "敷根文裕",
                "stance": "賛成"
              },
              {
                "name": "村田穣史",
                "stance": "議長"
              },
              {
                "name": "高木大輔",
                "stance": "賛成"
              },
              {
                "name": "爲田浩",
                "stance": "賛成"
              },
              {
                "name": "平野裕子",
                "stance": "賛成"
              },
              {
                "name": "櫻井道明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主さくら",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "石井秀明",
                "stance": "賛成"
              },
              {
                "name": "徳永由美子",
                "stance": "賛成"
              },
              {
                "name": "橋岡協美",
                "stance": "賛成"
              },
              {
                "name": "山本英司",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "長谷川泰弘",
                "stance": "賛成"
              },
              {
                "name": "押木孝和",
                "stance": "賛成"
              },
              {
                "name": "鍋田達子",
                "stance": "賛成"
              },
              {
                "name": "岡村芳樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民ネットワーク",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "松島梢",
                "stance": "反対"
              },
              {
                "name": "伊藤とし子",
                "stance": "反対"
              },
              {
                "name": "五十嵐智美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "石井昇",
                "stance": "反対"
              },
              {
                "name": "木崎俊行",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "公開と改革",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "三谷英継",
                "stance": "反対"
              },
              {
                "name": "髙橋とみお",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派の会",
            "counts": {
              "反対": 1,
              "欠席": 1
            },
            "members": [
              {
                "name": "三井義文",
                "stance": "反対"
              },
              {
                "name": "宇田みおこ",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "無所属（稲田敏昭）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "稲田敏昭",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "佐倉市議会だより第120号 2月定例会 議案賛否一覧",
          "localUrl": "/sources/sakura-shigikai-r8/Kh110_sakurashigikaidayori_120.pdf",
          "originUrl": "https://sakurashigikai.gijiroku.com/voices/gikaidoc/attach/koho/Kh110_sakurashigikaidayori_120.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021003749/https://sakurashigikai.gijiroku.com/voices/gikaidoc/attach/koho/Kh110_sakurashigikaidayori_120.pdf"
        }
      }
    }
  ],
  "122165": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "習志野市議会",
      "seats": 28,
      "asOf": "2025-04-15",
      "asOfLabel": "2025年4月15日",
      "factions": [
        {
          "name": "真政会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "元気な習志野をつくる会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "環境みらい",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "民意と歩む会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "市民の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "都市政策研究会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "明日の習志野",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第１号",
        "billName": "令和８年度習志野市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 習志野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "習志野市議会 会派別名簿",
        "localUrl": "/sources/narashino-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20251018064912id_/https://www.city.narashino.lg.jp/joho/shigikai/meibo/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20251018064912id_/https://www.city.narashino.lg.jp/joho/shigikai/meibo/kaiha.html"
      },
      "result": {
        "title": "令和８年第１回定例会 議員別賛否一覧",
        "localUrl": "/sources/narashino-shigikai-r8/sanpiR8y1T.pdf",
        "originUrl": "https://www.city.narashino.lg.jp/material/files/group/112/sanpiR8y1T.pdf",
        "archiveUrl": "https://web.archive.org/web/20260327101522/https://www.city.narashino.lg.jp/material/files/group/112/sanpiR8y1T.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "真政会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "荒木和幸",
                "stance": "賛成"
              },
              {
                "name": "金子友之",
                "stance": "賛成"
              },
              {
                "name": "斉藤賢治",
                "stance": "賛成"
              },
              {
                "name": "佐々木秀一",
                "stance": "賛成"
              },
              {
                "name": "宮本博之",
                "stance": "賛成"
              },
              {
                "name": "三代川雄哉",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "元気な習志野をつくる会",
            "counts": {
              "議長": 1,
              "賛成": 4
            },
            "members": [
              {
                "name": "相原和幸",
                "stance": "議長"
              },
              {
                "name": "飯生喜正",
                "stance": "賛成"
              },
              {
                "name": "関根洋幸",
                "stance": "賛成"
              },
              {
                "name": "髙橋正明",
                "stance": "賛成"
              },
              {
                "name": "田中真太郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "金井宏志",
                "stance": "賛成"
              },
              {
                "name": "田中慶子",
                "stance": "賛成"
              },
              {
                "name": "布施孝一",
                "stance": "賛成"
              },
              {
                "name": "丸山秀雄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "環境みらい",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "市角雄幸",
                "stance": "賛成"
              },
              {
                "name": "寺川貴隆",
                "stance": "賛成"
              },
              {
                "name": "央重則",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "荒原ちえみ",
                "stance": "反対"
              },
              {
                "name": "入沢としゆき",
                "stance": "反対"
              },
              {
                "name": "谷岡隆",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "民意と歩む会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "鴨哲登志",
                "stance": "賛成"
              },
              {
                "name": "木村孝",
                "stance": "賛成"
              },
              {
                "name": "佐野正人",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民の会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "佐藤まり",
                "stance": "反対"
              },
              {
                "name": "宮内一夫",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "都市政策研究会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "平川博文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "明日の習志野",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大宮こうた",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議員別賛否一覧",
          "localUrl": "/sources/narashino-shigikai-r8/sanpiR8y1T.pdf",
          "originUrl": "https://www.city.narashino.lg.jp/material/files/group/112/sanpiR8y1T.pdf",
          "archiveUrl": "https://web.archive.org/web/20260327101522/https://www.city.narashino.lg.jp/material/files/group/112/sanpiR8y1T.pdf"
        }
      }
    }
  ],
  "122173": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "柏市議会",
      "seats": 35,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "柏清風",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "みらい構想かしわ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民サイド",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "共創かしわ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "柏エナジー",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "34",
        "billName": "令和８年度柏市一般会計予算について",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 柏市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "かしわ市議会だより253号 2面 会派名簿（令和８年３月24日現在）",
        "localUrl": "/sources/kashiwa-shigikai-r8/gikaidayori253goup2.pdf",
        "originUrl": "https://www.city.kashiwa.lg.jp/documents/45575/gikaidayori253goup2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001193104/https://www.city.kashiwa.lg.jp/documents/45575/gikaidayori253goup2.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会 議決結果一覧【3月24日】（議案）",
        "localUrl": "/sources/kashiwa-shigikai-r8/giantouhyoukekka2.pdf",
        "originUrl": "https://www.city.kashiwa.lg.jp/documents/45162/giantouhyoukekka2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001181347/https://www.city.kashiwa.lg.jp/documents/45162/giantouhyoukekka2.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "122190": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "市原市議会",
      "seats": 32,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "市凛会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "いちはら奏会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（岡泉）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第32号",
        "billName": "令和８年度市原市一般会計予算について",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 市原市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年第１回定例会議決（審査）結果（会派・議員別の賛否表）",
        "localUrl": "/sources/ichihara-shigikai-r8/R8①_議決結果.pdf",
        "originUrl": "https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021003616/https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf"
      },
      "result": {
        "title": "令和８年第１回定例会議決（審査）結果",
        "localUrl": "/sources/ichihara-shigikai-r8/R8①_議決結果.pdf",
        "originUrl": "https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021003616/https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 29,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 9
            },
            "members": [
              {
                "name": "相川真樹",
                "stance": "賛成"
              },
              {
                "name": "伊藤重明",
                "stance": "賛成"
              },
              {
                "name": "関学",
                "stance": "賛成"
              },
              {
                "name": "田尻貢",
                "stance": "賛成"
              },
              {
                "name": "永野喜光",
                "stance": "賛成"
              },
              {
                "name": "浜中吾郎",
                "stance": "賛成"
              },
              {
                "name": "平出泰秀",
                "stance": "賛成"
              },
              {
                "name": "保坂好則",
                "stance": "賛成"
              },
              {
                "name": "増茂誠二",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "安在尚太",
                "stance": "賛成"
              },
              {
                "name": "伊藤浩士",
                "stance": "賛成"
              },
              {
                "name": "菊地洋己",
                "stance": "賛成"
              },
              {
                "name": "斎藤武士",
                "stance": "賛成"
              },
              {
                "name": "塚本利政",
                "stance": "賛成"
              },
              {
                "name": "山内一平",
                "stance": "賛成"
              },
              {
                "name": "吉田峰行",
                "stance": "賛成"
              },
              {
                "name": "渡辺直樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "秋田信一",
                "stance": "賛成"
              },
              {
                "name": "橋本秀和",
                "stance": "賛成"
              },
              {
                "name": "堀田祐介",
                "stance": "賛成"
              },
              {
                "name": "目黒秀樹",
                "stance": "賛成"
              },
              {
                "name": "吉田あけみ",
                "stance": "賛成"
              },
              {
                "name": "伊佐和子",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市凛会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "大曽根友三",
                "stance": "賛成"
              },
              {
                "name": "勝地豊",
                "stance": "賛成"
              },
              {
                "name": "竹内直子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "いちはら奏会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小沢美佳",
                "stance": "賛成"
              },
              {
                "name": "中島拓",
                "stance": "賛成"
              },
              {
                "name": "森山薫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "駒形八寿子",
                "stance": "反対"
              },
              {
                "name": "福田雅彦",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（岡泉）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "岡泉",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会議決（審査）結果",
          "localUrl": "/sources/ichihara-shigikai-r8/R8①_議決結果.pdf",
          "originUrl": "https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021003616/https://www.city.ichihara.chiba.jp/blob/images/common-article/605d337febefad5392f9e333/R8%E2%91%A0_%E8%AD%B0%E6%B1%BA%E7%B5%90%E6%9E%9C.pdf"
        }
      }
    }
  ],
  "122203": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "流山市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2025-05-22",
      "asOfLabel": "2025年5月22日",
      "factions": [
        {
          "name": "流政会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "流山みらい",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に所属しない議員（鈴木ゆうすけ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（清水大）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（矢口輝美）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（森田洋一）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（阿部治正）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（楠山栄子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第1号",
        "billName": "令和８年度流山市一般会計予算",
        "sessionLabel": "令和８年流山市議会第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 流山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派等構成（令和７年５月２２日）",
        "localUrl": "/sources/nagareyama-shigikai-r8/kaiha.html",
        "originUrl": "https://www.nagareyamagikai.jp/gaiyo/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260419045853/https://www.nagareyamagikai.jp/gaiyo/kaiha.html"
      },
      "result": {
        "title": "令和８年流山市議会第１回定例会 議員別表決結果一覧",
        "localUrl": "/sources/nagareyama-shigikai-r8/R8_1_giketsukeka.pdf",
        "originUrl": "https://www.nagareyamagikai.jp/doc/2026032700013/file_contents/R8_1_giketsukeka.pdf",
        "archiveUrl": "https://web.archive.org/web/20260330152346/https://www.nagareyamagikai.jp/doc/2026032700013/file_contents/R8_1_giketsukeka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "流政会",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "小沢えみり",
                "stance": "賛成"
              },
              {
                "name": "川本大岳",
                "stance": "賛成"
              },
              {
                "name": "渡辺仁二",
                "stance": "賛成"
              },
              {
                "name": "近藤みほ",
                "stance": "賛成"
              },
              {
                "name": "坂巻儀一",
                "stance": "賛成"
              },
              {
                "name": "笠原久恵",
                "stance": "賛成"
              },
              {
                "name": "青野直",
                "stance": "賛成"
              },
              {
                "name": "石原修治",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "桑畑伴子",
                "stance": "賛成"
              },
              {
                "name": "岡明彦",
                "stance": "賛成"
              },
              {
                "name": "戸辺滋",
                "stance": "賛成"
              },
              {
                "name": "野村誠",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "乾えり",
                "stance": "反対"
              },
              {
                "name": "高橋あきら",
                "stance": "反対"
              },
              {
                "name": "植田和子",
                "stance": "反対"
              },
              {
                "name": "おだぎりたかし",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "流山みらい",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "うた桜子",
                "stance": "賛成"
              },
              {
                "name": "西尾段",
                "stance": "賛成"
              },
              {
                "name": "中村彰男",
                "stance": "賛成"
              },
              {
                "name": "藤井俊行",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "中川弘",
                "stance": "賛成"
              },
              {
                "name": "海老原功一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（鈴木ゆうすけ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鈴木ゆうすけ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（清水大）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "清水大",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（矢口輝美）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "矢口輝美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（森田洋一）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "森田洋一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（阿部治正）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "阿部治正",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（楠山栄子）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "楠山栄子",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年流山市議会第１回定例会 議員別表決結果一覧",
          "localUrl": "/sources/nagareyama-shigikai-r8/R8_1_giketsukeka.pdf",
          "originUrl": "https://www.nagareyamagikai.jp/doc/2026032700013/file_contents/R8_1_giketsukeka.pdf",
          "archiveUrl": "https://web.archive.org/web/20260330152346/https://www.nagareyamagikai.jp/doc/2026032700013/file_contents/R8_1_giketsukeka.pdf"
        }
      }
    }
  ],
  "122211": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "八千代市議会",
      "seats": 24,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "八千代市民に寄り添う会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（嵐芳隆）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（大竹秀樹）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（高山敏朗）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（三田登）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（若松博）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第21号",
        "billName": "令和８年度八千代市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 八千代市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員別賛否一覧表（令和8年第1回定例会）",
        "localUrl": "/sources/yachiyo-shigikai-r8/45999.pdf",
        "originUrl": "https://www.city.yachiyo.lg.jp/uploaded/attachment/45999.pdf",
        "archiveUrl": "https://web.archive.org/web/20260430145335/https://www.city.yachiyo.lg.jp/uploaded/attachment/45999.pdf"
      },
      "result": {
        "title": "議決結果（令和８年第１回定例会）",
        "localUrl": "/sources/yachiyo-shigikai-r8/77034.html",
        "originUrl": "https://www.city.yachiyo.lg.jp/soshiki/52/77034.html",
        "archiveUrl": "https://web.archive.org/web/20260430144858/https://www.city.yachiyo.lg.jp/soshiki/52/77034.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "欠席": 1,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "石山泰之",
                "stance": "賛成"
              },
              {
                "name": "末永隆",
                "stance": "賛成"
              },
              {
                "name": "髙橋秀行",
                "stance": "賛成"
              },
              {
                "name": "立川清英",
                "stance": "賛成"
              },
              {
                "name": "森妙子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 3,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "大塚裕介",
                "stance": "賛成"
              },
              {
                "name": "菅野文男",
                "stance": "欠席"
              },
              {
                "name": "辰己百恵",
                "stance": "賛成"
              },
              {
                "name": "萩原麻由美",
                "stance": "賛成"
              },
              {
                "name": "塚本路明",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小澤宏司",
                "stance": "賛成"
              },
              {
                "name": "澤田新一",
                "stance": "賛成"
              },
              {
                "name": "成田忠志",
                "stance": "賛成"
              },
              {
                "name": "林隆文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "飯川英樹",
                "stance": "反対"
              },
              {
                "name": "伊原忠",
                "stance": "反対"
              },
              {
                "name": "堀口明子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "八千代市民に寄り添う会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "飛知和真理子",
                "stance": "賛成"
              },
              {
                "name": "山口勇",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（嵐芳隆）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "嵐芳隆",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（大竹秀樹）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大竹秀樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（高山敏朗）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "高山敏朗",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（三田登）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "三田登",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（若松博）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "若松博",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議員別賛否一覧表（令和8年第1回定例会）",
          "localUrl": "/sources/yachiyo-shigikai-r8/45999.pdf",
          "originUrl": "https://www.city.yachiyo.lg.jp/uploaded/attachment/45999.pdf",
          "archiveUrl": "https://web.archive.org/web/20260430145335/https://www.city.yachiyo.lg.jp/uploaded/attachment/45999.pdf"
        }
      }
    }
  ],
  "122220": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "我孫子市議会",
      "seats": 24,
      "asOf": "2026-02-17",
      "asOfLabel": "2026年2月17日",
      "factions": [
        {
          "name": "清風会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "あびこ未来",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "我孫子政策倶楽部",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "市民フォーラム",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に所属していない議員",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第25号",
        "billName": "令和８年度一般会計予算",
        "sessionLabel": "令和８年第１回定例会（３月議会）",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 我孫子市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（令和8年2月17日現在）",
        "localUrl": "/sources/abiko-shigikai-r8/kaiha.html",
        "originUrl": "https://www.city.abiko.chiba.jp/shisei/shigikai/giinmeibo/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20261021005717/https://www.city.abiko.chiba.jp/shisei/shigikai/giinmeibo/kaiha.html"
      },
      "result": {
        "title": "あびこ議会だより No.237（令和８年第１回定例会（３月議会）・令和８年５月１日発行）",
        "localUrl": "/sources/abiko-shigikai-r8/237gou1-4men.pdf",
        "originUrl": "https://www.city.abiko.chiba.jp/shisei/shigikai/gikaidayori.files/237gou1-4men.pdf",
        "archiveUrl": "https://web.archive.org/web/20260710202300/http://www.city.abiko.chiba.jp/shisei/shigikai/gikaidayori.files/237gou1-4men.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 21,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "清風会",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "甲斐俊光",
                "stance": "賛成"
              },
              {
                "name": "椎名幸雄",
                "stance": "賛成"
              },
              {
                "name": "西垣一郎",
                "stance": "賛成"
              },
              {
                "name": "高木宏樹",
                "stance": "賛成"
              },
              {
                "name": "澤田敦士",
                "stance": "賛成"
              },
              {
                "name": "日暮俊一",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "木村得道",
                "stance": "賛成"
              },
              {
                "name": "江川克哉",
                "stance": "賛成"
              },
              {
                "name": "山下佳代",
                "stance": "賛成"
              },
              {
                "name": "島田安子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "あびこ未来",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "坂巻宗男",
                "stance": "賛成"
              },
              {
                "name": "早川真",
                "stance": "賛成"
              },
              {
                "name": "飯塚誠",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "我孫子政策倶楽部",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "豊島庸市",
                "stance": "賛成"
              },
              {
                "name": "芹澤正子",
                "stance": "賛成"
              },
              {
                "name": "深井優也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民フォーラム",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "佐々木豊治",
                "stance": "賛成"
              },
              {
                "name": "内田美恵子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "岩井康",
                "stance": "反対"
              },
              {
                "name": "船橋優",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に所属していない議員",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "茅野理",
                "stance": "賛成"
              },
              {
                "name": "海津にいな",
                "stance": "賛成"
              },
              {
                "name": "西川佳克",
                "stance": "賛成"
              },
              {
                "name": "芝田真代",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会採決結果一覧",
          "localUrl": "/sources/abiko-shigikai-r8/saiketsukekkaR8.3.sai.pdf",
          "originUrl": "https://www.city.abiko.chiba.jp/shisei/shigikai/teirei_rinji/kakonosaiketsu/index.files/saiketsukekkaR8.3.sai.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021004052/https://www.city.abiko.chiba.jp/shisei/shigikai/teirei_rinji/kakonosaiketsu/index.files/saiketsukekkaR8.3.sai.pdf"
        }
      }
    }
  ],
  "122319": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "印西市議会",
      "seats": 21,
      "asOf": "2026-03-13",
      "asOfLabel": "2026年3月13日",
      "factions": [
        {
          "name": "至誠",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "新政",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "TO BE",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "創進",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党（山田喜代子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "響（ひびき）（金丸和史）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "いま未来（松谷知美）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "印西ダイバーシティ（加藤亮二）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（近藤瑞枝）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第21号",
        "billName": "令和８年度印西市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-13",
        "decidedDateLabel": "令和8年3月13日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 印西市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和7年度政務活動費収支報告（領収証等含）について（令和7年度 政務活動費に関する会派の状況）",
        "localUrl": "/sources/inzai-shigikai-r8/0000021818.html",
        "originUrl": "https://www.city.inzai.lg.jp/0000021818.html",
        "archiveUrl": "https://web.archive.org/web/20261021004106/https://www.city.inzai.lg.jp/0000021818.html"
      },
      "result": {
        "title": "令和8年第1回定例会 会議結果（議案等処理結果一覧表）",
        "localUrl": "/sources/inzai-shigikai-r8/kekka8-1.pdf",
        "originUrl": "https://www.city.inzai.lg.jp/cmsfiles/contents/0000000/60/kekka8-1.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021004133/https://www.city.inzai.lg.jp/cmsfiles/contents/0000000/60/kekka8-1.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 19,
          "反対": 1,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "至誠",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "大﨑亜希",
                "stance": "賛成"
              },
              {
                "name": "大野忠寄",
                "stance": "賛成"
              },
              {
                "name": "米井重行",
                "stance": "賛成"
              },
              {
                "name": "岩崎成子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新政",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "津田憲吾",
                "stance": "賛成"
              },
              {
                "name": "海老原作一",
                "stance": "賛成"
              },
              {
                "name": "軍司俊紀",
                "stance": "賛成"
              },
              {
                "name": "板橋睦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "TO BE",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "都築真理子",
                "stance": "賛成"
              },
              {
                "name": "林勝利",
                "stance": "賛成"
              },
              {
                "name": "稲葉健",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "創進",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小川利彦",
                "stance": "賛成"
              },
              {
                "name": "増田葉子",
                "stance": "賛成"
              },
              {
                "name": "松尾榮子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "鈴木博美",
                "stance": "賛成"
              },
              {
                "name": "藤江研一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党（山田喜代子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "山田喜代子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "響（ひびき）（金丸和史）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "金丸和史",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "いま未来（松谷知美）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "松谷知美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "印西ダイバーシティ（加藤亮二）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "加藤亮二",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（近藤瑞枝）",
            "counts": {
              "議長": 1
            },
            "members": [
              {
                "name": "近藤瑞枝",
                "stance": "議長"
              }
            ]
          }
        ],
        "source": {
          "title": "いんざい議会だより No.216（令和8年5月）議案と審議結果",
          "localUrl": "/sources/inzai-shigikai-r8/No.216_web.pdf",
          "originUrl": "https://www.city.inzai.lg.jp/cmsfiles/contents/0000021/21658/No.216_web.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021004249/https://www.city.inzai.lg.jp/cmsfiles/contents/0000021/21658/No.216_web.pdf"
        }
      }
    }
  ],
  "131016": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "千代田区議会",
      "seats": 22,
      "asOf": "2026-01-23",
      "asOfLabel": "2026年1月23日",
      "factions": [
        {
          "name": "次世代・都民ファースト・立憲の会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "千代田区議会 自由民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "千代田区議会自由民主党議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "国民民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "ちよだの声",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会千代田議員団",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和8年度千代田区一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 千代田区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派紹介（更新日 2026年1月23日・2026-03-01 の魚拓）と各会派のページ（議決前の魚拓）",
        "localUrl": "/sources/chiyoda-kugikai-r8/index.html",
        "originUrl": "https://web.archive.org/web/20260301085133id_/https://gikai-chiyoda-tokyo.jp/about/kaiha/index.html",
        "archiveUrl": "https://web.archive.org/web/20260301085133id_/https://gikai-chiyoda-tokyo.jp/about/kaiha/index.html"
      },
      "result": {
        "title": "区議会だより ちよだ No.277",
        "localUrl": "/sources/chiyoda-kugikai-r8/277dayori.pdf",
        "originUrl": "https://gikai-chiyoda-tokyo.jp/katsudou/docs/277dayori.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008160927/https://gikai-chiyoda-tokyo.jp/katsudou/docs/277dayori.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "反対": 2,
          "議長": 1,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "次世代・都民ファースト・立憲の会",
            "counts": {
              "賛成": 5,
              "反対": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "岩佐りょう子",
                "stance": "賛成"
              },
              {
                "name": "小野なりこ",
                "stance": "賛成"
              },
              {
                "name": "入山たけひこ",
                "stance": "賛成"
              },
              {
                "name": "岩田かずひと",
                "stance": "反対"
              },
              {
                "name": "ふかみ貴子",
                "stance": "賛成"
              },
              {
                "name": "おのでら亮",
                "stance": "賛成"
              },
              {
                "name": "秋谷こうき",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "千代田区議会 自由民主党",
            "counts": {
              "欠席": 1,
              "賛成": 4
            },
            "members": [
              {
                "name": "西岡めぐみ",
                "stance": "欠席"
              },
              {
                "name": "大坂隆洋",
                "stance": "賛成"
              },
              {
                "name": "池田とものり",
                "stance": "賛成"
              },
              {
                "name": "はやお恭一",
                "stance": "賛成"
              },
              {
                "name": "小林たかや",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "千代田区議会自由民主党議員団",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "白川司",
                "stance": "賛成"
              },
              {
                "name": "永田壮一",
                "stance": "賛成"
              },
              {
                "name": "桜井ただし",
                "stance": "賛成"
              },
              {
                "name": "富山あゆみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党議員団",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "えごし雄一",
                "stance": "賛成"
              },
              {
                "name": "米田かずや",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "牛尾こうじろう",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "国民民主党",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "田中えりか",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "ちよだの声",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小枝すみ子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会千代田議員団",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "のざわ哲夫",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案の審議結果等（令和8年第1回定例会）",
          "localUrl": "/sources/chiyoda-kugikai-r8/20261teikekka.pdf",
          "originUrl": "https://gikai-chiyoda-tokyo.jp/kaigi/kekka/files/20261teikekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008165315/https://gikai-chiyoda-tokyo.jp/kaigi/kekka/files/20261teikekka.pdf"
        }
      }
    }
  ],
  "131032": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "港区議会",
      "seats": 32,
      "asOf": "2026-02-05",
      "asOfLabel": "2026年2月5日",
      "factions": [
        {
          "name": "自民党議員団",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "みなと未来会議",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "港区保守系議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "立憲民主党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "共産党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "港区れいわ新選組",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "都民ファーストの会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "小倉 りえこ",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第24号",
        "billName": "令和8年度港区一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 港区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（2026年2月5日・2026-02-11 の魚拓）",
        "localUrl": "/sources/minato-kugikai-r8/0000002539.html",
        "originUrl": "https://web.archive.org/web/20260211192957id_/https://www.gikai.city.minato.tokyo.jp/0000002539.html",
        "archiveUrl": "https://web.archive.org/web/20260211192957id_/https://www.gikai.city.minato.tokyo.jp/0000002539.html"
      },
      "result": {
        "title": "議案一覧（令和8年第1回定例会）",
        "localUrl": "/sources/minato-kugikai-r8/g07_giketsu.asp_Sflg_2_kaigi_2026_2F02_2F18_2C2026_2F03_2F18_2C140.html",
        "originUrl": "https://gikai2.city.minato.tokyo.jp/g07_giketsu.asp?Sflg=2&kaigi=2026%2F02%2F18%2C2026%2F03%2F18%2C140",
        "archiveUrl": "https://web.archive.org/web/20261008161308/https://gikai2.city.minato.tokyo.jp/g07_giketsu.asp?Sflg=2&kaigi=2026%2F02%2F18%2C2026%2F03%2F18%2C140"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "131041": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "新宿区議会",
      "seats": 38,
      "asOf": "2025-05-23",
      "asOfLabel": "2025年5月23日",
      "factions": [
        {
          "name": "自民・参政クラブ",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "新宿区議会公明党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党新宿区議会議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "新宿未来の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "立憲民主党・無所属クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本維新の会・新宿区議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "現役世代に優しい新宿・減税の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組 新宿",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第 1 号議案",
        "billName": "令和8年度新宿区一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 新宿区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派構成（最終更新日 2025年5月23日・2025-12-15 の魚拓）",
        "localUrl": "/sources/shinjuku-kugikai-r8/file08_00003.html",
        "originUrl": "https://web.archive.org/web/20251215030749id_/https://www.city.shinjuku.lg.jp/kusei/file08_00003.html",
        "archiveUrl": "https://web.archive.org/web/20251215030749id_/https://www.city.shinjuku.lg.jp/kusei/file08_00003.html"
      },
      "result": {
        "title": "議案の概要と審議結果（令和８年第１回定例会）",
        "localUrl": "/sources/shinjuku-kugikai-r8/000452334.pdf",
        "originUrl": "https://www.city.shinjuku.lg.jp/content/000452334.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008161535/https://www.city.shinjuku.lg.jp/content/000452334.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 29,
          "議長": 1,
          "反対": 8
        },
        "byFaction": [
          {
            "faction": "自民・参政クラブ",
            "counts": {
              "賛成": 8,
              "議長": 1
            },
            "members": [
              {
                "name": "渡辺清人",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "新宿区議会公明党",
            "counts": {
              "賛成": 8
            },
            "members": []
          },
          {
            "faction": "日本共産党新宿区議会議員団",
            "counts": {
              "反対": 7
            },
            "members": []
          },
          {
            "faction": "新宿未来の会",
            "counts": {
              "賛成": 6
            },
            "members": []
          },
          {
            "faction": "立憲民主党・無所属クラブ",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "日本維新の会・新宿区議団",
            "counts": {
              "賛成": 2
            },
            "members": []
          },
          {
            "faction": "現役世代に優しい新宿・減税の会",
            "counts": {
              "賛成": 2
            },
            "members": []
          },
          {
            "faction": "れいわ新選組 新宿",
            "counts": {
              "反対": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "議案の概要と審議結果（令和８年第１回定例会）",
          "localUrl": "/sources/shinjuku-kugikai-r8/000452334.pdf",
          "originUrl": "https://www.city.shinjuku.lg.jp/content/000452334.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008161535/https://www.city.shinjuku.lg.jp/content/000452334.pdf"
        }
      }
    }
  ],
  "131059": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "文京区議会",
      "seats": 33,
      "asOf": "2026-01-05",
      "asOfLabel": "2026年1月5日",
      "factions": [
        {
          "name": "自由民主党文京区議会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "日本共産党文京区議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党文京区議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "政策チーム AGORA",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "区民が主役の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "文京区議会日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "文京永久の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民フォーラム",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "ぶんきょう子育て.ネット",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "自由民主党「誉」",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "67",
        "billName": "令和8年度文京区一般会計予算",
        "sessionLabel": "令和8年2月定例議会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 文京区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（令和8年1月5日現在）",
        "localUrl": "/sources/bunkyo-kugikai-r8/p007737.html",
        "originUrl": "https://www.city.bunkyo.lg.jp/kugikai/p007737.html",
        "archiveUrl": "https://web.archive.org/web/20260607052524/https://www.city.bunkyo.lg.jp/kugikai/p007737.html"
      },
      "result": {
        "title": "令和８年２月定例議会 議案等議決結果一覧表",
        "localUrl": "/sources/bunkyo-kugikai-r8/giketukekka080317.pdf",
        "originUrl": "https://www.city.bunkyo.lg.jp/documents/6766/giketukekka080317.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008161750/https://www.city.bunkyo.lg.jp/documents/6766/giketukekka080317.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "131067": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "台東区議会",
      "seats": 31,
      "teisu": 32,
      "asOf": "2026-01-27",
      "asOfLabel": "2026年1月27日",
      "factions": [
        {
          "name": "台東区議会自由民主党",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "台東区議会公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "つなぐプロジェクト（無所属・都ファ・国民）",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "台東むすびの会（維新・参政・無所属）",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "れいわ立憲にじいろの会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党台東区議団",
          "seats": 3,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第5号議案",
        "billName": "令和8年度東京都台東区一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決（賛成多数）"
      },
      "sourceTitle": "令和8年度 台東区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（更新日 2026年1月27日・2026-03-13 の魚拓）",
        "localUrl": "/sources/taito-kugikai-r8/kaihabetsu.html",
        "originUrl": "https://web.archive.org/web/20260313051229id_/https://www.city.taito.lg.jp/kugikai/shokai/kaihabetsu.html",
        "archiveUrl": "https://web.archive.org/web/20260313051229id_/https://www.city.taito.lg.jp/kugikai/shokai/kaihabetsu.html"
      },
      "result": {
        "title": "令和8年第1回定例会の会議結果",
        "localUrl": "/sources/taito-kugikai-r8/08-dai1kai-kekka.html",
        "originUrl": "https://www.city.taito.lg.jp/kugikai/kaigi/honkaigi/r8/r8tei1/08-dai1kai-kekka.html",
        "archiveUrl": "https://web.archive.org/web/20261008170002/https://www.city.taito.lg.jp/kugikai/kaigi/honkaigi/r8/r8tei1/08-dai1kai-kekka.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 27,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "台東区議会自由民主党",
            "counts": {
              "賛成": 10,
              "議長": 1
            },
            "members": [
              {
                "name": "石川義弘",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "台東区議会公明党",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "つなぐプロジェクト（無所属・都ファ・国民）",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "台東むすびの会（維新・参政・無所属）",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "れいわ立憲にじいろの会",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "日本共産党台東区議団",
            "counts": {
              "反対": 3
            },
            "members": []
          }
        ],
        "source": {
          "title": "たいとう区議会だより No.249（令和8年4月20日）第１回定例会 議案の概要と審議結果",
          "localUrl": "/sources/taito-kugikai-r8/No249_01-08.pdf",
          "originUrl": "https://www.city.taito.lg.jp/kugikai/dayori/dayori/r8/249.files/No249_01-08.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008170108/https://www.city.taito.lg.jp/kugikai/dayori/dayori/r8/249.files/No249_01-08.pdf"
        }
      }
    }
  ],
  "131075": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "墨田区議会",
      "seats": 30,
      "asOf": "2026-01-28",
      "asOfLabel": "2026年1月28日",
      "factions": [
        {
          "name": "墨田区議会自由民主党・無所属",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "墨田区議会公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党墨田区議会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "すみだ未来フォーラム（都ファ）",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党墨田区議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "墨田区議会日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "新しいすみだ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属すみだ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "自由民主党すみだの会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第８２号",
        "billName": "令和８年度墨田区一般会計予算",
        "sessionLabel": "令和７年度定例会２月議会",
        "decidedDate": "2026-03-30",
        "decidedDateLabel": "令和8年3月30日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 墨田区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "すみだ区議会だより No.246（令和8年5月1日）会派等の所属議員",
        "localUrl": "/sources/sumida-kugikai-r8/dayori_246_5-8.pdf",
        "originUrl": "https://www.city.sumida.lg.jp/kugikai/kugikaidayori/R8_dayori.files/dayori_246_5-8.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008162341/https://www.city.sumida.lg.jp/kugikai/kugikaidayori/R8_dayori.files/dayori_246_5-8.pdf"
      },
      "result": {
        "title": "令和７年度定例会２月議会 議決議案と各議員の賛否の状況（３月３０日分）",
        "localUrl": "/sources/sumida-kugikai-r8/giantosanpi083030.pdf",
        "originUrl": "https://www.city.sumida.lg.jp/kugikai/kaigi_info/sanpinojokyo/giantosanpi.files/giantosanpi083030.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008162446/https://www.city.sumida.lg.jp/kugikai/kaigi_info/sanpinojokyo/giantosanpi.files/giantosanpi083030.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 26,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "墨田区議会自由民主党・無所属",
            "counts": {
              "賛成": 10,
              "議長": 1
            },
            "members": [
              {
                "name": "小林しょう",
                "stance": "賛成"
              },
              {
                "name": "稲葉かずひろ",
                "stance": "賛成"
              },
              {
                "name": "加藤ひろき",
                "stance": "賛成"
              },
              {
                "name": "井上裕幾",
                "stance": "賛成"
              },
              {
                "name": "あべよしたけ",
                "stance": "賛成"
              },
              {
                "name": "大門しろう",
                "stance": "賛成"
              },
              {
                "name": "堀よしあき",
                "stance": "賛成"
              },
              {
                "name": "坂井ユカコ",
                "stance": "賛成"
              },
              {
                "name": "しもむら緑",
                "stance": "賛成"
              },
              {
                "name": "福田はるみ",
                "stance": "賛成"
              },
              {
                "name": "佐藤篤",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "墨田区議会公明党",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "おまた雄一",
                "stance": "賛成"
              },
              {
                "name": "たかはしのりこ",
                "stance": "賛成"
              },
              {
                "name": "はねだ福代",
                "stance": "賛成"
              },
              {
                "name": "とも宣子",
                "stance": "賛成"
              },
              {
                "name": "高橋正利",
                "stance": "賛成"
              },
              {
                "name": "おおこし勝広",
                "stance": "賛成"
              },
              {
                "name": "加納進",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党墨田区議会議員団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "山下ひろみ",
                "stance": "反対"
              },
              {
                "name": "村本ひろや",
                "stance": "反対"
              },
              {
                "name": "としま剛",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "すみだ未来フォーラム（都ファ）",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "甲斐まりこ",
                "stance": "賛成"
              },
              {
                "name": "あべきみこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党墨田区議団",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "遠藤ミホ",
                "stance": "賛成"
              },
              {
                "name": "中村あきひろ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "墨田区議会日本維新の会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "船橋けんご",
                "stance": "賛成"
              },
              {
                "name": "しみず良平",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新しいすみだ",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "井上ノエミ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属すみだ",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "桜井浩之",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党すみだの会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "たきざわ正宜",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和７年度定例会２月議会 議決議案と各議員の賛否の状況（３月３０日分）",
          "localUrl": "/sources/sumida-kugikai-r8/giantosanpi083030.pdf",
          "originUrl": "https://www.city.sumida.lg.jp/kugikai/kaigi_info/sanpinojokyo/giantosanpi.files/giantosanpi083030.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008162446/https://www.city.sumida.lg.jp/kugikai/kaigi_info/sanpinojokyo/giantosanpi.files/giantosanpi083030.pdf"
        }
      }
    }
  ],
  "131083": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "江東区議会",
      "seats": 39,
      "asOf": "2026-03-27",
      "asOfLabel": "2026年3月27日",
      "factions": [
        {
          "name": "江東区議会自民・参政・無所属クラブ",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "江東区議会公明党",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "江東新時代の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "江東区議会維新・国民・共生クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党江東区議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "江東清風会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第5号",
        "billName": "令和８年度江東区一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 江東区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "こうとう区議会だより 第350号（令和8年5月21日発行）会派別所属議員（令和8年3月27日現在）",
        "localUrl": "/sources/koto-kugikai-r8/no350.pdf",
        "originUrl": "https://www.city.koto.lg.jp/650103/kuse/kugikai/dayori/pdf/documents/documents/no350.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008162522/https://www.city.koto.lg.jp/650103/kuse/kugikai/dayori/pdf/documents/documents/no350.pdf"
      },
      "result": {
        "title": "こうとう区議会だより 第350号（令和8年第1回定例会）第１回定例会で審議した議案等一覧",
        "localUrl": "/sources/koto-kugikai-r8/no350.pdf",
        "originUrl": "https://www.city.koto.lg.jp/650103/kuse/kugikai/dayori/pdf/documents/documents/no350.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008162522/https://www.city.koto.lg.jp/650103/kuse/kugikai/dayori/pdf/documents/documents/no350.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 31,
          "議長": 1,
          "欠席": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "江東区議会自民・参政・無所属クラブ",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "釼先美彦",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "江東区議会公明党",
            "counts": {
              "賛成": 9
            },
            "members": []
          },
          {
            "faction": "江東新時代の会",
            "counts": {
              "賛成": 4,
              "欠席": 1
            },
            "members": [
              {
                "name": "鬼頭たつや",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "江東区議会維新・国民・共生クラブ",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "日本共産党江東区議団",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "江東清風会",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無所属",
            "counts": {
              "賛成": 2,
              "反対": 2
            },
            "members": [
              {
                "name": "まにわ尚之",
                "stance": "反対"
              },
              {
                "name": "高野はやと",
                "stance": "反対"
              },
              {
                "name": "千田昌寛",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等の審議結果（令和８年第１回定例会）",
          "localUrl": "/sources/koto-kugikai-r8/r8-1giketukekka.pdf",
          "originUrl": "https://www.city.koto.lg.jp/650102/documents/r8-1giketukekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008162546/https://www.city.koto.lg.jp/650102/documents/r8-1giketukekka.pdf"
        }
      }
    }
  ],
  "131091": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "品川区議会",
      "seats": 37,
      "asOf": "2025-09-17",
      "asOfLabel": "2025年9月17日",
      "factions": [
        {
          "name": "品川区議会自民党・無所属の会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "しながわ未来",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "品川区議会公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党品川区議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "品川区議会日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 8,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第５号議案",
        "billName": "令和８年度品川区一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 品川区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿(会派等)（令和7年9月17日現在）",
        "localUrl": "/sources/shinagawa-kugikai-r8/group.html",
        "originUrl": "https://web.archive.org/web/20260312074626id_/https://gikai.city.shinagawa.tokyo.jp/profile/group",
        "archiveUrl": "https://web.archive.org/web/20260312074626id_/https://gikai.city.shinagawa.tokyo.jp/profile/group"
      },
      "result": {
        "title": "令和８年第１回定例会 議案と各議員の賛否の状況",
        "localUrl": "/sources/shinagawa-kugikai-r8/r08_01t_s.pdf",
        "originUrl": "https://gikai.city.shinagawa.tokyo.jp/wp-content/themes/shinagawakugikai/pdf/r08_01t_s.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008162827/https://gikai.city.shinagawa.tokyo.jp/wp-content/themes/shinagawakugikai/pdf/r08_01t_s.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 34,
          "議長": 1,
          "欠席": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "品川区議会自民党・無所属の会",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "石田秀男",
                "stance": "賛成"
              },
              {
                "name": "えのした正人",
                "stance": "賛成"
              },
              {
                "name": "こしば新",
                "stance": "賛成"
              },
              {
                "name": "澤田えみこ",
                "stance": "賛成"
              },
              {
                "name": "せお麻里",
                "stance": "賛成"
              },
              {
                "name": "西村直子",
                "stance": "賛成"
              },
              {
                "name": "まつざわ和昌",
                "stance": "賛成"
              },
              {
                "name": "渡辺ゆういち",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "しながわ未来",
            "counts": {
              "賛成": 7,
              "欠席": 1
            },
            "members": [
              {
                "name": "大倉たかひろ",
                "stance": "賛成"
              },
              {
                "name": "おぎのあやか",
                "stance": "賛成"
              },
              {
                "name": "木村健悟",
                "stance": "欠席"
              },
              {
                "name": "田中たけし",
                "stance": "賛成"
              },
              {
                "name": "筒井ようすけ",
                "stance": "賛成"
              },
              {
                "name": "藤原正則",
                "stance": "賛成"
              },
              {
                "name": "松永よしひろ",
                "stance": "賛成"
              },
              {
                "name": "山本やすゆき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "品川区議会公明党",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "あくつ広王",
                "stance": "賛成"
              },
              {
                "name": "こんの孝子",
                "stance": "賛成"
              },
              {
                "name": "塚本よしひろ",
                "stance": "賛成"
              },
              {
                "name": "つる伸一郎",
                "stance": "賛成"
              },
              {
                "name": "新妻さえ子",
                "stance": "賛成"
              },
              {
                "name": "ゆきた政春",
                "stance": "賛成"
              },
              {
                "name": "若林ひろき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党品川区議団",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "安藤たい作",
                "stance": "賛成"
              },
              {
                "name": "石田ちひろ",
                "stance": "賛成"
              },
              {
                "name": "鈴木ひろ子",
                "stance": "賛成"
              },
              {
                "name": "のだて稔史",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "品川区議会日本維新の会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "せらく真央",
                "stance": "賛成"
              },
              {
                "name": "松本ときひろ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "賛成": 7,
              "反対": 1
            },
            "members": [
              {
                "name": "須貝行宏",
                "stance": "賛成"
              },
              {
                "name": "高橋しんじ",
                "stance": "賛成"
              },
              {
                "name": "高橋伸明",
                "stance": "賛成"
              },
              {
                "name": "中塚亮",
                "stance": "賛成"
              },
              {
                "name": "西本たか子",
                "stance": "反対"
              },
              {
                "name": "やなぎさわ聡",
                "stance": "賛成"
              },
              {
                "name": "横山由香理",
                "stance": "賛成"
              },
              {
                "name": "吉田ゆみこ",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議案と各議員の賛否の状況",
          "localUrl": "/sources/shinagawa-kugikai-r8/r08_01t_s.pdf",
          "originUrl": "https://gikai.city.shinagawa.tokyo.jp/wp-content/themes/shinagawakugikai/pdf/r08_01t_s.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008162827/https://gikai.city.shinagawa.tokyo.jp/wp-content/themes/shinagawakugikai/pdf/r08_01t_s.pdf"
        }
      }
    }
  ],
  "131105": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "目黒区議会",
      "seats": 32,
      "asOf": "2026-01-28",
      "asOfLabel": "2026年1月28日",
      "factions": [
        {
          "name": "自由民主党目黒区議団・区民の会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "めぐろの未来をつくる会（無所属・国民・維新）",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党目黒区議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "立憲民主・目黒フォーラム",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党目黒区議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無会派（上田みのり）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（こいでまあり）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（白川愛）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（増茂しのぶ）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第22号",
        "billName": "令和8年度目黒区一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 目黒区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議会の構成（令和8年1月28日現在）",
        "localUrl": "/sources/meguro-kugikai-r8/kosei.html",
        "originUrl": "https://web.archive.org/web/20260214105549id_/https://www.city.meguro.tokyo.jp/kugikai/kusei/kugikai/kosei.html",
        "archiveUrl": "https://web.archive.org/web/20260214105549id_/https://www.city.meguro.tokyo.jp/kugikai/kusei/kugikai/kosei.html"
      },
      "result": {
        "title": "令和8年第1回定例会の議決結果",
        "localUrl": "/sources/meguro-kugikai-r8/8-1teireigiketukeka.html",
        "originUrl": "https://www.city.meguro.tokyo.jp/kugikai/kusei/kugikai/8-1teireigiketukeka.html",
        "archiveUrl": "https://web.archive.org/web/20260413211157/https://www.city.meguro.tokyo.jp/kugikai/kusei/kugikai/8-1teireigiketukeka.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 27,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "自由民主党目黒区議団・区民の会",
            "counts": {
              "賛成": 8,
              "議長": 1
            },
            "members": [
              {
                "name": "鈴木まさし",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "めぐろの未来をつくる会（無所属・国民・維新）",
            "counts": {
              "賛成": 6
            },
            "members": []
          },
          {
            "faction": "公明党目黒区議団",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "立憲民主・目黒フォーラム",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "日本共産党目黒区議団",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "無会派（上田みのり）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "上田みのり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（こいでまあり）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "こいでまあり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（白川愛）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "白川愛",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（増茂しのぶ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "増茂しのぶ",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議決結果【令和8年3月23日議決】（個人名を記載した会派ごとの賛否）",
          "localUrl": "/sources/meguro-kugikai-r8/k_r08-1teirei0323.pdf",
          "originUrl": "https://www.city.meguro.tokyo.jp/documents/19666/k_r08-1teirei0323.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008163031/https://www.city.meguro.tokyo.jp/documents/19666/k_r08-1teirei0323.pdf"
        }
      }
    }
  ],
  "131113": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大田区議会",
      "seats": 48,
      "asOf": "2026-01-05",
      "asOfLabel": "2026年1月5日",
      "factions": [
        {
          "name": "自由民主党大田区議団・無所属の会",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "大田区議会公明党",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "つばさ大田区議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党大田区議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "立憲民主党大田区議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本維新の会大田区議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "大田区議会 都民ファーストの会・国民民主党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "フェアな民主主義",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "OTAれいわ新選組",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "大田子ども防災会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "おおた未来創志会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "1",
        "billName": "令和８年度大田区一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決（賛成者多数）"
      },
      "sourceTitle": "令和8年度 大田区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "委員会名簿（更新日 2026年1月5日・2026-02-15 の魚拓）",
        "localUrl": "/sources/ota-kugikai-r8/iinkaimeibo.html",
        "originUrl": "https://web.archive.org/web/20260215131259id_/https://www.city.ota.tokyo.jp/gikai/shoukai/iinkaimeibo.html",
        "archiveUrl": "https://web.archive.org/web/20260215131259id_/https://www.city.ota.tokyo.jp/gikai/shoukai/iinkaimeibo.html"
      },
      "result": {
        "title": "令和8年第1回定例会 区長提出議案",
        "localUrl": "/sources/ota-kugikai-r8/r0801teirei_kuchogian.html",
        "originUrl": "https://www.city.ota.tokyo.jp/gikai/kugikai_katsudou/honkaigi/r_8/1teirei/r0801teirei_kuchogian.html",
        "archiveUrl": "https://web.archive.org/web/20261008170855/https://www.city.ota.tokyo.jp/gikai/kugikai_katsudou/honkaigi/r_8/1teirei/r0801teirei_kuchogian.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 39,
          "議長": 1,
          "反対": 7,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "自由民主党大田区議団・無所属の会",
            "counts": {
              "賛成": 12,
              "議長": 1
            },
            "members": [
              {
                "name": "鈴木隆之",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "大田区議会公明党",
            "counts": {
              "賛成": 11
            },
            "members": []
          },
          {
            "faction": "つばさ大田区議団",
            "counts": {
              "賛成": 6
            },
            "members": []
          },
          {
            "faction": "日本共産党大田区議団",
            "counts": {
              "反対": 5
            },
            "members": []
          },
          {
            "faction": "立憲民主党大田区議団",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "日本維新の会大田区議団",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "大田区議会 都民ファーストの会・国民民主党",
            "counts": {
              "賛成": 1,
              "欠席": 1
            },
            "members": [
              {
                "name": "とく山れいこ",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "フェアな民主主義",
            "counts": {
              "反対": 1
            },
            "members": []
          },
          {
            "faction": "OTAれいわ新選組",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "大田子ども防災会",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "おおた未来創志会",
            "counts": {
              "反対": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "意見が異なった議案に対する各会派の態度（令和8年第1回定例会）",
          "localUrl": "/sources/ota-kugikai-r8/r0801teirei_taido.html",
          "originUrl": "https://www.city.ota.tokyo.jp/gikai/kugikai_katsudou/honkaigi/r_8/1teirei/r0801teirei_taido.html",
          "archiveUrl": "https://web.archive.org/web/20261008163242/https://www.city.ota.tokyo.jp/gikai/kugikai_katsudou/honkaigi/r_8/1teirei/r0801teirei_taido.html"
        }
      }
    }
  ],
  "131148": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "中野区議会",
      "seats": 41,
      "asOf": "2026-03-06",
      "asOfLabel": "2026年3月6日",
      "factions": [
        {
          "name": "立憲・国民・ネット・無所属議員団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "自由民主党議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "都民ファーストの会中野区議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 5,
          "isIndependent": true
        },
        {
          "name": "無所属（日本維新の会）（斉藤けいた）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（れいわ新選組）（井関源二）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第６号議案",
        "billName": "令和８年度中野区一般会計予算",
        "sessionLabel": "第１回定例会",
        "decidedDate": "2026-03-06",
        "decidedDateLabel": "令和8年3月6日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 中野区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "中野区議会だより第289号（第１回定例会・意見の分かれた案件）",
        "localUrl": "/sources/nakano-kugikai-r8/289-26427114355.pdf",
        "originUrl": "https://kugikai-nakano.jp/dayori/289-26427114355.pdf",
        "archiveUrl": "https://web.archive.org/web/20260512163934/https://kugikai-nakano.jp/dayori/289-26427114355.pdf"
      },
      "result": {
        "title": "本会議 議案一覧（令和8年 第１回定例会）",
        "localUrl": "/sources/nakano-kugikai-r8/honkaigi.html_nen_2026_gian_id_119.html",
        "originUrl": "https://kugikai-nakano.jp/honkaigi.html?nen=2026&gian_id=119",
        "archiveUrl": "https://web.archive.org/web/20260711024539/https://kugikai-nakano.jp/honkaigi.html?nen=2026&gian_id=119"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 30,
          "議長": 1,
          "反対": 10
        },
        "byFaction": [
          {
            "faction": "立憲・国民・ネット・無所属議員団",
            "counts": {
              "賛成": 10,
              "議長": 1
            },
            "members": [
              {
                "name": "森たかゆき",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自由民主党議員団",
            "counts": {
              "反対": 8
            },
            "members": []
          },
          {
            "faction": "公明党議員団",
            "counts": {
              "賛成": 7
            },
            "members": []
          },
          {
            "faction": "日本共産党議員団",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "都民ファーストの会中野区議団",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 2,
              "賛成": 3
            },
            "members": [
              {
                "name": "吉田康一郎",
                "stance": "反対"
              },
              {
                "name": "立石りお",
                "stance": "賛成"
              },
              {
                "name": "小宮山たかし",
                "stance": "賛成"
              },
              {
                "name": "石坂わたる",
                "stance": "賛成"
              },
              {
                "name": "むとう有子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（日本維新の会）（斉藤けいた）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "斉藤けいた",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（れいわ新選組）（井関源二）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "井関源二",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "中野区議会だより第289号 意見の分かれた案件（第１回定例会）",
          "localUrl": "/sources/nakano-kugikai-r8/289-26427114355.pdf",
          "originUrl": "https://kugikai-nakano.jp/dayori/289-26427114355.pdf",
          "archiveUrl": "https://web.archive.org/web/20260512163934/https://kugikai-nakano.jp/dayori/289-26427114355.pdf"
        }
      }
    }
  ],
  "131156": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "杉並区議会",
      "seats": 47,
      "asOf": "2026-03-19",
      "asOfLabel": "2026年3月19日",
      "factions": [
        {
          "name": "杉並区議会自由民主党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党杉並区議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "杉並区議会公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "立憲民主党杉並区議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "シスターフッド杉並",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "維新・無所属議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属・都民ファーストの会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "安心・安全杉並の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党杉並",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "都政を革新する会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本自由党杉並",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "杉並わくわく会議",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "区政杉並クラブ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "far right",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "杉並区議会国民民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "杉並区議会立憲民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属（堀部やすし）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第28号",
        "billName": "令和8年度杉並区一般会計予算（予算特別委員会付託案件）",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 杉並区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年第１回定例会 議案等の審議結果（議員別）の列見出し（会派・議席番号順）",
        "localUrl": "/sources/suginami-kugikai-r8/1teigiankekka.pdf",
        "originUrl": "https://www.city.suginami.tokyo.jp/documents/24929/1teigiankekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20260725053656/https://www.city.suginami.tokyo.jp/documents/24929/1teigiankekka.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会議案・議決結果の一覧",
        "localUrl": "/sources/suginami-kugikai-r8/24929.html",
        "originUrl": "https://www.city.suginami.tokyo.jp/kugikai/s117/24929.html",
        "archiveUrl": "https://web.archive.org/web/20260607112125/https://www.city.suginami.tokyo.jp/kugikai/s117/24929.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "反対": 20,
          "賛成": 26,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "杉並区議会自由民主党",
            "counts": {
              "反対": 8
            },
            "members": [
              {
                "name": "へんみ純一",
                "stance": "反対"
              },
              {
                "name": "わたなべ友貴",
                "stance": "反対"
              },
              {
                "name": "矢口やすゆき",
                "stance": "反対"
              },
              {
                "name": "大和田伸",
                "stance": "反対"
              },
              {
                "name": "浅井くにお",
                "stance": "反対"
              },
              {
                "name": "脇坂たつや",
                "stance": "反対"
              },
              {
                "name": "吉田あい",
                "stance": "反対"
              },
              {
                "name": "藤本なおや",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党杉並区議団",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "和氣みき",
                "stance": "賛成"
              },
              {
                "name": "小池めぐみ",
                "stance": "賛成"
              },
              {
                "name": "酒井まさえ",
                "stance": "賛成"
              },
              {
                "name": "山田耕平",
                "stance": "賛成"
              },
              {
                "name": "富田たく",
                "stance": "賛成"
              },
              {
                "name": "くすやま美紀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "杉並区議会公明党",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "斉藤りか",
                "stance": "賛成"
              },
              {
                "name": "山本ひろ子",
                "stance": "賛成"
              },
              {
                "name": "中村康弘",
                "stance": "賛成"
              },
              {
                "name": "川原口宏之",
                "stance": "賛成"
              },
              {
                "name": "おおつき城一",
                "stance": "賛成"
              },
              {
                "name": "渡辺富士雄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党杉並区議団",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "松本浩一",
                "stance": "賛成"
              },
              {
                "name": "前山なおこ",
                "stance": "賛成"
              },
              {
                "name": "てらだはるか",
                "stance": "賛成"
              },
              {
                "name": "安田マリ",
                "stance": "賛成"
              },
              {
                "name": "ひわき岳",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "シスターフッド杉並",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "ブランシャー明日香",
                "stance": "賛成"
              },
              {
                "name": "奥山たえこ",
                "stance": "賛成"
              },
              {
                "name": "奥田雅子",
                "stance": "賛成"
              },
              {
                "name": "そね文子",
                "stance": "賛成"
              },
              {
                "name": "山名かなこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "維新・無所属議員団",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "鈴木ちづる",
                "stance": "賛成"
              },
              {
                "name": "田中朝子",
                "stance": "賛成"
              },
              {
                "name": "井口かづ子",
                "stance": "賛成"
              },
              {
                "name": "木梨もりよし",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "無所属・都民ファーストの会",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "井口えみ",
                "stance": "反対"
              },
              {
                "name": "宇田川ゆうじ",
                "stance": "反対"
              },
              {
                "name": "あかねがくぼ舞",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "安心・安全杉並の会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "倉本みか",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "参政党杉並",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "横田政直",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "都政を革新する会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "ほらぐちともこ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本自由党杉並",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "田中ゆうたろう",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "杉並わくわく会議",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "松尾ゆり",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（堀部やすし）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "堀部やすし",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "区政杉並クラブ",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "岩田いくま",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "far right",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "小林ゆみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "杉並区議会国民民主党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "安斉あきら",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "杉並区議会立憲民主党",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "赤坂たまよ",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議案等の審議結果（議員別）",
          "localUrl": "/sources/suginami-kugikai-r8/1teigiankekka.pdf",
          "originUrl": "https://www.city.suginami.tokyo.jp/documents/24929/1teigiankekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20260725053656/https://www.city.suginami.tokyo.jp/documents/24929/1teigiankekka.pdf"
        }
      }
    }
  ],
  "131199": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "板橋区議会",
      "seats": 44,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "自民党",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "民主クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "共産党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "いたばし未来",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属議員",
          "seats": 2,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和8年度一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 板橋区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案等に対する審査結果（令和８年第１回定例会）の会派別の列見出し",
        "localUrl": "/sources/itabashi-kugikai-r8/r80324_giankekka.pdf",
        "originUrl": "https://www.city.itabashi.tokyo.jp/_res/projects/default_project/_page_/001/011/530/r80324_giankekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261008163743/https://www.city.itabashi.tokyo.jp/_res/projects/default_project/_page_/001/011/530/r80324_giankekka.pdf"
      },
      "result": {
        "title": "いたばし区議会だより（令和8年第1回定例会）テキストページ4 第1回定例会の審議結果",
        "localUrl": "/sources/itabashi-kugikai-r8/1063847.html",
        "originUrl": "https://www.city.itabashi.tokyo.jp/kugikai/dayori/text/1063843/1063847.html",
        "archiveUrl": "https://web.archive.org/web/20261008163943/https://www.city.itabashi.tokyo.jp/kugikai/dayori/text/1063843/1063847.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 37,
          "議長": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "自民党",
            "counts": {
              "賛成": 15,
              "議長": 1
            },
            "members": [
              {
                "name": "ひはらみちこ",
                "stance": "賛成"
              },
              {
                "name": "近藤タカヒロ",
                "stance": "賛成"
              },
              {
                "name": "木田おりべ",
                "stance": "賛成"
              },
              {
                "name": "一島ひろし",
                "stance": "賛成"
              },
              {
                "name": "横川たかゆき",
                "stance": "賛成"
              },
              {
                "name": "内田けんいちろう",
                "stance": "賛成"
              },
              {
                "name": "間中りんぺい",
                "stance": "賛成"
              },
              {
                "name": "中村とらあき",
                "stance": "賛成"
              },
              {
                "name": "山田たかゆき",
                "stance": "賛成"
              },
              {
                "name": "田中しゅんすけ",
                "stance": "議長"
              },
              {
                "name": "長瀬達也",
                "stance": "賛成"
              },
              {
                "name": "田中やすのり",
                "stance": "賛成"
              },
              {
                "name": "元山芳行",
                "stance": "賛成"
              },
              {
                "name": "大野治彦",
                "stance": "賛成"
              },
              {
                "name": "川口雅敏",
                "stance": "賛成"
              },
              {
                "name": "佐々木としたか",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 10
            },
            "members": [
              {
                "name": "実正やすゆき",
                "stance": "賛成"
              },
              {
                "name": "いがらし学",
                "stance": "賛成"
              },
              {
                "name": "わたなべ一美",
                "stance": "賛成"
              },
              {
                "name": "寺田ひろし",
                "stance": "賛成"
              },
              {
                "name": "さかまき常行",
                "stance": "賛成"
              },
              {
                "name": "いしだ圭一郎",
                "stance": "賛成"
              },
              {
                "name": "成島ゆかり",
                "stance": "賛成"
              },
              {
                "name": "鈴木こうすけ",
                "stance": "賛成"
              },
              {
                "name": "しば佳代子",
                "stance": "賛成"
              },
              {
                "name": "田中いさお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "民主クラブ",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "岩永きりん",
                "stance": "賛成"
              },
              {
                "name": "くまだ智子",
                "stance": "賛成"
              },
              {
                "name": "おばた健太郎",
                "stance": "賛成"
              },
              {
                "name": "中妻じょうた",
                "stance": "賛成"
              },
              {
                "name": "五十嵐やす子",
                "stance": "賛成"
              },
              {
                "name": "おなだか勝",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "共産党",
            "counts": {
              "反対": 6
            },
            "members": [
              {
                "name": "小柳しげる",
                "stance": "反対"
              },
              {
                "name": "石川すみえ",
                "stance": "反対"
              },
              {
                "name": "山内えり",
                "stance": "反対"
              },
              {
                "name": "荒川なお",
                "stance": "反対"
              },
              {
                "name": "いわい桐子",
                "stance": "反対"
              },
              {
                "name": "小林おとみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "いたばし未来",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "大野ゆか",
                "stance": "賛成"
              },
              {
                "name": "井上温子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小野ゆりこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "参政党",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "坂田れい子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属議員",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "しいなひろみ",
                "stance": "賛成"
              },
              {
                "name": "大森大",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等に対する審査結果（令和８年第１回定例会 ２月１３日、３月２日、２４日）",
          "localUrl": "/sources/itabashi-kugikai-r8/r80324_giankekka.pdf",
          "originUrl": "https://www.city.itabashi.tokyo.jp/_res/projects/default_project/_page_/001/011/530/r80324_giankekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261008163743/https://www.city.itabashi.tokyo.jp/_res/projects/default_project/_page_/001/011/530/r80324_giankekka.pdf"
        }
      }
    }
  ],
  "131202": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "練馬区議会",
      "seats": 50,
      "teisu": 50,
      "asOf": "2025-07-01",
      "asOfLabel": "2025年7月1日",
      "factions": [
        {
          "name": "練馬区議会自由民主党",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "練馬区議会公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "練馬区議会無所属・都民ファーストの会・国民民主党・ウェルビーイングな会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党練馬区議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "練馬区議会立憲民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "インクルーシブな練馬をめざす会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "生活者ネットワーク",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "つながる市民・練馬",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "練馬区議会福祉ループ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "練馬区議会みどりの風",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "練馬区議会参政党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組練馬",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "練馬区議会日本維新の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第1号",
        "billName": "令和8年度練馬区一般会計予算",
        "sessionLabel": "令和8年第一回定例会",
        "decidedDate": "2026-03-13",
        "decidedDateLabel": "令和8年3月13日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 練馬区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 2025年7月1日）",
        "localUrl": "/sources/nerima-kugikai-r8/070609kaiha.html",
        "originUrl": "https://web.archive.org/web/20260214082849id_/https://www.city.nerima.tokyo.jp/gikai/giin/070609kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260214082849id_/https://www.city.nerima.tokyo.jp/gikai/giin/070609kaiha.html"
      },
      "result": {
        "title": "議決された議案（令和8年第一回定例会）",
        "localUrl": "/sources/nerima-kugikai-r8/081giketugian.html",
        "originUrl": "https://www.city.nerima.tokyo.jp/gikai/kaigi/r8/dai1teirei/081giketugian.html",
        "archiveUrl": "https://web.archive.org/web/20260519102958/https://www.city.nerima.tokyo.jp/gikai/kaigi/r8/dai1teirei/081giketugian.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "131211": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "足立区議会",
      "seats": 41,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "足立区議会自由民主党",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "足立区議会公明党",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "日本共産党足立区議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "是々非々の会（維新・参政・無所属・立憲）",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "都民ファースト・無所属の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組・市民派の会あだち",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（市川おさと）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（野沢てつや）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第5号議案",
        "billName": "令和8年度足立区一般会計予算",
        "sessionLabel": "令和8年 第1回 定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 足立区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案の審議結果など（令和８年第１回定例会）の会派別の列見出し",
        "localUrl": "/sources/adachi-kugikai-r8/Kg112_R8.1T0324.pdf",
        "originUrl": "https://www.gikai-adachi.jp/voices/GikaiDoc/attach/Congress/Kg112_R8.1T0324.pdf",
        "archiveUrl": "https://www.gikai-adachi.jp/voices/GikaiDoc/attach/Congress/Kg112_R8.1T0324.pdf"
      },
      "result": {
        "title": "議案の検索（令和8年 第1回 定例会）",
        "localUrl": "/sources/adachi-kugikai-r8/g07_giketsu.asp_KWORD1_EXP_AND_KWORD2_BUNRUI_KAIGI_2026_02_19_2026_03_24_134_NENFROM_NENTO_KEKKA_SMODE_2_KENSU_100_Sflg_2.html",
        "originUrl": "https://www.gikai-adachi.jp/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026/02/19,2026/03/24,134&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2",
        "archiveUrl": "https://web.archive.org/web/20261008164847/https://www.gikai-adachi.jp/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026%2F02%2F19,2026%2F03%2F24,134&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "131237": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "江戸川区議会",
      "seats": 44,
      "teisu": 44,
      "asOf": "2026-03-25",
      "asOfLabel": "2026年3月25日",
      "factions": [
        {
          "name": "区議会自由民主党",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "江戸川区議会公明党",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "超党会派えどがわ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党江戸川区議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（五十嵐まさお）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（滝沢泰子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和8年度江戸川区一般会計予算",
        "sessionLabel": "令和8年 第1回 定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 江戸川区議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和8年第1回定例会 区長提出議案の審議結果（3月25日議決分・会派別の列見出し）",
        "localUrl": "/sources/edogawa-kugikai-r8/Kg93_sinngikekka2.pdf",
        "originUrl": "https://www.gikai.city.edogawa.tokyo.jp/voices/GikaiDoc/attach/Congress/Kg93_sinngikekka2.pdf",
        "archiveUrl": "https://web.archive.org/web/20260325115052/https://www.gikai.city.edogawa.tokyo.jp/voices/GikaiDoc/attach/Congress/Kg93_sinngikekka2.pdf"
      },
      "result": {
        "title": "議案一覧（令和8年 第1回 定例会）",
        "localUrl": "/sources/edogawa-kugikai-r8/g07_giketsu.asp_KWORD1_EXP_AND_KWORD2_BUNRUI_KAIGI_2026_02_17_2026_03_25_149_NENFROM_NENTO_KEKKA_SMODE_2_KENSU_100_Sflg_2.html",
        "originUrl": "https://www.gikai.city.edogawa.tokyo.jp/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026/02/17,2026/03/25,149&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2",
        "archiveUrl": "https://web.archive.org/web/20261008165142/https://www.gikai.city.edogawa.tokyo.jp/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026%2F02%2F17,2026%2F03%2F25,149&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 38,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "区議会自由民主党",
            "counts": {
              "賛成": 12,
              "議長": 1
            },
            "members": [
              {
                "name": "高木秀隆",
                "stance": "賛成"
              },
              {
                "name": "岩田将和",
                "stance": "賛成"
              },
              {
                "name": "鹿倉勇",
                "stance": "賛成"
              },
              {
                "name": "勝山まゆみ",
                "stance": "賛成"
              },
              {
                "name": "小林智夫",
                "stance": "賛成"
              },
              {
                "name": "金井高志",
                "stance": "賛成"
              },
              {
                "name": "田島寛之",
                "stance": "賛成"
              },
              {
                "name": "野﨑信",
                "stance": "賛成"
              },
              {
                "name": "田中寿一",
                "stance": "賛成"
              },
              {
                "name": "福本光浩",
                "stance": "賛成"
              },
              {
                "name": "藤澤進一",
                "stance": "賛成"
              },
              {
                "name": "須賀精二",
                "stance": "賛成"
              },
              {
                "name": "島村和成",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "江戸川区議会公明党",
            "counts": {
              "賛成": 12
            },
            "members": [
              {
                "name": "川瀬泰徳",
                "stance": "賛成"
              },
              {
                "name": "竹内進",
                "stance": "賛成"
              },
              {
                "name": "関根麻美子",
                "stance": "賛成"
              },
              {
                "name": "窪田龍一",
                "stance": "賛成"
              },
              {
                "name": "中道貴",
                "stance": "賛成"
              },
              {
                "name": "佐々木勇一",
                "stance": "賛成"
              },
              {
                "name": "川合佐奈子",
                "stance": "賛成"
              },
              {
                "name": "佐野朋子",
                "stance": "賛成"
              },
              {
                "name": "伊藤照子",
                "stance": "賛成"
              },
              {
                "name": "堀江創一",
                "stance": "賛成"
              },
              {
                "name": "所隆宏",
                "stance": "賛成"
              },
              {
                "name": "太田公弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "超党会派えどがわ",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "笹本ひさし",
                "stance": "賛成"
              },
              {
                "name": "本西光枝",
                "stance": "賛成"
              },
              {
                "name": "中野ヘンリ",
                "stance": "賛成"
              },
              {
                "name": "きもと麻由",
                "stance": "賛成"
              },
              {
                "name": "伊藤ひとみ",
                "stance": "賛成"
              },
              {
                "name": "田村ひろし",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "神尾昭央",
                "stance": "賛成"
              },
              {
                "name": "金井しげる",
                "stance": "賛成"
              },
              {
                "name": "間宮由美",
                "stance": "賛成"
              },
              {
                "name": "桝秀行",
                "stance": "賛成"
              },
              {
                "name": "小林あすか",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党江戸川区議員団",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "小俣則子",
                "stance": "反対"
              },
              {
                "name": "牧野けんじ",
                "stance": "反対"
              },
              {
                "name": "大橋美枝子",
                "stance": "反対"
              },
              {
                "name": "太田彩花",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "丸山れいこ",
                "stance": "賛成"
              },
              {
                "name": "林あきこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（五十嵐まさお）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "五十嵐まさお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（滝沢泰子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "滝沢泰子",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会 区長提出議案に対する議員別審議結果（3月25日議決分）",
          "localUrl": "/sources/edogawa-kugikai-r8/Kg93_sinngikekka2.pdf",
          "originUrl": "https://www.gikai.city.edogawa.tokyo.jp/voices/GikaiDoc/attach/Congress/Kg93_sinngikekka2.pdf",
          "archiveUrl": "https://web.archive.org/web/20260325115052/https://www.gikai.city.edogawa.tokyo.jp/voices/GikaiDoc/attach/Congress/Kg93_sinngikekka2.pdf"
        }
      }
    }
  ],
  "132012": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "八王子市議会",
      "seats": 38,
      "asOf": "2025-06-09",
      "asOfLabel": "2025年6月9日",
      "factions": [
        {
          "name": "自民党新政会",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "八王子市議会公明党",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "日本共産党八王子市議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "立憲民主・市民の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "諸派",
          "seats": 7,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第5号",
        "billName": "令和8年度八王子市一般会計予算について",
        "sessionLabel": "令和8年第1回市議会定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 八王子市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（令和7年（2025年）6月9日現在）",
        "localUrl": "/sources/hachioji-shigikai-r8/R7-6-9.pdf",
        "originUrl": "https://www.city.hachioji.tokyo.jp/contents/shigikai_1/giin/kakushu/p010679_d/fil/R7-6-9.pdf",
        "archiveUrl": "https://web.archive.org/web/20261002113757/https://www.city.hachioji.tokyo.jp/contents/shigikai_1/giin/kakushu/p010679_d/fil/R7-6-9.pdf"
      },
      "result": {
        "title": "令和8年(2026年)第1回市議会定例会 議案の一覧",
        "localUrl": "/sources/hachioji-shigikai-r8/p037014.html",
        "originUrl": "https://www.city.hachioji.tokyo.jp/contents/shigikai_1/gikainokatudou/honnkaigi/reiwa8/p037014.html",
        "archiveUrl": "https://web.archive.org/web/20260420122418/https://www.city.hachioji.tokyo.jp/contents/shigikai_1/gikainokatudou/honnkaigi/reiwa8/p037014.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 30,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "自民党新政会",
            "counts": {
              "賛成": 11
            },
            "members": [
              {
                "name": "長谷川順子",
                "stance": "賛成"
              },
              {
                "name": "内田由香利",
                "stance": "賛成"
              },
              {
                "name": "立川寛之",
                "stance": "賛成"
              },
              {
                "name": "西室真希",
                "stance": "賛成"
              },
              {
                "name": "岸田功典",
                "stance": "賛成"
              },
              {
                "name": "川村奈緒美",
                "stance": "賛成"
              },
              {
                "name": "岩田祐樹",
                "stance": "賛成"
              },
              {
                "name": "吉本孝良",
                "stance": "賛成"
              },
              {
                "name": "鈴木玲央",
                "stance": "賛成"
              },
              {
                "name": "福安徹",
                "stance": "賛成"
              },
              {
                "name": "小林秀司",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "八王子市議会公明党",
            "counts": {
              "議長": 1,
              "賛成": 9
            },
            "members": [
              {
                "name": "美濃部弥生",
                "stance": "議長"
              },
              {
                "name": "古里幸太郎",
                "stance": "賛成"
              },
              {
                "name": "森重博正",
                "stance": "賛成"
              },
              {
                "name": "日下部広志",
                "stance": "賛成"
              },
              {
                "name": "久保井博美",
                "stance": "賛成"
              },
              {
                "name": "冨永純子",
                "stance": "賛成"
              },
              {
                "name": "渡口禎",
                "stance": "賛成"
              },
              {
                "name": "中島正寿",
                "stance": "賛成"
              },
              {
                "name": "五間浩",
                "stance": "賛成"
              },
              {
                "name": "村松徹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党八王子市議会議員団",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "綿林夕夏",
                "stance": "反対"
              },
              {
                "name": "望月翔平",
                "stance": "反対"
              },
              {
                "name": "市川克宏",
                "stance": "反対"
              },
              {
                "name": "石井宏和",
                "stance": "反対"
              },
              {
                "name": "鈴木勇次",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主・市民の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "浜野正太",
                "stance": "賛成"
              },
              {
                "name": "九鬼ともみ",
                "stance": "賛成"
              },
              {
                "name": "森喜彦",
                "stance": "賛成"
              },
              {
                "name": "安藤修三",
                "stance": "賛成"
              },
              {
                "name": "小林裕恵",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "諸派",
            "counts": {
              "賛成": 5,
              "反対": 2
            },
            "members": [
              {
                "name": "高橋剛",
                "stance": "賛成"
              },
              {
                "name": "舩木翔平",
                "stance": "賛成"
              },
              {
                "name": "玉正彩加",
                "stance": "反対"
              },
              {
                "name": "金子亜希子",
                "stance": "反対"
              },
              {
                "name": "山本貴士",
                "stance": "賛成"
              },
              {
                "name": "及川賢一",
                "stance": "賛成"
              },
              {
                "name": "星野直美",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 記名投票を行った議案 個人別賛否",
          "localUrl": "/sources/hachioji-shigikai-r8/r8yosan_kimei.pdf",
          "originUrl": "https://www.city.hachioji.tokyo.jp/contents/shigikai_1/gikainokatudou/honnkaigi/reiwa8/p037014_d/fil/r8yosan_kimei.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002113829/https://www.city.hachioji.tokyo.jp/contents/shigikai_1/gikainokatudou/honnkaigi/reiwa8/p037014_d/fil/r8yosan_kimei.pdf"
        }
      }
    }
  ],
  "132021": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "立川市議会",
      "seats": 24,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "立憲ネット緑たちかわ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "会派を構成しない議員（中山ひと美）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（大石ふみお）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（頭山太郎）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（江口元気）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（粂川敏男）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（いしとびかおり）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派を構成しない議員（髙畠奈美）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第2号",
        "billName": "令和8年度立川市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 立川市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "たちかわ市議会便り第342号（令和8年4月25日）8面 各議案等に対する賛否（会派名／議員名）",
        "localUrl": "/sources/tachikawa-shigikai-r8/342-8.pdf",
        "originUrl": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/027/149/342-8.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009035946/https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/027/149/342-8.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会議案一覧",
        "localUrl": "/sources/tachikawa-shigikai-r8/1026380.html",
        "originUrl": "https://www.city.tachikawa.lg.jp/shigikai/katsudo/1007184/1026374/1026375/1026380.html",
        "archiveUrl": "https://web.archive.org/web/20260302103547/https://www.city.tachikawa.lg.jp/shigikai/katsudo/1007184/1026374/1026375/1026380.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "福島正美",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "立憲ネット緑たちかわ",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "会派を構成しない議員（中山ひと美）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "中山ひと美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（大石ふみお）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大石ふみお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（頭山太郎）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "頭山太郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（江口元気）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "江口元気",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（粂川敏男）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "粂川敏男",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（いしとびかおり）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "いしとびかおり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派を構成しない議員（髙畠奈美）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "髙畠奈美",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "たちかわ市議会便り第342号（令和8年4月25日）各議案等に対する賛否",
          "localUrl": "/sources/tachikawa-shigikai-r8/342-8.pdf",
          "originUrl": "https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/027/149/342-8.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009035946/https://www.city.tachikawa.lg.jp/_res/projects/default_project/_page_/001/027/149/342-8.pdf"
        }
      }
    }
  ],
  "132039": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "武蔵野市議会",
      "seats": 25,
      "asOf": "2025-10-31",
      "asOfLabel": "2025年10月31日",
      "factions": [
        {
          "name": "立憲民主ネット",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "自由民主・市民クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市議会公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党武蔵野市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本維新の会武蔵野市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "ワクワクはたらく",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属むさしの",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 2,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第24号",
        "billName": "令和８年度武蔵野市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 武蔵野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "武蔵野市議会会派名簿（会派別名簿・更新日 2025年10月31日）",
        "localUrl": "/sources/musashino-shigikai-r8/1001172.html",
        "originUrl": "https://www.city.musashino.lg.jp/shigikai/giin/1001172.html",
        "archiveUrl": "https://web.archive.org/web/20260510175651/https://www.city.musashino.lg.jp/shigikai/giin/1001172.html"
      },
      "result": {
        "title": "令和8年第1回定例会 本会議における審議結果",
        "localUrl": "/sources/musashino-shigikai-r8/r080327-2.pdf",
        "originUrl": "https://www.city.musashino.lg.jp/_res/projects/default_project/_page_/001/001/444/r080327-2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009000123/https://www.city.musashino.lg.jp/_res/projects/default_project/_page_/001/001/444/r080327-2.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "退席",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "退席": 1,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "立憲民主ネット",
            "counts": {
              "賛成": 5,
              "退席": 1
            },
            "members": [
              {
                "name": "菅源太郎",
                "stance": "賛成"
              },
              {
                "name": "藪原太郎",
                "stance": "賛成"
              },
              {
                "name": "蔵野恵美子",
                "stance": "賛成"
              },
              {
                "name": "西園寺みきこ",
                "stance": "退席"
              },
              {
                "name": "川名ゆうじ",
                "stance": "賛成"
              },
              {
                "name": "深沢達也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主・市民クラブ",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "道場ひでのり",
                "stance": "賛成"
              },
              {
                "name": "きくち由美子",
                "stance": "賛成"
              },
              {
                "name": "木崎剛",
                "stance": "議長"
              },
              {
                "name": "山崎たかし",
                "stance": "賛成"
              },
              {
                "name": "与座武",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市議会公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "大野あつ子",
                "stance": "賛成"
              },
              {
                "name": "浜田けい子",
                "stance": "賛成"
              },
              {
                "name": "落合勝利",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党武蔵野市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "橋本しげき",
                "stance": "反対"
              },
              {
                "name": "三島杉子",
                "stance": "反対"
              },
              {
                "name": "本間まさよ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会武蔵野市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "深田貴美子",
                "stance": "反対"
              },
              {
                "name": "東山あきお",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "ワクワクはたらく",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "宮代一利",
                "stance": "賛成"
              },
              {
                "name": "本多夏帆",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属むさしの",
            "counts": {
              "賛成": 1,
              "反対": 1
            },
            "members": [
              {
                "name": "さこうもみ",
                "stance": "賛成"
              },
              {
                "name": "山本ひとみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に属さない議員",
            "counts": {
              "賛成": 1,
              "反対": 1
            },
            "members": [
              {
                "name": "小林まさよし",
                "stance": "賛成"
              },
              {
                "name": "下田ひろき",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会 本会議における審議結果",
          "localUrl": "/sources/musashino-shigikai-r8/r080327-2.pdf",
          "originUrl": "https://www.city.musashino.lg.jp/_res/projects/default_project/_page_/001/001/444/r080327-2.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009000123/https://www.city.musashino.lg.jp/_res/projects/default_project/_page_/001/001/444/r080327-2.pdf"
        }
      }
    }
  ],
  "132047": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "三鷹市議会",
      "seats": 27,
      "asOf": "2025-05-28",
      "asOfLabel": "2025年5月28日",
      "factions": [
        {
          "name": "三鷹市議会自民クラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "三鷹市議会公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "立憲民主緑風会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党三鷹市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "れいわ・市民自治の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "三鷹市議会都民ファーストの会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "つなぐ三鷹の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属（半田伸明）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第19号",
        "billName": "令和8年度三鷹市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 三鷹市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（令和7年5月28日現在）",
        "localUrl": "/sources/mitaka-shigikai-r8/party.html",
        "originUrl": "https://web.archive.org/web/20260315165830id_/https://www.gikai.city.mitaka.tokyo.jp/member/party.html",
        "archiveUrl": "https://web.archive.org/web/20260315165830id_/https://www.gikai.city.mitaka.tokyo.jp/member/party.html"
      },
      "result": {
        "title": "本会議の結果（令和8年第1回定例会）",
        "localUrl": "/sources/mitaka-shigikai-r8/custom_2026a.html",
        "originUrl": "https://www.gikai.city.mitaka.tokyo.jp/activity/result/2026/custom_2026a.html",
        "archiveUrl": "https://web.archive.org/web/20261009014118/https://www.gikai.city.mitaka.tokyo.jp/activity/result/2026/custom_2026a.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "議長": 1,
          "反対": 8
        },
        "byFaction": [
          {
            "faction": "三鷹市議会自民クラブ",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "吉野けんさく",
                "stance": "賛成"
              },
              {
                "name": "太田みつこ",
                "stance": "賛成"
              },
              {
                "name": "吉田まさとし",
                "stance": "賛成"
              },
              {
                "name": "池田有也",
                "stance": "賛成"
              },
              {
                "name": "加藤こうじ",
                "stance": "賛成"
              },
              {
                "name": "土屋けんいち",
                "stance": "賛成"
              },
              {
                "name": "伊藤俊明",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "三鷹市議会公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "佐々木かずよ",
                "stance": "賛成"
              },
              {
                "name": "赤松大一",
                "stance": "賛成"
              },
              {
                "name": "大倉あき子",
                "stance": "賛成"
              },
              {
                "name": "粕谷稔",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主緑風会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "岩見大三",
                "stance": "賛成"
              },
              {
                "name": "おばた和仁",
                "stance": "賛成"
              },
              {
                "name": "高谷真一朗",
                "stance": "賛成"
              },
              {
                "name": "谷口敏也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党三鷹市議会議員団",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "大城美幸",
                "stance": "反対"
              },
              {
                "name": "紫野あすか",
                "stance": "反対"
              },
              {
                "name": "前田まい",
                "stance": "反対"
              },
              {
                "name": "栗原けんじ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "れいわ・市民自治の会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "石井れいこ",
                "stance": "反対"
              },
              {
                "name": "野村羊子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "三鷹市議会都民ファーストの会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "山田さとみ",
                "stance": "賛成"
              },
              {
                "name": "原めぐみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（半田伸明）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "半田伸明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "つなぐ三鷹の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "成田ちひろ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "中泉きよし",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "参政党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "蛯澤征剛",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会採決結果一覧",
          "localUrl": "/sources/mitaka-shigikai-r8/2026custom1giantou_saiketu.pdf",
          "originUrl": "https://www.gikai.city.mitaka.tokyo.jp/activity/pdf/2026custom1giantou_saiketu.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009013938/https://www.gikai.city.mitaka.tokyo.jp/activity/pdf/2026custom1giantou_saiketu.pdf"
        }
      }
    }
  ],
  "132063": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "府中市議会",
      "seats": 28,
      "asOf": "2025-07-01",
      "asOfLabel": "2025年7月1日",
      "factions": [
        {
          "name": "府中市議会市政会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "府中市議会市民フォーラム（立憲民主党・都民ファーストの会・無所属）",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明府中",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自由クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党府中市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "生活者ネットワーク",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ野口なかおと仲間たち",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属（西のなおみ）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "28",
        "billName": "令和8年度府中市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-16",
        "decidedDateLabel": "令和8年3月16日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 府中市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派（更新日 2025年7月1日）",
        "localUrl": "/sources/fuchu-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20260215074314id_/https://www.city.fuchu.tokyo.jp/gikai/member/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260215074314id_/https://www.city.fuchu.tokyo.jp/gikai/member/kaiha.html"
      },
      "result": {
        "title": "令和8年第1回定例会 議案議決結果一覧",
        "localUrl": "/sources/fuchu-shigikai-r8/r8dai1kaigiketukekka.html",
        "originUrl": "https://www.city.fuchu.tokyo.jp/gikai/shingi/naiyo/r8dai1kaigiketukekka.html",
        "archiveUrl": "https://web.archive.org/web/20261009001126/https://www.city.fuchu.tokyo.jp/gikai/shingi/naiyo/r8dai1kaigiketukekka.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "府中市議会市政会",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "おぎの雄太郎",
                "stance": "賛成"
              },
              {
                "name": "宮田よしひと",
                "stance": "賛成"
              },
              {
                "name": "大室はじめ",
                "stance": "賛成"
              },
              {
                "name": "秋山としゆき",
                "stance": "賛成"
              },
              {
                "name": "松村祐樹",
                "stance": "賛成"
              },
              {
                "name": "横田実",
                "stance": "賛成"
              },
              {
                "name": "比留間利蔵",
                "stance": "賛成"
              },
              {
                "name": "佐藤新悟",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "府中市議会市民フォーラム（立憲民主党・都民ファーストの会・無所属）",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "前川浩子",
                "stance": "賛成"
              },
              {
                "name": "渡辺しょう",
                "stance": "賛成"
              },
              {
                "name": "にしみや幸一",
                "stance": "賛成"
              },
              {
                "name": "稲津憲護",
                "stance": "賛成"
              },
              {
                "name": "手塚としひさ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明府中",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "坂本けんいち",
                "stance": "賛成"
              },
              {
                "name": "福田千夏",
                "stance": "賛成"
              },
              {
                "name": "髙津みどり",
                "stance": "賛成"
              },
              {
                "name": "西村陸",
                "stance": "賛成"
              },
              {
                "name": "奈良﨑久和",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "山本真実",
                "stance": "賛成"
              },
              {
                "name": "ゆうきりょう",
                "stance": "賛成"
              },
              {
                "name": "杉村康之",
                "stance": "賛成"
              },
              {
                "name": "そなえ邦彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党府中市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "竹内祐子",
                "stance": "反対"
              },
              {
                "name": "からさわ地平",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "えもとひろあき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "生活者ネットワーク",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "奥村さち子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（西のなおみ）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "西のなおみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "れいわ野口なかおと仲間たち",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "野口なかお",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "ふちゅう市議会だより第329号（令和8年4月29日発行）賛否が分かれた議案",
          "localUrl": "/sources/fuchu-shigikai-r8/fuchu-shigikaidayori_329.pdf",
          "originUrl": "https://www.city.fuchu.tokyo.jp/gikai/dayori/backnumber/reiwa8/329.files/fuchu-shigikaidayori_329.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009000938/https://www.city.fuchu.tokyo.jp/gikai/dayori/backnumber/reiwa8/329.files/fuchu-shigikaidayori_329.pdf"
        }
      }
    }
  ],
  "132080": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "調布市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2025-05-20",
      "asOfLabel": "2025年5月20日",
      "factions": [
        {
          "name": "チャレンジ調布",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自民党新政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "れいわネット・にじいろの会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "調布ミライ政策会議",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "次世代・調布",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "25",
        "billName": "令和8年度調布市一般会計予算",
        "sessionLabel": "令和8年第1回調布市議会定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 調布市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "調布市議会の会派 会派別所属議員（令和7年5月20日現在）",
        "localUrl": "/sources/chofu-shigikai-r8/p077028.html",
        "originUrl": "https://web.archive.org/web/20260412201947id_/https://www.city.chofu.lg.jp/140010/p077028.html",
        "archiveUrl": "https://web.archive.org/web/20260412201947id_/https://www.city.chofu.lg.jp/140010/p077028.html"
      },
      "result": {
        "title": "令和8年第1回調布市議会定例会会議結果",
        "localUrl": "/sources/chofu-shigikai-r8/p077265.html",
        "originUrl": "https://www.city.chofu.lg.jp/140010/p077265.html",
        "archiveUrl": "https://web.archive.org/web/20260516140228/https://www.city.chofu.lg.jp/140010/p077265.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "132098": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "町田市議会",
      "seats": 36,
      "teisu": 36,
      "asOf": "2026-03-25",
      "asOfLabel": "2026年3月25日",
      "factions": [
        {
          "name": "まちだみらい",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "選ばれる町田をつくる会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "自由民主党・日本維新の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 4,
          "isIndependent": true
        },
        {
          "name": "諸派",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第9号議案",
        "billName": "令和８年度（２０２６年度）町田市一般会計予算",
        "sessionLabel": "令和８年（２０２６年）第１回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 町田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年（２０２６年）第１回定例会議案審議結果一覧表（列見出しの会派と議員）",
        "localUrl": "/sources/machida-shigikai-r8/Kg81_HP_20260325_saiketsu.pdf",
        "originUrl": "https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009001534/https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf"
      },
      "result": {
        "title": "令和８年（２０２６年）第１回定例会議案審議結果一覧表",
        "localUrl": "/sources/machida-shigikai-r8/Kg81_HP_20260325_saiketsu.pdf",
        "originUrl": "https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009001534/https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 26,
          "議長": 1,
          "反対": 9
        },
        "byFaction": [
          {
            "faction": "まちだみらい",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "森本せいや",
                "stance": "賛成"
              },
              {
                "name": "イスレスつばさ",
                "stance": "賛成"
              },
              {
                "name": "渡辺さとし",
                "stance": "賛成"
              },
              {
                "name": "小野りゅうじ",
                "stance": "賛成"
              },
              {
                "name": "笹倉みどり",
                "stance": "賛成"
              },
              {
                "name": "今村るか",
                "stance": "賛成"
              },
              {
                "name": "佐藤和彦",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "選ばれる町田をつくる会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "若林章喜",
                "stance": "賛成"
              },
              {
                "name": "前田げんき",
                "stance": "賛成"
              },
              {
                "name": "ばんないさき",
                "stance": "賛成"
              },
              {
                "name": "白川哲也",
                "stance": "賛成"
              },
              {
                "name": "渡辺厳太郎",
                "stance": "賛成"
              },
              {
                "name": "岩瀬和子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党・日本維新の会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "加藤真彦",
                "stance": "賛成"
              },
              {
                "name": "小沢タケル",
                "stance": "賛成"
              },
              {
                "name": "おぜき重太郎",
                "stance": "賛成"
              },
              {
                "name": "三遊亭らん丈",
                "stance": "賛成"
              },
              {
                "name": "熊沢あやり",
                "stance": "賛成"
              },
              {
                "name": "佐藤伸一郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "松葉ひろみ",
                "stance": "賛成"
              },
              {
                "name": "森じゅん子",
                "stance": "賛成"
              },
              {
                "name": "馬部ゆきまさ",
                "stance": "賛成"
              },
              {
                "name": "小野寺まなぶ",
                "stance": "賛成"
              },
              {
                "name": "おんじょう由久",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "細野龍子",
                "stance": "反対"
              },
              {
                "name": "大野まこと",
                "stance": "反対"
              },
              {
                "name": "田中みほ",
                "stance": "反対"
              },
              {
                "name": "殿村健一",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "松岡みゆき",
                "stance": "反対"
              },
              {
                "name": "はせがわ圭亮",
                "stance": "反対"
              },
              {
                "name": "新井よしなお",
                "stance": "反対"
              },
              {
                "name": "吉田つとむ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "諸派",
            "counts": {
              "反対": 1,
              "賛成": 3
            },
            "members": [
              {
                "name": "うのつのぶこ",
                "stance": "反対"
              },
              {
                "name": "矢口まゆ",
                "stance": "賛成"
              },
              {
                "name": "友井和彦",
                "stance": "賛成"
              },
              {
                "name": "ふじた学",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年（２０２６年）第１回定例会議案審議結果一覧表",
          "localUrl": "/sources/machida-shigikai-r8/Kg81_HP_20260325_saiketsu.pdf",
          "originUrl": "https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009001534/https://www.gikai-machida.jp/voices/GikaiDoc/attach/Congress/Kg81_HP_20260325_saiketsu.pdf"
        }
      }
    }
  ],
  "132110": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "小平市議会",
      "seats": 27,
      "asOf": "2025-06-03",
      "asOfLabel": "2025年6月3日",
      "factions": [
        {
          "name": "自民党小平政和会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "市議会公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "フォーラム小平",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党小平市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "一人会派と維新の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "生活者ネットワーク",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "まちづくり市民こだいら（水口かずえ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "市議会れいわ新選組（中倉茂和）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第4号",
        "billName": "令和8年度小平市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 小平市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（1）（2）（令和7年6月3日現在）",
        "localUrl": "/sources/kodaira-shigikai-r8/105692.html",
        "originUrl": "https://web.archive.org/web/20250614015824id_/https://www.city.kodaira.tokyo.jp/gikai/105/105692.html",
        "archiveUrl": "https://web.archive.org/web/20250614015824id_/https://www.city.kodaira.tokyo.jp/gikai/105/105692.html"
      },
      "result": {
        "title": "令和8年3月定例会で議決した議案",
        "localUrl": "/sources/kodaira-shigikai-r8/127359.html",
        "originUrl": "https://web.archive.org/web/20260512160010id_/http://www.city.kodaira.tokyo.jp/gikai/127/127359.html",
        "archiveUrl": "https://web.archive.org/web/20260512160010id_/http://www.city.kodaira.tokyo.jp/gikai/127/127359.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 19,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "自民党小平政和会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "福室英俊",
                "stance": "賛成"
              },
              {
                "name": "鈴木洋一",
                "stance": "賛成"
              },
              {
                "name": "外山まなみ",
                "stance": "賛成"
              },
              {
                "name": "比留間洋一",
                "stance": "賛成"
              },
              {
                "name": "深谷幸信",
                "stance": "賛成"
              },
              {
                "name": "山田大輔",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市議会公明党",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "幸田昌之",
                "stance": "賛成"
              },
              {
                "name": "佐藤徹",
                "stance": "賛成"
              },
              {
                "name": "髙橋政美",
                "stance": "賛成"
              },
              {
                "name": "津本裕子",
                "stance": "賛成"
              },
              {
                "name": "橋本孝二",
                "stance": "賛成"
              },
              {
                "name": "虻川浩",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "フォーラム小平",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "中江美和",
                "stance": "賛成"
              },
              {
                "name": "岩本誠",
                "stance": "賛成"
              },
              {
                "name": "岡田しんぺい",
                "stance": "賛成"
              },
              {
                "name": "川里富美",
                "stance": "賛成"
              },
              {
                "name": "吉本ゆうすけ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党小平市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "細谷正",
                "stance": "反対"
              },
              {
                "name": "鈴木だいち",
                "stance": "反対"
              },
              {
                "name": "三輪博美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "一人会派と維新の会",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "伊藤央",
                "stance": "反対"
              },
              {
                "name": "石津はるか",
                "stance": "反対"
              },
              {
                "name": "安竹洋平",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "生活者ネットワーク",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "さとう悦子",
                "stance": "賛成"
              },
              {
                "name": "柴尾ひろみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "まちづくり市民こだいら（水口かずえ）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "水口かずえ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市議会れいわ新選組（中倉茂和）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "中倉茂和",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "こだいら市議会だより267号 8面 議案に対する各議員の賛否（3月定例会）",
          "localUrl": "/sources/kodaira-shigikai-r8/att_0000009.pdf",
          "originUrl": "https://web.archive.org/web/20260427173151id_/http://www.city.kodaira.tokyo.jp/gikai/files/127790/127790/att_0000009.pdf",
          "archiveUrl": "https://web.archive.org/web/20260427173151id_/http://www.city.kodaira.tokyo.jp/gikai/files/127790/127790/att_0000009.pdf"
        }
      }
    }
  ],
  "132128": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "日野市議会",
      "seats": 24,
      "teisu": 24,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "日野みらい",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自民党日野市議団と維新の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "創る会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 7,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第30号",
        "billName": "令和8年度日野市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-30",
        "decidedDateLabel": "令和8年3月30日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 日野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派の構成と所属議員名簿（更新日 令和8年3月23日）",
        "localUrl": "/sources/hino-shigikai-r8/1000889.html",
        "originUrl": "https://www.city.hino.lg.jp/shigikai/meibo/1000889.html",
        "archiveUrl": "https://web.archive.org/web/20251212030904/https://www.city.hino.lg.jp/shigikai/meibo/1000889.html"
      },
      "result": {
        "title": "令和8年第1回定例会 議案等審議結果一覧表",
        "localUrl": "/sources/hino-shigikai-r8/1030502.html",
        "originUrl": "https://www.city.hino.lg.jp/shigikai/gian/1030502.html",
        "archiveUrl": "https://web.archive.org/web/20260513190528/https://www.city.hino.lg.jp/shigikai/gian/1030502.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 20,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "日野みらい",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "中嶋良樹",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自民党日野市議団と維新の会",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "創る会",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無会派",
            "counts": {
              "反対": 3,
              "賛成": 4
            },
            "members": [
              {
                "name": "成瀬厚",
                "stance": "反対"
              },
              {
                "name": "ちかざわ美樹",
                "stance": "反対"
              },
              {
                "name": "あるが精一",
                "stance": "反対"
              },
              {
                "name": "白井なおこ",
                "stance": "賛成"
              },
              {
                "name": "新井ともはる",
                "stance": "賛成"
              },
              {
                "name": "奥野りん子",
                "stance": "賛成"
              },
              {
                "name": "西野正人",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "ひの市議会だより第255号 6面 令和８年第１回定例会で議決した議案（賛否の分かれたもの）",
          "localUrl": "/sources/hino-shigikai-r8/gikai-255-o6.pdf",
          "originUrl": "https://www.city.hino.lg.jp/_res/projects/default_project/_page_/001/031/211/gikai-255-o6.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009002152/https://www.city.hino.lg.jp/_res/projects/default_project/_page_/001/031/211/gikai-255-o6.pdf"
        }
      }
    }
  ],
  "132136": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "東村山市議会",
      "seats": 24,
      "asOf": "2026-03-26",
      "asOfLabel": "2026年3月26日",
      "factions": [
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "草の根市民クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "東村山・生活者ネットワーク",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "がんばろう！東村山",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "国民民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "対話で行こう！東村山",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第20号",
        "billName": "令和8年度東京都東村山市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 東村山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案等の審議結果（令和8年3月定例会の各議員の賛否・列見出しの会派と議員）",
        "localUrl": "/sources/higashimurayama-shigikai-r8/r8-03kekka.pdf",
        "originUrl": "https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gianseigansanpi/files/r8-03kekka.pdf",
        "archiveUrl": "https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gianseigansanpi/files/r8-03kekka.pdf"
      },
      "result": {
        "title": "令和8年3月定例会 市長提出議案",
        "localUrl": "/sources/higashimurayama-shigikai-r8/8-3shichougian.html",
        "originUrl": "https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gikai_09_gian-kekka/r8/8-3shichougian.html",
        "archiveUrl": "https://web.archive.org/web/20260213085917/https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gikai_09_gian-kekka/r8/8-3shichougian.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "反対": 7,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "伊藤真一",
                "stance": "賛成"
              },
              {
                "name": "渡辺英子",
                "stance": "賛成"
              },
              {
                "name": "石橋光明",
                "stance": "賛成"
              },
              {
                "name": "村山じゅん子",
                "stance": "賛成"
              },
              {
                "name": "駒崎高行",
                "stance": "賛成"
              },
              {
                "name": "横尾たかお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "木村隆",
                "stance": "賛成"
              },
              {
                "name": "下沢ゆきお",
                "stance": "賛成"
              },
              {
                "name": "熊木敏己",
                "stance": "賛成"
              },
              {
                "name": "小林美緒",
                "stance": "賛成"
              },
              {
                "name": "小町明夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "渡辺みのる",
                "stance": "反対"
              },
              {
                "name": "浅見みどり",
                "stance": "反対"
              },
              {
                "name": "山田たか子",
                "stance": "反対"
              },
              {
                "name": "さとう直子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "草の根市民クラブ",
            "counts": {
              "反対": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "子安じゅん",
                "stance": "反対"
              },
              {
                "name": "朝木直子",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "かみまち弓子",
                "stance": "反対"
              },
              {
                "name": "清水健文",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "かくたかづほ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "東村山・生活者ネットワーク",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "白石えつ子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "がんばろう！東村山",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "わたなべたかし",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "国民民主党",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鈴木たつお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "対話で行こう！東村山",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "佐藤まさたか",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月定例会の各議員の賛否（議案等の審議結果）",
          "localUrl": "/sources/higashimurayama-shigikai-r8/r8-03kekka.pdf",
          "originUrl": "https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gianseigansanpi/files/r8-03kekka.pdf",
          "archiveUrl": "https://www.city.higashimurayama.tokyo.jp/gikai/katsudo/gianseigansanpi/files/r8-03kekka.pdf"
        }
      }
    }
  ],
  "132225": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "東久留米市議会",
      "seats": 22,
      "teisu": 22,
      "asOf": "2025-12-24",
      "asOfLabel": "2025年12月24日",
      "factions": [
        {
          "name": "自民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "久留米ハートネット",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "市民自治フォーラム",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "ニューウェーブ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "市議会立憲民主",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "東久留米維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "国民民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組 東久留米",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第24号",
        "billName": "令和8年度東久留米市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決（多数）"
      },
      "sourceTitle": "令和8年度 東久留米市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（令和7年12月24日現在）",
        "localUrl": "/sources/higashikurume-shigikai-r8/1004008.html",
        "originUrl": "https://web.archive.org/web/20260211033928id_/https://www.city.higashikurume.lg.jp/gikai/1006951/1004008.html",
        "archiveUrl": "https://web.archive.org/web/20260211033928id_/https://www.city.higashikurume.lg.jp/gikai/1006951/1004008.html"
      },
      "result": {
        "title": "令和8年第1回定例会 会議結果",
        "localUrl": "/sources/higashikurume-shigikai-r8/1028672.html",
        "originUrl": "https://www.city.higashikurume.lg.jp/gikai/kaigi/kekka/1028663/1028672.html",
        "archiveUrl": "https://web.archive.org/web/20260511214935/https://www.city.higashikurume.lg.jp/gikai/kaigi/kekka/1028663/1028672.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "132241": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "多摩市議会",
      "seats": 22,
      "asOf": "2025-12-23",
      "asOfLabel": "2025年12月23日",
      "factions": [
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自民党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "あすたま・女性の力",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "生活者ネットワーク",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "青空りっけん",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "多摩みらいの会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "多摩の風",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "社民党",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "8",
        "billName": "令和8年度多摩市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-30",
        "decidedDateLabel": "令和8年3月30日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 多摩市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "市議会会派別名簿（令和7年（2025年）12月23日現在）",
        "localUrl": "/sources/tama-shigikai-r8/1006619.html",
        "originUrl": "https://web.archive.org/web/20260313132653id_/https://www.city.tama.lg.jp/shigikai/giin/meibo/1006619.html",
        "archiveUrl": "https://web.archive.org/web/20260313132653id_/https://www.city.tama.lg.jp/shigikai/giin/meibo/1006619.html"
      },
      "result": {
        "title": "令和8年第1回定例会会議結果",
        "localUrl": "/sources/tama-shigikai-r8/1019818.html",
        "originUrl": "https://www.city.tama.lg.jp/shigikai/kaigi/kekka/1019561/1019818.html",
        "archiveUrl": "https://web.archive.org/web/20260418162123/https://www.city.tama.lg.jp/shigikai/kaigi/kekka/1019561/1019818.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "132292": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "西東京市議会",
      "seats": 27,
      "asOf": "2026-02-04",
      "asOfLabel": "2026年2月4日",
      "factions": [
        {
          "name": "自由民主党西東京市議団",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "西東京市議会公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党西東京市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "生活者ネットワーク",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "維新・民主",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（納田さおり）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（田村ひろゆき）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（長井秀和）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第7号",
        "billName": "令和8年度西東京市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 西東京市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（最終更新日 2026年2月4日）",
        "localUrl": "/sources/nishitokyo-shigikai-r8/kaiha_meibo.html",
        "originUrl": "https://web.archive.org/web/20260207175159id_/https://www.city.nishitokyo.lg.jp/sigikai/giin_meibo/kaiha_meibo.html",
        "archiveUrl": "https://web.archive.org/web/20260207175159id_/https://www.city.nishitokyo.lg.jp/sigikai/giin_meibo/kaiha_meibo.html"
      },
      "result": {
        "title": "日程・付議案件・結果（令和8年第1回定例会）",
        "localUrl": "/sources/nishitokyo-shigikai-r8/kaikinainittei0801.html",
        "originUrl": "https://www.city.nishitokyo.lg.jp/sigikai/nittei_kekka/nittei_anken/r8/kaikinainittei0801.html",
        "archiveUrl": "https://web.archive.org/web/20260417232806/https://www.city.nishitokyo.lg.jp/sigikai/nittei_kekka/nittei_anken/r8/kaikinainittei0801.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 23,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自由民主党西東京市議団",
            "counts": {
              "賛成": 9
            },
            "members": [
              {
                "name": "坂井かずひこ",
                "stance": "賛成"
              },
              {
                "name": "酒井ごう一郎",
                "stance": "賛成"
              },
              {
                "name": "とみながゆうじ",
                "stance": "賛成"
              },
              {
                "name": "小林たつや",
                "stance": "賛成"
              },
              {
                "name": "稲垣裕二",
                "stance": "賛成"
              },
              {
                "name": "保谷なおみ",
                "stance": "賛成"
              },
              {
                "name": "中川清志",
                "stance": "賛成"
              },
              {
                "name": "山田忠良",
                "stance": "賛成"
              },
              {
                "name": "佐藤大介",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "西東京市議会公明党",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "大林光昭",
                "stance": "賛成"
              },
              {
                "name": "藤田美智子",
                "stance": "賛成"
              },
              {
                "name": "田代伸之",
                "stance": "賛成"
              },
              {
                "name": "八矢好美",
                "stance": "賛成"
              },
              {
                "name": "佐藤公男",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "日本共産党西東京市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "中村すぐる",
                "stance": "反対"
              },
              {
                "name": "大竹あつ子",
                "stance": "反対"
              },
              {
                "name": "やまき明美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "森しんいち",
                "stance": "賛成"
              },
              {
                "name": "菅原みほ",
                "stance": "賛成"
              },
              {
                "name": "千間いずみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "生活者ネットワーク",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "後藤ゆう子",
                "stance": "賛成"
              },
              {
                "name": "かとう涼子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "維新・民主",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "山崎英昭",
                "stance": "賛成"
              },
              {
                "name": "下田純一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（納田さおり）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "納田さおり",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（田村ひろゆき）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "田村ひろゆき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（長井秀和）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "長井秀和",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "西東京市議会だより 第114号（令和8年5月15日）賛否が分かれた議案の結果",
          "localUrl": "/sources/nishitokyo-shigikai-r8/no114all.pdf",
          "originUrl": "https://www.city.nishitokyo.lg.jp/sigikai/johokoukai/tayori/gikaihou114.files/no114all.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009003429/https://www.city.nishitokyo.lg.jp/sigikai/johokoukai/tayori/gikaihou114.files/no114all.pdf"
        }
      }
    }
  ],
  "141003": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "横浜市会",
      "seats": 86,
      "teisu": 86,
      "asOf": "2026-01-27",
      "asOfLabel": "2026年1月27日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 32,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "立憲民主党・無所属の会",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "日本維新の会・無所属の会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "国民民主党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "地域政党よこはま",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（太田正孝）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（井上さくら）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（梶村充）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（輿石かつ子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（荻原隆宏）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（長谷川えつこ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（大野トモイ）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "市第76号議案",
        "billName": "令和８年度横浜市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 横浜市会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（令和8年1月27日現在）",
        "localUrl": "/sources/yokohama-shikai-r8/kaihabetsu.html",
        "originUrl": "https://web.archive.org/web/20260220080313id_/https://www.city.yokohama.lg.jp/shikai/giin/kaihabetsu.html",
        "archiveUrl": "https://web.archive.org/web/20260220080313id_/https://www.city.yokohama.lg.jp/shikai/giin/kaihabetsu.html"
      },
      "result": {
        "title": "令和８年３月24日 本会議 議決結果（議員別賛否一覧）",
        "localUrl": "/sources/yokohama-shikai-r8/20260324_sanpi.pdf",
        "originUrl": "https://www.city.yokohama.lg.jp/shikai/kiroku/kekka/kaihabetsu.files/20260324_sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001160601/https://www.city.yokohama.lg.jp/shikai/kiroku/kekka/kaihabetsu.files/20260324_sanpi.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 75,
          "欠席": 2,
          "議長": 1,
          "反対": 8
        },
        "byFaction": [
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 30,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "青木亮祐",
                "stance": "賛成"
              },
              {
                "name": "東みちよ",
                "stance": "賛成"
              },
              {
                "name": "伊波俊之助",
                "stance": "賛成"
              },
              {
                "name": "磯部圭太",
                "stance": "欠席"
              },
              {
                "name": "おさかべさやか",
                "stance": "賛成"
              },
              {
                "name": "大桑正貴",
                "stance": "賛成"
              },
              {
                "name": "鴨志田啓介",
                "stance": "賛成"
              },
              {
                "name": "川口広",
                "stance": "賛成"
              },
              {
                "name": "黒川勝",
                "stance": "賛成"
              },
              {
                "name": "小松範昭",
                "stance": "賛成"
              },
              {
                "name": "佐藤茂",
                "stance": "賛成"
              },
              {
                "name": "佐藤祐文",
                "stance": "賛成"
              },
              {
                "name": "斉藤達也",
                "stance": "賛成"
              },
              {
                "name": "酒井誠",
                "stance": "賛成"
              },
              {
                "name": "清水富雄",
                "stance": "賛成"
              },
              {
                "name": "白井亮次",
                "stance": "賛成"
              },
              {
                "name": "鈴木太郎",
                "stance": "賛成"
              },
              {
                "name": "瀬之間康浩",
                "stance": "賛成"
              },
              {
                "name": "関勝則",
                "stance": "賛成"
              },
              {
                "name": "田野井一雄",
                "stance": "賛成"
              },
              {
                "name": "長谷川琢磨",
                "stance": "賛成"
              },
              {
                "name": "福地茂",
                "stance": "賛成"
              },
              {
                "name": "伏見幸枝",
                "stance": "賛成"
              },
              {
                "name": "藤代哲夫",
                "stance": "賛成"
              },
              {
                "name": "増永純女",
                "stance": "賛成"
              },
              {
                "name": "松本研",
                "stance": "賛成"
              },
              {
                "name": "山下正人",
                "stance": "賛成"
              },
              {
                "name": "山田一誠",
                "stance": "賛成"
              },
              {
                "name": "横山正人",
                "stance": "賛成"
              },
              {
                "name": "横山勇太朗",
                "stance": "賛成"
              },
              {
                "name": "渡邊忠則",
                "stance": "賛成"
              },
              {
                "name": "渋谷健",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 14,
              "欠席": 1
            },
            "members": [
              {
                "name": "安西英俊",
                "stance": "賛成"
              },
              {
                "name": "市来栄美子",
                "stance": "欠席"
              },
              {
                "name": "尾崎太",
                "stance": "賛成"
              },
              {
                "name": "木内秀一",
                "stance": "賛成"
              },
              {
                "name": "行田朝仁",
                "stance": "賛成"
              },
              {
                "name": "久保和弘",
                "stance": "賛成"
              },
              {
                "name": "斉藤伸一",
                "stance": "賛成"
              },
              {
                "name": "髙橋正治",
                "stance": "賛成"
              },
              {
                "name": "竹内康洋",
                "stance": "賛成"
              },
              {
                "name": "武田勝久",
                "stance": "賛成"
              },
              {
                "name": "竹野内猛",
                "stance": "賛成"
              },
              {
                "name": "中島光徳",
                "stance": "賛成"
              },
              {
                "name": "仁田昌寿",
                "stance": "賛成"
              },
              {
                "name": "福島直子",
                "stance": "賛成"
              },
              {
                "name": "望月康弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党・無所属の会",
            "counts": {
              "賛成": 12
            },
            "members": [
              {
                "name": "越久田記子",
                "stance": "賛成"
              },
              {
                "name": "大岩真善和",
                "stance": "賛成"
              },
              {
                "name": "かざまあさみ",
                "stance": "賛成"
              },
              {
                "name": "田中ゆき",
                "stance": "賛成"
              },
              {
                "name": "髙田修平",
                "stance": "賛成"
              },
              {
                "name": "中山大輔",
                "stance": "賛成"
              },
              {
                "name": "花上喜代志",
                "stance": "賛成"
              },
              {
                "name": "藤崎浩太郎",
                "stance": "賛成"
              },
              {
                "name": "麓理恵",
                "stance": "賛成"
              },
              {
                "name": "森ひろたか",
                "stance": "賛成"
              },
              {
                "name": "谷田部孝一",
                "stance": "賛成"
              },
              {
                "name": "山浦英太",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会・無所属の会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "いそべ尚哉",
                "stance": "賛成"
              },
              {
                "name": "伊藤くみこ",
                "stance": "賛成"
              },
              {
                "name": "大山しょうじ",
                "stance": "賛成"
              },
              {
                "name": "柏原すぐる",
                "stance": "賛成"
              },
              {
                "name": "くしだ久子",
                "stance": "賛成"
              },
              {
                "name": "坂井太",
                "stance": "賛成"
              },
              {
                "name": "田中紳一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "国民民主党",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "熊本ちひろ",
                "stance": "賛成"
              },
              {
                "name": "こがゆ康弘",
                "stance": "賛成"
              },
              {
                "name": "坂本勝司",
                "stance": "賛成"
              },
              {
                "name": "深作祐衣",
                "stance": "賛成"
              },
              {
                "name": "二井くみよ",
                "stance": "賛成"
              },
              {
                "name": "横溝じゅん子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "宇佐美さやか",
                "stance": "反対"
              },
              {
                "name": "大和田あきお",
                "stance": "反対"
              },
              {
                "name": "白井正子",
                "stance": "反対"
              },
              {
                "name": "古谷靖彦",
                "stance": "反対"
              },
              {
                "name": "みわ智恵美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "地域政党よこはま",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "関嵩史",
                "stance": "賛成"
              },
              {
                "name": "山田桂一郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（太田正孝）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "太田正孝",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（井上さくら）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "井上さくら",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（梶村充）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "梶村充",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（輿石かつ子）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "輿石かつ子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（荻原隆宏）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "荻原隆宏",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（長谷川えつこ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "長谷川えつこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（大野トモイ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大野トモイ",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年３月24日 本会議 議決結果（議員別賛否一覧）",
          "localUrl": "/sources/yokohama-shikai-r8/20260324_sanpi.pdf",
          "originUrl": "https://www.city.yokohama.lg.jp/shikai/kiroku/kekka/kaihabetsu.files/20260324_sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001160601/https://www.city.yokohama.lg.jp/shikai/kiroku/kekka/kaihabetsu.files/20260324_sanpi.pdf"
        }
      }
    }
  ],
  "141305": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "川崎市議会",
      "seats": 59,
      "teisu": 60,
      "asOf": "2026-01-20",
      "asOfLabel": "2026年1月20日",
      "factions": [
        {
          "name": "自由民主党川崎市議会議員団",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "みらい川崎市議会議員団",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "公明党川崎市議会議員団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "日本共産党川崎市議会議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "あしたの川崎・日本維新の会川崎市議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "無所属（飯田満）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（月本琢也）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（三浦恵美）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（三宅隆介）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（吉沢章子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第45号",
        "billName": "令和8年度川崎市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 川崎市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和8年1月20日現在）",
        "localUrl": "/sources/kawasaki-gikai-r8/40-3-4-0-0-0-0-0-0-0.html",
        "originUrl": "https://www.city.kawasaki.jp/shisei/category/40-3-4-0-0-0-0-0-0-0.html",
        "archiveUrl": "https://web.archive.org/web/20260519072219/https://www.city.kawasaki.jp/shisei/category/40-3-4-0-0-0-0-0-0-0.html"
      },
      "result": {
        "title": "令和８年第１回定例会議決結果（市長提出議案）",
        "localUrl": "/sources/kawasaki-gikai-r8/0318sityou.pdf",
        "originUrl": "https://www.city.kawasaki.jp/980/cmsfiles/contents/0000183/183782/0318sityou.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001160831/https://www.city.kawasaki.jp/980/cmsfiles/contents/0000183/183782/0318sityou.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "141500": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "相模原市議会",
      "seats": 45,
      "asOf": "2025-05-21",
      "asOfLabel": "2025年5月21日",
      "factions": [
        {
          "name": "自由民主党相模原市議団",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "民主みらい・無所属・地域政党さがみはら",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "公明党相模原市議団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本維新の会相模原市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "颯爽の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 2,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和８年度相模原市一般会計予算",
        "sessionLabel": "令和８年３月定例会議",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 相模原市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（公開日 2025年5月21日）",
        "localUrl": "/sources/sagamihara-gikai-r8/2013120600195.html",
        "originUrl": "https://web.archive.org/web/20251006233116id_/https://www.sagamihara-shigikai.jp/doc/2013120600195/",
        "archiveUrl": "https://web.archive.org/web/20251006233116id_/https://www.sagamihara-shigikai.jp/doc/2013120600195/"
      },
      "result": {
        "title": "令和８年３月定例会議・審議結果",
        "localUrl": "/sources/sagamihara-gikai-r8/2026_kekka_0324.pdf",
        "originUrl": "https://www.sagamihara-shigikai.jp/doc/2026042200084/file_contents/2026_kekka_0324.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001160928/https://www.sagamihara-shigikai.jp/doc/2026042200084/file_contents/2026_kekka_0324.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "142018": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "横須賀市議会",
      "seats": 38,
      "asOf": "2025-12-23",
      "asOfLabel": "2025年12月23日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "一市民",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "研政会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 5,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第18号",
        "billName": "令和８年度横須賀市一般会計予算",
        "sessionLabel": "令和８年３月定例議会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決(賛成多数)"
      },
      "sourceTitle": "令和8年度 横須賀市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日：2025年12月23日）",
        "localUrl": "/sources/yokosuka-shigikai-r8/giin_kaiha.html",
        "originUrl": "https://www.city.yokosuka.kanagawa.jp/7860/council/roster/giin_kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20251109223502/https://www.city.yokosuka.kanagawa.jp/7860/council/roster/giin_kaiha.html"
      },
      "result": {
        "title": "令和８年３月定例議会 提出議案等議決結果（２）",
        "localUrl": "/sources/yokosuka-shigikai-r8/20260325giketsukekka.pdf",
        "originUrl": "https://www.city.yokosuka.kanagawa.jp/7860/council/result_report/giji/documents/20260325giketsukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001181124/https://www.city.yokosuka.kanagawa.jp/7860/council/result_report/giji/documents/20260325giketsukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 27,
          "議長": 1,
          "反対": 10
        },
        "byFaction": [
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 13,
              "議長": 1
            },
            "members": [
              {
                "name": "南まさみ",
                "stance": "賛成"
              },
              {
                "name": "青木秀介",
                "stance": "賛成"
              },
              {
                "name": "田辺昭人",
                "stance": "賛成"
              },
              {
                "name": "松岡和行",
                "stance": "賛成"
              },
              {
                "name": "大野忠之",
                "stance": "賛成"
              },
              {
                "name": "渡辺光一",
                "stance": "賛成"
              },
              {
                "name": "西郷宗範",
                "stance": "賛成"
              },
              {
                "name": "山本けんじゅ",
                "stance": "賛成"
              },
              {
                "name": "大貫次郎",
                "stance": "賛成"
              },
              {
                "name": "池田徳重",
                "stance": "賛成"
              },
              {
                "name": "髙橋いずみ",
                "stance": "賛成"
              },
              {
                "name": "泉谷翔",
                "stance": "賛成"
              },
              {
                "name": "海老あやの",
                "stance": "賛成"
              },
              {
                "name": "加藤眞道",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "土田弘之宣",
                "stance": "賛成"
              },
              {
                "name": "石山満",
                "stance": "賛成"
              },
              {
                "name": "関沢敏行",
                "stance": "賛成"
              },
              {
                "name": "本石篤志",
                "stance": "賛成"
              },
              {
                "name": "二見英一",
                "stance": "賛成"
              },
              {
                "name": "川本伸",
                "stance": "賛成"
              },
              {
                "name": "菅原恵美子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "一市民",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "加藤ゆうすけ",
                "stance": "反対"
              },
              {
                "name": "小林優人",
                "stance": "反対"
              },
              {
                "name": "竹岡力",
                "stance": "反対"
              },
              {
                "name": "天白牧夫",
                "stance": "反対"
              },
              {
                "name": "堀りょういち",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "研政会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "伊関功滋",
                "stance": "賛成"
              },
              {
                "name": "長谷川昇",
                "stance": "賛成"
              },
              {
                "name": "工藤昭四郎",
                "stance": "賛成"
              },
              {
                "name": "髙橋英昭",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "大村洋子",
                "stance": "反対"
              },
              {
                "name": "井坂直",
                "stance": "反対"
              },
              {
                "name": "ふじそのあき",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派",
            "counts": {
              "反対": 2,
              "賛成": 3
            },
            "members": [
              {
                "name": "中川さおり",
                "stance": "反対"
              },
              {
                "name": "葉山なおし",
                "stance": "賛成"
              },
              {
                "name": "ひろなか信太郎",
                "stance": "賛成"
              },
              {
                "name": "藤野英明",
                "stance": "反対"
              },
              {
                "name": "安川健人",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年３月定例議会 提出議案等議決結果【議員別賛否】（２）",
          "localUrl": "/sources/yokosuka-shigikai-r8/260325giinbetusanpi.pdf",
          "originUrl": "https://www.city.yokosuka.kanagawa.jp/7860/council/result_report/giji/documents/260325giinbetusanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002121508/https://www.city.yokosuka.kanagawa.jp/7860/council/result_report/giji/documents/260325giinbetusanpi.pdf"
        }
      }
    }
  ],
  "142042": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "鎌倉市議会",
      "seats": 25,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "自民党・無所属の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公正と法",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "鎌倉前進の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党鎌倉市議会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "夢みらい鎌倉",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党鎌倉市議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党鎌倉市議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（藤本あさこ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（細川まなか）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（松中健治）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第99号",
        "billName": "令和8年度鎌倉市一般会計予算",
        "sessionLabel": "令和8年（2026年）2月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決（賛成多数）"
      },
      "sourceTitle": "令和8年度 鎌倉市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "かまくら議会だより 第273号（令和8年5月1日）8面 議決された主な議案等（2月定例会・会派名／議員名）",
        "localUrl": "/sources/kamakura-shigikai-r8/273.pdf",
        "originUrl": "https://www.city.kamakura.kanagawa.jp/gikai/tayori/documents/273.pdf",
        "archiveUrl": "https://web.archive.org/web/20260424145808/https://www.city.kamakura.kanagawa.jp/gikai/tayori/documents/273.pdf"
      },
      "result": {
        "title": "令和8年（2026年）2月定例会のお知らせ（審議議案等・議決結果）",
        "localUrl": "/sources/kamakura-shigikai-r8/20260203.html",
        "originUrl": "https://www.city.kamakura.kanagawa.jp/gikai/20260203.html",
        "archiveUrl": "https://web.archive.org/web/20260520071158/https://www.city.kamakura.kanagawa.jp/gikai/20260203.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "反対": 8,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "自民党・無所属の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "中村聡一郎",
                "stance": "賛成"
              },
              {
                "name": "志田一宏",
                "stance": "賛成"
              },
              {
                "name": "森功一",
                "stance": "賛成"
              },
              {
                "name": "池田実",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公正と法",
            "counts": {
              "反対": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "長嶋竜弘",
                "stance": "反対"
              },
              {
                "name": "津野てるひさ",
                "stance": "反対"
              },
              {
                "name": "重黒木優平",
                "stance": "反対"
              },
              {
                "name": "中澤克之",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "鎌倉前進の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "大石香",
                "stance": "賛成"
              },
              {
                "name": "上野学",
                "stance": "賛成"
              },
              {
                "name": "加藤千華",
                "stance": "賛成"
              },
              {
                "name": "岡崎修也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党鎌倉市議会議員団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "水上武史",
                "stance": "賛成"
              },
              {
                "name": "岸本都美代",
                "stance": "賛成"
              },
              {
                "name": "児玉文彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "夢みらい鎌倉",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "日向慎吾",
                "stance": "賛成"
              },
              {
                "name": "小野田康成",
                "stance": "賛成"
              },
              {
                "name": "前川綾子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党鎌倉市議会議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "吉岡和江",
                "stance": "反対"
              },
              {
                "name": "武野裕子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主党鎌倉市議会議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "岡田かずのり",
                "stance": "反対"
              },
              {
                "name": "中村てつや",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（藤本あさこ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "藤本あさこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（細川まなか）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "細川まなか",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（松中健治）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "松中健治",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "かまくら議会だより 第273号（令和8年5月1日）8面 議決された主な議案等（2月定例会）",
          "localUrl": "/sources/kamakura-shigikai-r8/273.pdf",
          "originUrl": "https://www.city.kamakura.kanagawa.jp/gikai/tayori/documents/273.pdf",
          "archiveUrl": "https://web.archive.org/web/20260424145808/https://www.city.kamakura.kanagawa.jp/gikai/tayori/documents/273.pdf"
        }
      }
    }
  ],
  "142051": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "藤沢市議会",
      "seats": 36,
      "teisu": 36,
      "asOf": "2026-03-18",
      "asOfLabel": "2026年3月18日",
      "factions": [
        {
          "name": "市民クラブ藤沢",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "民主クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "湘風維新無所属の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "藤沢市公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党藤沢市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "アクティブ藤沢",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属藤沢",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第108号",
        "billName": "令和8年度藤沢市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 藤沢市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "ふじさわ市議会だより 第261号（令和8年4月25日発行）会派構成（2月定例会 議案等審議結果）",
        "localUrl": "/sources/fujisawa-shigikai-r8/KhB521_fujisawasigikai261.pdf",
        "originUrl": "https://shigikai.city.fujisawa.kanagawa.jp/voices/gikaidoc/attach/koho/KhB521_fujisawasigikai261.pdf",
        "archiveUrl": "https://web.archive.org/web/20260427012616/https://shigikai.city.fujisawa.kanagawa.jp/voices/gikaidoc/attach/koho/KhB521_fujisawasigikai261.pdf"
      },
      "result": {
        "title": "議案の概要と議決結果（令和8年2月定例会）",
        "localUrl": "/sources/fujisawa-shigikai-r8/g07_giketsu.asp_Sflg_1_kword1_88_EA_94_CA_89_EF_8Cv_97_5C_8EZ_kaigi_2026_2F02_2F12_2C2026_2F03_2F18_2C112_bunrui_.html",
        "originUrl": "https://shigikai.city.fujisawa.kanagawa.jp/g07_giketsu.asp?Sflg=1&kword1=%88%EA%94%CA%89%EF%8Cv%97%5C%8EZ&kaigi=2026%2F02%2F12%2C2026%2F03%2F18%2C112&bunrui=",
        "archiveUrl": "https://web.archive.org/web/20261009003745/https://shigikai.city.fujisawa.kanagawa.jp/g07_giketsu.asp?Sflg=1&kword1=%88%EA%94%CA%89%EF%8Cv%97%5C%8EZ&kaigi=2026%2F02%2F12%2C2026%2F03%2F18%2C112&bunrui="
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "142069": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "小田原市議会",
      "seats": 26,
      "asOf": "2026-02-09",
      "asOfLabel": "2026年2月9日",
      "factions": [
        {
          "name": "誠新",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "誠和",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "維新の会・次世代おだわら",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "志民・ミモザの会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "進民の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派（岩田泰明）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（北森明日香）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第21号",
        "billName": "令和８年度小田原市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 小田原市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "小田原市議会だより 第177号（５月号）15面 会派の構成（令和８年２月9日付）",
        "localUrl": "/sources/odawara-shigikai-r8/1-20260422120015_b69e839bf7fbe8.pdf",
        "originUrl": "https://www.city.odawara.kanagawa.jp/global-image/units/743714/1-20260422120015_b69e839bf7fbe8.pdf",
        "archiveUrl": "https://web.archive.org/web/20260901185528/https://www.city.odawara.kanagawa.jp/global-image/units/743714/1-20260422120015_b69e839bf7fbe8.pdf"
      },
      "result": {
        "title": "令和8年3月定例会(議案)",
        "localUrl": "/sources/odawara-shigikai-r8/p40899.html",
        "originUrl": "https://www.city.odawara.kanagawa.jp/citycounc/aplenarysession/conferenc/r8/p40899.html",
        "archiveUrl": "https://web.archive.org/web/20261009004241/https://www.city.odawara.kanagawa.jp/citycounc/aplenarysession/conferenc/r8/p40899.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 23,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "中野正幸",
                "stance": "賛成"
              },
              {
                "name": "楊隆子",
                "stance": "賛成"
              },
              {
                "name": "金崎達",
                "stance": "賛成"
              },
              {
                "name": "荒井信一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "誠和",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "角田真美",
                "stance": "賛成"
              },
              {
                "name": "鈴木和宏",
                "stance": "賛成"
              },
              {
                "name": "池田彩乃",
                "stance": "賛成"
              },
              {
                "name": "武松忠",
                "stance": "賛成"
              },
              {
                "name": "加藤仁司",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "誠新",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "原久美子",
                "stance": "賛成"
              },
              {
                "name": "桒畑寿一朗",
                "stance": "賛成"
              },
              {
                "name": "宮原元紀",
                "stance": "賛成"
              },
              {
                "name": "神戸秀典",
                "stance": "賛成"
              },
              {
                "name": "清水隆男",
                "stance": "賛成"
              },
              {
                "name": "大川裕",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "維新の会・次世代おだわら",
            "counts": {
              "賛成": 2,
              "議長": 1
            },
            "members": [
              {
                "name": "杉山三郎",
                "stance": "賛成"
              },
              {
                "name": "大川晋作",
                "stance": "賛成"
              },
              {
                "name": "井上昌彦",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "志民・ミモザの会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "寺島由美子",
                "stance": "賛成"
              },
              {
                "name": "鈴木敦子",
                "stance": "賛成"
              },
              {
                "name": "篠原弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "進民の会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小谷英次郎",
                "stance": "賛成"
              },
              {
                "name": "城戸佐和子",
                "stance": "賛成"
              },
              {
                "name": "稲永朝美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（岩田泰明）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "岩田泰明",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（北森明日香）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "北森明日香",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "小田原市議会だより 第177号（５月号）賛否一覧（令和8年3月定例会）",
          "localUrl": "/sources/odawara-shigikai-r8/1-20260422120015_b69e839bf7fbe8.pdf",
          "originUrl": "https://www.city.odawara.kanagawa.jp/global-image/units/743714/1-20260422120015_b69e839bf7fbe8.pdf",
          "archiveUrl": "https://web.archive.org/web/20260901185528/https://www.city.odawara.kanagawa.jp/global-image/units/743714/1-20260422120015_b69e839bf7fbe8.pdf"
        }
      }
    }
  ],
  "142077": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "茅ヶ崎市議会",
      "seats": 26,
      "asOf": "2025-09-16",
      "asOfLabel": "2025年9月16日",
      "factions": [
        {
          "name": "絆・新政・新しい風",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "ちがさき自民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明ちがさき",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民の声ちがさき",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "ちがさき立憲クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "未来創生・湘風クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党茅ヶ崎市議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（豊嶋太一）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（杉本啓子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第7号",
        "billName": "令和８年度茅ヶ崎市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 茅ヶ崎市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 令和7年9月16日）",
        "localUrl": "/sources/chigasaki-shigikai-r8/1052691.html",
        "originUrl": "https://web.archive.org/web/20251109224917id_/https://www.city.chigasaki.kanagawa.jp/gikai/meibo/1052691.html",
        "archiveUrl": "https://web.archive.org/web/20251109224917id_/https://www.city.chigasaki.kanagawa.jp/gikai/meibo/1052691.html"
      },
      "result": {
        "title": "議案等の議決結果等（令和８年第１回定例会）",
        "localUrl": "/sources/chigasaki-shigikai-r8/R8t1_saiketsu_0324.pdf",
        "originUrl": "https://www.city.chigasaki.kanagawa.jp/_res/projects/default_project/_page_/001/066/639/R8t1_saiketsu_0324.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009004404/https://www.city.chigasaki.kanagawa.jp/_res/projects/default_project/_page_/001/066/639/R8t1_saiketsu_0324.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "142115": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "秦野市議会",
      "seats": 23,
      "teisu": 24,
      "asOf": "2026-02-06",
      "asOfLabel": "2026年2月6日",
      "factions": [
        {
          "name": "市民創和会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "志政会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "ともにつくる秦野",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "はだの清流クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に所属しない議員（吉村慶一）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に所属しない議員（石川潤）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和8年度秦野市一般会計予算を定めることについて",
        "sessionLabel": "令和8年3月第1回定例月会議",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 秦野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派一覧表（令和８年２月６日現在）",
        "localUrl": "/sources/hadano-shigikai-r8/kaihaichiranhyou20260206.pdf",
        "originUrl": "https://web.archive.org/web/20260207040307id_/https://www.city.hadano.kanagawa.jp/material/files/group/70/kaihaichiranhyou20260206.pdf",
        "archiveUrl": "https://web.archive.org/web/20260207040307id_/https://www.city.hadano.kanagawa.jp/material/files/group/70/kaihaichiranhyou20260206.pdf"
      },
      "result": {
        "title": "令和8年3月第1回定例月会議の概要・結果",
        "localUrl": "/sources/hadano-shigikai-r8/12733.html",
        "originUrl": "https://www.city.hadano.kanagawa.jp/gikai/teireikai-rinjikai/2/16_1/12733.html",
        "archiveUrl": "https://web.archive.org/web/20261009004944/https://www.city.hadano.kanagawa.jp/gikai/teireikai-rinjikai/2/16_1/12733.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 17,
          "反対": 5,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "市民創和会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "八尋伸二",
                "stance": "賛成"
              },
              {
                "name": "横溝泰世",
                "stance": "賛成"
              },
              {
                "name": "阿蘇佳一",
                "stance": "賛成"
              },
              {
                "name": "大野祐司",
                "stance": "賛成"
              },
              {
                "name": "福森真司",
                "stance": "賛成"
              },
              {
                "name": "小山田良弘",
                "stance": "賛成"
              },
              {
                "name": "大塚毅",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "志政会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小菅基司",
                "stance": "賛成"
              },
              {
                "name": "風間正子",
                "stance": "賛成"
              },
              {
                "name": "川口薫",
                "stance": "賛成"
              },
              {
                "name": "中村知也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "ともにつくる秦野",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "古木勝久",
                "stance": "反対"
              },
              {
                "name": "原聡",
                "stance": "反対"
              },
              {
                "name": "桑原昌之",
                "stance": "反対"
              },
              {
                "name": "田中めぐみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "横山むらさき",
                "stance": "賛成"
              },
              {
                "name": "中村英仁",
                "stance": "賛成"
              },
              {
                "name": "間地薫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "はだの清流クラブ",
            "counts": {
              "賛成": 2,
              "議長": 1
            },
            "members": [
              {
                "name": "今井実",
                "stance": "賛成"
              },
              {
                "name": "高橋文雄",
                "stance": "賛成"
              },
              {
                "name": "相原學",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（吉村慶一）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "吉村慶一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（石川潤）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "石川潤",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "はだの議会だより 第260号（令和8年5月24日）令和８年度予算に係る採決の結果",
          "localUrl": "/sources/hadano-shigikai-r8/260zenmenQR.pdf",
          "originUrl": "https://www.city.hadano.kanagawa.jp/material/files/group/70/260zenmenQR.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009004743/https://www.city.hadano.kanagawa.jp/material/files/group/70/260zenmenQR.pdf"
        }
      }
    }
  ],
  "142123": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "厚木市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2026-03-17",
      "asOfLabel": "2026年3月17日",
      "factions": [
        {
          "name": "ネクストあつぎ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "あつぎみらい",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "あつぎの会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新政あつぎ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "きずな",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "あつぎ一新",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（髙田浩）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（栗山香代子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（津森英里花）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第27号",
        "billName": "令和8年度厚木市一般会計予算",
        "sessionLabel": "令和8年厚木市議会第2回会議（2月定例会議）",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 厚木市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年厚木市議会第２回会議（２月定例会議）における議案の審議結果一覧（議員別表決結果）の会派名・議員名の欄（3月17日議決）",
        "localUrl": "/sources/atsugi-shigikai-r8/080317votingresult.pdf",
        "originUrl": "https://www.city.atsugi.kanagawa.jp/material/files/group/63/080317votingresult.pdf",
        "archiveUrl": "https://web.archive.org/web/20260406060503/https://www.city.atsugi.kanagawa.jp/material/files/group/63/080317votingresult.pdf"
      },
      "result": {
        "title": "令和8年厚木市議会第2回会議(2月定例会議)の議決結果及び議員別表決結果",
        "localUrl": "/sources/atsugi-shigikai-r8/51317.html",
        "originUrl": "https://www.city.atsugi.kanagawa.jp/shigikai/3/r8kekka_2/51317.html",
        "archiveUrl": "https://web.archive.org/web/20260406045926/https://www.city.atsugi.kanagawa.jp/shigikai/3/r8kekka_2/51317.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 25,
          "議長": 1,
          "欠席": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "ネクストあつぎ",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "髙橋豊",
                "stance": "賛成"
              },
              {
                "name": "神子雅人",
                "stance": "賛成"
              },
              {
                "name": "田口孝男",
                "stance": "賛成"
              },
              {
                "name": "奈良直史",
                "stance": "賛成"
              },
              {
                "name": "山口保子",
                "stance": "賛成"
              },
              {
                "name": "堀江克己",
                "stance": "賛成"
              },
              {
                "name": "瀧口慎太郎",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "川口仁",
                "stance": "賛成"
              },
              {
                "name": "寺岡まゆみ",
                "stance": "賛成"
              },
              {
                "name": "遠藤浩一",
                "stance": "賛成"
              },
              {
                "name": "山﨑由枝",
                "stance": "賛成"
              },
              {
                "name": "白川美作江",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "あつぎみらい",
            "counts": {
              "賛成": 2,
              "欠席": 1
            },
            "members": [
              {
                "name": "渡辺貞雄",
                "stance": "賛成"
              },
              {
                "name": "松田則康",
                "stance": "賛成"
              },
              {
                "name": "松本樹影",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "あつぎの会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "名切文梨",
                "stance": "賛成"
              },
              {
                "name": "髙田昌慶",
                "stance": "賛成"
              },
              {
                "name": "高橋伸也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新政あつぎ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "髙橋知己",
                "stance": "賛成"
              },
              {
                "name": "望月真実",
                "stance": "賛成"
              },
              {
                "name": "髙村真和",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "きずな",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "石井芳隆",
                "stance": "賛成"
              },
              {
                "name": "井上武",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "あつぎ一新",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "いわさきかずや",
                "stance": "賛成"
              },
              {
                "name": "小島まさひろ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（髙田浩）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "髙田浩",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（栗山香代子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "栗山香代子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（津森英里花）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "津森英里花",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年厚木市議会第２回会議（２月定例会議）における議案の審議結果一覧（議員別表決結果）",
          "localUrl": "/sources/atsugi-shigikai-r8/080317votingresult.pdf",
          "originUrl": "https://www.city.atsugi.kanagawa.jp/material/files/group/63/080317votingresult.pdf",
          "archiveUrl": "https://web.archive.org/web/20260406060503/https://www.city.atsugi.kanagawa.jp/material/files/group/63/080317votingresult.pdf"
        }
      }
    }
  ],
  "142131": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大和市議会",
      "seats": 28,
      "asOf": "2025-11-11",
      "asOfLabel": "2025年11月11日",
      "factions": [
        {
          "name": "自民党・新政クラブ",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自由クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "神奈川ネットワーク運動",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "虹の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "大和維新×ｉＲＡＩＳＥ",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第１７号",
        "billName": "令和８年度大和市一般会計予算",
        "sessionLabel": "令和8年3月第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 大和市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "大和市議会会派別議員名簿（令和7年11月11日現在）",
        "localUrl": "/sources/yamato-shigikai-r8/kaihabetumeiboR71111.pdf",
        "originUrl": "https://web.archive.org/web/20251217033331id_/https://www.city.yamato.lg.jp/material/files/group/59/kaihabetumeiboR71111.pdf",
        "archiveUrl": "https://web.archive.org/web/20251217033331id_/https://www.city.yamato.lg.jp/material/files/group/59/kaihabetumeiboR71111.pdf"
      },
      "result": {
        "title": "令和8年3月第1回定例会審議結果",
        "localUrl": "/sources/yamato-shigikai-r8/R803sinngikekka.pdf",
        "originUrl": "https://www.city.yamato.lg.jp/material/files/group/59/R803sinngikekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009010015/https://www.city.yamato.lg.jp/material/files/group/59/R803sinngikekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 23,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "自民党・新政クラブ",
            "counts": {
              "賛成": 10
            },
            "members": [
              {
                "name": "古木邦明",
                "stance": "賛成"
              },
              {
                "name": "町田浩文",
                "stance": "賛成"
              },
              {
                "name": "西田恵美",
                "stance": "賛成"
              },
              {
                "name": "福本隆史",
                "stance": "賛成"
              },
              {
                "name": "渡辺伸明",
                "stance": "賛成"
              },
              {
                "name": "赤嶺太一",
                "stance": "賛成"
              },
              {
                "name": "井上貢",
                "stance": "賛成"
              },
              {
                "name": "青木正始",
                "stance": "賛成"
              },
              {
                "name": "中村一夫",
                "stance": "賛成"
              },
              {
                "name": "小倉隆夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "河端恵美子",
                "stance": "賛成"
              },
              {
                "name": "金原忠博",
                "stance": "賛成"
              },
              {
                "name": "鳥渕優",
                "stance": "賛成"
              },
              {
                "name": "吉澤弘",
                "stance": "賛成"
              },
              {
                "name": "山田己智恵",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自由クラブ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "河内孝彰",
                "stance": "賛成"
              },
              {
                "name": "町田零二",
                "stance": "賛成"
              },
              {
                "name": "木村賢一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "堀口香奈",
                "stance": "反対"
              },
              {
                "name": "高久良美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "神奈川ネットワーク運動",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "吉田奈々",
                "stance": "賛成"
              },
              {
                "name": "布瀬恵",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "虹の会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "石田裕",
                "stance": "反対"
              },
              {
                "name": "大波修二",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "北島康平",
                "stance": "賛成"
              },
              {
                "name": "堀合研二郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "大和維新×ｉＲＡＩＳＥ",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "星野翔",
                "stance": "賛成"
              },
              {
                "name": "村田玲",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月第1回定例会審議結果（各議員の賛否）",
          "localUrl": "/sources/yamato-shigikai-r8/R803sinngikekka.pdf",
          "originUrl": "https://www.city.yamato.lg.jp/material/files/group/59/R803sinngikekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009010015/https://www.city.yamato.lg.jp/material/files/group/59/R803sinngikekka.pdf"
        }
      }
    }
  ],
  "142140": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "伊勢原市議会",
      "seats": 20,
      "teisu": 20,
      "asOf": "2025-06-06",
      "asOfLabel": "2025年6月6日",
      "factions": [
        {
          "name": "いせはら為成会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "志政会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "いせはら未来会議",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党いせはら",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党伊勢原市会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "進風会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "庶民",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和8年度伊勢原市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 伊勢原市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 2025年06月06日）",
        "localUrl": "/sources/isehara-shigikai-r8/2023110600067.html",
        "originUrl": "https://web.archive.org/web/20250913232404id_/https://www.city.isehara.kanagawa.jp/gikai/docs/2023110600067/",
        "archiveUrl": "https://web.archive.org/web/20250913232404id_/https://www.city.isehara.kanagawa.jp/gikai/docs/2023110600067/"
      },
      "result": {
        "title": "令和8年3月定例会の審議案件",
        "localUrl": "/sources/isehara-shigikai-r8/2026020500014.html",
        "originUrl": "https://www.city.isehara.kanagawa.jp/gikai/docs/2026020500014/",
        "archiveUrl": "https://web.archive.org/web/20261009010124/https://www.city.isehara.kanagawa.jp/gikai/docs/2026020500014/"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "議長": 1,
          "反対": 2,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "いせはら為成会",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "越水崇史",
                "stance": "賛成"
              },
              {
                "name": "大山学",
                "stance": "賛成"
              },
              {
                "name": "舘大樹",
                "stance": "賛成"
              },
              {
                "name": "長嶋一樹",
                "stance": "賛成"
              },
              {
                "name": "八島満雄",
                "stance": "賛成"
              },
              {
                "name": "大垣真一",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "志政会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小沼富夫",
                "stance": "賛成"
              },
              {
                "name": "前田秀資",
                "stance": "賛成"
              },
              {
                "name": "夛田嚴",
                "stance": "賛成"
              },
              {
                "name": "米谷政久",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "いせはら未来会議",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "安藤玄一",
                "stance": "賛成"
              },
              {
                "name": "森尾武史",
                "stance": "賛成"
              },
              {
                "name": "橋田夏枝",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党いせはら",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "今野康敏",
                "stance": "賛成"
              },
              {
                "name": "中山真由美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党伊勢原市会議員団",
            "counts": {
              "反対": 1,
              "欠席": 1
            },
            "members": [
              {
                "name": "川添康大",
                "stance": "反対"
              },
              {
                "name": "勝又澄子",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "進風会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "荻野貴文",
                "stance": "賛成"
              },
              {
                "name": "山田昌紀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "庶民",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "岸圭介",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "いせはら議会だより 第223号（令和8年5月1日）6面 ３月定例会の審議状況",
          "localUrl": "/sources/isehara-shigikai-r8/6p.pdf",
          "originUrl": "https://www.city.isehara.kanagawa.jp/gikai/docs/2026012200014/file_contents/6p.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009011258/https://www.city.isehara.kanagawa.jp/gikai/docs/2026012200014/file_contents/6p.pdf"
        }
      }
    }
  ],
  "142158": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "海老名市議会",
      "seats": 21,
      "asOf": "2026-03-26",
      "asOfLabel": "2026年3月26日",
      "factions": [
        {
          "name": "政進会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "涼風の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主えびな",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（田中ひろこ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（三宅紀昭）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（さのるみ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（伊左次雄介）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第29号",
        "billName": "令和８年度海老名市一般会計予算",
        "sessionLabel": "令和８年３月第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決(賛成多数)"
      },
      "sourceTitle": "令和8年度 海老名市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年第１回定例会の会議結果（議決結果と各個人の賛否の状況）の会派・議員名の欄（3月26日議決）",
        "localUrl": "/sources/ebina-shigikai-r8/Kg142_81111.pdf",
        "originUrl": "http://ebina.gijiroku.com/voices/GikaiDoc/attach/Congress/Kg142_81111.pdf",
        "archiveUrl": "https://web.archive.org/web/20261009014528/https://ebina.gijiroku.com/voices/GikaiDoc/attach/Congress/Kg142_81111.pdf"
      },
      "result": {
        "title": "議案とその議決結果（令和８年３月第１回定例会・議案第29号）",
        "localUrl": "/sources/ebina-shigikai-r8/g07_giketsu.asp_kword1_88_EA_94_CA_89_EF_8Cv_97_5C_8EZ_kaigi_2026_2F02_2F24_2C2026_2F03_2F26_2C112_bunrui_.html",
        "originUrl": "http://ebina.gijiroku.com/g07_giketsu.asp?kword1=%88%EA%94%CA%89%EF%8Cv%97%5C%8EZ&kaigi=2026%2F02%2F24%2C2026%2F03%2F26%2C112&bunrui=",
        "archiveUrl": "https://web.archive.org/web/20261009010819/https://ebina.gijiroku.com/g07_giketsu.asp?kword1=%88%EA%94%CA%89%EF%8Cv%97%5C%8EZ&kaigi=2026%2F02%2F24%2C2026%2F03%2F26%2C112&bunrui="
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 16,
          "議長": 1,
          "反対": 3,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "政進会",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "宇田川希",
                "stance": "賛成"
              },
              {
                "name": "倉橋正美",
                "stance": "賛成"
              },
              {
                "name": "藤澤菊枝",
                "stance": "賛成"
              },
              {
                "name": "森下賢人",
                "stance": "賛成"
              },
              {
                "name": "永井浩介",
                "stance": "議長"
              },
              {
                "name": "葉梨之紀",
                "stance": "賛成"
              },
              {
                "name": "大塚真樹",
                "stance": "賛成"
              },
              {
                "name": "森英之",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "星伸一",
                "stance": "賛成"
              },
              {
                "name": "戸澤幸雄",
                "stance": "賛成"
              },
              {
                "name": "大下久美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 1,
              "欠席": 1
            },
            "members": [
              {
                "name": "松本正幸",
                "stance": "反対"
              },
              {
                "name": "鈴木さよ子",
                "stance": "欠席"
              }
            ]
          },
          {
            "faction": "涼風の会",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "ありいあいこ",
                "stance": "反対"
              },
              {
                "name": "吉田みな子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主えびな",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "藤枝ふみひこ",
                "stance": "賛成"
              },
              {
                "name": "たち登志子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（田中ひろこ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "田中ひろこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（三宅紀昭）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "三宅紀昭",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（さのるみ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "さのるみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（伊左次雄介）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "伊左次雄介",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会の会議結果（議決結果と各個人の賛否の状況）",
          "localUrl": "/sources/ebina-shigikai-r8/Kg142_81111.pdf",
          "originUrl": "http://ebina.gijiroku.com/voices/GikaiDoc/attach/Congress/Kg142_81111.pdf",
          "archiveUrl": "https://web.archive.org/web/20261009014528/https://ebina.gijiroku.com/voices/GikaiDoc/attach/Congress/Kg142_81111.pdf"
        }
      }
    }
  ],
  "142166": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "座間市議会",
      "seats": 22,
      "asOf": "2025-10-01",
      "asOfLabel": "2025年10月1日",
      "factions": [
        {
          "name": "自由民主党座間市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "座間市公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "新政いさま",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党座間市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "あおぞらひまわりの会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 5,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "10",
        "billName": "令和８年度座間市一般会計予算",
        "sessionLabel": "3月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 座間市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "市議会議員名簿(会派別)（令和7年10月1日現在）",
        "localUrl": "/sources/zama-shigikai-r8/1005884.html",
        "originUrl": "https://web.archive.org/web/20251208203032id_/https://www.city.zama.kanagawa.jp/shigikai/giin/1005884.html",
        "archiveUrl": "https://web.archive.org/web/20251208203032id_/https://www.city.zama.kanagawa.jp/shigikai/giin/1005884.html"
      },
      "result": {
        "title": "市議会だより令和8年5月15日号 3月定例会の審議結果",
        "localUrl": "/sources/zama-shigikai-r8/202605158men.pdf",
        "originUrl": "https://www.city.zama.kanagawa.jp/_res/projects/default_project/_page_/001/013/561/202605158men.pdf",
        "archiveUrl": "https://web.archive.org/web/20260514223830/https://www.city.zama.kanagawa.jp/_res/projects/default_project/_page_/001/013/561/202605158men.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 19,
          "反対": 2,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "座間市公明党",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "日本共産党座間市議団",
            "counts": {
              "反対": 2
            },
            "members": []
          },
          {
            "faction": "新政いさま",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "自由民主党座間市議団",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "あおぞらひまわりの会",
            "counts": {
              "賛成": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "松橋淳郎",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "会派に属さない議員",
            "counts": {
              "賛成": 5
            },
            "members": []
          }
        ],
        "source": {
          "title": "市議会だより令和8年5月15日号 3月定例会の審議結果（各会派等の賛否）",
          "localUrl": "/sources/zama-shigikai-r8/202605158men.pdf",
          "originUrl": "https://www.city.zama.kanagawa.jp/_res/projects/default_project/_page_/001/013/561/202605158men.pdf",
          "archiveUrl": "https://web.archive.org/web/20260514223830/https://www.city.zama.kanagawa.jp/_res/projects/default_project/_page_/001/013/561/202605158men.pdf"
        }
      }
    }
  ],
  "151009": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "新潟市議会",
      "seats": 48,
      "asOf": "2026-02-20",
      "asOfLabel": "2026年2月20日",
      "factions": [
        {
          "name": "翔政会",
          "seats": 21,
          "isIndependent": false
        },
        {
          "name": "日本共産党新潟市議会議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "新風にいがた",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "新潟市公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "ともに躍動する新潟",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民ネットにいがた",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（串田修平）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和８年度新潟市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 新潟市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "常任委員会 委員名簿（最終更新日 2026年2月20日）",
        "localUrl": "/sources/niigata-shigikai-r8/meibo_03jounin.html",
        "originUrl": "https://web.archive.org/web/20260305140442id_/https://www.city.niigata.lg.jp/shigikai/index_meibo/meibo_03jounin.html",
        "archiveUrl": "https://web.archive.org/web/20260305140442id_/https://www.city.niigata.lg.jp/shigikai/index_meibo/meibo_03jounin.html"
      },
      "result": {
        "title": "令和8年2月定例会 会議の結果",
        "localUrl": "/sources/niigata-shigikai-r8/r0802.html",
        "originUrl": "https://www.city.niigata.lg.jp/shigikai/index_honkaigi/honkaigi_kekka/r8kekka/r0802.html",
        "archiveUrl": "https://web.archive.org/web/20261001160224/https://www.city.niigata.lg.jp/shigikai/index_honkaigi/honkaigi_kekka/r8kekka/r0802.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 41,
          "議長": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "翔政会",
            "counts": {
              "賛成": 20,
              "議長": 1
            },
            "members": [
              {
                "name": "小野清一郎",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "日本共産党新潟市議会議員団",
            "counts": {
              "反対": 6
            },
            "members": []
          },
          {
            "faction": "新風にいがた",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "新潟市公明党",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "ともに躍動する新潟",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "無所属の会",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "市民ネットにいがた",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "会派に属さない議員（串田修平）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "串田修平",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年2月定例会 会議の結果",
          "localUrl": "/sources/niigata-shigikai-r8/r0802.html",
          "originUrl": "https://www.city.niigata.lg.jp/shigikai/index_honkaigi/honkaigi_kekka/r8kekka/r0802.html",
          "archiveUrl": "https://web.archive.org/web/20261001160224/https://www.city.niigata.lg.jp/shigikai/index_honkaigi/honkaigi_kekka/r8kekka/r0802.html"
        }
      }
    }
  ],
  "162019": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "富山市議会",
      "seats": 38,
      "asOf": "2026-03-11",
      "asOfLabel": "2026年3月11日",
      "factions": [
        {
          "name": "富山市議会自由民主党",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派 誠政",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "政策・維新32",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "太政",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "政風会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "気魄",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "未来をつくる",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "みどり",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党議員会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第１号",
        "billName": "令和８年度富山市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 富山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和8年3月11日現在）",
        "localUrl": "/sources/toyama-shigikai-r8/1007104.html",
        "originUrl": "https://www.city.toyama.lg.jp/gikai/giinmeibo/1007104.html",
        "archiveUrl": "https://web.archive.org/web/20260214111136/https://www.city.toyama.lg.jp/gikai/giinmeibo/1007104.html"
      },
      "result": {
        "title": "令和８年３月定例会 議案等に対する賛否について",
        "localUrl": "/sources/toyama-shigikai-r8/sanpi-r0803-2.pdf",
        "originUrl": "https://www.city.toyama.lg.jp/_res/projects/default_project/_page_/001/007/118/sanpi-r0803-2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261002120541/https://www.city.toyama.lg.jp/_res/projects/default_project/_page_/001/007/118/sanpi-r0803-2.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 32,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "富山市議会自由民主党",
            "counts": {
              "賛成": 14,
              "議長": 1
            },
            "members": [
              {
                "name": "木地智美",
                "stance": "賛成"
              },
              {
                "name": "飯山勝彦",
                "stance": "賛成"
              },
              {
                "name": "織田伸一",
                "stance": "賛成"
              },
              {
                "name": "高原ゆずる",
                "stance": "賛成"
              },
              {
                "name": "豊岡達郎",
                "stance": "賛成"
              },
              {
                "name": "松井邦人",
                "stance": "賛成"
              },
              {
                "name": "金谷幸則",
                "stance": "賛成"
              },
              {
                "name": "舎川智也",
                "stance": "賛成"
              },
              {
                "name": "押田大祐",
                "stance": "賛成"
              },
              {
                "name": "髙田真里",
                "stance": "賛成"
              },
              {
                "name": "髙道秋彦",
                "stance": "賛成"
              },
              {
                "name": "横野昭",
                "stance": "賛成"
              },
              {
                "name": "金厚有豊",
                "stance": "賛成"
              },
              {
                "name": "鋪田博紀",
                "stance": "賛成"
              },
              {
                "name": "高田重信",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "金岡貴裕",
                "stance": "賛成"
              },
              {
                "name": "藤田克樹",
                "stance": "賛成"
              },
              {
                "name": "久保大憲",
                "stance": "賛成"
              },
              {
                "name": "江西照康",
                "stance": "賛成"
              },
              {
                "name": "柞山数男",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "細川博徳",
                "stance": "賛成"
              },
              {
                "name": "柏佳枝",
                "stance": "賛成"
              },
              {
                "name": "松尾茂",
                "stance": "賛成"
              },
              {
                "name": "松井桂将",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "岡部享",
                "stance": "賛成"
              },
              {
                "name": "東篤",
                "stance": "賛成"
              },
              {
                "name": "村石篤",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派 誠政",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "尾上一彦",
                "stance": "賛成"
              },
              {
                "name": "橋本雅雄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "政策・維新32",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "金井毅俊",
                "stance": "反対"
              },
              {
                "name": "大島満",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "赤星ゆかり",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "太政",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "村上和久",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "政風会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "市田龍一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "気魄",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "谷口寿一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "未来をつくる",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "福田敏彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "みどり",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "野上明人",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "参政党議員会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "金山茜",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年３月定例会 議案等に対する賛否について",
          "localUrl": "/sources/toyama-shigikai-r8/sanpi-r0803-2.pdf",
          "originUrl": "https://www.city.toyama.lg.jp/_res/projects/default_project/_page_/001/007/118/sanpi-r0803-2.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002120541/https://www.city.toyama.lg.jp/_res/projects/default_project/_page_/001/007/118/sanpi-r0803-2.pdf"
        }
      }
    }
  ],
  "182010": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "福井市議会",
      "seats": 31,
      "asOf": "2025-06-16",
      "asOfLabel": "2025年6月16日",
      "factions": [
        {
          "name": "一真会",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "新政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 2,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第１号議案",
        "billName": "令和８年度福井市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 福井市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派等名簿（令和7年6月16日現在）",
        "localUrl": "/sources/fukui-shigikai-r8/p015912.html",
        "originUrl": "https://web.archive.org/web/20251210153637id_/https://www.city.fukui.lg.jp/sisei/gikai/giin/p015912.html",
        "archiveUrl": "https://web.archive.org/web/20251210153637id_/https://www.city.fukui.lg.jp/sisei/gikai/giin/p015912.html"
      },
      "result": {
        "title": "令和８年３月定例会提出議案等及び審議結果",
        "localUrl": "/sources/fukui-shigikai-r8/R803t.pdf",
        "originUrl": "https://www.city.fukui.lg.jp/sisei/gikai/shingigian/p004023_d/fil/R803t.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001193603/https://www.city.fukui.lg.jp/sisei/gikai/shingigian/p004023_d/fil/R803t.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "190004": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "山梨県議会",
      "seats": 36,
      "asOf": "2025-09-17",
      "asOfLabel": "2025年9月17日",
      "factions": [
        {
          "name": "自由民主党 政風やまなし",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "自由民主党新緑の会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "未来やまなし",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主党・開の国",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "リベラル山梨",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "やまなし県民会議",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "えがお夢",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第27号",
        "billName": "令和8年度山梨県一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 山梨県議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（令和7年9月17日）",
        "localUrl": "/sources/yamanashi-ken-gikai-r8/kaihabetu_meibo.html",
        "originUrl": "https://web.archive.org/web/20260209231452id_/https://www.pref.yamanashi.jp/gikaisom/kaihabetu_meibo.html",
        "archiveUrl": "https://web.archive.org/web/20260209231452id_/https://www.pref.yamanashi.jp/gikaisom/kaihabetu_meibo.html"
      },
      "result": {
        "title": "令和8年2月定例会 議決結果（3月23日）",
        "localUrl": "/sources/yamanashi-ken-gikai-r8/giketu_0323.pdf",
        "originUrl": "https://www.pref.yamanashi.jp/documents/124451/giketu_0323.pdf",
        "archiveUrl": "https://web.archive.org/web/20260710133628/https://www.pref.yamanashi.jp/documents/124451/giketu_0323.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "欠席": 1,
          "賛成": 31,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自由民主党 政風やまなし",
            "counts": {
              "欠席": 1,
              "賛成": 13,
              "議長": 1
            },
            "members": [
              {
                "name": "望月勝",
                "stance": "欠席"
              },
              {
                "name": "河西敏郎",
                "stance": "賛成"
              },
              {
                "name": "山田一功",
                "stance": "賛成"
              },
              {
                "name": "水岸富美男",
                "stance": "賛成"
              },
              {
                "name": "卯月政人",
                "stance": "賛成"
              },
              {
                "name": "渡辺淳也",
                "stance": "議長"
              },
              {
                "name": "宮本秀憲",
                "stance": "賛成"
              },
              {
                "name": "大久保俊雄",
                "stance": "賛成"
              },
              {
                "name": "藤本好彦",
                "stance": "賛成"
              },
              {
                "name": "向山憲稔",
                "stance": "賛成"
              },
              {
                "name": "飯島力男",
                "stance": "賛成"
              },
              {
                "name": "久嶋成美",
                "stance": "賛成"
              },
              {
                "name": "石原政信",
                "stance": "賛成"
              },
              {
                "name": "中村正仁",
                "stance": "賛成"
              },
              {
                "name": "寺田義彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党新緑の会",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "流石恭史",
                "stance": "賛成"
              },
              {
                "name": "臼井友基",
                "stance": "賛成"
              },
              {
                "name": "桐原正仁",
                "stance": "賛成"
              },
              {
                "name": "長澤健",
                "stance": "賛成"
              },
              {
                "name": "小沢栄一",
                "stance": "賛成"
              },
              {
                "name": "伊藤毅",
                "stance": "賛成"
              },
              {
                "name": "望月大輔",
                "stance": "賛成"
              },
              {
                "name": "渡辺大喜",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "未来やまなし",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "土橋亨",
                "stance": "賛成"
              },
              {
                "name": "清水喜美男",
                "stance": "賛成"
              },
              {
                "name": "古屋雅夫",
                "stance": "賛成"
              },
              {
                "name": "笠井辰生",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党・開の国",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "浅川力三",
                "stance": "賛成"
              },
              {
                "name": "白壁賢一",
                "stance": "賛成"
              },
              {
                "name": "久保田松幸",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "名取泰",
                "stance": "反対"
              },
              {
                "name": "菅野幹子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "佐野弘仁",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "リベラル山梨",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "飯島修",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "やまなし県民会議",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "志村直毅",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "えがお夢",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "福井太一",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案に対する賛否一覧（令和8年3月23日分）",
          "localUrl": "/sources/yamanashi-ken-gikai-r8/sanpiichiran_0323.pdf",
          "originUrl": "https://www.pref.yamanashi.jp/documents/124451/sanpiichiran_0323.pdf",
          "archiveUrl": "https://web.archive.org/web/20260710133448/https://www.pref.yamanashi.jp/documents/124451/sanpiichiran_0323.pdf"
        }
      }
    }
  ],
  "192082": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "南アルプス市議会",
      "seats": 22,
      "teisu": 22,
      "asOf": "2026-01-09",
      "asOfLabel": "2026年1月9日",
      "factions": [
        {
          "name": "新政南アルプス",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "躍進会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "かがやき21",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "未来創政の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党南アルプス市議団",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案 26",
        "billName": "一般会計予算",
        "sessionLabel": "第1回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 南アルプス市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "各会派構成（令和8年1月9日現在）",
        "localUrl": "/sources/minami-alps-gikai-r8/______R8.1.9__.pdf",
        "originUrl": "https://www.city.minami-alps.yamanashi.jp/fs/1/4/0/8/0/1/_/______R8.1.9__.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001143245/https://www.city.minami-alps.yamanashi.jp/fs/1/4/0/8/0/1/_/______R8.1.9__.pdf"
      },
      "result": {
        "title": "南アルプス市議会だより No.92",
        "localUrl": "/sources/minami-alps-gikai-r8/________________92_.pdf",
        "originUrl": "https://www.city.minami-alps.yamanashi.jp/fs/1/4/2/8/3/4/_/________________92_.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001143322/https://www.city.minami-alps.yamanashi.jp/fs/1/4/2/8/3/4/_/________________92_.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "192091": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "北杜市議会",
      "seats": 20,
      "asOf": "2024-11-28",
      "asOfLabel": "2024年11月28日",
      "factions": [
        {
          "name": "みらい創生",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "ポラリス北杜",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "北杜クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "北杜オール・イン・ワン",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第28号",
        "billName": "令和8年度北杜市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-16",
        "decidedDateLabel": "令和8年3月16日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 北杜市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "北杜市議会議員所属会派（令和6年11月28日現在）",
        "localUrl": "/sources/hokuto-gikai-r8/_____R6.11.28___1_.pdf",
        "originUrl": "https://www.city.hokuto.yamanashi.jp/fs/4/3/2/3/0/2/_/_____R6.11.28___1_.pdf",
        "archiveUrl": "https://web.archive.org/web/20260517091748/https://www.city.hokuto.yamanashi.jp/fs/4/3/2/3/0/2/_/_____R6.11.28___1_.pdf"
      },
      "result": {
        "title": "北杜市議会だより 第86号",
        "localUrl": "/sources/hokuto-gikai-r8/_______86_.pdf",
        "originUrl": "https://www.city.hokuto.yamanashi.jp/fs/5/0/0/6/4/8/_/_______86_.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001142745/https://www.city.hokuto.yamanashi.jp/fs/5/0/0/6/4/8/_/_______86_.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 13,
          "議長": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "みらい創生",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "保坂多枝子",
                "stance": "賛成"
              },
              {
                "name": "加藤紀雄",
                "stance": "賛成"
              },
              {
                "name": "神田正人",
                "stance": "賛成"
              },
              {
                "name": "大芝正和",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "ポラリス北杜",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "輿水崇",
                "stance": "賛成"
              },
              {
                "name": "髙見澤伸光",
                "stance": "賛成"
              },
              {
                "name": "輿石知宏",
                "stance": "賛成"
              },
              {
                "name": "大塚愛",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "北杜クラブ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "秋山俊和",
                "stance": "賛成"
              },
              {
                "name": "齊藤功文",
                "stance": "賛成"
              },
              {
                "name": "秋山真一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "内田俊彦",
                "stance": "賛成"
              },
              {
                "name": "進藤正文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "清水進",
                "stance": "反対"
              },
              {
                "name": "志村清",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "北杜オール・イン・ワン",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "中山喜夫",
                "stance": "反対"
              },
              {
                "name": "山﨑君江",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派",
            "counts": {
              "反対": 2,
              "賛成": 1
            },
            "members": [
              {
                "name": "中村典子",
                "stance": "反対"
              },
              {
                "name": "飛矢﨑雅也",
                "stance": "反対"
              },
              {
                "name": "浅川勝正",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "北杜市議会だより 第86号 賛否のあった議案等（議長を除く）",
          "localUrl": "/sources/hokuto-gikai-r8/_______86_.pdf",
          "originUrl": "https://www.city.hokuto.yamanashi.jp/fs/5/0/0/6/4/8/_/_______86_.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001142745/https://www.city.hokuto.yamanashi.jp/fs/5/0/0/6/4/8/_/_______86_.pdf"
        }
      }
    }
  ],
  "192112": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "笛吹市議会",
      "seats": 19,
      "asOf": "2025-06-10",
      "asOfLabel": "2025年6月10日",
      "factions": [
        {
          "name": "笛新会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "笛政クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "清心会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "煌・フォーラム21",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第18号",
        "billName": "令和8年度笛吹市一般会計予算について",
        "sessionLabel": "令和8年笛吹市議会第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 笛吹市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "笛吹市議会 会派一覧表（令和7年6月10日現在）",
        "localUrl": "/sources/fuefuki-gikai-r8/kaihaitiran.pdf",
        "originUrl": "https://www.city.fuefuki.yamanashi.jp/documents/1142/kaihaitiran.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001144140/https://www.city.fuefuki.yamanashi.jp/documents/1142/kaihaitiran.pdf"
      },
      "result": {
        "title": "令和8年笛吹市議会第1回定例会 議決案件一覧",
        "localUrl": "/sources/fuefuki-gikai-r8/r81giketuitirann.pdf",
        "originUrl": "https://www.city.fuefuki.yamanashi.jp/documents/11778/r81giketuitirann.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001143123/https://www.city.fuefuki.yamanashi.jp/documents/11778/r81giketuitirann.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "202011": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "長野市議会",
      "seats": 36,
      "asOf": "2025-12-01",
      "asOfLabel": "2025年12月1日",
      "factions": [
        {
          "name": "長野市議会新友会",
          "seats": 18,
          "isIndependent": false
        },
        {
          "name": "公明党長野市議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党長野市会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "改革ながの市民ネット",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "次世代長野",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 3,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "1",
        "billName": "令和8年度長野市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 長野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（令和7年12月1日現在）",
        "localUrl": "/sources/nagano-shigikai-r8/p005269.html",
        "originUrl": "https://web.archive.org/web/20260421110348id_/https://www.city.nagano.nagano.jp/n440500/shigikai/p005269.html",
        "archiveUrl": "https://web.archive.org/web/20260421110348id_/https://www.city.nagano.nagano.jp/n440500/shigikai/p005269.html"
      },
      "result": {
        "title": "令和8年3月定例会 議案の審議状況",
        "localUrl": "/sources/nagano-shigikai-r8/p005627.html",
        "originUrl": "https://www.city.nagano.nagano.jp/n440500/contents/p005627.html",
        "archiveUrl": "https://web.archive.org/web/20261002115443/https://www.city.nagano.nagano.jp/n440500/contents/p005627.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 30,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "長野市議会新友会",
            "counts": {
              "賛成": 17,
              "議長": 1
            },
            "members": [
              {
                "name": "小泉栄正",
                "stance": "賛成"
              },
              {
                "name": "寺沢さゆり",
                "stance": "賛成"
              },
              {
                "name": "西沢利一",
                "stance": "賛成"
              },
              {
                "name": "若林祥",
                "stance": "議長"
              },
              {
                "name": "市川和彦",
                "stance": "賛成"
              },
              {
                "name": "松田光平",
                "stance": "賛成"
              },
              {
                "name": "和田一成",
                "stance": "賛成"
              },
              {
                "name": "加藤英夫",
                "stance": "賛成"
              },
              {
                "name": "桜井篤",
                "stance": "賛成"
              },
              {
                "name": "青木敏明",
                "stance": "賛成"
              },
              {
                "name": "宮崎治夫",
                "stance": "賛成"
              },
              {
                "name": "北沢哲也",
                "stance": "賛成"
              },
              {
                "name": "手塚秀樹",
                "stance": "賛成"
              },
              {
                "name": "金沢敦志",
                "stance": "賛成"
              },
              {
                "name": "箱山正一",
                "stance": "賛成"
              },
              {
                "name": "西脇かおる",
                "stance": "賛成"
              },
              {
                "name": "本木晋",
                "stance": "賛成"
              },
              {
                "name": "山岸晃",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党長野市議員団",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "堀内伸悟",
                "stance": "賛成"
              },
              {
                "name": "松井英雄",
                "stance": "賛成"
              },
              {
                "name": "清水美加子",
                "stance": "賛成"
              },
              {
                "name": "藤澤紀子",
                "stance": "賛成"
              },
              {
                "name": "浅川徹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党長野市会議員団",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "滝沢真一",
                "stance": "反対"
              },
              {
                "name": "黒沢清一",
                "stance": "反対"
              },
              {
                "name": "阿出川希",
                "stance": "反対"
              },
              {
                "name": "佐藤高志",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "改革ながの市民ネット",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "鈴木洋一",
                "stance": "賛成"
              },
              {
                "name": "東方みゆき",
                "stance": "賛成"
              },
              {
                "name": "原ようこ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "次世代長野",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "和田凌弥",
                "stance": "賛成"
              },
              {
                "name": "内藤武道",
                "stance": "賛成"
              },
              {
                "name": "木村けいた",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "賛成": 2,
              "反対": 1
            },
            "members": [
              {
                "name": "倉野立人",
                "stance": "賛成"
              },
              {
                "name": "山﨑裕子",
                "stance": "反対"
              },
              {
                "name": "山﨑昭夫",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "賛否などの態度が分かれた議案等（議員別賛否一覧）令和8年3月定例会",
          "localUrl": "/sources/nagano-shigikai-r8/r0803teireikaisinngikkekkaitiran.pdf",
          "originUrl": "https://www.city.nagano.nagano.jp/documents/22850/r0803teireikaisinngikkekkaitiran.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002115554/https://www.city.nagano.nagano.jp/documents/22850/r0803teireikaisinngikkekkaitiran.pdf"
        }
      }
    }
  ],
  "202029": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "松本市議会",
      "seats": 30,
      "asOf": "2025-05-14",
      "asOfLabel": "2025年5月14日",
      "factions": [
        {
          "name": "誠の会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "政友会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "開明",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "松本市議会公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "まつも都",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党松本市議団",
          "seats": 3,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第43号",
        "billName": "令和８年度松本市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-16",
        "decidedDateLabel": "令和8年3月16日",
        "result": "修正可決"
      },
      "sourceTitle": "令和8年度 松本市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（令和7年5月14日現在）",
        "localUrl": "/sources/matsumoto-shigikai-r8/6164.html",
        "originUrl": "https://web.archive.org/web/20260213231002id_/https://www.city.matsumoto.nagano.jp/soshiki/213/6164.html",
        "archiveUrl": "https://web.archive.org/web/20260213231002id_/https://www.city.matsumoto.nagano.jp/soshiki/213/6164.html"
      },
      "result": {
        "title": "議案 議決結果 令和8年2月定例会",
        "localUrl": "/sources/matsumoto-shigikai-r8/197638.html",
        "originUrl": "https://www.city.matsumoto.nagano.jp/site/gikai/197638.html",
        "archiveUrl": "https://web.archive.org/web/20260324114104/https://www.city.matsumoto.nagano.jp/site/gikai/197638.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "voteParts": [
        {
          "part": "修正部分を除く原案",
          "basis": "member",
          "stances": [
            "賛成",
            "議長"
          ],
          "tally": {
            "賛成": 29,
            "議長": 1
          },
          "byFaction": [
            {
              "faction": "誠の会",
              "counts": {
                "賛成": 6,
                "議長": 1
              },
              "members": [
                {
                  "name": "中山英子",
                  "stance": "賛成"
                },
                {
                  "name": "宇留賀響",
                  "stance": "賛成"
                },
                {
                  "name": "土屋眞一",
                  "stance": "賛成"
                },
                {
                  "name": "今井ゆうすけ",
                  "stance": "賛成"
                },
                {
                  "name": "犬飼信雄",
                  "stance": "賛成"
                },
                {
                  "name": "阿部功祐",
                  "stance": "議長"
                },
                {
                  "name": "太田更三",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "政友会",
              "counts": {
                "賛成": 7
              },
              "members": [
                {
                  "name": "こば陽子",
                  "stance": "賛成"
                },
                {
                  "name": "太田正徳",
                  "stance": "賛成"
                },
                {
                  "name": "和久井悟",
                  "stance": "賛成"
                },
                {
                  "name": "西澤郁弥",
                  "stance": "賛成"
                },
                {
                  "name": "牛丸仁志",
                  "stance": "賛成"
                },
                {
                  "name": "村上幸雄",
                  "stance": "賛成"
                },
                {
                  "name": "中島昌子",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "開明",
              "counts": {
                "賛成": 5
              },
              "members": [
                {
                  "name": "菊地徹",
                  "stance": "賛成"
                },
                {
                  "name": "吉村幸代",
                  "stance": "賛成"
                },
                {
                  "name": "川久保文良",
                  "stance": "賛成"
                },
                {
                  "name": "上條温",
                  "stance": "賛成"
                },
                {
                  "name": "芝山稔",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "松本市議会公明党",
              "counts": {
                "賛成": 4
              },
              "members": [
                {
                  "name": "大久保美由紀",
                  "stance": "賛成"
                },
                {
                  "name": "内田麻美",
                  "stance": "賛成"
                },
                {
                  "name": "上條美智子",
                  "stance": "賛成"
                },
                {
                  "name": "近藤晴彦",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "まつも都",
              "counts": {
                "賛成": 4
              },
              "members": [
                {
                  "name": "花村恵子",
                  "stance": "賛成"
                },
                {
                  "name": "神津ゆかり",
                  "stance": "賛成"
                },
                {
                  "name": "上條一正",
                  "stance": "賛成"
                },
                {
                  "name": "横内裕治",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "日本共産党松本市議団",
              "counts": {
                "賛成": 3
              },
              "members": [
                {
                  "name": "宗田まゆ美",
                  "stance": "賛成"
                },
                {
                  "name": "塩原孝子",
                  "stance": "賛成"
                },
                {
                  "name": "犬飼明美",
                  "stance": "賛成"
                }
              ]
            }
          ],
          "source": {
            "title": "令和８年２月定例会 議案の審議結果（各議員の賛否）",
            "localUrl": "/sources/matsumoto-shigikai-r8/124997.pdf",
            "originUrl": "https://www.city.matsumoto.nagano.jp/uploaded/attachment/124997.pdf",
            "archiveUrl": "https://web.archive.org/web/20260323105519/https://www.city.matsumoto.nagano.jp/uploaded/attachment/124997.pdf"
          }
        },
        {
          "part": "修正案",
          "basis": "member",
          "stances": [
            "賛成",
            "反対",
            "議長"
          ],
          "tally": {
            "反対": 13,
            "議長": 1,
            "賛成": 16
          },
          "byFaction": [
            {
              "faction": "誠の会",
              "counts": {
                "反対": 6,
                "議長": 1
              },
              "members": [
                {
                  "name": "中山英子",
                  "stance": "反対"
                },
                {
                  "name": "宇留賀響",
                  "stance": "反対"
                },
                {
                  "name": "土屋眞一",
                  "stance": "反対"
                },
                {
                  "name": "今井ゆうすけ",
                  "stance": "反対"
                },
                {
                  "name": "犬飼信雄",
                  "stance": "反対"
                },
                {
                  "name": "阿部功祐",
                  "stance": "議長"
                },
                {
                  "name": "太田更三",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "政友会",
              "counts": {
                "反対": 7
              },
              "members": [
                {
                  "name": "こば陽子",
                  "stance": "反対"
                },
                {
                  "name": "太田正徳",
                  "stance": "反対"
                },
                {
                  "name": "和久井悟",
                  "stance": "反対"
                },
                {
                  "name": "西澤郁弥",
                  "stance": "反対"
                },
                {
                  "name": "牛丸仁志",
                  "stance": "反対"
                },
                {
                  "name": "村上幸雄",
                  "stance": "反対"
                },
                {
                  "name": "中島昌子",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "開明",
              "counts": {
                "賛成": 5
              },
              "members": [
                {
                  "name": "菊地徹",
                  "stance": "賛成"
                },
                {
                  "name": "吉村幸代",
                  "stance": "賛成"
                },
                {
                  "name": "川久保文良",
                  "stance": "賛成"
                },
                {
                  "name": "上條温",
                  "stance": "賛成"
                },
                {
                  "name": "芝山稔",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "松本市議会公明党",
              "counts": {
                "賛成": 4
              },
              "members": [
                {
                  "name": "大久保美由紀",
                  "stance": "賛成"
                },
                {
                  "name": "内田麻美",
                  "stance": "賛成"
                },
                {
                  "name": "上條美智子",
                  "stance": "賛成"
                },
                {
                  "name": "近藤晴彦",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "まつも都",
              "counts": {
                "賛成": 4
              },
              "members": [
                {
                  "name": "花村恵子",
                  "stance": "賛成"
                },
                {
                  "name": "神津ゆかり",
                  "stance": "賛成"
                },
                {
                  "name": "上條一正",
                  "stance": "賛成"
                },
                {
                  "name": "横内裕治",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "日本共産党松本市議団",
              "counts": {
                "賛成": 3
              },
              "members": [
                {
                  "name": "宗田まゆ美",
                  "stance": "賛成"
                },
                {
                  "name": "塩原孝子",
                  "stance": "賛成"
                },
                {
                  "name": "犬飼明美",
                  "stance": "賛成"
                }
              ]
            }
          ],
          "source": {
            "title": "令和８年２月定例会 議案の審議結果（各議員の賛否）",
            "localUrl": "/sources/matsumoto-shigikai-r8/124997.pdf",
            "originUrl": "https://www.city.matsumoto.nagano.jp/uploaded/attachment/124997.pdf",
            "archiveUrl": "https://web.archive.org/web/20260323105519/https://www.city.matsumoto.nagano.jp/uploaded/attachment/124997.pdf"
          }
        }
      ]
    }
  ],
  "212016": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "岐阜市議会",
      "seats": 37,
      "asOf": "2026-02-17",
      "asOfLabel": "2026年2月17日",
      "factions": [
        {
          "name": "自民岐阜",
          "seats": 17,
          "isIndependent": false
        },
        {
          "name": "岐阜市議会公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "岐阜市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "健やか緑政",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党岐阜市議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "にじいろ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会岐阜市議会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（石川宗一郎）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（大塚翔太）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（道家康生）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（披田麻衣）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第１号議案",
        "billName": "令和８年度岐阜市一般会計予算",
        "sessionLabel": "令和８年第１回（３月）定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案のとおり可決"
      },
      "sourceTitle": "令和8年度 岐阜市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員の紹介（一覧表）（更新日 令和8年2月17日）",
        "localUrl": "/sources/gifu-shigikai-r8/1021215.html",
        "originUrl": "https://web.archive.org/web/20260418045437id_/https://www.city.gifu.lg.jp/info/shigikai/1009372/1021215.html",
        "archiveUrl": "https://web.archive.org/web/20260418045437id_/https://www.city.gifu.lg.jp/info/shigikai/1009372/1021215.html"
      },
      "result": {
        "title": "令和８年第１回（３月）定例会議決結果・報告一覧",
        "localUrl": "/sources/gifu-shigikai-r8/r803giketsu3.pdf",
        "originUrl": "https://www.city.gifu.lg.jp/_res/projects/default_project/_page_/001/009/432/r803giketsu3.pdf",
        "archiveUrl": "https://web.archive.org/web/20260517210804/https://www.city.gifu.lg.jp/_res/projects/default_project/_page_/001/009/432/r803giketsu3.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 28,
          "欠席": 1,
          "議長": 1,
          "反対": 7
        },
        "byFaction": [
          {
            "faction": "自民岐阜",
            "counts": {
              "賛成": 15,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "日比野浩之",
                "stance": "賛成"
              },
              {
                "name": "橋爪大",
                "stance": "賛成"
              },
              {
                "name": "佐藤幸太",
                "stance": "賛成"
              },
              {
                "name": "野本琢磨",
                "stance": "賛成"
              },
              {
                "name": "熊田由弘",
                "stance": "賛成"
              },
              {
                "name": "浅野雅樹",
                "stance": "賛成"
              },
              {
                "name": "箕輪光顕",
                "stance": "欠席"
              },
              {
                "name": "黒田育宏",
                "stance": "賛成"
              },
              {
                "name": "若山貴嗣",
                "stance": "賛成"
              },
              {
                "name": "石井浩二",
                "stance": "賛成"
              },
              {
                "name": "大野一生",
                "stance": "賛成"
              },
              {
                "name": "谷藤錦司",
                "stance": "賛成"
              },
              {
                "name": "須田眞",
                "stance": "賛成"
              },
              {
                "name": "杉山利夫",
                "stance": "賛成"
              },
              {
                "name": "竹市勲",
                "stance": "議長"
              },
              {
                "name": "浅野裕司",
                "stance": "賛成"
              },
              {
                "name": "高橋正",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "岐阜市議会公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "河合智美",
                "stance": "賛成"
              },
              {
                "name": "小堀将大",
                "stance": "賛成"
              },
              {
                "name": "江崎洋子",
                "stance": "賛成"
              },
              {
                "name": "西垣信康",
                "stance": "賛成"
              },
              {
                "name": "辻󠄀孝子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "岐阜市民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小森忠良",
                "stance": "賛成"
              },
              {
                "name": "石原宏基",
                "stance": "賛成"
              },
              {
                "name": "富田耕二",
                "stance": "賛成"
              },
              {
                "name": "松原和生",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "健やか緑政",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "可児隆",
                "stance": "反対"
              },
              {
                "name": "田中成佳",
                "stance": "反対"
              },
              {
                "name": "服部勝弘",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党岐阜市議会議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "森下満寿美",
                "stance": "反対"
              },
              {
                "name": "堀田信夫",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "にじいろ",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "原菜穂子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会岐阜市議会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "林大貴",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（石川宗一郎）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "石川宗一郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（大塚翔太）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大塚翔太",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（道家康生）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "道家康生",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属さない議員（披田麻衣）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "披田麻衣",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等に対する賛否の状況（令和８年３月定例会）",
          "localUrl": "/sources/gifu-shigikai-r8/r803sanpi2.pdf",
          "originUrl": "https://www.city.gifu.lg.jp/_res/projects/default_project/_page_/001/009/433/r803sanpi2.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001182137/https://www.city.gifu.lg.jp/_res/projects/default_project/_page_/001/009/433/r803sanpi2.pdf"
        }
      }
    }
  ],
  "221007": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "静岡市議会",
      "seats": 48,
      "teisu": 48,
      "asOf": "2025-04-25",
      "asOfLabel": "2025年4月25日",
      "factions": [
        {
          "name": "自由民主党静岡市議会議員団",
          "seats": 22,
          "isIndependent": false
        },
        {
          "name": "志政会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党静岡市議会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党静岡市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "静岡市議会立憲民主党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "創生静岡",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "チェンジングしずおかプロジェクト",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "緑の党グリーンズジャパン",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第46号",
        "billName": "令和8年度静岡市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 静岡市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "静岡市議会会派別名簿（令和7年4月25日現在）",
        "localUrl": "/sources/shizuoka-shi-gikai-r8/01_kaihabetsumeibo.pdf",
        "originUrl": "https://web.archive.org/web/20251005163031id_/https://www.city.shizuoka.lg.jp/documents/6545/01_kaihabetsumeibo.pdf",
        "archiveUrl": "https://web.archive.org/web/20251005163031id_/https://www.city.shizuoka.lg.jp/documents/6545/01_kaihabetsumeibo.pdf"
      },
      "result": {
        "title": "令和8年2月定例会の結果",
        "localUrl": "/sources/shizuoka-shi-gikai-r8/202602gatu_gigetukekka_02.pdf",
        "originUrl": "https://www.city.shizuoka.lg.jp/documents/6558/202602gatu_gigetukekka_02.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001161110/https://www.city.shizuoka.lg.jp/documents/6558/202602gatu_gigetukekka_02.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 42,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "自由民主党静岡市議会議員団",
            "counts": {
              "賛成": 21,
              "議長": 1
            },
            "members": [
              {
                "name": "山根田鶴子",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "志政会",
            "counts": {
              "賛成": 8
            },
            "members": []
          },
          {
            "faction": "公明党静岡市議会",
            "counts": {
              "賛成": 6
            },
            "members": []
          },
          {
            "faction": "日本共産党静岡市議会議員団",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "静岡市議会立憲民主党",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "創生静岡",
            "counts": {
              "賛成": 2
            },
            "members": []
          },
          {
            "faction": "チェンジングしずおかプロジェクト",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "緑の党グリーンズジャパン",
            "counts": {
              "反対": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "令和8年2月定例会の結果",
          "localUrl": "/sources/shizuoka-shi-gikai-r8/202602gatu_gigetukekka_02.pdf",
          "originUrl": "https://www.city.shizuoka.lg.jp/documents/6558/202602gatu_gigetukekka_02.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001161110/https://www.city.shizuoka.lg.jp/documents/6558/202602gatu_gigetukekka_02.pdf"
        }
      }
    }
  ],
  "221309": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "浜松市議会",
      "seats": 44,
      "asOf": "2026-01-20",
      "asOfLabel": "2026年1月20日",
      "factions": [
        {
          "name": "自由民主党浜松",
          "seats": 23,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "創造浜松・国民民主党浜松",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党浜松市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "浜松市政向上委員会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "市民サポート浜松",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第42号議案",
        "billName": "令和8年度浜松市一般会計予算",
        "sessionLabel": "令和8年第1回浜松市議会定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 浜松市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 2026年1月20日）",
        "localUrl": "/sources/hamamatsu-gikai-r8/meibokaiha.html",
        "originUrl": "https://web.archive.org/web/20260315043410id_/https://www.city.hamamatsu.shizuoka.jp/gikai/iinkai/meibokaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260315043410id_/https://www.city.hamamatsu.shizuoka.jp/gikai/iinkai/meibokaiha.html"
      },
      "result": {
        "title": "令和8年第1回浜松市議会定例会 会議議決結果（全議案）",
        "localUrl": "/sources/hamamatsu-gikai-r8/giketukekkaitirann.pdf",
        "originUrl": "https://www.city.hamamatsu.shizuoka.jp/documents/171369/giketukekkaitirann.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001153250/https://www.city.hamamatsu.shizuoka.jp/documents/171369/giketukekkaitirann.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 38,
          "欠席": 2,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自由民主党浜松",
            "counts": {
              "賛成": 21,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "鈴木裕之",
                "stance": "賛成"
              },
              {
                "name": "藤田典良",
                "stance": "賛成"
              },
              {
                "name": "辻村公子",
                "stance": "賛成"
              },
              {
                "name": "中野和幸",
                "stance": "賛成"
              },
              {
                "name": "小泉翠",
                "stance": "賛成"
              },
              {
                "name": "神間郁子",
                "stance": "賛成"
              },
              {
                "name": "小野田康弘",
                "stance": "賛成"
              },
              {
                "name": "露木里江子",
                "stance": "賛成"
              },
              {
                "name": "久米丈二",
                "stance": "賛成"
              },
              {
                "name": "井田博康",
                "stance": "欠席"
              },
              {
                "name": "齋藤和志",
                "stance": "賛成"
              },
              {
                "name": "平野岳子",
                "stance": "賛成"
              },
              {
                "name": "松本康夫",
                "stance": "賛成"
              },
              {
                "name": "加茂俊武",
                "stance": "賛成"
              },
              {
                "name": "倉田清一",
                "stance": "賛成"
              },
              {
                "name": "須藤京子",
                "stance": "賛成"
              },
              {
                "name": "戸田誠",
                "stance": "賛成"
              },
              {
                "name": "鳥井德孝",
                "stance": "賛成"
              },
              {
                "name": "花井和夫",
                "stance": "賛成"
              },
              {
                "name": "渥美誠",
                "stance": "賛成"
              },
              {
                "name": "太田康隆",
                "stance": "賛成"
              },
              {
                "name": "栁川樹一郎",
                "stance": "賛成"
              },
              {
                "name": "髙林修",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "大城七瀬",
                "stance": "賛成"
              },
              {
                "name": "花井洋介",
                "stance": "賛成"
              },
              {
                "name": "石津陽子",
                "stance": "賛成"
              },
              {
                "name": "岩田邦泰",
                "stance": "賛成"
              },
              {
                "name": "鈴木真人",
                "stance": "賛成"
              },
              {
                "name": "斉藤晴明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "山崎とし子",
                "stance": "賛成"
              },
              {
                "name": "丸英之",
                "stance": "賛成"
              },
              {
                "name": "幸田惠里子",
                "stance": "賛成"
              },
              {
                "name": "松下正行",
                "stance": "賛成"
              },
              {
                "name": "黒田豊",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "創造浜松・国民民主党浜松",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "森田賢児",
                "stance": "賛成"
              },
              {
                "name": "遠山将吾",
                "stance": "賛成"
              },
              {
                "name": "太田利実保",
                "stance": "賛成"
              },
              {
                "name": "湖東秀隆",
                "stance": "賛成"
              },
              {
                "name": "関イチロー",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党浜松市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "酒井豊実",
                "stance": "反対"
              },
              {
                "name": "小黒啓子",
                "stance": "反対"
              },
              {
                "name": "北島定",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "浜松市政向上委員会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鈴木恵",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民サポート浜松",
            "counts": {
              "欠席": 1
            },
            "members": [
              {
                "name": "馬塚彩矢香",
                "stance": "欠席"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回浜松市議会定例会 会議議決結果（全議案）議員別賛否",
          "localUrl": "/sources/hamamatsu-gikai-r8/giinnsannpiitiran.pdf",
          "originUrl": "https://www.city.hamamatsu.shizuoka.jp/documents/171369/giinnsannpiitiran.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002114016/https://www.city.hamamatsu.shizuoka.jp/documents/171369/giinnsannpiitiran.pdf"
        }
      }
    }
  ],
  "231002": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "名古屋市会",
      "seats": 68,
      "teisu": 68,
      "asOf": "2025-10-28",
      "asOfLabel": "2025年10月28日",
      "factions": [
        {
          "name": "自由民主党名古屋市会議員団",
          "seats": 23,
          "isIndependent": false
        },
        {
          "name": "名古屋民主市会議員団",
          "seats": 17,
          "isIndependent": false
        },
        {
          "name": "公明党名古屋市会議員団",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "減税日本ナゴヤ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党名古屋市会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "なごや陽向の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "なごや創政会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "新生会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会名古屋市会議員団",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第1号",
        "billName": "令和8年度名古屋市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "附帯決議を付して修正可決"
      },
      "sourceTitle": "令和8年度 名古屋市会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（更新日 2025年10月28日）",
        "localUrl": "/sources/nagoya-shikai-r8/1030799.html",
        "originUrl": "https://web.archive.org/web/20260313164258id_/https://www.city.nagoya.jp/shikai/about/1030778/1030799.html",
        "archiveUrl": "https://web.archive.org/web/20260313164258id_/https://www.city.nagoya.jp/shikai/about/1030778/1030799.html"
      },
      "result": {
        "title": "令和8年2月定例会 市長提出案件",
        "localUrl": "/sources/nagoya-shikai-r8/1046530.html",
        "originUrl": "https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html",
        "archiveUrl": "https://web.archive.org/web/20261001153531/https://www.city.nagoya.jp/shikai/shingi/1030858/1030859/1046530.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 63,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "自由民主党名古屋市会議員団",
            "counts": {
              "賛成": 22,
              "議長": 1
            },
            "members": [
              {
                "name": "伊神邦彦",
                "stance": "賛成"
              },
              {
                "name": "神ひろし",
                "stance": "賛成"
              },
              {
                "name": "上村みちよ",
                "stance": "賛成"
              },
              {
                "name": "渡辺やすのり",
                "stance": "賛成"
              },
              {
                "name": "浅野有",
                "stance": "賛成"
              },
              {
                "name": "村瀬きよみ",
                "stance": "賛成"
              },
              {
                "name": "小出昭司",
                "stance": "賛成"
              },
              {
                "name": "中田ちづこ",
                "stance": "賛成"
              },
              {
                "name": "ふじた和秀",
                "stance": "賛成"
              },
              {
                "name": "服部しんのすけ",
                "stance": "賛成"
              },
              {
                "name": "浅井正仁",
                "stance": "賛成"
              },
              {
                "name": "吉田茂",
                "stance": "賛成"
              },
              {
                "name": "沢田ひとみ",
                "stance": "賛成"
              },
              {
                "name": "横井利明",
                "stance": "賛成"
              },
              {
                "name": "藤沢ちあき",
                "stance": "賛成"
              },
              {
                "name": "松井よしのり",
                "stance": "賛成"
              },
              {
                "name": "北野よしはる",
                "stance": "賛成"
              },
              {
                "name": "中里高之",
                "stance": "賛成"
              },
              {
                "name": "岩本たかひろ",
                "stance": "賛成"
              },
              {
                "name": "くずや利枝",
                "stance": "賛成"
              },
              {
                "name": "丹羽ひろし",
                "stance": "賛成"
              },
              {
                "name": "成田たかゆき",
                "stance": "賛成"
              },
              {
                "name": "西川学",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "名古屋民主市会議員団",
            "counts": {
              "賛成": 17
            },
            "members": [
              {
                "name": "山田昌弘",
                "stance": "賛成"
              },
              {
                "name": "くにまさ直記",
                "stance": "賛成"
              },
              {
                "name": "服部将也",
                "stance": "賛成"
              },
              {
                "name": "うえぞの晋介",
                "stance": "賛成"
              },
              {
                "name": "うかい春美",
                "stance": "賛成"
              },
              {
                "name": "塚本つよし",
                "stance": "賛成"
              },
              {
                "name": "おくむら文悟",
                "stance": "賛成"
              },
              {
                "name": "久田邦博",
                "stance": "賛成"
              },
              {
                "name": "森ともお",
                "stance": "賛成"
              },
              {
                "name": "久野美穂",
                "stance": "賛成"
              },
              {
                "name": "赤松哲次",
                "stance": "賛成"
              },
              {
                "name": "加藤一登",
                "stance": "賛成"
              },
              {
                "name": "橋本ひろき",
                "stance": "賛成"
              },
              {
                "name": "小川としゆき",
                "stance": "賛成"
              },
              {
                "name": "岡本やすひろ",
                "stance": "賛成"
              },
              {
                "name": "日比美咲",
                "stance": "賛成"
              },
              {
                "name": "田中里佳",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党名古屋市会議員団",
            "counts": {
              "賛成": 12
            },
            "members": [
              {
                "name": "田辺雄一",
                "stance": "賛成"
              },
              {
                "name": "長谷川由美子",
                "stance": "賛成"
              },
              {
                "name": "さわだ晃一",
                "stance": "賛成"
              },
              {
                "name": "おか千恵",
                "stance": "賛成"
              },
              {
                "name": "木下優",
                "stance": "賛成"
              },
              {
                "name": "月森たくや",
                "stance": "賛成"
              },
              {
                "name": "吉岡正修",
                "stance": "賛成"
              },
              {
                "name": "さかい大輔",
                "stance": "賛成"
              },
              {
                "name": "金庭宜雄",
                "stance": "賛成"
              },
              {
                "name": "近藤和博",
                "stance": "賛成"
              },
              {
                "name": "中村しゅうへい",
                "stance": "賛成"
              },
              {
                "name": "辻まさお",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "減税日本ナゴヤ",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "佐藤ゆうこ",
                "stance": "賛成"
              },
              {
                "name": "田山宏之",
                "stance": "賛成"
              },
              {
                "name": "大田とみひこ",
                "stance": "賛成"
              },
              {
                "name": "豊田かおる",
                "stance": "賛成"
              },
              {
                "name": "大村光子",
                "stance": "賛成"
              },
              {
                "name": "大谷ともひろ",
                "stance": "賛成"
              },
              {
                "name": "永井ゆり",
                "stance": "賛成"
              },
              {
                "name": "鈴木孝之",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党名古屋市会議員団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "岡田ゆき子",
                "stance": "反対"
              },
              {
                "name": "みつなか美由紀",
                "stance": "反対"
              },
              {
                "name": "田口一登",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "なごや陽向の会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "金城ゆたか",
                "stance": "賛成"
              },
              {
                "name": "野田留美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "なごや創政会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "中川あつし",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新生会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "北角嘉幸",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本維新の会名古屋市会議員団",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大島英勲",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "市会だより第200号 2月定例会 提出議案の賛否",
          "localUrl": "/sources/nagoya-shikai-r8/1049365.html",
          "originUrl": "https://www.city.nagoya.jp/shikai/kouhou/1030998/1030999/1051058/1045525/1049358/1049365.html",
          "archiveUrl": "https://web.archive.org/web/20261001153704/https://www.city.nagoya.jp/shikai/kouhou/1030998/1030999/1051058/1045525/1049358/1049365.html"
        }
      }
    }
  ],
  "232017": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "豊橋市議会",
      "seats": 36,
      "teisu": 36,
      "asOf": "2025-05-15",
      "asOfLabel": "2025年5月15日",
      "factions": [
        {
          "name": "自由民主党豊橋市議団",
          "seats": 18,
          "isIndependent": false
        },
        {
          "name": "公明党豊橋市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "新しい豊橋",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党豊橋市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "まちフォーラム",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "みらい市民",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "とよはし みんなの議会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "豊橋維新の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "4",
        "billName": "令和8年度豊橋市一般会計予算",
        "sessionLabel": "3月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 豊橋市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（令和7年5月15日現在）",
        "localUrl": "/sources/toyohashi-shigikai-r8/8130.htm",
        "originUrl": "https://web.archive.org/web/20260314231058id_/https://www.city.toyohashi.lg.jp/8130.htm",
        "archiveUrl": "https://web.archive.org/web/20260314231058id_/https://www.city.toyohashi.lg.jp/8130.htm"
      },
      "result": {
        "title": "議決結果一覧表（3月定例会）",
        "localUrl": "/sources/toyohashi-shigikai-r8/R8.3giketukekka.pdf",
        "originUrl": "https://www.city.toyohashi.lg.jp/secure/40193/R8.3giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001172448/https://www.city.toyohashi.lg.jp/secure/40193/R8.3giketukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 26,
          "議長": 1,
          "反対": 9
        },
        "byFaction": [
          {
            "faction": "自由民主党豊橋市議団",
            "counts": {
              "賛成": 17,
              "議長": 1
            },
            "members": [
              {
                "name": "小原昌子",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党豊橋市議団",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "新しい豊橋",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "日本共産党豊橋市議団",
            "counts": {
              "反対": 3
            },
            "members": []
          },
          {
            "faction": "まちフォーラム",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "みらい市民",
            "counts": {
              "反対": 1
            },
            "members": []
          },
          {
            "faction": "とよはし みんなの議会",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "豊橋維新の会",
            "counts": {
              "反対": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "とよはし市議会だより 第353号「賛否が分かれた議案」",
          "localUrl": "/sources/toyohashi-shigikai-r8/gikaidayori353(pink.pdf",
          "originUrl": "https://www.city.toyohashi.lg.jp/secure/9867/gikaidayori353(pink.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001184211/https://www.city.toyohashi.lg.jp/secure/9867/gikaidayori353(pink.pdf"
        }
      }
    }
  ],
  "232025": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "岡崎市議会",
      "seats": 37,
      "asOf": "2025-11-14",
      "asOfLabel": "2025年11月14日",
      "factions": [
        {
          "name": "自民清風会",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "民政クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "チャレンジ岡崎",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 7,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "56",
        "billName": "令和８年度岡崎市一般会計予算",
        "sessionLabel": "令和８年３月岡崎市議会定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 岡崎市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（令和7年11月14日現在）",
        "localUrl": "/sources/okazaki-shigikai-r8/1009848.html",
        "originUrl": "https://web.archive.org/web/20260311184057id_/https://www.city.okazaki.lg.jp/shigikai/meibo/1009848.html",
        "archiveUrl": "https://web.archive.org/web/20260311184057id_/https://www.city.okazaki.lg.jp/shigikai/meibo/1009848.html"
      },
      "result": {
        "title": "議決結果一覧表（令和8年3月定例会）",
        "localUrl": "/sources/okazaki-shigikai-r8/0803gikateukekka.pdf",
        "originUrl": "https://www.city.okazaki.lg.jp/_res/projects/default_project/_page_/001/009/835/0803gikateukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182400/https://www.city.okazaki.lg.jp/_res/projects/default_project/_page_/001/009/835/0803gikateukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 33,
          "反対": 3,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "自民清風会",
            "counts": {
              "賛成": 16
            },
            "members": [
              {
                "name": "磯部亮次",
                "stance": "賛成"
              },
              {
                "name": "加藤史朗",
                "stance": "賛成"
              },
              {
                "name": "加藤義幸",
                "stance": "賛成"
              },
              {
                "name": "金山直樹",
                "stance": "賛成"
              },
              {
                "name": "神谷茂樹",
                "stance": "賛成"
              },
              {
                "name": "酒井正一",
                "stance": "賛成"
              },
              {
                "name": "杉浦久直",
                "stance": "賛成"
              },
              {
                "name": "鈴木静男",
                "stance": "賛成"
              },
              {
                "name": "田口正夫",
                "stance": "賛成"
              },
              {
                "name": "中根武彦",
                "stance": "賛成"
              },
              {
                "name": "野々山雄一郎",
                "stance": "賛成"
              },
              {
                "name": "野本篤",
                "stance": "賛成"
              },
              {
                "name": "蜂須賀一郎",
                "stance": "賛成"
              },
              {
                "name": "前田麗子",
                "stance": "賛成"
              },
              {
                "name": "三浦康宏",
                "stance": "賛成"
              },
              {
                "name": "簗瀬太",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "民政クラブ",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "井町圭孝",
                "stance": "賛成"
              },
              {
                "name": "加藤嘉哉",
                "stance": "賛成"
              },
              {
                "name": "佐藤哲朗",
                "stance": "賛成"
              },
              {
                "name": "柴田敏光",
                "stance": "賛成"
              },
              {
                "name": "白井正樹",
                "stance": "賛成"
              },
              {
                "name": "鈴木英樹",
                "stance": "賛成"
              },
              {
                "name": "瀬戸清太郎",
                "stance": "賛成"
              },
              {
                "name": "原紀彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "土谷直樹",
                "stance": "賛成"
              },
              {
                "name": "野島さつき",
                "stance": "賛成"
              },
              {
                "name": "山村栄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "チャレンジ岡崎",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小田高之",
                "stance": "賛成"
              },
              {
                "name": "杉山智騎",
                "stance": "賛成"
              },
              {
                "name": "福田澄代",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 3,
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "鈴木雅子",
                "stance": "反対"
              },
              {
                "name": "中根善明",
                "stance": "反対"
              },
              {
                "name": "伊藤正義",
                "stance": "賛成"
              },
              {
                "name": "大原昌幸",
                "stance": "反対"
              },
              {
                "name": "本多勝",
                "stance": "賛成"
              },
              {
                "name": "荻野秀範",
                "stance": "議長"
              },
              {
                "name": "畑尻宣長",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "おかざき議会だより vol.232（令和8年3月定例会）議案の賛否一覧表",
          "localUrl": "/sources/okazaki-shigikai-r8/232.pdf",
          "originUrl": "https://www.city.okazaki.lg.jp/_res/projects/default_project/_page_/001/009/856/232.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002115953/https://www.city.okazaki.lg.jp/_res/projects/default_project/_page_/001/009/856/232.pdf"
        }
      }
    }
  ],
  "232041": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "瀬戸市議会",
      "seats": 26,
      "teisu": 26,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "自民新政クラブ",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "公明党瀬戸市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党瀬戸市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "市民の声",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新風せと 無所属の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派（石神栄治）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（髙桑茂樹）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（伊藤賢二）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第29号議案",
        "billName": "令和8年度瀬戸市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 瀬戸市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "各議員の議案に対する賛否の状況（令和8年3月定例会・3月24日）の会派別の列見出し",
        "localUrl": "/sources/seto-shigikai-r8/seto_R080324_sanpi.pdf",
        "originUrl": "https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/files/R080324_sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261029013358/https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/files/R080324_sanpi.pdf"
      },
      "result": {
        "title": "議案一覧表（令和8年3月定例会）",
        "localUrl": "/sources/seto-shigikai-r8/seto_00708042083.html",
        "originUrl": "https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/00708042083.html",
        "archiveUrl": "https://web.archive.org/web/20261029020030/https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/00708042083.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 22,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自民新政クラブ",
            "counts": {
              "賛成": 10,
              "議長": 1
            },
            "members": [
              {
                "name": "黒柳知世",
                "stance": "賛成"
              },
              {
                "name": "颯田季央",
                "stance": "賛成"
              },
              {
                "name": "山内精一郎",
                "stance": "賛成"
              },
              {
                "name": "朝井賢次",
                "stance": "賛成"
              },
              {
                "name": "髙島淳",
                "stance": "賛成"
              },
              {
                "name": "西本潤",
                "stance": "賛成"
              },
              {
                "name": "小澤勝",
                "stance": "賛成"
              },
              {
                "name": "宮薗伸仁",
                "stance": "賛成"
              },
              {
                "name": "柴田利勝",
                "stance": "賛成"
              },
              {
                "name": "三木雪実",
                "stance": "賛成"
              },
              {
                "name": "冨田宗一",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党瀬戸市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "三宅聡",
                "stance": "賛成"
              },
              {
                "name": "池田信子",
                "stance": "賛成"
              },
              {
                "name": "長江秀幸",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党瀬戸市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "原誠",
                "stance": "反対"
              },
              {
                "name": "新井亜由美",
                "stance": "反対"
              },
              {
                "name": "浅井寿美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市民の声",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "中川昌也",
                "stance": "賛成"
              },
              {
                "name": "戸田由久",
                "stance": "賛成"
              },
              {
                "name": "臼井淳",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新風せと 無所属の会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "松原大介",
                "stance": "賛成"
              },
              {
                "name": "馬嶋みゆき",
                "stance": "賛成"
              },
              {
                "name": "長江公夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（石神栄治）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "石神栄治",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（髙桑茂樹）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "髙桑茂樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（伊藤賢二）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "伊藤賢二",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "各議員の議案に対する賛否の状況（令和8年3月定例会）",
          "localUrl": "/sources/seto-shigikai-r8/seto_R080324_sanpi.pdf",
          "originUrl": "https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/files/R080324_sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261029013358/https://www.city.seto.aichi.jp/docs/2026/02/12/00708042083/files/R080324_sanpi.pdf"
        }
      }
    }
  ],
  "232050": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "半田市議会",
      "seats": 22,
      "teisu": 22,
      "asOf": "2025-06-24",
      "asOfLabel": "2025年6月24日",
      "factions": [
        {
          "name": "創造みらい半田",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "つなぐ未来",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "チャレンジはんだ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 3,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "１０",
        "billName": "令和８年度半田市一般会計予算",
        "sessionLabel": "令和８年第２回半田市議会定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 半田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "半田市議会会派構成（会派別名簿・更新日 令和7年6月24日）",
        "localUrl": "/sources/handa-shigikai-r8/handa_1004475_20251210081353.html",
        "originUrl": "https://web.archive.org/web/20251210081353id_/https://www.city.handa.lg.jp/shisei/gikai/1004472/1004475.html",
        "archiveUrl": "https://web.archive.org/web/20251210081353id_/https://www.city.handa.lg.jp/shisei/gikai/1004472/1004475.html"
      },
      "result": {
        "title": "令和８年第２回半田市議会定例会議決結果（3月25日議決分）",
        "localUrl": "/sources/handa-shigikai-r8/handa_r80325giketukekka.pdf",
        "originUrl": "https://www.city.handa.lg.jp/_res/projects/default_project/_page_/001/004/481/r80325giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261029013504/https://www.city.handa.lg.jp/_res/projects/default_project/_page_/001/004/481/r80325giketukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 20,
          "議長": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "創造みらい半田",
            "counts": {
              "賛成": 11,
              "議長": 1
            },
            "members": [
              {
                "name": "山本裕介",
                "stance": "賛成"
              },
              {
                "name": "芳金秀展",
                "stance": "賛成"
              },
              {
                "name": "鈴木英華",
                "stance": "賛成"
              },
              {
                "name": "田中嵩久",
                "stance": "賛成"
              },
              {
                "name": "澤田勝",
                "stance": "賛成"
              },
              {
                "name": "鈴木幸彦",
                "stance": "賛成"
              },
              {
                "name": "榊原瑞輝",
                "stance": "賛成"
              },
              {
                "name": "竹内功治",
                "stance": "賛成"
              },
              {
                "name": "沢田清",
                "stance": "賛成"
              },
              {
                "name": "岩田玲子",
                "stance": "賛成"
              },
              {
                "name": "渡邉昭司",
                "stance": "賛成"
              },
              {
                "name": "石川英之",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "山田清一",
                "stance": "賛成"
              },
              {
                "name": "坂井美穂",
                "stance": "賛成"
              },
              {
                "name": "麻生七海",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "つなぐ未来",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "中村和也",
                "stance": "賛成"
              },
              {
                "name": "小出義一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "チャレンジはんだ",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "伊藤正興",
                "stance": "賛成"
              },
              {
                "name": "國弘秀之",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属",
            "counts": {
              "反対": 1,
              "賛成": 2
            },
            "members": [
              {
                "name": "有留麻由",
                "stance": "反対"
              },
              {
                "name": "新美保博",
                "stance": "賛成"
              },
              {
                "name": "加藤美幸",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "はんだ市議会だより241号 3月定例会審議結果（賛否の分かれた案件等）",
          "localUrl": "/sources/handa-shigikai-r8/handa_2417.pdf",
          "originUrl": "https://www.city.handa.lg.jp/_res/projects/default_project/_page_/001/012/233/2417.pdf",
          "archiveUrl": "https://web.archive.org/web/20261029013518/https://www.city.handa.lg.jp/_res/projects/default_project/_page_/001/012/233/2417.pdf"
        }
      }
    }
  ],
  "232068": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "春日井市議会",
      "seats": 31,
      "asOf": "2025-05-14",
      "asOfLabel": "2025年5月14日",
      "factions": [
        {
          "name": "自由クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "かすがい創政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "春日井自民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党春日井市議会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派（長谷和哉）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（奥村昇次）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（鈴木昭紀）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（小嶋小百合）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（犬塚貴司）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第９号議案",
        "billName": "令和８年度春日井市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-12",
        "decidedDateLabel": "令和8年3月12日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 春日井市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "第21期市議会議員 会派名簿（更新日 令和7年5月14日）",
        "localUrl": "/sources/kasugai-shigikai-r8/1016752.html",
        "originUrl": "https://web.archive.org/web/20251206115725id_/https://www.city.kasugai.lg.jp/shisei/shigikai/1016752.html",
        "archiveUrl": "https://web.archive.org/web/20251206115725id_/https://www.city.kasugai.lg.jp/shisei/shigikai/1016752.html"
      },
      "result": {
        "title": "令和8年第1回定例会 議案一覧（議決日・結果）",
        "localUrl": "/sources/kasugai-shigikai-r8/R8.1giketsu.pdf",
        "originUrl": "https://www.city.kasugai.lg.jp/_res/projects/default_project/_page_/001/038/638/R8.1giketsu.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001172708/https://www.city.kasugai.lg.jp/_res/projects/default_project/_page_/001/038/638/R8.1giketsu.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 27,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自由クラブ",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "金澤陽貴",
                "stance": "賛成"
              },
              {
                "name": "前田学",
                "stance": "賛成"
              },
              {
                "name": "加納満",
                "stance": "賛成"
              },
              {
                "name": "林克巳",
                "stance": "賛成"
              },
              {
                "name": "友松孝雄",
                "stance": "賛成"
              },
              {
                "name": "梶田高由",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "かすがい創政会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "鈴木貴之",
                "stance": "賛成"
              },
              {
                "name": "安達保子",
                "stance": "賛成"
              },
              {
                "name": "鈴木秀尚",
                "stance": "賛成"
              },
              {
                "name": "加藤貴章",
                "stance": "賛成"
              },
              {
                "name": "鬼頭宏明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "春日井自民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "梶田正直",
                "stance": "賛成"
              },
              {
                "name": "堀尾国大",
                "stance": "賛成"
              },
              {
                "name": "長谷川達也",
                "stance": "賛成"
              },
              {
                "name": "長縄典夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "大村勝人",
                "stance": "賛成"
              },
              {
                "name": "日比野成利",
                "stance": "賛成"
              },
              {
                "name": "石飛厚治",
                "stance": "賛成"
              },
              {
                "name": "田口佳子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "鈴木宏幸",
                "stance": "賛成"
              },
              {
                "name": "伊藤杏奈",
                "stance": "賛成"
              },
              {
                "name": "村上慎二郎",
                "stance": "賛成"
              },
              {
                "name": "小原哉",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党春日井市議会議員団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "石田裕信",
                "stance": "反対"
              },
              {
                "name": "原田祐治",
                "stance": "反対"
              },
              {
                "name": "伊藤建治",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（長谷和哉）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "長谷和哉",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（奥村昇次）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "奥村昇次",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（鈴木昭紀）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鈴木昭紀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（小嶋小百合）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小嶋小百合",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無会派（犬塚貴司）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "犬塚貴司",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "第１回定例会 議案等の表決結果",
          "localUrl": "/sources/kasugai-shigikai-r8/20260312hyouketsu.pdf",
          "originUrl": "https://www.city.kasugai.lg.jp/_res/projects/default_project/_page_/001/038/639/20260312hyouketsu.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001173004/https://www.city.kasugai.lg.jp/_res/projects/default_project/_page_/001/038/639/20260312hyouketsu.pdf"
        }
      }
    }
  ],
  "232106": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "刈谷市議会",
      "seats": 27,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "自民クラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "清風クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属議員の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "にじいろの会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会刈谷市議団",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "議長（鈴木正人）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "副議長（加藤幹樹）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案18",
        "billName": "令和8年度刈谷市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決（反対あり）"
      },
      "sourceTitle": "令和8年度 刈谷市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "かりや市議会だより第184号（令和8年5月1日）p.5「３月定例会提出議案の賛否」の会派名及び議員名",
        "localUrl": "/sources/kariya-shigikai-r8/18400405.pdf",
        "originUrl": "https://www.city.kariya.lg.jp/_res/projects/default_project/_page_/001/022/289/18400405.pdf",
        "archiveUrl": "https://web.archive.org/web/20261029013554/https://www.city.kariya.lg.jp/_res/projects/default_project/_page_/001/022/289/18400405.pdf"
      },
      "result": {
        "title": "令和8年3月定例会 議決結果一覧表",
        "localUrl": "/sources/kariya-shigikai-r8/1022069.html",
        "originUrl": "https://www.city.kariya.lg.jp/shigikai/honkaigi/kaigikekka/1022064/1022069.html",
        "archiveUrl": "https://web.archive.org/web/20260324145001/https://www.city.kariya.lg.jp/shigikai/honkaigi/kaigikekka/1022064/1022069.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "232122": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "安城市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2025-05-12",
      "asOfLabel": "2025年5月12日",
      "factions": [
        {
          "name": "安城創生会",
          "seats": 18,
          "isIndependent": false
        },
        {
          "name": "公明党安城市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "みらいの風",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新自民の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本共産党安城市議員団",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無会派（石川翼）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（すば康貴）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "第３０号",
        "billName": "令和８年度安城市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 安城市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "安城市議会 会派別一覧（令和7年5月12日）",
        "localUrl": "/sources/anjo-shigikai-r8/r07kaiha_0512.pdf",
        "originUrl": "https://anjo-shigikai.jp/representative/pdf/r07kaiha_0512.pdf",
        "archiveUrl": "https://web.archive.org/web/20260211002157/https://anjo-shigikai.jp/representative/pdf/r07kaiha_0512.pdf"
      },
      "result": {
        "title": "令和８年第１回定例会 議案などの審議結果",
        "localUrl": "/sources/anjo-shigikai-r8/giketsukekkaR803.pdf",
        "originUrl": "https://anjo-shigikai.jp/know/result/wp-content/uploads/2026/03/giketsukekkaR803.pdf",
        "archiveUrl": "https://web.archive.org/web/20260615081159/https://anjo-shigikai.jp/know/result/wp-content/uploads/2026/03/giketsukekkaR803.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 24,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "安城創生会",
            "counts": {
              "賛成": 17,
              "議長": 1
            },
            "members": [
              {
                "name": "野場華世",
                "stance": "賛成"
              },
              {
                "name": "竹内稜人",
                "stance": "賛成"
              },
              {
                "name": "田中直樹",
                "stance": "賛成"
              },
              {
                "name": "石川健一",
                "stance": "賛成"
              },
              {
                "name": "伊藤康伸",
                "stance": "賛成"
              },
              {
                "name": "大見学",
                "stance": "賛成"
              },
              {
                "name": "宮﨑千春",
                "stance": "賛成"
              },
              {
                "name": "石川いくこ",
                "stance": "賛成"
              },
              {
                "name": "神谷和明",
                "stance": "賛成"
              },
              {
                "name": "白谷隆子",
                "stance": "賛成"
              },
              {
                "name": "沓名喜代治",
                "stance": "賛成"
              },
              {
                "name": "松本佳栄",
                "stance": "賛成"
              },
              {
                "name": "深津修",
                "stance": "賛成"
              },
              {
                "name": "杉山朗",
                "stance": "賛成"
              },
              {
                "name": "松尾学樹",
                "stance": "賛成"
              },
              {
                "name": "大屋明仁",
                "stance": "賛成"
              },
              {
                "name": "神谷清隆",
                "stance": "賛成"
              },
              {
                "name": "鈴木浩",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党安城市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "宗文代",
                "stance": "賛成"
              },
              {
                "name": "法福洋子",
                "stance": "賛成"
              },
              {
                "name": "今原康徳",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "みらいの風",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "横田雅史",
                "stance": "賛成"
              },
              {
                "name": "沓名美由起",
                "stance": "賛成"
              },
              {
                "name": "守口晶治",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新自民の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "白山松美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党安城市議員団",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "森下祥子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（石川翼）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "石川翼",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（すば康貴）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "すば康貴",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回定例会 議案などの審議結果",
          "localUrl": "/sources/anjo-shigikai-r8/giketsukekkaR803.pdf",
          "originUrl": "https://anjo-shigikai.jp/know/result/wp-content/uploads/2026/03/giketsukekkaR803.pdf",
          "archiveUrl": "https://web.archive.org/web/20260615081159/https://anjo-shigikai.jp/know/result/wp-content/uploads/2026/03/giketsukekkaR803.pdf"
        }
      }
    }
  ],
  "232131": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "西尾市議会",
      "seats": 30,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "みらい創政会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "新しい風",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "共産党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "減税日本",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "立憲民主",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属（筒井登）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（中村眞一）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（ささきえみ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（杉浦こうき）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（岩下一隆）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（石川まゆみ）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第４１号",
        "billName": "令和８年度西尾市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 西尾市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案、請願、陳情等の賛否（令和8年3月定例会）「各議員の表決態度」の会派・議員名",
        "localUrl": "/sources/nishio-shigikai-r8/20260323.pdf",
        "originUrl": "https://www.city.nishio.aichi.jp/_res/projects/default_project/_page_/001/004/369/20260323.pdf",
        "archiveUrl": "https://web.archive.org/web/20260521042016/https://www.city.nishio.aichi.jp/_res/projects/default_project/_page_/001/004/369/20260323.pdf"
      },
      "result": {
        "title": "議案、請願、陳情等の賛否（令和8年3月定例会）",
        "localUrl": "/sources/nishio-shigikai-r8/20260323.pdf",
        "originUrl": "https://www.city.nishio.aichi.jp/_res/projects/default_project/_page_/001/004/369/20260323.pdf",
        "archiveUrl": "https://web.archive.org/web/20260521042016/https://www.city.nishio.aichi.jp/_res/projects/default_project/_page_/001/004/369/20260323.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "232173": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "江南市議会",
      "seats": 20,
      "teisu": 20,
      "asOf": "2025-05-27",
      "asOfLabel": "2025年5月27日",
      "factions": [
        {
          "name": "江南新風クラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "江南政策研究会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "江政クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党江南市議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（津田貴史）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第34号",
        "billName": "令和8年度江南市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-16",
        "decidedDateLabel": "令和8年3月16日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 江南市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和7年5月27日現在）",
        "localUrl": "/sources/konan-shigikai-r8/konan_1001412_20260216.html",
        "originUrl": "https://web.archive.org/web/20260216164521id_/https://www.city.konan.lg.jp/gikai/giin/1001412.html",
        "archiveUrl": "https://web.archive.org/web/20260216164521id_/https://www.city.konan.lg.jp/gikai/giin/1001412.html"
      },
      "result": {
        "title": "令和8年3月定例会議決結果",
        "localUrl": "/sources/konan-shigikai-r8/konan_1019241.html",
        "originUrl": "https://www.city.konan.lg.jp/gikai/katsudou/1001135/1019241.html",
        "archiveUrl": "https://web.archive.org/web/20260318042604/https://www.city.konan.lg.jp/gikai/katsudou/1001135/1019241.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "232190": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "小牧市議会",
      "seats": 25,
      "asOf": "2026-02-26",
      "asOfLabel": "2026年2月26日",
      "factions": [
        {
          "name": "牧政会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "こまき民主市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党小牧市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党小牧市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 6,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第38号",
        "billName": "令和8年度小牧市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "可決（出席者賛成多数）"
      },
      "sourceTitle": "令和8年度 小牧市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員構成一覧（令和８年２月26日現在）",
        "localUrl": "/sources/komaki-shigikai-r8/komaki_080226kaiha.pdf",
        "originUrl": "https://web.archive.org/web/20260516054430id_/https://www.city.komaki.aichi.jp/material/files/group/60/080226kaiha.pdf",
        "archiveUrl": "https://web.archive.org/web/20260516054430id_/https://www.city.komaki.aichi.jp/material/files/group/60/080226kaiha.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会（3月議会）提出議案（議決結果）",
        "localUrl": "/sources/komaki-shigikai-r8/komaki_50784.html",
        "originUrl": "https://www.city.komaki.aichi.jp/admin/soshiki/gikai/giji/2/3/50784.html",
        "archiveUrl": "https://web.archive.org/web/20260516021821/https://www.city.komaki.aichi.jp/admin/soshiki/gikai/giji/2/3/50784.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "232203": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "稲沢市議会",
      "seats": 24,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "創生会",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党稲沢市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党稲沢市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（小柳彩子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属さない議員（平野泰弘）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第37号",
        "billName": "令和8年度稲沢市一般会計予算",
        "sessionLabel": "令和8年第1回稲沢市議会3月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "賛成多数可決"
      },
      "sourceTitle": "令和8年度 稲沢市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "稲沢市議会だより No.210（2026年5月号）p.15「賛否が分かれた議案」の表頭（令和８年３月定例会）",
        "localUrl": "/sources/inazawa-shigikai-r8/inazawa_210.pdf",
        "originUrl": "https://www.city.inazawa.aichi.jp/cmsfiles/contents/0000005/5655/210.pdf",
        "archiveUrl": "https://web.archive.org/web/20261029014330/https://www.city.inazawa.aichi.jp/cmsfiles/contents/0000005/5655/210.pdf"
      },
      "result": {
        "title": "令和8年第1回稲沢市議会3月定例会議決結果",
        "localUrl": "/sources/inazawa-shigikai-r8/inazawa_0000005596.html",
        "originUrl": "https://www.city.inazawa.aichi.jp/0000005596.html",
        "archiveUrl": "https://web.archive.org/web/20261029014347/https://www.city.inazawa.aichi.jp/0000005596.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "232238": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大府市議会",
      "seats": 19,
      "teisu": 19,
      "asOf": "2025-06-12",
      "asOfLabel": "2025年6月12日",
      "factions": [
        {
          "name": "親和クラブ",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第20号",
        "billName": "令和8年度大府市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "原案可決 (賛成多数)"
      },
      "sourceTitle": "令和8年度 大府市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（2025(令和7)年6月12日現在）",
        "localUrl": "/sources/obu-shigikai-r8/obu_kaiha_wb20260311.html",
        "originUrl": "https://web.archive.org/web/20260311220837id_/https://www.city.obu.aichi.jp/gikai/meibo/1006236.html",
        "archiveUrl": "https://web.archive.org/web/20260311220837id_/https://www.city.obu.aichi.jp/gikai/meibo/1006236.html"
      },
      "result": {
        "title": "大府市議会 議案等一覧（令和8年第1回定例会）",
        "localUrl": "/sources/obu-shigikai-r8/obu_g07_giketsu.html",
        "originUrl": "https://obu.gijiroku.com/g07_giketsu.asp?kword1=&kaigi=2026%2F02%2F24%2C2026%2F03%2F17%2C238&bunrui=",
        "archiveUrl": "https://web.archive.org/web/20261029014614/https://obu.gijiroku.com/g07_giketsu.asp?kword1=&kaigi=2026%2F02%2F24%2C2026%2F03%2F17%2C238&bunrui="
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 17,
          "議長": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "親和クラブ",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "蟹江陸孝",
                "stance": "賛成"
              },
              {
                "name": "本田雅志",
                "stance": "賛成"
              },
              {
                "name": "稲葉裕加里",
                "stance": "賛成"
              },
              {
                "name": "竹田隆憲",
                "stance": "賛成"
              },
              {
                "name": "藤本宗久",
                "stance": "賛成"
              },
              {
                "name": "太田和利",
                "stance": "賛成"
              },
              {
                "name": "時安利栄",
                "stance": "賛成"
              },
              {
                "name": "酒井真二",
                "stance": "賛成"
              },
              {
                "name": "鷹羽琴美",
                "stance": "賛成"
              },
              {
                "name": "早川高光",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小山昌子",
                "stance": "賛成"
              },
              {
                "name": "加茂康治",
                "stance": "賛成"
              },
              {
                "name": "野北孝治",
                "stance": "賛成"
              },
              {
                "name": "木下久子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "柴﨑智子",
                "stance": "賛成"
              },
              {
                "name": "国本礼子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属クラブ",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "宮下真悟",
                "stance": "賛成"
              },
              {
                "name": "飯尾祐介",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "久永和枝",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "2026（令和8）年第1回(3月)定例会 賛否の状況",
          "localUrl": "/sources/obu-shigikai-r8/obu_1038051.html",
          "originUrl": "https://www.city.obu.aichi.jp/gikai/honkaigi/1038046/1038051.html",
          "archiveUrl": "https://web.archive.org/web/20260222125903/https://www.city.obu.aichi.jp/gikai/honkaigi/1038046/1038051.html"
        }
      }
    }
  ],
  "232262": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "尾張旭市議会",
      "seats": 20,
      "asOf": "2025-05-19",
      "asOfLabel": "2025年5月19日",
      "factions": [
        {
          "name": "令和あさひ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党尾張旭市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党尾張旭市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "愛知維新の会尾張旭市議団",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第8号議案",
        "billName": "令和8年度尾張旭市一般会計予算",
        "sessionLabel": "令和8年第2回（3月）定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 尾張旭市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派構成名簿（令和7年5月19日現在）",
        "localUrl": "/sources/owariasahi-shigikai-r8/oa_3477_wb20251107.html",
        "originUrl": "https://web.archive.org/web/20251107235755id_/https://www.city.owariasahi.lg.jp/site/gikai/3477.html",
        "archiveUrl": "https://web.archive.org/web/20251107235755id_/https://www.city.owariasahi.lg.jp/site/gikai/3477.html"
      },
      "result": {
        "title": "提出議案と議決結果（令和8年第2回（3月）定例会）",
        "localUrl": "/sources/owariasahi-shigikai-r8/oa_51537.html",
        "originUrl": "https://www.city.owariasahi.lg.jp/site/gikai/51537.html",
        "archiveUrl": "https://web.archive.org/web/20261029014742/https://www.city.owariasahi.lg.jp/site/gikai/51537.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 17,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "令和あさひ",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "秋田さとし",
                "stance": "賛成"
              },
              {
                "name": "陣矢幸司",
                "stance": "賛成"
              },
              {
                "name": "谷口武司",
                "stance": "賛成"
              },
              {
                "name": "日比野和雄",
                "stance": "賛成"
              },
              {
                "name": "松原たかし",
                "stance": "賛成"
              },
              {
                "name": "安田吉宏",
                "stance": "賛成"
              },
              {
                "name": "若杉たかし",
                "stance": "賛成"
              },
              {
                "name": "さかえ章演",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "市原誠二",
                "stance": "賛成"
              },
              {
                "name": "いとう伸一",
                "stance": "賛成"
              },
              {
                "name": "大島もえ",
                "stance": "賛成"
              },
              {
                "name": "櫻井直樹",
                "stance": "賛成"
              },
              {
                "name": "早川八郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党尾張旭市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "芦原美佳子",
                "stance": "賛成"
              },
              {
                "name": "片渕卓三",
                "stance": "賛成"
              },
              {
                "name": "丸山幸子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党尾張旭市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "川村つよし",
                "stance": "反対"
              },
              {
                "name": "榊原利宏",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "愛知維新の会尾張旭市議団",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "勝股修二",
                "stance": "賛成"
              },
              {
                "name": "山下幹雄",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "尾張旭市議会だより 第251号 p.7「賛否が分かれた議案」",
          "localUrl": "/sources/owariasahi-shigikai-r8/oa_40242.pdf",
          "originUrl": "https://www.city.owariasahi.lg.jp/uploaded/attachment/40242.pdf",
          "archiveUrl": "https://web.archive.org/web/20261029014808/https://www.city.owariasahi.lg.jp/uploaded/attachment/40242.pdf"
        }
      }
    }
  ],
  "232301": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "日進市議会",
      "seats": 20,
      "asOf": "2026-03-23",
      "asOfLabel": "2026年3月23日",
      "factions": [
        {
          "name": "新政ひまわり",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "新政クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "政策研究グループ「未来ネット」",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "政策研究会「あした」",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党日進市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（岩渕晃久）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第16号",
        "billName": "令和8年度日進市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 日進市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議案表決態度一覧（R8第1回定例会）の会派名の表頭",
        "localUrl": "/sources/nisshin-shigikai-r8/ns_R8_1teireihyouketutaido.pdf",
        "originUrl": "https://www.city.nisshin.lg.jp/material/files/group/80/R8_1teireihyouketutaido.pdf",
        "archiveUrl": "https://web.archive.org/web/20261029014907/https://www.city.nisshin.lg.jp/material/files/group/80/R8_1teireihyouketutaido.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会 議案一覧表",
        "localUrl": "/sources/nisshin-shigikai-r8/ns_18228.html",
        "originUrl": "https://www.city.nisshin.lg.jp/department/gikai/giji/4/7/gian/18228.html",
        "archiveUrl": "https://web.archive.org/web/20261029015012/https://www.city.nisshin.lg.jp/department/gikai/giji/4/7/gian/18228.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 11,
          "議長": 1,
          "反対": 8
        },
        "byFaction": [
          {
            "faction": "新政ひまわり",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "武田治敏",
                "stance": "賛成"
              },
              {
                "name": "大橋ゆうすけ",
                "stance": "賛成"
              },
              {
                "name": "大屋よしお",
                "stance": "賛成"
              },
              {
                "name": "小出あさこ",
                "stance": "賛成"
              },
              {
                "name": "吉野ゆうと",
                "stance": "賛成"
              },
              {
                "name": "福安淳也",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "新政クラブ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小野田利信",
                "stance": "賛成"
              },
              {
                "name": "加納やすこ",
                "stance": "賛成"
              },
              {
                "name": "水野たかはる",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "政策研究グループ「未来ネット」",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "舟橋よしえ",
                "stance": "反対"
              },
              {
                "name": "白井えり子",
                "stance": "反対"
              },
              {
                "name": "山田久美",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "政策研究会「あした」",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "島村きよみ",
                "stance": "反対"
              },
              {
                "name": "田中とおる",
                "stance": "反対"
              },
              {
                "name": "ゆきむらともこ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "川嶋恵美",
                "stance": "賛成"
              },
              {
                "name": "中島まなみ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党日進市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "ごとうみき",
                "stance": "反対"
              },
              {
                "name": "坂林たくみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無会派（岩渕晃久）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "岩渕晃久",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案表決態度一覧（R8第1回定例会）",
          "localUrl": "/sources/nisshin-shigikai-r8/ns_R8_1teireihyouketutaido.pdf",
          "originUrl": "https://www.city.nisshin.lg.jp/material/files/group/80/R8_1teireihyouketutaido.pdf",
          "archiveUrl": "https://web.archive.org/web/20261029014907/https://www.city.nisshin.lg.jp/material/files/group/80/R8_1teireihyouketutaido.pdf"
        }
      }
    }
  ],
  "261009": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "京都市会",
      "seats": 67,
      "teisu": 67,
      "asOf": "2026-02-18",
      "asOfLabel": "2026年2月18日",
      "factions": [
        {
          "name": "自由民主党京都市会議員団",
          "seats": 19,
          "isIndependent": false
        },
        {
          "name": "維新・京都・国民市会議員団",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "日本共産党京都市会議員団",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "公明党京都市会議員団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "無所属（天方ひろゆき）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（井﨑敦子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（きくち一秀）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（小島信太郎）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（繁隆夫）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（菅谷浩平）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（平田圭）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議1",
        "billName": "令和8年度京都市一般会計予算",
        "sessionLabel": "令和8年2月市会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 京都市会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（最終更新日 令和8年2月3日・2月18日）",
        "localUrl": "/sources/kyoto-shikai-r8/jimin-kyoto.html",
        "originUrl": "https://www2.city.kyoto.lg.jp/shikai/meibo/kaiha/jimin-kyoto.html",
        "archiveUrl": "https://web.archive.org/web/20260512093023/https://www2.city.kyoto.lg.jp/shikai/meibo/kaiha/jimin-kyoto.html"
      },
      "result": {
        "title": "議案・審議結果（令和8年2月市会）",
        "localUrl": "/sources/kyoto-shikai-r8/gian2.html",
        "originUrl": "https://www2.city.kyoto.lg.jp/shikai/honkaigi/R07/gian2.html",
        "archiveUrl": "https://web.archive.org/web/20260409183007/https://www2.city.kyoto.lg.jp/shikai/honkaigi/R07/gian2.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 51,
          "議長": 1,
          "反対": 15
        },
        "byFaction": [
          {
            "faction": "自由民主党京都市会議員団",
            "counts": {
              "賛成": 18,
              "議長": 1
            },
            "members": [
              {
                "name": "下村あきら",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "維新・京都・国民市会議員団",
            "counts": {
              "賛成": 16
            },
            "members": []
          },
          {
            "faction": "日本共産党京都市会議員団",
            "counts": {
              "反対": 14
            },
            "members": []
          },
          {
            "faction": "公明党京都市会議員団",
            "counts": {
              "賛成": 11
            },
            "members": []
          },
          {
            "faction": "無所属（天方ひろゆき）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "天方ひろゆき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（井﨑敦子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "井﨑敦子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（きくち一秀）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "きくち一秀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（小島信太郎）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "小島信太郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（繁隆夫）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "繁隆夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（菅谷浩平）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "菅谷浩平",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（平田圭）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "平田圭",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案・審議結果（令和8年2月市会）各会派の態度",
          "localUrl": "/sources/kyoto-shikai-r8/gian2.html",
          "originUrl": "https://www2.city.kyoto.lg.jp/shikai/honkaigi/R07/gian2.html",
          "archiveUrl": "https://web.archive.org/web/20260409183007/https://www2.city.kyoto.lg.jp/shikai/honkaigi/R07/gian2.html"
        }
      }
    }
  ],
  "270008": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大阪府議会",
      "seats": 79,
      "asOf": "2026-03-09",
      "asOfLabel": "2026年3月9日",
      "factions": [
        {
          "name": "大阪維新の会大阪府議会議員団",
          "seats": 53,
          "isIndependent": false
        },
        {
          "name": "公明党大阪府議会議員団",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "自由民主党大阪府議会議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "民主ネット大阪府議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党大阪府議会議員団",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "大阪なにわの和",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "おおさか未来プロジェクト",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "せっつ府民の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "1",
        "billName": "令和８年度大阪府一般会計予算の件",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 大阪府議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和8年2月定例会）（令和8年3月9日現在）",
        "localUrl": "/sources/osaka-fu-gikai-r8/0802giin.html",
        "originUrl": "https://www.pref.osaka.lg.jp/o170010/gikai_giji/giininfo/0802giin.html",
        "archiveUrl": "https://web.archive.org/web/20260520100309/https://www.pref.osaka.lg.jp/o170010/gikai_giji/giininfo/0802giin.html"
      },
      "result": {
        "title": "令和8年2月定例会 提出議案・議決結果",
        "localUrl": "/sources/osaka-fu-gikai-r8/gian0802_1.pdf",
        "originUrl": "https://www.pref.osaka.lg.jp/documents/125850/gian0802_1.pdf",
        "archiveUrl": "https://web.archive.org/web/20260228185802/https://www.pref.osaka.lg.jp/documents/125850/gian0802_1.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "271403": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "堺市議会",
      "seats": 47,
      "asOf": "2025-04-02",
      "asOfLabel": "2025年4月2日",
      "factions": [
        {
          "name": "大阪維新の会堺市議会議員団",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "公明党堺市議団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "堺創志会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自由民主党堺市議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党堺市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主党・市民クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 3,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和８年度堺市一般会計予算",
        "sessionLabel": "令和８年第２回堺市議会定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 堺市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別（更新日 2025年4月2日）",
        "localUrl": "/sources/sakai-shigikai-r8/75932120220517150837343.html",
        "originUrl": "https://web.archive.org/web/20260124021742id_/https://www.city.sakai.lg.jp/shigikai/meibo/75932120220517150837343.html",
        "archiveUrl": "https://web.archive.org/web/20260124021742id_/https://www.city.sakai.lg.jp/shigikai/meibo/75932120220517150837343.html"
      },
      "result": {
        "title": "令和８年第２回堺市議会定例会議決等案件一覧",
        "localUrl": "/sources/sakai-shigikai-r8/R8-2giketsuannkennichirann.pdf",
        "originUrl": "https://www.city.sakai.lg.jp/shigikai/kekka/giketsukekka/giketsuanken.files/R8-2giketsuannkennichirann.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001154306/https://www.city.sakai.lg.jp/shigikai/kekka/giketsukekka/giketsuanken.files/R8-2giketsuannkennichirann.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272027": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "岸和田市議会",
      "seats": 23,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属フォーラム",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "にじの会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "きしわだ未来",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "次世代政策会議",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属クラブ1（中岡佐織）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属クラブ2（藤原豊和）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第24号",
        "billName": "令和8年度岸和田市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 岸和田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和8年第1回定例会議決結果（議員の賛否一覧・会派名の列）",
        "localUrl": "/sources/kishiwada-shigikai-r8/r8-1giketukekka.html",
        "originUrl": "https://www.city.kishiwada.lg.jp/site/gikai/r8-1giketukekka.html",
        "archiveUrl": "https://web.archive.org/web/20260422122524/https://www.city.kishiwada.lg.jp/site/gikai/r8-1giketukekka.html"
      },
      "result": {
        "title": "令和8年第1回定例会議決結果",
        "localUrl": "/sources/kishiwada-shigikai-r8/r8-1giketukekka.html",
        "originUrl": "https://www.city.kishiwada.lg.jp/site/gikai/r8-1giketukekka.html",
        "archiveUrl": "https://web.archive.org/web/20260422122524/https://www.city.kishiwada.lg.jp/site/gikai/r8-1giketukekka.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272035": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "豊中市議会",
      "seats": 31,
      "asOf": "2026-02-20",
      "asOfLabel": "2026年2月20日",
      "factions": [
        {
          "name": "公明党豊中市議会議員団",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会・無所属議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "とよなかを共に創る会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党豊中市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 5,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "市議案第8号",
        "billName": "令和8年度豊中市一般会計予算",
        "sessionLabel": "令和8年(2026年)3月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 豊中市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派一覧表（更新日 2026年2月20日）",
        "localUrl": "/sources/toyonaka-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20260221224735id_/https://www.city.toyonaka.osaka.jp/shigikai/giinsyokai/yakuin/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260221224735id_/https://www.city.toyonaka.osaka.jp/shigikai/giinsyokai/yakuin/kaiha.html"
      },
      "result": {
        "title": "令和8年(2026年)3月定例会 議決結果",
        "localUrl": "/sources/toyonaka-shigikai-r8/reiwa8nenn3_giketu.html",
        "originUrl": "https://www.city.toyonaka.osaka.jp/shigikai/shigikaioshirase/giketsu_kekka/2026/reiwa8nenn3_giketu.html",
        "archiveUrl": "https://web.archive.org/web/20261001173311/https://www.city.toyonaka.osaka.jp/shigikai/shigikaioshirase/giketsu_kekka/2026/reiwa8nenn3_giketu.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 24,
          "議長": 1,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "公明党豊中市議会議員団",
            "counts": {
              "賛成": 9
            },
            "members": []
          },
          {
            "faction": "大阪維新の会・無所属議員団",
            "counts": {
              "賛成": 8
            },
            "members": []
          },
          {
            "faction": "とよなかを共に創る会",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "井本博一",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "日本共産党豊中市議会議員団",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "無所属",
            "counts": {
              "賛成": 3,
              "反対": 2
            },
            "members": [
              {
                "name": "井上弘美",
                "stance": "賛成"
              },
              {
                "name": "木村真",
                "stance": "賛成"
              },
              {
                "name": "中野宏基",
                "stance": "反対"
              },
              {
                "name": "松岡信道",
                "stance": "賛成"
              },
              {
                "name": "山田紗保",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "とよなか市議会のうごき VOL.291「議案などの賛否の状況」",
          "localUrl": "/sources/toyonaka-shigikai-r8/202605_gikaihou.pdf",
          "originUrl": "https://www.city.toyonaka.osaka.jp/shigikai/shigikaioshirase/gikai_ugoki/202603gikaihou.files/202605_gikaihou.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002120929/https://www.city.toyonaka.osaka.jp/shigikai/shigikaioshirase/gikai_ugoki/202603gikaihou.files/202605_gikaihou.pdf"
        }
      }
    }
  ],
  "272043": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "池田市議会",
      "seats": 22,
      "teisu": 22,
      "asOf": "2026-03-27",
      "asOfLabel": "2026年3月27日",
      "factions": [
        {
          "name": "大阪維新の会池田",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自民党保守の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "池田未来の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "未来はぐくむプロジェクト",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（守屋大道）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第33号",
        "billName": "令和8年度池田市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決(賛成多数)"
      },
      "sourceTitle": "令和8年度 池田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "いけだ市議会だより No.199（令和8年5月1日発行）議決結果〈3月定例会〉",
        "localUrl": "/sources/ikeda-shigikai-r8/gikai_dayori_R8_5.pdf",
        "originUrl": "https://www.city.ikeda.osaka.jp/material/files/group/39/gikai_dayori_R8_5.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021144706/https://www.city.ikeda.osaka.jp/material/files/group/39/gikai_dayori_R8_5.pdf"
      },
      "result": {
        "title": "令和8年3月定例会 市長提出議案及び議決の結果",
        "localUrl": "/sources/ikeda-shigikai-r8/20615.html",
        "originUrl": "https://www.city.ikeda.osaka.jp/soshiki/gikai/ikedashigikai/teishutu/reiwa8nennteisyutugianngiketukekka/20615.html",
        "archiveUrl": "https://web.archive.org/web/20261021151939/https://www.city.ikeda.osaka.jp/soshiki/gikai/ikedashigikai/teishutu/reiwa8nennteisyutugianngiketukekka/20615.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 19,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "大阪維新の会池田",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "安黒善雄",
                "stance": "賛成"
              },
              {
                "name": "三宅正起",
                "stance": "賛成"
              },
              {
                "name": "古川裕倫",
                "stance": "賛成"
              },
              {
                "name": "笹村有里子",
                "stance": "賛成"
              },
              {
                "name": "土田麻衣",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自民党保守の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小林義典",
                "stance": "賛成"
              },
              {
                "name": "浜地慎一郎",
                "stance": "賛成"
              },
              {
                "name": "沖本純子",
                "stance": "賛成"
              },
              {
                "name": "松本康二郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "池田未来の会",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "下窄明",
                "stance": "賛成"
              },
              {
                "name": "西垣智",
                "stance": "賛成"
              },
              {
                "name": "坂上昭栄",
                "stance": "賛成"
              },
              {
                "name": "中田正紀",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "多田隆一",
                "stance": "賛成"
              },
              {
                "name": "荒木眞澄",
                "stance": "賛成"
              },
              {
                "name": "藤本昌宏",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "未来はぐくむプロジェクト",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "園部佳子",
                "stance": "賛成"
              },
              {
                "name": "倉田晃",
                "stance": "賛成"
              },
              {
                "name": "名村研二郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "山元建",
                "stance": "反対"
              },
              {
                "name": "藤原美知子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（守屋大道）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "守屋大道",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "いけだ市議会だより No.199 議決結果〈3月定例会〉",
          "localUrl": "/sources/ikeda-shigikai-r8/gikai_dayori_R8_5.pdf",
          "originUrl": "https://www.city.ikeda.osaka.jp/material/files/group/39/gikai_dayori_R8_5.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021144706/https://www.city.ikeda.osaka.jp/material/files/group/39/gikai_dayori_R8_5.pdf"
        }
      }
    }
  ],
  "272051": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "吹田市議会",
      "seats": 33,
      "asOf": "2026-01-27",
      "asOfLabel": "2026年1月27日",
      "factions": [
        {
          "name": "大阪維新の会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "日本共産党 吹田市議会議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党 吹田市議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "自民党吹田・無所属の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "吹田党・参政党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民と歩む議員の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第19号",
        "billName": "令和８年度吹田市一般会計予算",
        "sessionLabel": "令和８年(2026年)２月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 吹田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別（令和8年（2026年）1月27日現在）",
        "localUrl": "/sources/suita-shigikai-r8/1012851.html",
        "originUrl": "https://web.archive.org/web/20260618145337id_/https://www.city.suita.osaka.jp/shigikai/1017062/1012851.html",
        "archiveUrl": "https://web.archive.org/web/20260618145337id_/https://www.city.suita.osaka.jp/shigikai/1017062/1012851.html"
      },
      "result": {
        "title": "令和８年(2026年)２月定例会議決結果・賛否一覧表",
        "localUrl": "/sources/suita-shigikai-r8/50802result.pdf",
        "originUrl": "https://www.city.suita.osaka.jp/_res/projects/default_project/_page_/001/043/624/50802result.pdf",
        "archiveUrl": "https://web.archive.org/web/20260330161259/https://www.city.suita.osaka.jp/_res/projects/default_project/_page_/001/043/624/50802result.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272078": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "高槻市議会",
      "seats": 33,
      "asOf": "2026-01-13",
      "asOfLabel": "2026年1月13日",
      "factions": [
        {
          "name": "公明党議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会高槻市議会議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "自民・無所属議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "市民連合議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党高槻市会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第３２号",
        "billName": "令和８年度高槻市一般会計予算について",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 高槻市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派の構成（更新日 2026年1月13日）",
        "localUrl": "/sources/takatsuki-shigikai-r8/1023.html",
        "originUrl": "https://web.archive.org/web/20260210090856id_/https://www.city.takatsuki.osaka.jp/site/takatsukishigikai/1023.html",
        "archiveUrl": "https://web.archive.org/web/20260210090856id_/https://www.city.takatsuki.osaka.jp/site/takatsukishigikai/1023.html"
      },
      "result": {
        "title": "令和8年第1回定例会（3月定例会）の議決結果",
        "localUrl": "/sources/takatsuki-shigikai-r8/62812.pdf",
        "originUrl": "https://www.city.takatsuki.osaka.jp/uploaded/attachment/62812.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001173416/https://www.city.takatsuki.osaka.jp/uploaded/attachment/62812.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272094": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "守口市議会",
      "seats": 21,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "守口市議会公明党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会守口市議会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "守口未来会議",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党守口市会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "自由民主党守口市議会議員団",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "守口市民の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第21号",
        "billName": "令和8年度守口市一般会計予算",
        "sessionLabel": "令和8年2月定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 守口市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和8年2月定例会 議員別採決結果一覧",
        "localUrl": "/sources/moriguchi-shigikai-r8/giinnbetsusaiketsu0802_5.pdf",
        "originUrl": "https://www.city.moriguchi.osaka.jp/material/files/group/71/giinnbetsusaiketsu0802_5.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021144829/https://www.city.moriguchi.osaka.jp/material/files/group/71/giinnbetsusaiketsu0802_5.pdf"
      },
      "result": {
        "title": "令和8年2月定例会 議案・議決結果一覧",
        "localUrl": "/sources/moriguchi-shigikai-r8/20238.html",
        "originUrl": "https://www.city.moriguchi.osaka.jp/kakukanoannai/gikaijimukyoku/1/1/111/1_3/20238.html",
        "archiveUrl": "https://web.archive.org/web/20261021144844/https://www.city.moriguchi.osaka.jp/kakukanoannai/gikaijimukyoku/1/1/111/1_3/20238.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 18,
          "反対": 2,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "守口市議会公明党",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "工藤百合子",
                "stance": "賛成"
              },
              {
                "name": "福本健一",
                "stance": "賛成"
              },
              {
                "name": "寺嶋美和",
                "stance": "賛成"
              },
              {
                "name": "小鍛冶宗親",
                "stance": "賛成"
              },
              {
                "name": "西田久美",
                "stance": "賛成"
              },
              {
                "name": "松本満義",
                "stance": "賛成"
              },
              {
                "name": "西尾博道",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "大阪維新の会守口市議会議員団",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "山本もちかた",
                "stance": "賛成"
              },
              {
                "name": "山口たくや",
                "stance": "賛成"
              },
              {
                "name": "梅村正明",
                "stance": "賛成"
              },
              {
                "name": "山口真由美",
                "stance": "賛成"
              },
              {
                "name": "武田賢一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党守口市会議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "由井龍一郎",
                "stance": "反対"
              },
              {
                "name": "寺本けんた",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "守口未来会議",
            "counts": {
              "賛成": 4,
              "議長": 1
            },
            "members": [
              {
                "name": "服部浩之",
                "stance": "賛成"
              },
              {
                "name": "高島賢",
                "stance": "賛成"
              },
              {
                "name": "井内昌幸",
                "stance": "賛成"
              },
              {
                "name": "福西寿光",
                "stance": "賛成"
              },
              {
                "name": "江端将哲",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自由民主党守口市議会議員団",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "水原慶明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "守口市民の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "池嶋一夫",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年2月定例会 議員別採決結果一覧",
          "localUrl": "/sources/moriguchi-shigikai-r8/giinnbetsusaiketsu0802_5.pdf",
          "originUrl": "https://www.city.moriguchi.osaka.jp/material/files/group/71/giinnbetsusaiketsu0802_5.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021144829/https://www.city.moriguchi.osaka.jp/material/files/group/71/giinnbetsusaiketsu0802_5.pdf"
        }
      }
    }
  ],
  "272108": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "枚方市議会",
      "seats": 32,
      "teisu": 32,
      "asOf": "2026-02-01",
      "asOfLabel": "2026年2月1日",
      "factions": [
        {
          "name": "大阪維新の会枚方市議会議員団",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "自由民主党・無所属の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "連合市民の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "命を守る政治の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第84号",
        "billName": "令和８年度大阪府枚方市一般会計予算",
        "sessionLabel": "令和８年３月定例月議会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 枚方市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "枚方市議会報第361号（令和8年2月1日号）会派等所属別議員名",
        "localUrl": "/sources/hirakata-shigikai-r8/361.pdf",
        "originUrl": "https://www.city.hirakata.osaka.jp/cmsfiles/contents/0000031/31677/361.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001173638/https://www.city.hirakata.osaka.jp/cmsfiles/contents/0000031/31677/361.pdf"
      },
      "result": {
        "title": "付議事件議決結果一覧（令和8年3月定例月議会）",
        "localUrl": "/sources/hirakata-shigikai-r8/20260327_giketsukekka.pdf",
        "originUrl": "https://www.city.hirakata.osaka.jp/cmsfiles/contents/0000000/269/20260327_giketsukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001173849/https://www.city.hirakata.osaka.jp/cmsfiles/contents/0000000/269/20260327_giketsukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272124": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "八尾市議会",
      "seats": 24,
      "asOf": "2025-10-03",
      "asOfLabel": "2025年10月3日",
      "factions": [
        {
          "name": "大阪維新の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "八尾保守の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "八尾の未来を紡ぐ会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新声",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "至誠会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に所属しない議員（鑄方淳治）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第18号",
        "billName": "令和８年度八尾市一般会計予算の件",
        "sessionLabel": "令和８年３月市議会定例会",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 八尾市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和7年10月3日現在）",
        "localUrl": "/sources/yao-shigikai-r8/1009487.html",
        "originUrl": "https://web.archive.org/web/20260310130721id_/https://www.city.yao.osaka.jp/shisei/yaoshigikai/1009482/1009487.html",
        "archiveUrl": "https://web.archive.org/web/20260310130721id_/https://www.city.yao.osaka.jp/shisei/yaoshigikai/1009482/1009487.html"
      },
      "result": {
        "title": "令和８年３月市議会定例会 議決結果（議員別採決態度）",
        "localUrl": "/sources/yao-shigikai-r8/0803saiketutaido.pdf",
        "originUrl": "https://www.city.yao.osaka.jp/_res/projects/default_project/_page_/001/023/883/0803saiketutaido.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001174206/https://www.city.yao.osaka.jp/_res/projects/default_project/_page_/001/023/883/0803saiketutaido.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 21,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "大阪維新の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "景山和香",
                "stance": "賛成"
              },
              {
                "name": "木村健二",
                "stance": "賛成"
              },
              {
                "name": "坂本尚之",
                "stance": "賛成"
              },
              {
                "name": "桝井政佐美",
                "stance": "賛成"
              },
              {
                "name": "奥田信宏",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "福永美智子",
                "stance": "賛成"
              },
              {
                "name": "南方武",
                "stance": "賛成"
              },
              {
                "name": "五百井真二",
                "stance": "賛成"
              },
              {
                "name": "前園正昭",
                "stance": "賛成"
              },
              {
                "name": "西田尚美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "八尾保守の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "川上舞",
                "stance": "賛成"
              },
              {
                "name": "松田憲幸",
                "stance": "賛成"
              },
              {
                "name": "露原行隆",
                "stance": "賛成"
              },
              {
                "name": "田中久夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "八尾の未来を紡ぐ会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "柴谷匡哉",
                "stance": "賛成"
              },
              {
                "name": "西川あり",
                "stance": "賛成"
              },
              {
                "name": "吉村拓哉",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新声",
            "counts": {
              "賛成": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "山中宏",
                "stance": "賛成"
              },
              {
                "name": "竹田孝吏",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "田中裕子",
                "stance": "反対"
              },
              {
                "name": "越智妙子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "至誠会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "稲森洋樹",
                "stance": "賛成"
              },
              {
                "name": "田中慎二",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に所属しない議員（鑄方淳治）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "鑄方淳治",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年３月市議会定例会 議決結果（議員別採決態度）",
          "localUrl": "/sources/yao-shigikai-r8/0803saiketutaido.pdf",
          "originUrl": "https://www.city.yao.osaka.jp/_res/projects/default_project/_page_/001/023/883/0803saiketutaido.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001174206/https://www.city.yao.osaka.jp/_res/projects/default_project/_page_/001/023/883/0803saiketutaido.pdf"
        }
      }
    }
  ],
  "272141": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "富田林市議会",
      "seats": 18,
      "teisu": 18,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "とんだばやし未来",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "自民・笑顔の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無会派",
          "seats": 5,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２４号",
        "billName": "令和８年度大阪府富田林市一般会計予算",
        "sessionLabel": "令和８年第１回（３月）富田林市議会定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 富田林市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "とんだばやし議会だより No.266 3月定例会号 令和8年第1回（3月）定例会 議案に対する賛否一覧表",
        "localUrl": "/sources/tondabayashi-shigikai-r8/113665.pdf",
        "originUrl": "https://www.city.tondabayashi.lg.jp/uploaded/attachment/113665.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145040/https://www.city.tondabayashi.lg.jp/uploaded/attachment/113665.pdf"
      },
      "result": {
        "title": "令和８年第１回（３月）富田林市議会定例会 結果",
        "localUrl": "/sources/tondabayashi-shigikai-r8/112421.pdf",
        "originUrl": "https://www.city.tondabayashi.lg.jp/uploaded/attachment/112421.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145637/https://www.city.tondabayashi.lg.jp/uploaded/attachment/112421.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272167": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "河内長野市議会",
      "seats": 16,
      "asOf": "2026-03-26",
      "asOfLabel": "2026年3月26日",
      "factions": [
        {
          "name": "自民党・市民クラブ・無所属議員の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に所属しない（工藤敬子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２８号",
        "billName": "令和８年度河内長野市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 河内長野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "市議会だより No.272（令和8年6月1日発行）議案等に対する各議員の態度（令和8年3月定例会）",
        "localUrl": "/sources/kawachinagano-shigikai-r8/128186_370701_misc.pdf",
        "originUrl": "https://www.city.kawachinagano.lg.jp/uploaded/life/128186_370701_misc.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145138/https://www.city.kawachinagano.lg.jp/uploaded/life/128186_370701_misc.pdf"
      },
      "result": {
        "title": "令和８年３月定例会 審議結果",
        "localUrl": "/sources/kawachinagano-shigikai-r8/122030_347939_misc.pdf",
        "originUrl": "https://www.city.kawachinagano.lg.jp/uploaded/life/122030_347939_misc.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145234/https://www.city.kawachinagano.lg.jp/uploaded/life/122030_347939_misc.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 12,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "自民党・市民クラブ・無所属議員の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "奥村亮",
                "stance": "賛成"
              },
              {
                "name": "堀川和彦",
                "stance": "賛成"
              },
              {
                "name": "土井昭",
                "stance": "賛成"
              },
              {
                "name": "峯満寿人",
                "stance": "賛成"
              },
              {
                "name": "桂聖",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3,
              "議長": 1
            },
            "members": [
              {
                "name": "奥井良一",
                "stance": "賛成"
              },
              {
                "name": "浦山宣之",
                "stance": "賛成"
              },
              {
                "name": "三島克則",
                "stance": "賛成"
              },
              {
                "name": "大原一郎",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "大阪維新の会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "林史隆",
                "stance": "賛成"
              },
              {
                "name": "吉竹英行",
                "stance": "賛成"
              },
              {
                "name": "若林靖",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "駄場中大介",
                "stance": "反対"
              },
              {
                "name": "宮本哲",
                "stance": "反対"
              },
              {
                "name": "丹羽実",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に所属しない（工藤敬子）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "工藤敬子",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "市議会だより No.272 議案等に対する各議員の態度（全会一致でない議案等の賛否）",
          "localUrl": "/sources/kawachinagano-shigikai-r8/128186_370701_misc.pdf",
          "originUrl": "https://www.city.kawachinagano.lg.jp/uploaded/life/128186_370701_misc.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021145138/https://www.city.kawachinagano.lg.jp/uploaded/life/128186_370701_misc.pdf"
        }
      }
    }
  ],
  "272175": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "松原市議会",
      "seats": 18,
      "teisu": 18,
      "asOf": "2026-03-26",
      "asOfLabel": "2026年3月26日",
      "factions": [
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "まつばら未来",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主党・無所属の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第４号",
        "billName": "令和８年度松原市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 松原市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "松原市議会だより No.205 令和8年第1回定例会 議案と結果（賛否が分かれた議案の結果）",
        "localUrl": "/sources/matsubara-shigikai-r8/_____5___No.205_HP_rr____.pdf",
        "originUrl": "https://www.city.matsubara.lg.jp/fs/3/4/1/5/5/1/_/_____5___No.205_HP_rr____.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145257/https://www.city.matsubara.lg.jp/fs/3/4/1/5/5/1/_/_____5___No.205_HP_rr____.pdf"
      },
      "result": {
        "title": "付議事件議決顛末一覧表（令和８年第１回定例会）",
        "localUrl": "/sources/matsubara-shigikai-r8/____________HP__.pdf",
        "originUrl": "https://www.city.matsubara.lg.jp/fs/3/3/2/6/0/6/_/____________HP__.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145313/https://www.city.matsubara.lg.jp/fs/3/3/2/6/0/6/_/____________HP__.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272183": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大東市議会",
      "seats": 17,
      "teisu": 17,
      "asOf": "2026-03-24",
      "asOfLabel": "2026年3月24日",
      "factions": [
        {
          "name": "公明党議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "大阪維新の会大東市議会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "次世代だいとう",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "二人会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無会派（木田伸幸）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無会派（北村哲夫）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第14号",
        "billName": "令和8年度大東市一般会計予算",
        "sessionLabel": "令和8年3月定例月議会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "修正可決(賛成多数)"
      },
      "sourceTitle": "令和8年度 大東市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "だいとうし議会だより130号（令和8年3月定例月議会号）付議された議案の審議結果",
        "localUrl": "/sources/daito-shigikai-r8/Kh133_1.pdf",
        "originUrl": "https://daito.gijiroku.com/gikai/GikaiDoc/attach/koho/Kh133%5F1%2Epdf",
        "archiveUrl": "https://web.archive.org/web/20261021145331/https://daito.gijiroku.com/gikai/GikaiDoc/attach/koho/Kh133_1.pdf"
      },
      "result": {
        "title": "大東市議会 議決結果（令和8年3月定例月議会）",
        "localUrl": "/sources/daito-shigikai-r8/g07_giketsu.asp.html",
        "originUrl": "https://daito.gijiroku.com/gikai/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026/02/24,2026/03/24,140&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2",
        "archiveUrl": "https://web.archive.org/web/20261021145351/https://daito.gijiroku.com/gikai/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026%2F02%2F24,2026%2F03%2F24,140&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272205": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "箕面市議会",
      "seats": 23,
      "teisu": 23,
      "asOf": "2026-03-25",
      "asOfLabel": "2026年3月25日",
      "factions": [
        {
          "name": "大阪維新の会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自民保守の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "箕面政友会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "箕面の未来をひらく会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第1号議案",
        "billName": "令和8年度箕面市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 箕面市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "賛成・反対が分かれた議案（令和8年第1回定例会）の政策会派別の列見出し",
        "localUrl": "/sources/minoh-shigikai-r8/r8-1sanpihyou.pdf",
        "originUrl": "https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/documents/r8-1sanpihyou.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021145421/https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/documents/r8-1sanpihyou.pdf"
      },
      "result": {
        "title": "令和8年第1回定例会（会議情報・結果）",
        "localUrl": "/sources/minoh-shigikai-r8/r8-1.html",
        "originUrl": "https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/r8-1.html",
        "archiveUrl": "https://web.archive.org/web/20260514162145/https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/r8-1.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 20,
          "議長": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "大阪維新の会",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "久野井優子",
                "stance": "賛成"
              },
              {
                "name": "吉田栄美子",
                "stance": "賛成"
              },
              {
                "name": "尾﨑夏樹",
                "stance": "賛成"
              },
              {
                "name": "山根ひとみ",
                "stance": "賛成"
              },
              {
                "name": "神代繁近",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "牧馨",
                "stance": "賛成"
              },
              {
                "name": "浦川倫子",
                "stance": "賛成"
              },
              {
                "name": "増田京子",
                "stance": "賛成"
              },
              {
                "name": "中西智子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自民保守の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "竹内洋人",
                "stance": "賛成"
              },
              {
                "name": "牧野寿美",
                "stance": "賛成"
              },
              {
                "name": "木下伸雄",
                "stance": "賛成"
              },
              {
                "name": "藤田貴支",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "箕面政友会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "高橋竜馬",
                "stance": "賛成"
              },
              {
                "name": "大脇典子",
                "stance": "賛成"
              },
              {
                "name": "中嶋三四郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2,
              "議長": 1
            },
            "members": [
              {
                "name": "楠政則",
                "stance": "賛成"
              },
              {
                "name": "岡沢聡",
                "stance": "賛成"
              },
              {
                "name": "田中真由美",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "箕面の未来をひらく会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "桃山悟",
                "stance": "賛成"
              },
              {
                "name": "武智秀生",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "村川真実",
                "stance": "反対"
              },
              {
                "name": "金森いずみ",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "賛成・反対が分かれた議案（令和8年第1回定例会）",
          "localUrl": "/sources/minoh-shigikai-r8/r8-1sanpihyou.pdf",
          "originUrl": "https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/documents/r8-1sanpihyou.pdf",
          "archiveUrl": "https://web.archive.org/web/20261021145421/https://www.city.minoh.lg.jp/giji/kaigijyouhou-kekka/documents/r8-1sanpihyou.pdf"
        }
      }
    }
  ],
  "272221": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "羽曳野市議会",
      "seats": 18,
      "teisu": 18,
      "asOf": "2026-03-30",
      "asOfLabel": "2026年3月30日",
      "factions": [
        {
          "name": "大阪維新の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "自由民主党・もっと羽曳野議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員（麻野彰子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "19",
        "billName": "令和８年度羽曳野市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-30",
        "decidedDateLabel": "令和8年3月30日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 羽曳野市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年３月定例会で審議された案件と議決結果（議案等に対する各議員の状況）の会派別の列見出し",
        "localUrl": "/sources/habikino-shigikai-r8/081giketukekka.pdf",
        "originUrl": "https://www.city.habikino.lg.jp/material/files/group/50/081giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021151515/https://www.city.habikino.lg.jp/material/files/group/50/081giketukekka.pdf"
      },
      "result": {
        "title": "令和８年３月定例会で審議された案件と議決結果",
        "localUrl": "/sources/habikino-shigikai-r8/081giketukekka.pdf",
        "originUrl": "https://www.city.habikino.lg.jp/material/files/group/50/081giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021151515/https://www.city.habikino.lg.jp/material/files/group/50/081giketukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "272272": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "東大阪市議会",
      "seats": 38,
      "teisu": 38,
      "asOf": "2025-11-07",
      "asOfLabel": "2025年11月7日",
      "factions": [
        {
          "name": "大阪維新の会東大阪市議団",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "東大阪市議会公明党議員団",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "自由民主党東大阪議員団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党東大阪市会議員団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "照隅の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "東大阪翔の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組東大阪勇愛会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第36号",
        "billName": "令和８年度東大阪市一般会計予算",
        "sessionLabel": "令和８年２月 第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "修正可決（起立多数）"
      },
      "sourceTitle": "令和8年度 東大阪市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "東大阪市議会だより第232号（令和8年1月1日発行）会派別議員一覧（令和７年１１月７日現在）",
        "localUrl": "/sources/higashiosaka-shigikai-r8/Kh112_232.pdf",
        "originUrl": "https://higashiosaka.gijiroku.com/gikai/GikaiDoc/attach/koho/Kh112_232.pdf",
        "archiveUrl": "https://web.archive.org/web/20261021151638/https://higashiosaka.gijiroku.com/gikai/GikaiDoc/attach/koho/Kh112_232.pdf"
      },
      "result": {
        "title": "議案一覧表（令和８年２月 第１回定例会）",
        "localUrl": "/sources/higashiosaka-shigikai-r8/g07_giketsu.asp.html",
        "originUrl": "https://higashiosaka.gijiroku.com/gikai/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026/02/20,2026/03/27,100&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2",
        "archiveUrl": "https://web.archive.org/web/20261021151654/https://higashiosaka.gijiroku.com/gikai/g07_giketsu.asp?KWORD1=&EXP=AND&KWORD2=&BUNRUI=&KAIGI=2026%2F02%2F20,2026%2F03%2F27,100&NENFROM=&NENTO=&KEKKA=&SMODE=2&KENSU=100&Sflg=2"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "281000": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "神戸市会",
      "seats": 64,
      "teisu": 65,
      "asOf": "2026-01-27",
      "asOfLabel": "2026年1月27日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "こうべ未来",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "新しい自民党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "躍動の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "つなぐ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（平野章三）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（上原みなみ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（なんのゆうこ）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "予算第1号議案",
        "billName": "令和8年度神戸市一般会計予算",
        "sessionLabel": "令和8年第1回定例市会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 神戸市会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "神戸市会 会派（最終更新日 2026年1月27日）",
        "localUrl": "/sources/kobe-shikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20260309125942id_/https://www.city.kobe.lg.jp/a71064/shise/municipal/giinnmeibo/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260309125942id_/https://www.city.kobe.lg.jp/a71064/shise/municipal/giinnmeibo/kaiha.html"
      },
      "result": {
        "title": "2026年/令和8年第1回定例市会【2月議会】",
        "localUrl": "/sources/kobe-shikai-r8/2gatsukekka.html",
        "originUrl": "https://www.city.kobe.lg.jp/z/shikaijimukyoku/giann_etc/r8/2gatsukekka.html",
        "archiveUrl": "https://web.archive.org/web/20260317083801/https://www.city.kobe.lg.jp/z/shikaijimukyoku/giann_etc/r8/2gatsukekka.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "282014": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "姫路市議会",
      "seats": 45,
      "asOf": "2025-09-01",
      "asOfLabel": "2025年9月1日",
      "factions": [
        {
          "name": "公明党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "自由民主党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "新生ひめじ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "姫路無所属の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "改革無所属の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "志政会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "刷新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "無所属（高見千咲）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第1号",
        "billName": "令和８年度姫路市一般会計予算",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 姫路市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "市議会議員名簿（会派別）（更新日 2025年9月1日）",
        "localUrl": "/sources/himeji-shigikai-r8/0000000374.html",
        "originUrl": "https://web.archive.org/web/20260415193403id_/https://www.city.himeji.lg.jp/shisei/0000000374.html",
        "archiveUrl": "https://web.archive.org/web/20260415193403id_/https://www.city.himeji.lg.jp/shisei/0000000374.html"
      },
      "result": {
        "title": "提出議案とその結果（令和8年第1回定例会）議案に対する議員の賛否一覧",
        "localUrl": "/sources/himeji-shigikai-r8/0325giannsinngikekka.pdf",
        "originUrl": "https://www.city.himeji.lg.jp/shisei/cmsfiles/contents/0000032/32725/0325giannsinngikekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001174251/https://www.city.himeji.lg.jp/shisei/cmsfiles/contents/0000032/32725/0325giannsinngikekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 41,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "公明党",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "西本眞造",
                "stance": "賛成"
              },
              {
                "name": "川島淳良",
                "stance": "賛成"
              },
              {
                "name": "白井義一",
                "stance": "賛成"
              },
              {
                "name": "中西祥子",
                "stance": "賛成"
              },
              {
                "name": "阿野れい子",
                "stance": "賛成"
              },
              {
                "name": "前川藤枝",
                "stance": "賛成"
              },
              {
                "name": "有馬剛朗",
                "stance": "賛成"
              },
              {
                "name": "宮下和也",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "竹尾浩司",
                "stance": "賛成"
              },
              {
                "name": "常盤真功",
                "stance": "賛成"
              },
              {
                "name": "山口悟",
                "stance": "賛成"
              },
              {
                "name": "駒田かすみ",
                "stance": "賛成"
              },
              {
                "name": "三輪敏之",
                "stance": "賛成"
              },
              {
                "name": "阿山正人",
                "stance": "賛成"
              },
              {
                "name": "八木隆次郎",
                "stance": "賛成"
              },
              {
                "name": "蔭山敏明",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党",
            "counts": {
              "賛成": 6,
              "議長": 1
            },
            "members": [
              {
                "name": "竹中隆一",
                "stance": "賛成"
              },
              {
                "name": "井川一善",
                "stance": "賛成"
              },
              {
                "name": "重田一政",
                "stance": "賛成"
              },
              {
                "name": "仁野央子",
                "stance": "賛成"
              },
              {
                "name": "石見和之",
                "stance": "賛成"
              },
              {
                "name": "石堂大輔",
                "stance": "議長"
              },
              {
                "name": "宮本吉秀",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新生ひめじ",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "三和衛",
                "stance": "賛成"
              },
              {
                "name": "井上太良",
                "stance": "賛成"
              },
              {
                "name": "東影昭",
                "stance": "賛成"
              },
              {
                "name": "萩原唯典",
                "stance": "賛成"
              },
              {
                "name": "杉本博昭",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "大西陽介",
                "stance": "賛成"
              },
              {
                "name": "竹中由佳",
                "stance": "賛成"
              },
              {
                "name": "下林崇史",
                "stance": "賛成"
              },
              {
                "name": "三浦充博",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "姫路無所属の会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "妻鹿幸二",
                "stance": "賛成"
              },
              {
                "name": "神頭敬介",
                "stance": "賛成"
              },
              {
                "name": "嶋谷秀樹",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "改革無所属の会",
            "counts": {
              "賛成": 2,
              "反対": 1
            },
            "members": [
              {
                "name": "塚本進介",
                "stance": "賛成"
              },
              {
                "name": "牧野圭輔",
                "stance": "反対"
              },
              {
                "name": "坂本学",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "志政会",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "金内義和",
                "stance": "賛成"
              },
              {
                "name": "西村しのぶ",
                "stance": "賛成"
              },
              {
                "name": "松岡廣幸",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "谷川真由美",
                "stance": "反対"
              },
              {
                "name": "小田響子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "刷新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "岡部敦吏",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（高見千咲）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "高見千咲",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "提出議案とその結果（令和8年第1回定例会）議案に対する議員の賛否一覧",
          "localUrl": "/sources/himeji-shigikai-r8/0325giannsinngikekka.pdf",
          "originUrl": "https://www.city.himeji.lg.jp/shisei/cmsfiles/contents/0000032/32725/0325giannsinngikekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001174251/https://www.city.himeji.lg.jp/shisei/cmsfiles/contents/0000032/32725/0325giannsinngikekka.pdf"
        }
      }
    }
  ],
  "282031": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "明石市議会",
      "seats": 30,
      "teisu": 30,
      "asOf": "2026-02-01",
      "asOfLabel": "2026年2月1日",
      "factions": [
        {
          "name": "かがやきネット・市民の会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "自由民主党明石",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "明石維新の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "対話の会あかし",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "スマイル会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２９号",
        "billName": "令和８年度明石市一般会計予算",
        "sessionLabel": "第１回定例会３月議会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "修正可決"
      },
      "sourceTitle": "令和8年度 明石市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派（令和8年2月1日現在）",
        "localUrl": "/sources/akashi-shigikai-r8/kaiha.html",
        "originUrl": "https://web.archive.org/web/20260311190050id_/https://www.city.akashi.lg.jp/gikai/youkoso/shoukai/kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260311190050id_/https://www.city.akashi.lg.jp/gikai/youkoso/shoukai/kaiha.html"
      },
      "result": {
        "title": "第１回定例会３月議会審議結果報告のこと",
        "localUrl": "/sources/akashi-shigikai-r8/50803singikekka.pdf",
        "originUrl": "https://www.city.akashi.lg.jp/documents/31614/50803singikekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001174401/https://www.city.akashi.lg.jp/documents/31614/50803singikekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "voteParts": [
        {
          "part": "修正案",
          "basis": "member",
          "stances": [
            "賛成",
            "反対",
            "議長"
          ],
          "tally": {
            "賛成": 18,
            "反対": 11,
            "議長": 1
          },
          "byFaction": [
            {
              "faction": "かがやきネット・市民の会",
              "counts": {
                "賛成": 10
              },
              "members": [
                {
                  "name": "上田雅彦",
                  "stance": "賛成"
                },
                {
                  "name": "中川夏望",
                  "stance": "賛成"
                },
                {
                  "name": "山下祥",
                  "stance": "賛成"
                },
                {
                  "name": "金尾良信",
                  "stance": "賛成"
                },
                {
                  "name": "黒田智子",
                  "stance": "賛成"
                },
                {
                  "name": "山中裕司",
                  "stance": "賛成"
                },
                {
                  "name": "林丸美",
                  "stance": "賛成"
                },
                {
                  "name": "竹内きよ子",
                  "stance": "賛成"
                },
                {
                  "name": "宮坂祐太",
                  "stance": "賛成"
                },
                {
                  "name": "寺井吉広",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "自由民主党明石",
              "counts": {
                "反対": 8
              },
              "members": [
                {
                  "name": "出雲有希子",
                  "stance": "反対"
                },
                {
                  "name": "石井宏法",
                  "stance": "反対"
                },
                {
                  "name": "井藤圭順",
                  "stance": "反対"
                },
                {
                  "name": "灰野修平",
                  "stance": "反対"
                },
                {
                  "name": "榎本和夫",
                  "stance": "反対"
                },
                {
                  "name": "千住啓介",
                  "stance": "反対"
                },
                {
                  "name": "三好宏",
                  "stance": "反対"
                },
                {
                  "name": "辰巳浩司",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "公明党",
              "counts": {
                "賛成": 5,
                "議長": 1
              },
              "members": [
                {
                  "name": "長尾博子",
                  "stance": "賛成"
                },
                {
                  "name": "河村和歌子",
                  "stance": "賛成"
                },
                {
                  "name": "尾倉あき子",
                  "stance": "賛成"
                },
                {
                  "name": "飯田伸子",
                  "stance": "賛成"
                },
                {
                  "name": "梅田宏希",
                  "stance": "賛成"
                },
                {
                  "name": "国出拓志",
                  "stance": "議長"
                }
              ]
            },
            {
              "faction": "明石維新の会",
              "counts": {
                "反対": 3
              },
              "members": [
                {
                  "name": "正木克幸",
                  "stance": "反対"
                },
                {
                  "name": "中村茂雄",
                  "stance": "反対"
                },
                {
                  "name": "髙尾秀彰",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "日本共産党",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "辻本達也",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "対話の会あかし",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "中西礼皇",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "スマイル会",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "家根谷敦子",
                  "stance": "賛成"
                }
              ]
            }
          ],
          "source": {
            "title": "令和８年第１回定例会３月議会（３月２５日）賛否一覧",
            "localUrl": "/sources/akashi-shigikai-r8/50803sanpi_2.pdf",
            "originUrl": "https://www.city.akashi.lg.jp/documents/31615/50803sanpi_2.pdf",
            "archiveUrl": "https://web.archive.org/web/20261001174454/https://www.city.akashi.lg.jp/documents/31615/50803sanpi_2.pdf"
          }
        },
        {
          "part": "修正部分を除く原案",
          "basis": "member",
          "stances": [
            "賛成",
            "反対",
            "議長"
          ],
          "tally": {
            "賛成": 28,
            "議長": 1,
            "反対": 1
          },
          "byFaction": [
            {
              "faction": "かがやきネット・市民の会",
              "counts": {
                "賛成": 10
              },
              "members": [
                {
                  "name": "上田雅彦",
                  "stance": "賛成"
                },
                {
                  "name": "中川夏望",
                  "stance": "賛成"
                },
                {
                  "name": "山下祥",
                  "stance": "賛成"
                },
                {
                  "name": "金尾良信",
                  "stance": "賛成"
                },
                {
                  "name": "黒田智子",
                  "stance": "賛成"
                },
                {
                  "name": "山中裕司",
                  "stance": "賛成"
                },
                {
                  "name": "林丸美",
                  "stance": "賛成"
                },
                {
                  "name": "竹内きよ子",
                  "stance": "賛成"
                },
                {
                  "name": "宮坂祐太",
                  "stance": "賛成"
                },
                {
                  "name": "寺井吉広",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "自由民主党明石",
              "counts": {
                "賛成": 8
              },
              "members": [
                {
                  "name": "出雲有希子",
                  "stance": "賛成"
                },
                {
                  "name": "石井宏法",
                  "stance": "賛成"
                },
                {
                  "name": "井藤圭順",
                  "stance": "賛成"
                },
                {
                  "name": "灰野修平",
                  "stance": "賛成"
                },
                {
                  "name": "榎本和夫",
                  "stance": "賛成"
                },
                {
                  "name": "千住啓介",
                  "stance": "賛成"
                },
                {
                  "name": "三好宏",
                  "stance": "賛成"
                },
                {
                  "name": "辰巳浩司",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "公明党",
              "counts": {
                "賛成": 5,
                "議長": 1
              },
              "members": [
                {
                  "name": "長尾博子",
                  "stance": "賛成"
                },
                {
                  "name": "河村和歌子",
                  "stance": "賛成"
                },
                {
                  "name": "尾倉あき子",
                  "stance": "賛成"
                },
                {
                  "name": "飯田伸子",
                  "stance": "賛成"
                },
                {
                  "name": "梅田宏希",
                  "stance": "賛成"
                },
                {
                  "name": "国出拓志",
                  "stance": "議長"
                }
              ]
            },
            {
              "faction": "明石維新の会",
              "counts": {
                "賛成": 3
              },
              "members": [
                {
                  "name": "正木克幸",
                  "stance": "賛成"
                },
                {
                  "name": "中村茂雄",
                  "stance": "賛成"
                },
                {
                  "name": "髙尾秀彰",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "日本共産党",
              "counts": {
                "反対": 1
              },
              "members": [
                {
                  "name": "辻本達也",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "対話の会あかし",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "中西礼皇",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "スマイル会",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "家根谷敦子",
                  "stance": "賛成"
                }
              ]
            }
          ],
          "source": {
            "title": "令和８年第１回定例会３月議会（３月２５日）賛否一覧",
            "localUrl": "/sources/akashi-shigikai-r8/50803sanpi_2.pdf",
            "originUrl": "https://www.city.akashi.lg.jp/documents/31615/50803sanpi_2.pdf",
            "archiveUrl": "https://web.archive.org/web/20261001174454/https://www.city.akashi.lg.jp/documents/31615/50803sanpi_2.pdf"
          }
        }
      ]
    }
  ],
  "282049": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "西宮市議会",
      "seats": 40,
      "asOf": "2025-10-02",
      "asOfLabel": "2025年10月2日",
      "factions": [
        {
          "name": "日本維新の会　西宮市議団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "会派・ぜんしん",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "啓誠会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党西宮市会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第493号",
        "billName": "令和８年度西宮市一般会計予算",
        "sessionLabel": "令和8年3月（第16回）定例会",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 西宮市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和7年10月2日現在）",
        "localUrl": "/sources/nishinomiya-shigikai-r8/kaihabetsu-list.html",
        "originUrl": "https://web.archive.org/web/20260112181844id_/https://www.nishi.or.jp/nishinomiyashigikai/namelist/kaihabetsu-list.html",
        "archiveUrl": "https://web.archive.org/web/20260112181844id_/https://www.nishi.or.jp/nishinomiyashigikai/namelist/kaihabetsu-list.html"
      },
      "result": {
        "title": "議決結果（令和8年3月（第16回）定例会）",
        "localUrl": "/sources/nishinomiya-shigikai-r8/g07_giketsu.asp_Sflg_1_kaigi_2026_02_16_2026_03_19_272_kensu_100.html",
        "originUrl": "https://nishi.gijiroku.com/g07_giketsu.asp?Sflg=1&kaigi=2026/02/16,2026/03/19,272&kensu=100",
        "archiveUrl": "https://web.archive.org/web/20261001175459/https://nishi.gijiroku.com/g07_giketsu.asp?Sflg=1&kaigi=2026%2F02%2F16,2026%2F03%2F19,272&kensu=100"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "292010": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "奈良市議会",
      "seats": 39,
      "teisu": 39,
      "asOf": "2025-11-19",
      "asOfLabel": "2025年11月19日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党奈良市議会議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本維新の会奈良市議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党奈良市会議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自民党・無所属の会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市民ひろば",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "未来の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（尾崎暢子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（松尾浩司）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（江川友梨）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（内藤智司）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（松下幸治）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（へずまりゅう）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（松石聖一）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第１６号",
        "billName": "令和８年度奈良市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "修正可決"
      },
      "sourceTitle": "令和8年度 奈良市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和7年11月19日現在）",
        "localUrl": "/sources/nara-shigikai-r8/114364.html",
        "originUrl": "https://web.archive.org/web/20260414181844id_/https://www.city.nara.lg.jp/site/narasigikai/114364.html",
        "archiveUrl": "https://web.archive.org/web/20260414181844id_/https://www.city.nara.lg.jp/site/narasigikai/114364.html"
      },
      "result": {
        "title": "議決結果一覧表（令和８年３月定例会）",
        "localUrl": "/sources/nara-shigikai-r8/208608.pdf",
        "originUrl": "https://www.city.nara.lg.jp/uploaded/attachment/208608.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001174652/https://www.city.nara.lg.jp/uploaded/attachment/208608.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "voteParts": [
        {
          "part": "修正部分を除く原案",
          "basis": "faction",
          "unanimousText": "全会一致",
          "stances": [
            "賛成",
            "議長"
          ],
          "tally": {
            "賛成": 38,
            "議長": 1
          },
          "byFaction": [
            {
              "faction": "自由民主党",
              "counts": {
                "賛成": 6
              },
              "members": []
            },
            {
              "faction": "公明党奈良市議会議員団",
              "counts": {
                "賛成": 6
              },
              "members": []
            },
            {
              "faction": "日本維新の会奈良市議団",
              "counts": {
                "議長": 1,
                "賛成": 5
              },
              "members": [
                {
                  "name": "大西淳文",
                  "stance": "議長"
                }
              ]
            },
            {
              "faction": "日本共産党奈良市会議員団",
              "counts": {
                "賛成": 4
              },
              "members": []
            },
            {
              "faction": "自民党・無所属の会",
              "counts": {
                "賛成": 4
              },
              "members": []
            },
            {
              "faction": "市民ひろば",
              "counts": {
                "賛成": 3
              },
              "members": []
            },
            {
              "faction": "未来の会",
              "counts": {
                "賛成": 3
              },
              "members": []
            },
            {
              "faction": "無所属（尾崎暢子）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（松尾浩司）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（江川友梨）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（内藤智司）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（松下幸治）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（へずまりゅう）",
              "counts": {
                "賛成": 1
              },
              "members": []
            },
            {
              "faction": "無所属（松石聖一）",
              "counts": {
                "賛成": 1
              },
              "members": []
            }
          ],
          "source": {
            "title": "令和8年3月定例会 議決結果・賛否一覧表",
            "localUrl": "/sources/nara-shigikai-r8/209444.pdf",
            "originUrl": "https://www.city.nara.lg.jp/uploaded/attachment/209444.pdf",
            "archiveUrl": "https://web.archive.org/web/20261001174803/https://www.city.nara.lg.jp/uploaded/attachment/209444.pdf"
          }
        },
        {
          "part": "修正案",
          "basis": "member",
          "stances": [
            "賛成",
            "反対",
            "議長"
          ],
          "tally": {
            "賛成": 29,
            "議長": 1,
            "反対": 9
          },
          "byFaction": [
            {
              "faction": "自由民主党",
              "counts": {
                "賛成": 6
              },
              "members": [
                {
                  "name": "森田一成",
                  "stance": "賛成"
                },
                {
                  "name": "井久保裕也",
                  "stance": "賛成"
                },
                {
                  "name": "植村佳史",
                  "stance": "賛成"
                },
                {
                  "name": "八尾俊宏",
                  "stance": "賛成"
                },
                {
                  "name": "太田晃司",
                  "stance": "賛成"
                },
                {
                  "name": "道端孝治",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "公明党奈良市議会議員団",
              "counts": {
                "賛成": 6
              },
              "members": [
                {
                  "name": "九里雄二",
                  "stance": "賛成"
                },
                {
                  "name": "宮池明",
                  "stance": "賛成"
                },
                {
                  "name": "山口寛",
                  "stance": "賛成"
                },
                {
                  "name": "田畑日佐恵",
                  "stance": "賛成"
                },
                {
                  "name": "真鍋弘美",
                  "stance": "賛成"
                },
                {
                  "name": "早田哲朗",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "日本維新の会奈良市議団",
              "counts": {
                "賛成": 5,
                "議長": 1
              },
              "members": [
                {
                  "name": "柳田昌孝",
                  "stance": "賛成"
                },
                {
                  "name": "北邨翔平",
                  "stance": "賛成"
                },
                {
                  "name": "中川康",
                  "stance": "賛成"
                },
                {
                  "name": "木下修平",
                  "stance": "賛成"
                },
                {
                  "name": "佐野和則",
                  "stance": "賛成"
                },
                {
                  "name": "大西淳文",
                  "stance": "議長"
                }
              ]
            },
            {
              "faction": "日本共産党奈良市会議員団",
              "counts": {
                "賛成": 4
              },
              "members": [
                {
                  "name": "山口裕司",
                  "stance": "賛成"
                },
                {
                  "name": "白川健太郎",
                  "stance": "賛成"
                },
                {
                  "name": "山本直子",
                  "stance": "賛成"
                },
                {
                  "name": "北村拓哉",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "自民党・無所属の会",
              "counts": {
                "反対": 4
              },
              "members": [
                {
                  "name": "横井雄一",
                  "stance": "反対"
                },
                {
                  "name": "榎本博一",
                  "stance": "反対"
                },
                {
                  "name": "鍵田美智子",
                  "stance": "反対"
                },
                {
                  "name": "塚本勝",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "市民ひろば",
              "counts": {
                "反対": 3
              },
              "members": [
                {
                  "name": "樋口清二郎",
                  "stance": "反対"
                },
                {
                  "name": "阪本美知子",
                  "stance": "反対"
                },
                {
                  "name": "柿本元気",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "未来の会",
              "counts": {
                "賛成": 3
              },
              "members": [
                {
                  "name": "岡本誠至",
                  "stance": "賛成"
                },
                {
                  "name": "下村千恵",
                  "stance": "賛成"
                },
                {
                  "name": "階戸幸一",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（尾崎暢子）",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "尾崎暢子",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（松尾浩司）",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "松尾浩司",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（江川友梨）",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "江川友梨",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（内藤智司）",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "内藤智司",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（松下幸治）",
              "counts": {
                "反対": 1
              },
              "members": [
                {
                  "name": "松下幸治",
                  "stance": "反対"
                }
              ]
            },
            {
              "faction": "無所属（へずまりゅう）",
              "counts": {
                "賛成": 1
              },
              "members": [
                {
                  "name": "へずまりゅう",
                  "stance": "賛成"
                }
              ]
            },
            {
              "faction": "無所属（松石聖一）",
              "counts": {
                "反対": 1
              },
              "members": [
                {
                  "name": "松石聖一",
                  "stance": "反対"
                }
              ]
            }
          ],
          "source": {
            "title": "令和8年3月定例会 議決結果・賛否一覧表",
            "localUrl": "/sources/nara-shigikai-r8/209444.pdf",
            "originUrl": "https://www.city.nara.lg.jp/uploaded/attachment/209444.pdf",
            "archiveUrl": "https://web.archive.org/web/20261001174803/https://www.city.nara.lg.jp/uploaded/attachment/209444.pdf"
          }
        }
      ]
    }
  ],
  "322016": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "松江市議会",
      "seats": 31,
      "teisu": 31,
      "asOf": "2025-04-24",
      "asOfLabel": "2025年4月24日",
      "factions": [
        {
          "name": "誠政松江",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "志翔の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "民主ネットワーク",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党松江市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に属しない議員（舟木一真）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "会派に属しない議員（錦織伸行）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議第56号",
        "billName": "令和８年度松江市一般会計予算",
        "sessionLabel": "令和８年第１回松江市議会（定例会）",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 松江市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "松江市議会議員名簿（会派別）（令和7年4月24日現在）",
        "localUrl": "/sources/matsue-shigikai-r8/kaihabetsumeibo20250425.pdf",
        "originUrl": "https://web.archive.org/web/20250426010046id_/https://www.city.matsue.lg.jp/material/files/group/107/kaihabetsumeibo20250425.pdf",
        "archiveUrl": "https://web.archive.org/web/20250426010046id_/https://www.city.matsue.lg.jp/material/files/group/107/kaihabetsumeibo20250425.pdf"
      },
      "result": {
        "title": "令和８年第１回松江市議会（定例会）議案等一覧表",
        "localUrl": "/sources/matsue-shigikai-r8/r8_3_26giantouitiran.pdf",
        "originUrl": "https://www.city.matsue.lg.jp/material/files/group/108/r8_3_26giantouitiran.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001184423/https://www.city.matsue.lg.jp/material/files/group/108/r8_3_26giantouitiran.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 27,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "誠政松江",
            "counts": {
              "賛成": 11,
              "議長": 1
            },
            "members": [
              {
                "name": "わたなべ良平",
                "stance": "賛成"
              },
              {
                "name": "岩田幸子",
                "stance": "賛成"
              },
              {
                "name": "長谷川浩司",
                "stance": "賛成"
              },
              {
                "name": "佐藤和彦",
                "stance": "賛成"
              },
              {
                "name": "小澤一竜",
                "stance": "賛成"
              },
              {
                "name": "三島明",
                "stance": "賛成"
              },
              {
                "name": "原田守",
                "stance": "賛成"
              },
              {
                "name": "細木明美",
                "stance": "賛成"
              },
              {
                "name": "米田ときこ",
                "stance": "賛成"
              },
              {
                "name": "柳原治",
                "stance": "賛成"
              },
              {
                "name": "野々内誠",
                "stance": "議長"
              },
              {
                "name": "森脇勇人",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "志翔の会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "中村ひかり",
                "stance": "賛成"
              },
              {
                "name": "村松りえ",
                "stance": "賛成"
              },
              {
                "name": "岩本雅之",
                "stance": "賛成"
              },
              {
                "name": "川島光雅",
                "stance": "賛成"
              },
              {
                "name": "石倉徳章",
                "stance": "賛成"
              },
              {
                "name": "石倉茂美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "民主ネットワーク",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "石倉聡之",
                "stance": "賛成"
              },
              {
                "name": "山根宏",
                "stance": "賛成"
              },
              {
                "name": "森本秀歳",
                "stance": "賛成"
              },
              {
                "name": "津森良治",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "吉岡麻美",
                "stance": "賛成"
              },
              {
                "name": "佐々田慎吾",
                "stance": "賛成"
              },
              {
                "name": "海德邦彦",
                "stance": "賛成"
              },
              {
                "name": "太田哲",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党松江市議団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "樋野伸一",
                "stance": "反対"
              },
              {
                "name": "佐野みどり",
                "stance": "反対"
              },
              {
                "name": "たちばなふみ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "会派に属しない議員（舟木一真）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "舟木一真",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "会派に属しない議員（錦織伸行）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "錦織伸行",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回松江市議会（定例会）議員別表決結果",
          "localUrl": "/sources/matsue-shigikai-r8/r8_0326_giinbetuhyouketukekka.pdf",
          "originUrl": "https://www.city.matsue.lg.jp/material/files/group/108/r8_0326_giinbetuhyouketukekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001174951/https://www.city.matsue.lg.jp/material/files/group/108/r8_0326_giinbetuhyouketukekka.pdf"
        }
      }
    }
  ],
  "331007": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "岡山市議会",
      "seats": 46,
      "teisu": 46,
      "asOf": "2025-10-06",
      "asOfLabel": "2025年10月6日",
      "factions": [
        {
          "name": "自由民主党岡山市議会",
          "seats": 23,
          "isIndependent": false
        },
        {
          "name": "公明党岡山市議団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "日本共産党岡山市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "おかやま創政会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "みらいえ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "懐かしい未来",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "おかやま未来プロジェクト",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会岡山市議団",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "甲第4号議案",
        "billName": "令和8年度岡山市一般会計予算について",
        "sessionLabel": "2月定例市議会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 岡山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別一覧（令和7年10月6日現在）",
        "localUrl": "/sources/okayama-shigikai-r8/0000015562.html",
        "originUrl": "https://web.archive.org/web/20251215204755id_/https://www.city.okayama.jp/gikai/0000015562.html",
        "archiveUrl": "https://web.archive.org/web/20251215204755id_/https://www.city.okayama.jp/gikai/0000015562.html"
      },
      "result": {
        "title": "2月定例市議会議決結果（令和8年3月17日議決）",
        "localUrl": "/sources/okayama-shigikai-r8/0000078927.html",
        "originUrl": "https://www.city.okayama.jp/gikai/0000078927.html",
        "archiveUrl": "https://web.archive.org/web/20260305142947/https://www.city.okayama.jp/gikai/0000078927.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 38,
          "反対": 7,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "公明党岡山市議団",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "則武宣弘",
                "stance": "賛成"
              },
              {
                "name": "松田安義",
                "stance": "賛成"
              },
              {
                "name": "福吉智徳",
                "stance": "賛成"
              },
              {
                "name": "林敏宏",
                "stance": "賛成"
              },
              {
                "name": "平元道隆",
                "stance": "賛成"
              },
              {
                "name": "桑田桂子",
                "stance": "賛成"
              },
              {
                "name": "長岡将克",
                "stance": "賛成"
              },
              {
                "name": "早野賢一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党岡山市議団",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "林潤",
                "stance": "反対"
              },
              {
                "name": "田中のぞみ",
                "stance": "反対"
              },
              {
                "name": "東毅",
                "stance": "反対"
              },
              {
                "name": "宿女和子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "自由民主党岡山市議会",
            "counts": {
              "賛成": 22,
              "議長": 1
            },
            "members": [
              {
                "name": "宮武博",
                "stance": "賛成"
              },
              {
                "name": "三木亮治",
                "stance": "賛成"
              },
              {
                "name": "和氣健",
                "stance": "賛成"
              },
              {
                "name": "成本俊一",
                "stance": "賛成"
              },
              {
                "name": "小川信幸",
                "stance": "賛成"
              },
              {
                "name": "藤原哲之",
                "stance": "賛成"
              },
              {
                "name": "森田卓司",
                "stance": "賛成"
              },
              {
                "name": "吉本賢二",
                "stance": "賛成"
              },
              {
                "name": "赤木一雄",
                "stance": "賛成"
              },
              {
                "name": "難波満津留",
                "stance": "賛成"
              },
              {
                "name": "二嶋宣人",
                "stance": "賛成"
              },
              {
                "name": "川本浩一郎",
                "stance": "賛成"
              },
              {
                "name": "山田正幸",
                "stance": "賛成"
              },
              {
                "name": "松田隆之",
                "stance": "賛成"
              },
              {
                "name": "松本好厚",
                "stance": "賛成"
              },
              {
                "name": "柳井弘",
                "stance": "賛成"
              },
              {
                "name": "岡崎隆",
                "stance": "賛成"
              },
              {
                "name": "花岡栄太郎",
                "stance": "賛成"
              },
              {
                "name": "江田厚志",
                "stance": "賛成"
              },
              {
                "name": "大月晴一",
                "stance": "賛成"
              },
              {
                "name": "安東真理",
                "stance": "賛成"
              },
              {
                "name": "髙橋誠一郎",
                "stance": "賛成"
              },
              {
                "name": "田口裕士",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "懐かしい未来",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "森山幸治",
                "stance": "賛成"
              },
              {
                "name": "川上智美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "みらいえ",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "鬼木のぞみ",
                "stance": "反対"
              },
              {
                "name": "土田貴行",
                "stance": "反対"
              },
              {
                "name": "高成壯磨",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "おかやま創政会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "小林寿雄",
                "stance": "賛成"
              },
              {
                "name": "高橋雄大",
                "stance": "賛成"
              },
              {
                "name": "太田栄司",
                "stance": "賛成"
              },
              {
                "name": "柳迫和夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "おかやま未来プロジェクト",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "中島純",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会岡山市議団",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "前島慶太",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案に対する賛否 令和8年（令和8年3月17日議決分）",
          "localUrl": "/sources/okayama-shigikai-r8/0000078068.html",
          "originUrl": "https://www.city.okayama.jp/gikai/0000078068.html",
          "archiveUrl": "https://web.archive.org/web/20260211160108/https://www.city.okayama.jp/gikai/0000078068.html"
        }
      }
    }
  ],
  "332020": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "倉敷市議会",
      "seats": 43,
      "teisu": 43,
      "asOf": "2025-02-18",
      "asOfLabel": "2025年2月18日",
      "factions": [
        {
          "name": "くらしき創生クラブ",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "未来クラブ",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "公明党倉敷市議団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "新風くらしき",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "新政クラブ",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "青空市民クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党倉敷市議会議員団",
          "seats": 3,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第２６号",
        "billName": "令和８年度倉敷市一般会計予算",
        "sessionLabel": "令和８年第３回倉敷市議会（第１回定例会）",
        "decidedDate": "2026-03-18",
        "decidedDateLabel": "令和8年3月18日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 倉敷市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 2025年2月18日）",
        "localUrl": "/sources/kurashiki-shigikai-r8/1008326.html",
        "originUrl": "https://web.archive.org/web/20250811201558id_/https://www.city.kurashiki.okayama.jp/cityinfo/assembly/1008324/1008326.html",
        "archiveUrl": "https://web.archive.org/web/20250811201558id_/https://www.city.kurashiki.okayama.jp/cityinfo/assembly/1008324/1008326.html"
      },
      "result": {
        "title": "令和８年第３回倉敷市議会（第１回定例会）議案一覧",
        "localUrl": "/sources/kurashiki-shigikai-r8/0318giannitiran.pdf",
        "originUrl": "https://www.city.kurashiki.okayama.jp/_res/projects/default_project/_page_/001/023/399/0318giannitiran.pdf",
        "archiveUrl": "https://web.archive.org/web/20261002115156/https://www.city.kurashiki.okayama.jp/_res/projects/default_project/_page_/001/023/399/0318giannitiran.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 39,
          "議長": 1,
          "反対": 3
        },
        "byFaction": [
          {
            "faction": "くらしき創生クラブ",
            "counts": {
              "賛成": 9,
              "議長": 1
            },
            "members": [
              {
                "name": "天野千歌",
                "stance": "賛成"
              },
              {
                "name": "荒木竜二",
                "stance": "議長"
              },
              {
                "name": "伊東裕紀",
                "stance": "賛成"
              },
              {
                "name": "北畠克彦",
                "stance": "賛成"
              },
              {
                "name": "塩田健",
                "stance": "賛成"
              },
              {
                "name": "時尾博幸",
                "stance": "賛成"
              },
              {
                "name": "難波朋裕",
                "stance": "賛成"
              },
              {
                "name": "藤原薫子",
                "stance": "賛成"
              },
              {
                "name": "三村英世",
                "stance": "賛成"
              },
              {
                "name": "守屋弘志",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "未来クラブ",
            "counts": {
              "賛成": 9
            },
            "members": [
              {
                "name": "赤澤幹温",
                "stance": "賛成"
              },
              {
                "name": "大橋賢",
                "stance": "賛成"
              },
              {
                "name": "片山貴光",
                "stance": "賛成"
              },
              {
                "name": "真田意索",
                "stance": "賛成"
              },
              {
                "name": "中西公仁",
                "stance": "賛成"
              },
              {
                "name": "原田龍五",
                "stance": "賛成"
              },
              {
                "name": "矢野周子",
                "stance": "賛成"
              },
              {
                "name": "山畑滝男",
                "stance": "賛成"
              },
              {
                "name": "若林昭雄",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党倉敷市議団",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "池田和夫",
                "stance": "賛成"
              },
              {
                "name": "太田美貴絵",
                "stance": "賛成"
              },
              {
                "name": "生水耕二",
                "stance": "賛成"
              },
              {
                "name": "近藤徹弥",
                "stance": "賛成"
              },
              {
                "name": "中西善之",
                "stance": "賛成"
              },
              {
                "name": "新垣敦子",
                "stance": "賛成"
              },
              {
                "name": "薮田尊典",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新風くらしき",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "芦田泰宏",
                "stance": "賛成"
              },
              {
                "name": "塩津心",
                "stance": "賛成"
              },
              {
                "name": "武則史園",
                "stance": "賛成"
              },
              {
                "name": "中島光浩",
                "stance": "賛成"
              },
              {
                "name": "日向豊",
                "stance": "賛成"
              },
              {
                "name": "平井俊光",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新政クラブ",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "大橋研",
                "stance": "賛成"
              },
              {
                "name": "大守秀行",
                "stance": "賛成"
              },
              {
                "name": "瀧本寛",
                "stance": "賛成"
              },
              {
                "name": "松成康昭",
                "stance": "賛成"
              },
              {
                "name": "山口博隆",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "青空市民クラブ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "小郷ひな子",
                "stance": "賛成"
              },
              {
                "name": "齋藤武次郎",
                "stance": "賛成"
              },
              {
                "name": "藤井昭佐",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党倉敷市議会議員団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "末田正彦",
                "stance": "反対"
              },
              {
                "name": "田口明子",
                "stance": "反対"
              },
              {
                "name": "田辺牧美",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年２月定例会 議員別表決結果一覧表",
          "localUrl": "/sources/kurashiki-shigikai-r8/0318giinnitirann.pdf",
          "originUrl": "https://www.city.kurashiki.okayama.jp/_res/projects/default_project/_page_/001/023/399/0318giinnitirann.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001175138/https://www.city.kurashiki.okayama.jp/_res/projects/default_project/_page_/001/023/399/0318giinnitirann.pdf"
        }
      }
    }
  ],
  "341002": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "広島市議会",
      "seats": 52,
      "asOf": "2026-02-25",
      "asOfLabel": "2026年2月25日",
      "factions": [
        {
          "name": "自由民主党・市民クラブ",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "市民連合・市民の声",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "ひろしま清風会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "広島維新の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新政クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無党派クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "至誠会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "清流クラブ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "鈴蘭会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "新風クラブ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "広島成長フォーラム",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "1",
        "billName": "令和8年度広島市一般会計予算",
        "sessionLabel": "令和8年第2回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 広島市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別一覧（更新日 2026年2月25日）",
        "localUrl": "/sources/hiroshima-shigikai-r8/1010248.html",
        "originUrl": "https://web.archive.org/web/20260329150632id_/https://www.city.hiroshima.lg.jp/gikai/giin-shoukai/1010248.html",
        "archiveUrl": "https://web.archive.org/web/20260329150632id_/https://www.city.hiroshima.lg.jp/gikai/giin-shoukai/1010248.html"
      },
      "result": {
        "title": "令和8年第2回定例会（2月13日～3月26日）",
        "localUrl": "/sources/hiroshima-shigikai-r8/1048719.html",
        "originUrl": "https://www.city.hiroshima.lg.jp/gikai/nittei/1027907/1048719.html",
        "archiveUrl": "https://web.archive.org/web/20260418175802/https://www.city.hiroshima.lg.jp/gikai/nittei/1027907/1048719.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "議長"
        ],
        "tally": {
          "賛成": 51,
          "議長": 1
        },
        "byFaction": [
          {
            "faction": "自由民主党・市民クラブ",
            "counts": {
              "賛成": 13,
              "議長": 1
            },
            "members": [
              {
                "name": "八條範彦",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 8
            },
            "members": []
          },
          {
            "faction": "市民連合・市民の声",
            "counts": {
              "賛成": 7
            },
            "members": []
          },
          {
            "faction": "日本共産党",
            "counts": {
              "賛成": 6
            },
            "members": []
          },
          {
            "faction": "ひろしま清風会",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "広島維新の会",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "新政クラブ",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無党派クラブ",
            "counts": {
              "賛成": 2
            },
            "members": []
          },
          {
            "faction": "至誠会",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "清流クラブ",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "鈴蘭会",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "新風クラブ",
            "counts": {
              "賛成": 1
            },
            "members": []
          },
          {
            "faction": "広島成長フォーラム",
            "counts": {
              "賛成": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "２月定例会の議案と議決結果など（令和８年３月26日議決分）",
          "localUrl": "/sources/hiroshima-shigikai-r8/260326.pdf",
          "originUrl": "https://www.city.hiroshima.lg.jp/_res/projects/default_project/_page_/001/048/719/260326.pdf",
          "archiveUrl": "https://web.archive.org/web/20260518234925/https://www.city.hiroshima.lg.jp/_res/projects/default_project/_page_/001/048/719/260326.pdf"
        }
      }
    }
  ],
  "401005": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "北九州市議会",
      "seats": 57,
      "asOf": "2026-02-02",
      "asOfLabel": "2026年2月2日",
      "factions": [
        {
          "name": "自民党・無所属の会",
          "seats": 16,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "市民とともに北九州",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "北九州会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "緑の風",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "変革と成長",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "1",
        "billName": "令和８年度北九州市一般会計予算",
        "sessionLabel": "令和８年２月定例会",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 北九州市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿 会派別（更新日 2026年2月2日）",
        "localUrl": "/sources/kitakyushu-gikai-r8/file_0056.html",
        "originUrl": "https://web.archive.org/web/20260213010153id_/https://www.city.kitakyushu.lg.jp/sigikai/file_0056.html",
        "archiveUrl": "https://web.archive.org/web/20260213010153id_/https://www.city.kitakyushu.lg.jp/sigikai/file_0056.html"
      },
      "result": {
        "title": "会議結果一覧（令和8年2月定例会）",
        "localUrl": "/sources/kitakyushu-gikai-r8/001198333.pdf",
        "originUrl": "https://www.city.kitakyushu.lg.jp/files/001198333.pdf",
        "archiveUrl": "https://web.archive.org/web/20260517132736/https://www.city.kitakyushu.lg.jp/files/001198333.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 46,
          "議長": 1,
          "反対": 10
        },
        "byFaction": [
          {
            "faction": "自民党・無所属の会",
            "counts": {
              "賛成": 15,
              "議長": 1
            },
            "members": [
              {
                "name": "中村義雄",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 13
            },
            "members": []
          },
          {
            "faction": "市民とともに北九州",
            "counts": {
              "賛成": 10
            },
            "members": []
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 7
            },
            "members": []
          },
          {
            "faction": "北九州会",
            "counts": {
              "賛成": 5
            },
            "members": []
          },
          {
            "faction": "緑の風",
            "counts": {
              "反対": 3
            },
            "members": []
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 2
            },
            "members": []
          },
          {
            "faction": "変革と成長",
            "counts": {
              "賛成": 1
            },
            "members": []
          }
        ],
        "source": {
          "title": "令和８年２月定例会 会議結果（各会派の賛否状況）",
          "localUrl": "/sources/kitakyushu-gikai-r8/001198333.pdf",
          "originUrl": "https://www.city.kitakyushu.lg.jp/files/001198333.pdf",
          "archiveUrl": "https://web.archive.org/web/20260517132736/https://www.city.kitakyushu.lg.jp/files/001198333.pdf"
        }
      }
    }
  ],
  "401307": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "福岡市議会",
      "seats": 60,
      "teisu": 62,
      "asOf": "2026-03-27",
      "asOfLabel": "2026年3月27日",
      "factions": [
        {
          "name": "自由民主党福岡市議団",
          "seats": 18,
          "isIndependent": false
        },
        {
          "name": "公明党福岡市議団",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "福岡市民クラブ",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "日本共産党福岡市議団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "新しい風ふくおか",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本維新の会福岡市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "自民党新福岡",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（あべひでき）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（新開ゆうじ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（木村てつあき）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（森あやこ）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（川口浩）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "27",
        "billName": "令和８年度福岡市一般会計予算案",
        "sessionLabel": "令和８年第１回福岡市議会（定例会）",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 福岡市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員一覧（令和８年２月20日時点、令和８年３月27日時点）",
        "localUrl": "/sources/fukuoka-shigikai-r8/ichiran_R80327.pdf",
        "originUrl": "https://gikai.city.fukuoka.lg.jp/wp-content/uploads/2026/04/ichiran_R80327.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001154956/https://gikai.city.fukuoka.lg.jp/wp-content/uploads/2026/04/ichiran_R80327.pdf"
      },
      "result": {
        "title": "令和８年第１回福岡市議会（定例会） 議案の議決結果",
        "localUrl": "/sources/fukuoka-shigikai-r8/r8_gikai1.html",
        "originUrl": "https://gikai.city.fukuoka.lg.jp/result/r8_gikai1",
        "archiveUrl": "https://web.archive.org/web/20261001155144/https://gikai.city.fukuoka.lg.jp/result/r8_gikai1"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "faction",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 43,
          "議長": 1,
          "反対": 16
        },
        "byFaction": [
          {
            "faction": "自由民主党福岡市議団",
            "counts": {
              "賛成": 17,
              "議長": 1
            },
            "members": [
              {
                "name": "平畑雅博",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "公明党福岡市議団",
            "counts": {
              "賛成": 12
            },
            "members": []
          },
          {
            "faction": "福岡市民クラブ",
            "counts": {
              "反対": 11
            },
            "members": []
          },
          {
            "faction": "日本共産党福岡市議団",
            "counts": {
              "反対": 4
            },
            "members": []
          },
          {
            "faction": "新しい風ふくおか",
            "counts": {
              "賛成": 4
            },
            "members": []
          },
          {
            "faction": "日本維新の会福岡市議団",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "自民党新福岡",
            "counts": {
              "賛成": 3
            },
            "members": []
          },
          {
            "faction": "無所属（あべひでき）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "あべひでき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（新開ゆうじ）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "新開ゆうじ",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（木村てつあき）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "木村てつあき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（森あやこ）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "森あやこ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（川口浩）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "川口浩",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年第１回福岡市議会（定例会） 議案の議決結果（会派ごとの賛否）",
          "localUrl": "/sources/fukuoka-shigikai-r8/r8_gikai1.html",
          "originUrl": "https://gikai.city.fukuoka.lg.jp/result/r8_gikai1",
          "archiveUrl": "https://web.archive.org/web/20261001155144/https://gikai.city.fukuoka.lg.jp/result/r8_gikai1"
        }
      }
    }
  ],
  "402036": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "久留米市議会",
      "seats": 35,
      "asOf": "2026-06-26",
      "asOfLabel": "2026年6月26日",
      "factions": [
        {
          "name": "きずな議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "久留米たすき議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "立志会議員団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "みらい久留米議員団",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "緑水会議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党久留米市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "改革の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第45号議案",
        "billName": "令和８年度久留米市一般会計予算",
        "sessionLabel": "令和8年第2回市議会定例会",
        "decidedDate": "2026-06-26",
        "decidedDateLabel": "令和8年6月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 久留米市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和8年第2回市議会定例会（6月）における議案に対する賛否の状況（会派・団体名と議員名の列見出し）",
        "localUrl": "/sources/kurume-shigikai-r8/R8.6sanpi.pdf",
        "originUrl": "https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182906/https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf"
      },
      "result": {
        "title": "令和8年第2回市議会定例会（6月）における議案に対する賛否の状況",
        "localUrl": "/sources/kurume-shigikai-r8/R8.6sanpi.pdf",
        "originUrl": "https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001182906/https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 30,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "きずな議員団",
            "counts": {
              "賛成": 5,
              "議長": 1
            },
            "members": [
              {
                "name": "吉冨巧",
                "stance": "賛成"
              },
              {
                "name": "田住和也",
                "stance": "賛成"
              },
              {
                "name": "堀田洸太朗",
                "stance": "賛成"
              },
              {
                "name": "石井秀夫",
                "stance": "議長"
              },
              {
                "name": "山田貴生",
                "stance": "賛成"
              },
              {
                "name": "古賀としかず",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "久留米たすき議員団",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "そうだ耕一郎",
                "stance": "賛成"
              },
              {
                "name": "中村博俊",
                "stance": "賛成"
              },
              {
                "name": "山﨑ケブン",
                "stance": "賛成"
              },
              {
                "name": "甲斐田義弘",
                "stance": "賛成"
              },
              {
                "name": "石井俊一",
                "stance": "賛成"
              },
              {
                "name": "松岡保治",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党議員団",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "山下尚",
                "stance": "賛成"
              },
              {
                "name": "田中貴子",
                "stance": "賛成"
              },
              {
                "name": "生野薫",
                "stance": "賛成"
              },
              {
                "name": "田中功一",
                "stance": "賛成"
              },
              {
                "name": "塚本弘道",
                "stance": "賛成"
              },
              {
                "name": "坂田光弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立志会議員団",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "永田一伸",
                "stance": "賛成"
              },
              {
                "name": "堺太一郎",
                "stance": "賛成"
              },
              {
                "name": "長野哲",
                "stance": "賛成"
              },
              {
                "name": "後藤敬介",
                "stance": "賛成"
              },
              {
                "name": "権藤智喜",
                "stance": "賛成"
              },
              {
                "name": "轟照隆",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "みらい久留米議員団",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "秋永峰子",
                "stance": "賛成"
              },
              {
                "name": "古賀敏久",
                "stance": "賛成"
              },
              {
                "name": "藤林詠子",
                "stance": "賛成"
              },
              {
                "name": "石田眞一郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "緑水会議員団",
            "counts": {
              "反対": 2,
              "賛成": 1
            },
            "members": [
              {
                "name": "佐藤晶二",
                "stance": "反対"
              },
              {
                "name": "吉武憲治",
                "stance": "賛成"
              },
              {
                "name": "森﨑巨樹",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党久留米市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "金子むつみ",
                "stance": "反対"
              },
              {
                "name": "小林ときこ",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "改革の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "大熊博文",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "草場公晴",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第2回市議会定例会（6月）における議案に対する賛否の状況",
          "localUrl": "/sources/kurume-shigikai-r8/R8.6sanpi.pdf",
          "originUrl": "https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001182906/https://www.city.kurume.fukuoka.jp/1100keikaku/2040shigikai/3030hongikai/4010giankekka/files/R8.6sanpi.pdf"
        }
      }
    }
  ],
  "422011": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "長崎市議会",
      "seats": 39,
      "asOf": "2025-06-04",
      "asOfLabel": "2025年6月4日",
      "factions": [
        {
          "name": "市民クラブ",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "自民創生",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "新政ミライ",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "ながさき次世代の党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "明政クラブ",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第13号議案",
        "billName": "令和8年度長崎市一般会計予算",
        "sessionLabel": "令和8年第2回（2月）定例会",
        "decidedDate": "2026-03-12",
        "decidedDateLabel": "令和8年3月12日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 長崎市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（更新日 2025年6月4日）",
        "localUrl": "/sources/nagasaki-shigikai-r8/5681.html",
        "originUrl": "https://www.city.nagasaki.lg.jp/site/gikai/5681.html",
        "archiveUrl": "https://web.archive.org/web/20260612083032/https://www.city.nagasaki.lg.jp/site/gikai/5681.html"
      },
      "result": {
        "title": "令和8年第2回（2月）定例会議決結果一覧",
        "localUrl": "/sources/nagasaki-shigikai-r8/75929.html",
        "originUrl": "https://www.city.nagasaki.lg.jp/site/gikai/75929.html",
        "archiveUrl": "https://web.archive.org/web/20260413075255/https://www.city.nagasaki.lg.jp/site/gikai/75929.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "422029": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "佐世保市議会",
      "seats": 31,
      "asOf": "2025-12-03",
      "asOfLabel": "2025年12月3日",
      "factions": [
        {
          "name": "自民党市民会議",
          "seats": 15,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "市政会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "若者議員を増やす会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "葉風会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第１８号議案",
        "billName": "令和８年度佐世保市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 佐世保市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（更新日 2025年12月3日）",
        "localUrl": "/sources/sasebo-shigikai-r8/kaihalist.html",
        "originUrl": "https://www.city.sasebo.lg.jp/gikai/gikai/ginshokai/kaihalist.html",
        "archiveUrl": "https://web.archive.org/web/20260927033730/https://www.city.sasebo.lg.jp/gikai/gikai/ginshokai/kaihalist.html"
      },
      "result": {
        "title": "令和8年3月定例会 審議結果",
        "localUrl": "/sources/sasebo-shigikai-r8/r8nen3gatukagikekka.pdf",
        "originUrl": "https://www.city.sasebo.lg.jp/documents/13185/r8nen3gatukagikekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001183542/https://www.city.sasebo.lg.jp/documents/13185/r8nen3gatukagikekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "431001": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "熊本市議会",
      "seats": 47,
      "asOf": "2026-01-07",
      "asOfLabel": "2026年1月7日",
      "factions": [
        {
          "name": "自由民主党熊本市議団",
          "seats": 14,
          "isIndependent": false
        },
        {
          "name": "熊本自由民主党市議団",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党熊本市議団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "市民連合",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "市民の会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党熊本市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "新風熊本市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "創生熊本市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（瀨尾誠一）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（山中惣一郎）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（筑紫るみ子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議第３号",
        "billName": "令和８年度熊本市一般会計予算",
        "sessionLabel": "第１回定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 熊本市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "選出区別議員名簿（令和8年（2026年）1月7日現在）",
        "localUrl": "/sources/kumamoto-shigikai-r8/UploadFileDsp.aspx_c_id_53_id_125_set_doc_1.pdf",
        "originUrl": "https://web.archive.org/web/20260421205002id_/https://kumamoto-shigikai.jp/common/UploadFileDsp.aspx?c_id=53&id=125&set_doc=1",
        "archiveUrl": "https://web.archive.org/web/20260421205002id_/https://kumamoto-shigikai.jp/common/UploadFileDsp.aspx?c_id=53&id=125&set_doc=1"
      },
      "result": {
        "title": "令和8年第1回定例会 議案および審議結果（議第３号 賛否一覧）",
        "localUrl": "/sources/kumamoto-shigikai-r8/detail.aspx_c_id_4_coy_id_16_co_id_207_dis_id_3.html",
        "originUrl": "https://kumamoto-shigikai.jp/agenda/pub/detail.aspx?c_id=4&coy_id=16&co_id=207&dis_id=3",
        "archiveUrl": "https://web.archive.org/web/20261001194138/https://kumamoto-shigikai.jp/agenda/pub/detail.aspx?c_id=4&coy_id=16&co_id=207&dis_id=3"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "賛成": 41,
          "議長": 1,
          "反対": 5
        },
        "byFaction": [
          {
            "faction": "自由民主党熊本市議団",
            "counts": {
              "賛成": 13,
              "議長": 1
            },
            "members": [
              {
                "name": "村上麿",
                "stance": "賛成"
              },
              {
                "name": "村上誠也",
                "stance": "賛成"
              },
              {
                "name": "古川智子",
                "stance": "賛成"
              },
              {
                "name": "荒川慎太郎",
                "stance": "賛成"
              },
              {
                "name": "齊藤博",
                "stance": "賛成"
              },
              {
                "name": "田島幸治",
                "stance": "賛成"
              },
              {
                "name": "日隈忍",
                "stance": "賛成"
              },
              {
                "name": "小佐井賀瑞宜",
                "stance": "賛成"
              },
              {
                "name": "寺本義勝",
                "stance": "賛成"
              },
              {
                "name": "田中敦朗",
                "stance": "賛成"
              },
              {
                "name": "田中誠一",
                "stance": "賛成"
              },
              {
                "name": "坂田誠二",
                "stance": "賛成"
              },
              {
                "name": "落水清弘",
                "stance": "賛成"
              },
              {
                "name": "大石浩文",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "熊本自由民主党市議団",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "松本幸隆",
                "stance": "賛成"
              },
              {
                "name": "中川栄一郎",
                "stance": "賛成"
              },
              {
                "name": "山本浩之",
                "stance": "賛成"
              },
              {
                "name": "北川哉",
                "stance": "賛成"
              },
              {
                "name": "平江透",
                "stance": "賛成"
              },
              {
                "name": "大嶌澄雄",
                "stance": "賛成"
              },
              {
                "name": "澤田昌作",
                "stance": "賛成"
              },
              {
                "name": "満永寿博",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党熊本市議団",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "井本正広",
                "stance": "賛成"
              },
              {
                "name": "木庭功二",
                "stance": "賛成"
              },
              {
                "name": "吉田健一",
                "stance": "賛成"
              },
              {
                "name": "伊藤和仁",
                "stance": "賛成"
              },
              {
                "name": "高瀬千鶴子",
                "stance": "賛成"
              },
              {
                "name": "三森至加",
                "stance": "賛成"
              },
              {
                "name": "浜田大介",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民連合",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "島津哲也",
                "stance": "賛成"
              },
              {
                "name": "山内勝志",
                "stance": "賛成"
              },
              {
                "name": "西岡誠也",
                "stance": "賛成"
              },
              {
                "name": "田上辰也",
                "stance": "賛成"
              },
              {
                "name": "上田芳裕",
                "stance": "賛成"
              },
              {
                "name": "村上博",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民の会",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "菊地渚沙",
                "stance": "反対"
              },
              {
                "name": "井坂隆寛",
                "stance": "反対"
              },
              {
                "name": "吉村健治",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "日本共産党熊本市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "井芹栄次",
                "stance": "反対"
              },
              {
                "name": "上野美恵子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "新風熊本市議団",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "紫垣正仁",
                "stance": "賛成"
              },
              {
                "name": "藤山英美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "創生熊本市議団",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "松川善範",
                "stance": "賛成"
              },
              {
                "name": "髙本一臣",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（瀨尾誠一）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "瀨尾誠一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（山中惣一郎）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "山中惣一郎",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（筑紫るみ子）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "筑紫るみ子",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会 議第３号 賛否一覧",
          "localUrl": "/sources/kumamoto-shigikai-r8/detail.aspx_c_id_4_coy_id_16_co_id_207_dis_id_3.html",
          "originUrl": "https://kumamoto-shigikai.jp/agenda/pub/detail.aspx?c_id=4&coy_id=16&co_id=207&dis_id=3",
          "archiveUrl": "https://web.archive.org/web/20261001194138/https://kumamoto-shigikai.jp/agenda/pub/detail.aspx?c_id=4&coy_id=16&co_id=207&dis_id=3"
        }
      }
    }
  ],
  "442011": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "大分市議会",
      "seats": 43,
      "asOf": "2026-03-26",
      "asOfLabel": "2026年3月26日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "ネットワークみらい",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "新市民クラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "地域政党おおいた。",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "Ｏｉｔａ市民クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（高松大樹）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議第１号",
        "billName": "令和８年度大分市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決（多数）"
      },
      "sourceTitle": "令和8年度 大分市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "令和８年第１回定例会 議決結果賛否一覧表（会派・議員名〔議席番号順〕の列見出し）",
        "localUrl": "/sources/oita-shigikai-r8/giketukekka.pdf",
        "originUrl": "https://www.city.oita.oita.jp/o186/shigikai/kaiginokekka/documents/giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001191445/https://www.city.oita.oita.jp/o186/shigikai/kaiginokekka/documents/giketukekka.pdf"
      },
      "result": {
        "title": "令和８年第１回定例会 議決結果賛否一覧表",
        "localUrl": "/sources/oita-shigikai-r8/giketukekka.pdf",
        "originUrl": "https://www.city.oita.oita.jp/o186/shigikai/kaiginokekka/documents/giketukekka.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001191445/https://www.city.oita.oita.jp/o186/shigikai/kaiginokekka/documents/giketukekka.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "011002": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "札幌市議会",
      "seats": 67,
      "asOf": "2025-09-29",
      "asOfLabel": "2025年9月29日",
      "factions": [
        {
          "name": "札幌市議会自由民主党議員会",
          "seats": 25,
          "isIndependent": false
        },
        {
          "name": "札幌市議会民主市民連合議員会",
          "seats": 17,
          "isIndependent": false
        },
        {
          "name": "札幌市議会公明党議員会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "日本共産党札幌市議会議員団",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "坂元倫孝・荒井勇雄",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "山口かずさ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "未来さっぽろ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "健康さっぽろ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "大地さっぽろ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "札幌市議会市民ネットワーク北海道",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第１号",
        "billName": "令和８年度札幌市一般会計予算",
        "sessionLabel": "令和８年第１回札幌市議会定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 札幌市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（更新日 2025年9月29日）",
        "localUrl": "/sources/sapporo-shigikai-r8/meibo-kaiha.html",
        "originUrl": "https://web.archive.org/web/20260117133407id_/https://www.city.sapporo.jp/gikai/meibo/meibo-kaiha.html",
        "archiveUrl": "https://web.archive.org/web/20260117133407id_/https://www.city.sapporo.jp/gikai/meibo/meibo-kaiha.html"
      },
      "result": {
        "title": "令和8年第1回札幌市議会定例会 議決事件等一覧表",
        "localUrl": "/sources/sapporo-shigikai-r8/08_kekka1t.pdf",
        "originUrl": "https://www.city.sapporo.jp/gikai/html/documents/08_kekka1t.pdf",
        "archiveUrl": "https://web.archive.org/web/20260614192541/https://www.city.sapporo.jp/gikai/html/documents/08_kekka1t.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "041009": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "仙台市議会",
      "seats": 55,
      "teisu": 55,
      "asOf": "2025-08-27",
      "asOfLabel": "2025年8月27日",
      "factions": [
        {
          "name": "自由民主党",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "公明党仙台市議団",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "市民フォーラム仙台",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "日本共産党仙台市議団",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "せんだい自民・参政の会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "立憲民主党仙台",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "仙台維新",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "維新の会仙台市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "心豊かな社会をつくる会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "市民の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "自由民主党フォーラム",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "第十四号議案",
        "billName": "令和八年度仙台市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-12",
        "decidedDateLabel": "令和8年3月12日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 仙台市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（令和7年8月27日現在）",
        "localUrl": "/sources/sendai-shigikai-r8/index.html",
        "originUrl": "https://web.archive.org/web/20260201093434id_/https://www.gikai.city.sendai.jp/list/parties/index.html",
        "archiveUrl": "https://web.archive.org/web/20260201093434id_/https://www.gikai.city.sendai.jp/list/parties/index.html"
      },
      "result": {
        "title": "仙台市議会会議録 令和8年第1回定例会（第7日目）本文",
        "localUrl": "/sources/sendai-shigikai-r8/5286956_Template_view_VoiceType_all_DocumentID_3681.html",
        "originUrl": "https://www.city.sendai.miyagi.dbsr.jp/index.php/5286956?Template=view&VoiceType=all&DocumentID=3681",
        "archiveUrl": "https://web.archive.org/web/20261001155601/https://www.city.sendai.miyagi.dbsr.jp/index.php/5286956?Template=view&VoiceType=all&DocumentID=3681"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "012041": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "旭川市議会",
      "seats": 34,
      "teisu": 34,
      "asOf": "2025-10-23",
      "asOfLabel": "2025年10月23日",
      "factions": [
        {
          "name": "自民党・市民会議",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "民主・市民連合",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "旭川市民連合",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "無所属（安田佳正）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（横山啓一）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第14号",
        "billName": "令和8年度旭川市一般会計予算について",
        "sessionLabel": "令和8年第1回定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 旭川市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派等別名簿（最終更新日 2025年10月23日）",
        "localUrl": "/sources/asahikawa-shigikai-r8/d066336.html",
        "originUrl": "https://web.archive.org/web/20260116223223id_/https://www.city.asahikawa.hokkaido.jp/council/6100/6120/d066336.html",
        "archiveUrl": "https://web.archive.org/web/20260116223223id_/https://www.city.asahikawa.hokkaido.jp/council/6100/6120/d066336.html"
      },
      "result": {
        "title": "令和8年第1回定例会議決結果",
        "localUrl": "/sources/asahikawa-shigikai-r8/d083645.html",
        "originUrl": "https://www.city.asahikawa.hokkaido.jp/council/6400/6410/d083645.html",
        "archiveUrl": "https://web.archive.org/web/20261001165542/https://www.city.asahikawa.hokkaido.jp/council/6400/6410/d083645.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 28,
          "欠席": 1,
          "議長": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "自民党・市民会議",
            "counts": {
              "賛成": 11,
              "欠席": 1,
              "議長": 1
            },
            "members": [
              {
                "name": "いしかわまさき",
                "stance": "賛成"
              },
              {
                "name": "笠井まなみ",
                "stance": "賛成"
              },
              {
                "name": "あべなお",
                "stance": "賛成"
              },
              {
                "name": "たけいしよういち",
                "stance": "賛成"
              },
              {
                "name": "石川まさゆき",
                "stance": "賛成"
              },
              {
                "name": "沼﨑雅之",
                "stance": "賛成"
              },
              {
                "name": "えびな安信",
                "stance": "賛成"
              },
              {
                "name": "高橋ひでとし",
                "stance": "賛成"
              },
              {
                "name": "菅原範明",
                "stance": "賛成"
              },
              {
                "name": "佐藤さだお",
                "stance": "欠席"
              },
              {
                "name": "松田卓也",
                "stance": "賛成"
              },
              {
                "name": "福居秀雄",
                "stance": "議長"
              },
              {
                "name": "杉山允孝",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "民主・市民連合",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "江川あや",
                "stance": "賛成"
              },
              {
                "name": "上野和幸",
                "stance": "賛成"
              },
              {
                "name": "髙橋紀博",
                "stance": "賛成"
              },
              {
                "name": "品田ときえ",
                "stance": "賛成"
              },
              {
                "name": "高見一典",
                "stance": "賛成"
              },
              {
                "name": "金谷美奈子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 5
            },
            "members": [
              {
                "name": "駒木おさみ",
                "stance": "賛成"
              },
              {
                "name": "皆川ゆきたけ",
                "stance": "賛成"
              },
              {
                "name": "中野ひろゆき",
                "stance": "賛成"
              },
              {
                "name": "高花えいこ",
                "stance": "賛成"
              },
              {
                "name": "中村のりゆき",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党",
            "counts": {
              "反対": 4
            },
            "members": [
              {
                "name": "中村みなこ",
                "stance": "反対"
              },
              {
                "name": "まじま隆英",
                "stance": "反対"
              },
              {
                "name": "石川厚子",
                "stance": "反対"
              },
              {
                "name": "能登谷繁",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "旭川市民連合",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "植木だいすけ",
                "stance": "賛成"
              },
              {
                "name": "小林ゆうき",
                "stance": "賛成"
              },
              {
                "name": "塩尻英明",
                "stance": "賛成"
              },
              {
                "name": "高木ひろたか",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（安田佳正）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "安田佳正",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（横山啓一）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "横山啓一",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年第1回定例会賛否/議案第14号",
          "localUrl": "/sources/asahikawa-shigikai-r8/d083728.html",
          "originUrl": "https://www.city.asahikawa.hokkaido.jp/council/6400/6410/d083728.html",
          "archiveUrl": "https://web.archive.org/web/20261001165948/https://www.city.asahikawa.hokkaido.jp/council/6400/6410/d083728.html"
        }
      }
    }
  ],
  "022012": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "青森市議会",
      "seats": 32,
      "teisu": 32,
      "asOf": "2025-01-27",
      "asOfLabel": "2025年1月27日",
      "factions": [
        {
          "name": "自民クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "創青会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "立憲民主・社民",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（山田千里）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（相馬純子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（中村美津緒）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（奈良岡隆）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和８年度青森市一般会計予算",
        "sessionLabel": "令和８年第１回定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 青森市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "議員名簿（会派別）（更新日 2025年1月27日）",
        "localUrl": "/sources/aomori-shigikai-r8/1007118.html",
        "originUrl": "https://web.archive.org/web/20251108061843id_/https://www.city.aomori.aomori.jp/gikai/gaiyou/1007116/1007118.html",
        "archiveUrl": "https://web.archive.org/web/20251108061843id_/https://www.city.aomori.aomori.jp/gikai/gaiyou/1007116/1007118.html"
      },
      "result": {
        "title": "令和８年第１回定例会 議案等審議結果一覧",
        "localUrl": "/sources/aomori-shigikai-r8/r08-t1-giketsu2.pdf",
        "originUrl": "https://www.city.aomori.aomori.jp/_res/projects/default_project/_page_/001/010/095/r08-t1-giketsu2.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001170252/https://www.city.aomori.aomori.jp/_res/projects/default_project/_page_/001/010/095/r08-t1-giketsu2.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "022039": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "八戸市議会",
      "seats": 28,
      "teisu": 28,
      "asOf": "2023-05-10",
      "asOfLabel": "2023年5月10日",
      "factions": [
        {
          "name": "自民クラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "きずなクラブ",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "自由民主・無所属クラブ",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "新緑・無所属の会",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属（苫米地あつ子）",
          "seats": 1,
          "isIndependent": true
        },
        {
          "name": "無所属（前田由美）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第２号",
        "billName": "令和８年度八戸市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-23",
        "decidedDateLabel": "令和8年3月23日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 八戸市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派一覧（更新日 2023年05月10日）",
        "localUrl": "/sources/hachinohe-shigikai-r8/9032.html",
        "originUrl": "https://web.archive.org/web/20260216175742id_/https://www.city.hachinohe.aomori.jp/gyoseijoho/hachinoheshigikai/giinnoshokai/9032.html",
        "archiveUrl": "https://web.archive.org/web/20260216175742id_/https://www.city.hachinohe.aomori.jp/gyoseijoho/hachinoheshigikai/giinnoshokai/9032.html"
      },
      "result": {
        "title": "令和8年3月定例会 議案審査結果表",
        "localUrl": "/sources/hachinohe-shigikai-r8/R0803_giannsinnsakekkahyou.pdf",
        "originUrl": "https://www.city.hachinohe.aomori.jp/material/files/group/80/R0803_giannsinnsakekkahyou.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001170443/https://www.city.hachinohe.aomori.jp/material/files/group/80/R0803_giannsinnsakekkahyou.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 25,
          "議長": 1,
          "欠席": 1,
          "反対": 1
        },
        "byFaction": [
          {
            "faction": "自民クラブ",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "長谷川ひろゆき",
                "stance": "賛成"
              },
              {
                "name": "岡田英",
                "stance": "賛成"
              },
              {
                "name": "日當正男",
                "stance": "賛成"
              },
              {
                "name": "小屋敷孝",
                "stance": "賛成"
              },
              {
                "name": "壬生八十博",
                "stance": "賛成"
              },
              {
                "name": "藤川優里",
                "stance": "議長"
              },
              {
                "name": "立花敬之",
                "stance": "賛成"
              },
              {
                "name": "坂本美洋",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "きずなクラブ",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "吉田洸龍",
                "stance": "賛成"
              },
              {
                "name": "田名部裕美",
                "stance": "賛成"
              },
              {
                "name": "三浦博司",
                "stance": "賛成"
              },
              {
                "name": "石橋充志",
                "stance": "賛成"
              },
              {
                "name": "山名文世",
                "stance": "賛成"
              },
              {
                "name": "五戸定博",
                "stance": "賛成"
              },
              {
                "name": "寺地則行",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主・無所属クラブ",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "山之内悠",
                "stance": "賛成"
              },
              {
                "name": "間盛仁",
                "stance": "賛成"
              },
              {
                "name": "久保百恵",
                "stance": "賛成"
              },
              {
                "name": "上条幸哉",
                "stance": "賛成"
              },
              {
                "name": "森園秀一",
                "stance": "賛成"
              },
              {
                "name": "豊田美好",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 2,
              "欠席": 1
            },
            "members": [
              {
                "name": "土嶺直樹",
                "stance": "賛成"
              },
              {
                "name": "高橋正人",
                "stance": "欠席"
              },
              {
                "name": "中村益則",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新緑・無所属の会",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "伊藤圓子",
                "stance": "賛成"
              },
              {
                "name": "吉田淳一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属（苫米地あつ子）",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "苫米地あつ子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "無所属（前田由美）",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "前田由美",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "令和８年３月定例会 議員別議案等賛否一覧表",
          "localUrl": "/sources/hachinohe-shigikai-r8/R0803_ggiinnbetusannpiitirann.pdf",
          "originUrl": "https://www.city.hachinohe.aomori.jp/material/files/group/80/R0803_ggiinnbetusannpiitirann.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001170518/https://www.city.hachinohe.aomori.jp/material/files/group/80/R0803_ggiinnbetusannpiitirann.pdf"
        }
      }
    }
  ],
  "062014": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "山形市議会",
      "seats": 33,
      "asOf": "2025-04-16",
      "asOfLabel": "2025年4月16日",
      "factions": [
        {
          "name": "新翔会",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "緑政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "未来やまがた",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "山形市議会公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "令政会",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "会派に属さない議員",
          "seats": 4,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議第8号",
        "billName": "令和8年度山形市一般会計予算",
        "sessionLabel": "令和8年3月市議会定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案のとおり可決"
      },
      "sourceTitle": "令和8年度 山形市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派（更新日 令和7年4月16日）",
        "localUrl": "/sources/yamagata-shigikai-r8/1001203.html",
        "originUrl": "https://web.archive.org/web/20260315083000id_/https://www.city.yamagata-yamagata.lg.jp/gikai/giin/1001203.html",
        "archiveUrl": "https://web.archive.org/web/20260315083000id_/https://www.city.yamagata-yamagata.lg.jp/gikai/giin/1001203.html"
      },
      "result": {
        "title": "議決議案一覧（令和8年3月定例会）",
        "localUrl": "/sources/yamagata-shigikai-r8/1018030.html",
        "originUrl": "https://www.city.yamagata-yamagata.lg.jp/gikai/kaigikekka/1001699/1018028/1018030.html",
        "archiveUrl": "https://web.archive.org/web/20260521042741/https://www.city.yamagata-yamagata.lg.jp/gikai/kaigikekka/1001699/1018028/1018030.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "072010": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "福島市議会",
      "seats": 35,
      "asOf": "2026-03-27",
      "asOfLabel": "2026年3月27日",
      "factions": [
        {
          "name": "真政会",
          "seats": 12,
          "isIndependent": false
        },
        {
          "name": "真結の会",
          "seats": 10,
          "isIndependent": false
        },
        {
          "name": "市民21",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "無所属（三浦由美子）",
          "seats": 1,
          "isIndependent": true
        }
      ],
      "resolution": {
        "billNo": "議案第5号",
        "billName": "令和8年度福島市一般会計予算",
        "sessionLabel": "令和8年3月定例会議",
        "decidedDate": "2026-03-27",
        "decidedDateLabel": "令和8年3月27日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 福島市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "ふくしま市議会だより VOL.230 p.9 電子採決システムによる採決結果（令和8年3月定例会議）",
        "localUrl": "/sources/fukushima-shigikai-r8/vol230.pdf",
        "originUrl": "https://www.city.fukushima.fukushima.jp/material/files/group/72/vol230.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001183747/https://www.city.fukushima.fukushima.jp/material/files/group/72/vol230.pdf"
      },
      "result": {
        "title": "議案の審議結果-令和8年3月定例会議-",
        "localUrl": "/sources/fukushima-shigikai-r8/3751.html",
        "originUrl": "https://www.city.fukushima.fukushima.jp/gikai/gian/2/3751.html",
        "archiveUrl": "https://web.archive.org/web/20260521163141/https://www.city.fukushima.fukushima.jp/gikai/gian/2/3751.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "072036": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "郡山市議会",
      "seats": 38,
      "asOf": "2025-09-09",
      "asOfLabel": "2025年9月9日",
      "factions": [
        {
          "name": "志翔会",
          "seats": 11,
          "isIndependent": false
        },
        {
          "name": "新政会",
          "seats": 9,
          "isIndependent": false
        },
        {
          "name": "郡山市議会公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "緑風会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "自由民主党郡山市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党郡山市議団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "立憲民主党郡山",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "無所属の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "立憲民主党",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第39号",
        "billName": "令和８年度郡山市一般会計予算",
        "sessionLabel": "令和８年３月定例会",
        "decidedDate": "2026-03-19",
        "decidedDateLabel": "令和8年3月19日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 郡山市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別議員名簿（更新日 2025年9月9日）",
        "localUrl": "/sources/koriyama-shigikai-r8/2655.html",
        "originUrl": "https://web.archive.org/web/20260208073645id_/https://www.city.koriyama.lg.jp/site/gikai/2655.html",
        "archiveUrl": "https://web.archive.org/web/20260208073645id_/https://www.city.koriyama.lg.jp/site/gikai/2655.html"
      },
      "result": {
        "title": "令和８年３月定例会（３月19日）議決結果",
        "localUrl": "/sources/koriyama-shigikai-r8/118874.pdf",
        "originUrl": "https://www.city.koriyama.lg.jp/uploaded/attachment/118874.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001171046/https://www.city.koriyama.lg.jp/uploaded/attachment/118874.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "議長": 1,
          "賛成": 32,
          "欠席": 1,
          "反対": 4
        },
        "byFaction": [
          {
            "faction": "志翔会",
            "counts": {
              "議長": 1,
              "賛成": 10
            },
            "members": [
              {
                "name": "近内利男",
                "stance": "議長"
              },
              {
                "name": "本田豊栄",
                "stance": "賛成"
              },
              {
                "name": "大河原裕勝",
                "stance": "賛成"
              },
              {
                "name": "薄井長広",
                "stance": "賛成"
              },
              {
                "name": "伊藤典夫",
                "stance": "賛成"
              },
              {
                "name": "加藤漢太",
                "stance": "賛成"
              },
              {
                "name": "森合秀行",
                "stance": "賛成"
              },
              {
                "name": "塩田義智",
                "stance": "賛成"
              },
              {
                "name": "久野三男",
                "stance": "賛成"
              },
              {
                "name": "佐藤政喜",
                "stance": "賛成"
              },
              {
                "name": "大城宏之",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "新政会",
            "counts": {
              "賛成": 9
            },
            "members": [
              {
                "name": "冨樫賢太郎",
                "stance": "賛成"
              },
              {
                "name": "遠藤利子",
                "stance": "賛成"
              },
              {
                "name": "福田文子",
                "stance": "賛成"
              },
              {
                "name": "會田一男",
                "stance": "賛成"
              },
              {
                "name": "折笠正",
                "stance": "賛成"
              },
              {
                "name": "良田金次郎",
                "stance": "賛成"
              },
              {
                "name": "栗原晃",
                "stance": "賛成"
              },
              {
                "name": "廣田耕一",
                "stance": "賛成"
              },
              {
                "name": "石川義和",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "郡山市議会公明党",
            "counts": {
              "賛成": 3,
              "欠席": 1
            },
            "members": [
              {
                "name": "山根悟",
                "stance": "賛成"
              },
              {
                "name": "但野光夫",
                "stance": "賛成"
              },
              {
                "name": "田川正治",
                "stance": "欠席"
              },
              {
                "name": "小島寛子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "緑風会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "池田義人",
                "stance": "賛成"
              },
              {
                "name": "名木敬一",
                "stance": "賛成"
              },
              {
                "name": "大木進",
                "stance": "賛成"
              },
              {
                "name": "諸越裕",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "自由民主党郡山市議団",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "村上晃一",
                "stance": "賛成"
              },
              {
                "name": "三瓶宗盛",
                "stance": "賛成"
              },
              {
                "name": "佐藤栄作",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党郡山市議団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "遠藤隆",
                "stance": "反対"
              },
              {
                "name": "岡田哲夫",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "立憲民主党郡山",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "飯塚裕一",
                "stance": "賛成"
              },
              {
                "name": "八重樫小代子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "無所属の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "箭内好彦",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "立憲民主党",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "吉田公男",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "れいわ新選組",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "古山唯",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等に対する各議員の賛否（令和８年３月定例会・３月19日議決分）",
          "localUrl": "/sources/koriyama-shigikai-r8/118823.pdf",
          "originUrl": "https://www.city.koriyama.lg.jp/uploaded/attachment/118823.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001183829/https://www.city.koriyama.lg.jp/uploaded/attachment/118823.pdf"
        }
      }
    }
  ],
  "072044": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "いわき市議会",
      "seats": 37,
      "teisu": 37,
      "asOf": "2025-11-25",
      "asOfLabel": "2025年11月25日",
      "factions": [
        {
          "name": "政風会",
          "seats": 13,
          "isIndependent": false
        },
        {
          "name": "創世会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "真政会",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党いわき市議団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "フォーラムいわき",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "正論の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "誠心誠意の会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第35号",
        "billName": "令和８年度いわき市一般会計予算",
        "sessionLabel": "令和８年いわき市議会２月定例会",
        "decidedDate": "2026-03-12",
        "decidedDateLabel": "令和8年3月12日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 いわき市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派別名簿（各会派のページ・議決前の魚拓）",
        "localUrl": "/sources/iwaki-shigikai-r8/index.html",
        "originUrl": "https://web.archive.org/web/20260115044311id_/https://www.city.iwaki.lg.jp/www/contents/1722583989243/index.html",
        "archiveUrl": "https://web.archive.org/web/20260115044311id_/https://www.city.iwaki.lg.jp/www/contents/1722583989243/index.html"
      },
      "result": {
        "title": "令和８年いわき市議会２月定例会 議決結果一覧",
        "localUrl": "/sources/iwaki-shigikai-r8/R8.2giketsu.pdf",
        "originUrl": "https://www.city.iwaki.lg.jp/www/contents/1001000004942/simple/R8.2giketsu.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001183922/https://www.city.iwaki.lg.jp/www/contents/1001000004942/simple/R8.2giketsu.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "082201": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "つくば市議会",
      "seats": 28,
      "asOf": "2025-06-09",
      "asOfLabel": "2025年6月9日",
      "factions": [
        {
          "name": "つくばクラブ",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "Nextつくば",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "つくば・市民ネットワーク",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党つくば",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "創生クラブ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "日本共産党つくば",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "つくばチェンジチャレンジ",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "新・つくば民主主義の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "ワニナルつくば",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "縁粋会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第101号",
        "billName": "令和8年度つくば市一般会計予算",
        "sessionLabel": "2月定例会議",
        "decidedDate": "2026-03-25",
        "decidedDateLabel": "令和8年3月25日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 つくば市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派名簿（更新日 2025年06月09日）",
        "localUrl": "/sources/tsukuba-shigikai-r8/1002610.html",
        "originUrl": "https://www.city.tsukuba.lg.jp/soshikikarasagasu/gikaikyokugikaisomuka/gyomuannai/1/3/1002610.html",
        "archiveUrl": "https://web.archive.org/web/20260422153444/https://www.city.tsukuba.lg.jp/soshikikarasagasu/gikaikyokugikaisomuka/gyomuannai/1/3/1002610.html"
      },
      "result": {
        "title": "つくば市議会だより第191号（令和8年5月20日発行）",
        "localUrl": "/sources/tsukuba-shigikai-r8/shigikaidayori_191.pdf",
        "originUrl": "https://www.city.tsukuba.lg.jp/material/files/group/172/shigikaidayori_191.pdf",
        "archiveUrl": "https://web.archive.org/web/20260520005247/https://www.city.tsukuba.lg.jp/material/files/group/172/shigikaidayori_191.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null
    }
  ],
  "092011": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "宇都宮市議会",
      "seats": 45,
      "teisu": 45,
      "asOf": "2025-04-01",
      "asOfLabel": "2025年4月1日",
      "factions": [
        {
          "name": "自由民主党議員会",
          "seats": 19,
          "isIndependent": false
        },
        {
          "name": "市民連合",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "公明党議員会",
          "seats": 6,
          "isIndependent": false
        },
        {
          "name": "清風クラブ",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本共産党宇都宮市議員団",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "うつのみや維新",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "未来への架け橋",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "緑の地球",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "参政党　政治参加を促す会",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第18号",
        "billName": "令和8年度宇都宮市一般会計予算",
        "sessionLabel": "令和8年3月（第1回）定例会",
        "decidedDate": "2026-03-24",
        "decidedDateLabel": "令和8年3月24日",
        "result": "原案可決"
      },
      "sourceTitle": "令和8年度 宇都宮市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派紹介（令和7年4月1日現在）",
        "localUrl": "/sources/utsunomiya-shigikai-r8/1008552.html",
        "originUrl": "https://web.archive.org/web/20260207034310id_/https://www.city.utsunomiya.lg.jp/gikai/giin/1008552.html",
        "archiveUrl": "https://web.archive.org/web/20260207034310id_/https://www.city.utsunomiya.lg.jp/gikai/giin/1008552.html"
      },
      "result": {
        "title": "令和8年3月（第1回）定例会 会議結果",
        "localUrl": "/sources/utsunomiya-shigikai-r8/1044488.html",
        "originUrl": "https://www.city.utsunomiya.lg.jp/gikai/kekka/kekka/1044487/1044488.html",
        "archiveUrl": "https://web.archive.org/web/20261001171521/https://www.city.utsunomiya.lg.jp/gikai/kekka/kekka/1044487/1044488.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 37,
          "議長": 1,
          "反対": 6,
          "欠席": 1
        },
        "byFaction": [
          {
            "faction": "自由民主党議員会",
            "counts": {
              "賛成": 18,
              "議長": 1
            },
            "members": [
              {
                "name": "若林芽育",
                "stance": "賛成"
              },
              {
                "name": "手塚泉",
                "stance": "賛成"
              },
              {
                "name": "岡本源二郎",
                "stance": "賛成"
              },
              {
                "name": "今野哲也",
                "stance": "賛成"
              },
              {
                "name": "菅原一浩",
                "stance": "賛成"
              },
              {
                "name": "長谷川武士",
                "stance": "賛成"
              },
              {
                "name": "矢古宇芳一",
                "stance": "賛成"
              },
              {
                "name": "柴田賢司",
                "stance": "賛成"
              },
              {
                "name": "内藤良弘",
                "stance": "賛成"
              },
              {
                "name": "黒子英明",
                "stance": "賛成"
              },
              {
                "name": "篠崎圭一",
                "stance": "賛成"
              },
              {
                "name": "山崎昌子",
                "stance": "賛成"
              },
              {
                "name": "馬上剛",
                "stance": "賛成"
              },
              {
                "name": "今井政範",
                "stance": "賛成"
              },
              {
                "name": "小林紀夫",
                "stance": "賛成"
              },
              {
                "name": "舟本肇",
                "stance": "賛成"
              },
              {
                "name": "岡本芳明",
                "stance": "賛成"
              },
              {
                "name": "熊本和夫",
                "stance": "賛成"
              },
              {
                "name": "塚田典功",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "市民連合",
            "counts": {
              "賛成": 8
            },
            "members": [
              {
                "name": "横須賀咲紀",
                "stance": "賛成"
              },
              {
                "name": "佐藤孝明",
                "stance": "賛成"
              },
              {
                "name": "大久保順也",
                "stance": "賛成"
              },
              {
                "name": "高橋英樹",
                "stance": "賛成"
              },
              {
                "name": "中塚英範",
                "stance": "賛成"
              },
              {
                "name": "福田智恵",
                "stance": "賛成"
              },
              {
                "name": "郷間康久",
                "stance": "賛成"
              },
              {
                "name": "駒場昭夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党議員会",
            "counts": {
              "賛成": 6
            },
            "members": [
              {
                "name": "小倉久美",
                "stance": "賛成"
              },
              {
                "name": "岩井潤子",
                "stance": "賛成"
              },
              {
                "name": "秋成大",
                "stance": "賛成"
              },
              {
                "name": "成島隆裕",
                "stance": "賛成"
              },
              {
                "name": "菅野大造",
                "stance": "賛成"
              },
              {
                "name": "金沢力",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "清風クラブ",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "平松明夫",
                "stance": "賛成"
              },
              {
                "name": "久保井永三",
                "stance": "賛成"
              },
              {
                "name": "渡辺道仁",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党宇都宮市議員団",
            "counts": {
              "反対": 3
            },
            "members": [
              {
                "name": "小室かな子",
                "stance": "反対"
              },
              {
                "name": "原ちづる",
                "stance": "反対"
              },
              {
                "name": "福田久美子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "うつのみや維新",
            "counts": {
              "賛成": 2,
              "欠席": 1
            },
            "members": [
              {
                "name": "石川京樹",
                "stance": "賛成"
              },
              {
                "name": "佐藤恭子",
                "stance": "欠席"
              },
              {
                "name": "茂木祐佳里",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "未来への架け橋",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "保坂栄次",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "緑の地球",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "出井昌子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "参政党　政治参加を促す会",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "河田敦史",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "定例会会議結果（3月24日現在）議員別賛否",
          "localUrl": "/sources/utsunomiya-shigikai-r8/sannpi0324.pdf",
          "originUrl": "https://www.city.utsunomiya.lg.jp/_res/projects/default_project/_page_/001/044/488/sannpi0324.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001171559/https://www.city.utsunomiya.lg.jp/_res/projects/default_project/_page_/001/044/488/sannpi0324.pdf"
        }
      }
    }
  ],
  "032018": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "盛岡市議会",
      "seats": 38,
      "asOf": "2025-09-02",
      "asOfLabel": "2025年9月2日",
      "factions": [
        {
          "name": "盛友会",
          "seats": 17,
          "isIndependent": false
        },
        {
          "name": "創盛会",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "日本共産党盛岡市議団",
          "seats": 5,
          "isIndependent": false
        },
        {
          "name": "市政クラブ",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "公明党",
          "seats": 3,
          "isIndependent": false
        },
        {
          "name": "日本維新の会",
          "seats": 1,
          "isIndependent": false
        },
        {
          "name": "れいわ新選組",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "議案第3号",
        "billName": "令和8年度盛岡市一般会計予算",
        "sessionLabel": "令和8年3月定例会",
        "decidedDate": "2026-03-26",
        "decidedDateLabel": "令和8年3月26日",
        "result": "可決(多数)"
      },
      "sourceTitle": "令和8年度 盛岡市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "会派等別議員名簿（更新日 令和7年9月2日）",
        "localUrl": "/sources/morioka-shigikai-r8/1014492.html",
        "originUrl": "https://web.archive.org/web/20260414124240id_/https://www.city.morioka.iwate.jp/shisei/shigikai/giinshokai/1014492.html",
        "archiveUrl": "https://web.archive.org/web/20260414124240id_/https://www.city.morioka.iwate.jp/shisei/shigikai/giinshokai/1014492.html"
      },
      "result": {
        "title": "令和8年3月定例会 提出議案・議決結果",
        "localUrl": "/sources/morioka-shigikai-r8/1055511.html",
        "originUrl": "https://www.city.morioka.iwate.jp/shisei/shigikai/giketsukekka/1055507/1055511.html",
        "archiveUrl": "https://web.archive.org/web/20261001175647/https://www.city.morioka.iwate.jp/shisei/shigikai/giketsukekka/1055507/1055511.html"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "議長"
        ],
        "tally": {
          "議長": 1,
          "賛成": 31,
          "反対": 6
        },
        "byFaction": [
          {
            "faction": "盛友会",
            "counts": {
              "議長": 1,
              "賛成": 16
            },
            "members": [
              {
                "name": "櫻裕子",
                "stance": "議長"
              },
              {
                "name": "鈴木真吾",
                "stance": "賛成"
              },
              {
                "name": "山崎智樹",
                "stance": "賛成"
              },
              {
                "name": "千葉順子",
                "stance": "賛成"
              },
              {
                "name": "野田尚紀",
                "stance": "賛成"
              },
              {
                "name": "佐藤明彦",
                "stance": "賛成"
              },
              {
                "name": "小笠原秀夫",
                "stance": "賛成"
              },
              {
                "name": "田山俊悦",
                "stance": "賛成"
              },
              {
                "name": "浅沼克人",
                "stance": "賛成"
              },
              {
                "name": "千葉伸行",
                "stance": "賛成"
              },
              {
                "name": "工藤健一",
                "stance": "賛成"
              },
              {
                "name": "藤澤由蔵",
                "stance": "賛成"
              },
              {
                "name": "竹田浩久",
                "stance": "賛成"
              },
              {
                "name": "天沼久純",
                "stance": "賛成"
              },
              {
                "name": "菊田隆",
                "stance": "賛成"
              },
              {
                "name": "遠藤政幸",
                "stance": "賛成"
              },
              {
                "name": "村田芳三",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "創盛会",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "細川由香里",
                "stance": "賛成"
              },
              {
                "name": "後藤百合子",
                "stance": "賛成"
              },
              {
                "name": "兼平孝信",
                "stance": "賛成"
              },
              {
                "name": "寺長根浩",
                "stance": "賛成"
              },
              {
                "name": "大畑正二",
                "stance": "賛成"
              },
              {
                "name": "豊村徹也",
                "stance": "賛成"
              },
              {
                "name": "中村一",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党盛岡市議団",
            "counts": {
              "反対": 5
            },
            "members": [
              {
                "name": "庄子春治",
                "stance": "反対"
              },
              {
                "name": "三田村亜美子",
                "stance": "反対"
              },
              {
                "name": "鈴木努",
                "stance": "反対"
              },
              {
                "name": "高橋和夫",
                "stance": "反対"
              },
              {
                "name": "神部伸也",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市政クラブ",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "中村雅幸",
                "stance": "賛成"
              },
              {
                "name": "野中靖志",
                "stance": "賛成"
              },
              {
                "name": "中村亨",
                "stance": "賛成"
              },
              {
                "name": "伊勢志穂",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党",
            "counts": {
              "賛成": 3
            },
            "members": [
              {
                "name": "太田隆司",
                "stance": "賛成"
              },
              {
                "name": "池野直友",
                "stance": "賛成"
              },
              {
                "name": "鈴木聖子",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本維新の会",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "佐藤尚弘",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "れいわ新選組",
            "counts": {
              "反対": 1
            },
            "members": [
              {
                "name": "縄手豊子",
                "stance": "反対"
              }
            ]
          }
        ],
        "source": {
          "title": "令和8年3月定例会 賛否一覧表",
          "localUrl": "/sources/morioka-shigikai-r8/R8.3sanpikekka.pdf",
          "originUrl": "https://www.city.morioka.iwate.jp/_res/projects/default_project/_page_/001/055/511/R8.3sanpikekka.pdf",
          "archiveUrl": "https://web.archive.org/web/20261002115358/https://www.city.morioka.iwate.jp/_res/projects/default_project/_page_/001/055/511/R8.3sanpikekka.pdf"
        }
      }
    }
  ],
  "052019": [
    {
      "fy": "R8",
      "fyLabel": "令和8年度 当初予算",
      "body": "秋田市議会",
      "seats": 36,
      "asOf": "2025-06-05",
      "asOfLabel": "2025年6月5日",
      "factions": [
        {
          "name": "秋水会",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "自民党",
          "seats": 8,
          "isIndependent": false
        },
        {
          "name": "フロンティア秋田",
          "seats": 7,
          "isIndependent": false
        },
        {
          "name": "公明党秋田市議会",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "そうせいと維新",
          "seats": 4,
          "isIndependent": false
        },
        {
          "name": "日本共産党秋田市議会議員団",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民クラブ",
          "seats": 2,
          "isIndependent": false
        },
        {
          "name": "市民のみかた",
          "seats": 1,
          "isIndependent": false
        }
      ],
      "resolution": {
        "billNo": "2",
        "billName": "令和８年度秋田市一般会計予算の件",
        "sessionLabel": "令和８年２月定例会",
        "decidedDate": "2026-03-17",
        "decidedDateLabel": "令和8年3月17日",
        "result": "可決"
      },
      "sourceTitle": "令和8年度 秋田市議会の構成（会派別議席数）と当初予算の議決",
      "roster": {
        "title": "市議会議員名簿（会派別）（令和7年6月5日現在）",
        "localUrl": "/sources/akita-shigikai-r8/1001185.html",
        "originUrl": "https://web.archive.org/web/20251108061321id_/https://www.city.akita.lg.jp/shigikai/giin/1001185.html",
        "archiveUrl": "https://web.archive.org/web/20251108061321id_/https://www.city.akita.lg.jp/shigikai/giin/1001185.html"
      },
      "result": {
        "title": "議案等に対する議員の表決状況（令和８年２月定例会・令和８年３月１７日）",
        "localUrl": "/sources/akita-shigikai-r8/r080317sanpi.pdf",
        "originUrl": "https://www.city.akita.lg.jp/_res/projects/default_project/_page_/001/049/806/r080317sanpi.pdf",
        "archiveUrl": "https://web.archive.org/web/20261001180352/https://www.city.akita.lg.jp/_res/projects/default_project/_page_/001/049/806/r080317sanpi.pdf"
      },
      "minutesUrl": null,
      "newsletterUrl": null,
      "votes": {
        "basis": "member",
        "stances": [
          "賛成",
          "反対",
          "欠席",
          "議長"
        ],
        "tally": {
          "賛成": 32,
          "議長": 1,
          "欠席": 1,
          "反対": 2
        },
        "byFaction": [
          {
            "faction": "秋水会",
            "counts": {
              "賛成": 7,
              "議長": 1
            },
            "members": [
              {
                "name": "荻原貴幸",
                "stance": "賛成"
              },
              {
                "name": "細川信二",
                "stance": "賛成"
              },
              {
                "name": "見上万里子",
                "stance": "賛成"
              },
              {
                "name": "佐藤宏悦",
                "stance": "賛成"
              },
              {
                "name": "伊藤一榮",
                "stance": "賛成"
              },
              {
                "name": "渡辺正宏",
                "stance": "賛成"
              },
              {
                "name": "小木田喜美雄",
                "stance": "賛成"
              },
              {
                "name": "川口雅丈",
                "stance": "議長"
              }
            ]
          },
          {
            "faction": "自民党",
            "counts": {
              "賛成": 7,
              "欠席": 1
            },
            "members": [
              {
                "name": "飯牟礼克年",
                "stance": "賛成"
              },
              {
                "name": "工藤潤平",
                "stance": "賛成"
              },
              {
                "name": "工藤知彦",
                "stance": "賛成"
              },
              {
                "name": "安井正浩",
                "stance": "賛成"
              },
              {
                "name": "伊藤巧一",
                "stance": "賛成"
              },
              {
                "name": "熊谷重隆",
                "stance": "欠席"
              },
              {
                "name": "菅原琢哉",
                "stance": "賛成"
              },
              {
                "name": "小野寺誠",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "フロンティア秋田",
            "counts": {
              "賛成": 7
            },
            "members": [
              {
                "name": "後藤良",
                "stance": "賛成"
              },
              {
                "name": "船木純",
                "stance": "賛成"
              },
              {
                "name": "藤田信",
                "stance": "賛成"
              },
              {
                "name": "藤枝隆博",
                "stance": "賛成"
              },
              {
                "name": "工藤新一",
                "stance": "賛成"
              },
              {
                "name": "倉田芳浩",
                "stance": "賛成"
              },
              {
                "name": "小林一夫",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "公明党秋田市議会",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "佐藤佳人",
                "stance": "賛成"
              },
              {
                "name": "牧野守",
                "stance": "賛成"
              },
              {
                "name": "武田正子",
                "stance": "賛成"
              },
              {
                "name": "石塚秀博",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "そうせいと維新",
            "counts": {
              "賛成": 4
            },
            "members": [
              {
                "name": "藤井翼",
                "stance": "賛成"
              },
              {
                "name": "菊地格夫",
                "stance": "賛成"
              },
              {
                "name": "若松尚利",
                "stance": "賛成"
              },
              {
                "name": "小松健",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "日本共産党秋田市議会議員団",
            "counts": {
              "反対": 2
            },
            "members": [
              {
                "name": "奈良順子",
                "stance": "反対"
              },
              {
                "name": "佐藤純子",
                "stance": "反対"
              }
            ]
          },
          {
            "faction": "市民クラブ",
            "counts": {
              "賛成": 2
            },
            "members": [
              {
                "name": "安井誠悦",
                "stance": "賛成"
              },
              {
                "name": "花田清美",
                "stance": "賛成"
              }
            ]
          },
          {
            "faction": "市民のみかた",
            "counts": {
              "賛成": 1
            },
            "members": [
              {
                "name": "佐藤哲治",
                "stance": "賛成"
              }
            ]
          }
        ],
        "source": {
          "title": "議案等に対する議員の表決状況（令和８年２月定例会・令和８年３月１７日）",
          "localUrl": "/sources/akita-shigikai-r8/r080317sanpi.pdf",
          "originUrl": "https://www.city.akita.lg.jp/_res/projects/default_project/_page_/001/049/806/r080317sanpi.pdf",
          "archiveUrl": "https://web.archive.org/web/20261001180352/https://www.city.akita.lg.jp/_res/projects/default_project/_page_/001/049/806/r080317sanpi.pdf"
        }
      }
    }
  ]
};

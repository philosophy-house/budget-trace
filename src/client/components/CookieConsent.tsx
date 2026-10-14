"use client";

import { useEffect } from "react";
import * as CC from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { PRIVACY_URL } from "@/client/lib/site";

/**
 * Cookie 同意バナー。**www.phh.jp と同じ仕組み・同じ Cookie を使う**（2026-07-30）。
 *
 * ⚠ **`cc_cookie` を `.phh.jp`（親ドメイン）に置くのが要点**。www.phh.jp が同じ設定で
 * 書いているので、**どちらかで同意すればもう一方では二度目を訊かれない**。
 * 名前・ドメイン・カテゴリ名のどれかがズレると共有が黙って壊れ、利用者は
 * サブドメインごとに同じ質問をされることになる（＝この実装で一番壊れやすい点）。
 *
 * 計測の可否は **Google Consent Mode v2** で伝える。既定は `layout.tsx` が
 * GTM より前に `denied` で入れており、ここは同意に応じて `update` するだけ。
 * **GTM を読むか読まないかではなく、読んだうえで同意状態を渡す** —
 * こうしないと同意した瞬間に計測を始められない（再読込が要る）。
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// ⚠ **配列ではなく `arguments` を push する**（公式の gtag と同じ形）。GTM は配列を
// gtag コマンドとして扱わないので、`push(args)` だと consent update が黙って無視され、
// 同意しても計測は denied のまま（_ga が作られない）になる。2026-10-15 に本番で実測。
function gtag(..._args: unknown[]) {
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(arguments);
}

/** 同意カテゴリ → Consent Mode の各キー。www.phh.jp と同じ2カテゴリ構成 */
function syncConsentMode() {
  const analytics = CC.acceptedCategory("analytics") ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: analytics,
    ad_user_data: analytics,
    ad_personalization: analytics,
    analytics_storage: analytics,
  });
}

export default function CookieConsent() {
  useEffect(() => {
    void CC.run({
      // 同意 Cookie。**www.phh.jp と1バイトも違えないこと**（共有が壊れる）
      cookie: {
        name: "cc_cookie",
        // ローカル（localhost）では親ドメインを指定できないのでホスト限定に落とす。
        // 本番・Preview では `.phh.jp` を書いてサブドメイン間で共有する
        domain: location.hostname.endsWith(".phh.jp") ? ".phh.jp" : "",
        path: "/",
        expiresAfterDays: 182,
        sameSite: "Lax",
        secure: true,
      },
      guiOptions: {
        consentModal: { layout: "box", position: "bottom right" },
        preferencesModal: { layout: "box" },
      },
      categories: {
        necessary: { readOnly: true, enabled: true },
        analytics: {},
      },
      onFirstConsent: syncConsentMode,
      onConsent: syncConsentMode,
      onChange: syncConsentMode,
      language: {
        default: "ja",
        translations: {
          ja: {
            consentModal: {
              title: "Cookie の使用について",
              description: `当サイトでは、サイトの利用状況の分析とサービス向上のために Cookie を使用します。詳しくは<a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>をご覧ください。`,
              acceptAllBtn: "すべて同意",
              acceptNecessaryBtn: "必須のみ",
              showPreferencesBtn: "設定を管理",
            },
            preferencesModal: {
              title: "Cookie の設定",
              acceptAllBtn: "すべて同意",
              acceptNecessaryBtn: "必須のみ",
              savePreferencesBtn: "設定を保存",
              closeIconLabel: "閉じる",
              sections: [
                {
                  title: "必須 Cookie",
                  description: "サイトの基本的な機能に必要な Cookie です。常に有効で、無効化できません。",
                  linkedCategory: "necessary",
                },
                {
                  title: "分析 Cookie",
                  description:
                    "訪問者がサイトをどのように利用しているかを匿名で測定し、コンテンツの改善に役立てます。",
                  linkedCategory: "analytics",
                },
                {
                  title: "詳細情報",
                  description: `Cookie の取り扱いについては<a href="${PRIVACY_URL}" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>をご確認ください。`,
                },
              ],
            },
          },
        },
      },
    });
  }, []);

  return null;
}

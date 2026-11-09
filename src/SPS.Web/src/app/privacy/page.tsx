import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import PrivacyText from "@/components/privacy/PrivacyText";
import { withBasePath } from "@/lib/api-client";
import { fetchPrivacyPolicy } from "@/lib/api.server";

export const metadata: Metadata = {
  title: "隱私權政策",
};

/**
 * 隱私權政策頁。標題、最後更新日期與各區塊內容都是後台「內容管理 → 頁面設定 → 隱私權政策」維護的純文字
 * （內文怎麼變成段落、清單、連結見 `PrivacyText.tsx`）；頁尾與 Cookie 告知橫幅都連到這一頁。
 * 後端連不到時顯示「暫時無法載入」，不顯示過期或寫死的內容。
 */
export default async function PrivacyPage() {
  const policy = await fetchPrivacyPolicy();
  const title = policy?.title ?? "隱私權政策";

  return (
    <>
      <BodyClass className="sitemap" />
      <InnerPageShell
        title={title}
        breadcrumb={[{ label: title }]}
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
            </div>
          </>
        }
      >
        <div className="privacy-policy">
          {!policy && <p>目前無法載入隱私權政策，請稍後再試。</p>}
          {policy?.updatedDate && <p className="privacy-meta">最後更新：{policy.updatedDate.replaceAll("-", "/")}</p>}
          {policy?.sections.map((section, index) => (
            <section key={index} aria-labelledby={`privacy-section-${index}`}>
              <h3 id={`privacy-section-${index}`}>{section.title}</h3>
              <PrivacyText body={section.body} />
            </section>
          ))}
        </div>
      </InnerPageShell>
    </>
  );
}

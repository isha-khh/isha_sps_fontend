import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import { SUPPORT_INFO_BLOCKS, SUPPORT_QUICK_LINKS, SUPPORT_ANNOUNCEMENTS } from "@/lib/support-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "本計畫補助",
};

// 對應設計稿 page/_uc/side2_banner2.html（標題「產業輔導」，疑似
// 跨單元互相導流的廣告位）＋ page/_uc/side2_banner.html（一般廣告）。
const TUTORING_CROSS_PROMO_BANNERS: SidebarBannerItem[] = [
  { href: "/tutoring", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "/tutoring", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];
const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 「本計畫補助」，對應設計稿 page/support/index.html——「輔助資源」
 * 底下兩個平行頁面之一（另一個是 /support/resources，對應
 * page/support/p01.html「政府補助資源」），不是這頁的詳情頁。
 *
 * 目前後端沒有對應的內容類型，四個資訊區塊跟公告列表都先用
 * `support-data.ts` 的假資料，之後有真後端再換掉。
 */
export default function SupportPage() {
  return (
    <>
      <BodyClass className="support" />
      <InnerPageShell
        title="本計畫補助"
        breadcrumb={[{ label: "輔助資源" }, { label: "本計畫補助" }]}
        aside={
          <>
            <SidebarBanner items={TUTORING_CROSS_PROMO_BANNERS} heading="產業輔導" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
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
        <div className="support_box">
          <div className="d-flex">
            {SUPPORT_INFO_BLOCKS.map((block) => (
              <div className="support_er" key={block.title}>
                <h3>
                  <i className={`bi ${block.icon}`} />
                  <span>{block.title}</span>
                </h3>
                <ul className="nav d-block">
                  {block.items.map((item) => (
                    <li key={item.label}>
                      <i className="bi bi-caret-right-fill me-1 blue" />
                      <span>{item.label}</span>
                      {item.children && (
                        <ul className="nav">
                          {item.children.map((child) => (
                            <li key={child}>{child}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="supp_new mt-md-5 mt-4">
          <div className="dow-name">
            <span>本計畫補助</span>
          </div>

          <div className="new_box">
            {SUPPORT_ANNOUNCEMENTS.map((item) => (
              <a href={withBasePath("/support/resources")} className="news-item" title={`前往閱讀：${item.title}`} key={item.id}>
                <div className="news-content">
                  <span className="date blue mb-1 d-block">{item.date}</span>
                  <h4>{item.title}</h4>
                </div>
                <div className="news-arrow" aria-hidden="true">
                  <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt="" />
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="supp_five mt-md-5 mt-4">
          <div className="d-flex">
            {SUPPORT_QUICK_LINKS.map((link) => (
              <a href="#" title={`${link.label}(另開視窗)`} target="_blank" rel="noopener noreferrer" key={link.label}>
                <img className="img-fluid d-block img-small mx-auto" src={withBasePath(`/images/all/${link.icon}`)} alt="" />
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}

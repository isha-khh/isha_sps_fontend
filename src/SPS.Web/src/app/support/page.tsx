import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SidebarBanner from "@/components/layout/SidebarBanner";
import NewsBanner from "@/components/news/NewsBanner";
import { SUPPORT_INFO_BLOCKS, SUPPORT_QUICK_LINKS, SUPPORT_ANNOUNCEMENTS } from "@/lib/support-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchDownloadResources } from "@/lib/api.server";
import DownloadDialog from "@/components/ui/DownloadDialog";

export const metadata: Metadata = {
  title: "本計畫補助",
};

// 對應設計稿 page/_uc/side2_banner2.html（標題「產業輔導」，疑似
// 跨單元互相導流的廣告位）＋ page/_uc/side2_banner.html（一般廣告）。
/**
 * 「本計畫補助」，對應設計稿 page/support/index.html——「補助資源」
 * 底下兩個平行頁面之一（另一個是 /support/resources，對應
 * page/support/p01.html「政府補助資源」），不是這頁的詳情頁。
 *
 * 目前後端沒有對應的內容類型，四個資訊區塊跟公告列表都先用
 * `support-data.ts` 的假資料，之後有真後端再換掉。
 */
export default async function SupportPage() {
  // 五個快速連結的檔案／外部連結由後台「頁面設定 → 下載資源」維護
  const downloads = await fetchDownloadResources();
  const [supportTutoringBanners, sidebarBanners, topBanners] = await Promise.all([
    fetchBanners("sidebar-support-tutoring"),
    fetchBanners("sidebar-support"),
    fetchBanners("support-top"),
  ]);
  return (
    <>
      <BodyClass className="support" />
      <InnerPageShell
        title="本計畫補助"
        breadcrumb={[{ label: "補助資源" }, { label: "本計畫補助" }]}
        banner={topBanners.some((b) => b.uri) ? <NewsBanner id="support-banner" banners={topBanners} /> : undefined}
        aside={
          <>
            {/* 「申請入口」：外部申請系統的網址由後台「下載資源 → 申請入口」設定，沒設定就整顆不顯示 */}
            {(downloads["support-apply-entry"]?.links.length ?? 0) > 0 && (
              <div className="matching">
                <DownloadDialog links={downloads["support-apply-entry"].links} dialogTitle="前往申請入口" className="me_Publish more_x">
                  <span>申請入口</span>
                  <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                </DownloadDialog>
              </div>
            )}
            <SidebarBanner banners={supportTutoringBanners} heading="產業輔導" />
            <SidebarBanner banners={sidebarBanners} />
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
                        <ul className="nav d-block">
                          {item.children.map((child) => (
                            <li key={child}>{child}</li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
                {block.fullTextLink && (
                  <div>
                    <i className="bi bi-caret-right-fill me-1 blue" />
                    完整內容請參閱
                    <DownloadDialog
                      links={downloads[block.fullTextLink.resourceKey]?.links ?? []}
                      dialogTitle={`下載：${block.fullTextLink.label}`}
                      emptyLabel={`${block.fullTextLink.label}準備中`}
                    >
                      {block.fullTextLink.label}
                      <i className="bi bi-file-earmark-arrow-down" />
                    </DownloadDialog>
                  </div>
                )}
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
              <DownloadDialog
                links={downloads[link.resourceKey]?.links ?? []}
                dialogTitle={`下載：${link.label}`}
                emptyLabel={`${link.label}準備中`}
                key={link.label}
              >
                <img className="img-fluid d-block img-small mx-auto" src={withBasePath(`/images/all/${link.icon}`)} alt="" />
                <span>{link.label}</span>
              </DownloadDialog>
            ))}
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}

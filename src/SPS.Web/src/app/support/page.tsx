import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import PageSubNav, { SUPPORT_SUB_NAV } from "@/components/layout/PageSubNav";
import BodyClass from "@/components/BodyClass";
import SidebarBanner from "@/components/layout/SidebarBanner";
import NewsBanner from "@/components/news/NewsBanner";
import { SUPPORT_INFO_BLOCKS, SUPPORT_QUICK_LINKS, toSupportAnnouncement } from "@/lib/support-data";
import Pagination from "@/components/ui/Pagination";
import { buildListHref, readListQuery } from "@/lib/list-query";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchDownloadResources, fetchSectionItems, fetchSupportInfoBlocks, NewsSections } from "@/lib/api.server";
import DownloadDialog from "@/components/ui/DownloadDialog";
import Link from "next/link";

export const metadata: Metadata = {
  title: "本計畫補助",
};

// 對應設計稿 page/_uc/side2_banner2.html（標題「產業輔導」，疑似
// 跨單元互相導流的廣告位）＋ page/_uc/side2_banner.html（一般廣告）。
/** `tel:` 連結：分機用逗號（撥號時暫停再撥分機），例如「02-2755-5615 #37」→ `tel:0227555615,37` */
function toTelHref(phone: string): string {
  const [main, ext] = phone.split("#");
  const digits = main.replace(/[^0-9+]/g, "");
  const extension = (ext ?? "").replace(/[^0-9]/g, "");
  return `tel:${digits}${extension ? `,${extension}` : ""}`;
}

/** 補助金額的項目文字（例如「基礎升級 - 上限400萬元」）把金額加粗，與設計稿 `上限<b>400萬元</b>` 一致；其他文字照常顯示 */
function AmountLabel({ label }: { label: string }) {
  const match = label.match(/^(.*?)\s*-\s*上限(.+)$/);
  if (!match) return <span>{label}</span>;
  return (
    <>
      {match[1]}-{" "}
      <span>
        上限<b>{match[2]}</b>
      </span>
    </>
  );
}

/**
 * 「本計畫補助」，對應設計稿 page/support/index.html——「補助資源」
 * 底下兩個平行頁面之一（另一個是 /support/resources，對應
 * page/support/p01.html「政府補助資源」），不是這頁的詳情頁。
 *
 * 2026-10-13 起公告列表來自後台「補助專區 → 補助公告」（跟公告共用 News 資料表，`section = 2`），點進去是
 * `/support/[id]` 詳情；四個資訊區塊（適用對象／補助類別／補助金額／聯繫諮詢）由後台「頁面設定」維護，
 * 後端連不到才用 `support-data.ts` 的預設內容。
 */
const SUPPORT_NOTICE_PAGE_SIZE = 10;

export default async function SupportPage({ searchParams }: PageProps<"/support">) {
  const { page } = readListQuery(await searchParams);
  // 四個資訊區塊由後台「頁面設定」維護；後端連不到才用程式裡的預設內容
  const infoBlocks = (await fetchSupportInfoBlocks()) ?? SUPPORT_INFO_BLOCKS;
  const notices = await fetchSectionItems(NewsSections.Support, { page, pageSize: SUPPORT_NOTICE_PAGE_SIZE });
  const announcements = notices.items.map(toSupportAnnouncement);
  const noticeTotalPages = Math.max(1, Math.ceil(notices.totalCount / SUPPORT_NOTICE_PAGE_SIZE));
  const noticePage = Math.min(page, noticeTotalPages);
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
        titleAside={<PageSubNav links={SUPPORT_SUB_NAV} activeHref="/support" />}
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: "補助資源", href: "/support" }, { label: "本計畫補助", href: "/support" }]}
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
            {infoBlocks.map((block) => (
              <div className="support_er" key={block.title}>
                <h3>
                  <i className={`bi ${block.icon}`} />
                  <span>{block.title}</span>
                </h3>
                <ul className="nav d-block">
                  {block.items.map((item) =>
                    item.phone || item.email ? (
                      // 聯絡人：姓名一行、電話一行、信箱一行（2026-10-14 設計稿，`con_4`）
                      <li className="con_4" key={item.label}>
                        <p className="mb-0">
                          <i className="bi bi-caret-right-fill me-1 blue" />
                          <b>{item.label}</b>
                        </p>
                        <ul className="nav d-block">
                          {item.phone && (
                            <li>
                              <i className="bi bi-telephone me-1" />
                              <a href={toTelHref(item.phone)} title={`撥打電話至 ${item.phone}`}>
                                {item.phone}
                              </a>
                            </li>
                          )}
                          {item.email && (
                            <li>
                              <i className="bi bi-envelope me-1" />
                              <a href={`mailto:${item.email}`} title={`信箱 ${item.email}`}>
                                {item.email}
                              </a>
                            </li>
                          )}
                        </ul>
                      </li>
                    ) : (
                      <li key={item.label}>
                        <i className="bi bi-caret-right-fill me-1 blue" />
                        <AmountLabel label={item.label} />
                        {item.children && (
                          <ul className="nav d-block">
                            {item.children.map((child) => (
                              <li key={child}>{child}</li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ),
                  )}
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
            {!notices.backendAvailable && <p>目前無法載入補助公告，請稍後再試。</p>}
            {notices.backendAvailable && announcements.length === 0 && <p>目前沒有補助公告。</p>}
            {announcements.map((item) => (
              <Link href={`/support/${item.id}`} className="news-item" title={`前往閱讀：${item.title}`} key={item.id}>
                <div className="news-content">
                  <span className="date blue mb-1 d-block">{item.date}</span>
                  <h4>{item.title}</h4>
                </div>
                <div className="news-arrow" aria-hidden="true">
                  <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt="" />
                </div>
              </Link>
            ))}
          </div>
          {noticeTotalPages > 1 && <Pagination currentPage={noticePage} totalPages={noticeTotalPages} getHref={(target) => buildListHref("/support", { page: target })} />}
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

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import DownloadRequestForm from "@/components/serve/DownloadRequestForm";
import { SERVE_ITEMS, getServeItem } from "@/lib/serve-data";

export function generateStaticParams() {
  return SERVE_ITEMS.map((item) => ({ id: item.id }));
}

// 說明見 news/[id]/page.tsx 同一行的註解：現在是固定假資料，不在名單裡
// 的 id 直接在路由層級當 404，順便避開一個實測到的問題（未預先產生的
// 動態 id 觸發 notFound() 時，全站腳本載入順序會跟正常頁面不一樣）。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/serve/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = getServeItem(id);
  // 查無這個項目時，分頁標題也要跟著換成「找不到頁面」，不然瀏覽器
  // 分頁會顯示「服務專區」，但畫面其實已經是 not-found.tsx 那頁了。
  return { title: item?.title ?? "找不到頁面" };
}

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 服務專區詳情頁，對應舊站 serve/show.html。跟 `/news/[id]` 結構很像
 * （沒有跑馬燈標題、沒有左側分類選單、ShareBox 在這裡才用），主要差異
 * 是 `dk_conbo` 那塊：news 是附件下載/相關連結/聯繫人資訊三個唯讀清單，
 * serve 是一份「留資料換下載文件」的表單（DownloadRequestForm，含
 * 個資蒐集同意 modal）。
 */
export default async function ServeShowPage({ params }: PageProps<"/serve/[id]">) {
  const { id } = await params;
  const item = getServeItem(id);

  if (!item) {
    notFound();
  }

  return (
    <>
      <BodyClass className="serve show" />
      <InnerPageShell
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: item.category, href: `/serve?category=${item.category}` }, { label: item.title }]}
        aside={<SidebarBanner items={SIDEBAR_BANNERS} />}
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
            </div>
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{item.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <Badge>{item.category}</Badge>
                  </div>
                  <div className="part-line"></div>
                  <div className="date">{item.date}</div>
                </div>

                <ShareBox />
              </div>
            </div>

            {item.keywords && item.keywords.length > 0 && (
              <ul className="nav ul-key">
                {item.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ZoomableImage src={item.image} alt={item.title} caption={item.title} />

          {item.contributor && <div className="Contributor">撰稿人 / {item.contributor}</div>}

          <div className="txt editor mb-md-5 mb-4" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />

          <div className="dk_conbo mb-md-5 mb-4">
            <DownloadRequestForm />
          </div>

          <MoreLink href="/serve" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}

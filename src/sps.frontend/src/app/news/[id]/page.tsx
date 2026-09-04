import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import EditableArticleBody from "@/components/puck/EditableArticleBody";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner from "@/components/layout/SidebarBanner";
import { NEWS_ARTICLES, getNewsArticle } from "@/lib/news-data";

export function generateStaticParams() {
  return NEWS_ARTICLES.map((article) => ({ id: article.id }));
}

// 目前資料是固定的假資料，`generateStaticParams` 已經窮舉了所有合法 id，
// 不在名單裡的一律當作路由層級的 404（跟真的不存在的網址走同一條路），
// 不要讓 Next 為了「說不定之後動態長出新 id」再跑一次 on-demand render。
// 這裡順便繞開一個實測到的問題：這個 Next 版本裡，未預先產生的動態 id
// 觸發 `notFound()` 時，某些全站腳本的載入順序會跟正常頁面不一樣，
// 導致 jQuery 還沒定義 bsnav/coreScript 就先執行、噴錯——`dynamicParams
// = false` 讓沒列在名單裡的 id 直接在路由層級判定 404（跟真的不存在的
// 網址同一條路徑），從源頭避開那條路徑，而不是在下游硬修。之後如果
// 這裡改成真的 CMS／API 動態資料，記得把這行拿掉，notFound() 的判斷
// 邏輯不用動。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/news/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = getNewsArticle(id);
  // 查無這篇文章時，分頁標題也要跟著換成「找不到頁面」，不然瀏覽器
  // 分頁會顯示「最新消息」，但畫面其實已經是 not-found.tsx 那頁了。
  return { title: article?.title ?? "找不到頁面" };
}

const POPULAR_POSTS = NEWS_ARTICLES.map((article) => ({
  href: `/news/${article.id}`,
  title: article.title,
  date: article.date,
  image: article.image,
}));

const SIDEBAR_BANNERS = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 新聞詳情頁，對應舊站 news/show.html。跟 `/news` 列表頁不同：
 * - 沒有跑馬燈標題（InnerPageShell 的 `title` 不給）
 * - 沒有左側分類選單（`sidebar` 不給，CategorySidebar 自動整塊隱藏）
 * - ShareBox 在這裡才真正接上，列表頁沒有分享按鈕
 * - 封面圖用 ZoomableImage，點了可以放大看（舊站的靜態切版沒有這個
 *   互動，是趁 fancybox 燈箱通用化時順手加的小加值，不是單純遷移）
 *
 * 舊站這裡原本還有一段 TweenLite 視差滾動（讓 s_round_6／s_round_3
 * 兩張裝飾圖跟著捲動微微位移），跟首頁那幾個 round_* 裝飾圖是同一套
 * 效果，先跳過沒做，之後要做就是同一套邏輯，兩邊一起補。
 */
export default async function NewsShowPage({ params }: PageProps<"/news/[id]">) {
  const { id } = await params;
  const article = getNewsArticle(id);

  if (!article) {
    notFound();
  }

  return (
    <>
      <BodyClass className="news show" />
      <InnerPageShell
        breadcrumb={[{ label: "公告事項", href: "/news" }, { label: article.category, href: `/news?category=${article.category}` }, { label: article.title }]}
        aside={
          <>
            <PopularPosts items={POPULAR_POSTS} moreHref="/news" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
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
              <h3>{article.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <Badge>{article.category}</Badge>
                  </div>
                  <div className="part-line"></div>
                  <div className="date">{article.date}</div>
                </div>

                <ShareBox />
              </div>
            </div>

            {article.keywords && article.keywords.length > 0 && (
              <ul className="nav ul-key">
                {article.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ZoomableImage src={article.image} alt={article.title} caption={article.title} />

          {/*
            撰稿人／文章內文／附件下載／相關連結／聯繫人資訊，整段交給
            EditableArticleBody 管——目前先用「泡泡懸浮圖標」測試可編輯
            內容，見 components/puck/EditableArticleBody.tsx 的說明：
            存檔先寫 localStorage，沒編輯過就照舊顯示這幾個欄位原本的
            樣子。標題／分類／日期／關鍵字／封面圖是頁面模板本身的欄位，
            不算「公告內文」，留在這裡不受影響。
          */}
          <EditableArticleBody
            storageKey={`sps-puck-content:news:${article.id}`}
            contributor={article.contributor}
            bodyHtml={article.bodyHtml}
            attachments={article.attachments ?? []}
            relatedLinks={article.relatedLinks ?? []}
          />

          <MoreLink href="/news" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}

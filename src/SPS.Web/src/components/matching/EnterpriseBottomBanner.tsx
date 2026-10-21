import BannerImpressions from "@/components/ui/BannerImpressions";
import TrackedLink from "@/components/ui/TrackedLink";
import type { BannerItem } from "@/lib/types";

/**
 * 企業名錄列表下方的橫幅（設計稿 `.publish_banner`），圖片、連結由後台「橫幅管理 → 企業名錄底部橫幅」維護，
 * 依排序由上到下全部顯示；點擊與曝光會記錄次數，沒圖片的略過，一張都沒有就整塊不渲染（不用假資料頂替）。
 * `.publish_banner` 的左右留白與 hover 效果在 `style.css`，外層 class 不能省。
 */
export default function EnterpriseBottomBanner({ banners }: { banners: BannerItem[] }) {
  const items = banners.filter((b) => b.uri);
  if (items.length === 0) return null;

  return (
    <div className="publish_banner mt-md-5 mt-4 mb-4">
      {items.map((item) => {
        const title = item.title || item.name || "橫幅廣告";
        const picture = (
          <div className="pic">
            {/* 有連結時圖片是連結唯一的內容，替代文字不能是空的（無障礙檢測 HM1240401C）；沒連結的純展示圖才留空 */}
            <img className="img-fluid d-block" src={item.uri as string} alt={item.linkUrl ? title : ""} />
          </div>
        );
        return item.linkUrl ? (
          <TrackedLink
            bannerId={item.id}
            href={item.linkUrl}
            target={item.linkTarget}
            className="video-card d-block mb-3"
            title={item.linkTarget === "_blank" ? `${title}（另開視窗）` : title}
            key={item.id}
          >
            {picture}
          </TrackedLink>
        ) : (
          <div className="mb-3" key={item.id}>
            {picture}
          </div>
        );
      })}
      <BannerImpressions ids={items.map((b) => b.id)} />
    </div>
  );
}

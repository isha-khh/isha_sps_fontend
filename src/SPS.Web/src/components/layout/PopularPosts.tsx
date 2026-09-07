import MoreLink from "@/components/ui/MoreLink";

export interface PopularPostData {
  href: string;
  title: string;
  date: string;
  image: string;
}

/**
 * 積木元件：右側欄「熱門文章」，對應舊站 page/_uc/side2_new.html。
 * 排名數字（01、02…）一樣直接用陣列索引算，不用另外存欄位。
 *
 * `heading`／`moreLabel` 可覆寫，因為同一份結構被 side2_industry.html
 * （推廣專區的「熱門產業案例」）、side2_video.html（「熱門影片」，縮圖
 * 是 16:9 不是 4:3，所以 `imageRatio` 也做成可覆寫）也拿去用，只有
 * 標題文字/縮圖比例不一樣。
 *
 * `.side2_new` 這層外框不能省略——一開始漏了它，畫面上排名數字只是
 * 平凡的文字「01」「02」，不是設計稿那種疊在縮圖左上角的圓形徽章。
 * 原因是 `.ranking` 那顆圓形徽章跟外框卡片的邊框，兩條規則都寫成
 * `.side2 .side2_new .column_box ...`（style.css:1199／1218），一定要
 * 同時有 `.side2`（InnerPageShell 的 aside 欄位本來就有）跟
 * `.side2_new` 兩層祖先 class 才會生效，光有 `.column_box` 不夠。
 * 舊站原始碼裡 `.side2_new` 其實是 jQuery `.load()` 掛內容進去的那個
 * 容器，不是單純的掛載點，本身就是必要的樣式 class。
 */
export default function PopularPosts({
  items,
  moreHref,
  heading = "熱門文章",
  moreLabel = "查看更多文章",
  imageRatio = "ratio-4x3",
}: {
  items: PopularPostData[];
  moreHref: string;
  heading?: string;
  moreLabel?: string;
  imageRatio?: "ratio-4x3" | "ratio-16x9";
}) {
  return (
    <div className="side2_new">
      <div className="column_box">
        <h4 className="mb-4">{heading}</h4>

        {items.map((item, index) => (
          <div className="item" key={item.href}>
            <div className="d-flex">
              <a href={item.href} className="pic" title={item.title}>
                <div className="ranking">{String(index + 1).padStart(2, "0")}</div>
                <div className={`ratio ${imageRatio}`}>
                  <img className="img-fluid d-block" src={item.image} alt="" />
                </div>
              </a>

              <div className="tit">
                <a href={item.href} title={item.title}>
                  <div className="tit_nsl">
                    <h3>{item.title}</h3>
                    <div className="date">{item.date}</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        ))}

        <MoreLink href={moreHref} label={moreLabel} title={`前往 ${moreLabel}`} />
      </div>
    </div>
  );
}

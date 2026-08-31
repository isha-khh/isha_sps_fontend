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
 */
export default function PopularPosts({ items, moreHref }: { items: PopularPostData[]; moreHref: string }) {
  return (
    <div className="column_box">
      <h4 className="mb-4">熱門文章</h4>

      {items.map((item, index) => (
        <div className="item" key={item.href}>
          <div className="d-flex">
            <a href={item.href} className="pic" title={item.title}>
              <div className="ranking">{String(index + 1).padStart(2, "0")}</div>
              <div className="ratio ratio-4x3">
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

      <MoreLink href={moreHref} label="查看更多文章" title="前往 查看更多文章" />
    </div>
  );
}

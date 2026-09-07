import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import Badge from "@/components/ui/Badge";

interface EnterpriseListingData {
  href: string;
  category: string;
  name: string;
  keywords: string[];
  description: string;
}

const LISTINGS: EnterpriseListingData[] = [
  {
    href: "/matching/enterprise/1",
    category: "技術供應",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
  {
    href: "/matching/enterprise/2",
    category: "系統整合",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
  {
    href: "/matching/enterprise/3",
    category: "顧問服務",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
];

/**
 * 首頁「企業刊登」，對應舊站 page/_uc/home/home_enterprise.html。
 *
 * 這裡目前沒有輪播、沒有頁籤，就是純粹三張並排的企業卡片，所以卡片
 * 本身先不抽成獨立元件——等「我要媒合」的企業名錄頁真的要蓋的時候，
 * 再回頭看資料形狀是不是跟這裡一樣，一樣的話再抽出來，避免太早猜錯
 * 共用介面。
 */
export default function HomeEnterprise() {
  return (
    <div className="home_enterprise">
      <SectionTitle eyebrow="Member Listings">企業刊登</SectionTitle>

      <div className="home_enterprise_box">
        <div className="d-flex" data-aos="fade-up">
          {LISTINGS.map((listing) => (
            <div className="tit" key={listing.href}>
              <div className="tag-wrap">
                <Badge>{listing.category}</Badge>
              </div>

              <h3>
                <a href={listing.href} title={listing.name}>
                  {listing.name}
                </a>
              </h3>

              <ul className="nav ul-key">
                {listing.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>

              <p>{listing.description}</p>

              <a href={listing.href} className="news-arrow" title={listing.name}>
                <img className="img-fluid d-block" src="/images/home/arrow.svg" alt="" />
              </a>
            </div>
          ))}
        </div>
      </div>

      <MoreLink href="/matching/enterprise" label="查看更多" title="查看更多企業刊登" />
    </div>
  );
}

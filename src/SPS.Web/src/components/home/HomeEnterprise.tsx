import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import Badge from "@/components/ui/Badge";
import { fetchCompanies } from "@/lib/api.server";
import type { CompanyList } from "@/lib/types";

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

/** .nav.ul-key 只是點綴用的關鍵字連結，這裡沒有對應的「技術標籤頁」可以連，統一連回企業名錄。 */
const ENTERPRISE_DIRECTORY_HREF = "/matching/enterprise";

function toListingData(company: CompanyList): EnterpriseListingData {
  return {
    href: `${ENTERPRISE_DIRECTORY_HREF}/${company.id}`,
    // 真後端沒有像 News/SuccessCase 那樣的「分類」欄位，企業標籤
    // （tagNames，見 CompanyController 的 /tags API）是唯一的分類線索，
    // 取第一個當卡片左上角的徽章；完全沒有標籤時退回通用字樣。
    category: company.tagNames[0] ?? "企業會員",
    name: company.name,
    keywords: company.tagNames,
    description: company.introduction ?? "",
  };
}

/**
 * 排序：有掛標籤（`tagNames`）的業者優先顯示——首頁版位只有 3 格，
 * 沒有標籤的企業卡片只能靠通用字樣「企業會員」當分類徽章、也沒有
 * 關鍵字列表可以顯示（見 `toListingData`），版面會比較空、對使用者
 * 也比較沒有篩選/瀏覽的線索，所以優先把「資料比較完整」的企業排到
 * 前面。同樣有沒有標籤的兩家企業之間，再用 `createdTime` 新到舊排。
 */
function byTagsThenNewest(a: CompanyList, b: CompanyList): number {
  const aHasTags = a.tagNames.length > 0;
  const bHasTags = b.tagNames.length > 0;
  if (aHasTags !== bHasTags) return aHasTags ? -1 : 1;
  return a.createdTime < b.createdTime ? 1 : -1;
}

/**
 * 首頁「企業刊登」，對應舊站 page/_uc/home/home_enterprise.html。
 *
 * 對到真後端 `GET /api/Company`（見 `fetchCompanies`）。「已審核通過、
 * 可公開刊登」用 `isVerified` 篩，取排序後前 3 家（見
 * `byTagsThenNewest`：有標籤優先，其餘新到舊）——跟 News/Promotion
 * 一樣，`backendAvailable:false`（連不到後端）才退回假資料，真後端
 * 回應但剛好 0 家已驗證企業時要照實顯示（見下面 `visibleListings`
 * 的判斷）。
 *
 * 這裡目前沒有輪播、沒有頁籤，就是純粹三張並排的企業卡片，所以卡片
 * 本身先不抽成獨立元件——等「我要媒合」的企業名錄頁真的要蓋的時候，
 * 再回頭看資料形狀是不是跟這裡一樣，一樣的話再抽出來，避免太早猜錯
 * 共用介面。
 */
export default async function HomeEnterprise() {
  const { items, backendAvailable } = await fetchCompanies();
  const visibleListings = backendAvailable
    ? items.slice().sort(byTagsThenNewest).slice(0, 3).map(toListingData)
    : LISTINGS;

  return (
    <div className="home_enterprise">
      <SectionTitle eyebrow="Member Listings">企業刊登</SectionTitle>

      <div className="home_enterprise_box">
        <div className="d-flex" data-aos="fade-up">
          {visibleListings.map((listing) => (
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

      <MoreLink href={ENTERPRISE_DIRECTORY_HREF} label="查看更多" title="查看更多企業刊登" />
    </div>
  );
}

import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import { fetchCompaniesPage, fetchTagTaxonomy } from "@/lib/api.server";
import { techGroupLabels, type TagTaxonomy } from "@/lib/company-tags";
import type { CompanyList } from "@/lib/types";
import { withBasePath } from "@/lib/api-client";
import Link from "next/link";

interface EnterpriseListingData {
  href: string;
  name: string;
  keywords: string[];
  description: string;
}

const LISTINGS: EnterpriseListingData[] = [
  {
    href: "/matching/enterprise/1",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
  {
    href: "/matching/enterprise/2",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
  {
    href: "/matching/enterprise/3",
    name: "智安科技股份有限公司",
    keywords: ["AIoT", "工安監控", "電腦視覺"],
    description: "專注於工業AI視覺辨識技術，提供完整的智慧安全監控系統解決方案，服務逾50家石化廠。",
  },
];

/** .nav.ul-key 只是點綴用的關鍵字連結，這裡沒有對應的「技術標籤頁」可以連，統一連回企業名錄。 */
const ENTERPRISE_DIRECTORY_HREF = "/matching/enterprise";

function toListingData(company: CompanyList, taxonomy: TagTaxonomy): EnterpriseListingData {
  return {
    href: `${ENTERPRISE_DIRECTORY_HREF}/${company.id}`,
    name: company.name,
    // 技術標籤跟企業名錄一樣，只顯示智慧技術的第一層大類（感測端點、系統部署…）；沒有標籤 id 的舊資料退回顯示全部標籤名稱。
    // 卡片左上角原本有一顆紫色的第一個標籤徽章，已拿掉（issue #42）
    keywords: company.tagIds ? techGroupLabels(company.tagIds, taxonomy) : company.tagNames,
    description: company.introduction ?? "",
  };
}

/**
 * 首頁「企業刊登」，對應舊站 page/_uc/home/home_enterprise.html。
 *
 * 對到真後端 `GET /api/Company`（見 `fetchCompaniesPage`），直接要前 3 家。
 * 後端只回「已審核通過且啟用」的企業，並且套用跟「我要媒合 → 企業名錄」同一套設定：
 * 後台「頁面設定 → 企業名錄排序」的排序，以及「內容設定 → 企業名錄只顯示供給端」的篩選
 * （都靠傳 `useDirectorySort`），所以首頁這 3 張卡片永遠是名錄列表的前 3 家。
 * （原本這裡自己撈 100 筆、在前台依「有標籤優先、再新到舊」排，不看後台設定；
 * 想要「標籤多的優先」請在後台企業名錄排序打開「標籤」。）
 * 跟 News/Promotion 一樣，`backendAvailable:false`（連不到後端）才退回假資料，
 * 真後端回應但剛好 0 家企業時要照實顯示（見下面 `visibleListings` 的判斷）。
 *
 * 這裡目前沒有輪播、沒有頁籤，就是純粹三張並排的企業卡片，所以卡片
 * 本身先不抽成獨立元件——等「我要媒合」的企業名錄頁真的要蓋的時候，
 * 再回頭看資料形狀是不是跟這裡一樣，一樣的話再抽出來，避免太早猜錯
 * 共用介面。
 */
export default async function HomeEnterprise() {
  const [{ items, backendAvailable }, taxonomy] = await Promise.all([
    fetchCompaniesPage({ page: 1, pageSize: 3, useDirectorySort: true }),
    fetchTagTaxonomy(),
  ]);
  const visibleListings = backendAvailable ? items.map((company) => toListingData(company, taxonomy)) : LISTINGS;

  return (
    <div className="home_enterprise">
      <SectionTitle eyebrow="Member Listings">企業刊登</SectionTitle>

      <div className="home_enterprise_box">
        <div className="d-flex" data-aos="fade-up">
          {visibleListings.map((listing) => (
            <div className="tit" key={listing.href}>
              <h3>
                <Link href={listing.href} title={listing.name}>
                  {listing.name}
                </Link>
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

              <Link href={listing.href} className="news-arrow" title={listing.name}>
                <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt={`查看${listing.name}`} />
              </Link>
            </div>
          ))}
        </div>
      </div>

      <MoreLink href={ENTERPRISE_DIRECTORY_HREF} label="查看更多" title="查看更多企業刊登" />
    </div>
  );
}

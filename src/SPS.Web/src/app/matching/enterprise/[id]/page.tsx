import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MoreLink from "@/components/ui/MoreLink";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import EnterpriseContactModal from "@/components/matching/EnterpriseContactModal";
import { ENTERPRISE_DETAILS, TECH_ATTRIBUTE_GROUPS, getCompanyTypeLabels, getEnterpriseDetail } from "@/lib/matching-data";

export function generateStaticParams() {
  return ENTERPRISE_DETAILS.map((item) => ({ id: item.id }));
}

// 說明見 news/[id]/page.tsx 同一行的註解：現在是固定假資料，不在名單裡
// 的 id 直接在路由層級當 404。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/matching/enterprise/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = getEnterpriseDetail(id);
  return { title: item?.name ?? "找不到頁面" };
}

/**
 * 企業名錄詳情頁，對應設計稿 `page/matching/show.html`。目前純畫面
 * （假資料），見 `../page.tsx` 開頭的說明。
 *
 * 沒有 `sidebar`／`aside`：設計稿這頁 `side1` 內容是空的（子選單
 * `.side1_serve` 的載入呼叫本身就被註解掉），`side2` 直接是
 * `d-none`，兩邊都不顯示裝飾用的側欄，`.content` 自動撐滿（跟
 * `/promotion/contribute` 同樣的處理）。
 *
 * 「智慧技術」這塊設計稿原始碼裡項目是 `<a>` 標籤（`ul.nav.ul-key`），
 * 不是核取方塊——照字面判讀，這裡是給使用者瀏覽/導覽完整技術分類用
 * 的清單，不是「這家公司勾選了哪些」的呈現方式（那樣的話應該只列出
 * 該公司有的項目，不會把所有選項都印出來）。`EnterpriseDetail.
 * selectedTechValues` 這個假資料欄位目前沒有實際用在畫面上，先留著
 * 是因為之後如果客戶回饋這裡其實應該「只顯示該公司有的技術」，資料
 * 形狀已經準備好，不用重新設計。
 */
export default async function MatchingEnterpriseDetailPage({ params }: PageProps<"/matching/enterprise/[id]">) {
  const { id } = await params;
  const company = getEnterpriseDetail(id);

  if (!company) {
    notFound();
  }

  const modalId = `enterprise-contact-${company.id}`;
  const typeLabels = getCompanyTypeLabels(company.type);

  return (
    <>
      <BodyClass className="matching enterprise show" />
      <InnerPageShell breadcrumb={[{ label: "企業名錄", href: "/matching/enterprise" }, { label: company.name }]}>
        <div className="ente_box">
          <div className="item_box d-flex mb-4">
            <div className="pic">
              <div className="ratio ratio-4x3">
                <img className="img-fluid d-block" src={company.photo || "/images/all/new_logo.jpg"} alt={`${company.name} 公司標誌`} />
              </div>
            </div>

            <div className="tit">
              <div className="tit_nsl">
                <div className="h3_solid">
                  <h3>{company.name}</h3>
                </div>

                {typeLabels.length > 0 && (
                  <ul className="nav">
                    {typeLabels.map((label, index) => (
                      <li className={index === 0 ? "su_1" : "su_2"} key={label}>
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="item_box_six d-flex">
            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-person-circle"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>公司負責人</label>
                  <span>{company.charge}</span>
                </div>
              </div>
            </div>

            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-calendar4-week"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>成立日期</label>
                  <span>{company.establishmentDate}</span>
                </div>
              </div>
            </div>

            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-person-vcard"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>統一編號</label>
                  <span>{company.unifiedSocialCreditCode}</span>
                </div>
              </div>
            </div>

            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-coin"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>資本總額</label>
                  <span>{company.revenue.toLocaleString()}元</span>
                </div>
              </div>
            </div>

            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-envelope-at"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>聯繫窗口</label>
                  <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target={`#${modalId}`} className="connec_s" title="取得聯絡方式">
                    取得聯絡方式
                  </a>
                </div>
              </div>
            </div>

            <div className="item_box_six_1">
              <div className="pic">
                <i className="bi bi-globe"></i>
              </div>
              <div className="tit">
                <div className="tit_dt">
                  <label>公司網址</label>
                  {company.orgUrl ? (
                    <a href={company.orgUrl} title={`${company.orgUrl}（另開視窗）`} className="blue" target="_blank" rel="noopener noreferrer">
                      {company.orgUrl.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span>未提供</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="item_box_two d-flex">
          <div className="item_box_two_1">
            <div className="dow-name">
              <i className="bi bi-buildings"></i>
              <span>公司簡介</span>
            </div>
            <div className="txt editor">{company.introduction}</div>
          </div>

          <div className="item_box_two_1">
            <div className="dow-name">
              <i className="bi bi-file-earmark-text"></i>
              <span>主要產品暨服務</span>
            </div>

            <p>{company.subject}</p>

            <div className="mat_prod_box d-flex mb-4">
              {company.products.map((product, index) => (
                <div className="pic" key={index}>
                  <div className="ratio ratio-4x3">
                    <img className="img-fluid d-block" src={product.image} alt={`${company.name} 產品或服務示意圖`} />
                  </div>
                </div>
              ))}
            </div>

            <h5 className="mb-3">
              <i className="bi bi-caret-right-fill me-1 blue"></i>應用情境
            </h5>
            <ul className="nav ul-key mb-4">
              {company.applicationScenarios.map((scenario) => (
                <li key={scenario}>
                  <a href="#" title={scenario}>
                    {scenario}
                  </a>
                </li>
              ))}
            </ul>

            <h5 className="mb-3">
              <i className="bi bi-caret-right-fill me-1 blue"></i>應用範疇
            </h5>
            <ul className="nav ul-key mb-4">
              {company.applicationScopes.map((scope) => (
                <li key={scope}>
                  <a href="#" title={scope}>
                    {scope}
                  </a>
                </li>
              ))}
            </ul>

            <h5 className="mb-3">
              <i className="bi bi-caret-right-fill me-1 blue"></i>智慧技術
            </h5>
            <div className="menb_inp_tit form-group w-100">
              <TechAttributeSelector groups={TECH_ATTRIBUTE_GROUPS} name={`detail-${company.id}`} variant="tags" />
            </div>
          </div>
        </div>

        <div className="item_box_two_1">
          <div className="dow-name">
            <i className="bi bi-award"></i>
            <span>獲獎事蹟暨重要合作案例</span>
          </div>

          <p>{company.cooperationNote}</p>

          <div className="mat_Award_box d-flex mb-4">
            {company.awards.map((award, index) => (
              <div className="pic" key={index}>
                <div className="ratio ratio-4x3">
                  <img className="img-fluid d-block" src={award.image} alt={`${company.name} 獲獎或合作案例示意圖`} />
                </div>
              </div>
            ))}
          </div>

          <div className="mat_cooperate_box">
            <h5 className="blue">合作案例</h5>
            <p>{company.cooperationNote}</p>
          </div>
        </div>

        <MoreLink href="/matching/enterprise" label="返回" title="返回" />
      </InnerPageShell>

      <EnterpriseContactModal id={modalId} contactName={company.charge ?? ""} contactPhone={company.chargePhone ?? ""} />
    </>
  );
}

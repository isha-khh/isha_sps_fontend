import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MoreLink from "@/components/ui/MoreLink";
import { getCompanyTypeLabels } from "@/lib/matching-data";
import { fetchCompanyDetail, fetchTagTaxonomy } from "@/lib/api.server";
import { splitTagsByKind } from "@/lib/company-tags";
import Link from "next/link";
import { withBasePath } from "@/lib/api-client";

export async function generateMetadata({ params }: PageProps<"/matching/enterprise/[id]">): Promise<Metadata> {
  const { id } = await params;
  const company = await fetchCompanyDetail(id);
  return { title: company?.name ?? "找不到頁面" };
}

/**
 * 企業名錄詳情頁，對應設計稿 `page/matching/show.html`。資料來自後台「公司管理」已審核通過且啟用的企業
 * （`fetchCompanyDetail`，2026-10-06 從假資料改接真後端）。
 *
 * 主要產品暨服務的示意圖、獲獎事蹟暨合作案例（圖片與說明）由後台「公司管理 → 前台展示內容」維護，沒填的區塊不顯示；
 * 應用情境／應用範疇／智慧技術來自企業標籤。負責人姓名與資本總額（營收）後端對匿名呼叫
 * 一律不給（個資），所以「公司負責人」「資本總額」只有後端有給時才顯示；
 * 設計稿的「聯繫窗口」（勾選後展開聯絡人）會把聯絡人放進網頁原始碼、等於公開，所以改成顯示公司電話；
 * 之後要做「會員登入後才看得到聯絡窗口」得另外做會員專用的端點。
 *
 * 沒有 `sidebar`／`aside`：設計稿這頁兩側都是空的，`.content` 自動撐滿。
 */
export default async function MatchingEnterpriseDetailPage({ params }: PageProps<"/matching/enterprise/[id]">) {
  const { id } = await params;
  const company = await fetchCompanyDetail(id);

  if (!company) {
    notFound();
  }

  const taxonomy = await fetchTagTaxonomy();
  const tags = splitTagsByKind(company.tagIds, taxonomy);
  const tagSections = [
    { label: "應用情境", items: tags.scenario },
    { label: "應用範疇", items: tags.scope },
    { label: "智慧技術", items: tags.tech },
  ].filter((section) => section.items.length > 0);
  const typeLabels = getCompanyTypeLabels(company.type);
  const phoneDial = company.phone ? company.phone.split("#")[0].replace(/[^0-9+]/g, "") : "";

  // 六格資訊：沒有資料的格子整格不顯示
  const facts: { icon: string; label: string; content: React.ReactNode }[] = [];
  if (company.charge) facts.push({ icon: "bi-person-circle", label: "公司負責人", content: <span>{company.charge}</span> });
  if (company.establishmentDate) facts.push({ icon: "bi-calendar4-week", label: "成立日期", content: <span>{company.establishmentDate.slice(0, 10)}</span> });
  facts.push({ icon: "bi-person-vcard", label: "統一編號", content: <span>{company.unifiedSocialCreditCode}</span> });
  if (company.employees) facts.push({ icon: "bi-people", label: "員工人數", content: <span>{company.employees.toLocaleString()}人</span> });
  if (company.phone) {
    facts.push({
      icon: "bi-telephone",
      label: "公司電話",
      content: (
        <a href={`tel:${phoneDial}`} title={`撥打電話至 ${company.phone}`} className="blue">
          {company.phone}
        </a>
      ),
    });
  }
  facts.push({
    icon: "bi-globe",
    label: "公司網址",
    content: company.orgUrl ? (
      <a href={company.orgUrl} title={`${company.orgUrl}（另開視窗）`} className="blue" target="_blank" rel="noopener noreferrer">
        {company.orgUrl.replace(/^https?:\/\//, "")}
      </a>
    ) : (
      <span>未提供</span>
    ),
  });

  return (
    <>
      <BodyClass className="matching enterprise show" />
      <InnerPageShell breadcrumb={[{ label: "企業名錄", href: "/matching/enterprise" }, { label: company.name }]}>
        <div className="ente_box">
          <div className="item_box d-flex mb-4">
            <div className="pic">
              <div className="ratio ratio-4x3">
                <img className="img-fluid d-block" src={company.photoUrl || withBasePath("/images/all/new_logo.jpg")} alt={`${company.name} 公司標誌`} />
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
            {facts.map((fact) => (
              <div className="item_box_six_1" key={fact.label}>
                <div className="pic">
                  <i className={`bi ${fact.icon}`}></i>
                </div>
                <div className="tit">
                  <div className="tit_dt">
                    <label>{fact.label}</label>
                    {fact.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="item_box_two d-flex">
          {company.introduction && (
            <div className="item_box_two_1">
              <div className="dow-name">
                <i className="bi bi-buildings"></i>
                <span>公司簡介</span>
              </div>
              {/* 後台輸入的純文字，不當 HTML 輸出；換行分段 */}
              <div className="txt editor">
                {company.introduction
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </div>
          )}

          {(company.subject || company.productImages.length > 0 || tagSections.length > 0) && (
            <div className="item_box_two_1">
              <div className="dow-name">
                <i className="bi bi-file-earmark-text"></i>
                <span>主要產品暨服務</span>
              </div>

              {company.subject && <p>{company.subject}</p>}

              {company.productImages.length > 0 && (
                <div className="mat_prod_box d-flex mb-4">
                  {company.productImages.map((src, index) => (
                    <div className="pic" key={`${src}-${index}`}>
                      <div className="ratio ratio-4x3">
                        <img className="img-fluid d-block" src={src} alt={`${company.name} 產品或服務示意圖 ${index + 1}`} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 應用情境／應用範疇／智慧技術：公司在後台勾選的標籤，點進去看有同樣標籤的其他企業 */}
              {tagSections.map((section) => (
                <div key={section.label}>
                  <h5 className="mb-3">
                    <i className="bi bi-caret-right-fill me-1 blue"></i>
                    {section.label}
                  </h5>
                  <ul className="nav ul-key mb-4">
                    {section.items.map((tag) => (
                      <li key={tag.id}>
                        <Link href={`/matching/enterprise?tags=${tag.id}`} title={`查看同樣是「${tag.name}」的企業`}>
                          {tag.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {(company.awardImages.length > 0 || company.cooperationNote) && (
          <div className="item_box_two_1">
            <div className="dow-name">
              <i className="bi bi-award"></i>
              <span>獲獎事蹟暨重要合作案例</span>
            </div>

            {company.awardImages.length > 0 && (
              <div className="mat_Award_box d-flex mb-4">
                {company.awardImages.map((src, index) => (
                  <div className="pic" key={`${src}-${index}`}>
                    <div className="ratio ratio-4x3">
                      <img className="img-fluid d-block" src={src} alt={`${company.name} 獲獎或合作案例示意圖 ${index + 1}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {company.cooperationNote && (
              <div className="mat_cooperate_box">
                <h5 className="blue">合作案例</h5>
                {company.cooperationNote
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            )}
          </div>
        )}

        <MoreLink href="/matching/enterprise" label="返回" title="返回" />
      </InnerPageShell>
    </>
  );
}

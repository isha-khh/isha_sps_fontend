import { withBasePath } from "@/lib/api-client";
import Link from "next/link";
import type { PromotionCaseCompany } from "@/lib/types";

/**
 * 產業案例詳情頁的「公司簡介」區塊，對應設計稿 page/promotion/show.html 的 `.prom`（issue #66）：
 * 左邊公司標誌，右邊公司名稱、簡介、網址。資料是後台案例編輯頁「關聯企業」選的平台企業
 * （案例 API 只帶已審核且啟用的企業）。公司簡介本身對訪客一律可見；點企業名稱進企業名錄詳情，
 * 能不能看依後台「內容設定 → 訪客可查看企業名錄詳情」。
 * 多家企業由上到下排列；沒有任何企業就整塊不顯示。
 * `.prom .indu_box` 的底色與間距在 `style.css`，外層 `.prom` 不能省。
 */
export default function CaseCompanyIntro({ companies }: { companies: PromotionCaseCompany[] }) {
  if (companies.length === 0) return null;

  return (
    <div className="dk_conbo mb-md-5 mb-4">
      <div className="prom">
        <div className="cont">
          <div className="dow-name">
            <i className="bi bi-buildings me-1" aria-hidden="true"></i>
            <span>公司簡介</span>
          </div>

          <div className="prom_section">
            {companies.map((company) => (
              <div className="indu_box d-flex mb-3" key={company.id}>
                <div className="pic">
                  <div className="ratio ratio-4x3">
                    <img className="img-fluid d-block" src={company.photoUrl || withBasePath("/images/all/new_logo.jpg")} alt={`${company.name} 公司標誌`} />
                  </div>
                </div>

                <div className="tit_ind">
                  <div className="tit_nsl">
                    <div className="h3_solid">
                      <div className="me_sod_bu">
                        {/* 企業名錄詳情是否對訪客開放，依後台「內容設定」；沒開放時詳情頁會請訪客先登入 */}
                        <Link href={`/matching/enterprise/${company.id}`} title={`${company.name}（企業名錄）`}>
                          {company.name}
                        </Link>
                      </div>
                    </div>

                    {company.introduction && (
                      <div className="txt editor">
                        {company.introduction
                          .split(/\n+/)
                          .filter(Boolean)
                          .map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                          ))}
                      </div>
                    )}

                    {company.orgUrl && /^https?:\/\//i.test(company.orgUrl) && (
                      <a href={company.orgUrl} title={`${company.orgUrl}（另開視窗）`} target="_blank" rel="noopener noreferrer" className="blue">
                        <i className="bi bi-globe me-1" aria-hidden="true"></i>
                        <span>{company.orgUrl.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

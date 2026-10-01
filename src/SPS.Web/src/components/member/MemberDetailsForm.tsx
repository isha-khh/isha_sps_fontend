"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import PasswordField from "@/components/member/PasswordField";
import ChecklistGroup from "@/components/member/ChecklistGroup";
import SmartTechSelector from "@/components/member/SmartTechSelector";
import DocumentUploadField from "@/components/member/DocumentUploadField";
import { APPLICATION_SCENARIOS, APPLICATION_SCOPES } from "@/lib/member-registration-data";
import { withBasePath } from "@/lib/api-client";
import { applicationsApi } from "@/lib/api/applications";
import { getApiErrorMessage } from "@/lib/error-utils";
import { DocumentType } from "@/types/api";
import { ApplicantType as ApplicantTypeEnum, CompanyLevel, MemberRole, type ApplicationResponse, type CreateApplicationRequest } from "@/types/application";

const REQUIRED = (
  <span className="red me-1" aria-hidden="true">
    *
  </span>
);

export type ApplicantType = "individual" | "company";
export type CompanyRole = "demand" | "supply";
export type SupplierTier = "excellent" | "emerging";

/**
 * 對應官方《會員申請須知》「審查方式」欄——跟 `member-compare-data.ts`
 * 的 `COMPARE_ROWS[1]`（審查方式那列）是同一份文字，這裡另外抽一份
 * 是因為那邊是給「非會員/個人/企業-需求/企業-供給x2」5 欄比較表用
 * 的固定陣列，這裡要依 Step2 選擇動態算出「這個人是哪一種」，直接
 * 共用陣列反而要多一層對應索引，不如各自算​一次單純。
 */
function getReviewMethodLabel(applicantType: ApplicantType, companyRole?: CompanyRole, tier?: SupplierTier): string {
  if (applicantType === "individual") return "基本資料檢核";
  if (companyRole === "demand") return "文件審查";
  if (tier === "emerging") return "文件審查＋至少5位專家審查";
  return "文件審查";
}

/**
 * 使用者勾選「個人資料同意書」後，自動產生一份極簡的同意紀錄文字檔，
 * 當成 `DocumentType.PersonalDataConsent` 上傳——後端
 * `ValidateApplicationForSubmitAsync` 要求這個文件類型真的存在一筆
 * 上傳紀錄才能送出申請，UI 這邊目前只有一個勾選框（沒有真的要使用者
 * 上傳一份「同意書」檔案），2026-10-01 決定用這個方式銜接，不改後端
 * 驗證邏輯。
 */
function buildConsentAcknowledgementFile(contactName: string): File {
  const content = `本人（${contactName || "申請人"}）已於 ${new Date().toISOString()} 閱讀並同意個人資料告知事項及同意書。`;
  return new File([content], "personal-data-consent.txt", { type: "text/plain" });
}

interface DocumentSlots {
  companyRegistration: File | null;
  capability: File | null;
  application: File | null;
  other: File | null;
}

/**
 * 積木元件：會員註冊 Step 3「填寫資料」／Step 4「完成註冊」共用的大型
 * 表單，對應舊站 p02.html（可填寫）／p03.html（唯讀檢視+確認送出）。
 *
 * 2026-10-01 接真的註冊 API：
 * - `mode="edit"`（Step3）現在是真的受控表單，「同意，下一步」會先
 *   呼叫 `POST /api/Applications` 建立草稿、依序上傳已選擇的文件，
 *   成功後才帶著 `applicationId` 導去 Step4；任何一步失敗都停在原地
 *   顯示錯誤，不會跳頁。
 * - `mode="review"`（Step4）不再是寫死的示範假資料——改成接收
 *   `application` prop（由 `complete/page.tsx` 這個 Server Component
 *   先用 `applicationId` 查詢真實申請資料後傳進來），畫面顯示的是
 *   使用者剛剛實際填寫的內容；「確認送出」呼叫
 *   `POST /api/Applications/{id}/submit` 把申請從草稿變成待審核，
 *   成功才跳出「完成註冊」彈窗（用 `window.bootstrap.Modal` 手動
 *   觸發，因為這個跳出時機現在取決於 API 呼叫結果，不能再用純
 *   `data-bs-toggle` 靜態觸發）。
 * - LOGO／成立日期／資本總額／公司網址／公司簡介／主要產品／標籤／
 *   應用情境／應用範疇／智慧技術／獲獎事蹟／工廠名稱／工廠地址／
 *   公司電話這些欄位，目前後端 `CreateApplicationRequest`／
 *   `MemberApplication` 完全沒有對應欄位可以承接（它們屬於審核通過
 *   後才編輯的「公司專頁」資料，或者根本還沒有後端欄位，例如工廠
 *   名稱/地址）——這裡維持畫面存在但不接真資料，等後端補欄位再回來
 *   接，不是忘記做。公司地址的「縣市／鄉鎮市區」兩個下拉也只是
 *   還沒換真的行政區清單的假選項，一樣先不送出，只送「地址」那欄
 *   自由文字。
 * - 「產業別」原本是一個只有 2 個假選項（value="1"/"2"）的下拉選單，
 *   後端欄位其實是自由文字——改成文字輸入框，不然送出去的資料會是
 *   毫無意義的 "1"/"2" 字串。
 *
 * 2026-09-10 對照官方《會員申請須知》＋使用者提供的「會員申請欄位
 * 總表」重新設計：原本這支表單不分類型、所有人看到一模一樣的巨大
 * 表單——現在依 `applicantType`／`companyRole`／`tier`（Step2 帶過來
 * 的 query string，見 `register/info/page.tsx`）決定欄位範圍。
 */
export default function MemberDetailsForm({
  mode,
  nextHrefBase,
  onSubmitLabel,
  applicantType = "company",
  companyRole = "supply",
  tier = "emerging",
  application,
}: {
  mode: "edit" | "review";
  /** `mode="edit"` 專用：送出成功後導去 Step4 的網址，`applicationId` 會自動帶在後面 */
  nextHrefBase?: string;
  onSubmitLabel: string;
  applicantType?: ApplicantType;
  companyRole?: CompanyRole;
  tier?: SupplierTier;
  /** `mode="review"` 專用：Step4 要顯示的真實申請資料（由 page.tsx 先查好傳進來） */
  application?: ApplicationResponse;
}) {
  const router = useRouter();
  const disabled = mode === "review";
  const requiredMark = mode === "edit" ? REQUIRED : null;
  const isCompany = applicantType === "company";
  const isSupplier = isCompany && companyRole === "supply";
  const isDemand = isCompany && companyRole === "demand";
  const reviewMethod = getReviewMethodLabel(applicantType, companyRole, tier);
  const profileMark = mode === "edit" && isSupplier ? REQUIRED : null;

  // ---- Step3（mode="edit"）表單狀態 ----
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [position, setPosition] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [unifiedSocialCreditCode, setUnifiedSocialCreditCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [docs, setDocs] = useState<DocumentSlots>({ companyRegistration: null, capability: null, application: null, other: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  // ---- Step4（mode="review"）送出狀態 ----
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string>();

  function validateEditForm(): string | null {
    if (!email || !password || !confirmPassword || !contactName || !phone || !companyName || !industry || !position) {
      return "請完整填寫必填欄位";
    }
    if (password !== confirmPassword) {
      return "兩次密碼輸入不一致";
    }
    if (isCompany) {
      if (!contactPerson || !unifiedSocialCreditCode || !companyAddress) {
        return "請完整填寫公司資料必填欄位";
      }
      if (isDemand && !docs.companyRegistration) {
        return "請上傳工廠登記證明文件";
      }
      if (isSupplier && !docs.companyRegistration) {
        return "請上傳公司登記證明文件";
      }
      if (isSupplier && tier === "excellent" && !docs.capability) {
        return "請上傳技術服務能量/相關登錄證明";
      }
      if (isSupplier && tier === "emerging" && !docs.application) {
        return "請上傳智慧工安技術產業資訊暨媒合平台登錄申請書";
      }
    }
    if (!consentChecked) {
      return "請詳細閱讀並勾選個人資料同意書";
    }
    return null;
  }

  async function handleEditSubmit() {
    const validationError = validateEditForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      const request: CreateApplicationRequest = {
        applicantType: applicantType === "individual" ? ApplicantTypeEnum.Individual : ApplicantTypeEnum.Company,
        memberRole: applicantType === "individual" ? MemberRole.None : companyRole === "demand" ? MemberRole.Buyer : MemberRole.Supplier,
        supplierTier: isSupplier ? (tier === "excellent" ? CompanyLevel.Excellent : CompanyLevel.Emerging) : undefined,
        unifiedSocialCreditCode: isCompany ? unifiedSocialCreditCode : undefined,
        contactPerson: isCompany ? contactPerson : undefined,
        companyName,
        industry,
        companyAddress: isCompany ? companyAddress : undefined,
        members: [
          {
            contactName,
            position,
            email,
            phone,
            mobilePhone: mobilePhone || undefined,
            password,
            confirmPassword,
            memberPosition: 1,
            orderIndex: 0,
          },
        ],
      };

      const created = await applicationsApi.create(request);

      const uploads: Array<{ type: number; file: File }> = [];
      if (isCompany) {
        if (docs.companyRegistration) uploads.push({ type: DocumentType.CompanyRegistration, file: docs.companyRegistration });
        if (isSupplier && tier === "excellent" && docs.capability) {
          uploads.push({ type: DocumentType.TechnicalCapability, file: docs.capability });
        }
        if (isSupplier && tier === "emerging" && docs.application) {
          uploads.push({ type: DocumentType.Application, file: docs.application });
        }
      }
      if (docs.other) uploads.push({ type: DocumentType.Other, file: docs.other });
      uploads.push({ type: DocumentType.PersonalDataConsent, file: buildConsentAcknowledgementFile(contactName) });

      for (const upload of uploads) {
        await applicationsApi.uploadDocument({ applicationId: created.id, type: upload.type as DocumentType, file: upload.file });
      }

      const separator = nextHrefBase?.includes("?") ? "&" : "?";
      router.push(`${nextHrefBase ?? "/member/register/complete"}${separator}applicationId=${created.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "送出申請失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReviewSubmit() {
    if (!application) return;
    setReviewError(undefined);
    setReviewSubmitting(true);
    try {
      await applicationsApi.submit(application.id, { applicationId: application.id });
      const win = window as unknown as { bootstrap?: { Modal: { getOrCreateInstance: (el: Element) => { show: () => void } } } };
      const modalEl = document.getElementById("staticmembership");
      if (win.bootstrap && modalEl) {
        win.bootstrap.Modal.getOrCreateInstance(modalEl).show();
      }
    } catch (err) {
      setReviewError(getApiErrorMessage(err, "送出申請失敗，請稍後再試"));
    } finally {
      setReviewSubmitting(false);
    }
  }

  // mode="review" 顯示用的唯讀值：有真實 application 資料就用真的，
  // 沒有（例如直接訪問網址、沒帶 applicationId）就留空，不再用假資料
  // 假裝「這是你剛剛填的」。
  const reviewMember = application?.members?.[0];
  const reviewValue = (value: string | number | undefined | null) => (value === undefined || value === null ? "" : String(value));

  return (
    <>
      <h3 className="mb-4 me_sho">
        帳號註冊{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">
            {requiredMark}電子郵件(登入帳號)
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入電子郵件"
            value={disabled ? reviewValue(application?.email) : email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}會員密碼</label>
          <PasswordField disabled={disabled} defaultValue={disabled ? "********" : undefined} value={disabled ? undefined : password} onChange={disabled ? undefined : setPassword} />
        </div>

        {mode === "edit" && (
          <div className="menb_inp_tit form-group">
            <label className="mb-2">{REQUIRED}確認密碼</label>
            <PasswordField label="確認密碼" placeholder="請輸入確認密碼" value={confirmPassword} onChange={setConfirmPassword} />
          </div>
        )}
      </div>

      <h3 className="mb-4 me_sho mt-4">
        個人資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}姓名</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入姓名"
            value={disabled ? reviewValue(reviewMember?.contactName) : contactName}
            onChange={(e) => setContactName(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}聯絡電話</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入聯絡電話"
            value={disabled ? reviewValue(reviewMember?.phone) : phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}手機</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入手機"
            value={disabled ? reviewValue(reviewMember?.mobilePhone) : mobilePhone}
            onChange={(e) => setMobilePhone(e.target.value)}
            disabled={disabled}
          />
        </div>

        {/* 2026-09-10：這三個欄位所有人都要填，含個人會員——見上面
            元件說明的官方文件引述。 */}
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}所屬公司名稱</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入所屬公司名稱"
            value={disabled ? reviewValue(application?.companyName) : companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}產業別</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入產業別"
            value={disabled ? reviewValue(application?.industry) : industry}
            onChange={(e) => setIndustry(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}職稱</label>
          <input
            type="text"
            className="form-control"
            placeholder="請輸入職稱"
            value={disabled ? reviewValue(reviewMember?.position) : position}
            onChange={(e) => setPosition(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* 2026-09-10：企業會員專屬的公司登記基本資料（負責人/統編/
          電話/地址）——個人會員不用填這幾項，只需要上面「個人資料」
          那三個欄位就夠。 */}
      {isCompany && (
        <>
          <h3 className="mb-4 me_sho mt-4">
            公司資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
          </h3>
          <div className="menb_inp_box d-flex">
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{requiredMark}公司負責人姓名</label>
              <input
                type="text"
                className="form-control"
                placeholder="請輸入公司負責人姓名"
                value={disabled ? reviewValue(application?.contactPerson) : contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{requiredMark}統一編號</label>
              <input
                type="text"
                className="form-control"
                placeholder="請輸入統一編號"
                value={disabled ? reviewValue(application?.unifiedSocialCreditCode) : unifiedSocialCreditCode}
                onChange={(e) => setUnifiedSocialCreditCode(e.target.value)}
                disabled={disabled}
              />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">公司電話</label>
              <input type="text" className="form-control" placeholder="公司電話（暫不送出，等公司專頁功能開放後再編輯）" disabled />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{requiredMark}公司地址</label>
              <div className="col-12 col-sm">
                <div className="row g-2">
                  <div className="col-6 mb-md-0 mb-2">
                    <select className="form-select" aria-label="縣市" disabled defaultValue="縣/市">
                      <option>縣/市</option>
                      <option value="1">基隆市</option>
                      <option value="2">台北市</option>
                    </select>
                  </div>
                  <div className="col-6 mb-md-0 mb-2">
                    <select className="form-select" aria-label="鄉鎮市區" disabled defaultValue="鄉/鎮/區">
                      <option>鄉/鎮/區</option>
                      <option value="1">中正區</option>
                      <option value="2">信義區</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="請輸入完整地址"
                      value={disabled ? reviewValue(application?.companyAddress) : companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2026-09-10：LOGO／成立日期／資本總額／公司網址／公司
                簡介——需求端、供給端都顯示，差別只在必填星號
                （`profileMark`：供給端必填、需求端選填）。這批欄位屬於
                「公司專頁」資料，後端審核通過後才有 Company 記錄可以
                編輯，註冊申請階段還沒有地方可以存，暫不送出。 */}
            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}LOGO圖像</label>
              {disabled ? (
                <div className="menb_logo">
                  <img className="img-fluid d-block" src={withBasePath("/images/all/menb_logo.jpg")} alt="" style={{ width: 200, height: 200 }} />
                </div>
              ) : (
                <DocumentUploadField label="LOGO" mode="edit" hint="上傳格式支援影像檔，最大上限10MB。（暫不送出，等公司專頁功能開放後再編輯）" />
              )}
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{profileMark}成立日期</label>
              <input type="text" placeholder="開始日期（暫不送出）" id="startDate" className="form-control areadrp sideByside" disabled />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{profileMark}資本總額</label>
              <input type="text" className="form-control" placeholder="資本總額（暫不送出）" disabled />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}公司網址</label>
              <input type="text" className="form-control" placeholder="公司網址（暫不送出）" disabled />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}公司簡介</label>
              <textarea className="form-control" rows={5} disabled placeholder="公司簡介（暫不送出）" />
            </div>

            {/* 2026-09-10：這一段（主要產品／標籤／應用情境/範疇／
                智慧技術／獲獎事蹟）只有供給端才顯示——需求端在總表裡
                這幾列全部是「—」，不是選填，是整段都不用出現。同樣
                屬於「公司專頁」資料，暫不送出。 */}
            {isSupplier && (
              <>
                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}主要產品暨服務</label>
                  <select className="form-select" aria-label="請選擇" disabled defaultValue="請選擇">
                    <option>請選擇</option>
                  </select>
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}標籤</label>
                  <input type="text" className="form-control" placeholder="請輸入標籤，多個標籤請以逗號分隔（暫不送出）" disabled />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}應用情境(可多選)</label>
                  <ChecklistGroup idPrefix="fxContext" options={APPLICATION_SCENARIOS} disabled threeColumn />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}應用範疇(可多選)</label>
                  <ChecklistGroup idPrefix="fxScope" options={APPLICATION_SCOPES} disabled />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}智慧技術(可多選)</label>
                  <SmartTechSelector disabled />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">獲獎事蹟暨重要合作案例</label>
                  <input type="text" className="form-control" placeholder="請輸入獲獎事蹟暨重要合作案例（暫不送出）" disabled />
                </div>
              </>
            )}

            {isDemand && (
              <>
                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}工廠名稱</label>
                  <input type="text" className="form-control" placeholder="請輸入工廠名稱（暫不送出，後端尚未提供對應欄位）" disabled />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}工廠地址</label>
                  <div className="col-12 col-sm">
                    <div className="row g-2">
                      <div className="col-6 mb-md-0 mb-2">
                        <select className="form-select" aria-label="縣市" disabled defaultValue="縣/市">
                          <option>縣/市</option>
                          <option value="1">基隆市</option>
                          <option value="2">台北市</option>
                        </select>
                      </div>
                      <div className="col-6 mb-md-0 mb-2">
                        <select className="form-select" aria-label="鄉鎮市區" disabled defaultValue="鄉/鎮/區">
                          <option>鄉/鎮/區</option>
                          <option value="1">中正區</option>
                          <option value="2">信義區</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <input type="text" className="form-control" placeholder="地址（暫不送出，後端尚未提供對應欄位）" disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* 2026-09-10：上傳文件依審核路徑換成對應的證明文件——需求端傳
          「工廠登記證明文件」、供給端傳「公司登記證明文件」＋依卓越/
          新興換證明文件；兩種登記文件底層是同一個後端
          `DocumentType.CompanyRegistration`（見 docs/改版規劃.md），
          這裡只是依角色顯示不同標題，不是兩個獨立後端欄位。 */}
      {isCompany && (
        <>
          <h3 className="mb-4 me_sho mt-md-5 mt-4">
            上傳文件{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
          </h3>
          <div className="menb_inp_tit form-group w-100">
            <div className="d-flex dow-document">
              {isDemand && (
                <DocumentUploadField
                  label="工廠登記證明文件"
                  required
                  mode={mode}
                  selectedFileName={docs.companyRegistration?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, companyRegistration: file }))}
                />
              )}
              {isSupplier && (
                <DocumentUploadField
                  label="公司登記證明文件"
                  required
                  mode={mode}
                  selectedFileName={docs.companyRegistration?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, companyRegistration: file }))}
                />
              )}
              {isSupplier && tier === "excellent" && (
                <DocumentUploadField
                  label="技術服務能量/相關登錄證明"
                  required
                  mode={mode}
                  selectedFileName={docs.capability?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, capability: file }))}
                />
              )}
              {isSupplier && tier === "emerging" && (
                <DocumentUploadField
                  label="智慧工安技術產業資訊暨媒合平台登錄申請書"
                  required
                  mode={mode}
                  selectedFileName={docs.application?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, application: file }))}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* 2026-09-10：其他佐證文件所有人都顯示（含個人會員），選填。 */}
      <h3 className="mb-4 me_sho mt-md-5 mt-4">其他佐證文件</h3>
      <div className="menb_inp_tit form-group w-100">
        <div className="d-flex dow-document">
          <DocumentUploadField
            label="如營業登記證明、證書等"
            mode={mode}
            selectedFileName={docs.other?.name}
            onFileSelected={(file) => setDocs((prev) => ({ ...prev, other: file }))}
          />
        </div>
      </div>

      <div className="review_box">
        <label>審查方式</label>
        <div className="review_box_r">
          <span>{reviewMethod}</span>
        </div>
      </div>

      {mode === "edit" && (
        <div className="checkbox d-flex mb-3">
          <label className="relative">
            <input
              type="checkbox"
              aria-label="同意已充分知悉告知事項"
              title="本人已充分知悉貴署上述告知事項"
              className="form-check-input peer me-1"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
            />
          </label>
          <span>
            我已詳細閱讀「
            <a href="#" data-bs-toggle="modal" data-bs-target="#staticmembership" className="blue text-decoration-underline" title="我已詳細閱讀個人資料同意書">
              個人資料同意書
            </a>
            」
          </span>
        </div>
      )}

      {mode === "edit" && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {mode === "review" && reviewError && (
        <div className="alert alert-danger" role="alert">
          {reviewError}
        </div>
      )}

      <div className="card-footer d-flex justify-content-between">
        <Link className="btn-outline-dark" href={mode === "edit" ? "/member/register/account" : "/member/register/info"} title="上一步">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>上一步
        </Link>
        {mode === "edit" ? (
          <button type="button" className="btn-theme" onClick={handleEditSubmit} disabled={submitting} title={onSubmitLabel}>
            {submitting ? "送出中…" : onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        ) : (
          <button type="button" className="btn-theme" onClick={handleReviewSubmit} disabled={reviewSubmitting || !application} title={onSubmitLabel}>
            {reviewSubmitting ? "送出中…" : onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </button>
        )}
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { applicationsApi } from "@/lib/api/applications";
import { getApiErrorMessage } from "@/lib/error-utils";
import { DocumentType } from "@/types/api";
import { ApplicantType, CompanyLevel, MemberRole, type CreateApplicationRequest } from "@/types/application";
import CompanyRoleTierSelector, { type CompanyRoleTierSelection } from "@/components/member/CompanyRoleTierSelector";
import DocumentUploadField from "@/components/member/DocumentUploadField";

const REQUIRED = (
  <span className="red me-1" aria-hidden="true">
    *
  </span>
);

interface DocumentSlots {
  companyRegistration: File | null;
  capability: File | null;
  application: File | null;
  other: File | null;
}

/**
 * 積木元件：會員中心「權益升級」面板——個人會員升級成企業會員
 * （對應 PDF「(四)個人會員升級企業會員」、`docs/改版規劃.md` 952-981
 * 行的升級欄位規格）。
 *
 * 2026-10-02 這是這個面板第一次真的做出來（`MemberCenterNav.tsx`
 * 的 `upgrade` 項目先前只是「即將推出」佔位內容）。設計上跟
 * `MemberDetailsForm.tsx`（全新註冊的 Step3）共用同一套後端
 * 概念——都是送出一筆 `MemberApplication`，差別只在這裡會帶
 * `existingMemberId`（目前登入會員的 id），審核通過後端會**更新**
 * 這個既有會員，不是新建帳號（見
 * `ApplicationReviewService.CreateMemberAndCompanyAsync` 的升級分支）。
 *
 * 跟全新註冊不同的地方：
 * - 終點只會是「企業會員」（需求端／供給端-卓越／供給端-新興），不會
 *   有「個人會員」選項——已經是個人會員才會看到這個面板，沒有「升級
 *   成個人會員」這回事。
 * - 姓名／電子郵件「沿用個人會員資料」，不重新輸入（唯讀顯示目前
 *   登入會員的資料）；密碼欄位還是必填（對照官方欄位總表），但後端
 *   升級分支不會真的覆蓋既有密碼，純粹是這張申請表單 DTO 的必填欄位
 *   （`ApplicationMemberDto.password`），不影響使用者目前的登入密碼。
 * - 已經是企業會員（`member.companyId` 有值）的話，這個面板不適用
 *   （`docs/改版規劃.md` 標記「企業-需求端想同時做供給端」這條升級邊
 *   還沒確認，這次不處理），顯示提示訊息，不顯示表單。
 *
 * 需求/供給＋3 題問答沿用 `CompanyRoleTierSelector.tsx`（跟註冊 Step2
 * 共用同一份邏輯，不是另外設計一套判斷規則）。
 *
 * 跟 `MemberDetailsForm.tsx` 一樣：LOGO／成立日期／資本總額／公司
 * 網址／公司簡介／主要產品／標籤／應用情境／應用範疇／智慧技術／
 * 獲獎事蹟／工廠名稱／工廠地址／公司電話後端目前沒有對應欄位可以
 * 承接，不接真資料。
 */
export default function UpgradePanel() {
  const { member } = useAuthStore();

  const [roleTier, setRoleTier] = useState<CompanyRoleTierSelection | null>(null);
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [mobilePhone, setMobilePhone] = useState(member?.mobilePhone ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState(member?.companyName ?? "");
  const [industry, setIndustry] = useState("");
  const [position, setPosition] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [unifiedSocialCreditCode, setUnifiedSocialCreditCode] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [docs, setDocs] = useState<DocumentSlots>({ companyRegistration: null, capability: null, application: null, other: null });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [submittedApplicationNumber, setSubmittedApplicationNumber] = useState<string>();

  if (!member) return null;

  if (member.companyId) {
    return (
      <p className="text-muted">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        您目前已經是企業會員（{member.companyName}），沒有可申請的權益升級項目。
      </p>
    );
  }

  if (submittedApplicationNumber) {
    return (
      <p className="text-success">
        <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
        升級申請（{submittedApplicationNumber}）已送出，審核通過後會自動更新您的會員身份，請留意信箱通知。
      </p>
    );
  }

  const isSupplier = roleTier?.role === "supply";
  const isDemand = roleTier?.role === "demand";
  const tier = roleTier?.tier;

  function buildConsentAcknowledgementFile(): File {
    const content = `本人（${member!.name || "申請人"}）已於 ${new Date().toISOString()} 閱讀並同意個人資料告知事項及同意書。`;
    return new File([content], "personal-data-consent.txt", { type: "text/plain" });
  }

  function validate(): string | null {
    if (!roleTier) return "請選擇需求端或供給端";
    if (!phone || !password || !confirmPassword || !companyName || !industry || !position) {
      return "請完整填寫必填欄位";
    }
    if (password !== confirmPassword) return "兩次密碼輸入不一致";
    if (!contactPerson || !unifiedSocialCreditCode || !companyAddress) {
      return "請完整填寫公司資料必填欄位";
    }
    if (isDemand && !docs.companyRegistration) return "請上傳工廠登記證明文件";
    if (isSupplier && !docs.companyRegistration) return "請上傳公司登記證明文件";
    if (isSupplier && tier === "excellent" && !docs.capability) return "請上傳技術服務能量/相關登錄證明";
    if (isSupplier && tier === "emerging" && !docs.application) return "請上傳智慧工安技術產業資訊暨媒合平台登錄申請書";
    if (!consentChecked) return "請詳細閱讀並勾選個人資料同意書";
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(undefined);
    setSubmitting(true);
    try {
      const request: CreateApplicationRequest = {
        applicantType: ApplicantType.Company,
        existingMemberId: member!.id,
        memberRole: roleTier!.role === "demand" ? MemberRole.Buyer : MemberRole.Supplier,
        supplierTier: isSupplier ? (tier === "excellent" ? CompanyLevel.Excellent : CompanyLevel.Emerging) : undefined,
        unifiedSocialCreditCode,
        contactPerson,
        companyName,
        industry,
        companyAddress,
        members: [
          {
            contactName: member!.name,
            position,
            email: member!.email,
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
      if (docs.companyRegistration) uploads.push({ type: DocumentType.CompanyRegistration, file: docs.companyRegistration });
      if (isSupplier && tier === "excellent" && docs.capability) uploads.push({ type: DocumentType.TechnicalCapability, file: docs.capability });
      if (isSupplier && tier === "emerging" && docs.application) uploads.push({ type: DocumentType.Application, file: docs.application });
      if (docs.other) uploads.push({ type: DocumentType.Other, file: docs.other });
      uploads.push({ type: DocumentType.PersonalDataConsent, file: buildConsentAcknowledgementFile() });

      for (const upload of uploads) {
        await applicationsApi.uploadDocument({ applicationId: created.id, type: upload.type as DocumentType, file: upload.file });
      }

      await applicationsApi.submit(created.id, { applicationId: created.id });
      setSubmittedApplicationNumber(created.applicationNumber);
    } catch (err) {
      setError(getApiErrorMessage(err, "送出升級申請失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-muted mb-4">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        升級成企業會員後，姓名／電子郵件沿用您目前的會員資料，其餘公司相關資料請在下方填寫。
      </p>

      <CompanyRoleTierSelector onChange={setRoleTier} />

      {roleTier && (
        <>
          <h3 className="mb-4 me_sho mt-4">
            個人資料({REQUIRED}為必填欄位)
          </h3>
          <div className="menb_inp_box d-flex">
            <div className="menb_inp_tit form-group">
              <label className="mb-2">姓名</label>
              <input type="text" className="form-control" value={member.name} disabled />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">電子郵件(登入帳號)</label>
              <input type="text" className="form-control" value={member.email} disabled />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}密碼</label>
              <input type="password" className="form-control" placeholder="請輸入密碼" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}確認密碼</label>
              <input type="password" className="form-control" placeholder="請輸入確認密碼" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}聯絡電話</label>
              <input type="text" className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">手機</label>
              <input type="text" className="form-control" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}所屬公司名稱</label>
              <input type="text" className="form-control" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}產業別</label>
              <input type="text" className="form-control" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}職稱</label>
              <input type="text" className="form-control" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>

          <h3 className="mb-4 me_sho mt-4">
            公司資料({REQUIRED}為必填欄位)
          </h3>
          <div className="menb_inp_box d-flex">
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}公司負責人姓名</label>
              <input type="text" className="form-control" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{REQUIRED}統一編號</label>
              <input type="text" className="form-control" value={unifiedSocialCreditCode} onChange={(e) => setUnifiedSocialCreditCode(e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{REQUIRED}公司地址</label>
              <input type="text" className="form-control" placeholder="請輸入完整地址" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} />
            </div>
          </div>

          <h3 className="mb-4 me_sho mt-md-5 mt-4">
            上傳文件({REQUIRED}為必填欄位)
          </h3>
          <div className="menb_inp_tit form-group w-100">
            <div className="d-flex dow-document">
              {isDemand && (
                <DocumentUploadField
                  label="工廠登記證明文件"
                  required
                  mode="edit"
                  selectedFileName={docs.companyRegistration?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, companyRegistration: file }))}
                />
              )}
              {isSupplier && (
                <DocumentUploadField
                  label="公司登記證明文件"
                  required
                  mode="edit"
                  selectedFileName={docs.companyRegistration?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, companyRegistration: file }))}
                />
              )}
              {isSupplier && tier === "excellent" && (
                <DocumentUploadField
                  label="技術服務能量/相關登錄證明"
                  required
                  mode="edit"
                  selectedFileName={docs.capability?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, capability: file }))}
                />
              )}
              {isSupplier && tier === "emerging" && (
                <DocumentUploadField
                  label="智慧工安技術產業資訊暨媒合平台登錄申請書"
                  required
                  mode="edit"
                  selectedFileName={docs.application?.name}
                  onFileSelected={(file) => setDocs((prev) => ({ ...prev, application: file }))}
                />
              )}
              <DocumentUploadField
                label="其他佐證文件"
                mode="edit"
                selectedFileName={docs.other?.name}
                onFileSelected={(file) => setDocs((prev) => ({ ...prev, other: file }))}
              />
            </div>
          </div>

          <div className="checkbox d-flex mb-3 mt-4">
            <label className="relative">
              <input
                type="checkbox"
                aria-label="同意已充分知悉告知事項"
                className="form-check-input peer me-1"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
            </label>
            <span>我已詳細閱讀並同意「個人資料同意書」</span>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button type="button" className="tier-submit-btn" onClick={handleSubmit} disabled={submitting}>
            <span>{submitting ? "送出中…" : "送出升級申請"}</span>
          </button>
        </>
      )}
    </div>
  );
}

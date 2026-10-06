"use client";

import { useEffect, useState } from "react";
import TaiwanAddressSelector from "@/components/ui/TaiwanAddressSelector";
import ImageListEditor from "@/components/member/ImageListEditor";
import { getApiErrorMessage } from "@/lib/error-utils";
import { memberCompanyApi, type MemberCompany, type MemberCompanyImage, type MemberUpdateCompanyRequest } from "@/lib/api/member-company";

interface CompanyForm {
  englishName: string;
  phone: string;
  fax: string;
  orgUrl: string;
  videoUrl: string;
  establishmentDate: string;
  revenue: string;
  employees: string;
  introduction: string;
  charge: string;
  chargePhone: string;
  chargeEmail: string;
  postalCode: string;
  city: string;
  district: string;
  addressLine: string;
  factoryName: string;
  factoryAddress: string;
}

const text = (value?: string | null) => value ?? "";

function toForm(company: MemberCompany): CompanyForm {
  return {
    englishName: text(company.englishName),
    phone: text(company.phone),
    fax: text(company.fax),
    orgUrl: text(company.orgUrl),
    videoUrl: text(company.videoUrl),
    // `<input type="date">` 只收 yyyy-MM-dd，舊資料格式不符就留空（不會被改掉：沒改動的欄位不會送出）
    establishmentDate: /^\d{4}-\d{2}-\d{2}/.test(text(company.establishmentDate)) ? text(company.establishmentDate).slice(0, 10) : "",
    revenue: company.revenue != null ? String(company.revenue) : "",
    employees: company.employees != null ? String(company.employees) : "",
    introduction: text(company.introduction),
    charge: text(company.charge),
    chargePhone: text(company.chargePhone),
    chargeEmail: text(company.chargeEmail),
    postalCode: text(company.address?.postalCode),
    city: text(company.address?.city),
    district: text(company.address?.district),
    addressLine: text(company.address?.line),
    factoryName: text(company.factoryName),
    factoryAddress: text(company.factoryAddress),
  };
}

/** 只把有改動的欄位送給後端（沒改的不送，避免把格式特殊的舊資料誤清掉） */
function buildChanges(form: CompanyForm, original: CompanyForm): MemberUpdateCompanyRequest {
  const changes: MemberUpdateCompanyRequest = {};
  const strings = ["englishName", "phone", "fax", "orgUrl", "videoUrl", "establishmentDate", "introduction", "charge", "chargePhone", "chargeEmail", "factoryName", "factoryAddress"] as const;
  for (const key of strings) {
    if (form[key].trim() !== original[key].trim()) changes[key] = form[key].trim();
  }
  if (form.revenue.trim() !== original.revenue.trim() && form.revenue.trim() !== "") changes.revenue = Number(form.revenue.replace(/,/g, ""));
  if (form.employees.trim() !== original.employees.trim() && form.employees.trim() !== "") changes.employees = Number(form.employees.replace(/,/g, ""));
  if (form.postalCode !== original.postalCode || form.city !== original.city || form.district !== original.district || form.addressLine.trim() !== original.addressLine.trim()) {
    changes.address = { type: 0, postalCode: form.postalCode, city: form.city, district: form.district, line: form.addressLine.trim() };
  }
  return changes;
}

/**
 * 積木元件：會員中心「公司資料」面板——企業會員自己維護公司的基本資料與 LOGO，
 * 資料來自 `GET /api/member/company`、儲存走 `PUT /api/member/company`，兩者都以登入會員所屬的公司為準
 * （不是從網址帶公司 id，所以改不到別家公司）。
 *
 * 公司名稱、統一編號、審核狀態只能唯讀——這些是審核通過時確認的身分資料，要改得洽平台承辦單位（後台）。
 * 編輯需要「編輯公司資料」權限（經理才有），沒有權限時儲存會被後端擋下並顯示訊息。
 * 儲存後立即生效，前台企業名錄的企業詳情馬上會顯示新內容。
 */
export default function CompanyPanel() {
  const [company, setCompany] = useState<MemberCompany | null>(null);
  const [form, setForm] = useState<CompanyForm | null>(null);
  const [original, setOriginal] = useState<CompanyForm | null>(null);
  const [logo, setLogo] = useState<MemberCompanyImage[]>([]);
  const [originalLogoUri, setOriginalLogoUri] = useState<string>();
  const [logoChanged, setLogoChanged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  function applyCompany(data: MemberCompany) {
    setCompany(data);
    const next = toForm(data);
    setForm(next);
    setOriginal(next);
    const uri = data.photo?.uri ?? undefined;
    setOriginalLogoUri(uri);
    setLogo(uri ? [{ fileId: String(data.photo?.id ?? "logo"), fileName: "公司 LOGO", url: uri }] : []);
    setLogoChanged(false);
  }

  useEffect(() => {
    let mounted = true;
    memberCompanyApi
      .get()
      .then((data) => mounted && applyCompany(data))
      .catch((err) => mounted && setError(getApiErrorMessage(err, "載入公司資料失敗")))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  function update<K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setMessage(undefined);
  }

  async function handleSave() {
    if (!form || !original) return;
    if (form.revenue.trim() !== "" && !Number.isFinite(Number(form.revenue.replace(/,/g, "")))) {
      setError("資本總額請輸入數字");
      return;
    }
    if (form.employees.trim() !== "" && !Number.isInteger(Number(form.employees.replace(/,/g, "")))) {
      setError("員工人數請輸入整數");
      return;
    }

    const changes = buildChanges(form, original);
    if (logoChanged) {
      if (logo.length > 0) changes.logoFileId = logo[0].fileId;
      else changes.removeLogo = true;
    }
    if (Object.keys(changes).length === 0) {
      setMessage("沒有需要儲存的變更");
      return;
    }

    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const updated = await memberCompanyApi.update(changes);
      applyCompany(updated);
      setMessage("已儲存，前台企業詳情已更新");
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 403 ? "您的帳號沒有編輯公司資料的權限（只有經理可以編輯）。" : getApiErrorMessage(err, "儲存失敗，請稍後再試"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-muted">載入中…</p>;

  if (error && !company) {
    return (
      <p className="text-danger">
        <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
        {error.includes("沒有關聯公司") ? "您還不是企業會員，沒有公司資料可以維護。" : error}
      </p>
    );
  }

  if (!company || !form) return null;

  const showFactory = company.type === 2 || company.type === 3;

  return (
    <div>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">公司名稱</label>
          <input type="text" className="form-control" value={company.name} disabled />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">統一編號</label>
          <input type="text" className="form-control" value={company.unifiedSocialCreditCode} disabled />
        </div>
        <div className="menb_inp_tit form-group w-100">
          <p className="small text-muted mb-0">
            公司名稱與統一編號是審核時確認的資料，無法自行修改，需要更正請洽平台承辦單位。
            {company.isVerified ? "（已通過審核）" : "（尚未通過審核，前台企業名錄暫時不會顯示）"}
          </p>
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">英文名稱</label>
          <input type="text" className="form-control" value={form.englishName} onChange={(e) => update("englishName", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">公司電話</label>
          <input type="text" className="form-control" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">傳真</label>
          <input type="text" className="form-control" value={form.fax} onChange={(e) => update("fax", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">成立日期</label>
          <input type="date" className="form-control" value={form.establishmentDate} onChange={(e) => update("establishmentDate", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">資本總額（新臺幣元）</label>
          <input type="text" inputMode="numeric" className="form-control" value={form.revenue} onChange={(e) => update("revenue", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">員工人數</label>
          <input type="text" inputMode="numeric" className="form-control" value={form.employees} onChange={(e) => update("employees", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">公司網址</label>
          <input type="text" className="form-control" placeholder="https://" value={form.orgUrl} onChange={(e) => update("orgUrl", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">介紹影片網址</label>
          <input type="text" className="form-control" placeholder="https://www.youtube.com/watch?v=..." value={form.videoUrl} onChange={(e) => update("videoUrl", e.target.value)} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">公司地址</label>
          <TaiwanAddressSelector
            idPrefix="member-company"
            postalCodeValue={form.postalCode}
            cityValue={form.city}
            districtValue={form.district}
            addressLine1Value={form.addressLine}
            onPostalCodeChange={(postalCode, city, district) => setForm((prev) => (prev ? { ...prev, postalCode, city, district } : prev))}
            onCityChange={(city) => setForm((prev) => (prev ? { ...prev, city, district: "", postalCode: "" } : prev))}
            onDistrictChange={(district, postalCode) => setForm((prev) => (prev ? { ...prev, district, postalCode } : prev))}
            onAddressLine1Change={(addressLine) => update("addressLine", addressLine)}
          />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">公司簡介</label>
          <textarea className="form-control" rows={6} maxLength={2000} value={form.introduction} onChange={(e) => update("introduction", e.target.value)} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">LOGO圖像</label>
          <ImageListEditor
            images={logo}
            single
            onChange={(images) => {
              setLogo(images);
              setLogoChanged(images.map((i) => i.url).join() !== (originalLogoUri ?? ""));
              setMessage(undefined);
            }}
          />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">負責人姓名</label>
          <input type="text" className="form-control" value={form.charge} onChange={(e) => update("charge", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">負責人電話</label>
          <input type="text" className="form-control" value={form.chargePhone} onChange={(e) => update("chargePhone", e.target.value)} />
        </div>
        <div className="menb_inp_tit form-group">
          <label className="mb-2">負責人信箱</label>
          <input type="text" className="form-control" value={form.chargeEmail} onChange={(e) => update("chargeEmail", e.target.value)} />
        </div>

        {showFactory && (
          <>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">工廠名稱</label>
              <input type="text" className="form-control" value={form.factoryName} onChange={(e) => update("factoryName", e.target.value)} />
            </div>
            <div className="menb_inp_tit form-group">
              <label className="mb-2">工廠地址</label>
              <input type="text" className="form-control" value={form.factoryAddress} onChange={(e) => update("factoryAddress", e.target.value)} />
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="alert alert-success mt-3" role="status">
          {message}
        </div>
      )}

      <button type="button" className="tier-submit-btn mt-3" onClick={handleSave} disabled={saving}>
        <span>{saving ? "儲存中…" : "儲存公司資料"}</span>
      </button>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import DocumentUploadField, { DocumentPreview, type DocumentPreviewData } from "@/components/member/DocumentUploadField";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import { splitTagsByKind, type TagTaxonomy } from "@/lib/company-tags";
import { withBasePath } from "@/lib/api-client";
import TaiwanAddressSelector from "@/components/ui/TaiwanAddressSelector";
import type { ProfileState } from "@/lib/company-profile";

const REQUIRED = (
  <span className="red me-1" aria-hidden="true">
    *
  </span>
);

/**
 * 積木元件：註冊（`MemberDetailsForm`）與權益升級（`UpgradePanel`）共用的「公司專頁資料」欄位——
 * 公司電話、公司地址（縣市／鄉鎮區下拉）、LOGO、成立日期、資本總額、公司網址、公司簡介；
 * 供給端另有主要產品暨服務、標籤（應用情境／應用範疇／智慧技術）、獲獎事蹟；需求端另有工廠名稱與地址。
 *
 * 2026-10-06：原本這些欄位都是「暫不送出」的灰色假欄位，現在是真的受控欄位，送出時跟著申請存進後端，
 * 審核通過後帶進公司資料（企業名錄的企業詳情就是顯示這些）。標籤的選項來自後台「分類管理」的企業標籤
 * （`useTagTaxonomy`），不再寫死。`readOnly`（Step 4 檢視）時全部唯讀，標籤顯示成名稱。
 *
 * 必填星號：電話與地址所有企業必填；LOGO／成立日期／資本總額／網址／簡介（`profileMark`）供給端必填、需求端選填；
 * 供給端的主要產品與三組標籤必填、獲獎事蹟選填；需求端的工廠名稱與地址必填（對照欄位總表）。
 */
export default function CompanyProfileFields({
  value,
  onChange,
  readOnly,
  isSupplier,
  isDemand,
  taxonomy,
  logoPreview,
}: {
  value: ProfileState;
  onChange: (patch: Partial<ProfileState>) => void;
  readOnly?: boolean;
  isSupplier: boolean;
  isDemand: boolean;
  /** 唯讀檢視（註冊第 4 步）時顯示的已上傳 LOGO；沒有代表沒上傳 */
  logoPreview?: DocumentPreviewData | null;
  taxonomy: TagTaxonomy;
}) {
  const requiredMark = readOnly ? null : REQUIRED;
  const profileMark = !readOnly && isSupplier ? REQUIRED : null;
  const checked = Object.fromEntries(value.tagIds.map((id) => [String(id), true]));

  function toggleTag(rawId: string) {
    const id = Number(rawId);
    onChange({ tagIds: value.tagIds.includes(id) ? value.tagIds.filter((x) => x !== id) : [...value.tagIds, id] });
  }

  const selectedTags = splitTagsByKind(value.tagIds, taxonomy);

  const checklist = (title: string, tags: { id: number; name: string }[], selected: { id: number; name: string }[], idPrefix: string, threeColumn?: boolean): ReactNode => (
    <div className="menb_inp_tit form-group w-100">
      <label className="mb-2">
        {requiredMark}
        {title}(可多選)
      </label>
      {readOnly ? (
        <p className="mb-0">{selected.length > 0 ? selected.map((t) => t.name).join("、") : "—"}</p>
      ) : (
        <div className={threeColumn ? "project_fx project_three d-flex" : "project_fx d-flex"}>
          {tags.map((tag) => {
            const inputId = `${idPrefix}_${tag.id}`;
            return (
              <div className="form-check" key={tag.id}>
                <input className="form-check-input" type="checkbox" id={inputId} checked={Boolean(checked[String(tag.id)])} onChange={() => toggleTag(String(tag.id))} />
                <label className="form-check-label" htmlFor={inputId}>
                  {tag.name}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="menb_inp_tit form-group">
        <label className="mb-2" htmlFor="profile-phone">
          {requiredMark}公司電話
        </label>
        <input id="profile-phone" type="text" className="form-control" placeholder="請輸入公司電話" value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} disabled={readOnly} />
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">{requiredMark}公司地址</label>
        <div className="col-12 col-sm">
          <TaiwanAddressSelector
            idPrefix="company"
            postalCodeValue={value.postalCode}
            cityValue={value.city}
            districtValue={value.district}
            addressLine1Value={value.address}
            onPostalCodeChange={(postalCode, city, district) => onChange({ postalCode, city, district })}
            onCityChange={(city) => onChange({ city, district: "", postalCode: "" })}
            onDistrictChange={(district, postalCode) => onChange({ district, postalCode })}
            onAddressLine1Change={(address) => onChange({ address })}
            addressPlaceholder="請輸入詳細地址（路名、門牌、樓層）"
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">{profileMark}LOGO圖像</label>
        {readOnly ? (
          <div className="menb_logo">
            <DocumentPreview data={logoPreview} alt="公司 LOGO" />
          </div>
        ) : (
          <DocumentUploadField
            label="LOGO"
            mode="edit"
            hint="上傳格式支援 JPG、PNG、SVG 等影像檔，最大上限10MB。"
            selectedFileName={value.logo?.name}
            onFileSelected={(file) => onChange({ logo: file })}
          />
        )}
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2" htmlFor="profile-established">
          {profileMark}成立日期
        </label>
        <input id="profile-established" type="date" className="form-control" value={value.establishmentDate} onChange={(e) => onChange({ establishmentDate: e.target.value })} disabled={readOnly} />
      </div>

      <div className="menb_inp_tit form-group">
        <label className="mb-2" htmlFor="profile-revenue">
          {profileMark}資本總額（新臺幣元）
        </label>
        <input id="profile-revenue" type="text" inputMode="numeric" className="form-control" placeholder="例如 5000000" value={value.revenue} onChange={(e) => onChange({ revenue: e.target.value })} disabled={readOnly} />
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2" htmlFor="profile-orgurl">
          {profileMark}公司網址
        </label>
        <input id="profile-orgurl" type="text" className="form-control" placeholder="https://" value={value.orgUrl} onChange={(e) => onChange({ orgUrl: e.target.value })} disabled={readOnly} />
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2" htmlFor="profile-intro">
          {profileMark}公司簡介
        </label>
        <textarea id="profile-intro" className="form-control" rows={5} maxLength={2000} placeholder="請輸入公司簡介" value={value.introduction} onChange={(e) => onChange({ introduction: e.target.value })} disabled={readOnly} />
      </div>

      {isSupplier && (
        <>
          <div className="menb_inp_tit form-group w-100">
            <label className="mb-2" htmlFor="profile-subject">
              {requiredMark}主要產品暨服務
            </label>
            <input id="profile-subject" type="text" className="form-control" maxLength={500} placeholder="請輸入主要產品暨服務" value={value.subject} onChange={(e) => onChange({ subject: e.target.value })} disabled={readOnly} />
          </div>

          {checklist("應用情境", taxonomy.scenarios, selectedTags.scenario, "fxContext", true)}
          {checklist("應用範疇", taxonomy.scopes, selectedTags.scope, "fxScope")}

          <div className="menb_inp_tit form-group w-100">
            <label className="mb-2">
              {requiredMark}智慧技術(可多選)
            </label>
            {readOnly ? (
              <p className="mb-0">{selectedTags.tech.length > 0 ? selectedTags.tech.map((t) => t.name).join("、") : "—"}</p>
            ) : (
              <TechAttributeSelector groups={taxonomy.techGroups} name="register-tech" variant="checkboxes" checked={checked} onToggle={toggleTag} />
            )}
          </div>

          <div className="menb_inp_tit form-group w-100">
            <label className="mb-2" htmlFor="profile-award">
              獲獎事蹟暨重要合作案例
            </label>
            <textarea id="profile-award" className="form-control" rows={3} maxLength={2000} placeholder="請輸入獲獎事蹟暨重要合作案例" value={value.awardNote} onChange={(e) => onChange({ awardNote: e.target.value })} disabled={readOnly} />
          </div>
        </>
      )}

      {isDemand && (
        <>
          <div className="menb_inp_tit form-group w-100">
            <label className="mb-2" htmlFor="profile-factory-name">
              {requiredMark}工廠名稱
            </label>
            <input id="profile-factory-name" type="text" className="form-control" placeholder="請輸入工廠名稱" value={value.factoryName} onChange={(e) => onChange({ factoryName: e.target.value })} disabled={readOnly} />
          </div>

          <div className="menb_inp_tit form-group w-100">
            <label className="mb-2">{requiredMark}工廠地址</label>
            <div className="col-12 col-sm">
              <TaiwanAddressSelector
                idPrefix="factory"
                postalCodeValue={value.factoryPostalCode}
                cityValue={value.factoryCity}
                districtValue={value.factoryDistrict}
                addressLine1Value={value.factoryAddress}
                onPostalCodeChange={(factoryPostalCode, factoryCity, factoryDistrict) => onChange({ factoryPostalCode, factoryCity, factoryDistrict })}
                onCityChange={(factoryCity) => onChange({ factoryCity, factoryDistrict: "", factoryPostalCode: "" })}
                onDistrictChange={(factoryDistrict, factoryPostalCode) => onChange({ factoryDistrict, factoryPostalCode })}
                onAddressLine1Change={(factoryAddress) => onChange({ factoryAddress })}
                addressPlaceholder="請輸入詳細地址（路名、門牌）"
                disabled={readOnly}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

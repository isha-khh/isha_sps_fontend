"use client";

import { useEffect, useState } from "react";
import ImageListEditor from "@/components/member/ImageListEditor";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import { getApiErrorMessage } from "@/lib/error-utils";
import { splitTagsByKind, type TagTaxonomy } from "@/lib/company-tags";
import { memberCompanyApi, type MemberCompany, type MemberCompanyImage } from "@/lib/api/member-company";
import { useTagTaxonomy } from "@/lib/use-tag-taxonomy";

/**
 * 積木元件：會員中心「產品相關資訊」面板（供給端）——維護前台企業詳情頁「主要產品暨服務」與
 * 「獲獎事蹟暨重要合作案例」那兩區：主要產品暨服務的文字與示意圖、應用情境／應用範疇／智慧技術標籤、
 * 獲獎事蹟圖片與合作案例說明。資料與公司資料同一份（`/api/member/company`），標籤另走 `/api/member/company/tags`。
 *
 * 需求端（只有需求、沒有供給）沒有這些欄位，顯示說明文字；供需雙方的公司兩邊都有。
 * 儲存需要「編輯公司資料」權限（經理才有）；儲存後立即生效。
 */
export default function ProductPanel() {
  const { taxonomy } = useTagTaxonomy();
  const [company, setCompany] = useState<MemberCompany | null>(null);
  const [subject, setSubject] = useState("");
  const [note, setNote] = useState("");
  const [productImages, setProductImages] = useState<MemberCompanyImage[]>([]);
  const [awardImages, setAwardImages] = useState<MemberCompanyImage[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let mounted = true;
    Promise.all([memberCompanyApi.get(), memberCompanyApi.getTags().catch(() => [] as number[])])
      .then(([data, tags]) => {
        if (!mounted) return;
        setCompany(data);
        setSubject(data.subject ?? "");
        setNote(data.cooperationNote ?? "");
        setProductImages(data.productImages ?? []);
        setAwardImages(data.awardImages ?? []);
        setTagIds(tags);
      })
      .catch((err) => mounted && setError(getApiErrorMessage(err, "載入失敗")))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  function toggleTag(raw: string) {
    const id = Number(raw);
    setTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setMessage(undefined);
  }

  async function handleSave() {
    setSaving(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await memberCompanyApi.update({
        subject: subject.trim(),
        cooperationNote: note.trim(),
        productImageFileIds: productImages.map((i) => i.fileId),
        awardImageFileIds: awardImages.map((i) => i.fileId),
      });
      await memberCompanyApi.setTags(tagIds);
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
        {error.includes("沒有關聯公司") ? "您還不是企業會員，沒有產品資訊可以維護。" : error}
      </p>
    );
  }

  if (!company) return null;

  // CompanyType：1=供給端、2=需求端、3=供需雙方
  if (company.type === 2) {
    return (
      <p className="text-muted">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        產品相關資訊是供給端企業的資料（主要產品暨服務、標籤、獲獎事蹟）；您的公司是需求端，不需要填寫。
      </p>
    );
  }

  const selected = splitTagsByKind(tagIds, taxonomy);
  const checked = Object.fromEntries(tagIds.map((id) => [String(id), true]));

  const checklist = (title: string, tags: TagTaxonomy["scenarios"], idPrefix: string, threeColumn?: boolean) => (
    <div className="menb_inp_tit form-group w-100">
      <label className="mb-2">{title}(可多選)</label>
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
    </div>
  );

  return (
    <div>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2" htmlFor="member-subject">
            主要產品暨服務
          </label>
          <input id="member-subject" type="text" className="form-control" maxLength={500} value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">產品／服務示意圖</label>
          <ImageListEditor images={productImages} onChange={(images) => (setProductImages(images), setMessage(undefined))} />
        </div>

        {checklist("應用情境", taxonomy.scenarios, "mfxContext", true)}
        {checklist("應用範疇", taxonomy.scopes, "mfxScope")}

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">智慧技術(可多選)</label>
          <TechAttributeSelector groups={taxonomy.techGroups} name="member-tech" variant="checkboxes" checked={checked} onToggle={toggleTag} />
          <p className="small text-muted mt-2 mb-0">
            已勾選：應用情境 {selected.scenario.length} 項、應用範疇 {selected.scope.length} 項、智慧技術 {selected.tech.length} 項
          </p>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">獲獎事蹟暨重要合作案例圖片</label>
          <ImageListEditor images={awardImages} onChange={(images) => (setAwardImages(images), setMessage(undefined))} />
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2" htmlFor="member-note">
            合作案例說明
          </label>
          <textarea id="member-note" className="form-control" rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
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
        <span>{saving ? "儲存中…" : "儲存產品相關資訊"}</span>
      </button>
    </div>
  );
}

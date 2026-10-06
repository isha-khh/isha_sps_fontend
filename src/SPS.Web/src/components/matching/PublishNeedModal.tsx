"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/error-utils";
import type { TagTaxonomy } from "@/lib/company-tags";

/**
 * 積木元件：「媒合對接」列表頁「我要刊登」彈窗，對應設計稿
 * `page/matching/index.html` 的 `#staticmembership2`——需求標題／需求
 * 內容兩個文字欄位，加上 `page/matching/_uc/publish_s.html`（應用情境／
 * 應用範疇／智慧技術，可多選）。
 *
 * 2026-10-06 接上真後端：送出呼叫 `POST /api/Demand/submit`（只有登入的企業會員可以；沒登入時 axios 攔截器
 * 會導去登入頁）。送出的需求是未發布狀態，後台「需求張貼管理」審核（可修改內容）後才上架，所以成功訊息是
 * 「審核後上架」。三組標籤跟企業名錄篩選面板是同一份後台企業標籤（`fetchTagTaxonomy`，由頁面傳進來），
 * 後端用標籤 id 存。每個會員 24 小時內最多 5 筆。
 *
 * 這三組 checkbox 外面包一層 `.publish_s`：CSS 裡
 * `.matching .publish_s .project_fx .form-check` 專門把每個選項
 * 恢復成單純「checkbox+文字」（`background-color:unset; border-radius:0;
 * padding:0`），沒有這層外殼，`.form-check` 會吃到別處預設的卡片/格線
 * 樣式（背景色、邊框、3 欄網格），跟設計稿 `publish_s.html` 原本的
 * 平鋪版面對不起來。
 *
 * 「刊登」用 `<a>` 不是 `<button>`：`.btn-theme` 這個 class 在
 * `css/style.css` 只定義在 `.card-footer a.btn-theme`（綁 `<a>` 標籤
 * 的選擇器），`<button class="btn-theme">` 完全吃不到，會變成瀏覽器
 * 預設的裸按鈕樣式，見 `EnterpriseContactModal.tsx` 同一段說明。
 */
export default function PublishNeedModal({ id, taxonomy }: { id: string; taxonomy: TagTaxonomy }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // 三組標籤共用同一份勾選狀態，key 是標籤 id（字串）
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);

  function toggle(value: string) {
    setChecked((prev) => ({ ...prev, [value]: !prev[value] }));
  }

  const hasAny = (ids: string[]) => ids.some((tagId) => checked[tagId]);
  const techIds = taxonomy.techGroups.flatMap((group) => group.sections.flatMap((section) => section.options.map((option) => option.value)));

  async function submit() {
    if (submitting) return;
    setError(null);
    if (!title.trim()) return setError("請輸入需求標題");
    if (!hasAny(taxonomy.scenarios.map((tag) => String(tag.id)))) return setError("請至少選擇一個應用情境");
    if (!hasAny(taxonomy.scopes.map((tag) => String(tag.id)))) return setError("請至少選擇一個應用範疇");
    if (!hasAny(techIds)) return setError("請至少選擇一個智慧技術");
    if (!agreed) return setError("請勾選同意免責聲明");

    setSubmitting(true);
    try {
      const response = await apiClient.post<{ number: string }>("/api/Demand/submit", {
        name: title.trim(),
        introduction: content.trim() || null,
        tagIds: Object.entries(checked)
          .filter(([, on]) => on)
          .map(([tagId]) => Number(tagId)),
        agreed: true,
      });
      setSubmittedNumber(response.data.number);
      setTitle("");
      setContent("");
      setChecked({});
      setAgreed(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      setError(status === 403 ? "僅企業會員可以刊登需求。" : getApiErrorMessage(err, "刊登失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal id={id} title="我要刊登" dialogClassName="modal-dialog_w7">
      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-title`}>
          需求標題
        </label>
        <input
          id={`${id}-title`}
          type="text"
          className="form-control"
          title="請輸入需求標題"
          placeholder="請輸入需求標題"
          maxLength={200}
          required
          aria-required="true"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-content`}>
          需求內容
        </label>
        <textarea id={`${id}-content`} className="form-control" rows={5} maxLength={5000} value={content} onChange={(event) => setContent(event.target.value)} />
      </div>

      <div className="publish_s">
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>應用情境(可多選)
          </label>
          <div className="project_fx project_three d-flex flex-wrap">
            {taxonomy.scenarios.map((tag) => {
              const checkboxId = `${id}-scenario-${tag.id}`;
              return (
                <div className="form-check" key={tag.id}>
                  <input className="form-check-input" type="checkbox" id={checkboxId} checked={Boolean(checked[String(tag.id)])} onChange={() => toggle(String(tag.id))} />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    {tag.name}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>應用範疇(可多選)
          </label>
          <div className="project_fx d-flex flex-wrap">
            {taxonomy.scopes.map((tag) => {
              const checkboxId = `${id}-scope-${tag.id}`;
              return (
                <div className="form-check" key={tag.id}>
                  <input className="form-check-input" type="checkbox" id={checkboxId} checked={Boolean(checked[String(tag.id)])} onChange={() => toggle(String(tag.id))} />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    {tag.name}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>智慧技術(可多選)
          </label>
          <TechAttributeSelector groups={taxonomy.techGroups} name={`${id}-tech`} variant="checkboxes" checked={checked} onToggle={toggle} />
        </div>
      </div>

      <div className="Disclaimer">
        <h5>免責聲明：</h5>
        <p>
          本人／本單位於「智慧工安技術產業資訊暨媒合平台」（以下簡稱本平台）刊登需求文章前，已詳閱並同意：本平台僅提供需求資訊刊載、交流及媒合機會，不參與使用者與任何第三人間之洽談、報價、簽約、付款、交付、驗收、保固或其他合作事項，亦非任何一方之代理人、保證人或契約當事人。刊登者應確保所提供之資料真實、完整、合法，且未侵害他人權益，並對刊登內容自行負責；本平台不保證刊登資訊、媒合對象、技術、產品或服務之正確性、品質、安全性、適用性、履約能力或媒合成果，使用者於進行合作前，應自行查證、評估風險並議定相關契約。因使用者間後續接洽、交易、合作、履約或爭議所生之損害、費用及法律責任，應由相關當事人自行處理及負擔。本平台如發現刊登內容涉及違法、不實、侵權、違反平台規範或其他不宜公開之情形，得要求刊登者修正，或暫停、拒絕刊登及刪除相關內容。
        </p>
      </div>

      <div className="peer d-flex mb-3 mt-4">
        <label className="relative">
          <input
            type="checkbox"
            title="同意免責聲明及相關解方將同步信件及通知予使用者"
            className="form-check-input peer me-1"
            checked={agreed}
            onChange={() => setAgreed((prev) => !prev)}
          />
          <span>同意免責聲明及相關解方將同步信件及通知予使用者</span>
        </label>
      </div>

      {error && (
        <p className="mb-3" role="alert" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}
      {submittedNumber && <p className="text-success mb-3">已收到您的刊登需求（編號 {submittedNumber}），將於審核後上架。</p>}

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <a href="javascript:void(0)" className="btn-theme mat_Send" aria-disabled={submitting} onClick={() => void submit()}>
          {submitting ? "送出中…" : "刊登"}
        </a>
      </div>
    </Modal>
  );
}

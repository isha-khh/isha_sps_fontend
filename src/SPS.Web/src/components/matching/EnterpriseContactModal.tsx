"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { apiClient } from "@/lib/api-client";

const SCOPE_OPTIONS = ["感測端點", "系統部署", "通訊方式", "作業輔助", "模擬決策", "未指定"];

/**
 * 積木元件：企業名錄詳情頁「取得聯繫窗口」彈窗，對應設計稿
 * `page/matching/show.html` 的 `#staticmembership`——勾選想了解的
 * 智慧技術範疇（可複選）後按「送出」，展開顯示聯絡人資訊。
 *
 * 對話框開關沿用 `Modal.tsx`（bootstrap `data-bs-toggle="modal"`，
 * 見那支檔案的說明）；「送出後展開聯絡資訊」這段設計稿原本另外寫了
 * 一小段 jQuery slideDown，這裡改成 React state 控制顯示/隱藏——跟
 * `TechAttributeSelector`／`MatchingSearchBar` 同樣的理由，全新元件
 * 沒有舊頁面依賴這段 jQuery，直接用這個專案新元件慣用的寫法。
 *
 * 2026-10-06：「送出」會呼叫 `POST /api/Company/{id}/contact-request` 取得聯繫窗口——聯絡人與電話是個資，
 * 不放在公開的企業詳情裡，後端只給登入的企業會員（沒登入時請求會被導去登入頁）。
 * 勾選的範疇會一併送給後端記錄（平台了解大家想找什麼技術），不影響回傳內容。
 *
 * 「送出」用 `<a>` 不是 `<button>`：`.btn-theme`（漸層底色）這個 class
 * 在 `css/style.css` 裡只定義在 `.card-footer a.btn-theme`，是綁
 * `<a>` 標籤的選擇器，`<button class="btn-theme">` 完全吃不到、只會
 * 是瀏覽器預設的裸按鈕樣式（實測 computed style 背景色是瀏覽器預設的
 * 灰色，不是設計稿的藍色漸層）。跟旁邊「取消」（本來就是 `<a>`）維持
 * 同樣的標籤，兩顆按鈕才會有一致的圓角/漸層樣式。
 */
export default function EnterpriseContactModal({ id, companyId }: { id: string; companyId: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({ 感測端點: true });
  const [contact, setContact] = useState<{ name: string; phone: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestContact() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{ contactName: string; contactPhone: string }>(`/api/Company/${companyId}/contact-request`, {
        scopes: SCOPE_OPTIONS.filter((option) => checked[option]),
      });
      setContact({ name: response.data.contactName, phone: response.data.contactPhone });
    } catch (err) {
      const status = (err as { response?: { status?: number; data?: { error?: string } } }).response?.status;
      const serverMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(
        status === 403
          ? "僅企業會員可以取得聯絡窗口。"
          : status === 429
            ? "查詢次數過多，請稍後再試。"
            : serverMessage ?? "暫時無法取得聯絡窗口，請稍後再試。",
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(option: string) {
    setChecked((prev) => ({ ...prev, [option]: !prev[option] }));
  }

  return (
    <Modal id={id} title="取得聯繫窗口">
      <p>為了提供您更精準的服務，請勾選您想了解的智慧技術 (可複選)</p>

      <div className="project_fx d-flex">
        {SCOPE_OPTIONS.map((option) => {
          const checkboxId = `${id}-scope-${option}`;
          return (
            <div className="form-check" key={option}>
              <input
                className="form-check-input"
                type="checkbox"
                id={checkboxId}
                checked={Boolean(checked[option])}
                onChange={() => toggle(option)}
              />
              <label className="form-check-label" htmlFor={checkboxId}>
                {option}
              </label>
            </div>
          );
        })}
      </div>

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <a
          href="javascript:void(0)"
          className="btn-theme mat_Send"
          aria-expanded={contact !== null}
          aria-controls={`${id}-contact-info`}
          aria-disabled={loading}
          onClick={() => void requestContact()}
        >
          {loading ? "送出中…" : "送出"}
        </a>
      </div>

      {error && (
        <p className="text-center mt-3" role="alert" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}

      <div className="co_m_botom" id={`${id}-contact-info`} style={contact ? undefined : { display: "none" }}>
        <h4>連系窗口資訊</h4>
        <ul className="nav">
          <li>
            <span className="label">
              <i className="bi bi-person"></i>聯絡人：
            </span>
            <p className="mb-0">{contact?.name}</p>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-telephone me-1"></i>電話：
            </span>
            <a href={`tel:${(contact?.phone ?? "").split("#")[0].replace(/[^0-9+]/g, "")}`} title={`撥打電話至 ${contact?.phone ?? ""}`}>
              {contact?.phone}
            </a>
          </li>
        </ul>
      </div>
    </Modal>
  );
}

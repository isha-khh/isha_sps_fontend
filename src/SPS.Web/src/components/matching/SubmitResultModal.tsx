import Modal from "@/components/ui/Modal";

/**
 * 積木元件：表單彈窗（我要刊登／我要回應）送出成功後的結果視窗。表單視窗送出後會先關閉（防止重複送出），
 * 再開這一個，用大圖示＋標題＋說明，讓使用者明確知道已經送出、接下來會怎樣（原本只在表單底下多一行小字，
 * 很容易沒注意到，issue #19）。由 `swapModal(表單id, 這個id)` 開啟。
 */
export default function SubmitResultModal({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <Modal id={id} title={title}>
      <div className="text-center py-3" role="status">
        <i className="bi bi-check-circle-fill d-block mb-3" style={{ fontSize: "4rem", color: "#198754" }} aria-hidden="true" />
        <h5 className="mb-3">已成功送出</h5>
        <div className="mb-2">{children}</div>
      </div>
      <div className="card-footer d-flex justify-content-center">
        <a className="btn-theme" href="#" title="我知道了" data-bs-dismiss="modal" onClick={(event) => event.preventDefault()}>
          我知道了
        </a>
      </div>
    </Modal>
  );
}

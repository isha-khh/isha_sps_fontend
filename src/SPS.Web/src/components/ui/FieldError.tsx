/**
 * 單一欄位下方的錯誤訊息。輸入框用 `aria-describedby` 指向這個元素的 id、並設 `aria-invalid`，
 * 螢幕閱讀器聚焦到欄位時會一起念出錯誤原因（無障礙檢測 GN2330300E）。沒有錯誤時不輸出任何東西。
 */
export default function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-danger small mt-1 mb-0">
      <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
      {message}
    </p>
  );
}

/**
 * 表單開頭的必填說明：「標示 * 者為必填欄位」。
 * 欄位標籤旁的紅色「*」是 `aria-hidden`（螢幕閱讀器改由輸入框的 `required`／`aria-required` 得知必填），
 * 所以畫面上要有一句文字說明這個符號的意思（無障礙檢測 GN1330201E：必填欄位要用文字註明，不能只靠顏色或符號）。
 */
export default function RequiredNote({ className = "small mb-3" }: { className?: string }) {
  return (
    <p className={className}>
      標示 <span className="text-danger" aria-hidden="true">*</span>
      <span className="visually-hidden">星號</span> 者為必填欄位
    </p>
  );
}

const STEPS = ["使用條款", "帳號設定", "填寫資料", "完成註冊"];

/**
 * 積木元件：會員註冊多步驟頁籤（register.html／p01～p03.html 共用的
 * `.step-progress`）。舊站是純靜態 HTML，每頁自己寫死到第幾步是
 * `.active`——這裡改成傳 `activeStep`（1~4，含）動態算哪幾個要加
 * `.active`。
 *
 * 舊站規則是「目前步驟(含)之前」都是 `.active`（例如 p01.html 的
 * 「帳號設定」是第 2 步，這裡跟前一步「使用條款」都有 `.active`），
 * 不是只有目前這步才 active，照抄這個行為。
 */
export default function StepProgress({ activeStep }: { activeStep: 1 | 2 | 3 | 4 }) {
  return (
    <div className="step-progress">
      <ul className="nav nav-pills step step-round">
        {STEPS.map((label, index) => {
          const step = index + 1;
          return (
            <li key={label} className={step <= activeStep ? "col text-center active" : "col text-center"}>
              <a>
                <span>{label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

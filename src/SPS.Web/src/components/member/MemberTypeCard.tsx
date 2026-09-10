import type { MemberTypeOption } from "@/lib/member-registration-data";

/**
 * 積木元件：會員類型單選卡片，對應 p01.html 的 `.menb_type_card`
 * （radio + 卡片樣式，選中狀態靠 `:has(:checked)` 純 CSS 做，不需要
 * JS）。
 *
 * `checked`／`onChange` 是選填的 controlled 版本：2026-09-10
 * `MemberTypeSelector.tsx` 的分支流程（選了企業會員才顯示需求/供給
 * 選項）需要用 React state 決定要不要渲染後面的卡片/問題，這裡才
 * 改成也支援 controlled，沒給的話維持原本 `defaultChecked` 的
 * uncontrolled 行為（純 CSS、沒有 JS 分支需求的地方繼續用）。
 *
 * `readOnly`：2026-09-10 供給端 3 題問答送出後，用這張卡片本身當
 * 「卓越/新興」判定結果的展示（沿用一模一樣的視覺——紫色 ribbon
 * 徽章＋teal 圓形圖示），但這時候不是給使用者選的，是系統判定出來
 * 的結果，不該讓人以為還能點擊切換，所以關掉 `label`/`input` 的
 * 點擊行為（`pointer-events: none`），純顯示用。
 */
export default function MemberTypeCard({
  option,
  defaultChecked,
  checked,
  onChange,
  name = "member_type",
  readOnly = false,
}: {
  option: MemberTypeOption;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: string) => void;
  name?: string;
  readOnly?: boolean;
}) {
  const isControlled = checked !== undefined;
  return (
    <div className="menb_type_item">
      <label className="menb_type_card" htmlFor={option.id} style={readOnly ? { pointerEvents: "none" } : undefined}>
        <input
          type="radio"
          id={option.id}
          name={name}
          value={option.value}
          className="visually-hidden custom-radio"
          readOnly={readOnly}
          {...(isControlled ? { checked, onChange: () => onChange?.(option.value) } : { defaultChecked })}
        />
        <div className="card_inner">
          <i className="bi bi-check-circle-fill check-icon" aria-hidden="true"></i>
          {option.badge && <div className="t_s1">{option.badge}</div>}
          <div className="menb_type_icon02" aria-hidden="true">
            <img className="img-fluid d-block" src={option.icon} alt="" />
          </div>
          <div className="txt">
            <div className="title">
              {option.title}
              {option.titleAccent && <span>{option.titleAccent}</span>}
            </div>
            {option.desc && <span className="desc">{option.desc}</span>}
          </div>
        </div>
      </label>
    </div>
  );
}

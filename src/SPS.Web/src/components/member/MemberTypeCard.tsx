import type { MemberTypeOption } from "@/lib/member-registration-data";

/**
 * 積木元件：會員類型單選卡片，對應 p01.html 的 `.menb_type_card`
 * （radio + 卡片樣式，選中狀態靠 `:has(:checked)` 純 CSS 做，不需要
 * JS）。
 */
export default function MemberTypeCard({ option, defaultChecked }: { option: MemberTypeOption; defaultChecked?: boolean }) {
  return (
    <div className="menb_type_item">
      <label className="menb_type_card" htmlFor={option.id}>
        <input
          type="radio"
          id={option.id}
          name="member_type"
          value={option.value}
          className="visually-hidden custom-radio"
          defaultChecked={defaultChecked}
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

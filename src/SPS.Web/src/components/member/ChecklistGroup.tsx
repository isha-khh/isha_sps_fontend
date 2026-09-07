import type { ChecklistOption } from "@/lib/member-registration-data";

/**
 * 積木元件：一組多選 checkbox（應用情境／應用範疇），對應 p02/p03.html
 * 的 `.project_fx` checkbox 群組。舊站原始碼裡每個 checkbox 的 `id`
 * 是重複的（`id="fxContext"` 出現 6 次）——這是舊站本身的無障礙缺陷，
 * 這裡用 `idPrefix` 讓每個 id 唯一，不照抄這個錯誤。
 */
export default function ChecklistGroup({
  idPrefix,
  options,
  disabled,
  threeColumn,
}: {
  idPrefix: string;
  options: ChecklistOption[];
  disabled?: boolean;
  /** 對應舊站「應用情境」多一個 `project_three` class（3 欄排版），「應用範疇」沒有 */
  threeColumn?: boolean;
}) {
  return (
    <div className={threeColumn ? "project_fx project_three d-flex" : "project_fx d-flex"}>
      {options.map((option, index) => {
        const inputId = `${idPrefix}_${index}`;
        return (
          <div className="form-check" key={inputId}>
            <input className="form-check-input" type="checkbox" value={option.value} id={inputId} defaultChecked={option.defaultChecked} disabled={disabled} />
            <label className="form-check-label" htmlFor={inputId}>
              {option.value}
            </label>
          </div>
        );
      })}
    </div>
  );
}

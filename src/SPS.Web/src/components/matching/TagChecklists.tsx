"use client";

import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import type { TagTaxonomy } from "@/lib/company-tags";

/**
 * 積木元件：應用情境／應用範疇／智慧技術三組標籤勾選（受控），外面包 `.publish_s`——跟「我要刊登」彈窗
 * （`PublishNeedModal`）同一套版面與樣式（`.matching .publish_s .project_fx .form-check`），給會員中心
 * 「媒合資料維護」修改需求標籤用。`checked` 的 key 是標籤 id（字串）。
 */
export default function TagChecklists({
  taxonomy,
  checked,
  onToggle,
  idPrefix,
}: {
  taxonomy: TagTaxonomy;
  checked: Record<string, boolean>;
  onToggle: (value: string) => void;
  idPrefix: string;
}) {
  const list = (title: string, tags: TagTaxonomy["scenarios"], kind: string, threeColumn?: boolean) => (
    <div className="menb_inp_tit form-group w-100">
      <label className="mb-2">
        <span className="red me-1">*</span>
        {title}(可多選)
      </label>
      <div className={threeColumn ? "project_fx project_three d-flex flex-wrap" : "project_fx d-flex flex-wrap"}>
        {tags.map((tag) => {
          const inputId = `${idPrefix}-${kind}-${tag.id}`;
          return (
            <div className="form-check" key={tag.id}>
              <input className="form-check-input" type="checkbox" id={inputId} checked={Boolean(checked[String(tag.id)])} onChange={() => onToggle(String(tag.id))} />
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
    <div className="publish_s">
      {list("應用情境", taxonomy.scenarios, "scenario", true)}
      {list("應用範疇", taxonomy.scopes, "scope")}
      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">
          <span className="red me-1">*</span>智慧技術(可多選)
        </label>
        <TechAttributeSelector groups={taxonomy.techGroups} name={`${idPrefix}-tech`} variant="checkboxes" checked={checked} onToggle={onToggle} />
      </div>
    </div>
  );
}

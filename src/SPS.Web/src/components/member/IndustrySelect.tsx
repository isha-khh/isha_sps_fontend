"use client";

import { INDUSTRY_OPTIONS, INDUSTRY_SEPARATOR, MANUFACTURING_LABEL, MANUFACTURING_SUBCATEGORIES } from "@/lib/member-registration-data";

/**
 * 會員註冊「產業別」下拉選單（issue #101）：先選大類；選「製造業」時多一個「製造業中類」下拉，
 * 值存成單一字串「製造業／食品製造業」（後端欄位是自由文字，不用 migration）。
 * 只選了「製造業」、還沒選中類時值就是「製造業」，送出前用 `industryError` 擋下來。
 */
export default function IndustrySelect({
  value,
  onChange,
  id,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  /** 大類下拉的 id：給外面的 `<label htmlFor>` 用（有給就由該標籤命名，沒給維持 aria-label） */
  id?: string;
  required?: boolean;
}) {
  const [main, sub = ""] = value.split(INDUSTRY_SEPARATOR);

  return (
    <>
      <select className="form-select" id={id} aria-label={id ? undefined : "產業別"} required={required} aria-required={required ? true : undefined} value={main} onChange={(e) => onChange(e.target.value)}>
        <option value="">請選擇產業別</option>
        {INDUSTRY_OPTIONS.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      {main === MANUFACTURING_LABEL && (
        <select
          className="form-select mt-2"
          aria-label="製造業中類"
          value={sub}
          onChange={(e) => onChange(e.target.value ? `${MANUFACTURING_LABEL}${INDUSTRY_SEPARATOR}${e.target.value}` : MANUFACTURING_LABEL)}
        >
          <option value="">請選擇製造業中類</option>
          {MANUFACTURING_SUBCATEGORIES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      )}
    </>
  );
}

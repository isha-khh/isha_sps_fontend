"use client";

import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/api-client";
import { TW_DISTRICTS, findByPostalCode, getDistricts } from "@/lib/tw-districts";

/**
 * 臺灣地址選擇器：郵遞區號（輸入 3 碼自動帶出縣市與鄉鎮區）＋縣市＋鄉鎮區＋詳細地址（選好鄉鎮區後有該區的路名建議）。
 *
 * 元件的結構與 props（`postalCodeValue`／`onPostalCodeChange`…）取自 foylaou/yong-an-tea 的
 * `TaiwanAddressSelector.tsx`，換成這個站的 Bootstrap 樣式，資料來源也換了：原本把 2.5MB、4 萬多條路的
 * JSON 整份打進前端，這裡縣市與鄉鎮區放在 `lib/tw-districts.ts`（小），路名依郵遞區號拆成
 * `public/data/tw-roads/{zip}.json`（總共約 590KB），選到鄉鎮區才載入，載過的留在記憶體。
 *
 * 受控元件：郵遞區號、縣市、鄉鎮區、詳細地址的值都由上層保存；`idPrefix` 讓同一頁放兩組（公司地址、工廠地址）時 id 不會重複。
 */
export interface TaiwanAddressSelectorProps {
  postalCodeValue: string;
  cityValue: string;
  districtValue: string;
  addressLine1Value: string;
  onPostalCodeChange: (zipCode: string, city: string, district: string) => void;
  onCityChange: (city: string) => void;
  onDistrictChange: (district: string, zipCode: string) => void;
  onAddressLine1Change: (address: string) => void;
  idPrefix: string;
  addressPlaceholder?: string;
  disabled?: boolean;
  selectClassName?: string;
  inputClassName?: string;
}

/** 各郵遞區號的路名清單，載過的留在記憶體 */
const roadCache = new Map<string, string[]>();

function useRoads(zip: string): string[] {
  const [roads, setRoads] = useState<string[]>(() => roadCache.get(zip) ?? []);
  useEffect(() => {
    if (zip.length !== 3) {
      setRoads([]);
      return;
    }
    const cached = roadCache.get(zip);
    if (cached) {
      setRoads(cached);
      return;
    }
    let cancelled = false;
    fetch(withBasePath(`/data/tw-roads/${zip}.json`))
      .then((response) => (response.ok ? (response.json() as Promise<string[]>) : []))
      .then((list) => {
        roadCache.set(zip, list);
        if (!cancelled) setRoads(list);
      })
      .catch(() => {
        if (!cancelled) setRoads([]);
      });
    return () => {
      cancelled = true;
    };
  }, [zip]);
  return roads;
}

export default function TaiwanAddressSelector({
  postalCodeValue,
  cityValue,
  districtValue,
  addressLine1Value,
  onPostalCodeChange,
  onCityChange,
  onDistrictChange,
  onAddressLine1Change,
  idPrefix,
  addressPlaceholder = "請輸入詳細地址（路名、門牌、樓層）",
  disabled,
  selectClassName = "form-select",
  inputClassName = "form-control",
}: TaiwanAddressSelectorProps) {
  const areaList = useMemo(() => getDistricts(cityValue), [cityValue]);
  const roads = useRoads(cityValue && districtValue ? postalCodeValue : "");
  const listId = `${idPrefix}-roads`;

  function handlePostalCodeChange(value: string) {
    // 只收數字、最多 3 碼；湊滿 3 碼且查得到就自動帶出縣市與鄉鎮區
    const cleaned = value.replace(/\D/g, "").slice(0, 3);
    const found = cleaned.length === 3 ? findByPostalCode(cleaned) : undefined;
    if (found) onPostalCodeChange(cleaned, found.county, found.district);
    else onPostalCodeChange(cleaned, "", "");
  }

  function handleDistrictChange(district: string) {
    const zip = areaList.find(([name]) => name === district)?.[1] ?? "";
    onDistrictChange(district, zip);
  }

  return (
    <div className="row g-2">
      <div className="col-12 col-md-3 mb-md-0 mb-2">
        <input
          id={`${idPrefix}-zip`}
          type="text"
          inputMode="numeric"
          maxLength={3}
          className={inputClassName}
          aria-label="郵遞區號"
          placeholder="郵遞區號"
          value={postalCodeValue}
          disabled={disabled}
          onChange={(e) => handlePostalCodeChange(e.target.value)}
        />
      </div>
      <div className="col-6 col-md-4 mb-md-0 mb-2">
        <select
          id={`${idPrefix}-county`}
          className={selectClassName}
          aria-label="縣市"
          value={cityValue}
          disabled={disabled}
          onChange={(e) => onCityChange(e.target.value)}
        >
          <option value="">縣/市</option>
          {TW_DISTRICTS.map((c) => (
            <option key={c.county} value={c.county}>
              {c.county}
            </option>
          ))}
        </select>
      </div>
      <div className="col-6 col-md-5 mb-md-0 mb-2">
        <select
          id={`${idPrefix}-district`}
          className={selectClassName}
          aria-label="鄉鎮市區"
          value={districtValue}
          disabled={disabled || !cityValue}
          onChange={(e) => handleDistrictChange(e.target.value)}
        >
          <option value="">鄉/鎮/區</option>
          {areaList.map(([name]) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-12">
        <input
          type="text"
          className={inputClassName}
          placeholder={addressPlaceholder}
          list={listId}
          autoComplete="off"
          value={addressLine1Value}
          disabled={disabled}
          onChange={(e) => onAddressLine1Change(e.target.value)}
        />
        <datalist id={listId}>
          {roads.map((road) => (
            <option key={road} value={road} />
          ))}
        </datalist>
      </div>
    </div>
  );
}

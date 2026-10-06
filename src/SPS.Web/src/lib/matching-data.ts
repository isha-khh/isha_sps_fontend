/**
 * 企業名錄／媒合頁共用的分類定義（應用情境、應用範疇、智慧技術）。
 *
 * 企業名錄的資料本身已改接真後端（`fetchCompanies`／`fetchCompanyDetail`，2026-10-06）；這裡只剩搜尋列與
 * 發布需求表單用的分類選項——後端的企業與需求目前沒有對應這三種分類的欄位，所以它們只是畫面上的選項。
 */

export const APPLICATION_SCENARIOS: string[] = [
  "有害氣體監測與暴露風險預警",
  "人員、車輛與作業環境影像辨識與風險預警",
  "人員、作業場所安全動態即時監測",
  "設備與管線即時監控與風險預警",
  "工廠營運數據整合與化學品整合監控管理",
  "巡檢系統提升異常發現與即時應變效能",
];

/** 應用範疇（可多選）——對照設計稿篩選面板 2 */
export const APPLICATION_SCOPES: string[] = ["人員", "環境", "設備", "生管", "能源", "倉儲", "運輸", "消防應變"];

export interface TechAttributeOption {
  value: string;
  label: string;
}

export interface TechAttributeSection {
  id: string;
  label: string;
  options: TechAttributeOption[];
}

export interface TechAttributeGroup {
  id: string;
  label: string;
  sections: TechAttributeSection[];
}

function opts(values: string[]): TechAttributeOption[] {
  return values.map((value) => ({ value, label: value }));
}

/**
 * 「智慧技術」三層分類（大類 → 子分類 → 可多選項目），對照設計稿
 * `page/matching/show.html`／`page/_uc/searchma_tching.html` 的
 * `.sm_techn` 元件——列表頁篩選面板、詳情頁「主要產品暨服務」都是
 * 同一份分類資料，差別只在「拿來篩選」還是「顯示這家公司勾了哪些」，
 * 所以這裡只定義一份，兩邊共用（見 `TechAttributeSelector.tsx`）。
 */
export const TECH_ATTRIBUTE_GROUPS: TechAttributeGroup[] = [
  {
    id: "sensing",
    label: "感測端點",
    sections: [
      { id: "sensing-device", label: "感測裝置", options: opts(["溫度", "氣體濃度", "壓力", "FTIR", "流量", "風速", "流速", "功率", "液位", "電流", "重量", "振動", "pH值", "厚度", "水質", "導電度", "其他"]) },
      { id: "sensing-vision", label: "視覺裝置", options: opts(["可見光", "不可見光", "其他"]) },
      { id: "sensing-biometric", label: "生物表徵", options: opts(["血氧", "體溫", "血壓", "倒臥", "脈搏", "呼吸", "其他"]) },
      { id: "sensing-location", label: "定位方式", options: opts(["GPS", "陀螺儀", "UWB", "RFID", "LoRa", "Barcode/QRcode", "藍芽", "Zigbee", "其他"]) },
    ],
  },
  {
    id: "deployment",
    label: "系統部署",
    sections: [
      { id: "deployment-compute", label: "運算技術", options: opts(["雲端運算", "邊緣運算", "其他"]) },
      { id: "deployment-storage", label: "數據儲存", options: opts(["地端資料庫", "雲端資料庫", "其他"]) },
      { id: "deployment-algorithm", label: "演算法", options: opts(["機器學習", "深度學習", "其他"]) },
      { id: "deployment-genai", label: "生成式AI", options: opts(["SLM", "Rag", "LLM", "Agent", "VLM", "其他"]) },
    ],
  },
  {
    id: "communication",
    label: "通訊方式",
    sections: [
      { id: "comm-wired", label: "光通訊 (含有線通訊)", options: opts(["光纖", "工業網路", "其他"]) },
      { id: "comm-wireless", label: "無線通訊", options: opts(["Wi-Fi", "4G", "5G", "藍芽", "其他"]) },
    ],
  },
  {
    id: "operation",
    label: "作業輔助",
    sections: [
      { id: "operation-inspection", label: "智慧巡檢", options: opts(["手持裝置", "穿戴裝置", "其他"]) },
      { id: "operation-vehicle", label: "無人載具", options: opts(["陸面型", "軌道型", "空中型", "機械手臂", "水上型", "其他"]) },
      { id: "operation-xr", label: "XR虛擬實境", options: opts(["MR", "AR", "VR", "其他"]) },
    ],
  },
  {
    id: "simulation",
    label: "模擬決策",
    sections: [
      // "預設模擬" 是 2026-09-09 設計稿更新才加的選項（原本只有兩項＋其他）
      { id: "simulation-twin", label: "數位孿生", options: opts(["3D模型", "數據、影像串接", "預設模擬", "其他"]) },
      { id: "simulation-optimize", label: "參數最佳化", options: opts(["最適化操作參數建議", "最適化自動控制", "其他"]) },
    ],
  },
];

/** `CompanyType`（`SPS.Domain/Enums/CompanyType.cs`）：1=供給端、2=需求端、3=供需雙方 */
export function getCompanyTypeLabels(type: number): string[] {
  if (type === 1) return ["供給端"];
  if (type === 2) return ["需求端"];
  if (type === 3) return ["供給端", "需求端"];
  return [];
}

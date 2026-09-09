import type { CompanyDetail, CompanyList } from "@/lib/types";

/**
 * 企業名錄（`/matching/enterprise`）假資料，對應設計稿
 * `page/matching/enterprise.html`（列表）／`page/matching/show.html`
 * （詳情）——2026-09-08 客戶新上傳的設計，SPS.Web 這邊完全還沒開始做。
 *
 * 先照「先把畫面搞出來，再做資料對接」的順序，這支檔案純粹是假資料，
 * 之後要接真後端時只換這個檔案（跟 news-data.ts／promotion-data.ts／
 * serve-data.ts 是同一套做法）。
 *
 * 列表卡片、公司基本資料這幾項直接用 `CompanyList`／`CompanyDetail`
 * 型別（`lib/types.ts`，對到真後端 `GET /api/Company`——首頁「企業
 * 刊登」已經在用），欄位形狀先對齊，之後接真資料時轉換邏輯最少。
 *
 * 但設計稿詳情頁「主要產品暨服務」「智慧技術」「獲獎事蹟」這幾塊，
 * `CompanyDetail` 完全沒有對應欄位（後端目前也還查不到專門存這些
 * 的地方，見 docs/改版規劃.md）——`EnterpriseDetail` 額外補的
 * `products`／`applicationScenarios`／`applicationScopes`／
 * `selectedTechValues`／`awards`／`cooperationNote` 都是這裡自己
 * 假設的形狀，不是抄真後端型別，資料對接時這幾項要另外確認怎麼來。
 */

const PLACEHOLDER_IMAGE = "/images/all/new_logo.jpg";

export const ENTERPRISE_LISTINGS: CompanyList[] = [
  {
    id: "1",
    number: "C0001",
    name: "智慧公安技術股份有限公司",
    type: 1,
    level: 1,
    subject: "智慧工安解決方案",
    introduction: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    employees: 42,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["產業AI", "技術文件"],
    createdTime: "2026-04-15",
  },
  {
    id: "2",
    number: "C0002",
    name: "美商雙維應用資訊科技有限公司",
    type: 1,
    level: 2,
    subject: "影像辨識與風險預警",
    introduction: "整合物聯網與雲端技術，打造安全、穩定且可擴充的系統平台，協助企業落實智慧化管理。",
    employees: 88,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["人員、車輛與作業環境影像辨識與風險預警", "電腦視覺"],
    createdTime: "2026-04-10",
  },
  {
    id: "3",
    number: "C0003",
    name: "艾陽科技股份有限公司",
    type: 2,
    level: 1,
    subject: "消防應變系統整合",
    introduction: "專注消防應變相關智慧監控設備整合，協助工廠場域即時掌握火煙告警與應變流程。",
    employees: 25,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["消防應變"],
    createdTime: "2026-03-28",
  },
  {
    id: "4",
    number: "C0004",
    name: "奧榮科技股份有限公司",
    type: 3,
    level: 3,
    subject: "機器學習與數據分析",
    introduction: "以機器學習與大數據分析為核心，協助製造業建立預測性維護與品質檢測能力。",
    employees: 130,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["機器學習", "數據分析"],
    createdTime: "2026-03-12",
  },
  {
    id: "5",
    number: "C0005",
    name: "紫式大數據決策股份有限公司",
    type: 1,
    level: 2,
    subject: "冰水系統節能最佳化",
    introduction: "運用 AI 演算法優化廠務系統能耗，提供半導體與石化廠冰水系統節能解決方案。",
    employees: 60,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["AI 節能", "廠務系統"],
    createdTime: "2026-02-20",
  },
  {
    id: "6",
    number: "C0006",
    name: "長映科技股份有限公司",
    type: 2,
    level: 1,
    subject: "人員定位追蹤",
    introduction: "全方位人員定位追蹤應用，協助高風險作業場域即時掌握人員位置與異常狀況。",
    employees: 34,
    status: 1,
    isVerified: true,
    photo: PLACEHOLDER_IMAGE,
    tagNames: ["人員定位", "RFID"],
    createdTime: "2026-01-18",
  },
];

/** 應用情境（可多選）——對照設計稿 `page/_uc/searchma_tching.html` 篩選面板 1 */
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

export interface EnterpriseDetail extends CompanyDetail {
  photo?: string;
  products: { image: string }[];
  applicationScenarios: string[];
  applicationScopes: string[];
  /** 這家公司勾選的智慧技術項目（對應 `TECH_ATTRIBUTE_GROUPS` 裡各 option 的 value） */
  selectedTechValues: string[];
  awards: { image: string }[];
  cooperationNote: string;
}

const BASE_DETAIL: Omit<EnterpriseDetail, "id" | "name" | "photo" | "type"> = {
  number: "C0001",
  englishName: "",
  unifiedSocialCreditCode: "123456",
  phone: "07-5503115",
  fax: "07-5503116",
  address: "高雄市前鎮區成功二路25號",
  level: 1,
  revenue: 500000,
  employees: 42,
  subject: "智慧工安解決方案",
  introduction:
    "專注於提供企業數位轉型與智慧工安解決方案，協助客戶優化營運流程、降低風險並提升作業效率。我們整合物聯網與雲端技術，打造安全、穩定且可擴充的系統平台，協助企業落實智慧化管理。公司擁有專業顧問團隊與豐富的專案經驗，提供客製化的諮詢、系統導入與後續維運服務，致力成為企業最值得信賴的長期合作夥伴。",
  introductionEnglish: "",
  orgUrl: "https://www.eztrust.com",
  videoUrl: "",
  charge: "王小名",
  chargeEmail: "contact@example.com",
  chargePhone: "+886-7-550-3115",
  chargeMobile: "",
  chargeJobTitle: "",
  establishmentDate: "2020-06-01",
  remark: "",
  status: 1,
  isVerified: true,
  verifiedAt: "2026-01-01",
  createdTime: "2026-01-01",
  updatedTime: "2026-01-01",
  products: [{ image: PLACEHOLDER_IMAGE }, { image: PLACEHOLDER_IMAGE }],
  applicationScenarios: ["有害氣體監測與暴露風險預警", "人員、車輛與作業環境影像辨識與風險預警"],
  applicationScopes: ["人員", "環境", "設備", "生管"],
  selectedTechValues: ["溫度", "可見光", "GPS", "雲端運算", "機器學習", "Wi-Fi", "5G", "手持裝置"],
  awards: [{ image: PLACEHOLDER_IMAGE }, { image: PLACEHOLDER_IMAGE }, { image: PLACEHOLDER_IMAGE }],
  cooperationNote: "與多家製造與化工產業企業合作，提供整合型智慧工安平台與顧問輔導服務，協助客戶提升安全管理與營運效能。",
};

/** 用列表假資料組出對應的詳情假資料，欄位對不到列表資料的部分沿用 `BASE_DETAIL` 的示範內容 */
export const ENTERPRISE_DETAILS: EnterpriseDetail[] = ENTERPRISE_LISTINGS.map((listing) => ({
  ...BASE_DETAIL,
  id: listing.id,
  name: listing.name,
  photo: listing.photo,
  type: listing.type,
  subject: listing.subject ?? BASE_DETAIL.subject,
  introduction: listing.introduction ?? BASE_DETAIL.introduction,
  employees: listing.employees ?? BASE_DETAIL.employees,
}));

export function getEnterpriseDetail(id: string): EnterpriseDetail | undefined {
  return ENTERPRISE_DETAILS.find((item) => item.id === id);
}

/** `CompanyType`（`SPS.Domain/Enums/CompanyType.cs`）：1=供給端、2=需求端、3=供需雙方 */
export function getCompanyTypeLabels(type: number): string[] {
  if (type === 1) return ["供給端"];
  if (type === 2) return ["需求端"];
  if (type === 3) return ["供給端", "需求端"];
  return [];
}

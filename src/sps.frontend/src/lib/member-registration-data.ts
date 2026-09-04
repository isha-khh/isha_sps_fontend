export interface ChecklistOption {
  value: string;
  /** 對應舊站寫死在 HTML 裡的示範預設勾選狀態（demo 假資料本來就長這樣，照抄） */
  defaultChecked?: boolean;
}

export interface AccordionSection {
  id: string;
  title: string;
  options: ChecklistOption[];
  /** 對應舊站 `.collapse-body.show` / `aria-expanded="true"`，該分類頁籤下第一個手風琴預設展開 */
  defaultOpen?: boolean;
}

export interface SmartTechTab {
  id: string;
  label: string;
  sections: AccordionSection[];
}

/** 應用情境（可多選），對應 p02/p03.html 的 `#fxContext` checkbox 群組 */
export const APPLICATION_SCENARIOS: ChecklistOption[] = [
  { value: "有害氣體監測與暴露風險預警", defaultChecked: true },
  { value: "人員、車輛與作業環境影像辨識與風險預警" },
  { value: "人員、作業場所安全動態即時監測", defaultChecked: true },
  { value: "設備與管線即時監控與風險預警" },
  { value: "工廠營運數據整合與化學品整合監控管理" },
  { value: "巡檢系統提升異常發現與即時應變效能" },
];

/** 應用範疇（可多選），對應 p02/p03.html 的 `#fxScope` checkbox 群組 */
export const APPLICATION_SCOPES: ChecklistOption[] = [
  { value: "人員", defaultChecked: true },
  { value: "環境" },
  { value: "設備", defaultChecked: true },
  { value: "生管" },
  { value: "能源", defaultChecked: true },
  { value: "倉儲" },
  { value: "運輸" },
  { value: "消防應變" },
];

/**
 * 智慧技術（可多選），對應 p02/p03.html 的 `.sm_techn` 左側頁籤 + 右側
 * 手風琴巢狀 checkbox 結構——5 個頁籤，每個頁籤底下 2~4 組手風琴分類。
 */
export const SMART_TECH_TABS: SmartTechTab[] = [
  {
    id: "smt_1",
    label: "感測端點",
    sections: [
      {
        id: "1_1",
        title: "感測裝置",
        defaultOpen: true,
        options: [
          { value: "溫度", defaultChecked: true },
          { value: "氣體濃度" },
          { value: "壓力" },
          { value: "FTIR" },
          { value: "流量" },
          { value: "風速" },
          { value: "流速" },
          { value: "功率" },
          { value: "液位" },
          { value: "電流" },
          { value: "重量" },
          { value: "振動" },
          { value: "pH值" },
          { value: "厚度" },
          { value: "水質" },
          { value: "導電度" },
          { value: "其他" },
        ],
      },
      {
        id: "1_2",
        title: "視覺裝置",
        options: [{ value: "可見光", defaultChecked: true }, { value: "不可見光" }, { value: "其他" }],
      },
      {
        id: "1_3",
        title: "生物表徵",
        options: [
          { value: "血氧", defaultChecked: true },
          { value: "體溫" },
          { value: "血壓" },
          { value: "倒臥" },
          { value: "脈搏" },
          { value: "呼吸" },
          { value: "其他" },
        ],
      },
      {
        id: "1_4",
        title: "定位方式",
        options: [
          { value: "GPS", defaultChecked: true },
          { value: "陀螺儀" },
          { value: "UWB" },
          { value: "RFID" },
          { value: "LoRa" },
          { value: "Barcode/QRcode" },
          { value: "藍芽" },
          { value: "Zigbee" },
          { value: "其他" },
        ],
      },
    ],
  },
  {
    id: "smt_2",
    label: "系統部署",
    sections: [
      {
        id: "2_1",
        title: "運算技術",
        defaultOpen: true,
        options: [{ value: "雲端運算", defaultChecked: true }, { value: "邊緣運算" }, { value: "其他" }],
      },
      {
        id: "2_2",
        title: "數據儲存",
        options: [{ value: "地端資料庫", defaultChecked: true }, { value: "雲端資料庫" }, { value: "其他" }],
      },
      {
        id: "2_3",
        title: "演算法",
        options: [{ value: "機器學習", defaultChecked: true }, { value: "深度學習" }, { value: "其他" }],
      },
      {
        id: "2_4",
        title: "生成式AI",
        options: [
          { value: "SLM", defaultChecked: true },
          { value: "Rag" },
          { value: "LLM" },
          { value: "Agent" },
          { value: "VLM" },
          { value: "其他" },
        ],
      },
    ],
  },
  {
    id: "smt_3",
    label: "通訊方式",
    sections: [
      {
        id: "3_1",
        title: "光通訊 (含有線通訊)",
        defaultOpen: true,
        options: [{ value: "光纖", defaultChecked: true }, { value: "工業網路" }, { value: "其他" }],
      },
      {
        id: "3_2",
        title: "無線通訊",
        options: [{ value: "Wi-Fi", defaultChecked: true }, { value: "4G" }, { value: "5G" }, { value: "藍芽" }, { value: "其他" }],
      },
    ],
  },
  {
    id: "smt_4",
    label: "作業輔助",
    sections: [
      {
        id: "4_1",
        title: "智慧巡檢",
        defaultOpen: true,
        options: [{ value: "手持裝置", defaultChecked: true }, { value: "穿戴裝置" }, { value: "其他" }],
      },
      {
        id: "4_2",
        title: "無人載具",
        options: [
          { value: "陸面型", defaultChecked: true },
          { value: "軌道型" },
          { value: "空中型" },
          { value: "機械手臂" },
          { value: "水上型" },
          { value: "其他" },
        ],
      },
      {
        id: "4_3",
        title: "XR虛擬實境",
        options: [{ value: "MR", defaultChecked: true }, { value: "AR" }, { value: "VR" }, { value: "其他" }],
      },
    ],
  },
  {
    id: "smt_5",
    label: "模擬決策",
    sections: [
      {
        id: "5_1",
        title: "數位孿生",
        defaultOpen: true,
        options: [{ value: "3D模型", defaultChecked: true }, { value: "數據、影像串接" }, { value: "其他" }],
      },
      {
        id: "5_2",
        title: "參數最佳化",
        options: [{ value: "最適化操作參數建議", defaultChecked: true }, { value: "最適化自動控制" }, { value: "其他" }],
      },
    ],
  },
];

/** 會員類型（單選卡片），對應 p01.html 的 `.menb_type_card` */
export interface MemberTypeOption {
  id: string;
  value: string;
  title: string;
  /** 對應舊站 `.title span`（黑色，跟 `.title` 本身的藍色文字做區隔），沒有就整個標題都用 `.title` 的藍色 */
  titleAccent?: string;
  desc?: string;
  badge?: string;
  icon: string;
}

export const MEMBER_TYPE_OPTIONS: MemberTypeOption[] = [
  { id: "type_personal", value: "personal", title: "個人會員", desc: "個人專業人士", icon: "/images/member/menb_type_icon01.svg" },
  { id: "type_personal_demand", value: "personal_demand", title: "個人會員升級－", titleAccent: "需求端", icon: "/images/member/menb_type_icon02.svg" },
  { id: "type_personal_supply", value: "personal_supply", title: "個人會員升級－", titleAccent: "供給端", icon: "/images/member/menb_type_icon02.svg" },
  { id: "type_company_demand", value: "company_demand", title: "企業會員－需求端", desc: "尋找技術、服務之企業", icon: "/images/member/menb_type_icon04.svg" },
  {
    id: "type_company_super",
    value: "company_supply_super",
    title: "企業會員－供給端",
    desc: "具成熟技術與服務能力之供給端",
    badge: "卓越會員",
    icon: "/images/member/menb_type_icon05.svg",
  },
  {
    id: "type_company_emerging",
    value: "company_supply_emerging",
    title: "企業會員－供給端",
    desc: "具創新技術與成長潛力之供給端",
    badge: "新興會員",
    icon: "/images/member/menb_type_icon06.svg",
  },
];

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

/**
 * 2026-09-10 對照官方文件《會員申請須知》（民國115年5月版）重新設計：
 * 原本這裡是 6 張扁平單選卡（含「個人會員升級－需求端／供給端」），
 * 但官方文件「(四)個人會員升級企業會員」講得很清楚——「升級」的終點
 * 是**企業會員**，不是留在個人身分掛一個需求/供給角色；「個人會員
 * 升級－需求端／供給端」這兩個舊選項其實是誤判出來的中間狀態，會員
 * 終態實際上只有 4 種（個人會員／企業-需求端／企業-供給端(卓越)／
 * 企業-供給端(新興)），不是 6 種。
 *
 * 「升級成企業會員」這個動作本來就該是**已登入的個人會員**在會員
 * 中心「權益升級」做的事（見 MemberUpgradePage 這個之後要蓋的頁面），
 * 不該混在這支「還沒登入、全新申請」的註冊精靈裡——所以這裡把選項
 * 從 6 個扁平卡片，改成一個分支流程：
 *
 * 1. 個人會員 / 企業會員（`APPLICANT_TYPE_OPTIONS`）
 * 2. 選了企業會員 → 需求端 / 供給端（`COMPANY_ROLE_OPTIONS`）
 * 3. 選了供給端 → 3 題問答自動導向卓越/新興（`SUPPLIER_TIER_QUESTIONS`），
 *    不是讓使用者自己選「我要當卓越還是新興」——卓越/新興是審查資格
 *    的結果，不是使用者的自我認定。
 *
 * 這個分支邏輯的實際 UI 在 `MemberTypeSelector.tsx`（client component，
 * 因為要依選擇動態顯示/隱藏後面的問題），不是像原本這樣純 CSS 單選卡。
 */
export const APPLICANT_TYPE_OPTIONS: MemberTypeOption[] = [
  { id: "type_individual", value: "individual", title: "個人會員", desc: "個人專業人士", icon: "/images/member/menb_type_icon01.svg" },
  { id: "type_company", value: "company", title: "企業會員", desc: "尋找技術服務，或提供技術服務之企業", icon: "/images/member/menb_type_icon04.svg" },
];

/** 選了「企業會員」之後的需求/供給端選擇 */
export const COMPANY_ROLE_OPTIONS: MemberTypeOption[] = [
  { id: "type_role_demand", value: "demand", title: "需求端", desc: "尋找技術、服務之企業", icon: "/images/member/menb_type_icon04.svg" },
  { id: "type_role_supply", value: "supply", title: "供給端", desc: "提供技術、服務之企業", icon: "/images/member/menb_type_icon05.svg" },
];

/**
 * 供給端卓越/新興的判斷問題，對應官方文件「卓越會員申請資格：具備
 * 技術服務能量登錄、雲市集或數位服務機構登錄資格之業者」——三選一
 * （OR，不用三個都有）。這三題也對到既有後端 `DocumentType`：
 * `TechnicalCapability`／`CloudMarketplace`／`DigitalServiceCapability`，
 * 答「是」的那幾題，Step3 就要對應顯示上傳該項證明文件的欄位；三題
 * 都答「否」則進入新興會員（改上傳「登錄申請書」`DocumentType.
 * Application`，並會經過至少 5 位專家審查，見附件三評分規則）。
 */
export interface SupplierTierQuestion {
  id: "technicalCapability" | "cloudMarketplace" | "digitalServiceCapability";
  label: string;
  /** 2026-09-10 使用者提供，讓還不確定自己有沒有這項資格的申請人可以先去查詢/申請 */
  noteLabel: string;
  noteUrl: string;
}

export const SUPPLIER_TIER_QUESTIONS: SupplierTierQuestion[] = [
  {
    id: "technicalCapability",
    label: "是否具備技術服務能量登錄並且拿到資格？",
    noteLabel: "查詢資格",
    noteUrl: "https://assist.nat.gov.tw/wSite/sp?xdUrl=/wSite/sp/tech/enterpriseSearchList.jsp&mp=2",
  },
  {
    id: "cloudMarketplace",
    label: "是否在雲市集上架產品？",
    noteLabel: "雲市集",
    noteUrl: "https://tcloud.gov.tw/",
  },
  {
    id: "digitalServiceCapability",
    label: "是否具備數位服務機構登錄並且拿到資格？",
    noteLabel: "數位服務能量登錄",
    noteUrl: "https://moda.gov.tw/ADI/services/apply-serivces/energy/13088",
  },
];

/**
 * 3 題問答送出後的判定結果卡——2026-09-10 使用者要求照原本 p01.html
 * 卡片的視覺（`.t_s1` 紫色 ribbon 徽章＋teal 圓形圖示＋標題/說明）
 * 呈現，不要只顯示一行純文字結果，圖示直接沿用原本 6 選項卡片時期
 * 就有的 `menb_type_icon05.svg`（星星，卓越）／`menb_type_icon06.svg`
 * （箭頭，新興），這兩個檔案本來就在 `public/images/member/`，不用
 * 重畫。`MemberTypeSelector.tsx` 送出後用 `MemberTypeCard`（唯讀、
 * 恆選中）直接渲染這裡對應的選項當結果卡。
 */
export const SUPPLIER_TIER_RESULT_OPTIONS: Record<"excellent" | "emerging", MemberTypeOption> = {
  excellent: {
    id: "tier_result_excellent",
    value: "excellent",
    title: "企業會員－供給端",
    desc: "具成熟技術與服務能力之供給端",
    badge: "卓越會員",
    icon: "/images/member/menb_type_icon05.svg",
  },
  emerging: {
    id: "tier_result_emerging",
    value: "emerging",
    title: "企業會員－供給端",
    desc: "具創新技術與成長潛力之供給端",
    badge: "新興會員",
    icon: "/images/member/menb_type_icon06.svg",
  },
};

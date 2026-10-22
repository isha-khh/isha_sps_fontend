/**
 * 公告、服務專區、補助公告、人才培育、產業輔導、補助資源共用同一套後台頁面（`NewsListPage`／`NewsFormPage`／`NewsDetailPage`），
 * 用「專區」區分（對應後端 `News.Section`）。這裡集中各專區的差異：分類種類、頁面路徑、文字、專屬欄位。
 * 注意 `News.Type`（一般／重要／緊急）是公告自己的欄位，跟專區無關。
 */
export type NewsSection = 0 | 1 | 2 | 3 | 4 | 5;

/** 專區專屬欄位（存在 `News.Meta`）；`key` 必須跟後端 `NewsSection.MetaKeys` 一致，後端會拒絕沒登記的欄位 */
export interface MetaField {
  key: string;
  label: string;
  type?: 'text' | 'date' | 'number' | 'url';
  placeholder?: string;
  hint?: string;
}

export interface NewsSectionConfig {
  section: NewsSection;
  /** 後端 CategoryType：1 公告分類、9 技術工具分類（原服務專區）、10 產業輔導的產業別、11 補助資源分類；沒有分類的專區是 undefined */
  categoryType?: number;
  /** 列表頁路徑（編輯、檢視、新增都掛在底下） */
  basePath: string;
  /** 分類管理頁路徑；沒有分類的專區是 undefined */
  categoriesPath?: string;
  /** 麵包屑上層 */
  parentLabel: string;
  /** 項目名稱：公告／服務項目… */
  noun: string;
  listTitle: string;
  listCrumb: string;
  /** 分類欄位的名稱（例如產業輔導叫「產業別」） */
  categoryLabel?: string;
  /** 分類有兩層（服務專區：技術文件／產業AI 底下可以有子分類，前台左側選單顯示子分類）；沒設就只有一層 */
  hasSubCategories?: boolean;
  /** 分類可以多選（產業輔導的產業別）；沒設就是單選下拉 */
  multiCategory?: boolean;
  /** 前台「立即下載」「索取資料」表單送出後存成詢問單，針對的對象種類（後端 `Inquiry.TargetType`，`TargetKey` 是項目編號）；有設就會在列表顯示回應數量、詳情頁顯示回應表格並可匯出 */
  inquiryTargetType?: string;
  /** 另一組「適用產業」（可多選，政府補助資源用）：後端 CategoryType、管理頁路徑與欄位名稱；沒設就沒有這個欄位 */
  industryCategoryType?: number;
  industryCategoriesPath?: string;
  industryLabel?: string;
  /** 只有公告有「一般／重要／緊急」類型 */
  hasSeverityType: boolean;
  /** 只有服務專區有附件（填完下載表單才給下載連結） */
  hasAttachments: boolean;
  /** 標籤（前台卡片上的關鍵字）；補助公告沒有 */
  hasTags: boolean;
  /** 有「課程類型」多選（只有人才培育；類型在「課程類型」頁維護，對應前台知識加值的類型篩選） */
  hasCourseTypes?: boolean;
  /** 專區專屬欄位 */
  metaFields?: MetaField[];
  /** 專區專屬欄位卡片的標題 */
  metaTitle?: string;
}

export const NEWS_SECTIONS: Record<NewsSection, NewsSectionConfig> = {
  0: {
    section: 0,
    categoryType: 1,
    basePath: '/announcements',
    categoriesPath: '/announcements/categories',
    parentLabel: '公告事項',
    noun: '公告',
    listTitle: '公告事項',
    listCrumb: '公告內容',
    hasSeverityType: true,
    hasAttachments: false,
    hasTags: true,
    metaTitle: '活動資訊',
    metaFields: [
      { key: 'eventTime', label: '活動時間', placeholder: '例如：2026.4.15(四)09:00-16:30', hint: '前台公告列表卡片上的時間列；不填就不顯示' },
      { key: 'location', label: '活動地點', placeholder: '例如：台北國際會議中心101會議室', hint: '前台公告列表卡片上的地點列；不填就不顯示' },
    ],
  },
  1: {
    section: 1,
    categoryType: 9,
    hasSubCategories: true,
    inquiryTargetType: 'ServeItem',
    basePath: '/serve-items',
    categoriesPath: '/serve-items/categories',
    parentLabel: '技術工具',
    noun: '技術工具',
    listTitle: '技術工具管理',
    listCrumb: '技術工具內容',
    hasSeverityType: false,
    hasAttachments: true,
    hasTags: true,
  },
  2: {
    section: 2,
    basePath: '/support-notices',
    parentLabel: '補助資源',
    noun: '本計畫補助',
    listTitle: '本計畫補助',
    listCrumb: '本計畫補助',
    hasSeverityType: false,
    hasAttachments: false,
    hasTags: false,
  },
  3: {
    section: 3,
    basePath: '/talent-courses',
    parentLabel: '人才培育',
    noun: '課程',
    listTitle: '人才培育課程管理',
    listCrumb: '課程內容',
    hasSeverityType: false,
    hasAttachments: false,
    hasTags: true,
    hasCourseTypes: true,
    metaTitle: '課程資訊',
    metaFields: [
      { key: 'organizer', label: '開課單位', placeholder: '例如：財團法人工業技術研究院南分院', hint: '列表表格的「開課單位」' },
      { key: 'dateStart', label: '開課起日', type: 'date', hint: '列表表格的課程日期區間' },
      { key: 'dateEnd', label: '開課迄日', type: 'date' },
      { key: 'city', label: '上課縣市', placeholder: '例如：臺南市' },
      { key: 'contactName', label: '聯絡人' },
      { key: 'contactPhone', label: '聯絡電話' },
      { key: 'courseCode', label: '課程代號', placeholder: '例如：115SE048' },
      { key: 'courseDate', label: '課程日期（詳情頁）', placeholder: '例如：2026/10/20~2026/10/20' },
      { key: 'courseTime', label: '課程時間', placeholder: '例如：09:30~16:00' },
      { key: 'totalHours', label: '總時數', placeholder: '例如：6 小時' },
      { key: 'fee', label: '課程費用', placeholder: '例如：免費' },
      { key: 'audience', label: '適合對象' },
      { key: 'location', label: '上課地點' },
      { key: 'hostOrganizer', label: '主辦單位' },
      { key: 'executor', label: '執行單位' },
      { key: 'remainingSeats', label: '剩餘名額', type: 'number', hint: '顯示在「熱門課程」側欄；不填就不顯示' },
      { key: 'registerUrl', label: '報名連結', type: 'url', hint: '前台「立即報名」按鈕連去的網址；不填就不顯示按鈕' },
    ],
  },
  4: {
    section: 4,
    categoryType: 10,
    basePath: '/tutoring-items',
    categoriesPath: '/tutoring-items/categories',
    parentLabel: '產業輔導',
    noun: '輔導項目',
    listTitle: '產業輔導管理',
    listCrumb: '輔導內容',
    categoryLabel: '產業別',
    multiCategory: true,
    hasSeverityType: false,
    hasAttachments: false,
    hasTags: true,
    metaTitle: '輔導資訊',
    metaFields: [
      { key: 'applicant', label: '申請對象', placeholder: '例如：製造業（依法登記之公司）' },
      { key: 'organizer', label: '主辦單位' },
      { key: 'contactPhone', label: '聯絡電話' },
      { key: 'contributor', label: '撰稿人', hint: '詳情頁顯示「撰稿人 / …」；不填就不顯示' },
    ],
  },
  5: {
    section: 5,
    categoryType: 11,
    inquiryTargetType: 'SupportResource',
    basePath: '/support-resources',
    categoriesPath: '/support-resources/categories',
    parentLabel: '補助資源',
    noun: '政府補助資源',
    listTitle: '政府補助資源',
    listCrumb: '政府補助資源',
    categoryLabel: '補助類型',
    industryCategoryType: 12,
    industryCategoriesPath: '/support-resources/industries',
    industryLabel: '產業別',
    hasSeverityType: false,
    hasAttachments: false,
    hasTags: true,
    metaTitle: '補助資訊',
    metaFields: [
      { key: 'applicant', label: '適用對象', placeholder: '例如：製造業（依法登記之公司）' },
      { key: 'amount', label: '補助金額', placeholder: '例如：最高補助新臺幣 300 萬元' },
      { key: 'organizer', label: '主辦單位' },
      { key: 'period', label: '申請期間', placeholder: '例如：2026/01/15 – 2026/03/31' },
    ],
  },
};

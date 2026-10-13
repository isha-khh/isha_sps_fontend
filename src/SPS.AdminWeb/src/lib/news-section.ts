/**
 * 公告與服務專區共用同一套後台頁面（`NewsListPage`／`NewsFormPage`／`NewsDetailPage`），用「專區」區分
 * （對應後端 `News.Section`：0 公告、1 服務專區）。這裡集中各專區的差異：分類種類、頁面路徑與文字。
 * 注意 `News.Type`（一般／重要／緊急）是公告自己的欄位，跟專區無關。
 */
export type NewsSection = 0 | 1;

export interface NewsSectionConfig {
  section: NewsSection;
  /** 後端 CategoryType：1 公告分類、9 服務專區分類 */
  categoryType: number;
  /** 列表頁路徑（編輯、檢視、新增都掛在底下） */
  basePath: string;
  /** 分類管理頁路徑 */
  categoriesPath: string;
  /** 麵包屑上層 */
  parentLabel: string;
  /** 項目名稱：公告／服務項目 */
  noun: string;
  listTitle: string;
  listCrumb: string;
  /** 只有公告有「一般／重要／緊急」類型與標籤 */
  hasSeverityType: boolean;
  /** 只有服務專區有附件（填完下載表單才給下載連結） */
  hasAttachments: boolean;
}

export const NEWS_SECTIONS: Record<NewsSection, NewsSectionConfig> = {
  0: {
    section: 0,
    categoryType: 1,
    basePath: '/announcements',
    categoriesPath: '/announcements/categories',
    parentLabel: '內容管理',
    noun: '公告',
    listTitle: '公告管理',
    listCrumb: '公告內容',
    hasSeverityType: true,
    hasAttachments: false,
  },
  1: {
    section: 1,
    categoryType: 9,
    basePath: '/serve-items',
    categoriesPath: '/serve-items/categories',
    parentLabel: '服務專區',
    noun: '服務項目',
    listTitle: '服務專區管理',
    listCrumb: '服務專區內容',
    hasSeverityType: false,
    hasAttachments: true,
  },
};

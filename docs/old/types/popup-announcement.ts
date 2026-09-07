/**
 * 彈跳公告
 */
export interface PopupAnnouncement {
    id: number;
    /** 標題 */
    title: string;
    /** 內容 (HTML 或純文字) */
    content: string;
    /** 圖片 ID */
    imageId: number | null;
    /** 圖片 URL */
    imageUrl: string | null;
    /** 連結 URL */
    linkUrl: string | null;
    /** 連結開啟方式 (_self, _blank) */
    linkTarget: string | null;
    /** 適用路由列表 */
    routes: string[];
    /** 顯示頻率 (0: 每次, 1: 每天一次, etc.) */
    frequency: number;
    /** 優先順序 */
    priority: number;
    /** 開始日期 */
    startDate: string;
    /** 結束日期 */
    endDate: string;
    /** 是否顯示關閉按鈕 */
    showCloseButton: boolean;
    /** 是否顯示「今日不再顯示」選項 */
    showDontShowToday: boolean;
    /** 是否發布 */
    published: boolean;
    /** 排序 */
    ordinal: number;
    /** 建立時間 */
    createdTime: string;
    /** 更新時間 */
    updatedTime: string;
}

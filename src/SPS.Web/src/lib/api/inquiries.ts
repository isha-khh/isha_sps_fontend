import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/error-utils";

/** 後端 `InquiryType`：前台各個「留下資料等人回覆」的表單共用同一支 `POST /api/Inquiry`，用這個數字區分來源 */
export const InquiryType = {
  /** 媒合需求詳情「我要提案」（企業會員） */
  ProposeSolution: 1,
  /** 媒合對接「訂閱解方」（登入會員） */
  SubscribeSolution: 2,
  /** 服務專區詳情「立即下載」申請 */
  DownloadRequest: 3,
  /** 政府補助資源「索取資料協助評估」 */
  SupportRequest: 4,
  /** 頁尾「訂閱電子報」 */
  Newsletter: 5,
} as const;

export type InquiryType = (typeof InquiryType)[keyof typeof InquiryType];

export interface InquiryPayload {
  type: InquiryType;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  unit?: string;
  jobTitle?: string;
  message?: string;
  /** 針對的對象，例如 Demand／ServeItem／SupportResource；後台收件匣用 `targetTitle` 顯示是哪一筆 */
  targetType?: string;
  targetKey?: string;
  targetTitle?: string;
  industry?: string;
  /** 已閱讀並同意個資蒐集告知（匿名表單必須為 true） */
  consentAccepted?: boolean;
}

/**
 * 送出詢問單。成功回傳 `null`；失敗回傳要顯示給使用者的訊息（後端的錯誤訊息，沒有就用通用說明）。
 * 要登入的表單沒登入時，axios 攔截器會直接導去登入頁。
 */
export async function submitInquiry(payload: InquiryPayload): Promise<string | null> {
  try {
    await apiClient.post("/api/Inquiry", payload);
    return null;
  } catch (error) {
    return getApiErrorMessage(error, "送出失敗，請稍後再試");
  }
}

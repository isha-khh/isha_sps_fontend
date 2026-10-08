import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/error-utils";

export interface CreateDemandReplyPayload {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  content: string;
  /** 已了解回應審核通過後會寄給刊登者與追蹤者 */
  acknowledged: boolean;
}

/** 供應業者在會員中心看到自己送出的回應 */
export interface MyDemandReply {
  id: number;
  demandId: number;
  demandNumber: string;
  demandName: string;
  content: string;
  status: "Pending" | "Approved" | "Rejected";
  rejectReason?: string | null;
  createdTime: string;
  reviewedAt?: string | null;
}

export const demandRepliesApi = {
  /** 供應業者回應需求；成功回傳 null，失敗回傳要顯示的訊息。送出後待後台審核 */
  async create(demandId: number | string, payload: CreateDemandReplyPayload): Promise<string | null> {
    try {
      await apiClient.post(`/api/Demand/${demandId}/replies`, payload);
      return null;
    } catch (error) {
      return getApiErrorMessage(error, "送出失敗，請稍後再試");
    }
  },
  async getMine(): Promise<MyDemandReply[]> {
    return (await apiClient.get<MyDemandReply[]>("/api/member/replies")).data;
  },
};

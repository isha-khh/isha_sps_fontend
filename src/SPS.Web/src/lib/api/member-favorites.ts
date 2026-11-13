import { apiClient } from "@/lib/api-client";

/** 我的最愛裡的企業（只列目前公開的） */
export interface FavoriteCompany {
  id: string;
  name: string;
  subject?: string | null;
}

/** 我的最愛裡的需求（只列目前已發布的） */
export interface FavoriteDemand {
  id: number;
  number: string;
  name: string;
  location?: string | null;
}

export interface MemberFavorites {
  companies: FavoriteCompany[];
  demands: FavoriteDemand[];
}

/** 收藏按鈕判斷狀態用；沒登入也能呼叫（`loggedIn` = false），不會被導去登入頁 */
export interface FavoriteIds {
  loggedIn: boolean;
  /** 是不是企業會員；只有企業會員可以使用我的最愛 */
  enterprise: boolean;
  /** "Buyer"（需求端）／"Supplier"（供給端）／空字串（訪客、個人會員）；媒合對接的刊登、追蹤、回應按鈕依此決定 */
  role: "Buyer" | "Supplier" | "";
  companyIds: string[];
  demandIds: number[];
}

/** 會員自己從前台「我要刊登」送出的需求（媒合資料維護） */
export interface MemberDemand {
  id: number;
  number: string;
  name: string;
  introduction?: string | null;
  tagIds: number[];
  tagNames: string[];
  /** true = 已上架，會員不能再改；false = 待審核 */
  published: boolean;
  createdTime: string;
  /** true = 自己刊登的（可以改、撤回）；false = 同公司同事或後台代刊登的，只能填報對接結果 */
  submittedByMe: boolean;
  /** 已成功對接（有填報對接結果）；前台公開頁只顯示這個狀態 */
  matched: boolean;
  /** 對接到哪些供給端企業（只有刊登端自己看得到） */
  matchedCompanies: MatchedCompany[];
}

export interface MatchedCompany {
  companyId: string;
  companyName: string;
  number?: string | null;
  reportedTime: string;
}

/** 對接結果選企業用的選項（已審核通過的供給端企業） */
export interface MatchCompanyOption {
  id: string;
  name: string;
  number?: string | null;
}

/** 自己刊登的需求收到的、審核通過的供應業者回應（可以對回應者開啟對話） */
export interface ReceivedReply {
  replyId: number;
  demandId: number;
  companyName?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  content: string;
  receivedTime: string;
  /** 已經開啟的對話 */
  chatRecordId?: number | null;
}

export const memberFavoritesApi = {
  async getReceivedReplies(demandId: number): Promise<ReceivedReply[]> {
    return (await apiClient.get<ReceivedReply[]>(`/api/member/demands/${demandId}/replies`)).data;
  },
  async getFavorites(): Promise<MemberFavorites> {
    return (await apiClient.get<MemberFavorites>("/api/member/favorites")).data;
  },
  async getIds(): Promise<FavoriteIds> {
    return (await apiClient.get<FavoriteIds>("/api/member/favorites/ids")).data;
  },
  async addCompany(id: string): Promise<void> {
    await apiClient.put(`/api/member/favorites/companies/${id}`);
  },
  async removeCompany(id: string): Promise<void> {
    await apiClient.delete(`/api/member/favorites/companies/${id}`);
  },
  async addDemand(id: number): Promise<void> {
    await apiClient.put(`/api/member/favorites/demands/${id}`);
  },
  async removeDemand(id: number): Promise<void> {
    await apiClient.delete(`/api/member/favorites/demands/${id}`);
  },
  async getMyDemands(): Promise<MemberDemand[]> {
    return (await apiClient.get<MemberDemand[]>("/api/member/demands")).data;
  },
  async updateMyDemand(id: number, request: { name: string; introduction: string | null; tagIds: number[] }): Promise<MemberDemand> {
    return (await apiClient.put<MemberDemand>(`/api/member/demands/${id}`, request)).data;
  },
  /** 填報需求的對接結果：整組覆寫，空陣列＝移除全部（前台狀態回到「徵求中」）；填了就生效，不需要審核 */
  async setMyDemandMatches(id: number, companyIds: string[]): Promise<{ demandId: number; matched: boolean; companies: MatchedCompany[] }> {
    return (await apiClient.put(`/api/member/demands/${id}/matches`, { companyIds })).data;
  },
  async searchMatchCompanies(search: string): Promise<MatchCompanyOption[]> {
    return (await apiClient.get<MatchCompanyOption[]>("/api/Demand/match-companies", { params: { search: search || undefined } })).data;
  },
  async deleteMyDemand(id: number): Promise<void> {
    await apiClient.delete(`/api/member/demands/${id}`);
  },
};

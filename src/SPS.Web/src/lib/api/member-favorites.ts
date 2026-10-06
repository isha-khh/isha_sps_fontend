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
}

export const memberFavoritesApi = {
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
  async deleteMyDemand(id: number): Promise<void> {
    await apiClient.delete(`/api/member/demands/${id}`);
  },
};

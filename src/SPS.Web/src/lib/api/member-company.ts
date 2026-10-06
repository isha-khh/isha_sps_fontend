import { apiClient } from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/content-list-utils";

/** 企業展示圖片（來自檔案管理） */
export interface MemberCompanyImage {
  fileId: string;
  fileName: string;
  url: string;
}

export interface MemberCompanyAddress {
  type: number;
  postalCode?: string | null;
  region?: string | null;
  city?: string | null;
  district?: string | null;
  line?: string | null;
  description?: string | null;
}

/** `GET /api/member/company`：企業會員自己的公司資料 */
export interface MemberCompany {
  id: string;
  name: string;
  englishName?: string | null;
  unifiedSocialCreditCode: string;
  phone?: string | null;
  fax?: string | null;
  /** CompanyType：1=供給端、2=需求端、3=供需雙方 */
  type: number;
  revenue?: number | null;
  employees?: number | null;
  subject?: string | null;
  introduction?: string | null;
  introductionEnglish?: string | null;
  orgUrl?: string | null;
  videoUrl?: string | null;
  charge?: string | null;
  chargeEmail?: string | null;
  chargePhone?: string | null;
  chargeMobile?: string | null;
  chargeJobTitle?: string | null;
  establishmentDate?: string | null;
  cooperationNote?: string | null;
  factoryName?: string | null;
  factoryAddress?: string | null;
  isVerified: boolean;
  address?: MemberCompanyAddress | null;
  photo?: { id: number; uri?: string | null } | null;
  productImages: MemberCompanyImage[];
  awardImages: MemberCompanyImage[];
}

/**
 * `PUT /api/member/company` 的請求：欄位沒帶＝不更新，字串送空字串＝清除。
 * 公司名稱、統編、類型、等級、狀態、審核狀態與內部備註會員不能改（後端不收這些欄位）。
 */
export interface MemberUpdateCompanyRequest {
  englishName?: string;
  phone?: string;
  fax?: string;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  establishmentDate?: string;
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  address?: MemberCompanyAddress;
  cooperationNote?: string;
  factoryName?: string;
  factoryAddress?: string;
  productImageFileIds?: string[];
  awardImageFileIds?: string[];
  logoFileId?: string;
  removeLogo?: boolean;
}

/**
 * 後端回傳的圖片網址在 `apiClient` 攔截器那一關被補上站台 basePath（`/sps/api/...`），
 * 瀏覽器要直接載入圖片時，拿掉前綴再接上後端公開位址（`NEXT_PUBLIC_API_BASE`，沒設就維持相對路徑）。
 */
export function memberAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
  const base = raw ? (raw.startsWith("/") ? raw : `/${raw}`) : "";
  const stripped = base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
  return resolveBackendAssetUrl(stripped);
}

export const memberCompanyApi = {
  async get(): Promise<MemberCompany> {
    const response = await apiClient.get<MemberCompany>("/api/member/company");
    return response.data;
  },

  async update(request: MemberUpdateCompanyRequest): Promise<MemberCompany> {
    const response = await apiClient.put<MemberCompany>("/api/member/company", request);
    return response.data;
  },

  async getTags(): Promise<number[]> {
    const response = await apiClient.get<{ tagIds?: number[] }>("/api/member/company/tags");
    return response.data.tagIds ?? [];
  },

  async setTags(tagIds: number[]): Promise<void> {
    await apiClient.put("/api/member/company/tags", { tagIds });
  },

  /** 上傳公司圖片（JPG／PNG／WebP／GIF，5MB 以內），回傳之後放進更新請求的檔案 Id */
  async uploadImage(file: File): Promise<MemberCompanyImage> {
    const form = new FormData();
    form.append("file", file, file.name);
    const response = await apiClient.post<{ fileId: string; fileName: string; url: string }>("/api/member/company/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};

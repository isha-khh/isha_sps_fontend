// 公司相關類型定義

export interface AddressDto {
  id?: number;
  type: number;
  postalCode?: string;
  region?: string;
  city?: string;
  district?: string;
  line?: string;
  description?: string;
}

/** 企業詳情的圖片（來自檔案管理） */
export interface CompanyImage {
  fileId: string;
  fileName: string;
  url: string;
}

export interface PictureResponse {
  id: number;
  name?: string;
  uri?: string;
  thumbnailUrl?: string;
}

export interface CreateCompanyRequest {
  name: string;
  englishName?: string;
  unifiedSocialCreditCode: string;
  phone?: string;
  fax?: string;
  type: CompanyType;
  level: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  /** 合作案例說明（前台企業詳情）；更新時沒帶＝不更新、空字串＝清除 */
  cooperationNote?: string;
  /** 主要產品暨服務示意圖的檔案 Id（最多 12 個）；更新時沒帶＝不更新、空陣列＝清除 */
  productImageFileIds?: string[];
  /** 獲獎事蹟暨重要合作案例圖片的檔案 Id（最多 12 個） */
  awardImageFileIds?: string[];
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  address?: AddressDto;
  photoId?: number;
  bannerId?: number;
}

export interface UpdateCompanyRequest {
  name?: string;
  englishName?: string;
  phone?: string;
  fax?: string;
  type?: CompanyType;
  removePhoto?: boolean;
  removeBanner?: boolean;
  level?: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  /** 合作案例說明（前台企業詳情）；更新時沒帶＝不更新、空字串＝清除 */
  cooperationNote?: string;
  /** 主要產品暨服務示意圖的檔案 Id（最多 12 個）；更新時沒帶＝不更新、空陣列＝清除 */
  productImageFileIds?: string[];
  /** 獲獎事蹟暨重要合作案例圖片的檔案 Id（最多 12 個） */
  awardImageFileIds?: string[];
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  status?: Status;
  address?: AddressDto;
  photoId?: number;
  bannerId?: number;
}

export const CompanyType = {
  Supplier: 1,
  Buyer: 2,
  Both: 3,
} as const;

export type CompanyType = typeof CompanyType[keyof typeof CompanyType];

/**
 * 對應後端 `SPS.Domain.Enums.CompanyLevel`（2026-10-01 由
 * Basic/Standard/Premium/VIP 改名）。這是**審查路徑紀錄**，不是等級
 * 高低：Excellent（卓越）＝申請時已具備政府資格驗證、只需文件審查；
 * Emerging（新興）＝需經專家委員評分審查。兩者功能完全相同，UI 顯示
 * 不可暗示誰比較高級（不要用金/銀/鑽石這類字眼）。
 */
export const CompanyLevel = {
  Standard: 0,
  Excellent: 1,
  Emerging: 2,
} as const;

export const COMPANY_LEVEL_LABELS: Record<CompanyLevel, string> = {
  [CompanyLevel.Standard]: '一般',
  [CompanyLevel.Excellent]: '卓越',
  [CompanyLevel.Emerging]: '新興',
};

export type CompanyLevel = typeof CompanyLevel[keyof typeof CompanyLevel];

/**
 * 通用狀態定義 (對應後端 Status Enum)
 * 數值類型為 short (0-6)
 * @description 涵蓋了帳號生命週期狀態（啟用/鎖定）以及審核流程狀態
 */
export const Status = {
    /** * 未啟用 / 停用 (Inactive)
     * @description 初始狀態或已被軟刪除 (Soft Deleted)，通常無法進行登入或主要操作
     */
    Inactive: 0,

    /** * 啟用中 (Active)
     * @description 正常運作狀態，擁有完整權限
     */
    Active: 1,


} as const;

/** * 通用狀態類型聯集
 * @typedef {0 | 1 | 2 | 3 | 4 | 5 | 6} Status
 */
export type Status = typeof Status[keyof typeof Status];

export interface DesignatedContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  mobilePhone?: string;
  memberJobTitle?: string;
}

export interface Company {
  id: string;
  number?: string;
  name: string;
  englishName?: string;
  unifiedSocialCreditCode?: string;
  phone?: string;
  fax?: string;
  type: CompanyType;
  level: CompanyLevel;
  revenue?: number;
  employees?: number;
  subject?: string;
  introduction?: string;
  introductionEnglish?: string;
  orgUrl?: string;
  videoUrl?: string;
  charge?: string;
  chargeEmail?: string;
  chargePhone?: string;
  chargeMobile?: string;
  chargeJobTitle?: string;
  establishmentDate?: string;
  remark?: string;
  status: Status;
  isVerified: boolean;
  verifiedAt?: string;
  address?: AddressDto;
  photo?: PictureResponse;
  banner?: PictureResponse;
  cooperationNote?: string;
  productImages?: CompanyImage[];
  awardImages?: CompanyImage[];
  designatedContacts?: DesignatedContact[];
  createdTime: string;
  updatedTime?: string;
}

export interface CompanySearchParams {
  search?: string;
  type?: CompanyType;
  level?: CompanyLevel;
  status?: Status;
  isVerified?: boolean;
}

/** 可供選擇的企業標籤（對應後端 CategoryType.CompanyTag 分類節點，支援階層） */
export interface CompanyTagOption {
  id: number;
  name: string;
  /** 上層節點 ID；root 節點為 undefined */
  parentId?: number;
  ordinal?: number;
}

/** 企業標籤綁定結果 (GET/PUT /api/Company/{id}/tags) */
export interface CompanyTagsResponse {
  companyId: string;
  tagIds: number[];
  tagNames: string[];
}

export interface CompanyStatistics {
  totalCompanies: number;
  supplierCount: number;
  buyerCount: number;
  bothCount: number;
  verifiedCount: number;
  activeCount: number;
  companiesThisMonth: number;
  companiesToday: number;
}

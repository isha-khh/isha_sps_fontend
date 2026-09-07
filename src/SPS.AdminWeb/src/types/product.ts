// 產品相關類型定義
// 產品相關類型定義
import type {PictureResponse} from './picture';

/**
 * 長度單位枚舉
 */
export const LengthUnit = {
  Millimeter:0,
  Centimeter:1,
  Meter:2,
  Inch:3,
  Foot:4,
} as const ;
export type LengthUnit = (typeof LengthUnit)[keyof typeof LengthUnit];
/**
 * 重量單位枚舉
 */
export const WeightUnit ={
  Gram:0,
  Kilogramz:1,
  Ton:2,
  Pound:3,
  Ounce:4,
} as const;
export type WeightUnit = (typeof WeightUnit)[keyof typeof WeightUnit];

/**
 * 產品文件回應
 */
export interface ProductFileResponse {
  id: string;
  fileNumber: string;
  originalFileName: string;
  fileExtension: string;
  contentType: string;
  fileSize: number;
  formattedFileSize: string;
  fileUrl?: string;
  createdTime: string;
}

/**
 * 產品回應資料
 */
export interface ProductResponse {
  id: number;
  number: string;
  name: string;
  modelNo?: string;
  mixed: boolean;
  unit?: string;
  lengthUnit?: LengthUnit;
  height?: number;
  width?: number;
  depth?: number;
  weightUnit?: WeightUnit;
  netWeight?: number;
  grossWeight?: number;
  conditionedWeight?: number;
  introduction?: string;
  remark?: string;
  categoryId?: number;
  companyId?: string;
  companyName?: string;
  published: boolean;
  /** 封面圖片 */
  cover?: PictureResponse;
  /** 產品圖片列表 */
  pictures: PictureResponse[];
  /** 產品圖片數量 */
  pictureCount: number;
  /** 產品文件列表 */
  files: ProductFileResponse[];
  /** 產品文件數量 */
  fileCount: number;
  createdTime: string;
  updatedTime?: string;
}

/**
 * 產品列表項回應
 */
export interface ProductListItemResponse extends ProductResponse {}

/**
 * 創建產品請求
 */
export interface CreateProductRequest {
  name: string;
  modelNo?: string;
  mixed: boolean;
  unit?: string;
  lengthUnit?: LengthUnit;
  height?: number;
  width?: number;
  depth?: number;
  weightUnit?: WeightUnit;
  netWeight?: number;
  grossWeight?: number;
  conditionedWeight?: number;
  introduction?: string;
  remark?: string;
  categoryId?: number;
  companyId?: string;
  published: boolean;
  /** 封面圖片 ID */
  coverId?: number;
  /** 產品圖片 ID 列表 */
  pictureIds?: number[];
  /** 產品文件 ID 列表（UploadedFile Guid） */
  fileIds?: string[];
}

/**
 * 更新產品請求
 */
export interface UpdateProductRequest {
  name?: string;
  modelNo?: string;
  mixed?: boolean;
  unit?: string;
  lengthUnit?: LengthUnit;
  height?: number;
  width?: number;
  depth?: number;
  weightUnit?: WeightUnit;
  netWeight?: number;
  grossWeight?: number;
  conditionedWeight?: number;
  introduction?: string;
  remark?: string;
  categoryId?: number;
  published?: boolean;
  /** 封面圖片 ID */
  coverId?: number;
  /** 是否移除封面圖片 */
  removeCover?: boolean;
  /** 產品圖片 ID 列表（會取代現有圖片） */
  pictureIds?: number[];
  /** 產品文件 ID 列表（會取代現有文件，UploadedFile Guid） */
  fileIds?: string[];
}

/**
 * 產品查詢參數
 */
export interface ProductQueryParameters {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  descending?: boolean;
  companyId?: string;
  categoryId?: number;
  published?: boolean;
}

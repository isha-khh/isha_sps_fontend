// 產品相關類型定義
import type {PictureResponse} from './picture';
import type {FileInfo} from './files';
import type {SystemFile} from './files';

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
  /** 封面圖 - API 回傳為 URL 字串 */
  photo?: string;
  /** 封面圖物件（詳情 API 可能回傳） */
  cover?: PictureResponse;
  /** 產品圖片（詳情 API 可能回傳） */
  pictures?: PictureResponse[];
  /** 附件檔案（詳情 API 可能回傳） */
  files?: FileInfo[];
  createdTime: string;
  updatedTime?: string;
}

/**
 * 產品列表項回應
 */
export type ProductListItemResponse = ProductResponse;

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
  coverId?: number;
  pictureIds?: number[];
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
  coverId?: number;
  removeCover?: boolean;
  pictureIds?: number[];
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

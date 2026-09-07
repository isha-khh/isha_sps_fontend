import type { MemberPosition } from "@/types/api.ts";
import type {AddressDto, PictureResponse, Status} from "@/types/company.ts";

//================== UpdateMemberProfileRequest.cs ==================//

/**
 * 重設會員密碼的請求介面
 * 對應後端模型: UpdateMemberProfileRequest (部分功能) 或 ResetPasswordRequest
 */
export interface ResetMemberPasswordRequest {
    /** 新設定的密碼字串 */
    newPassword: string;

    /** * 是否強制使用者在下次登入時更換密碼
     * @default false
     */
    requirePasswordChange: boolean;
}

//================== MemberProfileResponse.cs ==================//

/**
 * 會員個人資料回應介面
 * 包含會員的基本資訊、角色、職位與權限設定
 */
export interface MemberProfileResponse {
    /** 會員唯一識別碼 (UUID) */
    id: string;

    /** 會員編號 (例如: MEM-2023001) */
    number: string;

    /** 會員暱稱 */
    nickname: string;

    /** 電子郵件地址 */
    email: string;

    /** 公司電話 */
    phone: string;

    /** 分機號碼 */
    extension: string;

    /** 行動電話 */
    mobilePhone: string;

    /** 所屬公司 ID */
    companyId: string;

    /** 所屬公司名稱 */
    companyName: string;

    /** * 職稱字串 (顯示用)
     * @example "資深工程師"
     */
    position: string;

    /** * 會員職務抬頭
     * @example "Manager"
     */
    memberJobTitle: string;

    /** * 會員角色 ID
     * @see MemberRole 參考 MemberRole 列舉
     */
    role: MemberRole;

    /** * 會員職位類型
     */
    memberPosition: MemberPosition;

    /** * 會員權限數值
     * 通常由後端回傳，前端需轉換為 BigInt 進行位元運算
     */
    permissions: number | string;

    /** 大頭貼照片 ID */
    photoId: number;

    /** 大頭貼照片 URL */
    photoUrl: string;

    /** * 是否已驗證信箱
     */
    isEmailVerified: boolean;

    /** * 信箱驗證時間 (ISO 8601 String)
     * @example "2023-10-27T10:00:00Z"
     */
    emailVerifiedAt?: string;

    /** * 最後登入時間 (ISO 8601 String)
     * @example "2023-10-27T10:00:00Z"
     */
    lastLoginAt: string;

    /** * 建立時間 (ISO 8601 String)
     */
    createdAt: string;

    /** * 最後更新時間 (ISO 8601 String)
     */
    updatedAt: string;
}

//

/**
 * 會員角色定義 (常量物件)
 * 用於區分使用者的市場角色
 */
export const MemberRole = {
    /** * 供給端 (Supplier)
     * 代表提供產品或服務的一方
     */
    Supplier: 1,

    /** * 需求端 (Buyer)
     * 代表採購或尋求服務的一方
     */
    Buyer: 2,
} as const;

/** * 會員角色類型
 * @typedef {1 | 2} MemberRole
 */
export type MemberRole = typeof MemberRole[keyof typeof MemberRole];


/**
 * 會員權限定義 (Bitwise Flags)
 * 使用 BigInt 進行位元運算以支援超過 53-bit 的權限組合
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
 */
export const MemberPermission = {
    /** 無權限 */
    None: 0n, // 使用 BigInt (n) 對應 long

    //------------- 公司資料權限 -------------//

    /** 查看公司資料 (Bit 0) */
    ViewCompany: 1n << 0n,   // 1

    /** 編輯公司資料 (Bit 1) */
    EditCompany: 1n << 1n,   // 2

    //------------- 產品管理 (供給端) -------------//

    /** 查看產品 (Bit 10) */
    ViewProduct: 1n << 10n,  // 1024

    /** 建立產品 (Bit 11) */
    CreateProduct: 1n << 11n, // 2048

    /** 編輯產品 (Bit 12) */
    EditProduct: 1n << 12n,   // 4096

    /** 刪除產品 (Bit 13) */
    DeleteProduct: 1n << 13n, // 8192

    //------------- 需求管理 (需求端) -------------//

    /** 查看需求 (Bit 20) */
    ViewDemand: 1n << 20n,   // 1048576

    /** 建立需求 (Bit 21) */
    CreateDemand: 1n << 21n,  // 2097152

    /** 編輯需求 (Bit 22) */
    EditDemand: 1n << 22n,    // 4194304

    /** 刪除需求 (Bit 23) */
    DeleteDemand: 1n << 23n,  // 8388608
} as const;

/** * 會員權限類型 (BigInt)
 * 用於權限判斷，例如: (userPerm & MemberPermission.ViewCompany) === MemberPermission.ViewCompany
 */
export type MemberPermission = bigint;


//================== UpdateMemberProfileRequest.cs ==================//

/**
 * 更新會員個人資料請求介面
 * 包含可選的聯絡資訊與必要的職位資訊
 */
export interface UpdateMemberProfileRequest {
    /** * 會員暱稱
     * @optional
     */
    nickname?: string;

    /** * 公司電話
     * @optional
     */
    phone?: string;

    /** * 分機號碼
     * @optional
     */
    extension?: string;

    /** * 行動電話
     * @optional
     */
    mobilePhone?: string;

    /** * 職稱 (顯示用)
     * @example "專案經理"
     */
    position: string;

    /** * 會員職務抬頭
     * @example "PM"
     */
    memberJobTitle: string;

    /** * 大頭貼照片 ID
     * 若未更改照片可能需傳回原 ID 或 null
     */
    photoId?: number | null;
}



/**
 * 驗證碼用途定義 (常量物件)
 * 用於區分系統發送驗證碼 (OTP) 的具體業務場景。
 */
export const VerificationCodePurpose = {
    /** * 修改密碼
     * @description 用戶於登入狀態下，為了安全性主動變更密碼。
     */
    ChangePassword: 0,

    /** * 重設密碼
     * @description 用戶忘記密碼時，透過信箱或簡訊驗證後強制重設。
     */
    ResetPassword: 1,

    /** * 驗證電子郵件
     * @description 用於帳號註冊後的激活，或更換綁定信箱時的身份確認。
     */
    VerifyEmail: 2,

    /** * 登入驗證
     * @description 二次驗證 (2FA) 或無密碼登入模式下的身份驗證。
     */
    Login: 3
} as const;

/** * 驗證碼用途類型
 * @description 從 `VerificationCodePurpose` 常量自動推導出的數值聯集類型 (0 | 1 | 2 | 3)
 */
export type VerificationCodePurpose = typeof VerificationCodePurpose[keyof typeof VerificationCodePurpose];


export interface MemberChangePasswordRequest{
    /** 前台會員修改密碼請求（需驗證碼） */
    email:string;
    /** 驗證碼 */
    verificationCode:string;
    /** 新設定的密碼字串 */
    newPassword: string;
    /** 重新輸入 */
    confirmPassword:string;
}

/**
 * 公司詳細資料回應 (DTO)
 * 對應後端模型: CompanyResponse
 * @description 用於顯示公司詳情頁面 (Detail Page) 的完整資料結構
 */
export interface CompanyResponse {
    /** 公司唯一識別碼 (GUID) */
    id: string;

    /** * 公司編號
     * @optional 內部管理用的編號 (例如: COM-2023001)
     */
    number?: string;

    /** * 公司名稱 (當地語言)
     * @optional
     */
    name?: string;

    /** * 公司英文名稱
     * @optional
     */
    englishName?: string;

    /** * 統一社會信用代碼 / 統編 / 稅號
     * @optional (Unified Social Credit Code)
     */
    unifiedSocialCreditCode?: string;

    /** * 公司電話
     * @optional
     */
    phone?: string;

    /** * 公司傳真
     * @optional
     */
    fax?: string;

    /** * 公司類型
     * @see CompanyType (0:General, 1:Premium, 2:Enterprise)
     */
    type: CompanyType;

    /** * 公司等級
     * @see CompanyLevel (0:Basic, 1:Standard, 2:Premium, 3:VIP)
     */
    level: CompanyLevel;

    /** * 年營收
     * @description 單位通常需參照後端定義 (例如: 萬元 或 元)
     */
    revenue: number;

    /** * 員工人數規模
     */
    employees: number;

    /** * 主營項目 / 營業項目
     * @optional 簡短描述公司主要業務
     */
    subject?: string;

    /** * 公司簡介 (當地語言)
     * @optional 支援 HTML 或純文字，視後端實作而定
     */
    introduction?: string;

    /** * 公司簡介 (英文)
     * @optional
     */
    introductionEnglish?: string;

    /** * 公司官方網站 URL
     * @optional
     */
    orgUrl?: string;

    /** * 公司介紹影片 URL
     * @optional YouTube 或其他串流連結
     */
    videoUrl?: string;

    //---------------- 負責人/聯絡窗口資訊 ----------------//

    /** * 負責人姓名 / 聯絡人姓名
     * (Charge Person Name)
     */
    charge: string;

    /** * 負責人 Email
     * @optional
     */
    chargeEmail?: string;

    /** * 負責人電話
     * @optional
     */
    chargePhone?: string;

    /** * 負責人手機
     * @optional
     */
    chargeMobile?: string;

    /** * 負責人職稱
     * @optional
     */
    chargeJobTitle?: string;

    //---------------- 狀態與系統資訊 ----------------//

    /** * 成立日期 (ISO 8601 String)
     * @optional @example "1990-01-01T00:00:00"
     */
    establishmentDate?: string;

    /** * 備註
     * @optional 內部或管理員註記
     */
    remark?: string;

    /** * 公司狀態
     * @see Status (Active, Locked, PendingApproval...)
     */
    status: Status;

    /** * 是否已通過認證
     * @description 顯示是否擁有官方認證標章
     */
    isVerified: boolean;

    /** * 通過認證時間 (ISO 8601 String)
     * @optional 若 isVerified 為 false 則此欄位通常為 null
     */
    verifiedAt?: string;

    //---------------- 巢狀物件 (Nested Objects) ----------------//

    /** * 公司地址資訊
     * @description 包含國家、城市、街道、郵遞區號等結構化資料
     */
    address: AddressDto;

    /** * 公司 Logo 圖片資訊
     * @description 包含圖片 ID、URL、縮圖等
     */
    photo: PictureResponse;

    /** * 公司橫幅/封面圖片資訊 (Banner)
     * @description 用於個人頁面頂部顯示的大圖
     */
    banner: PictureResponse;

    /** * 資料建立時間 (ISO 8601 String)
     */
    createdTime: string;

    /** * 最後更新時間 (ISO 8601 String)
     * @optional
     */
    updatedTime?: string;
}

/**
 * 會員列表項響應 (DTO)
 * 對應後端模型: MemberListItemResponse
 * @description 用於後台會員列表顯示的輕量級摘要資訊
 */
export interface MemberListItemResponse {
    /** 會員唯一識別碼 (GUID) */
    id: string;

    /** 會員姓名 */
    name: string;

    /** 電子郵件 */
    email: string;

    /** * 行動電話
     * @nullable 可能為 null (若未填寫)
     */
    mobilePhone: string | null;

    /** * 所屬公司 ID (GUID)
     * @nullable 可能為 null (若會員尚未綁定公司)
     */
    companyId: string | null;

    /** * 所屬公司名稱
     * @nullable 可能為 null
     */
    companyName: string | null;

    /** * 會員帳號狀態
     * @see Status (0:Inactive, 1:Active, 3:Locked ...)
     */
    status: Status;

    /** * 會員角色
     * @see MemberRole (1:Supplier, 2:Buyer)
     */
    role: MemberRole;

    /** * 是否已審核通過
     * @description 用於 UI 快速判斷顯示狀態，通常與 Status 連動
     */
    isApproved: boolean;

    /** * 最後登入時間 (ISO 8601 String)
     * @nullable 若從未登入過則為 null
     * @example "2023-10-27T10:00:00Z"
     */
    lastLoginAt: string | null;

    /** * 帳號建立時間 (ISO 8601 String)
     */
    createdAt: string;
}



/**
 * 公司類型定義 (對應後端 CompanyType Enum)
 * 數值類型為 short (0-2)
 */
export const CompanyType = {
    /** * 供給端
     * @description 提供產品/服務的企業
     */
    Supplier: 1,

    /** * 需求端
     * @description 採購產品/服務的企業
     */
    Buyer: 2,

    /** * 供需雙方
     * @description 同時提供與採購產品/服務的企業
     */
    Both: 3
} as const;

/** * 公司類型聯集 (Union Type)
 * @typedef {1 | 2 | 3} CompanyType
 */
export type CompanyType = typeof CompanyType[keyof typeof CompanyType];


/**
 * 公司等級定義 (對應後端 CompanyLevel Enum)
 * 數值類型為 short (0-3)，通常用於區分會員訂閱級別或服務層級
 */
export const CompanyLevel = {
    /** * 基本等級 (Basic)
     * @description 入門方案，通常對應免費或試用版功能
     */
    Basic: 0,

    /** * 標準等級 (Standard)
     * @description 標準方案，包含核心功能
     */
    Standard: 1,

    /** * 進階等級 (Premium)
     * @description 進階方案，包含進階功能或更高配額
     */
    Premium: 2,

    /** * 尊榮等級 (VIP)
     * @description 最高等級，包含完整權限、專屬客服或客製化服務
     */
    VIP: 3
} as const;

/** * 公司等級類型聯集
 * @typedef {0 | 1 | 2 | 3} CompanyLevel
 */
export type CompanyLevel = typeof CompanyLevel[keyof typeof CompanyLevel];

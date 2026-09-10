import type { Data } from "@puckeditor/core";

/** 後端 400 回的 ProblemDetails/擴充欄位 */
export type ApiProblem = {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    instance?: string;
    [key: string]: unknown;
};

export type ContentBlock =
    | { type: "heading"; level: 2 | 3; text: string }
    | { type: "paragraph"; text: string }
    | { type: "list"; ordered?: boolean; items: string[] }
    | {
    size?: "sm" | "md" | "lg" | "full";
    width?: number;
    height?: number;
    type: "image"; src: string; alt?: string; caption?: string }
    | { type: "table"; headers: string[]; rows: string[][] }
    | { type: "link"; href: string; text: string; external?: boolean; // true = 新開視窗
    };

export type CaseImage = {
    key?: string;
    src: string;
    alt?: string;
};

export type HomeCase = {
    id: string;
    title: string;
    coverImageUrl: string;
    href: string;
    publishedAt: string;
    tag: {
        name: string;
        miniTags: string[];
    };

    summary?: string;
    content?: ContentBlock[];
    images?: CaseImage[];
};

export type HomeStat = {
    key: string;
    label: string;
    value: number;
    format?: "number" | "currency";
};

/**
 * 對到真後端 `SuccessCaseDto`（SPS.Application/DTOs/SuccessCase）——
 * `/promotion`（產業案例）用的內容類型。跟 `NewsItem` 不一樣的地方：
 * 這裡的「分類」是 `industry`（自由文字，例如「石化產業」「傳統
 * 製造業」），不是 `Category` 表的數字 id，因為 `SuccessCase` entity
 * 沒有掛 `CategoryId`，篩選/分類清單直接用這個字串就好，不用像
 * News/FAQ 那樣另外處理 id↔name 的對應。
 */
export type PromotionCase = {
    id: number;
    title: string;
    companyName: string;
    industry: string;
    coverImageUrl?: string;
    summary: string;
    tags?: string[];
    // 可能是 null（尚未排程發布日期的草稿）
    publishedDate: string | null;
    isPublished: boolean;
    viewCount: number;
    createdTime: string;
};

export type PromotionCaseDetail = PromotionCase & {
    // 直接存 puck Data，跟 News.Content／Question.Answer 同一套格式
    content: string;
};

/**
 * 對到真後端 `VideoListItemResponse`（SPS.Application/DTOs/Video）——
 * `/promotion/video`（影音專區）、首頁 `HomeVideo` 用的內容類型。
 *
 * 跟 News/SuccessCase 不一樣的地方：
 * - 沒有 `viewCount`——`Video` entity 沒有點閱數欄位，「熱門影片」
 *   沒辦法像 News/Promotion 那樣照真實點閱率排序，只能退而求其次用
 *   `ordinal`／`createdTime`（見 promotion-data.ts 的說明）。
 * - 「分類」是 `albumTitle`（掛在哪個相簿），跟 SuccessCase.industry
 *   一樣是自由文字，不是 Category 表的數字外鍵。
 * - `ordinal` 是真的排序欄位（`linkUrl`／`ordinal` 原本只有詳情 API
 *   有，2026-09-10 已請後端一起補進列表 API），首頁/列表頁的
 *   「精選影音」就是挑 `ordinal` 最小的那一支。
 * - 沒有獨立的影片詳情頁——卡片點下去是 `linkUrl`（外部影片連結，
 *   例如 YouTube），`target="_blank"` 開新分頁，不是站內 `/video/[id]`。
 */
export type VideoItem = {
    id: number;
    name?: string;
    uri?: string;
    thumbnailUri?: string;
    linkUrl?: string;
    // 後台可以針對每支影片個別決定：`true` 在站內用燈箱嵌入播放
    // （YouTube／Vimeo 等），`false` 直接連到 `linkUrl`／`uri` 原始
    // 來源（開新分頁）——2026-09-10 客戶顧慮正式環境的 CSP
    // （`frame-src`）不一定放行每個外部影片來源網域，加這個欄位讓
    // 後台可以逐支關掉嵌入播放，不用改前端程式碼、也不影響其他支
    // 影片。
    playOnSite: boolean;
    published: boolean;
    ordinal: number;
    albumId?: number;
    albumTitle?: string;
    createdTime: string;
};

export type FaqItem = {
    id: string;
    href: string;
    question: string;
    answer?: string;
    categoryId?: number;
    categoryName?: string;
}

export type NewsItem = {
    id: number;
    title: string;
    introduction: string;
    // 真後端 News.StartDate 是 `DateTime?`（可為 null）——2026-09-08
    // 實測 98 筆真資料裡有 2 筆確實是 null（例如已經額滿/已結束、當初
    // 沒填開始日期的公告），不是理論上的邊界情況，畫面上要處理
    startDate: string | null;
    // 有這個欄位才算「活動」（有起訖區間），沒有就是普通公告——不是
    // 另外存一個「是不是活動」的布林欄位，是用 endDate 存不存在來判斷
    // （2026-09-08 跟後端一起定案，見 docs/改版規劃.md）
    endDate?: string;
    published: boolean;
    categoryId: number;
    categoryName: string;
    createdTime: string;
    // 對到真後端 NewsListItemResponse.Tags，原本列表 API 沒有這個
    // 欄位、只有詳情有，2026-09-08 已請後端一起補上
    tags?: string[];
    // 對到真後端 NewsListItemResponse.ImageUrl（News.Picture.DefaultImageUri），
    // 2026-09-08 已請後端補上，沒設定圖片時仍可能是 undefined/null，
    // 畫面上要有 fallback（見 news-data.ts 的 NEWS_FALLBACK_IMAGE）
    imageUrl?: string;
    // 對到真後端 NewsListItemResponse.ViewCount，本來就有這個欄位、
    // 只是先前沒有從後端 DTO 補進來——「熱門文章」側欄要照點閱率排序
    // 用得到（見 news-data.ts 的 sortNewsByViewCount）
    viewCount: number;
};

export type PagedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

export type NewsDetail = {
    id: number;
    title: string;
    introduction?: string;
    // 可能是 null，理由同 NewsItem.startDate
    startDate: string | null;
    endDate?: string;
    published: boolean;
    categoryId: number;
    categoryName: string;
    createdTime: string;
    // 對到真後端 NewsResponse.Tags，拿來當詳情頁「關鍵字」區塊用
    tags?: string[];
    // 對到真後端 NewsResponse.ImageUrl，見 NewsItem 的註解
    imageUrl?: string;
    // 對到真後端 NewsResponse.ViewCount，見 NewsItem 的註解
    viewCount: number;

    // 直接存 puck Data
    content: string;
};

export type Category = {
    id: number;
    type: number;
    name: string;
    published: boolean;
}

export type CompanyCode = {
    unifiedSocialCreditCode: string;
    companyName: string;
    responsibleName: string;
}

/**
 * 對到真後端 `CompanyListItemResponse`（SPS.Application/DTOs/Company）。
 * `photo`／`tagNames` 是後端本來就有回傳、先前型別忘了補的欄位（跟
 * News/SuccessCase 踩過的坑一樣）——首頁「企業刊登」接真資料時才
 * 發現：`photo` 是相對後端 API 的檔案路徑，要用
 * `content-list-utils.ts` 的 `resolveBackendAssetUrl` 轉成完整網址；
 * `tagNames` 是企業標籤（`CompanyController` 的 `/tags` 那組 API 管理），
 * 拿來當「技術供應／系統整合」這類分類徽章用。
 */
export type CompanyList = {
    id: string;
    number: string;
    name: string;
    englishName?: string;
    type: number;
    level: number;
    subject?: string;
    introduction?: string;
    employees?: number;
    status: number;
    isVerified: boolean;
    photo?: string;
    tagNames: string[];
    createdTime: string;
}

export type CompanyRequest = {
    unifiedSocialCreditCode: string;
};

export type CreateCompanyRequest = {
    unifiedSocialCreditCode: string;
    name: string;
};

export type CompanyDetail = {
    id: string;
    number: string;
    name: string;
    englishName: string;

    unifiedSocialCreditCode: string;
    phone: string;
    fax: string;
    address: string;

    type: number;
    level: number;

    revenue: number;
    employees: number;

    subject: string;
    introduction: string;
    introductionEnglish: string;

    orgUrl: string;
    videoUrl: string;

    charge: string;
    chargeEmail: string;
    chargePhone: string;
    chargeMobile: string;
    chargeJobTitle: string;

    establishmentDate: string;
    remark: string;

    status: number;
    isVerified: boolean;
    verifiedAt: string;
    createdTime: string;
    updatedTime: string;
}

export type LoginRequest = {
    email: string;
    password: string;
    turnstileToken?: string;
};

export type LoginMember = {
    id: string;
    email: string;
    name: string;
    phone: string;
    extension: string;
    mobilePhone: string;
    companyId: string;
    companyName: string;
};

export type LoginResponse = {
    member: LoginMember;
    requirePasswordChange: boolean;
    passwordChangeReason?: string;
};

export type RegisterMemberRequest = {
    id?: string;                 // 新增時通常可以不傳，由後端產生
    contactName: string;
    position: string;
    email: string;
    phone: string;
    extension: string;
    mobilePhone: string;
    password: string;
    confirmPassword: string;
    memberPosition: number;      // 例如：1 = 主要聯絡人, 2 = 次要
    orderIndex: number;          // 排序用
};

export type RegisterRequest = {
    memberRole: number;
    unifiedSocialCreditCode: string;
    companyName: string;
    companyAddress: string;
    contactPerson: string;
    reason: string;
    members: RegisterMemberRequest[];
};

export type RegisterResponse = {
    id: string;
    memberRole: number;
    unifiedSocialCreditCode: string;
    contactPerson: string;
    reason: string;
};

export type RegisterEmail = {
    email: string;
}


/** UploadDocumentRequest（前端對應） */
export type UploadDocumentRequest = {
    applicationId: string; // Guid -> string
    type: DocumentType;
    file: File;
};
export type UploadDocumentResponse = {
    id: string;
    type: DocumentType;
    fileName: string;
    filePath: string;
    contentType: string;
    fileSize: number;
    fileHash: string;
    expiresAt: string;     // ISO string
    createdTime: string;   // ISO string
};


// src/lib/types.application.ts

export enum ApplicationStatus {
    Inactive = 0,
    Active = 1,
    Suspended = 2,
    Locked = 3,
    PendingApproval = 4,
    Approved = 5,
    Rejected = 6,
}
export type MemberRoleValue = 1 | 2;    // 1=supply, 2=demand

export type ApplicationMemberResponse = {
    id: string;
    contactName: string;
    position: string;
    email: string;
    phone: string;
    extension: string;
    mobilePhone: string;
    memberPosition: number; // 1=主要, 2=次要
    orderIndex: number;
    status: number;
    createdMemberId: string;
    createdTime: string;
};

export type ApplicationDocumentResponse = {
    id: string;
    type: number; // 1..5 (DocumentType)
    fileName: string;
    filePath: string;
    contentType: string;
    fileSize: number;
    fileHash: string;
    expiresAt: string;
    createdTime: string;
};

export type ApplicationLogResponse = {
    id: string;
    fromStatus: number;
    toStatus: number;
    operatorId: string;
    operatorName: string;
    action: string;
    comment: string;
    ipAddress: string;
    operatedAt: string;
};

export type ApplicationDetailResponse = {
    id: string;
    applicationNumber: string;
    memberRole: MemberRoleValue;
    status: ApplicationStatus;

    // 「申請主聯絡資訊」（看起來是主檔也有一份）
    email: string;
    contactName: string;
    phone: string;
    extension: string;
    mobilePhone: string;
    position: string;

    companyId: string;
    unifiedSocialCreditCode: string;
    companyName: string;
    contactPerson: string;

    isManualInput: boolean;
    businessScope: string;
    companyAddress: string;
    reason: string;
    remark: string;

    reviewerId: string;
    reviewerName: string;
    reviewStartedAt: string;
    reviewedAt: string;
    reviewComment: string;
    rejectionReason: string;

    submittedAt: string;
    createdTime: string;
    updatedTime: string;

    members: ApplicationMemberResponse[];
    documents: ApplicationDocumentResponse[];
    logs: ApplicationLogResponse[];
};

// 前端 Step2 用的角色字串
export type MemberRole = "supply" | "demand";
export function toMemberRole(v: MemberRoleValue): MemberRole {
    return v === 1 ? "supply" : "demand";
}

export type UpdateApplicationRequest = RegisterRequest;

export type CancelApplicationResponse = {
    success: boolean;
};
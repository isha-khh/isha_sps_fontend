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

export type FaqItem = {
    id: string;
    href: string;
    question: string;
    answer?: string;
}

export type NewsItem = {
    id: number;
    title: string;
    introduction: string;
    startDate: string;
    published: boolean;
    categoryId: number;
    categoryName: string;
    createdTime: string;
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
    startDate: string;
    published: boolean;
    categoryId: number;
    categoryName: string;
    createdTime: string;

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

export type CompanyList = {
    id: string;
    number: string;
    name: string;
    englishName: string;
    type: number;
    level: number;
    subject: string;
    employees: number;
    status: number;
    isVerified: boolean;
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
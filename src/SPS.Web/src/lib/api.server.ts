import { headers } from "next/headers";
import {
    BannerItem,
    SearchResult,
    FaqItem,
    NewsItem,
    NewsDetail,
    PromotionCase,
    PromotionCaseDetail,
    PagedResult,
    CompanyList,
    DemandItem,
    PublicCompanyDetail,
    VideoItem,
    FooterLinks,
    ContributePage,
    DownloadResources,
    DownloadLink,
} from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/content-list-utils";
import { buildTaxonomy, type TagRecord, type TagTaxonomy } from "@/lib/company-tags";

async function getBaseUrlFromRequest() {
    const h = await headers();
    const host = h.get("host");
    if (!host) return null;

    const proto = process.env.NODE_ENV === "development" ? "http" : "https";
    return `${proto}://${host}`;
}

function buildUrl(base: string, path: string): string {
    base = base.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
}

async function fetchJson<T>(url: string, revalidateSeconds?: number): Promise<T> {
    // 預設不快取；每一頁都會用到、很少變動的資料（頁尾連結）可以給 revalidate，省下每次頁面渲染多打一支 API
    const res = await fetch(url, {
        ...(revalidateSeconds === undefined ? { cache: "no-store" as const } : { next: { revalidate: revalidateSeconds } }),
        headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
    return res.json();
}

/**
 * 打後端 API（API_URL 優先，適用 Docker 環境）
 */
async function getBackendJson<T>(path: string, revalidateSeconds?: number): Promise<T> {
    const apiUrl = process.env.API_URL?.trim();
    const envBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
    const reqBase = await getBaseUrlFromRequest();

    let base = apiUrl || envBase || reqBase;
    if (!base) throw new Error("Cannot determine base url for backend fetch.");
    if (!base.startsWith('http')) base = `https://${base}`;

    return fetchJson<T>(buildUrl(base, path), revalidateSeconds);
}


// ===== Server only APIs =====

type QuestionPagedResult = {
    items?: Array<{
        id: number;
        subject?: string;
        answer?: string;
        published: boolean;
        categoryId?: number;
        categoryName?: string;
    }>;
};

function mapQuestionsToFaqItems(
    items: NonNullable<QuestionPagedResult["items"]>
): FaqItem[] {
    return items.map((q) => ({
        id: String(q.id),
        href: `/faq/${q.id}`,
        question: q.subject ?? "",
        answer: q.answer ?? undefined,
        categoryId: q.categoryId,
        categoryName: q.categoryName,
    }));
}

type QuestionDetail = {
    id: number;
    subject?: string;
    answer?: string;
    published: boolean;
    categoryId?: number;
    categoryName?: string;
};

/**
 * 嘗試從後端取得已發布的 FAQ 列表，回傳 null 表示後端無資料或不可用
 */
async function tryBackendQuestions(search?: string): Promise<FaqItem[] | null> {
    try {
        // 查詢參數要對到真後端 QuestionQueryParameters 的欄位名稱
        // （SPS.Application/DTOs/Question/QuestionQueryParameters.cs）：
        // 是 `page`，不是 `pageIndex`——原本寫錯的 `pageIndex` 不會噴錯，
        // 只是完全沒有作用（ASP.NET 對不上名字就直接用預設值 `Page = 1`），
        // 目前恰好都抓第一頁才沒被發現，之後真的要分頁時會是個地雷。
        const response = await apiClient.get<QuestionPagedResult>(
            "/api/Question", { params: { page: 1, pageSize: 100, search: search || undefined } }
        );
        const published = response.data.items?.filter((q) => q.published) ?? [];
        if (published.length > 0) {
            return mapQuestionsToFaqItems(published);
        }
    } catch {
        // 後端不可用
    }
    return null;
}

/**
 * 取得 FAQ 列表
 * 優先使用後端 questionsApi.getPaged，無資料時 fallback 到 mock
 */
export async function fetchFaq(options?: { search?: string }): Promise<{ items: FaqItem[] }> {
    const backendItems = await tryBackendQuestions(options?.search);
    return { items: backendItems ?? [] };
}

/**
 * 取得單筆 FAQ 詳情
 * 優先使用後端 questionsApi.getById，無資料時 fallback 到 mock 並用 id 查找
 */
export async function fetchFaqDetail(id: string): Promise<FaqItem | null> {
    try {
        const response = await apiClient.get<QuestionDetail>(`/api/Question/${id}`);
        const detail = response.data;
        return {
            id: String(detail.id),
            href: `/faq/${detail.id}`,
            question: detail.subject ?? "",
            answer: detail.answer ?? undefined,
            categoryId: detail.categoryId,
            categoryName: detail.categoryName,
        };
    } catch {
        return null;
    }
}

/**
 * `apiClient` 的 response interceptor 會把回應裡「欄位名稱以 url 結尾、值以 `/` 開頭」的欄位
 * 自動補上 basePath（為了圖片／下載網址設計的，見 api-client.ts 的 `addBasePathToResponseData`），
 * `linkUrl`／`secondaryLinkUrl` 剛好也中招：後台填 `/news` 回來變成 `/sps/news`，再交給
 * `next/link` 又會補一次 basePath，變成 `/sps/sps/news`。連結欄位要的是「站內原始路徑」，
 * 這裡把攔截器補的前綴拿掉。
 */
function stripBasePath(path?: string): string | undefined {
    if (!path) return path;
    const raw = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
    const base = raw ? (raw.startsWith("/") ? raw : `/${raw}`) : "";
    return base && path.startsWith(`${base}/`) ? path.slice(base.length) : path;
}

/**
 * 全站搜尋（`GET /api/Search`）。回傳 `null` 代表後端連不到／噴錯，跟「搜尋了但 0 筆」
 * （`totalCount` 為 0）刻意分開，理由同 `tryBackendNews`。`url`／`moreUrl` 同樣會被
 * `apiClient` 攔截器補上 basePath，要拿掉才不會被 `next/link` 再補一次（見 `stripBasePath`）。
 */
export async function fetchSearch(keyword: string, limit = 5): Promise<SearchResult | null> {
    try {
        const response = await apiClient.get<SearchResult>("/api/Search", { params: { q: keyword, limit } });
        const data = response.data;
        return {
            ...data,
            groups: data.groups.map((g) => ({
                ...g,
                moreUrl: stripBasePath(g.moreUrl) ?? g.moreUrl,
                items: g.items.map((item) => ({ ...item, url: stripBasePath(item.url) ?? item.url })),
            })),
        };
    } catch {
        return null;
    }
}

/**
 * 取得指定版位目前上架中的 Banner（後端已依上下架時間過濾、依排序排好）。連不到後端或沒有
 * 任何 Banner 都回傳空陣列——呼叫端自己決定怎麼處理：首頁主視覺退回內建文案，公告頂部輪播
 * 整塊不顯示。圖片網址是相對於後端 API 的路徑，要轉成完整網址瀏覽器才載得到。
 */
export async function fetchBanners(positionCode: string): Promise<BannerItem[]> {
    try {
        const response = await apiClient.get<BannerItem[]>(`/api/Banner/by-code/${encodeURIComponent(positionCode)}`);
        return (response.data ?? []).map((b) => ({
            ...b,
            uri: resolveBackendAssetUrl(b.uri),
            linkUrl: stripBasePath(b.linkUrl),
            secondaryLinkUrl: stripBasePath(b.secondaryLinkUrl),
        }));
    } catch {
        return [];
    }
}

/**
 * 嘗試從後端取得已發布的公告列表，回傳 null 表示後端「連不到／噴錯」。
 * 對到真後端 `NewsQueryParameters`（SPS.Application/DTOs/News），分頁
 * 包裝跟 `PagedResult`（lib/types.ts）一致，`GET /api/News` 回來的
 * `items` 元素形狀直接等於 `NewsItem`。`search` 對到 `NewsQueryParameters.Search`
 * （後端用 Title／Introduction 做 contains 比對）。
 *
 * 回傳 `null` 專門代表「連不到後端／噴例外」，跟「後端有回應但這次查詢
 * 剛好 0 筆」（回傳 `[]`）刻意分開——一開始沒加搜尋功能時這兩種情況
 * 反正都退回假資料，混在一起也看不出差別；但接上搜尋之後，「使用者
 * 搜尋一個沒有結果的關鍵字」跟「後端掛了」如果都退回假資料，畫面會
 * 誤導使用者以為假資料就是搜尋結果。
 */
async function tryBackendNews(search?: string, tagId?: number): Promise<NewsItem[] | null> {
    try {
        const response = await apiClient.get<PagedResult<NewsItem>>(
            "/api/News", { params: { page: 1, pageSize: 100, search: search || undefined, tagId: tagId || undefined } }
        );
        const published = response.data.items?.filter((n) => n.published) ?? [];
        // imageUrl 是相對於後端 API 的路徑，要轉成完整網址瀏覽器才載得到，
        // 見 content-list-utils.ts 的 resolveBackendAssetUrl 註解
        return published.map((n) => ({ ...n, imageUrl: resolveBackendAssetUrl(n.imageUrl) }));
    } catch {
        return null;
    }
}

/**
 * 取得公告列表。`backendAvailable` 是 `false` 才代表後端連不到/噴錯，
 * 呼叫端應該退回假資料（見 `/news/page.tsx` 跟 `lib/news-data.ts` 的
 * `NEWS_ARTICLES`）；`backendAvailable` 是 `true` 但 `items` 是空陣列，
 * 代表後端有正常回應、只是這次查詢（例如關鍵字搜尋）剛好沒有符合的
 * 結果，這時候要照實顯示「查無資料」，不能退回假資料掩蓋掉。
 */
export async function fetchNews(options?: { search?: string; tagId?: number }): Promise<{ items: NewsItem[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendNews(options?.search, options?.tagId);
    return { items: backendItems ?? [], backendAvailable: backendItems !== null };
}

/**
 * 取得單筆公告詳情。`NewsDetail.content` 是 Puck 區塊 JSON（跟
 * `FaqItem.answer` 同一套格式），交給 `PuckRenderer` 顯示，這裡不用
 * 另外處理。
 */
export async function fetchNewsDetail(id: string): Promise<NewsDetail | null> {
    try {
        const response = await apiClient.get<NewsDetail>(`/api/News/${id}`);
        return { ...response.data, imageUrl: resolveBackendAssetUrl(response.data.imageUrl) };
    } catch {
        return null;
    }
}

/**
 * 嘗試從後端取得已發布的產業案例列表，回傳 null 表示後端「連不到／
 * 噴錯」（跟 `tryBackendNews` 同一套 null/空陣列語意，見那邊的註解）。
 * 對到真後端 `SuccessCaseQueryParameters`（SPS.Application/DTOs/SuccessCase），
 * `GET /api/SuccessCase` 回來的 `items` 元素形狀直接等於 `PromotionCase`。
 */
async function tryBackendPromotionCases(search?: string): Promise<PromotionCase[] | null> {
    try {
        const response = await apiClient.get<PagedResult<PromotionCase>>(
            "/api/SuccessCase", { params: { page: 1, pageSize: 100, search: search || undefined } }
        );
        const published = response.data.items?.filter((c) => c.isPublished) ?? [];
        // coverImageUrl 是相對於後端 API 的路徑，要轉成完整網址瀏覽器
        // 才載得到，見 content-list-utils.ts 的 resolveBackendAssetUrl
        // 註解——這個問題就是從 `/promotion` 這裡實測踩到的
        return published.map((c) => ({ ...c, coverImageUrl: resolveBackendAssetUrl(c.coverImageUrl) }));
    } catch {
        return null;
    }
}

/**
 * 取得產業案例列表，`backendAvailable` 語意同 `fetchNews`。
 */
export async function fetchPromotionCases(options?: { search?: string }): Promise<{ items: PromotionCase[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendPromotionCases(options?.search);
    return { items: backendItems ?? [], backendAvailable: backendItems !== null };
}

/**
 * 取得單筆產業案例詳情。`PromotionCaseDetail.content` 是 Puck 區塊
 * JSON（跟 `NewsDetail.content` 同一套格式），交給 `PuckRenderer`
 * 顯示，這裡不用另外處理。
 */
export async function fetchPromotionCaseDetail(id: string): Promise<PromotionCaseDetail | null> {
    try {
        const response = await apiClient.get<PromotionCaseDetail>(`/api/SuccessCase/${id}`);
        return { ...response.data, coverImageUrl: resolveBackendAssetUrl(response.data.coverImageUrl) };
    } catch {
        return null;
    }
}

/**
 * 嘗試從後端取得已審核通過、可公開刊登的企業列表，回傳 null 表示
 * 後端「連不到／噴錯」（跟 `tryBackendNews` 同一套 null/空陣列語意）。
 * 對到真後端 `CompanyQueryParameters`（SPS.Application/DTOs/Company），
 * `GET /api/Company` 回來的 `items` 元素形狀直接等於 `CompanyList`。
 *
 * 「可公開刊登」用 `isVerified` 篩：新建的企業預設 `IsVerified = false`
 * （見 `CompanyService.CreateAsync`），要後台審核通過才會翻成
 * `true`——這欄位就是企業版的 `published`／`isPublished`。另外排除
 * `status`（`Status` enum）不是 Active(1) 的企業（停權/鎖定/待審/
 * 婉拒），避免刊登已停用的企業。
 */
async function tryBackendCompanies(search?: string): Promise<CompanyList[] | null> {
    try {
        const response = await apiClient.get<PagedResult<CompanyList>>(
            "/api/Company", { params: { page: 1, pageSize: 100, search: search || undefined } }
        );
        const visible = response.data.items?.filter((c) => c.isVerified && c.status === 1) ?? [];
        // photo 是相對於後端 API 的路徑，要轉成完整網址瀏覽器才載得到，
        // 見 content-list-utils.ts 的 resolveBackendAssetUrl 註解
        return visible.map((c) => ({ ...c, photo: resolveBackendAssetUrl(c.photo) }));
    } catch {
        return null;
    }
}

/**
 * 取得企業刊登列表，`backendAvailable` 語意同 `fetchNews`。
 */
export async function fetchCompanies(options?: { search?: string }): Promise<{ items: CompanyList[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendCompanies(options?.search);
    return { items: backendItems ?? [], backendAvailable: backendItems !== null };
}

/**
 * 取得企業標籤（應用情境／應用範疇／智慧技術）的分類結構，給搜尋列的篩選面板與企業詳情頁用。
 * 連不到後端時回傳空的結構（篩選面板沒有選項、詳情頁不顯示標籤分類）。
 */
export async function fetchTagTaxonomy(): Promise<TagTaxonomy> {
    try {
        const response = await apiClient.get<PagedResult<TagRecord & { published: boolean }>>(
            "/api/Category", { params: { type: 6, page: 1, pageSize: 500 } }
        );
        return buildTaxonomy((response.data.items ?? []).filter((c) => c.published));
    } catch {
        return buildTaxonomy([]);
    }
}

/** 企業名錄的後端分頁查詢（只回已審核且啟用的企業）；篩選條件交給後端，`totalCount` 是符合條件的總筆數 */
export async function fetchCompaniesPage(options: {
    page: number;
    pageSize: number;
    search?: string;
    tagIds?: number[];
}): Promise<{ items: CompanyList[]; totalCount: number; backendAvailable: boolean }> {
    try {
        const response = await apiClient.get<PagedResult<CompanyList>>("/api/Company", {
            params: { page: options.page, pageSize: options.pageSize, search: options.search || undefined, tagIds: options.tagIds },
            paramsSerializer: { indexes: null },
        });
        const items = (response.data.items ?? []).map((c) => ({ ...c, photo: resolveBackendAssetUrl(c.photo) }));
        return { items, totalCount: response.data.totalCount ?? items.length, backendAvailable: true };
    } catch {
        return { items: [], totalCount: 0, backendAvailable: false };
    }
}

/** 媒合需求的後端分頁查詢（只回已發布的需求） */
export async function fetchDemandsPage(options: {
    page: number;
    pageSize: number;
    search?: string;
    tagIds?: number[];
}): Promise<{ items: DemandItem[]; totalCount: number; backendAvailable: boolean }> {
    try {
        const response = await apiClient.get<PagedResult<DemandItem>>("/api/Demand", {
            params: { page: options.page, pageSize: options.pageSize, search: options.search || undefined, tagIds: options.tagIds },
            paramsSerializer: { indexes: null },
        });
        return { items: response.data.items ?? [], totalCount: response.data.totalCount ?? 0, backendAvailable: true };
    } catch {
        return { items: [], totalCount: 0, backendAvailable: false };
    }
}

/**
 * 取得單一企業的公開詳情（`GET /api/Company/{id}`）。沒審核通過／已停用的企業後端會回 404，
 * 這裡回 null（呼叫端轉成 404 頁）。負責人、窗口等內部欄位後端對匿名呼叫已清掉。
 */
export async function fetchCompanyDetail(id: string): Promise<PublicCompanyDetail | null> {
    try {
        const response = await apiClient.get<{
            id: string; number: string; name: string; unifiedSocialCreditCode: string; phone?: string | null;
            type: number; employees?: number | null; subject?: string | null; introduction?: string | null;
            orgUrl?: string | null; establishmentDate?: string | null; charge?: string | null; chargePhone?: string | null;
            address?: { region?: string | null; city?: string | null; district?: string | null; line?: string | null } | null;
            photo?: { uri?: string | null } | null;
        }>(`/api/Company/${id}`);
        const c = response.data;
        let tagIds: number[] = [];
        let tagNames: string[] = [];
        try {
            const tags = await apiClient.get<{ tagIds?: number[]; tagNames?: string[] }>(`/api/Company/${id}/tags`);
            tagIds = tags.data.tagIds ?? [];
            tagNames = tags.data.tagNames ?? [];
        } catch {
            // 標籤載不到不影響詳情頁
        }
        const address = [c.address?.region, c.address?.city, c.address?.district, c.address?.line].filter(Boolean).join("");
        return {
            id: c.id, number: c.number, name: c.name, unifiedSocialCreditCode: c.unifiedSocialCreditCode, phone: c.phone,
            type: c.type, employees: c.employees, subject: c.subject, introduction: c.introduction, orgUrl: c.orgUrl,
            establishmentDate: c.establishmentDate, charge: c.charge, chargePhone: c.chargePhone,
            photoUrl: resolveBackendAssetUrl(c.photo?.uri),
            address: address || undefined,
            tagIds,
            tagNames,
        };
    } catch {
        return null;
    }
}

/**
 * 取得已發布的媒合需求（後台「需求張貼管理」維護，`GET /api/Demand`，後端對匿名呼叫只回已發布、
 * 並清掉刊登企業的身分）。`backendAvailable` 語意同 `fetchNews`。
 */
export async function fetchDemands(options?: { search?: string }): Promise<{ items: DemandItem[]; backendAvailable: boolean }> {
    try {
        const response = await apiClient.get<PagedResult<DemandItem>>(
            "/api/Demand", { params: { page: 1, pageSize: 100, search: options?.search || undefined } }
        );
        const items = (response.data.items ?? []).filter((d) => d.published);
        return { items, backendAvailable: true };
    } catch {
        return { items: [], backendAvailable: false };
    }
}

/** 取得單筆媒合需求；未發布或不存在回 null */
export async function fetchDemandDetail(id: string): Promise<DemandItem | null> {
    try {
        const response = await apiClient.get<DemandItem>(`/api/Demand/${id}`);
        return response.data.published ? response.data : null;
    } catch {
        return null;
    }
}

/**
 * 嘗試從後端取得已發布的影片列表，回傳 null 表示後端「連不到／噴錯」
 * （跟 `tryBackendNews` 同一套 null/空陣列語意）。對到真後端
 * `VideoQueryParameters`（SPS.Application/DTOs/Video），`GET /api/Video`
 * 回來的 `items` 元素形狀直接等於 `VideoItem`。
 *
 * 2026-09-10 第一次真的接這支 API：後端 controller／service／entity
 * 都是完整的，但目前資料庫是 0 筆（後台 `SPS.AdminWeb` 還沒有影片
 * 管理頁面可以新增資料，只有相簿管理），接上後畫面暫時會是空的，
 * 等有測試資料或後台補上管理頁再實際看得到內容——這不是這支
 * `fetchVideos()` 的問題，是資料源頭還沒有東西。
 */
async function tryBackendVideos(search?: string): Promise<VideoItem[] | null> {
    try {
        const response = await apiClient.get<PagedResult<VideoItem>>(
            "/api/Video", { params: { page: 1, pageSize: 100, published: true, search: search || undefined } }
        );
        const published = response.data.items?.filter((v) => v.published) ?? [];
        // uri／thumbnailUri 是相對於後端 API 的路徑，要轉成完整網址瀏覽器
        // 才載得到，見 content-list-utils.ts 的 resolveBackendAssetUrl 註解
        return published.map((v) => ({
            ...v,
            uri: resolveBackendAssetUrl(v.uri),
            thumbnailUri: resolveBackendAssetUrl(v.thumbnailUri),
        }));
    } catch {
        return null;
    }
}

/**
 * 取得影片列表，`backendAvailable` 語意同 `fetchNews`。
 */
export async function fetchVideos(options?: { search?: string }): Promise<{ items: VideoItem[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendVideos(options?.search);
    return { items: backendItems ?? [], backendAvailable: backendItems !== null };
}

/** 讀不到頁尾連結設定時的預設值：只保留產業發展署（跟設計稿一樣是真網址），其餘都不顯示 */
const DEFAULT_FOOTER_LINKS: FooterLinks = {
    functionZoneUrl: "",
    lineUrl: "",
    facebookUrl: "",
    instagramUrl: "",
    youTubeUrl: "",
    threadsUrl: "",
    podcastUrl: "",
    accessibilityBadgeUrl: "",
    idaUrl: "https://www.ida.gov.tw/",
    ishaUrl: "",
    // 連不到後端時的聯絡資訊：沿用原本頁尾寫死的內容，聯絡資訊比較不會有人希望整塊消失
    contactAddress: "813707 高雄市左營區博愛三路12號15樓",
    contactMapUrl: "https://maps.app.goo.gl/iZ6rqmW5CcSKJgp17",
    contactPhone: "+886-7-550-3115",
    contactEmail: "isha_khh@mail.isha.org.tw",
};

/**
 * 頁尾連結（後台「頁尾連結」維護）。每一頁的 Footer 都會用到，所以快取 5 分鐘——
 * 後台改完最多 5 分鐘後前台才會看到。後端連不到就退回預設值，頁尾不能因為這個壞掉。
 */
export async function fetchFooterLinks(): Promise<FooterLinks> {
    try {
        const data = await getBackendJson<Partial<FooterLinks>>("/api/settings/footer-links/public", 300);
        return { ...DEFAULT_FOOTER_LINKS, ...data };
    } catch {
        return DEFAULT_FOOTER_LINKS;
    }
}

/**
 * 頁尾的累計瀏覽人次（後台「網站內容」可手動校正初始值，之後由前台每個新訪客累計）。
 * 快取 60 秒；取不到回 null，頁尾就不顯示這一塊——不拿假數字頂替。
 */
export async function fetchSiteVisitorCount(): Promise<number | null> {
    try {
        const data = await getBackendJson<{ totalVisitors?: number }>("/api/site-counter", 60);
        return typeof data.totalVisitors === "number" ? data.totalVisitors : null;
    } catch {
        return null;
    }
}

/** 讀不到投稿頁設定時的預設值：沒有可下載的格式，聯絡資訊沿用原本頁面寫死的電話與信箱 */
const DEFAULT_CONTRIBUTE_PAGE: ContributePage = {
    formats: [],
    contactName: "",
    contactPhone: "+886-7-550-3115",
    contactEmail: "isha_khh@mail.isha.org.tw",
};

/**
 * 「我要投稿」頁設定（後台「頁面設定」維護）。快取 60 秒；後端連不到就退回預設值，頁面不會壞。
 * 下載網址在這裡就轉成完整網址（跟 Banner 圖片同一套 `resolveBackendAssetUrl`）。
 */
export async function fetchContributePage(): Promise<ContributePage> {
    try {
        const data = await getBackendJson<{
            formats?: Array<{ kind: "docx" | "odt" | "pdf"; fileName: string; formattedFileSize: string; url: string }>;
            contactName?: string;
            contactPhone?: string;
            contactEmail?: string;
        }>("/api/page-settings/contribute/public", 60);

        return {
            formats: (data.formats ?? []).flatMap((f) => {
                const url = resolveBackendAssetUrl(f.url);
                return url ? [{ kind: f.kind, fileName: f.fileName, formattedFileSize: f.formattedFileSize, url }] : [];
            }),
            contactName: data.contactName ?? "",
            contactPhone: data.contactPhone ?? "",
            contactEmail: data.contactEmail ?? "",
        };
    } catch {
        return DEFAULT_CONTRIBUTE_PAGE;
    }
}

/**
 * 固定下載資源（後台「頁面設定 → 下載資源」維護）。快取 60 秒；後端連不到就回空物件
 * （各處用 `resources[key]?.links ?? []`，沒有資料就顯示「準備中」，不會壞）。
 * 檔案的下載網址在這裡轉成完整網址；外部連結維持原樣（後端已驗證只有 http／https）。
 */
export async function fetchDownloadResources(): Promise<DownloadResources> {
    try {
        const data = await getBackendJson<{
            items?: Record<string, { title?: string; links?: Array<Partial<DownloadLink>> }>;
        }>("/api/page-settings/downloads/public", 60);

        const result: DownloadResources = {};
        for (const [key, value] of Object.entries(data.items ?? {})) {
            result[key] = {
                title: value.title ?? key,
                links: (value.links ?? []).flatMap((l) => {
                    const url = l.kind === "link" ? l.url : resolveBackendAssetUrl(l.url);
                    return url && l.kind ? [{ kind: l.kind, url, fileName: l.fileName ?? "", formattedFileSize: l.formattedFileSize ?? "" }] : [];
                }),
            };
        }
        return result;
    } catch {
        return {};
    }
}

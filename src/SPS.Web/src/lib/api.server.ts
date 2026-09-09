import { headers } from "next/headers";
import {
    FaqItem,
    NewsItem,
    NewsDetail,
    PromotionCase,
    PromotionCaseDetail,
    PagedResult,
    CompanyList,
} from "@/lib/types";
import { apiClient } from "@/lib/api-client";
import { resolveBackendAssetUrl } from "@/lib/content-list-utils";

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

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        cache: "no-store",
        headers: { "Accept": "application/json" },
    });
    if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
    return res.json();
}

/**
 * 打後端 API（API_URL 優先，適用 Docker 環境）
 */
async function getBackendJson<T>(path: string): Promise<T> {
    const apiUrl = process.env.API_URL?.trim();
    const envBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
    const reqBase = await getBaseUrlFromRequest();

    let base = apiUrl || envBase || reqBase;
    if (!base) throw new Error("Cannot determine base url for backend fetch.");
    if (!base.startsWith('http')) base = `https://${base}`;

    return fetchJson<T>(buildUrl(base, path));
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
async function tryBackendQuestions(): Promise<FaqItem[] | null> {
    try {
        // 查詢參數要對到真後端 QuestionQueryParameters 的欄位名稱
        // （SPS.Application/DTOs/Question/QuestionQueryParameters.cs）：
        // 是 `page`，不是 `pageIndex`——原本寫錯的 `pageIndex` 不會噴錯，
        // 只是完全沒有作用（ASP.NET 對不上名字就直接用預設值 `Page = 1`），
        // 目前恰好都抓第一頁才沒被發現，之後真的要分頁時會是個地雷。
        const response = await apiClient.get<QuestionPagedResult>(
            "/api/Question", { params: { page: 1, pageSize: 100 } }
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
export async function fetchFaq(): Promise<{ items: FaqItem[] }> {
    const backendItems = await tryBackendQuestions();
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
async function tryBackendNews(search?: string): Promise<NewsItem[] | null> {
    try {
        const response = await apiClient.get<PagedResult<NewsItem>>(
            "/api/News", { params: { page: 1, pageSize: 100, search: search || undefined } }
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
export async function fetchNews(options?: { search?: string }): Promise<{ items: NewsItem[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendNews(options?.search);
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
async function tryBackendCompanies(): Promise<CompanyList[] | null> {
    try {
        const response = await apiClient.get<PagedResult<CompanyList>>(
            "/api/Company", { params: { page: 1, pageSize: 100 } }
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
export async function fetchCompanies(): Promise<{ items: CompanyList[]; backendAvailable: boolean }> {
    const backendItems = await tryBackendCompanies();
    return { items: backendItems ?? [], backendAvailable: backendItems !== null };
}
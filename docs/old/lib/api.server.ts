import { headers } from "next/headers";
import {
    FaqItem,
    HomeCase,
    HomeStat,
    NewsItem,
    NewsDetail,
    PagedResult,
    Category,
    CompanyCode, CompanyList, CompanyDetail,
} from "@/lib/types";
import { apiClient } from "@/lib/api-client";

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
    }));
}

type QuestionDetail = {
    id: number;
    subject?: string;
    answer?: string;
    published: boolean;
};

/**
 * 嘗試從後端取得已發布的 FAQ 列表，回傳 null 表示後端無資料或不可用
 */
async function tryBackendQuestions(): Promise<FaqItem[] | null> {
    try {
        const response = await apiClient.get<QuestionPagedResult>(
            "/api/Question", { params: { pageIndex: 1, pageSize: 100 } }
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
        };
    } catch {
        return null;
    }
}
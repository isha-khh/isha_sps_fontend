"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DISABLED_INDUSTRY_AI_LINK, type IndustryAiLink } from "@/lib/industry-ai-link";

/** 主選單「公告事項」下拉的一個項目（後台「公告類別」中啟用的分類） */
export type NavNewsCategory = { id: number; name: string };

/**
 * 全站共用的「後台可設定的內容」：「產業AI」外部連結開關、啟用中的公告分類。由根 layout 在伺服器端取得後放進來，
 * client 元件（主選單 Headers）直接讀，不用各自再打一次 API，也不會先顯示舊內容再閃成新內容。
 * `newsCategories` 是 `null`＝後端連不到，主選單退回預設的三個分類。
 */
type SiteLinks = { industryAi: IndustryAiLink; newsCategories: NavNewsCategory[] | null };

const SiteLinksContext = createContext<SiteLinks>({ industryAi: DISABLED_INDUSTRY_AI_LINK, newsCategories: null });

export function SiteLinksProvider({ industryAi, newsCategories = null, children }: { industryAi: IndustryAiLink; newsCategories?: NavNewsCategory[] | null; children: ReactNode }) {
  return <SiteLinksContext.Provider value={{ industryAi, newsCategories }}>{children}</SiteLinksContext.Provider>;
}

export function useIndustryAiLink(): IndustryAiLink {
  return useContext(SiteLinksContext).industryAi;
}

/** 主選單「公告事項」下拉要列的分類；後端連不到時退回設計稿原本的三個 */
export function useNewsNavCategories(): NavNewsCategory[] {
  return useContext(SiteLinksContext).newsCategories ?? DEFAULT_NEWS_NAV_CATEGORIES;
}

export const DEFAULT_NEWS_NAV_CATEGORIES: NavNewsCategory[] = [
  { id: -1, name: "活動資訊" },
  { id: -2, name: "產業新知" },
  { id: -3, name: "外部消息" },
];

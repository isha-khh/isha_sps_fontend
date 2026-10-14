"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DISABLED_INDUSTRY_AI_LINK, type IndustryAiLink } from "@/lib/industry-ai-link";

/**
 * 全站共用的「後台可設定的連結」：目前只有「產業AI」外部連結開關。由根 layout 在伺服器端取得後放進來，
 * client 元件（主選單 Headers）直接讀，不用各自再打一次 API，也不會先顯示內部連結再閃成外部連結。
 */
const SiteLinksContext = createContext<{ industryAi: IndustryAiLink }>({ industryAi: DISABLED_INDUSTRY_AI_LINK });

export function SiteLinksProvider({ industryAi, children }: { industryAi: IndustryAiLink; children: ReactNode }) {
  return <SiteLinksContext.Provider value={{ industryAi }}>{children}</SiteLinksContext.Provider>;
}

export function useIndustryAiLink(): IndustryAiLink {
  return useContext(SiteLinksContext).industryAi;
}

export interface ProTrackSubmissionItem {
  id: string;
  companyName: string;
  date: string;
  consultant: string;
  submittedBy: string;
  submittedAt: string;
  recommendationCount: number;
  summary: string;
}

export interface ProTrackImportResult {
  submissionId: string;
  companyName: string;
  date: string;
  consultant: string;
  suggestedName: string;
  suggestedIntroduction: string;
  matchedCompanyId?: string;
  matchedCompanyName?: string;
  suggestedTagIds: number[];
  suggestedTagNames: string[];
}

export interface SimilarCompanyResult {
  companyId: string;
  companyName: string;
  chargeEmail?: string;
  matchCount: number;
  demandTagCount: number;
  companyTagCount: number;
  overlapPercent: number;
  matchedTagNames: string[];
}

/** AI 語意搜尋找到的相似業者。刻意不含原始分數，前端依 rank 位置自行分級（高/中/低）。 */
export interface SimilarCompanyByVectorResult {
  companyId: string;
  companyName: string;
  chargeEmail?: string;
  rank: number;
}

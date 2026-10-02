/** 單一專家的評分結果（6 個子分數依權重加總後的總分，由後端計算） */
export interface ExpertScoreResult {
  scoringId: number;
  expertName: string;
  totalScore: number;
  isQualified: boolean;
}

/** 對應後端 ScoringSummaryResponse */
export interface ScoringSummary {
  experts: ExpertScoreResult[];
  qualifiedCount: number;
  totalCount: number;
  isPassed: boolean;
}

/** 對應後端 AddExpertScoreRequest，每項 0-100 分 */
export interface AddExpertScoreRequest {
  expertName: string;
  humanResourcesScore: number;
  teamExperienceScore: number;
  relevantExperienceScore: number;
  financialSystemScore: number;
  productTrackRecordScore: number;
  financialStatusScore: number;
}

export type ScoreField = Exclude<keyof AddExpertScoreRequest, 'expertName'>;

/** 官方《會員申請須知》附件三的 6 項配分與權重（加總 100%）。權重只用來在表單上提示，真正的加權總分以後端為準。 */
export const SCORE_CRITERIA: { field: ScoreField; label: string; weight: number }[] = [
  { field: 'humanResourcesScore', label: '人力資源', weight: 20 },
  { field: 'teamExperienceScore', label: '團隊學經歷', weight: 20 },
  { field: 'relevantExperienceScore', label: '相關經驗', weight: 20 },
  { field: 'financialSystemScore', label: '財務制度', weight: 10 },
  { field: 'productTrackRecordScore', label: '產品實績', weight: 20 },
  { field: 'financialStatusScore', label: '財務狀況', weight: 10 },
];

/** 單一專家總分 >= 此分數才算合格；合格專家達半數（含）以上即通過 */
export const QUALIFYING_SCORE = 70;

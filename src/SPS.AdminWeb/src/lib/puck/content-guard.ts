import { checkContentRules, formatIssue } from './content-rules';

/**
 * 發布前的內容檢查：有「錯誤」就不讓發布並列出問題，回傳 false；沒有錯誤（只有警告也一樣）回傳 true。
 * 草稿不檢查，呼叫端只在 `publish === true` 時用。規則見 content-rules.ts。
 */
export function guardPublish(content: unknown, notify: { warning: (message: string, title?: string) => void }): boolean {
  const errors = checkContentRules(content).filter((issue) => issue.level === 'error');
  if (errors.length === 0) return true;

  const shown = errors.slice(0, 8).map(formatIssue);
  const more = errors.length > shown.length ? [`…還有 ${errors.length - shown.length} 項`] : [];
  notify.warning(`內容有 ${errors.length} 個問題要先修正才能發布（改成草稿儲存不受影響）：\n${[...shown, ...more].join('\n')}`, '內容檢查未通過');
  return false;
}

/**
 * 積木元件：列表頁頂端的搜尋列，對應舊站 page/_uc/search.html（有年份下拉）
 * 跟 search2.html（沒有年份下拉，只有關鍵字）——兩支結構幾乎一樣，合併
 * 成一個元件，`years` 沒給就不渲染年份下拉。
 *
 * 修正一個舊站原始碼的小失誤：關鍵字欄位原本是 `type="email"` +
 * `autocomplete="email"`（明顯是從別處的電子報訂閱表單複製過來，
 * 忘記改），這裡改回正確的 `type="text"`，行為/樣式不受影響。
 *
 * 目前純粹是靜態表單外觀，還沒接真的查詢邏輯——之後 `/news`、`/serve`
 * 真的要做關鍵字/年份篩選時，再幫這裡加 onSubmit 或接 URL query。
 */
export default function SearchBar({
  years,
  yearLabel = "全部年份",
  keywordPlaceholder = "請輸入關鍵字",
}: {
  years?: string[];
  yearLabel?: string;
  keywordPlaceholder?: string;
}) {
  return (
    <div className="d-flex">
      {years && (
        <div className="form-group mb-md-0">
          <select className="form-select" aria-label={yearLabel} defaultValue="">
            <option value="">{yearLabel}</option>
            {years.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="input-group mt-2 mt-md-0">
        <input type="text" className="form-control" placeholder={keywordPlaceholder} aria-label={keywordPlaceholder} />
      </div>

      <button type="submit" className="btn_a" title="查詢">
        <i className="bi bi-search me-1" aria-hidden="true"></i>
        <span>查詢</span>
      </button>
    </div>
  );
}

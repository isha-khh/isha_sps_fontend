/**
 * 積木元件：列表頁頂端的搜尋列，對應舊站 page/_uc/search.html（有年份下拉）
 * 跟 search2.html（沒有年份下拉，只有關鍵字）——兩支結構幾乎一樣，合併
 * 成一個元件，`years` 沒給就不渲染年份下拉。
 *
 * 修正一個舊站原始碼的小失誤：關鍵字欄位原本是 `type="email"` +
 * `autocomplete="email"`（明顯是從別處的電子報訂閱表單複製過來，
 * 忘記改），這裡改回正確的 `type="text"`，行為/樣式不受影響。
 *
 * 2026-09-08：從純外觀的靜態表單改成真的會送出查詢的 `<form
 * method="get">`——刻意不用 `onSubmit`＋`router.push` 那種要下
 * `"use client"` 的寫法，單純的 GET 表單瀏覽器原生就會把欄位值
 * 組成 query string 導到目前這個網址，呼叫端（Server Component）
 * 讀 `searchParams` 就好，這支元件本身不需要變成 Client Component。
 *
 * 這也是為什麼需要 `hiddenFields`：GET 表單送出時，網址上的 query
 * string 會被表單欄位「整組換掉」，不是用「加上去」的方式合併——
 * 如果頁面同時有分類篩選（例如 `?category=8`）又有這顆搜尋表單，
 * 沒有把 `category` 用隱藏欄位帶進表單裡的話，一按查詢分類篩選就
 * 會被沖掉。呼叫端要記得把「網址上其他要保留的參數」透過這個 prop
 * 傳進來。
 *
 * `years`／`keywordPlaceholder` 目前只有 `/news` 真的接上關鍵字搜尋
 * （見 news/page.tsx），`/faq`、`/serve`、`/promotion*` 這幾頁還是
 * 沿用這顆元件但頁面本身沒有讀 `searchParams` 做篩選——送出後網址會
 * 帶上 `?q=...`，但畫面不會變化，這是已知、待後續一併處理的缺口，
 * 不是這次改動漏掉。
 */
export default function SearchBar({
  years,
  yearLabel = "全部年份",
  keywordPlaceholder = "請輸入關鍵字",
  keywordParamName = "q",
  yearParamName = "year",
  defaultKeyword = "",
  defaultYear = "",
  hiddenFields,
}: {
  years?: string[];
  yearLabel?: string;
  keywordPlaceholder?: string;
  /** URL query string 裡關鍵字欄位的參數名稱 */
  keywordParamName?: string;
  /** URL query string 裡年份欄位的參數名稱 */
  yearParamName?: string;
  /** 目前網址上已經有的關鍵字，讓輸入框保留使用者上次搜尋的字 */
  defaultKeyword?: string;
  /** 目前網址上已經有的年份 */
  defaultYear?: string;
  /** 送出這個表單時要一併保留的其他 query string 參數（例如分類篩選） */
  hiddenFields?: Record<string, string>;
}) {
  return (
    <form className="d-flex" method="get">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}

      {years && (
        <div className="form-group mb-md-0">
          <select className="form-select" aria-label={yearLabel} name={yearParamName} defaultValue={defaultYear}>
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
        <input
          type="text"
          className="form-control"
          name={keywordParamName}
          defaultValue={defaultKeyword}
          placeholder={keywordPlaceholder}
          aria-label={keywordPlaceholder}
        />
      </div>

      <button type="submit" className="btn_a" title="查詢">
        <i className="bi bi-search me-1" aria-hidden="true"></i>
        <span>查詢</span>
      </button>
    </form>
  );
}

# 後端 API 盤點（2026-09-04）

> 你把舊系統後端的 API client 貼進 `src/lib/api/`（40 支檔案，共 4466 行）。
> 這份文件是逐一看過這些檔案的 JSDoc／函式簽名，跟目前 Next.js 前端已經
> 做出來（或還是假資料）的頁面互相比對後的結論。
>
> **更新**：你後來把這批檔案搬到 `docs/old/`（不會被建置系統編譯，不會
> 影響 `src/` 底下的 tsc/build），並且把原本缺的 40 幾支 `types/*.ts`
> 型別定義、`lib/api-client.ts` 都一起補齊了。下面第一段「建置失敗」是
> 檔案還在 `src/lib/api/` 時的舊發現，現在已經不是問題，保留原文當
> 記錄；真正的重點在後面新增的「欄位落差分析」那段——有了完整型別後，
> 可以逐欄位比對，不再只能靠函式簽名猜。

## 🔴（已解除）原本最急的：這批檔案曾經讓專案建置失敗

`npm run build`／`tsc --noEmit` 之前直接報錯，因為：

1. 每一支檔案都 `import { apiClient } from '@/lib/api-client'`，但 `src/lib/api-client.ts` 沒有一起貼進來，這個共用的 axios 包裝函式不存在。
2. 每一支檔案都會 `import type {...} from '@/types/xxx'`，但對應的 40 幾支型別檔案（`@/types/news`、`@/types/company`、`@/types/application`…）也都沒有貼進來，只有本來就在專案裡、不相關的 `types/legacy-globals.d.ts`。
3. `captcha.ts` 裡用了 `import.meta.env.VITE_API_BASE_URL`——這是 **Vite** 專案的環境變數寫法，這個 API client 明顯是從另一個 Vite 專案（大概是舊系統的後台管理介面）整包複製過來的，不是為這個 Next.js 專案寫的。Next.js 要讀環境變數得用 `process.env.NEXT_PUBLIC_...`。

現在這批檔案（含補齊的 `types/*.ts`、`lib/api-client.ts`）都在 `docs/old/`，不在 `src/` 底下，不會被 `tsc`/`next build` 掃到，這個問題已經解除。之後真的要接後端時，會需要把用得到的部分搬回 `src/`，並且把 `VITE_API_BASE_URL` 改成 Next.js 的環境變數寫法。

## 🟢 好消息：後端本身看起來相當完整、成熟

這不是一份「還在規劃中」的 API 清單，讀起來像是一個已經實際做出來、而且做得頗完整的後端（有 JWT + refresh token、FIDO2 無密碼登入、RBAC 角色權限、AI 向量語意搜尋、退信信件處理、Nginx 設定管理…這些都是要花不少工才做得出來的東西）。所以「後端需要補齊什麼」，答案大部分是「前端還沒接」，不是「後端還沒做」——只有少數幾塊是真的兩邊都沒有。

下面照我們目前做出來的頁面分區塊比對。

---

## ✅ 前端已做（含假資料）、後端 API 看起來完整可以直接接

| 前端頁面 | 目前用的假資料 | 對應後端 API |
| --- | --- | --- |
| 公告事項（`/news`） | [news-data.ts](../src/lib/news-data.ts) | `newsApi`（`news.ts`）——CRUD、分頁、瀏覽數、發布狀態都有 |
| 常見問題（`/faq`） | [faq-data.ts](../src/lib/faq-data.ts) | `questionsApi`（`questions.ts`）——含依分類查詢 |
| 產業案例（`/promotion`、`/promotion/[id]`） | [promotion-data.ts](../src/lib/promotion-data.ts) | `successCasesApi`（`success-cases.ts`）——CRUD、瀏覽數、發布狀態都有 |
| 影音專區（`/promotion/video`） | [promotion-data.ts](../src/lib/promotion-data.ts) | `videosApi`（`videos.ts`） |
| 會員登入／忘記密碼（`/member/login`、`/member/forgot`） | 純展示，沒有真的驗證 | `authApi`（`auth.ts`）——login/register/refresh/logout/忘記密碼/重設密碼/驗證碼，甚至有 FIDO2 無密碼登入 |
| 首頁彈跳公告（`WelcomeModal.tsx`） | 內容寫死在元件裡 | `popupAnnouncementApi.getActiveByRoute(route)`（`popup-announcement.ts`）——**這個特別值得先接**，改動很小、效果很明顯：現在客戶要換公告內容得改 code 重新部署，接上後台就能直接後台編輯 |
| 首頁／各頁 banner | 圖檔寫死 | `bannerApi`（`banner.ts`）——含依版位 (`positionId`) 查詢、點擊/瀏覽次數 |

**要注意的落差**：`news.ts`／`questions.ts` 的分類查詢都是用**數字 `CategoryId`**（例如 `newsApi.getNews` 的 `CategoryId` 參數），不是我們目前 mock 資料裡的中文字串（`category: "活動資訊"`）。之後真的接後端時，`/news?category=活動資訊` 這種用分類名稱當 query string 的做法要改成先用 `categoriesApi.getCategoriesByType(type)` 查出這個網站的分類清單（含 id），前端改成傳/比對數字 id。

---

## 🟡 後端 API 已經有、但前端目前完全沒有對應頁面

這些是後端顯然已經做好、但我們的 Next.js 前端連個雛形都還沒有的功能：

| 功能 | 對應後端 API | 備註 |
| --- | --- | --- |
| **企業名錄**（主選單「我要媒合」子項） | `companiesApi`（`companies.ts`） | 之前盤點「我要媒合」時說完全沒有參考頁、卡住做不了——後端其實已經有完整的公司列表/詳情/標籤 API，缺的只是前端頁面設計 |
| **媒合對接**（同上） | `demandsApi` + `protrackApi.similarCompaniesApi`（`demands.ts`、`protrack.ts`） | 比想像中更進階：不只是列表，還有 AI 向量語意搜尋（`getSimilarCompaniesByVector`：貼上需求內容直接找相似業者），是個真的做了語意媒合引擎的功能，不是單純的分類篩選 |
| **關於我們**（主選單，一樣完全沒參考頁） | `aboutApi`（`about.ts`） | 後端有 `getByType`／`getPages`／`getBanners`／`getAlbums` 這種通用 CMS 內容管理，看起來是設計成可以放好幾種子頁面內容的通用模組 |
| **會員權益比較表**內容 | 猜測對應 `settingsApi.getMembershipGuideSettings()`（`system-settings.ts`） | 目前我們是把整份比較表寫死在 [member-compare-data.ts](../src/lib/member-compare-data.ts)，如果這個猜測對，之後可以讓客戶自己在後台改權益內容，不用改 code |
| 站內客服即時聊天 | `chatApi`（訪客端）／`memberChatApi`（管理端） | 前端完全沒有聊天 widget，後端已經有完整的訪客 session／訊息記錄／未讀數 |
| 會員通知中心 | `notificationsApi`（`notifications.ts`） | 前端目前沒有任何「通知」相關 UI |
| 訪客人數／統計（通常放頁尾或關於頁） | `siteCounterApi`／`siteStatisticsApi` | 後端有現成的計數器，前端沒有顯示的地方 |
| 法規專區 | `regulationsApi`（`regulations.ts`） | **主選單目前完全沒有「法規」這個項目**，但後端有整組法規 CRUD＋分類/類型查詢——這個要先跟客戶確認：是這次網站範圍就有、只是舊站參考頁沒給我們，還是根本不屬於這次改版範圍 |

---

## 🟠 前端已經做了畫面，但目前找不到明確對應的 API——需要跟後端/PM 確認

| 前端功能 | 狀況 |
| --- | --- |
| **我要投稿**（`/promotion/contribute`） | 這頁是給訪客/廠商主動投稿產業案例用的，但 `success-cases.ts` 裡的 `createSuccessCase` 看起來像是後台人員自己建立案例用的（跟其他後台 CRUD 命名風格一致），沒看到「訪客送出投稿、進審核流程」這種公開提交端點。需要確認：投稿是不是要走 email 收件（現在頁面上「寄至下方投稿信箱」那段文字），還是要另外做一個公開提交 API＋審核流程 |
| **服務專區**（`/serve`，技術文件／產業AI） | 沒看到明顯對應「Serve」的 API。有可能是共用某個通用內容模組（`about.ts` 那種 `getByType` 模式，或是 `attribute.ts`／`product.ts`），需要後端確認這個分類要對應到哪一個 `CategoryType`／哪一組 API，不要自己猜 |
| **訂閱電子報**（Header 右上角按鈕，目前是死連結） | `mailCampaigns.ts` 整支看起來都是**後台寄送**電子報用的 API（預覽收件人數、寄送、取消、重寄），沒看到「訪客自己輸入 email 訂閱」這種公開端點。如果這顆按鈕要做成真的訂閱功能，這塊可能要請後端另外補一個公開的訂閱 API |
| **會員註冊 4 步驟精靈**（`/member/register/*`） | ⚠️ 型別補齊後確認：**跟真正的欄位對不太起來，不是單純「還缺欄位」，是整個資料模型/流程假設都不一樣**。詳見下面新增的「欄位落差分析」第一項，這是目前發現落差最大的一塊 |

---

## 📌 建議下一步

1. **先不要把 `src/lib/api/` 這批檔案 commit 上去**（目前是 staged 但未 commit 的狀態），除非同時補齊 `lib/api-client.ts` 跟對應的 `types/*.ts`，不然會讓建置壞掉。
2. 跟後端要以下這些目前貼進來的檔案裡缺的東西：
   - `lib/api-client.ts`（共用的 axios 實例／攔截器）
   - 對應的 `types/*.ts` 型別檔案（至少優先要 `types/application.ts`、`types/company.ts`、`types/demand.ts`、`types/news.ts`、`types/question.ts`——這幾個是我們已經做或即將要做的頁面用得到的）
   - 確認 base URL 環境變數要怎麼設（這批程式碼寫的是 Vite 的 `VITE_API_BASE_URL`，這個專案要改成 Next.js 的 `NEXT_PUBLIC_API_BASE_URL` 或類似命名）
3. 最小、最快能看到效果的第一步：**接 `popupAnnouncementApi`**，讓 `WelcomeModal.tsx` 改成真的從後台抓公告內容，而不是寫死在 code 裡。
4. 「企業名錄」「媒合對接」「關於我們」這三塊——後端都已經準備好了，只差前端設計/頁面，可以列進下一階段的開發排程，不用再等後端。
5. 「服務專區對應哪個 API」「投稿要不要走公開提交 API」「電子報訂閱要不要做公開端點」「法規要不要放進這次範圍」這 4 點，建議直接開一次會跟後端/PM 對一次，不要自己猜。

---

## 🔬 追加：拿到完整型別後的逐欄位落差分析

型別檔案補齊之後，把我們前端假資料/表單欄位跟真正的 `types/*.ts` 逐一對過一次。結論：大部分內容型頁面（公告、常見問題、產業案例、影音）**欄位大致對得上、只是命名/資料型態不同，屬於「轉接時要注意」等級**；但**會員註冊那塊落差是結構性的，不是欄位對不上這麼簡單**，建議優先跟後端/PM 確認。

### 🔴 最大的落差：會員註冊 4 步驟精靈的資料模型假設可能整個是錯的

我們現在做的 `/member/register/*` 是照舊站 `p01~p03.html` 這份靜態 HTML 稿子刻的：選 1 種會員類型（6 選項）→ 一次填完帳號＋個人資料＋公司資料＋應用情境/範疇/智慧技術（一大串多選 checkbox）＋上傳 4 份文件 → 送出審核。

比對真正的型別後，發現真正的後端資料模型跟這個假設對不太起來：

- **`Company.type`（`CompanyType`）只有 3 種：`Supplier`／`Demander`／`Both`**，`Company.level`（`CompanyLevel`）是另一個獨立的 4 級制：`Regular`／`Silver`／`Gold`／`Diamond`。舊站畫面上的「企業會員－供給端(卓越會員)」「企業會員－供給端(新興會員)」這種命名，在真正的型別裡完全找不到「卓越／新興」這兩個詞——比較像是舊站設計稿自己發明的展示用命名，跟後端真正的 Silver/Gold/Diamond 分級對不起來，需要跟客戶/後端確認這兩套命名要怎麼對應，還是舊站那份設計稿本來就是尚未定案的草稿。
- **「個人會員」根本不需要走這個 4 步驟精靈**：`authApi.register()`（`RegisterRequest`：email/password/name/phone，`companyId` 是**選填**）就能完成個人會員註冊，甚至可以完全不掛任何公司。我們現在的設計不管選哪種會員類型都逼使用者填一整套公司資料，這對「個人會員」這個選項來說是不對的。
- **企業會員的真正流程是「公司申請書」，不是「一次填完整份公司檔案」**：`applicationsApi.create()`（`CreateApplicationRequest`）要的欄位是 `memberRole`（Supplier/Buyer，只有 2 種）、`unifiedSocialCreditCode`（統一編號）、`contactPerson`、`reason`，以及一個 **`members` 陣列**——可以同時登記好幾位聯絡人（每位有 `contactName`/`position`/`email`/`phone`/`memberPosition`），這是「公司要加入平台、附上申請理由跟聯絡窗口」的申請書模型，**完全沒有 LOGO、成立日期、資本額、公司簡介、主要產品、應用情境/範疇/智慧技術、工廠資訊這些欄位**。
- 這些「公司資料」欄位（intro、address、establishmentDate、orgUrl、videoUrl、charge 系列欄位、photoId/bannerId）其實是定義在**另一個獨立的 `Company`／`CreateCompanyRequest`** 型別上，語意上比較像是「申請通過、真的成為會員之後，再回頭去補公司主檔資料」（`memberprofileApi.updateCompanyProfile()`），不是註冊當下一次填完。
- **「應用情境(可多選)」「應用範疇(可多選)」「智慧技術(可多選)」這一大串巢狀 checkbox，在 `Company`／`Application` 的型別裡完全找不到對應欄位**。比較可能的答案：`Company` 有 `tagNames?: string[]`，`companiesApi` 也有 `getCompanyTagOptions()`／`setCompanyTags(id, tagIds)`（`category.ts` 註解說這是 `CategoryType.CompanyTag = 6`、支援階層 `parentId`）——這一大串多選很可能其實是**通用的階層式標籤系統**，不是寫死在申請表單裡的固定欄位，而是申請通過成為公司會員後，另外用標籤系統去標記「這家公司做哪些應用情境/範疇/技術」。這只是合理推測，還是要跟後端確認。
- **文件類型也對不太上**：真正的 `DocumentType` enum 是 `CompanyRegistration`（公司登記）／`PersonalDataConsent`（個資同意書——這裡居然是「文件」不是單純打勾）／`TechnicalCapability`（技術能力）／`CloudMarketplace`（政府雲市集）／`DigitalServiceCapability`（數位服務能力）／`Application`（申請書）共 6 種。我們畫面上的「工廠登記證明文件」在這個 enum 裡完全沒有對應值；「雲市集」「數位服務能力」這兩種文件我們畫面上則完全沒有對應的上傳欄位。

**建議**：這塊先不要照現在的假設繼續往下做真的送出邏輯，直接拿這份比對結果跟後端/PM 開一次會確認——舊站那份 `page/member/p01~p03.html` 很可能是設計早期、還沒對齊過真正資料模型的稿子，照抄下去接後端時會發現大量欄位兜不起來，要嘛整個表單流程要重新設計成「個人會員走簡單註冊、企業會員走申請書+事後補公司資料+事後貼標籤」這種三段式，要嘛請後端針對這個表單再開欄位——這是個影響範圍很大的決定，不建議我們自己猜一個方向就直接做。

### 🟡 內容類頁面：欄位大致對得上，命名/型態要注意的地方

| 我們的假資料欄位 | 真正的型別欄位 | 備註 |
| --- | --- | --- |
| `NewsArticle.category`（字串，如「活動資訊」） | `News.categoryId`（number）＋ `categoryName` | 分類是數字 ID，不是字串，前面 FAQ 那段已經提過同樣的坑 |
| `NewsArticle.status`（「活動進行中」） | ❌ `News` 型別**完全沒有這個欄位** | 猜測應該是前端自己拿 `News.startDate`/`endDate` 跟現在時間比較算出來的顯示狀態，不是後端存的欄位 |
| `NewsArticle.meta`（活動時間/地點條列） | ❌ `News` 型別**完全沒有這個欄位** | 真正的 `News` 只有 `startDate`/`endDate` 兩個日期，沒有地點欄位，這段資訊要嘛塞進 `content` 富文本裡，要嘛請後端加欄位 |
| `NewsArticle.image` | ❌ `News` 型別**完全沒有圖片欄位** | 這個滿關鍵的——列表卡片跟詳情頁的縮圖，真正的 News 資料完全沒有 image/thumbnail 欄位，要嘛用 `pictures.ts`/`album.ts` 額外關聯一張圖，要嘛請後端加欄位，不會是我們自己補得起來的 |
| `NewsArticle.contributor`／`attachments`／`relatedLinks` | ❌ 都沒有對應欄位 | 附件下載、相關連結、撰稿人這三塊在 `News` 型別裡都找不到 |
| `IndustryCase.category`（分類1／分類2） | `SuccessCase.industry`（自由文字產業別）＋ `tags?: string[]` | 概念不一樣：我們做的是「網站自訂分類」篩選頁籤，真正的欄位是「產業別」自由文字＋標籤陣列，沒有 categoryId／CategoryType，篩選機制可能要整個改設計 |
| `IndustryCase` 缺的欄位 | `SuccessCase.companyName`（必填）、`isPublished` | 真正的成功案例**一定要掛一個公司名稱**，我們的假資料完全沒有這個欄位；發布狀態也沒有模擬 |
| `PromotionVideo.description` | ❌ `VideoResponse` **完全沒有描述欄位** | 只有 `name`／`remark`（備註，語意上不像是要公開顯示的說明文字），我們畫面上每支影片的說明文字要嘛用 `remark` 頂著用、要嘛請後端加欄位 |
| `PromotionVideo.date`（單一日期） | `VideoResponse.startDate`／`endDate`（日期區間） | 跟 `News` 一樣的規律：真正的內容型資料幾乎都是「上下架日期區間」，不是單一顯示日期，這是系統性的落差，不只影音專區一處 |
| — | `VideoResponse.linkUrl`／`albumId` | 真正的影片可能是外部連結（例如 YouTube）＋可以分組進相簿，我們目前假資料沒有模擬這兩個概念 |
| `faq-data.ts` 的 `category`（字串） | `QuestionResponse.categoryId`（number） | 跟 News 一樣，分類要改用數字 ID |

其餘（`subject`/`answer` vs 我們的 Q/A 欄位、`title`/`summary`/`content` 這類命名差異）都只是欄位改名，資料語意上是對得上的，不算落差。

### 🟢 彈跳公告：型別跟我們自己土法煉鋼做的邏輯幾乎一模一樣

`PopupAnnouncement` 型別裡的 `routes: string[]`、`frequency`（顯示頻率）、`showDontShowToday: boolean`——**這幾乎是照著我們自己在 `WelcomeModal.tsx` 土法煉鋼做的「今天不再顯示」邏輯設計的**（或者反過來，我們設計時無意間跟真正的資料模型撞衫了）。這塊接起來應該是所有項目裡風險最低、最快能看到成果的，維持原本建議：優先接這個。

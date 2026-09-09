# 後端保留盤點（2026-09-07）

> 重要方向修正：`SPS.AdminWeb`（含它現在接的那個後端資料模型/`SPS.Api`）
> 是**舊系統**，你已經另外備份走了；`SPS.Web`（照規劃書＋舊站
> `page/*.html` 做的新設計）才是這個 repo 之後的主線，**後端資料/格式
> 要跟著前台的設計去改，不是前台遷就後端現在有什麼**。
>
> 這份文件是照這個新方向，逐一盤點現有後端（`SPS.Domain`/`SPS.Application`/
> `SPS.Api`，共 67 個 Entity、266 個端點）——哪些是通用基礎建設可以直接
> 續用、哪些核心概念對但欄位/格式要照新設計調整、哪些是舊系統/廠商樣板
> 帶來、這個平台其實用不到的東西、哪些要等 `SPS.Web` 先把頁面設計定案
> 才知道後端該長怎樣。跟 [planning-doc-gap-analysis-2026-09-07.md](planning-doc-gap-analysis-2026-09-07.md)
> 是同一輪盤點的後續——那份是「照規劃書逐條對，缺什麼」，這份是「現有
% 東西裡哪些能留」，兩份合看。

---

## ✅ 保留：通用基礎建設，跟「舊系統的內容/UI設計」無關

這幾塊是任何系統都需要的底層能力，不是綁著舊版 UI/內容模型的東西，新設計不管長怎樣都用得到，建議直接保留：

- **會員驗證／登入**：`Member`、`FidoCredential`、`PasswordChangeLog`、`VerificationRecord`、`UserSession`——JWT、FIDO2 無密碼登入、密碼原則這些，跟前台頁面設計無關，保留。
- **後台帳號權限**：`User`、`Role`、`UserRole`——後台管理員的 RBAC，跟公開網站設計無關，保留。
- **檔案管理**：`File`、`UploadedFile`、`Document`、`ApplicationDocument`——上傳/下載/儲存的底層機制，保留（`DocumentType` 這個 enum 裡的**分類項目**要照規劃書調整，見下面「需要調整」那節，但整個檔案系統的骨架不用重做）。
- **標籤/分類系統**：`Category`、`Tag`、`CompanyTagCategory`、`DemandTagCategory`、`Attribute`／`AttributeValue`／`EntityAttributeValue`——這套通用標籤/分類機制已經證實在用（企業標籤資料跟「應用情境/範疇/智慧技術」文字一模一樣），這是規劃書「雙路徑標籤設計」最核心的底層，保留。
- **通知/客服**：`Notification`、`ChatConversation`、`ChatMessage`、`ChatRecord`——站內通知、線上客服，前台目前完全沒做這塊 UI，但後端這套機制本身跟「內容用什麼格式存」無關，可以留著，等前台要做客服/通知功能時直接接。
- **電子報寄送**：`EmailCampaign`、`EmailCampaignAttachment`、`EmailCampaignRecipient`、`MailLog`——後台寄送機制保留；但公開的訂閱端點還是缺（跟上次落差分析講的一樣，這個要新增，不是「保留」的問題）。
- **AI 語意媒合**：`ContentEmbedding`——向量搜尋引擎，已經證實在用（`GetSimilarCompaniesByVectorAsync`），規劃書「輔導串接型媒合」用得到，保留。
- **需求媒合通知**：`Demand`、`DemandNotification`——已經證實整條「需求端公告徵案→自動配對供給端→寄信通知」的邏輯是真的做出來、能動的，保留。
- **統計/分析**：`SiteCounter`、`SiteStatistics`、`AnalyticsDailyMetric`、`AnalyticsDimensionStatistic`、`ActionLog`、`VisitorPageView`——訪客統計、操作日誌，跟內容模型無關，保留。
- **系統設定**：`SystemSetting`——通用鍵值設定表，保留。

---

## 🔧 保留核心概念，但欄位/格式要照新設計調整

這幾塊「有這個東西是對的」，但目前的欄位設計或內容格式是照舊系統/舊 UI 想的，新設計下要動：

- **`Company`（企業會員主檔）**：核心欄位（名稱、統編、聯絡方式、地址、標籤）保留，但：
  - `CompanyLevel`（`Basic`/`Standard`/`Premium`/`VIP`）這個 4 級制，跟規劃書「卓越會員／新興會員」的命名/邏輯對不起來（見上次的落差分析），要嘛改 enum 命名跟規劃書一致，要嘛在 `MemberApplication` 審核時的判斷邏輯明確定義兩者的對應關係，不能放著不明不白。
  - 缺「所屬公司名稱／產業別」這種**個人會員填的自由文字欄位**（個人會員不建立真的 `Company` 記錄時，這兩項資料要存在 `Member` 表上，見下方）。
- **`Member`**：核心欄位保留，但要加「所屬公司名稱」「產業別」這兩個自由文字欄位（給沒有掛 `CompanyId` 的個人會員用，前面已經確認缺這個）。
- **`MemberApplication`＋`ApplicationMember`**：申請書＋多聯絡人的模型設計本身是對的（跟規劃書描述的申請流程吻合），但：
  - `ReviewerId` 是單一審核人，規劃書要求新興會員要**至少 5 位外部學者專家評分**——這塊要嘛新增一張「審查委員指派表」＋擴充 `Scoring`（見下面），要嘛先確認這次改版要不要做到這麼細。
  - 缺「停權到期日」欄位（擋不住規劃書「兩年內不得重新申請」）。
- **`Scoring`**：現在只有一個 `Score` 總分欄位，規劃書的新興會員審查要拆成 6 項加權標準分別評分（人力資源20%／團隊學經歷20%／相關經驗20%／財務制度10%／產品實績20%／財務狀況10%）——這張表要嘛加欄位變成「一次評分存 6 個子分數」，要嘛拆成「一個委員一次評分 = 多筆明細列」，看要怎麼設計評分表單再定。
- **`DocumentType`**：目前 4 個值（`CompanyRegistration`／`PersonalDataConsent`／`TechnicalCapability`／`CloudMarketplace`／`DigitalServiceCapability`／`Application`，共 6 個）裡沒有「工廠登記證明文件」——需求端申請要交的法定文件現在被迫共用「公司登記證明文件」這個值，要新增一個獨立的列舉值。
- **`News`／`Question`／`SuccessCase`／`Video` 的內文欄位（`content`／`answer`）**：這是這次對話主要在討論的——現在存的是完整版 Puck 區塊 JSON（14 種區塊，`HeroBlock`／`TwoColumnLayout`／`Accordion`…），對照今天實測的資料庫內容，份量落差很大（有的像一整頁文章，有的一段文字），跟「這頁只放內文」的新設計方向不符。**這塊要由 `SPS.Web` 那邊先定案**：
  - 每個內容類型（公告、Q&A、產業案例）真正需要哪幾種區塊？
  - 是要繼續用 Puck（但後台編輯器限縮成受控的區塊子集），還是乾脆換成單純的富文本欄位（不用 Puck 的 block 系統）？
  - 這個決定會直接影響：後台編輯器（`FaqFormPage.tsx` 這些）要不要重做、`SPS.Web` 的 `PuckRenderer`／`live-content-config.tsx` 要不要留著或大幅精簡。
  - **不用擔心舊資料**——你已經確認舊資料不用保留，這塊可以放手改，不用做相容轉換。

---

## ❓ 要等 `SPS.Web` 先把頁面設計出來，才知道後端該長怎樣

這幾塊 `SPS.Web` 目前還沒做出對應頁面（或者只是佔位），後端雖然有東西，但欄位夠不夠用要等頁面設計定案才能確認：

- **我要媒合（企業名錄／媒合對接）**：`Company`／`Demand` 的 API 本身看起來夠用（分頁查詢、標籤篩選、AI 相似媒合都有），但 `SPS.Web` 完全沒做這兩頁，實際要顯示哪些欄位、篩選條件長怎樣，要等頁面設計出來才知道現有 API 回傳的東西夠不夠、要不要加欄位。
- **計畫簡介**：後端可能可以沿用 `About`（`AboutType` enum、支援 banners/links/pages/albums 的通用內容模組），但也可能要新開一個更單純的欄位——這頁 `SPS.Web` 連基本設計都還沒動手，先不用猜後端要改什麼。
- **企業會員的公司主頁**：規劃書提到「建立公司專頁」是供給端會員的權益之一，`Company` 表有 `introduction`／`videoUrl`／`photo`／`banner` 這些欄位，理論上夠用，但公司專頁實際要長什麼樣（版面、要不要秀產業案例、要不要秀標籤雲）`SPS.Web` 還沒設計，先備而不用。

---

## ❌ 可能是舊系統/廠商樣板帶來的東西，這個平台大概率用不到

這幾張表看起來是從某個**通用 CMS 樣板**帶過來的功能（前面盤點舊站 CSS 時就發現 `coreStyle.css` 是「廠商共用樣板」，這裡是後端版本的同一個現象），規劃書從頭到尾沒有提到任何相關需求，建議先當作「不用管、不用配合它調整」，除非之後真的有人要用：

- **多語系整套**：`Culture`、`MultilingualText`、`MultilingualImage`、`StringResource`、`Resource`——完整的 i18n 基礎建設（多語言版本內容管理），但舊站/規劃書/`SPS.Web` 從頭到尾都是純中文，沒有任何多語言需求的跡象。這套如果不用，`News`／`About` 等表上掛的 `NewsTitles`／`NewsIntroductions` 這些多語言關聯欄位也是多餘的複雜度。
- **`Product`（產品目錄）**：欄位有 `Height`／`LengthUnit`／`Mixed`／`ModelNo` 這種**實體商品規格**用的欄位，比較像電商/型錄系統，規劃書裡「主要產品暨服務」講的是公司提供的服務類型（用標籤表達即可），不是需要長寬高規格的實體商品，這張表大概率不需要。
- **`Mou`（合作備忘錄）**：規劃書沒有提到 MOU 簽署流程，不確定是不是這次平台範圍內的東西，如果之後沒人提，也可以先當作不需要。
- **`RelationLink`**：通用「相關連結」內容區塊，用途重疊在標籤/分類系統跟各內容模組自己的關聯欄位裡，看起來也是樣板帶來的、不確定有沒有實際被用到。

---

## 📌 建議下一步

1. **先讓 `SPS.Web` 把「內文只能放內文」這個決定，具體定義成幾種內容類型各自需要哪些欄位**（公告事項、Q&A、產業案例——是不是都一樣簡單？還是產業案例可以稍微豐富一點，Q&A 一定要最簡單？），這是後端要改 `News`/`Question`/`SuccessCase` 內容欄位前最需要的輸入。
2. **「❌ 可能不需要」那幾張表**，建議直接跟負責後端的人確認一次「這幾個功能是不是真的沒有需求」，如果確認不需要，可以從這次改版的維護範圍裡拿掉，減少之後改動時要一起考慮的複雜度。
3. **「🔧 需要調整」那幾項**（`CompanyLevel` 命名、`DocumentType` 缺工廠登記、`Scoring` 6 項配分、`MemberApplication` 缺停權期限），這些不用等前台設計，可以先排進後端的 sprint。
4. 「❓ 要等前台先定案」那三塊，維持現狀就好，不用現在猜。

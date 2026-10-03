# 後端 API 權限盤點（2026-10-03）

盤點範圍：`src/SPS.Api/Controllers` 全部 43 支 controller。方法：逐支列出授權屬性 →
對照兩個前端（SPS.Web、SPS.AdminWeb）實際呼叫哪些端點 → 用四種身分（匿名／前台會員／
無任何權限的後台帳號／超管）對每個非公開端點實打一遍（POST/PUT 一律送壞掉的 JSON、DELETE 用不存在的 id，
只驗「授權有沒有擋」，不會改到資料）。

## 身分模型（讀這份之前先知道）

| 身分 | token 內容 | 來源 |
|---|---|---|
| 匿名 | 無 | — |
| 前台會員 | role = `Supplier`/`Buyer`/`None`、`MemberId`、`Permissions`（**MemberPermission** 位元） | `TokenService.GenerateAccessToken` |
| 後台使用者 | role = `Admin`（**所有**後台帳號都有）＋ 依權限推導的虛擬角色（`SuperAdmin`/`Reviewer`/`SettingsAdmin`/`CustomerService`/`AnalyticsViewer`）、`UserType=Admin`、`Permissions`（**UserPermission** 位元） | `TokenService` 約 190–260 行 |

Cookie 選擇（`Program.cs` `OnMessageReceived`）：`/api/admin/*` 先取 `adminAccessToken`；其他路徑先取 `accessToken`（會員）。
AdminWeb 的請求帶 `X-Admin-Client: 1`，讓共用路徑也先取後台 token（只決定先取哪個 cookie，不給任何權限）。

## 本次發現的問題與處理

| # | 問題 | 嚴重度 | 處理 |
|---|---|---|---|
| 1 | 後台專用 API 只掛裸 `[Authorize]`，**任何前台會員 token 都能呼叫**：會員清單／批次重設密碼（`api/admin/members`）、操作日誌與匯出（`Log`）、`Export/members｜companies｜products`、檔案管理、客服（`Chat`）、`ProTrack`、`SystemInfo`、站台計數設定、彈窗公告、群發信（`MailCampaign`，in-action 另有權限檢查）… | 嚴重 | 全部改 `[Authorize(Roles = "Admin")]` |
| 2 | **權限位元撞號**：會員與後台 token 的 `Permissions` claim 同名、位元意義不同。`MemberPermission.ViewCompany`=bit0=`UserPermission.ManageUsers`、`EditCompany`=bit1=`ManageRoles`、bit10–13（產品權限）撞 `ManageApplications`…。供給端主管（`SupplierManager`）通過 `AdminRolesController` 的 in-action 檢查，**實測可讀取後台角色清單**（PUT/DELETE/POST 亦可到達） | 嚴重（可竄改後台角色權限） | `AdminRoles` 等改 `Roles = "Admin"` 後實測 403。**根本修法見下方「未處理」** |
| 3 | About/Album/Attribute/Company/Demand/Mou/Notification/Picture/Product/Question/Regulations/SuccessCase/Video 的寫入端點，會員 token 可新增／修改／刪除（含別家公司的資料） | 嚴重 | 改 `Roles = "Admin"`（前台目前沒有任何頁面呼叫這些寫入端點） |
| 4 | `GET Applications/my?email=` 匿名，帶任意信箱就回該信箱所有申請（聯絡人、統編等） | 高（個資） | 改需登入，一律以 token 信箱查詢，query 帶別人的信箱 403 |
| 5 | 公開列表／詳情會連**草稿**一起回：SuccessCase（3 筆）、Demand、Album、News、Banner（Product/Video/Picture/Question 同樣補上） | 中 | 非 Admin 強制只回已發布；草稿詳情 404 |
| 6 | `GET Company/{id}`、`by-code/{統編}` 匿名回完整後台資料：負責人姓名／信箱／電話／手機、窗口名單、內部備註、營收（**實測已能匿名取得真實負責人信箱**） | 高（個資） | 非 Admin 清掉這些欄位；後台照舊 |
| 7 | AdminWeb 與前台會員同瀏覽器同時登入時，共用路徑的後台寫入會被當成會員（cookie 優先序） | 修 #1 的副作用 | `X-Admin-Client` 標頭 |

## 各 controller 分類（修正後）

「前台」＝SPS.Web 真的有頁面呼叫；「後台」＝只有 AdminWeb 呼叫。SPS.Web `lib/api/*` 裡有一堆從 AdminWeb 複製來、沒有任何頁面引用的檔案，不算前台使用。

### 公開（匿名可讀）— 前台使用

| Controller | 端點 | 備註 |
|---|---|---|
| News、Banner（`by-code`、`views`、`click`）、Search、Tag、Category、Question | GET | News/Banner/Question 非 Admin 只回已發布 |
| SiteCounter / SiteStatistics（公開版）、PopupAnnouncement（`active`）、SystemSetting（`content/public`、`membership-guide/public`）、Captcha | GET/POST | |
| Applications | 全部 `[AllowAnonymous]`，但 `my` 已改需登入 | 申請人註冊前沒有帳號，靠「申請 GUID 不可猜」當憑證，見下方未處理 |
| Auth（login/register/refresh/忘記密碼/FIDO2 驗證）、AdminAuth（login/check-init/忘記密碼…） | POST | |

### 公開（匿名可讀）— 目前前台未使用，僅後台或預留

About、Album、Attribute、Company、Demand、Mou、Picture、Product、Regulations、SuccessCase、Video：GET 匿名，非 Admin 看不到草稿；Company 詳情已隱藏內部欄位。

### 前台會員（`[Authorize]`，需會員 token）

`api/member/*`（MemberProfile）、`api/member-chat/*`（MemberChat）、`MemberHub`、`Auth/profile|fido2/*`、`Applications/my`。後台 token 打這些會得到 401/403（用 `MemberId` claim 判斷）。

### 後台（`Roles = "Admin"` 以上）

| 範圍 | Controller | 額外要求 |
|---|---|---|
| 申請審核 | `admin/applications` | `SuperAdmin,Reviewer` |
| 用戶／角色 | `admin/users`、`admin/roles` | `admin/users` 類別 `SuperAdmin,Reviewer` ＋ in-action `ManageUsers`；`admin/roles` 類別 `Admin` ＋ in-action `ManageRoles` |
| 系統設定 | `settings/*`（`content/public`、`membership-guide/public` 匿名） | 逐 action 的 RBAC 權限，見 rbac 文件 |
| 分析 | `analytics` | ViewAnalytics |
| 公司資料刪除 | `admin/company` | `SuperAdmin` |
| 內容寫入 | News、Banner、Tag、Category、About、Album、Attribute、Picture、Video、Question、Regulations、SuccessCase、Mou | `Admin` |
| 會員／企業／產品／需求維運 | `admin/members`、Company、Product、Demand、Export | `Admin` |
| 通訊 | MailCampaign（in-action `SendBulkEmail`／`ManageMailLogs`）、Notification | `Admin` |
| 客服／系統 | Chat、`admin/member-chat`、ProTrack、SystemInfo、`admin/site-counter`、`admin/site-statistics`、`admin/popup-announcements`、Log、FileManagement | `Admin` |

## 未處理（需要決策，建議排下一輪）

1. ~~細粒度權限沒有在後端落實~~ → **已處理**：見 [rbac-permission-design-2026-10-03.md](rbac-permission-design-2026-10-03.md)（`[RequirePermission]`、檢視／維護兩層、授權上限、預設角色）。
2. **權限位元撞號的根本修法**：把會員 token 的 claim 改名（例如 `MemberPermissions`），`MemberPermissionRequiredAttribute` 與 `MemberHub` 同步改。現在靠 `Roles = "Admin"` 擋住，但只要未來有人在後台 controller 用 in-action `CheckPermission` 又忘了加角色限制，這個洞就會重現。
3. **Applications 的 GUID 即憑證**：`GET/PUT {id}`、`submit`、`cancel`、文件上傳／刪除都匿名，只靠 GUID 不可猜。GUID 外流（郵件連結、瀏覽器紀錄）就能讀寫別人的申請。若申請流程改成「先註冊／驗證信箱再申請」可改為需登入並比對擁有者。
4. ~~`POST Log/mail/bounce` 匿名且沒有驗證~~ → **已處理**（2026-10-03）：改用共享密鑰標頭 `X-Webhook-Secret`，值需等於設定 `Bounce_Webhook:Secret`（環境變數 `Bounce_Webhook__Secret`，至少 16 字元）；沒設定時端點停用（503），密鑰錯誤 401（驗證在查詢郵件記錄之前，探測不到記錄是否存在）。用常數時間比較，並限制 BounceCode／Reason／RemoteMta 長度、BounceTime 不得晚於現在。實際影響範圍：退信狀態只寫入 `MailLog` 供報表／寄信紀錄頁顯示，沒有任何寄送邏輯會依它抑制寄信，所以被偽造的後果是退信統計被汙染，不會讓會員收不到信；repo 內也找不到呼叫它的程式（實際的退信處理走 IMAP 的 `BounceProcessingService`）。若有外部郵件伺服器在呼叫，部署時要在兩邊設定同一組密鑰。
5. **前台會員自助管理產品／需求**：目前 Company/Product/Demand 寫入已鎖後台。之後若要開放供給端／需求端會員維護自家資料，應新增「依 `CompanyId` claim 限定擁有者」的獨立端點（例如 `api/member/products`），不要放寬現有端點。
6. `GET FileManagement/{id}/download` 匿名（前台圖片需要），知道 GUID 即可下載任何上傳檔（申請附件是否也走這條尚未確認，若是就有外洩風險）。申請附件建議改走需授權的下載端點。

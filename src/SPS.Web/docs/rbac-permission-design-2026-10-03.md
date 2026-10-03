# 後台權限（RBAC）設計與端點對照（2026-10-03）

延續 [api-authorization-audit-2026-10-03.md](api-authorization-audit-2026-10-03.md) 的「未處理 #1」：
UserPermission 旗標原本只有 AdminWeb 選單在用，後端大多只看「是不是後台使用者」。這次把它落實成真正的 RBAC。

## 模型

```
後台使用者 ──< UserRole >── 角色(Role.Permissions: 64-bit 位元) ──含── 權限旗標(UserPermission)
```

- **角色↔權限 mapping 存在 `Role.Permissions` 這個位元欄位**（沿用既有結構，AdminWeb 角色管理頁、token、選單都不用重寫）。
- 登入時把使用者所有角色的權限 OR 起來，簽進 token 的 `Permissions` claim。**角色被改後，使用者要重新登入／refresh 才生效。**
- 後端判斷一律走 `[RequirePermission(...)]`（`SPS.Api/Attributes/RequirePermissionAttribute.cs`）與 `UserPermissionExtensions`（`SPS.Domain/Enums/UserPermission.cs`），不要再各 controller 自己寫 `CheckPermission`。

### 判斷規則

| 規則 | 說明 |
|---|---|
| 先確認是後台使用者 | token 必須帶 `Admin` 角色。會員 token 的 `Permissions` 是 MemberPermission 位元（同名不同義），不先擋會被冒用 |
| 同一個屬性裡多個權限＝OR | `[RequirePermission(A, B)]`：有 A 或 B 即可 |
| 疊多個屬性＝AND | 匯出會員 = `ExportData` **且** `ViewMembers` |
| 維護包含檢視 | `ManageMembers ⇒ ViewMembers`、`ManageCompanies ⇒ ViewCompanies`、`ManageApplications ⇒ ViewApplications`（`Expand()`，AdminWeb `expandPermissions()` 同步） |
| 擁有全部旗標（`All`）一律通過 | |
| 授權上限 | 建立／修改角色、指派角色給使用者時，只能給**自己也擁有**的權限；不能含未定義位元（`CanGrant`）。否則有「角色管理」就能建全權限角色給自己 |

## 權限清單（27 項）

「檢視」＝唯讀；「維護」＝新增／修改／刪除。粗體是這次新增的旗標。

| 群組 | 旗標 | bit | 說明 |
|---|---|---|---|
| 系統 | ManageUsers | 0 | 後台帳號管理、指派角色 |
| | ManageRoles | 1 | 角色與權限維護 |
| | ManageSettings | 2 | 系統設定、系統資訊 |
| | **ViewActionLogs** | 4 | 檢視操作記錄 |
| | **ManageFiles** | 45 | 系統檔案管理（搬移／刪除／還原）；上傳與挑選檔案不需要這項 |
| 審核 | ManageApplications | 10 | 申請審核、評分（含檢視） |
| | **ViewApplications** | 11 | 檢視申請 |
| 會員 | ManageMembers | 20 | 會員維護：改資料、重設密碼、解鎖、停用（含檢視） |
| | ManageCompanies | 21 | 企業維護（含檢視） |
| | **ViewMembers** | 22 | 檢視會員 |
| | **ViewCompanies** | 23 | 檢視企業 |
| | **ExportData** | 24 | 匯出 Excel（會員／企業／產品／操作記錄） |
| 內容 | ManageProducts / ManageDemands | 30 / 31 | 產品／需求 |
| | ManageNews | 32 | 公告與公告標籤（原本橫幅、案例、相簿也掛這裡，已拆出） |
| | ManageMemos | 33 | 備忘錄（MOU） |
| | ManageCategories / ManageQuestions / ManageRegulations | 34 / 35 / 36 | 分類（含屬性）／FAQ／法規 |
| | **ManageBanners** | 37 | 橫幅與版位 |
| | **ManageSiteContent** | 39 | 成功案例、關於我們、彈窗公告、站台計數／統計設定 |
| | **ManageMedia** | 42 | 相簿、圖片、影音 |
| 分析 | ViewAnalytics | 40 | 分析報表 |
| 客服 | CustomerService | 41 | 即時客服 |
| 通訊 | SendBulkEmail | 50 | 群發信（還需能檢視會員或企業） |
| | ManageMailLogs | 51 | 寄信紀錄與退信 |
| | ManageEmailTemplates | 52 | 信件範本 |

## 端點對照

| 端點 | 需要 |
|---|---|
| `POST/PUT/DELETE` News | ManageNews |
| Banner 寫入、`GET Banner/positions` | ManageBanners |
| Album／Picture／Video 寫入 | ManageMedia |
| About／SuccessCase（含 publish）寫入、`admin/popup-announcements`、`admin/site-counter`、`admin/site-statistics` | ManageSiteContent |
| Category 寫入 | ManageCategories |
| Attribute 寫入 | ManageCategories **或** ManageProducts |
| Tag 寫入 | ManageNews／ManageCompanies／ManageDemands／ManageProducts 任一（各類資料都會用到標籤） |
| Question／Regulations／Mou／Product／Demand／Company 寫入 | 各自的 Manage（Mou→ManageMemos） |
| Demand 的相似企業／通知、`ProTrack` | ManageDemands |
| `GET admin/members`（含統計） | ViewMembers |
| `admin/members` 其餘（改資料、刪除、重設密碼、解鎖、信箱驗證、批次、窗口） | ManageMembers |
| `POST export/members` ／ `export/companies` | ExportData **且** ViewMembers ／ ViewCompanies |
| `POST export/products` | ExportData |
| `Log` 操作／申請日誌（列表、明細） | ViewActionLogs；`action/export` 另需 ExportData；`action/statistics` 仍為 ViewAnalytics；`mail*` 仍為 ManageMailLogs |
| `admin/applications` GET | ViewApplications |
| `admin/applications` 其餘（領件、審核、文件上傳／刪除、評分） | ManageApplications |
| `Chat`、`admin/member-chat` | CustomerService |
| `MailCampaign` 寄送類 | SendBulkEmail **且**（ViewMembers 或 ViewCompanies） |
| `MailCampaign` 列表／明細 | ManageMailLogs 或 SendBulkEmail |
| `FileManagement` 上傳、挑選、查詢（編輯公告要能上傳圖片） | ManageFiles 或任一內容維護權限（含 ManageSettings） |
| `FileManagement` 其餘（刪除、搬移、改名、資料夾、還原、統計…） | ManageFiles；`permanent` 另需 SuperAdmin；`{id}/download` 維持匿名（前台圖片） |
| `SystemInfo`（`health` 匿名） | ManageSettings |
| `admin/users` | ManageUsers（取代原本「SuperAdmin 或 Reviewer 角色」＋ 內部檢查，只有 ManageUsers 的帳號之前進不來） |
| `admin/roles` 列表 | ManageRoles 或 ManageUsers（指派角色時要列出角色）；其餘 ManageRoles |
| `settings/*`、`analytics`、`admin/company` | 維持原本的虛擬角色（SettingsAdmin／AnalyticsViewer／SuperAdmin，等同 ManageSettings／ViewAnalytics／全權限） |
| `Notification` | 後台帳號即可（每個管理員的鈴鐺通知，不分權限） |

## 預設角色（migration `UpgradeAdminPermissionsToRbac` 種入，同名已存在就不動）

| 角色 | 權限 |
|---|---|
| 超級管理員 | 全部 27 項 |
| 內容編輯 | ManageNews、ManageBanners、ManageSiteContent、ManageMedia、ManageMemos、ManageCategories、ManageQuestions、ManageRegulations、ManageFiles |
| 審核員 | ManageApplications、ViewMembers、ViewCompanies |
| 客服 | CustomerService、ViewMembers、ViewCompanies |
| 行銷人員 | SendBulkEmail、ManageMailLogs、ManageEmailTemplates、ViewMembers、ViewCompanies |

### 現有角色的自動補權限（讓套用後行為不變）

- 舊的「全權限」角色 → 補上全部新旗標（新的 `All`）
- 有 ManageUsers／ManageSettings → ViewActionLogs；有 ManageSettings／ManageNews → ManageFiles
- 有 ManageMembers／ManageCompanies／ManageProducts → ExportData
- 有 ManageNews → ManageBanners、ManageSiteContent、ManageMedia
- 有 CustomerService／SendBulkEmail → ViewMembers、ViewCompanies
- Down：移除新旗標位元；範本角色沒人指派才刪

本機實測：套用後既有角色（客服人員、小編、後台管理員、新聞發布、系統管理員）都依上面規則補上，行為不變；範本角色已種入（本機已存在同名「審核員」，保留不動）。

## 驗證

用角色對應的 token 打 29 個代表端點 × 9 種身分（無權限、內容編輯、客服、舊客服人員、審核員、行銷人員、超級管理員、僅 ManageRoles、僅 ManageUsers）共 261 筆，另外每個端點再用帶 SupplierManager 位元的會員 token 打一次（29 筆，全部 403），全部符合預期；授權上限測試：ManageRoles 建全權限角色 403、含未定義位元 400、建自己有的權限 201 後改成全權限 403；ManageUsers 指派超級管理員角色 403。

## 仍待決定

- `settings/*` 還是整支 `SettingsAdmin`：只有 ManageEmailTemplates 的角色進不了信件範本頁（選單上顯示得到，打 API 會 403）。要拆需要把 50 個 action 逐一標權限。
- 角色權限被修改後，已登入的後台使用者要重新登入才生效（token 內嵌權限）。若要即時生效，要改成每次請求查 DB 或縮短 access token 壽命。
- 新增旗標時 bit 不可超過 52（JSON number 精度）。

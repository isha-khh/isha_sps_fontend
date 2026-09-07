# Admin Portal Development Status

This document tracks the implementation status of the Admin Portal pages and their API integrations.

**Last Updated:** 2026-01-15
**Last Exploration:** Full API and UI integration audit completed

---

## ✅ Phase 6: 內容管理功能優化 (2026-01-15 完成)

### 需求概述
整合檔案系統 API 到橫幅管理、相簿管理、Puck 編輯器等模組，提升使用者體驗。

---

### 6.1 橫幅管理優化 (/content/banners) ✅

**已解決問題:**
- ✅ 整合檔案系統選擇器，可從現有檔案選擇圖片/影片
- ✅ 新增連結打開方式選項 (新視窗/原視窗跳轉)
- ✅ 支援圖片和影片預覽

**完成項目:**

#### 6.1.1 建立檔案選擇器組件 (FilePickerModal) ✅
- [x] **新增組件:** `src/components/shared/FilePickerModal.tsx`
  - [x] 調用 `filesManagementApi.queryFiles()` 獲取檔案列表
  - [x] 支援圖片和影片類型篩選
  - [x] 網格式預覽展示
  - [x] 支援搜尋和分頁
  - [x] 點擊選擇後返回檔案 URL
  - [x] 支援直接上傳新檔案

#### 6.1.2 後端 Banner 類型擴展 ✅
- [x] **修改 DTO:** `backend/SPS.Application/DTOs/Banner/CreateBannerRequest.cs`
  - [x] 新增 `LinkTarget` 欄位 (string: "_blank" | "_self")
- [x] **修改 DTO:** `backend/SPS.Application/DTOs/Banner/UpdateBannerRequest.cs`
  - [x] 新增 `LinkTarget` 欄位
- [x] **修改 DTO:** `backend/SPS.Application/DTOs/Banner/BannerResponse.cs`
  - [x] 新增 `LinkTarget` 欄位
- [x] **修改 Entity:** `backend/SPS.Domain/Entities/Banner.cs`
  - [x] 新增 `LinkTarget` 屬性
- [x] **更新 Service:** `backend/SPS.Application/Services/BannerService.cs`
  - [x] 處理新欄位的 mapping

#### 6.1.3 前端 Banner 類型擴展 ✅
- [x] **修改類型:** `admin/src/types/banner.ts`
  - [x] `BannerResponse` 新增 `linkTarget?: string`
  - [x] `CreateBannerRequest` 新增 `linkTarget?: string`
  - [x] `UpdateBannerRequest` 新增 `linkTarget?: string`

#### 6.1.4 橫幅管理頁面改造 ✅
- [x] **修改頁面:** `admin/src/pages/content/BannersPage.tsx`
  - [x] 整合 FilePickerModal 組件
  - [x] 新增「從檔案系統選擇」按鈕
  - [x] 保留手動輸入 URL 的選項
  - [x] 新增連結打開方式下拉選單 (開新視窗/原網頁跳轉)
  - [x] 預覽支援圖片和影片 (video tag，hover 播放)
  - [x] 顯示內容類型 (圖片/影片)

---

### 6.2 系統檔案整合 (/content/files) ✅

**狀態:** 已完成
- ✅ UI 組件完整 (FileApp.tsx)
- ✅ API 已對接 (filesManagementApi)
- ✅ FileUploaderField 已修正

#### 6.2.1 修正 FileUploaderField (Puck 用) ✅
- [x] **修改組件:** `admin/src/components/puck/FileUploaderField.tsx`
  - [x] 移除硬編碼的錯誤 API 端點
  - [x] 改用 `filesManagementApi.uploadFile()` 方法
  - [x] 整合上傳進度回調
  - [x] 新增「從檔案庫選擇」功能
  - [x] 整合 FilePickerModal 組件

---

### 6.3 相簿管理優化 (/content/albums) ✅

**已解決問題:**
- ✅ 可以上傳圖片到相簿
- ✅ 可以從檔案系統選擇現有圖片加入相簿
- ✅ 可以設定相簿封面

**完成項目:**

#### 6.3.1 新增圖片上傳功能 ✅
- [x] **修改頁面:** `admin/src/pages/content/AlbumsPage.tsx`
  - [x] 在查看相簿 Modal 中新增「上傳圖片」按鈕
  - [x] 整合 FilePickerModal 組件，支援選擇現有圖片
  - [x] 實現圖片上傳流程:
    1. 上傳檔案到 filesManagementApi
    2. 調用 picturesApi.create() 建立圖片記錄，關聯相簿 ID
  - [x] 支援多檔案批量上傳
  - [x] 新增設定相簿封面功能

#### 6.3.2 圖片創建 API 整合 ✅
- [x] **確認 API:** `picturesApi.create()` 請求格式已確認
- [x] **確認欄位:**
  - `albumId` - 關聯相簿
  - `uri` - 檔案 URL
  - `name` - 圖片名稱
  - `contentType` - 內容類型

#### 6.3.3 相簿封面設定 ✅
- [x] **新增功能:** 在相簿圖片列表中，可設定任一圖片為封面
  - [x] 調用 `albumApi.update()` 更新 `coverId`
  - [x] 當前封面顯示星星標籤

---

### 6.4 Puck 編輯器整合 (/announcements/*/edit) ✅

**已解決問題:**
- ✅ FileUploaderField.tsx 改用正確的 API
- ✅ FileUploaderField.tsx 整合檔案選擇器
- ✅ ImageUploadField.tsx 整合檔案選擇器

**完成項目:**

#### 6.4.1 FileUploaderField 改造 ✅
- [x] **修改組件:** `admin/src/components/puck/FileUploaderField.tsx`
  - [x] 改用 `filesManagementApi.uploadFile()`
  - [x] 新增「從檔案庫選擇」功能
  - [x] 整合 FilePickerModal 組件
  - [x] 新增上傳進度條

#### 6.4.2 ImageUploadField 增強 ✅
- [x] **修改組件:** `admin/src/components/puck/ImageUploadField.tsx`
  - [x] 新增「從檔案庫選擇」按鈕
  - [x] 整合 FilePickerModal 組件 (只顯示圖片類型)
  - [x] 保留現有上傳功能和手動輸入 URL

---

## 📋 開發任務清單 (已全部完成)

### 第一階段：共用組件 ✅

| 序號 | 任務 | 檔案 | 狀態 |
|------|------|------|------|
| 1.1 | 建立 FilePickerModal 組件 | `src/components/shared/FilePickerModal.tsx` | ✅ 完成 |

### 第二階段：橫幅管理 ✅

| 序號 | 任務 | 檔案 | 狀態 |
|------|------|------|------|
| 2.1 | 後端 - Banner Entity 新增 LinkTarget | `backend/.../Banner.cs` | ✅ 完成 |
| 2.2 | 後端 - Banner DTOs 新增 LinkTarget | `backend/.../CreateBannerRequest.cs` 等 | ✅ 完成 |
| 2.3 | 後端 - BannerService 更新 mapping | `backend/.../BannerService.cs` | ✅ 完成 |
| 2.4 | 前端 - Banner types 新增 linkTarget | `src/types/banner.ts` | ✅ 完成 |
| 2.5 | 前端 - BannersPage 整合檔案選擇器 | `src/pages/content/BannersPage.tsx` | ✅ 完成 |

### 第三階段：相簿管理 ✅

| 序號 | 任務 | 檔案 | 狀態 |
|------|------|------|------|
| 3.1 | AlbumsPage 新增上傳圖片功能 | `src/pages/content/AlbumsPage.tsx` | ✅ 完成 |
| 3.2 | AlbumsPage 整合檔案選擇器 | `src/pages/content/AlbumsPage.tsx` | ✅ 完成 |
| 3.3 | AlbumsPage 新增設定封面功能 | `src/pages/content/AlbumsPage.tsx` | ✅ 完成 |

### 第四階段：Puck 編輯器 ✅

| 序號 | 任務 | 檔案 | 狀態 |
|------|------|------|------|
| 4.1 | FileUploaderField 改用正確 API | `src/components/puck/FileUploaderField.tsx` | ✅ 完成 |
| 4.2 | FileUploaderField 整合檔案選擇器 | `src/components/puck/FileUploaderField.tsx` | ✅ 完成 |
| 4.3 | ImageUploadField 整合檔案選擇器 | `src/components/puck/ImageUploadField.tsx` | ✅ 完成 |

---

## 📊 技術規格

### FilePickerModal 組件規格

```typescript
interface FilePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: FileListItem) => void;
  fileType?: 'image' | 'video' | 'document' | 'all';
  multiple?: boolean;
  title?: string;
}
```

**功能需求:**
1. 顯示檔案網格 (圖片預覽 / 檔案圖標)
2. 支援搜尋和篩選
3. 支援分頁載入
4. 支援直接上傳新檔案
5. 選擇後返回檔案資訊

### Banner LinkTarget 規格

```typescript
// 前端類型
linkTarget?: '_blank' | '_self';  // 預設 '_self'

// 後端 DTO
public string? LinkTarget { get; set; } = "_self";
```

### 圖片上傳流程

```
1. 使用者選擇檔案
   ↓
2. 調用 filesManagementApi.uploadFile() 上傳到檔案系統
   ↓
3. 獲得 fileUrl
   ↓
4. 調用 picturesApi.create({
     albumId: xxx,
     uri: fileUrl,
     name: fileName,
     contentType: 'image/jpeg'
   })
   ↓
5. 重新載入相簿圖片列表
```

---

## 🟢 已完成的模組 (Phase 1-5)

### ✅ Phase 1: 關鍵修復
- Chat 模組 SignalR 整合
- Companies 驗證功能移除
- Demands togglePublish 優化

### ✅ Phase 2: 統計端點
- 4 個統計 API (Members, News, Demands, Companies)
- Dashboard 整合

### ✅ Phase 3: 系統管理
- Accounts, Roles, Config, Action Logs

### ✅ Phase 4: 知識庫
- FAQ, Regulations

### ✅ Phase 5: 通知系統
- TopbarNotificationButton
- NotificationsPage

---

## 📝 備註

### 相關檔案路徑

**前端:**
- `admin/src/pages/content/BannersPage.tsx` - 橫幅管理頁面
- `admin/src/pages/content/AlbumsPage.tsx` - 相簿管理頁面
- `admin/src/pages/content/FilesPage.tsx` - 檔案管理頁面
- `admin/src/components/file/FileApp.tsx` - 檔案管理主組件
- `admin/src/components/puck/ImageUploadField.tsx` - Puck 圖片上傳
- `admin/src/components/puck/FileUploaderField.tsx` - Puck 檔案上傳
- `admin/src/lib/api/files-management.ts` - 檔案管理 API
- `admin/src/lib/api/banner.ts` - 橫幅 API
- `admin/src/lib/api/album.ts` - 相簿 API
- `admin/src/lib/api/pictures.ts` - 圖片 API

**後端:**
- `backend/SPS.Domain/Entities/Banner.cs` - Banner 實體
- `backend/SPS.Application/DTOs/Banner/` - Banner DTOs
- `backend/SPS.Application/Services/BannerService.cs` - Banner 服務
- `backend/SPS.Api/Controllers/BannerController.cs` - Banner 控制器
- `backend/SPS.Api/Controllers/FileManagementController.cs` - 檔案管理控制器

### 已確認的 API 端點

| 功能 | 端點 | 方法 | 狀態 |
|------|------|------|------|
| 查詢檔案 | `/api/FileManagement/query` | GET | ✅ |
| 上傳檔案 | `/api/FileManagement/upload` | POST | ✅ |
| 獲取檔案 | `/api/FileManagement/{id}` | GET | ✅ |
| 刪除檔案 | `/api/FileManagement/{id}` | DELETE | ✅ |
| Banner CRUD | `/api/Banner` | GET/POST/PUT/DELETE | ✅ |
| Album CRUD | `/api/Album` | GET/POST/PUT/DELETE | ✅ |
| Picture CRUD | `/api/Picture` | GET/POST/PUT/DELETE | ✅ |
| Picture by Album | `/api/Picture/album/{albumId}` | GET | ✅ |

---

**最後更新:** 2026-01-15
**狀態:** Phase 6 開發中 🚧

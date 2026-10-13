# CI／CD：編譯檢查與打包成 GitHub Package

2026-10-13 建立。設定檔在 `.github/workflows/`，**還沒有實際在 GitHub 上跑過**（無法在本機執行 GitHub Actions，只檢查過 YAML 語法），第一次執行請留意結果並回報。

## 三個流程

| 檔案 | 觸發 | 做什麼 |
|---|---|---|
| `ci.yml` | **Pull Request**（目標 main）、**手動** | 後端、前台、後台各自編譯；另外試建三個 Docker 映像（不推送），確認 Dockerfile 沒壞 |
| `release.yml` | **打 tag**（如 `v1.1.2`）、**手動** | 先跑同一組編譯檢查，通過後打包成容器映像推送到 GitHub Packages；打 tag 時另外建立 GitHub Release |
| `_checks.yml` | 只被上面兩個呼叫 | 共用的編譯檢查（不能單獨觸發） |

編譯檢查內容：後端 `dotnet build`（Release）；前台 `pnpm install --frozen-lockfile`、`pnpm build`（`next build` 本身會做型別檢查；不能另外單跑 `tsc --noEmit`，因為 Next 16 的 `PageProps` 型別是 build 時才產生的）（另跑 `pnpm lint`，**不擋流程**，因為有一個既有的 lint 錯誤，修掉後把 `continue-on-error` 拿掉）；後台 `pnpm build`（含 `tsc -b`；後台的 ESLint 設定目前壞掉，所以不跑 lint）。專案目前沒有自動化測試。

## 套件（GitHub Packages／ghcr.io）

| 映像 | 內容 | 來源 |
|---|---|---|
| `ghcr.io/<擁有者>/sps-api` | 後端 | `src/Dockerfile`（context `src`） |
| `ghcr.io/<擁有者>/sps-web` | 前台（Next.js） | `src/SPS.Web/Dockerfile` |
| `ghcr.io/<擁有者>/sps-admin` | 後台（nginx 靜態檔） | `src/SPS.AdminWeb/Dockerfile` |

`<擁有者>` 是 repo 擁有者的小寫（目前是 `isha-khh`）。標籤：完整版本（`1.1.2`）、`sha-<commit 前 7 碼>`；**正式版本**另外有 `1.1`，勾選 latest（打 tag 時一定會）還有 `latest`；預先發行版本（`1.1.2-rc.1`）只有前兩種。映像內的版本號（後端 `InformationalVersion`、前台 `NEXT_PUBLIC_APP_VERSION`、後台 `VITE_APP_VERSION`）是 `<版本>+<commit>`。

## 怎麼用

**打 tag 發版**（tag 指向的 commit 必須已經在 `main` 上，否則流程會失敗）：

```bash
git checkout main && git pull
git tag v1.1.2
git push origin v1.1.2
```

`v1.1.2-rc.1` 這種帶連字號的視為預先發行（Release 標成 pre-release，不更新 latest 與 `1.1` 標籤）。

**手動打包**：GitHub → Actions → Release → Run workflow，選分支，填：
- 版本號（例如 `1.1.2-test`，不用加 v）。
- 推送：取消勾選＝只試建置、不推送。
- latest：要不要同時更新 latest 標籤（預先發行不會更新）。
- 平台：預設 `linux/amd64`；要同時支援 ARM 填 `linux/amd64,linux/arm64`（用 QEMU 模擬，前台與後台會慢很多）。

手動執行**不會**建立 GitHub Release，只產生套件。

**PR 檢查**：開 PR 到 `main` 自動執行；也可在 Actions → CI → Run workflow 對任一分支手動跑。

## 第一次使用前要確認

1. **GitHub 設定**：Settings → Actions → General → Workflow permissions 不需要改（檔案內已宣告需要的權限：打包 `packages: write`、建立 Release `contents: write`）；若組織限制了 Actions 或 GitHub Packages，要請管理者開放。
2. **套件可見度**：第一次推送後，套件預設是私有的、權限跟著 repo。要讓伺服器能 `docker pull`：
   - 私有：伺服器上用有 `read:packages` 權限的個人存取權杖登入：`echo <TOKEN> | docker login ghcr.io -u <使用者> --password-stdin`。
   - 或到套件頁 → Package settings 改成 Public（映像內不含任何密鑰：設定值都是啟動時用環境變數注入）。
3. **選用的 repo 變數**（Settings → Secrets and variables → Actions → Variables）：`WEB_BASE_PATH`（前台網站路徑，預設 `/sps`）、`NEXT_PUBLIC_API_URL`（前台 build 時的 API 位址，預設空，與目前測試機的 Dockerfile 預設一致）。
4. **PR 的 Docker 試建**會用 GitHub Actions 快取，第一次比較慢（前台與後台各約數分鐘），之後有快取就快。

## 拉映像、部署

```bash
docker pull ghcr.io/isha-khh/sps-api:1.1.2
docker pull ghcr.io/isha-khh/sps-web:1.1.2
docker pull ghcr.io/isha-khh/sps-admin:1.1.2
```

**目前測試機的部署流程不變**（遠端在伺服器上 `git pull` 後 `docker compose build` 自行建置），這套流程只負責產生套件；若要改成直接用套件部署，需要把測試機 compose 檔裡的 `build:` 換成 `image: ghcr.io/…:<版本>`，那是設定檔的變更，要另外安排，不在這次範圍。

## 已知限制

- 沒有自動部署，也沒有自動化測試。
- 沒有檢查 EF Core 資料庫遷移是否漏產生（`dotnet ef migrations has-pending-model-changes`），可日後加入。
- 映像沒有漏洞掃描與簽章。
- 前台映像把 `BASE_PATH` 在 build 時就寫死（Next.js 的 basePath 是 build 時決定的），要換網站路徑需要重新打包。

import DownloadDialog from "@/components/ui/DownloadDialog";
import type { DownloadResources } from "@/lib/types";

/** 後台沒資料（或後端連不到）時用的標題；平常顯示的是後台目錄裡的名稱 */
const FALLBACK_TITLES: Record<string, string> = {
  "register-guide": "會員申請須知",
  "register-consent": "附件一：蒐集個人資料告知事項暨個人資料同意書",
  "register-application": "附件二：登錄申請書",
  "register-review": "附件三：供給端新興會員文件資料審查評定方式",
};

/**
 * 積木元件：會員註冊流程裡的「相關文件下載」清單（會員申請須知、附件一～三）。
 *
 * 原本註冊流程完全沒提供這些文件——例如供給端新興會員要上傳「登錄申請書」，卻沒有空白申請書可以下載，
 * 申請人不知道格式。檔案與格式（Word／ODF／PDF）由後台「內容管理 → 頁面設定 → 下載資源」維護，
 * 這裡只負責顯示：某一項後台還沒設定任何檔案時，那一項顯示成不可點的「準備中」，不是失效連結。
 */
export default function RegisterDownloadList({
  resources,
  keys,
  heading = "相關文件下載",
}: {
  resources: DownloadResources;
  keys: string[];
  heading?: string;
}) {
  if (keys.length === 0) return null;

  return (
    <div className="register-downloads mb-4">
      <p className="mb-2 fw-bold">
        <i className="bi bi-file-earmark-arrow-down me-1" aria-hidden="true"></i>
        {heading}
      </p>
      <ul className="list-unstyled mb-0 d-grid gap-2">
        {keys.map((key) => {
          const resource = resources[key];
          const title = resource?.title ?? FALLBACK_TITLES[key] ?? key;
          return (
            <li key={key}>
              <DownloadDialog
                links={resource?.links ?? []}
                dialogTitle={`下載：${title}`}
                className="register-download-link d-inline-flex align-items-center gap-2"
                emptyLabel="文件準備中"
              >
                <i className="bi bi-download" aria-hidden="true"></i>
                <span>{title}</span>
              </DownloadDialog>
            </li>
          );
        })}
      </ul>
      <style>{`
        /* 舊站 CSS 在部分頁面把連結文字設成白色（原本放在深色按鈕上），這個清單放在白底，要自己指定顏色 */
        .register-downloads .register-download-link,
        .register-downloads .register-download-link * {
          color: #1d4f91;
        }
        .register-downloads .register-download-link[aria-disabled="true"],
        .register-downloads .register-download-link[aria-disabled="true"] * {
          color: #6b7280;
        }
        .register-downloads .register-download-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

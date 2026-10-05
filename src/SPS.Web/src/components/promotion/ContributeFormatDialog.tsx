import DownloadDialog from "@/components/ui/DownloadDialog";
import { withBasePath } from "@/lib/api-client";
import type { ContributeFormat } from "@/lib/types";

/**
 * 「我要投稿」頁的「下載投稿格式」按鈕。實際的下載入口與格式選擇對話框是通用的
 * [DownloadDialog](../ui/DownloadDialog.tsx)；這裡只負責投稿頁自己的按鈕外觀與文字。
 *
 * 投稿格式檔（Word .docx、ODF .odt、PDF）由後台「內容管理 → 頁面設定 → 我要投稿」維護（或隨程式碼 seed）：
 * - 沒有任何格式：按鈕變成不可點的「投稿格式準備中」
 * - 只有一種格式：一樣開對話框（`alwaysDialog`），讓使用者看得到檔名與大小，知道點下去會下載什麼
 */
export default function ContributeFormatDialog({ formats }: { formats: ContributeFormat[] }) {
  const arrow = (
    <div className="con-arrow" aria-hidden="true">
      <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt="" />
    </div>
  );

  const hasFormats = formats.length > 0;

  return (
    <DownloadDialog
      links={formats.map((f) => ({ kind: f.kind, url: f.url, fileName: f.fileName, formattedFileSize: f.formattedFileSize }))}
      dialogTitle="下載投稿格式"
      trigger="button"
      className="contribute_more_1 border-0"
      emptyLabel="投稿格式準備中"
      alwaysDialog
    >
      <i className="bi bi-file-earmark-arrow-down me-1" aria-hidden="true"></i>
      <span>{hasFormats ? "下載投稿格式" : "投稿格式準備中"}</span>
      {arrow}
    </DownloadDialog>
  );
}

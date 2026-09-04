"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Puck, Render, type Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { puckConfig } from "@/lib/puck/config";
import LinkListBox from "@/components/news/LinkListBox";
import ArticleContactInfo from "@/components/news/ArticleContactInfo";
import type { LinkListItem } from "@/lib/news-data";

interface LegacyArticleContent {
  contributor?: string;
  bodyHtml: string;
  attachments: LinkListItem[];
  relatedLinks: LinkListItem[];
}

/**
 * 把舊格式（`news-data.ts` 那幾個獨立欄位）包成一份 Puck 的 `Data`，
 * 塞進對應的區塊——順序照現在頁面上看到的：撰稿人 → 文章內文 →
 * 附件下載 → 相關連結 → 聯繫人資訊。
 *
 * 每個區塊的 `props.id` 不能省略——Puck 的 `ComponentData` 規定每個
 * 區塊的 `props` 都要有一個唯一的 `id`（見官方文件 component-data.md：
 * 「Requires a unique `id` prop to be defined」），這是它內部拖拉排序/
 * 選取狀態用來對應區塊的 key。漏掉這個欄位不會在 TypeScript 或畫面上
 * 馬上看出來，而是編輯器一打開、內部的圖層樹（layer tree）想幫這個
 * 區塊算拖曳位置時直接壞掉、整個編輯器 crash（`Cannot read properties
 * of null (reading 'position')`）——實測踩過一次才確認是這裡漏的。
 */
function legacyArticleToPuckData({ contributor, bodyHtml, attachments, relatedLinks }: LegacyArticleContent): Data {
  const content: Data["content"] = [];

  if (contributor) {
    content.push({ type: "Contributor", props: { id: "Contributor-legacy", name: contributor } });
  }

  content.push({ type: "ArticleParagraph", props: { id: "ArticleParagraph-legacy", content: bodyHtml } });

  // 附件下載／相關連結／聯繫人資訊要放進 SupplementaryInfo 的 slot 裡面，
  // 不是攤平當成三個獨立的頂層區塊——slot 欄位存的也是一份
  // `ComponentData[]`，一樣要各自帶唯一的 `id`。這層外框對應舊站
  // `.dk_conbo` 那個有實際裝飾樣式（圓角、漸層邊框）的容器，直接攤平
  // 會少了這圈外框，見 lib/puck/config.tsx 裡 `SupplementaryInfo` 的
  // 註解。
  const supplementaryItems: Data["content"] = [];

  if (attachments.length > 0) {
    supplementaryItems.push({ type: "FileDownloads", props: { id: "FileDownloads-legacy", items: attachments } });
  }

  if (relatedLinks.length > 0) {
    supplementaryItems.push({ type: "RelatedLinks", props: { id: "RelatedLinks-legacy", items: relatedLinks } });
  }

  supplementaryItems.push({ type: "ContactInfo", props: { id: "ContactInfo-legacy" } });

  content.push({ type: "SupplementaryInfo", props: { id: "SupplementaryInfo-legacy", items: supplementaryItems } });

  return { content, root: { props: {} } };
}

function readSavedData(storageKey: string): Data | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.content && Array.isArray(parsed.content) ? (parsed as Data) : null;
  } catch {
    // 壞掉的 JSON、或無痕模式擋掉 localStorage，都當作沒存過，走原本內容
    return null;
  }
}

/**
 * 積木元件：公告詳情頁「可編輯區域」的容器——涵蓋標題底下、返回按鈕
 * 之前的整段：撰稿人、文章內文、附件下載、相關連結、聯繫人資訊。標題
 * 本身、分類徽章、日期、關鍵字、封面圖這些留在 news/[id]/page.tsx，
 * 不屬於這裡（頁面模板本身的欄位，不是「公告內文」）。
 *
 * 現況先求「編輯功能跑得起來」，儲存這件事還沒接真的後台 API，
 * 存檔先寫進 `localStorage`（客戶需求：「存檔就先用 store 存在
 * storage」）——所以這個編輯功能目前是**每個瀏覽器各自本機生效**，
 * 換一台電腦、換一個瀏覽器都看不到別人編輯過的結果，之後要接真的
 * CMS API 時，只要把 `handlePublish`／初次讀取那兩處換成打 API，
 * 上面的 Puck 編輯器與區塊定義完全不用動。
 *
 * 沒有存過的公告，畫面照舊顯示原本幾個欄位個別渲染出來的樣子（跟
 * 改用 Puck 之前逐字一樣），不會因為裝了 Puck 就讓所有公告的畫面
 * 跟著變——只有實際被編輯過、存進 localStorage 的那幾篇才會改用
 * Puck 的 `<Render>` 顯示。
 *
 * 「泡泡懸浮圖標」用固定定位的圓形按鈕，點了直接開全螢幕編輯——這裡
 * 沒有像 docs/puck-content-blocks.md 提到的 `PuckEditor.tsx` 那樣做
 * 「小卡片預覽 + 切換全螢幕」，因為那個用法是設計給後台管理介面用的
 * 獨立卡片；這裡是疊在真正的公開頁面上面，所以正常情況就是顯示真實
 * 頁面本身（不需要另外做一個縮小預覽），點筆才整頁蓋一層編輯器上去。
 */
export default function EditableArticleBody({
  storageKey,
  contributor,
  bodyHtml,
  attachments,
  relatedLinks,
}: {
  storageKey: string;
  contributor?: string;
  bodyHtml: string;
  attachments: LinkListItem[];
  relatedLinks: LinkListItem[];
}) {
  // 一開始先固定給 `null`（=顯示舊欄位），不要在這裡就去讀
  // localStorage 當初始值：`"use client"` 元件一樣會在伺服器端跑一次
  // SSR 產生初始 HTML，Node 20+ 雖然有一個實驗性的全域 `localStorage`，
  // 但那是另一份跟瀏覽器無關的東西（build 時就跳過 `--localstorage-file
  // not provided` 的警告），如果拿它的結果（一律讀不到）當初始 state，
  // 跟瀏覽器端 hydrate 時讀到「真的存過的資料」兜不起來，會是跟先前
  // PageLoader／WelcomeModal 那幾次一樣的 hydration mismatch。所以一樣
  // 照那個模式：先用 SSR 也會產生的值（null）畫第一次，實際讀
  // localStorage 挪到 mount 後的 effect 裡才做。
  const [savedData, setSavedData] = useState<Data | null>(null);
  const [draftData, setDraftData] = useState<Data | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // 用 0ms 的 timer 把 setState 包進 callback——跟 PageLoader.tsx 那次
    // 踩到的 `react-hooks/set-state-in-effect` 是同一條規則、同一種寫法。
    const timer = setTimeout(() => {
      const data = readSavedData(storageKey);
      if (data) setSavedData(data);
    }, 0);
    return () => clearTimeout(timer);
  }, [storageKey]);

  const openEditor = () => {
    setDraftData(savedData ?? legacyArticleToPuckData({ contributor, bodyHtml, attachments, relatedLinks }));
    setIsEditing(true);
  };

  const handlePublish = (data: Data) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // 存不進去（例如無痕模式、storage 被關）就只在這次瀏覽生效，
      // 不要因為存檔失敗就把使用者剛編輯好的內容擋下來不給看。
    }
    setSavedData(data);
    setIsEditing(false);
  };

  return (
    <>
      {savedData ? (
        <Render config={puckConfig} data={savedData} />
      ) : (
        <>
          {contributor && <div className="Contributor">撰稿人 / {contributor}</div>}
          <div className="txt editor mb-md-5 mb-4" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          <div className="dk_conbo mb-md-5 mb-4">
            <LinkListBox icon="bi-file-earmark-arrow-down" title="附件下載" items={attachments} />
            <LinkListBox icon="bi-link-45deg" title="相關連結" items={relatedLinks} />
            <ArticleContactInfo />
          </div>
        </>
      )}

      <button
        type="button"
        onClick={openEditor}
        aria-label="編輯這篇公告內容"
        title="編輯這篇公告內容"
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#2467B2",
          color: "#fff",
          border: "none",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.28)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        <i className="bi bi-pencil-fill" aria-hidden="true" />
      </button>

      {isEditing &&
        draftData &&
        createPortal(
          // 用 portal 直接掛到 <body> 底下，不要當成 InnerPageShell 那整棵
          // page chrome 的後代——Puck 官方 troubleshooting 文件建議「在
          // route 最上層渲染，不要包在 app 的 layout chrome 裡面」，portal
          // 出去是最乾淨的做法，避免 Bootstrap 那堆 grid/flex 容器影響
          // 到 Puck 內部 dnd-kit 的版面量測。
          <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "#fff" }}>
            <Puck
              config={puckConfig}
              data={draftData}
              onPublish={handlePublish}
              overrides={{
                // 一定要把 `children`（Puck 內建的操作區，包含真正的
                // 「Publish」按鈕）原樣渲染出來，這裡只是「多加」一顆
                // 取消按鈕，不是取代掉整排——漏了 `children` 會發生
                // 編輯器打得開、但完全沒有發布按鈕的怪狀況（實測踩過）。
                headerActions: ({ children }) => (
                  <>
                    {children}
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="btn btn-sm btn-outline-secondary"
                      title="取消編輯，不儲存"
                    >
                      取消
                    </button>
                  </>
                ),
              }}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

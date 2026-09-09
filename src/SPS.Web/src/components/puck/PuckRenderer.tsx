"use client";

import { Render, type Data } from '@puckeditor/core';
import { puckConfig } from '@/lib/puck/live-content-config';

interface PuckRendererProps {
  content: string;
}

/**
 * 這支是照抄 SPS.AdminWeb 那份能動的版本，但那邊是後台獨立頁面在用
 * （daisyUI 主題、自己控制整個版面的背景色），照抄過來的三個地方在
 * 這個專案裡都會出問題，已經拿掉：
 *
 * 1. 原本每個回傳都包了一層 `style={{ background: '#ffffff', color:
 *    '#1a1a1a' }}`——這是假設呼叫端外面沒有任何背景色的後台獨立頁。
 *    這個專案是把 Puck 內容塞進舊站既有的容器裡用（例如 FAQ 的
 *    `.qa_right` 本身就有淺藍底色），這層白底黑字會蓋掉外層容器的
 *    底色，變成一塊突兀的白框——就是這裡拿掉的原因，讓內容老實
 *    繼承外層容器的背景/文字顏色，不要自己加一層。
 * 2. `text-base-content/40`／`alert alert-info`／`alert alert-error`
 *    這幾個 class 是 daisyUI 元件，這個專案沒有裝 daisyUI，會整個
 *    沒有任何樣式；`iconify lucide--*` 那幾個 icon span 同樣沒有對應
 *    的 iconify 設定，也不會顯示任何圖示。都換成純文字＋這個專案
 *    既有的 Bootstrap icon（`bi bi-*`）。
 */
export const PuckRenderer = ({ content }: PuckRendererProps) => {
  // Check if content is empty
  if (!content || content.trim() === '') {
    return (
      <div className="text-center py-4">
        <i className="bi bi-file-earmark-text" aria-hidden="true"></i>
        <p className="mb-0">暫無內容</p>
      </div>
    );
  }

  let data: Data | null = null;
  let isLegacyContent = false;

  try {
    const parsed = JSON.parse(content);

    // Validate data structure
    if (parsed.content && Array.isArray(parsed.content)) {
      data = parsed;
    } else {
      // Not a valid Puck JSON structure, treat as legacy content
      isLegacyContent = true;
    }
  } catch {
    // Failed to parse JSON, treat as legacy plain text content
    isLegacyContent = true;
  }

  // Render legacy content (plain text or Markdown)
  if (isLegacyContent) {
    return (
      <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
    );
  }

  // Render Puck content (data is guaranteed to be valid here)
  if (!data) {
    return (
      <p className="mb-0">
        <i className="bi bi-exclamation-circle me-1" aria-hidden="true"></i>
        無法解析內容格式
      </p>
    );
  }

  return <Render config={puckConfig} data={data} />;
};

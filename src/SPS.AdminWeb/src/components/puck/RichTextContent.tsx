/**
 * RichTextContent — 安全渲染富文字
 *
 * - 接收 HTML 字串時，dangerouslySetInnerHTML 渲染
 * - 接收 ReactNode 時（Puck v0.21 richtext 編輯狀態），直接渲染
 * - 接收 null/undefined 時渲染空字串
 * - 向下相容：純文字自動包成 <p> 段落（以 \n\n 分段）
 * - 附帶基本 CSS（列表符號、縮排、段落間距、標題等）
 */

import type { ReactNode } from "react";

interface RichTextContentProps {
  html: string | ReactNode | undefined | null;
  className?: string;
}

export function RichTextContent({ html, className }: RichTextContentProps) {
  // 非字串視為 ReactNode（含 Puck inline edit 模式回傳的可編輯節點），直接包進 div
  if (html != null && typeof html !== "string") {
    return (
      <>
        <div className={`rich-text-content ${className ?? ""}`}>{html}</div>
        <style>{richTextStyles}</style>
      </>
    );
  }

  const safeHtml = toHtml(html);
  return (
    <>
      <div
        className={`rich-text-content ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
      <style>{richTextStyles}</style>
    </>
  );
}

function toHtml(value: string | undefined | null): string {
  if (!value) return "";
  if (/<[a-z][\s\S]*>/i.test(value)) return value;
  return value
    .split(/\n\n+/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const richTextStyles = `
  .rich-text-content p {
    margin-bottom: 0.75em;
  }
  .rich-text-content p:last-child {
    margin-bottom: 0;
  }
  .rich-text-content ul {
    list-style: disc;
    padding-left: 1.5em;
    margin-bottom: 0.75em;
  }
  .rich-text-content ol {
    list-style: decimal;
    padding-left: 1.5em;
    margin-bottom: 0.75em;
  }
  .rich-text-content li {
    margin-bottom: 0.25em;
  }
  .rich-text-content h2 {
    font-size: 1.5em;
    font-weight: 700;
    margin: 0.8em 0 0.4em;
  }
  .rich-text-content h3 {
    font-size: 1.25em;
    font-weight: 600;
    margin: 0.6em 0 0.3em;
  }
  .rich-text-content h4 {
    font-size: 1.1em;
    font-weight: 600;
    margin: 0.5em 0 0.25em;
  }
  .rich-text-content h5 {
    font-size: 1em;
    font-weight: 600;
    margin: 0.4em 0 0.2em;
  }
  .rich-text-content a {
    color: #2563eb;
    text-decoration: underline;
  }
  .rich-text-content s {
    text-decoration: line-through;
  }
`;

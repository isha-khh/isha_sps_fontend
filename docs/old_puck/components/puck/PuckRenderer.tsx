import { Render, type Data } from '@puckeditor/core';
import { puckConfig } from '@/lib/puck/config';

interface PuckRendererProps {
  content: string;
}

export const PuckRenderer = ({ content }: PuckRendererProps) => {
  // Check if content is empty
  if (!content || content.trim() === '') {
    return (
      <div className="text-center py-8 text-base-content/40">
        <span className="iconify lucide--file-text size-12 mb-2" />
        <p>暫無內容</p>
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
  } catch (error) {
    // Failed to parse JSON, treat as legacy plain text content
    isLegacyContent = true;
  }

  // Render legacy content (plain text or Markdown)
  if (isLegacyContent) {
    return (
      <div className="p-6 rounded-lg" style={{ background: '#f8f9fa', color: '#1a1a1a' }}>
        <div className="prose max-w-none">
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
          />
        </div>
        <div className="mt-4 alert alert-info">
          <span className="iconify lucide--info size-4" />
          <div className="text-sm">
            此公告使用舊版格式。編輯後將自動轉換為新版視覺化編輯器格式。
          </div>
        </div>
      </div>
    );
  }

  // Render Puck content (data is guaranteed to be valid here)
  if (!data) {
    return (
      <div className="alert alert-error">
        <span className="iconify lucide--alert-circle size-5" />
        <span>無法解析內容格式</span>
      </div>
    );
  }

  return (
    <div style={{ background: '#ffffff', color: '#1a1a1a' }}>
      <Render config={puckConfig} data={data} />
    </div>
  );
};

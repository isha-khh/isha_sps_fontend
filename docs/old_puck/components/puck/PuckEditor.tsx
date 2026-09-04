import { useEffect, useState } from 'react';
import { Puck, Render, type Data } from '@puckeditor/core';
import "@puckeditor/core/puck.css";
import { puckConfig } from '@/lib/puck/config';

interface PuckEditorProps {
  initialContent?: string;
  onChange: (jsonContent: string) => void;
  onSave?: (jsonContent: string) => void;
}

export const PuckEditor = ({ initialContent, onChange, onSave }: PuckEditorProps) => {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only load initial content once
    if (initialized) return;

    console.log('[PuckEditor] Initializing with content:', initialContent?.substring(0, 100));

    // Parse initial content from JSON string
    let parsedData: Data;

    if (initialContent && initialContent.trim() !== '') {
      try {
        const parsed = JSON.parse(initialContent);

        // Validate if it's a valid Puck data structure
        if (parsed.content && Array.isArray(parsed.content)) {
          parsedData = parsed;
          console.log('[PuckEditor] Loaded valid Puck JSON with', parsed.content.length, 'components');
        } else {
          // Invalid Puck structure, treat as legacy content
          console.warn('Legacy content detected, converting to ArticleContent');
          parsedData = {
            content: [
              {
                type: 'ArticleContent',
                props: {
                  content: initialContent,
                  fontSize: 'normal',
                },
              },
            ],
            root: { props: { title: '' } },
          };
        }
      } catch (error) {
        // Failed to parse JSON, treat as legacy plain text content
        console.warn('Plain text content detected, converting to ArticleContent');
        parsedData = {
          content: [
            {
              type: 'ArticleContent',
              props: {
                content: initialContent,
                fontSize: 'normal',
              },
            },
          ],
          root: { props: { title: '' } },
        };
      }
    } else {
      // Empty content, start with blank editor
      console.log('[PuckEditor] Starting with empty editor');
      parsedData = {
        content: [],
        root: { props: { title: '' } },
      };
    }

    setData(parsedData);
    setLoading(false);
    setInitialized(true);
  }, [initialContent, initialized]);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const handleChange = (newData: Data) => {
    console.log('[PuckEditor] Data changed:', newData);
    setData(newData);
    // Notify parent component of changes
    const jsonContent = JSON.stringify(newData);
    console.log('[PuckEditor] Calling onChange with JSON length:', jsonContent.length);
    onChange(jsonContent);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <>
      {/* 非全螢幕：顯示預覽 + 編輯按鈕 */}
      {!isFullscreen && (
        <div className="border border-base-300 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 bg-base-200 border-b border-base-300">
            <span className="text-sm text-base-content/60">內容預覽</span>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="btn btn-sm btn-neutral gap-2"
            >
              <span className="iconify lucide--expand size-4" />
              全螢幕編輯
            </button>
          </div>
          <div className="p-4 min-h-[200px]" style={{ background: '#ffffff', color: '#1a1a1a' }}>
            {data.content.length > 0 ? (
              <Render config={puckConfig} data={data} />
            ) : (
              <p className="text-sm text-center py-8" style={{ color: '#9ca3af' }}>尚無內容，點擊「全螢幕編輯」開始編輯</p>
            )}
          </div>
        </div>
      )}

      {/* 全螢幕編輯器 */}
      {isFullscreen && (
        <>
          <div className="fixed inset-0 z-[9999] overflow-hidden">
            <Puck
              config={puckConfig}
              data={data}
              onChange={handleChange}
              iframe={{ enabled: false }}
              onPublish={async (publishedData) => {
                if (onSave) {
                  onSave(JSON.stringify(publishedData));
                }
              }}
              overrides={{
                headerActions: () => (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="btn btn-sm btn-ghost gap-2"
                      title="退出全螢幕 (ESC)"
                    >
                      <span className="iconify lucide--minimize size-4" />
                      退出全螢幕
                    </button>
                    <div className="text-sm text-base-content/60 flex items-center px-2">
                      內容會自動儲存，請使用頁面底部的按鈕發布
                    </div>
                  </div>
                ),
              }}
            />
          </div>
          <div className="fixed inset-0 bg-base-300 z-[9998]" aria-hidden="true" />
        </>
      )}
    </>
  );
};

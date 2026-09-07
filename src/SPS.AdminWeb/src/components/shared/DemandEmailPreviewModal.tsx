import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api/system-settings';

interface Props {
  open: boolean;
  onClose: () => void;
  demandName: string;
  demandIntroduction: string;
  tagNames: string[];
}

export const DemandEmailPreviewModal = ({
  open,
  onClose,
  demandName,
  demandIntroduction,
  tagNames,
}: Props) => {
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    setIsLoading(true);
    settingsApi
      .previewEmailTemplate('demand_match_notification', {
        variables: {
          demandName: demandName || '（尚未填寫需求名稱）',
          demandIntroduction: demandIntroduction || '（尚未填寫需求介紹）',
          demandTags: tagNames.length > 0 ? tagNames.join('、') : '（尚未選擇標籤）',
        },
      })
      .then((res) => {
        setSubject(res.subject);
        setHtmlContent(res.htmlContent);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [open, demandName, demandIntroduction, tagNames]);

  if (!open) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="iconify lucide--mail size-5" />
            通知信預覽
          </h3>
          <button type="button" className="btn btn-ghost btn-sm btn-circle" onClick={onClose}>
            <span className="iconify lucide--x size-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-base-200 rounded-lg px-4 py-2 text-sm">
              <span className="text-base-content/60 mr-2">主旨：</span>
              <span className="font-medium">{subject}</span>
            </div>
            <div
              className="border border-base-300 rounded-lg p-4 text-sm overflow-auto max-h-[60vh]"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        )}

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            關閉
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
};

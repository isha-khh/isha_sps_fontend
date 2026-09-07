import { useState } from 'react';
import type { Application } from '@/types/api';

interface ReviewModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  // 更新 onSubmit：接受三個參數，讓我們在內部決定分配
  onSubmit: (approved: boolean, reviewComment?: string, rejectionReason?: string) => Promise<void>;
}

export const ReviewModal = ({ application, isOpen, onClose, onSubmit }: ReviewModalProps) => {
  const [comment, setComment] = useState(''); // 共用同一個輸入狀態
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (approved: boolean) => {
    if (!application) return;

    setIsSubmitting(true);
    try {
      // 重點：根據 approved 布林值，將 comment 內容分配到對應的欄位
      await onSubmit(
        approved,
        approved ? comment : undefined,    // 同意時，comment 視為 reviewComment
        !approved ? comment : undefined    // 否決時，comment 視為 rejectionReason
      );

      setComment('');
      onClose();
    } catch (error) {
      console.error('審核失敗:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !application) return null;

  return (
    <>
      <input
        type="checkbox"
        id="review-modal"
        className="modal-toggle"
        checked={isOpen}
        readOnly
      />
      <div className="modal" role="dialog">
        <div className="modal-box max-w-2xl">
          <h3 className="font-bold text-lg mb-4">審核申請</h3>

          <div className="space-y-4">
            {/* 申請資訊 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">申請編號</span>
                </label>
                <p className="text-sm font-medium">{application.id}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">公司名稱</span>
                </label>
                <p className="text-sm font-medium">{application.companyName}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">聯絡人</span>
                </label>
                <p className="text-sm font-medium">{application.contactPerson}</p>
              </div>
              <div>
                <label className="label">
                  <span className="label-text">聯絡電話</span>
                </label>
                <p className="text-sm font-medium">{application.phone}</p>
              </div>
            </div>

            <div className="divider" />

            {/* 意見 */}
              <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">審核意見 / 否決原因</span>
                <span className="label-text-alt text-base-content/60">必填</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 text-base"
                placeholder="若通過可輸入備註；若退回請務必輸入原因..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
              />
              <label className="label">
                <span className="label-text-alt text-base-content/50">
                  ※ 按下「通過」此內容將存入審核意見，按下「退回」則存入否決原因。
                </span>
              </label>
            </div>
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="button"
              className="btn btn-error"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--x-circle size-4" />
                  退回
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-success"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--check-circle size-4" />
                  通過
                </>
              )}
            </button>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="review-modal" onClick={onClose}>
          Close
        </label>
      </div>
    </>
  );
};

import { useEffect, useState } from 'react';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import { useNotify } from '@/hooks/useNotify';

interface ResendEmailModalProps {
  isOpen: boolean;
  applicationId: string;
  applicationNumber: string;
  /** 申請目前的聯絡信箱（顯示用） */
  currentEmail: string;
  /** 已通過的申請會員帳號已建立，不能在這裡改信箱 */
  canChangeEmail: boolean;
  onClose: () => void;
  /** 補寄成功後呼叫（信箱有更正時，呼叫端要重新載入申請資料） */
  onSent: (emailChanged: boolean) => void;
}

/**
 * 補寄申請通知信。申請人的信箱故障、信被擋或填錯時，申請人就沒辦法拿到申請編號與審核結果，
 * 後台用這裡補寄；信箱填錯的話可以更正後再寄。
 *
 * 為什麼更正信箱只能由後台做、不開放申請人自己輸入新信箱收信：申請編號是時間戳記格式、可以猜，
 * 任何人只要輸入別人的申請編號加上自己的信箱，就能收到對方的審核結果與姓名。
 * 後台人員可以先打電話（申請資料裡有聯絡電話）確認本人再更正。
 *
 * 後端規則：信先寄出去、成功了才會更新信箱；寄不出去資料不會被改。1 分鐘內不能重複補寄；
 * 每次補寄都記在申請日誌。
 */
export const ResendEmailModal = ({
  isOpen,
  applicationId,
  applicationNumber,
  currentEmail,
  canChangeEmail,
  onClose,
  onSent,
}: ResendEmailModalProps) => {
  const notify = useNotify();
  const [changeEmail, setChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setChangeEmail(false);
      setNewEmail('');
    }
  }, [isOpen]);

  const handleSend = async () => {
    const email = newEmail.trim();
    if (changeEmail && !email) {
      await notify.warning('請輸入更正後的電子信箱');
      return;
    }

    setIsSending(true);
    try {
      const result = await adminApplicationsApi.resendNotificationEmail(applicationId, changeEmail ? email : undefined);
      await notify.success(`已補寄通知信至 ${result.sentTo}`);
      onSent(changeEmail);
      onClose();
    } catch (error) {
      const serverMessage = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      await notify.error(serverMessage || '補寄失敗，請稍後再試');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <input type="checkbox" id="resend-email-modal" className="modal-toggle" checked={isOpen} readOnly />
      <div className="modal" role="dialog">
        <div className="modal-box max-w-lg">
          <h3 className="font-bold text-lg mb-4">補寄申請通知信</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-base-content/60">申請編號</p>
              <p className="font-medium">{applicationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-base-content/60">目前聯絡信箱</p>
              <p className="font-medium">{currentEmail || '-'}</p>
            </div>

            <p className="text-sm text-base-content/70">
              依申請目前的狀態補寄對應的信件（待審核／審核中＝申請提交確認，已通過＝通過通知，未通過＝未通過通知與原因），只寄給申請的聯絡人。
            </p>

            {canChangeEmail ? (
              <div className="space-y-2">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={changeEmail}
                    onChange={(e) => setChangeEmail(e.target.checked)}
                  />
                  <span className="label-text">信箱有誤，更正為新信箱後補寄</span>
                </label>
                {changeEmail && (
                  <>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      placeholder="更正後的電子信箱"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      maxLength={320}
                    />
                    <p className="text-xs text-warning">
                      更正前請先撥打申請資料裡的聯絡電話確認是本人。信件寄出成功後，申請的聯絡信箱才會改成新信箱，
                      之後申請人用新信箱＋申請編號查詢進度。
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-xs text-base-content/60">
                已通過的申請已建立會員帳號，信箱無法在這裡更正；如需更改請到「會員管理」修改會員信箱。
              </p>
            )}
          </div>

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSending}>
              取消
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={isSending}>
              {isSending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <>
                  <span className="iconify lucide--mail size-4" />
                  補寄
                </>
              )}
            </button>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="resend-email-modal" onClick={onClose}>
          Close
        </label>
      </div>
    </>
  );
};

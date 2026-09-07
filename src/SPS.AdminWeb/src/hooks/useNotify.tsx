import { useConfirm } from './useConfirm';

/**
 * 簡化的通知對話框 Hook
 * 提供成功、錯誤、警告、提示等預設樣式的對話框
 */
export const useNotify = () => {
  const { confirmDialog, ConfirmComponent } = useConfirm();

  /**
   * 顯示成功通知（非阻塞，不等待使用者點擊確定）
   */
  const success = (message: string, title = '成功') => {
    void confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '確定',
      buttonCancel: undefined,
    });
  };

  /**
   * 顯示錯誤通知（非阻塞，不等待使用者點擊確定）
   */
  const error = (message: string, title = '錯誤') => {
    void confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '確定',
      buttonCancel: undefined,
      confirmStyle: 'bg-error',
    });
  };

  /**
   * 顯示警告通知（非阻塞，不等待使用者點擊確定）
   */
  const warning = (message: string, title = '警告') => {
    void confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '確定',
      buttonCancel: undefined,
      confirmStyle: 'bg-warning',
    });
  };

  /**
   * 顯示提示通知（非阻塞，不等待使用者點擊確定）
   */
  const info = (message: string, title = '提示') => {
    void confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '確定',
      buttonCancel: undefined,
    });
  };

  /**
   * 顯示確認對話框（帶確認/取消按鈕）
   */
  const confirm = async (message: string, title = '確認') => {
    return await confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '確認',
      buttonCancel: '取消',
    });
  };

  /**
   * 顯示刪除確認對話框
   */
  const confirmDelete = async (message: string, title = '確認刪除') => {
    return await confirmDialog({
      cardTitle: title,
      message,
      buttonConfirm: '刪除',
      buttonCancel: '取消',
      confirmStyle: 'bg-error',
    });
  };

  return {
    success,
    error,
    warning,
    info,
    confirm,
    confirmDelete,
    NotifyComponent: ConfirmComponent,
  };
};

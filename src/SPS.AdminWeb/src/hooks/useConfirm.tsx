import React, {type JSX, type ReactNode, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {createPortal} from "react-dom";

/**
 * 確認對話框的選項設定。
 */
interface ConfirmDialogOptions {
  cardTitle?: string;
  message?: string;
  buttonConfirm?: string;
  confirmStyle?: string;
  buttonCancel?: string;
  cancelStyle?: string;
  modalClassName?: string;
  backdropClassName?: string;
  zIndex?: number;
  escapeToClose?: boolean;
  // 🆕 自定義內容組件選項
  customContent?: ReactNode;
  customContentClassName?: string;
  // 🆕 更大的對話框支援
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  // 無障礙性選項
  ariaLabel?: string;
  ariaDescribedBy?: string;
  confirmButtonAriaLabel?: string;
  cancelButtonAriaLabel?: string;
}

/**
 * useConfirm hook 的回傳型別定義。
 */
interface UseConfirmReturn {
  confirmDialog: (opts?: ConfirmDialogOptions) => Promise<boolean>;
  ConfirmComponent: JSX.Element | null;
}

/**
 * Enhanced useConfirm 自訂 Hook
 * 支援自定義內容組件，特別適用於預覽資料的確認對話框
 */
export const useConfirm = (): UseConfirmReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmDialogOptions>({});
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 生成唯一 ID 供 ARIA 標籤使用
  const dialogId = useRef(`confirm-dialog-${Math.random().toString(36).substr(2, 9)}`);
  const titleId = useRef(`${dialogId.current}-title`);
  const messageId = useRef(`${dialogId.current}-message`);
  const contentId = useRef(`${dialogId.current}-content`);

  /**
   * 觸發確認對話框，並以 Promise 形式回傳使用者的選擇。
   */
  const confirmDialog = useCallback((opts: ConfirmDialogOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        cardTitle: "確認",
        message: "確定要執行此操作嗎？",
        escapeToClose: true,
        buttonConfirm: "確認",
        buttonCancel: "取消",
        size: 'md',
        ...opts
      });
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  /**
   * 關閉對話框的通用方法
   */
  const closeDialog = useCallback((result: boolean) => {
    setIsVisible(false);
    // 等待動畫完成後再移除元件
    setTimeout(() => {
      setIsOpen(false);
      resolveRef.current?.(result);
    }, 200);
  }, []);

  /**
   * 處理使用者確認操作。
   */
  const handleConfirm = useCallback(() => {
    closeDialog(true);
  }, [closeDialog]);

  /**
   * 處理使用者取消操作。
   */
  const handleCancel = useCallback(() => {
    closeDialog(false);
  }, [closeDialog]);

  /**
   * 獲取對話框內所有可聚焦的元素
   */
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(dialogRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  /**
   * 處理 Tab 鍵循環聚焦
   */
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement as HTMLElement;

    if (event.shiftKey) {
      if (activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, [getFocusableElements]);

  /**
   * 設定初始焦點
   */
  const setInitialFocus = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      const cancelButton = focusableElements.find(el =>
        el.textContent?.includes(options.buttonCancel || "取消")
      );
      const targetElement = cancelButton || focusableElements[0];
      targetElement.focus();
    }
  }, [getFocusableElements, options.buttonCancel]);

  /**
   * 處理動畫效果的 useEffect
   */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  /**
   * 處理背景點擊事件
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeDialog(false);
    }
  }, [closeDialog]);

  /**
   * 處理鍵盤事件、scroll lock 與 focus 管理
   *
   * 注意：依賴陣列只能放 isOpen，不能放 isVisible。
   * isVisible 會在開啟動畫（10ms 後）與關閉動畫（200ms 後)各觸發一次變化，
   * 若把它也放進依賴，effect 在 isOpen 真正變回 false 之前就會因 isVisible
   * 變化而重新執行一次：那一次重跑時，React 呼叫的是「上一次（isOpen 仍為
   * true 時）」留下的 cleanup（只清了 timeout，沒有重置 overflow），而這次
   * effect body 因為 isOpen 已是 false，只會把重置 overflow 的程式碼包成
   * closure「回傳」、不會立即執行——要等到下一次 effect 重跑（也就是下次再
   * 開一個 dialog）才會被呼叫，導致 dialog 關閉後 body 的 overflow:hidden
   * 卡住，頁面捲軸消失。
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          if (options.escapeToClose !== false) {
            e.preventDefault();
            closeDialog(false);
          }
          break;
        case 'Tab':
          handleTabKey(e);
          break;
        case 'Enter':
          if (e.target instanceof HTMLButtonElement) {
            return;
          }
          e.preventDefault();
          handleConfirm();
          break;
      }
    };

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    const mainContent = document.querySelector('main, #root, #app, body > div:first-child');
    if (mainContent) {
      mainContent.setAttribute('aria-hidden', 'true');
    }

    const timeoutId = setTimeout(() => {
      setInitialFocus();
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';

      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }

      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [isOpen, closeDialog, handleTabKey, setInitialFocus, options.escapeToClose, handleConfirm]);

  /**
   * 根據 size 獲取對話框樣式
   */
  const getModalSizeClasses = useCallback((size: string = 'md') => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-7xl w-full mx-4'
    };
    return sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;
  }, []);

  /**
   * 回傳用於渲染確認對話框的組件。
   */
  const ConfirmComponent = useMemo(() => {
    if (!isOpen) return null;

    const hasConfirmButton = options.buttonConfirm !== undefined;
    const hasCancelButton = options.buttonCancel !== undefined;
    const hasCustomContent = options.customContent !== undefined;

    // 動態構建樣式
    const backdropClasses = [
      'fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 p-4',
      options.backdropClassName || '',
      isVisible ? 'opacity-100' : 'opacity-0'
    ].join(' ');

    const modalClasses = [
      'card bg-base-100 border border-gray-200 shadow-2xl transform transition-all duration-200',
      getModalSizeClasses(options.size),
      options.modalClassName || '',
      isVisible
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-8 opacity-0 scale-95'
    ].join(' ');

    // 動態設置 z-index
    const backdropStyle = options.zIndex ? { zIndex: options.zIndex } : { zIndex: 9999 };

    // 構建 ARIA 屬性
    const ariaLabelledBy = options.cardTitle ? titleId.current : undefined;
    const ariaDescribedBy = [
      options.message ? messageId.current : '',
      hasCustomContent ? contentId.current : '',
      options.ariaDescribedBy || ''
    ].filter(Boolean).join(' ') || undefined;

    const dialogContent = (
      <div
        className={backdropClasses}
        style={backdropStyle}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-label={options.ariaLabel || (options.cardTitle ? undefined : "確認對話框")}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-live="polite"
      >
        <div
          ref={dialogRef}
          className={modalClasses}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          <div className="card-body p-6">
            {/* 標題 */}
            {options.cardTitle && (
              <h2
                id={titleId.current}
                className="text-xl font-semibold mb-4 text-base-content"
                role="heading"
                aria-level={1}
              >
                {options.cardTitle}
              </h2>
            )}

            {/* 訊息內容 */}
            {options.message && (
              <div
                id={messageId.current}
                className="text-base-content mb-4"
                role="region"
                aria-label="對話框內容"
              >
                {options.message.split('\n').map((line, index, array) => (
                  <span key={index}>
                    {line}
                    {index < array.length - 1 && <br />}
                  </span>
                ))}
              </div>
            )}

            {/* 🆕 自定義內容區域 */}
            {hasCustomContent && (
              <div
                id={contentId.current}
                className={`mb-6 ${options.customContentClassName || ''}`}
                role="region"
                aria-label="詳細內容"
              >
                {options.customContent}
              </div>
            )}

            {/* 按鈕區域 */}
            {(hasConfirmButton || hasCancelButton) && (
              <div
                className="flex gap-3 justify-end pt-4 border-t border-base-300"
                role="group"
                aria-label="對話框操作按鈕"
              >
                {hasCancelButton && (
                  <button
                    onClick={handleCancel}
                    className={`px-6 py-2 rounded-md hover:opacity-80 transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                      options.cancelStyle || 'bg-secondary text-secondary-content'
                    }`}
                    type="button"
                    aria-label={options.cancelButtonAriaLabel || `取消操作：${options.cardTitle || '確認對話框'}`}
                    aria-describedby={options.message ? messageId.current : undefined}
                  >
                    {options.buttonCancel}
                  </button>
                )}

                {hasConfirmButton && (
                  <button
                    onClick={handleConfirm}
                    className={`px-6 py-2 text-white rounded-md hover:opacity-80 transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                      options.confirmStyle || 'bg-primary'
                    }`}
                    type="button"
                    aria-label={options.confirmButtonAriaLabel || `確認操作：${options.cardTitle || '確認對話框'}`}
                    aria-describedby={options.message ? messageId.current : undefined}
                    autoFocus={false}
                  >
                    {options.buttonConfirm}
                  </button>
                )}
              </div>
            )}

            {/* 隱藏的說明文字供螢幕閱讀器使用 */}
            <div className="sr-only" aria-live="polite">
              對話框已開啟。使用 Tab 鍵在按鈕間移動，Enter 鍵確認選擇，Escape 鍵關閉對話框。
            </div>
          </div>
        </div>
      </div>
    );

    return createPortal(dialogContent, document.body);
  }, [isOpen, isVisible, options, handleConfirm, handleCancel, handleBackdropClick, getModalSizeClasses]);

  return { confirmDialog, ConfirmComponent };
};

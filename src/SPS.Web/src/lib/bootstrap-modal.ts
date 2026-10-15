/**
 * 用整站已載入的 bootstrap.bundle（`window.bootstrap`）程式化地開關 modal——表單彈窗送出成功後要把
 * 表單關掉（防止重複送出），再開一個醒目的結果視窗。bootstrap 的 modal 不能疊著開，所以要等前一個
 * 完全關閉（`hidden.bs.modal`）才開下一個。
 *
 * 找不到 bootstrap 或元素時回傳 false，呼叫端要自己備一份行內訊息當退路。
 */
interface BootstrapModalInstance {
  show(): void;
  hide(): void;
}
interface BootstrapGlobal {
  Modal: {
    getInstance(el: Element): BootstrapModalInstance | null;
    getOrCreateInstance(el: Element): BootstrapModalInstance;
  };
}

function bootstrapGlobal(): BootstrapGlobal | null {
  return (window as unknown as { bootstrap?: BootstrapGlobal }).bootstrap ?? null;
}

/** 關掉 `fromId`，關完後開 `toId`。成功啟動回傳 true。 */
export function swapModal(fromId: string, toId: string): boolean {
  const bs = bootstrapGlobal();
  const from = document.getElementById(fromId);
  const to = document.getElementById(toId);
  if (!bs || !from || !to) return false;

  const show = () => bs.Modal.getOrCreateInstance(to).show();
  const instance = bs.Modal.getInstance(from);
  if (!instance || !from.classList.contains("show")) {
    show();
    return true;
  }
  from.addEventListener("hidden.bs.modal", show, { once: true });
  instance.hide();
  return true;
}

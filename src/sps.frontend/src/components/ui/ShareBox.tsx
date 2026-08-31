"use client";

/**
 * 積木元件：文章分享列，對應舊站 page/_uc/Sharebox.html。
 *
 * 舊站這裡是獨立寫了一份 shareToFB/shareToLine/shareToThreads，
 * 跟 coreScript.js 裡另一個通用的 `shareTo(target, url)` 函式部分重複
 * ——這裡直接用乾淨的 React 事件處理重寫一次，不依賴任何全域函式，
 * 兩份重複邏輯只留這一份。
 */
export default function ShareBox() {
  function openPopup(url: string) {
    window.open(url, "_blank", "width=600,height=500,scrollbars=yes,resizable=yes");
  }

  function shareToFB() {
    openPopup(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`);
  }

  function shareToLine() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(document.title);
    openPopup(`https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`);
  }

  function shareToThreads() {
    const text = encodeURIComponent(`${document.title} ${window.location.href}`);
    openPopup(`https://threads.net/intent/post?text=${text}`);
  }

  return (
    <div className="share">
      <ul className="nav">
        <li>分享</li>

        <li>
          <a
            href="#"
            title="分享到 Facebook"
            onClick={(event) => {
              event.preventDefault();
              shareToFB();
            }}
          >
            <img className="img-fluid d-block" src="/images/all/share_fb.svg" alt="Facebook" />
          </a>
        </li>

        <li>
          <a
            href="#"
            title="分享到 LINE"
            onClick={(event) => {
              event.preventDefault();
              shareToLine();
            }}
          >
            <img className="img-fluid d-block" src="/images/all/share_line.svg" alt="LINE" />
          </a>
        </li>

        <li>
          <a
            href="#"
            title="分享到 Threads"
            onClick={(event) => {
              event.preventDefault();
              shareToThreads();
            }}
          >
            <img className="img-fluid d-block" src="/images/all/share_th.svg" alt="Threads" />
          </a>
        </li>
      </ul>
    </div>
  );
}

export interface AttachmentLink {
  name: string;
  href: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  addressMapUrl?: string;
}

/**
 * 積木元件：詳情頁常見的「附件下載／相關連結／聯繫人資訊」三小塊，
 * 對應 page/news/_uc/dot.html／link.html／cont.html（三個獨立的
 * jQuery load 掛載點，內容形狀都一樣，這裡合併成一顆元件，各區塊
 * 沒給資料就不渲染）。
 *
 * `/news` 詳情頁沒有用這個——真後端的 `News` entity 沒有附件/相關
 * 連結/聯繫人這幾個欄位，接了真資料反而顯示不出來，`news/[id]/
 * page.tsx` 的註解裡有記錄這件事，故意拿掉了。`/talent`、`/tutoring`
 * 目前還是純假資料頁面，先照設計稿補上。
 */
export default function AttachmentsPanel({
  attachments,
  relatedLinks,
  contact,
}: {
  attachments?: AttachmentLink[];
  relatedLinks?: AttachmentLink[];
  contact?: ContactInfo;
}) {
  return (
    <>
      {attachments && attachments.length > 0 && (
        <div className="dow_t">
          <div className="dow-name">
            <i className="bi bi-file-earmark-arrow-down me-1" />
            <span>附件下載</span>
          </div>
          <ul className="nav d-block">
            {attachments.map((file) => (
              <li key={file.name}>
                <a href={file.href} title={`${file.name}（另開視窗）`} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-caret-right-fill me-1" />
                  {file.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {relatedLinks && relatedLinks.length > 0 && (
        <div className="dow_t">
          <div className="dow-name">
            <i className="bi bi-link-45deg me-1" />
            <span>相關連結</span>
          </div>
          <ul className="nav d-block">
            {relatedLinks.map((link) => (
              <li key={link.name}>
                <a href={link.href} title={`${link.name}（另開視窗）`} target="_blank" rel="noopener noreferrer">
                  <i className="bi bi-caret-right-fill me-1" />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {contact && (contact.phone || contact.email || contact.address) && (
        <div className="dow_t">
          <div className="dow-name">
            <i className="bi bi-person-vcard me-2" />
            <span>聯繫人資訊</span>
          </div>

          <div className="dow_box">
            <ul className="nav d-block">
              {contact.phone && (
                <li>
                  <span className="label">
                    <i className="bi bi-telephone me-1" />
                    電話：
                  </span>
                  <a href={`tel:${contact.phone}`} title={`撥打電話至 ${contact.phone}`}>
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li>
                  <span className="label">
                    <i className="bi bi-envelope me-1" />
                    信箱：
                  </span>
                  <a href={`mailto:${contact.email}`} title={`寄信至 ${contact.email}`}>
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li>
                  <span className="label">
                    <i className="bi bi-geo-alt me-1" />
                    地址：
                  </span>
                  {contact.addressMapUrl ? (
                    <a href={contact.addressMapUrl} target="_blank" rel="noopener noreferrer" title="開啟 Google 地圖查看地址（另開新視窗）">
                      {contact.address}
                    </a>
                  ) : (
                    contact.address
                  )}
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

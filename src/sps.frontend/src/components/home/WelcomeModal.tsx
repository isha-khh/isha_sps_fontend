import Lightbox from "@/components/ui/Lightbox";

/**
 * 過渡期元件：原本是 index.html 裡的 #welcome-modal + 進站彈跳公告。
 * 實際的 fancybox 呼叫邏輯搬到通用積木 [ui/Lightbox.tsx](../ui/Lightbox.tsx)
 * 了，這裡只剩下「首頁要彈什麼內容」。
 */
export default function WelcomeModal() {
  return (
    <Lightbox id="welcome-modal" autoOpen>
      <div style={{ width: "100%" }}>
        <img
          className="img-fluid d-block"
          src="/images/home/ser_bg.jpg"
          alt="活動公告"
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
    </Lightbox>
  );
}

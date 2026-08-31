import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";

/**
 * 過渡期元件：內容照抄 index.html 裡首頁「智慧工安技術 產業資訊暨媒合平台」
 * 介紹區塊（原本是直接寫在首頁裡，不是 ajax load 進來的片段）。
 */
export default function HomeAbout() {
  return (
    <div className="home_about d-flex">
      <div className="tit_left">
        <SectionTitle eyebrow="Platform">
          智慧工安技術<span>產業資訊暨媒合平台</span>
        </SectionTitle>
        <p className="desc">
          以智慧科技（5G、AIoT）為核心，促進製造業產業升級轉型，
          實現安全管理精進與創新應用落地。媒合平台作為技術供應與
          需求的橋樑，支持企業形成在地供應鏈。
        </p>

        <MoreLink href="#" label="查看看多" title="前往查看看多" />
      </div>

      <div className="tit_right">
        <div className="d-flex">
          <div className="fade-box" data-aos="fade-left" data-aos-delay="100">
            <span>01</span>
            <p>技術供需精準媒合，縮短落地周期</p>
          </div>

          <div className="fade-box" data-aos="fade-left" data-aos-delay="200">
            <span>02</span>
            <p>推動南北平衡與，數位經濟發展</p>
          </div>

          <div className="fade-box" data-aos="fade-left" data-aos-delay="300">
            <span>03</span>
            <p>整合政府補助資源，降低導入成本</p>
          </div>

          <div className="fade-box" data-aos="fade-left" data-aos-delay="400">
            <span>04</span>
            <p>建構在地產業，供應鏈生態系</p>
          </div>
        </div>
      </div>

      <div className="round_1">
        <img className="img-fluid d-block" src="/images/home/round_1.jpg" alt="" />
      </div>
    </div>
  );
}

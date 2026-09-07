import BodyClass from "@/components/BodyClass";
import Headers from "@/components/layout/Headers";
import Footer from "@/components/layout/Footer";
import CategorySidebar from "@/components/layout/CategorySidebar";
import PageLoader from "@/components/layout/PageLoader";
import Banner from "@/components/home/Banner";
import HomeAbout from "@/components/home/HomeAbout";
import HomeNews from "@/components/home/HomeNews";
import HomeService from "@/components/home/HomeService";
import HomeIndustry from "@/components/home/HomeIndustry";
import HomeEnterprise from "@/components/home/HomeEnterprise";
import HomeVideo from "@/components/home/HomeVideo";
import WelcomeModal from "@/components/home/WelcomeModal";

/**
 * 首頁——所有區塊都已經轉成 React 元件：載入動畫、進站彈跳公告、
 * Header／主導覽、首頁 Banner、平台介紹（home_about）、最新消息
 * （home_news）、服務專區（home_service）、產業案例（home_industry）、
 * 企業刊登（home_enterprise）、影音專區（home_video）、Footer。
 *
 * 假資料之後會換成真的 API／CMS 資料，各元件的資料形狀（interface）
 * 就是預留的欄位規格。
 */
export default function HomePage() {
  return (
    <>
      <BodyClass className="home" />
      <PageLoader />
      <WelcomeModal />

      <a href="#main-content" className="visually-hidden-focusable">
        跳至主要內容
      </a>

      <div className="page_wrapper">
        <Headers />

        <Banner />

        <main className="main" id="main-content" role="main">
          <a href="#main-block" id="main-block" accessKey="C" title="中央主要內容區塊" className="visually-hidden-focusable">
            ::: 主要內容區塊
          </a>

          <div className="container-fluid px-0">
            <div className="row gx-0 gy-4">
              {/* 首頁目前沒有分類可選，整塊隱藏（沿用舊站 d-none） */}
              <CategorySidebar hidden />

              <div className="content">
                <div className="home_City">
                  <div className="City_bg01" aria-hidden="true" data-aos="fade-up">
                    <img className="img-fluid d-block" src="/images/home/City_bg01.jpg" alt="" />
                  </div>
                </div>

                <div className="block_box e">
                  <HomeAbout />

                  <HomeNews />

                  <HomeService />
                </div>

                <HomeIndustry />

                <div className="block_box">
                  <HomeEnterprise />
                </div>

                <div className="home_video">
                  <HomeVideo />
                </div>
              </div>
            </div>
          </div>
        </main>

        <a href="#footer-block" id="footer-block" accessKey="B" title="下方功能區塊" className="visually-hidden-focusable" tabIndex={0}>
          ::: 下方功能區塊
        </a>
        <Footer />
      </div>
    </>
  );
}

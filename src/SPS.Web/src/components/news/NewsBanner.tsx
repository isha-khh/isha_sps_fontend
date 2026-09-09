import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

interface NewsBannerSlide {
  href: string;
  title: string;
  image: string;
}

const SLIDES: NewsBannerSlide[] = [
  { href: "#", title: "石化產業智慧轉型——從數據到決策", image: "/images/banner/b1.jpg" },
  { href: "#", title: "AI 智慧安全帽偵測系統導入石化廠", image: "/images/banner/b1.jpg" },
  { href: "#", title: "ESG 永續發展實務：石化廠的碳盤查經驗分享", image: "/images/banner/b1.jpg" },
];

const CAROUSEL_ID = "news-banner";

/**
 * 積木元件：公告事項列表頁最上方那條輪播看板，對應舊站
 * page/_uc/banner.html（`.banner_section` + `.wid-banner-news`）——
 * 只有 `/news` 列表頁有這塊，`/serve` 沒有（那邊的 `.banner` 沒被
 * 用到，側欄廣告是另一支 `.side2_banner`，見 SidebarBanner.tsx）。
 *
 * 跟首頁 HomeVideo 用的是同一組 Carousel／CarouselControls 積木，
 * 只是 `centerPadding`／`slidesToShow` 這些選項照舊站這裡的設定
 * （單張置中、大留白），不是複製 HomeVideo 的三張並排設定。
 */
export default function NewsBanner() {
  return (
    <div className="banner_section">
      <Carousel
        id={CAROUSEL_ID}
        className="wid-banner-news"
        options={{
          centerMode: true,
          centerPadding: "180px",
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          infinite: true,
          dots: true,
          accessibility: true,
          pauseOnHover: true,
          pauseOnFocus: true,
          responsive: [
            { breakpoint: 992, settings: { centerPadding: "60px" } },
            { breakpoint: 768, settings: { centerPadding: "0" } },
          ],
        }}
        slides={SLIDES.map((slide) => (
          <a href={slide.href} className="video-card" title={`${slide.title}（另開視窗）`} target="_blank" rel="noopener noreferrer" key={slide.title}>
            {/*
              寬高比先卡住（圖片實際尺寸 1400x500），不要等圖片真的載入完成
              才決定 .pic 的高度：banner 圖用一般 <img> 沒有另外設定
              width/height，瀏覽器在圖片下載完成前不知道要留多高空間，
              `.banner_section` 會整個塌到只剩文字高度，這時候
              `.slick-play-pause-btn`／`.slick-dots` 是用百分比
              （`bottom: -7%` 等）算相對於 `.banner_section` 目前高度的
              位置，塌陷的當下就會算出很小的偏移量，讓按鈕跟頁碼點點
              整組貼在跑馬燈標題正下方；等圖片載入完成、容器長高之後
              才「跳」到設計稿原本的位置（貼齊圖片右下角）——使用者
              截圖抓到的正是這個瞬間。加上跟圖片實際比例一致的
              aspect-ratio，讓容器從第一次畫面就撐好正確高度，按鈕就
              一直待在原本的位置，不會有載入瞬間的跳動。
            */}
            <div className="pic" style={{ aspectRatio: "1400 / 500" }}>
              <img className="img-fluid d-block" src={slide.image} alt={slide.title} />
            </div>
          </a>
        ))}
      />

      <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則" nextLabel="下一則" />

      <style>{`
        /*
         * public/css/style.css 的 '.banner_section .slick-play-pause-btn:hover'
         * 跟 '.custom-prev:hover'／'.custom-next:hover' 共用同一條規則，
         * 一起套用 'transform: translateY(-50%)'——這個 transform 對
         * prev/next 是對的（它們用 'top: 50%' 定位，translateY(-50%)
         * 是垂直置中，hover 時其實沒有真的移動，只是重複宣告一次自己
         * 本來就有的 transform）。但播放/暫停鈕是用 'bottom: -7%'
         * 定位，本來就沒有 'top: 50%'，套用同一個 translateY(-50%) 會
         * 讓按鈕在 hover 的當下整個往上跳半個按鈕高度（42px 的按鈕跳
         * 約 21px）。這個規則舊站本身就有（repo 根目錄 css/style.css
         * 一樣），不是這次改版造成的。
         *
         * 這裡改成跟全站其他同款圓形按鈕一致的 'translateY(-3px)'
         * 輕微上浮（style.css:4556 那條全站通用規則本來就是這樣
         * 設計，只是被 .banner_section 這裡範圍更精準的規則蓋掉了）。
         * 沒有直接改 public/css/style.css：那支是跟著舊站同步過來的
         * 檔案，下次再同步舊站 CSS 更新時，手動改的東西會被整份覆蓋
         * 掉，所以在這個元件自己的 scoped style 裡蓋過去。
         *
         * 【曾經在這裡拿掉過 hover 位移，後來又加回來】一度以為
         * 「hover 時位移」本身就有風險——游標剛好停在按鈕邊緣時，
         * 位移可能讓游標落到按鈕外，觸發 mouseleave → 按鈕移回原位 →
         * 游標又回到按鈕上 → 再次觸發 hover，來回抖動——因此整個拿掉
         * 位移，改成只留 opacity 當視覺回饋。但後來實測抓到「點不到」
         * 真正的原因其實是下面那條 z-index 規則要處理的疊層問題（按鈕
         * 被 .breadcrumb 蓋住，跟這顆按鈕會不會 hover 位移完全無關），
         * z-index 修好之後，不管按鈕在不在 hover 狀態都能正確蓋過
         * breadcrumb，也就不需要用「拿掉 hover 位移」來規避那個問題
         * 了，所以把 -3px 這個跟全站一致的效果加回來。
         */
        .banner_section .slick-play-pause-btn:focus,
        .banner_section .slick-play-pause-btn:hover {
          transform: translateY(-3px);
        }

        /*
         * 真正點不到的原因跟上面的 hover 位移是兩回事：這顆按鈕用
         * 'bottom: -7%' 刻意讓自己戳出 banner_section 的下邊界（設計
         * 就是要讓它懸在輪播圖片右下角、壓在下一個區塊一點點），結果
         * 戳出去的範圍剛好跟下面的 InnerPageShell '.breadcrumb'
         * （首頁 > 公告事項那條）重疊到了——實測 '.breadcrumb' 也是
         * z-index: 10，跟這顆按鈕的 z-index: 10 打平，兩個 z-index
         * 打平時看 DOM 順序，'.breadcrumb' 在按鈕後面，後面的贏，
         * 所以整個蓋在按鈕上面，點下去點到的其實是 breadcrumb（用
         * document.elementFromPoint() 量按鈕中心點實測證實過），不是
         * 按鈕本身沒有反應。把按鈕的 z-index 拉高過 breadcrumb 就好，
         * 不用去動 InnerPageShell 那邊（breadcrumb 的 z-index 是共用
         * 元件，可能還有其他頁面靠它疊在別的東西上面，不確定改了會
         * 不會連動出其他問題，這裡只調範圍明確、只影響這顆按鈕的
         * 規則）。
         */
        .banner_section .slick-play-pause-btn {
          z-index: 11;
        }

        /*
         * 按鈕整組（上一則/下一則/暫停播放）比參考頁「原版」低了約
         * 26px，實測（getBoundingClientRect + getComputedStyle，並且
         * 直接看了參考頁 https://demo2.eztrust.tw/isha/page/news/
         * index.html 的真實 DOM）抓到原因：
         *
         * 參考頁（舊站）的 .banner_section 底下沒有任何包裝元素，
         * custom-prev／custom-next／slick-play-pause-btn 是直接跟
         * .slider 平行的手足，各自 position: absolute，乾淨俐落。
         * 這裡的 CarouselControls 為了在別的頁面（HomeVideo／
         * HomeService…）重複使用，多包了一層 .custom_box（見
         * CarouselControls.tsx）。.custom_box 本身視覺上是 0 高度
         * （裡面三顆按鈕全部各自 position: absolute，抽離版面），但它
         * 仍是 .slider 後面一個「正常流」的手足元素——而 .slider 全站
         * 共用一條 margin-bottom: 30px（給一般輪播下方的頁碼點點留白
         * 用）。這 30px margin 因此不會直接貫穿 .banner_section（它沒有
         * border/padding 擋著），而是卡在 .slider 跟 .custom_box 這兩個
         * 手足之間變成真的間隔，把 .custom_box 的頂邊往下推了 30px，
         * 連帶讓 .banner_section 自己的 auto 高度也跟著多了這 30px。而
         * .slick-play-pause-btn 的 bottom: -7% 是相對 .banner_section
         * 這個高度算的，容器平白多長高 30px，按鈕就跟著往下多戳出一截。
         *
         * 【踩過的坑】一開始想直接給 .custom_box 補 position: absolute
         * （跟首頁那幾處一樣）—— 高度膨脹確實消失了，但這樣一來
         * .custom_box 自己變成一個新的「已定位祖先」，裡面的按鈕從此
         * 改成相對 .custom_box（幾乎 0 高度）算百分比，而不是原本的
         * .banner_section，結果 bottom: -7% 算出來的位移小到按鈕整個
         * 貼到圖片邊緣，比參考頁還要偏上，等於用錯的方式解決問題。
         *
         * 改成只讓 .slider 在這裡不要吃那條全站共用的 30px 下邊界
         * margin：.custom_box 維持 position: static，不介入子層百分比
         * 位置的計算基準（維持跟舊站一致，算相對 .banner_section），
         * 但因為 margin 是 0，也就不會再卡出實際間隔，.banner_section
         * 的高度會跟圖片本身一樣高，跟參考頁的行為一致。
         */
        .banner_section .slider {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}

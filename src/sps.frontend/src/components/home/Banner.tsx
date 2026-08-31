/**
 * 過渡期元件：內容照抄舊站的 page/_uc/banner_home.html。
 */
export default function Banner() {
  return (
    <div className="banner_home" aria-label="輪播廣告看板">
      <div className="container-fluid p-0">
        <div>
          <div className="item">
            <div data-aos="fade-up">
              <h2 data-text="數位賦能 轉型落地" aria-label="數位賦能 轉型落地">
                數位賦能 轉型落地
              </h2>
              <h3>打造產業工安新標竿</h3>
              <p>
                集結跨產業亮點技術與年度資源，提供企業精準的對接引導，
                <span>讓智慧化職安防護不再是門檻，而是永續競爭力。</span>
              </p>

              <ul className="nav" role="list" aria-label="行動按鈕選單">
                <li className="b1">
                  <a href="#" title="前往申請會員頁面">
                    <span>申請會員</span>
                    <i className="bi bi-arrow-right" aria-hidden="true"></i>
                  </a>
                </li>
                <li className="b2">
                  <a href="#" title="前往我要媒合頁面">
                    <span>我要媒合</span>
                    <i className="bi bi-arrow-right" aria-hidden="true"></i>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pic">
            <div className="pic_box">
              <div className="Light_1" aria-hidden="true">
                <img className="img-fluid d-block" src="/images/banner/banner_Light.png" alt="" />
              </div>
              <div className="Light_2" aria-hidden="true">
                <img className="img-fluid d-block" src="/images/banner/banner_Light.png" alt="" />
              </div>
              <div className="Light_3" aria-hidden="true">
                <img className="img-fluid d-block" src="/images/banner/banner_Light.png" alt="" />
              </div>

              <img
                className="img-fluid d-block"
                src="/images/banner/banner_bg.jpg"
                alt="智慧化職安防護與產業數位轉型主視覺"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

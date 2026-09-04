import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";

export const metadata: Metadata = {
  title: "會員註冊",
};

/**
 * 會員註冊 Step 1「使用條款」，對應舊站 page/member/register.html。
 *
 * 這是註冊 4 步驟流程（使用條款→帳號設定→填寫資料→完成註冊）的第一
 * 步，`StepProgress` 顯示目前進度。內容是個資蒐集告知事項＋兩個同意
 * 勾選框，兩個勾選框目前沒有做「未勾選就不能下一步」的驗證——跟其他
 * 會員頁一樣先做靜態版本，範圍確認後再補。
 *
 * 「不同意，回首頁」對應舊站連去首頁；「同意，下一步」連去 Step 2
 * （`/member/register/account`，對應舊站 p01.html）。
 */
export default function MemberRegisterPage() {
  return (
    <>
      <BodyClass className="member register" />
      <InnerPageShell title="會員註冊" breadcrumb={[{ label: "會員註冊" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={1} />

          <h3>蒐集個人資料告知事項</h3>
          <div className="txt editor mb-md-5 mb-4">
            <p className="mt-2 mb-4">經濟部產業發展署(以下簡稱本署)為遵守個人資料保護法規定，在您提供個人資料予本署前，依法告知下列事項：</p>
            <div className="blue_rou">
              <ul className="nav d-block">
                <li className="d-flex mb-2">
                  <label>1</label>
                  <span>經濟部(以下簡稱本部)因工業行政而獲取您下列個人資料類別：姓名及連絡方式(包括但不限於電話號碼、E-MAIL、居住或工作地址)等，或其他得以直接或間接識別您個人之資料。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>2</label>
                  <span>本部將依個人資料保護法及相關法令之規定下，依本部隱私權保護政策，蒐集、處理及利用您的個人資料。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>3</label>
                  <span>本部將蒐集目的之存續期間合理利用您的個人資料。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>4</label>
                  <span>除蒐集之目的涉及國際業務或活動外，本部僅於中華民國領域內利用您的個人資料。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>5</label>
                  <span>本部將於原蒐集之特定目的、本次以外之產業之推廣、宣導及輔導、以及其他公務機關請求行政協助之目的範圍內，合理利用您的個人資料。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>6</label>
                  <div>
                    <p className="mb-3">您可依個人資料保護法第3條規定，就您的個人資料向本部行使之下列權利：</p>
                    <ul className="nav d-block">
                      <li>① 查詢或請求閱覽。</li>
                      <li>② 請求製給複製本。</li>
                      <li>③ 請求補充或更正。</li>
                      <li>④ 請求停止蒐集、處理及利用。</li>
                      <li>⑤ 請求刪除。</li>
                    </ul>
                    <p className="mt-3">您因行使上述權利而導致對您的權益產生減損時，本部不負相關賠償責任，另依個人資料保護法第14條規定，本部得酌收行政作業費用。</p>
                  </div>
                </li>
                <li className="d-flex mb-2">
                  <label>7</label>
                  <span>若您未提供正確之個人資料，本部將無法為您提供特定目的之相關業務。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>8</label>
                  <span>本部因業務需要而委託其他機關處理您的個人資料時，將會善盡監督之責。</span>
                </li>
                <li className="d-flex mb-2">
                  <label>9</label>
                  <span>您瞭解此一同意書符合個人資料保護法及相關法規之要求，且同意本部留存此同意書，供日後取出查驗。</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="peer_box">
            <div className="mb-3">
              <p>
                <i className="bi bi-exclamation-circle-fill me-1"></i>請確認您已詳閱並同意以下事項
              </p>
            </div>

            <div className="peer d-flex mb-3">
              <label className="relative">
                <input type="checkbox" aria-label="同意已充分知悉告知事項" title="本人已充分知悉貴署上述告知事項" className="form-check-input peer me-1" />
              </label>
              <span>本人已充分知悉貴署上述告知事項。</span>
            </div>

            <div className="peer d-flex">
              <label className="relative">
                <input type="checkbox" aria-label="同意個人資料蒐集處理利用" title="本人同意貴署蒐集、處理、利用本人之個人資料" className="form-check-input peer me-1" />
              </label>
              <span>本人同意貴署蒐集、處理、利用本人之個人資料，以及其他公務機關請求行政協助目的之提供。</span>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-between">
            <Link className="btn-outline-dark" href="/" title="不同意,回首頁">
              <i className="bi bi-chevron-left" aria-hidden="true"></i>不同意，回首頁
            </Link>
            <Link className="btn-theme" href="/member/register/account" title="同意，下一步">
              同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}

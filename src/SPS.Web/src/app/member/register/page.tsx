import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberConsentGate from "@/components/member/MemberConsentGate";

export const metadata: Metadata = {
  title: "會員註冊",
};

/**
 * 會員註冊 Step 1「使用條款」，對應舊站 page/member/register.html。
 *
 * 這是註冊 4 步驟流程（使用條款→帳號設定→填寫資料→完成註冊）的第一
 * 步，`StepProgress` 顯示目前進度。內容是個資蒐集告知事項（純靜態，
 * 留在這支 server component）＋兩個同意勾選框＋底部按鈕
 * （`MemberConsentGate.tsx`，client component）。
 *
 * 2026-09-10 使用者回報 bug 後補上驗證：兩個勾選框原本沒勾選也能
 * 直接按「同意，下一步」跳到 Step2，這是 git 歷史那版註解已經記著
 * 的已知缺口，這次補上，說明見 `MemberConsentGate.tsx`。
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

          <MemberConsentGate />
        </div>
      </InnerPageShell>
    </>
  );
}

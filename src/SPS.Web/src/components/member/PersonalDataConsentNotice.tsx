/**
 * 積木元件：「蒐集個人資料告知事項」全文，會員註冊第一步（`/member/register`）與資訊填寫頁的
 * 「個人資料同意書」彈窗共用，文字與官方《附件一、蒐集個人資料告知事項暨個人資料同意書》
 * （`SPS.Api/wwwroot/seed/register/consent-form.docx／.pdf`）逐字一致——法律文件，不要自己改寫或精簡；
 * 官方文件更新時，這裡要跟著改。
 *
 * 文件裡有幾處是範本留下來的填寫標記，照原文保留（「(計畫執行單位)」「(計畫名稱)_」，
 * 以及第一項最後那句「請參照《法務部個人資料保護法之特定目的及個人資料類別》依實填列」），
 * 是否要由主辦單位定稿後再更新，見 docs/後續更新需注意事項.md。
 */
export default function PersonalDataConsentNotice() {
  return (
    <>
      <p className="mt-2 mb-4">
        經濟部產業發展署(以下簡稱本署)委託(計畫執行單位) 中華民國工業安全衛生協會，執行(計畫名稱)_智慧石化永續發展計畫，為遵守個人資料保護法規定，在您提供個人資料予本署前，依法告知下列事項：
      </p>
      <div className="blue_rou">
        <ul className="nav d-block">
          <li className="d-flex mb-2">
            <label>一</label>
            <span>
              本署或本署授權之專案管理單位，因【（特定目的）○○八 (中小企業及其他產業之輔導)】而獲取您下列個人資料類別：【 Ｃ○○一辨識個人者、Ｃ○三八 職業、Ｃ○六一現行之受僱情形。】或其他得以直接或間接識別您個人之資料。(前述特定目的與個資類別，請參照《法務部個人資料保護法之特定目的及個人資料類別》依實填列。)
            </span>
          </li>
          <li className="d-flex mb-2">
            <label>二</label>
            <span>本署將依個人資料保護法及相關法令之規定下，依本署隱私權保護政策，蒐集、處理及利用您的個人資料。</span>
          </li>
          <li className="d-flex mb-2">
            <label>三</label>
            <span>本署將於蒐集目的之存續期間合理利用您的個人資料。</span>
          </li>
          <li className="d-flex mb-2">
            <label>四</label>
            <span>除蒐集之目的涉及國際業務或活動外，本署僅於中華民國領域內利用您的個人資料。</span>
          </li>
          <li className="d-flex mb-2">
            <label>五</label>
            <span>本署將於原蒐集之特定目的、本次以外之產業之推廣、宣導及輔導、以及其他公務機關請求行政協助之目的範圍內，合理利用您的個人資料。</span>
          </li>
          <li className="d-flex mb-2">
            <label>六</label>
            <div>
              <p className="mb-3">
                您可依個人資料保護法第3條規定，就您的個人資料向本署或本署授權之專案管理單位（聯絡管道：承辦人簡先生,電話:07-5503115#21,EMAIL: jjian0225@mail.isha.org.tw），行使之下列權利：
              </p>
              <ul className="nav d-block">
                <li>(一)查詢或請求閱覽。</li>
                <li>(二)請求製給複製本。</li>
                <li>(三)請求補充或更正。</li>
                <li>(四)請求停止蒐集、處理及利用。</li>
                <li>(五)請求刪除。</li>
              </ul>
              <p className="mt-3">依個人資料保護法第14條規定，本署得酌收行政作業費用。</p>
            </div>
          </li>
          <li className="d-flex mb-2">
            <label>七</label>
            <span>若您未提供正確之個人資料，本署或本署授權之專案管理單位將無法為您提供特定目的之相關業務。</span>
          </li>
          <li className="d-flex mb-2">
            <label>八</label>
            <span>本署因業務需要而委託其他機關處理您的個人資料時，將善盡監督之責。</span>
          </li>
          <li className="d-flex mb-2">
            <label>九</label>
            <span>您瞭解此一同意書符合個人資料保護法及相關法規之要求，且同意本署留存此同意書，供日後取出查驗。</span>
          </li>
        </ul>
      </div>
    </>
  );
}

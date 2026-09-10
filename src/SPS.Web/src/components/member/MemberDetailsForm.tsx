import Link from "next/link";
import PasswordField from "@/components/member/PasswordField";
import ChecklistGroup from "@/components/member/ChecklistGroup";
import SmartTechSelector from "@/components/member/SmartTechSelector";
import DocumentUploadField from "@/components/member/DocumentUploadField";
import { APPLICATION_SCENARIOS, APPLICATION_SCOPES } from "@/lib/member-registration-data";

const REQUIRED = (
  <span className="red me-1" aria-hidden="true">
    *
  </span>
);

export type ApplicantType = "individual" | "company";
export type CompanyRole = "demand" | "supply";
export type SupplierTier = "excellent" | "emerging";

/**
 * 對應官方《會員申請須知》「審查方式」欄——跟 `member-compare-data.ts`
 * 的 `COMPARE_ROWS[1]`（審查方式那列）是同一份文字，這裡另外抽一份
 * 是因為那邊是給「非會員/個人/企業-需求/企業-供給x2」5 欄比較表用
 * 的固定陣列，這裡要依 Step2 選擇動態算出「這個人是哪一種」，直接
 * 共用陣列反而要多一層對應索引，不如各自算​一次單純。
 */
function getReviewMethodLabel(applicantType: ApplicantType, companyRole?: CompanyRole, tier?: SupplierTier): string {
  if (applicantType === "individual") return "基本資料檢核";
  if (companyRole === "demand") return "文件審查";
  if (tier === "emerging") return "文件審查＋至少5位專家審查";
  return "文件審查";
}

/**
 * 積木元件：會員註冊 Step 3「填寫資料」／Step 4「完成註冊」共用的大型
 * 表單，對應舊站 p02.html（可填寫）／p03.html（唯讀檢視+確認送出）。
 *
 * 這兩頁在舊站原始碼裡是幾乎一模一樣的欄位（label、id、demo 假資料的
 * checkbox 勾選狀態都相同），差別只在：p02 每個欄位可編輯、多一個
 * 「確認密碼」欄位、上傳文件是真的上傳按鈕；p03 所有欄位 `disabled`
 * 並帶入示範假資料、上傳文件變成靜態縮圖、底部按鈕從「下一步」換成
 * 「確認送出」（觸發完成註冊 modal）。拆成一個共用元件＋`mode` 開關，
 * 不是各自複製一份 1000+ 行的 JSX。
 *
 * `mode="review"` 的示範假資料（email@gmail.com、王小名…）直接照抄
 * p03.html 寫死的內容，不是我們自己編的——這是舊站本身用來展示「填完
 * 資料長怎樣」的 demo 資料。
 *
 * 2026-09-10 對照官方《會員申請須知》＋使用者提供的「會員申請欄位
 * 總表」重新設計：原本這支表單不分類型、所有人看到一模一樣的巨大
 * 表單——現在依 `applicantType`／`companyRole`／`tier`（Step2 帶過來
 * 的 query string，見 `register/info/page.tsx`）決定欄位範圍，對照
 * 總表整理成這幾條規則：
 * - 所屬公司名稱／產業別／職稱：**所有人都要填**（含個人會員——
 *   官方文件「個人會員須於平台填報有效電子郵件、所屬公司名稱及
 *   產業別等基本資料」講得很清楚，個人會員不是完全不用碰公司相關
 *   欄位，只是不用填後面那一整套公司檔案），歸在「個人資料」底下。
 * - 公司負責人姓名／統一編號／公司電話／公司地址：企業會員（需求
 *   +供給）都要填，個人會員不用。
 * - LOGO／成立日期／資本總額／公司網址／公司簡介：需求端「選填」、
 *   供給端「必填」——同一批欄位兩邊都會顯示，差在必填星號有沒有。
 * - 主要產品暨服務／標籤／應用情境／應用範疇／智慧技術／獲獎事蹟：
 *   只有供給端才顯示（這些是「建立公司專頁」「標籤建置」「刊登
 *   服務」這幾項供給端專屬權益在用的資料，需求端用不到）。
 * - 工廠名稱／工廠地址：只有需求端顯示。
 * - 上傳文件：需求端傳「工廠登記證明文件」；供給端傳「公司登記
 *   證明文件」＋依卓越/新興換證明文件——這兩種登記文件底層對到
 *   同一個後端 `DocumentType.CompanyRegistration`（見
 *   `docs/改版規劃.md`），只是依角色顯示不同的標題文字，不是兩個
 *   獨立欄位。
 * - 其他佐證文件：**所有人（含個人會員）都顯示**，選填。
 *
 * 沒傳 `applicantType`／`companyRole`／`tier` 這三個 prop（例如有人
 * 跳過 Step2 直接打開這頁的網址）時，退回顯示範圍最大的「企業-供給
 * 端-新興」版面——寧可多顯示欄位讓使用者自己判斷要不要填，也不要
 * 因為漏了 query string 就悄悄藏掉他可能需要的欄位。
 */
export default function MemberDetailsForm({
  mode,
  onSubmitHref,
  onSubmitLabel,
  applicantType = "company",
  companyRole = "supply",
  tier = "emerging",
}: {
  mode: "edit" | "review";
  onSubmitHref: string;
  onSubmitLabel: string;
  applicantType?: ApplicantType;
  companyRole?: CompanyRole;
  tier?: SupplierTier;
}) {
  const disabled = mode === "review";
  const requiredMark = mode === "edit" ? REQUIRED : null;
  const isCompany = applicantType === "company";
  const isSupplier = isCompany && companyRole === "supply";
  const isDemand = isCompany && companyRole === "demand";
  const reviewMethod = getReviewMethodLabel(applicantType, companyRole, tier);
  // 需求端這批「公司公開檔案」欄位是選填、供給端才是必填——同一批
  // 欄位共用，只有星號有沒有的差異。
  const profileMark = mode === "edit" && isSupplier ? REQUIRED : null;

  return (
    <>
      <h3 className="mb-4 me_sho">
        帳號註冊{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">
            {requiredMark}電子郵件(登入帳號)
          </label>
          <input type="text" className="form-control" placeholder="請輸入電子郵件" defaultValue={disabled ? "email@gmail.com" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}會員密碼</label>
          <PasswordField disabled={disabled} defaultValue={disabled ? "123456" : undefined} />
        </div>

        {mode === "edit" && (
          <div className="menb_inp_tit form-group">
            <label className="mb-2">{REQUIRED}確認密碼</label>
            <PasswordField label="確認密碼" placeholder="請輸入確認密碼" />
          </div>
        )}
      </div>

      <h3 className="mb-4 me_sho mt-4">
        個人資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
      </h3>
      <div className="menb_inp_box d-flex">
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}姓名</label>
          <input type="text" className="form-control" placeholder="請輸入姓名" defaultValue={disabled ? "王小名" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}聯絡電話</label>
          <input type="text" className="form-control" placeholder="請輸入聯絡電話" defaultValue={disabled ? "04XXXXXXXX" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}手機</label>
          <input type="text" className="form-control" placeholder="請輸入手機" defaultValue={disabled ? "09XXXXXXXX" : undefined} disabled={disabled} />
        </div>

        {/* 2026-09-10：這三個欄位所有人都要填，含個人會員——見上面
            元件說明的官方文件引述。 */}
        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}所屬公司名稱</label>
          <input type="text" className="form-control" placeholder="請輸入所屬公司名稱" defaultValue={disabled ? "智慧工安" : undefined} disabled={disabled} />
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}產業別</label>
          <select className="form-select" aria-label="請選擇" disabled={disabled} defaultValue={disabled ? "工業" : "請選擇"}>
            {disabled && <option>工業</option>}
            {!disabled && <option>請選擇</option>}
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </div>

        <div className="menb_inp_tit form-group">
          <label className="mb-2">{requiredMark}職稱</label>
          <input type="text" className="form-control" placeholder="請輸入職稱" defaultValue={disabled ? "業務" : undefined} disabled={disabled} />
        </div>
      </div>

      {/* 2026-09-10：企業會員專屬的公司登記基本資料（負責人/統編/
          電話/地址）——個人會員不用填這幾項，只需要上面「個人資料」
          那三個欄位就夠。 */}
      {isCompany && (
        <>
          <h3 className="mb-4 me_sho mt-4">
            公司資料{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
          </h3>
          <div className="menb_inp_box d-flex">
            <div className="menb_inp_tit form-group">
              <label className="mb-2">{requiredMark}公司負責人姓名</label>
              <input type="text" className="form-control" placeholder="請輸入公司負責人姓名" defaultValue={disabled ? "王小名" : undefined} disabled={disabled} />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{requiredMark}統一編號</label>
              <input type="text" className="form-control" placeholder="請輸入統一編號" defaultValue={disabled ? "123456" : undefined} disabled={disabled} />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{requiredMark}公司電話</label>
              <input type="text" className="form-control" placeholder="公司電話" defaultValue={disabled ? "04XXXXXXXX" : undefined} disabled={disabled} />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{requiredMark}公司地址</label>
              <div className="col-12 col-sm">
                <div className="row g-2">
                  <div className="col-6 mb-md-0 mb-2">
                    <select className="form-select" aria-label="縣市" disabled={disabled} defaultValue={disabled ? "台中市" : "縣/市"}>
                      {disabled ? <option>台中市</option> : <option>縣/市</option>}
                      <option value="1">基隆市</option>
                      <option value="2">台北市</option>
                    </select>
                  </div>
                  <div className="col-6 mb-md-0 mb-2">
                    <select className="form-select" aria-label="鄉鎮市區" disabled={disabled} defaultValue={disabled ? "北區" : "鄉/鎮/區"}>
                      {disabled ? <option>北區</option> : <option>鄉/鎮/區</option>}
                      <option value="1">中正區</option>
                      <option value="2">信義區</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="地址"
                      defaultValue={disabled ? "高雄市左營區博愛三路12號15樓" : undefined}
                      disabled={disabled}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2026-09-10：LOGO／成立日期／資本總額／公司網址／公司
                簡介——需求端、供給端都顯示，差別只在必填星號
                （`profileMark`：供給端必填、需求端選填）。 */}
            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}LOGO圖像</label>
              {disabled ? (
                <div className="menb_logo">
                  <img className="img-fluid d-block" src="/images/all/menb_logo.jpg" alt="" style={{ width: 200, height: 200 }} />
                </div>
              ) : (
                <DocumentUploadField label="LOGO" mode="edit" hint="上傳格式支援影像檔，最大上限10MB。" />
              )}
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{profileMark}成立日期</label>
              <input
                type="text"
                placeholder="開始日期"
                id="startDate"
                className="form-control areadrp sideByside"
                defaultValue={disabled ? "2026.8.26" : undefined}
                disabled={disabled}
              />
            </div>

            <div className="menb_inp_tit form-group">
              <label className="mb-2">{profileMark}資本總額</label>
              <input type="text" className="form-control" placeholder="資本總額" defaultValue={disabled ? "2千萬" : undefined} disabled={disabled} />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}公司網址</label>
              <input type="text" className="form-control" placeholder="公司網址" defaultValue={disabled ? "www.eztrust.com" : undefined} disabled={disabled} />
            </div>

            <div className="menb_inp_tit form-group w-100">
              <label className="mb-2">{profileMark}公司簡介</label>
              <textarea
                className="form-control"
                rows={5}
                disabled={disabled}
                defaultValue={
                  disabled
                    ? "說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明說明"
                    : undefined
                }
              />
            </div>

            {/* 2026-09-10：這一段（主要產品／標籤／應用情境/範疇／
                智慧技術／獲獎事蹟）只有供給端才顯示——需求端在總表裡
                這幾列全部是「—」，不是選填，是整段都不用出現。 */}
            {isSupplier && (
              <>
                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}主要產品暨服務</label>
                  <select className="form-select" aria-label="請選擇" disabled={disabled} defaultValue={disabled ? "產品" : "請選擇"}>
                    {disabled ? <option>產品</option> : <option>請選擇</option>}
                  </select>
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}標籤</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="請輸入標籤，多個標籤請以逗號分隔"
                    defaultValue={disabled ? "智慧工安,5G,AIoT" : undefined}
                    disabled={disabled}
                  />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}應用情境(可多選)</label>
                  <ChecklistGroup idPrefix="fxContext" options={APPLICATION_SCENARIOS} disabled={disabled} threeColumn />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}應用範疇(可多選)</label>
                  <ChecklistGroup idPrefix="fxScope" options={APPLICATION_SCOPES} disabled={disabled} />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{REQUIRED}智慧技術(可多選)</label>
                  <SmartTechSelector disabled={disabled} />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">獲獎事蹟暨重要合作案例</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="請輸入獲獎事蹟暨重要合作案例"
                    defaultValue={disabled ? "說明說明說明說明說明" : undefined}
                    disabled={disabled}
                  />
                </div>
              </>
            )}

            {isDemand && (
              <>
                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}工廠名稱</label>
                  <input type="text" className="form-control" placeholder="請輸入工廠名稱" defaultValue={disabled ? "智慧工安工廠" : undefined} disabled={disabled} />
                </div>

                <div className="menb_inp_tit form-group w-100">
                  <label className="mb-2">{requiredMark}工廠地址</label>
                  <div className="col-12 col-sm">
                    <div className="row g-2">
                      <div className="col-6 mb-md-0 mb-2">
                        <select className="form-select" aria-label="縣市" disabled={disabled} defaultValue={disabled ? "台中市" : "縣/市"}>
                          {disabled ? <option>台中市</option> : <option>縣/市</option>}
                          <option value="1">基隆市</option>
                          <option value="2">台北市</option>
                        </select>
                      </div>
                      <div className="col-6 mb-md-0 mb-2">
                        <select className="form-select" aria-label="鄉鎮市區" disabled={disabled} defaultValue={disabled ? "北區" : "鄉/鎮/區"}>
                          {disabled ? <option>北區</option> : <option>鄉/鎮/區</option>}
                          <option value="1">中正區</option>
                          <option value="2">信義區</option>
                        </select>
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="地址"
                          defaultValue={disabled ? "高雄市左營區博愛三路12號15樓" : undefined}
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* 2026-09-10：上傳文件依審核路徑換成對應的證明文件——需求端傳
          「工廠登記證明文件」、供給端傳「公司登記證明文件」＋依卓越/
          新興換證明文件；兩種登記文件底層是同一個後端
          `DocumentType.CompanyRegistration`（見 docs/改版規劃.md），
          這裡只是依角色顯示不同標題，不是兩個獨立後端欄位。 */}
      {isCompany && (
        <>
          <h3 className="mb-4 me_sho mt-md-5 mt-4">
            上傳文件{mode === "edit" && <label>({REQUIRED}為必填欄位)</label>}
          </h3>
          <div className="menb_inp_tit form-group w-100">
            <div className="d-flex dow-document">
              {isDemand && <DocumentUploadField label="工廠登記證明文件" required mode={mode} />}
              {isSupplier && <DocumentUploadField label="公司登記證明文件" required mode={mode} />}
              {isSupplier && tier === "excellent" && <DocumentUploadField label="技術服務能量/相關登錄證明" required mode={mode} />}
              {isSupplier && tier === "emerging" && (
                <DocumentUploadField label="智慧工安技術產業資訊暨媒合平台登錄申請書" required mode={mode} />
              )}
            </div>
          </div>
        </>
      )}

      {/* 2026-09-10：其他佐證文件所有人都顯示（含個人會員），選填。 */}
      <h3 className="mb-4 me_sho mt-md-5 mt-4">其他佐證文件</h3>
      <div className="menb_inp_tit form-group w-100">
        <div className="d-flex dow-document">
          <DocumentUploadField label="如營業登記證明、證書等" mode={mode} />
        </div>
      </div>

      <div className="review_box">
        <label>審查方式</label>
        <div className="review_box_r">
          <span>{reviewMethod}</span>
        </div>
      </div>

      {mode === "edit" && (
        <div className="checkbox d-flex mb-3">
          <label className="relative">
            <input type="checkbox" aria-label="同意已充分知悉告知事項" title="本人已充分知悉貴署上述告知事項" className="form-check-input peer me-1" />
          </label>
          <span>
            我已詳細閱讀「
            <a href="#" data-bs-toggle="modal" data-bs-target="#staticmembership" className="blue text-decoration-underline" title="我已詳細閱讀個人資料同意書">
              個人資料同意書
            </a>
            」
          </span>
        </div>
      )}

      <div className="card-footer d-flex justify-content-between">
        <Link className="btn-outline-dark" href={mode === "edit" ? "/member/register/account" : "/member/register/info"} title="上一步">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>上一步
        </Link>
        {mode === "edit" ? (
          <Link className="btn-theme" href={onSubmitHref} title={onSubmitLabel}>
            {onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </Link>
        ) : (
          <a className="btn-theme" href="#" data-bs-toggle="modal" data-bs-target="#staticmembership" title={onSubmitLabel}>
            {onSubmitLabel}
            <i className="bi bi-chevron-right" aria-hidden="true"></i>
          </a>
        )}
      </div>
    </>
  );
}

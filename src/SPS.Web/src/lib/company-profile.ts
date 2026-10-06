import type { CompanyProfile } from "@/types/application";

/**
 * 註冊／升級表單裡的「公司專頁資料」狀態與送出轉換（`MemberDetailsForm` 與 `UpgradePanel` 共用，
 * 欄位畫面見 `components/member/CompanyProfileFields.tsx`）。必填規則對照 `docs/改版規劃.md` 的欄位總表，
 * 後端 `ApplicationService.ValidateCompanyProfile` 送出時會再檢查一次。
 */
export interface ProfileState {
  phone: string;
  city: string;
  district: string;
  /** 詳細地址（對應後端原有的 `companyAddress`） */
  address: string;
  establishmentDate: string;
  revenue: string;
  orgUrl: string;
  introduction: string;
  subject: string;
  awardNote: string;
  tagIds: number[];
  factoryName: string;
  factoryCity: string;
  factoryDistrict: string;
  factoryAddress: string;
  logo: File | null;
}

export const emptyProfile = (): ProfileState => ({
  phone: "",
  city: "",
  district: "",
  address: "",
  establishmentDate: "",
  revenue: "",
  orgUrl: "",
  introduction: "",
  subject: "",
  awardNote: "",
  tagIds: [],
  factoryName: "",
  factoryCity: "",
  factoryDistrict: "",
  factoryAddress: "",
  logo: null,
});

export function profileFromApplication(profile: CompanyProfile | undefined, address: string | undefined): ProfileState {
  return {
    ...emptyProfile(),
    phone: profile?.phone ?? "",
    city: profile?.city ?? "",
    district: profile?.district ?? "",
    address: address ?? "",
    establishmentDate: profile?.establishmentDate ?? "",
    revenue: profile?.revenue != null ? String(profile.revenue) : "",
    orgUrl: profile?.orgUrl ?? "",
    introduction: profile?.introduction ?? "",
    subject: profile?.subject ?? "",
    awardNote: profile?.awardNote ?? "",
    tagIds: profile?.tagIds ?? [],
    factoryName: profile?.factoryName ?? "",
    factoryCity: profile?.factoryCity ?? "",
    factoryDistrict: profile?.factoryDistrict ?? "",
    factoryAddress: profile?.factoryAddress ?? "",
  };
}

/** 轉成送給後端的 `profile`（供給端才送標籤與產品等；需求端才送工廠） */
export function profileToRequest(state: ProfileState, role: { isSupplier: boolean; isDemand: boolean }): CompanyProfile {
  const text = (value: string) => value.trim() || undefined;
  const revenue = state.revenue.trim() === "" ? undefined : Number(state.revenue.replace(/,/g, ""));
  return {
    phone: text(state.phone),
    city: text(state.city),
    district: text(state.district),
    establishmentDate: text(state.establishmentDate),
    revenue: revenue != null && Number.isFinite(revenue) ? revenue : undefined,
    orgUrl: text(state.orgUrl),
    introduction: text(state.introduction),
    subject: role.isSupplier ? text(state.subject) : undefined,
    awardNote: role.isSupplier ? text(state.awardNote) : undefined,
    tagIds: role.isSupplier ? state.tagIds : [],
    factoryName: role.isDemand ? text(state.factoryName) : undefined,
    factoryCity: role.isDemand ? text(state.factoryCity) : undefined,
    factoryDistrict: role.isDemand ? text(state.factoryDistrict) : undefined,
    factoryAddress: role.isDemand ? text(state.factoryAddress) : undefined,
  };
}

/** 必填檢查；回傳第一個缺漏的錯誤訊息，沒有問題回 null */
export function validateProfile(state: ProfileState, role: { isSupplier: boolean; isDemand: boolean }, taxonomyKinds?: { hasKind: (id: number, kind: "scenario" | "scope" | "tech") => boolean }): string | null {
  if (!state.phone.trim()) return "請填寫公司電話";
  if (!state.city || !state.district || !state.address.trim()) return "請填寫完整的公司地址（縣市、鄉鎮區、詳細地址）";
  if (state.revenue.trim() !== "" && !Number.isFinite(Number(state.revenue.replace(/,/g, "")))) return "資本總額請輸入數字";

  if (role.isSupplier) {
    if (!state.logo) return "請上傳公司 LOGO 圖像";
    if (!state.establishmentDate) return "請填寫成立日期";
    if (state.revenue.trim() === "") return "請填寫資本總額";
    if (!state.orgUrl.trim()) return "請填寫公司網址";
    if (!state.introduction.trim()) return "請填寫公司簡介";
    if (!state.subject.trim()) return "請填寫主要產品暨服務";
    if (taxonomyKinds) {
      const labels: Record<"scenario" | "scope" | "tech", string> = { scenario: "應用情境", scope: "應用範疇", tech: "智慧技術" };
      for (const kind of ["scenario", "scope", "tech"] as const) {
        if (!state.tagIds.some((id) => taxonomyKinds.hasKind(id, kind))) return `請至少勾選一個${labels[kind]}`;
      }
    } else if (state.tagIds.length === 0) {
      return "請至少勾選一個標籤";
    }
  }

  if (role.isDemand) {
    if (!state.factoryName.trim()) return "請填寫工廠名稱";
    if (!state.factoryCity || !state.factoryDistrict || !state.factoryAddress.trim()) return "請填寫完整的工廠地址（縣市、鄉鎮區、詳細地址）";
  }

  return null;
}

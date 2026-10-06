import type { TechAttributeGroup } from "@/lib/matching-data";

/**
 * 企業／需求共用的「標籤」（後台「分類管理」的企業標籤，後端 `CategoryType.CompanyTag`）。
 *
 * 設計稿的「應用情境／應用範疇／智慧技術」三種分類其實就是這套標籤：最上層（根節點）的 `remark` 欄位
 * 記錄它屬於哪一種——「應用情境」「應用範疇」或「智慧技術」；智慧技術底下還有「大類 → 子分類 → 項目」
 * 三層（對照設計稿 `.sm_techn`）。前台的篩選面板與企業詳情頁都用這份資料，不再寫死在程式裡。
 */
export interface TagRecord {
  id: number;
  name: string;
  parentId: number | null;
  ordinal: number;
  remark?: string | null;
}

export type TagGroupKind = "scenario" | "scope" | "tech";

export interface TagTaxonomy {
  scenarios: TagRecord[];
  scopes: TagRecord[];
  /** 智慧技術的三層結構，已轉成篩選元件（`TechAttributeSelector`）吃的形狀，項目的 value 是標籤 id */
  techGroups: TechAttributeGroup[];
  /** 標籤 id → 它屬於哪一種分類（智慧技術底下任何一層都算 tech） */
  kindById: Record<number, TagGroupKind>;
  nameById: Record<number, string>;
}

function kindOfRoot(remark?: string | null): TagGroupKind {
  const text = (remark ?? "").trim();
  if (text === "應用情境") return "scenario";
  if (text === "應用範疇") return "scope";
  return "tech";
}

export function buildTaxonomy(records: TagRecord[]): TagTaxonomy {
  const byParent = new Map<number | null, TagRecord[]>();
  for (const record of records) {
    const list = byParent.get(record.parentId ?? null) ?? [];
    list.push(record);
    byParent.set(record.parentId ?? null, list);
  }
  const children = (id: number | null) => (byParent.get(id) ?? []).slice().sort((a, b) => a.ordinal - b.ordinal || a.id - b.id);

  const kindById: Record<number, TagGroupKind> = {};
  const nameById: Record<number, string> = {};
  const scenarios: TagRecord[] = [];
  const scopes: TagRecord[] = [];
  const techGroups: TechAttributeGroup[] = [];

  const markDescendants = (record: TagRecord, kind: TagGroupKind) => {
    kindById[record.id] = kind;
    nameById[record.id] = record.name;
    children(record.id).forEach((child) => markDescendants(child, kind));
  };

  for (const root of children(null)) {
    const kind = kindOfRoot(root.remark);
    markDescendants(root, kind);
    if (kind === "scenario") scenarios.push(root);
    else if (kind === "scope") scopes.push(root);
    else {
      // 大類（root）→ 子分類（section）→ 項目（option）；沒有子分類的大類，項目直接放在同名的子分類下，
      // 沒有項目的子分類就把它自己當成一個項目
      const sections = children(root.id);
      const group: TechAttributeGroup = {
        id: String(root.id),
        label: root.name,
        sections: (sections.length > 0 ? sections : [root]).map((section) => {
          const options = section === root ? [] : children(section.id);
          const optionSource = options.length > 0 ? options : section === root ? [root] : [section];
          return {
            id: String(section.id),
            label: section.name,
            options: optionSource.map((option) => ({ value: String(option.id), label: option.name })),
          };
        }),
      };
      techGroups.push(group);
    }
  }

  return { scenarios, scopes, techGroups, kindById, nameById };
}

/** 一個項目（企業或需求）的標籤，依分類拆開 */
export function splitTagsByKind(tagIds: number[], taxonomy: TagTaxonomy): Record<TagGroupKind, { id: number; name: string }[]> {
  const result: Record<TagGroupKind, { id: number; name: string }[]> = { scenario: [], scope: [], tech: [] };
  for (const id of tagIds) {
    const kind = taxonomy.kindById[id];
    const name = taxonomy.nameById[id];
    if (kind && name) result[kind].push({ id, name });
  }
  return result;
}

/** 網址 `?tags=1,2,3` 轉成 id 陣列（只收正整數、去重） */
export function parseTagIds(raw: string | string[] | undefined): number[] {
  const text = Array.isArray(raw) ? raw.join(",") : raw ?? "";
  const ids = text
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  return Array.from(new Set(ids));
}

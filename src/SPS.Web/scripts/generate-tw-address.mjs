// 由 data/TaiwanAddressCityAreaRoadChinese.json（縣市／鄉鎮區／郵遞區號／路名的原始資料）
// 產生前台地址選擇器用的兩種檔案：
//   1. src/lib/tw-districts.ts       縣市與鄉鎮區（含 3 碼郵遞區號），會進前端 bundle，很小
//   2. public/data/tw-roads/{zip}.json 各郵遞區號的路名清單，選到鄉鎮區才由瀏覽器按需載入
// 原始資料有「釣魚臺」「南海島」兩個沒有一般鄉鎮區的項目，不放進下拉選單。路名的全形數字轉半形（八德路１段 → 八德路1段）。
// 行政區或路名資料更新時：換掉原始 JSON，執行 `node scripts/generate-tw-address.mjs`，再把產生的檔案一起提交。
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = JSON.parse(readFileSync(join(root, "data/TaiwanAddressCityAreaRoadChinese.json"), "utf8"));
const skipCities = new Set(["釣魚臺", "南海島"]);
const cities = source.filter((c) => !skipCities.has(c.CityName));

// 1. tw-districts.ts
const lines = cities.map(
  (c) => `  { county: ${JSON.stringify(c.CityName)}, districts: [${c.AreaList.map((a) => `[${JSON.stringify(a.AreaName)}, ${JSON.stringify(String(a.ZipCode))}]`).join(", ")}] },`,
);
const ts = `/**
 * 臺灣縣市與鄉鎮市區（含 3 碼郵遞區號），給註冊表單的地址選擇器用。
 *
 * 這個檔案是產生的，不要手改：資料來自 data/TaiwanAddressCityAreaRoadChinese.json，
 * 用 \`node scripts/generate-tw-address.mjs\` 重新產生（同時會產生 public/data/tw-roads/ 的路名檔）。
 * 每個鄉鎮市區是 [名稱, 郵遞區號]。
 */
export const TW_DISTRICTS: { county: string; districts: [string, string][] }[] = [
${lines.join("\n")}
];

export function getDistricts(county: string): [string, string][] {
  return TW_DISTRICTS.find((c) => c.county === county)?.districts ?? [];
}

export function getPostalCode(county: string, district: string): string | undefined {
  return getDistricts(county).find(([name]) => name === district)?.[1];
}

/** 用 3 碼郵遞區號反查縣市與鄉鎮區（輸入郵遞區號自動帶出縣市、鄉鎮區用） */
export function findByPostalCode(zip: string): { county: string; district: string } | undefined {
  for (const c of TW_DISTRICTS) {
    const hit = c.districts.find(([, z]) => z === zip);
    if (hit) return { county: c.county, district: hit[0] };
  }
  return undefined;
}
`;
writeFileSync(join(root, "src/lib/tw-districts.ts"), ts);

// 2. 路名檔
const roadsDir = join(root, "public/data/tw-roads");
rmSync(roadsDir, { recursive: true, force: true });
mkdirSync(roadsDir, { recursive: true });
let files = 0;
for (const city of cities) {
  for (const area of city.AreaList) {
    const roads = [...new Set(area.RoadList.map((r) => r.RoadName.normalize("NFKC").trim()).filter(Boolean))].sort();
    if (roads.length === 0) continue;
    writeFileSync(join(roadsDir, `${area.ZipCode}.json`), JSON.stringify(roads));
    files++;
  }
}
console.log(`tw-districts.ts：${cities.length} 縣市；路名檔 ${files} 個`);

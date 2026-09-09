import React from "react";
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import * as BsIcons from "react-icons/bs";
import * as LuIcons from "react-icons/lu";

const ICON_LIBS = {
  io: IoIcons,
  io5: Io5Icons,
  bs: BsIcons,
  lu: LuIcons,
} as const;

function getIconComponent<T extends object>(
  icons: T,
  name: string
): React.ElementType<{ size?: number }> | null {
  const record = icons as unknown as Record<string, unknown>;
  const v = record[name];
  return typeof v === "function"
    ? (v as React.ElementType<{ size?: number }>)
    : null;
}

type IconLibKey = keyof typeof ICON_LIBS;

function parseIcon(value: string | undefined): { lib: IconLibKey; name: string } {
  const raw = value ?? "";
  const [libRaw, ...rest] = raw.split(":");
  const name = rest.join(":");
  const lib: IconLibKey =
    libRaw && libRaw in ICON_LIBS ? (libRaw as IconLibKey) : "io5";
  return { lib, name };
}

export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const { lib, name } = React.useMemo(() => parseIcon(value), [value]);
  const [keyword, setKeyword] = React.useState("");

  const icons = ICON_LIBS[lib];
  const allNames = React.useMemo(() => {
    const record = icons as unknown as Record<string, unknown>;
    return Object.keys(record).filter((k) => typeof record[k] === "function");
  }, [icons]);

  const filtered = React.useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return allNames;
    return allNames.filter((n) => n.toLowerCase().includes(k));
  }, [allNames, keyword]);

  const setLib = (nextLib: IconLibKey) => {
    const nextIcons = ICON_LIBS[nextLib];
    const exists = !!name && Object.prototype.hasOwnProperty.call(nextIcons, name);
    onChange(`${nextLib}:${exists ? name : ""}`);
  };

  const setName = (nextName: string) => {
    onChange(`${lib}:${nextName}`);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">圖示庫</span>
          <select
            className="w-full rounded border px-2 py-1"
            value={lib}
            onChange={(e) => setLib(e.target.value as IconLibKey)}
            aria-label="選擇圖示庫"
          >
            <option value="io">Ionicons v4 (io)</option>
            <option value="io5">Ionicons v5 (io5)</option>
            <option value="bs">Bsicons</option>
            <option value="lu">LuIcons</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">搜尋</span>
          <input
            className="w-full rounded border px-2 py-1"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="IoAdd / IoMd / Outline..."
            aria-label="搜尋 icon"
          />
        </label>
      </div>

      <div className="rounded border p-2" aria-label="選擇圖示">
        {filtered.length === 0 ? (
          <div className="p-3 text-sm text-slate-600">找不到符合的圖示，請調整搜尋條件。</div>
        ) : (
          <div className="grid grid-cols-6 gap-2 max-h-72 overflow-auto">
            {filtered.slice(0, 100).map((n) => {
              if (!Object.prototype.hasOwnProperty.call(icons, n)) return null;

              const Comp = getIconComponent(icons, n);
              if (!Comp) return null;
              const selected = n === name;

              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setName(n)}
                  className={[
                    "flex flex-col items-center justify-center gap-1 rounded border p-2 text-[10px] transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                    selected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                  title={n}
                >
                  <Comp size={20} aria-hidden="true"/>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        提示：結果過多時請用搜尋縮小範圍（此處最多顯示 100 個選項以避免編輯器卡頓）。
      </p>
    </div>
  );
}

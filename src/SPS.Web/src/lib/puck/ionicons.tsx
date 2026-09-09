import React from "react";
import * as IoIcons from "react-icons/io";
import * as Io5Icons from "react-icons/io5";
import * as BsIcons from "react-icons/bs";
import * as LuIcons from "react-icons/lu";

export const ICON_LIBS = {
  io: IoIcons,
  io5: Io5Icons,
  bs: BsIcons,
  lu: LuIcons,
} as const;

export type IconLibKey = keyof typeof ICON_LIBS;

type IconComponent = React.ElementType<{ size?: number; "aria-hidden"?: boolean; focusable?: string | boolean }>;

export function renderReactIcon(value: string, size = 24) {
  const raw = value ?? "";
  const [libRaw, ...rest] = raw.split(":");
  const name = rest.join(":");

  const lib: IconLibKey =
    libRaw && libRaw in ICON_LIBS ? (libRaw as IconLibKey) : "io5";

  const icons = ICON_LIBS[lib];

  if (!name) return null;
  if (!Object.prototype.hasOwnProperty.call(icons, name)) return null;

  const Comp = icons[name as keyof typeof icons] as unknown as IconComponent;

  return <Comp size={size} aria-hidden={true} focusable="false" />;
}

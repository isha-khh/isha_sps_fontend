import type { ReactNode } from "react";

/**
 * 隱私權政策內文（後台「頁面設定 → 隱私權政策」維護的純文字）。全部用 React 逐段輸出，不用 `dangerouslySetInnerHTML`，
 * 後台輸入任何字元都不會變成 HTML：
 * - 空一行＝新段落；段落內的換行＝換行；
 * - 以「- 」或「• 」開頭的連續行＝項目符號清單；
 * - `http://`、`https://` 網址與電子郵件自動變成連結（其他協定如 `javascript:` 不會被轉成連結）。
 */
const URL_OR_EMAIL = /(https?:\/\/[^\s<>"'）)]+|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const BULLET = /^\s*[-•]\s+/;

function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_OR_EMAIL)) {
    const value = match[0];
    const index = match.index ?? 0;
    if (index > last) nodes.push(text.slice(last, index));
    const isEmail = !/^https?:\/\//i.test(value);
    nodes.push(
      isEmail ? (
        <a key={index} href={`mailto:${value}`}>
          {value}
        </a>
      ) : (
        <a key={index} href={value} target="_blank" rel="noopener noreferrer" title={`${value}（另開新視窗）`}>
          {value}
        </a>
      ),
    );
    last = index + value.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export default function PrivacyText({ body }: { body: string }) {
  const blocks = body.split(/\n\s*\n/).map((block) => block.split("\n"));

  return (
    <>
      {blocks.map((lines, blockIndex) => {
        const groups: { bullet: boolean; lines: string[] }[] = [];
        for (const line of lines) {
          const bullet = BULLET.test(line);
          const text = bullet ? line.replace(BULLET, "") : line;
          const current = groups[groups.length - 1];
          if (current && current.bullet === bullet) current.lines.push(text);
          else groups.push({ bullet, lines: [text] });
        }
        return groups.map((group, groupIndex) =>
          group.bullet ? (
            <ul key={`${blockIndex}-${groupIndex}`}>
              {group.lines.map((line, i) => (
                <li key={i}>{linkify(line)}</li>
              ))}
            </ul>
          ) : (
            <p key={`${blockIndex}-${groupIndex}`}>
              {group.lines.map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {linkify(line)}
                </span>
              ))}
            </p>
          ),
        );
      })}
    </>
  );
}

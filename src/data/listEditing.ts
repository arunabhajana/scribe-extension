export type ListEdit = { value: string; selectionStart: number; selectionEnd: number };

const listPrefix = /^([\t ]*)([-+*•]|\d{1,9}[.)])([\t ]+)(\[[ xX]\][\t ]+)?/;

function insideFence(value: string, lineStart: number) {
  let fence: { character: string; length: number } | null = null;
  for (const line of value.slice(0, lineStart).split("\n")) {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (!marker) continue;
    if (!fence) fence = { character: marker[1][0], length: marker[1].length };
    else if (marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
  }
  return Boolean(fence);
}

export function continueList(value: string, start: number, end: number): ListEdit | null {
  const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  const nextBreak = value.indexOf("\n", lineStart);
  const lineEnd = nextBreak === -1 ? value.length : nextBreak;
  if (end > lineEnd || insideFence(value, lineStart)) return null;
  const line = value.slice(lineStart, lineEnd);
  const match = line.match(listPrefix);
  if (!match || start < lineStart + match[0].length) return null;
  if (!line.slice(match[0].length).trim()) {
    const caret = lineStart + match[1].length;
    return { value: value.slice(0, lineStart) + match[1] + value.slice(lineEnd), selectionStart: caret, selectionEnd: caret };
  }
  const number = match[2].match(/^(\d+)([.)])$/);
  const marker = number ? `${Number(number[1]) + 1}${number[2]}` : match[2];
  const prefix = `${match[1]}${marker}${match[3]}${match[4] ? "[ ] " : ""}`;
  const insertion = `\n${prefix}`;
  const caret = start + insertion.length;
  return { value: value.slice(0, start) + insertion + value.slice(end), selectionStart: caret, selectionEnd: caret };
}

export function setListOnCurrentLine(value: string, start: number, end: number, ordered: boolean): ListEdit {
  const lineStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  const line = value.slice(lineStart).split("\n")[0];
  const existing = line.match(listPrefix);
  const indent = existing?.[1] ?? line.match(/^[\t ]*/)?.[0] ?? "";
  const oldLength = existing?.[0].length ?? indent.length;
  const sameKind = existing && (ordered ? /^\d/.test(existing[2]) : !/^\d/.test(existing[2]));
  const prefix = sameKind ? indent : `${indent}${ordered ? "1. " : "- "}`;
  const nextValue = value.slice(0, lineStart) + prefix + value.slice(lineStart + oldLength);
  const move = (position: number) => lineStart + prefix.length + Math.max(0, position - lineStart - oldLength);
  return { value: nextValue, selectionStart: move(start), selectionEnd: move(end) };
}

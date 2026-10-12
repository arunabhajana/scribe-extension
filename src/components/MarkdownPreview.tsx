import type { ReactNode } from "react";
import {
  markdownToDocument,
  type RichTextNode,
  type TextMark,
} from "../data/richTextDocument";

function renderInline(nodes: RichTextNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    if (node.type === "hardBreak") return <br key={index} />;
    if (node.type !== "text") return null;

    let content: ReactNode = node.text;
    for (const mark of node.marks ?? []) content = applyMark(content, mark, index);
    return <span key={index}>{content}</span>;
  });
}

function applyMark(content: ReactNode, mark: TextMark, key: number): ReactNode {
  if (mark.type === "bold") return <strong key={`bold-${key}`}>{content}</strong>;
  if (mark.type === "italic") return <em key={`italic-${key}`}>{content}</em>;
  if (mark.type === "code")
    return (
      <code
        key={`code-${key}`}
        className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.9em] dark:bg-white/10"
      >
        {content}
      </code>
    );
  return (
    <a
      key={`link-${key}`}
      href={mark.attrs.href}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="text-[var(--scribe-accent)] underline underline-offset-2"
    >
      {content}
    </a>
  );
}

function renderBlock(node: RichTextNode, index: number): ReactNode {
  if (node.type === "legacyMarkdown")
    return (
      <pre key={index} className="whitespace-pre-wrap break-words">
        {node.text}
      </pre>
    );
  if (node.type === "paragraph")
    return (
      <p key={index} className="mb-3 last:mb-0">
        {renderInline(node.content)}
      </p>
    );
  if (node.type === "heading") {
    const Tag = (`h${node.attrs.level}`) as "h1" | "h2" | "h3";
    return (
      <Tag
        key={index}
        className="mb-2 mt-4 font-semibold leading-snug first:mt-0"
        style={{ fontSize: `${1.42 - node.attrs.level * 0.1}em` }}
      >
        {renderInline(node.content)}
      </Tag>
    );
  }
  if (node.type === "bulletList" || node.type === "orderedList") {
    const Tag = node.type === "bulletList" ? "ul" : "ol";
    return (
      <Tag
        key={index}
        className={`mb-3 space-y-1 pl-6 last:mb-0 ${node.type === "bulletList" ? "list-disc" : "list-decimal"}`}
      >
        {node.content.map((item, itemIndex) => (
          <li key={itemIndex}>
            {item.content.map((child, childIndex) =>
              child.type === "paragraph" ? (
                <span key={childIndex}>{renderInline(child.content)}</span>
              ) : null,
            )}
          </li>
        ))}
      </Tag>
    );
  }
  if (node.type === "taskList")
    return (
      <ul key={index} className="mb-3 space-y-1.5 last:mb-0">
        {node.content.map((item, itemIndex) => (
          <li key={itemIndex} className="flex items-start gap-2">
            <span
              aria-hidden="true"
              className={`mt-[0.35em] grid size-3.5 shrink-0 place-items-center rounded border text-[9px] ${item.attrs.checked ? "border-[var(--scribe-accent)] bg-[var(--scribe-accent)] text-white" : "border-current/40"}`}
            >
              {item.attrs.checked ? "✓" : ""}
            </span>
            <span>
              {item.content.map((child, childIndex) =>
                child.type === "paragraph" ? (
                  <span key={childIndex}>{renderInline(child.content)}</span>
                ) : null,
              )}
            </span>
          </li>
        ))}
      </ul>
    );
  if (node.type === "blockquote")
    return (
      <blockquote
        key={index}
        className="mb-3 border-l-2 border-[var(--scribe-accent)]/50 pl-3 text-current/75 last:mb-0"
      >
        {node.content.map((child, childIndex) => renderBlock(child, childIndex))}
      </blockquote>
    );
  if (node.type === "codeBlock")
    return (
      <pre
        key={index}
        className="mb-3 overflow-x-auto rounded-lg bg-black/[0.06] p-3 font-mono text-[0.88em] last:mb-0 dark:bg-white/[0.06]"
      >
        <code>{node.content.map((item) => item.text).join("")}</code>
      </pre>
    );
  return null;
}

export function MarkdownPreview({
  markdown,
  className = "",
}: {
  markdown: string;
  className?: string;
}) {
  const document = markdownToDocument(markdown);
  return (
    <div className={`break-words ${className}`}>
      {document.content.map((node, index) => renderBlock(node, index))}
    </div>
  );
}


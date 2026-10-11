import { Children, cloneElement, useEffect, useLayoutEffect, useRef, useState, type MouseEventHandler, type ReactElement } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

export type ContextMenuItem = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
};

type Props = {
  children: ReactElement<{ onContextMenu?: MouseEventHandler }>;
  items: ContextMenuItem[];
  accent: string;
  dark: boolean;
  disabled?: boolean;
};

export function ContextMenu({ children, items, accent, dark, disabled = false }: Props) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const child = Children.only(children);

  useLayoutEffect(() => {
    if (!anchor || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    setPosition({
      x: Math.max(8, Math.min(anchor.x, window.innerWidth - rect.width - 8)),
      y: Math.max(8, Math.min(anchor.y, window.innerHeight - rect.height - 8)),
    });
    menuRef.current.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus({ preventScroll: true });
  }, [anchor, items.length]);

  useEffect(() => {
    if (!anchor) return;
    const closeOutside = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setAnchor(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAnchor(null);
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [anchor]);

  const existingHandler = child.props.onContextMenu;
  const trigger = cloneElement(child, {
    onContextMenu: (event) => {
      existingHandler?.(event);
      if (event.defaultPrevented || disabled || !items.length) return;
      event.preventDefault();
      event.stopPropagation();
      setPosition(null);
      setAnchor({ x: event.clientX, y: event.clientY });
    },
  });

  return (
    <>
      {trigger}
      {anchor && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Context actions"
          onContextMenu={(event) => event.preventDefault()}
          className={`fixed z-[10000] min-w-[176px] max-w-[230px] rounded-xl border p-1.5 shadow-[0_12px_34px_#17151f35] ${dark ? "border-[#3a3844] bg-[#24232b] text-[#f0edf8]" : "border-[#e5e1ec] bg-white text-[#363442]"}`}
          style={{
            left: position?.x ?? anchor.x,
            top: position?.y ?? anchor.y,
            visibility: position ? "visible" : "hidden",
          }}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={`${item.label}-${index}`}>
                {item.separatorBefore && <div className={`mx-2 my-1 h-px ${dark ? "bg-[#3a3844]" : "bg-[#eeebf2]"}`} />}
                <button
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    setAnchor(null);
                    item.onSelect();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${item.danger ? "text-[#dc5968] hover:bg-[#dc596812]" : "hover:text-[var(--menu-accent)]"} ${dark && !item.danger ? "hover:bg-white/[0.07]" : !item.danger ? "hover:bg-[#f4f1f9]" : ""}`}
                  style={!item.danger ? { "--menu-accent": accent } as React.CSSProperties : undefined}
                >
                  {Icon && <Icon size={15} className="shrink-0 opacity-80" />}
                  <span className="truncate">{item.label}</span>
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

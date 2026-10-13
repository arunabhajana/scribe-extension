import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, Check, ChevronDown } from "lucide-react";
import { noteSortOptions, type NoteSort } from "../data/noteSorting";

export function NoteSortDropdown({ value, onChange }: { value: NoteSort; onChange: (value: NoteSort) => void }) {
  const [open, setOpen] = useState(false);
  const [above, setAbove] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const options = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selected = noteSortOptions.find((option) => option.value === value) ?? noteSortOptions[0];
  function show(last = false) {
    const rect = trigger.current?.getBoundingClientRect();
    setAbove(Boolean(rect && window.innerHeight - rect.bottom < 230 && rect.top > 230));
    setActive(last ? noteSortOptions.length - 1 : Math.max(0, noteSortOptions.findIndex((option) => option.value === value)));
    setOpen(true);
  }
  function close() { setOpen(false); trigger.current?.focus(); }
  useLayoutEffect(() => { if (open) options.current[active]?.focus(); }, [open, active]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  return <div ref={root} className="relative min-w-0" onBlur={(event) => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
  }}>
    <button ref={trigger} type="button" aria-label={`Sort notes: ${selected.label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? menuId : undefined}
      className={`extension-note-sort flex h-7 max-w-[235px] min-w-0 items-center gap-1.5 rounded-lg border px-2 transition ${open ? "border-[var(--scribe-accent)] bg-[var(--scribe-accent)]/10 text-[var(--scribe-accent)]" : "border-[#dfdce6] bg-[#f1eff5] text-[#747586] hover:border-[var(--scribe-accent)] dark:border-[#3a3944] dark:bg-[#26252d] dark:text-[#e5e0ed]"}`}
      onClick={() => open ? close() : show()} onKeyDown={(event) => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(event.key === "ArrowUp"); }
      }}>
      <ArrowDownWideNarrow size={13} className="shrink-0" /><span className="truncate">{selected.label}</span><ChevronDown size={12} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div id={menuId} role="listbox" aria-label="Sort notes" className={`absolute right-0 z-40 w-[245px] max-w-[calc(100vw-38px)] overflow-y-auto rounded-xl border border-[#e7e5ed] bg-white p-1.5 shadow-[0_12px_30px_#28263c24] dark:border-[#393841] dark:bg-[#242329] ${above ? "bottom-full mb-1.5" : "top-full mt-1.5"}`}>
      {noteSortOptions.map((option, index) => <button key={option.value} ref={(element) => { options.current[index] = element; }} type="button" role="option" aria-selected={option.value === value} tabIndex={index === active ? 0 : -1}
        className={`extension-note-sort flex min-h-8 w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left outline-none transition hover:bg-[var(--scribe-accent)]/10 focus:bg-[var(--scribe-accent)]/10 ${option.value === value ? "bg-[var(--scribe-accent)]/10 text-[var(--scribe-accent)]" : "text-[#686776] dark:text-[#d2cfdb]"}`}
        onClick={() => { onChange(option.value); close(); }} onKeyDown={(event) => {
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
          else if (event.key === "Tab") close();
          else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            setActive(event.key === "Home" ? 0 : event.key === "End" ? noteSortOptions.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + noteSortOptions.length) % noteSortOptions.length);
          }
        }}><span>{option.label}</span>{option.value === value && <Check size={12} className="shrink-0" />}</button>)}
    </div>}
  </div>;
}

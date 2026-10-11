import {
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  label: string;
  accent: string;
  dark: boolean;
  children: ReactNode;
};
type Position = { x: number; y: number; above: boolean };

export function Tooltip({ label, accent, dark, children }: Props) {
  const [position, setPosition] = useState<Position | null>(null);

  function locate(target: EventTarget | null) {
    const element =
      target instanceof HTMLElement
        ? (target.closest("button, [data-tooltip-anchor]") ?? target)
        : null;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const above = rect.top > 56;
    const estimatedWidth = Math.min(
      220,
      label.length * 6.5 + 22,
      window.innerWidth - 16,
    );
    const halfWidth = estimatedWidth / 2;
    const x = Math.max(
      8 + halfWidth,
      Math.min(window.innerWidth - 8 - halfWidth, rect.left + rect.width / 2),
    );
    setPosition({ x, y: above ? rect.top - 8 : rect.bottom + 8, above });
  }
  function enter(event: MouseEvent<HTMLSpanElement>) {
    locate(event.target);
  }
  function focus(event: FocusEvent<HTMLSpanElement>) {
    locate(event.target);
  }
  function blur(event: FocusEvent<HTMLSpanElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null))
      setPosition(null);
  }

  return (
    <span
      className="contents"
      onMouseEnter={enter}
      onMouseLeave={() => setPosition(null)}
      onFocusCapture={focus}
      onBlurCapture={blur}
    >
      {children}
      {position &&
        createPortal(
          <span
            role="tooltip"
            data-placement={position.above ? "above" : "below"}
            className="scribe-tooltip"
            style={{
              left: position.x,
              top: position.y,
              transform: `translate(-50%, ${position.above ? "-100%" : "0"})`,
              backgroundColor: dark ? "#292730" : "#25232d",
              borderColor: `${accent}88`,
              boxShadow: `0 8px 24px ${accent}30`,
            }}
          >
            <span>{label}</span>
            <i
              style={{
                backgroundColor: dark ? "#292730" : "#25232d",
                borderColor: `${accent}88`,
              }}
            />
          </span>,
          document.body,
        )}
    </span>
  );
}

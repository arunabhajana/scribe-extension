export function AppLogo({ variant = "transparent", className = "" }: {
  variant?: "transparent" | "tile";
  className?: string;
}) {
  return <img src={variant === "transparent" ? "./branding/scribe-transparent.png" : "./branding/scribe-logo.png"}
    alt="" aria-hidden="true" draggable={false} className={`block shrink-0 select-none object-contain ${className}`} />;
}

export const noteFontSizes = [
  { label: "Small", size: 12 },
  { label: "Medium", size: 13 },
  { label: "Large", size: 15 },
] as const;

export type NoteFontSize = (typeof noteFontSizes)[number]["label"];

export const noteFontFamilies = [
  "DM Sans",
  "System default",
  "Georgia",
  "Monospace",
] as const;

export type NoteFontFamily = (typeof noteFontFamilies)[number];

export const noteFontFamilyCss: Record<NoteFontFamily, string> = {
  "DM Sans": '"DM Sans", sans-serif',
  "System default": "system-ui, sans-serif",
  Georgia: "Georgia, serif",
  Monospace: "monospace",
};

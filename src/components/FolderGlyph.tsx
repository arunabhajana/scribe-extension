import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Folder as FolderIcon,
  Heart,
  Lightbulb,
  Music2,
  Plane,
  Star,
} from "lucide-react";
import type { Folder as FolderType } from "../types";

const iconMap = {
  folder: FolderIcon,
  briefcase: BriefcaseBusiness,
  book: BookOpen,
  lightbulb: Lightbulb,
  heart: Heart,
  code: Code2,
  star: Star,
  plane: Plane,
  music: Music2,
};

export function FolderGlyph({
  folder,
  size = 17,
}: {
  folder: Pick<FolderType, "icon" | "color">;
  size?: number;
}) {
  const Icon = iconMap[folder.icon as keyof typeof iconMap] ?? FolderIcon;
  return <Icon size={size} strokeWidth={1.8} style={{ color: folder.color }} />;
}

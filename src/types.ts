export type Note = {
  id: string;
  title: string;
  body: string;
  folder: string;
  folderId?: string | null;
  color: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  baseUpdatedAt?: string | null;
  updated: string;
  pinned?: boolean;
  isDraft?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
};

export type Screen = "notes" | "settings" | "editor" | "view" | "auth" | "verify-email";

export type Folder = { id: string; name: string; icon: string; color: string; version?: number; createdAt?: string; updatedAt?: string; sortOrder?: number };

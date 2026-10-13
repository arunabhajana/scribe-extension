import { useCallback, useEffect, useRef, useState } from "react";
import { loadNoteSortPreferences, readNoteSortPreferences, saveNoteSortPreference, type NoteSort } from "../data/noteSorting";

export function useNoteSortPreferences() {
  const [preferences, setPreferences] = useState(readNoteSortPreferences);
  const changed = useRef<Record<string, NoteSort>>({});

  useEffect(() => {
    let active = true;
    void loadNoteSortPreferences().then((stored) => {
      if (active) setPreferences({ ...stored, ...changed.current });
    });
    return () => { active = false; };
  }, []);

  const setPreference = useCallback((key: string, value: NoteSort) => {
    changed.current[key] = value;
    setPreferences((previous) => ({ ...previous, [key]: value }));
    saveNoteSortPreference(key, value);
  }, []);

  return { preferences, setPreference };
}

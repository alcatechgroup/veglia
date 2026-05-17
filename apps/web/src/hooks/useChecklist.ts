import { useState, useCallback } from "react";
import { SPRINT_ITEMS } from "@/data/sprint";

const STORAGE_KEY = "veglia_sprint1_checklist_v2";

function buildDefaults(): Record<string, boolean> {
  return Object.fromEntries(
    SPRINT_ITEMS.filter((i) => i.defaultDone).map((i) => [i.id, true])
  );
}

function load(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  // First load: seed with defaults and persist
  const defaults = buildDefaults();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  } catch {
    // ignore
  }
  return defaults;
}

export function useChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>(load);

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { checked, toggle };
}

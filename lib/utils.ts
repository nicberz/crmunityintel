import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function taskMatchesQuery(
  task: { title: string; description: string | null; tags: string[] },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (task.title.toLowerCase().includes(q)) return true;
  if (task.description && task.description.toLowerCase().includes(q)) return true;
  return task.tags.some((tag) => tag.toLowerCase().includes(q));
}

export function parseTagsInput(value: string): string[] {
  const seen = new Set<string>();
  for (const raw of value.split(",")) {
    const tag = raw.trim();
    if (tag) seen.add(tag);
  }
  return Array.from(seen);
}

// Picks readable black/white text for an arbitrary hex background color.
export function getContrastTextColor(hex: string): "#000000" | "#ffffff" {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash.toLowerCase() : null;
}

export function ColorSwatchPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [text, setText] = useState(value);

  function handleTextChange(next: string) {
    setText(next);
    const normalized = normalizeHex(next);
    if (normalized) onChange(normalized);
  }

  function handlePickerChange(next: string) {
    setText(next);
    onChange(next);
  }

  return (
    <div className="flex items-center gap-2">
      <input type="hidden" name={name} value={value} />
      <input
        type="color"
        value={value}
        onChange={(e) => handlePickerChange(e.target.value)}
        title="Izvēlēties krāsu no paletes"
        aria-label="Izvēlēties krāsu no paletes"
        className="h-9 w-9 shrink-0 cursor-pointer rounded-md border border-border bg-card p-0.5"
      />
      <input
        type="text"
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="#9aa0ac"
        maxLength={7}
        className={cn(
          "h-9 w-28 rounded-md border border-border bg-card px-2 font-mono text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}
      />
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ClientListRow({
  client,
  updateNameAction,
  deleteAction,
}: {
  client: { id: string; name: string };
  updateNameAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(client.name);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const fd = new FormData();
    fd.set("clientId", client.id);
    fd.set("name", trimmed);
    startTransition(() => {
      updateNameAction(fd);
    });
    setEditing(false);
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Dzēst klientu "${client.name}"? Tiks neatgriezeniski dzēsti visi tā leadi, uzdevumi, kalendāra ieraksti un dati.`
      )
    )
      return;
    const fd = new FormData();
    fd.set("clientId", client.id);
    startTransition(() => {
      deleteAction(fd);
    });
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 shadow-sm shadow-black/[0.03]">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="h-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setName(client.name);
              setEditing(false);
            }
          }}
        />
        <Button type="button" variant="ghost" size="sm" onClick={handleSave} disabled={isPending}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setName(client.name);
            setEditing(false);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 shadow-sm shadow-black/[0.03] hover:bg-muted/40">
      <Link href={`/clients/${client.id}`} className="flex flex-1 items-center justify-between px-2 py-2 text-sm font-medium">
        {client.name}
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Link>
      <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(true)} disabled={isPending}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={handleDelete} disabled={isPending}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

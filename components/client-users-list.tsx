"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";

export interface ClientUserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  is_client_admin: boolean;
}

export function ClientUsersList({
  users,
  clientId,
  setAdminAction,
}: {
  users: ClientUserRow[];
  clientId?: string;
  setAdminAction?: (formData: FormData) => Promise<ActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);

  async function toggle(formData: FormData) {
    if (!setAdminAction) return;
    setError(null);
    const result = await setAdminAction(formData);
    if (result.error) setError(result.error);
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Vēl nav neviena lietotāja.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{user.full_name || user.email || "Bez vārda"}</p>
              {user.full_name && user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {user.is_client_admin && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Administrators
                </span>
              )}
              {setAdminAction && (
                <form action={toggle}>
                  {clientId && <input type="hidden" name="clientId" value={clientId} />}
                  <input type="hidden" name="profileId" value={user.id} />
                  <input type="hidden" name="isClientAdmin" value={user.is_client_admin ? "false" : "true"} />
                  <Button type="submit" variant="outline" size="sm">
                    {user.is_client_admin ? "Noņemt administratora tiesības" : "Padarīt par administratoru"}
                  </Button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

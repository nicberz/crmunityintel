import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types";

export default async function AgencyDashboardPage() {
  const supabase = createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("name");
  const clientList = (clients ?? []) as Client[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Pārskats</h1>
        <p className="text-muted-foreground">Izvēlies klientu, lai ieietu.</p>
      </div>

      <div className="max-w-md space-y-2">
        {clientList.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm shadow-black/[0.03] hover:bg-muted/40"
          >
            {client.name}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        {clientList.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Vēl nav neviena klienta.{" "}
            <Link href="/clients" className="underline">
              Pievienot pirmo klientu
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

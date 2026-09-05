import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { updateClientNameAction, deleteClientAction } from "@/app/(agency)/actions";
import { ClientListRow } from "@/components/client-list-row";
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
          <ClientListRow
            key={client.id}
            client={client}
            updateNameAction={updateClientNameAction}
            deleteAction={deleteClientAction}
          />
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

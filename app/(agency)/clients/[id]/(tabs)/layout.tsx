import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetailNav } from "@/components/client-detail-nav";
import type { Client } from "@/lib/types";

export default async function ClientTabsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: client } = await supabase.from("clients").select("name").eq("id", params.id).single();
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className="text-sm text-muted-foreground hover:underline">
          ← Visi klienti
        </Link>
        <h1 className="text-2xl font-semibold">{(client as Pick<Client, "name">).name}</h1>
      </div>
      <div className="flex gap-8">
        <ClientDetailNav clientId={params.id} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

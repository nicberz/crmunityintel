import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClientAction } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import type { Client } from "@/lib/types";

export default async function ClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase.from("clients").select("*").order("name");
  const clientList = (clients ?? []) as Client[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Klienti</h1>
        <p className="text-muted-foreground">Pārvaldi klientus un to komisijas likmes.</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Pievienot jaunu klientu</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createClientAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Klienta nosaukums</Label>
              <Input id="name" name="name" required placeholder="SIA Piemērs" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission_amount_eur">Komisija par leadu (€)</Label>
              <Input
                id="commission_amount_eur"
                name="commission_amount_eur"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue="2.00"
              />
            </div>
            <Button type="submit">Izveidot klientu</Button>
          </form>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nosaukums</TableHead>
            <TableHead>Komisija/lead</TableHead>
            <TableHead>Izveidots</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientList.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{client.commission_amount_eur.toFixed(2)} €</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(client.created_at)}
              </TableCell>
            </TableRow>
          ))}
          {clientList.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Vēl nav neviena klienta.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

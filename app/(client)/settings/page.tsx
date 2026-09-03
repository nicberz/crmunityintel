import { createClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import { addLeadFieldAction, updateLeadFieldAction, deleteLeadFieldAction } from "@/app/(client)/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import type { LeadFieldDefinition } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireClientUser();
  const supabase = createClient();

  const { data: fieldDefsData } = await supabase
    .from("lead_field_definitions")
    .select("*")
    .eq("client_id", profile.client_id!)
    .order("sort_order", { ascending: true });

  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Iestatījumi</h1>
        <p className="text-muted-foreground">Pārvaldi pielāgotos laukus un citus konta iestatījumus.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pielāgotie lauki</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Papildu lauki, ko vari aizpildīt caur API vai manuālo pievienošanu (bez telefona un e-pasta, kas
            vienmēr ir pieejami). Pievieno jaunu lauku, rediģē esošu vai noņem to ar &quot;Dzēst&quot;.
          </p>
          <LeadFieldEditor
            fields={fieldDefs}
            addAction={addLeadFieldAction}
            updateAction={updateLeadFieldAction}
            deleteAction={deleteLeadFieldAction}
          />
        </CardContent>
      </Card>
    </div>
  );
}

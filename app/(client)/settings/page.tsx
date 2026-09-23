import { createClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import {
  addLeadFieldAction,
  updateLeadFieldAction,
  deleteLeadFieldAction,
  updateDefaultLeadFieldAction,
} from "@/app/(client)/actions";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import { DefaultLeadFieldEditor } from "@/components/default-lead-field-editor";
import { ExportMyDataButton } from "@/components/export-my-data-button";
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
  const defaultFields = fieldDefs.filter((f) => f.is_default);
  const customFields = fieldDefs.filter((f) => !f.is_default);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Iestatījumi</h1>
        <p className="text-muted-foreground">Pārvaldi leadu laukus un citus konta iestatījumus.</p>
      </div>

      <CollapsibleSection icon={SlidersHorizontal} title="Leadu lauki">
        <p className="text-sm text-muted-foreground">
          Šeit pārvaldi, kādi lauki tiek rādīti un pieprasīti, ievadot jaunu leadu — gan sistēmas noklusējuma
          laukus, gan savus pielāgotos laukus. Šie paši lauki nosaka, ko var nosūtīt caur API (piemēram, no
          mājaslapas anketas).
        </p>
        <Card>
          <CardHeader>
            <CardTitle>Noklusējuma lauki</CardTitle>
          </CardHeader>
          <CardContent>
            <DefaultLeadFieldEditor fields={defaultFields} updateAction={updateDefaultLeadFieldAction} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pielāgotie lauki</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Papildu lauki, ko vari aizpildīt caur API vai manuālo pievienošanu. Pievieno jaunu lauku, rediģē
              esošu vai noņem to ar &quot;Dzēst&quot;.
            </p>
            <LeadFieldEditor
              fields={customFields}
              addAction={addLeadFieldAction}
              updateAction={updateLeadFieldAction}
              deleteAction={deleteLeadFieldAction}
            />
          </CardContent>
        </Card>
      </CollapsibleSection>

      <Card>
        <CardHeader>
          <CardTitle>Mani dati un privātums</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Vari lejupielādēt kopiju no saviem konta datiem. Lai pieprasītu konta dzēšanu vai citas ar datu
            aizsardzību saistītas darbības, skaties{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              privātuma politiku
            </Link>{" "}
            kontaktinformācijai.
          </p>
          <ExportMyDataButton />
        </CardContent>
      </Card>
    </div>
  );
}

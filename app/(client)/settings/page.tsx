import { createClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import {
  addLeadFieldAction,
  updateLeadFieldAction,
  deleteLeadFieldAction,
  updateDefaultLeadFieldAction,
  restoreDefaultLeadFieldAction,
  deleteClientDataAction,
  generateOwnApiKeyAction,
  inviteTeamMemberAction,
} from "@/app/(client)/actions";
import Link from "next/link";
import { Plug, ShieldCheck, SlidersHorizontal, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import { DefaultLeadFieldEditor } from "@/components/default-lead-field-editor";
import { ExportMyDataButton } from "@/components/export-my-data-button";
import { DeleteClientData } from "@/components/delete-client-data";
import { ApiKeyCard } from "@/components/api-key-card";
import { InviteClientForm } from "@/components/invite-client-form";
import { ClientUsersList, type ClientUserRow } from "@/components/client-users-list";
import type { LeadFieldDefinition } from "@/lib/types";

export default async function SettingsPage() {
  const profile = await requireClientUser();
  const isAdmin = profile.is_client_admin;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Iestatījumi</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Pārvaldi leadu laukus, API pieslēgumu, komandu un citus konta iestatījumus."
            : "Tava konta iestatījumi. Leadu laukus, API pieslēgumu un komandu pārvalda uzņēmuma administrators."}
        </p>
      </div>

      {isAdmin && <AdminSections clientId={profile.client_id!} />}

      <CollapsibleSection icon={ShieldCheck} title="Mani dati un privātums">
        <p className="text-sm text-muted-foreground">
          Vari lejupielādēt kopiju no saviem konta datiem. Lai pieprasītu konta dzēšanu vai citas ar datu
          aizsardzību saistītas darbības, skaties{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            privātuma politiku
          </Link>{" "}
          kontaktinformācijai.
        </p>
        <ExportMyDataButton />
      </CollapsibleSection>
    </div>
  );
}

async function AdminSections({ clientId }: { clientId: string }) {
  const supabase = createClient();

  const [
    { data: fieldDefsData },
    { data: client },
    { data: teamData },
    { count: leadsCount },
    { count: tasksCount },
    { count: eventsCount },
  ] = await Promise.all([
    supabase
      .from("lead_field_definitions")
      .select("*")
      .eq("client_id", clientId)
      .order("sort_order", { ascending: true }),
    supabase.from("clients").select("api_key_prefix").eq("id", clientId).single(),
    supabase
      .from("profiles")
      .select("id, email, full_name, is_client_admin")
      .eq("client_id", clientId)
      .eq("role", "client_user")
      .order("email", { ascending: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("client_id", clientId),
    supabase.from("calendar_events").select("id", { count: "exact", head: true }).eq("client_id", clientId),
  ]);

  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];
  const defaultFields = fieldDefs.filter((f) => f.is_default);
  const customFields = fieldDefs.filter((f) => !f.is_default);
  const team = (teamData ?? []) as ClientUserRow[];

  return (
    <>
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
            <DefaultLeadFieldEditor
              fields={defaultFields}
              updateAction={updateDefaultLeadFieldAction}
              deleteAction={deleteLeadFieldAction}
              restoreAction={restoreDefaultLeadFieldAction}
            />
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

      <CollapsibleSection icon={Plug} title="API pieslēgums">
        <ApiKeyCard
          generateAction={generateOwnApiKeyAction}
          apiKeyPrefix={client?.api_key_prefix ?? null}
          defaultFields={defaultFields}
          customFields={customFields}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={Users} title="Komanda">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uzaicināt kolēģi</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteClientForm action={inviteTeamMemberAction} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Lietotāji</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ClientUsersList users={team} />
              <p className="text-xs text-muted-foreground">
                Administratora tiesības piešķir aģentūra — sazinies ar mums, ja kādam tās vajadzīgas.
              </p>
            </CardContent>
          </Card>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Trash2} title="Dzēst datus" className="border-destructive/40">
        <p className="text-sm text-muted-foreground">
          Neatgriezeniski dzēš izvēlētos ierakstus visam uzņēmumam, ne tikai tev. Šo darbību nevar atsaukt —
          ja dati vēl var noderēt, vispirms tos saglabā.
        </p>
        <DeleteClientData
          counts={{ leads: leadsCount ?? 0, tasks: tasksCount ?? 0, calendar: eventsCount ?? 0 }}
          action={deleteClientDataAction}
        />
      </CollapsibleSection>
    </>
  );
}

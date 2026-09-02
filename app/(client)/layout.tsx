import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/components/notification-bell";
import { getDueRemindersAction, dismissReminderAction } from "@/app/(client)/actions";

const navItems = [
  { href: "/overview", label: "Pārskats" },
  { href: "/leads", label: "Leadi" },
  { href: "/calendar", label: "Kalendārs" },
];

export default async function ClientAreaLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireClientUser();
  const supabase = createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", profile.client_id!)
    .single();

  return (
    <AppShell
      navItems={navItems}
      title="UnityIntelCRM"
      user={{ email: profile.email, roleLabel: client?.name ?? "Klients" }}
      notificationBell={
        <NotificationBell
          getDueRemindersAction={getDueRemindersAction}
          dismissReminderAction={dismissReminderAction}
          variant="client"
        />
      }
    >
      {children}
    </AppShell>
  );
}

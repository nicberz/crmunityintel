import { LayoutDashboard, Users, CalendarDays, ListTodo, Settings } from "lucide-react";
import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/components/notification-bell";
import { getDueRemindersAction, dismissReminderAction } from "@/app/(client)/actions";

const iconClass = "h-4 w-4 shrink-0";

// Icons are passed as rendered elements: AppShell is a client component, and component functions can't cross the server/client boundary.
const navItems = [
  { href: "/overview", label: "Pārskats", icon: <LayoutDashboard className={iconClass} /> },
  { href: "/leads", label: "Leadi", icon: <Users className={iconClass} /> },
  { href: "/calendar", label: "Kalendārs", icon: <CalendarDays className={iconClass} /> },
  { href: "/tasks", label: "Uzdevumi", icon: <ListTodo className={iconClass} /> },
  { href: "/settings", label: "Iestatījumi", icon: <Settings className={iconClass} /> },
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
      variant="sidebar"
      user={{ email: profile.email, name: profile.full_name, roleLabel: client?.name ?? "Klients" }}
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

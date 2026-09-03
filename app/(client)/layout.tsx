import { LayoutDashboard, Users, CalendarDays, ListTodo, Settings } from "lucide-react";
import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/components/notification-bell";
import { getDueRemindersAction, dismissReminderAction } from "@/app/(client)/actions";

const navItems = [
  { href: "/overview", label: "Pārskats", icon: LayoutDashboard },
  { href: "/leads", label: "Leadi", icon: Users },
  { href: "/calendar", label: "Kalendārs", icon: CalendarDays },
  { href: "/tasks", label: "Uzdevumi", icon: ListTodo },
  { href: "/settings", label: "Iestatījumi", icon: Settings },
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

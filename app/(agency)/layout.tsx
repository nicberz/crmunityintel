import { requireAgencyAdmin } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { NotificationBell } from "@/components/notification-bell";
import { getDueRemindersAction, dismissReminderAction } from "@/app/(agency)/actions";

const navItems = [
  { href: "/dashboard", label: "Pārskats" },
  { href: "/clients", label: "Klienti" },
];

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAgencyAdmin();

  return (
    <AppShell
      navItems={navItems}
      title="UnityIntelCRM · Aģentūra"
      user={{ email: profile.email, roleLabel: "Aģentūras administrators" }}
      notificationBell={
        <NotificationBell
          getDueRemindersAction={getDueRemindersAction}
          dismissReminderAction={dismissReminderAction}
          variant="agency"
        />
      }
    >
      {children}
    </AppShell>
  );
}

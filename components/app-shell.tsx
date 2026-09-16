"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ReportBugButton } from "@/components/report-bug-button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface CurrentUser {
  email: string;
  roleLabel: string;
  name?: string | null;
}

function Logo({ title }: { title: string }) {
  const crmIndex = title.indexOf("CRM");
  const before = crmIndex >= 0 ? title.slice(0, crmIndex) : title;
  const after = crmIndex >= 0 ? title.slice(crmIndex + 3) : "";
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-primary" fill="currentColor" aria-hidden>
        <path d="M12 0l1.8 8.2L22 10l-8.2 1.8L12 20l-1.8-8.2L2 10l8.2-1.8z" />
      </svg>
      <span className="text-base font-semibold tracking-tight">
        {before}
        {crmIndex >= 0 && <span className="text-primary">CRM</span>}
        {after}
      </span>
    </div>
  );
}

function UserSummary({ user, className }: { user: CurrentUser; className?: string }) {
  const displayName = user.name || user.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
        {initial}
      </span>
      <div className="leading-tight">
        <p className="text-sm font-medium">{displayName}</p>
        <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
      </div>
    </div>
  );
}

function SearchField({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full max-w-sm", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        placeholder="Meklēt klientus, uzdevumus, piezīmes..."
        className="h-10 w-full rounded-md border border-border bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  );
}

export function AppShell({
  navItems,
  title,
  user,
  notificationBell,
  children,
  variant = "top",
}: {
  navItems: NavItem[];
  title: string;
  user: CurrentUser;
  notificationBell?: React.ReactNode;
  children: React.ReactNode;
  variant?: "top" | "sidebar";
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (variant === "sidebar") {
    return (
      <div className="flex min-h-screen bg-background">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card">
          <div className="flex h-16 shrink-0 items-center border-b border-border px-5">
            <Logo title={title} />
          </div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
                    active && "border-primary bg-primary/10 text-primary"
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border p-4">
            <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
              Iziet
            </Button>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6">
            <SearchField />
            <div className="flex items-center gap-4">
              {notificationBell}
              <UserSummary user={user} />
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
        <ReportBugButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-8">
            <Logo title={title} />
            <nav className="flex gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted",
                    pathname === item.href && "bg-primary/10 text-primary"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {notificationBell}
            <UserSummary user={user} />
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Iziet
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <ReportBugButton />
    </div>
  );
}

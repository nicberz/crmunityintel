"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

interface CurrentUser {
  email: string;
  roleLabel: string;
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
          <div className="border-b border-border px-5 py-5 text-base font-semibold">{title}</div>
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
                    active && "bg-primary/10 text-primary"
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
          <header className="flex items-center justify-end gap-3 border-b border-border bg-card px-6 py-4">
            {notificationBell}
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm shadow-black/[0.03]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="text-base font-semibold">{title}</span>
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
          <div className="flex items-center gap-3">
            {notificationBell}
            <div className="text-right leading-tight">
              <p className="text-sm font-medium">{user.email}</p>
              <p className="text-xs text-muted-foreground">{user.roleLabel}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Iziet
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

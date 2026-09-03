"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, CalendarDays, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function ClientDetailNav({ clientId }: { clientId: string }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const items = [
    { href: base, label: "Leadi", icon: Users },
    { href: `${base}/calendar`, label: "Kalendārs", icon: CalendarDays },
    { href: `${base}/settings`, label: "Iestatījumi", icon: Settings },
  ];

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1 self-start rounded-lg border border-border bg-card p-2 shadow-sm shadow-black/[0.03]">
      {items.map((item) => {
        const active = item.href === base ? pathname === base : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted",
              active && "bg-primary/10 text-primary"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

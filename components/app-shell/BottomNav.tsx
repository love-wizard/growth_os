"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, CalendarDays, HeartPulse, Home, UserRound } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "首页",
    icon: Home
  },
  {
    href: "/weekly-plan",
    label: "周计划",
    icon: CalendarDays
  },
  {
    href: "/archive",
    label: "成长档案",
    icon: HeartPulse
  },
  {
    href: "/ai-coach",
    label: "AI教练",
    icon: Bot
  },
  {
    href: "/profile",
    label: "我的",
    icon: UserRound
  }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-5xl grid-cols-5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className="flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground data-[active=true]:text-primary"
              data-active={isActive}
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

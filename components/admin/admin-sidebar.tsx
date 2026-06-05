"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SignOutButton } from "./sign-out-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/reservas", label: "Reservas", icon: ClipboardList, exact: false },
];

interface AdminSidebarProps {
  unviewedCount: number;
  signOutAction: () => Promise<void>;
}

export function AdminSidebar({ unviewedCount, signOutAction }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <span className="font-bold text-primary text-base leading-tight">
          AR Confecções
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <ul className="space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact
              ? pathname === href
              : pathname.startsWith(href);
            const isReservas = href === "/admin/reservas";
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isReservas && unviewedCount > 0 && (
                    <Badge className="ml-auto bg-destructive text-destructive-foreground text-xs px-1.5 py-0 min-w-[1.25rem] text-center">
                      {unviewedCount > 99 ? "99+" : unviewedCount}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t shrink-0">
        <SignOutButton action={signOutAction} />
      </div>
    </div>
  );
}

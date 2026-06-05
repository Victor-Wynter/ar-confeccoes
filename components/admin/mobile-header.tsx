"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { LayoutDashboard, Package, ClipboardList, Menu, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/produtos", label: "Produtos", icon: Package, exact: false },
  { href: "/admin/reservas", label: "Reservas", icon: ClipboardList, exact: false },
];

interface MobileHeaderProps {
  unviewedCount: number;
  signOutAction: () => Promise<void>;
}

export function MobileHeader({ unviewedCount, signOutAction }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b bg-background">
      <span className="font-bold text-primary">AR Confecções</span>

      <div className="flex items-center gap-2">
        {unviewedCount > 0 && (
          <Badge className="bg-destructive text-destructive-foreground text-xs">
            {unviewedCount > 99 ? "99+" : unviewedCount}
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <Menu className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const isActive = exact ? pathname === href : pathname.startsWith(href);
              const isReservas = href === "/admin/reservas";
              return (
                <DropdownMenuItem
                  key={href}
                  className={cn("gap-2", isActive && "font-semibold text-primary")}
                  onClick={() => router.push(href)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{label}</span>
                  {isReservas && unviewedCount > 0 && (
                    <Badge className="bg-destructive text-destructive-foreground text-xs px-1 py-0">
                      {unviewedCount > 99 ? "99+" : unviewedCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={pending}
              onClick={() => startTransition(() => signOutAction())}
              className="gap-2 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              {pending ? "Saindo…" : "Sair"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

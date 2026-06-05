"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import type { Reservation, ReservationStatus } from "@/db/schema";
import { updateReservationStatus } from "./actions";
import { formatBRL, formatPhone } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Phone } from "lucide-react";

const STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "Pendente",
  contacted: "Contactado",
  fulfilled: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  contacted: "bg-blue-100 text-blue-800 border-blue-200",
  fulfilled: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

interface Props {
  reservations: Reservation[];
  activeStatus?: ReservationStatus;
}

export function ReservationList({ reservations, activeStatus }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function handleStatusFilter(value: string | null) {
    const v = value ?? "all";
    const params = new URLSearchParams();
    if (v !== "all") params.set("status", v);
    router.replace(v !== "all" ? `${pathname}?${params}` : pathname);
  }

  function handleUpdateStatus(id: number, status: ReservationStatus) {
    startTransition(async () => {
      const res = await updateReservationStatus({ id, status });
      if (!res.ok) toast.error(res.error ?? "Erro ao atualizar.");
      else toast.success("Status atualizado.");
    });
  }

  return (
    <div className="space-y-4">
      {/* Filtro por status */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        <Select value={activeStatus ?? "all"} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {reservations.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">
          Nenhuma reserva encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const items = (r.items as { v: number; data: unknown[] } | null)?.data ?? [];
            const waLink = `https://wa.me/55${r.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${r.customerName}, sobre sua reserva ${r.code}...`)}`;
            return (
              <Card key={r.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Info principal */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-muted-foreground">{r.code}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_COLORS[r.status as ReservationStatus]}`}
                        >
                          {STATUS_LABELS[r.status as ReservationStatus] ?? r.status}
                        </Badge>
                      </div>
                      <p className="font-medium">{r.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(r.customerPhone)}
                        {r.customerEmail && ` · ${r.customerEmail}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {items.length} item{items.length !== 1 ? "s" : ""} ·{" "}
                        <span className="font-medium text-foreground">
                          {formatBRL(r.totalCents)}
                        </span>
                      </p>
                      {r.notes && (
                        <p className="text-xs text-muted-foreground italic">&ldquo;{r.notes}&rdquo;</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <Phone className="h-4 w-4 mr-1.5" />
                        WhatsApp
                      </a>

                      <DropdownMenu>
                        <DropdownMenuTrigger
                          disabled={pending}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          Status
                          <ChevronDown className="h-4 w-4 ml-1.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {(Object.keys(STATUS_LABELS) as ReservationStatus[]).map((s) => (
                            <DropdownMenuItem
                              key={s}
                              disabled={r.status === s}
                              onClick={() => handleUpdateStatus(r.id, s)}
                            >
                              {STATUS_LABELS[s]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

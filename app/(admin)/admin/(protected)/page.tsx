import { db } from "@/db";
import { products, reservations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ClipboardList, AlertCircle, Eye } from "lucide-react";
import Link from "next/link";
import { formatBRL } from "@/lib/format";

export const metadata = { title: "Dashboard | Admin" };

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    activeProducts,
    totalReservations,
    pendingReservations,
    unviewed,
    recentReservations,
  ] = await Promise.all([
    db.$count(products),
    db.$count(products, eq(products.active, true)),
    db.$count(reservations),
    db.$count(reservations, eq(reservations.status, "pending")),
    db.$count(reservations, eq(reservations.viewed, false)),
    db
      .select()
      .from(reservations)
      .orderBy(desc(reservations.createdAt))
      .limit(5),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da loja</p>
      </div>

      {/* Métrica */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeProducts} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reservas</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">no total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReservations}</div>
            <p className="text-xs text-muted-foreground mt-1">aguardando contato</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Não vistas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unviewed}</div>
            {unviewed > 0 && (
              <Link href="/admin/reservas" className="text-xs text-primary underline-offset-4 hover:underline mt-1 block">
                Ver reservas →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reservas recentes */}
      {recentReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reservas recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recentReservations.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.customerName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{r.code}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-medium">{formatBRL(r.totalCents)}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t">
              <Link href="/admin/reservas" className="text-sm text-primary underline-offset-4 hover:underline">
                Ver todas as reservas →
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "Pendente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    contacted: { label: "Contactado", className: "bg-blue-100 text-blue-800 border-blue-200" },
    fulfilled: { label: "Concluído", className: "bg-green-100 text-green-800 border-green-200" },
    cancelled: { label: "Cancelado", className: "bg-red-100 text-red-800 border-red-200" },
  };
  const config = map[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}

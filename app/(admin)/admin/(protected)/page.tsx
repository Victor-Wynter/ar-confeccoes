import { db } from "@/db";
import { products, reservations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Package,
  ClipboardList,
  AlertCircle,
  Eye,
  Plus,
  ArrowRight,
  ImageIcon,
  Layers,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

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
    db.select().from(reservations).orderBy(desc(reservations.createdAt)).limit(5),
  ]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da loja</p>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/produtos" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">{activeProducts} ativos</p>
              <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Gerenciar →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reservas" className="group">
          <Card className="h-full transition-shadow group-hover:shadow-md">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reservas</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReservations}</div>
              <p className="text-xs text-muted-foreground mt-1">no total</p>
              <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver todas →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reservas?status=pending" className="group">
          <Card className={cn("h-full transition-shadow group-hover:shadow-md", pendingReservations > 0 && "border-yellow-300")}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <AlertCircle className={cn("h-4 w-4", pendingReservations > 0 ? "text-yellow-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", pendingReservations > 0 && "text-yellow-600")}>{pendingReservations}</div>
              <p className="text-xs text-muted-foreground mt-1">aguardando contato</p>
              <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver pendentes →
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/reservas" className="group">
          <Card className={cn("h-full transition-shadow group-hover:shadow-md", unviewed > 0 && "border-blue-300")}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">Não vistas</CardTitle>
              <Eye className={cn("h-4 w-4", unviewed > 0 ? "text-blue-500" : "text-muted-foreground")} />
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", unviewed > 0 && "text-blue-600")}>{unviewed}</div>
              <p className="text-xs text-muted-foreground mt-1">reservas novas</p>
              <p className="text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver agora →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Ações rápidas ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Ações rápidas
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/produtos/novo"
            className={cn(buttonVariants({ size: "sm" }), "gap-2")}
          >
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
          <Link
            href="/admin/reservas?status=pending"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <AlertCircle className="h-4 w-4" />
            Ver pendentes
          </Link>
          <Link
            href="/admin/produtos"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
          >
            <Package className="h-4 w-4" />
            Todos os produtos
          </Link>
        </div>
      </div>

      {/* ── Guia das seções ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          O que cada seção faz
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Produtos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Produtos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Cadastre e gerencie os produtos do catálogo público. Cada produto tem 3 abas:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <Layers className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span><strong className="text-foreground">Geral</strong> — nome, slug, descrição, preço base, especificações técnicas, ativar/desativar no catálogo.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Package className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span><strong className="text-foreground">Variantes</strong> — combinações de cor + tamanho + faixa refletiva, cada uma com SKU e estoque próprio.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ImageIcon className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span><strong className="text-foreground">Imagens</strong> — upload de fotos do produto (otimizadas automaticamente). Defina a imagem principal e associe fotos a cores específicas.</span>
                </li>
              </ul>
              <Link
                href="/admin/produtos"
                className="inline-flex items-center gap-1 text-primary text-xs hover:underline mt-1"
              >
                Ir para Produtos <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* Reservas */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">Reservas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Pedidos feitos pelos clientes no site. O cliente escolhe os itens e envia uma reserva antes de ir ao WhatsApp.</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-yellow-500 shrink-0" />
                  <span><strong className="text-foreground">Pendente</strong> — reserva nova, cliente ainda não foi contatado.</span>
                </li>
                <li className="flex items-start gap-2">
                  <MessageCircle className="h-4 w-4 mt-0.5 text-blue-500 shrink-0" />
                  <span><strong className="text-foreground">Contactado</strong> — você já entrou em contato com o cliente via WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2">
                  <ClipboardList className="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
                  <span><strong className="text-foreground">Concluído / Cancelado</strong> — venda finalizada ou reserva encerrada sem compra.</span>
                </li>
              </ul>
              <p className="text-xs">Use o botão <strong className="text-foreground">WhatsApp</strong> em cada reserva para abrir a conversa com a mensagem preenchida automaticamente.</p>
              <Link
                href="/admin/reservas"
                className="inline-flex items-center gap-1 text-primary text-xs hover:underline mt-1"
              >
                Ir para Reservas <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Reservas recentes ── */}
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

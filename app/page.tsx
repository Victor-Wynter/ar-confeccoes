import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { FadeIn } from "@/components/public/fade-in";
import { ProductCard } from "@/components/public/product-card";
import { Shield, Eye, Truck, MessageCircle } from "lucide-react";
import { HeroColorSwitcher } from "@/components/public/hero-color-switcher";

// Revalida a cada hora para featured products refletirem mudanças no admin sem redeploy
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AR Confecções de Uniformes — Direto da fábrica",
  description:
    "Calças de brim profissionais, com e sem faixa refletiva. Fabricado em SP, entregamos para todo o Brasil.",
};

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const WHY_AR = [
  {
    icon: Shield,
    title: "Qualidade profissional",
    desc: "Tecido brim pesado, resistente e durável para uso intenso no dia a dia de trabalho.",
  },
  {
    icon: Eye,
    title: "Faixa refletiva",
    desc: "Disponível com faixa de alta visibilidade — essencial para ambientes de trabalho e noturnos.",
  },
  {
    icon: Truck,
    title: "Produção em SP",
    desc: "Fabricação própria em São Paulo. Controle de qualidade em cada etapa.",
  },
  {
    icon: MessageCircle,
    title: "Atendimento direto",
    desc: "Fale direto com o Amilton. Sem intermediário, sem fila de suporte.",
  },
] as const;

export default async function HomePage() {
  // Produtos em destaque com imagem primária e estoque total
  const featuredProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      imgUrl: productImages.url,
      imgAlt: productImages.alt,
      totalStock: sql<number>`cast(coalesce(sum(${productVariants.stock}), 0) as int)`,
    })
    .from(products)
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .where(and(eq(products.active, true), eq(products.featured, true)))
    .groupBy(products.id, productImages.url, productImages.alt)
    .orderBy(desc(products.createdAt));

  return (
    <div className="flex flex-col min-h-dvh">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative bg-primary text-primary-foreground overflow-hidden pb-0">
          {/* Círculos decorativos sutis */}
          <div
            aria-hidden
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-white/5"
          />
          <div
            aria-hidden
            className="absolute -left-12 -bottom-12 w-56 h-56 rounded-full bg-white/5"
          />
          <div
            aria-hidden
            className="absolute right-1/3 bottom-0 w-40 h-40 rounded-full bg-accent/10"
          />

          <div className="container mx-auto px-4 py-20 lg:py-28 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Texto */}
              <div>
                <p className="text-primary-foreground/60 text-sm font-medium uppercase tracking-widest mb-4">
                  São Paulo · Direto da fábrica
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                  Uniformes que duram.
                  <br />
                  <span className="text-accent">Para quem trabalha.</span>
                </h1>
                <p className="mt-6 text-lg text-primary-foreground/75 max-w-xl leading-relaxed">
                  Calças brim profissionais, com e sem faixa refletiva.
                  Atendemos desde 1 peça até grandes lotes para diversos segmentos e
                  empresas.
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/produtos"
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white bg-white px-5 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:bg-transparent hover:text-white hover:shadow-none active:translate-y-px"
                  >
                    Ver catálogo
                  </Link>
                  <a
                    href={`https://wa.me/${PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Falar no WhatsApp
                  </a>
                </div>
              </div>

              {/* Calça 3D + seletor de cores */}
              <div className="flex justify-center">
                <HeroColorSwitcher />
              </div>
            </div>
          </div>
        </section>

        {/* ── Faixa refletiva decorativa ─────────────────────────── */}
        <div aria-hidden className="w-full flex flex-col">
          <div className="h-3 w-full bg-[#CCFF00]" />
          <div className="h-2 w-full bg-[#C0C0C0]" />
          <div className="h-3 w-full bg-[#CCFF00]" />
        </div>

        {/* ── Destaques ──────────────────────────────────────────── */}
        {featuredProducts.length > 0 && (
          <section className="py-16 lg:py-24">
            <div className="container mx-auto px-4">
              <FadeIn>
                <div className="mb-10 text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                    Produtos em destaque
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Os mais pedidos para o trabalho
                  </p>
                </div>
              </FadeIn>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProducts.map((p, i) => (
                  <FadeIn key={p.id} delay={i * 0.08}>
                    <ProductCard
                      slug={p.slug}
                      name={p.name}
                      basePrice={p.basePrice}
                      imgUrl={p.imgUrl ?? null}
                      imgAlt={p.imgAlt ?? null}
                      totalStock={p.totalStock}
                    />
                  </FadeIn>
                ))}
              </div>

              <FadeIn className="text-center mt-10">
                <Link
                  href="/produtos"
                  className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                >
                  Ver catálogo completo
                </Link>
              </FadeIn>
            </div>
          </section>
        )}

        {/* ── Por que a AR ───────────────────────────────────────── */}
        <section className="py-16 lg:py-24 bg-muted/40 border-y">
          <div className="container mx-auto px-4">
            <FadeIn>
              <div className="mb-10 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-primary">
                  Por que a AR Confecções?
                </h2>
                <p className="text-muted-foreground mt-2">
                  Fabricante, não revendedor
                </p>
              </div>
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {WHY_AR.map(({ icon: Icon, title, desc }, i) => (
                <FadeIn key={title} delay={i * 0.1}>
                  <div className="bg-card rounded-xl border p-6 h-full space-y-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Atacado ─────────────────────────────────────────── */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <FadeIn>
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-8 sm:p-12 text-center max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-bold">
                  Precisa de uniforme em quantidade?
                </h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto leading-relaxed">
                  Atendemos empresas, indústrias e diversos setores. Negociamos
                  volume, prazo de entrega e condições de pagamento diretamente
                  com você.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <a
                    href={`https://wa.me/${PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                    )}
                  >
                    <MessageCircle className="h-5 w-5" />
                    Solicitar orçamento
                  </a>
                  <Link
                    href="/produtos"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
                  >
                    Ver produtos
                  </Link>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

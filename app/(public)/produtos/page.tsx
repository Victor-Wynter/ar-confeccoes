import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { ProductCard } from "@/components/public/product-card";
import { ProductFilters } from "@/components/public/product-filters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo | AR Confecções",
  description:
    "Uniformes de trabalho profissionais. Calças brim com e sem faixa refletiva.",
};

interface Props {
  searchParams: Promise<{ cor?: string; refletiva?: string }>;
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { cor, refletiva } = await searchParams;
  const filterRefletiva = refletiva === "sim";

  // Produtos ativos com imagem primária e estoque total
  const rawProducts = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      featured: products.featured,
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
    .where(eq(products.active, true))
    .groupBy(products.id, productImages.url, productImages.alt)
    .orderBy(desc(products.featured), asc(products.name));

  // Opções de filtro: cores + refletiva por produto
  const variantData =
    rawProducts.length > 0
      ? await db
          .selectDistinct({
            productId: productVariants.productId,
            color: productVariants.color,
            colorHex: productVariants.colorHex,
            hasReflective: productVariants.hasReflective,
          })
          .from(productVariants)
          .where(
            inArray(
              productVariants.productId,
              rawProducts.map((p) => p.id)
            )
          )
      : [];

  // Cores únicas para o filtro
  const colorMap = new Map<string, string>();
  for (const v of variantData) colorMap.set(v.color, v.colorHex);
  const availableColors = [...colorMap.entries()].map(([color, colorHex]) => ({
    color,
    colorHex,
  }));
  const hasReflectiveOption = variantData.some((v) => v.hasReflective);

  // Filtro JS (dataset pequeno; evita joins complexos)
  let filtered = rawProducts;
  if (cor) {
    const match = new Set(
      variantData.filter((v) => v.color === cor).map((v) => v.productId)
    );
    filtered = filtered.filter((p) => match.has(p.id));
  }
  if (filterRefletiva) {
    const match = new Set(
      variantData.filter((v) => v.hasReflective).map((v) => v.productId)
    );
    filtered = filtered.filter((p) => match.has(p.id));
  }

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Catálogo</h1>
        <p className="text-muted-foreground mt-1">
          Uniformes profissionais de alta resistência
        </p>
      </div>

      {/* Filtros */}
      {(availableColors.length > 0 || hasReflectiveOption) && (
        <div className="mb-6">
          <ProductFilters
            availableColors={availableColors}
            hasReflectiveOption={hasReflectiveOption}
            activeCor={cor}
            activeRefletiva={filterRefletiva}
          />
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          {cor || filterRefletiva
            ? "Nenhum produto encontrado para os filtros selecionados."
            : "Nenhum produto disponível no momento."}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              slug={p.slug}
              name={p.name}
              basePrice={p.basePrice}
              imgUrl={p.imgUrl ?? null}
              imgAlt={p.imgAlt ?? null}
              totalStock={p.totalStock}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatBRL } from "@/lib/format";
import Link from "next/link";
import { ProductConfig } from "./product-config";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [product] = await db
    .select({ name: products.name, description: products.description })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product) return { title: "Produto não encontrado" };

  return {
    title: `${product.name} | AR Confecções`,
    description:
      product.description ??
      `${product.name} — uniforme profissional para construção civil.`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (!product || !product.active) notFound();

  const [variants, images] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id)),
    db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, product.id))
      .orderBy(productImages.sortOrder),
  ]);

  const specs =
    (product.specifications as { label: string; value: string }[] | null) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/produtos" className="hover:text-foreground transition-colors">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Nome + preço */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-primary">
          {product.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          A partir de{" "}
          <span className="text-foreground font-semibold text-lg">
            {formatBRL(product.basePrice)}
          </span>
        </p>
      </div>

      {/* Configurador (client) */}
      <ProductConfig product={product} variants={variants} images={images} />

      {/* Especificações */}
      {specs.length > 0 && (
        <div className="mt-12 max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">Especificações</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="px-4 py-2.5 font-medium text-muted-foreground w-2/5">
                      {spec.label}
                    </td>
                    <td className="px-4 py-2.5">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Descrição */}
      {product.description && (
        <div className="mt-8 max-w-2xl">
          <h2 className="text-lg font-semibold mb-3">Sobre o produto</h2>
          <p className="text-muted-foreground leading-relaxed">
            {product.description}
          </p>
        </div>
      )}
    </div>
  );
}

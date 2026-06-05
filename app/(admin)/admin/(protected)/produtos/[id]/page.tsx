import { notFound } from "next/navigation";
import { db } from "@/db";
import { products, productVariants, productImages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ProductEditTabs } from "./product-edit-tabs";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const product = await db.query.products.findFirst({
    where: eq(products.id, Number(id)),
  });
  return { title: product ? `${product.name} | Admin` : "Produto | Admin" };
}

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params;
  const productId = Number(id);
  if (isNaN(productId)) notFound();

  const [product, variants, images] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, productId) }),
    db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(productVariants.color, productVariants.size),
    db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(productImages.sortOrder),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary truncate">{product.name}</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{product.slug}</p>
      </div>
      <ProductEditTabs product={product} variants={variants} images={images} />
    </div>
  );
}

import type { MetadataRoute } from "next";

// Regenera o sitemap a cada hora (ou quando revalidatePath("/sitemap.xml") é chamado)
export const revalidate = 3600;
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://arconfeccoes.vercel.app";

  const activeProducts = await db
    .select({ slug: products.slug, updatedAt: products.updatedAt })
    .from(products)
    .where(eq(products.active, true));

  const productEntries: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: `${base}/produtos/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/produtos`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/sobre`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${base}/contato`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...productEntries,
  ];
}

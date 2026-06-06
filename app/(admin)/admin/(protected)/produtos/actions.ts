"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  products,
  productVariants,
  productImages,
  type NewProduct,
  type NewProductVariant,
  type NewProductImage,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { productFormSchema, variantFormSchema } from "@/lib/validations";
import { del } from "@vercel/blob";

// ─── Produto ───────────────────────────────────────────────────

export async function createProduct(raw: unknown) {
  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { basePriceBRL, specifications, ...rest } = parsed.data;

  try {
    const [product] = await db
      .insert(products)
      .values({
        ...rest,
        basePrice: Math.round(basePriceBRL * 100),
        specifications: specifications.length > 0 ? specifications : null,
      } satisfies Omit<NewProduct, "id" | "createdAt" | "updatedAt">)
      .returning({ id: products.id });

    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/sitemap.xml");
    return { ok: true, productId: product.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar produto.";
    if (msg.includes("unique")) return { ok: false, error: "Slug já existe. Use outro." };
    return { ok: false, error: msg };
  }
}

export async function updateProduct(id: number, raw: unknown) {
  const parsed = productFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { basePriceBRL, specifications, ...rest } = parsed.data;

  try {
    await db
      .update(products)
      .set({
        ...rest,
        basePrice: Math.round(basePriceBRL * 100),
        specifications: specifications.length > 0 ? specifications : null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id));

    revalidatePath("/admin/produtos");
    revalidatePath(`/admin/produtos/${id}`);
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/sitemap.xml");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao atualizar produto.";
    if (msg.includes("unique")) return { ok: false, error: "Slug já existe. Use outro." };
    return { ok: false, error: msg };
  }
}

export async function toggleProductActive(id: number, active: boolean) {
  try {
    await db.update(products).set({ active, updatedAt: new Date() }).where(eq(products.id, id));
    revalidatePath("/admin/produtos");
    revalidatePath("/");
    revalidatePath("/produtos");
    revalidatePath("/sitemap.xml");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao atualizar produto." };
  }
}

export async function deleteProduct(id: number) {
  try {
    // Apaga imagens do Blob primeiro
    const imgs = await db.select().from(productImages).where(eq(productImages.productId, id));
    await Promise.allSettled(imgs.map((img) => del(img.url)));

    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/produtos");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir produto." };
  }
}

// ─── Variante ──────────────────────────────────────────────────

export async function createVariant(productId: number, raw: unknown) {
  const parsed = variantFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  try {
    await db.insert(productVariants).values({
      ...parsed.data,
      productId,
    } satisfies Omit<NewProductVariant, "id">);

    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar variante.";
    if (msg.includes("unique")) return { ok: false, error: "SKU ou combinação cor/tamanho/refletiva já existe." };
    return { ok: false, error: msg };
  }
}

export async function updateVariantStock(variantId: number, productId: number, stock: number) {
  try {
    await db
      .update(productVariants)
      .set({ stock: Math.max(0, stock) })
      .where(eq(productVariants.id, variantId));

    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao atualizar estoque." };
  }
}

export async function deleteVariant(variantId: number, productId: number) {
  try {
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir variante." };
  }
}

// ─── Imagem ────────────────────────────────────────────────────

export async function saveImageRecord(
  productId: number,
  url: string,
  alt: string,
  color: string | null,
) {
  try {
    // Primeira imagem vira primary automaticamente
    const existing = await db.$count(productImages, eq(productImages.productId, productId));
    await db.insert(productImages).values({
      productId,
      url,
      alt: alt || null,
      color: color || null,
      sortOrder: existing,
      isPrimary: existing === 0,
    } satisfies Omit<NewProductImage, "id">);

    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao salvar imagem." };
  }
}

export async function setPrimaryImage(imageId: number, productId: number) {
  try {
    await db
      .update(productImages)
      .set({ isPrimary: false })
      .where(eq(productImages.productId, productId));
    await db
      .update(productImages)
      .set({ isPrimary: true })
      .where(eq(productImages.id, imageId));

    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao definir imagem principal." };
  }
}

export async function deleteImage(imageId: number, productId: number, url: string) {
  try {
    await del(url);
    await db.delete(productImages).where(eq(productImages.id, imageId));

    // Se era primary, promove a próxima
    const remaining = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, productId))
      .orderBy(productImages.sortOrder)
      .limit(1);
    if (remaining[0]) {
      await db
        .update(productImages)
        .set({ isPrimary: true })
        .where(eq(productImages.id, remaining[0].id));
    }

    revalidatePath(`/admin/produtos/${productId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao excluir imagem." };
  }
}

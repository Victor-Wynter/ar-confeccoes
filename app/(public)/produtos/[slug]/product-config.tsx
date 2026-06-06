"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import type { Product, ProductVariant, ProductImage } from "@/db/schema";
import { MessageCircle, CalendarDays, ShoppingCart } from "lucide-react";
import { ReservationModal } from "./reservation-modal";

const SIZE_ORDER = ["P", "M", "G", "GG", "EXG"] as const;

interface Props {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
}

export function ProductConfig({ product, variants, images }: Props) {
  // ── Derived: unique colors
  const uniqueColors = useMemo(() => {
    const map = new Map<string, string>(); // color → colorHex
    for (const v of variants) map.set(v.color, v.colorHex);
    return [...map.entries()].map(([color, colorHex]) => ({ color, colorHex }));
  }, [variants]);

  // ── State
  const [selectedColor, setSelectedColor] = useState<string>(
    uniqueColors[0]?.color ?? ""
  );
  const [selectedReflective, setSelectedReflective] = useState(false);
  const [mode, setMode] = useState<"unit" | "lot">("unit");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [lotQtys, setLotQtys] = useState<Record<string, number>>({});
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [reserveOpen, setReserveOpen] = useState(false);

  // ── Reflective options for selected color
  const reflectiveOpts = useMemo(() => {
    const cv = variants.filter((v) => v.color === selectedColor);
    return {
      noRefl: cv.some((v) => !v.hasReflective),
      withRefl: cv.some((v) => v.hasReflective),
    };
  }, [variants, selectedColor]);

  // Auto-correct reflective selection when color changes
  useEffect(() => {
    if (selectedReflective && !reflectiveOpts.withRefl && reflectiveOpts.noRefl) {
      setSelectedReflective(false);
    } else if (!selectedReflective && !reflectiveOpts.noRefl && reflectiveOpts.withRefl) {
      setSelectedReflective(true);
    }
  }, [reflectiveOpts, selectedReflective]);

  // Reset size when color/reflective changes
  useEffect(() => {
    setSelectedSize(null);
  }, [selectedColor, selectedReflective]);

  // Reset image index when color changes
  useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedColor]);

  // ── Filtered variants
  const availableVariants = useMemo(
    () =>
      variants.filter(
        (v) =>
          v.color === selectedColor && v.hasReflective === selectedReflective
      ),
    [variants, selectedColor, selectedReflective]
  );

  // ── Images: color-specific first, fallback to generic
  const displayImages = useMemo(() => {
    const specific = images.filter((img) => img.color === selectedColor);
    return specific.length > 0 ? specific : images.filter((img) => !img.color);
  }, [images, selectedColor]);

  useEffect(() => {
    if (activeImgIdx >= displayImages.length && displayImages.length > 0) {
      setActiveImgIdx(0);
    }
  }, [displayImages, activeImgIdx]);

  // ── Selected variant (unit mode)
  const selectedVariant = useMemo(
    () => availableVariants.find((v) => v.size === selectedSize) ?? null,
    [availableVariants, selectedSize]
  );

  // ── Lot mode totals
  const lotItemCount = Object.values(lotQtys).reduce((s, q) => s + q, 0);
  const lotTotal = Object.entries(lotQtys).reduce(
    (s, [, qty]) => s + qty * product.basePrice,
    0
  );

  // ── WhatsApp messages
  function buildUnitWA(): string {
    if (!selectedVariant) return "#";
    const refl = selectedVariant.hasReflective ? " c/ faixa refletiva" : "";
    const msg = `Olá! Quero comprar:\n\n• 1x ${product.name} — ${selectedVariant.color} Tam.${selectedVariant.size}${refl}\n\nTotal: ${formatBRL(product.basePrice)}`;
    return buildWhatsAppLink({ message: msg });
  }

  function buildLotWA(): string {
    const refl = selectedReflective ? " c/ faixa refletiva" : "";
    const lines = SIZE_ORDER.map((s) => {
      const qty = lotQtys[s] ?? 0;
      return qty > 0 ? `• ${qty}x Tam.${s}` : null;
    })
      .filter(Boolean)
      .join("\n");
    const msg = `Olá! Quero fazer um pedido:\n\n${product.name} — ${selectedColor}${refl}\n${lines}\n\nTotal estimado: ${formatBRL(lotTotal)}`;
    return buildWhatsAppLink({ message: msg });
  }

  // ── Reservation items (unit mode only)
  const reserveItems = selectedVariant
    ? [
        {
          variantId: selectedVariant.id,
          productName: product.name,
          color: selectedVariant.color,
          size: selectedVariant.size,
          hasReflective: selectedVariant.hasReflective,
          qty: 1,
          unitPriceCents: product.basePrice,
        },
      ]
    : [];

  if (variants.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        Produto temporariamente indisponível.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* ── Mode toggle */}
        <div className="flex rounded-lg border overflow-hidden w-fit">
          {(["unit", "lot"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-5 py-2 text-sm font-medium transition-colors",
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {m === "unit" ? "Unidade" : "Lote"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Image gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
              {displayImages.length > 0 ? (
                <Image
                  src={displayImages[activeImgIdx]?.url ?? displayImages[0].url}
                  alt={displayImages[activeImgIdx]?.alt ?? product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem imagem
                </div>
              )}
            </div>

            {displayImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {displayImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImgIdx(idx)}
                    className={cn(
                      "relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 transition-all",
                      activeImgIdx === idx
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? ""}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Config panel */}
          <div className="space-y-6">
            {/* Color selector */}
            {uniqueColors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Cor:{" "}
                  <span className="font-normal text-muted-foreground">
                    {selectedColor}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map(({ color, colorHex }) => (
                    <button
                      key={color}
                      title={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-9 h-9 rounded-full border-2 transition-all",
                        selectedColor === color
                          ? "border-primary scale-110 shadow-md ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40"
                      )}
                      style={{ backgroundColor: colorHex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Reflective toggle */}
            {(reflectiveOpts.noRefl || reflectiveOpts.withRefl) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Faixa refletiva</p>
                <div className="flex rounded-lg border overflow-hidden w-fit">
                  <button
                    disabled={!reflectiveOpts.noRefl}
                    onClick={() => setSelectedReflective(false)}
                    className={cn(
                      "px-4 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      !selectedReflective
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Sem faixa
                  </button>
                  <button
                    disabled={!reflectiveOpts.withRefl}
                    onClick={() => setSelectedReflective(true)}
                    className={cn(
                      "px-4 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      selectedReflective
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Com faixa
                  </button>
                </div>
              </div>
            )}

            {/* ── UNIT MODE */}
            {mode === "unit" && (
              <div className="space-y-4">
                {/* Size grid */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Tamanho</p>
                  <div className="flex flex-wrap gap-2">
                    {SIZE_ORDER.map((size) => {
                      const variant = availableVariants.find(
                        (v) => v.size === size
                      );
                      const exists = !!variant;
                      const inStock = (variant?.stock ?? 0) > 0;
                      return (
                        <button
                          key={size}
                          disabled={!exists}
                          onClick={() => exists && setSelectedSize(size)}
                          className={cn(
                            "w-12 h-12 rounded-md border text-sm font-medium transition-all relative",
                            !exists && "opacity-25 cursor-not-allowed",
                            exists &&
                              selectedSize === size &&
                              "border-primary bg-primary/10 text-primary",
                            exists &&
                              selectedSize !== size &&
                              inStock &&
                              "border-border hover:border-primary/40",
                            exists &&
                              selectedSize !== size &&
                              !inStock &&
                              "border-border opacity-50 hover:border-primary/40"
                          )}
                        >
                          {size}
                          {exists && !inStock && (
                            <span
                              aria-hidden
                              className="absolute inset-x-1.5 top-1/2 h-px bg-muted-foreground/40 -translate-y-1/2 rotate-[150deg] pointer-events-none"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stock indicator */}
                {selectedVariant && (
                  <p className="text-xs text-muted-foreground">
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} unidade${selectedVariant.stock !== 1 ? "s" : ""} disponível${selectedVariant.stock !== 1 ? "is" : ""}`
                      : "Sem estoque — disponível para reserva"}
                  </p>
                )}

                {/* Price */}
                <p className="text-2xl font-bold text-primary">
                  {formatBRL(product.basePrice)}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {!selectedVariant ? (
                    <button
                      disabled
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "opacity-40 cursor-not-allowed gap-2"
                      )}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Selecione um tamanho
                    </button>
                  ) : selectedVariant.stock > 0 ? (
                    <a
                      href={buildUnitWA()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2"
                      )}
                    >
                      <MessageCircle className="h-5 w-5" />
                      Comprar no WhatsApp
                    </a>
                  ) : (
                    <button
                      onClick={() => setReserveOpen(true)}
                      className={cn(
                        buttonVariants({ size: "lg" }),
                        "bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                      )}
                    >
                      <CalendarDays className="h-5 w-5" />
                      Reservar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── LOT MODE */}
            {mode === "lot" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Informe as quantidades por tamanho:
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium">Tam.</th>
                        <th className="text-left px-4 py-2 font-medium">Qtd.</th>
                        <th className="text-right px-4 py-2 font-medium text-muted-foreground">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_ORDER.map((size) => {
                        const variant = availableVariants.find(
                          (v) => v.size === size
                        );
                        if (!variant) return null;
                        const qty = lotQtys[size] ?? 0;
                        return (
                          <tr key={size} className="border-t">
                            <td className="px-4 py-2.5 font-medium">{size}</td>
                            <td className="px-4 py-2.5">
                              <input
                                type="number"
                                min="0"
                                value={qty || ""}
                                placeholder="0"
                                onChange={(e) => {
                                  const val = Math.max(
                                    0,
                                    parseInt(e.target.value || "0", 10)
                                  );
                                  setLotQtys((prev) => ({
                                    ...prev,
                                    [size]: val,
                                  }));
                                }}
                                className="w-20 h-8 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              />
                            </td>
                            <td className="px-4 py-2.5 text-right text-muted-foreground">
                              {qty > 0
                                ? formatBRL(qty * product.basePrice)
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {lotItemCount > 0 && (
                      <tfoot className="border-t bg-muted/30">
                        <tr>
                          <td colSpan={2} className="px-4 py-2.5 font-medium">
                            Total ({lotItemCount} peça
                            {lotItemCount !== 1 ? "s" : ""})
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-primary">
                            {formatBRL(lotTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <a
                  href={lotItemCount > 0 ? buildLotWA() : undefined}
                  target={lotItemCount > 0 ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-disabled={lotItemCount === 0}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2 inline-flex",
                    lotItemCount === 0 && "opacity-40 pointer-events-none"
                  )}
                >
                  <MessageCircle className="h-5 w-5" />
                  Pedir no WhatsApp
                </a>

                <p className="text-xs text-muted-foreground">
                  * Preço estimado. Valores para pedidos em lote podem variar.
                  Entre em contato para negociação.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de reserva (Phase 4) */}
      <ReservationModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        productName={product.name}
        items={reserveItems}
        totalCents={product.basePrice}
      />
    </>
  );
}

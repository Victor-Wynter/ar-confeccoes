"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatBRL, computeVariantPrice } from "@/lib/format";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { buttonVariants } from "@/components/ui/button";
import type { Product, ProductVariant, ProductImage } from "@/db/schema";
import { MessageCircle, CalendarDays, ShoppingCart } from "lucide-react";
import { ReservationModal } from "./reservation-modal";

const SIZE_ORDER = ["P", "M", "G", "GG", "EXG"] as const;
// Tamanhos sob encomenda — não são estoque padrão
const SPECIAL_ORDER_SIZES = new Set(["P"]);

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
  const [selectedSidePocket, setSelectedSidePocket] = useState(false);
  const [mode, setMode] = useState<"unit" | "lot">("unit");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [lotQtys, setLotQtys] = useState<Record<string, number>>({});
  const [unitQty, setUnitQty] = useState(1);
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

  // ── Side pocket options for selected color + reflective
  const sidePocketOpts = useMemo(() => {
    const cv = variants.filter(
      (v) => v.color === selectedColor && v.hasReflective === selectedReflective
    );
    return {
      noPocket: cv.some((v) => !v.hasSidePocket),
      withPocket: cv.some((v) => v.hasSidePocket),
    };
  }, [variants, selectedColor, selectedReflective]);

  // Auto-correct reflective when color changes
  useEffect(() => {
    if (selectedReflective && !reflectiveOpts.withRefl && reflectiveOpts.noRefl) {
      setSelectedReflective(false);
    } else if (!selectedReflective && !reflectiveOpts.noRefl && reflectiveOpts.withRefl) {
      setSelectedReflective(true);
    }
  }, [reflectiveOpts, selectedReflective]);

  // Auto-correct side pocket when color/reflective changes
  useEffect(() => {
    if (selectedSidePocket && !sidePocketOpts.withPocket && sidePocketOpts.noPocket) {
      setSelectedSidePocket(false);
    } else if (!selectedSidePocket && !sidePocketOpts.noPocket && sidePocketOpts.withPocket) {
      setSelectedSidePocket(true);
    }
  }, [sidePocketOpts, selectedSidePocket]);

  // Reset size when any option changes
  useEffect(() => {
    setSelectedSize(null);
    setUnitQty(1);
  }, [selectedColor, selectedReflective, selectedSidePocket]);

  // Reset qty when size changes
  useEffect(() => {
    setUnitQty(1);
  }, [selectedSize]);

  // Reset image index when color changes
  useEffect(() => {
    setActiveImgIdx(0);
  }, [selectedColor]);

  // ── Filtered variants
  const availableVariants = useMemo(
    () =>
      variants.filter(
        (v) =>
          v.color === selectedColor &&
          v.hasReflective === selectedReflective &&
          v.hasSidePocket === selectedSidePocket
      ),
    [variants, selectedColor, selectedReflective, selectedSidePocket]
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

  // ── Dynamic price based on selected accessories
  const currentPrice = computeVariantPrice(
    product.basePrice,
    selectedReflective,
    selectedSidePocket
  );

  // ── Lot mode totals
  const lotItemCount = Object.values(lotQtys).reduce((s, q) => s + q, 0);
  const lotTotal = Object.entries(lotQtys).reduce(
    (s, [, qty]) => s + qty * currentPrice,
    0
  );

  // ── WhatsApp messages
  function buildUnitWA(): string {
    if (!selectedVariant) return "#";
    const extras: string[] = [];
    if (selectedVariant.hasReflective) extras.push("c/ faixa refletiva");
    if (selectedVariant.hasSidePocket) extras.push("c/ bolso lateral");
    const extrasStr = extras.length > 0 ? ` (${extras.join(", ")})` : "";
    const totalPrice = currentPrice * unitQty;
    const msg = `Olá! Quero comprar:\n\n• ${unitQty}x ${product.name} — ${selectedVariant.color} Tam.${selectedVariant.size}${extrasStr}\n\nTotal: ${formatBRL(totalPrice)}`;
    return buildWhatsAppLink({ message: msg });
  }

  function buildLotWA(): string {
    const extras: string[] = [];
    if (selectedReflective) extras.push("c/ faixa refletiva");
    if (selectedSidePocket) extras.push("c/ bolso lateral");
    const extrasStr = extras.length > 0 ? ` (${extras.join(", ")})` : "";
    const lines = SIZE_ORDER.map((s) => {
      const qty = lotQtys[s] ?? 0;
      return qty > 0 ? `• ${qty}x Tam.${s}` : null;
    })
      .filter(Boolean)
      .join("\n");
    const msg = `Olá! Quero fazer um pedido:\n\n${product.name} — ${selectedColor}${extrasStr}\n${lines}\n\nTotal estimado: ${formatBRL(lotTotal)}`;
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
          hasSidePocket: selectedVariant.hasSidePocket,
          qty: 1,
          unitPriceCents: currentPrice,
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
            <div className="relative aspect-square max-h-[520px] rounded-xl overflow-hidden bg-[#F5F5F5]">
              {displayImages.length > 0 ? (
                <Image
                  src={displayImages[activeImgIdx]?.url ?? displayImages[0].url}
                  alt={displayImages[activeImgIdx]?.alt ?? product.name}
                  fill
                  className="object-contain p-3 transition-opacity duration-200"
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
                      "relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all bg-[#F5F5F5]",
                      activeImgIdx === idx
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/30"
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt ?? ""}
                      fill
                      className="object-contain p-1.5"
                      sizes="80px"
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
                <p className="text-sm font-medium">
                  Faixa refletiva{" "}
                  <span className="text-xs font-normal text-muted-foreground">(+R$5)</span>
                </p>
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

            {/* Side pocket toggle */}
            {(sidePocketOpts.noPocket || sidePocketOpts.withPocket) && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Bolso lateral{" "}
                  <span className="text-xs font-normal text-muted-foreground">(+R$10)</span>
                </p>
                <div className="flex rounded-lg border overflow-hidden w-fit">
                  <button
                    disabled={!sidePocketOpts.noPocket}
                    onClick={() => setSelectedSidePocket(false)}
                    className={cn(
                      "px-4 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      !selectedSidePocket
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Sem bolso
                  </button>
                  <button
                    disabled={!sidePocketOpts.withPocket}
                    onClick={() => setSelectedSidePocket(true)}
                    className={cn(
                      "px-4 py-1.5 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                      selectedSidePocket
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    Com bolso
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
                      const isSpecialOrder = SPECIAL_ORDER_SIZES.has(size);
                      const isOutOfStock = exists && !inStock;
                      return (
                        <div key={size} className="flex flex-col items-center gap-1">
                          <button
                            disabled={!exists}
                            onClick={() => exists && setSelectedSize(size)}
                            className={cn(
                              "w-12 h-12 rounded-md border text-sm font-medium transition-all relative overflow-hidden",
                              !exists && "opacity-20 cursor-not-allowed",
                              exists &&
                                selectedSize === size &&
                                !isOutOfStock &&
                                "border-primary bg-primary/10 text-primary",
                              exists &&
                                selectedSize !== size &&
                                inStock &&
                                "border-border hover:border-primary/40",
                              isOutOfStock &&
                                selectedSize === size &&
                                "border-destructive/60 bg-destructive/5 text-destructive/70",
                              isOutOfStock &&
                                selectedSize !== size &&
                                "border-muted-foreground/20 bg-muted text-muted-foreground/60 hover:border-muted-foreground/40"
                            )}
                          >
                            {size}
                            {isOutOfStock && (
                              <span
                                aria-hidden
                                className="absolute inset-x-0 top-1/2 h-[1.5px] bg-muted-foreground/50 -translate-y-1/2 rotate-[145deg] scale-x-[1.4] pointer-events-none"
                              />
                            )}
                          </button>
                          {isSpecialOrder && (
                            <span className="text-[9px] leading-none text-muted-foreground font-medium uppercase tracking-wide">
                              Encomenda
                            </span>
                          )}
                          {isOutOfStock && !isSpecialOrder && (
                            <span className="text-[9px] leading-none text-destructive/70 font-medium uppercase tracking-wide">
                              Esgotado
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity selector (unit mode) */}
                {selectedVariant && selectedVariant.stock > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Quantidade</p>
                    <div className="flex items-center gap-0 w-fit rounded-lg border overflow-hidden">
                      <button
                        type="button"
                        aria-label="Diminuir quantidade"
                        disabled={unitQty <= 1}
                        onClick={() => setUnitQty((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center text-lg font-medium transition-colors hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-10 h-10 flex items-center justify-center text-sm font-semibold border-x select-none">
                        {unitQty}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar quantidade"
                        onClick={() => setUnitQty((q) => q + 1)}
                        className="w-10 h-10 flex items-center justify-center text-lg font-medium transition-colors hover:bg-muted"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Price */}
                <p className="text-2xl font-bold text-primary">
                  {formatBRL(currentPrice * (selectedVariant && selectedVariant.stock > 0 ? unitQty : 1))}
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
                        const isSpecialOrder = SPECIAL_ORDER_SIZES.has(size);
                        return (
                          <tr key={size} className="border-t">
                            <td className="px-4 py-2.5 font-medium">
                              {size}
                              {isSpecialOrder && (
                                <span className="ml-1.5 text-[9px] text-muted-foreground font-medium uppercase tracking-wide">
                                  Encomenda
                                </span>
                              )}
                            </td>
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
                                ? formatBRL(qty * currentPrice)
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

      {/* Modal de reserva */}
      <ReservationModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        productName={product.name}
        items={reserveItems}
        totalCents={currentPrice}
      />
    </>
  );
}

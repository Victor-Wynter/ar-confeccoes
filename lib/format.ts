// Acréscimos fixos de acessórios (em centavos)
export const REFLECTIVE_PRICE_CENTS = 500; // +R$5
export const SIDE_POCKET_PRICE_CENTS = 1000; // +R$10

/** Calcula preço final da variante com base nos acessórios selecionados. */
export function computeVariantPrice(
  basePriceCents: number,
  hasReflective: boolean,
  hasSidePocket: boolean,
): number {
  return (
    basePriceCents +
    (hasReflective ? REFLECTIVE_PRICE_CENTS : 0) +
    (hasSidePocket ? SIDE_POCKET_PRICE_CENTS : 0)
  );
}

/**
 * Formata centavos (integer) para string BRL.
 * Ex: 4990 → "R$ 49,90"
 * Regra do projeto: dinheiro SEMPRE em centavos no banco.
 */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata número de telefone brasileiro para exibição.
 * Ex: "5511991335307" → "(11) 99133-5307"
 * Ex: "11991335307"   → "(11) 99133-5307"
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^55/, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

/**
 * Gera slug a partir de um texto (para nome de produto).
 * Ex: "Calça Brim Pesado" → "calca-brim-pesado"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

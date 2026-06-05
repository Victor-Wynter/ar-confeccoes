import { z } from "zod";

// ─── Auth ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.email("Email inválido."),
  password: z.string().min(1, "Informe a senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ─── Produto ───────────────────────────────────────────────────
export const specSchema = z.object({
  label: z.string().min(1, "Label obrigatório."),
  value: z.string().min(1, "Valor obrigatório."),
});

export const productFormSchema = z.object({
  name: z.string().min(2, "Nome precisa ter ao menos 2 caracteres."),
  slug: z
    .string()
    .min(2, "Slug inválido.")
    .regex(/^[a-z0-9-]+$/, "Só letras minúsculas, números e hífens."),
  description: z.string().optional(),
  basePriceBRL: z.number({ message: "Preço inválido." }).positive("Preço deve ser maior que zero."),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  specifications: z.array(specSchema).default([]),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

// ─── Variante ──────────────────────────────────────────────────
export const SIZES = ["P", "M", "G", "GG", "EXG"] as const;

export const variantFormSchema = z.object({
  color: z.string().min(1, "Informe a cor."),
  colorHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Hex inválido. Ex: #1a2b3c"),
  size: z.enum(SIZES, { message: "Tamanho inválido." }),
  hasReflective: z.boolean(),
  stock: z.number({ message: "Informe o estoque." }).int().min(0, "Estoque não pode ser negativo."),
  sku: z.string().min(1, "SKU obrigatório."),
});
export type VariantFormInput = z.infer<typeof variantFormSchema>;

// ─── Reserva ───────────────────────────────────────────────────
export const reservationSchema = z.object({
  customerName: z.string().min(2, "Nome precisa ter ao menos 2 caracteres."),
  customerPhone: z
    .string()
    .min(10, "Telefone inválido. Use DDD + número.")
    .regex(/^[\d\s()\-+]+$/, "Só números, espaços e ( ) - +"),
  customerEmail: z
    .string()
    .email("Email inválido.")
    .optional()
    .or(z.literal("")),
  notes: z.string().optional(),
});
export type ReservationInput = z.infer<typeof reservationSchema>;

export const updateStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["pending", "contacted", "fulfilled", "cancelled"]),
});
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

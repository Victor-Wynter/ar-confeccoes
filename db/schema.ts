import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  specifications: jsonb("specifications").$type<
    { label: string; value: string }[]
  >(),
  basePrice: integer("base_price").notNull(),
  active: boolean("active").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const productVariants = pgTable(
  "product_variants",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    color: text("color").notNull(),
    colorHex: text("color_hex").notNull(),
    size: text("size").notNull(),
    hasReflective: boolean("has_reflective").notNull().default(false),
    hasSidePocket: boolean("has_side_pocket").notNull().default(false),
    stock: integer("stock").notNull().default(0),
  },
  (t) => [
    uniqueIndex("uniq_variant").on(
      t.productId,
      t.color,
      t.size,
      t.hasReflective,
      t.hasSidePocket,
    ),
    index("variants_product_idx").on(t.productId),
  ],
);

export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  color: text("color"),
  url: text("url").notNull(),
  alt: text("alt"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
});

export type ReservationItem = {
  variantId: number;
  productName: string;
  color: string;
  size: string;
  hasReflective: boolean;
  hasSidePocket: boolean;
  qty: number;
  unitPriceCents: number;
};

// jsonb versionado desde o início (gotcha do AGENTS.md): { v, data }
export type ReservationItems = {
  v: 1;
  data: ReservationItem[];
};

export type ReservationStatus =
  | "pending"
  | "contacted"
  | "fulfilled"
  | "cancelled";

export const reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  items: jsonb("items").$type<ReservationItems>().notNull(),
  totalCents: integer("total_cents").notNull(),
  notes: text("notes"),
  status: text("status").$type<ReservationStatus>().notNull().default("pending"),
  viewed: boolean("viewed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type AdminUser = typeof adminUsers.$inferSelect;

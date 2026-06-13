DROP INDEX "uniq_variant";--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "has_reflective" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "has_side_pocket" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_variant" ON "product_variants" USING btree ("product_id","color","size","has_reflective","has_side_pocket");
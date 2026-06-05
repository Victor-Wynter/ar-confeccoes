"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Product, ProductVariant, ProductImage } from "@/db/schema";
import { GeneralTab } from "./general-tab";
import { VariantsTab } from "./variants-tab";
import { ImagesTab } from "./images-tab";

interface Props {
  product: Product;
  variants: ProductVariant[];
  images: ProductImage[];
}

export function ProductEditTabs({ product, variants, images }: Props) {
  return (
    <Tabs defaultValue="geral" className="space-y-4">
      <TabsList>
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="variantes">
          Variantes{variants.length > 0 ? ` (${variants.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="imagens">
          Imagens{images.length > 0 ? ` (${images.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="geral">
        <GeneralTab product={product} />
      </TabsContent>

      <TabsContent value="variantes">
        <VariantsTab productId={product.id} variants={variants} />
      </TabsContent>

      <TabsContent value="imagens">
        <ImagesTab productId={product.id} images={images} />
      </TabsContent>
    </Tabs>
  );
}

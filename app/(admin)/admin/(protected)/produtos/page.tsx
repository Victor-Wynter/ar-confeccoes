import { db } from "@/db";
import { products, productVariants } from "@/db/schema";
import { ilike, count, eq, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { ProductsSearch } from "./products-search";
import { ProductActiveToggle } from "./product-active-toggle";

export const metadata = { title: "Produtos | Admin" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function ProdutosPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const productList = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      basePrice: products.basePrice,
      active: products.active,
      featured: products.featured,
      variantCount: count(productVariants.id),
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .where(q ? ilike(products.name, `%${q}%`) : undefined)
    .groupBy(products.id)
    .orderBy(desc(products.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {productList.length} produto{productList.length !== 1 ? "s" : ""}
            {q ? ` para "${q}"` : ""}
          </p>
        </div>
        <Link href="/admin/produtos/novo" className={buttonVariants()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo produto
        </Link>
      </div>

      <ProductsSearch defaultValue={q} />

      {productList.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {q ? `Nenhum produto encontrado para "${q}".` : "Nenhum produto cadastrado ainda."}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="hidden sm:table-cell">Preço base</TableHead>
                <TableHead className="hidden md:table-cell">Variantes</TableHead>
                <TableHead>Ativo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {productList.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.slug}</p>
                    </div>
                    {p.featured && (
                      <Badge variant="outline" className="mt-1 text-xs border-amber-400 text-amber-700">
                        Destaque
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {formatBRL(p.basePrice)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {p.variantCount}
                  </TableCell>
                  <TableCell>
                    <ProductActiveToggle id={p.id} active={p.active} />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

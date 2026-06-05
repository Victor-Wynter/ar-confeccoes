import { ProductForm } from "./product-form";

export const metadata = { title: "Novo produto | Admin" };

export default function NovoProdutoPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Novo produto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha os dados do produto. Variantes e imagens você adiciona depois.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}

"use client";

import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productFormSchema, type ProductFormInput } from "@/lib/validations";
import { slugify } from "@/lib/format";
import { createProduct } from "../actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ProductForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema) as unknown as Resolver<ProductFormInput>,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      basePriceBRL: 0,
      active: true,
      featured: false,
      specifications: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "specifications" });
  const active = watch("active");
  const featured = watch("featured");

  function onNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value;
    setValue("name", name);
    setValue("slug", slugify(name));
  }

  function onSubmit(data: ProductFormInput) {
    startTransition(async () => {
      const res = await createProduct(data);
      if (!res.ok) {
        toast.error(res.error ?? "Erro ao criar produto.");
        return;
      }
      toast.success("Produto criado!");
      router.push(`/admin/produtos/${res.productId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Nome e slug */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            placeholder="Calça Brim Pesado"
            {...register("name")}
            onChange={onNameChange}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            placeholder="calca-brim-pesado"
            {...register("slug")}
          />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Descrição */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Descreva o produto..."
          rows={3}
          {...register("description")}
        />
      </div>

      {/* Preço */}
      <div className="space-y-1.5">
        <Label htmlFor="basePriceBRL">Preço base (R$) *</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
          <Input
            id="basePriceBRL"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="49,90"
            className="pl-10"
            {...register("basePriceBRL", { valueAsNumber: true })}
          />
        </div>
        {errors.basePriceBRL && (
          <p className="text-xs text-destructive">{errors.basePriceBRL.message}</p>
        )}
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-6">
        <div className="flex items-center gap-3">
          <Switch
            id="active"
            checked={active}
            onCheckedChange={(v) => setValue("active", v)}
          />
          <Label htmlFor="active">Ativo (visível no catálogo)</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="featured"
            checked={featured}
            onCheckedChange={(v) => setValue("featured", v)}
          />
          <Label htmlFor="featured">Destaque na home</Label>
        </div>
      </div>

      <Separator />

      {/* Especificações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Especificações</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ex: Material → Brim 100% algodão
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", value: "" })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {fields.length > 0 && (
          <Card>
            <CardContent className="pt-4 space-y-3">
              {fields.map((field, i) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Label (ex: Material)"
                      {...register(`specifications.${i}.label`)}
                    />
                    {errors.specifications?.[i]?.label && (
                      <p className="text-xs text-destructive">
                        {errors.specifications[i].label?.message}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Valor (ex: Brim 100% algodão)"
                      {...register(`specifications.${i}.value`)}
                    />
                    {errors.specifications?.[i]?.value && (
                      <p className="text-xs text-destructive">
                        {errors.specifications[i].value?.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar produto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

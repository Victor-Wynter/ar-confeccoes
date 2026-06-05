"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { variantFormSchema, type VariantFormInput, SIZES } from "@/lib/validations";
import { createVariant, deleteVariant, updateVariantStock } from "../actions";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import type { ProductVariant } from "@/db/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";

export function VariantsTab({
  productId,
  variants,
}: {
  productId: number;
  variants: ProductVariant[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<VariantFormInput>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      color: "",
      colorHex: "#000000",
      size: "M",
      hasReflective: false,
      stock: 0,
      sku: "",
    },
  });

  const size = watch("size");
  const hasReflective = watch("hasReflective");

  function onSubmit(data: VariantFormInput) {
    startTransition(async () => {
      const res = await createVariant(productId, data);
      if (!res.ok) {
        toast.error(res.error ?? "Erro ao criar variante.");
        return;
      }
      toast.success("Variante adicionada!");
      reset();
      setShowForm(false);
    });
  }

  function handleDelete(variantId: number) {
    if (!confirm("Excluir esta variante?")) return;
    startTransition(async () => {
      const res = await deleteVariant(variantId, productId);
      if (!res.ok) toast.error(res.error ?? "Erro ao excluir.");
      else toast.success("Variante excluída.");
    });
  }

  function handleStockChange(variantId: number, value: string) {
    const stock = parseInt(value, 10);
    if (isNaN(stock)) return;
    startTransition(async () => {
      const res = await updateVariantStock(variantId, productId, stock);
      if (!res.ok) toast.error(res.error ?? "Erro ao atualizar estoque.");
    });
  }

  return (
    <div className="space-y-6">
      {/* Tabela de variantes */}
      {variants.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cor</TableHead>
                <TableHead>Tam.</TableHead>
                <TableHead>Refletiva</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: v.colorHex }}
                      />
                      {v.color}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{v.size}</Badge>
                  </TableCell>
                  <TableCell>
                    {v.hasReflective ? (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{v.sku}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      defaultValue={v.stock}
                      className="w-20 h-8"
                      onBlur={(e) => handleStockChange(v.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(v.id)}
                      disabled={pending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma variante cadastrada ainda.
        </p>
      )}

      {/* Form nova variante */}
      {showForm ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nova variante</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Cor *</Label>
                  <Input placeholder="Azul" {...register("color")} />
                  {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Hex da cor *</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-9 w-9 rounded border cursor-pointer p-0.5 shrink-0"
                      {...register("colorHex")}
                      onChange={(e) => setValue("colorHex", e.target.value)}
                    />
                    <Input placeholder="#1a2b3c" {...register("colorHex")} className="font-mono" />
                  </div>
                  {errors.colorHex && <p className="text-xs text-destructive">{errors.colorHex.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Tamanho *</Label>
                  <Select value={size} onValueChange={(v) => setValue("size", v as typeof size)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIZES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>SKU *</Label>
                  <Input placeholder="BRIM-AZ-M" className="font-mono" {...register("sku")} />
                  {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Estoque</Label>
                  <Input type="number" min="0" {...register("stock", { valueAsNumber: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Faixa refletiva</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch
                      checked={hasReflective}
                      onCheckedChange={(v) => setValue("hasReflective", v)}
                    />
                    <span className="text-sm">{hasReflective ? "Sim" : "Não"}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Salvando…" : "Adicionar variante"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowForm(false); reset(); }}
                  disabled={pending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar variante
        </Button>
      )}
    </div>
  );
}

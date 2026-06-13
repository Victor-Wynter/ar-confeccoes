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
import { Trash2, Plus, Check } from "lucide-react";

const PRESET_COLORS = [
  { label: "Azul Royal",   hex: "#2650C1" },
  { label: "Azul Marinho", hex: "#0C1F5E" },
  { label: "Preto",        hex: "#111111" },
  { label: "Cinza",        hex: "#6B7280" },
  { label: "Laranja",      hex: "#E05A00" },
  { label: "Marrom",       hex: "#6B3A2A" },
] as const;

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
      color: "Azul Royal",
      colorHex: "#2650C1",
      size: "M",
      hasReflective: false,
      hasSidePocket: false,
      stock: 0,
    },
  });

  const size = watch("size");
  const hasReflective = watch("hasReflective");
  const hasSidePocket = watch("hasSidePocket");
  const color = watch("color");

  function selectColor(preset: (typeof PRESET_COLORS)[number]) {
    setValue("color", preset.label, { shouldValidate: true });
    setValue("colorHex", preset.hex, { shouldValidate: true });
  }

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
                <TableHead>Bolso</TableHead>
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
                  <TableCell>
                    {v.hasSidePocket ? (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="outline">
                        Sim
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não</span>
                    )}
                  </TableCell>

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
              <div className="space-y-2">
                <Label>Cor *</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((preset) => {
                    const isSelected = color === preset.label;
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        title={preset.label}
                        onClick={() => selectColor(preset)}
                        className="group relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all"
                        style={{
                          borderColor: isSelected ? preset.hex : undefined,
                          backgroundColor: isSelected ? `${preset.hex}12` : undefined,
                        }}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-black/10 shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && (
                            <Check
                              className="w-3 h-3"
                              style={{ color: preset.hex === "#111111" || preset.hex === "#0C1F5E" ? "#fff" : "#fff" }}
                            />
                          )}
                        </span>
                        <span className={isSelected ? "font-semibold" : "text-muted-foreground"}>
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {/* Campos hidden para o RHF */}
                <input type="hidden" {...register("color")} />
                <input type="hidden" {...register("colorHex")} />
                {(errors.color || errors.colorHex) && (
                  <p className="text-xs text-destructive">
                    {errors.color?.message ?? errors.colorHex?.message}
                  </p>
                )}
              </div>
              {/* Linha 2: Tamanho + Estoque */}
              <div className="grid grid-cols-2 gap-4">
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
                  <Label>Estoque</Label>
                  <Input type="number" min="0" {...register("stock", { valueAsNumber: true })} />
                </div>
              </div>

              {/* Linha 3: Toggles */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-3 rounded-lg border px-4 py-3 flex-1 min-w-40">
                  <Switch
                    checked={hasReflective}
                    onCheckedChange={(v) => setValue("hasReflective", v)}
                  />
                  <div>
                    <p className="text-sm font-medium">Faixa refletiva</p>
                    <p className="text-xs text-muted-foreground">{hasReflective ? "Com faixa" : "Sem faixa"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border px-4 py-3 flex-1 min-w-40">
                  <Switch
                    checked={hasSidePocket}
                    onCheckedChange={(v) => setValue("hasSidePocket", v)}
                  />
                  <div>
                    <p className="text-sm font-medium">Bolso lateral</p>
                    <p className="text-xs text-muted-foreground">{hasSidePocket ? "Com bolso" : "Sem bolso"}</p>
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

"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import type { ProductImage } from "@/db/schema";
import { saveImageRecord, deleteImage, setPrimaryImage } from "../actions";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Trash2, Star, Upload } from "lucide-react";

export function ImagesTab({
  productId,
  images,
}: {
  productId: number;
  images: ProductImage[];
}) {
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const altRef = useRef<HTMLInputElement>(null);

  function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecione um arquivo.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo: 8MB.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        toast.error("Erro no upload. Tente novamente.");
        return;
      }

      const { url } = (await res.json()) as { url: string };
      const alt = altRef.current?.value ?? "";
      const color = colorRef.current?.value ?? null;

      const saved = await saveImageRecord(productId, url, alt, color);
      if (!saved.ok) {
        toast.error(saved.error ?? "Erro ao salvar imagem.");
        return;
      }

      toast.success("Imagem enviada!");
      if (fileRef.current) fileRef.current.value = "";
      if (altRef.current) altRef.current.value = "";
      if (colorRef.current) colorRef.current.value = "";
    });
  }

  function handleDelete(img: ProductImage) {
    if (!confirm("Excluir esta imagem?")) return;
    startTransition(async () => {
      const res = await deleteImage(img.id, productId, img.url);
      if (!res.ok) toast.error(res.error ?? "Erro ao excluir.");
      else toast.success("Imagem excluída.");
    });
  }

  function handleSetPrimary(imageId: number) {
    startTransition(async () => {
      const res = await setPrimaryImage(imageId, productId);
      if (!res.ok) toast.error(res.error ?? "Erro.");
      else toast.success("Imagem principal definida.");
    });
  }

  return (
    <div className="space-y-6">
      {/* Grid de imagens */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group border rounded-lg overflow-hidden bg-muted aspect-square">
              <Image
                src={img.url}
                alt={img.alt ?? ""}
                fill
                className="object-cover"
                sizes="200px"
              />
              {img.isPrimary && (
                <Badge className="absolute top-2 left-2 text-xs bg-primary">Principal</Badge>
              )}
              {img.color && (
                <Badge variant="outline" className="absolute bottom-2 left-2 text-xs bg-background/80">
                  {img.color}
                </Badge>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.isPrimary && (
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    title="Definir como principal"
                    disabled={pending}
                    onClick={() => handleSetPrimary(img.id)}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  title="Excluir imagem"
                  disabled={pending}
                  onClick={() => handleDelete(img)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma imagem cadastrada ainda.
        </p>
      )}

      {/* Upload */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold">Enviar nova imagem</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="img-file">Arquivo (máx. 8MB)</Label>
            <Input
              id="img-file"
              type="file"
              accept="image/*"
              ref={fileRef}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="img-color">Cor (opcional)</Label>
            <Input id="img-color" placeholder="Azul" ref={colorRef} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="img-alt">Descrição (alt)</Label>
            <Input id="img-alt" placeholder="Calça azul frente" ref={altRef} />
          </div>
        </div>
        <Button onClick={handleUpload} disabled={pending} variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          {pending ? "Enviando…" : "Enviar imagem"}
        </Button>
      </div>
    </div>
  );
}

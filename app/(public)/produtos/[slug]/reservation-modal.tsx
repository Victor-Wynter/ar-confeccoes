"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reservationSchema, type ReservationInput } from "@/lib/validations";
import { createReservation } from "./actions";
import type { ReservationItem } from "@/db/schema";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, MessageCircle } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  productName: string;
  items: ReservationItem[];
  totalCents: number;
}

type Step = "form" | "success";

export function ReservationModal({
  open,
  onClose,
  productName,
  items,
  totalCents,
}: Props) {
  const [step, setStep] = useState<Step>("form");
  const [result, setResult] = useState<{
    code: string;
    whatsappUrl: string;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
  });

  function handleClose() {
    onClose();
    // Reseta estado após animação de fechamento
    setTimeout(() => {
      setStep("form");
      setResult(null);
      reset();
    }, 300);
  }

  function onSubmit(data: ReservationInput) {
    startTransition(async () => {
      const res = await createReservation({ formData: data, items, totalCents });
      if (!res.ok) {
        toast.error(res.error ?? "Erro ao criar reserva.");
        return;
      }
      setResult({ code: res.code, whatsappUrl: res.whatsappUrl });
      setStep("success");
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        {step === "form" ? (
          <>
            <DialogHeader>
              <DialogTitle>Reservar produto</DialogTitle>
              <DialogDescription>
                {productName} — sem estoque. Deixe seus dados e entraremos em
                contato quando disponível.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-4 mt-2"
            >
              {/* Nome */}
              <div className="space-y-1.5">
                <Label htmlFor="res-name">Nome *</Label>
                <Input
                  id="res-name"
                  placeholder="Seu nome completo"
                  autoComplete="name"
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-xs text-destructive">
                    {errors.customerName.message}
                  </p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-1.5">
                <Label htmlFor="res-phone">Telefone *</Label>
                <Input
                  id="res-phone"
                  placeholder="(11) 99999-9999"
                  autoComplete="tel"
                  inputMode="tel"
                  {...register("customerPhone")}
                />
                {errors.customerPhone && (
                  <p className="text-xs text-destructive">
                    {errors.customerPhone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="res-email">
                  Email{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="res-email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...register("customerEmail")}
                />
                {errors.customerEmail && (
                  <p className="text-xs text-destructive">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label htmlFor="res-notes">
                  Observações{" "}
                  <span className="text-muted-foreground font-normal">
                    (opcional)
                  </span>
                </Label>
                <Textarea
                  id="res-notes"
                  placeholder="Alguma informação adicional..."
                  rows={2}
                  {...register("notes")}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={pending} className="flex-1">
                  {pending ? "Enviando…" : "Confirmar reserva"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={pending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Reserva confirmada!
              </DialogTitle>
            </DialogHeader>

            <div className="text-center py-4 space-y-2">
              <p className="text-muted-foreground text-sm">
                Código da sua reserva
              </p>
              <p className="text-3xl font-bold font-mono text-primary">
                {result?.code}
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Anotamos sua reserva. Quer confirmar direto com o Amilton agora?
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={result?.whatsappUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2 justify-center"
                )}
              >
                <MessageCircle className="h-5 w-5" />
                Falar no WhatsApp
              </a>
              <Button variant="ghost" onClick={handleClose} className="w-full">
                Fechar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

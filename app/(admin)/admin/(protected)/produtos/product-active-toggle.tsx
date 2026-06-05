"use client";

import { Switch } from "@/components/ui/switch";
import { useTransition } from "react";
import { toggleProductActive } from "./actions";
import { toast } from "sonner";

export function ProductActiveToggle({ id, active }: { id: number; active: boolean }) {
  const [pending, startTransition] = useTransition();

  function handle(checked: boolean) {
    startTransition(async () => {
      const res = await toggleProductActive(id, checked);
      if (!res.ok) toast.error(res.error ?? "Erro ao atualizar.");
    });
  }

  return (
    <Switch
      checked={active}
      onCheckedChange={handle}
      disabled={pending}
      aria-label={active ? "Desativar produto" : "Ativar produto"}
    />
  );
}

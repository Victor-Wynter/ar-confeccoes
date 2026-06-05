"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTransition } from "react";

interface SignOutButtonProps {
  action: () => Promise<void>;
}

export function SignOutButton({ action }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
      disabled={pending}
      onClick={() => startTransition(() => action())}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Saindo…" : "Sair"}
    </Button>
  );
}

"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { loginSchema } from "@/lib/validations";

export async function loginAction(values: unknown) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false as const, error: "Dados inválidos." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/admin",
    });
    return { ok: true as const };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false as const, error: "Email ou senha inválidos." };
    }
    // Re-lança o NEXT_REDIRECT (sucesso) e qualquer erro inesperado.
    throw error;
  }
}

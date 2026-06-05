"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { updateStatusSchema } from "@/lib/validations";

export async function updateReservationStatus(raw: unknown) {
  const parsed = updateStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Dados inválidos." };
  }
  const { id, status } = parsed.data;

  try {
    await db
      .update(reservations)
      .set({ status, viewed: true })
      .where(eq(reservations.id, id));

    revalidatePath("/admin/reservas");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao atualizar reserva." };
  }
}

export async function markAllViewed() {
  try {
    await db
      .update(reservations)
      .set({ viewed: true })
      .where(eq(reservations.viewed, false));

    revalidatePath("/admin/reservas");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Erro ao marcar como vistas." };
  }
}

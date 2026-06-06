"use server";

import { db } from "@/db";
import { reservations, type ReservationItems, type ReservationItem } from "@/db/schema";
import { reservationSchema, type ReservationInput } from "@/lib/validations";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { buildWhatsAppLink, buildReservationMessage } from "@/lib/whatsapp";

interface CreateReservationParams {
  formData: ReservationInput;
  items: ReservationItem[];
  totalCents: number;
}

export async function createReservation(
  params: CreateReservationParams
): Promise<{ ok: true; code: string; whatsappUrl: string } | { ok: false; error: string }> {
  const parsed = reservationSchema.safeParse(params.formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  if (!params.items || params.items.length === 0) {
    return { ok: false, error: "Nenhum item na reserva." };
  }

  try {
    const itemsPayload: ReservationItems = { v: 1, data: params.items };

    // Insere primeiro para obter o ID (evita race condition no código)
    const [inserted] = await db
      .insert(reservations)
      .values({
        code: "TEMP",
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail || null,
        items: itemsPayload,
        totalCents: params.totalCents,
        notes: parsed.data.notes || null,
        status: "pending",
        viewed: false,
      })
      .returning({ id: reservations.id });

    const code = `RES-${String(inserted.id).padStart(4, "0")}`;

    // Atualiza com código real
    await db
      .update(reservations)
      .set({ code })
      .where(eq(reservations.id, inserted.id));

    const whatsappUrl = buildWhatsAppLink({
      message: buildReservationMessage({
        code,
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        customerEmail: parsed.data.customerEmail,
        items: params.items,
        totalCents: params.totalCents,
        notes: parsed.data.notes,
      }),
      reservationCode: code,
    });

    revalidatePath("/admin/reservas");

    return { ok: true, code, whatsappUrl };
  } catch (err) {
    console.error("[createReservation]", err);
    return { ok: false, error: "Erro ao criar reserva. Tente novamente." };
  }
}

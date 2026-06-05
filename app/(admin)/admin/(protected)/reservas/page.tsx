import { db } from "@/db";
import { reservations } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { markAllViewed } from "./actions";
import { ReservationList } from "./reservation-list";
import type { ReservationStatus } from "@/db/schema";

export const metadata = { title: "Reservas | Admin" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReservasPage({ searchParams }: Props) {
  // Marca tudo como visto ao abrir a página
  await markAllViewed();

  const { status } = await searchParams;
  const validStatuses: ReservationStatus[] = ["pending", "contacted", "fulfilled", "cancelled"];
  const activeStatus = validStatuses.includes(status as ReservationStatus)
    ? (status as ReservationStatus)
    : undefined;

  const all = await db
    .select()
    .from(reservations)
    .where(activeStatus ? eq(reservations.status, activeStatus) : undefined)
    .orderBy(desc(reservations.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Reservas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {all.length} reserva{all.length !== 1 ? "s" : ""}
          {activeStatus ? ` com status "${activeStatus}"` : ""}
        </p>
      </div>

      <ReservationList reservations={all} activeStatus={activeStatus} />
    </div>
  );
}

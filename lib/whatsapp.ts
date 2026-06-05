/**
 * Monta link wa.me com mensagem pre-preenchida.
 * Gotcha do AGENTS.md: wa.me tem limite ~2000 chars no param text.
 * Usamos 1800 como teto seguro; se passar, trunca e adiciona referência ao código.
 */

const MAX_CHARS = 1800;

interface WhatsAppLinkOptions {
  phone?: string;       // sobrescreve NEXT_PUBLIC_WHATSAPP_NUMBER
  message: string;
  reservationCode?: string; // fallback se mensagem for truncada
}

export function buildWhatsAppLink({
  phone,
  message,
  reservationCode,
}: WhatsAppLinkOptions): string {
  const number = phone ?? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";

  let text = message;

  if (text.length > MAX_CHARS) {
    const fallback = reservationCode
      ? `\n\n[mensagem truncada — informe o código ${reservationCode}]`
      : "\n\n[mensagem truncada]";
    text = text.slice(0, MAX_CHARS - fallback.length) + fallback;
  }

  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/**
 * Monta mensagem de reserva para enviar ao admin via WhatsApp.
 */
export interface ReservationMessageParams {
  code: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  items: Array<{
    productName: string;
    color: string;
    size: string;
    hasReflective: boolean;
    qty: number;
    unitPriceCents: number;
  }>;
  totalCents: number;
  notes?: string | null;
}

export function buildReservationMessage(p: ReservationMessageParams): string {
  const lines: string[] = [
    `*Nova Reserva — ${p.code}*`,
    ``,
    `*Cliente:* ${p.customerName}`,
    `*Telefone:* ${p.customerPhone}`,
  ];

  if (p.customerEmail) {
    lines.push(`*Email:* ${p.customerEmail}`);
  }

  lines.push(``);
  lines.push(`*Itens:*`);

  for (const item of p.items) {
    const reflective = item.hasReflective ? " c/ refletiva" : "";
    const unit = (item.unitPriceCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    lines.push(
      `• ${item.qty}x ${item.productName} — ${item.color} Tam.${item.size}${reflective} (${unit}/un)`
    );
  }

  const total = (p.totalCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  lines.push(``);
  lines.push(`*Total:* ${total}`);

  if (p.notes) {
    lines.push(``);
    lines.push(`*Observações:* ${p.notes}`);
  }

  lines.push(``);
  lines.push(`_Reserva feita pelo site AR Confecções_`);

  return lines.join("\n");
}

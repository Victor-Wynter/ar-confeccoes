import type { Metadata } from "next";
import { MessageCircle, Clock, MapPin, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contato | AR Confecções",
  description:
    "Entre em contato com a AR Confecções. Atendemos via WhatsApp de segunda a sábado.",
};

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

const CONTACTS = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "(11) 99133-5307",
    href: `https://wa.me/${PHONE}`,
    cta: "Enviar mensagem",
    target: "_blank",
  },
  {
    icon: Mail,
    label: "E-mail",
    value: "amilton@arconfeccoes.com.br",
    href: "mailto:amilton@arconfeccoes.com.br",
    cta: "Enviar e-mail",
    target: undefined,
  },
  {
    icon: MapPin,
    label: "Localização",
    value: "São Paulo — SP",
    href: undefined,
    cta: undefined,
    target: undefined,
  },
  {
    icon: Clock,
    label: "Horário",
    value: "Segunda a Sábado, 8h às 17h",
    href: undefined,
    cta: undefined,
    target: undefined,
  },
] as const;

export default function ContatoPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-primary">Contato</h1>
        <p className="text-muted-foreground mt-2">
          Atendimento via WhatsApp, de segunda a sábado.
        </p>
      </div>

      <div className="space-y-4">
        {CONTACTS.map(({ icon: Icon, label, value, href, cta, target }) => (
          <div
            key={label}
            className="flex items-start gap-4 p-5 rounded-xl border bg-card"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {label}
              </p>
              <p className="font-medium mt-0.5 break-all">{value}</p>
            </div>
            {href && cta && (
              <a
                href={href}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "shrink-0 self-center"
                )}
              >
                {cta}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* WhatsApp destaque */}
      <div className="mt-10 bg-whatsapp/5 border border-whatsapp/20 rounded-2xl p-6 sm:p-8 text-center">
        <MessageCircle className="h-10 w-10 text-whatsapp mx-auto mb-3" />
        <h2 className="text-lg font-semibold">
          A forma mais rápida de nos contatar
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
          Resposta em minutos durante o horário comercial.
          Pedidos, dúvidas e orçamentos por aqui.
        </p>
        <a
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2 mt-6"
          )}
        >
          <MessageCircle className="h-5 w-5" />
          Abrir WhatsApp
        </a>
      </div>
    </div>
  );
}

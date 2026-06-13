import type { Metadata } from "next";
import { Shield, Factory, Users, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre | AR Confecções",
  description:
    "Conheça a AR Confecções de Uniformes — fabricante de calças brim profissionais em São Paulo.",
};

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export default function SobrePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-12">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Sobre a AR Confecções</h1>
        <p className="text-muted-foreground mt-2">
          Fabricante de uniformes profissionais de alta durabilidade
        </p>
      </div>

      {/* Sobre a empresa */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Factory className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">A empresa</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          A AR Confecções de Uniformes é uma fabricante paulistana especializada
          em calças de trabalho. Produzimos com
          tecido brim pesado de alta resistência, indicado para ambientes
          exigentes e jornadas longas.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Nossa linha inclui calças com e sem faixa refletiva, atendendo tanto
          trabalhadores individuais quanto empresas e comércios que necessitam
          de uniformes em quantidade.
        </p>
      </section>

      {/* Qualidade */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Qualidade e materiais</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Trabalhamos com brim 100% algodão e brim misto, selecionados por
          gramatura e resistência ao desgaste. As faixas refletivas atendem aos
          requisitos de alta visibilidade para ambientes de trabalho, garantindo mais
          segurança ao trabalhador.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Toda a confecção é feita em São Paulo, permitindo controle rigoroso
          sobre cada etapa do processo produtivo.
        </p>
      </section>

      {/* Atendimento */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Atendimento direto</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          Atendemos pessoalmente cada cliente via WhatsApp. Sem
          intermediários — você fala direto com quem fabrica. Isso garante
          respostas rápidas, negociação transparente e agilidade na entrega.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Para pedidos em lote (empresas, indústrias, comércios),
          negociamos prazo, volume e condições diretamente.
        </p>
      </section>

      {/* CTA */}
      <div className="bg-muted/40 rounded-xl border p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold">Tem alguma dúvida?</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Entre em contato diretamente pelo WhatsApp.
          </p>
        </div>
        <a
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants(),
            "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 gap-2 shrink-0"
          )}
        >
          <MessageCircle className="h-4 w-4" />
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}

import Link from "next/link";

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          {/* Brand */}
          <div className="space-y-2">
            <h3 className="font-bold text-primary">AR Confecções</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Fabricante de uniformes profissionais para construção civil,
              direto de São Paulo.
            </p>
          </div>

          {/* Nav links */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Navegação
            </h4>
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/produtos"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Catálogo
              </Link>
              <Link
                href="/sobre"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Sobre nós
              </Link>
              <Link
                href="/contato"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Contato
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-2">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Contato
            </h4>
            <div className="space-y-1.5 text-muted-foreground text-xs">
              <p>São Paulo — SP</p>
              {PHONE && (
                <a
                  href={`https://wa.me/${PHONE}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:text-foreground transition-colors"
                >
                  (11) 99133-5307
                </a>
              )}
              <p>Seg–Sáb, 8h–17h</p>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 text-center text-xs text-muted-foreground">
          © 2025 AR Confecções de Uniformes. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

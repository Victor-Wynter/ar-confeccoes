"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Lock, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LINKS = [
  { href: "/produtos", label: "Produtos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
] as const;

const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

// Altura aproximada do hero (px) — depois disto o fundo vira branco
const HERO_THRESHOLD = 520;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > HERO_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Só aplica glass transparente na home; demais páginas já começam sobre fundo branco
  const isHome = pathname === "/";
  const transparent = isHome && !scrolled;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-4 py-3 pointer-events-none">
      <div
        className={cn(
          "max-w-6xl mx-auto rounded-2xl px-5 h-14 flex items-center gap-4 pointer-events-auto transition-all duration-300",
          transparent
            ? "bg-white/5 backdrop-blur-2xl border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
            : "bg-white/90 backdrop-blur-xl border border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.1)]"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-col leading-tight mr-auto shrink-0">
          <span className={cn("font-bold text-sm transition-colors duration-300", transparent ? "text-white" : "text-primary")}>
            AR Confecções
          </span>
          <span className={cn("text-[10px] hidden sm:block transition-colors duration-300", transparent ? "text-white/45" : "text-muted-foreground")}>
            Uniformes de trabalho
          </span>
        </Link>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200",
                transparent
                  ? pathname.startsWith(href)
                    ? "text-white bg-white/10"
                    : "text-white/65 hover:text-white hover:bg-white/8"
                  : pathname.startsWith(href)
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Admin */}
        <Link
          href="/admin/login"
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 text-sm transition-colors duration-200",
            transparent ? "text-white/45 hover:text-white/80" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Lock className="h-3 w-3" />
          Admin
        </Link>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/${PHONE}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20bc59] text-white text-sm font-semibold transition-colors shadow-sm shadow-[#25D366]/30 shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>

        {/* Mobile menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                transparent ? "text-white/70 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Menu className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {LINKS.map(({ href, label }) => (
                <DropdownMenuItem key={href} onClick={() => router.push(href)}>
                  {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={() => window.open(`https://wa.me/${PHONE}`, "_blank")}>
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/login")}>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Admin
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

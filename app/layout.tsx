import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "AR Confecções de Uniformes",
    template: "%s | AR Confecções",
  },
  description:
    "Fábrica de calças de uniforme profissional em São Paulo. Brim pesado, faixa refletiva, tamanhos P ao EXG. Atendimento direto pelo WhatsApp.",
  openGraph: {
    siteName: "AR Confecções de Uniformes",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

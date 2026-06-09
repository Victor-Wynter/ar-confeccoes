"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const COLORS = [
  {
    id: "cinza",
    label: "Cinza",
    hex: "#6B7280",
    src: "/hero/01-3D-sem-fundo.png",
  },
  {
    id: "preto",
    label: "Preto",
    hex: "#1a1a1a",
    src: "/hero/02-3D-sem-fundo.png",
  },
  {
    id: "azul-royal",
    label: "Azul Royal",
    hex: "#2554C7",
    src: "/hero/03-3D-sem-fundo.png",
  },
  {
    id: "azul-marinho",
    label: "Azul Marinho",
    hex: "#1B2A6B",
    src: "/hero/04-3D-sem-fundo.png",
  },
] as const;

type ColorId = (typeof COLORS)[number]["id"];

export function HeroColorSwitcher() {
  const [active, setActive] = useState<ColorId>("cinza");

  const current = COLORS.find((c) => c.id === active)!;

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Image */}
      <div className="relative w-72 h-96 sm:w-80 sm:h-[440px] lg:w-[380px] lg:h-[500px] drop-shadow-2xl">
        {COLORS.map((color) => (
          <Image
            key={color.id}
            src={color.src}
            alt={`Calça cargo ${color.label}`}
            fill
            className={cn(
              "object-contain transition-opacity duration-300",
              color.id === active ? "opacity-100" : "opacity-0"
            )}
            priority={color.id === "cinza"}
            sizes="(max-width: 640px) 288px, (max-width: 1024px) 320px, 380px"
          />
        ))}
      </div>

      {/* Color selector */}
      <div className="flex gap-5 items-start">
        {COLORS.map((color) => (
          <button
            key={color.id}
            onClick={() => setActive(color.id)}
            aria-label={`Cor ${color.label}`}
            aria-pressed={color.id === active}
            className="flex flex-col items-center gap-1.5 group"
          >
            <span
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-all duration-200",
                color.id === active
                  ? "border-white scale-110 shadow-lg shadow-black/30"
                  : "border-white/30 group-hover:border-white/70 group-hover:scale-105"
              )}
              style={{ backgroundColor: color.hex }}
            />
            <span
              className={cn(
                "text-[11px] font-medium transition-colors duration-200 text-center leading-tight max-w-[60px]",
                color.id === active
                  ? "text-white"
                  : "text-white/50 group-hover:text-white/80"
              )}
            >
              {color.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

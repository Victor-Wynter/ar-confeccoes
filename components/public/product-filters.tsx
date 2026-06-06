"use client";

import { useRouter, usePathname } from "next/navigation";

interface ColorOption {
  color: string;
  colorHex: string;
}

interface Props {
  availableColors: ColorOption[];
  hasReflectiveOption: boolean;
  activeCor?: string;
  activeRefletiva?: boolean;
}

export function ProductFilters({
  availableColors,
  hasReflectiveOption,
  activeCor,
  activeRefletiva,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  function applyFilter(updates: { cor?: string | null; refletiva?: boolean }) {
    const params = new URLSearchParams();
    const cor = "cor" in updates ? updates.cor : activeCor;
    const refletiva = "refletiva" in updates ? updates.refletiva : activeRefletiva;
    if (cor) params.set("cor", cor);
    if (refletiva) params.set("refletiva", "sim");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasActiveFilter = activeCor || activeRefletiva;

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Color filter */}
      {availableColors.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Cor:</span>
          <div className="flex gap-2">
            {availableColors.map(({ color, colorHex }) => (
              <button
                key={color}
                title={color}
                onClick={() =>
                  applyFilter({ cor: activeCor === color ? null : color })
                }
                className={[
                  "w-7 h-7 rounded-full border-2 transition-all",
                  activeCor === color
                    ? "border-primary scale-110 shadow-sm"
                    : "border-transparent hover:border-muted-foreground/30",
                ].join(" ")}
                style={{ backgroundColor: colorHex }}
              />
            ))}
          </div>
          {activeCor && (
            <span className="text-xs text-muted-foreground">{activeCor}</span>
          )}
        </div>
      )}

      {/* Reflective filter */}
      {hasReflectiveOption && (
        <button
          onClick={() => applyFilter({ refletiva: !activeRefletiva })}
          className={[
            "text-sm px-3 py-1 rounded-full border transition-colors",
            activeRefletiva
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/30",
          ].join(" ")}
        >
          Com faixa refletiva
        </button>
      )}

      {/* Clear */}
      {hasActiveFilter && (
        <button
          onClick={() => router.replace(pathname)}
          className="text-xs text-muted-foreground hover:text-foreground underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

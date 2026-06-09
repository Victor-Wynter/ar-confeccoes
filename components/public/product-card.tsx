import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/format";

interface Props {
  slug: string;
  name: string;
  basePrice: number; // cents
  imgUrl: string | null;
  imgAlt: string | null;
  totalStock: number;
}

export function ProductCard({
  slug,
  name,
  basePrice,
  imgUrl,
  imgAlt,
  totalStock,
}: Props) {
  return (
    <Link
      href={`/produtos/${slug}`}
      className="group block rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={imgAlt ?? name}
            fill
            className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-muted-foreground text-sm">Sem imagem</span>
          </div>
        )}
        {totalStock === 0 && (
          <div className="absolute inset-0 bg-black/20 flex items-end p-3">
            <Badge
              variant="secondary"
              className="text-xs bg-background/90"
            >
              Esgotado
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2">
          {name}
        </h3>
        <p className="text-muted-foreground text-xs mt-1.5">A partir de</p>
        <p className="text-primary font-bold mt-0.5 text-base">
          {formatBRL(basePrice)}
        </p>
      </div>
    </Link>
  );
}

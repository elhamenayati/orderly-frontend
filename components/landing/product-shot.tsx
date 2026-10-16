import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductShotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

/** Marketing frame for real product screenshots — preserves aspect ratio. */
export function ProductShot({
  src,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 768px) 100vw, 560px",
}: ProductShotProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[#d5d0e8] bg-white shadow-[0_12px_40px_-18px_rgba(21,8,75,0.35)]",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={800}
        className="h-auto w-full object-cover object-top"
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
      />
    </div>
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

const ORDERLY_LOGO_SRC = "/images/brand/orderly-logo-white.png";

/** Default logo height (70% larger than the original h-8 / 32px). */
export const ORDERLY_LOGO_HEIGHT_CLASS = "h-[3.4rem]";

type OrderlyLogoProps = {
  className?: string;
  priority?: boolean;
  /** Use on dark backgrounds (e.g. sidebar) to show the white logo as-is. */
  inverse?: boolean;
};

export function OrderlyLogo({
  className,
  priority,
  inverse = false,
}: OrderlyLogoProps) {
  return (
    <Image
      src={ORDERLY_LOGO_SRC}
      alt="Orderly"
      width={238}
      height={82}
      className={cn(
        ORDERLY_LOGO_HEIGHT_CLASS,
        "w-auto object-contain object-right",
        !inverse && "brightness-0",
        className,
      )}
      priority={priority}
    />
  );
}

import Image from "next/image";
import { cn } from "@/lib/utils";

const ABRINAK_LOGO = { src: "/images/brand/abrinak-logo-v2.png", width: 944, height: 270 };
const ABRINAK_LOGO_WHITE = {
  src: "/images/brand/abrinak-logo-white-v2.png",
  width: 947,
  height: 274,
};
export const ABRINAK_MARK = { src: "/images/brand/abrinak-mark-v2.png", width: 952, height: 710 };

export const ABRINAK_LOGO_HEIGHT_CLASS = "h-[3.4rem]";

type AbrinakLogoProps = {
  className?: string;
  priority?: boolean;
  /** Dark backgrounds (e.g. sidebar): white wordmark. */
  inverse?: boolean;
  /** Symbol only, for tight spaces such as the collapsed sidebar. */
  markOnly?: boolean;
};

export function AbrinakLogo({
  className,
  priority,
  inverse = false,
  markOnly = false,
}: AbrinakLogoProps) {
  const asset = markOnly ? ABRINAK_MARK : inverse ? ABRINAK_LOGO_WHITE : ABRINAK_LOGO;

  return (
    <Image
      src={asset.src}
      alt="Abrinak"
      width={asset.width}
      height={asset.height}
      className={cn(
        ABRINAK_LOGO_HEIGHT_CLASS,
        "w-auto object-contain object-right",
        className,
      )}
      priority={priority}
    />
  );
}

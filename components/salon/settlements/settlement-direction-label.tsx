import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettlementDirection } from "@/types/domain";

type SettlementDirectionLabelProps = {
  direction: SettlementDirection;
  className?: string;
  arrowClassName?: string;
};

export function SettlementDirectionLabel({
  direction,
  className,
  arrowClassName,
}: SettlementDirectionLabelProps) {
  const from = direction === "salon_to_stylist" ? "سالن" : "آرایشگر";
  const to = direction === "salon_to_stylist" ? "آرایشگر" : "سالن";

  return (
    <span
      dir="rtl"
      className={cn(
        "inline-flex w-full items-center justify-end gap-1.5 text-end",
        className,
      )}
    >
      <span>{from}</span>
      <ArrowLeft
        className={cn("size-4 shrink-0 opacity-70", arrowClassName)}
        aria-hidden
      />
      <span>{to}</span>
    </span>
  );
}

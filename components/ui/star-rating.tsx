import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/format";

type StarRatingProps = {
  value: number;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function StarRating({
  value,
  showValue = false,
  size = "sm",
  className,
}: StarRatingProps) {
  const rounded = Math.round(value);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={cn(
              size === "sm" ? "size-3.5" : "size-4",
              index < rounded ? "fill-amber-400 text-amber-400" : "text-zinc-300"
            )}
          />
        ))}
      </div>
      {showValue ? (
        <span className="text-xs font-medium text-foreground">
          {formatRating(value)}
        </span>
      ) : null}
    </div>
  );
}

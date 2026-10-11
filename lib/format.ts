import { formatFaNumber, toFaDigits } from "@/lib/format/number";

export function formatPrice(toman: number) {
  return `${formatFaNumber(toman)} تومان`;
}

export function formatDuration(minutes: number) {
  return `${formatFaNumber(minutes)} دقیقه`;
}

export function formatRating(value: number) {
  const rounded = value.toFixed(1);
  return toFaDigits(rounded);
}

export function formatCount(value: number) {
  return formatFaNumber(value);
}

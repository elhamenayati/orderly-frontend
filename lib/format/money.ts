import { formatFaNumber } from "@/lib/format/number";

export function formatToman(amount: number) {
  return `${formatFaNumber(amount)} تومان`;
}

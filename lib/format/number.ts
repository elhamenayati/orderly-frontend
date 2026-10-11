const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toFaDigits(value: string) {
  return value.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)] ?? digit);
}

/** Deterministic fa-IR numerals (avoids Node vs browser Intl hydration drift). */
export function formatFaNumber(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  const [intPart, fracPart] = String(abs).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, "٬");
  const body = fracPart === undefined ? grouped : `${grouped}.${fracPart}`;
  return `${sign}${toFaDigits(body)}`;
}

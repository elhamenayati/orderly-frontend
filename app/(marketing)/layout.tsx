import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ابرینک | نرم‌افزار مدیریت سالن زیبایی",
  },
  description:
    "مدیریت رزروها، خدمات، آرایشگران، تسویه‌ها و امور مالی سالن در یک پنل ساده و یکپارچه با ابرینک.",
  openGraph: {
    title: "ابرینک | نرم‌افزار مدیریت سالن زیبایی",
    description:
      "مدیریت رزروها، خدمات، آرایشگران، تسویه‌ها و امور مالی سالن در یک پنل ساده و یکپارچه با ابرینک.",
    locale: "fa_IR",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-shell="marketing" className="min-h-full bg-background text-foreground">
      {children}
    </div>
  );
}

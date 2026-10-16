import { Cloud, Heart, Layers, Zap } from "lucide-react";

/** Exact copy from design source — no extra items or text */
const CARDS = [
  {
    icon: Zap,
    title: "ساده و سریع",
    text: "طراحی‌شده برای کار روزانه تیم سالن شما.",
  },
  {
    icon: Cloud,
    title: "تحت وب",
    text: "قابل استفاده از دستگاه‌های مختلف بدون وابستگی به سیستم خاص.",
  },
  {
    icon: Heart,
    title: "طراحی‌شده برای سالن",
    text: "پوشش کامل فرآیندهای واقعی سالن‌های زیبایی.",
  },
  {
    icon: Layers,
    title: "یکپارچه و شفاف",
    text: "رزروها، خدمات، آرایشگران و اطلاعات مالی، همه در یک جا",
  },
] as const;

export function WhyAbrinakSection() {
  return (
    <section
      id="about"
      className="scroll-mt-24 bg-[#f5f4fa] py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-[#0d0530] sm:text-3xl">
          چرا ابرینک؟
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-xl border border-[#e8e6f0] bg-white px-5 py-8 text-center shadow-[0_4px_18px_-12px_rgba(21,8,75,0.18)]"
            >
              <span className="inline-flex text-primary">
                <Icon className="size-8" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-base font-bold text-[#0d0530]">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-[#5c5878]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

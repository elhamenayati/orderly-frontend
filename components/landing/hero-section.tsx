import Image from "next/image";
import { Layers, Scissors, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LANDING_SHELL } from "@/lib/landing/shell";

/** Matches the rendered sticky header height (sm:pt-4 + 60px bar + borders); a smaller value leaves a gap above the hero. */
const HEADER_OFFSET = "lg:-mt-[78px]";
const COPY_TOP_PAD = "lg:pt-[102px]";

/** Bleed past shell margin to viewport left; slightly overlaps pattern for soft fade */
const SALON_BLEED =
  "lg:absolute lg:inset-y-0 lg:left-[calc((100%-100vw)/2)] lg:w-[calc(58%+(100vw-100%)/2)]";

/** Bleed past shell margin to viewport right; slightly overlaps salon for soft fade */
const PATTERN_BLEED =
  "pointer-events-none absolute inset-0 z-0 lg:inset-y-0 lg:left-auto lg:right-[calc((100%-100vw)/2)] lg:w-[calc(50%+(100vw-100%)/2)]";

/** Soft seam — fade each side into the other (no hard border) */
const SALON_FADE =
  "max-lg:[mask-image:none] lg:[-webkit-mask-image:linear-gradient(to_right,black_0%,black_72%,transparent_100%)] lg:[mask-image:linear-gradient(to_right,black_0%,black_72%,transparent_100%)]";
const PATTERN_FADE =
  "max-lg:[mask-image:none] lg:[-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_28%,black_100%)] lg:[mask-image:linear-gradient(to_right,transparent_0%,black_28%,black_100%)]";

const TRUST_ITEMS = [
  { icon: Zap, label: "ساده و سریع" },
  { icon: Scissors, label: "مناسب برای سالن‌ها" },
  { icon: Layers, label: "یکپارچه و شفاف" },
] as const;

const CTA_BTN =
  "h-11 min-w-[8.25rem] rounded-lg px-4 text-sm font-medium";

export function HeroSection() {
  return (
    <section className={`relative overflow-x-clip ${HEADER_OFFSET}`}>
      <div
        dir="ltr"
        className={`relative z-[2] ${LANDING_SHELL} min-h-[560px] sm:min-h-[620px] lg:min-h-[680px]`}
      >
        {/* RIGHT — pattern, soft-fades into the salon image */}
        <div aria-hidden className={`${PATTERN_BLEED} ${PATTERN_FADE}`}>
          <Image
            src="/images/landing/hero-pattern.jpg"
            alt=""
            fill
            priority
            className="object-fill"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        {/* LEFT — composite image, soft-fades into the pattern */}
        <div
          className={`relative z-[1] min-h-[420px] bg-[#f3f0f8] sm:min-h-[520px] lg:min-h-0 ${SALON_BLEED} ${SALON_FADE}`}
        >
          <Image
            src="/images/landing/hero-abrinak-vanity.jpg"
            alt="نمای داشبورد ابرینک روی لپ‌تاپ در فضای سالن"
            fill
            priority
            className="object-contain object-left"
            sizes="(max-width: 1024px) 100vw, 70vw"
          />
        </div>

        {/* RIGHT 45% — same items/layout; horizontally start-aligned with logo */}
        <div
          dir="rtl"
          className={`relative z-[2] flex items-center justify-center px-4 pb-10 pt-6 sm:px-5 sm:pt-8 lg:ml-auto lg:h-full lg:min-h-[680px] lg:w-[45%] lg:justify-start lg:pb-12 ${COPY_TOP_PAD}`}
        >
          <div className="flex w-full max-w-[450px] flex-col lg:max-w-[560px] gap-[18px] lg:gap-5">
            <p className="inline-flex w-fit rounded-lg bg-[#ebe6f7] px-3 py-1 text-[12px] font-medium text-primary">
              نرم‌افزار مدیریت سالن‌های زیبایی
            </p>

            <h1 className="text-[30px] font-extrabold leading-[1.25] tracking-tight text-[#0d0530] sm:text-[36px] lg:text-[38px]">
              ابرینک؛
              <br />
              مدیریت کامل سالن، در زمانی اندک
            </h1>

            <p className="max-w-[420px] text-[15px] leading-[1.9] text-[#5c5878] sm:text-base">
              رزروها، خدمات، آرایشگران و امور مالی سالن را ساده و یکپارچه مدیریت
              کنید.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <Button
                render={<a href="#demo" />}
                nativeButton={false}
                className={CTA_BTN}
              >
                درخواست دمو
              </Button>
              <Button
                render={<a href="#features" />}
                nativeButton={false}
                variant="outline"
                className={`${CTA_BTN} border-primary bg-transparent text-primary hover:bg-primary/5 hover:text-primary`}
              >
                مشاهده امکانات
              </Button>
            </div>

            <ul className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/50 pt-7">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2.5 text-[13.5px] text-[#5c5878]"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center text-primary">
                    <Icon className="size-[22px]" strokeWidth={1.75} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

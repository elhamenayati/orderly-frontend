import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LANDING_SHELL } from "@/lib/landing/shell";

const PRIMARY_BTN =
  "h-11 min-w-[170px] rounded-lg px-5 text-sm font-semibold";
const SECONDARY_BTN =
  "h-11 min-w-[140px] rounded-lg border-primary bg-white px-5 text-sm font-semibold text-primary hover:bg-primary/5 hover:text-primary";

export function DemoCTA() {
  return (
    <section className="scroll-mt-24 pb-12 pt-10 sm:pb-14 sm:pt-12">
      <div className={LANDING_SHELL}>
        {/* Compact horizontal CTA banner — physical LTR composition */}
        <div
          dir="ltr"
          className="relative overflow-hidden rounded-[12px] bg-[linear-gradient(90deg,#F8F6FF_0%,#F7F4FF_55%,#F9F7FF_100%)] lg:h-[200px]"
        >
          {/* Subtle left-side decorations */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
            <span className="absolute -left-10 top-1/2 size-44 -translate-y-1/2 rounded-full bg-[#c4b5e8]/25 blur-[2px]" />
            <span className="absolute left-16 -top-8 size-28 rounded-full border border-[#c4b5e8]/30" />
            <span className="absolute bottom-[-30px] left-28 size-36 rounded-full bg-[#d4c8f0]/20" />
            <span className="absolute left-4 top-[18%] h-24 w-24 rounded-full border border-[#b8a6e0]/25 opacity-40" />
          </div>

          {/* Copy — left / center, vertically centered (first on mobile) */}
          <div
            dir="rtl"
            className="relative z-[2] flex h-full flex-col justify-center px-6 py-8 sm:px-10 lg:max-w-[62%] lg:px-14 lg:py-0 xl:px-16"
          >
            <div className="max-w-[640px]">
              <h2 className="text-[26px] font-extrabold leading-[1.4] text-[#0d0530] sm:text-[28px] lg:text-[30px]">
                برای دیدن ابرینک در عمل، درخواست دمو ثبت کنید
              </h2>
              <p className="mt-2.5 text-[14px] font-normal leading-[1.8] text-[#5c5878] sm:text-[15px]">
                با یک جلسه کوتاه، ببینید چطور می‌توانیم مدیریت سالن شما را
                ساده‌تر و حرفه‌ای‌تر کنیم.
              </p>

              {/* Physical order from reference: secondary left, primary right */}
              <div
                dir="ltr"
                className="mt-4 flex flex-wrap items-center gap-3.5 sm:mt-5"
              >
                <Button
                  render={<a href="#features" />}
                  nativeButton={false}
                  variant="outline"
                  className={SECONDARY_BTN}
                >
                  مشاهده امکانات
                </Button>
                <Button
                  render={<a href="#demo" />}
                  nativeButton={false}
                  className={PRIMARY_BTN}
                >
                  درخواست دمو
                </Button>
              </div>
            </div>
          </div>

          {/* Salon image — right edge, full height (~35%); last on mobile */}
          <div className="relative z-[1] h-[200px] w-full lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[35%]">
            <Image
              src="/images/landing/cta-salon.jpg"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 35vw"
              aria-hidden
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[#F8F6FF] via-[#F8F6FF]/35 to-transparent lg:bg-gradient-to-r lg:from-[#F8F6FF] lg:via-[#F8F6FF]/85 lg:to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

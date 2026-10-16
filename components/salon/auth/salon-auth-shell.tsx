import Image from "next/image";

const ABRINAK_LOGO_SRC = "/images/brand/abrinak-logo-v2.png";

/** 70% transparent white; fades to fully transparent after 20% of radius. */
const BRAND_GLOW_STYLE = {
  background:
    "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0) 100%)",
} as const;

export function SalonAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-shell="salon"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-10"
    >
      <Image
        src="/images/salon/login-pattern.jpg"
        alt=""
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />

      <div className="pointer-events-none absolute top-8 start-6 z-20 hidden items-center gap-3 md:flex lg:top-12 lg:start-10">
        <span className="h-px w-12 bg-[#5c3396]/35" />
        <p className="text-sm font-medium text-[#5c3396]/80">
          همه چیز برای سالن حرفه‌ای شما
        </p>
      </div>

      <div className="pointer-events-none absolute bottom-8 end-6 z-20 hidden items-center gap-3 md:flex lg:bottom-12 lg:end-10">
        <p className="text-sm font-medium text-[#5c3396]/80">
          زیبایی، با مدیریت بهتر
        </p>
        <span className="h-px w-12 bg-[#5c3396]/35" />
      </div>

      <div className="relative z-10 w-full max-w-[1104px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(92,51,150,0.14)]">
        <div className="flex min-h-[672px] flex-col lg:flex-row">
          <main className="order-1 flex w-full flex-1 flex-col justify-center px-7 py-12 sm:px-12 sm:py-14 lg:order-1 lg:w-[46%] lg:px-14 lg:py-16">
            {children}
          </main>

          <aside className="relative order-2 hidden min-h-[672px] w-full overflow-hidden lg:order-2 lg:block lg:w-[54%]">
            <Image
              src="/images/salon/login-hero.jpg"
              alt=""
              fill
              priority
              className="object-cover object-[20%_center]"
              sizes="(max-width: 1024px) 0vw, 54vw"
            />
            <div className="absolute inset-0 flex translate-x-[18%] -translate-y-[25%] items-center justify-center px-12 text-center text-primary">
              <div className="relative inline-flex max-w-xs flex-col items-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 size-[min(300px,92%)] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={BRAND_GLOW_STYLE}
                />
                <Image
                  src={ABRINAK_LOGO_SRC}
                  alt="Abrinak"
                  width={264}
                  height={75}
                  priority
                  className="relative z-10 h-auto w-[min(264px,70%)] object-contain drop-shadow-md"
                />
                <div className="relative z-10 -translate-y-[13%]">
                  <h2 className="mt-5 text-[1.65rem] font-bold tracking-tight">
                    نرم افزار مدیریت سالن
                  </h2>
                  <p className="mt-1.5 max-w-xs text-[0.9375rem] leading-7 text-primary/80">
                    مدیریت ساده و دقیق نوبت، خدمات و آرایشگران
                  </p>
                </div>
              </div>
            </div>

            <p
              className="absolute bottom-10 start-8 text-sm font-medium tracking-wide text-primary/80"
              style={{ writingMode: "vertical-rl" }}
            >
              زیبایی در نظم شکوفا می‌شود
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

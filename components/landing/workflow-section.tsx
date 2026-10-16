import {
  ArrowLeft,
  CalendarDays,
  FileText,
  Scissors,
  UserRound,
} from "lucide-react";

/** Exact copy + steps from design source — no extra items or text */
const STEPS = [
  { icon: UserRound, label: "انتخاب مشتری" },
  { icon: Scissors, label: "انتخاب خدمات و آرایشگران" },
  { icon: CalendarDays, label: "رزرو نوبت" },
  { icon: FileText, label: "تسویه با مشتری" },
] as const;

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="relative scroll-mt-24 overflow-hidden bg-white py-16 sm:py-20"
    >
      {/* Soft side washes matching source */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-[radial-gradient(ellipse_at_left_center,rgba(124,92,191,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(ellipse_at_right_center,rgba(124,92,191,0.12),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold leading-snug text-[#0d0530] sm:text-[28px]">
            از رزرو خدمات تا تسویه با آرایشگران، همه در یک پنل
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#6b6588] sm:text-base">
            یک جریان ساده و یکپارچه برای مدیریت کامل سالن زیبایی شما، از اولین رزرو
            تا تسویه نهایی.
          </p>
        </div>

        <ol className="mt-14 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-center md:gap-0">
          {STEPS.map(({ icon: Icon, label }, index) => (
            <li
              key={label}
              className="flex w-full flex-col items-center md:w-auto md:flex-row md:items-center"
            >
              <div className="flex w-[9.5rem] flex-col items-center text-center sm:w-[11rem]">
                <span className="flex size-[72px] items-center justify-center rounded-full border border-primary/25 bg-white text-primary shadow-[0_8px_24px_-10px_rgba(88,56,160,0.45)] sm:size-20">
                  <Icon className="size-7 sm:size-8" strokeWidth={1.6} />
                </span>
                <p className="mt-4 text-sm font-semibold text-[#0d0530] sm:text-[15px]">
                  {label}
                </p>
              </div>

              {index < STEPS.length - 1 ? (
                <ArrowLeft
                  className="my-1 size-5 shrink-0 text-primary md:mx-3 md:mt-[-2.75rem] lg:mx-5"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

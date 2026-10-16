"use client";

import { Check } from "lucide-react";
import {
  BOOKING_STEPS,
  type BookingActiveStep,
} from "@/lib/salon/booking-steps";
import { cn } from "@/lib/utils";

type BookingStepsNavProps = {
  activeStep: BookingActiveStep;
  className?: string;
};

export function BookingStepsNav({ activeStep, className }: BookingStepsNavProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-x-5 gap-y-3", className)}
      aria-label="مراحل رزرو"
    >
      {BOOKING_STEPS.map((step) => {
        const completed =
          activeStep === 5 ? true : step.id < activeStep;
        const current = activeStep !== 5 && step.id === activeStep;
        const upcoming = activeStep !== 5 && step.id > activeStep;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2.5",
              upcoming && "opacity-45",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                (completed || current) &&
                  "bg-primary text-primary-foreground",
                upcoming &&
                  "border border-border bg-muted/60 text-muted-foreground",
              )}
              aria-current={current ? "step" : undefined}
            >
              {completed ? (
                <Check className="size-4 stroke-[2.5]" aria-hidden />
              ) : (
                step.id
              )}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                upcoming ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.title}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

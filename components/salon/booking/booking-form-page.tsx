"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarCheck, Loader2, Plus, Save } from "lucide-react";
import { bookingToDraft } from "@/lib/booking/draft-from-booking";
import { lineCategoriesFromDraft } from "@/lib/booking/line-categories";
import { findService } from "@/lib/booking/catalog";
import {
  createEmptyLine,
  describeSubmitLineIssues,
  lineErrorMessages,
  normalizeDraftForSubmit,
  recheckAllLines,
  updateLineStartTime,
} from "@/lib/booking/line-utils";
import {
  salonSubmitErrorMessages,
  submitSalonBookingAsync,
  updateSalonBookingAsync,
} from "@/lib/booking/submit-salon";
import { validateBookingDraft } from "@/lib/booking/validation";
import { defaultBookingDateIso } from "@/lib/format/jalali";
import { fetchBookingById, fetchBookings } from "@/lib/salon/bookings";
import { fetchCustomers } from "@/lib/salon/customers";
import {
  fetchSalonSettings,
  listScheduleExceptions,
} from "@/lib/salon/settings";
import { fetchServiceCategories, fetchServices } from "@/lib/salon/services";
import { fetchStylists } from "@/lib/salon/stylists";
import { ApiError, isApiEnabled } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { BookingSummarySidebar } from "@/components/salon/booking/booking-summary-sidebar";
import { CustomerPickerSection } from "@/components/salon/booking/customer-picker-section";
import { JalaliDateField } from "@/components/salon/booking/jalali-date-field";
import { ServiceLinesTable } from "@/components/salon/booking/service-lines-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingDraft, BookingServiceDraft } from "@/types/booking";
import type { Booking } from "@/types/domain";

export type BookingFormMode = "create" | "edit";

type SalonBookingFormProps = {
  mode: BookingFormMode;
  bookingId?: string;
};

function mapSubmitErrors(errors: string[]) {
  return errors
    .map((code) => {
      const base = code.split(":")[0];
      return (
        salonSubmitErrorMessages[code] ??
        salonSubmitErrorMessages[base] ??
        lineErrorMessages[base] ??
        code
      );
    })
    .join(" · ");
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {step}
      </span>
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

export function SalonBookingForm({ mode, bookingId }: SalonBookingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCustomerId = searchParams.get("customerId");

  const [loading, setLoading] = useState(true);
  const [existingBooking, setExistingBooking] = useState<Booking | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [lineCategories, setLineCategories] = useState<Record<string, string | null>>(
    {},
  );
  const [draft, setDraft] = useState<BookingDraft>(() => ({
    customerId: prefillCustomerId,
    bookingDate: defaultBookingDateIso(),
    notes: "",
    lines: [createEmptyLine(`line-${crypto.randomUUID()}`)],
  }));
  const [catalogReady, setCatalogReady] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await Promise.all([
          fetchSalonSettings(),
          listScheduleExceptions(),
          fetchStylists({ status: "active" }),
          fetchServiceCategories(),
          fetchServices(),
          fetchCustomers(),
          fetchBookings(),
        ]);
        if (cancelled) return;
        setCatalogReady(true);

        if (mode === "edit" && bookingId) {
          const booking = await fetchBookingById(bookingId);
          if (cancelled) return;
          if (!booking) {
            setExistingBooking(undefined);
            setLoading(false);
            return;
          }
          setExistingBooking(booking);
          const nextDraft = recheckAllLines(bookingToDraft(booking));
          setDraft(nextDraft);
          setLineCategories(lineCategoriesFromDraft(nextDraft));
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.status === 401) {
            clearSalonSession();
            window.location.href = "/salon/login";
            return;
          }
          setFormError("بارگذاری اطلاعات رزرو با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, bookingId]);

  const checkedDraft = useMemo(() => recheckAllLines(draft), [draft, catalogReady]);
  const canConfigureServices = Boolean(draft.customerId && draft.bookingDate);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mode === "edit" && !existingBooking) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">رزرو یافت نشد.</p>
        <Button
          render={<Link href="/salon/bookings" />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          بازگشت به لیست
        </Button>
      </div>
    );
  }

  if (mode === "edit" && existingBooking && existingBooking.status !== "confirmed") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">این رزرو قابل ویرایش نیست.</p>
        <Button
          render={<Link href={`/salon/bookings/${existingBooking.id}`} />}
          nativeButton={false}
          variant="outline"
          className="rounded-xl"
        >
          مشاهده جزئیات
        </Button>
      </div>
    );
  }

  const cancelHref =
    mode === "edit" && existingBooking
      ? `/salon/bookings/${existingBooking.id}`
      : "/salon/bookings";

  function updateDraft(next: BookingDraft) {
    const checked = recheckAllLines(next);
    draftRef.current = checked;
    setDraft(checked);
  }

  function updateLine(clientId: string, line: BookingServiceDraft) {
    if (line.serviceId) {
      const service = findService(line.serviceId);
      if (service) {
        setLineCategories((current) => ({
          ...current,
          [clientId]: service.categoryId,
        }));
      }
    }

    updateDraft({
      ...draft,
      lines: draft.lines.map((item) =>
        item.clientId === clientId ? line : item,
      ),
    });
  }

  function addLine() {
    const clientId = `line-${crypto.randomUUID()}`;
    setLineCategories((current) => ({ ...current, [clientId]: null }));
    updateDraft({
      ...draft,
      lines: [...draft.lines, createEmptyLine(clientId)],
    });
  }

  function removeLine(clientId: string) {
    setLineCategories((current) => {
      const next = { ...current };
      delete next[clientId];
      return next;
    });
    updateDraft({
      ...draft,
      lines: draft.lines.filter((item) => item.clientId !== clientId),
    });
  }

  async function handleSubmit() {
    setFormError(null);

    const sourceDraft =
      mode === "edit" && existingBooking
        ? { ...draftRef.current, bookingId: existingBooking.id }
        : draftRef.current;

    if (isApiEnabled()) {
      try {
        await fetchBookings({
          dateFrom: sourceDraft.bookingDate,
          dateTo: sourceDraft.bookingDate,
        });
      } catch {
        setFormError("بارگذاری رزروهای این تاریخ با خطا مواجه شد");
        return;
      }
    }

    const nextDraft = recheckAllLines(normalizeDraftForSubmit(sourceDraft));
    draftRef.current = nextDraft;
    setDraft(nextDraft);

    const lineIssue = describeSubmitLineIssues(nextDraft);
    if (lineIssue) {
      setFormError(lineIssue);
      return;
    }

    const validationErrors = validateBookingDraft(nextDraft);
    if (validationErrors.length > 0) {
      setFormError(mapSubmitErrors(validationErrors));
      return;
    }

    setSubmitting(true);

    const result =
      mode === "edit" && existingBooking
        ? await updateSalonBookingAsync({
            draft: { ...nextDraft, bookingId: existingBooking.id },
          })
        : await submitSalonBookingAsync({ draft: nextDraft });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(mapSubmitErrors(result.errors));
      return;
    }

    router.push(`/salon/bookings/${result.bookingId}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {mode === "create" ? "رزرو جدید" : "ویرایش رزرو"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "create"
            ? "ثبت نوبت جدید برای مشتری"
            : "ویرایش خدمات، آرایشگر و زمان هر ردیف"}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-5">
            <StepHeader step={1} title="انتخاب مشتری" />
            <CustomerPickerSection
              customerId={draft.customerId}
              onSelect={(customerId) =>
                updateDraft({ ...draft, customerId })
              }
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <StepHeader step={2} title="انتخاب تاریخ" />
            <JalaliDateField
              value={draft.bookingDate}
              onChange={(bookingDate) => {
                void (async () => {
                  if (isApiEnabled()) {
                    try {
                      await fetchBookings({
                        dateFrom: bookingDate,
                        dateTo: bookingDate,
                      });
                    } catch {
                      setFormError("بارگذاری رزروهای این تاریخ با خطا مواجه شد");
                      return;
                    }
                  }

                  updateDraft({
                    ...draftRef.current,
                    bookingDate,
                    lines: draftRef.current.lines.map((line) =>
                      updateLineStartTime(line, null),
                    ),
                  });
                })();
              }}
            />
          </section>

          <section
            className={cn(
              "rounded-2xl border border-border bg-card p-5",
              !canConfigureServices && "opacity-60",
            )}
          >
            <div className="mb-4 space-y-3">
              <StepHeader step={3} title="انتخاب خدمات" />
              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={addLine}
                  disabled={!canConfigureServices}
                >
                  <Plus className="size-4" />
                  افزودن خدمت
                </Button>
              </div>
            </div>

            {!canConfigureServices ? (
              <p className="mb-4 text-sm text-muted-foreground">
                ابتدا مشتری و تاریخ رزرو را انتخاب کنید.
              </p>
            ) : null}

            <ServiceLinesTable
              draft={checkedDraft}
              lineCategories={lineCategories}
              onLineCategoriesChange={setLineCategories}
              onLineChange={updateLine}
              onRemoveLine={removeLine}
              disabled={!canConfigureServices}
              catalogReady={catalogReady}
            />
          </section>

          {formError ? (
            <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="min-w-32"
              render={<Link href={cancelHref} />}
              nativeButton={false}
            >
              انصراف
            </Button>
            <Button
              type="button"
              className="min-w-40"
              disabled={submitting || !canConfigureServices}
              onClick={handleSubmit}
            >
              {mode === "create" ? (
                <CalendarCheck className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {submitting
                ? mode === "create"
                  ? "در حال ثبت..."
                  : "در حال ذخیره..."
                : mode === "create"
                  ? "ثبت رزرو"
                  : "ذخیره تغییرات"}
            </Button>
          </div>
        </div>

        <BookingSummarySidebar draft={checkedDraft} mode={mode} />
      </div>
    </div>
  );
}

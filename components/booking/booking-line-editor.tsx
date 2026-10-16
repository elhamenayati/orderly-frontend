"use client";

import { Clock, Trash2 } from "lucide-react";
import { bookingReadyStylistsForService, findService } from "@/lib/booking/catalog";
import { generateTimeSlots } from "@/lib/booking/slots";
import {
  lineErrorMessages,
  recheckLineAvailability,
  updateLineService,
  updateLineStylist,
  updateLineStartTime,
} from "@/lib/booking/line-utils";
import { getActiveServices } from "@/lib/salon/public-data";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { stylists } from "@/mock_ts/stylists";
import { formatDuration, formatPrice } from "@/lib/format";
import type { BookingDraft, BookingServiceDraft } from "@/types/booking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookingLineEditorProps = {
  line: BookingServiceDraft;
  lineIndex: number;
  draft: BookingDraft;
  canRemove: boolean;
  onChange: (line: BookingServiceDraft) => void;
  onRemove: () => void;
};

export function BookingLineEditor({
  line,
  lineIndex,
  draft,
  canRemove,
  onChange,
  onRemove,
}: BookingLineEditorProps) {
  const services = getActiveServices();
  const readyStylists = line.serviceId
    ? bookingReadyStylistsForService(line.serviceId, draft.bookingDate)
    : [];

  const duration = line.reservedDurationMinutes ?? 0;
  const slots =
    line.serviceId && line.stylistId && duration > 0
      ? generateTimeSlots({
          bookingDate: draft.bookingDate,
          stylistId: line.stylistId,
          durationMinutes: duration,
          bookingId: draft.bookingId,
          excludeClientId: line.clientId,
          draftLines: draft.lines
            .filter((item) => item.clientId !== line.clientId)
            .filter(
              (item) =>
                item.stylistId && item.startTime && item.reservedDurationMinutes,
            )
            .map((item) => ({
              stylistId: item.stylistId!,
              startTime: item.startTime!,
              reservedDurationMinutes: item.reservedDurationMinutes!,
            })),
        })
      : [];

  const checkedLine = recheckLineAvailability(line, draft);
  const displayErrors = checkedLine.errors.map(
    (code) => lineErrorMessages[code] ?? code,
  );

  function handleServiceChange(serviceId: string) {
    onChange(updateLineService(line, serviceId || null));
  }

  function handleStylistChange(stylistId: string) {
    if (!line.serviceId) return;
    onChange(updateLineStylist(line, line.serviceId, stylistId || null));
  }

  function handleTimeChange(startTime: string) {
    const next = updateLineStartTime(line, startTime || null);
    onChange(recheckLineAvailability(next, draft));
  }

  const service = line.serviceId ? findService(line.serviceId) : undefined;
  const stylist = line.stylistId
    ? stylists.find((item) => item.id === line.stylistId)
    : undefined;

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">خدمت {lineIndex + 1}</p>
          {canRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              aria-label="حذف خدمت"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">خدمت</span>
          <select
            value={line.serviceId ?? ""}
            onChange={(event) => handleServiceChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm"
          >
            <option value="">انتخاب خدمت</option>
            {services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">آرایشگر</span>
          <select
            value={line.stylistId ?? ""}
            onChange={(event) => handleStylistChange(event.target.value)}
            disabled={!line.serviceId}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm disabled:opacity-50"
          >
            <option value="">انتخاب آرایشگر</option>
            {readyStylists.map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>

        {service && stylist && duration > 0 ? (
          <div className="rounded-xl bg-rose-soft/70 px-3 py-2 text-xs text-muted-foreground">
            <p>{stylist.displayName}</p>
            <p className="mt-1 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDuration(duration)}
              </span>
              {line.estimatedPrice !== null ? (
                <span>از {formatPrice(line.estimatedPrice)}</span>
              ) : null}
            </p>
          </div>
        ) : null}

        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">ساعت شروع</span>
          <select
            value={line.startTime ?? ""}
            onChange={(event) => handleTimeChange(event.target.value)}
            disabled={!line.stylistId || slots.length === 0}
            className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm disabled:opacity-50"
          >
            <option value="">انتخاب ساعت</option>
            {slots.map((slot) => (
              <option key={slot.value} value={slot.value} disabled={!slot.available}>
                {formatTimeDisplay(slot.label)}
                {!slot.available ? " (پر)" : ""}
              </option>
            ))}
          </select>
        </label>

        {checkedLine.availability === "available" ? (
          <p className="text-xs text-emerald-700">زمان انتخاب‌شده آزاد است</p>
        ) : null}

        {line.serviceId && displayErrors.length > 0 ? (
          <ul className="space-y-1 text-xs text-destructive">
            {displayErrors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function WizardStepHeader({
  current,
  steps,
}: {
  current: number;
  steps: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, index) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <span
            className={cn(
              "flex size-8 items-center justify-center rounded-full text-sm font-medium",
              index <= current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
          <span
            className={cn(
              "text-center text-[11px]",
              index <= current ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

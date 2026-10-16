"use client";

import { GripVertical, Trash2 } from "lucide-react";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { bookingReadyStylistsForService } from "@/lib/booking/catalog";
import {
  describeTimeSlotBlocker,
  generateTimeSlots,
} from "@/lib/booking/slots";
import {
  inlineLineErrors,
  lineErrorMessages,
  recheckLineAvailability,
  updateLineDuration,
  updateLineService,
  updateLineStartTime,
  updateLineStylist,
} from "@/lib/booking/line-utils";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import {
  listActiveServices,
  listCategoriesWithActiveServices,
} from "@/lib/salon/services";
import { formatPrice } from "@/lib/format";
import type { BookingDraft, BookingServiceDraft } from "@/types/booking";
import { cn } from "@/lib/utils";

type ServiceLinesTableProps = {
  draft: BookingDraft;
  lineCategories: Record<string, string | null>;
  onLineCategoriesChange: (next: Record<string, string | null>) => void;
  onLineChange: (clientId: string, line: BookingServiceDraft) => void;
  onRemoveLine: (clientId: string) => void;
  disabled?: boolean;
  catalogReady?: boolean;
};

export function ServiceLinesTable({
  draft,
  lineCategories,
  onLineCategoriesChange,
  onLineChange,
  onRemoveLine,
  disabled = false,
  catalogReady = true,
}: ServiceLinesTableProps) {
  const selectableCategories = listCategoriesWithActiveServices();
  const catalogEmpty =
    catalogReady && !disabled && selectableCategories.length === 0;

  return (
    <div className="space-y-3">
      {catalogEmpty ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          دسته‌بندی خدمتی برای رزرو یافت نشد. از بخش «خدمات» حداقل یک خدمت فعال
          تعریف کنید.
        </p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-start font-medium">#</th>
            <th className="px-3 py-3 text-start font-medium">دسته‌بندی</th>
            <th className="px-3 py-3 text-start font-medium">خدمت</th>
            <th className="px-3 py-3 text-start font-medium">آرایشگر</th>
            <th className="px-3 py-3 text-start font-medium">زمان</th>
            <th className="px-3 py-3 text-start font-medium">مدت (دقیقه)</th>
            <th className="px-3 py-3 text-start font-medium">قیمت تخمینی</th>
            <th className="px-3 py-3 text-start font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {draft.lines.map((line, index) => (
            <ServiceLineRow
              key={line.clientId}
              line={line}
              lineIndex={index}
              draft={draft}
              categoryId={lineCategories[line.clientId] ?? null}
              selectableCategories={selectableCategories}
              canRemove={draft.lines.length > 1}
              disabled={disabled}
              onCategoryChange={(categoryId) => {
                onLineCategoriesChange({
                  ...lineCategories,
                  [line.clientId]: categoryId,
                });
                onLineChange(line.clientId, updateLineService(line, null));
              }}
              onLineChange={onLineChange}
              onRemove={() => onRemoveLine(line.clientId)}
            />
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function ServiceLineRow({
  line,
  lineIndex,
  draft,
  categoryId,
  selectableCategories,
  canRemove,
  disabled,
  onCategoryChange,
  onLineChange,
  onRemove,
}: {
  line: BookingServiceDraft;
  lineIndex: number;
  draft: BookingDraft;
  categoryId: string | null;
  selectableCategories: ReturnType<typeof listCategoriesWithActiveServices>;
  canRemove: boolean;
  disabled?: boolean;
  onCategoryChange: (categoryId: string | null) => void;
  onLineChange: (clientId: string, line: BookingServiceDraft) => void;
  onRemove: () => void;
}) {
  const categoryServices = listActiveServices(categoryId);
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
                item.stylistId &&
                item.startTime &&
                item.reservedDurationMinutes,
            )
            .map((item) => ({
              stylistId: item.stylistId!,
              startTime: item.startTime!,
              reservedDurationMinutes: item.reservedDurationMinutes!,
            })),
        })
      : [];

  const timeSlotHint =
    line.stylistId && slots.length === 0
      ? describeTimeSlotBlocker({
          bookingDate: draft.bookingDate,
          stylistId: line.stylistId,
          durationMinutes: duration,
        }) ?? "تمام بازه‌های زمانی این روز پر شده‌اند."
      : null;

  const checkedLine = recheckLineAvailability(line, draft);
  const rowErrors = inlineLineErrors(checkedLine.errors);
  const hasConflict =
    checkedLine.availability === "conflict" || rowErrors.length > 0;

  const selectClass =
    "h-10 min-w-[8rem] rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50";

  return (
    <tr
      className={cn(
        "border-b border-border align-top",
        hasConflict && "bg-destructive/5",
      )}
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 text-muted-foreground">
          <GripVertical className="size-4 opacity-40" />
          <span>{lineIndex + 1}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <select
          value={categoryId ?? ""}
          onChange={(event) =>
            onCategoryChange(event.target.value || null)
          }
          disabled={disabled}
          className={selectClass}
        >
          <option value="">دسته</option>
          {selectableCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <select
          value={line.serviceId ?? ""}
          onChange={(event) => {
            const serviceId = event.target.value || null;
            const next = updateLineService(line, serviceId);
            onLineChange(line.clientId, next);
          }}
          disabled={disabled || !categoryId}
          className={selectClass}
        >
          <option value="">خدمت</option>
          {categoryServices.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3">
        <select
          value={line.stylistId ?? ""}
          onChange={(event) => {
            if (!line.serviceId) return;
            onLineChange(
              line.clientId,
              updateLineStylist(line, line.serviceId, event.target.value || null),
            );
          }}
          disabled={disabled || !line.serviceId}
          className={selectClass}
        >
          <option value="">آرایشگر</option>
          {readyStylists.map((stylist) => (
            <option key={stylist.id} value={stylist.id}>
              {stylist.displayName}
            </option>
          ))}
        </select>
        {line.stylistId ? (
          <div className="mt-2 flex items-center gap-2">
            <StylistAvatar
              stylistId={line.stylistId}
              avatarPath={
                readyStylists.find((item) => item.id === line.stylistId)
                  ?.avatarPath
              }
              name={
                readyStylists.find((item) => item.id === line.stylistId)
                  ?.displayName ?? ""
              }
              size="xs"
            />
            <span className="text-xs text-muted-foreground">
              {
                readyStylists.find((item) => item.id === line.stylistId)
                  ?.displayName
              }
            </span>
          </div>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <select
          value={line.startTime ?? ""}
          onChange={(event) =>
            onLineChange(
              line.clientId,
              recheckLineAvailability(
                updateLineStartTime(line, event.target.value || null),
                draft,
              ),
            )
          }
          disabled={disabled || !line.stylistId || slots.length === 0}
          className={selectClass}
        >
          <option value="">ساعت</option>
          {slots.map((slot) => (
            <option key={slot.value} value={slot.value} disabled={!slot.available}>
              {formatTimeDisplay(slot.label)}
              {!slot.available ? " (پر)" : ""}
            </option>
          ))}
        </select>
        {timeSlotHint ? (
          <p className="mt-1 text-xs text-amber-800">{timeSlotHint}</p>
        ) : null}
        {rowErrors.length > 0 ? (
          <ul className="mt-1 space-y-0.5 text-xs text-destructive">
            {rowErrors.map((code) => (
              <li key={code}>{lineErrorMessages[code] ?? code}</li>
            ))}
          </ul>
        ) : null}
      </td>
      <td className="px-3 py-3">
        <input
          type="number"
          min={15}
          step={15}
          value={line.reservedDurationMinutes ?? ""}
          onChange={(event) => {
            const raw = event.target.value;
            const minutes = raw ? Number(raw) : null;
            onLineChange(
              line.clientId,
              updateLineDuration(line, minutes),
            );
          }}
          disabled={disabled || !line.serviceId}
          className="h-10 w-24 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
          dir="ltr"
        />
      </td>
      <td className="px-3 py-3 font-medium whitespace-nowrap">
        {line.estimatedPrice !== null ? formatPrice(line.estimatedPrice) : "—"}
      </td>
      <td className="px-3 py-3">
        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="flex size-9 items-center justify-center rounded-lg text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
            aria-label="حذف خدمت"
          >
            <Trash2 className="size-4" />
          </button>
        ) : null}
      </td>
    </tr>
  );
}

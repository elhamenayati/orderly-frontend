"use client";

import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Contact2,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { formatJalaliShort } from "@/lib/format/jalali";
import { resolveMediaUrl } from "@/lib/api/client";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { scheduleExceptionTypeLabels } from "@/lib/salon/schedule";
import {
  addScheduleExceptionAsync,
  deleteScheduleExceptionAsync,
  fetchSalonSettings,
  listScheduleExceptions,
  saveSalonSettings,
  salonGalleryAccept,
  updateScheduleExceptionAsync,
  uploadSalonGalleryImage,
  type ScheduleExceptionInput,
  type SalonSettingsData,
  type WeeklyHoursInput,
} from "@/lib/salon/settings";
import { DeleteExceptionDialog } from "@/components/salon/settings/delete-exception-dialog";
import { ScheduleExceptionDrawer } from "@/components/salon/settings/schedule-exception-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SalonScheduleException } from "@/types/domain";
import type { DayOfWeek } from "@/types/domain";

type WeeklyRowState = WeeklyHoursInput[number] & { label: string };

const DAY_LABELS: Record<number, string> = {
  6: "شنبه",
  0: "یکشنبه",
  1: "دوشنبه",
  2: "سه‌شنبه",
  3: "چهارشنبه",
  4: "پنجشنبه",
  5: "جمعه",
};

function withDayLabels(rows: WeeklyHoursInput): WeeklyRowState[] {
  return rows.map((row) => ({
    ...row,
    label: DAY_LABELS[row.dayOfWeek] ?? "—",
  }));
}

function emptySettings(): SalonSettingsData {
  return {
    profile: {
      brandName: "",
      phone: "",
      address: "",
      galleryImagePaths: [],
    },
    weeklyHours: [6, 0, 1, 2, 3, 4, 5].map((dayOfWeek) => ({
      dayOfWeek: dayOfWeek as DayOfWeek,
      active: false,
      startTime: "09:00",
      endTime: "19:00",
    })),
  };
}

export function SettingsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<SalonSettingsData>(
    () => emptySettings(),
  );
  const [brandName, setBrandName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [weeklyRows, setWeeklyRows] = useState<WeeklyRowState[]>(() =>
    withDayLabels(emptySettings().weeklyHours),
  );

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingException, setEditingException] =
    useState<SalonScheduleException | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SalonScheduleException | null>(null);
  const [exceptions, setExceptions] = useState<SalonScheduleException[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchSalonSettings();
        if (cancelled) return;
        applySettingsData(data);
        setInitialSnapshot(data);
        const items = await listScheduleExceptions();
        if (!cancelled) setExceptions(items);
      } catch {
        if (!cancelled) showToast("بارگذاری تنظیمات با خطا مواجه شد");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function applySettingsData(data: SalonSettingsData) {
    setBrandName(data.profile.brandName);
    setPhone(data.profile.phone);
    setAddress(data.profile.address);
    setGalleryImages(data.profile.galleryImagePaths);
    setWeeklyRows(withDayLabels(data.weeklyHours));
  }

  async function reloadExceptions() {
    const items = await listScheduleExceptions();
    setExceptions(items);
  }

  async function handleSaveAll() {
    setSaving(true);
    try {
      const payload: SalonSettingsData = {
        profile: {
          brandName,
          phone,
          address,
          galleryImagePaths: galleryImages,
        },
        weeklyHours: weeklyRows.map(({ dayOfWeek, active, startTime, endTime }) => ({
          dayOfWeek,
          active,
          startTime,
          endTime,
        })),
      };
      const savedData = await saveSalonSettings(payload);
      setInitialSnapshot(savedData);
      applySettingsData(savedData);
      setSaved(true);
      showToast("تغییرات ذخیره شد");
      window.setTimeout(() => setSaved(false), 2000);
    } catch {
      showToast("ذخیره تنظیمات با خطا مواجه شد");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    applySettingsData(initialSnapshot);
  }

  async function handleGalleryFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const path = await uploadSalonGalleryImage(file);
      setGalleryImages((items) => [...items, path]);
      showToast("تصویر اضافه شد — برای ذخیره دائمی «ذخیره تغییرات» را بزنید");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "بارگذاری تصویر با خطا مواجه شد",
      );
    } finally {
      setUploadingImage(false);
    }
  }

  function updateWeeklyRow(
    dayOfWeek: DayOfWeek,
    patch: Partial<WeeklyRowState>,
  ) {
    setWeeklyRows((rows) =>
      rows.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row,
      ),
    );
  }

  async function handleExceptionSave(input: ScheduleExceptionInput) {
    try {
      if (editingException) {
        await updateScheduleExceptionAsync(editingException.id, input);
        showToast("استثنا به‌روزرسانی شد");
      } else {
        await addScheduleExceptionAsync(input);
        showToast("استثنا با موفقیت اضافه شد");
      }
      setEditingException(null);
      await reloadExceptions();
    } catch {
      showToast("ذخیره استثنا با خطا مواجه شد");
    }
  }

  async function handleDeleteException() {
    if (!deleteTarget) return;
    try {
      await deleteScheduleExceptionAsync(deleteTarget.id);
      setDeleteTarget(null);
      await reloadExceptions();
      showToast("استثنا با موفقیت حذف شد");
    } catch {
      showToast("حذف استثنا با خطا مواجه شد");
    }
  }

  function exceptionDateLabel(item: SalonScheduleException) {
    if (item.dateTo && item.dateTo !== item.date) {
      return `${formatJalaliShort(item.date)} – ${formatJalaliShort(item.dateTo)}`;
    }
    return formatJalaliShort(item.date);
  }

  function exceptionDetails(item: SalonScheduleException) {
    if (item.type === "special_hours" && item.startTime && item.endTime) {
      return `${formatTimeDisplay(item.startTime)} تا ${formatTimeDisplay(item.endTime)}`;
    }
    return item.note ?? "—";
  }

  if (!hydrated || loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">تنظیمات سالن</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            اطلاعات پایه، ساعات کاری عادی و استثناها
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={resetForm}
          >
            انصراف
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => void handleSaveAll()}
            disabled={saving}
          >
            <Save className="size-4" />
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      {saved ? (
        <p className="text-sm text-emerald-700">تغییرات ذخیره شد</p>
      ) : null}

      <Card className="shadow-none">
        <CardContent className="space-y-5 p-5">
          <SectionTitle icon={Contact2} title="اطلاعات پایه" />
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              <Field
                label="نام سالن"
                required
                value={brandName}
                onChange={setBrandName}
              />
              <Field
                label="شماره تماس"
                required
                value={phone}
                onChange={setPhone}
                dir="ltr"
              />
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">
                  آدرس <span className="text-destructive">*</span>
                </span>
                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium">تصاویر سالن</p>
              <input
                ref={galleryInputRef}
                type="file"
                accept={salonGalleryAccept}
                className="hidden"
                onChange={(event) => void handleGalleryFileChange(event)}
              />
              <div className="grid grid-cols-2 gap-3">
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-xl border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveMediaUrl(src)}
                      alt=""
                      className="size-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setGalleryImages((items) =>
                          items.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="absolute start-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white"
                      aria-label="حذف تصویر"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingImage ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <ImagePlus className="size-6" />
                  )}
                  {uploadingImage ? "در حال بارگذاری..." : "افزودن تصویر"}
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                JPG، PNG یا WebP — حداکثر ۵ مگابایت
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-4 p-5">
          <SectionTitle icon={Clock3} title="ساعات کاری عادی" />
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">روز هفته</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">ساعت شروع</th>
                  <th className="px-4 py-3 text-start font-medium">ساعت پایان</th>
                </tr>
              </thead>
              <tbody>
                {weeklyRows.map((row) => (
                  <tr key={row.dayOfWeek} className="border-b border-border">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.active}
                          onChange={(event) =>
                            updateWeeklyRow(row.dayOfWeek, {
                              active: event.target.checked,
                            })
                          }
                          className="size-4 accent-primary"
                        />
                        <span className="text-muted-foreground">
                          {row.active ? "فعال" : "تعطیل"}
                        </span>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.startTime}
                        disabled={!row.active}
                        onChange={(event) =>
                          updateWeeklyRow(row.dayOfWeek, {
                            startTime: event.target.value,
                          })
                        }
                        className="h-10 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="time"
                        value={row.endTime}
                        disabled={!row.active}
                        onChange={(event) =>
                          updateWeeklyRow(row.dayOfWeek, {
                            endTime: event.target.value,
                          })
                        }
                        className="h-10 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionTitle icon={CalendarDays} title="ساعات خاص و تعطیلی‌ها" />
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => {
                setEditingException(null);
                setDrawerOpen(true);
              }}
            >
              <Plus className="size-4" />
              افزودن استثنا
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">تاریخ / بازه</th>
                  <th className="px-4 py-3 text-start font-medium">نوع</th>
                  <th className="px-4 py-3 text-start font-medium">جزئیات</th>
                  <th className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      استثنایی ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  exceptions.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="px-4 py-3">{exceptionDateLabel(item)}</td>
                      <td className="px-4 py-3">
                        {scheduleExceptionTypeLabels[item.type]}
                      </td>
                      <td className="px-4 py-3">{exceptionDetails(item)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">فعال</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-primary"
                            onClick={() => {
                              setEditingException(item);
                              setDrawerOpen(true);
                            }}
                          >
                            <Pencil className="size-4" />
                            ویرایش
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-destructive"
                            onClick={() => setDeleteTarget(item)}
                          >
                            <Trash2 className="size-4" />
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ScheduleExceptionDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        editing={editingException}
        onSave={handleExceptionSave}
      />

      <DeleteExceptionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        exception={deleteTarget}
        onConfirm={handleDeleteException}
      />
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="size-5 text-primary" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  dir,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        dir={dir}
        className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
      />
    </label>
  );
}

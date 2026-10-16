"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  ChevronLeft,
  FileText,
  Info,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { chairRentUnitLabels, contractTypeLabels } from "@/lib/salon/management";
import { formatDuration } from "@/lib/format";
import { formatJalaliShort, isoDateFromDate } from "@/lib/format/jalali";
import { formatToman } from "@/lib/format/money";
import { formatFaNumber } from "@/lib/format/number";
import {
  deactivateStylistServiceAsync,
  fetchStylistDetail,
  financialPeriodLabels,
  contractAuditActionLabels,
  getActiveContract,
  getContractAuditLogs,
  getContractHistory,
  getStylistById,
  listStylistAssignments,
  saveStylistBasicInfoAsync,
  saveStylistContractAsync,
  saveWeeklyScheduleAsync,
  stylistReadiness,
  updateActiveContractAsync,
  updateStylistServicePriceAsync,
  weeklyScheduleRows,
  type ContractInput,
  type StylistBasicInput,
  type WeeklyScheduleRow,
} from "@/lib/salon/stylist-detail";
import { fetchServices } from "@/lib/salon/services";
import { ApiError } from "@/lib/api/client";
import { clearSalonSession } from "@/lib/salon/auth";
import { StylistAvatar } from "@/components/salon/stylist-avatar";
import { stylistAvatarSrc } from "@/lib/salon/stylist-avatar";
import { uploadStylistAvatar } from "@/lib/salon/stylist-media";
import { AssignServiceDialog } from "@/components/salon/stylists/assign-service-dialog";
import { JalaliDateInput } from "@/components/ui/jalali-date-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ContractType, StylistGender } from "@/types/domain";

const tabs = [
  { id: "basic", label: "اطلاعات پایه" },
  { id: "services", label: "خدمات و قیمت‌ها" },
  { id: "schedule", label: "برنامه کاری" },
  { id: "contract", label: "قرارداد مالی" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const fieldClassName =
  "h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type StylistDetailPageProps = {
  mode?: "create" | "detail";
  stylistId?: string;
};

export function StylistDetailPage({
  mode = "detail",
  stylistId,
}: StylistDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setupMode = searchParams.get("setup") === "1";
  const initialTab = (searchParams.get("tab") as TabId | null) ?? "basic";

  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(mode !== "create");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [resolvedId, setResolvedId] = useState<string | null>(stylistId ?? null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingAvatarFileRef = useRef<File | null>(null);

  const effectiveId = mode === "create" ? resolvedId : stylistId ?? null;
  const stylist = useMemo(() => {
    void refreshKey;
    return effectiveId ? getStylistById(effectiveId) : null;
  }, [effectiveId, refreshKey]);

  const isNewRecord = mode === "create" && !resolvedId;
  const readiness = effectiveId ? stylistReadiness(effectiveId) : null;

  const [basicForm, setBasicForm] = useState<StylistBasicInput>({
    displayName: "",
    mobile: "",
    isActive: true,
    gender: "female",
    description: "",
  });
  const [scheduleRows, setScheduleRows] = useState<WeeklyScheduleRow[]>([]);
  const [contractForm, setContractForm] = useState<ContractInput>({
    type: "percentage",
    effectiveFrom: "",
    financialPeriod: "monthly",
    percentage: 35,
  });
  const [contractFormMode, setContractFormMode] = useState<"view" | "edit" | "new">(
    "view",
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarPreview = basicForm.avatarPath ?? stylist?.avatarPath;

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (mode === "create" || !effectiveId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        await Promise.all([
          fetchStylistDetail(effectiveId!),
          fetchServices({ status: "active" }),
        ]);
        if (!cancelled) {
          setRefreshKey((value) => value + 1);
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError instanceof ApiError && loadError.status === 401) {
            clearSalonSession();
            showToast("نشست شما منقضی شده — لطفاً دوباره وارد شوید");
            window.setTimeout(() => {
              window.location.href = "/salon/login";
            }, 1200);
            return;
          }
          setError("بارگذاری اطلاعات آرایشگر با خطا مواجه شد");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [mode, effectiveId]);

  useEffect(() => {
    if (!stylist) return;
    setBasicForm({
      displayName: stylist.displayName,
      mobile: stylist.mobile,
      isActive: stylist.isActive,
      gender: stylist.gender ?? "female",
      description: stylist.description ?? "",
      avatarPath: stylist.avatarPath,
    });
    if (effectiveId) {
      setScheduleRows(weeklyScheduleRows(effectiveId));
      const active = getActiveContract(effectiveId);
      if (active) {
        setContractForm({
          type: active.type,
          effectiveFrom: active.effectiveFrom,
          effectiveTo: active.effectiveTo,
          financialPeriod: active.financialPeriod,
          percentage: active.percentage,
          chairRent: active.chairRent,
          fixedSalary: active.fixedSalary,
          commissionPercentage: active.commissionPercentage,
        });
      }
    }
  }, [stylist, effectiveId, refreshKey]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function goToTab(next: TabId) {
    setTab(next);
    if (effectiveId && setupMode) {
      router.replace(`/salon/stylists/${effectiveId}?setup=1&tab=${next}`);
    }
  }

  function tabDisabled(tabId: TabId) {
    return isNewRecord && tabId !== "basic";
  }

  function normalizeMobile(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("98")) digits = `0${digits.slice(2)}`;
    if (digits.startsWith("9") && digits.length === 10) digits = `0${digits}`;
    return digits;
  }

  async function handleAvatarFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      if (!effectiveId) {
        pendingAvatarFileRef.current = file;
        const path = await uploadStylistAvatar(null, file);
        setBasicForm((current) => ({ ...current, avatarPath: path }));
        showToast("عکس انتخاب شد — با ذخیره اطلاعات پایه ثبت می‌شود");
        return;
      }

      const path = await uploadStylistAvatar(effectiveId, file);
      setBasicForm((current) => ({ ...current, avatarPath: path }));
      await saveStylistBasicInfoAsync(effectiveId, {
        ...basicForm,
        avatarPath: path,
        mobile: normalizeMobile(basicForm.mobile),
      });
      setRefreshKey((value) => value + 1);
      showToast("عکس بارگذاری شد");
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : uploadError instanceof Error
            ? uploadError.message
            : "بارگذاری تصویر با خطا مواجه شد",
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSaveBasic(nextTab?: TabId) {
    setError(null);
    const mobile = normalizeMobile(basicForm.mobile);
    if (!basicForm.displayName.trim()) {
      setError("نام آرایشگر را وارد کنید");
      return;
    }
    if (!/^09\d{9}$/.test(mobile)) {
      setError("شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveStylistBasicInfoAsync(effectiveId, {
        ...basicForm,
        mobile,
        avatarPath: basicForm.avatarPath?.startsWith("data:")
          ? undefined
          : basicForm.avatarPath,
      });

      if (pendingAvatarFileRef.current) {
        const path = await uploadStylistAvatar(
          saved.id,
          pendingAvatarFileRef.current,
        );
        pendingAvatarFileRef.current = null;
        await saveStylistBasicInfoAsync(saved.id, {
          ...basicForm,
          mobile,
          avatarPath: path,
        });
      }

      if (isNewRecord) {
        setResolvedId(saved.id);
        showToast("آرایشگر ایجاد شد");
        router.replace(
          `/salon/stylists/${saved.id}?setup=1&tab=${nextTab ?? "services"}`,
        );
        setTab(nextTab ?? "services");
        return;
      }

      setRefreshKey((value) => value + 1);
      showToast("اطلاعات پایه ذخیره شد");
      if (nextTab) goToTab(nextTab);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "ذخیره اطلاعات با خطا مواجه شد",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSchedule(nextTab?: TabId) {
    if (!effectiveId) return;
    setSaving(true);
    setError(null);
    try {
      await saveWeeklyScheduleAsync(effectiveId, scheduleRows);
      setRefreshKey((value) => value + 1);
      showToast("برنامه کاری ذخیره شد");
      if (nextTab) goToTab(nextTab);
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "ذخیره برنامه کاری با خطا مواجه شد",
      );
    } finally {
      setSaving(false);
    }
  }

  function resetContractFormFromActive() {
    if (!activeContract) return;
    setContractForm({
      type: activeContract.type,
      effectiveFrom: activeContract.effectiveFrom,
      effectiveTo: activeContract.effectiveTo,
      financialPeriod: activeContract.financialPeriod,
      percentage: activeContract.percentage,
      chairRent: activeContract.chairRent,
      fixedSalary: activeContract.fixedSalary,
      commissionPercentage: activeContract.commissionPercentage,
    });
  }

  function startEditContract() {
    resetContractFormFromActive();
    setContractFormMode("edit");
    setError(null);
  }

  function startNewContract() {
    if (activeContract) {
      setContractForm({
        type: activeContract.type,
        effectiveFrom: "",
        effectiveTo: undefined,
        financialPeriod: activeContract.financialPeriod,
        percentage: activeContract.percentage,
        chairRent: activeContract.chairRent,
        fixedSalary: activeContract.fixedSalary,
        commissionPercentage: activeContract.commissionPercentage,
      });
    }
    setContractFormMode("new");
    setError(null);
  }

  function cancelContractForm() {
    setContractFormMode("view");
    resetContractFormFromActive();
    setError(null);
  }

  async function handleSaveContract() {
    if (!effectiveId) return;
    setError(null);
    if (!contractForm.effectiveFrom) {
      setError("تاریخ شروع قرارداد را انتخاب کنید");
      return;
    }
    if (
      contractForm.effectiveTo &&
      contractForm.effectiveTo < contractForm.effectiveFrom
    ) {
      setError("تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد");
      return;
    }

    setSaving(true);
    try {
      if (contractFormMode === "edit" && activeContract) {
        await updateActiveContractAsync(effectiveId, contractForm);
      } else {
        await saveStylistContractAsync(effectiveId, contractForm);
      }

      setContractFormMode("view");
      setRefreshKey((value) => value + 1);
      showToast("قرارداد ذخیره شد");
      if (setupMode) {
        router.replace(`/salon/stylists/${effectiveId}?tab=contract`);
      }
      setTab("contract");
    } catch (saveError) {
      setError(
        saveError instanceof ApiError
          ? saveError.message
          : "ذخیره قرارداد با خطا مواجه شد",
      );
    } finally {
      setSaving(false);
    }
  }

  const assignments = effectiveId
    ? listStylistAssignments(effectiveId).filter((row) => row.assignment.isActive)
    : [];
  const contractHistory = effectiveId ? getContractHistory(effectiveId) : [];
  const contractAuditLogs = effectiveId ? getContractAuditLogs(effectiveId) : [];
  const activeContract = effectiveId ? getActiveContract(effectiveId) : null;
  const showContractForm =
    !activeContract || contractFormMode === "edit" || contractFormMode === "new";

  const pageTitle = isNewRecord
    ? "افزودن آرایشگر"
    : stylist?.displayName ?? "جزئیات آرایشگر";

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
      {toast ? (
        <div className="fixed inset-x-0 top-4 z-50 mx-auto w-fit rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button
            render={<Link href="/salon/stylists" />}
            nativeButton={false}
            variant="outline"
            className="rounded-xl"
          >
            <ArrowRight className="size-4" />
            بازگشت به لیست
          </Button>
        </div>
        {readiness && !isNewRecord ? (
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge
              variant="outline"
              className={cn(
                readiness.bookingReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {readiness.bookingReady ? "آماده رزرو" : "ناقص برای رزرو"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                readiness.settlementReady
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-amber-200 bg-amber-50 text-amber-800",
              )}
            >
              {readiness.settlementReady ? "آماده ثبت مالی" : "بدون قرارداد"}
            </Badge>
          </div>
        ) : null}
      </div>

      <Card className="shadow-none">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-muted">
            <StylistAvatar
              stylistId={effectiveId ?? undefined}
              avatarPath={avatarPreview}
              name={pageTitle}
              size="lg"
              className="size-full"
              fallbackClassName="bg-muted text-muted-foreground"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{pageTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">آرایشگر</p>
            {stylist ? (
              <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
                {stylist.mobile}
              </p>
            ) : null}
          </div>
          {stylist ? (
            <Badge
              variant="outline"
              className={cn(
                "rounded-full",
                stylist.isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800",
              )}
            >
              {stylist.isActive ? "فعال" : "غیرفعال"}
            </Badge>
          ) : null}
        </CardContent>
      </Card>

      <div className="border-b border-border">
        <div className="flex flex-wrap gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={tabDisabled(item.id)}
              onClick={() => goToTab(item.id)}
              className={cn(
                "border-b-2 px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40",
                tab === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "basic" ? (
        <Card className="shadow-none">
          <CardContent className="space-y-6 p-5">
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarFileChange}
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="relative flex aspect-square w-full max-w-[220px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-sm text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stylistAvatarSrc(avatarPreview)}
                    alt=""
                    className="absolute inset-0 size-full object-cover"
                  />
                ) : (
                  <>
                    <Camera className="size-8" />
                    <span>افزودن عکس</span>
                    <span className="text-xs text-muted-foreground">
                      JPG, PNG حداکثر ۱MB
                    </span>
                  </>
                )}
                {uploadingAvatar ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm">
                    در حال بارگذاری…
                  </span>
                ) : null}
              </button>

              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    نام و نام خانوادگی <span className="text-destructive">*</span>
                  </span>
                  <input
                    value={basicForm.displayName}
                    onChange={(event) =>
                      setBasicForm({ ...basicForm, displayName: event.target.value })
                    }
                    placeholder="مثلاً: سارا کریمی"
                    className={fieldClassName}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">
                    شماره موبایل <span className="text-destructive">*</span>
                  </span>
                  <input
                    value={basicForm.mobile}
                    onChange={(event) =>
                      setBasicForm({ ...basicForm, mobile: event.target.value })
                    }
                    placeholder="09123456789"
                    dir="ltr"
                    className={cn(fieldClassName, "text-start")}
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">جنسیت</legend>
                  <label className="me-4 inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={basicForm.gender === "female"}
                      onChange={() =>
                        setBasicForm({ ...basicForm, gender: "female" as StylistGender })
                      }
                    />
                    خانم
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={basicForm.gender === "male"}
                      onChange={() =>
                        setBasicForm({ ...basicForm, gender: "male" as StylistGender })
                      }
                    />
                    آقا
                  </label>
                </fieldset>

                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">توضیحات</span>
                  <textarea
                    value={basicForm.description ?? ""}
                    onChange={(event) =>
                      setBasicForm({ ...basicForm, description: event.target.value })
                    }
                    rows={4}
                    className={cn(fieldClassName, "h-auto py-2")}
                  />
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={basicForm.isActive ?? true}
                    onChange={(event) =>
                      setBasicForm({ ...basicForm, isActive: event.target.checked })
                    }
                    className="size-4 accent-primary"
                  />
                  فعال
                </label>
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button
                render={<Link href="/salon/stylists" />}
                nativeButton={false}
                variant="outline"
                className="rounded-xl"
              >
                انصراف
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => handleSaveBasic()}
              >
                <Save className="size-4" />
                ذخیره
              </Button>
              {(setupMode || isNewRecord) && (
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => handleSaveBasic("services")}
                >
                  مرحله بعد
                  <ChevronLeft className="size-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "services" && effectiveId ? (
        <Card className="shadow-none">
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">خدمات و قیمت‌ها</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  قیمت شروع برای هر خدمت در این بخش تعریف می‌شود.
                </p>
              </div>
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => setAssignOpen(true)}
              >
                <Plus className="size-4" />
                افزودن خدمت
              </Button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">دسته‌بندی</th>
                    <th className="px-4 py-3 text-start font-medium">خدمت</th>
                    <th className="px-4 py-3 text-start font-medium">مدت تقریبی</th>
                    <th className="px-4 py-3 text-start font-medium">قیمت شروع</th>
                    <th className="px-4 py-3 text-start font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        هنوز خدمتی به این آرایشگر اختصاص داده نشده است.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((row) => (
                      <ServiceAssignmentRow
                        key={row.assignment.id}
                        stylistId={effectiveId!}
                        row={row}
                        onChanged={() => setRefreshKey((value) => value + 1)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {setupMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => goToTab("basic")}
                  >
                    مرحله قبل
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() => goToTab("schedule")}
                  >
                    مرحله بعد
                    <ChevronLeft className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => showToast("خدمات ذخیره شد")}
                >
                  <Save className="size-4" />
                  ذخیره
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "schedule" && effectiveId ? (
        <Card className="shadow-none">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-semibold">برنامه کاری هفتگی</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                این برنامه روی زمان‌های قابل رزرو این آرایشگر اثر می‌گذارد.
              </p>
            </div>

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
                  {scheduleRows.map((row) => (
                    <tr key={row.dayOfWeek} className="border-b border-border">
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td className="px-4 py-3">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={row.active}
                            onChange={(event) =>
                              setScheduleRows((rows) =>
                                rows.map((item) =>
                                  item.dayOfWeek === row.dayOfWeek
                                    ? { ...item, active: event.target.checked }
                                    : item,
                                ),
                              )
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
                            setScheduleRows((rows) =>
                              rows.map((item) =>
                                item.dayOfWeek === row.dayOfWeek
                                  ? { ...item, startTime: event.target.value }
                                  : item,
                              ),
                            )
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
                            setScheduleRows((rows) =>
                              rows.map((item) =>
                                item.dayOfWeek === row.dayOfWeek
                                  ? { ...item, endTime: event.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="h-10 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-7 text-sky-900">
              <Info className="mt-0.5 size-4 shrink-0 text-sky-700" />
              <p>
                برنامه کاری مستقیماً روی زمان‌های قابل رزرو و availability این
                آرایشگر اثر می‌گذارد.
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {setupMode ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => goToTab("services")}
                  >
                    مرحله قبل
                  </Button>
                  <Button
                    type="button"
                    className="rounded-xl"
                    onClick={() => handleSaveSchedule("contract")}
                  >
                    مرحله بعد
                    <ChevronLeft className="size-4" />
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() => handleSaveSchedule()}
                >
                  <Save className="size-4" />
                  ذخیره تغییرات
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "contract" && effectiveId ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">قرارداد مالی</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    نوع قرارداد و شرایط مالی همکار
                  </p>
                </div>
              </div>

              {activeContract && contractFormMode === "view" ? (
                <div className="space-y-3 rounded-2xl border border-border p-4 text-sm">
                  <InfoRow label="نوع قرارداد" value={contractTypeLabels[activeContract.type]} />
                  {activeContract.type === "percentage" ? (
                    <InfoRow
                      label="میزان شراکت (سهم سالن)"
                      value={`${formatFaNumber(activeContract.percentage ?? 0)}٪`}
                    />
                  ) : null}
                  {activeContract.type === "chair_rent" ? (
                    <InfoRow
                      label={`اجاره صندلی (هر ${chairRentUnitLabels[activeContract.financialPeriod]})`}
                      value={formatToman(activeContract.chairRent ?? 0)}
                    />
                  ) : null}
                  {activeContract.type === "fixed_salary" ? (
                    <InfoRow
                      label="حقوق ثابت"
                      value={formatToman(activeContract.fixedSalary ?? 0)}
                    />
                  ) : null}
                  {activeContract.type === "fixed_salary_plus_commission" ? (
                    <>
                      <InfoRow
                        label="حقوق ثابت"
                        value={formatToman(activeContract.fixedSalary ?? 0)}
                      />
                      <InfoRow
                        label="درصد پورسانت"
                        value={`${formatFaNumber(activeContract.commissionPercentage ?? 0)}٪`}
                      />
                    </>
                  ) : null}
                  <InfoRow
                    label="دوره مالی"
                    value={financialPeriodLabels[activeContract.financialPeriod]}
                  />
                  <InfoRow
                    label="تاریخ شروع قرارداد"
                    value={formatJalaliShort(activeContract.effectiveFrom)}
                  />
                  <InfoRow
                    label="تاریخ پایان قرارداد"
                    value={
                      activeContract.effectiveTo
                        ? formatJalaliShort(activeContract.effectiveTo)
                        : "—"
                    }
                  />
                </div>
              ) : showContractForm ? (
                <ContractForm
                  value={contractForm}
                  onChange={setContractForm}
                  error={error}
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                {activeContract && contractFormMode === "view" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={startEditContract}
                    >
                      <Pencil className="size-4" />
                      ویرایش قرارداد
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={startNewContract}
                    >
                      <Plus className="size-4" />
                      قرارداد جدید
                    </Button>
                  </>
                ) : showContractForm ? (
                  <>
                    {activeContract ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={cancelContractForm}
                      >
                        انصراف
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={handleSaveContract}
                      disabled={saving}
                    >
                      <Save className="size-4" />
                      {contractFormMode === "edit" ? "ذخیره تغییرات" : "ذخیره قرارداد"}
                    </Button>
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <BadgeCheck className="size-5" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">تاریخچه تغییرات</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ثبت هر ایجاد، ویرایش یا جایگزینی قرارداد با نام کاربر
                  </p>
                </div>
              </div>

              {contractAuditLogs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                  <p>هنوز سابقه‌ای ثبت نشده است.</p>
                  <p className="mt-2">
                    پس از ثبت یا تغییر قرارداد، سوابق در این بخش نمایش داده
                    می‌شود.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {contractAuditLogs.map((item) => (
                    <ContractAuditLogRow key={item.id} log={item} />
                  ))}
                </div>
              )}

              {contractHistory.length > 0 ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    قراردادهای قبلی
                  </p>
                  {contractHistory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-border px-4 py-3 text-sm"
                    >
                      <p className="font-medium">{contractTypeLabels[item.type]}</p>
                      <p className="mt-1 text-muted-foreground">
                        {formatJalaliShort(item.effectiveFrom)}
                        {item.effectiveTo
                          ? ` – ${formatJalaliShort(item.effectiveTo)}`
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {effectiveId ? (
        <AssignServiceDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          stylistId={effectiveId}
          onAssigned={() => setRefreshKey((value) => value + 1)}
        />
      ) : null}
        </>
      )}
    </div>
  );
}

function ServiceAssignmentRow({
  stylistId,
  row,
  onChanged,
}: {
  stylistId: string;
  row: ReturnType<typeof listStylistAssignments>[number];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceText, setPriceText] = useState(String(row.assignment.startingPrice));

  async function savePrice() {
    const price = Number.parseInt(priceText.replace(/\D/g, ""), 10);
    if (!Number.isFinite(price) || price <= 0) return;
    setSaving(true);
    try {
      await updateStylistServicePriceAsync(
        stylistId,
        row.assignment.id,
        price,
      );
      setEditing(false);
      onChanged();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function removeAssignment() {
    setSaving(true);
    try {
      await deactivateStylistServiceAsync(stylistId, row.assignment.id);
      onChanged();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-border">
      <td className="px-4 py-3">{row.categoryName}</td>
      <td className="px-4 py-3 font-medium">{row.serviceName}</td>
      <td className="px-4 py-3">{formatDuration(row.durationMinutes)}</td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={priceText}
            onChange={(event) =>
              setPriceText(event.target.value.replace(/\D/g, ""))
            }
            className="h-9 w-32 rounded-lg border border-input px-2 text-sm"
            dir="ltr"
          />
        ) : (
          formatToman(row.assignment.startingPrice)
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              className="text-primary"
              onClick={() => void savePrice()}
              disabled={saving}
            >
              ذخیره
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-primary"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" />
              ویرایش
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-1 text-destructive"
            onClick={() => void removeAssignment()}
            disabled={saving}
          >
            <Trash2 className="size-4" />
            حذف
          </button>
        </div>
      </td>
    </tr>
  );
}

function ContractForm({
  value,
  onChange,
  error,
}: {
  value: ContractInput;
  onChange: (value: ContractInput) => void;
  error: string | null;
}) {
  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">نوع قرارداد</span>
        <select
          value={value.type}
          onChange={(event) =>
            onChange({ ...value, type: event.target.value as ContractType })
          }
          className={fieldClassName}
        >
          {Object.entries(contractTypeLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {value.type === "percentage" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">میزان شراکت (سهم سالن)</span>
          <input
            inputMode="numeric"
            value={value.percentage ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                percentage: Number.parseInt(event.target.value, 10) || 0,
              })
            }
            className={fieldClassName}
          />
        </label>
      ) : null}

      {value.type === "chair_rent" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            اجاره صندلی به ازای هر {chairRentUnitLabels[value.financialPeriod]} (تومان)
          </span>
          <input
            inputMode="numeric"
            value={value.chairRent ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                chairRent: Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
              })
            }
            className={fieldClassName}
          />
        </label>
      ) : null}

      {value.type === "fixed_salary" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">حقوق ثابت (تومان)</span>
          <input
            inputMode="numeric"
            value={value.fixedSalary ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                fixedSalary: Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
              })
            }
            className={fieldClassName}
          />
        </label>
      ) : null}

      {value.type === "fixed_salary_plus_commission" ? (
        <>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">حقوق ثابت (تومان)</span>
            <input
              inputMode="numeric"
              value={value.fixedSalary ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  fixedSalary:
                    Number.parseInt(event.target.value.replace(/\D/g, ""), 10) || 0,
                })
              }
              className={fieldClassName}
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">درصد پورسانت</span>
            <input
              inputMode="numeric"
              value={value.commissionPercentage ?? ""}
              onChange={(event) =>
                onChange({
                  ...value,
                  commissionPercentage:
                    Number.parseInt(event.target.value, 10) || 0,
                })
              }
              className={fieldClassName}
            />
          </label>
        </>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">دوره مالی</span>
        <select
          value={value.financialPeriod}
          onChange={(event) =>
            onChange({
              ...value,
              financialPeriod: event.target.value as ContractInput["financialPeriod"],
            })
          }
          className={fieldClassName}
        >
          <option value="monthly">ماهانه</option>
          <option value="weekly">هفتگی</option>
          <option value="daily">روزانه</option>
        </select>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">تاریخ شروع قرارداد</span>
        <JalaliDateInput
          value={value.effectiveFrom}
          onChange={(effectiveFrom) => onChange({ ...value, effectiveFrom })}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">تاریخ پایان قرارداد</span>
        <JalaliDateInput
          value={value.effectiveTo ?? ""}
          onChange={(effectiveTo) =>
            onChange({
              ...value,
              effectiveTo: effectiveTo || undefined,
            })
          }
        />
        <p className="text-xs text-muted-foreground">
          در صورت خالی بودن، قرارداد بدون تاریخ پایان ثبت می‌شود.
        </p>
      </label>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function formatAuditTimestamp(iso: string) {
  const date = new Date(iso);
  const datePart = formatJalaliShort(isoDateFromDate(date));
  const timePart = date.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} – ${timePart}`;
}

function contractSummary(contract: {
  type: ContractType;
  effectiveFrom: string;
  effectiveTo?: string;
  percentage?: number;
  chairRent?: number;
  fixedSalary?: number;
  commissionPercentage?: number;
}) {
  const parts = [contractTypeLabels[contract.type]];
  if (contract.type === "percentage" && contract.percentage != null) {
    parts.push(`سهم سالن ${formatFaNumber(contract.percentage)}٪`);
  }
  if (contract.type === "chair_rent" && contract.chairRent != null) {
    parts.push(formatToman(contract.chairRent));
  }
  if (
    (contract.type === "fixed_salary" ||
      contract.type === "fixed_salary_plus_commission") &&
    contract.fixedSalary != null
  ) {
    parts.push(formatToman(contract.fixedSalary));
  }
  if (
    contract.type === "fixed_salary_plus_commission" &&
    contract.commissionPercentage != null
  ) {
    parts.push(`${formatFaNumber(contract.commissionPercentage)}٪`);
  }
  parts.push(formatJalaliShort(contract.effectiveFrom));
  if (contract.effectiveTo) {
    parts.push(`تا ${formatJalaliShort(contract.effectiveTo)}`);
  }
  return parts.join(" · ");
}

function ContractAuditLogRow({
  log,
}: {
  log: ReturnType<typeof getContractAuditLogs>[number];
}) {
  return (
    <div className="rounded-xl border border-border px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant="outline" className="rounded-full">
          {contractAuditActionLabels[log.action]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {formatAuditTimestamp(log.createdAt)}
        </span>
      </div>
      <p className="mt-2 font-medium">{contractSummary(log.newData)}</p>
      <p className="mt-1 text-muted-foreground">توسط {log.changedByName}</p>
    </div>
  );
}

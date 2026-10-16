import { formatBookingDisplayCode } from "@/lib/booking/display-code";
import { findService } from "@/lib/booking/catalog";
import { salesAmount } from "@/lib/booking/totals";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { formatDuration, formatPrice } from "@/lib/format";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { categoryName, serviceName, stylistById } from "@/lib/salon/management";
import { stylists } from "@/mock_ts/stylists";
import { bookings } from "@/mock_ts/bookings";
import { customers } from "@/mock_ts/customers";
import { paymentTransactions } from "@/mock_ts/transactions";
import type { Booking, BookingStatus, PaymentTransaction } from "@/types/domain";
import type { BookingPersistPayload } from "@/types/booking";

export type BookingListFilters = {
  status?: BookingStatus | "all";
  stylistId?: string | "all";
  customerQuery?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type BookingStatusCounts = {
  all: number;
  confirmed: number;
  completed: number;
  cancelled: number;
};

export type BookingListResponse = {
  items: Booking[];
  counts: BookingStatusCounts;
};

export type BookingCheckoutPayload = {
  lines: Array<{
    serviceLineId: string;
    finalActualAmount: number;
  }>;
  paymentKind: PaymentTransaction["kind"];
  note?: string;
};

export type BookingCheckoutResponse = {
  booking: Booking;
  transaction: PaymentTransaction;
};

function syncBookingsToMock(items: Booking[]) {
  bookings.length = 0;
  bookings.push(...items);
}

function upsertBookingToMock(booking: Booking) {
  const index = bookings.findIndex((item) => item.id === booking.id);
  if (index >= 0) {
    bookings[index] = booking;
  } else {
    bookings.push(booking);
  }
}

function upsertPaymentTransactionToMock(transaction: PaymentTransaction) {
  const index = paymentTransactions.findIndex((item) => item.id === transaction.id);
  if (index >= 0) {
    paymentTransactions[index] = transaction;
  } else {
    paymentTransactions.push(transaction);
  }
}

function buildBookingQuery(filters: BookingListFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") {
    params.set("status", filters.status);
  }
  if (filters.stylistId && filters.stylistId !== "all") {
    params.set("stylistId", filters.stylistId);
  }
  const query = filters.customerQuery?.trim();
  if (query) params.set("query", query);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function upsertBookingsToMock(items: Booking[]) {
  for (const item of items) {
    upsertBookingToMock(item);
  }
}

function bookingInDateFilterRange(
  bookingDate: string,
  filters: BookingListFilters,
): boolean {
  if (filters.dateFrom && bookingDate < filters.dateFrom) return false;
  if (filters.dateTo && bookingDate > filters.dateTo) return false;
  return Boolean(filters.dateFrom || filters.dateTo);
}

/** Replace mock rows for the queried date range so deleted server bookings do not linger. */
function syncBookingsForDateRange(
  items: Booking[],
  filters: BookingListFilters,
) {
  if (!filters.dateFrom && !filters.dateTo) {
    upsertBookingsToMock(items);
    return;
  }

  const fetchedIds = new Set(items.map((item) => item.id));
  for (let index = bookings.length - 1; index >= 0; index -= 1) {
    const booking = bookings[index];
    if (
      bookingInDateFilterRange(booking.bookingDate, filters) &&
      !fetchedIds.has(booking.id)
    ) {
      bookings.splice(index, 1);
    }
  }
  upsertBookingsToMock(items);
}

function hasBookingFilters(filters: BookingListFilters = {}) {
  return Boolean(
    (filters.status && filters.status !== "all") ||
      (filters.stylistId && filters.stylistId !== "all") ||
      filters.customerQuery?.trim() ||
      filters.dateFrom ||
      filters.dateTo,
  );
}

export async function fetchBookings(
  filters: BookingListFilters = {},
): Promise<BookingListResponse> {
  if (!isApiEnabled()) {
    return {
      items: [...bookings],
      counts: bookingStatusCounts(),
    };
  }

  try {
    const result = await apiFetch<BookingListResponse>(
      `/salon/bookings${buildBookingQuery(filters)}`,
    );
    if (filters.dateFrom || filters.dateTo) {
      syncBookingsForDateRange(result.items, filters);
    } else if (hasBookingFilters(filters)) {
      upsertBookingsToMock(result.items);
    } else {
      syncBookingsToMock(result.items);
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری رزروها با خطا مواجه شد", 0);
  }
}

export async function fetchBookingById(id: string): Promise<Booking | null> {
  if (!isApiEnabled()) {
    return bookings.find((item) => item.id === id) ?? null;
  }

  try {
    const booking = await apiFetch<Booking>(`/salon/bookings/${id}`);
    upsertBookingToMock(booking);
    return booking;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری رزرو با خطا مواجه شد", 0);
  }
}

export async function createBookingAsync(
  payload: BookingPersistPayload,
): Promise<Booking> {
  if (!isApiEnabled()) {
    throw new ApiError("API disabled", 0);
  }

  try {
    const booking = await apiFetch<Booking>("/salon/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    upsertBookingToMock(booking);
    return booking;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ثبت رزرو با خطا مواجه شد", 0);
  }
}

export async function updateBookingAsync(
  id: string,
  payload: BookingPersistPayload,
): Promise<Booking> {
  if (!isApiEnabled()) {
    throw new ApiError("API disabled", 0);
  }

  try {
    const booking = await apiFetch<Booking>(`/salon/bookings/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    upsertBookingToMock(booking);
    return booking;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("ذخیره رزرو با خطا مواجه شد", 0);
  }
}

export async function cancelBookingAsync(
  id: string,
  input: { reason?: string; cancelledBy?: "salon" | "guest" },
): Promise<Booking> {
  if (!isApiEnabled()) {
    throw new ApiError("API disabled", 0);
  }

  try {
    const booking = await apiFetch<Booking>(`/salon/bookings/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify({
        reason: input.reason?.trim() ?? "",
        cancelledBy: input.cancelledBy ?? "salon",
      }),
    });
    upsertBookingToMock(booking);
    return booking;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("لغو رزرو با خطا مواجه شد", 0);
  }
}

export async function checkoutBookingAsync(
  id: string,
  payload: BookingCheckoutPayload,
): Promise<BookingCheckoutResponse> {
  if (!isApiEnabled()) {
    throw new ApiError("API disabled", 0);
  }

  try {
    const result = await apiFetch<BookingCheckoutResponse>(
      `/salon/bookings/${id}/checkout`,
      {
        method: "POST",
        body: JSON.stringify({
          lines: payload.lines,
          paymentKind: payload.paymentKind,
          note: payload.note ?? "",
        }),
      },
    );
    upsertBookingToMock(result.booking);
    upsertPaymentTransactionToMock(result.transaction);
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("تسویه رزرو با خطا مواجه شد", 0);
  }
}

export async function fetchCheckoutTransaction(
  bookingId: string,
): Promise<PaymentTransaction | null> {
  if (!isApiEnabled()) {
    return checkoutTransactionForBooking(bookingId) ?? null;
  }

  try {
    const transaction = await apiFetch<PaymentTransaction>(
      `/salon/bookings/${bookingId}/checkout-transaction`,
    );
    upsertPaymentTransactionToMock(transaction);
    return transaction;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری اطلاعات تسویه با خطا مواجه شد", 0);
  }
}

export const bookingStatusLabels: Record<BookingStatus, string> = {
  draft: "پیش‌نویس",
  confirmed: "تأیید شده",
  cancelled: "لغو شده",
  completed: "تکمیل شده",
};

export const bookingSourceLabels = {
  guest: "مهمان",
  salon: "سالن",
} as const;

export const cancelledByLabels = {
  salon: "پذیرش سالن",
  guest: "مشتری",
} as const;

export const bookingPaymentStatusLabels = {
  unpaid: "پرداخت نشده",
  paid: "پرداخت شده",
} as const;

export function customerById(customerId: string) {
  return customers.find((item) => item.id === customerId);
}

export function customerDisplayName(customerId: string) {
  return customerById(customerId)?.fullName ?? "—";
}

export function customerMobile(customerId: string) {
  return customerById(customerId)?.mobile ?? "—";
}

export function bookingListRows(options?: BookingListFilters) {
  const status = options?.status ?? "all";
  const stylistId = options?.stylistId ?? "all";
  const customerQuery = options?.customerQuery?.trim().toLowerCase() ?? "";
  const dateFrom = options?.dateFrom;
  const dateTo = options?.dateTo;

  const sorted = [...bookings].sort((a, b) => {
    if (a.bookingDate !== b.bookingDate) {
      return b.bookingDate.localeCompare(a.bookingDate);
    }
    return b.createdAt.localeCompare(a.createdAt);
  });

  return sorted
    .filter((booking) => status === "all" || booking.status === status)
    .filter((booking) => {
      if (stylistId === "all") return true;
      return booking.services.some((line) => line.stylistId === stylistId);
    })
    .filter((booking) => {
      if (!customerQuery) return true;
      const name = customerDisplayName(booking.customerId).toLowerCase();
      const mobile = customerMobile(booking.customerId).replace(/\s/g, "");
      const query = customerQuery.replace(/\s/g, "");
      return name.includes(customerQuery) || mobile.includes(query);
    })
    .filter((booking) => {
      if (dateFrom && booking.bookingDate < dateFrom) return false;
      if (dateTo && booking.bookingDate > dateTo) return false;
      return true;
    })
    .map((booking) => {
      const lines = bookingLineSummary(booking);
      return {
        booking,
        displayId: formatBookingDisplayCode(booking),
        customerName: customerDisplayName(booking.customerId),
        customerMobile: customerMobile(booking.customerId),
        bookingDateLabel: formatJalaliShort(booking.bookingDate),
        serviceNames: lines.map((line) => line.serviceName),
        stylistNames: lines.map((line) => line.stylistName),
        startTimes: lines.map((line) => line.startTime),
        paymentStatus: bookingPaymentStatus(booking),
        estimatedTotal: bookingEstimatedTotal(booking),
        salesTotal: booking.services.reduce(
          (sum, line) => sum + salesAmount(line.finalActualAmount),
          0,
        ),
      };
    });
}

export function bookingStatusCounts() {
  return {
    all: bookings.length,
    confirmed: bookings.filter((item) => item.status === "confirmed").length,
    completed: bookings.filter((item) => item.status === "completed").length,
    cancelled: bookings.filter((item) => item.status === "cancelled").length,
  };
}

export function activeStylistsForFilter() {
  return stylists.filter((stylist) => stylist.isActive);
}

export function formatBookingDisplayId(booking: Booking) {
  return formatBookingDisplayCode(booking);
}

export function bookingLineSummary(booking: Booking) {
  return booking.services.map((line, index) => {
    const service = findService(line.serviceId);
    const stylist = stylistById(line.stylistId);
    return {
      index: index + 1,
      categoryName: service ? categoryName(service.categoryId) : "—",
      serviceName: serviceName(line.serviceId),
      stylistName: stylist?.displayName ?? "—",
      startTime: formatTimeDisplay(line.startTime),
      durationMinutes: line.reservedDurationMinutes,
      durationLabel: formatDuration(line.reservedDurationMinutes),
      estimatedPrice: line.estimatedPrice,
      finalActualAmount: line.finalActualAmount,
    };
  });
}

export function bookingPaymentStatus(booking: Booking): "unpaid" | "paid" {
  return booking.status === "completed" ? "paid" : "unpaid";
}

export function bookingEstimatedTotal(booking: Booking) {
  return booking.services.reduce((sum, line) => sum + line.estimatedPrice, 0);
}

export function transactionsForBooking(bookingId: string) {
  return paymentTransactions.filter((item) => item.bookingId === bookingId);
}

export function checkoutTransactionForBooking(bookingId: string) {
  return paymentTransactions.find(
    (item) => item.bookingId === bookingId && item.direction === "inflow",
  );
}

export function bookingServiceLabel(serviceId: string) {
  return findService(serviceId)?.name ?? serviceName(serviceId);
}

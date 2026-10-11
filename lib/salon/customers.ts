import {
  findOrCreateCustomer,
  isValidGuestMobile,
  normalizeMobile,
} from "@/lib/booking/submit-guest";
import { ApiError, apiFetch, isApiEnabled } from "@/lib/api/client";
import { formatJalaliShort } from "@/lib/format/jalali";
import { formatTimeDisplay } from "@/lib/salon/public-data";
import { serviceName } from "@/lib/salon/management";
import { bookingStatusLabels } from "@/lib/salon/bookings";
import { bookings } from "@/mock_ts/bookings";
import { customers } from "@/mock_ts/customers";
import type { Booking, BookingStatus, Customer } from "@/types/domain";

export type CustomerListRow = {
  customer: Customer;
  bookingCount: number;
  lastBooking?: {
    bookingId: string;
    bookingDate: string;
    startTime: string;
    status: BookingStatus;
  };
};

export type CustomerRecentBookingRow = {
  bookingId: string;
  bookingDate: string;
  serviceLabels: string[];
  status: BookingStatus;
  statusLabel: string;
};

function syncCustomersToMock(items: Customer[]) {
  customers.length = 0;
  customers.push(...items);
}

function upsertCustomer(customer: Customer) {
  const index = customers.findIndex((item) => item.id === customer.id);
  if (index >= 0) {
    customers[index] = customer;
  } else {
    customers.push(customer);
  }
}

function mockSearchCustomers(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [...customers].sort((a, b) =>
      a.fullName.localeCompare(b.fullName, "fa"),
    );
  }

  return customers
    .filter((customer) => {
      const mobile = customer.mobile.replace(/\D/g, "");
      const qDigits = normalized.replace(/\D/g, "");
      return (
        customer.fullName.toLowerCase().includes(normalized) ||
        (qDigits.length > 0 && mobile.includes(qDigits))
      );
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "fa"));
}

function mockCustomerListRows(query = ""): CustomerListRow[] {
  return mockSearchCustomers(query).map((customer) => {
    const customerBookings = bookingsForCustomer(customer.id);
    const lastBooking = latestBooking(customerBookings);
    return {
      customer,
      bookingCount: customerBookings.length,
      lastBooking: lastBooking
        ? {
            bookingId: lastBooking.id,
            bookingDate: lastBooking.bookingDate,
            startTime: earliestStartTime(lastBooking),
            status: lastBooking.status,
          }
        : undefined,
    };
  });
}

function mapApiError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "این شماره موبایل قبلاً برای مشتری دیگری ثبت شده است";
    }
    if (error.message) return error.message;
  }
  return fallback;
}

export function searchCustomers(query: string) {
  return mockSearchCustomers(query);
}

export async function fetchCustomers(query = ""): Promise<CustomerListRow[]> {
  if (!isApiEnabled()) {
    return mockCustomerListRows(query);
  }

  try {
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set("query", trimmed);
    const qs = params.toString();
    const items = await apiFetch<CustomerListRow[]>(
      `/salon/customers${qs ? `?${qs}` : ""}`,
    );
    syncCustomersToMock(items.map((row) => row.customer));
    return items;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری مشتریان با خطا مواجه شد", 0);
  }
}

export function customerListRows(query = ""): CustomerListRow[] {
  return mockCustomerListRows(query);
}

export function customerById(customerId: string | null) {
  if (!customerId) return undefined;
  return customers.find((item) => item.id === customerId);
}

export function customerRecentBookings(
  customerId: string,
  limit = 5,
): CustomerRecentBookingRow[] {
  return bookingsForCustomer(customerId)
    .sort((a, b) => {
      const dateCompare = b.bookingDate.localeCompare(a.bookingDate);
      if (dateCompare !== 0) return dateCompare;
      return earliestStartTime(b).localeCompare(earliestStartTime(a));
    })
    .slice(0, limit)
    .map((booking) => ({
      bookingId: booking.id,
      bookingDate: booking.bookingDate,
      serviceLabels: booking.services.map(
        (line) => serviceName(line.serviceId),
      ),
      status: booking.status,
      statusLabel: bookingStatusLabels[booking.status],
    }));
}

export async function fetchCustomerRecentBookings(
  customerId: string,
  limit = 5,
): Promise<CustomerRecentBookingRow[]> {
  if (!isApiEnabled()) {
    return customerRecentBookings(customerId, limit);
  }

  try {
    const items = await apiFetch<
      Array<{
        bookingId: string;
        bookingDate: string;
        serviceLabels: string[];
        status: BookingStatus;
      }>
    >(
      `/salon/customers/${encodeURIComponent(customerId)}/recent-bookings?limit=${limit}`,
    );
    return items.map((item) => ({
      ...item,
      statusLabel: bookingStatusLabels[item.status],
    }));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("بارگذاری رزروهای اخیر با خطا مواجه شد", 0);
  }
}

export function formatLastBookingLabel(
  bookingDate: string,
  startTime: string,
) {
  return `${formatJalaliShort(bookingDate)}، ${formatTimeDisplay(startTime)}`;
}

export function customerInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}`;
}

const avatarColors = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-emerald-100 text-emerald-700",
];

export function customerAvatarClass(customerId: string) {
  const index =
    customerId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    avatarColors.length;
  return avatarColors[index];
}

export type RegisterCustomerResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

function mockRegisterSalonCustomer(input: {
  fullName: string;
  mobile: string;
}): RegisterCustomerResult {
  if (!input.fullName.trim()) {
    return { ok: false, error: "نام و نام خانوادگی را وارد کنید" };
  }
  if (!isValidGuestMobile(input.mobile)) {
    return { ok: false, error: "شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید" };
  }

  const customer = findOrCreateCustomer(input.fullName, input.mobile);
  return { ok: true, customer };
}

export function registerSalonCustomer(input: {
  fullName: string;
  mobile: string;
}): RegisterCustomerResult {
  return mockRegisterSalonCustomer(input);
}

export async function registerSalonCustomerAsync(input: {
  fullName: string;
  mobile: string;
}): Promise<RegisterCustomerResult> {
  if (!input.fullName.trim()) {
    return { ok: false, error: "نام و نام خانوادگی را وارد کنید" };
  }
  if (!isValidGuestMobile(input.mobile)) {
    return { ok: false, error: "شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید" };
  }

  if (!isApiEnabled()) {
    return mockRegisterSalonCustomer(input);
  }

  try {
    const customer = await apiFetch<Customer>("/salon/customers", {
      method: "POST",
      body: JSON.stringify({
        fullName: input.fullName.trim(),
        mobile: normalizeMobile(input.mobile),
      }),
    });
    upsertCustomer(customer);
    return { ok: true, customer };
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error, "ثبت مشتری با خطا مواجه شد"),
    };
  }
}

export type UpdateCustomerResult =
  | { ok: true; customer: Customer }
  | { ok: false; error: string };

function mockUpdateSalonCustomer(
  customerId: string,
  input: { fullName: string; mobile: string },
): UpdateCustomerResult {
  const customer = customers.find((item) => item.id === customerId);
  if (!customer) {
    return { ok: false, error: "مشتری یافت نشد" };
  }
  if (!input.fullName.trim()) {
    return { ok: false, error: "نام و نام خانوادگی را وارد کنید" };
  }
  if (!isValidGuestMobile(input.mobile)) {
    return { ok: false, error: "شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید" };
  }

  const normalizedMobile = normalizeMobile(input.mobile);
  const duplicate = customers.find(
    (item) =>
      item.id !== customerId &&
      item.salonId === customer.salonId &&
      item.mobile === normalizedMobile,
  );
  if (duplicate) {
    return {
      ok: false,
      error: "این شماره موبایل قبلاً برای مشتری دیگری ثبت شده است",
    };
  }

  customer.fullName = input.fullName.trim();
  customer.mobile = normalizedMobile;
  return { ok: true, customer };
}

export function updateSalonCustomer(
  customerId: string,
  input: { fullName: string; mobile: string },
): UpdateCustomerResult {
  return mockUpdateSalonCustomer(customerId, input);
}

export async function updateSalonCustomerAsync(
  customerId: string,
  input: { fullName: string; mobile: string },
): Promise<UpdateCustomerResult> {
  if (!input.fullName.trim()) {
    return { ok: false, error: "نام و نام خانوادگی را وارد کنید" };
  }
  if (!isValidGuestMobile(input.mobile)) {
    return { ok: false, error: "شماره موبایل معتبر (۰۹xxxxxxxxx) وارد کنید" };
  }

  if (!isApiEnabled()) {
    return mockUpdateSalonCustomer(customerId, input);
  }

  try {
    const customer = await apiFetch<Customer>(
      `/salon/customers/${encodeURIComponent(customerId)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          fullName: input.fullName.trim(),
          mobile: normalizeMobile(input.mobile),
        }),
      },
    );
    upsertCustomer(customer);
    return { ok: true, customer };
  } catch (error) {
    return {
      ok: false,
      error: mapApiError(error, "به‌روزرسانی مشتری با خطا مواجه شد"),
    };
  }
}

export function formatCustomerMobile(mobile: string) {
  const normalized = normalizeMobile(mobile);
  if (normalized.length === 11) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 7)}-${normalized.slice(7)}`;
  }
  return mobile;
}

function bookingsForCustomer(customerId: string) {
  return bookings.filter((booking) => booking.customerId === customerId);
}

function earliestStartTime(booking: Booking) {
  const times = booking.services.map((line) => line.startTime).sort();
  return times[0] ?? "—";
}

function latestBooking(customerBookings: Booking[]) {
  if (customerBookings.length === 0) return undefined;
  return [...customerBookings].sort((a, b) => {
    const dateCompare = b.bookingDate.localeCompare(a.bookingDate);
    if (dateCompare !== 0) return dateCompare;
    return earliestStartTime(b).localeCompare(earliestStartTime(a));
  })[0];
}

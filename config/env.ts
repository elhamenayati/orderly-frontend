function readFlag(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value === "true";
}

export const env = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Mahoura",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api",
  publicSiteUrl:
    process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000",
  demoSalonId: process.env.NEXT_PUBLIC_DEMO_SALON_ID ?? "salon_lux",
  enableMockSms: readFlag(process.env.NEXT_PUBLIC_ENABLE_MOCK_SMS, true),
  enableCustomerBooking: readFlag(
    process.env.NEXT_PUBLIC_ENABLE_CUSTOMER_BOOKING,
    true,
  ),
} as const;

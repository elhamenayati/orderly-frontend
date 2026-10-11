import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { env } from "@/config/env";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: env.appName,
    template: `%s | ${env.appName}`,
  },
  description: "فرانت‌اند ماهورا برای مدیریت سالن، رزرو مشتری و ادمین پلتفرم",
  applicationName: env.appName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: env.appName,
  },
  icons: {
    icon: "/images/brand/logo.svg",
    apple: "/images/brand/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#C97C84",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

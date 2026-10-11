"use client";

import { useRouter } from "next/navigation";
import { canEnterAdminDemo } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";

export function AdminLoginForm() {
  const router = useRouter();

  function enterDemo() {
    if (!canEnterAdminDemo()) return;
    sessionStorage.setItem("mahoura:adminAuth", "1");
    router.push("/admin/salons");
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold">ورود مدیر پلتفرم</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        در MVP نقش‌ها و OTP نیست — ورود دمو برای دسترسی به پنل.
      </p>
      <Button
        type="button"
        className="mt-6 h-11 w-full rounded-xl"
        size="lg"
        onClick={enterDemo}
      >
        ورود دمو
      </Button>
    </div>
  );
}

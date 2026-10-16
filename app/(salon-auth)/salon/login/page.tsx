import type { Metadata } from "next";
import { SalonLoginForm } from "@/components/salon/salon-login-form";

export const metadata: Metadata = {
  title: "ورود به پنل | Abrinak",
};

export default function SalonLoginPage() {
  return <SalonLoginForm />;
}

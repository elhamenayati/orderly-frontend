import { SalonAuthShell } from "@/components/salon/auth/salon-auth-shell";

export default function SalonAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SalonAuthShell>{children}</SalonAuthShell>;
}

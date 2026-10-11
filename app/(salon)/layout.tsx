import { SalonShell } from "@/components/shells/salon-shell";

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SalonShell>{children}</SalonShell>;
}

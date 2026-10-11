import { AdminShell } from "@/components/shells/admin-shell";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}

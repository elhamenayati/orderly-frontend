import { AdminSalonDetailPage } from "@/components/admin/salon-detail-page";

export default async function AdminSalonDetailRoute({
  params,
}: {
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  return <AdminSalonDetailPage salonId={salonId} />;
}

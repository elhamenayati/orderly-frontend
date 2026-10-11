import { Suspense } from "react";
import { StylistDetailPage } from "@/components/salon/stylist-detail-page";

export default async function StylistDetailRoute({
  params,
}: {
  params: Promise<{ stylistId: string }>;
}) {
  const { stylistId } = await params;
  return (
    <Suspense fallback={null}>
      <StylistDetailPage mode="detail" stylistId={stylistId} />
    </Suspense>
  );
}

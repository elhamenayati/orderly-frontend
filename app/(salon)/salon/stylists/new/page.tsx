import { Suspense } from "react";
import { StylistDetailPage } from "@/components/salon/stylist-detail-page";

export default function NewStylistPage() {
  return (
    <Suspense fallback={null}>
      <StylistDetailPage mode="create" />
    </Suspense>
  );
}

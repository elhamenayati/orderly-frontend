import { Suspense } from "react";
import { SalonBookingFormPage } from "@/components/salon/booking-form-page";

export default function SalonBookingNewPage() {
  return (
    <Suspense fallback={null}>
      <SalonBookingFormPage mode="create" />
    </Suspense>
  );
}

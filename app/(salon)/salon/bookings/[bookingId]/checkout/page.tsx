import { BookingCheckoutPage } from "@/components/salon/booking-checkout-page";

export default async function SalonBookingCheckoutRoute({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <BookingCheckoutPage bookingId={bookingId} />;
}

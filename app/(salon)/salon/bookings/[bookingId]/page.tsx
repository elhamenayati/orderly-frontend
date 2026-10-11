import { BookingDetailPage } from "@/components/salon/booking-detail-page";

export default async function SalonBookingDetailRoute({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  return <BookingDetailPage bookingId={bookingId} />;
}

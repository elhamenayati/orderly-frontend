export type BookingNotification = {
  id: string;
  bookingId: string;
  customerId: string;
  type: "cancellation";
  message: string;
  sentAt: string;
};

export const bookingNotifications: BookingNotification[] = [];

let notificationCounter = 0;

function nextNotificationId() {
  notificationCounter += 1;
  return `notif_${notificationCounter}`;
}

export function sendBookingCancellationNotification(input: {
  bookingId: string;
  customerId: string;
}) {
  const notification: BookingNotification = {
    id: nextNotificationId(),
    bookingId: input.bookingId,
    customerId: input.customerId,
    type: "cancellation",
    message: "نوبت شما لغو شد. در صورت نیاز با سالن تماس بگیرید.",
    sentAt: new Date().toISOString(),
  };

  bookingNotifications.push(notification);
  return notification;
}

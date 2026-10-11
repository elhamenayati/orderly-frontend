export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
/** 0 = Sunday, matching `Date.getDay()`. */

export type SalonStatus = "active" | "inactive" | "suspended" | "pending";

export type Salon = {
  id: string;
  brandName: string;
  legalName: string;
  mobile: string;
  phone?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  category?: string;
  logoPath?: string;
  heroImagePath?: string;
  galleryImagePaths?: string[];
  cancellationPolicy: string;
  status: SalonStatus;
};

export type WeeklyScheduleSlot = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type SalonScheduleExceptionType = "full_closure" | "special_hours";

export type SalonScheduleException = {
  id: string;
  salonId: string;
  date: string;
  dateTo?: string;
  type: SalonScheduleExceptionType;
  startTime?: string;
  endTime?: string;
  note?: string;
  status: "active";
};

export type SalonSchedule = {
  salonId: string;
  weeklySlots: WeeklyScheduleSlot[];
  /** @deprecated use exceptions — kept in sync for legacy reads */
  closedDates: string[];
  exceptions: SalonScheduleException[];
};

export type ServiceCategory = {
  id: string;
  salonId: string;
  name: string;
  sortOrder: number;
};

export type Service = {
  id: string;
  salonId: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  minimumDeposit: number;
  isActive: boolean;
};

export type StylistGender = "female" | "male";

export type Stylist = {
  id: string;
  salonId: string;
  displayName: string;
  mobile: string;
  avatarPath?: string;
  gender?: StylistGender;
  description?: string;
  isActive: boolean;
};

export type StylistService = {
  id: string;
  stylistId: string;
  serviceId: string;
  startingPrice: number;
  isActive: boolean;
};

export type StylistSchedule = {
  stylistId: string;
  weeklySlots: WeeklyScheduleSlot[];
  unavailableDates: string[];
};

export type Customer = {
  id: string;
  salonId: string;
  fullName: string;
  mobile: string;
  notes?: string;
  createdAt: string;
};

export type BookingStatus = "draft" | "confirmed" | "cancelled" | "completed";

export type BookingService = {
  id: string;
  bookingId: string;
  serviceId: string;
  stylistId: string;
  startTime: string;
  reservedDurationMinutes: number;
  estimatedPrice: number;
  finalActualAmount: number | null;
};

export type Booking = {
  id: string;
  salonId: string;
  customerId: string;
  bookingDate: string;
  status: BookingStatus;
  source: "guest" | "salon";
  notes?: string;
  cancellationReason?: string;
  cancelledBy?: "salon" | "guest";
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  services: BookingService[];
};

export type ContractType =
  | "percentage"
  | "chair_rent"
  | "fixed_salary"
  | "fixed_salary_plus_commission";

export type FinancialPeriod = "monthly" | "weekly" | "daily";

export type StylistContract = {
  id: string;
  stylistId: string;
  type: ContractType;
  effectiveFrom: string;
  effectiveTo?: string;
  financialPeriod: FinancialPeriod;
  financialPeriodStartDay: number;
  percentage?: number;
  chairRent?: number;
  fixedSalary?: number;
  commissionPercentage?: number;
  isActive: boolean;
};

export type StylistContractAuditAction = "created" | "updated" | "superseded";

export type StylistContractAuditLog = {
  id: string;
  stylistId: string;
  contractId: string;
  action: StylistContractAuditAction;
  changedByUserId?: string;
  changedByName: string;
  previousData?: StylistContract;
  newData: StylistContract;
  createdAt: string;
};

export type PaymentTransaction = {
  id: string;
  salonId: string;
  bookingId?: string;
  direction: "inflow" | "outflow";
  kind: "cash" | "card" | "adjustment";
  amount: number;
  occurredAt: string;
  note?: string;
  referenceNumber?: string;
  createdBy?: string;
};

export type StylistSettlement = {
  id: string;
  salonId: string;
  stylistId: string;
  contractId: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
  status: "draft" | "paid";
  paidAt?: string;
};

export type SettlementDirection = "salon_to_stylist" | "stylist_to_salon";

export type SettlementMethod = "cash" | "card" | "transfer" | "other";

export type StylistSettlementRecord = {
  id: string;
  salonId: string;
  stylistId: string;
  contractId: string;
  periodStart: string;
  periodEnd: string;
  direction: SettlementDirection;
  amount: number;
  occurredAt: string;
  method: SettlementMethod;
  referenceNumber?: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  salonId: string;
  planName: string;
  startsAt: string;
  endsAt: string;
  status: "trial" | "active" | "expired";
  paymentStatus?: SubscriptionPaymentStatus;
  renewedAt?: string;
  renewedBy?: string;
};

export type SubscriptionPaymentStatus = "paid" | "unpaid";

export type SubscriptionAction = "created" | "renewed" | "payment_updated";

export type SubscriptionHistoryEntry = {
  id: string;
  salonId: string;
  subscriptionId?: string;
  action: SubscriptionAction;
  planName: string;
  startsAt: string;
  endsAt: string;
  status: Subscription["status"];
  paymentStatus: SubscriptionPaymentStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
};

export type AdminSalonRecord = {
  salonId: string;
  displayCode: string;
  ownerName: string;
  ownerMobile: string;
  ownerEmail?: string;
  category?: string;
  subscriptionId: string;
  createdAt: string;
  paymentStatus: SubscriptionPaymentStatus;
  lastStatusChangeAt?: string;
  lastStatusChangeBy?: string;
  lastRenewalAt?: string;
  lastRenewalBy?: string;
};

export type AdminSalonStatusHistoryEntry = {
  id: string;
  salonId: string;
  fromStatus: SalonStatus | null;
  toStatus: SalonStatus;
  changedBy: string;
  changedAt: string;
  note?: string;
};

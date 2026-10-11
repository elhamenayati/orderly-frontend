import type { PaymentTransaction, StylistSettlement } from "@/types/domain";
import type {
  SettlementDirection,
  SettlementMethod,
  StylistSettlementRecord,
} from "@/types/domain";

export const paymentTransactions: PaymentTransaction[] = [];

export const stylistSettlements: StylistSettlement[] = [];

export const stylistSettlementRecords: StylistSettlementRecord[] = [];

export const settlementDirectionLabels: Record<SettlementDirection, string> = {
  salon_to_stylist: "سالن ← آرایشگر",
  stylist_to_salon: "آرایشگر ← سالن",
};

export const settlementMethodLabels: Record<SettlementMethod, string> = {
  cash: "نقدی",
  card: "کارت",
  transfer: "کارت به کارت",
  other: "سایر",
};

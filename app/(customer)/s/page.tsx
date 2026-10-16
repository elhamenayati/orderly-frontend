import { CustomerHub } from "@/components/hub/customer-hub";

/** Guest/customer salon public page. On port 4000, `/` rewrites here. */
export default function SalonPublicPage() {
  return <CustomerHub />;
}

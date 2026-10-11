import Image from "next/image";
import { OrderlyLogo } from "@/components/icons/orderly-logo";

export function SalonAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-shell="salon"
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-muted/40 p-4"
    >
      <Image
        src="/images/customer/hero.svg"
        alt=""
        fill
        priority
        className="object-cover opacity-20 blur-sm"
      />
      <div className="relative z-10 w-full max-w-md">{children}</div>
      <div className="pointer-events-none absolute bottom-4 start-4 opacity-40">
        <OrderlyLogo className="h-[2.55rem]" />
      </div>
    </div>
  );
}

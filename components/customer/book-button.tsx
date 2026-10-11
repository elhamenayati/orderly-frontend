"use client";

import Link from "next/link";
import { env } from "@/config/env";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookButtonProps = {
  className?: string;
  variant?: "default" | "outline";
  size?: "default" | "lg";
  children?: React.ReactNode;
};

export function BookButton({
  className,
  variant = "default",
  size = "lg",
  children = "رزرو نوبت",
}: BookButtonProps) {
  if (!env.enableCustomerBooking) return null;

  return (
    <Link
      href="/book"
      className={cn(buttonVariants({ variant, size }), "rounded-xl", className)}
    >
      {children}
    </Link>
  );
}

import { cn } from "@/lib/utils";

type LotusLogoProps = {
  className?: string;
};

export function LotusLogo({ className }: LotusLogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      aria-hidden
    >
      <path
        d="M24 8c2.8 5.2 4 9.4 4 14.2C28 16.8 25.4 12 24 8Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M24 8c-2.8 5.2-4 9.4-4 14.2C20 16.8 22.6 12 24 8Z"
        fill="currentColor"
        opacity="0.8"
      />
      <path
        d="M11 16c5.6 2.2 9.4 5.4 12 10.8-4.6-2.6-8.8-5.6-12-10.8Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M37 16c-5.6 2.2-9.4 5.4-12 10.8 4.6-2.6 8.8-5.6 12-10.8Z"
        fill="currentColor"
        opacity="0.75"
      />
      <path
        d="M8 28c6.2-.4 11.2 1.2 16 5.4-5.8-1.2-11.2-2.8-16-5.4Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M40 28c-6.2-.4-11.2 1.2-16 5.4 5.8-1.2 11.2-2.8 16-5.4Z"
        fill="currentColor"
        opacity="0.65"
      />
      <path
        d="M24 22c2.4 5.6 3 9.6 0 18-3-8.4-2.4-12.4 0-18Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="3.2" fill="#fff" opacity="0.9" />
    </svg>
  );
}

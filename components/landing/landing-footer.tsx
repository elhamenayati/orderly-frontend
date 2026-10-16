import Link from "next/link";
import Image from "next/image";

const FOOTER_LINKS = [
  { href: "#features", label: "امکانات" },
  { href: "#workflow", label: "نحوه کار" },
  { href: "#contact", label: "تماس با ما" },
  { href: "/salon/login", label: "ورود" },
  { href: "#privacy", label: "حریم خصوصی" },
  { href: "#terms", label: "شرایط استفاده" },
] as const;

export function LandingFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 border-t border-border bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md space-y-3">
          <div className="flex items-center gap-2">
            <Image
              src="/images/brand/abrinak-mark-v2.png"
              alt=""
              width={36}
              height={36}
              className="size-9 object-contain"
            />
            <span className="text-lg font-bold text-primary">ابرینک</span>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            ابرینک، نرم‌افزار مدیریت سالن برای رزرو، خدمات، آرایشگران و امور
            مالی.
          </p>
        </div>

        <nav aria-label="لینک‌های پاورقی" className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
          {FOOTER_LINKS.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                href={link.href}
                className="text-foreground/80 transition hover:text-primary"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-foreground/80 transition hover:text-primary"
              >
                {link.label}
              </a>
            ),
          )}
        </nav>
      </div>

      <div
        id="privacy"
        className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground sm:px-6"
      >
        <p id="terms">
          © {new Date().getFullYear()} ابرینک · مدیریت هوشمند سالن زیبایی
        </p>
      </div>
    </footer>
  );
}

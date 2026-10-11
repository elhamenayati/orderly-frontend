"use client";

import Image from "next/image";
import {
  salon,
  formatSalonHoursSummary,
  salonMapUrl,
  salonPhoneHref,
} from "@/lib/salon/public-data";

export function SalonHero() {
  const heroPath = salon.heroImagePath ?? "/images/customer/hero.svg";

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-none md:aspect-[5/4] md:rounded-2xl">
      <Image
        src={heroPath}
        alt={salon.brandName}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 md:hidden">
        <h1 className="text-xl font-semibold text-white">{salon.brandName}</h1>
        <p className="mt-1 text-sm text-white/90">{salon.description}</p>
      </div>
    </div>
  );
}

export function SalonHeader() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        {salon.brandName}
      </h1>
      {salon.description ? (
        <p className="text-sm leading-7 text-muted-foreground md:text-[15px]">
          {salon.description}
        </p>
      ) : null}
    </div>
  );
}

export function InfoCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <InfoCard
        title="تلفن"
        body={salon.mobile}
        href={salonPhoneHref(salon.mobile)}
        linkLabel="تماس با ما"
      />
      <InfoCard
        title="آدرس"
        body={salon.address}
        href={salonMapUrl()}
        linkLabel="مشاهده روی نقشه"
      />
      <InfoCard title="ساعت کاری" body={formatSalonHoursSummary()} />
    </div>
  );
}

function InfoCard({
  title,
  body,
  href,
  linkLabel,
}: {
  title: string;
  body: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-none">
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      {href && linkLabel ? (
        <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="mt-2 inline-block text-xs text-primary">
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}

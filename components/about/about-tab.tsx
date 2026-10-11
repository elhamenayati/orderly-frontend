import { Clock, MapPin, Phone } from "lucide-react";
import {
  formatSalonHoursList,
  salon,
  salonMapUrl,
  salonPhoneHref,
} from "@/lib/salon/public-data";
import { BookButton } from "@/components/customer/book-button";
import { Card, CardContent } from "@/components/ui/card";

export function AboutTab() {
  const hours = formatSalonHoursList();

  return (
    <div className="space-y-6 px-4 pb-4 md:px-0">
      <div>
        <h2 className="text-xl font-semibold">ساعت کاری و آدرس</h2>
        {salon.description ? (
          <p className="mt-3 text-sm leading-8 text-muted-foreground md:text-[15px]">
            {salon.description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="shadow-none">
          <CardContent className="space-y-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-rose-soft text-primary">
              <Phone className="size-4" />
            </span>
            <p className="text-sm font-medium">تماس</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {salon.mobile}
            </p>
            <a href={salonPhoneHref(salon.mobile)} className="text-xs text-primary">
              تماس با سالن
            </a>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="space-y-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-rose-soft text-primary">
              <MapPin className="size-4" />
            </span>
            <p className="text-sm font-medium">آدرس</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {salon.address}
            </p>
            <a
              href={salonMapUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary"
            >
              مشاهده روی نقشه
            </a>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="space-y-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-rose-soft text-primary">
              <Clock className="size-4" />
            </span>
            <p className="text-sm font-medium">ساعت کاری</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {hours.map((item) => (
                <li key={`${item.days}-${item.time}`} className="flex justify-between gap-3">
                  <span>{item.days}</span>
                  <span>{item.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <BookButton className="h-12 w-full text-base" />
    </div>
  );
}

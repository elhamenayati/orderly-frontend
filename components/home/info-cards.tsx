import { Clock, MapPin, Phone } from "lucide-react";
import { salon } from "@/data/salon";
import { Card, CardContent } from "@/components/ui/card";

export function InfoCards() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <Card className="shadow-none">
        <CardContent className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-primary">
            <Phone className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">تلفن</p>
            <p className="mt-1 text-sm text-muted-foreground" dir="ltr">
              {salon.phone}
            </p>
            <a href={salon.phoneHref} className="mt-1 inline-block text-xs text-primary">
              تماس با ما
            </a>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-primary">
            <MapPin className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">موقعیت</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {salon.address}
            </p>
            <a
              href={salon.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-xs text-primary"
            >
              مشاهده روی نقشه
            </a>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-primary">
            <Clock className="size-4" />
          </span>
          <div>
            <p className="text-sm font-medium">ساعت کاری</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {salon.hoursSummary}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

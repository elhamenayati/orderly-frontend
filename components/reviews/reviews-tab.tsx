import { MessageCircle } from "lucide-react";
import { reviews, salon } from "@/data/salon";
import { formatCount, formatRating } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";

export function ReviewsTab() {
  return (
    <div className="space-y-6 px-4 pb-4 md:px-0">
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-border">
        <div className="flex items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-soft text-primary">
            <MessageCircle className="size-7" />
          </div>
          <div>
            <p className="text-3xl font-semibold">{formatRating(salon.rating)}</p>
            <StarRating value={salon.rating} className="mt-1" />
            <p className="mt-1 text-sm text-muted-foreground">
              بر اساس {formatCount(salon.reviewCount)} نظر مشتریان
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id} className="shadow-none">
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{review.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {review.service} · {review.date}
                  </p>
                </div>
                <StarRating value={review.rating} />
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {review.text}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

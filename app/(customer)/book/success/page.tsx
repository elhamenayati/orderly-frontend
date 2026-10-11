import { Suspense } from "react";
import { BookSuccessContent } from "@/components/booking/book-success-content";

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-muted-foreground">
          در حال بارگذاری...
        </div>
      }
    >
      <BookSuccessContent />
    </Suspense>
  );
}

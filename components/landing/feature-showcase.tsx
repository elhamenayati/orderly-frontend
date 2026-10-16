import { Check } from "lucide-react";
import { ProductShot } from "@/components/landing/product-shot";
import { cn } from "@/lib/utils";

type FeatureBlockProps = {
  id?: string;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
};

function FeatureBlock({
  id,
  title,
  description,
  bullets,
  imageSrc,
  imageAlt,
  reverse = false,
}: FeatureBlockProps) {
  return (
    <article
      id={id}
      className="scroll-mt-24 py-14 sm:py-16"
    >
      <div
        className={cn(
          "mx-auto grid max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <div>
          <h3 className="text-xl font-bold sm:text-2xl">{title}</h3>
          <p className="mt-3 text-sm leading-8 text-muted-foreground sm:text-base">
            {description}
          </p>
          <ul className="mt-6 space-y-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Check className="size-3 stroke-[3]" aria-hidden />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
        <ProductShot
          src={imageSrc}
          alt={imageAlt}
          sizes="(max-width: 1024px) 100vw, 540px"
        />
      </div>
    </article>
  );
}

export function FeatureShowcase() {
  return (
    <section id="features" className="scroll-mt-24 bg-[#f5f4fa]">
      <div className="mx-auto max-w-6xl px-4 pb-4 pt-16 text-center sm:px-6 sm:pt-20">
        <h2 className="text-2xl font-bold sm:text-3xl">امکانات کلیدی ابرینک</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          همان قابلیت‌هایی که امروز در پنل سالن در دسترس است — بدون ادعاهای آینده.
        </p>
      </div>

      <FeatureBlock
        title="رزرو چندخدمتی، با زمان و آرایشگر مستقل"
        description="برای هر رزرو می‌توان چند خدمت تعریف کرد و برای هر خدمت، آرایشگر، زمان شروع، مدت و قیمت تخمینی را جداگانه مدیریت کرد."
        bullets={[
          "چند خدمت در یک رزرو",
          "آرایشگر مستقل برای هر خدمت",
          "زمان مستقل برای هر خدمت",
          "مدت قابل تنظیم برای هر خدمت",
        ]}
        imageSrc="/images/landing/feature-multiservice-v2.png"
        imageAlt="صفحه رزرو چندخدمتی در ابرینک"
      />

      <FeatureBlock
        reverse
        title="مدیریت کامل آرایشگران"
        description="خدمات، قیمت‌ها، برنامه کاری و قرارداد مالی هر آرایشگر را در یک محل مدیریت کنید."
        bullets={[
          "خدمات و قیمت‌های آرایشگر",
          "برنامه کاری هفتگی",
          "قرارداد مالی",
          "وضعیت فعال / غیرفعال",
        ]}
        imageSrc="/images/landing/feature-stylists-v2.png"
        imageAlt="صفحه مدیریت آرایشگران در ابرینک"
      />

      <FeatureBlock
        title="مدیریت خدمات سالن"
        description="خدمات سالن را با دسته‌بندی، مدت تقریبی، حداقل بیعانه و وضعیت فعال یا غیرفعال مدیریت کنید."
        bullets={[
          "دسته‌بندی خدمات",
          "مدت تقریبی",
          "حداقل بیعانه",
          "وضعیت فعال / غیرفعال",
        ]}
        imageSrc="/images/landing/feature-services-v2.png"
        imageAlt="صفحه مدیریت خدمات سالن در ابرینک"
      />
    </section>
  );
}

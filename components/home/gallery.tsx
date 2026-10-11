"use client";

import { useState } from "react";
import Image from "next/image";
import { salon } from "@/data/salon";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils";

export function Gallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = salon.gallery[activeIndex];

  return (
    <div className="space-y-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-none md:aspect-[5/4] md:rounded-2xl">
        <Image
          src={active.src}
          alt={active.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 md:hidden">
          <h1 className="text-xl font-semibold text-white">{salon.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-white">
            <StarRating value={salon.rating} />
            <span className="text-sm">{salon.rating}</span>
          </div>
        </div>
      </div>
      <div className="hidden grid-cols-5 gap-2 px-0 md:grid">
        {salon.gallery.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl ring-2 ring-transparent",
              activeIndex === index && "ring-primary"
            )}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="120px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

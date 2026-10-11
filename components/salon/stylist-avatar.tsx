"use client";

import { useEffect, useState } from "react";
import {
  resolveStylistAvatarPath,
  stylistAvatarSrc,
} from "@/lib/salon/stylist-avatar";
import { cn } from "@/lib/utils";

type StylistAvatarProps = {
  stylistId?: string;
  avatarPath?: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
};

const sizeClasses = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-16 text-lg",
};

export function StylistAvatar({
  stylistId,
  avatarPath,
  name,
  size = "sm",
  className,
  fallbackClassName,
}: StylistAvatarProps) {
  const [displayPath, setDisplayPath] = useState(avatarPath);

  useEffect(() => {
    if (!stylistId) {
      setDisplayPath(avatarPath);
      return;
    }
    setDisplayPath(resolveStylistAvatarPath(stylistId, avatarPath) ?? avatarPath);
  }, [stylistId, avatarPath]);

  const src = displayPath ? stylistAvatarSrc(displayPath) : undefined;
  const sizeClass = sizeClasses[size];

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={cn(sizeClass, "shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        sizeClass,
        "flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary",
        fallbackClassName,
        className,
      )}
    >
      {name.trim().slice(0, 1) || "?"}
    </span>
  );
}

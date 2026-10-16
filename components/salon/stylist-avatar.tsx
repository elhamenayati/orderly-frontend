"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_AVATAR_PATH,
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
}: StylistAvatarProps) {
  const [displayPath, setDisplayPath] = useState(
    avatarPath || DEFAULT_AVATAR_PATH,
  );

  useEffect(() => {
    if (!stylistId) {
      setDisplayPath(avatarPath || DEFAULT_AVATAR_PATH);
      return;
    }
    setDisplayPath(
      resolveStylistAvatarPath(stylistId, avatarPath) ||
        avatarPath ||
        DEFAULT_AVATAR_PATH,
    );
  }, [stylistId, avatarPath]);

  const src = stylistAvatarSrc(displayPath);
  const sizeClass = sizeClasses[size];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={cn(
        sizeClass,
        "shrink-0 rounded-full bg-white object-cover p-0.5",
        className,
      )}
    />
  );
}

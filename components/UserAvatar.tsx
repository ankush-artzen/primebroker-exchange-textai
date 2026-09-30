"use client";

import Image from "next/image";
import { cn, getInitials } from "@/lib/utils";

interface Props {
  name?: string | null;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}

export function UserAvatar({ name, imageUrl, size = 44, className }: Props) {
  const initials = getInitials(name);

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name ? `${name}'s profile` : "Profile"}
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {initials}
    </div>
  );
}

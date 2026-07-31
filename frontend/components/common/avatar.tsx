"use client";

import * as RadixAvatar from "@radix-ui/react-avatar";
import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  accentColor?: string;
}

const sizeClasses = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-14 h-14 text-base",
};

/** User Avatar using Radix UI Avatar primitive with initials fallback */
export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
  accentColor = "var(--primary)",
}: AvatarProps) {
  const initials = getInitials(firstName, lastName);

  return (
    <RadixAvatar.Root
      className={cn(
        "relative inline-flex items-center justify-center rounded-full overflow-hidden select-none shrink-0",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: accentColor }}
    >
      {src && (
        <RadixAvatar.Image
          src={src}
          alt={`${firstName ?? ""} ${lastName ?? ""}`}
          className="w-full h-full object-cover"
        />
      )}
      <RadixAvatar.Fallback
        className="flex items-center justify-center w-full h-full text-white font-semibold uppercase tracking-wider"
      >
        {initials}
      </RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "secondary";
}

const variantClasses = {
  default: "bg-black text-white",
  outline: "border border-gray-200 bg-white text-gray-900",
  secondary: "bg-gray-100 text-gray-800",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

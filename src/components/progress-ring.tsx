
"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0 to 100
  className?: string;
  strokeWidth?: number;
}

export function ProgressRing({ value, className, strokeWidth = 12 }: ProgressRingProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative h-48 w-48", className)}>
      <svg className="h-full w-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className="stroke-current text-muted/30"
          strokeWidth={strokeWidth}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          className="stroke-current text-primary transition-all duration-500"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          transform="rotate(-90 50 50)" // Start from the top
        />
      </svg>
    </div>
  );
}

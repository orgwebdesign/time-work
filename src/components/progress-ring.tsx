
"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0 to 100
  className?: string;
  strokeWidth?: number;
  hours: string;
  minutes: string;
  seconds: string;
}

export function ProgressRing({ value, className, strokeWidth = 8, hours, minutes, seconds }: ProgressRingProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={cn("relative", className)}>
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="flex items-baseline justify-center gap-1 font-bold tracking-tighter text-2xl sm:text-4xl">
            <span>{hours}</span><span className="text-lg">h</span>
            <span>{minutes}</span><span className="text-lg">m</span>
            <div className="relative w-[3ch] h-[1.2em] overflow-hidden">
                <span key={seconds} className="absolute inset-0 animate-slide-up-second">{seconds}</span>
            </div>
            <span className="text-lg">s</span>
        </div>
      </div>
    </div>
  );
}

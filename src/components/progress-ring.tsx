
'use client';

import { cn } from '@/lib/utils';

interface ProgressRingProps {
  value: number; // 0 to 100
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({ value, strokeWidth = 4, className }: ProgressRingProps) {
  const radius = 50 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg className={cn('transform -rotate-90', className)} viewBox="0 0 100 100">
      <circle
        className="text-secondary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
      />
      <circle
        className="text-primary"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx="50"
        cy="50"
        style={{
          transition: 'stroke-dashoffset 0.5s ease-out',
        }}
      />
    </svg>
  );
}

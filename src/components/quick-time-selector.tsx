"use client";

import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const timeOptions = [
  { label: "Morning", value: "09:00" },
  { label: "Afternoon", value: "13:00" },
  { label: "Evening", value: "18:00" },
];

interface QuickTimeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function QuickTimeSelector({ value, onChange }: QuickTimeSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {timeOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "secondary" : "outline"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-8 text-xs"
        >
          {option.label}
        </Button>
      ))}
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
            type="time"
            className="w-[120px] h-8 pl-9"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

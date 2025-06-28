"use client";

import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const timeOptions = [
  { label: "Morning", value: "09:00" },
  { label: "Afternoon", value: "13:00" },
  { label: "Evening", value: "18:00" },
];

const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

interface QuickTimeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function QuickTimeSelector({ value, onChange }: QuickTimeSelectorProps) {
  const [selectedHour, selectedMinute] = value ? value.split(':') : [undefined, undefined];

  const handleHourChange = (newHour: string) => {
    const minute = selectedMinute || '00';
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    if (selectedHour) {
      onChange(`${selectedHour}:${newMinute}`);
    }
  };

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
      <div className="flex items-center gap-1.5">
        <Select value={selectedHour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[75px] h-8 text-xs">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="font-semibold text-muted-foreground">:</span>
        <Select value={selectedMinute} onValueChange={handleMinuteChange} disabled={!selectedHour}>
          <SelectTrigger className="w-[75px] h-8 text-xs">
            <SelectValue placeholder="Minute" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

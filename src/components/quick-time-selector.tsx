"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
  const [hourPopoverOpen, setHourPopoverOpen] = useState(false);
  const [minutePopoverOpen, setMinutePopoverOpen] = useState(false);

  const [selectedHour, selectedMinute] = value ? value.split(':') : [undefined, undefined];

  const handleHourChange = (newHour: string) => {
    const minute = selectedMinute || '00';
    onChange(`${newHour}:${minute}`);
    setHourPopoverOpen(false);
  };

  const handleMinuteChange = (newMinute: string) => {
    if (selectedHour) {
      onChange(`${selectedHour}:${newMinute}`);
    }
    setMinutePopoverOpen(false);
  };

  const handlePresetClick = (presetValue: string) => {
    onChange(presetValue);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {timeOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant={value === option.value ? "secondary" : "outline"}
          size="sm"
          onClick={() => handlePresetClick(option.value)}
          className="h-8 text-xs"
        >
          {option.label}
        </Button>
      ))}

      <div className="flex items-center gap-1.5 bg-input/50 p-1 rounded-lg">
        <Popover open={hourPopoverOpen} onOpenChange={setHourPopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-[50px] h-8 text-sm font-mono tracking-widest">
              {selectedHour || '--'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="grid grid-cols-6 gap-1">
              {hours.map(h => 
                <Button 
                  key={h} 
                  variant={h === selectedHour ? 'primary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8 text-xs"
                  onClick={() => handleHourChange(h)}
                >
                  {h}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <span className="font-semibold text-muted-foreground animate-pulse">:</span>

        <Popover open={minutePopoverOpen} onOpenChange={setMinutePopoverOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="w-[50px] h-8 text-sm font-mono tracking-widest" disabled={!selectedHour}>
              {selectedMinute || '--'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-card/80 backdrop-blur-sm border-border/50">
            <div className="grid grid-cols-4 gap-1">
              {minutes.map(m => 
                <Button 
                  key={m} 
                  variant={m === selectedMinute ? 'primary' : 'ghost'} 
                  size="icon" 
                  className="h-8 w-8 text-xs"
                  onClick={() => handleMinuteChange(m)}
                >
                  {m}
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

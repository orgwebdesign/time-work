"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, PlusCircle, Clock, BellRing } from 'lucide-react';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from './ui/switch';

const formSchema = z.object({
  text: z.string().min(1, { message: "Task cannot be empty." }),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  alarmEnabled: z.boolean().default(true),
});

interface AddTaskProps {
  onAddTask: (text: string, dueDate?: Date, alarmEnabled?: boolean) => void;
}

export default function AddTask({ onAddTask }: AddTaskProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: "",
      alarmEnabled: true,
    },
  });

  const watchDueDate = form.watch("dueDate");

  function onSubmit(values: z.infer<typeof formSchema>) {
    let finalDueDate: Date | undefined = values.dueDate;
    if (finalDueDate && values.dueTime) {
        const [hours, minutes] = values.dueTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
          finalDueDate.setHours(hours, minutes, 0, 0);
        }
    }
    
    onAddTask(values.text, finalDueDate, finalDueDate ? values.alarmEnabled : false);
    form.reset();
    form.setValue('alarmEnabled', true);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input placeholder="e.g. Renew gym membership" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="icon" aria-label="Add Task">
              <PlusCircle />
            </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-auto md:w-[150px] justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-0 md:mr-2 h-4 w-4" />
                          <span className="hidden md:inline">
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          </span>
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )}
            />
            
            {watchDueDate && (
                <FormField
                    control={form.control}
                    name="dueTime"
                    render={({ field }) => (
                        <FormItem>
                             <FormControl>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input type="time" className="w-[120px] pl-9" {...field} />
                                </div>
                            </FormControl>
                        </FormItem>
                    )}
                />
            )}

            {watchDueDate && (
                <FormField
                    control={form.control}
                    name="alarmEnabled"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                                <Switch
                                    id="alarm-enabled"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                            <FormLabel htmlFor="alarm-enabled" className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
                                <BellRing className="size-4" />
                                <span>Alarm</span>
                            </FormLabel>
                        </FormItem>
                    )}
                />
            )}
        </div>
      </form>
    </Form>
  );
}

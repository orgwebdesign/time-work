"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Task } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from './ui/button';
import { Calendar, Edit, GripVertical, Trash2, X, Check, Clock, BellOff, BellRing } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from './ui/form';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { getTaskAlarm } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Switch } from './ui/switch';

const formSchema = z.object({
  text: z.string().min(1, { message: "Task cannot be empty." }),
  dueDate: z.date().optional(),
  dueTime: z.string().optional(),
  alarmEnabled: z.boolean(),
});

interface TaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, newValues: Partial<Omit<Task, 'id' | 'listId' | 'completed'>>) => void;
}

export default function TaskItem({ task, onToggleTask, onDeleteTask, onUpdateTask }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const checkDueDate = async () => {
      if (task.dueDate && !task.completed && task.alarmEnabled) {
        try {
          const dueDate = new Date(task.dueDate);
          
          if (isPast(dueDate)) {
            setTimeRemaining("Overdue");

            const alarmKey = `alarm-triggered-${task.id}`;
            const hasBeenTriggered = localStorage.getItem(alarmKey) === 'true';

            if (!hasBeenTriggered) {
              localStorage.setItem(alarmKey, 'true');
              const alarmData = await getTaskAlarm(task.text);
              if (alarmData) {
                if (audioRef.current) {
                    audioRef.current.src = alarmData.audioDataUri;
                } else {
                    audioRef.current = new Audio(alarmData.audioDataUri);
                }
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));

                toast({
                    title: `"${task.text}" is due!`,
                    description: alarmData.message,
                    duration: 10000, 
                });
              }
            }
          } else {
            setTimeRemaining(formatDistanceToNow(dueDate, { addSuffix: true }));
          }
        } catch (e) {
          setTimeRemaining("Invalid date");
        }
      } else if (task.dueDate && !task.completed) {
        try {
            const dueDate = new Date(task.dueDate);
            if(isPast(dueDate)) {
                setTimeRemaining("Overdue");
            } else {
                setTimeRemaining(formatDistanceToNow(dueDate, { addSuffix: true }));
            }
        } catch (e) {
            setTimeRemaining("Invalid date");
        }
      }
    };

    checkDueDate();
    intervalId = setInterval(checkDueDate, 60000); // Re-check every minute

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [task.id, task.text, task.dueDate, task.completed, task.alarmEnabled, toast]);


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: task.text,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      dueTime: task.dueDate ? format(new Date(task.dueDate), 'HH:mm') : '',
      alarmEnabled: task.alarmEnabled ?? (!!task.dueDate),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    let finalDueDate: Date | undefined = values.dueDate;
    if (finalDueDate && values.dueTime) {
        const [hours, minutes] = values.dueTime.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            finalDueDate.setHours(hours, minutes, 0, 0);
        }
    }
    
    onUpdateTask(task.id, {
        text: values.text,
        dueDate: finalDueDate?.toISOString(),
        alarmEnabled: finalDueDate ? values.alarmEnabled : false
    });
    setIsEditing(false);
  };

  const watchEditDueDate = form.watch('dueDate');

  if (isEditing) {
    return (
      <Card className="glass-card">
        <CardContent className="p-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <FormField control={form.control} name="text" render={({ field }) => (
                <FormItem><FormControl><Input {...field} autoFocus /></FormControl></FormItem>
              )} />
              <div className="flex flex-wrap items-center gap-3">
                 <FormField control={form.control} name="dueDate" render={({ field }) => (
                    <FormItem>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className='w-[150px] justify-start text-left font-normal'>
                            <Calendar className="mr-2 size-4" />
                            {field.value ? format(field.value, 'PPP') : 'No Date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )} />
                 {watchEditDueDate && <FormField control={form.control} name="dueTime" render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input type="time" className="w-[120px] pl-9" {...field} />
                            </div>
                        </FormControl>
                    </FormItem>
                 )} />}
                 {watchEditDueDate && <FormField control={form.control} name="alarmEnabled" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                        <FormControl>
                            <Switch id={`alarm-edit-${task.id}`} checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                         <FormLabel htmlFor={`alarm-edit-${task.id}`} className="flex items-center gap-1.5 text-sm font-normal cursor-pointer">
                            <BellRing className="size-4" /> <span>Alarm</span>
                        </FormLabel>
                    </FormItem>
                 )} />}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" size="sm">Save Task</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("transition-colors glass-card", task.completed && "bg-accent/20 border-accent/50")}>
      <CardContent className="p-3 flex items-center gap-4">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggleTask(task.id)}
          className="size-5"
          aria-label={`Mark task "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <div className="flex-1 cursor-pointer" onClick={() => onToggleTask(task.id)}>
          <label
            htmlFor={`task-${task.id}`}
            className={cn("font-medium cursor-pointer", task.completed && "line-through text-muted-foreground")}
          >
            {task.text}
          </label>
          {task.dueDate && (
            <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    <span>{format(new Date(task.dueDate), 'p, PPP')}</span>
                </div>
                { !task.completed && timeRemaining && (
                  <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      <span>{timeRemaining}</span>
                  </div>
                )}
                { !task.alarmEnabled && (
                    <div className="flex items-center gap-1.5 text-muted-foreground/80" title="Alarm is off">
                        <BellOff className="size-3.5" />
                    </div>
                )}
            </div>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 flex-shrink-0">
              <GripVertical className="size-4" />
              <span className="sr-only">More options for task {task.text}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 size-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 size-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

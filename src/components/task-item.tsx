"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Task } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Button } from './ui/button';
import { Calendar, Edit, GripVertical, Trash2, X, Check, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem } from './ui/form';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';

const formSchema = z.object({
  text: z.string().min(1, { message: "Task cannot be empty." }),
  dueDate: z.date().optional(),
});

interface TaskItemProps {
  task: Task;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, newText: string, newDueDate?: Date | string) => void;
}

export default function TaskItem({ task, onToggleTask, onDeleteTask, onUpdateTask }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (task.dueDate) {
      const calculateTimeRemaining = () => {
        try {
          const now = new Date();
          const due = new Date(task.dueDate!);
          if (due > now) {
            setTimeRemaining(formatDistanceToNow(due, { addSuffix: true }));
          } else {
            setTimeRemaining("Overdue");
          }
        } catch (e) {
          setTimeRemaining("Invalid date");
        }
      };

      calculateTimeRemaining();
      const intervalId = setInterval(calculateTimeRemaining, 60000); // Update every minute

      return () => clearInterval(intervalId);
    }
  }, [task.dueDate]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: task.text,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onUpdateTask(task.id, values.text, values.dueDate);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <Card className="glass-card">
        <CardContent className="p-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
              <FormField control={form.control} name="text" render={({ field }) => (
                <FormItem className="flex-1"><FormControl><Input {...field} autoFocus /></FormControl></FormItem>
              )} />
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon"><Calendar className="size-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )} />
              <Button type="submit" size="icon" aria-label="Save"><Check className="size-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)} aria-label="Cancel"><X className="size-4" /></Button>
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
                    <span>{format(new Date(task.dueDate), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    <span>{timeRemaining}</span>
                </div>
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

"use client";

import type { Task } from '@/lib/types';
import AddTask from './add-task';
import TaskItem from './task-item';
import TaskSuggestions from './task-suggestions';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';
import { CompletionCircle } from './completion-circle';

interface TaskListViewProps {
  tasks: Task[];
  onAddTask: (text: string, dueDate?: Date, alarmEnabled?: boolean) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, newValues: Partial<Omit<Task, 'id' | 'listId' | 'completed'>>) => void;
  lastAddedTask: Task | null;
  onClearLastAddedTask: () => void;
  completionPercentage: number;
}

export default function TaskListView({ tasks, onAddTask, completionPercentage, ...props }: TaskListViewProps) {
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleAddSuggestedTask = (text: string) => {
    onAddTask(text);
    props.onClearLastAddedTask();
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-4">
          <AddTask onAddTask={onAddTask} />
        </CardContent>
      </Card>

      {props.lastAddedTask && (
        <TaskSuggestions
          taskDescription={props.lastAddedTask.text}
          onAddSuggestedTask={handleAddSuggestedTask}
          onDismiss={props.onClearLastAddedTask}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">To-Do</h3>
          <CompletionCircle percentage={completionPercentage} />
        </div>
        <div className="space-y-2">
          {activeTasks.length > 0 ? (
            activeTasks.map(task => (
              <TaskItem key={task.id} task={task} onToggleTask={props.onToggleTask} onDeleteTask={props.onDeleteTask} onUpdateTask={props.onUpdateTask} />
            ))
          ) : (
            <p className="text-muted-foreground text-sm py-4">No active tasks. Add one above!</p>
          )}
        </div>
      </div>

      {completedTasks.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div className="pt-4 space-y-4">
            <h3 className="text-lg font-semibold">Completed</h3>
            <div className="space-y-2">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} onToggleTask={props.onToggleTask} onDeleteTask={props.onDeleteTask} onUpdateTask={props.onUpdateTask} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

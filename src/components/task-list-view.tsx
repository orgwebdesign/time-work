"use client";

import type { List, Task } from '@/lib/types';
import AddTask from './add-task';
import TaskItem from './task-item';
import TaskSuggestions from './task-suggestions';
import { Separator } from './ui/separator';
import { Card, CardContent } from './ui/card';

interface TaskListViewProps {
  list: List;
  tasks: Task[];
  onAddTask: (text: string, dueDate?: Date) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateTask: (id: string, newText: string, newDueDate?: Date | string) => void;
  lastAddedTask: Task | null;
  onClearLastAddedTask: () => void;
}

export default function TaskListView({ list, tasks, onAddTask, ...props }: TaskListViewProps) {
  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  const handleAddSuggestedTask = (text: string) => {
    onAddTask(text);
    props.onClearLastAddedTask();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h2 className="text-4xl font-bold tracking-tight font-headline">{list.name}</h2>
        <p className="text-muted-foreground">{activeTasks.length} {activeTasks.length === 1 ? 'task' : 'tasks'} remaining</p>
      </header>

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
        <h3 className="text-lg font-semibold">To-Do</h3>
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
        <>
          <Separator />
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Completed</h3>
            <div className="space-y-2">
              {completedTasks.map(task => (
                <TaskItem key={task.id} task={task} onToggleTask={props.onToggleTask} onDeleteTask={props.onDeleteTask} onUpdateTask={props.onUpdateTask} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

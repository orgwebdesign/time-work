"use client";

import { useState, useEffect, useMemo } from 'react';
import type { List, Task } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import TaskListView from '@/components/task-list-view';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import WeatherDisplay from '@/components/weather-display';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [lastAddedTask, setLastAddedTask] = useState<Task | null>(null);
  
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationStyle, setCelebrationStyle] = useState<React.CSSProperties>({});


  const initialLists: List[] = useMemo(() => [
    { id: '1', name: 'My Day' },
    { id: '2', name: 'Projects' },
    { id: '3', name: 'Groceries' },
    { id: '4', name: 'Freelance' },
  ], []);

  const initialTasks: Task[] = useMemo(() => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);
  
    return [
      { id: '1', listId: '1', text: 'Plan my day', completed: false, createdAt: yesterday.toISOString(), dueDate: new Date().toISOString(), alarmEnabled: true },
      { id: '2', listId: '1', text: 'Check emails and messages', completed: false, createdAt: new Date().toISOString() },
      { id: '3', listId: '1', text: '30-minute workout', completed: true, createdAt: new Date().toISOString() },
      { id: '4', listId: '2', text: 'Design new logo for TaskFlow', completed: false, createdAt: new Date().toISOString(), dueDate: twoDaysFromNow.toISOString(), alarmEnabled: true },
      { id: '5', listId: '2', text: 'Develop the new feature', completed: false, createdAt: new Date().toISOString() },
      { id: '6', listId: '3', text: 'Milk', completed: false, createdAt: new Date().toISOString() },
      { id: '7', listId: '3', text: 'Bread', completed: true, createdAt: new Date().toISOString() },
      { id: '8', listId: '3', text: 'Cheese', completed: false, createdAt: new Date().toISOString() },
      { id: '9', listId: '4', text: 'Send invoice to client', completed: false, createdAt: new Date().toISOString() },
      { id: '10', listId: '4', text: 'Follow up with leads', completed: false, createdAt: new Date().toISOString() },
    ];
  }, []);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedLists = localStorage.getItem('taskmaster-lists');
      const storedTasks = localStorage.getItem('taskmaster-tasks');
      const storedSelectedListId = localStorage.getItem('taskmaster-selectedListId');

      const loadedLists = storedLists ? JSON.parse(storedLists) : initialLists;
      setLists(loadedLists);

      const nowISO = new Date().toISOString();
      const loadedTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : initialTasks;
      const migratedTasks = loadedTasks.map((task: any) => ({
        ...task,
        createdAt: task.createdAt || nowISO,
      }));
      setTasks(migratedTasks);
      
      const loadedSelectedId = storedSelectedListId ? JSON.parse(storedSelectedListId) : (loadedLists[0]?.id || null);
      setSelectedListId(loadedSelectedId);

    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setLists(initialLists);
      setTasks(initialTasks);
      setSelectedListId(initialLists[0]?.id || null);
    }
  }, [initialLists, initialTasks]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('taskmaster-lists', JSON.stringify(lists));
      localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
      if(selectedListId) {
        localStorage.setItem('taskmaster-selectedListId', JSON.stringify(selectedListId));
      }
    }
  }, [lists, tasks, selectedListId, isClient]);
  
  useEffect(() => {
    if (isClient && !selectedListId && lists.length > 0) {
        setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId, isClient]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isCelebrating) {
      intervalId = setInterval(() => {
        const hue = Math.floor(Math.random() * 360);
        setCelebrationStyle({
          backgroundColor: `hsl(${hue}, 80%, 60%)`,
          transition: 'background-color 1s ease-in-out',
        });
      }, 1000);
    } else {
      setCelebrationStyle({});
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCelebrating]);

  const handleAddList = (name: string) => {
    const newList: List = { id: crypto.randomUUID(), name };
    setLists([...lists, newList]);
    setSelectedListId(newList.id);
  };
  
  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) {
      alert("You must have at least one list.");
      return;
    }
    setLists(lists.filter(list => list.id !== id));
    setTasks(tasks.filter(task => task.listId !== id));
    if (selectedListId === id) {
      const newSelectedList = lists.find(l => l.id !== id);
      setSelectedListId(newSelectedList?.id || null);
    }
  };

  const handleAddTask = (text: string, dueDate?: Date, alarmEnabled?: boolean) => {
    if (!selectedListId) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      listId: selectedListId,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate?.toISOString(),
      alarmEnabled: dueDate ? alarmEnabled : false,
    };
    setTasks([...tasks, newTask]);
    setLastAddedTask(newTask);
  };
  
  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      // Defer celebration start to avoid the same click stopping it
      setTimeout(() => setIsCelebrating(true), 0);
    }
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    setLastAddedTask(null);
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    setLastAddedTask(null);
  };
  
  const handleUpdateTask = (id: string, newValues: Partial<Omit<Task, 'id' | 'listId' | 'completed' | 'createdAt'>>) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, ...newValues };
        if (!updatedTask.dueDate) {
          updatedTask.alarmEnabled = false;
        }
        return updatedTask;
      }
      return task;
    }));
    setLastAddedTask(null);
  };

  const activeList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);
  
  const filteredTasks = useMemo(() => tasks.filter(t => t.listId === selectedListId), [tasks, selectedListId]);

  const activeTasksCount = useMemo(() => filteredTasks.filter(task => !task.completed).length, [filteredTasks]);

  const completionPercentage = useMemo(() => {
    const totalTasks = filteredTasks.length;
    if (totalTasks === 0) return 0;
    const completedTasks = totalTasks - activeTasksCount;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [filteredTasks, activeTasksCount]);

  if (!isClient) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><p>Loading TaskFlow...</p></div>;
  }

  return (
    <SidebarProvider>
      <div
        className={cn(
          "flex h-screen w-full bg-background transition-colors duration-1000"
        )}
        style={celebrationStyle}
        onClick={() => {
          if (isCelebrating) setIsCelebrating(false);
        }}
      >
        <AppSidebar
          lists={lists}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
        />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto p-4 md:p-6 lg:p-8">
          <header className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {activeList ? (
                <div>
                  <h2 className="text-4xl font-bold tracking-tight font-headline">{activeList.name}</h2>
                  <p className="text-muted-foreground">{activeTasksCount} {activeTasksCount === 1 ? 'task' : 'tasks'} remaining</p>
                </div>
              ) : <div />}
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Avatar>
                  <AvatarImage src="https://placehold.co/40x40.png" data-ai-hint="avatar person" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
            </div>
          </header>

          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground/90">Personal</h3>
            <WeatherDisplay />
          </section>

          {activeList ? (
            <TaskListView
              key={activeList.id}
              tasks={filteredTasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              lastAddedTask={lastAddedTask}
              onClearLastAddedTask={() => setLastAddedTask(null)}
              completionPercentage={completionPercentage}
            />
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a list or create a new one to get started.</p>
             </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

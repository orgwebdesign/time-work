"use client";

import { useState, useEffect, useMemo } from 'react';
import type { List, Task } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import TaskListView from '@/components/task-list-view';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

const initialLists: List[] = [
  { id: '1', name: 'My Day' },
  { id: '2', name: 'Projects' },
  { id: '3', name: 'Groceries' },
  { id: '4', name: 'Freelance' },
];

const initialTasks: Task[] = [
    { id: '1', listId: '1', text: 'Plan my day', completed: false, dueDate: new Date().toISOString() },
    { id: '2', listId: '1', text: 'Check emails and messages', completed: false },
    { id: '3', listId: '1', text: '30-minute workout', completed: true },
    { id: '4', listId: '2', text: 'Design new logo for TaskFlow', completed: false, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '5', listId: '2', text: 'Develop the new feature', completed: false },
    { id: '6', listId: '3', text: 'Milk', completed: false },
    { id: '7', listId: '3', text: 'Bread', completed: true },
    { id: '8', listId: '3', text: 'Cheese', completed: false },
    { id: '9', listId: '4', text: 'Send invoice to client', completed: false },
    { id: '10', listId: '4', text: 'Follow up with leads', completed: false },
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [lastAddedTask, setLastAddedTask] = useState<Task | null>(null);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedLists = localStorage.getItem('taskmaster-lists');
      const storedTasks = localStorage.getItem('taskmaster-tasks');
      const storedSelectedListId = localStorage.getItem('taskmaster-selectedListId');

      const loadedLists = storedLists ? JSON.parse(storedLists) : initialLists;
      setLists(loadedLists);

      setTasks(storedTasks ? JSON.parse(storedTasks) : initialTasks);
      
      const loadedSelectedId = storedSelectedListId ? JSON.parse(storedSelectedListId) : (loadedLists[0]?.id || null);
      setSelectedListId(loadedSelectedId);

    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setLists(initialLists);
      setTasks(initialTasks);
      setSelectedListId(initialLists[0]?.id || null);
    }
  }, []);

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

  const handleAddTask = (text: string, dueDate?: Date) => {
    if (!selectedListId) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      listId: selectedListId,
      text,
      completed: false,
      dueDate: dueDate?.toISOString(),
    };
    setTasks([...tasks, newTask]);
    setLastAddedTask(newTask);
  };
  
  const handleToggleTask = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    setLastAddedTask(null);
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    setLastAddedTask(null);
  };
  
  const handleUpdateTask = (id: string, newText: string, newDueDate?: Date | string) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, text: newText, dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined } : task
    ));
    setLastAddedTask(null);
  };

  const activeList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);
  
  const filteredTasks = useMemo(() => tasks.filter(t => t.listId === selectedListId), [tasks, selectedListId]);

  const activeTasksCount = useMemo(() => filteredTasks.filter(task => !task.completed).length, [filteredTasks]);

  if (!isClient) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><p>Loading TaskFlow...</p></div>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-background">
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
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>
          </header>

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

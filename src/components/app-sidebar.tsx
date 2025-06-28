
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlusCircle, Trash2, Home, LayoutGrid, Shield } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { type List, type User } from '@/lib/types';
import { Separator } from './ui/separator';
import { Logo } from './logo';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  lists: List[];
  selectedListId: string | null;
  onSelectList: (id: string) => void;
  onAddList: (name: string) => void;
  onDeleteList: (id: string) => void;
}

export default function AppSidebar({
  lists,
  selectedListId,
  onSelectList,
  onAddList,
  onDeleteList,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('taskmaster-currentUser');
      if (storedUser) {
        const currentUser: User = JSON.parse(storedUser);
        if (currentUser.email === 'admin@example.com') {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Failed to check admin status", error);
    }
  }, []);

  const handleAddList = () => {
    const name = prompt('Enter new list name:');
    if (name && name.trim()) {
      onAddList(name.trim());
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
            <Logo />
          <h1 className="text-xl font-semibold font-headline">TaskFlow</h1>
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {lists.map(list => (
            <SidebarMenuItem key={list.id}>
              <SidebarMenuButton
                onClick={() => onSelectList(list.id)}
                isActive={selectedListId === list.id}
              >
                <span>{list.name}</span>
              </SidebarMenuButton>
              <SidebarMenuAction
                showOnHover
                className="text-muted-foreground hover:text-destructive peer-data-[active=true]/menu-button:opacity-100"
                aria-label={`Delete list ${list.name}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (confirm(`Are you sure you want to delete the list "${list.name}"? This will also delete all its tasks.`)) {
                    onDeleteList(list.id);
                  }
                }}
              >
                <Trash2 className="size-4" />
              </SidebarMenuAction>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 flex flex-col gap-4 items-center">
            <Button onClick={handleAddList} variant="default" size="icon" className="w-14 h-14 rounded-full shadow-lg">
                <PlusCircle className="w-7 h-7" />
            </Button>
            <div className="w-full p-2 mt-2 bg-card rounded-full flex justify-around items-center">
                <Button asChild variant="ghost" size="icon" className="rounded-full">
                    <Link href="/"><Home className="w-5 h-5"/></Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className={cn("rounded-full", pathname.startsWith('/app') && "text-primary bg-primary/10")}>
                    <Link href="/app"><LayoutGrid className="w-5 h-5"/></Link>
                </Button>
                {isAdmin && (
                  <Button asChild variant="ghost" size="icon" className={cn("rounded-full", pathname.startsWith('/admin') && "text-primary bg-primary/10")}>
                      <Link href="/admin" aria-label="Go to admin dashboard"><Shield className="w-5 h-5"/></Link>
                  </Button>
                )}
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

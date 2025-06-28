"use client";

import { PlusCircle, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { type List } from '@/lib/types';
import { Separator } from './ui/separator';
import { Logo } from './logo';

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
          <div className="flex-1" />
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarMenu>
          {lists.map(list => (
            <SidebarMenuItem key={list.id} className="group/item">
              <SidebarMenuButton
                onClick={() => onSelectList(list.id)}
                isActive={selectedListId === list.id}
                className="justify-between"
              >
                <span>{list.name}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-6 invisible group-hover/item:visible data-[state=active]:visible"
                  aria-label={`Delete list ${list.name}`}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if (confirm(`Are you sure you want to delete the list "${list.name}"? This will also delete all its tasks.`)) {
                      onDeleteList(list.id);
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <Button onClick={handleAddList} variant="ghost" className="w-full justify-start">
          <PlusCircle className="mr-2 size-4" />
          Add New List
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

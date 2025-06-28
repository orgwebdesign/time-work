
"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/logo';
import { ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LandingPage() {
  
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <h1 className="text-xl font-semibold font-headline">TaskFlow</h1>
        </Link>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/signup">
            <Button>
              <span className="hidden sm:inline">Sign Up</span>
              <ArrowRight className="sm:ml-2" />
            </Button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline tracking-tight bg-gradient-to-r from-primary via-orange-400 to-primary bg-clip-text text-transparent">
            Master Your Tasks, Effortlessly.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            TaskFlow is your smart to-do list, designed to help you stay organized and focused. With intelligent suggestions and seamless syncing, achieving your goals has never been easier.
          </p>
          <div className="mt-8">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full">
                <span>Start Organizing Now</span>
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <footer className="relative w-full p-8 hidden md:flex items-end justify-center h-48">
        <div className="flex justify-center items-center gap-8">
            <div className="relative w-64 h-40 rounded-2xl overflow-hidden shadow-2xl transform -rotate-6 border-2 border-card bg-card">
                <Image src="https://placehold.co/600x400.png" alt="App screenshot 1" data-ai-hint="task list" fill className="object-cover p-2 rounded-2xl" />
            </div>
            <div className="relative w-80 h-48 rounded-2xl overflow-hidden shadow-2xl z-10 transform scale-110 border-2 border-card bg-card">
                 <Image src="https://placehold.co/800x600.png" alt="App screenshot 2" data-ai-hint="calendar view" fill className="object-cover p-2 rounded-2xl" />
            </div>
            <div className="relative w-64 h-40 rounded-2xl overflow-hidden shadow-2xl transform rotate-6 border-2 border-card bg-card">
                 <Image src="https://placehold.co/600x400.png" alt="App screenshot 3" data-ai-hint="smart suggestions" fill className="object-cover p-2 rounded-2xl" />
            </div>
        </div>
      </footer>
    </div>
  );
}

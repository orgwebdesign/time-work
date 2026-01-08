"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  FileCheck,
  LayoutDashboard,
  Shield,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Work Hours Tracker" },
  { href: "/profile", icon: User, label: "User Profile" },
  { href: "/admin", icon: Shield, label: "Admin Dashboard" },
  { href: "/admin/users/1", icon: FileCheck, label: "Admin User Review" },
]

export function TopNavbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider>
        <div className="flex items-center justify-center gap-2 p-2 rounded-full glass-card">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-full transition-colors duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>
    </nav>
  )
}

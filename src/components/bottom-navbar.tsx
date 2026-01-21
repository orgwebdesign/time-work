"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Shield,
  User as UserIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { User } from "@/lib/types"

const baseNavItems = [
  { href: "/", icon: LayoutDashboard, label: "Work Hours Tracker" },
  { href: "/profile", icon: UserIcon, label: "User Profile" },
]

const adminNavItem = { href: "/admin", icon: Shield, label: "Admin Dashboard" };


export function BottomNavbar() {
  const pathname = usePathname()
  const [user, setUser] = React.useState<User | null>(null);
  const [navItems, setNavItems] = React.useState(baseNavItems);

  React.useEffect(() => {
    try {
        const currentUser = localStorage.getItem('taskmaster-currentUser');
        if (currentUser) {
            const parsedUser = JSON.parse(currentUser);
            setUser(parsedUser);
            if (parsedUser.email === 'admin@admin.com') {
                setNavItems([...baseNavItems, adminNavItem]);
            } else {
                setNavItems(baseNavItems);
            }
        }
    } catch (e) {
        // Silently fail
    }
  }, [pathname]); // Rerun on path change to update active state correctly

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <TooltipProvider>
        <div className="flex items-center justify-center gap-1 p-1 rounded-full glass-card">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center h-9 w-9 rounded-full transition-colors duration-200",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
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

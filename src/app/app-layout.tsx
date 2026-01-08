"use client"

import { BottomNavbar } from "@/components/bottom-navbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main>{children}</main>
      <BottomNavbar />
    </>
  )
}

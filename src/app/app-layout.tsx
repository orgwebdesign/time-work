"use client"

import { TopNavbar } from "@/components/top-navbar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNavbar />
      <main>{children}</main>
    </>
  )
}

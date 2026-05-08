import type { Metadata } from "next"

import { Dashboard } from "@/components/dashboard/dashboard"

export const metadata: Metadata = {
  title: "Dashboard – Local Cursor App Builder",
  description: "Interactive analytics dashboard with animated charts.",
}

export default function DashboardPage() {
  return <Dashboard />
}

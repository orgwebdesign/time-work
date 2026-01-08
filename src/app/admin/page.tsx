
import AppLayout from "../app-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminDashboardPage() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Admin Overview</CardTitle>
            <CardDescription>
              This is a placeholder for the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Admin controls and analytics will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

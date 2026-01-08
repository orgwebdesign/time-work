
import AppLayout from "../../../app-layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AdminUserReviewPage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin User Review</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Reviewing User: {params.id}</CardTitle>
            <CardDescription>
              This is a placeholder for the admin user review page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Detailed information and actions for user {params.id} will be here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

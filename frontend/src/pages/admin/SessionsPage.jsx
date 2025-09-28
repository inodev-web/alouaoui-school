import { SessionsTable } from "@/components/admin/sessions-table"
import { AddSessionModal } from "@/components/admin/add-session-modal"
import { SessionsFilters } from "@/components/admin/sessions-filters"
import { TodaysSessions } from "@/components/admin/todays-sessions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Clock, Users, DollarSign } from "lucide-react"

export default function AdminSessionsPage() {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">الجلسات</h1>
          <p className="text-muted-foreground text-right">جدولة وإدارة جلسات التدريس</p>
        </div>
        <AddSessionModal />
      </div>

      {/* Session Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">جلسات اليوم</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">12</div>
            <p className="text-xs text-muted-foreground text-right">مجدولة لليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الجلسات النشطة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">3</div>
            <p className="text-xs text-muted-foreground text-right">جارية حالياً</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">156</div>
            <p className="text-xs text-muted-foreground text-right">في جلسات اليوم</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إيرادات اليوم</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">$1,240</div>
            <p className="text-xs text-muted-foreground text-right">من الجلسات المجدولة</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions Highlight */}
      <div>
        <TodaysSessions />
      </div>

      {/* All Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">جميع الجلسات</CardTitle>
          <CardDescription className="text-right">عرض وإدارة جميع الجلسات المجدولة</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsFilters />
          <SessionsTable />
        </CardContent>
      </Card>
    </div>
  )
}

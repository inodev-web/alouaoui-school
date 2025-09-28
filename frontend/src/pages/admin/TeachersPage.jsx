import { TeachersTable } from "@/components/admin/teachers-table"
import { AddTeacherModal } from "@/components/admin/add-teacher-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, DollarSign, TrendingUp } from "lucide-react"

export default function AdminTeachersPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">المعلمين</h1>
          <p className="text-muted-foreground text-right">إدارة حسابات المعلمين ومتابعة أدائهم</p>
        </div>
        <AddTeacherModal />
      </div>

          {/* Teacher Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي المعلمين</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">45</div>
                <p className="text-xs text-muted-foreground text-right">مدربين نشطين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">متوسط الطلاب</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">27.4</div>
                <p className="text-xs text-muted-foreground text-right">لكل معلم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">متوسط حصة الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">68%</div>
                <p className="text-xs text-muted-foreground text-right">نسبة المعلم</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">الأداء</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">4.8</div>
                <p className="text-xs text-muted-foreground text-right">متوسط التقييم</p>
              </CardContent>
            </Card>
          </div>

          {/* Teachers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">دليل المعلمين</CardTitle>
              <CardDescription className="text-right">إدارة ملفات المعلمين والوحدات وتقاسم الإيرادات</CardDescription>
            </CardHeader>
            <CardContent>
              <TeachersTable />
            </CardContent>
          </Card>
    </div>
  )
}

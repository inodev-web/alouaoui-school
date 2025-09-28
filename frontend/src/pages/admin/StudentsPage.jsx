import { StudentsTable } from "@/components/admin/students-table"
import { AddStudentModal } from "@/components/admin/add-student-modal"
import { StudentsFilters } from "@/components/admin/students-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, GraduationCap, Clock } from "lucide-react"

export default function AdminStudentsPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">الطلاب</h1>
          <p className="text-muted-foreground text-right">إدارة حسابات الطلاب ومتابعة تقدمهم</p>
        </div>
        <AddStudentModal />
      </div>

      {/* Student Stats */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الطلاب</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">1,234</div>
                <p className="text-xs text-muted-foreground text-right">حسابات نشطة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">مشتركين</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">892</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className="text-green-500">72.3%</span> من الإجمالي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">جدد هذا الشهر</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">148</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className="text-green-500">+12%</span> نمو
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">متوسط الجلسات</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">8.4</div>
                <p className="text-xs text-muted-foreground text-right">لكل طالب/شهر</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right">دليل الطلاب</CardTitle>
              <CardDescription className="text-right">البحث والتصفية للطلاب حسب معايير مختلفة</CardDescription>
            </CardHeader>
            <CardContent>
              <StudentsFilters />
              <StudentsTable />
            </CardContent>
          </Card>
    </div>
  )
}

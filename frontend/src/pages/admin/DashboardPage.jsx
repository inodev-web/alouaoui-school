import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarDateRangePicker } from "@/components/admin/date-range-picker"
import { Overview } from "@/components/admin/overview"
import { RecentSessions } from "@/components/admin/recent-sessions"
import { TopTeachers } from "@/components/admin/top-teachers"
import { GuestEntriesChart } from "@/components/admin/guest-entries-chart"
import { SessionDetailsModal } from "@/components/admin/session-details-modal"
import { Users, GraduationCap, DollarSign, Clock, AlertTriangle, TrendingUp } from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">لوحة التحكم</h1>
          <p className="text-muted-foreground text-right">
            مرحباً بك مرة أخرى! إليك ما يحدث في منصتك التعليمية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker />
          <Button>تحميل التقرير</Button>
        </div>
      </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الطلاب</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">1,234</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className="text-green-500">+12%</span> من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي المعلمين</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">45</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className="text-green-500">+3</span> جديد هذا الشهر
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">الإيرادات</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">$12,345</div>
                <p className="text-xs text-muted-foreground text-right">
                  <span className="text-green-500">+8%</span> من الشهر الماضي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">الجلسات النشطة</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">89</div>
                <p className="text-xs text-muted-foreground text-right">جارية حالياً</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="text-right">نظرة عامة على الاشتراكات</CardTitle>
                <CardDescription className="text-right">اتجاهات الاشتراكات الشهرية والإيرادات</CardDescription>
              </CardHeader>
              <CardContent className="pr-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle className="text-right">أفضل المعلمين</CardTitle>
                <CardDescription className="text-right">حسب عدد الطلاب هذا الشهر</CardDescription>
              </CardHeader>
              <CardContent>
                <TopTeachers />
              </CardContent>
            </Card>
          </div>

          {/* Guest Entries and Analytics */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  الدخول كضيف (حالات معفي)
                </CardTitle>
                <CardDescription className="text-right">دخول الضيوف الشهري مع الأسباب الرئيسية</CardDescription>
              </CardHeader>
              <CardContent>
                <GuestEntriesChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  مؤشرات الأداء
                </CardTitle>
                <CardDescription className="text-right">مؤشرات الأداء الرئيسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">متوسط مدة الجلسة</span>
                  <span className="text-sm text-muted-foreground">1.8 ساعة</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">معدل الاحتفاظ بالطلاب</span>
                  <span className="text-sm text-green-500">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">رضا المعلمين</span>
                  <span className="text-sm text-green-500">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">النمو الشهري</span>
                  <span className="text-sm text-green-500">+12.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">وقت تشغيل النظام</span>
                  <span className="text-sm text-green-500">99.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-right">معدل الدخول كضيف</span>
                  <span className="text-sm text-orange-500">2.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions with Enhanced Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-right">الجلسات الأخيرة</CardTitle>
                <CardDescription className="text-right">أحدث أنشطة الجلسات وتفصيل الإيرادات</CardDescription>
              </div>
              <SessionDetailsModal />
            </CardHeader>
            <CardContent>
              <RecentSessions />
            </CardContent>
          </Card>
    </div>
  )
}

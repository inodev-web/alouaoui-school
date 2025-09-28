import { QRScanner } from "@/components/admin/qr-scanner"
import { TeacherCards } from "@/components/admin/teacher-cards"
import { QuickSearch } from "@/components/admin/quick-search"
import { CheckInStats } from "@/components/admin/checkin-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminCheckInPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">نظام تسجيل الحضور</h1>
          <p className="text-muted-foreground text-right">مسح رموز QR وإدارة حضور الطلاب</p>
        </div>
      </div>

      {/* Check-in Stats */}
      <div className="mb-6">
            <CheckInStats />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* QR Scanner Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">ماسح رمز QR</CardTitle>
                  <CardDescription className="text-right">مسح رموز QR للطلاب لتسجيل الحضور السريع</CardDescription>
                </CardHeader>
                <CardContent>
                  <QRScanner />
                </CardContent>
              </Card>

              {/* Quick Search */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">البحث السريع</CardTitle>
                  <CardDescription className="text-right">البحث عن المعلمين أو الوحدات يدوياً</CardDescription>
                </CardHeader>
                <CardContent>
                  <QuickSearch />
                </CardContent>
              </Card>
            </div>

            {/* Teacher Cards Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">حالة المعلمين</CardTitle>
                  <CardDescription className="text-right">حالة الاشتراك الحالية وخيارات الدفع</CardDescription>
                </CardHeader>
                <CardContent>
                  <TeacherCards />
                </CardContent>
              </Card>
            </div>
          </div>
    </div>
  )
}

import { QRScanner } from "@/components/admin/qr-scanner"
import { TeacherCards } from "@/components/admin/teacher-cards"
import { QuickSearch } from "@/components/admin/quick-search"
import { CheckInStats } from "@/components/admin/checkin-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminCheckInPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-In System</h1>
          <p className="text-muted-foreground">Scan QR codes and manage student attendance</p>
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
                  <CardTitle>QR Code Scanner</CardTitle>
                  <CardDescription>Scan student QR codes for quick check-in</CardDescription>
                </CardHeader>
                <CardContent>
                  <QRScanner />
                </CardContent>
              </Card>

              {/* Quick Search */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Search</CardTitle>
                  <CardDescription>Search for teachers or modules manually</CardDescription>
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
                  <CardTitle>Teacher Status</CardTitle>
                  <CardDescription>Current subscription status and payment options</CardDescription>
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

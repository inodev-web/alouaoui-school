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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your educational platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker />
          <Button>Download Report</Button>
        </div>
      </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+12%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+3</span> new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12,345</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+8%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">Currently ongoing</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Subscriptions Overview</CardTitle>
                <CardDescription>Monthly subscription trends and revenue</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Teachers</CardTitle>
                <CardDescription>By student count this month</CardDescription>
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
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Guest Entries (Ma3fi Cases)
                </CardTitle>
                <CardDescription>Monthly guest entries with primary causes</CardDescription>
              </CardHeader>
              <CardContent>
                <GuestEntriesChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Average Session Duration</span>
                  <span className="text-sm text-muted-foreground">1.8 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Student Retention Rate</span>
                  <span className="text-sm text-green-500">94.2%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Teacher Satisfaction</span>
                  <span className="text-sm text-green-500">4.8/5.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Growth</span>
                  <span className="text-sm text-green-500">+12.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">System Uptime</span>
                  <span className="text-sm text-green-500">99.8%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Guest Entry Rate</span>
                  <span className="text-sm text-orange-500">2.1%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions with Enhanced Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Sessions</CardTitle>
                <CardDescription>Latest session activities and revenue breakdown</CardDescription>
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

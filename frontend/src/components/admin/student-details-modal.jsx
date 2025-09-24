import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar, Clock, User, Phone, Mail, GraduationCap } from "lucide-react"

const recentSessions = [
  { date: "2024-01-20", time: "10:00 AM", duration: "2h", type: "subscription", attended: true },
  { date: "2024-01-18", time: "2:00 PM", duration: "1.5h", type: "subscription", attended: true },
  { date: "2024-01-16", time: "10:00 AM", duration: "2h", type: "subscription", attended: false },
  { date: "2024-01-14", time: "10:00 AM", duration: "2h", type: "subscription", attended: true },
  { date: "2024-01-12", time: "2:00 PM", duration: "1.5h", type: "free", attended: true },
]

export function StudentDetailsModal({ student, open, onOpenChange }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "default"
      case "expired":
        return "destructive"
      case "trial":
        return "secondary"
      case "cancelled":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {student.name}
          </DialogTitle>
          <DialogDescription>Student ID: {student.id}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Student Info Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <Badge variant={getStatusColor(student.subscriptionStatus)}>
                  {student.subscriptionStatus}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{student.totalSessions}</div>
                <p className="text-xs text-muted-foreground">Total sessions attended</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teacher</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{student.teacher}</div>
                <p className="text-xs text-muted-foreground">{student.module}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Join Date</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{student.joinDate}</div>
                <p className="text-xs text-muted-foreground">Member since</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Session</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{student.lastSession}</div>
                <p className="text-xs text-muted-foreground">Most recent activity</p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{student.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{student.email}</span>
              </div>
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Session History</CardTitle>
              <CardDescription>Daily sessions attended by this student</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSessions.map((session, index) => (
                    <TableRow key={index}>
                      <TableCell>{session.date}</TableCell>
                      <TableCell>{session.time}</TableCell>
                      <TableCell>{session.duration}</TableCell>
                      <TableCell>
                        <Badge variant={session.type === "subscription" ? "default" : "outline"}>
                          {session.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.attended ? "default" : "destructive"}>
                          {session.attended ? "Attended" : "Missed"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

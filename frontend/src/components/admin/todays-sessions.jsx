import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Play, Pause } from "lucide-react"

const todaysSessions = [
  {
    id: "SES101",
    teacher: "Dr. Sarah Johnson",
    module: "Advanced Mathematics",
    time: "10:00 AM - 12:00 PM",
    type: "subscription",
    students: 25,
    status: "ongoing",
    room: "Room A1",
  },
  {
    id: "SES102",
    teacher: "Prof. Michael Chen",
    module: "Quantum Physics",
    time: "2:00 PM - 3:30 PM",
    type: "paid",
    students: 18,
    status: "upcoming",
    room: "Room B2",
  },
  {
    id: "SES103",
    teacher: "Ms. Emily Davis",
    module: "Organic Chemistry",
    time: "4:00 PM - 6:00 PM",
    type: "free",
    students: 30,
    status: "upcoming",
    room: "Room C1",
  },
]

export function TodaysSessions() {
  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "default"
      case "upcoming":
        return "secondary"
      case "completed":
        return "outline"
      default:
        return "outline"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "subscription":
        return "default"
      case "paid":
        return "secondary"
      case "free":
        return "outline"
      case "ma3fi":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Today's Sessions
        </CardTitle>
        <CardDescription>Quick access to today's scheduled sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {todaysSessions.map((session) => (
            <Card key={session.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{session.teacher}</CardTitle>
                  <Badge variant={getStatusColor(session.status)}>{session.status}</Badge>
                </div>
                <CardDescription>{session.module}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{session.time}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Room:</span>
                  <span className="font-medium">{session.room}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Students:</span>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className="font-medium">{session.students}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={getTypeColor(session.type)}>{session.type}</Badge>
                  <Button size="sm" variant="outline">
                    {session.status === "ongoing" ? (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Manage
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Start
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

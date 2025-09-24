import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash2, Play, Users, Clock } from "lucide-react"

const sessions = [
  {
    id: "SES001",
    date: "2024-01-15",
    time: "10:00 AM",
    teacher: "Dr. Sarah Johnson",
    module: "Advanced Mathematics",
    duration: "2h",
    type: "subscription",
    students: 25,
    revenue: "$125",
    status: "completed",
    room: "Room A1",
  },
  {
    id: "SES002",
    date: "2024-01-15",
    time: "2:00 PM",
    teacher: "Prof. Michael Chen",
    module: "Quantum Physics",
    duration: "1.5h",
    type: "paid",
    students: 18,
    revenue: "$90",
    status: "ongoing",
    room: "Room B2",
  },
  {
    id: "SES003",
    date: "2024-01-16",
    time: "9:00 AM",
    teacher: "Ms. Emily Davis",
    module: "Organic Chemistry",
    duration: "2h",
    type: "free",
    students: 30,
    revenue: "$0",
    status: "upcoming",
    room: "Room C1",
  },
  {
    id: "SES004",
    date: "2024-01-16",
    time: "3:00 PM",
    teacher: "Dr. James Wilson",
    module: "Cell Biology",
    duration: "1h",
    type: "ma3fi",
    students: 12,
    revenue: "$0",
    status: "upcoming",
    room: "Room D1",
  },
  {
    id: "SES005",
    date: "2024-01-17",
    time: "11:00 AM",
    teacher: "Prof. Lisa Anderson",
    module: "Literature Analysis",
    duration: "2h",
    type: "subscription",
    students: 22,
    revenue: "$110",
    status: "scheduled",
    room: "Room E1",
  },
]

export function SessionsTable() {
  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "default"
      case "upcoming":
        return "secondary"
      case "completed":
        return "outline"
      case "scheduled":
        return "secondary"
      case "cancelled":
        return "destructive"
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Students</TableHead>
          <TableHead>Revenue</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell>
              <div>
                <div className="font-medium">{session.id}</div>
                <div className="text-sm text-muted-foreground">{session.room}</div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{session.date}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {session.time}
                </div>
              </div>
            </TableCell>
            <TableCell>{session.teacher}</TableCell>
            <TableCell>{session.module}</TableCell>
            <TableCell>{session.duration}</TableCell>
            <TableCell>
              <Badge variant={getTypeColor(session.type)}>{session.type}</Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {session.students}
              </div>
            </TableCell>
            <TableCell className="font-medium">{session.revenue}</TableCell>
            <TableCell>
              <Badge variant={getStatusColor(session.status)}>{session.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {session.status === "upcoming" && (
                    <DropdownMenuItem>
                      <Play className="mr-2 h-4 w-4" />
                      Start Session
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Session
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancel Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

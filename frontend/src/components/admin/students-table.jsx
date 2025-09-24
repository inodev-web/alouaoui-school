import { useState } from "react"
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
import { StudentDetailsModal } from "@/components/admin/student-details-modal"
import { MoreHorizontal, Eye, Edit, Trash2, Phone, Mail } from "lucide-react"

const students = [
  {
    id: "STU001",
    name: "Ahmed Hassan",
    phone: "+20 123 456 7890",
    email: "ahmed.hassan@email.com",
    subscriptionStatus: "active",
    teacher: "Dr. Sarah Johnson",
    module: "Mathematics",
    joinDate: "2024-01-15",
    lastSession: "2024-01-20",
    totalSessions: 24,
  },
  {
    id: "STU002",
    name: "Fatima Al-Zahra",
    phone: "+20 123 456 7891",
    email: "fatima.alzahra@email.com",
    subscriptionStatus: "active",
    teacher: "Prof. Michael Chen",
    module: "Physics",
    joinDate: "2024-01-10",
    lastSession: "2024-01-19",
    totalSessions: 18,
  },
  {
    id: "STU003",
    name: "Omar Mahmoud",
    phone: "+20 123 456 7892",
    email: "omar.mahmoud@email.com",
    subscriptionStatus: "expired",
    teacher: "Ms. Emily Davis",
    module: "Chemistry",
    joinDate: "2023-12-20",
    lastSession: "2024-01-05",
    totalSessions: 32,
  },
  {
    id: "STU004",
    name: "Nour Ibrahim",
    phone: "+20 123 456 7893",
    email: "nour.ibrahim@email.com",
    subscriptionStatus: "trial",
    teacher: "Dr. James Wilson",
    module: "Biology",
    joinDate: "2024-01-18",
    lastSession: "2024-01-20",
    totalSessions: 3,
  },
  {
    id: "STU005",
    name: "Youssef Ali",
    phone: "+20 123 456 7894",
    email: "youssef.ali@email.com",
    subscriptionStatus: "active",
    teacher: "Prof. Lisa Anderson",
    module: "English",
    joinDate: "2024-01-12",
    lastSession: "2024-01-19",
    totalSessions: 15,
  },
]

export function StudentsTable() {
  const [selectedStudent, setSelectedStudent] = useState(null)

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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sessions</TableHead>
            <TableHead>Last Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.id}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-muted-foreground">Joined {student.joinDate}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {student.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {student.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>{student.teacher}</TableCell>
              <TableCell>{student.module}</TableCell>
              <TableCell>
                <Badge variant={getStatusColor(student.subscriptionStatus)}>{student.subscriptionStatus}</Badge>
              </TableCell>
              <TableCell>{student.totalSessions}</TableCell>
              <TableCell>{student.lastSession}</TableCell>
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
                    <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Student
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Student
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          open={!!selectedStudent}
          onOpenChange={(open) => !open && setSelectedStudent(null)}
        />
      )}
    </>
  )
}

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
import { EditTeacherModal } from "@/components/admin/edit-teacher-modal"
import { MoreHorizontal, Edit, Trash2, Phone, Mail, Star } from "lucide-react"

const teachers = [
  {
    id: "TCH001",
    name: "Dr. Sarah Johnson",
    phone: "+20 123 456 7800",
    email: "sarah.johnson@school.edu",
    module: "Mathematics",
    percentage: 70,
    subscriptionPrice: 150,
    students: 45,
    rating: 4.9,
    joinDate: "2023-09-01",
    status: "active",
  },
  {
    id: "TCH002",
    name: "Prof. Michael Chen",
    phone: "+20 123 456 7801",
    email: "michael.chen@school.edu",
    module: "Physics",
    percentage: 65,
    subscriptionPrice: 140,
    students: 38,
    rating: 4.8,
    joinDate: "2023-10-15",
    status: "active",
  },
  {
    id: "TCH003",
    name: "Ms. Emily Davis",
    phone: "+20 123 456 7802",
    email: "emily.davis@school.edu",
    module: "Chemistry",
    percentage: 68,
    subscriptionPrice: 145,
    students: 32,
    rating: 4.7,
    joinDate: "2023-08-20",
    status: "active",
  },
  {
    id: "TCH004",
    name: "Dr. James Wilson",
    phone: "+20 123 456 7803",
    email: "james.wilson@school.edu",
    module: "Biology",
    percentage: 72,
    subscriptionPrice: 155,
    students: 29,
    rating: 4.8,
    joinDate: "2023-11-01",
    status: "active",
  },
  {
    id: "TCH005",
    name: "Prof. Lisa Anderson",
    phone: "+20 123 456 7804",
    email: "lisa.anderson@school.edu",
    module: "English",
    percentage: 66,
    subscriptionPrice: 135,
    students: 26,
    rating: 4.6,
    joinDate: "2023-09-10",
    status: "inactive",
  },
]

export function TeachersTable() {
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "suspended":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Module</TableHead>
            <TableHead>Revenue Share</TableHead>
            <TableHead>Subscription Price</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => (
            <TableRow key={teacher.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{teacher.name}</div>
                  <div className="text-sm text-muted-foreground">ID: {teacher.id}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {teacher.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {teacher.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{teacher.module}</Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{teacher.percentage}%</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">${teacher.subscriptionPrice}</div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{teacher.students}</div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{teacher.rating}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(teacher.status)}>{teacher.status}</Badge>
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
                    <DropdownMenuItem onClick={() => setSelectedTeacher(teacher)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Teacher
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Teacher
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          open={!!selectedTeacher}
          onOpenChange={(open) => !open && setSelectedTeacher(null)}
        />
      )}
    </>
  )
}

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
    name: "أحمد حسن",
    phone: "+20 123 456 7890",
    email: "ahmed.hassan@email.com",
    subscriptionStatus: "نشط",
    teacher: "د. سارة جونسون",
    module: "الرياضيات",
    joinDate: "2024-01-15",
    lastSession: "2024-01-20",
    totalSessions: 24,
  },
  {
    id: "STU002",
    name: "فاطمة الزهراء",
    phone: "+20 123 456 7891",
    email: "fatima.alzahra@email.com",
    subscriptionStatus: "نشط",
    teacher: "أ.د. مايكل تشين",
    module: "الفيزياء",
    joinDate: "2024-01-10",
    lastSession: "2024-01-19",
    totalSessions: 18,
  },
  {
    id: "STU003",
    name: "عمر محمود",
    phone: "+20 123 456 7892",
    email: "omar.mahmoud@email.com",
    subscriptionStatus: "منتهي",
    teacher: "أ. إيميلي ديفيس",
    module: "الكيمياء",
    joinDate: "2023-12-20",
    lastSession: "2024-01-05",
    totalSessions: 32,
  },
  {
    id: "STU004",
    name: "نور إبراهيم",
    phone: "+20 123 456 7893",
    email: "nour.ibrahim@email.com",
    subscriptionStatus: "تجريبي",
    teacher: "د. جيمس ويلسون",
    module: "الأحياء",
    joinDate: "2024-01-18",
    lastSession: "2024-01-20",
    totalSessions: 3,
  },
  {
    id: "STU005",
    name: "يوسف علي",
    phone: "+20 123 456 7894",
    email: "youssef.ali@email.com",
    subscriptionStatus: "نشط",
    teacher: "أ.د. ليزا أندرسون",
    module: "اللغة الإنجليزية",
    joinDate: "2024-01-12",
    lastSession: "2024-01-19",
    totalSessions: 15,
  },
]

export function StudentsTable() {
  const [selectedStudent, setSelectedStudent] = useState(null)

  const getStatusColor = (status) => {
    switch (status) {
      case "نشط":
        return "default"
      case "منتهي":
        return "destructive"
      case "تجريبي":
        return "secondary"
      case "ملغي":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <>
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">رقم الطالب</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">التواصل</TableHead>
            <TableHead className="text-right">المعلم</TableHead>
            <TableHead className="text-right">المادة</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
            <TableHead className="text-right">الجلسات</TableHead>
            <TableHead className="text-right">آخر نشاط</TableHead>
            <TableHead className="text-left">الإجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.id}</TableCell>
              <TableCell>
                <div className="text-right">
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-muted-foreground">انضم في {student.joinDate}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 text-sm justify-end">
                    <Phone className="h-3 w-3" />
                    {student.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground justify-end">
                    <Mail className="h-3 w-3" />
                    {student.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">{student.teacher}</TableCell>
              <TableCell className="text-right">{student.module}</TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusColor(student.subscriptionStatus)}>{student.subscriptionStatus}</Badge>
              </TableCell>
              <TableCell className="text-center">{student.totalSessions}</TableCell>
              <TableCell className="text-center">{student.lastSession}</TableCell>
              <TableCell className="text-left">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">فتح القائمة</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" dir="rtl">
                    <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setSelectedStudent(student)}>
                      <Eye className="ml-2 h-4 w-4" />
                      عرض التفاصيل
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="ml-2 h-4 w-4" />
                      تعديل الطالب
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف الطالب
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

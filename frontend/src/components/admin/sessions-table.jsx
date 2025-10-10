import { useState, useEffect, useRef } from "react"
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
import { MoreHorizontal, Edit, Trash2, Play, Users, Clock, Loader2 } from "lucide-react"
import { sessionService } from "@/services/api/session.service"

export function SessionsTable({ filters = {} }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    fetchSessions()
    
    return () => {
      isMountedRef.current = false
    }
  }, [filters]) // This is safe as filters is a stable object from parent

  const fetchSessions = async () => {
    try {
      if (isMountedRef.current) {
        setLoading(true)
        setError(null)
      }
      const response = await sessionService.getSessions(filters)
      if (isMountedRef.current) {
        setSessions(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching sessions:', err)
      if (isMountedRef.current) {
        setError('فشل في تحميل الجلسات')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return
    
    try {
      await sessionService.deleteSession(sessionId)
      await fetchSessions() // Refresh the list
    } catch (err) {
      console.error('Error deleting session:', err)
      alert('فشل في حذف الجلسة')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "جارية":
        return "default"
      case "قادمة":
        return "secondary"
      case "مكتملة":
        return "outline"
      case "مجدولة":
        return "secondary"
      case "ملغية":
        return "destructive"
      default:
        return "outline"
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "اشتراك":
        return "default"
      case "مدفوعة":
        return "secondary"
      case "مجانية":
        return "outline"
      case "معفي":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="mr-2">جاري التحميل...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
        <Button onClick={fetchSessions} className="mt-4">
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>لا توجد جلسات</p>
      </div>
    )
  }

  return (
    <Table dir="rtl">
      <TableHeader>
        <TableRow>
          <TableHead className="text-right">الجلسة</TableHead>
          <TableHead className="text-right">التاريخ والوقت</TableHead>
          <TableHead className="text-right">المعلم</TableHead>
          <TableHead className="text-right">المادة</TableHead>
          <TableHead className="text-right">المدة</TableHead>
          <TableHead className="text-right">النوع</TableHead>
          <TableHead className="text-right">الطلاب</TableHead>
          <TableHead className="text-right">الإيرادات</TableHead>
          <TableHead className="text-right">الحالة</TableHead>
          <TableHead className="text-right">الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="text-right">
              <div>
                <div className="font-medium">{session.id}</div>
                <div className="text-sm text-muted-foreground">{session.room}</div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div>
                <div className="font-medium">{session.date}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
                  <Clock className="h-3 w-3" />
                  {session.time}
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">{session.teacher}</TableCell>
            <TableCell className="text-right">{session.module}</TableCell>
            <TableCell className="text-right">{session.duration}</TableCell>
            <TableCell className="text-right">
              <Badge variant={getTypeColor(session.type)}>{session.type}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center gap-1 justify-end">
                <Users className="h-3 w-3" />
                {session.students}
              </div>
            </TableCell>
            <TableCell className="text-right font-medium">{session.revenue}</TableCell>
            <TableCell className="text-right">
              <Badge variant={getStatusColor(session.status)}>{session.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">فتح القائمة</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" dir="rtl">
                  <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                  {session.status === "قادمة" && (
                    <DropdownMenuItem>
                      <Play className="ml-2 h-4 w-4" />
                      بدء الجلسة
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <Edit className="ml-2 h-4 w-4" />
                    تعديل الجلسة
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteSession(session.id)}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف الجلسة
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

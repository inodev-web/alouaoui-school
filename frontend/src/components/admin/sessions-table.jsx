import { useState, useEffect } from "react"
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
import { MoreHorizontal, Edit, Trash2, Users, Clock, Loader2, AlertCircle } from "lucide-react"
import { sessionService } from "@/services/api/session.service"

export function SessionsTable({ filters = {} }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  })

  // Fetch sessions when component mounts or filters change
  useEffect(() => {
    fetchSessions()
  }, [filters])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📡 Fetching sessions with filters:', filters)
      const response = await sessionService.getSessions(filters)
      
      console.log('📥 Sessions response:', response)
      
      if (response && response.data) {
        setSessions(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setSessions([])
      }
    } catch (err) {
      console.error('❌ Error fetching sessions:', err)
      setError('فشل في تحميل الجلسات')
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSession = async (sessionId) => {
    if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return
    
    try {
      await sessionService.deleteSession(sessionId)
      // Refresh the list after deletion
      await fetchSessions()
    } catch (err) {
      console.error('❌ Error deleting session:', err)
      alert('فشل في حذف الجلسة')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      'مكتملة': { variant: 'default', label: 'مكتملة' },
      'ملغية': { variant: 'destructive', label: 'ملغية' },
      'جارية': { variant: 'secondary', label: 'جارية' },
      'قادمة': { variant: 'outline', label: 'قادمة' }
    }
    
    const config = statusConfig[status] || { variant: 'outline', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (timeString) => {
    try {
      const date = new Date(timeString)
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timeString
    }
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">جاري تحميل الجلسات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <p className="text-sm text-destructive mb-4">{error}</p>
          <Button onClick={fetchSessions} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">لا توجد جلسات</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">المعلم</TableHead>
              <TableHead className="text-right">المادة</TableHead>
              <TableHead className="text-right">السنة المستهدفة</TableHead>
              <TableHead className="text-right">الفرع</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">الوقت</TableHead>
              <TableHead className="text-right">المدة</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">الطلاب</TableHead>
              <TableHead className="text-right">الإيرادات</TableHead>
              <TableHead className="text-right">القاعة</TableHead>
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium text-right">
                  {session.teacher_name || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {session.module || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {session.year_target || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {session.branch?.name || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {formatDate(session.date || session.start_time)}
                </TableCell>
                <TableCell className="text-right">
                  {formatTime(session.time || session.start_time)}
                </TableCell>
                <TableCell className="text-right">
                  {session.duration || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {getStatusBadge(session.status)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{session.students_count || 0}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {session.revenue || '0 دج'}
                </TableCell>
                <TableCell className="text-right">
                  {session.room || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">فتح القائمة</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteSession(session.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            عرض {sessions.length} من {pagination.total} جلسة
          </div>
          <div className="text-sm text-muted-foreground">
            الصفحة {pagination.current_page} من {pagination.last_page}
          </div>
        </div>
      )}
    </div>
  )
}
import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Edit, Users, Loader2, AlertCircle, Ban, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react"
import { sessionService } from "@/services/api/session.service"
import { useToast } from "@/hooks/use-toast"
import { EditSessionModal } from "./edit-session-modal"

export function SessionsTable({ filters = {} }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0
  })
  const { toast } = useToast()
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [statusDialogAction, setStatusDialogAction] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [sessionToEdit, setSessionToEdit] = useState(null)

  // Fetch sessions when component mounts or filters change
  useEffect(() => {
    fetchSessions()
  }, [filters, currentPage])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('📡 Fetching sessions with filters:', filters)
      const response = await sessionService.getSessions({ ...filters, page: currentPage })
      
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

  const handleStatusDialogOpenChange = (open) => {
    setStatusDialogOpen(open)
    if (!open) {
      setStatusDialogAction(null)
      setSelectedSession(null)
      setCancelReason('')
    }
  }

  const openStatusDialog = (session, action) => {
    setSelectedSession(session)
    setStatusDialogAction(action)
    setCancelReason('')
    setStatusDialogOpen(true)
  }

  const handleStatusSubmit = async () => {
    if (!selectedSession || !statusDialogAction) {
      return
    }

    const trimmedReason = cancelReason.trim()

    if (statusDialogAction === 'cancel' && trimmedReason.length === 0) {
      toast({
        title: 'سبب الإلغاء مطلوب',
        description: 'يرجى كتابة سبب واضح قبل تأكيد الإلغاء.',
        variant: 'destructive',
      })
      return
    }

    setStatusUpdating(true)

    try {
      if (statusDialogAction === 'complete') {
        await sessionService.updateSessionStatus(selectedSession.id, 'completed')
        toast({
          title: 'تم تأكيد الجلسة',
          description: 'تم تحديث حالة الجلسة إلى مكتملة.',
        })
      } else {
        await sessionService.updateSessionStatus(selectedSession.id, 'cancelled', {
          cancelReason: trimmedReason,
        })
        toast({
          title: 'تم إلغاء الجلسة',
          description: 'تم حفظ سبب الإلغاء وتحديث حالة الجلسة.',
        })
      }

      handleStatusDialogOpenChange(false)
      await fetchSessions()
    } catch (error) {
      const description = error?.response?.data?.message || error.message || 'تعذر تحديث حالة الجلسة'
      toast({
        title: 'فشل تحديث الحالة',
        description,
        variant: 'destructive',
      })
    } finally {
      setStatusUpdating(false)
    }
  }

  const getYearTargetInArabic = (yearTarget) => {
    const yearMap = {
      '1AM': 'السنة الأولى متوسط',
      '2AM': 'السنة الثانية متوسط',
      '3AM': 'السنة الثالثة متوسط',
      '4AM': 'السنة الرابعة متوسط',
      '1AS': 'السنة الأولى ثانوي',
      '2AS': 'السنة الثانية ثانوي',
      '3AS': 'السنة الثالثة ثانوي',
    }
    return yearMap[yearTarget] || yearTarget
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'غير محدد'
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'غير محدد'
      
      return date.toLocaleDateString('ar-DZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'غير محدد'
    }
  }

  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'غير محدد'
      const date = new Date(timeString)
      if (isNaN(date.getTime())) return 'غير محدد'
      
      return date.toLocaleTimeString('ar-DZ', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'غير محدد'
    }
  }

  const pendingSessions = sessions.filter((session) => session.needs_status_confirmation)

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
      {pendingSessions.length > 0 && (
        <Alert className="mb-4" dir="rtl">
          <AlertTitle>جلسات تحتاج إلى تأكيد</AlertTitle>
          <AlertDescription className="space-y-3 text-right">
            <p>هناك {pendingSessions.length} جلسة انتهى توقيتها وما زالت بانتظار تحديد حالتها.</p>
            <div className="flex items-center justify-end gap-2">
              <Button
                size="sm"
                onClick={() => openStatusDialog(pendingSessions[0], 'complete')}
              >
                <CheckCircle2 className="ml-2 h-4 w-4" />
                تأكيد كمنتهية
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openStatusDialog(pendingSessions[0], 'cancel')}
              >
                <Ban className="ml-2 h-4 w-4" />
                إلغاء مع سبب
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
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
              <TableHead className="text-right">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => {
              const statusRaw = session.status_raw
              const isPending = statusRaw === null || statusRaw === undefined
              const isCancelled = statusRaw === 'cancelled'

              return (
                <TableRow key={session.id}>
                <TableCell className="font-medium text-right">
                  {session.teacher_name || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {session.module || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {getYearTargetInArabic(session.year_target)}
                </TableCell>
                <TableCell className="text-right">
                  {Array.isArray(session.branches) && session.branches.length > 0
                    ? session.branches.map((branch) => branch.name).join('، ')
                    : (session.branch?.name || 'غير محدد')}
                </TableCell>
                <TableCell className="text-right">
                  {formatDate(session.date || session.start_time)}
                </TableCell>
                <TableCell className="text-right">
                  {session.start_time ? formatTime(session.start_time) : 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {session.duration || 'غير محدد'}
                </TableCell>
                <TableCell className="text-right">
                  {isPending ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={() => openStatusDialog(session, 'complete')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="ml-1 h-3 w-3" />
                        تأكيد
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openStatusDialog(session, 'cancel')}
                      >
                        <Ban className="ml-1 h-3 w-3" />
                        إلغاء
                      </Button>
                    </div>
                  ) : isCancelled ? (
                    <div className="text-right">
                      <Badge variant="destructive">ملغية</Badge>
                      {session.cancel_reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          السبب: {session.cancel_reason}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Badge variant="default">مكتملة</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{session.students_count || 0}</span>
                  </div>
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
                      <DropdownMenuItem onClick={() => {
                        setSessionToEdit(session)
                        setEditDialogOpen(true)
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        تعديل
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            عرض {sessions.length} من {pagination.total} جلسة
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              الصفحة {pagination.current_page} من {pagination.last_page}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronRight className="h-4 w-4 ml-1" />
                السابق
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                disabled={currentPage === pagination.last_page || loading}
              >
                التالي
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={statusDialogOpen} onOpenChange={handleStatusDialogOpenChange}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">
              {statusDialogAction === 'cancel' ? 'إلغاء الجلسة' : 'تأكيد إنهاء الجلسة'}
            </DialogTitle>
            <DialogDescription className="text-right space-y-2">
              {selectedSession && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">الأستاذ:</span>
                    <span>{selectedSession.teacher_name || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">المادة:</span>
                    <span>{selectedSession.module || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">التاريخ:</span>
                    <span>{formatDate(selectedSession.start_time)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">الوقت:</span>
                    <span>{formatTime(selectedSession.start_time)}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">المدة:</span>
                    <span>{selectedSession.duration || 'غير محدد'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">السنة المستهدفة:</span>
                    <span>{getYearTargetInArabic(selectedSession.year_target)}</span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {statusDialogAction === 'cancel' && (
            <div className="space-y-2 mt-4">
              <label htmlFor="cancel-reason" className="block text-sm font-medium text-right">
                سبب الإلغاء <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder="اشرح بإيجاز سبب إلغاء الجلسة (مثال: غياب الأستاذ، ظروف طارئة، إلخ...)"
                className="text-right"
                rows={4}
                disabled={statusUpdating}
              />
            </div>
          )}

          {statusDialogAction === 'complete' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 text-right">
                ✓ سيتم تعليم هذه الجلسة كمكتملة وسيظهر ذلك في جميع جداول التقارير.
              </p>
            </div>
          )}

          <DialogFooter className="sm:flex-row-reverse sm:space-x-reverse mt-4">
            <Button
              onClick={handleStatusSubmit}
              disabled={statusUpdating || !statusDialogAction}
              className={statusDialogAction === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {statusUpdating ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                statusDialogAction === 'cancel' ? 'تأكيد الإلغاء' : 'تأكيد الانتهاء'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleStatusDialogOpenChange(false)}
              disabled={statusUpdating}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <EditSessionModal
        session={sessionToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSessionUpdated={() => {
          fetchSessions()
          setSessionToEdit(null)
        }}
      />
    </div>
  )
}
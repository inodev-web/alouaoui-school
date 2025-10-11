import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { User, Clock, CheckCircle, XCircle, CreditCard, Calendar, Loader2 } from "lucide-react"
import { checkinService } from "@/services/api/checkin.service"
import { subscriptionService } from "@/services/api/subscription.service"
import { toast } from "sonner"

export function StudentCheckinDialog({ student, open, onOpenChange }) {
  const [todaysSessions, setTodaysSessions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [checkingIn, setCheckingIn] = useState({})
  const [studentSubscriptions, setStudentSubscriptions] = useState(student?.subscriptions || [])

  useEffect(() => {
    if (open && student) {
      // Sessions are already loaded with student data
      if (student.todays_sessions) {
        setTodaysSessions(student.todays_sessions)
      }
      // Update subscriptions
      if (student.subscriptions) {
        setStudentSubscriptions(student.subscriptions)
      }
    }
  }, [open, student])

  const isSubscribedToTeacher = (teacherUuid) => {
    // Check if student has active subscription for this teacher
    return studentSubscriptions.some(sub => 
      sub.teacher_uuid === teacherUuid && 
      new Date(sub.ends_at) >= new Date()
    ) || false
  }

  const handleCheckIn = async (teacherUuid, sessionId = null, mode = 'monthly') => {
    const key = `${teacherUuid}-${sessionId || 'no-session'}`
    setCheckingIn(prev => ({ ...prev, [key]: true }))

    try {
      // First, create subscription if needed
      let subscriptionCreated = null
      if (mode === 'monthly') {
        try {
          subscriptionCreated = await subscriptionService.createMonthlySubscription(teacherUuid)
          toast.success('تم إنشاء الاشتراك الشهري بنجاح')
        } catch (subError) {
          console.error('Error creating monthly subscription:', subError)
          const errorMessage = subError.response?.data?.message || 'فشل في إنشاء الاشتراك الشهري'
          toast.error(errorMessage)
          // Continue with attendance even if subscription creation fails
        }
      } else if (mode === 'session_pass') {
        try {
          subscriptionCreated = await subscriptionService.createSessionPassSubscription(teacherUuid, sessionId)
          toast.success('تم إنشاء اشتراك الجلسة بنجاح')
        } catch (subError) {
          console.error('Error creating session pass subscription:', subError)
          const errorMessage = subError.response?.data?.message || 'فشل في إنشاء اشتراك الجلسة'
          toast.error(errorMessage)
          // Continue with attendance even if subscription creation fails
        }
      }

      // Then, register attendance
      const attendanceResponse = await checkinService.scanQr({
        user_uuid: student.student.uuid,
        teacher_uuid: teacherUuid,
        session_id: sessionId,
        mode: mode === 'attendance_only' ? 'monthly' : mode // Use monthly mode for attendance only
      })

      if (attendanceResponse.data?.already_checked_in) {
        toast.info('الطالب مسجل مسبقاً في هذه الجلسة')
      } else {
        toast.success('تم تسجيل الحضور بنجاح')
      }
      
      // Update subscription status locally
      if (subscriptionCreated) {
        // Update the student's subscriptions array
        const newSubscription = {
          teacher_uuid: teacherUuid,
          starts_at: subscriptionCreated.data?.subscription?.starts_at,
          ends_at: subscriptionCreated.data?.subscription?.ends_at
        }
        
        setStudentSubscriptions(prev => [...prev, newSubscription])
      }
    } catch (error) {
      console.error('Error checking in:', error)
      toast.error(error.response?.data?.message || 'خطأ في تسجيل الحضور')
    } finally {
      setCheckingIn(prev => ({ ...prev, [key]: false }))
    }
  }

  const formatTime = (timeString) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSubscriptionStatus = (teacherUuid) => {
    const isSubscribed = isSubscribedToTeacher(teacherUuid)
    return {
      isSubscribed,
      color: isSubscribed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200',
      icon: isSubscribed ? CheckCircle : XCircle,
      text: isSubscribed ? 'مشترك' : 'غير مشترك'
    }
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="student-checkin-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الطالب - {student.student.firstname} {student.student.lastname}
          </DialogTitle>
          <div id="student-checkin-description" className="sr-only">
            تفاصيل حضور وجلسات الطالب
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">معلومات الطالب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium">{student.student.firstname} {student.student.lastname}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السنة الدراسية</p>
                  <p className="font-medium">{student.student.year_of_study}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">معرف الطالب</p>
                  <p className="font-medium">{student.student.uuid}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium">{student.student.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right flex items-center gap-2">
                <Clock className="h-5 w-5" />
                جلسات اليوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لا توجد جلسات اليوم</p>
              ) : (
                <div className="space-y-4">
                  {todaysSessions.map((session) => {
                    const subscriptionStatus = getSubscriptionStatus(session.teacher.uuid)
                    const StatusIcon = subscriptionStatus.icon
                    const checkInKey = `${session.teacher.uuid}-${session.id}`

                    return (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-right">
                            <h4 className="font-medium">{session.teacher.name}</h4>
                            <p className="text-sm text-muted-foreground">{session.teacher.module || 'مادة'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={subscriptionStatus.color}>
                              <StatusIcon className="h-3 w-3 ml-1" />
                              {subscriptionStatus.text}
                            </Badge>
                            <div className="text-left">
                              <p className="text-sm font-medium">{formatTime(session.start_time)}</p>
                              <p className="text-xs text-muted-foreground">- {formatTime(session.end_time)}</p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        <div className="flex gap-2 justify-end">
                          {subscriptionStatus.isSubscribed ? (
                            <Button
                              onClick={() => handleCheckIn(session.teacher.uuid, session.id, 'attendance_only')}
                              disabled={checkingIn[checkInKey]}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {checkingIn[checkInKey] ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 ml-2" />
                              )}
                              تسجيل الحضور
                            </Button>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleCheckIn(session.teacher.uuid, session.id, 'session_pass')}
                                disabled={checkingIn[`${session.teacher.uuid}-${session.id}`]}
                                variant="outline"
                                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                              >
                                {checkingIn[`${session.teacher.uuid}-${session.id}`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                ) : (
                                  <CreditCard className="h-4 w-4 ml-2" />
                                )}
                                دفع الجلسة
                              </Button>
                              <Button
                                onClick={() => handleCheckIn(session.teacher.uuid, session.id, 'monthly')}
                                disabled={checkingIn[`${session.teacher.uuid}-no-session`]}
                                variant="outline"
                                className="border-blue-500 text-blue-600 hover:bg-blue-50"
                              >
                                {checkingIn[`${session.teacher.uuid}-no-session`] ? (
                                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                ) : (
                                  <Calendar className="h-4 w-4 ml-2" />
                                )}
                                دفع شهري
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

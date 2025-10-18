import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  User,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  Loader2,
} from "lucide-react";
import { checkinService } from "@/services/api/checkin.service";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("ar-DZ", {
  style: "currency",
  currency: "DZD",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "—";
  }
  return currencyFormatter.format(numericValue);
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const computeValidityRange = (session, mode, subscriptions, teacherUuid) => {
  if (!session) return null;

  if (mode === "session_pass") {
    const startValue = session.start_time || session.session_date;
    const endValue = session.end_time || startValue;
    const start = startValue ? new Date(startValue) : new Date();
    const end = endValue ? new Date(endValue) : start;
    return {
      start,
      end,
    };
  }

  const now = new Date();
  let start = now;

  if (Array.isArray(subscriptions) && teacherUuid) {
    const teacherSubs = subscriptions
      .filter((sub) => sub.teacher_uuid === teacherUuid && sub.ends_at)
      .map((sub) => new Date(sub.ends_at))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    const lastEnd = teacherSubs.pop();
    if (lastEnd && lastEnd.getTime() > now.getTime()) {
      start = lastEnd;
    }
  }

  return {
    start,
    end: addDays(start, 30),
  };
};

const formatValidityRange = (range) => {
  if (!range) return "—";
  const start = formatDate(range.start);
  const end = formatDate(range.end);
  if (start === end) return start;
  return `${start} → ${end}`;
};

const formatAttendanceTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ar-DZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function StudentCheckinDialog({ student, open, onOpenChange }) {
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [checkingIn, setCheckingIn] = useState({});
  const [studentSubscriptions, setStudentSubscriptions] = useState(
    student?.subscriptions || [],
  );
  const [paymentConfirmation, setPaymentConfirmation] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isProcessingConfirmation, setIsProcessingConfirmation] =
    useState(false);

  const isFreeStudent = Boolean(student?.student?.free_subscriber);

  useEffect(() => {
    if (open && student) {
      const sessions = Array.isArray(student.todays_sessions)
        ? student.todays_sessions
        : [];
      const normalizedSessions = sessions.map((session) => ({
        ...session,
        has_subscription: isFreeStudent
          ? true
          : Boolean(session.has_subscription),
        attendance_marked: Boolean(
          session.attendance_marked || session.has_attendance,
        ),
        attendance_time: session.attendance_time || null,
      }));
      setTodaysSessions(normalizedSessions);

      const subscriptions = Array.isArray(student.subscriptions)
        ? student.subscriptions
        : [];
      setStudentSubscriptions(subscriptions);
    }
  }, [open, student, isFreeStudent]);

  const isSubscribedToTeacher = (teacherUuid) => {
    // Check if student has active subscription for this teacher
    return (
      studentSubscriptions.some(
        (sub) =>
          sub.teacher_uuid === teacherUuid &&
          new Date(sub.ends_at) >= new Date(),
      ) || false
    );
  };

  const handleCheckIn = async (
    teacherUuid,
    sessionId = null,
    mode = "monthly",
    options = {},
  ) => {
    const { customSuccessMessage } = options;
    const key = `${teacherUuid}-${sessionId ?? "no-session"}`;
    setCheckingIn((prev) => ({ ...prev, [key]: true }));

    try {
      const effectiveMode = mode === "attendance_only" ? "monthly" : mode;
      const attendanceResponse = await checkinService.scanQr({
        user_uuid: student?.student?.uuid || student?.uuid,
        teacher_uuid: teacherUuid,
        session_id: sessionId,
        mode: effectiveMode,
      });

      const alreadyCheckedIn = Boolean(
        attendanceResponse?.data?.already_checked_in,
      );

      if (alreadyCheckedIn) {
        toast.info("الطالب مسجل مسبقاً في هذه الجلسة");
      } else if (customSuccessMessage) {
        toast.success(customSuccessMessage);
      } else if (mode === "attendance_only") {
        toast.success("تم تسجيل الحضور بنجاح");
      } else if (effectiveMode === "session_pass") {
        toast.success("تم دفع الجلسة وتسجيل الحضور بنجاح");
      } else {
        toast.success("تم دفع الاشتراك وتسجيل الحضور بنجاح");
      }

      const createdSubscription =
        attendanceResponse?.data?.subscription_created;
      if (createdSubscription) {
        setStudentSubscriptions((prev) => [
          ...prev,
          {
            teacher_uuid: teacherUuid,
            starts_at: createdSubscription.starts_at,
            ends_at: createdSubscription.ends_at,
          },
        ]);
      }

      setTodaysSessions((prevSessions) =>
        prevSessions.map((session) => {
          if (session.teacher.uuid !== teacherUuid) {
            return session;
          }

          const updated = { ...session };

          if (mode === "monthly") {
            updated.has_subscription = true;
          } else if (mode === "session_pass" && session.id === sessionId) {
            updated.has_subscription = true;
          }

          if (sessionId && session.id === sessionId) {
            updated.attendance_marked = true;
            updated.attendance_time = new Date().toISOString();
          }

          if (alreadyCheckedIn && sessionId && session.id === sessionId) {
            updated.attendance_marked = true;
            if (!updated.attendance_time) {
              updated.attendance_time = new Date().toISOString();
            }
          }

          return updated;
        }),
      );

      // Notify other components (e.g., stats cards) to refresh immediately
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("attendance:updated"));
      }

      return { success: true, attendanceResponse };
    } catch (error) {
      console.error("Error checking in:", error);
      const message = error.response?.data?.message || "خطأ في تسجيل الحضور";
      toast.error(message);
      return { success: false, error };
    } finally {
      setCheckingIn((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString("ar-DZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleConfirmationOpenChange = (value) => {
    setConfirmationOpen(value);
    if (!value) {
      setPaymentConfirmation(null);
      setIsProcessingConfirmation(false);
    }
  };

  const openPaymentConfirmation = (session, mode) => {
    if (!session?.teacher) return;

    const teacherUuid = session.teacher.uuid;
    const price =
      mode === "session_pass"
        ? (session?.pricing?.session ?? session.teacher?.price_session)
        : (session?.pricing?.subscription ??
          session.teacher?.price_subscription);

    const validityRange = computeValidityRange(
      session,
      mode,
      studentSubscriptions,
      teacherUuid,
    );
    const timeRange =
      mode === "session_pass" && session.start_time && session.end_time
        ? `${formatTime(session.start_time)} → ${formatTime(session.end_time)}`
        : null;

    setPaymentConfirmation({
      session,
      mode,
      teacher: session.teacher,
      price,
      validityRange,
      timeRange,
    });
    setIsProcessingConfirmation(false);
    setConfirmationOpen(true);
  };

  const handleConfirmPayment = async (event) => {
    if (event?.preventDefault) {
      event.preventDefault();
    }

    if (!paymentConfirmation) return;

    setIsProcessingConfirmation(true);

    const { session, mode } = paymentConfirmation;
    const teacherUuid = session.teacher.uuid;

    const successText =
      mode === "session_pass"
        ? "تم تأكيد دفع الجلسة وتسجيل الحضور بنجاح"
        : "تم تأكيد الاشتراك وتسجيل الحضور بنجاح";

    const result = await handleCheckIn(teacherUuid, session.id, mode, {
      customSuccessMessage: successText,
    });

    setIsProcessingConfirmation(false);

    if (result?.success) {
      setConfirmationOpen(false);
      setPaymentConfirmation(null);
    }
  };

  const getSubscriptionStatus = (session) => {
    const teacherUuid = session?.teacher?.uuid;

    if (!teacherUuid) {
      return {
        isSubscribed: false,
        color: "bg-red-100 text-red-800 border-red-200",
        icon: XCircle,
        text: "غير محدد",
        isFree: false,
      };
    }

    if (isFreeStudent) {
      return {
        isSubscribed: true,
        color: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
        text: "مشترك مجاني",
        isFree: true,
      };
    }

    const hasSubscription =
      Boolean(session?.has_subscription) || isSubscribedToTeacher(teacherUuid);

    return {
      isSubscribed: hasSubscription,
      color: hasSubscription
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-red-100 text-red-800 border-red-200",
      icon: hasSubscription ? CheckCircle : XCircle,
      text: hasSubscription ? "مشترك" : "غير مشترك",
      isFree: false,
    };
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        aria-describedby="student-checkin-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <User className="h-5 w-5" />
            معلومات الطالب - {student.student.firstname}{" "}
            {student.student.lastname}
          </DialogTitle>
          <div id="student-checkin-description" className="sr-only">
            تفاصيل حضور وجلسات الطالب
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-lg">
                معلومات الطالب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-right">
                {/* Student Image */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 rounded-lg overflow-hidden border shadow">
                    <img
                      src={
                        student.student.picture ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student.firstname || "")}+${encodeURIComponent(student.student.lastname || "")}&background=0D8ABC&color=fff&size=200`
                      }
                      alt={`${student.student.firstname} ${student.student.lastname}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.student.firstname || "")}+${encodeURIComponent(student.student.lastname || "")}&background=0D8ABC&color=fff&size=200`;
                      }}
                    />
                  </div>
                </div>
                {/* Student Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      الاسم الكامل
                    </p>
                    <p className="font-medium">
                      {student.student.firstname} {student.student.lastname}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      السنة الدراسية
                    </p>
                    <p className="font-medium">
                      {student.student.year_of_study}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الهاتف</p>
                    <p className="font-medium">{student.student.phone}</p>
                  </div>
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
                <p className="text-center text-muted-foreground py-8">
                  لا توجد جلسات اليوم
                </p>
              ) : (
                <div className="space-y-4">
                  {todaysSessions.map((session) => {
                    const subscriptionStatus = getSubscriptionStatus(session);
                    const StatusIcon = subscriptionStatus.icon;
                    const checkInKey = `${session.teacher.uuid}-${session.id ?? "no-session"}`;
                    const isProcessing = Boolean(checkingIn[checkInKey]);
                    const alreadyMarked = Boolean(session.attendance_marked);

                    return (
                      <div key={session.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-right">
                            <h4 className="font-medium">
                              {session.teacher.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {session.teacher.module || "مادة"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={subscriptionStatus.color}>
                              <StatusIcon className="h-3 w-3 ml-1" />
                              {subscriptionStatus.text}
                            </Badge>
                            <div className="text-left">
                              <p className="text-sm font-medium">
                                {formatTime(session.start_time)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                - {formatTime(session.end_time)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator className="my-3" />

                        {alreadyMarked && (
                          <div className="text-sm text-green-600 text-right mb-2">
                            تم تسجيل حضور هذا الطالب
                            {session.attendance_time
                              ? ` عند ${formatAttendanceTime(session.attendance_time)}`
                              : ""}
                          </div>
                        )}

                        <div className="flex gap-2 justify-end">
                          {subscriptionStatus.isSubscribed ? (
                            <Button
                              onClick={() =>
                                handleCheckIn(
                                  session.teacher.uuid,
                                  session.id,
                                  "attendance_only",
                                )
                              }
                              disabled={isProcessing || alreadyMarked}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                              ) : (
                                <CheckCircle className="h-4 w-4 ml-2" />
                              )}
                              {alreadyMarked
                                ? "تم تسجيل الحضور"
                                : "تسجيل الحضور"}
                            </Button>
                          ) : (
                            !subscriptionStatus.isFree && (
                              <>
                                <Button
                                  onClick={() =>
                                    openPaymentConfirmation(
                                      session,
                                      "session_pass",
                                    )
                                  }
                                  disabled={isProcessing}
                                  variant="outline"
                                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                  ) : (
                                    <CreditCard className="h-4 w-4 ml-2" />
                                  )}
                                  دفع الجلسة
                                </Button>
                                <Button
                                  onClick={() =>
                                    openPaymentConfirmation(session, "monthly")
                                  }
                                  disabled={isProcessing}
                                  variant="outline"
                                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                >
                                  {isProcessing ? (
                                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                                  ) : (
                                    <Calendar className="h-4 w-4 ml-2" />
                                  )}
                                  دفع شهري
                                </Button>
                              </>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog
          open={confirmationOpen}
          onOpenChange={handleConfirmationOpenChange}
        >
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader className="text-right space-y-2">
              <AlertDialogTitle>تأكيد عملية الدفع</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground text-right">
                يرجى مراجعة المعلومات التالية قبل تأكيد الدفع.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-3 text-right text-sm">
              <div>
                <span className="text-muted-foreground">الطالب:</span>{" "}
                {student?.student?.firstname} {student?.student?.lastname}
              </div>
              <div>
                <span className="text-muted-foreground">الأستاذ:</span>{" "}
                {paymentConfirmation?.teacher?.name}
              </div>
              <div>
                <span className="text-muted-foreground">نوع الدفع:</span>{" "}
                {paymentConfirmation?.mode === "session_pass"
                  ? "بطاقة جلسة"
                  : "اشتراك شهري"}
              </div>
              {paymentConfirmation?.mode === "session_pass" &&
                paymentConfirmation?.timeRange && (
                  <div>
                    <span className="text-muted-foreground">توقيت الجلسة:</span>{" "}
                    {paymentConfirmation.timeRange}
                  </div>
                )}
              <div>
                <span className="text-muted-foreground">قيمة الدفع:</span>{" "}
                {formatCurrency(paymentConfirmation?.price)}
              </div>
              <div>
                <span className="text-muted-foreground">فترة الصلاحية:</span>{" "}
                {formatValidityRange(paymentConfirmation?.validityRange)}
              </div>
            </div>

            <AlertDialogFooter className="sm:justify-end">
              <AlertDialogCancel disabled={isProcessingConfirmation}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmPayment}
                disabled={isProcessingConfirmation}
                className="bg-green-600 hover:bg-green-700"
              >
                {isProcessingConfirmation ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التأكيد...
                  </span>
                ) : (
                  "تأكيد الدفع"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}

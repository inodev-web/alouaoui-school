import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Phone, Calendar, GraduationCap, MapPin, Trash2, CheckCircle, XCircle } from "lucide-react"
import studentsService from "../../services/api/students.service"
import { useState } from "react"

export function StudentDetailsModal({ student, open, onOpenChange, onUpdate }) {
  const [showReasonDialog, setShowReasonDialog] = useState(false)
  const [selectedReason, setSelectedReason] = useState("")
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد'
    try {
      return new Date(dateString).toLocaleDateString('fr-FR')
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "نشط":
        return "default"
      case "inactive":
      case "غير نشط":
        return "secondary"
      default:
        return "outline"
    }
  }

  const toggleFreeSubscriber = async () => {
    if (!student.free_subscriber) {
      // Si on active l'abonnement gratuit, demander la raison
      setShowReasonDialog(true)
    } else {
      // Si on désactive l'abonnement gratuit, confirmation avec détails
      const currentReason = student.free_subscriber_reason ? 
        `\n\nالسبب الحالي: ${student.free_subscriber_reason}` : ''
      
      if (confirm(`هل أنت متأكد من إلغاء الاشتراك المجاني لهذا الطالب؟${currentReason}\n\n⚠️ سيتم حذف سبب الاشتراك المجاني نهائياً`)) {
        try {
          const result = await studentsService.toggleFreeSubscriber(student.uuid)
          alert(`✅ تم بنجاح\n\n${result.message}`)
          onUpdate && onUpdate()
        } catch (error) {
          console.error('Error toggling free subscriber:', error)
          alert('❌ خطأ\n\nفشل في تحديث حالة الاشتراك المجاني')
        }
      }
    }
  }

  const confirmFreeSubscriber = async () => {
    if (!selectedReason) {
      alert('يرجى اختيار سبب الاشتراك المجاني')
      return
    }

    try {
      const result = await studentsService.toggleFreeSubscriber(student.uuid, selectedReason)
      setShowReasonDialog(false)
      setSelectedReason("")
      
      // Message de succès détaillé
      alert(`✅ تم تفعيل الاشتراك المجاني بنجاح\n\n${result.message}\n\n📋 السبب المُسجل: ${selectedReason}`)
      onUpdate && onUpdate()
    } catch (error) {
      console.error('Error toggling free subscriber:', error)
      alert('❌ خطأ\n\nفشل في تحديث حالة الاشتراك المجاني')
    }
  }

  const handleDeleteStudent = async () => {
    // Confirmation avec détails
    const confirmMessage = `
🗑️ حذف الطالب

هل أنت متأكد من حذف هذا الطالب؟

الطالب: ${student.firstname} ${student.lastname}
الهاتف: ${student.phone}

⚠️ تحذير: هذا الإجراء لا يمكن التراجع عنه
سيتم حذف جميع البيانات المرتبطة بالطالب نهائياً من قاعدة البيانات
    `
    
    if (confirm(confirmMessage)) {
      try {
        const result = await studentsService.deleteStudent(student.uuid)
        
        // Message de succès مخصص
        const successDiv = document.createElement('div')
        successDiv.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; color: #15803d; text-align: right;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold;">✅ تم الحذف بنجاح</h3>
            <p style="margin: 0;">تم حذف الطالب ${student.firstname} ${student.lastname} من قاعدة البيانات</p>
          </div>
        `
        alert(result.message || 'تم حذف الطالب بنجاح')
        onUpdate && onUpdate()
        onOpenChange(false)
      } catch (error) {
        console.error('Error deleting student:', error)
        const errorMessage = error.response?.data?.message || 'فشل في حذف الطالب'
        
        // Message d'erreur personnalisé
        if (errorMessage.includes('اشتراكات نشطة')) {
          alert(`❌ لا يمكن حذف الطالب\n\n${errorMessage}\n\nيرجى إلغاء جميع الاشتراكات النشطة أولاً`)
        } else {
          alert(`❌ خطأ في الحذف\n\n${errorMessage}`)
        }
      }
    }
  }

  const reasonOptions = [
    'طالب متفوق',
    'ظروف مالية صعبة', 
    'أخ/أخت مسجل في المدرسة',
    'عرض ترويجي',
    'طالب منحة',
    'تعويض عن مشكلة تقنية',
    'قرار إداري خاص',
    'أخرى'
  ]

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <User className="h-5 w-5" />
            {student.firstname} {student.lastname}
          </DialogTitle>
          <DialogDescription className="text-right">
            تفاصيل الطالب الشاملة
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* الإجراءات */}
          <div className="flex gap-2 justify-start">
            <Button onClick={handleDeleteStudent} variant="destructive" size="sm" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              حذف الطالب
            </Button>
            <Button 
              onClick={toggleFreeSubscriber} 
              variant={student.free_subscriber ? "secondary" : "default"} 
              size="sm" 
              className="flex items-center gap-2"
              title={student.free_subscriber && student.free_subscriber_reason ? 
                `السبب الحالي: ${student.free_subscriber_reason}` : 
                undefined}
            >
              {student.free_subscriber ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              {student.free_subscriber ? 
                `إلغاء الاشتراك المجاني ${student.free_subscriber_reason ? '(مُفعل)' : ''}` : 
                'تفعيل الاشتراك المجاني'}
            </Button>
          </div>

          {/* البيانات الشخصية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <User className="h-5 w-5" />
                البيانات الشخصية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Identity Card */}
                <div className="md:col-span-1">
                  <div className="rounded-xl border bg-gradient-to-br from-white to-gray-50 p-3 shadow-sm flex flex-col items-center">
                    <div className="w-32 h-32 rounded-lg overflow-hidden border shadow">
                      <img
                        src={student.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstname || '')}+${encodeURIComponent(student.lastname || '')}&background=0D8ABC&color=fff&size=200`}
                        alt={student.firstname + ' ' + student.lastname}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstname || '')}+${encodeURIComponent(student.lastname || '')}&background=0D8ABC&color=fff&size=200` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">الاسم الأول</label>
                  <p className="text-sm">{student.firstname || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">اسم العائلة</label>
                  <p className="text-sm">{student.lastname || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">تاريخ الميلاد</label>
                  <p className="text-sm">{formatDate(student.birth_date)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">الهاتف</label>
                  <p className="text-sm">{student.phone || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">العنوان</label>
                  <p className="text-sm">{student.address || 'غير محدد'}</p>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* البيانات الأكاديمية */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <GraduationCap className="h-5 w-5" />
                البيانات الأكاديمية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">اسم المدرسة</label>
                  <p className="text-sm">{student.school_name || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">السنة الدراسية</label>
                  <p className="text-sm">{student.year_of_study || 'غير محدد'}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">الفرع الدراسي</label>
                  <p className="text-sm">{student.branch?.name || 'غير محدد'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* حالة الاشتراك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <CheckCircle className="h-5 w-5" />
                حالة الاشتراك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">حالة الاشتراك المجاني</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={student.free_subscriber ? "default" : "secondary"} className="text-sm">
                        {student.free_subscriber ? '✅ نشط' : '❌ غير نشط'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {student.free_subscriber && student.free_subscriber_reason && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-green-800">سبب منح الاشتراك المجاني:</label>
                      <p className="text-sm text-green-700 bg-green-100 px-3 py-2 rounded-md">
                        📋 {student.free_subscriber_reason}
                      </p>
                    </div>
                  </div>
                )}
                
                {!student.free_subscriber && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      💡 يمكنك تفعيل الاشتراك المجاني لهذا الطالب باستخدام الزر أدناه
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* الاشتراكات النشطة */}
          {student.subscriptions && student.subscriptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-right">
                  <GraduationCap className="h-5 w-5" />
                  الاشتراكات النشطة مع الأساتذة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {student.subscriptions.map((subscription, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">اسم الأستاذ</label>
                          <p className="text-sm font-medium">{subscription.teacher_name || 'غير محدد'}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">تاريخ البداية</label>
                          <p className="text-sm">{formatDate(subscription.starts_at)}</p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">تاريخ الانتهاء</label>
                          <p className="text-sm">{formatDate(subscription.ends_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* التواريخ المهمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-right">
                <Calendar className="h-5 w-5" />
                التواريخ المهمة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">تاريخ التسجيل</label>
                  <p className="text-sm">{formatDate(student.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">آخر تحديث</label>
                  <p className="text-sm">{formatDate(student.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>

      {/* Dialog pour choisir la raison de l'abonnement gratuit */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-right">تفعيل الاشتراك المجاني</DialogTitle>
            <DialogDescription className="text-right">
              يرجى اختيار سبب منح الاشتراك المجاني للطالب {student.firstname} {student.lastname}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-right block">سبب الاشتراك المجاني</label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="اختر السبب..." />
                </SelectTrigger>
                <SelectContent>
                  {reasonOptions.map((reason, index) => (
                    <SelectItem key={index} value={reason} className="text-right">
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowReasonDialog(false)
                  setSelectedReason("")
                }}
              >
                إلغاء
              </Button>
              <Button onClick={confirmFreeSubscriber} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                تأكيد التفعيل
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}

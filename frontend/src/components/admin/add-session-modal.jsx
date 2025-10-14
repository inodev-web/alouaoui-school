import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CalendarPlus, Loader2 } from "lucide-react"
import { sessionService } from "@/services/api/session.service"
import { teacherService } from "@/services/api/teacher.service"
import branchesService from "../../services/api/branches.service"
import { useToast } from "../../hooks/use-toast"

export function AddSessionModal({ onSessionAdded }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    teacher: "",
    year_target: "1AM",
    branch_id: "",
    date: "",
    time: "",
    duration: "",
  })
  const [availableBranches, setAvailableBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  useEffect(() => {
    if (open) {
      fetchTeachers()
    }
  }, [open])

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = async () => {
      if (formData.year_target && ['1AS', '2AS', '3AS'].includes(formData.year_target)) {
        setLoadingBranches(true)
        try {
          const response = await branchesService.getBranchesForYear(formData.year_target)
          setAvailableBranches(response.data || [])
        } catch (error) {
          console.error('Error loading branches:', error)
          setAvailableBranches([])
        } finally {
          setLoadingBranches(false)
        }
      } else {
        setAvailableBranches([])
        setFormData(prev => ({ ...prev, branch_id: "" }))
      }
    }

    loadBranches()
  }, [formData.year_target])

  const fetchTeachers = async () => {
    try {
      const response = await teacherService.getTeachers()
      setTeachers(response.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const sessionData = sessionService.transformSessionForSubmission(formData)
      await sessionService.createSession(sessionData)
      
      // Show success message
      const selectedTeacher = teachers.find(t => t.uuid === formData.teacher)
      toast({
        title: "تم إضافة الجلسة بنجاح",
        description: `تم جدولة جلسة جديدة مع ${selectedTeacher?.name || 'المعلم'} في ${formData.date}`,
      })
      
      setOpen(false)
      setFormData({
        teacher: "",
        year_target: "1AM",
        branch_id: "",
        date: "",
        time: "",
        duration: "",
      })
      
      onSessionAdded?.()
    } catch (error) {
      console.error('Error creating session:', error)
      const errorMessage = error.response?.data?.message || 'فشل في إنشاء الجلسة'
      toast({
        title: "خطأ في إضافة الجلسة",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus className="ml-2 h-4 w-4" />
          إضافة جلسة
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">جدولة جلسة جديدة</DialogTitle>
          <DialogDescription className="text-right">إنشاء جلسة تدريس جديدة مع جميع التفاصيل اللازمة.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-right">
                المعلم
              </Label>
              <Select value={formData.teacher} onValueChange={(value) => setFormData({ ...formData, teacher: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر المعلم" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.uuid} value={teacher.uuid}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year_target" className="text-right">
                السنة المستهدفة
              </Label>
              <Select value={formData.year_target} onValueChange={(value) => setFormData({ ...formData, year_target: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر السنة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1AM">الأولى متوسط</SelectItem>
                  <SelectItem value="2AM">الثانية متوسط</SelectItem>
                  <SelectItem value="3AM">الثالثة متوسط</SelectItem>
                  <SelectItem value="4AM">الرابعة متوسط</SelectItem>
                  <SelectItem value="1AS">الأولى ثانوي</SelectItem>
                  <SelectItem value="2AS">الثانية ثانوي</SelectItem>
                  <SelectItem value="3AS">الثالثة ثانوي</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Branch Selection - Only for High School */}
            {['1AS', '2AS', '3AS'].includes(formData.year_target) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch_id" className="text-right">
                  الفرع المستهدف
                </Label>
                <Select 
                  value={formData.branch_id} 
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  disabled={loadingBranches}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={loadingBranches ? "جاري تحميل الفروع..." : "اختر الفرع المستهدف"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                التاريخ
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                الوقت
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                المدة
              </Label>
              <Select
                value={formData.duration}
                onValueChange={(value) => setFormData({ ...formData, duration: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 ساعة</SelectItem>
                  <SelectItem value="1.5h">1.5 ساعة</SelectItem>
                  <SelectItem value="2h">2 ساعة</SelectItem>
                  <SelectItem value="2.5h">2.5 ساعة</SelectItem>
                  <SelectItem value="3h">3 ساعات</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'جدولة الجلسة'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

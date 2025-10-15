import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { sessionService } from "@/services/api/session.service"
import { teacherService } from "@/services/api/teacher.service"
import branchesService from "@/services/api/branches.service"
import { useToast } from "@/hooks/use-toast"
import { cacheService } from "@/services/cache.service"

const HIGH_SCHOOL_YEARS = ["1AS", "2AS", "3AS"]

export function EditSessionModal({ session, open, onOpenChange, onSessionUpdated }) {
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState([])
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    teacher: "",
    year_target: "1AM",
    branch_ids: [],
    date: "",
    time: "",
    duration: "",
  })
  const [availableBranches, setAvailableBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Initialize form data when session prop changes
  useEffect(() => {
    if (session && open) {
      // Extract date and time from start_time
      const startTime = new Date(session.start_time)
      const date = startTime.toISOString().split('T')[0]
      const time = startTime.toTimeString().slice(0, 5)

      // Calculate duration from start_time and end_time
      const endTime = new Date(session.end_time)
      const durationMs = endTime - startTime
      const durationHours = durationMs / (1000 * 60 * 60)
      let duration = "1h"
      if (durationHours === 1) duration = "1h"
      else if (durationHours === 1.5) duration = "1.5h"
      else if (durationHours === 2) duration = "2h"
      else if (durationHours === 2.5) duration = "2.5h"
      else if (durationHours === 3) duration = "3h"

      // Extract branch IDs
      const branchIds = []
      if (session.branches && Array.isArray(session.branches) && session.branches.length > 0) {
        branchIds.push(...session.branches.map(b => b.id.toString()))
      } else if (session.branch_id) {
        branchIds.push(session.branch_id.toString())
      }

      setFormData({
        teacher: session.teacher?.uuid || "",
        year_target: session.year_target || "1AM",
        branch_ids: branchIds,
        date: date,
        time: time,
        duration: duration,
      })

      fetchTeachers()
    }
  }, [session, open])

  useEffect(() => {
    if (!open) {
      setAvailableBranches([])
      setLoadingBranches(false)
    }
  }, [open])

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = async () => {
      if (formData.year_target && HIGH_SCHOOL_YEARS.includes(formData.year_target)) {
        setLoadingBranches(true)
        try {
          // Use cache for branches - they rarely change
          const allBranches = await cacheService.getBranches(async () => {
            const response = await branchesService.getAllBranches()
            return response.data || []
          })
          
          // Filter branches for the selected year
          const branches = allBranches.filter(
            branch => branch.year_level === formData.year_target
          )
          
          setAvailableBranches(branches)
          // Keep existing selection if valid
          setFormData(prev => {
            const validSelection = prev.branch_ids.filter(id =>
              branches.some(branch => branch.id.toString() === id)
            )
            return { ...prev, branch_ids: validSelection }
          })
        } catch (error) {
          console.error('Error loading branches:', error)
          setAvailableBranches([])
        } finally {
          setLoadingBranches(false)
        }
      } else {
        setAvailableBranches([])
        setFormData(prev => ({ ...prev, branch_ids: [] }))
      }
    }

    if (open) {
      loadBranches()
    }
  }, [formData.year_target, open])

  const fetchTeachers = async () => {
    try {
      // Use cache service to avoid repeated API calls
      const data = await cacheService.getTeachers(async () => {
        const response = await teacherService.getTeachers()
        return response.data || []
      })
      setTeachers(data)
    } catch (error) {
      console.error('Error fetching teachers:', error)
    }
  }

  const handleBranchToggle = (branchId, checked) => {
    setFormData(prev => {
      const current = new Set(prev.branch_ids)
      if (checked) {
        current.add(branchId)
      } else {
        current.delete(branchId)
      }
      return { ...prev, branch_ids: Array.from(current) }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const isHighSchoolYear = HIGH_SCHOOL_YEARS.includes(formData.year_target)

    if (isHighSchoolYear && formData.branch_ids.length === 0) {
      toast({
        title: "برجاء اختيار فرع",
        description: "يجب اختيار فرع واحد على الأقل للجلسات الخاصة بالطور الثانوي.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const sessionData = sessionService.transformSessionForSubmission(formData)
      await sessionService.updateSession(session.id, sessionData)
      
      // Show success message
      const selectedTeacher = teachers.find(t => t.uuid === formData.teacher)
      toast({
        title: "تم تحديث الجلسة بنجاح",
        description: `تم تعديل جلسة ${selectedTeacher?.name || 'المعلم'} في ${formData.date}`,
      })
      
      onOpenChange(false)
      onSessionUpdated?.()
    } catch (error) {
      console.error('Error updating session:', error)
      const errorMessage = error.response?.data?.message || 'فشل في تحديث الجلسة'
      toast({
        title: "خطأ في تحديث الجلسة",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">تعديل الجلسة #{session.id}</DialogTitle>
          <DialogDescription className="text-right">تحديث معلومات الجلسة التدريسية.</DialogDescription>
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
            {HIGH_SCHOOL_YEARS.includes(formData.year_target) && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right mt-2">
                  الفروع المستهدفة
                </Label>
                <div className="col-span-3 flex flex-col gap-2">
                  {loadingBranches && (
                    <p className="text-sm text-muted-foreground">جاري تحميل الفروع...</p>
                  )}

                  {!loadingBranches && availableBranches.length === 0 && (
                    <p className="text-sm text-muted-foreground">لا توجد فروع متاحة لهذه السنة.</p>
                  )}

                  {!loadingBranches && availableBranches.length > 0 && (
                    <div className="space-y-2">
                      {availableBranches.map((branch) => {
                        const branchId = branch.id.toString()
                        const checkboxId = `edit-branch-${branch.id}`
                        const checked = formData.branch_ids.includes(branchId)

                        return (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center gap-3">
                              <Checkbox
                                id={checkboxId}
                                checked={checked}
                                onCheckedChange={(value) => handleBranchToggle(branchId, value === true)}
                                disabled={loadingBranches}
                              />
                              <Label htmlFor={checkboxId} className="cursor-pointer text-sm font-normal">
                                {branch.name}
                              </Label>
                            </div>
                            {branch.code && (
                              <span className="text-xs text-muted-foreground">{branch.code}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                'حفظ التعديلات'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

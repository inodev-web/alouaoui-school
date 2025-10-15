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
import { UserPlus } from "lucide-react"
import studentsService from "../../services/api/students.service"
import branchesService from "../../services/api/branches.service"
import { useToast } from "../../hooks/use-toast"
import { cacheService } from "@/services/cache.service"

export function AddStudentModal({ onStudentAdded }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    birth_date: "",
    address: "",
    school_name: "",
    year_of_study: "",
    branch_id: "",
    password: "00000000"
  })
  const [availableBranches, setAvailableBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = async () => {
      if (formData.year_of_study && ['1AS', '2AS', '3AS'].includes(formData.year_of_study)) {
        setLoadingBranches(true)
        try {
          // Use cache for branches - they rarely change
          const allBranches = await cacheService.getBranches(async () => {
            const response = await branchesService.getAllBranches()
            return response.data || []
          })
          
          // Filter branches for the selected year
          const branches = allBranches.filter(
            branch => branch.year_level === formData.year_of_study
          )
          
          setAvailableBranches(branches)
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
  }, [formData.year_of_study])

  const yearOptions = [
    { value: "1AM", label: "السنة الأولى متوسط" },
    { value: "2AM", label: "السنة الثانية متوسط" },
    { value: "3AM", label: "السنة الثالثة متوسط" },
    { value: "4AM", label: "السنة الرابعة متوسط" },
    { value: "1AS", label: "السنة الأولى ثانوي" },
    { value: "2AS", label: "السنة الثانية ثانوي" },
    { value: "3AS", label: "السنة الثالثة ثانوي" }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Prepare data according to user model
      const userData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        birth_date: formData.birth_date,
        address: formData.address,
        school_name: formData.school_name,
        year_of_study: formData.year_of_study,
        branch_id: formData.branch_id || null,
        password: "00000000", // Default password
        role: "student"
      }

      await studentsService.createStudent(userData)
      
      // Show success message
      toast({
        title: "تم إضافة الطالب بنجاح",
        description: `تم إنشاء حساب للطالب ${userData.firstname} ${userData.lastname}. كلمة المرور الافتراضية: 00000000`,
      })
      
      // Reset form
      setFormData({
        firstname: "",
        lastname: "",
        phone: "",
        birth_date: "",
        address: "",
        school_name: "",
        year_of_study: "",
        password: "00000000"
      })
      
      setOpen(false)
      
      // Refresh parent component
      if (onStudentAdded) {
        onStudentAdded()
      }
      
    } catch (error) {
      console.error('Error adding student:', error)
      const errorMessage = error.response?.data?.message || 'فشل في إضافة الطالب'
      toast({
        title: "خطأ في إضافة الطالب",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstname: "",
      lastname: "",
      phone: "",
      birth_date: "",
      address: "",
      school_name: "",
      year_of_study: "",
      branch_id: "",
      password: "00000000"
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="ml-2 h-4 w-4" />
          إضافة طالب جديد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة طالب جديد</DialogTitle>
          <DialogDescription className="text-right">
            إنشاء حساب طالب جديد مع كلمة مرور افتراضية (00000000)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            {/* الاسم الأول */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstname" className="text-right">
                الاسم الأول *
              </Label>
              <Input
                id="firstname"
                value={formData.firstname}
                onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                className="col-span-3 text-right"
                placeholder="أدخل الاسم الأول"
                required
              />
            </div>

            {/* اسم العائلة */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastname" className="text-right">
                اسم العائلة *
              </Label>
              <Input
                id="lastname"
                value={formData.lastname}
                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                className="col-span-3 text-right"
                placeholder="أدخل اسم العائلة"
                required
              />
            </div>

            {/* رقم الهاتف */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                رقم الهاتف *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="col-span-3 text-right"
                placeholder="0555123456"
                required
              />
            </div>

            {/* تاريخ الميلاد */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="birth_date" className="text-right">
                تاريخ الميلاد
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="col-span-3"
              />
            </div>

            {/* العنوان */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                العنوان
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="col-span-3 text-right"
                placeholder="أدخل العنوان"
              />
            </div>

            {/* اسم المدرسة */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="school_name" className="text-right">
                اسم المدرسة
              </Label>
              <Input
                id="school_name"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="col-span-3 text-right"
                placeholder="أدخل اسم المدرسة"
              />
            </div>

            {/* السنة الدراسية */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year_of_study" className="text-right">
                السنة الدراسية *
              </Label>
              <Select 
                value={formData.year_of_study} 
                onValueChange={(value) => setFormData({ ...formData, year_of_study: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="اختر السنة الدراسية" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year, index) => (
                    <SelectItem key={index} value={year.value} className="text-right">
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الفرع الدراسي - للثانوي فقط */}
            {['1AS', '2AS', '3AS'].includes(formData.year_of_study) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="branch_id" className="text-right">
                  الفرع الدراسي *
                </Label>
                <Select 
                  value={formData.branch_id} 
                  onValueChange={(value) => setFormData({ ...formData, branch_id: value })}
                  disabled={loadingBranches}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={loadingBranches ? "جاري تحميل الفروع..." : "اختر الفرع الدراسي"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()} className="text-right">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* كلمة المرور (للعرض فقط) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="text"
                value="00000000"
                disabled
                className="col-span-3 bg-gray-100 text-center"
              />
            </div>

            {/* ملاحظة */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 text-right">
                💡 ملاحظة: سيتم تعيين كلمة المرور الافتراضية "00000000" للطالب الجديد
              </p>
            </div>

          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false)
                resetForm()
              }}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة الطالب"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"
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
import { BookOpen } from "lucide-react"

const iconOptions = [
  { value: "📐", label: "📐 مسطرة" },
  { value: "⚛️", label: "⚛️ ذرة" },
  { value: "🧪", label: "🧪 أنبوب اختبار" },
  { value: "🔬", label: "🔬 مجهر" },
  { value: "📚", label: "📚 كتب" },
  { value: "🌍", label: "🌍 كرة أرضية" },
  { value: "🎨", label: "🎨 فن" },
  { value: "🎵", label: "🎵 موسيقى" },
  { value: "💻", label: "💻 حاسوب" },
  { value: "🏛️", label: "🏛️ مبنى" },
]

export function CreateChapterModal({ onAddChapter }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "",
    year_target: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onAddChapter) {
      onAddChapter(formData)
    }
    setOpen(false)
    setFormData({
      title: "",
      description: "",
      icon: "",
      year_target: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="ml-2 h-4 w-4" />
          إضافة فصل جديد
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px]" 
        dir="rtl"
        aria-describedby="chapter-create-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right">إضافة فصل جديد</DialogTitle>
          <DialogDescription id="chapter-create-description" className="text-right">
            أضف فصلاً جديداً لتنظيم المحتوى التعليمي.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                عنوان الفصل
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3 text-right"
                placeholder="أدخل عنوان الفصل"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right mt-2">
                الوصف
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3 min-h-[80px] px-3 py-2 text-right border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="أدخل وصف الفصل"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                الأيقونة
              </Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger className="col-span-3 text-right">
                  <SelectValue placeholder="اختر أيقونة" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
                <SelectTrigger className="col-span-3 text-right">
                  <SelectValue placeholder="اختر السنة المستهدفة" />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button type="submit">إنشاء الفصل</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

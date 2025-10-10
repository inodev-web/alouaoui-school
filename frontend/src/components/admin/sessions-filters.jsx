import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { CalendarDateRangePicker } from "@/components/admin/date-range-picker"
import { Search, X } from "lucide-react"
import { teacherService } from "@/services/api/teacher.service"

export function SessionsFilters({ onFiltersChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeachers()
  }, [])

  useEffect(() => {
    // Notify parent component of filter changes
    const filters = {
      search: searchTerm,
      teacher_uuid: selectedTeacher !== "all" ? selectedTeacher : undefined,
    }
    onFiltersChange?.(filters)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedTeacher]) // onFiltersChange is intentionally omitted to prevent infinite loops

  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await teacherService.getTeachers()
      setTeachers(response.data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTeacher("")
  }

  return (
    <div className="space-y-4 mb-6" dir="rtl">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الجلسة، المعلم، أو المادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>
        
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="تصفية بالمعلم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المعلمين</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.uuid} value={teacher.uuid}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={clearFilters} className="shrink-0 bg-transparent">
          <X className="h-4 w-4 ml-2" />
          مسح المرشحات
        </Button>
      </div>
    </div>
  )
}

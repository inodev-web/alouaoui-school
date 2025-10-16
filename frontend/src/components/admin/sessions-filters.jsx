import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { teacherService } from "@/services/api/teacher.service";
import branchesService from "@/services/api/branches.service";
import { useDebounce } from "@/hooks/useDebounce";
import { cacheService } from "@/services/cache.service";

export function SessionsFilters({ onFiltersChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  ); // Today's date by default
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    fetchTeachers();
    fetchBranches();
  }, []);

  useEffect(() => {
    // Notify parent component of filter changes
    // Use debounced search term instead of direct searchTerm
    const filters = {
      search: debouncedSearchTerm,
      teacher_uuid:
        selectedTeacher !== "all" && selectedTeacher
          ? selectedTeacher
          : undefined,
      status:
        selectedStatus !== "all" && selectedStatus ? selectedStatus : undefined,
      year_target:
        selectedYear !== "all" && selectedYear ? selectedYear : undefined,
      branch_id:
        selectedBranch !== "all" && selectedBranch ? selectedBranch : undefined,
      start_date: selectedDate || undefined,
      end_date: selectedDate || undefined,
    };
    onFiltersChange?.(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearchTerm,
    selectedTeacher,
    selectedStatus,
    selectedYear,
    selectedBranch,
    selectedDate,
  ]);

  const fetchTeachers = async () => {
    try {
      // Use cache service instead of direct API call
      const data = await cacheService.getTeachers(async () => {
        const response = await teacherService.getTeachers();
        return response.data || [];
      });
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      // Use cache service instead of direct API call
      const data = await cacheService.getBranches(async () => {
        const response = await branchesService.getAllBranches();
        return response.data || [];
      });
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedTeacher("");
    setSelectedStatus("");
    setSelectedYear("");
    setSelectedBranch("");
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-4 mb-6" dir="rtl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث برقم الجلسة، المعلم، أو المادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-10"
          />
        </div>

        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger>
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

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger>
            <SelectValue placeholder="تصفية بالحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="null">بانتظار التأكيد</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="cancelled">ملغاة</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger>
            <SelectValue placeholder="تصفية بالسنة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع السنوات</SelectItem>
            <SelectItem value="1AM">الأولى متوسط</SelectItem>
            <SelectItem value="2AM">الثانية متوسط</SelectItem>
            <SelectItem value="3AM">الثالثة متوسط</SelectItem>
            <SelectItem value="4AM">الرابعة متوسط</SelectItem>
            <SelectItem value="1AS">الأولى ثانوي</SelectItem>
            <SelectItem value="2AS">الثانية ثانوي</SelectItem>
            <SelectItem value="3AS">الثالثة ثانوي</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger>
            <SelectValue placeholder="تصفية بالفرع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفروع</SelectItem>
            {branches.map((branch) => {
              // Format display text with year level
              let yearText = "";
              if (branch.year_level === "1AS") yearText = "الأولى ثانوي";
              else if (branch.year_level === "2AS") yearText = "الثانية ثانوي";
              else if (branch.year_level === "3AS") yearText = "الثالثة ثانوي";

              const displayText = `${branch.name} - ${yearText}`;

              return (
                <SelectItem key={branch.id} value={branch.id.toString()}>
                  {displayText}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-right"
        />

        <Button
          variant="outline"
          onClick={clearFilters}
          className="shrink-0 bg-transparent"
        >
          <X className="h-4 w-4 ml-2" />
          مسح المرشحات
        </Button>
      </div>
    </div>
  );
}

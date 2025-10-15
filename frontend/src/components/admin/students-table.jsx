import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentDetailsModal } from "@/components/admin/student-details-modal";
import studentsService from "../../services/api/students.service";

// Simple debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function StudentsTable({ searchQuery = "" }) {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Optimized fetch function with caching
  const fetchStudents = useCallback(async (page = 1, search = "") => {
    const key = `${search}-${page}`;
    
    try {
      setLoading(true);
      setCurrentPage(page); // Update page state immediately

      const params = { 
        page,
        per_page: 20
      };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await studentsService.getStudents(params);

      setStudents(response.data);
      setTotalPages(response.last_page);
      setError(null);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('فشل في تحميل بيانات الطلاب');
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to avoid infinite re-renders

  // Effect for search changes
  useEffect(() => {
    fetchStudents(1, debouncedSearchQuery);
  }, [debouncedSearchQuery, fetchStudents]);

  // Handle row click to show student details
  const handleRowClick = useCallback(async (studentId) => {
    try {
      const studentDetails = await studentsService.getStudent(studentId);
      setSelectedStudent(studentDetails);
    } catch (err) {
      console.error('Error fetching student details:', err);
      alert('فشل في تحميل تفاصيل الطالب');
    }
  }, []);

  // Optimized pagination handlers
  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      fetchStudents(newPage, debouncedSearchQuery);
    }
  }, [currentPage, debouncedSearchQuery, fetchStudents]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      fetchStudents(newPage, debouncedSearchQuery);
    }
  }, [currentPage, totalPages, debouncedSearchQuery, fetchStudents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="mr-2 text-sm text-muted-foreground">جاري التحميل...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700 text-right">{error}</p>
        <Button 
          onClick={() => fetchStudents(currentPage, debouncedSearchQuery)}
          className="mt-2"
          variant="outline"
          size="sm"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <>
      <Table dir="rtl">
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الصورة</TableHead>
            <TableHead className="text-right">الاسم</TableHead>
            <TableHead className="text-right">اللقب</TableHead>
            <TableHead className="text-right">رقم الهاتف</TableHead>
            <TableHead className="text-right">تاريخ الميلاد</TableHead>
            <TableHead className="text-right">السنة الدراسية</TableHead>
            <TableHead className="text-right">الفرع</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow 
              key={student.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => handleRowClick(student.id)}
            >
              <TableCell className="text-right">
                <div className="w-10 h-10 rounded-full overflow-hidden border">
                  <img
                    src={student.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstname || '')}+${encodeURIComponent(student.lastname || '')}&background=0D8ABC&color=fff&size=100`}
                    alt={`${student.firstname} ${student.lastname}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.firstname || '')}+${encodeURIComponent(student.lastname || '')}&background=0D8ABC&color=fff&size=100` }}
                  />
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">{student.firstname}</TableCell>
              <TableCell className="text-right">{student.lastname}</TableCell>
              <TableCell className="text-right">{student.phone}</TableCell>
              <TableCell className="text-right">{student.birth_date || 'غير محدد'}</TableCell>
              <TableCell className="text-right">{student.year_of_study || 'غير محدد'}</TableCell>
              <TableCell className="text-right">{student.branch?.name || 'غير محدد'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            صفحة {currentPage} من {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              السابق
            </Button>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              التالي
            </Button>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudent && (
        <StudentDetailsModal
          student={selectedStudent}
          open={!!selectedStudent}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedStudent(null);
            }
          }}
          onUpdate={() => {
            // Refresh current page when student is updated
            fetchStudents(currentPage, debouncedSearchQuery);
            setSelectedStudent(null);
          }}
        />
      )}
    </>
  );
}
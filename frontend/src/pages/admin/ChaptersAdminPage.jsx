import { useState, useMemo } from "react"
import { ChaptersGrid } from "@/components/admin/chapters-grid"
import { CreateChapterModal } from "@/components/admin/create-chapter-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Video, FileText, Users } from "lucide-react"
import { useChapters } from "@/hooks/useChapters"

export default function AdminChaptersPage() {
  const {
    chapters,
    loading,
    error,
    addChapter,
    updateChapter,
    deleteChapter,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCoursePDF,
  } = useChapters()

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const totalChapters = chapters.length
    const totalCourses = chapters.reduce((sum, chapter) => sum + chapter.courses.length, 0)
    const totalPdfs = chapters.reduce((sum, chapter) => 
      sum + chapter.courses.reduce((courseSum, course) => 
        courseSum + (course.summaryPdf ? 1 : 0) + (course.exercisesPdf ? 1 : 0), 0
      ), 0
    )
    
    return {
      totalChapters,
      totalCourses,
      totalPdfs,
      activeStudents: 1234 // This would come from actual data
    }
  }, [chapters])

  const handleAddChapter = (chapterData) => {
    addChapter(chapterData)
  }

  const handleAddCourse = (chapterId, courseData) => {
    addCourse(chapterId, courseData)
  }

  const handleUpdateCourse = (chapterId, courseId, updates) => {
    updateCourse(chapterId, courseId, updates)
  }

  const handleDeleteCourse = (chapterId, courseId) => {
    deleteCourse(chapterId, courseId)
  }

  const handleUpdateChapter = (chapterId, updates) => {
    updateChapter(chapterId, updates)
  }

  const handleDeleteChapter = async (chapterId) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس المرتبطة به.')) {
      try {
        await deleteChapter(chapterId)
      } catch (error) {
        console.error('Error deleting chapter:', error)
      }
    }
  }

  const handleUploadPDF = async (courseId, file, type) => {
    try {
      await uploadCoursePDF(courseId, file, type)
    } catch (error) {
      console.error('Error uploading PDF:', error)
    }
  }

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">الفصول والدورات</h1>
          <p className="text-muted-foreground text-right">إدارة المحتوى التعليمي ومواد الدورة</p>
        </div>
        <CreateChapterModal onAddChapter={handleAddChapter} />
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الفصول</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{stats.totalChapters}</div>
            <p className="text-xs text-muted-foreground text-right">عبر جميع الوحدات</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">إجمالي الدورات</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground text-right">دروس فيديو</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">المواد PDF</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{stats.totalPdfs}</div>
            <p className="text-xs text-muted-foreground text-right">ملخصات وتمارين</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">الطلاب النشطين</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{stats.activeStudents}</div>
            <p className="text-xs text-muted-foreground text-right">يصلون للمحتوى</p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-right">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-lg text-muted-foreground">جاري التحميل...</div>
        </div>
      )}

      {/* Chapters Grid */}
      {!loading && (
        <ChaptersGrid 
          chapters={chapters}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
          onUpdateChapter={handleUpdateChapter}
          onDeleteChapter={handleDeleteChapter}
          onUploadPDF={handleUploadPDF}
        />
      )}
    </div>
  )
}

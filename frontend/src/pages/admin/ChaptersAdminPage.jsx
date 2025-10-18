import { useState, useMemo, useEffect } from "react";
import { ChaptersGrid } from "@/components/admin/chapters-grid";
import { CreateChapterModal } from "@/components/admin/create-chapter-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Video, FileText, Users } from "lucide-react";
import { useChapters } from "@/hooks/useChapters";
import { userService } from "@/services/api/user.service";

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
  } = useChapters();

  const [userStats, setUserStats] = useState({
    activeSubscribers: 0,
    totalStudents: 0,
  });

  // Charger les statistiques des utilisateurs
  useEffect(() => {
    const loadUserStats = async () => {
      try {
        const stats = await userService.getUserStats();
        setUserStats({
          activeSubscribers: stats.activeSubscribers || 0,
          totalStudents: stats.totalStudents || 0,
        });
      } catch (error) {
        console.error("Error loading user stats:", error);
      }
    };
    loadUserStats();
  }, []);

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const totalChapters = chapters.length;
    const totalCourses = chapters.reduce(
      (sum, chapter) => sum + chapter.courses.length,
      0,
    );

    // Calculer les PDFs et vidéos
    const contentStats = chapters.reduce(
      (acc, chapter) => {
        chapter.courses.forEach((course) => {
          if (course.pdf_summary) acc.coursePdfs++;
          if (course.exercises_pdf) acc.exercisePdfs++;
          if (course.videoRef || course.video_url) acc.videos++;
        });
        return acc;
      },
      { coursePdfs: 0, exercisePdfs: 0, videos: 0 },
    );

    return {
      totalChapters,
      totalCourses,
      coursePdfs: contentStats.coursePdfs,
      exercisePdfs: contentStats.exercisePdfs,
      totalVideos: contentStats.videos,
      activeSubscribers: userStats.activeSubscribers,
      freeSubscribers: Math.max(
        0,
        userStats.totalStudents - userStats.activeSubscribers,
      ),
    };
  }, [chapters, userStats]);

  const handleAddChapter = async (chapterData) => {
    return await addChapter(chapterData);
  };

  const handleAddCourse = async (chapterId, courseData) => {
    return await addCourse(chapterId, courseData);
  };

  const handleUpdateCourse = async (chapterId, courseId, updates) => {
    return await updateCourse(chapterId, courseId, updates);
  };

  const handleDeleteCourse = async (chapterId, courseId) => {
    return await deleteCourse(chapterId, courseId);
  };

  const handleUpdateChapter = async (chapterId, updates) => {
    return await updateChapter(chapterId, updates);
  };

  const handleDeleteChapter = async (chapterId) => {
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس المرتبطة به.",
      )
    ) {
      try {
        return await deleteChapter(chapterId);
      } catch (error) {
        console.error("Error deleting chapter:", error);
        throw error;
      }
    }
    return null;
  };

  const handleUploadPDF = async (courseId, file, type) => {
    try {
      return await uploadCoursePDF(courseId, file, type);
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  };

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            الفصول والدورات
          </h1>
          <p className="text-muted-foreground text-right">
            إدارة المحتوى التعليمي ومواد الدورة
          </p>
        </div>
        <CreateChapterModal onAddChapter={handleAddChapter} />
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-5 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              ملفات الدروس PDF
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.coursePdfs}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              ملخصات الدروس
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              ملفات التمارين PDF
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.exercisePdfs}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              تمارين وواجبات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              الفيديوهات
            </CardTitle>
            <Video className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.totalVideos}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              شروحات مصورة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              المشتركين النشطين
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.activeSubscribers}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              مشتركين مدفوعين
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              المستخدمين المجانيين
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {stats.freeSubscribers}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              مستخدمين غير مشتركين
            </p>
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
  );
}

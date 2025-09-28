import { ChaptersGrid } from "@/components/admin/chapters-grid"
import { CreateChapterModal } from "@/components/admin/create-chapter-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Video, FileText, Users } from "lucide-react"

export default function AdminChaptersPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">الفصول والدورات</h1>
          <p className="text-muted-foreground text-right">إدارة المحتوى التعليمي ومواد الدورة</p>
        </div>
        <CreateChapterModal />
      </div>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الفصول</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">24</div>
                <p className="text-xs text-muted-foreground text-right">عبر جميع الوحدات</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">إجمالي الدورات</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">156</div>
                <p className="text-xs text-muted-foreground text-right">دروس فيديو</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">المواد PDF</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">89</div>
                <p className="text-xs text-muted-foreground text-right">ملخصات وتمارين</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-right">الطلاب النشطين</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-right">1,234</div>
                <p className="text-xs text-muted-foreground text-right">يصلون للمحتوى</p>
              </CardContent>
            </Card>
      </div>

      {/* Chapters Grid */}
      <ChaptersGrid />
    </div>
  )
}

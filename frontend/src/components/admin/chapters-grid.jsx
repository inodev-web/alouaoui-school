"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddCourseModal } from "@/components/admin/add-course-modal"
import { CourseDetailsModal } from "@/components/admin/course-details-modal"
import { BookOpen, Video, Plus, Eye, Edit, Trash2 } from "lucide-react"

export function ChaptersGrid({ 
  chapters, 
  onAddCourse, 
  onUpdateCourse, 
  onDeleteCourse,
  onUpdateChapter,
  onDeleteChapter,
  onUploadPDF
}) {
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  return (
    <div dir="rtl">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{chapter.icon}</div>
                  <div>
                    <CardTitle className="text-lg text-right">{chapter.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {chapter.module}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AddCourseModal
                    chapterId={chapter.id}
                    chapterTitle={chapter.title}
                    onAddCourse={onAddCourse}
                    onUploadPDF={onUploadPDF}
                    trigger={
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onUpdateChapter && onUpdateChapter(chapter.id, chapter)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onDeleteChapter && onDeleteChapter(chapter.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">الدروس:</span>
                <span className="font-medium">{chapter.courses.length}</span>
              </div>

              {chapter.courses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground text-right">الدروس الأخيرة:</h4>
                  {chapter.courses.slice(0, 2).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Video className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate text-right">{course.title}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedCourse(course)} className="shrink-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {chapter.courses.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{chapter.courses.length - 2} دروس أخرى
                    </p>
                  )}
                </div>
              )}

              {chapter.courses.length === 0 && (
                <div className="text-center py-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد دروس بعد</p>
                  <p className="text-xs text-muted-foreground">أضف أول درس للبدء</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedCourse && (
        <CourseDetailsModal
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
        />
      )}
    </div>
  )
}

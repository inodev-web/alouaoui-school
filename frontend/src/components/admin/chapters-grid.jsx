"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AddCourseModal } from "@/components/admin/add-course-modal"
import { CourseDetailsModal } from "@/components/admin/course-details-modal"
import { BookOpen, Video, Plus, Eye } from "lucide-react"

const chapters = [
  {
    id: "CH001",
    title: "Algebra Fundamentals",
    icon: "📐",
    module: "Mathematics",
    courses: [
      {
        id: "C001",
        title: "Introduction to Variables",
        description: "Basic concepts of algebraic variables and expressions",
        videoLink: "https://youtube.com/watch?v=example1",
        pdfUrl: "/pdfs/algebra-intro.pdf",
        duration: "45 min",
      },
      {
        id: "C002",
        title: "Linear Equations",
        description: "Solving linear equations step by step",
        videoLink: "https://youtube.com/watch?v=example2",
        pdfUrl: "/pdfs/linear-equations.pdf",
        duration: "60 min",
      },
    ],
  },
  {
    id: "CH002",
    title: "Quantum Mechanics",
    icon: "⚛️",
    module: "Physics",
    courses: [
      {
        id: "C003",
        title: "Wave-Particle Duality",
        description: "Understanding the dual nature of matter and energy",
        videoLink: "https://youtube.com/watch?v=example3",
        pdfUrl: "/pdfs/wave-particle.pdf",
        duration: "75 min",
      },
    ],
  },
  {
    id: "CH003",
    title: "Organic Chemistry Basics",
    icon: "🧪",
    module: "Chemistry",
    courses: [
      {
        id: "C004",
        title: "Carbon Compounds",
        description: "Introduction to organic carbon-based compounds",
        videoLink: "https://youtube.com/watch?v=example4",
        pdfUrl: "/pdfs/carbon-compounds.pdf",
        duration: "50 min",
      },
      {
        id: "C005",
        title: "Functional Groups",
        description: "Understanding different functional groups in organic chemistry",
        videoLink: "https://youtube.com/watch?v=example5",
        pdfUrl: "/pdfs/functional-groups.pdf",
        duration: "65 min",
      },
    ],
  },
  {
    id: "CH004",
    title: "Cell Biology",
    icon: "🔬",
    module: "Biology",
    courses: [
      {
        id: "C006",
        title: "Cell Structure",
        description: "Exploring the components and structure of cells",
        videoLink: "https://youtube.com/watch?v=example6",
        pdfUrl: "/pdfs/cell-structure.pdf",
        duration: "55 min",
      },
    ],
  },
]

export function ChaptersGrid() {
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chapters.map((chapter) => (
          <Card key={chapter.id} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{chapter.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {chapter.module}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <AddCourseModal
                  chapterId={chapter.id}
                  chapterTitle={chapter.title}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Courses:</span>
                <span className="font-medium">{chapter.courses.length}</span>
              </div>

              {chapter.courses.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Recent Courses:</h4>
                  {chapter.courses.slice(0, 2).map((course) => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Video className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{course.title}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedCourse(course)} className="shrink-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {chapter.courses.length > 2 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{chapter.courses.length - 2} more courses
                    </p>
                  )}
                </div>
              )}

              {chapter.courses.length === 0 && (
                <div className="text-center py-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No courses yet</p>
                  <p className="text-xs text-muted-foreground">Add your first course to get started</p>
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
    </>
  )
}

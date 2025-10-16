"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video, FileText, Clock, ExternalLink, Download } from "lucide-react";

export function CourseDetailsModal({ course, open, onOpenChange }) {
  const handleWatchVideo = () => {
    window.open(course.video_ref || course.videoLink, "_blank");
  };

  const handleDownloadSummaryPDF = () => {
    // In a real app, this would trigger PDF download
    console.log(
      "Downloading Summary PDF:",
      course.pdf_summary || course.summaryPdf,
    );
  };

  const handleDownloadExercisesPDF = () => {
    // In a real app, this would trigger PDF download
    console.log(
      "Downloading Exercises PDF:",
      course.exercises_pdf || course.exercisesPdf,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        dir="rtl"
        aria-describedby="course-details-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-right">
            <Video className="h-5 w-5" />
            {course.title}
          </DialogTitle>
          <DialogDescription
            id="course-details-description"
            className="text-right"
          >
            تفاصيل الدرس: {course.title} (معرف: {course.id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-right">
                معلومات الدرس
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 text-right">
                  الوصف
                </h4>
                <p className="text-sm text-right">{course.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{course.duration}</span>
                </div>
                <Badge variant="outline">درس فيديو</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Video Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-right">
                <Video className="h-5 w-5" />
                محتوى الفيديو
              </CardTitle>
              <CardDescription className="text-right">
                الدرس الرئيسي بالفيديو
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="text-right">
                  <p className="font-medium">درس الفيديو</p>
                  <p className="text-sm text-muted-foreground">
                    المدة: {course.duration}
                  </p>
                </div>
                <Button onClick={handleWatchVideo}>
                  <ExternalLink className="h-4 w-4 ml-2" />
                  مشاهدة الفيديو
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary PDF */}
          {(course.pdf_summary || course.summaryPdf) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-right">
                  <FileText className="h-5 w-5 text-blue-600" />
                  ملخص الدرس
                </CardTitle>
                <CardDescription className="text-right">
                  ملف PDF يحتوي على ملخص المفاهيم الرئيسية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-right">
                    <p className="font-medium text-blue-800">ملخص الدرس</p>
                    <p className="text-sm text-blue-600">
                      ملف PDF للمراجعة السريعة
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadSummaryPDF}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل الملخص
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Exercises PDF */}
          {(course.exercises_pdf || course.exercisesPdf) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-right">
                  <FileText className="h-5 w-5 text-green-600" />
                  تمارين الدرس
                </CardTitle>
                <CardDescription className="text-right">
                  ملف PDF يحتوي على التمارين والمسائل
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-right">
                    <p className="font-medium text-green-800">تمارين الدرس</p>
                    <p className="text-sm text-green-600">
                      ملف PDF للتدريب والممارسة
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadExercisesPDF}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4 ml-2" />
                    تحميل التمارين
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إغلاق
            </Button>
            <Button>تعديل الدرس</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

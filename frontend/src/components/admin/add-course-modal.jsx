import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, FileText, X } from "lucide-react";

export function AddCourseModal({
  chapterId,
  chapterTitle,
  trigger,
  onAddCourse,
  onUploadPDF,
}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_ref: "",
    duration: "",
    summaryPdf: null,
    exercisesPdf: null,
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onAddCourse) {
      try {
        setUploading(true);

        // Create course first
        const courseData = {
          title: formData.title,
          description: formData.description,
          video_ref: formData.video_ref,
          duration: formData.duration,
        };

        const newCourse = await onAddCourse(chapterId, courseData);

        // Upload PDFs if they exist
        if (formData.summaryPdf && onUploadPDF) {
          await onUploadPDF(newCourse.id, formData.summaryPdf, "summary");
        }

        if (formData.exercisesPdf && onUploadPDF) {
          await onUploadPDF(newCourse.id, formData.exercisesPdf, "exercises");
        }

        setOpen(false);
        setFormData({
          title: "",
          description: "",
          video_ref: "",
          duration: "",
          summaryPdf: null,
          exercisesPdf: null,
        });
      } catch (error) {
        console.error("Error creating course:", error);
        // Error handling is done in the hook
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSummaryFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, summaryPdf: file });
  };

  const handleExercisesFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, exercisesPdf: file });
  };

  const removeFile = (type) => {
    setFormData({ ...formData, [type]: null });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="ml-2 h-4 w-4" />
            إضافة درس
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            إضافة درس إلى {chapterTitle}
          </DialogTitle>
          <DialogDescription className="text-right">
            إنشاء درس جديد مع محتوى فيديو ومواد PDF.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-title" className="text-right">
                عنوان الدرس
              </Label>
              <Input
                id="course-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل عنوان الدرس"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="course-description" className="text-right mt-2">
                الوصف
              </Label>
              <Textarea
                id="course-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل وصف الدرس"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-ref" className="text-right">
                رابط الفيديو
              </Label>
              <Input
                id="video-ref"
                type="url"
                value={formData.video_ref}
                onChange={(e) =>
                  setFormData({ ...formData, video_ref: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                المدة
              </Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) =>
                  setFormData({ ...formData, duration: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="مثال: 45 دقيقة"
                required
              />
            </div>

            {/* Summary PDF Upload */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="summary-pdf" className="text-right mt-2">
                ملخص PDF
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="summary-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleSummaryFileChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  رفع ملف PDF للملخص
                </p>

                {formData.summaryPdf && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {formData.summaryPdf.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(formData.summaryPdf.size / 1024 / 1024).toFixed(
                              2,
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("summaryPdf")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Exercises PDF Upload */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="exercises-pdf" className="text-right mt-2">
                تمارين PDF
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input
                    id="exercises-pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleExercisesFileChange}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">
                  رفع ملف PDF للتمارين
                </p>

                {formData.exercisesPdf && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {formData.exercisesPdf.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(formData.exercisesPdf.size / 1024 / 1024).toFixed(
                              2,
                            )}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("exercisesPdf")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? "جاري الإضافة..." : "إضافة الدرس"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

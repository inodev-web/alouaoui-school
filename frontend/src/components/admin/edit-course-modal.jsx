import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FileText, Upload, X } from "lucide-react";

export function EditCourseModal({
  course,
  chapterId,
  open,
  onOpenChange,
  onSave,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    video_ref: "",
    duration: "",
    pdf_summary: null,
    exercises_pdf: null,
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        video_ref: course.video_ref || "",
        duration: course.duration || "",
        pdf_summary: null,
        exercises_pdf: null,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        video_ref: "",
        duration: "",
        summaryPdf: null,
        exercisesPdf: null,
      });
    }
  }, [course]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSave) {
      try {
        setUploading(true);

        // Prepare form data including files
        const courseData = new FormData();
        courseData.append("title", formData.title);
        courseData.append("description", formData.description);
        courseData.append("video_ref", formData.video_ref);
        courseData.append("duration", formData.duration);
        courseData.append("chapter_id", chapterId.toString());

        // Add PDF files if they exist
        if (formData.pdf_summary) {
          courseData.append("pdf_summary", formData.pdf_summary);
        }
        if (formData.exercises_pdf) {
          courseData.append("exercises_pdf", formData.exercises_pdf);
        }

        console.log("Submitting course data:", {
          title: formData.title,
          description: formData.description,
          video_ref: formData.video_ref,
          duration: formData.duration,
          chapter_id: chapterId,
          has_pdf_summary: !!formData.pdf_summary,
          has_exercises_pdf: !!formData.exercises_pdf,
        });

        const response = await onSave(courseData);
        console.log("Saved course response (raw):", response);

        // Normalize response: accept axios-like response or raw data
        const savedCourse = response?.data || response;

        if (!savedCourse) {
          // Log a warning but don't throw an uncaught error — the caller already created the course
          console.warn(
            "No course data returned by onSave, but creation may have succeeded. Response:",
            response,
          );
          onOpenChange(false);
          return;
        }

        // Les fichiers PDF sont déjà inclus dans la création initiale
        // Pas besoin de les uploader séparément
        console.log("Course saved successfully:", savedCourse);
        onOpenChange(false); // Fermer le modal après succès
      } catch (error) {
        console.error("Error in handleSubmit:", error);
        // Ne pas fermer le modal en cas d'erreur
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSummaryFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, pdf_summary: file });
  };

  const handleExercisesFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, exercises_pdf: file });
  };

  const removeFile = (type) => {
    setFormData({ ...formData, [type]: null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        dir="rtl"
        aria-describedby="course-form-description"
      >
        <DialogHeader>
          <DialogTitle className="text-right">
            {course ? "تعديل درس" : "إضافة درس جديد"}
          </DialogTitle>
          <div
            id="course-form-description"
            className="text-sm text-muted-foreground"
          >
            أدخل معلومات الدرس وقم برفع الملفات المطلوبة
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                عنوان الدرس
              </Label>
              <Input
                id="title"
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
              <Label htmlFor="description" className="text-right mt-2">
                الوصف
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="col-span-3 min-h-[80px] px-3 py-2 text-right border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="أدخل وصف الدرس"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video_ref" className="text-right">
                رابط الفيديو
              </Label>
              <Input
                id="video_ref"
                value={formData.video_ref}
                onChange={(e) =>
                  setFormData({ ...formData, video_ref: e.target.value })
                }
                className="col-span-3 text-right"
                placeholder="أدخل رابط الفيديو"
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

                {formData.pdf_summary && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {formData.pdf_summary.name}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(formData.pdf_summary.size / 1024 / 1024).toFixed(
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
                        onClick={() => removeFile("pdf_summary")}
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

                {formData.exercises_pdf && (
                  <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {formData.exercises_pdf.name}
                          </p>
                          <p className="text-xs text-green-600">
                            {(
                              formData.exercises_pdf.size /
                              1024 /
                              1024
                            ).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("exercises_pdf")}
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
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading
                ? "جاري الحفظ..."
                : course
                  ? "حفظ التغييرات"
                  : "إضافة الدرس"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

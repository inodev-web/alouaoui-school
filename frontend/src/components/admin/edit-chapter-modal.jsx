import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Plus } from "lucide-react";
import { EditCourseModal } from "./edit-course-modal";

const iconOptions = [
  { value: "📐", label: "📐 مسطرة" },
  { value: "⚛️", label: "⚛️ ذرة" },
  { value: "🧪", label: "🧪 أنبوب اختبار" },
  { value: "🔬", label: "🔬 مجهر" },
  { value: "📚", label: "📚 كتب" },
  { value: "🌍", label: "🌍 كرة أرضية" },
  { value: "🎨", label: "🎨 فن" },
  { value: "🎵", label: "🎵 موسيقى" },
  { value: "💻", label: "💻 حاسوب" },
  { value: "🏛️", label: "🏛️ مبنى" },
];

export function EditChapterModal({
  chapter,
  open,
  onOpenChange,
  onUpdateChapter,
  onDeleteChapter,
  onAddCourse,
  onUpdateCourse,
  onDeleteCourse,
  onUploadPDF,
}) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "",
    year_target: "",
  });

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editCourseModalOpen, setEditCourseModalOpen] = useState(false);

  // Initialize form data when chapter changes
  useEffect(() => {
    if (chapter) {
      setFormData({
        title: chapter.title || "",
        description: chapter.description || "",
        icon: chapter.icon || "",
        year_target: chapter.year_target || "",
      });
    }
  }, [chapter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onUpdateChapter) {
      onUpdateChapter(chapter.id, formData);
    }
  };

  const handleDeleteChapter = () => {
    if (
      window.confirm(
        "هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف جميع الدروس المرتبطة به.",
      )
    ) {
      onDeleteChapter(chapter.id);
      onOpenChange(false);
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setEditCourseModalOpen(true);
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setEditCourseModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          dir="rtl"
          aria-describedby="chapter-edit-description"
        >
          <DialogHeader>
            <DialogTitle className="text-right">تعديل الفصل</DialogTitle>
            <DialogDescription
              id="chapter-edit-description"
              className="text-right"
            >
              قم بتعديل معلومات الفصل والدروس المرتبطة به.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chapter Details Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4 text-right">
                معلومات الفصل
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-title" className="text-right">
                      عنوان الفصل
                    </Label>
                    <Input
                      id="chapter-title"
                      name="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="col-span-3 text-right"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label
                      htmlFor="chapter-description"
                      className="text-right mt-2"
                    >
                      الوصف
                    </Label>
                    <textarea
                      id="chapter-description"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      className="col-span-3 min-h-[80px] px-3 py-2 text-right border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-icon" className="text-right">
                      الأيقونة
                    </Label>
                    <Select
                      name="icon"
                      value={formData.icon}
                      onValueChange={(value) =>
                        setFormData({ ...formData, icon: value })
                      }
                    >
                      <SelectTrigger
                        id="chapter-icon"
                        className="col-span-3 text-right"
                      >
                        <SelectValue placeholder="اختر أيقونة" />
                      </SelectTrigger>
                      <SelectContent>
                        {iconOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="chapter-year-target" className="text-right">
                      السنة المستهدفة
                    </Label>
                    <Select
                      name="year_target"
                      value={formData.year_target}
                      onValueChange={(value) =>
                        setFormData({ ...formData, year_target: value })
                      }
                    >
                      <SelectTrigger
                        id="chapter-year-target"
                        className="col-span-3 text-right"
                      >
                        <SelectValue placeholder="اختر السنة المستهدفة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1AM">الأولى متوسط</SelectItem>
                        <SelectItem value="2AM">الثانية متوسط</SelectItem>
                        <SelectItem value="3AM">الثالثة متوسط</SelectItem>
                        <SelectItem value="4AM">الرابعة متوسط</SelectItem>
                        <SelectItem value="1AS">الأولى ثانوي</SelectItem>
                        <SelectItem value="2AS">الثانية ثانوي</SelectItem>
                        <SelectItem value="3AS">الثالثة ثانوي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteChapter}
                    >
                      <Trash2 className="h-4 w-4 ml-2" />
                      حذف الفصل
                    </Button>
                    <Button type="submit">حفظ التغييرات</Button>
                  </div>
                </div>
              </form>
            </div>

            {/* Courses List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-right">الدروس</h3>
                <Button onClick={handleAddCourse}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة درس
                </Button>
              </div>

              <div className="space-y-2">
                {chapter?.courses?.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1 text-right mr-4">
                      <h4 className="font-medium">{course.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {course.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteCourse(chapter.id, course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <EditCourseModal
        open={editCourseModalOpen}
        onOpenChange={setEditCourseModalOpen}
        course={selectedCourse}
        chapterId={chapter?.id}
        onSave={async (courseData) => {
          try {
            let result;
            if (selectedCourse) {
              result = await onUpdateCourse(
                chapter.id,
                selectedCourse.id,
                courseData,
              );
            } else {
              result = await onAddCourse(chapter.id, courseData);
            }

            console.log("Server response:", result);

            // La réponse peut être soit directement les données, soit un objet avec data
            const responseData = result?.data?.data || result?.data || result;

            if (responseData) {
              setEditCourseModalOpen(false);
              return responseData;
            }

            // Si on est ici, la réponse est inattendue. Loggons sans lancer une exception
            // car le cours peut avoir bien été créé (backend retourne parfois une réponse enveloppée).
            console.warn(
              "Unexpected response shape from server when saving course:",
              result,
            );
            setEditCourseModalOpen(false);
            return result;
          } catch (error) {
            console.error("Error saving course:", error);
            throw error;
          }
        }}
        onUploadPDF={onUploadPDF}
      />
    </>
  );
}

import { useState, useCallback, useEffect } from "react";
import { chapterService } from "@/services/api/chapter.service";
import { courseService } from "@/services/api/course.service";

export const useChapters = () => {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load chapters from API
  const loadChapters = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.getChapters(filters);
      setChapters(response.data || []);
    } catch (err) {
      setError(err.message || "فشل في تحميل الفصول");
      console.error("Error loading chapters:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load chapters on mount
  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  const addChapter = useCallback(async (chapterData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.createChapter(chapterData);
      const newChapter = response.data;

      setChapters((prev) => [...prev, newChapter]);
      return newChapter;
    } catch (err) {
      setError(err.message || "فشل في إنشاء الفصل");
      console.error("Error creating chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateChapter = useCallback(async (chapterId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await chapterService.updateChapter(chapterId, updates);
      const updatedChapter = response.data;

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? { ...chapter, ...updatedChapter }
            : chapter,
        ),
      );
      return updatedChapter;
    } catch (err) {
      setError(err.message || "فشل في تحديث الفصل");
      console.error("Error updating chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteChapter = useCallback(async (chapterId) => {
    try {
      setLoading(true);
      setError(null);
      await chapterService.deleteChapter(chapterId);

      setChapters((prev) => prev.filter((chapter) => chapter.id !== chapterId));
    } catch (err) {
      setError(err.message || "فشل في حذف الفصل");
      console.error("Error deleting chapter:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCourse = useCallback(async (chapterId, courseData) => {
    try {
      setLoading(true);
      setError(null);

      // Si courseData est déjà un FormData, ajouter juste le chapter_id
      if (courseData instanceof FormData) {
        courseData.append("chapter_id", chapterId);
      } else {
        // Sinon, créer un nouveau FormData avec toutes les données
        const formData = new FormData();
        formData.append("chapter_id", chapterId);

        Object.entries(courseData).forEach(([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        courseData = formData;
      }

      console.log(
        "Creating course with data:",
        Object.fromEntries(courseData.entries()),
      );
      const response = await courseService.createCourse(courseData);
      console.log("Response received in addCourse:", response);

      // S'assurer que nous avons une réponse valide en vérifiant la structure attendue
      let courseResponseData = null;

      // Vérifier les différentes structures possibles de la réponse
      if (response?.data?.data) {
        // Si la réponse est du type { data: { data: {...} } }
        courseResponseData = response.data.data;
      } else if (response?.data) {
        // Si la réponse est du type { data: {...} }
        courseResponseData = response.data;
      } else if (response) {
        // Si la réponse est directement les données
        courseResponseData = response;
      }

      if (!courseResponseData) {
        console.error("Invalid response structure:", response);
        throw new Error("Format de réponse invalide du serveur");
      }

      setChapters((prev) =>
        prev.map((chapter) => {
          if (chapter.id === chapterId) {
            return {
              ...chapter,
              courses: [
                ...(chapter.courses || []),
                {
                  ...courseResponseData,
                  pdf_summary: courseResponseData.pdf_summary || null,
                  exercises_pdf: courseResponseData.exercises_pdf || null,
                },
              ],
            };
          }
          return chapter;
        }),
      );
      return courseResponseData;
    } catch (err) {
      setError(err.message || "فشل في إنشاء الدرس");
      console.error("Error creating course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCourse = useCallback(async (chapterId, courseId, updates) => {
    try {
      setLoading(true);
      setError(null);
      const response = await courseService.updateCourse(courseId, updates);
      const updatedCourse = response.data;

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                courses: (chapter.courses || []).map((course) =>
                  course.id === courseId
                    ? { ...course, ...updatedCourse }
                    : course,
                ),
              }
            : chapter,
        ),
      );
      return updatedCourse;
    } catch (err) {
      setError(err.message || "فشل في تحديث الدرس");
      console.error("Error updating course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCourse = useCallback(async (chapterId, courseId) => {
    try {
      setLoading(true);
      setError(null);
      await courseService.deleteCourse(courseId);

      setChapters((prev) =>
        prev.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                courses: (chapter.courses || []).filter(
                  (course) => course.id !== courseId,
                ),
              }
            : chapter,
        ),
      );
    } catch (err) {
      setError(err.message || "فشل في حذف الدرس");
      console.error("Error deleting course:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCoursePDF = useCallback(
    async (courseId, file, type) => {
      try {
        setLoading(true);
        setError(null);
        console.log("Uploading PDF:", { courseId, type, fileName: file.name });

        const response = await courseService.uploadCoursePDF(
          courseId,
          file,
          type,
        );
        console.log("Upload response:", response.data);

        // Mettre à jour le state des chapitres après l'upload réussi
        // Rechargez les données complètes après l'upload
        const reloadResponse = await courseService.getCourse(courseId);
        console.log("Reloaded course data:", reloadResponse.data);

        setChapters((prev) => {
          const newChapters = prev.map((chapter) => {
            const newCourses = chapter.courses.map((course) => {
              if (course.id === courseId) {
                // Utilisez les données fraîchement rechargées
                return reloadResponse.data;
              }
              return course;
            });
            return { ...chapter, courses: newCourses };
          });
          console.log("New chapters state:", newChapters);
          return newChapters;
        });

        return response.data;
      } catch (err) {
        setError(err.message || "فشل في رفع ملف PDF");
        console.error("Error uploading PDF:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setChapters],
  );

  const getChapterById = useCallback(
    (chapterId) => {
      return chapters.find((chapter) => chapter.id === chapterId);
    },
    [chapters],
  );

  const getCourseById = useCallback(
    (chapterId, courseId) => {
      const chapter = getChapterById(chapterId);
      return chapter?.courses?.find((course) => course.id === courseId);
    },
    [getChapterById],
  );

  return {
    chapters,
    loading,
    error,
    loadChapters,
    addChapter,
    updateChapter,
    deleteChapter,
    addCourse,
    updateCourse,
    deleteCourse,
    uploadCoursePDF,
    getChapterById,
    getCourseById,
  };
};

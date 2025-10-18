import api from "./axios.config";

const COURSE_ENDPOINTS = {
  COURSES: "/courses",
  BY_CHAPTER: "/courses/chapter",
};

export const courseService = {
  /**
   * Get all courses with optional filters
   */
  async getCourses(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.chapter_id) params.append("chapter_id", filters.chapter_id);
      if (filters.year_target)
        params.append("year_target", filters.year_target);
      if (filters.search) params.append("search", filters.search);
      if (filters.per_page) params.append("per_page", filters.per_page);
      if (filters.page) params.append("page", filters.page);

      const response = await api.get(
        `${COURSE_ENDPOINTS.COURSES}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching courses:", error);
      throw error;
    }
  },

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId) {
    try {
      const response = await api.get(`${COURSE_ENDPOINTS.COURSES}/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching course:", error);
      throw error;
    }
  },

  /**
   * Create a new course (Admin only)
   */
  async createCourse(courseData) {
    try {
      // Si courseData est déjà un FormData, l'utiliser tel quel
      // Sinon, créer un nouveau FormData
      let formData =
        courseData instanceof FormData ? courseData : new FormData();

      // Si courseData est un objet simple, ajouter chaque champ au FormData
      if (!(courseData instanceof FormData)) {
        Object.entries(courseData).forEach(([key, value]) => {
          console.log("Adding field to FormData:", key, value);
          if (value instanceof File) {
            console.log("Adding file:", key, value.name);
            formData.append(key, value, value.name);
          } else if (value !== null && value !== undefined) {
            formData.append(key, value);
          }
        });
      }

      // Configurer les en-têtes pour FormData
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      console.log(
        "Creating course with FormData:",
        Object.fromEntries(formData.entries()),
      );
      const response = await api.post(
        COURSE_ENDPOINTS.COURSES,
        formData,
        config,
      );
      console.log("Course created successfully:", response);

      // Standardiser la structure de la réponse
      const responseData = response.data?.data || response.data || response;
      console.log("Standardized response data:", responseData);

      if (!responseData) {
        throw new Error("Réponse invalide du serveur");
      }

      return responseData;
    } catch (error) {
      console.error("Error creating course:", error);
      throw error;
    }
  },

  /**
   * Update a course (Admin only)
   */
  async updateCourse(courseId, courseData) {
    try {
      // Si courseData est déjà un FormData, l'utiliser tel quel
      // Sinon, créer un nouveau FormData
      let formData =
        courseData instanceof FormData ? courseData : new FormData();

      // Si courseData est un objet simple, ajouter chaque champ au FormData
      if (!(courseData instanceof FormData)) {
        Object.entries(courseData).forEach(([key, value]) => {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });
      }

      // Configurer les en-têtes pour FormData
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      console.log("Updating course with FormData:", {
        courseId,
        data: Object.fromEntries(formData.entries()),
      });

      const response = await api.put(
        `${COURSE_ENDPOINTS.COURSES}/${courseId}`,
        formData,
        config,
      );
      console.log("Course updated successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating course:", error);
      throw error;
    }
  },

  /**
   * Delete a course (Admin only)
   */
  async deleteCourse(courseId) {
    try {
      const response = await api.delete(
        `${COURSE_ENDPOINTS.COURSES}/${courseId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting course:", error);
      throw error;
    }
  },

  /**
   * Get courses by chapter
   */
  async getCoursesByChapter(chapterId) {
    try {
      const response = await api.get(
        `${COURSE_ENDPOINTS.BY_CHAPTER}/${chapterId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching courses by chapter:", error);
      throw error;
    }
  },

  /**
   * Upload PDF file for course
   */
  async uploadCoursePDF(courseId, file, type = "summary") {
    try {
      console.log("Preparing PDF upload:", {
        courseId,
        type,
        fileName: file.name,
      });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type); // 'summary' or 'exercises'

      console.log(
        "Sending request to:",
        `${COURSE_ENDPOINTS.COURSES}/${courseId}/upload-pdf`,
      );
      const response = await api.post(
        `${COURSE_ENDPOINTS.COURSES}/${courseId}/upload-pdf`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Upload response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error uploading course PDF:", error);
      throw error;
    }
  },

  /**
   * Delete PDF file from course
   */
  async deleteCoursePDF(courseId, type = "summary") {
    try {
      const response = await api.delete(
        `${COURSE_ENDPOINTS.COURSES}/${courseId}/pdf`,
        {
          data: { type },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting course PDF:", error);
      throw error;
    }
  },

  /**
   * Get course video stream URL
   */
  async getCourseVideoStream(courseId) {
    try {
      const response = await api.get(
        `${COURSE_ENDPOINTS.COURSES}/${courseId}/stream`,
      );
      return response.data;
    } catch (error) {
      console.error("Error getting course video stream:", error);
      throw error;
    }
  },
};

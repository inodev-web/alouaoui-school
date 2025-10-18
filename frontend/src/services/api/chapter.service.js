import api from "./axios.config";

const CHAPTER_ENDPOINTS = {
  CHAPTERS: "/chapters",
  BY_TEACHER: "/chapters/teacher",
};

export const chapterService = {
  /**
   * Get all chapters with optional filters
   */
  async getChapters(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append("search", filters.search);
      if (filters.year_of_study)
        params.append("year_of_study", filters.year_of_study);
      if (filters.per_page) params.append("per_page", filters.per_page);
      if (filters.page) params.append("page", filters.page);

      const response = await api.get(
        `${CHAPTER_ENDPOINTS.CHAPTERS}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching chapters:", error);
      throw error;
    }
  },

  /**
   * Get a specific chapter by ID
   */
  async getChapter(chapterId) {
    try {
      const response = await api.get(
        `${CHAPTER_ENDPOINTS.CHAPTERS}/${chapterId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching chapter:", error);
      throw error;
    }
  },

  /**
   * Create a new chapter (Admin only)
   */
  async createChapter(chapterData) {
    try {
      const response = await api.post(CHAPTER_ENDPOINTS.CHAPTERS, chapterData);
      return response.data;
    } catch (error) {
      console.error("Error creating chapter:", error);
      throw error;
    }
  },

  /**
   * Update a chapter (Admin only)
   */
  async updateChapter(chapterId, chapterData) {
    try {
      const response = await api.put(
        `${CHAPTER_ENDPOINTS.CHAPTERS}/${chapterId}`,
        chapterData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw error;
    }
  },

  /**
   * Delete a chapter (Admin only)
   */
  async deleteChapter(chapterId) {
    try {
      const response = await api.delete(
        `${CHAPTER_ENDPOINTS.CHAPTERS}/${chapterId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting chapter:", error);
      throw error;
    }
  },

  /**
   * Get chapters by teacher
   */
  async getChaptersByTeacher(teacherId) {
    try {
      const response = await api.get(
        `${CHAPTER_ENDPOINTS.BY_TEACHER}/${teacherId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching chapters by teacher:", error);
      throw error;
    }
  },

  /**
   * Toggle chapter status (Admin only)
   */
  async toggleChapterStatus(chapterId) {
    try {
      const response = await api.patch(
        `${CHAPTER_ENDPOINTS.CHAPTERS}/${chapterId}/toggle-status`,
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling chapter status:", error);
      throw error;
    }
  },

  /**
   * Reorder chapters (Admin only)
   */
  async reorderChapters(chapterIds) {
    try {
      const response = await api.post(`${CHAPTER_ENDPOINTS.CHAPTERS}/reorder`, {
        chapter_ids: chapterIds,
      });
      return response.data;
    } catch (error) {
      console.error("Error reordering chapters:", error);
      throw error;
    }
  },
};

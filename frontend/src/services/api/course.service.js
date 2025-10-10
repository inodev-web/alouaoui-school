import api from './axios.config'

const COURSE_ENDPOINTS = {
  COURSES: '/courses',
  BY_CHAPTER: '/courses/chapter',
}

export const courseService = {
  /**
   * Get all courses with optional filters
   */
  async getCourses(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.chapter_id) params.append('chapter_id', filters.chapter_id)
      if (filters.year_target) params.append('year_target', filters.year_target)
      if (filters.search) params.append('search', filters.search)
      if (filters.per_page) params.append('per_page', filters.per_page)
      if (filters.page) params.append('page', filters.page)

      const response = await api.get(`${COURSE_ENDPOINTS.COURSES}?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  },

  /**
   * Get a specific course by ID
   */
  async getCourse(courseId) {
    try {
      const response = await api.get(`${COURSE_ENDPOINTS.COURSES}/${courseId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching course:', error)
      throw error
    }
  },

  /**
   * Create a new course (Admin only)
   */
  async createCourse(courseData) {
    try {
      const response = await api.post(COURSE_ENDPOINTS.COURSES, courseData)
      return response.data
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  },

  /**
   * Update a course (Admin only)
   */
  async updateCourse(courseId, courseData) {
    try {
      const response = await api.put(`${COURSE_ENDPOINTS.COURSES}/${courseId}`, courseData)
      return response.data
    } catch (error) {
      console.error('Error updating course:', error)
      throw error
    }
  },

  /**
   * Delete a course (Admin only)
   */
  async deleteCourse(courseId) {
    try {
      const response = await api.delete(`${COURSE_ENDPOINTS.COURSES}/${courseId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting course:', error)
      throw error
    }
  },

  /**
   * Get courses by chapter
   */
  async getCoursesByChapter(chapterId) {
    try {
      const response = await api.get(`${COURSE_ENDPOINTS.BY_CHAPTER}/${chapterId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching courses by chapter:', error)
      throw error
    }
  },

  /**
   * Upload PDF file for course
   */
  async uploadCoursePDF(courseId, file, type = 'summary') {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type) // 'summary' or 'exercises'

      const response = await api.post(`${COURSE_ENDPOINTS.COURSES}/${courseId}/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error uploading course PDF:', error)
      throw error
    }
  },

  /**
   * Delete PDF file from course
   */
  async deleteCoursePDF(courseId, type = 'summary') {
    try {
      const response = await api.delete(`${COURSE_ENDPOINTS.COURSES}/${courseId}/pdf`, {
        data: { type }
      })
      return response.data
    } catch (error) {
      console.error('Error deleting course PDF:', error)
      throw error
    }
  },

  /**
   * Get course video stream URL
   */
  async getCourseVideoStream(courseId) {
    try {
      const response = await api.get(`${COURSE_ENDPOINTS.COURSES}/${courseId}/stream`)
      return response.data
    } catch (error) {
      console.error('Error getting course video stream:', error)
      throw error
    }
  }
}

import api from './axios.config'

const TEACHER_ENDPOINTS = {
  TEACHERS: '/teachers',
  STATS: '/teachers/stats',
}

export const teacherService = {
  /**
   * Get all teachers
   */
  async getTeachers() {
    try {
      const response = await api.get(TEACHER_ENDPOINTS.TEACHERS)
      return response.data
    } catch (error) {
      console.error('Error fetching teachers:', error)
      throw error
    }
  },

  /**
   * Get teacher statistics
   */
  async getTeacherStats() {
    try {
      const response = await api.get(TEACHER_ENDPOINTS.STATS)
      return response.data
    } catch (error) {
      console.error('Error fetching teacher stats:', error)
      throw error
    }
  },

  /**
   * Get a single teacher by ID
   */
  async getTeacher(teacherId) {
    try {
      const response = await api.get(`${TEACHER_ENDPOINTS.TEACHERS}/${teacherId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching teacher:', error)
      throw error
    }
  },

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData) {
    try {
      const response = await api.post(TEACHER_ENDPOINTS.TEACHERS, teacherData)
      return response.data
    } catch (error) {
      console.error('Error creating teacher:', error)
      throw error
    }
  },

  /**
   * Update a teacher
   */
  async updateTeacher(teacherId, teacherData) {
    try {
      const response = await api.put(`${TEACHER_ENDPOINTS.TEACHERS}/${teacherId}`, teacherData)
      return response.data
    } catch (error) {
      console.error('Error updating teacher:', error)
      throw error
    }
  },

  /**
   * Delete a teacher
   */
  async deleteTeacher(teacherId) {
    try {
      const response = await api.delete(`${TEACHER_ENDPOINTS.TEACHERS}/${teacherId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting teacher:', error)
      throw error
    }
  }
}

export default teacherService

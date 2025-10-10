import api from './axios.config'

const SESSION_ENDPOINTS = {
  SESSIONS: '/sessions',
  TODAY: '/sessions/today',
  STATS: '/sessions/stats',
}

export const sessionService = {
  /**
   * Get all sessions with optional filters
   */
  async getSessions(filters = {}) {
    try {
      const params = new URLSearchParams()
      
      if (filters.teacher_uuid) params.append('teacher_uuid', filters.teacher_uuid)
      if (filters.year_target) params.append('year_target', filters.year_target)
      if (filters.status) params.append('status', filters.status)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.search) params.append('search', filters.search)
      if (filters.today_only) params.append('today_only', filters.today_only)
      if (filters.page) params.append('page', filters.page)

      const response = await api.get(`${SESSION_ENDPOINTS.SESSIONS}?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching sessions:', error)
      throw error
    }
  },

  /**
   * Get today's sessions
   */
  async getTodaysSessions() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.TODAY)
      return response.data
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error)
      throw error
    }
  },

  /**
   * Get session statistics
   */
  async getSessionStats() {
    try {
      const response = await api.get(SESSION_ENDPOINTS.STATS)
      return response.data
    } catch (error) {
      console.error('Error fetching session stats:', error)
      throw error
    }
  },

  /**
   * Get a single session by ID
   */
  async getSession(sessionId) {
    try {
      const response = await api.get(`${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching session:', error)
      throw error
    }
  },

  /**
   * Create a new session
   */
  async createSession(sessionData) {
    try {
      const response = await api.post(SESSION_ENDPOINTS.SESSIONS, sessionData)
      return response.data
    } catch (error) {
      console.error('Error creating session:', error)
      throw error
    }
  },

  /**
   * Update a session
   */
  async updateSession(sessionId, sessionData) {
    try {
      const response = await api.put(`${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`, sessionData)
      return response.data
    } catch (error) {
      console.error('Error updating session:', error)
      throw error
    }
  },

  /**
   * Delete a session
   */
  async deleteSession(sessionId) {
    try {
      const response = await api.delete(`${SESSION_ENDPOINTS.SESSIONS}/${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting session:', error)
      throw error
    }
  },

  /**
   * Transform session data for form submission
   */
  transformSessionForSubmission(formData) {
    return {
      teacher_uuid: formData.teacher,
      year_target: formData.year_target || '1AM',
      start_time: `${formData.date} ${formData.time}:00`,
      end_time: this.calculateEndTime(formData.date, formData.time, formData.duration),
      status: 'completed' // Default status in simplified model
    }
  },

  /**
   * Calculate end time based on start time and duration
   */
  calculateEndTime(date, startTime, duration) {
    const startDateTime = new Date(`${date} ${startTime}`)
    const durationHours = parseFloat(duration.replace('س', ''))
    const endDateTime = new Date(startDateTime.getTime() + (durationHours * 60 * 60 * 1000))
    return endDateTime.toISOString().slice(0, 19).replace('T', ' ')
  }
}

export default sessionService

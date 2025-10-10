import api from './axios.config'

const CHECKIN_ENDPOINTS = {
  SCAN_QR: '/admin/checkin/scan-qr',
  MANUAL_CHECKIN: '/admin/checkin/manual-checkin',
  SESSION_ATTENDANCE: '/admin/checkin/session-attendance',
  ATTENDANCE_STATS: '/admin/checkin/attendance-stats',
  STUDENT_HISTORY: '/admin/checkin/student',
}

export const checkinService = {
  /**
   * Scan QR code and check-in student
   */
  async scanQr(data) {
    try {
      const response = await api.post(CHECKIN_ENDPOINTS.SCAN_QR, data)
      return response.data
    } catch (error) {
      console.error('Error scanning QR:', error)
      throw error
    }
  },

  /**
   * Manual check-in for admin corrections
   */
  async manualCheckin(data) {
    try {
      const response = await api.post(CHECKIN_ENDPOINTS.MANUAL_CHECKIN, data)
      return response.data
    } catch (error) {
      console.error('Error manual check-in:', error)
      throw error
    }
  },

  /**
   * Get session attendance list
   */
  async getSessionAttendance(sessionId) {
    try {
      const response = await api.get(`${CHECKIN_ENDPOINTS.SESSION_ATTENDANCE}?session_id=${sessionId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching session attendance:', error)
      throw error
    }
  },

  /**
   * Get attendance statistics
   */
  async getAttendanceStats() {
    try {
      const response = await api.get(CHECKIN_ENDPOINTS.ATTENDANCE_STATS)
      return response.data
    } catch (error) {
      console.error('Error fetching attendance stats:', error)
      throw error
    }
  },

  /**
   * Get student attendance history
   */
  async getStudentHistory(studentUuid, filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.from_date) params.append('from_date', filters.from_date)
      if (filters.to_date) params.append('to_date', filters.to_date)
      if (filters.per_page) params.append('per_page', filters.per_page)

      const response = await api.get(`${CHECKIN_ENDPOINTS.STUDENT_HISTORY}/${studentUuid}/history?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching student history:', error)
      throw error
    }
  }
}

import { useState, useEffect } from 'react'
import dashboardService from '../services/dashboardService'

export const useDashboardCards = (period = 'daily', date = null) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await dashboardService.getDashboardCards(period, date)
        setData(result)
      } catch (err) {
        setError(err)
        console.error('Error fetching dashboard cards:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, date])

  return { data, loading, error, refetch: () => fetchData() }
}

export const useTopTeachers = (limit = 10, period = 'daily', date = null) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await dashboardService.getTopTeachers(limit, period, date)
        setData(result.data || [])
      } catch (err) {
        setError(err)
        console.error('Error fetching top teachers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [limit, period, date])

  return { data, loading, error, refetch: () => fetchData() }
}

export const useRevenueTimeSeries = (period = 'daily', days = 30, startDate = null, endDate = null) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await dashboardService.getRevenueTimeSeries(period, days, startDate, endDate)
        setData(result.data || [])
      } catch (err) {
        setError(err)
        console.error('Error fetching revenue time series:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, days, startDate, endDate])

  return { data, loading, error, refetch: () => fetchData() }
}

export const useTeacherPerformance = (teacherUuid = null, period = 'daily', date = null) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await dashboardService.getTeacherPerformance(teacherUuid, period, date)
        setData(result.data || [])
      } catch (err) {
        setError(err)
        console.error('Error fetching teacher performance:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [teacherUuid, period, date])

  return { data, loading, error, refetch: () => fetchData() }
}

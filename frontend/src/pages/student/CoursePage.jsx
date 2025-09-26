import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Play, FileText, Download, BookOpen, Clock, User, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import VideoPlayer from '../../components/student/VideoPlayer'
import { api, endpoints } from '../../services/axios.config'

const StudentCoursePage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('video')
  
  // API states
  const [courseData, setCourseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch course data from API
  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const response = await api.get(endpoints.courses.show(id))
      
      if (response.data) {
        setCourseData(response.data)
        setError(null)
      } else {
        setError('Cours non trouvé')
      }
    } catch (err) {
      console.error('Error fetching course:', err)
      setError(
        err.response?.data?.message || 
        'Erreur lors du chargement du cours'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCourseData()
    }
  }, [id])

  const tabs = [
    { id: 'exercises', label: 'التمارين', icon: BookOpen },
    { id: 'summary', label: 'ملخص الدرس', icon: FileText },
    { id: 'video', label: 'الفيديو', icon: Play }
  ]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">تحميل بيانات الدرس...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">خطأ في تحميل الدرس</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchCourseData}
            className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      </div>
    )
  }

  // No course data
  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">الدرس غير موجود</h2>
          <p className="text-gray-600">لم يتم العثور على الدرس المطلوب</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex gap-4">
          <div className="w-full flex flex-col items-end">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-right">{courseData.title}</h1>
            <p className="text-gray-600 mb-4 text-right">
              {courseData.chapter?.name} - {courseData.year_target}
            </p>
            
            {/* Course Stats */}
            <div className="flex flex-wrap items-center justify-end gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <BookOpen className="w-4 h-4" />
                <span>المستوى: {courseData.year_target}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <User className="w-4 h-4" />
                <span>{courseData.chapter?.teacher?.name || 'أستاذ اسماعيل علواوي'}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <FileText className="w-4 h-4" />
                <span>الفصل: {courseData.chapter?.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex justify-end space-x-8 rtl:space-x-reverse px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 rtl:space-x-reverse py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'video' && (
            <div className="space-y-6">
              {courseData.video_ref ? (
                <VideoPlayer
                  videoSrc={courseData.video_ref}
                  title={courseData.title}
                />
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">فيديو غير متاح</h4>
                    <p className="text-gray-500">لم يتم رفع الفيديو بعد</p>
                  </div>
                </div>
              )}
              
              {/* Video Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-right">وصف الدرس</h3>
                <p className="text-gray-600 leading-relaxed text-right">
                  {courseData.title} - {courseData.chapter?.name}
                  <br />
                  المستوى المستهدف: {courseData.year_target}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">ملخص الدرس</h3>
                {courseData.pdf_summary && (
                  <a
                    href={courseData.pdf_summary}
                    download
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </a>
                )}
              </div>
              
              {/* PDF Viewer */}
              {courseData.pdf_summary ? (
                <div className="bg-gray-100 rounded-lg border-2 border-solid border-gray-300 h-96">
                  <iframe
                    src={courseData.pdf_summary}
                    className="w-full h-full rounded-lg"
                    title="ملخص الدرس"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">ملخص الدرس</h4>
                    <p className="text-gray-500">لم يتم رفع ملخص الدرس بعد</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">تمارين الدرس</h3>
                {courseData.exercises_pdf && (
                  <a
                    href={courseData.exercises_pdf}
                    download
                    className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PDF</span>
                  </a>
                )}
              </div>
              
              {/* PDF Viewer */}
              {courseData.exercises_pdf ? (
                <div className="bg-gray-100 rounded-lg border-2 border-solid border-gray-300 h-96">
                  <iframe
                    src={courseData.exercises_pdf}
                    className="w-full h-full rounded-lg"
                    title="تمارين الدرس"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">تمارين الدرس</h4>
                    <p className="text-gray-500">لم يتم رفع تمارين الدرس بعد</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentCoursePage

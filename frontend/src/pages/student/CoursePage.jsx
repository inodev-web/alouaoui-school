import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Play, FileText, Download, BookOpen, Clock, User, Star } from 'lucide-react'
import VideoPlayer from '../../components/student/VideoPlayer'

const StudentCoursePage = () => {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('video')
  
  // Mock course data
  const courseData = {
    id: id,
    title: "الفيزياء الأساسية - الحركة الخطية",
    instructor: "أستاذ اسماعيل علواوي",
    duration: "45:30",
    rating: 4.8,
    students: 156,
    description: "درس شامل عن الحركة الخطية في الفيزياء، يتضمن المفاهيم الأساسية والتطبيقات العملية",
    videoSrc: "/video.mp4",
    thumbnail: "/api/placeholder/800/450",
    summaryPdf: "/api/placeholder/summary.pdf",
    exercisesPdf: "/api/placeholder/exercises.pdf"
  }

  const tabs = [
    { id: 'video', label: 'الفيديو', icon: Play },
    { id: 'summary', label: 'ملخص الدرس', icon: FileText },
    { id: 'exercises', label: 'التمارين', icon: BookOpen }
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{courseData.title}</h1>
            <p className="text-gray-600 mb-4">{courseData.description}</p>
            
            {/* Course Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <User className="w-4 h-4" />
                <span>{courseData.instructor}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Clock className="w-4 h-4" />
                <span>{courseData.duration}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{courseData.rating}</span>
              </div>
              <div className="flex items-center space-x-1 rtl:space-x-reverse">
                <BookOpen className="w-4 h-4" />
                <span>{courseData.students} طالب</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 rtl:space-x-reverse px-6">
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
              <VideoPlayer
                videoSrc={courseData.videoSrc}
                title={courseData.title}
                duration={courseData.duration}
                thumbnail={courseData.thumbnail}
              />
              
              {/* Video Description */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">وصف الدرس</h3>
                <p className="text-gray-600 leading-relaxed">
                  في هذا الدرس سنتعلم المفاهيم الأساسية للحركة الخطية في الفيزياء، 
                  بما في ذلك السرعة والتسارع والإزاحة. سنقوم بحل أمثلة عملية وتطبيقات 
                  متنوعة لضمان الفهم الكامل للموضوع.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">ملخص الدرس</h3>
                <button className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200">
                  <Download className="w-4 h-4" />
                  <span>تحميل PDF</span>
                </button>
              </div>
              
              {/* PDF Viewer Placeholder */}
              <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">ملخص الدرس</h4>
                  <p className="text-gray-500 mb-4">اضغط على تحميل PDF لعرض الملف</p>
                  <button className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200">
                    فتح PDF
                  </button>
                </div>
              </div>
              
              {/* Summary Content Preview */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">نقاط مهمة من الدرس:</h4>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>الحركة الخطية هي حركة الجسم في خط مستقيم</span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>السرعة = المسافة ÷ الزمن</span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>التسارع = التغيير في السرعة ÷ الزمن</span>
                  </li>
                  <li className="flex items-start space-x-2 rtl:space-x-reverse">
                    <span className="text-pink-500 mt-1">•</span>
                    <span>الإزاحة هي أقصر مسافة بين نقطتين</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'exercises' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">تمارين الدرس</h3>
                <button className="flex items-center space-x-2 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200">
                  <Download className="w-4 h-4" />
                  <span>تحميل PDF</span>
                </button>
              </div>
              
              {/* PDF Viewer Placeholder */}
              <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 h-96 flex items-center justify-center">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 mb-2">تمارين الدرس</h4>
                  <p className="text-gray-500 mb-4">اضغط على تحميل PDF لعرض التمارين</p>
                  <button className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-lg hover:from-red-500 hover:to-pink-600 transition-colors duration-200">
                    فتح PDF
                  </button>
                </div>
              </div>
              
              {/* Exercise Preview */}
              <div className="bg-white border rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">عينة من التمارين:</h4>
                <div className="space-y-4">
                  <div className="border-l-4 border-pink-500 pl-4">
                    <p className="font-medium text-gray-900">السؤال الأول:</p>
                    <p className="text-gray-600">سيارة تسير بسرعة 60 كم/ساعة لمدة ساعتين، احسب المسافة المقطوعة.</p>
                  </div>
                  <div className="border-l-4 border-pink-500 pl-4">
                    <p className="font-medium text-gray-900">السؤال الثاني:</p>
                    <p className="text-gray-600">جسم يتحرك من السكون ويتسارع بمعدل 2 م/ث²، احسب سرعته بعد 5 ثوانٍ.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentCoursePage

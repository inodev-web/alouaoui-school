import { Play, Users, Clock, Calendar, ExternalLink, Wifi } from 'lucide-react'

const StudentLivesPage = () => {
  // Single live session data
  const liveSession = {
    id: 1,
    title: "درس الفيزياء - الحركة الدائرية",
    instructor: "أستاذ اسماعيل علواوي",
    status: "live",
    startTime: "14:00",
    endTime: "15:30",
    date: "15/01/2025",
    participants: 45,
    maxParticipants: 50,
    description: "درس تفاعلي عن الحركة الدائرية مع أمثلة عملية وتطبيقات متنوعة لضمان الفهم الكامل للموضوع",
    thumbnail: "/api/placeholder/400/225",
    joinLink: "https://meet.google.com/abc-defg-hij",
    isLive: true
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Single Live Session Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        {/* Session Thumbnail */}
        <div className="relative h-64 bg-gradient-to-br from-red-400 to-pink-500">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 rtl:space-x-reverse">
              <Wifi className="w-4 h-4" />
              <span>مباشر</span>
            </span>
          </div>

          {/* Live Indicator */}
          <div className="absolute top-4 left-4 flex items-center space-x-1 rtl:space-x-reverse">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">مباشر</span>
          </div>

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-6 transform hover:scale-110 transition-all duration-300 shadow-lg">
              <Play className="w-12 h-12 text-gray-800" fill="currentColor" />
            </button>
          </div>

          {/* Participants Count */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-1 rtl:space-x-reverse text-white text-sm">
            <Users className="w-4 h-4" />
            <span>{liveSession.participants}/{liveSession.maxParticipants}</span>
          </div>
        </div>

        {/* Session Content */}
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{liveSession.title}</h1>
          <p className="text-gray-600 text-lg mb-4">{liveSession.instructor}</p>
          <p className="text-gray-500 text-base mb-6 leading-relaxed">{liveSession.description}</p>
          
          {/* Session Details */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="text-lg">{liveSession.date}</span>
            </div>
            <div className="flex items-center space-x-1 rtl:space-x-reverse text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{liveSession.startTime} - {liveSession.endTime}</span>
            </div>
          </div>

          {/* Join Button */}
          <div className="text-center">
            <a
              href={liveSession.joinLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center space-x-3 rtl:space-x-reverse bg-gradient-to-r from-red-400 to-pink-500 text-white py-4 px-8 rounded-lg font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <Play className="w-6 h-6" />
              <span className="text-lg">انضم إلى الجلسة الآن</span>
              <ExternalLink className="w-6 h-6" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentLivesPage

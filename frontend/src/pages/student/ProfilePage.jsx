import React from 'react';
// استخدام أيقونات من مكتبة lucide-react
import { Phone, Camera, BookOpen, Clock, Users, Star, Play, Calendar } from 'lucide-react';

// --- المكون الرئيسي لصفحة تعريف الطالب ---
const StudentProfilePage = () => {
  // --- بيانات افتراضية ---
  const student = {
    name: 'أمينة بن علي',
    id: 'S-20251109',
    phone: '+213 555 123 456',
    grade: '3 ثانوي',
    gradeLevel: 'highschool',
    profilePic: 'https://i.pinimg.com/736x/2d/a6/7e/2da67e0882ff0aa1d407d33c9b937e0d.jpg',
    qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=StudentID-${'S-20251109'}`,
  };

  // بيانات الدورات المسجلة
  const enrolledClasses = [
    {
      id: 1,
      title: "الفيزياء الأساسية",
      instructor: "أستاذ اسماعيل علواوي",
      progress: 75,
      totalLessons: 12,
      completedLessons: 9,
      nextClass: "15/01/2025",
      status: "active",
      thumbnail: "/api/placeholder/300/200",
      rating: 4.8,
      students: 45
    },
    {
      id: 2,
      title: "الرياضيات المتقدمة",
      instructor: "أستاذ أحمد محمد",
      progress: 60,
      totalLessons: 15,
      completedLessons: 9,
      nextClass: "16/01/2025",
      status: "active",
      thumbnail: "/api/placeholder/300/200",
      rating: 4.9,
      students: 32
    }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return "مكتمل";
    return dateString;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'completed': return 'مكتمل';
      case 'paused': return 'متوقف';
      default: return 'غير محدد';
    }
  };

  return (
    <div dir="rtl" className="min-h-screen font-sans">
      
      {/* ## قسم الترويسة والملف الشخصي ## */}
      <div className="bg-gradient-to-br from-red-400 to-pink-500 text-white p-8 md:p-12 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center text-center md:text-right gap-8">
          
          {/* الصورة الشخصية */}
          <div className="relative group flex-shrink-0">
            <img
              src={student.profilePic}
              alt="الصورة الشخصية"
              className="w-40 h-40 rounded-full object-cover border-4 border-white/50 shadow-xl"
            />
            <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <Camera size={36} />
              <span className="text-sm mt-1">تغيير الصورة</span>
            </div>
          </div>
          
          {/* معلومات الطالب */}
          <div className="flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold">{student.name}</h1>
            <p className="text-white/80 mt-2 text-base md:text-lg">
              رقم التسجيل: {student.id}
            </p>
            <p className="text-white/80 mt-1 text-base md:text-lg">
              الصف: {student.grade}
            </p>
            <div className="flex items-center justify-center md:justify-start text-white/90 mt-3">
              <span className="text-sm md:text-base">{student.phone}</span>
              {/* قمنا بتغيير 'mr-2' إلى 'ml-2' ليتناسب مع RTL */}
              <Phone className="ml-2" size={16} />
            </div>
          </div>
          
          {/* رمز الاستجابة السريعة */}
          <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-lg">
            <img
              src={student.qrCode}
              alt="رمز الاستجابة السريعة للحضور"
              className="w-28 h-28"
            />
          </div>
        </div>
      </div>
      
      {/* ## قسم الدورات المسجلة ## */}
      <div className="max-w-6xl mx-auto my-0 lg:my-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">الدورات المسجلة</h2>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
              <BookOpen className="w-5 h-5" />
              <span>{enrolledClasses.length} دورة</span>
            </div>
          </div>

           <div className="space-y-4">
             {enrolledClasses.map((course) => (
               <div key={course.id} className="border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow duration-300 bg-white">
                 <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                   {/* Course Info */}
                   <div className="flex-1">
                     <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 rtl:sm:space-x-reverse mb-3 gap-2">
                       <h3 className="text-lg md:text-xl font-semibold text-gray-900 text-center sm:text-right">{course.title}</h3>
                       <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit mx-auto sm:mx-0 ${getStatusColor(course.status)}`}>
                         {getStatusText(course.status)}
                       </span>
                     </div>
                     <p className="text-gray-600 mb-3 text-sm md:text-base text-center sm:text-right">{course.instructor}</p>
                     
                     {/* Course Stats */}
                     <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 rtl:gap-4 text-sm text-gray-500">
                       <div className="flex items-center space-x-1 rtl:space-x-reverse">
                         <Star className="w-4 h-4 text-yellow-400" />
                         <span>{course.rating}</span>
                       </div>
                       <div className="flex items-center space-x-1 rtl:space-x-reverse">
                         <Users className="w-4 h-4" />
                         <span>{course.students} طالب</span>
                       </div>
                       <div className="flex items-center space-x-1 rtl:space-x-reverse">
                         <BookOpen className="w-4 h-4" />
                         <span>{course.totalLessons} درس</span>
                       </div>
                     </div>
                   </div>

                   {/* Next Class Info */}
                   <div className="text-center sm:text-right">
                     <div className="flex items-center justify-center sm:justify-start space-x-2 rtl:space-x-reverse text-sm text-gray-600 mb-2">
                       <Calendar className="w-4 h-4 text-gray-400" />
                       <span>
                         {course.nextClass ? `الدرس التالي: ${formatDate(course.nextClass)}` : 'تم إكمال الدورة'}
                       </span>
                     </div>
                     <div className="text-xs text-gray-500">
                       {course.completedLessons} من {course.totalLessons} درس مكتمل
                     </div>
                   </div>
                 </div>
               </div>
             ))}
           </div>

          {/* Empty State (if no courses) */}
          {enrolledClasses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد دورات مسجلة</h3>
              <p className="text-gray-500 mb-6">ابدأ رحلتك التعليمية بتسجيل أول دورة</p>
              <button className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300">
                تصفح الدورات
              </button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default StudentProfilePage;
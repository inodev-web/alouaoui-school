import React, { useEffect, useMemo, useState } from 'react';
import AuthService from '../../services/api/auth.service';
import api from '../../services/api/axios.config';
// استخدام أيقونات من مكتبة lucide-react
import { Phone, Camera, BookOpen, Calendar, Info } from 'lucide-react';

// --- المكون الرئيسي لصفحة تعريف الطالب ---
const StudentProfilePage = () => {
  // --- Récupérer l'utilisateur connecté depuis le service d'auth ---
  const storedUser = AuthService.getCurrentUser() || null;
  const [currentUser, setCurrentUser] = useState(storedUser || null);
  const [loading, setLoading] = useState(false);
  const [subs, setSubs] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);

  useEffect(() => {
    // If we don't have a filled user in localStorage, try to fetch the profile
    const shouldFetch = !storedUser || !storedUser.firstname || !storedUser.lastname || !storedUser.qr_token;
    if (shouldFetch) {
      setLoading(true);
      AuthService.getProfile()
        .then((profile) => {
          if (profile) setCurrentUser(profile);
        })
        .catch((e) => {
          // keep storedUser or show placeholders
          console.warn('Failed to load profile for ProfilePage:', e);
        })
        .finally(() => setLoading(false));
    }
  }, []);
  const student = useMemo(() => {
    const u = currentUser || {};
    return {
      // Concaténer firstname/lastname si disponibles, sinon utiliser name ou téléphone
      name: `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.name || `طالب ${u.id || ''}`,
      id: u.id ? `S-${String(u.id).toString().slice(0,6).padStart(6, '0')}` : 'S-000000',
      phone: u.phone || '+213 000 000 000',
      grade: u.year_of_study || 'غير محدد',
      gradeLevel: 'student',
      profilePic: u.picture || u.profilePic || null,
      // Generate QR from the user's public UUID if available
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${u.uuid ? `${u.uuid}` : (u.id ? `StudentID-${u.id}` : 'unknown')}`,
      idShort: u.uuid ? `S-${String(u.uuid).slice(0,8)}` : (u.id ? `S-${String(u.id).toString().slice(0,6).padStart(6, '0')}` : 'S-000000'),
      birth_date: u.birth_date || '',
      address: u.address || '',
      school_name: u.school_name || '',
      free_subscriber: u.free_subscriber || false,
      branch: u.branch || null,
    };
  }, [currentUser]);

  useEffect(() => {
    // fetch active subscriptions when user is ready
    if (!currentUser?.uuid) {
      console.debug('⏳ Skipping subscriptions fetch - no user UUID yet');
      return;
    }
    
    const token = localStorage.getItem('token');
    const deviceUuid = localStorage.getItem('device_uuid');
    
    if (!token) {
      console.warn('⚠️ No token available for subscriptions fetch');
      return;
    }
    
    if (!deviceUuid) {
      console.warn('⚠️ No device UUID available for subscriptions fetch');
      return;
    }
    
    console.debug('🚀 Fetching subscriptions for user:', currentUser.uuid);
    
    // Debug: vérifier le token et device UUID
    console.debug('🔑 Token:', token ? token.substring(0, 20) + '...' : 'NONE');
    console.debug('📱 Device UUID:', deviceUuid || 'NONE');
    
    setSubsLoading(true);
    api.get('/subscriptions/active')
      .then((res) => {
        const list = res?.data?.data?.subscriptions || [];
        console.debug('✅ Subscriptions loaded:', list.length);
        setSubs(list);
      })
      .catch((e) => {
        console.warn('❌ Failed to load active subscriptions:', e.response?.status, e.response?.data);
      })
      .finally(() => setSubsLoading(false));
  }, [currentUser?.uuid]);

  const daysToExpire = (sub) => {
    return typeof sub.days_remaining === 'number' ? sub.days_remaining : 0;
  };

  const cardStyle = (sub) => {
    const days = daysToExpire(sub);
    if (days <= 3) return 'border-yellow-400 bg-yellow-50';
    if (sub.is_alouaoui) return 'border-amber-500 bg-amber-50';
    return 'border-green-400 bg-green-50';
  };

  return (
    <div dir="rtl" className="min-h-screen font-sans mt-16 lg:mt-20">
      {loading && (
        <div className="max-w-6xl mx-auto p-6 text-center text-gray-600">جارٍ تحميل بيانات الملف الشخصي ...</div>
      )}
      
      {/* ## قسم الترويسة والملف الشخصي ## */}
      <div className="bg-gradient-to-br from-red-400 to-pink-500 text-white p-8 md:p-12 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center text-center md:text-right gap-8">
          
          {/* الصورة الشخصية */}
          <div className="relative group flex-shrink-0">
            {student.profilePic ? (
              <img
                src={student.profilePic}
                alt="الصورة الشخصية"
                className="w-40 h-40 rounded-full object-cover border-4 border-white/50 shadow-xl"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-white/30 border-4 border-white/50 shadow-xl flex items-center justify-center text-white text-3xl">
                {student.name?.charAt(0) || 'طالب'}
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <Camera size={36} />
              <span className="text-sm mt-1">تغيير الصورة</span>
            </div>
          </div>
          
          {/* معلومات الطالب */}
          <div className="flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold">{student.name}</h1>
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
      
          {/* ## قسم معلومات الطالب ## */}
          <div className="max-w-6xl mx-auto my-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4 text-gray-700">
                <Info className="w-5 h-5" />
                <h2 className="text-xl font-semibold">معلومات الطالب</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-800 text-sm">
                <div><span className="text-gray-500">الاسم:</span> {student.name}</div>
                <div><span className="text-gray-500">الهاتف:</span> {student.phone}</div>
                <div><span className="text-gray-500">السنة الدراسية:</span> {student.grade}</div>
                <div><span className="text-gray-500">الفرع الدراسي:</span> {student.branch?.name || '—'}</div>
                <div><span className="text-gray-500">المدرسة:</span> {student.school_name || '—'}</div>
                <div><span className="text-gray-500">تاريخ الميلاد:</span> {student.birth_date || '—'}</div>
                <div><span className="text-gray-500">العنوان:</span> {student.address || '—'}</div>
              </div>
            </div>
          </div>

          {/* ## قسم الاشتراكات النشطة ## */}
      <div className="max-w-6xl mx-auto my-0 lg:my-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">الاشتراكات النشطة</h2>
                <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
                  <BookOpen className="w-5 h-5" />
                  <span>{subs.length} اشتراك</span>
                </div>
          </div>
              {subsLoading && (
                <div className="text-center text-gray-500">جارٍ تحميل الاشتراكات...</div>
              )}
              <div className="space-y-4">
                {!subsLoading && subs.map((sub) => (
                  <div key={sub.id} className={`border rounded-lg p-4 md:p-6 hover:shadow-md transition-shadow duration-300 ${cardStyle(sub)}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg md:text-xl font-semibold text-gray-900 text-center sm:text-right">{sub.teacher_name || 'أستاذ'}</h3>
                        <div className="text-gray-700 text-sm mt-2 text-center sm:text-right">
                          <span>تاريخ الانتهاء: </span>
                          <span className="font-medium">{new Date(sub.ends_at).toLocaleDateString('ar-DZ')}</span>
                          <span className="mx-2">•</span>
                          <span>متبقي: {daysToExpire(sub)} يوم</span>
                        </div>
                        {daysToExpire(sub) <= 3 && (
                          <div className="text-xs text-yellow-700 mt-2">سينتهي اشتراكك قريبًا، يرجى التجديد لتجنب انقطاع الوصول.</div>
                        )}
                        {daysToExpire(sub) > 3 && sub.is_alouaoui && (
                          <div className="text-xs text-amber-700 mt-2">يمكنك الوصول إلى كل المحتوى الإلكتروني بدون قيود</div>
                        )}
                      </div>
                      <div className="text-center sm:text-right">
                        <div className="flex items-center justify-center sm:justify-start space-x-2 rtl:space-x-reverse text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>
                            {sub.is_monthly ? 'اشتراك شهري' : 'بطاقة حصة'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

          {/* Empty State (if no courses) */}
          {!subsLoading && subs.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد اشتراكات نشطة</h3>
              <p className="text-gray-500 mb-6">قم بالاشتراك للوصول إلى المحتوى</p>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default StudentProfilePage;
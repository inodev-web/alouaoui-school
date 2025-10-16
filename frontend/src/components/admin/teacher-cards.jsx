import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  BookOpen,
  Star,
  Phone,
  Calendar,
} from "lucide-react";
import { teachersService } from "@/services/teachersService";

// Cache simple en mémoire (session) pour éviter les requêtes répétées count
const studentsCountCache = {};

export function TeacherCards() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshingCounts, setRefreshingCounts] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadTeachers();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await teachersService.getTeachers();
      const list = response.data || [];

      // Charger les counts en utilisant cache
      const enriched = await Promise.all(
        list.map(async (t) => {
          let count = studentsCountCache[t.uuid];
          if (typeof count === "undefined") {
            try {
              const cRes = await teachersService.getTeacherStudentsCount(
                t.uuid,
              );
              count = cRes.count || 0;
              studentsCountCache[t.uuid] = count;
            } catch {
              count = 0;
            }
          }
          return { ...t, studentsCount: count };
        }),
      );

      if (mountedRef.current) setTeachers(enriched);
    } catch (e) {
      console.error("Erreur chargement profs:", e);
      if (mountedRef.current) setError("تعذر تحميل قائمة الأساتذة");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const refreshCounts = async () => {
    setRefreshingCounts(true);
    try {
      const updated = await Promise.all(
        teachers.map(async (t) => {
          try {
            const cRes = await teachersService.getTeacherStudentsCount(t.uuid);
            const newCount = cRes.count || 0;
            studentsCountCache[t.uuid] = newCount;
            return { ...t, studentsCount: newCount };
          } catch {
            return t;
          }
        }),
      );
      if (mountedRef.current) setTeachers(updated);
    } finally {
      if (mountedRef.current) setRefreshingCounts(false);
    }
  };

  const getAvatar = (teacher) => {
    if (teacher.picture) return teacher.picture;
    const initials = (teacher.name || "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .substring(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=6366f1&color=fff&size=128`;
  };

  if (loading) {
    return (
      <div className="py-10 text-center" dir="rtl">
        <div className="mx-auto h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">جاري تحميل الأساتذة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center" dir="rtl">
        <p className="text-red-600 mb-4">{error}</p>
        <Button
          onClick={loadTeachers}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">بطاقات الأساتذة</h2>
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="text-sm px-3 py-1">
            المجموع: {teachers.length}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={refreshCounts}
            disabled={refreshingCounts}
          >
            {refreshingCounts ? "تحديث..." : "تحديث عدد الطلاب"}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((t) => (
          <Card
            key={t.uuid}
            className="shadow-md border-0 bg-gradient-to-br from-white via-indigo-50 to-blue-50 hover:shadow-lg transition"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={getAvatar(t)}
                    alt={t.name}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-300"
                    onError={(e) => {
                      e.target.src = getAvatar(t);
                    }}
                  />
                  <div>
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      {t.name}
                      {t.is_online_publisher && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                      )}
                    </CardTitle>
                    {t.module && (
                      <p className="text-sm text-indigo-700 font-medium flex items-center gap-1">
                        <BookOpen className="w-4 h-4" /> {t.module}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Années */}
              {t.years_labels && (
                <div className="bg-white/70 rounded-lg p-2 border border-indigo-100 text-sm">
                  <span className="font-medium text-gray-700">السنوات: </span>
                  <span className="text-gray-600">{t.years_labels}</span>
                </div>
              )}

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-blue-100">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">الطلاب النشطين</p>
                    <p className="text-sm font-bold text-gray-800">
                      {t.studentsCount ?? 0}
                    </p>
                  </div>
                </div>
                {t.percent_school && (
                  <div className="bg-white rounded-lg p-3 flex items-center gap-2 border border-green-100">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-500">نسبة المدرسة</p>
                      <p className="text-sm font-bold text-gray-800">
                        {t.percent_school}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {(t.price_subscription || t.price_session) && (
                <div className="space-y-1 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm font-medium text-gray-700">الأسعار:</p>
                  {t.price_subscription && (
                    <p className="text-xs text-gray-700">
                      الإشتراك الشهري:{" "}
                      <span className="font-bold text-green-700">
                        {t.price_subscription} دج
                      </span>
                    </p>
                  )}
                  {t.price_session && (
                    <p className="text-xs text-gray-700">
                      سعر الحصة:{" "}
                      <span className="font-bold text-indigo-700">
                        {t.price_session} دج
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Téléphone & Date */}
              <div className="flex flex-col gap-2 text-xs text-gray-600">
                {t.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-indigo-500" />
                    <span>الهاتف: {t.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span>
                    تاريخ الإضافة:{" "}
                    {new Date(t.created_at).toLocaleDateString("ar-DZ")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teachers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">لا يوجد أساتذة مسجلون حالياً</p>
        </div>
      )}
    </div>
  );
}

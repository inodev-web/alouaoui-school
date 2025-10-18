import React, { useEffect, useMemo, useState } from "react";
import AuthService from "../../services/api/auth.service";
import branchesService from "../../services/api/branches.service";
import api from "../../services/api/axios.config";
// استخدام أيقونات من مكتبة lucide-react
import { Phone, Camera, BookOpen, Calendar, Info } from "lucide-react";

const YEAR_LABELS = {
  "1AM": "السنة الأولى متوسط",
  "2AM": "السنة الثانية متوسط",
  "3AM": "السنة الثالثة متوسط",
  "4AM": "السنة الرابعة متوسط",
  "1AS": "السنة الأولى ثانوي",
  "2AS": "السنة الثانية ثانوي",
  "3AS": "السنة الثالثة ثانوي",
};

const formatBirthDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar-DZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

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
    const shouldFetch =
      !storedUser ||
      !storedUser.firstname ||
      !storedUser.lastname ||
      !storedUser.qr_token ||
      !storedUser.birth_date ||
      !storedUser.year_of_study ||
      typeof storedUser.branch === "undefined";
    if (shouldFetch) {
      setLoading(true);
      AuthService.getProfile()
        .then((profile) => {
          if (profile) setCurrentUser(profile);
        })
        .catch((e) => {
          // keep storedUser or show placeholders
          console.warn("Failed to load profile for ProfilePage:", e);
        })
        .finally(() => setLoading(false));
    }

    // Listen for profile updates (when profile is updated from settings page)
    const handleProfileUpdate = (event) => {
      const updatedUser = event.detail || AuthService.getCurrentUser();
      if (updatedUser) {
        console.log("Profile updated, refreshing...", updatedUser);
        setCurrentUser(updatedUser);
      }
    };

    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
  }, []);
  const student = useMemo(() => {
    const u = currentUser || {};
    const branch = u.branch || null;
    return {
      // Concaténer firstname/lastname si disponibles, sinon utiliser name ou téléphone
      name:
        `${u.firstname || ""} ${u.lastname || ""}`.trim() ||
        u.name ||
        `طالب ${u.id || ""}`,
      id: u.id
        ? `S-${String(u.id).toString().slice(0, 6).padStart(6, "0")}`
        : "S-000000",
      phone: u.phone || "+213 000 000 000",
      grade: YEAR_LABELS[u.year_of_study] || u.year_of_study || "غير محدد",
      rawGrade: u.year_of_study || "",
      gradeLevel: "student",
      profilePic: u.picture || u.profilePic || null,
      // Generate QR from the user's public UUID if available
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${u.uuid ? `${u.uuid}` : u.id ? `StudentID-${u.id}` : "unknown"}`,
      idShort: u.uuid
        ? `S-${String(u.uuid).slice(0, 8)}`
        : u.id
          ? `S-${String(u.id).toString().slice(0, 6).padStart(6, "0")}`
          : "S-000000",
      birth_date: u.birth_date || "",
      birthDateFormatted: formatBirthDate(u.birth_date),
      address: u.address || "",
      school_name: u.school_name || "",
      free_subscriber: u.free_subscriber || false,
      branch,
      branchName: branch?.name || "—",
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.branch_id || currentUser?.branch) {
      return;
    }

    let isCancelled = false;

    const loadBranch = async () => {
      try {
        const response = await branchesService.getBranch(currentUser.branch_id);
        const branchData = response?.data ?? null;
        if (branchData && !isCancelled) {
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const updated = { ...prev, branch: branchData };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (error) {
        console.warn("Failed to load branch for student profile:", error);
      }
    };

    loadBranch();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.branch_id, currentUser?.branch]);

  useEffect(() => {
    // fetch active subscriptions when user is ready
    if (!currentUser?.uuid) {
      console.debug("⏳ Skipping subscriptions fetch - no user UUID yet");
      return;
    }

    const token = localStorage.getItem("token");
    const deviceUuid = localStorage.getItem("device_uuid");

    if (!token) {
      console.warn("⚠️ No token available for subscriptions fetch");
      return;
    }

    if (!deviceUuid) {
      console.warn("⚠️ No device UUID available for subscriptions fetch");
      return;
    }

    console.debug("🚀 Fetching subscriptions for user:", currentUser.uuid);

    // Debug: vérifier le token et device UUID
    console.debug("🔑 Token:", token ? token.substring(0, 20) + "..." : "NONE");
    console.debug("📱 Device UUID:", deviceUuid || "NONE");

    setSubsLoading(true);
    api
      .get("/subscriptions/active")
      .then((res) => {
        const list = res?.data?.data?.subscriptions || [];
        console.debug("✅ Subscriptions loaded:", list.length);
        setSubs(list);
      })
      .catch((e) => {
        console.warn(
          "❌ Failed to load active subscriptions:",
          e.response?.status,
          e.response?.data,
        );
      })
      .finally(() => setSubsLoading(false));
  }, [currentUser?.uuid]);

  const daysToExpire = (sub) => {
    return typeof sub.days_remaining === "number" ? sub.days_remaining : 0;
  };

  const cardStyle = (sub) => {
    const days = daysToExpire(sub);
    if (days <= 3) return "border-yellow-400 bg-yellow-50";
    if (sub.is_alouaoui) return "border-amber-500 bg-amber-50";
    return "border-green-400 bg-green-50";
  };

  return (
    <div dir="rtl" className="min-h-screen font-sans mt-16 lg:mt-20">
      {loading && (
        <div className="max-w-6xl mx-auto p-6 text-center text-gray-600">
          جارٍ تحميل بيانات الملف الشخصي ...
        </div>
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
                {student.name?.charAt(0) || "طالب"}
              </div>
            )}
            {/* <div className="absolute inset-0 bg-black bg-opacity-60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
              <Camera size={36} />
              <span className="text-sm mt-1">تغيير الصورة</span>
            </div> */}
          </div>

          {/* معلومات الطالب */}
          <div className="flex-grow">
            <h1 className="text-3xl md:text-4xl font-bold">{student.name}</h1>
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
            <div>
              <span className="text-gray-500">الاسم:</span> {student.name}
            </div>
            <div>
              <span className="text-gray-500">الهاتف:</span> {student.phone}
            </div>
            <div>
              <span className="text-gray-500">السنة الدراسية:</span>{" "}
              {student.grade}
            </div>
            <div>
              <span className="text-gray-500">الفرع الدراسي:</span>{" "}
              {student.branchName}
            </div>
            <div>
              <span className="text-gray-500">المدرسة:</span>{" "}
              {student.school_name || "—"}
            </div>
            <div>
              <span className="text-gray-500">تاريخ الميلاد:</span>{" "}
              {student.birthDateFormatted}
            </div>
            <div>
              <span className="text-gray-500">العنوان:</span>{" "}
              {student.address || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* ## قسم الاشتراكات النشطة ## */}
      <div className="max-w-6xl mx-auto my-0 lg:my-10">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              الاشتراكات النشطة
            </h2>
            <div className="flex items-center space-x-2 rtl:space-x-reverse text-sm text-gray-500">
              <BookOpen className="w-5 h-5" />
              <span>{subs.length} اشتراك</span>
            </div>
          </div>
          {subsLoading && (
            <div className="text-center text-gray-500">
              جارٍ تحميل الاشتراكات...
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {!subsLoading &&
              subs.map((sub) => (
                <div
                  key={sub.id}
                  className={`
                      relative overflow-hidden rounded-2xl p-6 shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                      ${
                        sub.is_alouaoui
                          ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-white"
                          : "bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white"
                      }
                    `}
                >
                  {/* Effet brillant pour carte Alouaoui */}
                  {sub.is_alouaoui && (
                    <>
                      <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
                      <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-300 rounded-full opacity-20 blur-3xl"></div>
                      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-300 rounded-full opacity-20 blur-3xl"></div>
                    </>
                  )}

                  {/* Décoration carte (cercles) */}
                  <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white opacity-10"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white opacity-10"></div>

                  {/* Contenu de la carte */}
                  <div className="relative z-10">
                    {/* En-tête avec badge et photo du prof */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${
                            sub.is_alouaoui
                              ? "bg-yellow-900 bg-opacity-30 text-yellow-100"
                              : "bg-white bg-opacity-20 text-white"
                          }
                        `}
                      >
                        {sub.is_alouaoui
                          ? "🌟 اشتراك شهري"
                          : sub.is_monthly
                            ? "📅 اشتراك شهري"
                            : "🎫 بطاقة حصة"}
                      </div>

                      {/* Photo du professeur */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 opacity-70" />
                        {sub.teacher_picture ? (
                          <img
                            src={sub.teacher_picture}
                            alt={sub.teacher_name}
                            className="w-16 h-16 rounded-full border-2 border-white border-opacity-50 object-cover shadow-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full border-2 border-white border-opacity-50 bg-white bg-opacity-20 flex items-center justify-center text-xl font-bold shadow-lg">
                            {sub.teacher_name?.charAt(0) || "أ"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nom du professeur */}
                    <h3
                      className={`
                        text-2xl font-bold mb-4
                        ${sub.is_alouaoui ? "text-yellow-50" : "text-white"}
                      `}
                    >
                      {sub.teacher_name || "أستاذ"}
                    </h3>

                    {/* Informations de validité */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">تاريخ البداية</span>
                        <span className="font-semibold">
                          {new Date(sub.starts_at).toLocaleDateString("ar-DZ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="opacity-80">تاريخ الانتهاء</span>
                        <span className="font-semibold">
                          {new Date(sub.ends_at).toLocaleDateString("ar-DZ")}
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1 opacity-80">
                        <span>المدة المتبقية</span>
                        <span className="font-semibold">
                          {daysToExpire(sub)} يوم
                        </span>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            daysToExpire(sub) <= 3
                              ? "bg-red-400"
                              : sub.is_alouaoui
                                ? "bg-yellow-200"
                                : "bg-white"
                          }`}
                          style={{
                            width: `${Math.min(100, (daysToExpire(sub) / 30) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Messages d'alerte */}
                    {daysToExpire(sub) <= 3 && (
                      <div className="bg-red-500 bg-opacity-20 border border-red-300 border-opacity-30 rounded-lg px-3 py-2 text-xs mt-3">
                        ⚠️ سينتهي اشتراكك قريبًا، يرجى التجديد
                      </div>
                    )}
                    {daysToExpire(sub) > 3 && sub.is_alouaoui && (
                      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-300 border-opacity-30 rounded-lg px-3 py-2 text-xs mt-3">
                        ✨ وصول كامل لجميع المحتويات
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>

          {/* Empty State (if no courses) */}
          {!subsLoading && subs.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لا توجد اشتراكات نشطة
              </h3>
              <p className="text-gray-500 mb-6">
                قم بالاشتراك للوصول إلى المحتوى
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;

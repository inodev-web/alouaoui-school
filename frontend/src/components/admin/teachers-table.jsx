import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditTeacherModal } from "@/components/admin/edit-teacher-modal"
import { Edit, Trash2, Phone, Users, BookOpen, DollarSign, Star, Calendar, RefreshCcw } from "lucide-react"
import { teachersService } from "@/services/teachersService"

export function TeachersTable() {
  const [teachers, setTeachers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 12, total: 0 })
  const [filtersMeta, setFiltersMeta] = useState({ modules: [], years: [] })
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [refreshingCounts, setRefreshingCounts] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const mountedRef = useRef(true)
  const CACHE_KEY = 'teacher_students_counts'
  const studentsCountCache = useRef({})

  // Load cache from sessionStorage once
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY)
      if (raw) studentsCountCache.current = JSON.parse(raw)
    } catch {}
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadTeachers()
    return () => { mountedRef.current = false }
  }, [page, search, yearFilter, moduleFilter])

  const persistCache = () => {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(studentsCountCache.current)) } catch {}
  }

  const loadTeachers = async () => {
    try {
      setLoading(true)
      const response = await teachersService.getTeachers({
        page,
        per_page: meta.per_page || 12,
        search,
        year: yearFilter,
        module: moduleFilter,
      })
      const list = response.data || []
      setMeta(response.meta || meta)
      setFiltersMeta(response.filters || filtersMeta)
      const enriched = await Promise.all(list.map(async (t) => {
        let count = studentsCountCache.current[t.uuid]
        if (typeof count === 'undefined') {
          try {
            const cRes = await teachersService.getTeacherStudentsCount(t.uuid)
            count = cRes.count || 0
            studentsCountCache.current[t.uuid] = count
            persistCache()
          } catch { count = 0 }
        }
        return { ...t, studentsCount: count }
      }))
      if (mountedRef.current) setTeachers(enriched)
    } catch (err) {
      if (mountedRef.current) setError('خطأ في تحميل بيانات الأساتذة')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const refreshCounts = async () => {
    setRefreshingCounts(true)
    try {
      const updated = await Promise.all(teachers.map(async (t) => {
        try {
          const cRes = await teachersService.getTeacherStudentsCount(t.uuid)
          const newCount = cRes.count || 0
          studentsCountCache.current[t.uuid] = newCount
          persistCache()
          return { ...t, studentsCount: newCount }
        } catch { return t }
      }))
      if (mountedRef.current) setTeachers(updated)
    } finally {
      if (mountedRef.current) setRefreshingCounts(false)
    }
  }

  const handleDeleteTeacher = async (uuid) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الأستاذ؟')) return
    setDeleting(uuid)
    try {
      await teachersService.deleteTeacher(uuid)
      await loadTeachers()
    } catch {
      alert('تعذر الحذف')
    } finally {
      setDeleting(null)
    }
  }

  const getDefaultAvatar = (name) => {
    const initials = (name || '?').split(' ').map(n => n[0]).join('').substring(0, 2)
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4f46e5&color=ffffff&size=128`
  }

  const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-lg shadow p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 bg-gray-100 rounded" />
        <div className="h-14 bg-gray-100 rounded" />
      </div>
      <div className="h-10 bg-gray-100 rounded" />
    </div>
  )

  // Main render

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadTeachers} className="bg-blue-600 hover:bg-blue-700">
          إعادة المحاولة
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">قائمة الأساتذة</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">إجمالي: {meta.total}</Badge>
            <Button size="sm" variant="outline" onClick={refreshCounts} disabled={refreshingCounts}>
              <RefreshCcw className="w-4 h-4 ml-1" /> {refreshingCounts ? 'تحديث...' : 'تحديث الأعداد'}
            </Button>
          </div>
        </div>
        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4 bg-white/70 p-4 rounded-lg border border-indigo-100">
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-gray-600">بحث (الاسم / الهاتف / المادة)</label>
            <Input
              placeholder="اكتب هنا للبحث..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="text-right"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">السنة الدراسية</label>
            <Select value={yearFilter || 'ALL'} onValueChange={(val) => { setYearFilter(val === 'ALL' ? '' : val); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                {filtersMeta.years?.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">المادة</label>
            <Select value={moduleFilter || 'ALL'} onValueChange={(val) => { setModuleFilter(val === 'ALL' ? '' : val); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="الكل" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل</SelectItem>
                {filtersMeta.modules?.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {/* Pagination top */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div>صفحة {meta.current_page} من {meta.last_page}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        {!loading && teachers.map((teacher) => (
          <Card key={teacher.uuid} className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md bg-gradient-to-br from-white via-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="relative">
                    <img
                      src={teacher.picture || getDefaultAvatar(teacher.name)}
                      alt={teacher.name}
                      className="w-16 h-16 rounded-full object-cover border-3 border-blue-200 shadow-md"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar(teacher.name)
                      }}
                    />
                    {teacher.is_online_publisher && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Star className="w-3 h-3 text-white fill-current" />
                      </div>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1">
                      {teacher.name}
                    </CardTitle>
                    <Badge 
                      variant={teacher.is_online_publisher ? "default" : "secondary"}
                      className={teacher.is_online_publisher ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : ""}
                    >
                      {teacher.is_online_publisher ? "ناشر إلكتروني" : "أستاذ حضوري"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedTeacher(teacher)} className="flex items-center gap-1">
                    <Edit className="w-4 h-4" /> تعديل
                  </Button>
                  <Button variant="outline" size="sm" disabled={deleting === teacher.uuid} onClick={() => handleDeleteTeacher(teacher.uuid)} className="flex items-center gap-1 text-red-600">
                    <Trash2 className="w-4 h-4" /> حذف
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Informations de contact */}
              <div className="space-y-2">
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-blue-500" />
                    <span>{teacher.phone}</span>
                  </div>
                )}
                
                {teacher.module && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span>{teacher.module_label || teacher.module}</span>
                  </div>
                )}
              </div>

              {/* Années d'enseignement */}
              {teacher.years_labels && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">السنوات الدراسية:</p>
                  <p className="text-sm text-gray-600 bg-gray-100 rounded-lg px-3 py-2">
                    {teacher.years_labels}
                  </p>
                </div>
              )}

              {/* Statistiques */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500">الطلاب</p>
                      <p className="font-bold text-gray-900">{teacher.studentsCount}</p>
                    </div>
                  </div>
                </div>

                {teacher.percent_school && (
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500">نسبة المدرسة</p>
                        <p className="font-bold text-gray-900">{teacher.percent_school}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prix */}
              {(teacher.price_subscription || teacher.price_session) && (
                <div className="space-y-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-sm font-medium text-gray-700">الأسعار:</p>
                  <div className="space-y-1">
                    {teacher.price_subscription && (
                      <p className="text-sm text-gray-600">
                        الاشتراك: <span className="font-bold text-green-600">{teacher.price_subscription} دج</span>
                      </p>
                    )}
                    {teacher.price_session && (
                      <p className="text-sm text-gray-600">
                        الحصة: <span className="font-bold text-blue-600">{teacher.price_session} دج</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Date de création */}
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-200">
                <Calendar className="h-3 w-3" />
                <span>انضم في: {new Date(teacher.created_at).toLocaleDateString('ar-DZ')}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && teachers.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أساتذة مسجلين</h3>
          <p className="text-gray-500">ابدأ بإضافة أساتذة جدد إلى النظام</p>
        </div>
      )}

      {/* Pagination bottom */}
      {!loading && teachers.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-600 pt-4 border-t">
          <div>إجمالي: {meta.total} أستاذ</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      )}

      {selectedTeacher && (
        <EditTeacherModal
          teacher={selectedTeacher}
          open={!!selectedTeacher}
          onOpenChange={(open) => !open && setSelectedTeacher(null)}
          onTeacherUpdated={() => { setSelectedTeacher(null); loadTeachers(); }}
        />
      )}
    </div>
  )
}

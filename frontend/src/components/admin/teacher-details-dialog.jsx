import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  DollarSign,
  Calendar,
  Phone,
  BookOpen,
  TrendingUp,
  TrendingDown,
  X,
  RefreshCw,
} from "lucide-react";
import { teachersService } from "@/services/teachersService";

export function TeacherDetailsDialog({ teacher, open, onOpenChange }) {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && teacher) {
      loadRevenueData();
    }
  }, [open, teacher]);

  const loadRevenueData = async () => {
    if (!teacher) return;

    setLoading(true);
    setError(null);
    try {
      const response = await teachersService.getTeacherRevenueDetails(
        teacher.uuid,
      );
      console.log("Revenue data response:", response);
      // The API returns the data directly, not wrapped in a 'data' property
      setRevenueData(response);
    } catch (err) {
      console.error("Error loading revenue data:", err);
      setError("تعذر تحميل بيانات الإيرادات");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("ar-DZ").format(amount) + " دج";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-DZ");
  };

  if (!teacher) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              تفاصيل الأستاذ
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Teacher Basic Info */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {teacher.name}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {teacher.module && (
                    <Badge variant="outline" className="text-blue-600">
                      {teacher.module_label || teacher.module}
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {teacher.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-500" />
                      <span>{teacher.phone}</span>
                    </div>
                  )}
                  {teacher.years_labels && (
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span>{teacher.years_labels}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Revenue Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  الإيرادات - الشهر الماضي
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadRevenueData}
                  disabled={loading}
                  className="flex items-center gap-1"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  تحديث
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
                  <p className="text-gray-600">
                    جاري تحميل بيانات الإيرادات...
                  </p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">{error}</p>
                  <Button onClick={loadRevenueData} variant="outline">
                    إعادة المحاولة
                  </Button>
                </div>
              )}

              {!loading && !error && !revenueData && (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    لا توجد بيانات إيرادات متاحة
                  </p>
                  <Button onClick={loadRevenueData} variant="outline">
                    إعادة المحاولة
                  </Button>
                </div>
              )}

              {revenueData && !loading && (
                <div className="space-y-6">
                  {/* Revenue Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-800">
                          إجمالي الإيرادات
                        </h4>
                      </div>
                      <p className="text-2xl font-bold text-green-700">
                        {formatCurrency(revenueData.revenue.total)}
                      </p>
                      <p className="text-sm text-green-600">
                        {revenueData.period.days} يوم
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-800">
                          حصة المدرسة
                        </h4>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(revenueData.revenue.school_cut)}
                      </p>
                      <p className="text-sm text-blue-600">
                        {revenueData.revenue.school_percentage}%
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-purple-800">
                          حصة الأستاذ
                        </h4>
                      </div>
                      <p className="text-2xl font-bold text-purple-700">
                        {formatCurrency(revenueData.revenue.teacher_cut)}
                      </p>
                      <p className="text-sm text-purple-600">
                        {100 - revenueData.revenue.school_percentage}%
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Subscription Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        إحصائيات الاشتراكات
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            الاشتراكات النشطة
                          </span>
                          <span className="font-semibold text-green-700">
                            {revenueData.subscriptions.active || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            إجمالي الاشتراكات (الشهر الماضي)
                          </span>
                          <span className="font-semibold text-gray-900">
                            {revenueData.subscriptions.total}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            اشتراكات شهرية
                          </span>
                          <span className="font-semibold text-blue-700">
                            {revenueData.subscriptions.monthly}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-purple-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            اشتراكات حصص
                          </span>
                          <span className="font-semibold text-purple-700">
                            {revenueData.subscriptions.sessions}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        إحصائيات الطلاب
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            الطلاب النشطين
                          </span>
                          <span className="font-semibold text-gray-900">
                            {revenueData.students.active_count}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded-lg">
                          <span className="text-sm text-gray-600">
                            جدد هذا الشهر
                          </span>
                          <span className="font-semibold text-orange-700">
                            {revenueData.students.new_this_month}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing Information */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                      معلومات التسعير
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h5 className="font-medium text-amber-800 mb-1">
                          سعر الاشتراك الشهري
                        </h5>
                        <p className="text-xl font-bold text-amber-700">
                          {formatCurrency(
                            revenueData.pricing.subscription_price,
                          )}
                        </p>
                      </div>
                      <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                        <h5 className="font-medium text-cyan-800 mb-1">
                          سعر الحصة الواحدة
                        </h5>
                        <p className="text-xl font-bold text-cyan-700">
                          {formatCurrency(revenueData.pricing.session_price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Period Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">
                      فترة التقرير
                    </h4>
                    <p className="text-sm text-gray-600">
                      من {formatDate(revenueData.period.from)} إلى{" "}
                      {formatDate(revenueData.period.to)}
                      <span className="mx-2">•</span>
                      {revenueData.period.days} يوم
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

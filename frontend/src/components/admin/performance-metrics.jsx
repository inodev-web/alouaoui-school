import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardCards } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import dashboardService from "@/services/dashboardService";
import { TrendingUp, Users, Clock, DollarSign } from "lucide-react";

const PerformanceMetrics = ({ period = "daily", date = null }) => {
  const { data, loading, error } = useDashboardCards(period, date);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <TrendingUp className="h-5 w-5 text-green-500" />
            مؤشرات الأداء
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.cards) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-right">
            <TrendingUp className="h-5 w-5 text-green-500" />
            مؤشرات الأداء
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            خطأ في تحميل مؤشرات الأداء
          </div>
        </CardContent>
      </Card>
    );
  }

  const cards = data.cards;

  // Calculate derived metrics
  const totalStudents = cards.total_students?.value || 0;
  const totalTeachers = cards.total_teachers?.value || 0;
  const totalSessions = cards.total_sessions?.value || 0;
  const totalRevenue = cards.total_revenue?.value || 0;

  const avgStudentsPerTeacher =
    totalTeachers > 0 ? (totalStudents / totalTeachers).toFixed(1) : 0;
  const avgRevenuePerStudent =
    totalStudents > 0 ? totalRevenue / totalStudents : 0;
  const avgRevenuePerTeacher =
    totalTeachers > 0 ? totalRevenue / totalTeachers : 0;
  const avgSessionsPerTeacher =
    totalTeachers > 0 ? (totalSessions / totalTeachers).toFixed(1) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <TrendingUp className="h-5 w-5 text-green-500" />
          مؤشرات الأداء
        </CardTitle>
        <p className="text-sm text-muted-foreground text-right">
          مؤشرات الأداء الرئيسية
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">
            متوسط الطلاب لكل معلم
          </span>
          <span className="text-sm text-muted-foreground">
            {avgStudentsPerTeacher}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">
            متوسط الإيرادات لكل طالب
          </span>
          <span className="text-sm text-green-500">
            {dashboardService.formatCurrency(avgRevenuePerStudent)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">
            متوسط الإيرادات لكل معلم
          </span>
          <span className="text-sm text-green-500">
            {dashboardService.formatCurrency(avgRevenuePerTeacher)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">
            متوسط الجلسات لكل معلم
          </span>
          <span className="text-sm text-muted-foreground">
            {avgSessionsPerTeacher}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">
            إجمالي الإيرادات
          </span>
          <span className="text-sm text-green-500 font-bold">
            {dashboardService.formatCurrency(totalRevenue)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-right">إجمالي الجلسات</span>
          <span className="text-sm text-blue-500 font-bold">
            {dashboardService.formatNumber(totalSessions)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;

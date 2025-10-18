import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopTeachers } from "@/hooks/useDashboardData";
import dashboardService from "@/services/dashboardService";
import { GraduationCap, Users, DollarSign, Clock } from "lucide-react";

const TopTeachersReal = ({ limit = 5, period = "daily", date = null }) => {
  const { data, loading, error } = useTopTeachers(limit, period, date);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-4">
            خطأ في تحميل بيانات المعلمين
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">أفضل المعلمين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            لا توجد بيانات متاحة
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">أفضل المعلمين</CardTitle>
        <p className="text-sm text-muted-foreground text-right">
          حسب الإيرادات في الفترة المحددة
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((teacher, index) => (
            <div
              key={teacher.teacher_uuid}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-right truncate">
                    {teacher.teacher_name}
                  </p>
                  <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Users className="h-3 w-3" />
                      <span>{teacher.active_students}</span>
                    </div>
                    <div className="flex items-center space-x-1 space-x-reverse">
                      <Clock className="h-3 w-3" />
                      <span>{teacher.completed_sessions}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-green-600">
                  {dashboardService.formatCurrency(teacher.total_revenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {teacher.completion_rate}% إنجاز
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopTeachersReal;

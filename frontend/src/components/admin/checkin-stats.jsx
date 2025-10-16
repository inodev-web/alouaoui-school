import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCheckinStats } from "@/hooks/useCheckinStats";

export function CheckInStats() {
  const { data, loading, error } = useCheckinStats();

  // Loading state - same pattern as dashboard cards
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state - show unavailable message instead of default values
  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2" dir="rtl">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              مسح اليوم
            </CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-gray-400">—</div>
            <p className="text-xs text-red-400 text-right">
              <span className="text-red-500">غير متاح</span> - فشل تحميل
              البيانات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              الطلاب الحاضرون
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-gray-400">—</div>
            <p className="text-xs text-red-400 text-right">
              <span className="text-red-500">غير متاح</span> - فشل تحميل
              البيانات
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Normal state with data
  return (
    <div className="grid gap-4 md:grid-cols-2" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right">
            مسح اليوم
          </CardTitle>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right">{data.todayScans}</div>
          <p className="text-xs text-muted-foreground text-right">
            <span className="text-blue-500">تسجيل حضور</span> تم عبر QR اليوم
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-right">
            الطلاب الحاضرون
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-right">
            {data.studentsCheckedIn}
          </div>
          <p className="text-xs text-muted-foreground text-right">
            <span className="text-green-500">طالب</span> فريد مسجل اليوم
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

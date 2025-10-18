import { useState, useCallback, useEffect } from "react";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { SessionsTable } from "@/components/admin/sessions-table";
import { AddSessionModal } from "@/components/admin/add-session-modal";
import { SessionsFilters } from "@/components/admin/sessions-filters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sessionService } from "@/services/api/session.service";

export default function AdminSessionsPage() {
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  });
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayProgrammed: 0,
    todayCancelled: 0,
    todayCompleted: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const fetchStats = async (currentFilters) => {
    try {
      setLoadingStats(true);
      const response = await sessionService.getSessions(currentFilters);

      if (response && response.data) {
        const sessions = response.data;

        setStats({
          todayTotal: sessions.length,
          todayProgrammed: sessions.filter(
            (s) => s.status_raw === null || s.status_raw === undefined,
          ).length,
          todayCancelled: sessions.filter((s) => s.status_raw === "cancelled")
            .length,
          todayCompleted: sessions.filter((s) => s.status_raw === "completed")
            .length,
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats(filters);
  }, [filters]);

  const handleSessionAdded = () => {
    fetchStats(filters);
    window.location.reload();
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            الجلسات
          </h1>
          <p className="text-muted-foreground text-right">
            جدولة وإدارة جلسات التدريس
          </p>
        </div>
        <AddSessionModal onSessionAdded={handleSessionAdded} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <SessionsFilters onFiltersChange={handleFiltersChange} />
        </CardContent>
      </Card>

      {/* Session Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              الجلسات
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">
              {loadingStats ? "..." : stats.todayTotal}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              إجمالي الجلسات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              بانتظار التأكيد
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-orange-600">
              {loadingStats ? "..." : stats.todayProgrammed}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              لم يتم تأكيدها بعد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              مكتملة
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-green-600">
              {loadingStats ? "..." : stats.todayCompleted}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              تمت بنجاح
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">
              ملغاة
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right text-red-600">
              {loadingStats ? "..." : stats.todayCancelled}
            </div>
            <p className="text-xs text-muted-foreground text-right">
              تم إلغاؤها
            </p>
          </CardContent>
        </Card>
      </div>

      {/* All Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">جميع الجلسات</CardTitle>
          <CardDescription className="text-right">
            عرض وإدارة جميع الجلسات المجدولة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsTable filters={filters} />
        </CardContent>
      </Card>
    </div>
  );
}

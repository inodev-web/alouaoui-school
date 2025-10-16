import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevenueTimeSeries } from "@/hooks/useDashboardData";
import dashboardService from "@/services/dashboardService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const RevenueChart = ({
  period = "daily",
  days = 30,
  startDate = null,
  endDate = null,
}) => {
  const { data, loading, error } = useRevenueTimeSeries(
    period,
    days,
    startDate,
    endDate,
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">نظرة عامة على الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">نظرة عامة على الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            خطأ في تحميل بيانات الإيرادات
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-right">نظرة عامة على الإيرادات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            لا توجد بيانات متاحة
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("ar-DZ", {
      month: "short",
      day: "numeric",
    }),
    revenue: item.revenue,
    profit: item.profit,
    schoolCut: item.school_cut,
    teacherCut: item.teacher_cut,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-right">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {dashboardService.formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">نظرة عامة على الإيرادات</CardTitle>
        <p className="text-sm text-muted-foreground text-right">
          اتجاهات الإيرادات والأرباح خلال الفترة المحددة
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  dashboardService.formatCurrency(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#8884d8"
                strokeWidth={2}
                name="الإيرادات"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#82ca9d"
                strokeWidth={2}
                name="الأرباح"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="schoolCut"
                stroke="#ffc658"
                strokeWidth={2}
                name="حصة المدرسة"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="teacherCut"
                stroke="#ff7300"
                strokeWidth={2}
                name="حصة المعلم"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueChart;

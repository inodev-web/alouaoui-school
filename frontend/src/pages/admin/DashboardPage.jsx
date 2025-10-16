import { Button } from "@/components/ui/button";
import DashboardCards from "@/components/admin/dashboard-cards";
import TopTeachersReal from "@/components/admin/top-teachers-real";
import RevenueChart from "@/components/admin/revenue-chart";
import { useState } from "react";

export default function AdminDashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");

  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 text-right">
            لوحة التحكم
          </h1>
          <p className="text-gray-600 text-right">
            مرحباً بك مرة أخرى! إليك ما يحدث في منصتك التعليمية.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-pink-300 rounded-md bg-white text-sm focus:border-red-400 focus:ring-2 focus:ring-red-200"
          >
            <option value="daily">يومي</option>
            <option value="weekly">أسبوعي</option>
            <option value="monthly">شهري</option>
          </select>
          <Button>تحميل التقرير</Button>
        </div>
      </div>

      {/* KPI Cards - Now using real data */}
      <DashboardCards period={selectedPeriod} />

      {/* Charts Row - Now using real data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-6">
        <div className="col-span-4">
          <RevenueChart
            period={selectedPeriod}
            days={
              selectedPeriod === "daily"
                ? 30
                : selectedPeriod === "weekly"
                  ? 12
                  : 12
            }
          />
        </div>

        <div className="col-span-3">
          <TopTeachersReal limit={5} period={selectedPeriod} />
        </div>
      </div>
    </div>
  );
}

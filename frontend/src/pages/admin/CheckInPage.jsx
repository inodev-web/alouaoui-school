import { StudentIdInput } from "@/components/admin/student-id-input";
import { CheckInStats } from "@/components/admin/checkin-stats";

export default function AdminCheckInPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            نظام تسجيل الحضور
          </h1>
          <p className="text-muted-foreground text-right">
            مسح معرف الطالب وإدارة حضور الطلاب
          </p>
        </div>
      </div>

      {/* Check-in Stats */}
      <div className="mb-6">
        <CheckInStats />
      </div>

      {/* Student ID Input Section */}
      <div className="max-w-2xl mx-auto">
        <StudentIdInput />
      </div>
    </div>
  );
}

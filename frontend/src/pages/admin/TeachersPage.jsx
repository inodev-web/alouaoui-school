import { TeachersTable } from "@/components/admin/teachers-table";
import { AddTeacherModal } from "@/components/admin/add-teacher-modal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminTeachersPage() {
  return (
    <div dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground text-right">
            المعلمين
          </h1>
          <p className="text-muted-foreground text-right">
            إدارة حسابات المعلمين ومتابعة أدائهم
          </p>
        </div>
        <AddTeacherModal />
      </div>

      {/* Teachers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">دليل المعلمين</CardTitle>
          <CardDescription className="text-right">
            إدارة ملفات المعلمين والوحدات وتقاسم الإيرادات
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeachersTable />
        </CardContent>
      </Card>
    </div>
  );
}

import ComingSoon from "@/components/common/ComingSoon";
import { Calendar, Users, Trophy, Sparkles } from "lucide-react";

const AdminEventsPage = () => {
  const features = [
    {
      icon: Calendar,
      title: "إدارة الفعاليات",
      description: "إنشاء وتنظيم الفعاليات المدرسية بسهولة",
    },
    {
      icon: Users,
      title: "تتبع الحضور",
      description: "مراقبة حضور الطلاب في الفعاليات",
    },
    {
      icon: Trophy,
      title: "المسابقات",
      description: "تنظيم المسابقات والجوائز",
    },
  ];

  return (
    <ComingSoon
      title="الفعاليات"
      description="نظام شامل لإدارة الفعاليات والمسابقات المدرسية"
      icon={Sparkles}
      accentColor="from-orange-500 to-red-600"
      features={features}
    />
  );
};

export default AdminEventsPage;

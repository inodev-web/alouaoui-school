import ComingSoon from "@/components/common/ComingSoon";
import { BookOpen, Video, FileText } from "lucide-react";

const StudentChaptersPage = () => {
  const features = [
    {
      icon: BookOpen,
      title: "دروس شاملة",
      description: "محتوى تعليمي منظم ومفصل لجميع المواد",
    },
    {
      icon: Video,
      title: "فيديوهات تعليمية",
      description: "شروحات مرئية واضحة لجميع الدروس",
    },
    {
      icon: FileText,
      title: "تمارين وحلول",
      description: "تطبيقات عملية مع حلول مفصلة",
    },
  ];

  return (
    <ComingSoon
      title="الدروس"
      description="قريبا... مكتبة شاملة من الدروس والشروحات التعليمية"
      icon={BookOpen}
      accentColor="from-blue-500 to-cyan-600"
      features={features}
    />
  );
};

export default StudentChaptersPage;

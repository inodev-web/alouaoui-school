import ComingSoon from "@/components/common/ComingSoon";
import { Video, Wifi, Users, MessageCircle } from "lucide-react";

const StudentLivesPage = () => {
  const features = [
    {
      icon: Video,
      title: "بث مباشر",
      description: "شاهد الدروس مباشرة مع الأساتذة",
    },
    {
      icon: MessageCircle,
      title: "تفاعل مباشر",
      description: "اطرح أسئلتك واحصل على إجابات فورية",
    },
    {
      icon: Users,
      title: "جلسات جماعية",
      description: "تعلم مع زملائك في بيئة تفاعلية",
    },
  ];

  return (
    <ComingSoon
      title="البث المباشر"
      description="قريباً... دروس مباشرة تفاعلية مع أفضل الأساتذة"
      icon={Wifi}
      accentColor="from-red-500 to-pink-600"
      features={features}
    />
  );
};

export default StudentLivesPage;

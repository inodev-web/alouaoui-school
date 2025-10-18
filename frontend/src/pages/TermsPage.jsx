import { Link } from "react-router-dom";
import { FileText, ArrowRight, Shield, Users, Bell, Lock } from "lucide-react";

const TermsPage = () => {
  const sections = [
    {
      icon: Shield,
      title: "قبول الشروط",
      content:
        "باستخدامك لهذه المنصة التعليمية، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي من هذه الشروط، يرجى عدم استخدام المنصة.",
    },
    {
      icon: Users,
      title: "حقوق والتزامات المستخدم",
      content:
        "يحق لك الوصول إلى المحتوى التعليمي المتاح وفقاً لاشتراكك. يجب عليك الحفاظ على سرية معلومات حسابك وعدم مشاركتها مع الآخرين. أنت مسؤول عن جميع الأنشطة التي تتم من خلال حسابك.",
    },
    {
      icon: FileText,
      title: "الملكية الفكرية",
      content:
        "جميع المحتويات التعليمية والمواد المتاحة على هذه المنصة (الدروس، الفيديوهات، الملفات، إلخ) هي ملكية حصرية للأستاذ إسماعيل علواوي ومحمية بموجب قوانين حقوق النشر. يُمنع نسخ أو توزيع أو بيع أي محتوى دون إذن كتابي صريح.",
    },
    {
      icon: Bell,
      title: "الاشتراكات والدفع",
      content:
        "الاشتراكات الشهرية غير قابلة للاسترداد. يتم تجديد الاشتراك تلقائياً ما لم تقم بإلغائه قبل انتهاء الفترة الحالية. الأسعار قابلة للتغيير مع إشعار مسبق.",
    },
    {
      icon: Lock,
      title: "الخصوصية والأمان",
      content:
        "نحن ملتزمون بحماية خصوصيتك. يتم تخزين بياناتك بشكل آمن واستخدامها فقط لتحسين تجربتك التعليمية. لمزيد من التفاصيل، يرجى الاطلاع على سياسة الخصوصية.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6">
            <FileText className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            الشروط والأحكام
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصتنا التعليمية
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div
                key={index}
                className="border-b border-gray-200 last:border-0 pb-8 last:pb-0"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3 text-right">
                      {section.title}
                    </h2>
                    <p className="text-gray-700 leading-relaxed text-right text-lg">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Terms */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-right">
              معلومات إضافية
            </h3>
            <ul className="space-y-3 text-gray-700 text-right">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>نحتفظ بالحق في تعديل هذه الشروط في أي وقت</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  استمرارك في استخدام المنصة يعني قبولك للشروط المحدثة
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>
                  لأي استفسارات، يرجى التواصل معنا عبر البريد الإلكتروني أو
                  الهاتف
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/privacy"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span>سياسة الخصوصية</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span>العودة للتسجيل</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Last Updated */}
        <div className="text-center mt-8 text-gray-500">
          <p>
            آخر تحديث:{" "}
            {new Date().toLocaleDateString("ar-DZ", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;

import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  Lock,
  Eye,
  Database,
  UserCheck,
  AlertCircle,
} from "lucide-react";

const PrivacyPage = () => {
  const sections = [
    {
      icon: Database,
      title: "المعلومات التي نجمعها",
      content:
        "نقوم بجمع المعلومات الأساسية مثل: الاسم، رقم الهاتف، السنة الدراسية، والشعبة. هذه المعلومات ضرورية لتوفير الخدمة التعليمية وتخصيص المحتوى المناسب لك.",
    },
    {
      icon: Lock,
      title: "كيف نحمي معلوماتك",
      content:
        "نستخدم تقنيات التشفير المتقدمة لحماية بياناتك. يتم تخزين جميع المعلومات الحساسة مثل كلمات المرور بشكل مشفر. نستخدم اتصالات آمنة (HTTPS) لحماية البيانات أثناء النقل.",
    },
    {
      icon: Eye,
      title: "استخدام المعلومات",
      content:
        "نستخدم معلوماتك لـ: توفير وتحسين خدماتنا التعليمية، إرسال إشعارات حول الدروس والجلسات، تتبع تقدمك الأكاديمي، والتواصل معك بخصوص حسابك.",
    },
    {
      icon: UserCheck,
      title: "مشاركة المعلومات",
      content:
        "نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك معلومات محدودة مع مقدمي الخدمات الموثوقين الذين يساعدوننا في تشغيل المنصة (مثل خدمات الاستضافة) وذلك تحت اتفاقيات سرية صارمة.",
    },
    {
      icon: AlertCircle,
      title: "حقوقك",
      content:
        "لديك الحق في: الوصول إلى معلوماتك الشخصية، طلب تصحيح أي معلومات غير صحيحة، طلب حذف حسابك وبياناتك، سحب موافقتك على معالجة بياناتك في أي وقت.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block p-4 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-6">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            سياسة الخصوصية
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            نحن ملتزمون بحماية خصوصيتك وأمان بياناتك الشخصية
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
                  <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
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

          {/* Cookies Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-right">
              ملفات تعريف الارتباط (Cookies)
            </h3>
            <p className="text-gray-700 text-right mb-4">
              نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة. هذه الملفات
              تساعدنا على:
            </p>
            <ul className="space-y-3 text-gray-700 text-right">
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>تذكر تفضيلاتك وإعداداتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>الحفاظ على تسجيل دخولك بشكل آمن</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-500 mt-1">•</span>
                <span>فهم كيفية استخدامك للمنصة لتحسين خدماتنا</span>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4 text-right">
              تواصل معنا
            </h3>
            <p className="text-gray-700 text-right mb-2">
              إذا كان لديك أي أسئلة حول سياسة الخصوصية أو كيفية معالجة بياناتك،
              يرجى التواصل معنا:
            </p>
            <p className="text-gray-700 text-right">
              <strong>البريد الإلكتروني:</strong> privacy@alaoui-school.com
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/terms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <span>الشروط والأحكام</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-all duration-300 shadow-lg hover:shadow-xl"
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

export default PrivacyPage;

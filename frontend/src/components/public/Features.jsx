import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Video,
  BookOpen,
  PenTool,
  Users,
  Play,
  CheckCircle,
} from "lucide-react";

export default function FeaturesSection() {
  const navigate = useNavigate();

  const handleFeatureClick = (targetRoute) => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      // User is logged in, go to target route
      navigate(targetRoute);
    } else {
      // User not logged in, go to register
      navigate("/register");
    }
  };

  const features = [
    {
      title: "الدروس",
      desc: "شروحات مبسطة ومفصلة لمختلف دروس الفيزياء",
      icon: BookOpen,
      gradient: "from-blue-200 to-indigo-300",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      hoverGradient: "hover:from-blue-200 hover:to-indigo-300",
      courses: "48",
      tag: "Course Videos",
    },
    {
      title: "اللايف",
      desc: "الدروس مباشرة مع الأستاذ لطرح الأسئلة والتفاعل",
      icon: Video,
      gradient: "from-red-200 to-pink-300",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      hoverGradient: "hover:from-red-200 hover:to-pink-300",
      courses: "Live",
      tag: "Live Streams",
    },
    {
      title: "التمارين",
      desc: "تمارين محلولة وخطوات توضيحية لفهم أفضل واسرع",
      icon: PenTool,
      gradient: "from-green-200 to-emerald-300",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
      hoverGradient: "hover:from-green-200 hover:to-emerald-300",
      courses: "38",
      tag: "Exercises & Solutions",
    },
  ];

  return (
    <section className="bg-gradient-to-r from-pink-500 to-red-400 flex items-center justify-center py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center col-span-2">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
            مميزات المنصة
          </h2>
          <p className="text-white/90 text-sm md:text-lg max-w-2xl mx-auto px-4 mb-8">
            مميزات المنصة التي تجعلها المنصة الأفضل لدراسة الفيزياء
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;

            return (
              <div
                key={index}
                className={`
                  group relative overflow-hidden rounded-3xl border-2 ${feature.borderColor} 
                  bg-gradient-to-br ${feature.gradient} ${feature.hoverGradient}
                  shadow-lg hover:shadow-2xl transform hover:-translate-y-2 
                  transition-all duration-300 ease-in-out cursor-pointer
                  backdrop-blur-sm
                `}
              >
                {/* Card Content */}
                <div className="p-8 relative z-10">
                  <div className="flex justify-between items-center">
                    {/* Icon */}
                    <div
                      className={`w-16 h-16 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent
                        className={`w-8 h-8 ${feature.iconColor}`}
                      />
                    </div>
                    {/* Tag */}
                    <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1 pb-3 pl-5 text-2xl font-bold text-gray-800 mb-3 text-right">
                      {feature.title}
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r mt-1 ${feature.iconColor.replace("text-", "from-")} to-opacity-60`}
                      ></div>
                    </div>
                  </div>
                  {/* Description */}
                  <p className="text-gray-600 text-base leading-relaxed mb-6 text-right">
                    {feature.desc}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() =>
                      handleFeatureClick(
                        feature.title === "الدروس"
                          ? "/student/chapters"
                          : feature.title === "اللايف"
                            ? "/student/lives"
                            : "/student/chapters",
                      )
                    }
                    className={`
                      w-full py-3 px-6 rounded-2xl font-semibold text-sm
                      bg-white/80 backdrop-blur-sm border-2 ${feature.borderColor}
                      ${feature.iconColor} hover:bg-white hover:scale-105
                      transform transition-all duration-300 ease-in-out
                      shadow-lg hover:shadow-xl group-hover:shadow-2xl
                      flex items-center justify-center gap-2
                      cursor-pointer
                    `}
                  >
                    <Play className="w-4 h-4" />
                    اكتشف المزيد
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16 group-hover:scale-125 transition-transform duration-700"></div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

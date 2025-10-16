import React from "react";

const About = () => {
  return (
    <div id="about" className="relative overflow-hidden">
      {/* Gradient Backgrounds */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-red-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-100"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-red-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-100"></div>

      <div className="lg:h-[100vh] w-full grid grid-cols-1 md:grid-cols-2 grid-rows-[auto_1fr] gap-8 md:gap-16 items-center justify-center p-4 sm:p-8 md:p-16 pt-8">
        {/* Title */}
        <div className="text-center col-span-1 md:col-span-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            نبذة عني
          </h2>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            مختصر من رحلتي في التدريس والتعليم
          </p>
        </div>

        {/* Content Sections */}
        <div className="h-full flex flex-col order-2 lg:order-1 items-end space-y-8 pr-2 sm:pr-4 md:pr-8 overflow-visible md:overflow-y-auto scrollbar-none">
          {/* Background Section */}
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-end gap-2 mb-4 translate-x-[0.8em]">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                الخلفية الأكاديمية
              </h2>
              <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-4"></div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl py-4 shadow-lg border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-center justify-end space-x-3 gap-2 space-x-reverse">
                  <span className="text-gray-700 font-medium">
                    شهادة تدريس متقدمة - المدرسة العليا للتعليم
                  </span>
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Teaching Journey Section */}
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-end gap-2 mb-4 translate-x-[0.8em]">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                رحلة التدريس
              </h2>
              <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-teal-600 rounded-full mr-4"></div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200">
              <div className="space-y-4">
                <div className="flex items-start justify-end space-x-3 space-x-reverse">
                  <p className="text-gray-700 leading-relaxed text-right mr-1">
                    بدأت رحلتي في التدريس منذ أكثر من 12 عاماً عندما اكتشفت شغفي
                    في تبسيط المفاهيم العلمية المعقدة وجعلها في متناول الطلاب
                  </p>
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-3"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mission Section */}
          <div className="w-full max-w-lg">
            <div className="flex items-center justify-end gap-2 mb-4 translate-x-[0.8em]">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                رسالتي
              </h2>
              <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full mr-4"></div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 leading-relaxed text-base sm:text-lg font-medium">
                  "هدفي هو إلهام الجيل القادم من العلماء والمفكرين، وتزويدهم
                  بالمعرفة والمهارات التي يحتاجونها لبناء مستقبل أفضل. أؤمن بأن
                  التعليم هو أقوى أداة لتغيير العالم."
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:space-x-4 sm:space-x-reverse">
                  <div className="text-sm text-gray-600 font-medium">
                    +2000 طالب
                  </div>
                  <div className="hidden sm:block text-sm text-gray-600 font-medium">
                    •
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    12+ سنة خبرة
                  </div>
                  <div className="hidden sm:block text-sm text-gray-600 font-medium">
                    •
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    95% نجاح
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="relative flex justify-center order-1 lg:order-2 md:justify-end mt-8 md:mt-0">
          <img
            src="https://i.pinimg.com/1200x/25/71/33/2571333419c8836330bc204f486157ba.jpg"
            alt="About"
            className="absolute w-40 h-40 sm:w-60 sm:h-60 md:w-96 md:h-96 rounded-full z-10 border-4 border-white translate-x-[-15%] translate-y-[-15%] object-cover"
          />
          <div
            className="relative w-40 h-40 sm:w-60 sm:h-60 md:w-96 md:h-96 
              bg-gradient-to-r from-red-400 to-pink-500 rounded-full mix-blend-multiply z-0"
          ></div>
        </div>
      </div>
    </div>
  );
};

export default About;

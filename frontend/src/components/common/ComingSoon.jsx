import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, Bell, Rocket } from "lucide-react";

const ComingSoon = ({
  title = "قريباً",
  description = "نعمل على شيء رائع",
  icon: Icon = Rocket,
  accentColor = "from-blue-500 to-purple-600",
  features = [],
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 30,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Set target date to 1 month from now
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 1);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-[calc(100vh-5rem)] lg:min-h-[calc(100vh-6rem)] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-60 md:w-80 h-60 md:h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-60 md:w-80 h-60 md:h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 md:w-80 h-60 md:h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-4xl w-full py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-block mb-4 md:mb-6"
          >
            <div
              className={`relative p-4 md:p-6 lg:p-8 bg-gradient-to-br ${accentColor} rounded-2xl md:rounded-3xl shadow-2xl`}
            >
              <Icon className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 text-white" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute -top-2 -right-2 md:-top-4 md:-right-4"
              >
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-yellow-300" />
              </motion.div>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-3 md:mb-4 lg:mb-6"
          >
            {title}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 mb-6 md:mb-8 lg:mb-12 max-w-2xl mx-auto px-4"
          >
            {description}
          </motion.p>

          {/* Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-4 gap-2 md:gap-4 lg:gap-6 xl:gap-8 mb-6 md:mb-8 lg:mb-12 max-w-2xl mx-auto px-2"
          >
            {Object.entries(timeLeft).map(([unit, value], index) => (
              <div key={unit} className="relative">
                <motion.div
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: 360 }}
                  transition={{ delay: index * 0.1, duration: 1 }}
                  className={`bg-gradient-to-br ${accentColor} rounded-lg md:rounded-xl lg:rounded-2xl p-3 md:p-4 lg:p-6 shadow-2xl backdrop-blur-sm border border-white/10`}
                >
                  <div className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1 md:mb-2">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] md:text-xs lg:text-sm text-gray-200 uppercase tracking-wider">
                    {unit === "days"
                      ? "أيام"
                      : unit === "hours"
                        ? "ساعات"
                        : unit === "minutes"
                          ? "دقائق"
                          : "ثواني"}
                  </div>
                </motion.div>
              </div>
            ))}
          </motion.div>

          {/* Features */}
          {features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8 lg:mb-12 px-2"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="bg-white/5 backdrop-blur-md rounded-lg md:rounded-xl lg:rounded-2xl p-4 md:p-5 lg:p-6 border border-white/10 hover:bg-white/10 transition-all duration-300"
                >
                  <feature.icon className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-purple-400 mb-2 md:mb-3 mx-auto" />
                  <h3 className="text-white font-semibold mb-1 md:mb-2 text-sm md:text-base">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-xs md:text-sm">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Notification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 md:px-6 py-2 md:py-3 border border-white/20"
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" />
            <span className="text-white text-xs md:text-sm">
              سنخبرك عند الإطلاق
            </span>
          </motion.div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ComingSoon;

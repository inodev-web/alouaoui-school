import React from 'react'
import { Link } from 'react-router-dom'
import CountUp from "react-countup";

const HeroSection = () => {
  return (
    <div className=" bg-gradient-to-br from-pink-50 via-white to-blue-50 p-4 sm:p-6 mt-16 lg:mt-20">
      <div className="max-w-6xl mx-auto">
        {/* Main Content Section */}
        <div className="">
          <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-0 p-4 sm:p-8 pb-0 lg:pt-2">
            {/* Left Side - Teacher Image and Badge */}
            <div className="relative order-2 lg:order-1 flex justify-center lg:justify-start animate-[slideInLeft_0.8s_ease-out]">
              {/* Teacher Image Container */}
              <div className="z-10 relative inline-block aspect-[510/714] ml-0 sm:ml-8 md:ml-16">
                <img 
                  src=".\public\smailimage.png" 
                  alt="Physics Teacher"
                  className="relative w-48 sm:w-60 md:w-72 object-cover z-[20]"
                />
              {/* Apple - Positioned absolutely above teacher on all screen sizes */}
              <img src=".\public\apple.png" alt="apple" 
              className="absolute animate-appleFallMobile sm:animate-appleFall w-10 sm:w-12 md:w-16 
                        top-0 translate-y-[-1.5em] lg:translate-y-[-2.5em] translate-x-[50%] right-[45%] rotate-[60deg]" />
              
              {/* Einstein Formula */}
              <div className="absolute flex text-2xl sm:text-3xl md:text-4xl font-light text-red-500 gap-1
              translate-x-[50%] translate-y-[50%] top-[40%] left-[67%]">
                <span className="animate-bounceFormula text-black">E</span>
                <span className="animate-bounceFormula [animation-delay:0.1s]">=</span>
                <span className="animate-bounceFormula [animation-delay:0.2s]">mc²</span>
              </div>
              
              {/* Science Icons - Responsive positioning */}
              <img src=".\public\flask.png" alt="flask" 
              className="absolute w-8 sm:w-10 md:w-12 z-10
              top-[40%] left-[-30%]" />
              
              <img src=".\public\power.png" alt="power" 
              className="absolute w-8 sm:w-10 md:w-14 z-10
                         top-[25%] left-[-5%]" />
              
              <img src=".\public\atom.png" alt="atom" 
              className="absolute w-8 sm:w-10 md:w-14 z-10
                         top-[80%] left-[-7%]" />
              
              <img src=".\public\enzyme.png" alt="enzyme" 
              className="absolute w-8 sm:w-10 md:w-14 z-10
                         top-[60%] left-[-15%]" />
              
              <img src=".\public\graph.png" alt="graph" 
              className="absolute w-10 sm:w-12 md:w-16 z-10
                         top-[80%] right-[-20%]" />
              
              </div>
              
              {/* Background Blur Effect */}
              <div className="z-0 absolute translate-x-[-2.5em] lg:translate-x-[0]
                            bottom-[-2em] sm:bottom-[-3em] md:bottom-[-4em]
                            w-48 h-48 sm:w-60 sm:h-60 md:w-80 md:h-80 
                            bg-gradient-to-r from-red-400 to-pink-500 rounded-full 
                            mix-blend-multiply filter blur-lg opacity-90">
              </div>
            </div>
            
            {/* Right Side - Text Content (Arabic) */}
            <div className="text-right order-1 lg:order-2 z-[50] animate-[slideInRight_0.8s_ease-out]">
              <div className="relative px-4 sm:px-0">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
                  تعلم الفيزياء باحترافية   
                  <br />
                  معي
                </h1>
                
                <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                  انضم إليّ في رحلة شيقة لفهم أساسيات وقوانين الفيزياء بأسلوب مبسط
                  <br className="hidden sm:block" />
                  حتى تتفوق في الاختبارات و الدراسة
                </p>
                
                {/* Contact Button */}
                <Link 
                  to="/student/chapters"
                  className="bg-gradient-to-r from-red-400 to-pink-500 text-white 
                           px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium 
                           text-base sm:text-lg hover:from-red-500 hover:to-pink-600 
                           transition-all duration-300 shadow-lg hover:shadow-xl 
                           transform hover:scale-105 w-full sm:w-auto inline-block text-center"
                >
                   اكتشف الدروس
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics Section */}
        <div className="relative bg-gradient-to-r from-red-400 via-pink-500 to-red-500 rounded-2xl sm:rounded-3xl 
                        p-4 sm:p-6 md:p-6 shadow-2xl z-10 top-0 lg:top-[-3em] 
                        mx-2 sm:mx-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center text-white">
          
          <div className="space-y-1 sm:space-y-2">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <CountUp end={12} duration={3} />
            </div>
            <div className="text-sm sm:text-base lg:text-lg opacity-90">سنوات من الخبرة</div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <CountUp end={95} duration={3} suffix="%" />
            </div>
            <div className="text-sm sm:text-base lg:text-lg opacity-90">معدل النجاح</div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <CountUp end={2000} duration={3} suffix="+" />
            </div>
            <div className="text-sm sm:text-base lg:text-lg opacity-90">طلاب سعداء</div>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              <CountUp end={3000} duration={3} suffix="+" />
            </div>
            <div className="text-sm sm:text-base lg:text-lg opacity-90">امتحانات اجتازها</div>
          </div>
        </div>
      </div>
      </div>
      

    </div>
  )
}

export default HeroSection
import React, { useState } from 'react';
import { Menu, X, BookOpen} from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* CTA Button Desktop */}
          <div className="hidden lg:block">
            <button className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
               سجل الان
            </button>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
            <a href="#home" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">الرئيسية</a>
            <a href="#courses" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">الدروس</a>
            <a href="#about" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">عني</a>
            <a href="#results" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">النتائج</a>
            <a href="#testimonials" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">آراء الطلاب</a>
            <a href="#contact" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">تواصل معي</a>
          </div>
          {/* Logo */}
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-2 rounded-full">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">اسماعيل علواوي</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">التميز في التعليم</p>
            </div>
          </div>
          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-red-500 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="py-4 space-y-4 bg-gray-50 rounded-lg mb-4">
            <a href="#home" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">الرئيسية</a>
            <a href="#courses" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">الدروس</a>
            <a href="#about" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">عني</a>
            <a href="#results" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">النتائج</a>
            <a href="#testimonials" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">آراء الطلاب</a>
            <a href="#contact" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">تواصل معي</a>
            <div className="px-4 pt-2">
              <button className="w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300">
                احجز درسك
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
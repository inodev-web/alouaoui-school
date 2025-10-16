import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, BookOpen, User } from "lucide-react";
import { useSelector } from "react-redux";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const getAccountLink = () => {
    if (!isAuthenticated) {
      return "/login";
    }
    return user?.role === "admin" ? "/admin" : "/student/profile";
  };

  const handleDiscoverCourses = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate("/student/chapters");
  };

  return (
    <nav className=" bg-white shadow-lg fixed w-full top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* CTA Button Desktop */}
          <div className="hidden lg:block">
            <Link
              to={isAuthenticated ? getAccountLink() : "/login"}
              className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block flex items-center gap-2"
            >
              {isAuthenticated ? (
                <>
                  <User className="w-4 h-4" />
                  <span>حسابي</span>
                </>
              ) : (
                "سجل الان"
              )}
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
            <a
              href="#contact"
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              تواصل معي
            </a>
            <a
              href="#results"
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              نتائج و اراء
            </a>
            <a
              href="#about"
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              عني
            </a>
            {/* <a href="#courses" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">الاحداث</a> */}

            <button
              onClick={handleDiscoverCourses}
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              اكتشف الدروس
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-red-500 focus:outline-none"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-2 rounded-full">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                اسماعيل علواوي
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                التميز في التعليم
              </p>
            </div>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 pointer-events-auto" : "max-h-0 opacity-0 pointer-events-none"}`}
        >
          <div className="py-4 space-y-4 bg-gray-50 rounded-lg mb-4">
            {/* <a href="#courses" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">الاحداث</a> */}
            <a
              href="#about"
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              عني
            </a>
            <a
              href="#results"
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              نتائج و اراء
            </a>
            <a
              href="#contact"
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              تواصل معي
            </a>
            <div className="px-4 pt-2">
              <Link
                to={isAuthenticated ? getAccountLink() : "/register"}
                className="block w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 text-center flex items-center justify-center gap-2"
              >
                {isAuthenticated ? (
                  <>
                    <User className="w-4 h-4" />
                    <span>حسابي</span>
                  </>
                ) : (
                  "سجل الان"
                )}
              </Link>
            </div>
            <div className="px-4">
              <button
                onClick={handleDiscoverCourses}
                className="block w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-50 text-center"
              >
                اكتشف الدروس
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

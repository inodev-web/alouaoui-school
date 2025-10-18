import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, BookOpen, LogOut, Home } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout as logoutAction } from "../../../store/slices/authSlice";
import AuthService from "../../../services/api/auth.service";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navRef = useRef(null);

  // Fermer le menu quand la route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false); // Fermer le menu avant de se déconnecter
    try {
      await AuthService.logout();
    } catch {
      console.warn("Logout request failed, clearing local session");
    }
    try {
      dispatch(logoutAction());
    } catch {
      /* noop */
    }
    navigate("/login");
  };

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <nav
      ref={navRef}
      className=" bg-white shadow-lg fixed w-full top-0 z-[100]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* CTA Button Desktop */}
          <div className="hidden lg:block">
            <Link
              to={isAuthenticated ? "/" : "/register"}
              className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block flex items-center gap-2"
            >
              {isAuthenticated ? (
                <>
                  <Home className="w-4 h-4" />
                  <span>الرئيسية</span>
                </>
              ) : (
                "سجل الان"
              )}
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
            <Link
              to="/student/profile"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              حسابي
            </Link>
            <Link
              to="/student/settings"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              الإعدادات
            </Link>
            <Link
              to="/student/lives"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              لايف
            </Link>
            <Link
              to="/student/chapters"
              onClick={handleLinkClick}
              className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              الدروس
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-700 hover:text-red-500 font-medium transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">تسجيل الخروج</span>
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
            <Link
              to="/student/chapters"
              onClick={handleLinkClick}
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              الدروس
            </Link>
            <Link
              to="/student/lives"
              onClick={handleLinkClick}
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              لايف
            </Link>
            <Link
              to="/student/profile"
              onClick={handleLinkClick}
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              حسابي
            </Link>
            <Link
              to="/student/settings"
              onClick={handleLinkClick}
              className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              الإعدادات
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-end gap-2 px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
            <div className="px-4 pt-2">
              <Link
                to={isAuthenticated ? "/" : "/register"}
                onClick={handleLinkClick}
                className="block w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 text-center flex items-center justify-center gap-2"
              >
                {isAuthenticated ? (
                  <>
                    <Home className="w-4 h-4" />
                    <span>الرئيسية</span>
                  </>
                ) : (
                  "سجل الان"
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

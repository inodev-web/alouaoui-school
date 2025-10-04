import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, LogOut } from 'lucide-react';
import AuthService from '../../../services/api/auth.service';
import { useDispatch } from 'react-redux';
import { logout as logoutAction } from '../../../store/slices/authSlice';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isLoggedIn = !!localStorage.getItem('token');

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch {
      // ignore errors from API, proceed to local cleanup
      console.warn('Logout request failed, clearing local session');
    }

    // clear redux state
    try { dispatch(logoutAction()); } catch { /* noop */ }

    // navigate to login
    navigate('/login');
  };

  return (
    <nav className=" bg-white shadow-lg fixed w-full top-0 z-[100]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* CTA Button Desktop */}
          <div className="hidden lg:block">
            <Link to="/register" className="bg-gradient-to-r from-red-400 to-pink-500 text-white px-6 py-2 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 inline-block">
               سجل الان
            </Link>
          </div>
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
            <a href="#contact" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">تواصل معي</a>
            <a href="#results" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">نتائج و اراء</a>
            <a href="#about" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">عني</a>
            <a href="#courses" className="text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">الاحداث</a>

            {isLoggedIn && (
              <button onClick={handleLogout} className="flex items-center space-x-2 rtl:space-x-reverse text-gray-700 hover:text-red-500 font-medium transition-colors duration-200">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">تسجيل الخروج</span>
              </button>
            )}
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
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-2 rounded-full">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">اسماعيل علواوي</h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">التميز في التعليم</p>
            </div>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="py-4 space-y-4 bg-gray-50 rounded-lg mb-4">
            <a href="#courses" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">الاحداث</a>
            <a href="#about" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">عني</a>
            <a href="#results" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">نتائج و اراء</a>
            <a href="#contact" className="block text-right px-4 py-2 text-gray-700 hover:text-red-500 hover:bg-red-50 transition-colors duration-200">تواصل معي</a>
            <div className="px-4 pt-2">
              <Link to="/register" className="block w-full bg-gradient-to-r from-red-400 to-pink-500 text-white py-3 rounded-full font-medium hover:from-red-500 hover:to-pink-600 transition-all duration-300 text-center">
                 سجل الان
              </Link>
            </div>
            {isLoggedIn && (
              <div className="px-4">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-50">
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
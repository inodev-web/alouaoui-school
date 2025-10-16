import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  QrCode,
  CalendarDays,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { logout as logoutAction } from "../../store/slices/authSlice";
import AuthService from "../../services/api/auth.service";
import { useSidebar } from "../../contexts/SidebarContext";

// Utility function for combining class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(" ");
};

const navigation = [
  {
    name: "لوحة التحكم",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "الطلاب",
    href: "/admin/students",
    icon: Users,
  },
  {
    name: "المعلمين",
    href: "/admin/teachers",
    icon: GraduationCap,
  },
  {
    name: "الجلسات",
    href: "/admin/sessions",
    icon: Calendar,
  },
  {
    name: "الفصول",
    href: "/admin/chapters",
    icon: BookOpen,
  },
  {
    name: "تسجيل الحضور",
    href: "/admin/check-in",
    icon: QrCode,
  },
  {
    name: "الأحداث",
    href: "/admin/events",
    icon: CalendarDays,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isOpen, isMobile, toggleSidebar } = useSidebar();

  const handleLogout = async () => {
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

  // Effect to add click outside listener
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Si le sidebar est ouvert et que le clic n'est pas dans le sidebar ou sur le bouton toggle
      if (
        isOpen &&
        !event.target.closest(".sidebar-container") &&
        !event.target.closest(".toggle-button")
      ) {
        toggleSidebar();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, toggleSidebar]);

  return (
    <div className="lg:block">
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="toggle-button fixed top-4 right-4 z-50 p-2 bg-white shadow-lg rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <aside
        className={cn(
          "sidebar-container fixed inset-y-0 right-0 z-50 flex h-full flex-col bg-pink-50 border-r border-pink-200 transition-all duration-300 ease-in-out",
          !isMobile && (isOpen ? "w-64" : "w-16"),
          isMobile && (isOpen ? "w-[80%] sm:w-[300px]" : "translate-x-full"),
        )}
        dir="rtl"
      >
        <div className="flex h-16 items-center justify-between px-3 border-b border-pink-200">
          <button
            onClick={toggleSidebar}
            className="toggle-button p-1 hover:bg-pink-100 rounded-lg transition-colors"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          {isOpen && (
            <h1 className="text-xl font-bold text-gray-800">لوحة الإدارة</h1>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                // onClick={handleItemClick}
                title={item.name}
                className={cn(
                  "flex items-center gap-3 rounded-lg transition-colors",
                  isOpen ? "px-3 py-2 text-right" : "p-2 justify-center",
                  isActive
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "text-gray-700 hover:bg-pink-100 hover:text-gray-900",
                  isMobile && !isOpen && "hidden",
                )}
              >
                <item.icon className="h-5 w-5 min-w-[1.25rem]" />
                {isOpen && (
                  <span className="text-sm font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-pink-200 space-y-2",
            isOpen ? "p-3" : "p-2",
            isMobile && !isOpen && "hidden",
          )}
        >
          <button
            onClick={handleLogout}
            title="تسجيل الخروج"
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors",
              isOpen
                ? "w-full px-3 py-2 text-right"
                : "p-2 w-full justify-center",
              "text-gray-700 hover:bg-pink-100 hover:text-gray-900",
            )}
          >
            <LogOut className="h-5 w-5 min-w-[1.25rem]" />
            {isOpen && (
              <span className="text-sm font-medium">تسجيل الخروج</span>
            )}
          </button>
          {/* <Link
            to="/admin/settings"
            onClick={toggleSidebar}
            title="الإعدادات"
            className={cn(
              "flex items-center gap-3 rounded-lg transition-colors",
              isOpen ? "w-full px-3 py-2 text-right" : "p-2 w-full justify-center",
              "text-gray-700 hover:bg-pink-100 hover:text-gray-900"
            )}
          >
            <Settings className="h-5 w-5 min-w-[1.25rem]" />
            {isOpen && (
              <span className="text-sm font-medium">الإعدادات</span>
            )}
          </Link> */}
        </div>
      </aside>
    </div>
  );
}

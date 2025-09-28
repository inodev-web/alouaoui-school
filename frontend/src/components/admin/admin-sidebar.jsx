import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  QrCode,
  CalendarDays,
  Settings,
} from 'lucide-react';

// Utility function for combining class names
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
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

  return (
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r border-gray-200" dir="rtl">
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900 text-right">
          لوحة الإدارة
        </h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-right",
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <Link
          to="/admin/settings"
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-right"
        >
          <Settings className="h-5 w-5" />
          الإعدادات
        </Link>
      </div>
    </div>
  );
}
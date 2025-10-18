"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

export function AdminHeader() {
  return (
    <header
      className="flex h-16 items-center justify-between border-b border-pink-200 bg-white px-6"
      dir="rtl"
    >
      {/* <div className="flex items-center gap-4 flex-1">
        <div className="relative max-w-md flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="البحث عن الطلاب، المعلمين، الجلسات..."
            className="pr-10 bg-background text-right"
          />
        </div>
      </div> */}

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-pink-100"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -left-1 h-3 w-3 bg-gradient-to-r from-red-400 to-pink-500 rounded-full text-xs flex items-center justify-center text-white">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-pink-100">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" dir="rtl">
            <DropdownMenuLabel>حساب المدير</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
            <DropdownMenuItem>الإعدادات</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>تسجيل الخروج</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

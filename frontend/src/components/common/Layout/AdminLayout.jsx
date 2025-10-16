import React from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "../../../components/admin/admin-sidebar";
import { AdminHeader } from "../../../components/admin/admin-header";
import { SidebarProvider, useSidebar } from "../../../contexts/SidebarContext";

const AdminLayoutContent = () => {
  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="flex h-screen bg-white">
      <div
        className={`
          flex-1 flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out
          ${!isMobile && (isOpen ? "mr-64" : "mr-16")}
        `}
      >
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <Outlet />
        </main>
      </div>

      {/* Sidebar always on the right */}
      <AdminSidebar />
    </div>
  );
};

const AdminLayout = () => {
  return (
    <SidebarProvider>
      <AdminLayoutContent />
    </SidebarProvider>
  );
};

export default AdminLayout;

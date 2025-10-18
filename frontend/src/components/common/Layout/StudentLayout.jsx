import React from "react";
import { Outlet } from "react-router-dom";
import HeaderStudent from "./HeaderStudent";
import Footer from "./Footer";

const StudentLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderStudent />
      <main className="flex-1 bg-gray-50">
        <div className="">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StudentLayout;

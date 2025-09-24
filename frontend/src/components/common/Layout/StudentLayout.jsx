import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const StudentLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
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

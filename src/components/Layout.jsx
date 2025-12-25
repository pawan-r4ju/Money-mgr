import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0 md:h-screen md:overflow-y-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

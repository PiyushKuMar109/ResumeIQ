import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-stone-900 flex">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

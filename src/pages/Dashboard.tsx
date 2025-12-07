
import React from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from 'react-router-dom';
import { SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard: React.FC = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-white flex items-center px-4">
            <SidebarTrigger />
            <h1 className="ml-4 text-lg font-semibold">Memorial Mason Management</h1>
          </header>
          <main className="flex-1 p-6 bg-slate-50">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;

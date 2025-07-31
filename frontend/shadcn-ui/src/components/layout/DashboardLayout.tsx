import React from 'react';
import DashboardNav from './DashboardNav';
import Footer from './Footer';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <DashboardNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default DashboardLayout; 
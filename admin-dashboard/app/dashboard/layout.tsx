'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSidebarStore } from '@/lib/store';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isOpen } = useSidebarStore();

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-100" dir="rtl">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          isOpen ? 'lg:mr-64' : 'lg:mr-20'
        }`}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

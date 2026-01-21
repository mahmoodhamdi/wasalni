'use client';

import { useEffect, useState, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useSidebarStore, useAuthStore } from '@/lib/store';

// Use useLayoutEffect on client, useEffect on server to avoid SSR warnings
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isOpen } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration with layout effect to prevent flash
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Hydrate the auth store
    useAuthStore.persist.rehydrate();

    const storedAuth = localStorage.getItem('wasalni-admin-auth');
    let token = null;
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed?.state?.token;
      } catch {
        // Ignore parse errors
      }
    }
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

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

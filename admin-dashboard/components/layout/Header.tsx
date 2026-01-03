'use client';

import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useSidebarStore, useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const { toggle } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <button
        onClick={toggle}
        className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
      >
        <Menu size={24} />
      </button>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 hover:bg-slate-100 rounded-lg">
          <Bell size={24} />
          <span className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 hover:bg-slate-100 rounded-lg"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              {user?.name ? (
                <span className="text-emerald-600 font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={24} className="text-emerald-600" />
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-900">
                {user?.name || 'مدير النظام'}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email || 'admin@wasalni.com'}
              </p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

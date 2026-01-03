'use client';

import { Menu, Bell, User } from 'lucide-react';
import { useSidebarStore } from '@/lib/store';

export default function Header() {
  const { toggle } = useSidebarStore();

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-emerald-600" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900">مدير النظام</p>
            <p className="text-xs text-slate-500">admin@wasalni.com</p>
          </div>
        </div>
      </div>
    </header>
  );
}

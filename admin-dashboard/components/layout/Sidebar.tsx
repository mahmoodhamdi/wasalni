'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Car,
  MapPin,
  Map,
  Settings,
  LogOut,
  Menu,
  X,
  DollarSign,
  Tag,
  MapPinned,
} from 'lucide-react';
import { useSidebarStore, useAuthStore } from '@/lib/store';

const menuItems = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/dashboard/passengers', label: 'الركاب', icon: Users },
  { href: '/dashboard/drivers', label: 'السائقين', icon: Car },
  { href: '/dashboard/trips', label: 'الرحلات', icon: MapPin },
  { href: '/dashboard/map', label: 'الخريطة الحية', icon: Map },
  { href: '/dashboard/finance', label: 'المالية', icon: DollarSign },
  { href: '/dashboard/promos', label: 'العروض', icon: Tag },
  { href: '/dashboard/zones', label: 'المناطق والأسعار', icon: MapPinned },
  { href: '/dashboard/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();
  const { logout } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 h-full bg-slate-900 text-white z-50 transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0 lg:w-20'
        } overflow-hidden`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
            {isOpen && (
              <span className="text-xl font-bold text-emerald-400">
                وصّلني Admin
              </span>
            )}
            <button
              onClick={toggle}
              className="p-2 hover:bg-slate-800 rounded-lg"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={24} />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-slate-700 p-4">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={24} />
              {isOpen && <span>تسجيل الخروج</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, setLoading, setError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setError(null);
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await api.post('/auth/admin/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { tokens, user } = response.data.data;

        // Verify user is admin
        if (user.role !== 'admin') {
          setLocalError('غير مسموح لك بالدخول إلى لوحة التحكم');
          return;
        }

        setAuth(tokens.accessToken, user);
        router.push('/dashboard');
      } else {
        setLocalError(response.data.message || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const error = err as any;
      if (error.response?.data?.message) {
        setLocalError(error.response.data.message);
      } else if (error.message?.includes('Network Error')) {
        setLocalError('لا يمكن الاتصال بالخادم');
      } else {
        setLocalError('حدث خطأ في تسجيل الدخول');
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
              <span className="text-white text-3xl">🚗</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">وصّلني</h1>
            <p className="text-slate-500">لوحة تحكم المدير</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                dir="ltr"
                placeholder="admin@wasalni.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left pl-12"
                  dir="ltr"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <LogIn size={20} />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500 text-center">
              بيانات تجريبية للدخول:
            </p>
            <p className="text-sm text-slate-700 text-center mt-1" dir="ltr">
              admin@wasalni.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

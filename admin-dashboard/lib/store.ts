import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

// SSR-safe storage
const safeStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
};

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      setAuth: (token, user) => {
        // Set cookie for middleware
        if (typeof document !== 'undefined') {
          document.cookie = `wasalni-admin-token=${token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
        }
        set({ token, user, isAuthenticated: true, error: null });
      },
      logout: () => {
        // Clear cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'wasalni-admin-token=; path=/; max-age=0';
        }
        set({ token: null, user: null, isAuthenticated: false, error: null });
      },
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      setError: (error) => {
        set({ error });
      },
      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          return false;
        }

        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              set({ user: data.data.user, isAuthenticated: true });
              return true;
            }
          }

          // Token invalid, logout
          set({ token: null, user: null, isAuthenticated: false });
          return false;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'wasalni-admin-auth',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      skipHydration: true,
    }
  )
);

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

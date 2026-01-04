import { User } from '../models';
import { hashPassword } from '../utils/password';

export interface SeededUser {
  _id: string;
  phone: string;
  name: string;
  role: 'passenger' | 'driver' | 'admin';
  email?: string;
}

export async function seedUsers(): Promise<SeededUser[]> {
  // Hash password for admin
  const adminPasswordHash = await hashPassword('admin123');

  const users = [
    // Admin
    {
      phone: '+201000000000',
      name: 'مدير النظام',
      email: 'admin@wasalni.com',
      password: adminPasswordHash,
      role: 'admin',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
    },

    // Active Passengers (6)
    {
      phone: '+201111111111',
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201111111112',
      name: 'سارة أحمد',
      email: 'sara@example.com',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'female',
    },
    {
      phone: '+201111111113',
      name: 'محمود علي',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201111111114',
      name: 'فاطمة حسن',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'female',
    },
    {
      phone: '+201111111115',
      name: 'عمر خالد',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    // Suspended Passenger
    {
      phone: '+201111111116',
      name: 'راكب موقوف',
      role: 'passenger',
      isPhoneVerified: true,
      isActive: false,
      language: 'ar',
    },

    // Approved Drivers (5)
    {
      phone: '+201222222221',
      name: 'محمد السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201222222222',
      name: 'علي السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201222222223',
      name: 'حسن السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201222222224',
      name: 'أحمد السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201222222225',
      name: 'كريم السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },

    // Pending Drivers (3)
    {
      phone: '+201333333331',
      name: 'يوسف السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201333333332',
      name: 'إبراهيم السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },
    {
      phone: '+201333333333',
      name: 'مصطفى السائق',
      role: 'driver',
      isPhoneVerified: true,
      isActive: true,
      language: 'ar',
      gender: 'male',
    },

    // Suspended Driver
    {
      phone: '+201444444444',
      name: 'سائق موقوف',
      role: 'driver',
      isPhoneVerified: true,
      isActive: false,
      language: 'ar',
      gender: 'male',
    },
  ];

  const createdUsers = await User.insertMany(users);

  return createdUsers.map((u) => ({
    _id: u._id.toString(),
    phone: u.phone,
    name: u.name,
    role: u.role as 'passenger' | 'driver' | 'admin',
    email: u.email,
  }));
}

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  className = '',
}: StatsCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-6 shadow-sm border border-slate-200 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 ${
                change.type === 'increase' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {change.type === 'increase' ? '↑' : '↓'} {Math.abs(change.value)}%
            </p>
          )}
        </div>
        <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
          <Icon size={24} className="text-emerald-600" />
        </div>
      </div>
    </div>
  );
}

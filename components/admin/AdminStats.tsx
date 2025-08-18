'use client';

import { TrendingUp, TrendingDown, Minus, DollarSign, Users, ShoppingCart, Package } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
}

export function StatCard({ title, value, change, icon }: StatCardProps) {
  const getTrendIcon = () => {
    if (!change) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-gray-600';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}

export function AdminStats() {
  const stats = [
    {
      title: 'Total Revenue',
      value: '$2.4M',
      change: 12.5,
      icon: <DollarSign className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Active Users',
      value: '15,234',
      change: 8.2,
      icon: <Users className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Total Orders',
      value: '8,901',
      change: -2.4,
      icon: <ShoppingCart className="h-6 w-6 text-primary" />,
    },
    {
      title: 'Products Listed',
      value: '3,456',
      change: 5.7,
      icon: <Package className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
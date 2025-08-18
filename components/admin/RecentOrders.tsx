'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

const orders = [
  {
    id: 'ORD-001',
    customer: 'Ahmed Hassan',
    product: 'MRI Scanner ProMax',
    amount: 450000,
    status: 'completed',
    date: '2024-01-15',
  },
  {
    id: 'ORD-002',
    customer: 'Fatima Al-Rashid',
    product: 'Surgical Robot System',
    amount: 850000,
    status: 'processing',
    date: '2024-01-14',
  },
  {
    id: 'ORD-003',
    customer: 'King Faisal Hospital',
    product: 'Patient Monitor X500',
    amount: 12000,
    status: 'pending',
    date: '2024-01-14',
  },
  {
    id: 'ORD-004',
    customer: 'Dubai Medical Center',
    product: 'Ultrasound System',
    amount: 75000,
    status: 'completed',
    date: '2024-01-13',
  },
  {
    id: 'ORD-005',
    customer: 'Qatar Healthcare',
    product: 'X-Ray Machine Digital',
    amount: 125000,
    status: 'shipped',
    date: '2024-01-13',
  },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function RecentOrders() {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {order.customer.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{order.customer}</p>
              <p className="text-xs text-muted-foreground">{order.product}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">${order.amount.toLocaleString()}</p>
            <Badge className={cn('text-xs', statusColors[order.status as keyof typeof statusColors])}>
              {order.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
'use client';

import { 
  User, Package, ShoppingCart, MessageSquare, 
  Star, AlertCircle, CheckCircle, XCircle 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const activities = [
  {
    id: '1',
    type: 'order',
    icon: ShoppingCart,
    color: 'text-blue-600',
    title: 'New order placed',
    description: 'Order #ORD-2024-001 by Ahmed Hassan',
    amount: '$450,000',
    time: '2 minutes ago',
  },
  {
    id: '2',
    type: 'user',
    icon: User,
    color: 'text-green-600',
    title: 'New user registered',
    description: 'Dr. Fatima Al-Rashid joined as Healthcare Provider',
    time: '15 minutes ago',
  },
  {
    id: '3',
    type: 'product',
    icon: Package,
    color: 'text-purple-600',
    title: 'Product added',
    description: 'Ultrasound System HD added by MedTech Solutions',
    time: '1 hour ago',
  },
  {
    id: '4',
    type: 'review',
    icon: Star,
    color: 'text-yellow-600',
    title: 'New review',
    description: '5-star review for MRI Scanner ProMax',
    time: '2 hours ago',
  },
  {
    id: '5',
    type: 'alert',
    icon: AlertCircle,
    color: 'text-red-600',
    title: 'Low stock alert',
    description: 'Surgical Robot System has only 2 units left',
    time: '3 hours ago',
  },
  {
    id: '6',
    type: 'message',
    icon: MessageSquare,
    color: 'text-indigo-600',
    title: 'Support ticket',
    description: 'New support request from Dubai Medical Center',
    priority: 'high',
    time: '4 hours ago',
  },
  {
    id: '7',
    type: 'success',
    icon: CheckCircle,
    color: 'text-green-600',
    title: 'Payment received',
    description: 'Payment of $125,000 received from Qatar Healthcare',
    time: '5 hours ago',
  },
  {
    id: '8',
    type: 'cancel',
    icon: XCircle,
    color: 'text-red-600',
    title: 'Order cancelled',
    description: 'Order #ORD-2024-089 cancelled by customer',
    time: '6 hours ago',
  },
];

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 ${activity.color}`}>
            <activity.icon className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{activity.title}</p>
              <span className="text-xs text-muted-foreground">{activity.time}</span>
            </div>
            <p className="text-sm text-muted-foreground">{activity.description}</p>
            {activity.amount && (
              <p className="text-sm font-semibold text-primary">{activity.amount}</p>
            )}
            {activity.priority && (
              <Badge variant="destructive" className="text-xs">
                {activity.priority}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
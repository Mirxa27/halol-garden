'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const products = [
  {
    id: '1',
    name: 'MRI Scanner ProMax',
    sales: 45,
    revenue: 20250000,
    stock: 3,
    trend: 'up',
  },
  {
    id: '2',
    name: 'Surgical Robot System',
    sales: 12,
    revenue: 10200000,
    stock: 2,
    trend: 'up',
  },
  {
    id: '3',
    name: 'Patient Monitor X500',
    sales: 128,
    revenue: 1536000,
    stock: 45,
    trend: 'stable',
  },
  {
    id: '4',
    name: 'Ultrasound System HD',
    sales: 67,
    revenue: 5025000,
    stock: 8,
    trend: 'down',
  },
  {
    id: '5',
    name: 'Digital X-Ray Machine',
    sales: 34,
    revenue: 4250000,
    stock: 5,
    trend: 'up',
  },
];

export function TopProducts() {
  const maxRevenue = Math.max(...products.map(p => p.revenue));

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <div key={product.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.sales} sales • {product.stock} in stock
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                ${(product.revenue / 1000000).toFixed(1)}M
              </p>
              <Badge 
                variant={
                  product.trend === 'up' ? 'default' : 
                  product.trend === 'down' ? 'destructive' : 
                  'secondary'
                }
                className="text-xs"
              >
                {product.trend}
              </Badge>
            </div>
          </div>
          <Progress 
            value={(product.revenue / maxRevenue) * 100} 
            className="h-2"
          />
        </div>
      ))}
    </div>
  );
}
'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const data = [
  { month: 'Jan', revenue: 186000, orders: 890 },
  { month: 'Feb', revenue: 205000, orders: 920 },
  { month: 'Mar', revenue: 237000, orders: 1100 },
  { month: 'Apr', revenue: 273000, orders: 1280 },
  { month: 'May', revenue: 309000, orders: 1450 },
  { month: 'Jun', revenue: 314000, orders: 1520 },
  { month: 'Jul', revenue: 350000, orders: 1680 },
  { month: 'Aug', revenue: 387000, orders: 1820 },
  { month: 'Sep', revenue: 402000, orders: 1950 },
  { month: 'Oct', revenue: 429000, orders: 2100 },
  { month: 'Nov', revenue: 456000, orders: 2280 },
  { month: 'Dec', revenue: 489000, orders: 2450 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="month" 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `$${value / 1000}k`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px'
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: any, name: string) => {
            if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
            return [value.toLocaleString(), 'Orders'];
          }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="revenue" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6 }}
        />
        <Line 
          type="monotone" 
          dataKey="orders" 
          stroke="hsl(var(--secondary))" 
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--secondary))' }}
          activeDot={{ r: 6 }}
          yAxisId="right"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Package, 
  Wrench, 
  Calendar,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Bell,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
  FileText,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

interface DashboardStats {
  totalEquipment: number;
  activeRentals: number;
  pendingMaintenance: number;
  monthlySpending: number;
  upcomingDeliveries: number;
  openTickets: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'rental' | 'maintenance' | 'delivery';
  title: string;
  description: string;
  timestamp: Date;
  status: string;
  icon: React.ReactNode;
}

const HealthcareProviderDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEquipment: 156,
    activeRentals: 12,
    pendingMaintenance: 5,
    monthlySpending: 45780,
    upcomingDeliveries: 3,
    openTickets: 2
  });

  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'order',
      title: 'Order #ORD-2024-001 Confirmed',
      description: 'Ultrasound Machine - Delivery scheduled for tomorrow',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'confirmed',
      icon: <Package className="h-4 w-4" />
    },
    {
      id: '2',
      type: 'maintenance',
      title: 'Maintenance Request Scheduled',
      description: 'MRI Scanner - Engineer assigned: John Smith',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'scheduled',
      icon: <Wrench className="h-4 w-4" />
    },
    {
      id: '3',
      type: 'rental',
      title: 'Rental Agreement Expiring Soon',
      description: 'Ventilator rental expires in 5 days',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'warning',
      icon: <Calendar className="h-4 w-4" />
    }
  ]);

  const [upcomingMaintenance] = useState([
    {
      id: '1',
      equipment: 'CT Scanner',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      type: 'Preventive',
      engineer: 'Ahmed Hassan',
      status: 'scheduled'
    },
    {
      id: '2',
      equipment: 'X-Ray Machine',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      type: 'Calibration',
      engineer: 'Sarah Johnson',
      status: 'scheduled'
    }
  ]);

  const [activeRentals] = useState([
    {
      id: '1',
      equipment: 'Portable Ventilator',
      supplier: 'MedEquip Solutions',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      monthlyRate: 2500,
      status: 'active'
    },
    {
      id: '2',
      equipment: 'Patient Monitor',
      supplier: 'HealthTech Supplies',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      monthlyRate: 1200,
      status: 'active'
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Healthcare Provider Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, King Faisal Hospital</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search equipment, orders..." 
                  className="pl-10 w-80"
                />
              </div>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Quick Actions */}
        <div className="mb-6">
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Request Maintenance
            </Button>
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Browse Equipment
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Contracts
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <StatCard
            title="Total Equipment"
            value={stats.totalEquipment}
            description="Owned & rented"
            icon={<Package className="h-4 w-4" />}
            trend={{ value: 5, isPositive: true }}
          />
          <StatCard
            title="Active Rentals"
            value={stats.activeRentals}
            description="Current agreements"
            icon={<Calendar className="h-4 w-4" />}
          />
          <StatCard
            title="Pending Maintenance"
            value={stats.pendingMaintenance}
            description="Requires attention"
            icon={<Wrench className="h-4 w-4" />}
            trend={{ value: 2, isPositive: false }}
          />
          <StatCard
            title="Monthly Spending"
            value={formatCurrency(stats.monthlySpending)}
            description="Current month"
            icon={<DollarSign className="h-4 w-4" />}
            trend={{ value: 12, isPositive: false }}
          />
          <StatCard
            title="Upcoming Deliveries"
            value={stats.upcomingDeliveries}
            description="Next 7 days"
            icon={<Package className="h-4 w-4" />}
          />
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            description="Support requests"
            icon={<AlertCircle className="h-4 w-4" />}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'maintenance' ? 'bg-orange-100 text-orange-600' :
                        activity.type === 'rental' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatRelativeTime(activity.timestamp)}
                        </p>
                      </div>
                      <Badge variant={
                        activity.status === 'confirmed' ? 'default' :
                        activity.status === 'scheduled' ? 'secondary' :
                        'outline'
                      }>
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 w-full">
                  View All Activity
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Maintenance */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Upcoming Maintenance</CardTitle>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMaintenance.map((maintenance) => (
                    <div key={maintenance.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{maintenance.equipment}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {maintenance.type} • Engineer: {maintenance.engineer}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(maintenance.date)}</p>
                        <Badge variant="secondary" className="mt-1">
                          <Clock className="mr-1 h-3 w-3" />
                          Scheduled
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Active Rentals */}
            <Card>
              <CardHeader>
                <CardTitle>Active Rentals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeRentals.map((rental) => (
                    <div key={rental.id} className="border-b last:border-0 pb-4 last:pb-0">
                      <h4 className="font-medium text-sm">{rental.equipment}</h4>
                      <p className="text-xs text-gray-500 mt-1">{rental.supplier}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-medium">
                          {formatCurrency(rental.monthlyRate)}/mo
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Expires {formatDate(rental.endDate)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="mt-4 w-full">
                  Manage Rentals
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Operational</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Under Maintenance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Out of Service</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '5%' }}></div>
                      </div>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Center */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <HelpCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Our support team is available 24/7
                  </p>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareProviderDashboard;
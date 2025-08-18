/**
 * Real-Time Performance Monitoring Dashboard
 * Displays system metrics, analytics, and performance indicators
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { 
  Activity, TrendingUp, TrendingDown, Users, 
  Server, Database, Cpu, HardDrive, Wifi, 
  AlertCircle, CheckCircle, Clock, Zap,
  RefreshCw, Download, Settings, Filter
} from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { monitoring } from '../lib/monitoring';
import { cache } from '../lib/cache';

// Types
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
  timestamp: Date;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  requestCount: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

interface UserMetrics {
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  avgSessionDuration: number;
  bounceRate: number;
  pageViews: number;
}

interface BusinessMetrics {
  orders: number;
  revenue: number;
  conversionRate: number;
  avgOrderValue: number;
  cartAbandonment: number;
  customerSatisfaction: number;
}

interface WebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  fcp: number; // First Contentful Paint
}

interface DashboardProps {
  refreshInterval?: number;
  theme?: 'light' | 'dark';
}

export const PerformanceDashboard: React.FC<DashboardProps> = ({ 
  refreshInterval = 5000,
  theme = 'light' 
}) => {
  // State
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([]);
  const [apiMetrics, setApiMetrics] = useState<ApiMetrics[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics | null>(null);
  const [webVitals, setWebVitals] = useState<WebVitals | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('1h');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'system' | 'api' | 'user' | 'business'>('system');

  // WebSocket for real-time updates
  const { socket, connected } = useWebSocket({
    autoConnect: true,
  }, {
    onMessage: (data: any) => {
      if (data.type === 'metrics:system') {
        updateSystemMetrics(data.payload);
      } else if (data.type === 'metrics:api') {
        updateApiMetrics(data.payload);
      } else if (data.type === 'metrics:user') {
        setUserMetrics(data.payload);
      } else if (data.type === 'metrics:business') {
        setBusinessMetrics(data.payload);
      }
    },
  });

  // Fetch initial data
  useEffect(() => {
    fetchMetrics();
    fetchWebVitals();

    if (isAutoRefresh) {
      const interval = setInterval(() => {
        fetchMetrics();
        fetchWebVitals();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [selectedTimeRange, isAutoRefresh, refreshInterval]);

  const fetchMetrics = async () => {
    try {
      const endTime = new Date();
      const startTime = getStartTime(selectedTimeRange);

      // Fetch from API
      const [system, api, user, business] = await Promise.all([
        fetch(`/api/metrics/system?start=${startTime}&end=${endTime}`).then(r => r.json()),
        fetch(`/api/metrics/api?start=${startTime}&end=${endTime}`).then(r => r.json()),
        fetch(`/api/metrics/users?start=${startTime}&end=${endTime}`).then(r => r.json()),
        fetch(`/api/metrics/business?start=${startTime}&end=${endTime}`).then(r => r.json()),
      ]);

      setSystemMetrics(system);
      setApiMetrics(api);
      setUserMetrics(user);
      setBusinessMetrics(business);

      // Cache for offline access
      cache.set('dashboard:metrics', { system, api, user, business }, { ttl: 60000 });
    } catch (error) {
      monitoring.error('Failed to fetch metrics', error as Error);
      
      // Try to load from cache
      const cached = await cache.get('dashboard:metrics');
      if (cached) {
        setSystemMetrics(cached.system);
        setApiMetrics(cached.api);
        setUserMetrics(cached.user);
        setBusinessMetrics(cached.business);
      }
    }
  };

  const fetchWebVitals = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Get Core Web Vitals
      const vitals: WebVitals = {
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        fcp: 0,
      };

      // Use Performance Observer API
      if ('PerformanceObserver' in window) {
        // LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // FID
        new PerformanceObserver((list) => {
          const firstInput = list.getEntries()[0] as any;
          vitals.fid = firstInput.processingStart - firstInput.startTime;
        }).observe({ type: 'first-input', buffered: true });

        // CLS
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ type: 'layout-shift', buffered: true });

        // TTFB & FCP from Navigation Timing
        const navTiming = performance.getEntriesByType('navigation')[0] as any;
        if (navTiming) {
          vitals.ttfb = navTiming.responseStart - navTiming.requestStart;
          vitals.fcp = navTiming.loadEventEnd - navTiming.fetchStart;
        }
      }

      setWebVitals(vitals);
    } catch (error) {
      monitoring.error('Failed to fetch web vitals', error as Error);
    }
  };

  const updateSystemMetrics = (newMetric: SystemMetrics) => {
    setSystemMetrics(prev => {
      const updated = [...prev, newMetric];
      // Keep only last 100 data points
      return updated.slice(-100);
    });
  };

  const updateApiMetrics = (newMetrics: ApiMetrics[]) => {
    setApiMetrics(newMetrics);
  };

  const getStartTime = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    }
  };

  const exportData = () => {
    const data = {
      systemMetrics,
      apiMetrics,
      userMetrics,
      businessMetrics,
      webVitals,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart colors
  const colors = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#6366F1',
    purple: '#8B5CF6',
  };

  // Computed values
  const systemHealth = useMemo(() => {
    if (systemMetrics.length === 0) return 'unknown';
    const latest = systemMetrics[systemMetrics.length - 1];
    if (latest.cpu > 80 || latest.memory > 85) return 'critical';
    if (latest.cpu > 60 || latest.memory > 70) return 'warning';
    return 'healthy';
  }, [systemMetrics]);

  const apiHealth = useMemo(() => {
    if (apiMetrics.length === 0) return 'unknown';
    const avgErrorRate = apiMetrics.reduce((acc, m) => acc + m.errorRate, 0) / apiMetrics.length;
    if (avgErrorRate > 5) return 'critical';
    if (avgErrorRate > 2) return 'warning';
    return 'healthy';
  }, [apiMetrics]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold">Performance Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Real-time system monitoring and analytics
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>

              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`p-2 rounded-lg ${isAutoRefresh ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                <RefreshCw className={`w-5 h-5 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Button */}
              <button
                onClick={exportData}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <Download className="w-5 h-5" />
              </button>

              {/* Settings */}
              <button className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Metric Tabs */}
          <div className="flex space-x-1 mt-4">
            {['system', 'api', 'user', 'business'].map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric as any)}
                className={`px-4 py-2 rounded-lg capitalize ${
                  selectedMetric === metric
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* System Health */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Server className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">System Health</p>
                  <p className="text-2xl font-bold capitalize">{systemHealth}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                systemHealth === 'healthy' ? 'bg-green-500' :
                systemHealth === 'warning' ? 'bg-yellow-500' :
                systemHealth === 'critical' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            </div>
            {systemMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU</span>
                  <span>{systemMetrics[systemMetrics.length - 1].cpu.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Memory</span>
                  <span>{systemMetrics[systemMetrics.length - 1].memory.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* API Performance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Zap className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-500">API Performance</p>
                  <p className="text-2xl font-bold capitalize">{apiHealth}</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${
                apiHealth === 'healthy' ? 'bg-green-500' :
                apiHealth === 'warning' ? 'bg-yellow-500' :
                apiHealth === 'critical' ? 'bg-red-500' : 'bg-gray-400'
              }`} />
            </div>
            {apiMetrics.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Avg Response</span>
                  <span>{(apiMetrics.reduce((acc, m) => acc + m.avgResponseTime, 0) / apiMetrics.length).toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Error Rate</span>
                  <span>{(apiMetrics.reduce((acc, m) => acc + m.errorRate, 0) / apiMetrics.length).toFixed(2)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Active Users */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-2xl font-bold">{userMetrics?.activeUsers || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+12%</span>
              </div>
            </div>
            {userMetrics && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>New</span>
                  <span>{userMetrics.newUsers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Returning</span>
                  <span>{userMetrics.returningUsers}</span>
                </div>
              </div>
            )}
          </div>

          {/* Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold">${businessMetrics?.revenue.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 text-green-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">+8%</span>
              </div>
            </div>
            {businessMetrics && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Orders</span>
                  <span>{businessMetrics.orders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>AOV</span>
                  <span>${businessMetrics.avgOrderValue.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        {selectedMetric === 'system' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CPU & Memory Usage */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">System Resources</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={systemMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke={colors.primary} name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke={colors.success} name="Memory %" />
                  <Line type="monotone" dataKey="disk" stroke={colors.warning} name="Disk %" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Network I/O */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Network I/O</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={systemMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(time) => new Date(time).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="network.in" stackId="1" stroke={colors.info} fill={colors.info} name="Inbound" />
                  <Area type="monotone" dataKey="network.out" stackId="1" stroke={colors.purple} fill={colors.purple} name="Outbound" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedMetric === 'api' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Response Times */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Response Times by Endpoint</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiMetrics.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="endpoint" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgResponseTime" fill={colors.primary} name="Avg Response (ms)" />
                  <Bar dataKey="p95ResponseTime" fill={colors.warning} name="P95 (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Error Rates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Error Rates</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Success', value: 100 - (apiMetrics.reduce((acc, m) => acc + m.errorRate, 0) / apiMetrics.length) },
                      { name: 'Errors', value: apiMetrics.reduce((acc, m) => acc + m.errorRate, 0) / apiMetrics.length },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={colors.success} />
                    <Cell fill={colors.danger} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedMetric === 'user' && userMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Distribution */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">User Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'New Users', value: userMetrics.newUsers },
                      { name: 'Returning Users', value: userMetrics.returningUsers },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill={colors.primary} />
                    <Cell fill={colors.success} />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* User Engagement */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">User Engagement</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Avg Session Duration</span>
                    <span>{Math.floor(userMetrics.avgSessionDuration / 60)}m {userMetrics.avgSessionDuration % 60}s</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(userMetrics.avgSessionDuration / 600 * 100, 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Bounce Rate</span>
                    <span>{userMetrics.bounceRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${userMetrics.bounceRate}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Page Views</span>
                    <span>{userMetrics.pageViews.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(userMetrics.pageViews / 10000 * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'business' && businessMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business KPIs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Business KPIs</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={[
                  { metric: 'Conversion', value: businessMetrics.conversionRate },
                  { metric: 'Satisfaction', value: businessMetrics.customerSatisfaction },
                  { metric: 'AOV', value: businessMetrics.avgOrderValue / 10 },
                  { metric: 'Orders', value: businessMetrics.orders / 100 },
                  { metric: 'Revenue', value: businessMetrics.revenue / 10000 },
                ]}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis />
                  <Radar name="Current" dataKey="value" stroke={colors.primary} fill={colors.primary} fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Visitors</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-blue-500 h-8 rounded" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Add to Cart</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-blue-400 h-8 rounded" style={{ width: '75%' }} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Checkout</span>
                    <span>30%</span>
                  </div>
                  <div className="w-full bg-blue-300 h-8 rounded" style={{ width: '50%' }} />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Purchase</span>
                    <span>{businessMetrics.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-green-500 h-8 rounded" style={{ width: `${businessMetrics.conversionRate * 4}%` }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Web Vitals */}
        {webVitals && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Core Web Vitals</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${webVitals.lcp < 2500 ? 'text-green-500' : webVitals.lcp < 4000 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {(webVitals.lcp / 1000).toFixed(2)}s
                </div>
                <p className="text-sm text-gray-500">LCP</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${webVitals.fid < 100 ? 'text-green-500' : webVitals.fid < 300 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {webVitals.fid.toFixed(0)}ms
                </div>
                <p className="text-sm text-gray-500">FID</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${webVitals.cls < 0.1 ? 'text-green-500' : webVitals.cls < 0.25 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {webVitals.cls.toFixed(3)}
                </div>
                <p className="text-sm text-gray-500">CLS</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${webVitals.ttfb < 800 ? 'text-green-500' : webVitals.ttfb < 1800 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {webVitals.ttfb.toFixed(0)}ms
                </div>
                <p className="text-sm text-gray-500">TTFB</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${webVitals.fcp < 1800 ? 'text-green-500' : webVitals.fcp < 3000 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {(webVitals.fcp / 1000).toFixed(2)}s
                </div>
                <p className="text-sm text-gray-500">FCP</p>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Active Alerts</h3>
          <div className="space-y-3">
            {systemHealth === 'critical' && (
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">Critical System Load</p>
                  <p className="text-sm text-red-700">CPU or Memory usage exceeds 80%</p>
                </div>
                <span className="text-xs text-red-500">Active</span>
              </div>
            )}
            {apiHealth === 'warning' && (
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">Elevated Error Rate</p>
                  <p className="text-sm text-yellow-700">API error rate above normal threshold</p>
                </div>
                <span className="text-xs text-yellow-500">Warning</span>
              </div>
            )}
            {systemHealth === 'healthy' && apiHealth === 'healthy' && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">All Systems Operational</p>
                  <p className="text-sm text-green-700">No active alerts</p>
                </div>
                <span className="text-xs text-green-500">Healthy</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
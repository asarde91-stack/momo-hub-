'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import Navigation from '@/components/Navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface ReportData {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  items: { name: string; count: number; revenue: number }[];
}

interface ChartData {
  name: string;
  orders: number;
  revenue: number;
}

const COLORS = ['#FF6B35', '#004E89', '#FFA500', '#4CAF50', '#9C27B0'];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieData, setPieData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, [reportType]);

  async function loadReport() {
    setLoading(true);
    const now = new Date();
    let startDate: Date;

    switch (reportType) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        break;
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 28);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear() - 4, 0, 1);
        break;
    }

    const orders = await db.orders
      .where('timestamp')
      .aboveOrEqual(startDate)
      .toArray();

    const menuItems = await db.menu_items.toArray();
    const menuItemMap = new Map(menuItems.map(item => [item.id, item]));

    // Group by date
    const groupedByDate = new Map<string, typeof orders>();

    for (const order of orders) {
      let dateKey: string;
      const orderDate = new Date(order.timestamp);

      switch (reportType) {
        case 'daily':
          dateKey = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
          break;
        case 'weekly':
          dateKey = `Week ${Math.ceil(orderDate.getDate() / 7)}`;
          break;
        case 'monthly':
          dateKey = orderDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
          break;
        case 'yearly':
          dateKey = orderDate.getFullYear().toString();
          break;
        default:
          dateKey = orderDate.toLocaleDateString('en-IN');
      }

      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, []);
      }
      groupedByDate.get(dateKey)!.push(order);
    }

    // Process each date
    const reports: ReportData[] = [];
    const chartItems: ChartData[] = [];
    const itemTotals = new Map<string, number>();

    for (const [date, dateOrders] of Array.from(groupedByDate.entries())) {
      const itemMap = new Map<string, { count: number; revenue: number }>();
      let totalOrders = 0;
      let totalRevenue = 0;

      for (const order of dateOrders) {
        const menuItem = menuItemMap.get(order.menu_item_id);
        if (menuItem) {
          const existing = itemMap.get(menuItem.name) || { count: 0, revenue: 0 };
          itemMap.set(menuItem.name, {
            count: existing.count + order.quantity,
            revenue: existing.revenue + order.total_price,
          });
          totalOrders += order.quantity;
          totalRevenue += order.total_price;

          // Track item totals for pie chart
          const itemTotal = itemTotals.get(menuItem.name) || 0;
          itemTotals.set(menuItem.name, itemTotal + order.quantity);
        }
      }

      reports.push({
        date,
        totalOrders,
        totalRevenue,
        items: Array.from(itemMap.entries()).map(([name, data]) => ({
          name,
          ...data,
        })),
      });

      chartItems.push({
        name: date,
        orders: totalOrders,
        revenue: totalRevenue,
      });
    }

    // Sort by date (newest first for reports, oldest first for charts)
    reports.sort((a, b) => b.date.localeCompare(a.date));
    chartItems.reverse();

    // Create pie chart data
    const pieItems = Array.from(itemTotals.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 items

    setReportData(reports);
    setChartData(chartItems);
    setPieData(pieItems);
    setLoading(false);
  }

  const totalRevenue = reportData.reduce((sum, report) => sum + report.totalRevenue, 0);
  const totalOrders = reportData.reduce((sum, report) => sum + report.totalOrders, 0);

  function exportToCSV() {
    const headers = ['Date', 'Item', 'Quantity', 'Revenue'];
    const rows: string[][] = [];

    for (const report of reportData) {
      for (const item of report.items) {
        rows.push([
          report.date,
          item.name,
          item.count.toString(),
          item.revenue.toString(),
        ]);
      }
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `Total Orders,${totalOrders}`,
      `Total Revenue,₹${totalRevenue}`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momo-hub-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-sm opacity-90">Track your sales</p>
          </div>
          <button
            onClick={exportToCSV}
            className="bg-white/20 px-3 py-2 rounded-lg text-sm"
          >
            📥 Export
          </button>
        </div>
      </header>

      {/* Report Type Selector */}
      <div className="m-4 flex gap-2">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`flex-1 py-2 rounded-lg font-semibold text-sm capitalize ${
              reportType === type
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="m-4 bg-white p-4 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Summary</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{totalOrders}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">₹{totalRevenue}</div>
            <div className="text-sm text-gray-500">Total Revenue</div>
          </div>
        </div>
      </div>

      {/* Orders Bar Chart */}
      {chartData.length > 0 && (
        <div className="m-4 bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3">Orders Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#FF6B35" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Revenue Line Chart */}
      {chartData.length > 0 && (
        <div className="m-4 bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4CAF50" 
                  strokeWidth={2}
                  dot={{ fill: '#4CAF50' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Item Distribution Pie Chart */}
      {pieData.length > 0 && (
        <div className="m-4 bg-white p-4 rounded-xl shadow-sm">
          <h3 className="font-semibold mb-3">Item Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Report List */}
      <div className="p-4">
        <h3 className="font-semibold mb-3">Detailed Report</h3>
        {reportData.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No data available for this period
          </div>
        ) : (
          <div className="space-y-4">
            {reportData.map((report) => (
              <div key={report.date} className="bg-white p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-semibold">{report.date}</div>
                  <div className="text-sm text-gray-500">
                    {report.totalOrders} orders • ₹{report.totalRevenue}
                  </div>
                </div>
                <div className="space-y-2">
                  {report.items.map((item) => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">
                        {item.count} × ₹{Math.round(item.revenue / item.count)} = ₹{item.revenue}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
}

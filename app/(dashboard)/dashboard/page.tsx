'use client';

import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  History,
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Stats {
  totalSales: number;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  orderCount: number;
  productCount: number;
  lowStockCount: number;
  recentSales: any[];
  stockLevels: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [rawData, setRawData] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'month'>('day');

  const updateChartData = (data: any, type: 'day' | 'month') => {
    if (type === 'day') {
      const groupedSales: Record<string, any> = {};
      const days = 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        groupedSales[d.toLocaleDateString('en-US', { weekday: 'short' })] = { revenue: 0, earnings: 0 };
      }

      data.dailySales.forEach((order: any) => {
        const day = new Date(order.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
        if (groupedSales[day] !== undefined) {
          groupedSales[day].revenue += (order.subtotal || order.totalAmount);
          groupedSales[day].earnings += order.totalAmount;
        }
      });

      setChartData(Object.keys(groupedSales).map(key => ({
        name: key,
        revenue: groupedSales[key].revenue,
        earnings: groupedSales[key].earnings
      })));
    } else {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formatted = data.monthlySales.map((m: any) => ({
        name: `${months[m._id.month - 1]}`,
        revenue: m.revenue,
        earnings: m.earnings
      })).reverse();
      setChartData(formatted);
    }
  };

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setRawData(data);
        updateChartData(data, 'day');
        setLoading(false);
      });
  }, []);

  const handleTimeframeChange = (type: 'day' | 'month') => {
    setTimeframe(type);
    if (rawData) updateChartData(rawData, type);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', height: '80vh', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--sidebar)', letterSpacing: '-0.025em' }}>Dashboard</h1>
          <p style={{ color: 'var(--secondary)', marginTop: '0.25rem' }}>Welcome back. Here is your store's performance at a glance.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }}>
          <TrendingUp size={18} /> View Detailed Reports
        </button>
      </header>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #3b82f6', background: 'white' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Total Earnings</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>₹{stats?.totalSales.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Net after taxes & discounts</p>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #8b5cf6', background: 'white' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Gross Revenue</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>₹{stats?.totalRevenue.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Pre-tax product sales</p>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #f59e0b', background: 'white' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tax Collected</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b' }}>₹{stats?.totalTax.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Total GST liability</p>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #ef4444', background: 'white' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Discounts Given</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#ef4444' }}>₹{stats?.totalDiscount.toLocaleString()}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Value subtracted from bills</p>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderTop: '4px solid #10b981', background: 'white' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Orders</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a' }}>{stats?.orderCount}</h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', marginTop: '0.25rem' }}>Completed transactions</p>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--sidebar)' }}>Revenue Overview</h3>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Daily sales performance for the last 7 days</p>
          </div>
          <select 
            value={timeframe}
            onChange={(e) => handleTimeframeChange(e.target.value as 'day' | 'month')}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--sidebar)', fontWeight: '500', outline: 'none' }}
          >
            <option value="day">Day wise (7 Days)</option>
            <option value="month">Month wise (6 Months)</option>
          </select>
        </div>
        <div style={{ height: '300px', width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
              <Tooltip 
                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontWeight: '700' }}
                formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`}
              />
              <Area type="monotone" dataKey="revenue" name="Gross Revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="earnings" name="Net Earnings" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--sidebar)' }}>Recent Transactions</h3>
            <button style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer' }}>View All</button>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: '0', margin: '0' }}>
            <table>
              <thead>
                <tr>
                  <th style={{ background: 'transparent' }}>Invoice</th>
                  <th style={{ background: 'transparent' }}>Amount</th>
                  <th style={{ background: 'transparent' }}>Status</th>
                  <th style={{ background: 'transparent', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales.slice(0, 5).map((order: any) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: '600', color: '#0f172a' }}>{order.invoiceNumber}</td>
                    <td style={{ fontWeight: '600' }}>₹{order.totalAmount}</td>
                    <td><span className="badge badge-success" style={{ background: '#ecfdf5', color: '#10b981', border: 'none' }}>Completed</span></td>
                    <td style={{ textAlign: 'right' }}><MoreHorizontal size={18} color="var(--secondary)" style={{ cursor: 'pointer', marginLeft: 'auto' }} /></td>
                  </tr>
                ))}
                {stats?.recentSales.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--secondary)' }}>No recent transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--sidebar)' }}>Low Stock</h3>
            <span style={{ padding: '0.2rem 0.6rem', background: '#fee2e2', color: '#ef4444', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: '700' }}>
              {stats?.lowStockCount} items
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {stats?.stockLevels.filter(p => p.stock < 10).slice(0, 5).map((product: any) => (
              <div key={product._id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                transition: 'all 0.2s ease'
              }} className="hover:border-red-200 hover:bg-red-50/30">
                <div>
                  <span style={{ block: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#0f172a' }}>{product.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>SKU: {product.sku}</span>
                </div>
                <span style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '800', 
                  color: '#ef4444'
                }}>
                  {product.stock} left
                </span>
              </div>
            ))}
            {stats?.stockLevels.filter(p => p.stock < 10).length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={32} color="#10b981" />
                <p>All stock levels healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

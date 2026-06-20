import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Users, 
  Leaf, 
  Award, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Server, 
  CloudSun,
  TrendingDown
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';

interface UserSummary {
  userId: string;
  userName: string;
  streak: number;
  baseline_co2: number;
  teamName: string;
  badges: string[];
}

interface LogSummary {
  id: string;
  userId: string;
  category: string;
  subtype: string;
  co2_kg: number;
  timestamp: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [logs, setLogs] = useState<LogSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiFetch('/admin/users'),
        apiFetch('/admin/logs')
      ]);

      if (usersRes.ok && logsRes.ok) {
        const usersData = await usersRes.json();
        const logsData = await logsRes.json();
        setUsers(usersData);
        setLogs(logsData);
      } else {
        throw new Error("Failed to load admin dashboard statistics.");
      }
    } catch (error) { const err = error as Error;
      setError(err.message || "An error occurred while loading dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Gathering environmental metrics..." />;
  }

  // Calculate statistics
  const totalUsers = users.length;
  const totalLogs = logs.length;
  
  // Total Carbon Logged (summing negative emissions/reductions, or positive impacts)
  const totalCarbonLogged = logs.reduce((sum, log) => sum + (log.co2_kg || 0), 0);


  const avgStreak = totalUsers > 0 
    ? Math.round(users.reduce((sum, u) => sum + (u.streak || 0), 0) / totalUsers) 
    : 0;

  const maxStreak = totalUsers > 0 
    ? Math.max(...users.map(u => u.streak || 0)) 
    : 0;



  // Sort users by streak for a top contributors view
  const topUsers = [...users]
    .sort((a, b) => (b.streak || 0) - (a.streak || 0))
    .slice(0, 5);

  // ── Real 7-day daily trend chart data from logs ───────────────────────────────────
  const trendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    const dayLogs = logs.filter(l => l.timestamp?.startsWith(dateStr));
    const co2 = dayLogs.reduce((sum, l) => sum + (l.co2_kg || 0), 0);
    return { date: label, co2: Math.max(0, Number(co2.toFixed(1))) };
  });

  // ── Real category distribution pie chart data from logs ────────────────────────
  const CHART_COLORS = ['#2E90FA', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6'];
  const categoryMap: Record<string, number> = {};
  logs.forEach(l => {
    if ((l.co2_kg || 0) > 0) {
      const k = l.category?.toLowerCase() || 'other';
      categoryMap[k] = (categoryMap[k] || 0) + l.co2_kg;
    }
  });
  const categoryPieData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name: name.toUpperCase(), value: Number(value.toFixed(1)) }));

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
          Atmospheric Control Room
        </h1>
        <p className="text-sm font-semibold text-text-grey mt-1">
          Real-time oversight of the Living World, carbon reductions, and system health parameters.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Total Users */}
        <div className="premium-card p-6 flex items-center justify-between border-l-4 border-l-accent-blue">
          <div>
            <span className="text-xs font-bold text-text-grey uppercase tracking-wider block">
              Total Guardians
            </span>
            <span className="text-3xl font-black text-text-charcoal mt-1 block">
              {totalUsers}
            </span>
            <span className="text-[10px] font-semibold text-text-grey mt-1 block">
              Active accounts registered
            </span>
          </div>
          <div className="h-12 w-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue">
            <Users className="h-6 w-6 stroke-[2]" />
          </div>
        </div>

        {/* Card 2: Total Logs */}
        <div className="premium-card p-6 flex items-center justify-between border-l-4 border-l-accent-green">
          <div>
            <span className="text-xs font-bold text-text-grey uppercase tracking-wider block">
              Carbon Log Entries
            </span>
            <span className="text-3xl font-black text-text-charcoal mt-1 block">
              {totalLogs}
            </span>
            <span className="text-[10px] font-semibold text-text-grey mt-1 block">
              Global environmental logs
            </span>
          </div>
          <div className="h-12 w-12 bg-accent-green/10 rounded-2xl flex items-center justify-center text-accent-green">
            <Leaf className="h-6 w-6 stroke-[2]" />
          </div>
        </div>

        {/* Card 3: Total Carbon Reduced */}
        <div className="premium-card p-6 flex items-center justify-between border-l-4 border-l-accent-amber">
          <div>
            <span className="text-xs font-bold text-text-grey uppercase tracking-wider block">
              Carbon footprint sum
            </span>
            <span className="text-3xl font-black text-text-charcoal mt-1 block">
              {Math.round(totalCarbonLogged)} <span className="text-xs font-bold">kg CO₂</span>
            </span>
            <span className="text-[10px] font-semibold text-text-grey mt-1 block flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-accent-green inline" /> Net carbon impact logged
            </span>
          </div>
          <div className="h-12 w-12 bg-accent-amber/10 rounded-2xl flex items-center justify-center text-accent-amber">
            <CloudSun className="h-6 w-6 stroke-[2]" />
          </div>
        </div>

        {/* Card 4: Avg Streaks */}
        <div className="premium-card p-6 flex items-center justify-between border-l-4 border-l-red-500">
          <div>
            <span className="text-xs font-bold text-text-grey uppercase tracking-wider block">
              Streaks Overview
            </span>
            <span className="text-3xl font-black text-text-charcoal mt-1 block">
              {avgStreak} <span className="text-xs font-bold">days avg</span>
            </span>
            <span className="text-[10px] font-semibold text-text-grey mt-1 block">
              Highest streak: {maxStreak} days
            </span>
          </div>
          <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
            <Flame className="h-6 w-6 stroke-[2] fill-red-500" />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 7-Day Trend Area Chart */}
        <div className="premium-card p-6">
          <h2 className="text-sm font-bold text-text-charcoal mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-accent-blue" />
            7-Day Platform CO₂ Trend
          </h2>
          {trendData.every(d => d.co2 === 0) ? (
            <div className="h-48 flex items-center justify-center text-text-grey text-xs font-semibold">
              No log data for the past 7 days yet.
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tickLine={false} tick={{ fontSize: 9 }} />
                  <YAxis stroke="#9CA3AF" unit="kg" tickLine={false} tick={{ fontSize: 9 }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div role="tooltip" aria-live="polite" className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xl space-y-1 text-xs text-text-charcoal">
                            <p className="font-extrabold">{label}</p>
                            <p className="font-bold text-accent-blue">Daily Total: {payload[0].value} kg CO₂</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="co2" stroke="#2E90FA" fill="rgba(46,144,250,0.08)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="premium-card p-6">
          <h2 className="text-sm font-bold text-text-charcoal mb-4 flex items-center gap-2">
            <Leaf className="h-4 w-4 text-accent-green" />
            Global Category Breakdown
          </h2>
          {categoryPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-grey text-xs font-semibold">
              No categorized logs recorded yet.
            </div>
          ) : (
            <div className="h-48 flex items-center gap-6">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {categoryPieData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                   <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div role="tooltip" aria-live="polite" className="bg-white border border-[#E2E8F0] p-3.5 rounded-xl shadow-xl space-y-1 text-xs text-text-charcoal">
                            <p className="font-extrabold">{payload[0].name}</p>
                            <p className="font-bold text-accent-green">{payload[0].value} kg</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {categoryPieData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="text-text-grey font-semibold truncate">{item.name}</span>
                    <span className="ml-auto font-bold text-text-charcoal">{item.value} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* System Integrity & Health */}
        <div className="premium-card p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-text-charcoal flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-accent-blue" />
              System Integrity
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-text-grey" />
                  <div>
                    <span className="text-xs font-bold text-text-charcoal block">Mock Database</span>
                    <span className="text-[10px] font-semibold text-text-grey">Local DB Persistence</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold text-accent-green bg-accent-green/10 rounded-full">
                  ONLINE
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-text-grey" />
                  <div>
                    <span className="text-xs font-bold text-text-charcoal block">Gemini AI Model</span>
                    <span className="text-[10px] font-semibold text-text-grey">Dynamic Reaction Engine</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold text-accent-blue bg-accent-blue/10 rounded-full">
                  ACTIVE
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50 border border-gray-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <CloudSun className="h-5 w-5 text-text-grey" />
                  <div>
                    <span className="text-xs font-bold text-text-charcoal block">Service Worker</span>
                    <span className="text-[10px] font-semibold text-text-grey">PWA Offline Intercepts</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[10px] font-bold text-accent-green bg-accent-green/10 rounded-full">
                  REGISTERED
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-text-grey">
            <span>Server CORS whitelist:</span>
            <span className="font-mono text-[10px] bg-gray-100 px-2 py-0.5 rounded text-text-charcoal">Port 5173 / 4173</span>
          </div>
        </div>

        {/* Top Active Custodians */}
        <div className="premium-card p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-text-charcoal flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-accent-amber" />
            Top Active Custodians
          </h2>
          
          <div className="divide-y divide-gray-100">
            {topUsers.length === 0 ? (
              <p className="text-sm font-semibold text-text-grey py-6 text-center">No guardians registered yet.</p>
            ) : (
              topUsers.map((user, index) => (
                <div key={user.userId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3.5">
                    <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      index === 0 ? 'bg-accent-amber/20 text-accent-amber' : 
                      index === 1 ? 'bg-gray-200/60 text-text-grey' : 
                      index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-text-grey'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-text-charcoal block">{user.userName}</span>
                      <span className="text-[10px] font-semibold text-text-grey uppercase tracking-wider">{user.teamName}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-bold text-text-charcoal block">{user.baseline_co2.toFixed(0)} kg CO₂</span>
                      <span className="text-[10px] font-semibold text-text-grey">Monthly Baseline</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-full font-bold text-xs">
                      <Flame className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                      <span>{user.streak}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Award, ShieldAlert, BarChart3, Users, Leaf, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Contributor {
  userId: string;
  userName: string;
  totalCo2: number;
}

interface AnalyticsData {
  daily_co2_by_team: any[];
  category_totals: Record<string, number>;
  top_contributors: Contributor[];
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/admin/analytics');
      if (res.ok) {
        const payload = await res.json();
        setData(payload);
      } else {
        throw new Error('Failed to load advanced system analytics.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Generating aggregated team metrics..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-black text-text-charcoal font-display">System Analytics</h1>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-semibold text-red-700">
          {error || 'No analytics data available.'}
        </div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-accent-blue text-white rounded-xl text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  // Calculate some analytics insights
  const { daily_co2_by_team, category_totals, top_contributors } = data;

  // Extract all distinct team keys for the stacked bar chart (excluding 'date')
  const teamKeysSet = new Set<string>();
  daily_co2_by_team.forEach(day => {
    Object.keys(day).forEach(key => {
      if (key !== 'date') {
        teamKeysSet.add(key);
      }
    });
  });
  const teamKeys = Array.from(teamKeysSet);

  // Colors for the stacked bars
  const BAR_COLORS = ['#2E90FA', '#16A34A', '#F59E0B', '#DC2626', '#8B5CF6', '#EC4899', '#14B8A6'];

  // Prepare category data for PieChart
  const CATEGORY_COLORS: Record<string, string> = {
    transport: '#2E90FA',
    food: '#16A34A',
    energy: '#F59E0B',
    flights: '#DC2626',
    challenge: '#8B5CF6',
    other: '#9CA3AF'
  };

  const categoryPieData = Object.entries(category_totals).map(([key, val]) => ({
    name: key.toUpperCase(),
    value: val,
    color: CATEGORY_COLORS[key.toLowerCase()] || '#9CA3AF'
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
            Planetary Analytics
          </h1>
          <p className="text-sm font-semibold text-text-grey mt-1">
            Aggregated system-wide carbon footprint profiles, team performance, and leadership standing.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-text-charcoal font-bold text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer select-none active:scale-95 w-fit"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Main Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Stacked Team Bar Chart */}
        <div className="premium-card p-6 lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-text-charcoal flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent-blue" />
            7-Day Team Emissions Distribution (kg CO₂)
          </h2>
          {daily_co2_by_team.length === 0 || teamKeys.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-text-grey text-xs font-semibold">
              No team activity logs recorded this week.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily_co2_by_team} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid vertical={false} stroke="#F1F5F9" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#9CA3AF" tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#9CA3AF" tickLine={false} tick={{ fontSize: 10 }} unit="kg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  {teamKeys.map((team, idx) => (
                    <Bar
                      key={team}
                      dataKey={team}
                      stackId="a"
                      fill={BAR_COLORS[idx % BAR_COLORS.length]}
                      radius={idx === teamKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Contributors List */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-charcoal flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-accent-amber" />
              Highest Emission Accounts
            </h2>
            <div className="divide-y divide-gray-100">
              {top_contributors.length === 0 ? (
                <p className="text-xs font-semibold text-text-grey py-6 text-center">
                  No log entries recorded.
                </p>
              ) : (
                top_contributors.map((c, idx) => (
                  <div key={c.userId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="h-5 w-5 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-text-charcoal block">{c.userName}</span>
                    </div>
                    <span className="text-xs font-bold text-text-charcoal">{c.totalCo2.toFixed(1)} kg CO₂</span>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3.5 mt-4 text-[10px] text-amber-700 font-semibold flex gap-2">
            <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
            <span>Use this list to identify high-emission individuals or organizations requiring targeted environmental training.</span>
          </div>
        </div>

      </div>

      {/* Category Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Category distribution */}
        <div className="premium-card p-6 space-y-4">
          <h2 className="text-base font-bold text-text-charcoal flex items-center gap-2">
            <Leaf className="h-5 w-5 text-accent-green" />
            Category Impact Ratios
          </h2>
          {categoryPieData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-grey text-xs font-semibold">
              No categories recorded yet.
            </div>
          ) : (
            <div className="h-48 flex items-center gap-6">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryPieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {categoryPieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-grey font-semibold truncate">{item.name}</span>
                    <span className="ml-auto font-bold text-text-charcoal">{item.value.toFixed(1)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Team Standings Overview */}
        <div className="premium-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-text-charcoal flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-accent-blue" />
              Impact Summary Insights
            </h2>
            <div className="space-y-3.5 text-xs text-text-charcoal font-semibold">
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-text-grey">Dominant Footprint Sector</span>
                <span className="text-accent-blue">
                  {categoryPieData.length > 0 ? categoryPieData[0].name : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span className="text-text-grey">Highest Impact Team (Today)</span>
                <span className="text-accent-green">
                  {(() => {
                    if (daily_co2_by_team.length === 0) return 'N/A';
                    const lastDay = daily_co2_by_team[daily_co2_by_team.length - 1];
                    let maxTeam = 'N/A';
                    let maxVal = -1;
                    Object.entries(lastDay).forEach(([k, v]) => {
                      if (k !== 'date' && typeof v === 'number' && v > maxVal) {
                        maxVal = v;
                        maxTeam = k;
                      }
                    });
                    return maxTeam;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-grey">Total Managed Emissions</span>
                <span>
                  {Object.values(category_totals).reduce((a, b) => a + b, 0).toFixed(1)} kg CO₂
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

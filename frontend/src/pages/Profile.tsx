import { useState } from 'react';
import { useFootprint } from '../hooks/useFootprint';
import { Award, Flame, BarChart2, CheckCircle2, PenTool } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface ProfileProps {
  user: any;
  onUpdateUsername: (name: string) => void;
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Profile({ user, onUpdateUsername }: ProfileProps) {
  const { logs, insights, loading } = useFootprint(user?.userId);
  const [nameInput, setNameInput] = useState(user?.userName || '');
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nameInput.trim();
    if (!clean) return;
    onUpdateUsername(clean);
    setIsEditingName(false);
  };

  if (loading || !insights) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        <p className="text-gray-400 text-xs">Loading carbon diary...</p>
      </div>
    );
  }

  // 1. Group logs by date for Bar Chart
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });

    // sum logs for this day
    const dayLogs = logs.filter(l => l.timestamp.startsWith(dateStr));
    const co2 = dayLogs.reduce((sum, l) => sum + l.co2_kg, 0);

    return {
      date: label,
      co2: Number(co2.toFixed(1))
    };
  }).reverse();

  // 2. Group logs by category for Pie Chart
  const categoryMap: Record<string, number> = {};
  logs.forEach(l => {
    const cat = l.category.toUpperCase();
    if (l.co2_kg > 0) {
      categoryMap[cat] = (categoryMap[cat] || 0) + l.co2_kg;
    }
  });

  const categoryData = Object.keys(categoryMap).map(key => ({
    name: key,
    value: Number(categoryMap[key].toFixed(1))
  }));

  // Badges catalog
  const badgesList = [
    { id: "Carbon Onboarder", title: "Carbon Onboarder", desc: "Completed the initial 5-step carbon baseline assessment.", icon: "🌱" },
    { id: "Streak Master", title: "Streak Master", desc: "Maintained a streak of 5+ days of eco accomplishments.", icon: "🔥" },
    { id: "Eco Enthusiast", title: "Eco Enthusiast", desc: "Completed 3+ ecological action library challenges.", icon: "🏆" }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Profile Overview Banner */}
      <div className="glass-card p-6 md:p-8 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center text-3xl font-black text-emerald-400">
            {user?.userName ? user.userName[0].toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            {isEditingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="bg-gray-950 border border-white/5 rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-500 text-gray-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <span>{user?.userName || 'EcoWarrior'}</span>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <PenTool className="h-3.5 w-3.5" />
                </button>
              </h2>
            )}
            <p className="text-xs text-gray-400">
              Team: <strong className="text-emerald-400 font-semibold">{user?.teamName || 'Independent'}</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none p-4 rounded-xl bg-white/5 border border-white/5 text-center min-w-[100px]">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Streak</span>
            <div className="text-xl font-mono font-black text-orange-400 flex items-center justify-center gap-1 mt-1">
              <Flame className="h-4 w-4 fill-orange-500/10" />
              <span>{insights.streak} Days</span>
            </div>
          </div>
          <div className="flex-1 md:flex-none p-4 rounded-xl bg-white/5 border border-white/5 text-center min-w-[120px]">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Annual baseline</span>
            <div className="text-xl font-mono font-black text-white mt-1">
              {(user?.baseline_co2 * 12 / 1000).toFixed(1)} <span className="text-xs text-gray-500 font-normal">t/yr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Charts Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily Trend */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-emerald-400" />
              <span>7-Day Emission Trend</span>
            </h3>
            
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysData}>
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" unit="kg" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="co2" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Share & History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Pie */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Emission Share</h3>
              <div className="h-48 w-full relative flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-gray-500 italic">No carbon logs registered yet</span>
                )}
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Total</span>
                  <span className="text-sm font-bold text-white">
                    {categoryData.reduce((sum, item) => sum + item.value, 0).toFixed(0)} kg
                  </span>
                </div>
              </div>
            </div>

            {/* Category Breakdown legend */}
            <div className="glass-card p-6 border border-white/5 space-y-3 flex flex-col justify-center">
              <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Impact Breakdown</h4>
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-300 font-semibold">{item.name}</span>
                  </div>
                  <span className="text-white font-mono font-bold">{item.value} kg CO₂</span>
                </div>
              ))}
              {categoryData.length === 0 && (
                <p className="text-xs text-gray-500 italic">No categories tracked this week.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Badges Cabinet Column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border border-white/5 space-y-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-emerald-400" />
              <span>Earned Badges Cabinet</span>
            </h3>

            <div className="space-y-4">
              {badgesList.map(badge => {
                const isEarned = user?.badges?.includes(badge.id);

                return (
                  <div 
                    key={badge.id}
                    className={`p-4 rounded-xl border flex gap-4 items-start transition-all ${
                      isEarned 
                        ? 'border-emerald-500/20 bg-emerald-500/5' 
                        : 'border-white/5 bg-white/5 opacity-40'
                    }`}
                  >
                    <span className="text-3xl mt-1 select-none">{badge.icon}</span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{badge.title}</span>
                        {isEarned && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 fill-emerald-500/10" />}
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

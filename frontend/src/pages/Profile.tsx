import { useState } from 'react';
import { useFootprint } from '../hooks/useFootprint';
import { Award, Flame, BarChart2, CheckCircle2, PenTool, Share2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface ProfileProps {
  user: any;
  onUpdateUsername: (name: string) => void;
}

const COLORS = ['#2E90FA', '#16A34A', '#F59E0B', '#DC2626', '#8b5cf6'];

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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-blue border-t-transparent" />
        <p className="text-text-grey text-xs">Loading carbon diary...</p>
      </div>
    );
  }

  // 1. Group logs by date for Area Chart
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
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Profile Overview Banner */}
        <div className="premium-card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-3xl font-black text-accent-blue">
              {user?.userName ? user.userName[0].toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              {isEditingName ? (
                <form onSubmit={handleSaveName} className="flex gap-2" role="group" aria-label="Edit display name">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    aria-label="New display name"
                    className="border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-text-charcoal focus:outline-none focus:border-accent-blue bg-bg-base"
                    autoFocus
                  />
                  <button
                    type="submit"
                    aria-label="Save new display name"
                    className="px-3 py-1.5 bg-accent-blue text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Save
                  </button>
                </form>
              ) : (
                <h2 className="text-2xl font-bold text-text-charcoal flex items-center gap-2">
                  <span>{user?.userName || 'EcoWarrior'}</span>
                  <button 
                    onClick={() => setIsEditingName(true)}
                    aria-label="Edit display name"
                    className="text-text-grey hover:text-text-charcoal transition-colors cursor-pointer"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                  </button>
                </h2>
              )}
              <p className="text-xs text-text-grey font-semibold">
                Team: <strong className="text-accent-blue font-bold">{user?.teamName || 'Independent'}</strong>
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none p-4 rounded-xl bg-bg-base border border-gray-200/60 text-center min-w-[110px]">
              <span className="text-[10px] text-text-grey uppercase font-bold block">Streak</span>
              <div className="text-xl font-bold text-accent-amber flex items-center justify-center gap-1 mt-1">
                <Flame className="h-4 w-4 fill-accent-amber/15" />
                <span>{insights.streak} Days</span>
              </div>
            </div>
            <div className="flex-1 md:flex-none p-4 rounded-xl bg-bg-base border border-gray-200/60 text-center min-w-[130px]">
              <span className="text-[10px] text-text-grey uppercase font-bold block">Annual baseline</span>
              <div className="text-xl font-bold text-text-charcoal mt-1">
                {(user?.baseline_co2 * 12 / 1000).toFixed(1)} <span className="text-xs text-text-grey font-semibold">t/yr</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid: Charts & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Charts Column */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Daily Area Trend */}
            <div className="premium-card p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-charcoal flex items-center gap-1.5 font-display">
                <BarChart2 className="h-4.5 w-4.5 text-accent-blue" />
                <span>7-Day Emission Trend</span>
              </h3>
              
              <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysData} margin={{ left: -10, right: 10 }}>
                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" unit="kg" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                      labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="co2" stroke="#2E90FA" fill="rgba(46, 144, 250, 0.1)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Share & Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Category Pie */}
              <div className="premium-card p-6 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-text-charcoal font-display">Emission Share</h3>
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
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <span className="text-xs text-text-grey italic">No carbon logs registered yet</span>
                  )}
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-text-grey uppercase tracking-widest font-bold">Total</span>
                    <span className="text-base font-bold text-text-charcoal">
                      {categoryData.reduce((sum, item) => sum + item.value, 0).toFixed(0)} kg
                    </span>
                  </div>
                </div>
              </div>

              {/* Impact Breakdown */}
              <div className="premium-card p-6 space-y-3 flex flex-col justify-center">
                <h4 className="text-xs font-bold uppercase text-text-grey tracking-wider mb-2">Impact Breakdown</h4>
                {categoryData.map((item, idx) => (
                  <div key={item.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-text-charcoal font-semibold">{item.name}</span>
                    </div>
                    <span className="text-text-charcoal font-mono font-bold">{item.value} kg CO₂</span>
                  </div>
                ))}
                {categoryData.length === 0 && (
                  <p className="text-xs text-text-grey italic">No categories tracked this week.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Badges & Certificate Column */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Badges Cabinet */}
            <div className="premium-card p-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-text-charcoal flex items-center gap-1.5 font-display">
                <Award className="h-4.5 w-4.5 text-accent-blue" />
                <span>Badges Cabinet</span>
              </h3>

              <div className="space-y-4">
                {badgesList.map(badge => {
                  const isEarned = user?.badges?.includes(badge.id);

                  return (
                    <div 
                      key={badge.id}
                      className={`p-4 rounded-xl border flex gap-4 items-start transition-all ${
                        isEarned 
                          ? 'border-accent-green/20 bg-accent-green/5' 
                          : 'border-gray-200/60 bg-white opacity-40'
                      }`}
                    >
                      {/* Circular icon chip */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0 bg-white shadow-sm border border-gray-100`}>
                        {badge.icon}
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-text-charcoal flex items-center gap-1.5">
                          <span>{badge.title}</span>
                          {isEarned && <CheckCircle2 className="h-3.5 w-3.5 text-accent-green fill-accent-green/10" />}
                        </h4>
                        <p className="text-[11px] text-text-grey leading-relaxed font-medium">{badge.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Certificate of Progress */}
            <div className="border-2 border-accent-blue/40 bg-white rounded-2xl p-6 relative overflow-hidden shadow-sm flex flex-col justify-between min-h-[190px]">
              {/* Background decorative sky image snippet */}
              <div 
                className="absolute right-0 top-0 w-28 h-28 bg-[url('/assets/sky.png')] bg-cover bg-center rounded-bl-3xl border-l border-b border-gray-200 opacity-80" 
                style={{ backgroundImage: `url('/assets/sky.png')` }}
              />
              
              <div className="space-y-2 max-w-[70%] z-10">
                <span className="text-[9px] uppercase font-bold text-accent-blue tracking-widest block">Certificate of Progress</span>
                <h3 className="text-base font-bold text-text-charcoal leading-tight font-display">TerraWatch Environmental Ambassador</h3>
                <p className="text-[11px] text-text-grey leading-relaxed font-medium">
                  This certifies that <strong className="text-text-charcoal font-bold">{user?.userName || 'EcoWarrior'}</strong> has maintained a daily tracking schedule with an annual carbon budget baseline of <strong className="text-text-charcoal font-bold">{(user?.baseline_co2 * 12 / 1000).toFixed(1)} tons</strong>.
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-4 z-10">
                <span className="text-[10px] text-text-grey font-semibold">Verified by TerraWatch Engine</span>
                <button className="flex items-center gap-1 text-[10px] font-bold text-accent-blue bg-accent-blue/10 px-2.5 py-1 rounded-full cursor-pointer hover:bg-accent-blue/20">
                  <Share2 className="h-3 w-3" />
                  <span>Share Progress</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

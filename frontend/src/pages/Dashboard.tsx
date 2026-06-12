import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Globe from '../components/Globe';
import { Flame, Sparkles, Plus, TrendingDown, HelpCircle, Activity } from 'lucide-react';

interface DashboardProps {
  user: any;
  insights: any;
  loading: boolean;
  onQuickLog: (category: string, subtype: string, amount: number, desc: string) => Promise<any>;
}

export default function Dashboard({ user, insights, loading, onQuickLog }: DashboardProps) {
  const handleQuickLog = async (category: string, subtype: string, amount: number, label: string) => {
    if (window.confirm(`Quick log: 1 ${label}?`)) {
      await onQuickLog(category, subtype, amount, `Quick logged: ${label}`);
      alert(`${label} logged successfully!`);
    }
  };

  if (loading || !insights) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        <p className="text-gray-400 text-sm">Syncing with the Living World...</p>
      </div>
    );
  }

  const status = insights.living_world_status || 'healthy';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Welcome back, <span className="text-emerald-400 font-extrabold">{user?.userName || 'EcoWarrior'}</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Your daily choices shape the virtual environment. Make them count.
          </p>
        </div>
        
        {/* Streak & Score pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 glass-card px-4 py-2 border border-white/5 font-semibold text-sm">
            <Flame className="text-orange-500 h-4 w-4 fill-orange-500 animate-pulse" />
            <span className="text-gray-300">Streak:</span>
            <span className="text-orange-400 font-black">{insights.streak} days</span>
          </div>

          <Link
            to="/log"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm shadow-md shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Log Action</span>
          </Link>
        </div>
      </div>

      {/* Main Grid: Globe on Left/Top, Insights & Stats on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: The Globe Hero */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <Globe status={status} />
          
          {/* Quick-log Shortcuts */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="text-emerald-400 h-4 w-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Quick Logger Shortcuts</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { category: 'food', subtype: 'vegan', amount: 1, label: 'Vegan Meal', icon: '🥗' },
                { category: 'transport', subtype: 'bicycle', amount: 5, label: '5km Cycle', icon: '🚲' },
                { category: 'energy', subtype: 'lighting', amount: 8, label: 'LED Lights', icon: '💡' },
                { category: 'transport', subtype: 'public_transport', amount: 10, label: '10km Bus', icon: '🚌' }
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickLog(item.category, item.subtype, item.amount, item.label)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl flex flex-col items-center gap-2 transition-all cursor-pointer"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-xs text-gray-300 text-center font-medium leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Score & Gemini Insights */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 7-day footprint score card */}
          <div className="glass-card p-6 border border-white/5 relative overflow-hidden flex justify-between items-center">
            {/* Background design elements */}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-emerald-500/5 blur-xl pointer-events-none" />
            
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">7-Day Rolling Footprint</span>
              <div className="text-4xl font-black text-white mt-1">
                {insights.rolling_score_kg} <span className="text-lg font-normal text-gray-500">kg CO₂</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400 font-semibold">
                <TrendingDown className="h-3 w-3" />
                <span>Includes grid base calculations</span>
              </div>
            </div>
            
            {/* Benchmark display */}
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Equivalent to</span>
              <div className="text-sm font-bold text-gray-300 mt-1">
                {insights.rolling_score_kg > 200 ? '🔥 Charcoal burn' : '🌱 Young Seedlings'}
              </div>
              <span className="text-[11px] text-gray-500 block">
                {insights.rolling_score_kg > 200 
                  ? 'Exceeds regional budget'
                  : 'On track for net zero'
                }
              </span>
            </div>
          </div>

          {/* Gemini AI Coaching Insights Card */}
          <div className="glass-card p-6 border border-white/5 space-y-4 flex-grow flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-emerald-400 h-4.5 w-4.5 fill-emerald-400/20" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gemini Insight Coach</h3>
                </div>
                <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full font-bold">
                  AI Tailored
                </span>
              </div>

              {/* Nudge list */}
              <div className="space-y-4">
                {insights.nudges && insights.nudges.map((nudge: string, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 leading-relaxed"
                  >
                    {nudge}
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="h-3.5 w-3.5" />
                Why these metrics?
              </span>
              <span>Gemini v2.5 Coach</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

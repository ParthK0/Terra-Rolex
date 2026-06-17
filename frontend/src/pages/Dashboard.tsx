import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Plus, Activity, Sun, Info } from 'lucide-react';
import { useState } from 'react';

interface DashboardProps {
  user: any;
  insights: any;
  loading: boolean;
  onQuickLog: (category: string, subtype: string, amount: number, desc: string) => Promise<any>;
}

export default function Dashboard({ user, insights, loading, onQuickLog }: DashboardProps) {
  const [quickLogFeedback, setQuickLogFeedback] = useState<string | null>(null);

  const handleQuickLog = async (category: string, subtype: string, amount: number, label: string) => {
    setQuickLogFeedback(null);
    try {
      await onQuickLog(category, subtype, amount, `Quick logged: ${label}`);
      setQuickLogFeedback(`${label} logged successfully!`);
      setTimeout(() => {
        setQuickLogFeedback(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      setQuickLogFeedback(`Failed to log ${label}. Please try again.`);
      setTimeout(() => {
        setQuickLogFeedback(null);
      }, 4000);
    }
  };

  if (loading || !insights) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
        <p className="text-text-grey text-sm">Syncing with the Living World...</p>
      </div>
    );
  }

  const score = insights.rolling_score_kg || 0;
  const status = insights.living_world_status || 'healthy';

  // Determine color status of the disc based on user's rolling score
  let discColor = "bg-accent-green border-white";
  let statusText = "Clear Air";
  let statusHaze = false;
  
  if (score > 200) {
    discColor = "bg-accent-red border-white";
    statusText = "Hazy Sky";
    statusHaze = true;
  } else if (score > 100) {
    discColor = "bg-accent-amber border-white";
    statusText = "Moderate";
  }

  // Generate SVG path for a 7-day sparkline trend
  const sparklinePoints = [
    { x: 10, y: 50 + (score * 0.05) },
    { x: 40, y: 45 + (score * 0.04) },
    { x: 70, y: 55 + (score * 0.06) },
    { x: 100, y: 35 + (score * 0.03) },
    { x: 130, y: 40 + (score * 0.04) },
    { x: 160, y: 25 + (score * 0.02) },
    { x: 190, y: 20 + (score * 0.01) }
  ];
  
  const sparklinePath = `M ${sparklinePoints.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  // Default fallback nudges if Gemini returns empty or backend is loading
  const defaultNudges = [
    "Your transport footprint is 12% lower than yesterday. Keep up the cycling!",
    "Opting for energy-efficient lighting today could save 1.5kg of carbon.",
    "A local dietary choice today will help reach your weekly budget goals."
  ];
  const nudgesToDisplay = (insights.nudges && insights.nudges.length > 0) 
    ? insights.nudges.slice(0, 3) 
    : defaultNudges;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      {quickLogFeedback && (
        <div 
          role="status" 
          className="p-4 bg-accent-green/10 border border-accent-green/20 text-accent-green text-sm rounded-xl font-bold"
        >
          {quickLogFeedback}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-charcoal">
            Welcome back, <span className="text-accent-blue font-extrabold">{user?.userName || 'EcoWarrior'}</span>
          </h1>
          <p className="text-sm text-text-grey mt-1">
            Track and adapt your daily choices to clean the sky.
          </p>
        </div>
        
        {/* Quick action button */}
        <Link
          to="/log"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent-blue hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-accent-blue/10 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Log Activity</span>
        </Link>
      </div>

      {/* Main Grid: Sky Hero + Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (col-span-8): Sky Hero */}
        <div className="lg:col-span-8 sky-hero-container relative h-[380px] rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200/60 shadow-sm">
          {statusHaze && <div className="absolute inset-0 sky-haze-overlay pointer-events-none transition-all duration-500" />}
          
          {/* Centered Atmosphere Weather-Style Disc */}
          <div className="relative flex flex-col items-center justify-center text-center z-10">
            <div className={`w-32 h-32 rounded-full border-4 ${discColor} shadow-xl flex flex-col items-center justify-center transition-all duration-500`}>
              <Sun className="h-6 w-6 text-white mb-1 animate-spin-slow" />
              <span className="text-[10px] text-white tracking-widest uppercase font-bold">{statusText}</span>
            </div>
            <span className="mt-4 px-3.5 py-1 bg-white/95 rounded-full text-xs font-bold text-text-charcoal border border-gray-200/50 shadow-sm">
              Today's Quality Index: {status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Right Column (col-span-4): Premium Stat Panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="premium-card p-6 flex flex-col justify-between h-full space-y-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider">7-Day Rolling Footprint</span>
              <div className="text-5xl font-black text-text-charcoal mt-1 tracking-tight">
                {score} <span className="text-xl font-normal text-text-grey">kg CO₂</span>
              </div>
            </div>

            {/* Sparkline visualization */}
            <div>
              <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider block mb-2">7-Day Trend</span>
              <div className="h-14 w-full bg-bg-base rounded-lg border border-gray-200/40 p-2 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 200 80">
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="#2E90FA"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Streak & Benchmark */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200/40">
              <div className="flex items-center gap-1.5">
                <Flame className="text-accent-amber h-4 w-4 fill-accent-amber" />
                <span className="text-xs text-text-charcoal font-bold">{insights.streak} Day Streak</span>
              </div>
              <span className="text-xs font-bold text-accent-green bg-accent-green/10 px-2.5 py-0.5 rounded-full">
                {score < 150 ? 'On Track' : 'Over Budget'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Horizon section: Three Tactical AI Nudges */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5">
          <Sparkles className="text-accent-blue h-4.5 w-4.5 fill-accent-blue/15" />
          <h2 className="text-lg font-bold text-text-charcoal">Gemini AI Coach Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nudgesToDisplay.map((nudge: string, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="premium-card premium-card-hover p-6 flex flex-col justify-between space-y-4"
            >
              <div className="p-2 w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                <Sparkles className="text-accent-blue h-4 w-4" />
              </div>
              <p className="text-xs text-text-charcoal leading-relaxed font-medium">
                {nudge}
              </p>
              <div className="text-[10px] text-text-grey font-bold flex items-center gap-1">
                <Info className="h-3.5 w-3.5" />
                <span>Coach Recommendation</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick-log Shortcuts */}
      <div className="premium-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="text-accent-blue h-4 w-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-charcoal">Quick Logger Shortcuts</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { category: 'food', subtype: 'vegan', amount: 1, label: 'Vegan Meal', icon: '🥗' },
            { category: 'transport', subtype: 'bicycle', amount: 5, label: '5km Cycle', icon: '🚲' },
            { category: 'energy', subtype: 'lighting', amount: 8, label: 'LED Lights', icon: '💡' },
            { category: 'transport', subtype: 'public_transport', amount: 10, label: '10km Bus', icon: '🚌' }
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickLog(item.category, item.subtype, item.amount, item.label)}
              className="premium-card premium-card-hover p-4 flex flex-col items-center gap-2 text-center cursor-pointer border border-gray-200/50 hover:bg-bg-base"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-text-charcoal font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

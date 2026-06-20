import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Sparkles, Info, CheckCircle2,
  Leaf, Bus, Snowflake, Lightbulb, ChevronDown, Check, AlertTriangle, AlertOctagon, Clock
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import DashboardSkeleton from '../components/DashboardSkeleton';
import SkyBackdrop from '../components/SkyBackdrop';
import LocalCarbonMap from '../components/LocalCarbonMap';
import type { UserProfile } from '../hooks/useAuth';
import type { InsightState, LogEntry } from '../hooks/useFootprint';


// ── Animated count-up number ──────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    if (startValue === endValue) return;

    let startTime: number | null = null;
    const duration = 800; // ms

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // easeOutQuad
      const easeProgress = progress * (2 - progress);
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      
      setDisplay(Math.round(currentValue));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return <>{display}</>;
}

// ── Quick log actions ─────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { category: 'food',      subtype: 'vegan',            amount: 1,  label: 'Vegan Meal',   Icon: Leaf,      ariaLabel: 'Log a vegan meal' },
  { category: 'transport', subtype: 'public_transport', amount: 10, label: '10 km Bus',    Icon: Bus,       ariaLabel: 'Log 10km bus journey' },
  { category: 'energy',    subtype: 'ac',               amount: 4,  label: 'AC Off · 4h', Icon: Snowflake, ariaLabel: 'Log AC off for 4 hours' },
  { category: 'energy',    subtype: 'lighting',         amount: 6,  label: 'LED Lights',  Icon: Lightbulb, ariaLabel: 'Log LED lighting switch' },
] as const;

interface DashboardProps {
  user: UserProfile | null;
  insights: InsightState | null;
  loading: boolean;
  logs: LogEntry[];
  onQuickLog: (category: string, subtype: string, amount: number, desc: string) => Promise<any>;
}

export default function Dashboard({ user, insights, loading, logs, onQuickLog }: DashboardProps) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastOk, setToastOk] = useState(true);

  // Hour override for live preview scrubber
  const [hourOverride, setHourOverride] = useState<number | undefined>(undefined);

  const analyticsRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string, ok = true) => {
    setToastMsg(msg); setToastOk(ok);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleQuickLog = async (
    category: string, subtype: string, amount: number, label: string
  ) => {
    try {
      await onQuickLog(category, subtype, amount, `Quick logged: ${label}`);
      showToast(`${label} registered`);
    } catch {
      showToast(`Failed to register ${label}`, false);
    }
  };

  const scrollToAnalytics = () => {
    analyticsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !insights) return <DashboardSkeleton />;

  const score: number  = insights.rolling_score_kg || 0;
  const WEEKLY_BUDGET  = 84; // 12 kg/day × 7

  // Semantic color signals
  let statusColor = '#10B981'; // vibrant emerald green
  let statusBg = 'bg-emerald-500/20';
  let statusBorder = 'border-emerald-500/30';
  let statusText = 'text-emerald-300';
  let caption   = 'Clear Sky · Healthy';
  let StatusIcon = Check;

  if (score > 120) {
    statusColor = '#EF4444'; // vibrant crimson red
    statusBg = 'bg-red-500/20';
    statusBorder = 'border-red-500/30';
    statusText = 'text-red-300';
    caption = 'Heavy Haze · Action Needed';
    StatusIcon = AlertOctagon;
  } else if (score > 70) {
    statusColor = '#F59E0B'; // warm amber orange
    statusBg = 'bg-amber-500/20';
    statusBorder = 'border-amber-500/30';
    statusText = 'text-amber-300';
    caption = 'Light Haze · Moderate';
    StatusIcon = AlertTriangle;
  }

  // Budget ring calculations (SVG circle math)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const percentUsed = Math.min((score / WEEKLY_BUDGET) * 100, 100);
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  // ── Real 7-day sparkline from actual daily log aggregation ────────────────
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = (logs || []).filter((l: any) => l.timestamp?.startsWith(dateStr));
    const co2 = dayLogs.reduce((sum: number, l: any) => sum + (l.co2_kg || 0), 0);
    return Math.max(0, Number(co2.toFixed(1)));
  });

  // Map daily values to SVG points (viewBox 0 0 200 80, invert Y so higher = taller bar)
  const maxDay = Math.max(...last7DaysData, 1);
  const pts = last7DaysData.map((val, i) => ({
    x: 10 + i * 30,
    y: Math.max(5, 70 - (val / maxDay) * 60),
  }));
  const sparkPath = `M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  // ── Real category splits from actual logs ──────────────────────────────────
  const CATEGORY_COLOR_MAP: Record<string, string> = {
    transport:       '#2E90FA',
    food:            '#16A34A',
    energy:          '#F59E0B',
    flights:         '#DC2626',
    challenge:       '#8B5CF6',
    other:           '#9CA3AF',
  };
  const CATEGORY_LABEL_MAP: Record<string, string> = {
    transport:  'Commuting (Transport)',
    food:       'Meals (Food)',
    energy:     'Home Habits (Energy)',
    flights:    'Flights',
    challenge:  'Eco Challenges',
    other:      'Other',
  };

  const categoryTotals = (logs || []).reduce((acc: Record<string, number>, log: any) => {
    if ((log.co2_kg || 0) > 0) {
      const key = log.category?.toLowerCase() || 'other';
      acc[key] = (acc[key] || 0) + log.co2_kg;
    }
    return acc;
  }, {});

  const categoryTotal = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const categorySplits = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([key, val]) => ({
      label: CATEGORY_LABEL_MAP[key] ?? key,
      pct: categoryTotal > 0 ? Math.round((val / categoryTotal) * 100) : 0,
      color: CATEGORY_COLOR_MAP[key] ?? '#9CA3AF',
    }));

  const defaultNudges = [
    'Your transport footprint is 12% lower than yesterday. Keep cycling.',
    'Switching off energy-intensive appliances could save 1.5 kg today.',
    'A plant-based dinner tonight will keep you under your weekly target.',
  ];
  const nudges = (insights.nudges?.length > 0 ? insights.nudges : defaultNudges).slice(0, 3);

  const displayHour = hourOverride !== undefined ? hourOverride : new Date().getHours();

  return (
    <div className="relative min-h-screen bg-transparent text-text-charcoal overflow-x-hidden">

      {/* ── Floating Toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            role="status" aria-live="polite"
            className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white premium-card rounded-2xl shadow-xl"
          >
            <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${toastOk ? 'bg-accent-green/10' : 'bg-accent-red/10'}`}>
              <CheckCircle2 className={`h-4 w-4 ${toastOk ? 'text-accent-green' : 'text-accent-red'}`} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-text-charcoal">Activity Synchronized</p>
              <p className="text-[10px] text-text-grey">{toastMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          1. HERO LANDING VIEW (Dynamic Sky Backdrop)
      ════════════════════════════════════════════════════════════════════════ */}
      <SkyBackdrop hourOverride={hourOverride}>
        {/* Welcome Header & Time Scrubber */}
        <div className="max-w-6xl mx-auto w-full px-6 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-display drop-shadow-sm">
              Welcome back, <span className="text-white underline decoration-white/40 decoration-2">{user?.userName || 'EcoWarrior'}</span>
            </h1>
            <p className="text-xs text-white/80 mt-1 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Living sky atmosphere updates in real-time with local hours
            </p>
          </div>

          {/* Premium Glassmorphic Time Scrubber */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 rounded-2xl shadow-lg w-full md:w-auto">
            <Clock className="w-4 h-4 text-white/80 shrink-0" />
            <div className="flex flex-col gap-1 w-full md:w-36">
              <div className="flex justify-between items-center text-[10px] text-white/90 font-bold uppercase tracking-wider">
                <span>Simulate Hour</span>
                <span>{displayHour.toString().padStart(2, '0')}:00</span>
              </div>
              <input
                type="range"
                min="0"
                max="23"
                value={displayHour}
                onChange={(e) => setHourOverride(parseInt(e.target.value))}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
            {hourOverride !== undefined && (
              <button
                onClick={() => setHourOverride(undefined)}
                className="text-[9px] font-extrabold uppercase bg-white text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                title="Reset to live system clock"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* 3-Column Glassmorphic Grid */}
        <div className="flex-grow flex items-center justify-center py-6">
          <div className="max-w-6xl w-full px-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* Card 1: Apple style circular budget ring */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Track ring */}
                  <circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="12"
                  />
                  {/* Active progress ring */}
                  <motion.circle
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="transparent"
                    stroke={statusColor}
                    strokeWidth="12"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Central Labels */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-white font-display leading-none">
                    {Math.round(percentUsed)}%
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-white/70 mt-1">
                    Used
                  </span>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider mt-4">
                Rolling weekly Carbon Budget
              </span>
            </div>

            {/* Card 2: Budget status and details */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest block">Carbon Budget Status</span>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${statusBg} ${statusBorder} border flex items-center justify-center`}>
                    <StatusIcon className={`h-4.5 w-4.5 ${statusText}`} />
                  </div>
                  <h3 className="text-base font-bold text-white font-display leading-tight">
                    {caption}
                  </h3>
                </div>
              </div>

              {/* Budget Details */}
              <div className="space-y-3.5 flex-grow flex flex-col justify-end">
                <div className="flex justify-between items-baseline text-white">
                  <span className="text-sm font-bold">
                    {Math.round(score)} kg CO₂ <span className="text-xs text-white/70 font-medium">used</span>
                  </span>
                  <span className="text-xs text-white/75 font-medium">
                    Limit: {WEEKLY_BUDGET} kg
                  </span>
                </div>

                {/* Horizontal budget progress bar */}
                <div className="relative">
                  <div className="h-2.5 w-full bg-white/10 border border-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${percentUsed}%`, backgroundColor: statusColor }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-white/60 font-bold mt-1.5">
                    <span>0 kg</span>
                    <span>{Math.round(WEEKLY_BUDGET / 2)} kg</span>
                    <span>{WEEKLY_BUDGET} kg</span>
                  </div>
                </div>

                {/* Remaining budget helper text */}
                <p className="text-xs text-white/80 leading-relaxed font-semibold">
                  {score < WEEKLY_BUDGET ? (
                    <>You have <strong className="text-[#10B981] font-extrabold">{Math.round(WEEKLY_BUDGET - score)} kg</strong> left before exceeding your weekly target.</>
                  ) : (
                    <>You are <strong className="text-red-300 font-extrabold">{Math.round(score - WEEKLY_BUDGET)} kg</strong> over your weekly target budget limit.</>
                  )}
                </p>
              </div>
            </div>

            {/* Card 3: Interactive local Google Map */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-xl flex flex-col justify-between space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/70 tracking-widest block">Local Green Grid</span>
                  <h3 className="text-xs font-bold text-white">Interactive Eco Map</h3>
                </div>
                <span className="text-[8px] bg-white/10 border border-white/25 text-white font-extrabold uppercase px-1.5 py-0.5 rounded">
                  Live GPS
                </span>
              </div>
              
              {/* Maps View element */}
              <LocalCarbonMap />
            </div>

          </div>
        </div>

        {/* Scroll Indicator Guide Pill */}
        <div className="pb-8 flex justify-center z-10 relative">
          <button
            onClick={scrollToAnalytics}
            className="px-5 py-2.5 rounded-full bg-text-charcoal text-white hover:bg-black transition-all text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
          >
            <span>Explore Analytics & Quick Logs</span>
            <ChevronDown className="w-4 h-4 text-white/90" />
          </button>
        </div>

      {/* ── Below the fold analytics cards ─────────────────────────────────── */}
      <div ref={analyticsRef} className="max-w-6xl mx-auto px-6 py-12 space-y-10 scroll-mt-6">

        {/* Analytics Section Cards: Fade in on viewport entrance */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main 7-Day Trend Chart & Category Splits */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 7-Day Roll Details Card */}
            <div className="premium-card p-6 bg-white space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-text-grey">
                    7-Day Rolling Footprint
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-text-charcoal font-display">
                      <AnimatedNumber value={score} />
                    </span>
                    <span className="text-xs text-text-grey font-semibold">kg CO₂ total</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border animate-none"
                    style={{ borderColor: `${statusColor}20`, backgroundColor: `${statusColor}10`, color: statusColor }}
                  >
                    {score < WEEKLY_BUDGET ? 'On Track' : 'Over Budget'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-text-grey font-bold">
                    <Flame className="w-3.5 h-3.5 text-accent-blue" />
                    <span>{insights.streak ?? 0} Day Streak</span>
                  </div>
                </div>
              </div>

              {/* Sparkline Graph */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest font-bold text-text-grey flex items-center gap-1">
                  7-Day Trend Sparkline
                </p>
                <div className="h-28 w-full bg-gray-50 border border-gray-100 rounded-2xl p-4">
                  <svg className="w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <path
                      d={sparkPath}
                      fill="none"
                      stroke={statusColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-draw-in"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Quick Action Logger */}
            <div className="premium-card p-6 bg-white space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-text-grey">
                Quick Action Logger
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {QUICK_ACTIONS.map(({ category, subtype, amount, label, Icon, ariaLabel }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickLog(category, subtype, amount, label)}
                    aria-label={ariaLabel}
                    className="premium-card premium-card-hover flex flex-col items-center gap-3 p-4 cursor-pointer text-center transition-all bg-[#F9FAFB]/50 border border-gray-100 hover:border-gray-200"
                  >
                    <div className="h-9 w-9 rounded-full bg-accent-blue/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-accent-blue" strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-bold text-text-charcoal leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Category breakdowns & AI recommendations */}
          <div className="lg:col-span-4 space-y-6">

            {/* Category split metrics — real data from logs */}
            <div className="premium-card p-6 bg-white space-y-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-text-grey">
                Footprint Category Splits
              </p>
              {categorySplits.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-text-grey font-semibold">No activity logged yet.</p>
                  <p className="text-[10px] text-text-grey/70 mt-1">Use the Log page to record your first carbon activity.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {categorySplits.map(item => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-text-charcoal">
                        <span>{item.label}</span>
                        <span>{item.pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Coach Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-accent-blue" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-text-grey">
                  Gemini AI Coach Insights
                </p>
              </div>
              <div className="flex flex-col gap-3">
                {nudges.map((nudge: string, i: number) => (
                  <div key={i} className="premium-card premium-card-hover p-4 bg-white flex flex-col gap-2.5 border border-gray-100/50">
                    <div className="h-7 w-7 rounded-lg bg-accent-blue/10 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-accent-blue" />
                    </div>
                    <p className="text-xs text-text-charcoal leading-relaxed font-semibold flex-1">{nudge}</p>
                    <div className="flex items-center gap-1 text-[9px] text-text-grey font-bold pt-1.5 border-t border-gray-50">
                      <Info className="h-3 w-3" />
                      <span>Coach Recommendation</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

      </div>
      </SkyBackdrop>
    </div>
  );
}

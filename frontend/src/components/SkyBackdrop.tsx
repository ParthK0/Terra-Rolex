import React from 'react';

export interface SkyTheme {
  gradient: string;
  sunAltitude: number; // percentage from bottom (0 to 100)
  sunOpacity: number;
  moonAltitude: number;
  moonOpacity: number;
  starsOpacity: number;
  cloudOpacity: number;
}

// ── 24-Hour Sky Configuration Map ─────────────────────────────────────────────
const HOURLY_THEMES: Record<number, SkyTheme> = {
  0:  { gradient: 'linear-gradient(135deg, #030712 0%, #080711 50%, #030712 100%)', sunAltitude: -30, sunOpacity: 0,   moonAltitude: 75, moonOpacity: 0.95, starsOpacity: 1.0, cloudOpacity: 0.1 },
  1:  { gradient: 'linear-gradient(135deg, #030712 0%, #090d16 50%, #030712 100%)', sunAltitude: -30, sunOpacity: 0,   moonAltitude: 65, moonOpacity: 0.95, starsOpacity: 1.0, cloudOpacity: 0.1 },
  2:  { gradient: 'linear-gradient(135deg, #030712 0%, #0f172a 60%, #090d16 100%)', sunAltitude: -30, sunOpacity: 0,   moonAltitude: 55, moonOpacity: 0.90, starsOpacity: 0.9, cloudOpacity: 0.1 },
  3:  { gradient: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 70%, #0f172a 100%)', sunAltitude: -30, sunOpacity: 0,   moonAltitude: 45, moonOpacity: 0.85, starsOpacity: 0.9, cloudOpacity: 0.15 },
  4:  { gradient: 'linear-gradient(135deg, #0f172a 0%, #311042 70%, #1e1b4b 100%)', sunAltitude: -20, sunOpacity: 0,   moonAltitude: 35, moonOpacity: 0.60, starsOpacity: 0.7, cloudOpacity: 0.2 },
  5:  { gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4a124c 60%, #c2410c 100%)', sunAltitude: 0,   sunOpacity: 0.4, moonAltitude: 20, moonOpacity: 0.20, starsOpacity: 0.4, cloudOpacity: 0.3 },
  6:  { gradient: 'linear-gradient(135deg, #312e81 0%, #581c87 40%, #db2777 75%, #f97316 100%)', sunAltitude: 10,  sunOpacity: 0.9, moonAltitude: 10, moonOpacity: 0.05, starsOpacity: 0.1, cloudOpacity: 0.4 },
  7:  { gradient: 'linear-gradient(135deg, #4338ca 0%, #701a75 40%, #ea580c 80%, #facc15 100%)', sunAltitude: 25,  sunOpacity: 1.0, moonAltitude: -10, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.5 },
  8:  { gradient: 'linear-gradient(135deg, #0284c7 0%, #0ea5e9 40%, #f59e0b 90%, #fef08a 100%)', sunAltitude: 40,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.6 },
  9:  { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 50%, #bae6fd 90%, #f0f9ff 100%)', sunAltitude: 55,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.7 },
  10: { gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #f0f9ff 100%)', sunAltitude: 70,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.8 },
  11: { gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 50%, #f0f9ff 100%)', sunAltitude: 82,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.8 },
  12: { gradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 60%, #f0f9ff 100%)', sunAltitude: 90,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.9 },
  13: { gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #bae6fd 100%)', sunAltitude: 80,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.8 },
  14: { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 60%, #fed7aa 100%)', sunAltitude: 68,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.8 },
  15: { gradient: 'linear-gradient(135deg, #0ea5e9 0%, #7dd3fc 50%, #fdba74 95%, #ffedd5 100%)', sunAltitude: 55,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.7 },
  16: { gradient: 'linear-gradient(135deg, #0284c7 0%, #f97316 70%, #fdba74 100%)', sunAltitude: 40,  sunOpacity: 1.0, moonAltitude: -30, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.6 },
  17: { gradient: 'linear-gradient(135deg, #1d4ed8 0%, #701a75 50%, #ea580c 85%, #facc15 100%)', sunAltitude: 25,  sunOpacity: 1.0, moonAltitude: -20, moonOpacity: 0,   starsOpacity: 0.0, cloudOpacity: 0.5 },
  18: { gradient: 'linear-gradient(135deg, #311042 0%, #701a75 40%, #be185d 70%, #f97316 100%)', sunAltitude: 10,  sunOpacity: 0.9, moonAltitude: -10, moonOpacity: 0.05, starsOpacity: 0.1, cloudOpacity: 0.4 },
  19: { gradient: 'linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #be185d 85%, #7c2d12 100%)', sunAltitude: -2,   sunOpacity: 0.3, moonAltitude: 15, moonOpacity: 0.30, starsOpacity: 0.3, cloudOpacity: 0.3 },
  20: { gradient: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 90%, #030712 100%)', sunAltitude: -15,  sunOpacity: 0,   moonAltitude: 30, moonOpacity: 0.60, starsOpacity: 0.6, cloudOpacity: 0.2 },
  21: { gradient: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 90%, #030712 100%)', sunAltitude: -30,  sunOpacity: 0,   moonAltitude: 45, moonOpacity: 0.75, starsOpacity: 0.8, cloudOpacity: 0.15 },
  22: { gradient: 'linear-gradient(135deg, #030712 0%, #090d16 50%, #0f172a 90%, #030712 100%)', sunAltitude: -30,  sunOpacity: 0,   moonAltitude: 60, moonOpacity: 0.85, starsOpacity: 0.9, cloudOpacity: 0.1 },
  23: { gradient: 'linear-gradient(135deg, #030712 0%, #080711 50%, #090d16 100%)', sunAltitude: -30,  sunOpacity: 0,   moonAltitude: 70, moonOpacity: 0.90, starsOpacity: 1.0, cloudOpacity: 0.1 },
};

interface SkyBackdropProps {
  children: React.ReactNode;
  hourOverride?: number; // Optional override to control preview scrub
}

export default function SkyBackdrop({ children, hourOverride }: SkyBackdropProps) {
  // If no override is provided, fallback to local system hour
  const [currentHour, setCurrentHour] = React.useState(() => new Date().getHours());

  React.useEffect(() => {
    if (hourOverride !== undefined) return;
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [hourOverride]);

  const activeHour = hourOverride !== undefined ? hourOverride : currentHour;
  const theme = HOURLY_THEMES[activeHour] || HOURLY_THEMES[12];

  // Double-buffering for background gradient cross-fade
  const [displayTheme, setDisplayTheme] = React.useState(theme);
  const [nextTheme, setNextTheme] = React.useState<SkyTheme | null>(null);
  const [fadeOpacity, setFadeOpacity] = React.useState(0);

  React.useEffect(() => {
    if (theme.gradient === displayTheme.gradient) {
      setDisplayTheme(theme);
      return;
    }
    
    setNextTheme(theme);
    setFadeOpacity(0);

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFadeOpacity(1);
      });
    });

    const timeoutId = setTimeout(() => {
      setDisplayTheme(theme);
      setNextTheme(null);
      setFadeOpacity(0);
    }, 850); // 850ms transition time for realistic cross-dissolve

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [theme, displayTheme.gradient]);

  // Helper coordinate variables
  const sunBottom = `${Math.max(-10, Math.min(100, theme.sunAltitude))}%`;
  const moonBottom = `${Math.max(-10, Math.min(100, theme.moonAltitude))}%`;

  return (
    <div className="relative min-h-screen flex flex-col justify-start overflow-x-hidden">
      {/* Base theme background */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out" 
        style={{ background: displayTheme.gradient, backgroundAttachment: 'fixed', backgroundSize: 'cover' }}
      />
      {/* Overlapping transitioning background */}
      {nextTheme && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-700 ease-in-out" 
          style={{ 
            background: nextTheme.gradient, 
            backgroundAttachment: 'fixed', 
            backgroundSize: 'cover',
            opacity: fadeOpacity 
          }}
        />
      )}
      {/* ── Twinkling Starfield Layer (Only visible at dawn/dusk/night) ───────── */}
      {theme.starsOpacity > 0 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{ opacity: theme.starsOpacity }}
        >
          {/* Render 20 absolute positioned SVG twinkling stars */}
          {[
            { top: '10%', left: '15%', delay: '0s', size: 2 },
            { top: '15%', left: '45%', delay: '1s', size: 3 },
            { top: '8%', left: '75%', delay: '2s', size: 1.5 },
            { top: '25%', left: '8%', delay: '1.5s', size: 2 },
            { top: '30%', left: '88%', delay: '0.5s', size: 2.5 },
            { top: '22%', left: '60%', delay: '2.5s', size: 1.5 },
            { top: '5%', left: '32%', delay: '3s', size: 2 },
            { top: '18%', left: '22%', delay: '0.8s', size: 3 },
            { top: '28%', left: '38%', delay: '1.2s', size: 2 },
            { top: '12%', left: '92%', delay: '2.2s', size: 1.5 },
            { top: '35%', left: '50%', delay: '1.7s', size: 2 },
            { top: '40%', left: '20%', delay: '2.7s', size: 2.5 },
            { top: '42%', left: '70%', delay: '0.3s', size: 1.5 },
            { top: '2%', left: '55%', delay: '1.9s', size: 2 },
            { top: '48%', left: '82%', delay: '3.1s', size: 2 },
          ].map((star, idx) => (
            <svg
              key={idx}
              className="absolute animate-pulse"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                animationDelay: star.delay,
                animationDuration: '2.5s',
              }}
              viewBox="0 0 10 10"
              fill="white"
            >
              <circle cx="5" cy="5" r="5" fill="#FFFFFF" />
            </svg>
          ))}
        </div>
      )}

      {/* ── Drifting Cloud Scenery Layer ─────────────────────────────────────── */}
      {theme.cloudOpacity > 0.05 && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
          style={{ opacity: theme.cloudOpacity }}
        >
          {/* Float clouds across the sky using drifting CSS keyframes */}
          <div className="absolute top-[20%] left-[-15%] w-48 opacity-30 animate-drift-slow select-none">
            <svg viewBox="0 0 120 60" fill="white">
              <path d="M20 50 C20 40, 35 30, 50 35 C60 25, 80 25, 90 35 C105 35, 110 45, 110 50 Z" />
            </svg>
          </div>
          <div className="absolute top-[35%] right-[-20%] w-60 opacity-20 animate-drift-medium select-none">
            <svg viewBox="0 0 120 60" fill="white">
              <path d="M20 50 C20 38, 40 28, 60 33 C75 22, 95 24, 105 35 C115 37, 120 44, 120 50 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* ── Sunrise/Sunset Glowing Sun Orb ───────────────────────────────────── */}
      <div
        className="absolute left-[70%] -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-100 to-orange-400 blur-[8px] transition-all duration-1000 ease-in-out pointer-events-none"
        style={{
          bottom: sunBottom,
          opacity: theme.sunOpacity,
          boxShadow: '0 0 60px 20px rgba(253, 224, 71, 0.4)',
        }}
      />

      {/* ── Glowing Moon Orb ─────────────────────────────────────────────────── */}
      <div
        className="absolute left-[30%] -translate-x-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-slate-100 to-indigo-100 blur-[2px] transition-all duration-1000 ease-in-out pointer-events-none flex items-center justify-center"
        style={{
          bottom: moonBottom,
          opacity: theme.moonOpacity,
          boxShadow: '0 0 45px 15px rgba(226, 232, 240, 0.25)',
        }}
      >
        {/* Soft realistic crater glow */}
        <div className="w-16 h-16 rounded-full bg-white/80 blur-[1px]" />
      </div>

      {/* Content wrapper */}
      <div className="relative z-20 flex-grow flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

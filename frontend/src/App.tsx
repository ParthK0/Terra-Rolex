import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFootprint } from './hooks/useFootprint';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

// Lucide icons
import { Globe as GlobeIcon, ClipboardList, ShieldAlert, Users, User, Flame } from 'lucide-react';

import Log from './pages/Log';
import Actions from './pages/Actions';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

function Navbar({ user, streak }: { user: any; streak: number }) {
  const location = useLocation();
  const activeClass = "text-emerald-400 border-b-2 border-emerald-400 font-bold";
  const inactiveClass = "text-gray-400 hover:text-gray-200 hover:border-b-2 hover:border-gray-600 font-semibold";

  return (
    <nav className="glass-nav sticky top-0 z-50 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 text-xl font-black text-white tracking-wider cursor-pointer">
          <span className="text-emerald-400">TERRA</span>
          <span className="px-1.5 py-0.5 bg-emerald-500 text-gray-950 text-xs font-black rounded tracking-normal">ROLEX</span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/dashboard" className={`pb-1 transition-all cursor-pointer ${location.pathname === '/dashboard' ? activeClass : inactiveClass}`}>
            Dashboard
          </Link>
          <Link to="/log" className={`pb-1 transition-all cursor-pointer ${location.pathname === '/log' ? activeClass : inactiveClass}`}>
            Log Action
          </Link>
          <Link to="/actions" className={`pb-1 transition-all cursor-pointer ${location.pathname === '/actions' ? activeClass : inactiveClass}`}>
            Challenges
          </Link>
          <Link to="/leaderboard" className={`pb-1 transition-all cursor-pointer ${location.pathname === '/leaderboard' ? activeClass : inactiveClass}`}>
            Leaderboard
          </Link>
          <Link to="/profile" className={`pb-1 transition-all cursor-pointer ${location.pathname === '/profile' ? activeClass : inactiveClass}`}>
            Profile
          </Link>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 rounded-full px-3.5 py-1 text-xs">
            <Flame className="text-orange-500 h-3.5 w-3.5 fill-orange-500" />
            <span className="text-gray-300 font-bold">{streak} days</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xs font-bold text-emerald-400">
              {user?.userName ? user.userName[0].toUpperCase() : 'U'}
            </div>
            <span className="hidden sm:inline text-xs text-gray-300 font-bold">{user?.userName}</span>
          </div>
        </div>
      </div>

      {/* Mobile subnavigation */}
      <div className="md:hidden flex justify-around items-center border-t border-white/5 pt-3 mt-3 text-[11px]">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 cursor-pointer">
          <GlobeIcon className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link to="/log" className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 cursor-pointer">
          <ClipboardList className="h-4 w-4" />
          <span>Log</span>
        </Link>
        <Link to="/actions" className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 cursor-pointer">
          <ShieldAlert className="h-4 w-4" />
          <span>Challenges</span>
        </Link>
        <Link to="/leaderboard" className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 cursor-pointer">
          <Users className="h-4 w-4" />
          <span>Social</span>
        </Link>
        <Link to="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-emerald-400 cursor-pointer">
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

function MainContent() {
  const { user, loading: authLoading, saveOnboarding, updateUsername, joinTeam } = useAuth();
  const { insights, loading: footprintLoading, logActivity, completeChallenge } = useFootprint(user?.userId);

  const loading = authLoading || footprintLoading;

  // Simple route check to see if we should redirect to Onboarding
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
        <p className="text-gray-400 text-sm font-semibold">Tuning the Living World...</p>
      </div>
    );
  }

  // If user has not completed onboarding baseline setup, redirect them to /onboarding
  const hasOnboarded = user && user.baseline_co2 > 0;
  if (!hasOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#030712]">
      {location.pathname !== '/onboarding' && (
        <Navbar 
          user={user} 
          streak={insights?.streak || 0} 
        />
      )}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/onboarding" element={<Onboarding onComplete={saveOnboarding} />} />
          <Route 
            path="/dashboard" 
            element={
              <Dashboard 
                user={user} 
                insights={insights} 
                loading={loading} 
                onQuickLog={logActivity}
              />
            } 
          />
          <Route path="/log" element={<Log onLog={logActivity} />} />
          <Route path="/actions" element={<Actions user={user} onCompleteChallenge={completeChallenge} />} />
          <Route path="/leaderboard" element={<Leaderboard user={user} insights={insights} onJoinTeam={joinTeam} />} />
          <Route path="/profile" element={<Profile user={user} onUpdateUsername={updateUsername} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <footer className="py-6 border-t border-white/5 text-center text-xs text-gray-500">
        <p>© 2026 Terra-rolex. Built for carbon awareness & behavioral change.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

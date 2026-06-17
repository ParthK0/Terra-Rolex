import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useFootprint } from './hooks/useFootprint';
import { UserProfileProvider } from './context/UserContext';
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
  const activeClass = "nav-link-active pb-1";
  const inactiveClass = "nav-link-inactive pb-1";

  return (
    <nav className="sticky top-0 z-50 px-6 py-4 bg-white border-b border-gray-200/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-1.5 text-xl font-black text-accent-blue tracking-tight cursor-pointer">
          <GlobeIcon className="h-5 w-5 stroke-[2.5]" />
          <span>Terra</span>
          <span className="text-text-charcoal font-medium">Watch</span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/dashboard" className={`transition-all cursor-pointer ${location.pathname === '/dashboard' ? activeClass : inactiveClass}`}>
            Dashboard
          </Link>
          <Link to="/log" className={`transition-all cursor-pointer ${location.pathname === '/log' ? activeClass : inactiveClass}`}>
            Log Action
          </Link>
          <Link to="/actions" className={`transition-all cursor-pointer ${location.pathname === '/actions' ? activeClass : inactiveClass}`}>
            Challenges
          </Link>
          <Link to="/leaderboard" className={`transition-all cursor-pointer ${location.pathname === '/leaderboard' ? activeClass : inactiveClass}`}>
            Leaderboard
          </Link>
          <Link to="/profile" className={`transition-all cursor-pointer ${location.pathname === '/profile' ? activeClass : inactiveClass}`}>
            Profile
          </Link>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-accent-amber/15 border border-accent-amber/20 rounded-full px-3.5 py-1 text-xs font-bold text-accent-amber">
            <Flame className="h-3.5 w-3.5 fill-accent-amber" />
            <span>{streak} days</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue relative">
              {user?.userName ? user.userName[0].toUpperCase() : 'U'}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-accent-green border border-white" />
            </div>
            <span className="hidden sm:inline text-xs text-text-charcoal font-semibold">{user?.userName}</span>
          </div>
        </div>
      </div>

      {/* Mobile subnavigation */}
      <div className="md:hidden flex justify-around items-center border-t border-gray-200/60 pt-3 mt-3 text-[11px]">
        <Link to="/dashboard" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/dashboard' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <GlobeIcon className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        <Link to="/log" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/log' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <ClipboardList className="h-4 w-4" />
          <span>Log</span>
        </Link>
        <Link to="/actions" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/actions' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <ShieldAlert className="h-4 w-4" />
          <span>Challenges</span>
        </Link>
        <Link to="/leaderboard" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/leaderboard' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <Users className="h-4 w-4" />
          <span>Social</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/profile' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

function MainContent() {
  const { user, loading: authLoading, saveOnboarding, updateUsername, joinTeam, refreshProfile } = useAuth();
  const { insights, loading: footprintLoading, logActivity, completeChallenge } = useFootprint(user?.userId);

  const loading = authLoading || footprintLoading;

  // Simple route check to see if we should redirect to Onboarding
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
        <p className="text-text-grey text-sm font-semibold">Tuning the Living World...</p>
      </div>
    );
  }

  // If user has not completed onboarding baseline setup, redirect them to /onboarding
  const hasOnboarded = user && user.baseline_co2 > 0;
  if (!hasOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <UserProfileProvider value={{ user, updateUsername, joinTeam, saveOnboarding, refreshProfile }}>
      <div className="min-h-screen flex flex-col justify-between bg-bg-base">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-blue focus:text-white focus:rounded-lg focus:font-semibold">
          Skip to main content
        </a>
        {location.pathname !== '/onboarding' && (
          <Navbar 
            user={user} 
            streak={insights?.streak || 0} 
          />
        )}
        
        <main id="main-content" className="flex-grow">
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

        <footer className="py-6 border-t border-gray-200/60 text-center text-xs text-text-grey">
          <p>© 2026 TerraWatch. Built for carbon awareness & behavioral change.</p>
        </footer>
      </div>
    </UserProfileProvider>
  );
}

export default function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

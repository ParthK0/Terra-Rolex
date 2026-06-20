import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import type { UserProfile } from './hooks/useAuth';
import { useFootprint } from './hooks/useFootprint';
import { UserProfileProvider } from './context/UserContext';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';
import LoadingSpinner from './components/LoadingSpinner';

// Lucide icons
import { Globe as GlobeIcon, ClipboardList, ShieldAlert, Users, User, Flame, LogOut, BarChart3 } from 'lucide-react';

import Log from './pages/Log';
import Actions from './pages/Actions';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

// Admin views
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminChallenges from './pages/AdminChallenges';
import AdminLogs from './pages/AdminLogs';
import AdminAnalytics from './pages/AdminAnalytics';


function Navbar({ user, streak, onLogout }: { user: UserProfile | null; streak: number; onLogout: () => void }) {
  const location = useLocation();
  const activeClass = "nav-link-active pb-1";
  const inactiveClass = "nav-link-inactive pb-1";
  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 px-6 py-4 bg-white border-b border-gray-200/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link to={isAdmin ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-1.5 text-xl font-black text-accent-blue tracking-tight cursor-pointer">
          <GlobeIcon className="h-5 w-5 stroke-[2.5]" />
          <span>Terra</span>
          <span className="text-text-charcoal font-medium">Rolex</span>
          {isAdmin && <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ml-1 uppercase">Admin</span>}
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {isAdmin ? (
            <>
              <Link to="/admin/dashboard" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/admin/dashboard' ? activeClass : inactiveClass}`}>
                <GlobeIcon className="h-3.5 w-3.5" />
                <span>Console</span>
              </Link>
              <Link to="/admin/users" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/admin/users' ? activeClass : inactiveClass}`}>
                <Users className="h-3.5 w-3.5" />
                <span>Users</span>
              </Link>
              <Link to="/admin/challenges" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/admin/challenges' ? activeClass : inactiveClass}`}>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Challenges</span>
              </Link>
              <Link to="/admin/logs" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/admin/logs' ? activeClass : inactiveClass}`}>
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Logs Feed</span>
              </Link>
              <Link to="/admin/analytics" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/admin/analytics' ? activeClass : inactiveClass}`}>
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Analytics</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/dashboard' ? activeClass : inactiveClass}`}>
                <GlobeIcon className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link to="/log" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/log' ? activeClass : inactiveClass}`}>
                <ClipboardList className="h-3.5 w-3.5" />
                <span>Log</span>
              </Link>
              <Link to="/actions" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/actions' ? activeClass : inactiveClass}`}>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Actions</span>
              </Link>
              <Link to="/leaderboard" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/leaderboard' ? activeClass : inactiveClass}`}>
                <Users className="h-3.5 w-3.5" />
                <span>Leaderboard</span>
              </Link>
            </>
          )}
          <Link to="/profile" className={`flex items-center gap-1.5 transition-all cursor-pointer ${location.pathname === '/profile' ? activeClass : inactiveClass}`}>
            <User className="h-3.5 w-3.5" />
            <span>Profile</span>
          </Link>
        </div>

        {/* Right Info */}
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <div className="flex items-center gap-1.5 bg-[#F7F9FB] border border-[#EEF1F4] rounded-full px-3.5 py-1 text-xs font-semibold text-text-charcoal">
              <Flame className="h-3.5 w-3.5 text-text-grey" />
              <span>{streak} days</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue relative">
              {user?.userName ? user.userName[0].toUpperCase() : 'U'}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-accent-green border border-white" />
            </div>
            <span className="hidden sm:inline text-xs text-text-charcoal font-semibold">{user?.userName}</span>
            <button
              onClick={onLogout}
              className="text-text-grey hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile subnavigation */}
      <div className="md:hidden flex justify-around items-center border-t border-gray-200/60 pt-3 mt-3 text-[11px]">
        {isAdmin ? (
          <>
            <Link to="/admin/dashboard" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/admin/dashboard' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <GlobeIcon className="h-4 w-4" />
              <span>Console</span>
            </Link>
            <Link to="/admin/users" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/admin/users' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <Users className="h-4 w-4" />
              <span>Users</span>
            </Link>
            <Link to="/admin/challenges" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/admin/challenges' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <ShieldAlert className="h-4 w-4" />
              <span>Challenges</span>
            </Link>
            <Link to="/admin/logs" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/admin/logs' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <ClipboardList className="h-4 w-4" />
              <span>Logs</span>
            </Link>
            <Link to="/admin/analytics" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/admin/analytics' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Link>
          </>
        ) : (
          <>
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
              <span>Actions</span>
            </Link>
            <Link to="/leaderboard" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/leaderboard' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
              <Users className="h-4 w-4" />
              <span>Leaderboard</span>
            </Link>
          </>
        )}
        <Link to="/profile" className={`flex flex-col items-center gap-1 cursor-pointer ${location.pathname === '/profile' ? 'text-accent-blue font-bold' : 'text-text-grey hover:text-text-charcoal'}`}>
          <User className="h-4 w-4" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}

function MainContent() {
  const { user, loading: authLoading, logout, saveOnboarding, updateUsername, joinTeam, refreshProfile } = useAuth();
  const { logs, insights, loading: footprintLoading, logActivity, completeChallenge } = useFootprint(user?.userId);

  const loading = authLoading || footprintLoading;

  // Simple route check to see if we should redirect to Onboarding
  const location = useLocation();

  if (authLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Render full-page Login if user is not authenticated
  if (!user) {
    return <Login />;
  }

  if (loading) {
    return <LoadingSpinner message="Tuning the Living World..." />;
  }

  // If user has not completed onboarding baseline setup, redirect them to /onboarding
  const isAdmin = user && user.role === 'admin';
  const hasOnboarded = user && (user.baseline_co2 > 0 || isAdmin);

  if (user && !authLoading) {
    if (isAdmin && !location.pathname.startsWith('/admin') && location.pathname !== '/profile') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (!isAdmin && location.pathname.startsWith('/admin')) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (!hasOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <UserProfileProvider value={{ user, updateUsername, joinTeam, saveOnboarding, refreshProfile, logout }}>
      <div className="min-h-screen flex flex-col justify-between bg-bg-base">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-blue focus:text-white focus:rounded-lg focus:font-semibold">
          Skip to main content
        </a>
        {location.pathname !== '/onboarding' && (
          <Navbar 
            user={user} 
            streak={insights?.streak || 0} 
            onLogout={logout}
          />
        )}
        
        <main id="main-content" className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {isAdmin ? (
                <>
                  <Route path="/admin/dashboard" element={<PageTransition><AdminDashboard /></PageTransition>} />
                  <Route path="/admin/users" element={<PageTransition><AdminUsers /></PageTransition>} />
                  <Route path="/admin/challenges" element={<PageTransition><AdminChallenges /></PageTransition>} />
                  <Route path="/admin/logs" element={<PageTransition><AdminLogs /></PageTransition>} />
                  <Route path="/admin/analytics" element={<PageTransition><AdminAnalytics /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition><Profile user={user} onUpdateUsername={updateUsername} /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                </>
              ) : (
                <>
                  <Route path="/onboarding" element={<PageTransition><Onboarding onComplete={saveOnboarding} /></PageTransition>} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <PageTransition>
                        <Dashboard 
                          user={user} 
                          insights={insights} 
                          loading={loading}
                          logs={logs}
                          onQuickLog={logActivity}
                        />
                      </PageTransition>
                    } 
                  />
                  <Route path="/log" element={<PageTransition><Log onLog={logActivity} /></PageTransition>} />
                  <Route path="/actions" element={<PageTransition><Actions user={user} onCompleteChallenge={completeChallenge} /></PageTransition>} />
                  <Route path="/leaderboard" element={<PageTransition><Leaderboard user={user} insights={insights} onJoinTeam={joinTeam} /></PageTransition>} />
                  <Route path="/profile" element={<PageTransition><Profile user={user} onUpdateUsername={updateUsername} /></PageTransition>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </>
              )}
            </Routes>
          </AnimatePresence>
        </main>

        <footer className="bg-white border-t border-gray-200/60 py-10 px-6 mt-12">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Column 1: Brand & Desc */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-lg font-black text-accent-blue tracking-tight">
                <GlobeIcon className="h-4.5 w-4.5 stroke-[2.5]" />
                <span>Terra</span>
                <span className="text-text-charcoal font-medium">Rolex</span>
              </div>
              <p className="text-xs text-text-grey leading-relaxed max-w-sm">
                Empowering communities with real-time geolocated carbon insights, collective environmental budgets, and personalized coaching to lower footprints and preserve local atmospheres.
              </p>
            </div>

            {/* Column 2: Tech Badges */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-text-charcoal tracking-widest block">Stack & API Integrations</span>
              <div className="flex flex-wrap gap-2 pt-1">
                {['React 19', 'FastAPI', 'Google Maps API', 'Gemini AI Coach'].map(tag => (
                  <span key={tag} className="text-[10px] bg-bg-base border border-gray-200/60 text-text-charcoal px-2 py-0.5 rounded-md font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Column 3: Copyright & Quick Links */}
            <div className="space-y-3 md:text-right">
              <span className="text-[10px] uppercase font-bold text-text-charcoal tracking-widest block">Quick Links</span>
              <div className="flex md:justify-end gap-4 text-xs font-semibold text-text-grey">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent-blue transition-colors">GitHub Repository</a>
                <a href="#" className="hover:text-accent-blue transition-colors">Privacy Policy</a>
              </div>
              <p className="text-[10px] text-text-grey pt-2">
                © 2026 TerraRolex. All rights reserved.
              </p>
            </div>

          </div>
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

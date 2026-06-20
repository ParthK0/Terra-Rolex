import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Globe, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import SkyBackdrop from '../components/SkyBackdrop';

export default function Login() {
  const { login, signup, authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setValidationError("Username is required.");
      return;
    }
    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }
    
    setSubmitting(true);
    if (isLogin) {
      await login(trimmedUsername, password);
    } else {
      await signup(trimmedUsername, password);
    }
    setSubmitting(false);
  };


  return (
    <SkyBackdrop>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/15 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-green/10 rounded-full blur-[100px] pointer-events-none animate-pulse duration-[6000ms]" />

        {/* Card */}
        <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 md:p-10 relative z-10 transition-all duration-300">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 bg-gradient-to-tr from-accent-blue to-accent-blue/60 rounded-2xl flex items-center justify-center shadow-lg shadow-accent-blue/20 mb-4 animate-bounce duration-[3000ms]">
              <Globe className="h-7 w-7 text-white stroke-[2]" />
            </div>
            <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
              TerraRolex
            </h1>
            <p className="text-xs font-semibold text-text-grey mt-1">
              {isLogin ? "Welcome back, atmospheric guardian" : "Join the global atmospheric defense"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-charcoal/80 block">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-grey">
                  <User className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/80 border border-gray-200/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-text-charcoal placeholder-text-grey/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-text-charcoal/80 block">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-grey">
                  <Lock className="h-4.5 w-4.5 stroke-[2]" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/80 border border-gray-200/80 rounded-2xl pl-10 pr-4 py-3 text-sm text-text-charcoal placeholder-text-grey/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
                />
              </div>
            </div>

            {/* Auth or Validation Error Display */}
            {(authError || validationError) && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-4 text-xs font-semibold text-red-700 animate-shake">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-500" />
                <span>{validationError || authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-sm py-3.5 px-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-accent-blue/20 hover:shadow-xl hover:shadow-accent-blue/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <span>{isLogin ? "Sign In" : "Create Account"}</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Toggle Form Mode */}
          <div className="mt-6 text-center text-xs font-semibold text-text-grey">
            <span>{isLogin ? "New to TerraRolex?" : "Already have an account?"}</span>{" "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setUsername('');
                setPassword('');
                setValidationError(null);
              }}
              className="text-accent-blue hover:underline cursor-pointer font-bold"
            >
              {isLogin ? "Create an account" : "Sign in here"}
            </button>
          </div>


        </div>
      </div>
    </SkyBackdrop>
  );
}

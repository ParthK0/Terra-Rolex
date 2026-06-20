import { Globe } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Syncing environmental data...' }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Animated Brand Loader */}
        <div className="relative flex items-center justify-center h-16 w-16">
          {/* Inner pulsing layer */}
          <div className="absolute inset-0 rounded-full bg-accent-blue/10 animate-ping" />
          {/* Middle spinning gradient ring */}
          <div className="absolute inset-0 rounded-full border-4 border-accent-blue/10 border-t-accent-blue animate-spin" />
          {/* Center Brand Icon */}
          <Globe className="h-6 w-6 text-accent-blue animate-pulse relative z-10" />
        </div>
        
        <p className="text-xs text-text-grey font-bold tracking-widest uppercase animate-pulse">
          {message}
        </p>
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

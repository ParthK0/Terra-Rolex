import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { ShieldCheck, ShieldAlert, Flame, Trophy, Sparkles, Check, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../hooks/useAuth';

// Category → icon emoji mapping (avoids importing unused lucide icons)
const CATEGORY_ICONS: Record<string, string> = {
  transport: '🚲',
  food: '🥗',
  energy: '❄️',
  other: '🌱',
};

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  co2_savings_kg: number;
  category: string;
  completed?: boolean;
}

interface ActionsProps {
  user: UserProfile | null;
  onCompleteChallenge: (challengeId: string, savings: number, title: string, desc: string) => Promise<any>;
}

export default function Actions({ user, onCompleteChallenge }: ActionsProps) {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingChallengeId, setLoadingChallengeId] = useState<string | null>(null);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const loadChallenges = async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const res = await apiFetch('/actions');
      if (res.ok) {
        const data: ChallengeItem[] = await res.json();
        setChallenges(data);
      } else {
        throw new Error('Failed to load challenges.');
      }
    } catch (err: any) {
      setFetchError(err.message || 'Could not load challenges.');
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const handleComplete = async (challenge: ChallengeItem) => {
    // Guard: never allow completing an already-completed challenge
    if (challenge.completed) return;

    setLoadingChallengeId(challenge.id);
    setCoachResponse(null);
    setCoachError(null);
    try {
      const res = await onCompleteChallenge(
        challenge.id,
        challenge.co2_savings_kg,
        challenge.title,
        challenge.description
      );
      if (res && res.reaction) {
        setCoachResponse(res.reaction);
      } else {
        setCoachResponse(`Completed: ${challenge.title}! Saved ${challenge.co2_savings_kg} kg CO₂.`);
      }
      // Refresh challenge list so completed flag updates
      await loadChallenges();
    } catch (e) {
      console.error(e);
      setCoachError("Saved locally! Server sync failed.");
    } finally {
      setLoadingChallengeId(null);
    }
  };

  // Loading skeleton
  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-bg-base py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="space-y-1">
            <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-4 w-80 bg-gray-100 rounded-lg animate-pulse mt-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="premium-card p-5 h-44 animate-pulse bg-gray-50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Title */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-charcoal font-display">Eco Challenges</h1>
            <p className="text-xs text-text-grey font-semibold">
              Perform carbon-saving actions to grow your daily streak and clean up the atmosphere.
            </p>
          </div>
          <button
            onClick={loadChallenges}
            className="flex items-center gap-1.5 text-xs font-bold text-text-grey hover:text-text-charcoal border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Fetch error */}
        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-700">
            {fetchError} —{' '}
            <button onClick={loadChallenges} className="underline cursor-pointer">Retry</button>
          </div>
        )}

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left Column: Challenge Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {challenges.length === 0 && !fetchLoading && (
              <div className="sm:col-span-2 p-10 text-center text-text-grey text-sm font-semibold bg-white rounded-2xl border border-gray-200">
                No challenges available. Ask your admin to create some!
              </div>
            )}
            {challenges.map(challenge => {
              const isCompleted = challenge.completed || user?.completed_challenges?.includes(challenge.id);
              const isPending = loadingChallengeId === challenge.id;
              const categoryIcon = CATEGORY_ICONS[challenge.category] ?? '🌱';

              return (
                <div
                  key={challenge.id}
                  className={`premium-card p-5 border flex flex-col justify-between space-y-4 transition-all duration-300 relative ${
                    isCompleted
                      ? 'border-accent-green/30 bg-accent-green/5'
                      : 'border-gray-200/60 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    {/* Icon Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors duration-200 ${
                      isCompleted ? 'bg-accent-green/10' : 'bg-gray-100'
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5 text-accent-green stroke-[2.5]" /> : categoryIcon}
                    </div>

                    {/* Circular Progress Ring */}
                    <div className="w-8 h-8 flex-shrink-0">
                      <svg className="w-full h-full text-gray-200" viewBox="0 0 36 36">
                        <path stroke="currentColor" strokeWidth="3" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                          className="text-accent-blue"
                          stroke="currentColor" strokeWidth="3"
                          strokeDasharray={isCompleted ? "100, 100" : "50, 100"}
                          strokeLinecap="round" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-charcoal flex items-center gap-1.5 font-display">
                      {challenge.title}
                    </h3>
                    <p className="text-[11px] text-text-grey mt-1 leading-normal font-semibold">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-text-charcoal">
                      -{challenge.co2_savings_kg} <span className="text-[10px] text-text-grey font-normal">kg CO₂</span>
                    </span>

                    {isCompleted ? (
                      <span className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-green/10 text-accent-green border border-accent-green/20 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Done
                      </span>
                    ) : (
                      <button
                        onClick={() => handleComplete(challenge)}
                        disabled={isPending}
                        className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-accent-green hover:bg-green-600 text-white shadow-sm shadow-accent-green/10 disabled:opacity-50"
                      >
                        {isPending ? 'Syncing...' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Coach Chatbox */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="premium-card p-6 flex-grow flex flex-col justify-between min-h-[340px] bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-accent-blue h-4.5 w-4.5 fill-accent-blue/10" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-charcoal font-display">
                    Gemini AI Coach Feedback
                  </h3>
                </div>

                <div aria-live="polite" aria-atomic="true">
                  {coachError ? (
                    <div className="p-4 bg-accent-red/5 border border-accent-red/15 rounded-xl text-xs text-accent-red leading-relaxed space-y-2">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Sync Error</span>
                      </div>
                      <p className="italic">"{coachError}"</p>
                    </div>
                  ) : coachResponse ? (
                    <div className="p-4 bg-accent-green/5 border border-accent-green/15 rounded-xl text-xs text-text-charcoal leading-relaxed space-y-2">
                      <div className="font-extrabold text-accent-green flex items-center gap-1.5">
                        <Trophy className="h-4 w-4" />
                        <span>Action Commended!</span>
                      </div>
                      <p className="italic font-semibold text-text-charcoal">"{coachResponse}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-grey text-xs italic space-y-2">
                      <ShieldCheck className="h-8 w-8 mx-auto stroke-[1.5] text-text-grey" />
                      <p className="font-semibold text-text-grey">
                        Complete any challenge on the left to receive dynamic, Gemini AI-driven ecological feedback!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-2 text-[10px] text-text-grey font-semibold">
                <Flame className="h-4 w-4 text-accent-amber fill-accent-amber/25" />
                <span>Completing challenges increases your daily streak!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

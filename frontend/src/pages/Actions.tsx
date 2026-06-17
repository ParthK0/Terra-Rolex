import { useState } from 'react';
import { ShieldCheck, ShieldAlert, Flame, Trophy, Sparkles, Bike, Thermometer, Leaf, FileText, Check } from 'lucide-react';

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  co2SavingsKg: number;
  category: string;
  icon: any;
}

const CHALLENGES: ChallengeItem[] = [
  {
    id: "c1",
    title: "No-Car Day",
    description: "Commute via bicycle, walking, or public transport.",
    co2SavingsKg: 2.3,
    category: "transport",
    icon: Bike
  },
  {
    id: "c2",
    title: "Meatless Day",
    description: "Eat strictly vegetarian or vegan meals.",
    co2SavingsKg: 1.8,
    category: "food",
    icon: Leaf
  },
  {
    id: "c3",
    title: "AC Hibernate",
    description: "Keep the air conditioner turned off for 24 hours.",
    co2SavingsKg: 9.6,
    category: "energy",
    icon: Thermometer
  },
  {
    id: "c4",
    title: "Appliance Break",
    description: "Avoid using heavy electricity drawing appliances.",
    co2SavingsKg: 1.5,
    category: "energy",
    icon: FileText
  }
];

interface ActionsProps {
  user: any;
  onCompleteChallenge: (challengeId: string, savings: number, title: string, desc: string) => Promise<any>;
}

export default function Actions({ user, onCompleteChallenge }: ActionsProps) {
  const [loadingChallengeId, setLoadingChallengeId] = useState<string | null>(null);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);
  const [coachError, setCoachError] = useState<string | null>(null);

  const handleComplete = async (challenge: ChallengeItem) => {
    setLoadingChallengeId(challenge.id);
    setCoachResponse(null);
    setCoachError(null);
    try {
      const res = await onCompleteChallenge(
        challenge.id,
        challenge.co2SavingsKg,
        challenge.title,
        challenge.description
      );
      if (res && res.reaction) {
        setCoachResponse(res.reaction);
      } else {
        setCoachResponse(`Completed: ${challenge.title}! Saved ${challenge.co2SavingsKg} kg CO₂.`);
      }
    } catch (e) {
      console.error(e);
      setCoachError("Saved locally! Server sync failed.");
    } finally {
      setLoadingChallengeId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text-charcoal font-display">Eco Challenges</h1>
          <p className="text-sm text-text-grey">
            Perform daily carbon-saving actions to grow your streak and restore atmospheric health.
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column (col-span-7): Challenge Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CHALLENGES.map(challenge => {
              const Icon = challenge.icon;
              const isCompleted = user?.completed_challenges?.includes(challenge.id);
              const isPending = loadingChallengeId === challenge.id;

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
                    {/* Circle Icon Badge */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-accent-green text-white' : 'bg-gray-100 text-text-grey'
                    }`}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>

                    {/* Thin Circular Progress Ring */}
                    <div className="w-8 h-8 flex-shrink-0">
                      <svg className="w-full h-full text-gray-200" viewBox="0 0 36 36">
                        <path
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-accent-blue"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={isCompleted ? "100, 100" : "50, 100"}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-text-charcoal flex items-center gap-1.5">
                      {challenge.title}
                    </h3>
                    <p className="text-[11px] text-text-grey mt-1 leading-normal">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs font-bold text-text-charcoal">
                      -{challenge.co2SavingsKg} <span className="text-[10px] text-text-grey font-normal">kg CO₂</span>
                    </span>

                    <button
                      onClick={() => handleComplete(challenge)}
                      disabled={isPending}
                      aria-label={isCompleted ? `Redo challenge: ${challenge.title}` : `Complete challenge: ${challenge.title}`}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-accent-green/10 text-accent-green hover:bg-accent-green/20'
                          : 'bg-accent-green hover:bg-green-600 text-white shadow-sm'
                      } disabled:opacity-50`}
                    >
                      {isPending ? 'Syncing...' : isCompleted ? 'Redo' : 'Complete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column (col-span-5): Coach Chatbox */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="premium-card p-6 flex-grow flex flex-col justify-between min-h-[340px]">
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
                      <p className="italic">"{coachResponse}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-text-grey text-xs italic space-y-2">
                      <ShieldCheck className="h-8 w-8 mx-auto stroke-[1.5] text-text-grey" />
                      <p>Complete any challenge on the left to receive dynamic, Gemini AI-driven ecological feedback!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200/50 flex items-center gap-2 text-[10px] text-text-grey font-semibold">
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

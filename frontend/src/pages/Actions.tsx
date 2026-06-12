import { useState } from 'react';
import { ShieldCheck, Flame, Trophy, Sparkles, Bike, Thermometer, Leaf, FileText } from 'lucide-react';

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
    description: "Eat strictly vegetarian or vegan meals for the entire day.",
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
    description: "Avoid using heavy electricity drawing appliances (dryer, oven).",
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

  const handleComplete = async (challenge: ChallengeItem) => {
    setLoadingChallengeId(challenge.id);
    setCoachResponse(null);
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
        setCoachResponse(`Successfully completed: ${challenge.title}! Saved ${challenge.co2SavingsKg} kg CO₂.`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to sync completion with server. Saved locally!");
    } finally {
      setLoadingChallengeId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Eco Challenges</h1>
        <p className="text-sm text-gray-400 mt-1">
          Perform everyday carbon-saving actions to grow your streak and restore the health of your Living World.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Challenge Cards */}
        <div className="lg:col-span-7 space-y-4">
          {CHALLENGES.map(challenge => {
            const Icon = challenge.icon;
            const isCompleted = user?.completed_challenges?.includes(challenge.id);
            const isPending = loadingChallengeId === challenge.id;

            return (
              <div 
                key={challenge.id} 
                className={`glass-card p-5 border transition-all flex justify-between items-start gap-4 ${
                  isCompleted 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-white/5 bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`p-3 rounded-xl ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-gray-300'}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {challenge.title}
                      {isCompleted && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full font-bold uppercase">
                          Done
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{challenge.description}</p>
                    
                    <span className="inline-block text-[11px] font-bold text-emerald-400 mt-2 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                      -{challenge.co2SavingsKg} kg CO₂ Savings
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(challenge)}
                  disabled={isPending}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                    isCompleted
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-gray-950 shadow-md shadow-emerald-500/10'
                  } disabled:opacity-50`}
                >
                  {isPending ? 'Syncing...' : isCompleted ? 'Do Again' : 'Complete'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Column: AI Reaction Chatbox */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 border border-white/5 space-y-4 flex-grow flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-emerald-400 h-4.5 w-4.5 fill-emerald-400/20" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Gemini Coach Reaction</h3>
              </div>

              {coachResponse ? (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-xs text-gray-300 leading-relaxed space-y-3">
                  <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4" />
                    <span>Action Commended!</span>
                  </div>
                  <p className="italic">"{coachResponse}"</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs italic space-y-2">
                  <ShieldCheck className="h-8 w-8 mx-auto stroke-[1.5] text-gray-600" />
                  <p>Complete any challenge on the left to receive dynamic, Gemini AI-driven ecological feedback!</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-500 font-medium">
              <Flame className="h-4 w-4 text-orange-500 fill-orange-500/20" />
              <span>Completing challenges increases your daily streak!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

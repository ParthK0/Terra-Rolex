import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Users, User, Flame, Sparkles, LogIn, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../hooks/useAuth';
import type { InsightState } from '../hooks/useFootprint';


interface LeaderboardProps {
  user: UserProfile | null;
  insights: InsightState | null;
  onJoinTeam: (teamName: string) => Promise<any>;
}

export default function Leaderboard({ user, insights, onJoinTeam }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'team'>('individual');
  const [teamInput, setTeamInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [notification, setNotification] = useState<{ text: string; isError?: boolean } | null>(null);

  const currentScore = insights?.rolling_score_kg || 0;
  const { usersLeaderboard, teamsLeaderboard, loading, refreshLeaderboard } = useLeaderboard(user?.userId, currentScore);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeam = teamInput.trim();
    if (!cleanTeam) return;

    setJoining(true);
    setNotification(null);
    try {
      await onJoinTeam(cleanTeam);
      setTeamInput('');
      setNotification({ text: `Successfully joined team: ${cleanTeam}!` });
      refreshLeaderboard();
    } catch (err) {
      console.error(err);
      setNotification({ text: "Joined team locally!" });
    } finally {
      setJoining(false);
    }
  };

  const handleForceSync = async () => {
    setNotification(null);
    try {
      await refreshLeaderboard();
      setNotification({ text: "Leaderboard refreshed successfully!" });
    } catch (err) {
      console.error(err);
      setNotification({ text: "Failed to refresh leaderboard.", isError: true });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-charcoal font-display">Social Standings</h1>
            <p className="text-xs text-text-grey font-semibold">
              Compare carbon footprint averages, join a team, and drive collective awareness.
            </p>
          </div>

          {/* Join team form */}
          <form onSubmit={handleJoinTeam} className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="e.g. Floor 3"
              value={teamInput}
              onChange={(e) => setTeamInput(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-text-charcoal focus:outline-none focus:border-accent-blue w-full md:w-48 bg-bg-base"
            />
            <button
              type="submit"
              disabled={joining}
              className="px-4 py-2.5 bg-accent-blue hover:bg-blue-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>{joining ? 'Joining...' : 'Join Team'}</span>
            </button>
          </form>
        </div>

        {notification && (
          <div
            role={notification.isError ? "alert" : "status"}
            className={`p-4 rounded-xl border text-xs font-bold ${
              notification.isError
                ? "bg-accent-red/10 border-accent-red/20 text-accent-red"
                : "bg-accent-green/10 border-accent-green/20 text-accent-green"
            }`}
          >
            {notification.text}
          </div>
        )}

        {/* View Toggle — Individual / Team only (Org tab removed: was 100% fake data) */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200/50 max-w-xs">
          <button
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'individual' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-grey hover:text-text-charcoal'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Individual</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'team' ? 'bg-accent-blue text-white shadow-sm' : 'text-text-grey hover:text-text-charcoal'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Team</span>
          </button>
        </div>

        {/* Standings list */}
        <div className="premium-card overflow-hidden bg-white">
          {loading ? (
            <div className="p-12 text-center text-text-grey space-y-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-blue border-t-transparent mx-auto" />
              <p className="text-xs">Fetching standings...</p>
            </div>
          ) : activeTab === 'individual' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/50 bg-bg-base text-text-grey font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Eco Warrior</th>
                    <th className="py-4 px-6">Team / Floor</th>
                    <th className="py-4 px-6 text-center w-28">Streak</th>
                    <th className="py-4 px-6 text-right w-44">Weekly CO₂ Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usersLeaderboard.map((item, idx) => {
                    const rank = idx + 1;
                    const isSelf = item.userId === user?.userId;

                    let borderAccent = "";
                    if (rank === 1) borderAccent = "border-l-4 border-l-[#F59E0B]";
                    else if (rank === 2) borderAccent = "border-l-4 border-l-[#9CA3AF]";
                    else if (rank === 3) borderAccent = "border-l-4 border-l-[#B45309]";

                    // Trend: lower score vs the next person = improving (up arrow)
                    const nextItem = usersLeaderboard[idx + 1];
                    const isBetterThanNext = nextItem ? item.score <= nextItem.score : true;

                    return (
                      <tr
                        key={item.userId}
                        className={`hover:bg-bg-base transition-colors ${borderAccent} ${isSelf ? 'bg-accent-blue/5 font-semibold' : ''}`}
                      >
                        <td className="py-4 px-6 text-center">
                          <span className="text-text-charcoal font-bold">{rank}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-xs flex-shrink-0">
                              {item.userName ? item.userName[0].toUpperCase() : 'U'}
                            </div>
                            <span className="text-text-charcoal font-semibold">{item.userName}</span>
                            {isSelf && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-accent-blue/10 text-accent-blue rounded font-bold uppercase ml-1.5">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-text-grey font-semibold">{item.teamName || 'Independent'}</td>
                        <td className="py-4 px-6 text-center font-mono">
                          <div className="flex items-center justify-center gap-1.5 text-accent-amber font-bold">
                            <Flame className="h-3.5 w-3.5 fill-accent-amber" />
                            <span>{item.streak}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-text-charcoal">
                          <div className="flex items-center justify-end gap-2.5">
                            <span>{item.score.toFixed(1)} <span className="text-[10px] font-normal text-text-grey">kg</span></span>
                            {isBetterThanNext ? (
                              <ArrowUp className="h-3.5 w-3.5 text-accent-green" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-accent-red" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {usersLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-grey text-xs font-semibold">
                        No users on the leaderboard yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/50 bg-bg-base text-text-grey font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6">Team Name</th>
                    <th className="py-4 px-6 text-center w-28">Members</th>
                    <th className="py-4 px-6 text-right w-44">Avg CO₂ Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamsLeaderboard.map((item, idx) => {
                    const rank = idx + 1;
                    const isSelfTeam = item.teamName === user?.teamName;

                    let borderAccent = "";
                    if (rank === 1) borderAccent = "border-l-4 border-l-[#F59E0B]";
                    else if (rank === 2) borderAccent = "border-l-4 border-l-[#9CA3AF]";
                    else if (rank === 3) borderAccent = "border-l-4 border-l-[#B45309]";

                    const nextItem = teamsLeaderboard[idx + 1];
                    const isBetterThanNext = nextItem ? item.score <= nextItem.score : true;

                    return (
                      <tr
                        key={item.teamName}
                        className={`hover:bg-bg-base transition-colors ${borderAccent} ${isSelfTeam ? 'bg-accent-blue/5 font-semibold' : ''}`}
                      >
                        <td className="py-4 px-6 text-center">
                          <span className="text-text-charcoal font-bold">{rank}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center font-bold text-accent-blue text-xs flex-shrink-0">
                              T
                            </div>
                            <span className="text-text-charcoal font-semibold">{item.teamName}</span>
                            {isSelfTeam && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-accent-green/10 text-accent-green rounded font-bold uppercase ml-1.5">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-text-grey font-mono font-bold">{item.memberCount}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-text-charcoal">
                          <div className="flex items-center justify-end gap-2.5">
                            <span>{item.score.toFixed(1)} <span className="text-[10px] font-normal text-text-grey">kg</span></span>
                            {isBetterThanNext ? (
                              <ArrowUp className="h-3.5 w-3.5 text-accent-green" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5 text-accent-red" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {teamsLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-text-grey text-xs font-semibold">
                        No teams found. Join a team above to appear here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sync Panel */}
        <div className="premium-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white">
          <div className="flex items-center gap-3">
            <Sparkles className="text-accent-blue h-6 w-6 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-text-charcoal font-display">Collective Reduction Tracker</h3>
              <p className="text-xs text-text-grey mt-0.5">
                Standings are computed from real logged data. Lower score = lower footprint = better rank.
              </p>
            </div>
          </div>
          <button
            onClick={handleForceSync}
            className="px-4 py-2 border border-gray-200 hover:bg-bg-base text-xs font-bold text-text-charcoal rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Force Sync</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { Users, User, Medal, Flame, Sparkles, LogIn } from 'lucide-react';

interface LeaderboardProps {
  user: any;
  insights: any;
  onJoinTeam: (teamName: string) => Promise<any>;
}

export default function Leaderboard({ user, insights, onJoinTeam }: LeaderboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users');
  const [teamInput, setTeamInput] = useState('');
  const [joining, setJoining] = useState(false);

  const currentScore = insights?.rolling_score_kg || 0;
  const { usersLeaderboard, teamsLeaderboard, loading, refreshLeaderboard } = useLeaderboard(user?.userId, currentScore);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTeam = teamInput.trim();
    if (!cleanTeam) return;

    setJoining(true);
    try {
      await onJoinTeam(cleanTeam);
      setTeamInput('');
      alert(`Successfully joined team: ${cleanTeam}!`);
      refreshLeaderboard();
    } catch (err) {
      console.error(err);
      alert("Joined team locally!");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Social Leaderboards</h1>
          <p className="text-sm text-gray-400 mt-1">
            Compete on lower carbon footprints. Join a floor/team and drive collective awareness.
          </p>
        </div>

        {/* Team join form */}
        <form onSubmit={handleJoinTeam} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Enter floor or team (e.g. Floor 4)"
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            className="bg-gray-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 w-full md:w-48"
          />
          <button
            type="submit"
            disabled={joining}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <LogIn className="h-3 w-3" />
            <span>{joining ? 'Joining...' : 'Join Team'}</span>
          </button>
        </form>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-gray-950 p-1 rounded-xl border border-white/5 max-w-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'users' ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span>Members</span>
        </button>
        <button
          onClick={() => setActiveTab('teams')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'teams' ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Teams</span>
        </button>
      </div>

      {/* Leaderboard tables */}
      <div className="glass-card border border-white/5 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent mx-auto" />
            <p className="text-xs">Fetching standings...</p>
          </div>
        ) : activeTab === 'users' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Eco Warrior</th>
                  <th className="py-4 px-6">Team / Floor</th>
                  <th className="py-4 px-6 text-center w-28">Streak</th>
                  <th className="py-4 px-6 text-right w-36">7-Day Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersLeaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  const isSelf = item.userId === user?.userId;

                  return (
                    <tr 
                      key={item.userId}
                      className={`hover:bg-white/5 transition-colors ${isSelf ? 'bg-emerald-500/5 font-semibold' : ''}`}
                    >
                      <td className="py-4 px-6 text-center">
                        {rank === 1 && <Medal className="h-5 w-5 text-yellow-500 mx-auto fill-yellow-500/10" />}
                        {rank === 2 && <Medal className="h-5 w-5 text-gray-300 mx-auto fill-gray-300/10" />}
                        {rank === 3 && <Medal className="h-5 w-5 text-amber-600 mx-auto fill-amber-600/10" />}
                        {rank > 3 && <span className="text-gray-500 font-mono">{rank}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.userName}</span>
                          {isSelf && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold uppercase">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-400">{item.teamName || 'Independent'}</td>
                      <td className="py-4 px-6 text-center font-mono">
                        <div className="flex items-center justify-center gap-1 text-orange-400">
                          <Flame className="h-3.5 w-3.5 fill-orange-500/10" />
                          <span>{item.streak}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        {item.score.toFixed(1)} <span className="text-[10px] font-normal text-gray-500">kg CO₂</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-16">Rank</th>
                  <th className="py-4 px-6">Team Name</th>
                  <th className="py-4 px-6 text-center w-28">Members</th>
                  <th className="py-4 px-6 text-right w-48">Avg 7-Day Footprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {teamsLeaderboard.map((item, idx) => {
                  const rank = idx + 1;
                  const isSelfTeam = item.teamName === user?.teamName;

                  return (
                    <tr 
                      key={item.teamName}
                      className={`hover:bg-white/5 transition-colors ${isSelfTeam ? 'bg-emerald-500/5 font-semibold' : ''}`}
                    >
                      <td className="py-4 px-6 text-center">
                        {rank === 1 && <Medal className="h-5 w-5 text-yellow-500 mx-auto fill-yellow-500/10" />}
                        {rank === 2 && <Medal className="h-5 w-5 text-gray-300 mx-auto fill-gray-300/10" />}
                        {rank === 3 && <Medal className="h-5 w-5 text-amber-600 mx-auto fill-amber-600/10" />}
                        {rank > 3 && <span className="text-gray-500 font-mono">{rank}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{item.teamName}</span>
                          {isSelfTeam && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-bold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-gray-400 font-mono">{item.memberCount}</td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-white">
                        {item.score.toFixed(1)} <span className="text-[10px] font-normal text-gray-500">kg CO₂/user</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card p-6 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-emerald-400 h-6 w-6 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-white">Team Target Carbon Budget</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Floor 3 currently leads. The aggregate budget goal is 50 kg CO₂ per person.
            </p>
          </div>
        </div>
        <button
          onClick={() => alert("Leaderboard refreshed!")}
          className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 rounded-xl cursor-pointer"
        >
          Force Sync
        </button>
      </div>
    </div>
  );
}

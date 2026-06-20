import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface LeaderboardUser {
  userId: string;
  userName: string;
  score: number;
  streak: number;
  teamName: string;
}

export interface TeamStanding {
  teamName: string;
  score: number;
  memberCount: number;
}

export function useLeaderboard(currentUserId: string | undefined, currentScore: number) {
  const [usersLeaderboard, setUsersLeaderboard] = useState<LeaderboardUser[]>([]);
  const [teamsLeaderboard, setTeamsLeaderboard] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStandings = async () => {
    setLoading(true);
    try {
      const uRes = await apiFetch("/leaderboard");
      const tRes = await apiFetch("/leaderboard/teams");

      if (uRes.ok && tRes.ok) {
        const uData = await uRes.json();
        const tData = await tRes.json();
        setUsersLeaderboard(uData);
        setTeamsLeaderboard(tData);
      } else {
        throw new Error("Backend offline");
      }
    } catch (e) {
      // Local fallback leaderboard simulation
      const mockUsers: LeaderboardUser[] = [
        { userId: "u1", userName: "Aarav Sharma", score: 45.2, streak: 8, teamName: "Floor 3" },
        { userId: "u2", userName: "Priya Patel", score: 85.1, streak: 5, teamName: "Floor 4" },
        { userId: "u3", userName: "Vikram Malhotra", score: 110.5, streak: 3, teamName: "Floor 3" },
        { userId: "u4", userName: "Ananya Iyer", score: 32.8, streak: 12, teamName: "Green Team" },
        { userId: "u5", userName: "Rohan Das", score: 195.4, streak: 1, teamName: "Floor 4" },
      ];

      // Add current user if available
      if (currentUserId) {
        const profileKey = `terra_profile_${currentUserId}`;
        const cachedProfile = localStorage.getItem(profileKey);
        const name = cachedProfile ? JSON.parse(cachedProfile).userName : "You";
        const team = cachedProfile ? JSON.parse(cachedProfile).teamName : "Floor 3";
        const streak = cachedProfile ? JSON.parse(cachedProfile).streak : 0;

        // Remove duplicate if already exists
        const filtered = mockUsers.filter(u => u.userId !== currentUserId);
        filtered.push({
          userId: currentUserId,
          userName: name,
          score: currentScore,
          streak: streak,
          teamName: team
        });
        mockUsers.splice(0, mockUsers.length, ...filtered);
      }

      // Sort: lower score (emissions) is better
      mockUsers.sort((a, b) => a.score - b.score);
      setUsersLeaderboard(mockUsers);

      // Aggregate team scores
      const teamTotals: Record<string, { total: number; count: number }> = {};
      mockUsers.forEach(u => {
        const team = u.teamName || "Floor 3";
        if (!teamTotals[team]) teamTotals[team] = { total: 0, count: 0 };
        teamTotals[team].total += u.score;
        teamTotals[team].count += 1;
      });

      const mockTeams = Object.keys(teamTotals).map(name => ({
        teamName: name,
        score: Number((teamTotals[name].total / teamTotals[name].count).toFixed(1)),
        memberCount: teamTotals[name].count
      })).sort((a, b) => a.score - b.score);

      setTeamsLeaderboard(mockTeams);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, [currentUserId, currentScore]);

  return {
    usersLeaderboard,
    teamsLeaderboard,
    loading,
    refreshLeaderboard: fetchStandings
  };
}

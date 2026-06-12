import { useState, useEffect } from 'react';
import { calculateCO2Client } from '../lib/co2calc';
import { getVisceralComparison } from '../lib/benchmarks';

export interface LogEntry {
  id: string;
  category: string;
  subtype: string;
  amount: number;
  co2_kg: number;
  equivalent: string;
  timestamp: string;
  description: string;
}

export interface InsightState {
  rolling_score_kg: number;
  streak: number;
  nudges: string[];
  living_world_status: string;
}

const API_BASE = "http://localhost:8000";

export function useFootprint(userId: string | undefined) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [insights, setInsights] = useState<InsightState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsightsAndLogs = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Fetch insights
      const insRes = await fetch(`${API_BASE}/insights`, {
        headers: { "x-user-id": userId }
      });
      const logRes = await fetch(`${API_BASE}/log`, {
        headers: { "x-user-id": userId }
      });

      if (insRes.ok && logRes.ok) {
        const insData = await insRes.json();
        const logData = await logRes.json();
        setInsights(insData);
        setLogs(logData);
      } else {
        throw new Error("Backend offline");
      }
    } catch (e) {
      // Offline fallback
      const localLogsKey = `terra_logs_${userId}`;
      const cachedLogs = localStorage.getItem(localLogsKey);
      const parsedLogs: LogEntry[] = cachedLogs ? JSON.parse(cachedLogs) : [];
      setLogs(parsedLogs);

      // Recalculate rolling 7-day footprint score locally
      // Assuming a base baseline of 250kg / 30 = 8.3kg per day baseline
      const profileKey = `terra_profile_${userId}`;
      const cachedProfile = localStorage.getItem(profileKey);
      const baseline = cachedProfile ? JSON.parse(cachedProfile).baseline_co2 : 250.0;
      const dailyBaseline = baseline / 30.0;
      let score = dailyBaseline * 7;

      for (const log of parsedLogs.slice(0, 15)) {
        score += log.co2_kg;
      }
      score = Math.max(0, score);

      let status = "healthy";
      if (score < 40) status = "thriving";
      else if (score < 100) status = "healthy";
      else if (score < 200) status = "threatened";
      else status = "degraded";

      // Simple mock nudges
      const nudges = [
        `Your 7-day footprint is ${score.toFixed(1)} kg CO2. Swapping car commutes to public transit could lower this by 25%.`,
        parsedLogs.some(l => l.category === "flights")
          ? "Your flight offset 6 weeks of eco-actions. Swapping flight routes to trains where possible saves massive overhead."
          : "No flights logged this week! You saved an average passenger flight footprint of 90 kg CO2.",
        "Going meatless on your next meal will save 1.8 kg CO2—equivalent to planting 1 new tree."
      ];

      setInsights({
        rolling_score_kg: Number(score.toFixed(1)),
        streak: cachedProfile ? JSON.parse(cachedProfile).streak : 0,
        nudges,
        living_world_status: status
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsAndLogs();
  }, [userId]);

  const logActivity = async (category: string, subtype: string, amount: number, description?: string) => {
    if (!userId) return null;
    try {
      const response = await fetch(`${API_BASE}/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ category, subtype, amount, description })
      });

      if (response.ok) {
        const newLog = await response.json();
        setLogs(prev => [newLog, ...prev]);
        // Refresh insights to update rolling score
        fetchInsightsAndLogs();
        return newLog;
      } else {
        throw new Error("Backend rejected log");
      }
    } catch (e) {
      // Local fallback calculation
      const calc = calculateCO2Client(category, subtype, amount);
      const newLog: LogEntry = {
        id: `log_${Date.now()}`,
        category,
        subtype,
        amount,
        co2_kg: calc.co2Kg,
        equivalent: calc.equivalent,
        description: description || `Logged ${subtype} (${amount})`,
        timestamp: new Date().toISOString()
      };

      const localLogsKey = `terra_logs_${userId}`;
      const current = [newLog, ...logs];
      setLogs(current);
      localStorage.setItem(localLogsKey, JSON.stringify(current));
      
      // Update local insights
      fetchInsightsAndLogs();
      return newLog;
    }
  };

  const completeChallenge = async (challengeId: string, co2Savings: number, title: string, desc: string) => {
    if (!userId) return null;
    try {
      const response = await fetch(`${API_BASE}/actions/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify({ challenge_id: challengeId })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh logs and insights
        fetchInsightsAndLogs();
        return data;
      } else {
        throw new Error("Backend complete failed");
      }
    } catch (e) {
      // Local fallback challenge complete
      const profileKey = `terra_profile_${userId}`;
      const profileData = localStorage.getItem(profileKey);
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (!profile.completed_challenges.includes(challengeId)) {
          profile.completed_challenges.push(challengeId);
          profile.streak += 1;
          
          if (profile.streak >= 5 && !profile.badges.includes("Streak Master")) {
            profile.badges.push("Streak Master");
          }
          if (profile.completed_challenges.length >= 3 && !profile.badges.includes("Eco Enthusiast")) {
            profile.badges.push("Eco Enthusiast");
          }

          localStorage.setItem(profileKey, JSON.stringify(profile));
        }

        // Add a negative carbon log representing savings
        const fallbackLog: LogEntry = {
          id: `log_${Date.now()}`,
          category: "challenge",
          subtype: title,
          amount: 1,
          co2_kg: -co2Savings,
          equivalent: `Saved ${co2Savings} kg CO2. ${desc}`,
          description: `Completed Challenge: ${title}`,
          timestamp: new Date().toISOString()
        };

        const localLogsKey = `terra_logs_${userId}`;
        const current = [fallbackLog, ...logs];
        setLogs(current);
        localStorage.setItem(localLogsKey, JSON.stringify(current));

        fetchInsightsAndLogs();

        return {
          success: true,
          streak: profile.streak,
          reaction: `Incredible work! Completing '${title}' saved ${co2Savings} kg CO2—which is ${getVisceralComparison(co2Savings)}. Your streak is now ${profile.streak} days!`
        };
      }
      return null;
    }
  };

  return {
    logs,
    insights,
    loading,
    logActivity,
    completeChallenge,
    refreshFootprint: fetchInsightsAndLogs
  };
}

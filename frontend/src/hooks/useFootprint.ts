import { useState, useEffect, useRef, useCallback } from 'react';
import { calculateCO2Client } from '../lib/co2calc';
import { getVisceralComparison } from '../lib/benchmarks';
import { apiFetch } from '../lib/api';
import { enqueueAction, syncOfflineQueue } from '../lib/offlineQueue';

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

export function useFootprint(userId: string | undefined) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [insights, setInsights] = useState<InsightState | null>(null);
  const [loading, setLoading] = useState(true);
  // Guard against concurrent fetches causing race condition / stale state overwrites
  const fetchingRef = useRef(false);

  const fetchInsightsAndLogs = useCallback(async () => {
    if (!userId || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      // Fetch insights & logs using authorized apiFetch
      const insRes = await apiFetch("/insights");
      const logRes = await apiFetch("/log");

      if (insRes.ok && logRes.ok) {
        const insData = await insRes.json();
        const logData = await logRes.json();
        setInsights(insData);
        setLogs(logData);
        // Also update local storage to keep offline logs up-to-date
        localStorage.setItem(`terra_logs_${userId}`, JSON.stringify(logData));
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
      const profileKey = `terra_profile_${userId}`;
      const cachedProfile = localStorage.getItem(profileKey);
      const baseline = cachedProfile ? JSON.parse(cachedProfile).baseline_co2 : 250.0;
      const dailyBaseline = baseline / 30.0;
      let score = dailyBaseline * 7;

      // Recalculate rolling 7-day footprint score using real date-filtered logs
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentLogs = parsedLogs.filter(l => l.timestamp >= sevenDaysAgo);
      for (const log of recentLogs) {
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
      fetchingRef.current = false;
    }
  }, [userId]);

  useEffect(() => {
    fetchInsightsAndLogs();
  }, [userId, fetchInsightsAndLogs]);

  useEffect(() => {
    if (!userId) return;

    const handleOnline = async () => {
      console.log("Device is online. Triggering synchronization...");
      try {
        await syncOfflineQueue(userId);
      } catch (err) {
        console.error("Error syncing offline queue:", err);
      } finally {
        await fetchInsightsAndLogs();
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Attempt sync immediately if we are online on mount
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [userId, fetchInsightsAndLogs]);

  const logActivity = async (
    category: string,
    subtype: string,
    amount: number,
    description?: string,
    fuelType?: string,
    region?: string
  ) => {
    if (!userId) return null;
    try {
      const response = await apiFetch("/log", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          subtype,
          amount,
          description,
          fuel_type: fuelType,
          region
        })
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
      
      // Queue offline action
      try {
        await enqueueAction('log', userId, {
          category,
          subtype,
          amount,
          description,
          fuel_type: fuelType,
          region
        });
      } catch (dbErr) {
        console.error("Failed to enqueue offline log:", dbErr);
      }

      // Update local insights
      fetchInsightsAndLogs();
      return newLog;
    }
  };

  const completeChallenge = async (challengeId: string, co2Savings: number, title: string, desc: string) => {
    if (!userId) return null;
    try {
      const response = await apiFetch("/actions/complete", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
          equivalent: `Saved {co2Savings} kg CO2. ${desc}`,
          description: `Completed Challenge: ${title}`,
          timestamp: new Date().toISOString()
        };

        const localLogsKey = `terra_logs_${userId}`;
        const current = [fallbackLog, ...logs];
        setLogs(current);
        localStorage.setItem(localLogsKey, JSON.stringify(current));

        // Queue offline action
        try {
          await enqueueAction('challenge', userId, {
            challengeId,
            co2Savings,
            title,
            desc
          });
        } catch (dbErr) {
          console.error("Failed to enqueue offline challenge:", dbErr);
        }

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

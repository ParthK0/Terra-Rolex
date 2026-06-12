import { useState, useEffect } from 'react';
import { calculateBaselineClient } from '../lib/co2calc';

export interface UserProfile {
  userId: string;
  userName: string;
  streak: number;
  baseline_co2: number;
  teamName: string;
  badges: string[];
  completed_challenges: string[];
}

const API_BASE = "http://localhost:8000";

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up local user ID
  const [localUserId] = useState(() => {
    const cached = localStorage.getItem("terra_userId");
    if (cached) return cached;
    const newId = `user_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem("terra_userId", newId);
    return newId;
  });

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/insights`, {
        headers: { "x-user-id": localUserId }
      });
      if (response.ok) {
        // We can fetch profile from a backend custom endpoint or fetch user details.
        // Let's call a mock profile endpoint. Since we didn't explicitly create a GET /profile endpoint, 
        // we can fetch from the mock DB via the insights or logs endpoint.
        // Wait, let's look up how we implemented `/leaderboard` or `/log`.
        // Let's do a fetch to leaderboard to see our score, or just fetch via a generic endpoint.
        // Wait, let's create a custom get profile logic. In firestore_service we have get_user_profile.
        // Let's verify: does `/insights` return streak and rolling score? Yes, it returns streak.
        // Let's build a quick profile load by getting data from localStorage, and syncing if backend is active.
        const cachedProfile = localStorage.getItem(`terra_profile_${localUserId}`);
        let baseProfile: UserProfile = cachedProfile ? JSON.parse(cachedProfile) : {
          userId: localUserId,
          userName: `EcoWarrior_${localUserId.substring(5, 9)}`,
          streak: 0,
          baseline_co2: 250.0,
          teamName: "Floor 3",
          badges: ["Carbon Onboarder"],
          completed_challenges: []
        };

        // Let's see if we can get rankings or details from backend
        // Since get_user_profile is run in backend, let's fetch leaderboard to extract our details!
        const lbRes = await fetch(`${API_BASE}/leaderboard`);
        if (lbRes.ok) {
          const lbData = await lbRes.json();
          const me = lbData.find((u: any) => u.userId === localUserId);
          if (me) {
            baseProfile.streak = me.streak;
            baseProfile.teamName = me.teamName || "Floor 3";
            baseProfile.userName = me.userName;
          }
        }
        
        setUser(baseProfile);
        localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(baseProfile));
      } else {
        throw new Error("Backend offline");
      }
    } catch (err) {
      // Offline fallback
      const cachedProfile = localStorage.getItem(`terra_profile_${localUserId}`);
      if (cachedProfile) {
        setUser(JSON.parse(cachedProfile));
      } else {
        const fallback: UserProfile = {
          userId: localUserId,
          userName: `EcoWarrior_${localUserId.substring(5, 9)}`,
          streak: 0,
          baseline_co2: 250.0,
          teamName: "Floor 3",
          badges: ["Carbon Onboarder"],
          completed_challenges: []
        };
        setUser(fallback);
        localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(fallback));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [localUserId]);

  const saveOnboarding = async (formData: {
    transportKm: number;
    transportType: string;
    dietType: string;
    acHours: number;
    flightsCount: number;
    shoppingFreq: string;
  }) => {
    try {
      const response = await fetch(`${API_BASE}/insights/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localUserId
        },
        body: JSON.stringify({
          transport_km_per_month: formData.transportKm,
          transport_type: formData.transportType,
          diet_type: formData.dietType,
          ac_hours_per_week: formData.acHours,
          flights_per_year: formData.flightsCount,
          shopping_frequency: formData.shoppingFreq
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updated: UserProfile = {
          ...user!,
          baseline_co2: data.monthly_baseline_kg,
        };
        setUser(updated);
        localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(updated));
        return data;
      } else {
        throw new Error("Failed to save onboarding on backend");
      }
    } catch (err) {
      // Local fallback onboarding baseline math
      const clientMath = calculateBaselineClient(
        formData.transportKm,
        formData.transportType,
        formData.dietType,
        formData.acHours,
        formData.flightsCount,
        formData.shoppingFreq
      );

      const updated: UserProfile = {
        ...user!,
        baseline_co2: clientMath.monthlyBaselineKg,
      };
      setUser(updated);
      localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(updated));
      return {
        monthly_baseline_kg: clientMath.monthlyBaselineKg,
        annual_tonnes: clientMath.annualTonnes,
        benchmark_context: clientMath.benchmarkContext
      };
    }
  };

  const updateUsername = (newName: string) => {
    if (!user) return;
    const updated = { ...user, userName: newName };
    setUser(updated);
    localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(updated));
    // Optional: sync to backend in background
    fetch(`${API_BASE}/leaderboard/join?team_name=${user.teamName}`, {
      method: 'POST',
      headers: {
        'x-user-id': localUserId
      }
    }).catch(() => {});
  };

  const joinTeam = async (teamName: string) => {
    if (!user) return;
    const updated = { ...user, teamName };
    setUser(updated);
    localStorage.setItem(`terra_profile_${localUserId}`, JSON.stringify(updated));
    try {
      await fetch(`${API_BASE}/leaderboard/join?team_name=${encodeURIComponent(teamName)}`, {
        method: 'POST',
        headers: { 'x-user-id': localUserId }
      });
    } catch (e) {
      console.warn("Backend offline, team join saved locally.");
    }
  };

  return {
    user,
    loading,
    saveOnboarding,
    updateUsername,
    joinTeam,
    refreshProfile: fetchProfile
  };
}

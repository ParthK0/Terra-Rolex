import { useState, useEffect, useCallback } from 'react';
import { calculateBaselineClient } from '../lib/co2calc';
import { apiFetch, registerLogoutCallback } from '../lib/api';

export interface UserProfile {
  userId: string;
  userName: string;
  streak: number;
  baseline_co2: number;
  teamName: string;
  badges: string[];
  completed_challenges: string[];
  role: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem("terra_token");
    localStorage.removeItem("terra_userId");
    setUser(null);
    setAuthError(null);
  }, []);

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("terra_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiFetch("/auth/me");
      if (response.ok) {
        const profileData = await response.json();
        const baseProfile: UserProfile = {
          userId: profileData.userId,
          userName: profileData.userName,
          streak: profileData.streak || 0,
          baseline_co2: profileData.baseline_co2 || 250.0,
          teamName: profileData.teamName || "Floor 3",
          badges: profileData.badges || ["Carbon Onboarder"],
          completed_challenges: profileData.completed_challenges || [],
          role: profileData.role || (profileData.userName?.toLowerCase() === 'admin' ? 'admin' : 'user')
        };
        setUser(baseProfile);
        localStorage.setItem("terra_userId", baseProfile.userId);
        localStorage.setItem(`terra_profile_${baseProfile.userId}`, JSON.stringify(baseProfile));
      } else if (response.status === 401) {
        // Token expired/invalid, clear session
        logout();
      } else {
        throw new Error("Profile request failed");
      }
    } catch (err) {
      // Offline fallback: try reading from last cached user ID
      const cachedUid = localStorage.getItem("terra_userId");
      if (cachedUid) {
        const cachedProfile = localStorage.getItem(`terra_profile_${cachedUid}`);
        if (cachedProfile) {
          setUser(JSON.parse(cachedProfile));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchProfile();
    // Register logout callback so apiFetch 401 interceptor can call our clean logout
    registerLogoutCallback(() => logout());
  }, [fetchProfile, logout]);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("terra_token", data.access_token);
        localStorage.setItem("terra_userId", data.userId);
        await fetchProfile();
        return true;
      } else {
        const errData = await res.json();
        setAuthError(errData.detail || "Incorrect username or password.");
        return false;
      }
    } catch (e) {
      setAuthError("Network error. Please check if backend is online.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("terra_token", data.access_token);
        localStorage.setItem("terra_userId", data.userId);
        await fetchProfile();
        return true;
      } else {
        const errData = await res.json();
        setAuthError(errData.detail || "Registration failed. Try a different username.");
        return false;
      }
    } catch (e) {
      setAuthError("Network error. Please check if backend is online.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const saveOnboarding = async (formData: {
    transportKm: number;
    transportType: string;
    dietType: string;
    acHours: number;
    flightsCount: number;
    shoppingFreq: string;
  }) => {
    if (!user) return;
    try {
      const response = await apiFetch("/insights/onboarding", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          ...user,
          baseline_co2: data.monthly_baseline_kg,
        };
        setUser(updated);
        localStorage.setItem(`terra_profile_${user.userId}`, JSON.stringify(updated));
        return data;
      } else {
        throw new Error("Failed to save onboarding on backend");
      }
    } catch (err) {
      // Local fallback calculation
      const clientMath = calculateBaselineClient(
        formData.transportKm,
        formData.transportType,
        formData.dietType,
        formData.acHours,
        formData.flightsCount,
        formData.shoppingFreq
      );

      const updated: UserProfile = {
        ...user,
        baseline_co2: clientMath.monthlyBaselineKg,
      };
      setUser(updated);
      localStorage.setItem(`terra_profile_${user.userId}`, JSON.stringify(updated));
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
    localStorage.setItem(`terra_profile_${user.userId}`, JSON.stringify(updated));
    apiFetch(`/leaderboard/join?team_name=${encodeURIComponent(user.teamName)}`, {
      method: 'POST'
    }).catch(() => {});
  };

  const joinTeam = async (teamName: string) => {
    if (!user) return;
    const updated = { ...user, teamName };
    setUser(updated);
    localStorage.setItem(`terra_profile_${user.userId}`, JSON.stringify(updated));
    try {
      await apiFetch(`/leaderboard/join?team_name=${encodeURIComponent(teamName)}`, {
        method: 'POST'
      });
    } catch (e) {
      console.warn("Backend offline, team join saved locally.");
    }
  };

  return {
    user,
    loading,
    authError,
    login,
    signup,
    logout,
    saveOnboarding,
    updateUsername,
    joinTeam,
    refreshProfile: fetchProfile
  };
}

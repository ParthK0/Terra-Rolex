import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Search, 
  Trash2, 
  Edit2, 
  Flame, 
  UserCheck, 
  X, 
  Check
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface UserDetail {
  userId: string;
  userName: string;
  streak: number;
  baseline_co2: number;
  teamName: string;
  badges: string[];
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit team state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        throw new Error('Failed to retrieve user accounts.');
      }
    } catch (error) { const err = error as Error;
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateTeam = async (userId: string) => {
    if (!newTeamName.trim()) return;
    try {
      const response = await apiFetch(`/admin/users/${userId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: newTeamName.trim() })
      });
      if (response.ok) {
        setUsers(users.map(u => u.userId === userId ? { ...u, teamName: newTeamName.trim() } : u));
        setEditingUserId(null);
        setNewTeamName('');
      } else {
        throw new Error('Could not update user team.');
      }
    } catch (error) { const err = error as Error;
      alert(err.message);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you absolutely sure you want to delete user "${userName}"? This will permanently delete their account and all logged carbon footprint data.`)) {
      return;
    }
    try {
      const response = await apiFetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setUsers(users.filter(u => u.userId !== userId));
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || 'Could not delete user.');
      }
    } catch (error) { const err = error as Error;
      alert(err.message);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const targetRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Are you sure you want to change this user's role to ${targetRole.toUpperCase()}?`)) {
      return;
    }
    try {
      const response = await apiFetch(`/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: targetRole })
      });
      if (response.ok) {
        setUsers(users.map(u => u.userId === userId ? { ...u, role: targetRole } : u));
      } else {
        throw new Error('Could not update user role.');
      }
    } catch (error) { const err = error as Error;
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(user => 
    user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId.includes(searchTerm)
  );

  if (loading) {
    return <LoadingSpinner message="Retrieving registered guardians..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
            Guardian Registry
          </h1>
          <p className="text-sm font-semibold text-text-grey mt-1">
            Oversee active users, reassign teams, and manage credentials.
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-grey">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search username, team, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-charcoal placeholder-text-grey/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150 text-[11px] uppercase tracking-wider font-extrabold text-text-grey">
                <th className="py-4 px-6">Guardian</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Streak</th>
                <th className="py-4 px-6">Team Assignment</th>
                <th className="py-4 px-6">Monthly Baseline</th>
                <th className="py-4 px-6">Badges Earned</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 font-semibold text-text-grey">
                    No users found matching "{searchTerm}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50/50 transition-colors">
                    
                    {/* User Info */}
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="font-bold text-text-charcoal block">{user.userName}</span>
                          <span className="font-mono text-[10px] text-text-grey block">{user.userId.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4.5 px-6">
                      <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                          : 'bg-blue-50 text-accent-blue border border-blue-100'
                      }`}>
                        {user.role?.toUpperCase() || 'USER'}
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-1.5 font-bold text-text-charcoal">
                        <Flame className="h-4.5 w-4.5 fill-red-500 text-red-500" />
                        <span>{user.streak} days</span>
                      </div>
                    </td>

                    {/* Team */}
                    <td className="py-4.5 px-6">
                      {editingUserId === user.userId ? (
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <input
                            type="text"
                            value={newTeamName}
                            onChange={(e) => setNewTeamName(e.target.value)}
                            placeholder="Team name"
                            className="bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
                          />
                          <button
                            onClick={() => handleUpdateTeam(user.userId)}
                            className="bg-accent-green hover:bg-accent-green/90 text-white p-1 rounded-lg transition-colors cursor-pointer"
                            title="Save"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUserId(null);
                              setNewTeamName('');
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-text-grey p-1 rounded-lg transition-colors cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-charcoal">{user.teamName}</span>
                          <button
                            onClick={() => {
                              setEditingUserId(user.userId);
                              setNewTeamName(user.teamName);
                            }}
                            className="text-text-grey hover:text-accent-blue p-1 hover:bg-gray-100 rounded transition-all cursor-pointer"
                            title="Reassign team"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Baseline */}
                    <td className="py-4.5 px-6">
                      <span className="font-bold text-text-charcoal">{user.baseline_co2.toFixed(1)} kg</span>
                    </td>

                    {/* Badges */}
                    <td className="py-4.5 px-6">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {user.badges && user.badges.length > 0 ? (
                          user.badges.map(b => (
                            <span key={b} className="px-2 py-0.5 text-[9px] font-bold bg-gray-100 text-text-grey rounded-md">
                              {b}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] italic text-text-grey/60">No badges</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4.5 px-6 text-right">
                      {user.userName.toLowerCase() === 'admin' ? (
                        <span className="text-[10px] font-bold text-text-grey/50 italic mr-2">System Admin</span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleRole(user.userId, user.role)}
                            className="text-text-grey hover:text-purple-600 hover:bg-purple-50 p-2 rounded-xl transition-all cursor-pointer text-xs font-bold"
                            title={`Change role to ${user.role === 'admin' ? 'user' : 'admin'}`}
                          >
                            Toggle Role
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.userId, user.userName)}
                            className="text-text-grey hover:text-accent-red hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer"
                            title="Delete user account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

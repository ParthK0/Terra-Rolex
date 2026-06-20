import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Leaf, 
  Save, 
  X,
  Search,
  Filter
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Challenge {
  id: string;
  title: string;
  description: string;
  co2_savings_kg: number;
  category: string;
  completed?: boolean;
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // New Challenge Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSavings, setNewSavings] = useState<number>(1.0);
  const [newCategory, setNewCategory] = useState('transport');

  // Edit Challenge State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSavings, setEditSavings] = useState<number>(1.0);
  const [editCategory, setEditCategory] = useState('transport');

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/admin/challenges');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data);
      } else {
        throw new Error('Failed to load environmental challenges.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newTitle.trim() || !newDescription.trim() || newSavings <= 0) {
      alert('Please fill out all fields correctly.');
      return;
    }
    
    // Check for duplicate ID
    if (challenges.some(c => c.id.toLowerCase() === newId.trim().toLowerCase())) {
      alert('A challenge with this unique ID already exists.');
      return;
    }

    try {
      const response = await apiFetch('/admin/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newId.trim(),
          title: newTitle.trim(),
          description: newDescription.trim(),
          co2_savings_kg: Number(newSavings),
          category: newCategory
        })
      });

      if (response.ok) {
        const added = await response.json();
        setChallenges([...challenges, added]);
        
        // Reset form
        setNewId('');
        setNewTitle('');
        setNewDescription('');
        setNewSavings(1.0);
        setNewCategory('transport');
        setShowAddForm(false);
      } else {
        throw new Error('Could not create challenge on server.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEdit = (challenge: Challenge) => {
    setEditingId(challenge.id);
    setEditTitle(challenge.title);
    setEditDescription(challenge.description);
    setEditSavings(challenge.co2_savings_kg);
    setEditCategory(challenge.category);
  };

  const handleSaveEdit = async (challengeId: string) => {
    if (!editTitle.trim() || !editDescription.trim() || editSavings <= 0) {
      alert('Please fill out all fields correctly.');
      return;
    }

    try {
      const response = await apiFetch(`/admin/challenges/${challengeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim(),
          co2_savings_kg: Number(editSavings),
          category: editCategory
        })
      });

      if (response.ok) {
        setChallenges(challenges.map(c => c.id === challengeId ? {
          ...c,
          title: editTitle.trim(),
          description: editDescription.trim(),
          co2_savings_kg: Number(editSavings),
          category: editCategory
        } : c));
        setEditingId(null);
      } else {
        throw new Error('Failed to update challenge.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteChallenge = async (challengeId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete challenge "${title}"?`)) {
      return;
    }

    try {
      const response = await apiFetch(`/admin/challenges/${challengeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setChallenges(challenges.filter(c => c.id !== challengeId));
      } else {
        throw new Error('Failed to delete challenge.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };
  const filteredChallenges = challenges.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });
  if (loading) {
    return <LoadingSpinner message="Querying active planetary operations..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text-charcoal tracking-tight font-display">
            Planetary Challenges
          </h1>
          <p className="text-sm font-semibold text-text-grey mt-1">
            Configure global task rewards, environmental actions, and CO₂ metrics.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue/90 text-white font-bold text-sm px-4 py-2.5 rounded-2xl shadow-md shadow-accent-blue/15 hover:shadow-lg transition-all cursor-pointer select-none active:scale-95"
        >
          {showAddForm ? (
            <>
              <X className="h-4.5 w-4.5" />
              <span>Cancel Form</span>
            </>
          ) : (
            <>
              <Plus className="h-4.5 w-4.5" />
              <span>New Challenge</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {/* Add Form (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddChallenge} className="premium-card p-6 border border-accent-blue/20 bg-white/70 backdrop-blur-md animate-fade-in space-y-4">
          <h3 className="text-base font-bold text-text-charcoal flex items-center gap-2">
            <Plus className="h-4.5 w-4.5 text-accent-blue" />
            Create Environmental Challenge
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-charcoal block">Unique ID</label>
              <input
                type="text"
                required
                placeholder="e.g. c10"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-charcoal block">Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Turn Off Extra Lights"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-charcoal block">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              >
                <option value="transport">Transport</option>
                <option value="energy">Energy</option>
                <option value="diet">Diet</option>
                <option value="waste">Waste</option>
                <option value="water">Water</option>
                <option value="community">Community</option>
              </select>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-charcoal block">Description</label>
              <input
                type="text"
                required
                placeholder="Brief summary of how to achieve this and its impact"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-text-charcoal block">CO₂ Savings (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={newSavings}
                onChange={(e) => setNewSavings(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
              />
            </div>

          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="bg-accent-green hover:bg-accent-green/90 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              Add Challenge
            </button>
          </div>
        </form>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-grey">
            <Search className="h-4.5 w-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search challenges by ID, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-text-charcoal placeholder-text-grey/60 focus:outline-none focus:ring-2 focus:ring-accent-blue/20 focus:border-accent-blue transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-text-grey shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-text-charcoal focus:outline-none focus:ring-2 focus:ring-accent-blue/20"
          >
            <option value="all">All Categories</option>
            <option value="transport">Transport</option>
            <option value="energy">Energy</option>
            <option value="diet">Diet</option>
            <option value="waste">Waste</option>
            <option value="water">Water</option>
            <option value="community">Community</option>
          </select>
        </div>
      </div>

      {/* Challenges List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredChallenges.length === 0 ? (
          <div className="premium-card p-10 text-center col-span-2 text-text-grey font-semibold">
            No environmental challenges found.
          </div>
        ) : (
          filteredChallenges.map((c) => (
            <div 
              key={c.id} 
              className={`premium-card p-5 flex flex-col justify-between transition-all border-l-4 ${
                editingId === c.id 
                  ? 'border-accent-blue bg-blue-50/10' 
                  : c.category === 'transport' ? 'border-l-accent-blue' :
                    c.category === 'energy' ? 'border-l-yellow-500' :
                    c.category === 'diet' ? 'border-l-accent-green' :
                    c.category === 'waste' ? 'border-l-accent-amber' : 'border-l-purple-500'
              }`}
            >
              {editingId === c.id ? (
                // Edit Mode
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-text-grey bg-gray-150 px-2 py-0.5 rounded">
                      ID: {c.id}
                    </span>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs text-text-charcoal focus:outline-none"
                    >
                      <option value="transport">Transport</option>
                      <option value="energy">Energy</option>
                      <option value="diet">Diet</option>
                      <option value="waste">Waste</option>
                      <option value="water">Water</option>
                      <option value="community">Community</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-text-charcoal"
                      placeholder="Challenge Title"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-text-grey focus:outline-none"
                      placeholder="Description"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-charcoal">CO₂ Saved:</span>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={editSavings}
                        onChange={(e) => setEditSavings(Number(e.target.value))}
                        className="bg-white border border-gray-200 rounded-lg px-2 py-0.5 text-xs w-20 text-text-charcoal"
                      />
                      <span className="text-xs text-text-grey">kg</span>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-1.5">
                    <button
                      onClick={() => handleSaveEdit(c.id)}
                      className="flex items-center gap-1 bg-accent-green hover:bg-accent-green/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Save className="h-3 w-3" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-text-grey font-bold text-[10px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-text-grey bg-gray-100 px-2 py-0.5 rounded">
                        ID: {c.id}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${
                        c.category === 'transport' ? 'bg-blue-50 text-accent-blue' :
                        c.category === 'energy' ? 'bg-yellow-50 text-yellow-700' :
                        c.category === 'diet' ? 'bg-green-50 text-accent-green' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {c.category}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-text-charcoal font-display tracking-tight leading-tight">
                      {c.title}
                    </h3>
                    <p className="text-xs text-text-grey font-semibold mt-1.5 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-accent-green font-bold text-xs bg-green-50/50 border border-green-100/50 px-3 py-1 rounded-full">
                      <Leaf className="h-3.5 w-3.5 fill-accent-green/20" />
                      <span>-{c.co2_savings_kg.toFixed(1)} kg CO₂</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(c)}
                        className="text-text-grey hover:text-accent-blue hover:bg-gray-150 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="Edit challenge"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChallenge(c.id, c.title)}
                        className="text-text-grey hover:text-accent-red hover:bg-red-50 p-1.5 rounded-lg transition-all cursor-pointer"
                        title="Delete challenge"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

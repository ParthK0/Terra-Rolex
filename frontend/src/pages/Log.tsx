import { useState } from 'react';
import { calculateCO2Client } from '../lib/co2calc';
import { getVisceralComparison } from '../lib/benchmarks';
import { Plane, Car, Leaf, Zap, HelpCircle } from 'lucide-react';

interface LogProps {
  onLog: (category: string, subtype: string, amount: number, description?: string) => Promise<any>;
}

export default function Log({ onLog }: LogProps) {
  const [activeTab, setActiveTab] = useState<'transport' | 'food' | 'energy' | 'flights'>('transport');
  const [amount, setAmount] = useState<number>(10);
  const [subtype, setSubtype] = useState<string>('car');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Compute live equivalents
  const clientCalc = calculateCO2Client(activeTab, subtype, amount);
  const equivalenceText = getVisceralComparison(clientCalc.co2Kg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return;
    }
    setSubmitting(true);
    try {
      const desc = description.trim() || `Logged ${activeTab} - ${subtype}`;
      await onLog(activeTab, subtype, amount, desc);
      alert("Activity logged successfully! Watch your Living World react.");
      // Reset form
      setAmount(10);
      setDescription('');
    } catch (err) {
      console.error(err);
      alert("Failed to log activity. Log saved locally.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (tab: 'transport' | 'food' | 'energy' | 'flights') => {
    setActiveTab(tab);
    // Set default subtypes and quantities per tab
    if (tab === 'transport') {
      setSubtype('car');
      setAmount(15);
    } else if (tab === 'food') {
      setSubtype('balanced');
      setAmount(1);
    } else if (tab === 'energy') {
      setSubtype('ac');
      setAmount(4);
    } else if (tab === 'flights') {
      setSubtype('flight_short');
      setAmount(1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white">Log Daily Activity</h1>
        <p className="text-sm text-gray-400 mt-1">
          Every activity logged translates to real-world carbon outputs. Track them to see the immediate environmental comparison.
        </p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 bg-gray-950 p-1.5 rounded-2xl border border-white/5">
        {[
          { id: 'transport', label: 'Commute', icon: Car },
          { id: 'food', label: 'Meals', icon: Leaf },
          { id: 'energy', label: 'Energy', icon: Zap },
          { id: 'flights', label: 'Flights', icon: Plane }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`py-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-gray-950 font-bold shadow-md shadow-emerald-500/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs sm:text-sm font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Column */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card p-6 md:p-8 border border-white/5 space-y-6">
          {/* Subtype Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-300">Activity Detail</label>
            
            {activeTab === 'transport' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'car', label: 'Petrol Car', icon: '🚗' },
                  { id: 'electric_car', label: 'Electric Car', icon: '⚡' },
                  { id: 'motorbike', label: 'Motorbike', icon: '🛵' },
                  { id: 'public_transport', label: 'Bus / Train', icon: '🚌' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtype(item.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      subtype === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'food' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'heavy_meat', label: 'Beef / Lamb meal', icon: '🥩' },
                  { id: 'balanced', label: 'Poultry / Fish / Dairy', icon: '🍽️' },
                  { id: 'vegetarian', label: 'Vegetarian Meal', icon: '🧀' },
                  { id: 'vegan', label: 'Strict Vegan Meal', icon: '🥗' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtype(item.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      subtype === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'energy' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ac', label: 'Air Conditioner', icon: '❄️' },
                  { id: 'appliances', label: 'Appliances (Dryer/Oven)', icon: '🧺' },
                  { id: 'lighting', label: 'Lighting (80W usage)', icon: '💡' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtype(item.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      subtype === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'flights' && (
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'flight_short', label: 'Short Flight (< 3 hours, e.g. Delhi-Mumbai)', icon: '✈️' },
                  { id: 'flight_medium', label: 'Medium Flight (3-6 hours, e.g. Mumbai-Singapore)', icon: '✈️' },
                  { id: 'flight_long', label: 'Long Flight (> 6 hours, e.g. Delhi-London)', icon: '✈️' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtype(item.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      subtype === item.id
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-xs font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-bold text-gray-300">
                {activeTab === 'transport' && 'Distance Traveled (km)'}
                {activeTab === 'food' && 'Servings / Meals'}
                {activeTab === 'energy' && 'Hours of Operation'}
                {activeTab === 'flights' && 'Number of Passenger Trips'}
              </label>
              <span className="text-emerald-400 font-extrabold text-sm">{amount}</span>
            </div>
            <input
              type="number"
              min="1"
              max={activeTab === 'transport' ? 2000 : activeTab === 'energy' ? 24 : 10}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-300">Note / Description (Optional)</label>
            <input
              type="text"
              placeholder={
                activeTab === 'transport' ? 'e.g. Morning commute to office' :
                activeTab === 'food' ? 'e.g. Lunch with team' :
                activeTab === 'energy' ? 'e.g. Home office cooling' :
                'e.g. Business trip to Mumbai'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-950 border border-white/5 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-gray-950 font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Logging Action...' : 'Save Carbon Record'}
          </button>
        </form>

        {/* Real-time Awareness Card Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Awareness Hook</span>
            <div className="space-y-2">
              <span className="text-xs text-gray-500 block">Carbon Output equivalent</span>
              <div className="text-4xl font-black text-white leading-none">
                {clientCalc.co2Kg} <span className="text-base font-normal text-gray-400">kg CO₂</span>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider block">Context Comparison</span>
              <p className="text-sm text-gray-200 leading-relaxed">
                That single choice represents <strong className="text-white">{equivalenceText}</strong>.
              </p>
            </div>

            <div className="pt-4 border-t border-white/5 text-[11px] text-gray-500 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Calculations based on local Indian Grid Mix (1.2 kg CO₂/kWh).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

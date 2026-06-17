import { useState } from 'react';
import { calculateCO2Client } from '../lib/co2calc';
import { getVisceralComparison } from '../lib/benchmarks';
import { Plane, Car, Leaf, Zap, HelpCircle, Info } from 'lucide-react';

interface LogProps {
  onLog: (category: string, subtype: string, amount: number, description?: string) => Promise<any>;
}

export default function Log({ onLog }: LogProps) {
  const [activeTab, setActiveTab] = useState<'transport' | 'food' | 'energy' | 'flights'>('transport');
  const [amount, setAmount] = useState<number>(15);
  const [subtype, setSubtype] = useState<string>('car');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Compute live equivalents
  const clientCalc = calculateCO2Client(activeTab, subtype, amount);
  const equivalenceText = getVisceralComparison(clientCalc.co2Kg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (amount <= 0 || isNaN(amount)) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    setSubmitting(true);
    try {
      const desc = description.trim() || `Logged ${activeTab} - ${subtype}`;
      await onLog(activeTab, subtype, amount, desc);
      setSuccessMsg("Activity logged successfully!");
      // Reset form
      setAmount(10);
      setDescription('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to log activity. Log saved locally.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (tab: 'transport' | 'food' | 'energy' | 'flights') => {
    setActiveTab(tab);
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
    <div className="min-h-screen bg-white py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Page Title & Desc */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-text-charcoal">Log Daily Activity</h1>
          <p className="text-sm text-text-grey">
            Every logged choice translates to real-world carbon outputs. Track them to see immediate comparisons.
          </p>
        </div>

        {/* Segmented Control Tab Bar in Solid Blue */}
        <div 
          role="tablist" 
          aria-label="Activity category" 
          className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200/60"
        >
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
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                onClick={() => handleTabChange(tab.id as any)}
                className={`py-3 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-2 transition-all cursor-pointer font-bold text-xs ${
                  isActive
                    ? 'bg-accent-blue text-white shadow-sm'
                    : 'text-text-grey hover:text-text-charcoal hover:bg-gray-200/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4">
          
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
            
            {/* Subtype Selection */}
            <div className="space-y-3">
              <label className="block text-xs uppercase font-bold text-text-grey tracking-wider">
                Select Specific Category Type
              </label>
              
              {activeTab === 'transport' && (
                <div className="grid grid-cols-2 gap-3">
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
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                        subtype === item.id
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'food' && (
                <div className="grid grid-cols-2 gap-3">
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
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                        subtype === item.id
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'energy' && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'ac', label: 'Air Conditioner', icon: '❄️' },
                    { id: 'appliances', label: 'Appliances', icon: '🧺' },
                    { id: 'lighting', label: 'Lighting', icon: '💡' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubtype(item.id)}
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                        subtype === item.id
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'flights' && (
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'flight_short', label: 'Short Flight (< 3 hours, e.g. Delhi-Mumbai)', icon: '✈️' },
                    { id: 'flight_medium', label: 'Medium Flight (3-6 hours, e.g. Mumbai-Singapore)', icon: '✈️' },
                    { id: 'flight_long', label: 'Long Flight (> 6 hours, e.g. Delhi-London)', icon: '✈️' }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSubtype(item.id)}
                      className={`p-3.5 rounded-xl border-2 text-left flex items-center gap-3 transition-all cursor-pointer ${
                        subtype === item.id
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input & Inline Highlight Callout Chip */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-bold text-text-grey tracking-wider">
                  {activeTab === 'transport' && 'Distance Traveled (km)'}
                  {activeTab === 'food' && 'Servings / Meals'}
                  {activeTab === 'energy' && 'Hours of Operation'}
                  {activeTab === 'flights' && 'Number of Passenger Trips'}
                </label>
                <span className="text-accent-blue font-bold text-sm">{amount}</span>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                <input
                  type="number"
                  min="1"
                  max={activeTab === 'transport' ? 2000 : activeTab === 'energy' ? 24 : 10}
                  value={amount || ''}
                  onChange={(e) => setAmount(e.target.value === '' ? 0 : Number(e.target.value))}
                  aria-invalid={amount <= 0 ? 'true' : 'false'}
                  className="flex-grow border border-gray-200 rounded-xl px-4 py-3 text-text-charcoal text-sm focus:outline-none focus:border-accent-blue"
                />

                {/* Inline Highlight Callout Chip */}
                {amount > 0 && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-accent-blue/15 text-accent-blue rounded-xl text-xs font-semibold sm:max-w-xs">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>≈ {clientCalc.co2Kg.toFixed(1)} kg CO₂ — {equivalenceText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes / Description */}
            <div className="space-y-2">
              <label className="block text-xs uppercase font-bold text-text-grey tracking-wider">
                Note / Description (Optional)
              </label>
              <input
                type="text"
                placeholder={
                  activeTab === 'transport' ? 'e.g. Morning commute to office' :
                  activeTab === 'food' ? 'e.g. Lunch with team' :
                  activeTab === 'energy' ? 'e.g. Home office cooling' :
                  'e.g. Business trip'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-text-charcoal text-sm focus:outline-none focus:border-accent-blue"
              />
            </div>

            {/* Messages */}
            {errorMsg && (
              <div role="alert" className="p-4 bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs rounded-xl font-bold">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div role="status" className="p-4 bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs rounded-xl font-bold">
                {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              aria-label="Save carbon activity record"
              aria-busy={submitting}
              className="w-full py-4 rounded-xl bg-accent-green hover:bg-green-600 text-white font-bold text-sm shadow-md shadow-accent-green/10 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Carbon Record'}
            </button>
          </form>

          {/* Right Column (Airy info card) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="premium-card p-6 space-y-6">
              <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider block">Live Equivalent Summary</span>
              
              <div className="space-y-1">
                <span className="text-xs text-text-grey block">Calculated Carbon Output</span>
                <div className="text-5xl font-black text-text-charcoal leading-none tracking-tight">
                  {clientCalc.co2Kg.toFixed(1)} <span className="text-lg font-normal text-text-grey">kg CO₂</span>
                </div>
              </div>

              <div className="p-4 bg-bg-base border border-gray-200/60 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase text-accent-blue tracking-wider block">Visualized Impact</span>
                <p className="text-xs text-text-charcoal leading-relaxed font-semibold">
                  This logged activity matches the environmental cost of <span className="text-accent-blue font-bold">{equivalenceText}</span>.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-200/50 text-[10px] text-text-grey flex items-center gap-1.5 font-bold">
                <HelpCircle className="h-4 w-4" />
                <span>Standard local emission calculations.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

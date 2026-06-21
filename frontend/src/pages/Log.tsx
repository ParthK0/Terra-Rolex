import { useState, useEffect, useRef } from 'react';
import { calculateCO2Client } from '../utils/co2calc';
import { getVisceralComparison } from '../utils/benchmarks';
import { Plane, Car, Leaf, Zap, HelpCircle, Info, Plus, Minus, MapPin, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogProps {
  onLog: (category: string, subtype: string, amount: number, description?: string, fuelType?: string, region?: string) => Promise<any>;
}

export default function Log({ onLog }: LogProps) {
  const [activeTab, setActiveTab] = useState<'transport' | 'food' | 'energy' | 'flights'>('transport');
  const [amount, setAmount] = useState<number>(15);
  const [subtype, setSubtype] = useState<string>('car');
  const [fuelType, setFuelType] = useState<string>('petrol');
  const [region, setRegion] = useState<string>('IN-national-avg');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Google Maps Platform integration states/refs
  const [useRouteCalc, setUseRouteCalc] = useState(false);
  const [startLoc, setStartLoc] = useState('');
  const [destLoc, setDestLoc] = useState('');
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const destInputRef = useRef<HTMLInputElement>(null);
  const autocompleteStartRef = useRef<any>(null);
  const autocompleteDestRef = useRef<any>(null);

  // Load Google Maps JavaScript API script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn("VITE_GOOGLE_MAPS_API_KEY is not defined. Route calculator will not load.");
      return;
    }

    // Return if already loaded
    if (window.hasOwnProperty('google') && (window as any).google?.maps) {
      setMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapsLoaded(true);
      script.onerror = () => console.error("Failed to load Google Maps script.");
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setMapsLoaded(true));
    }
  }, []);

  // Initialize Places Autocomplete when maps load and toggle is ON
  useEffect(() => {
    if (!mapsLoaded || !useRouteCalc || activeTab !== 'transport') return;

    // Timeout ensures inputs have rendered before initializing
    const timer = setTimeout(() => {
      const g = (window as any).google;
      if (!g || !g.maps || !g.maps.places) return;

      if (startInputRef.current && !autocompleteStartRef.current) {
        autocompleteStartRef.current = new g.maps.places.Autocomplete(startInputRef.current, {
          types: ['geocode', 'establishment']
        });
        autocompleteStartRef.current.addListener('place_changed', () => {
          const place = autocompleteStartRef.current.getPlace();
          if (place && place.formatted_address) {
            setStartLoc(place.formatted_address);
          } else if (startInputRef.current) {
            setStartLoc(startInputRef.current.value);
          }
        });
      }

      if (destInputRef.current && !autocompleteDestRef.current) {
        autocompleteDestRef.current = new g.maps.places.Autocomplete(destInputRef.current, {
          types: ['geocode', 'establishment']
        });
        autocompleteDestRef.current.addListener('place_changed', () => {
          const place = autocompleteDestRef.current.getPlace();
          if (place && place.formatted_address) {
            setDestLoc(place.formatted_address);
          } else if (destInputRef.current) {
            setDestLoc(destInputRef.current.value);
          }
        });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [mapsLoaded, useRouteCalc, activeTab]);

  // Directions Service route distance calculation
  const handleCalculateRoute = async () => {
    const origin = startLoc || startInputRef.current?.value || '';
    const destination = destLoc || destInputRef.current?.value || '';

    if (!origin || !destination) {
      setErrorMsg("Please enter both Starting Point and Destination.");
      return;
    }

    const g = (window as any).google;
    if (!g || !g.maps) {
      setErrorMsg("Google Maps is not loaded. Try manual entry.");
      return;
    }

    setErrorMsg(null);
    setCalculatingRoute(true);

    try {
      const directionsService = new g.maps.DirectionsService();
      
      // Determine travel mode based on the selected subtype
      let travelMode = g.maps.TravelMode.DRIVING;
      if (subtype === 'public_transport') {
        travelMode = g.maps.TravelMode.TRANSIT;
      }

      directionsService.route(
        {
          origin,
          destination,
          travelMode
        },
        (result: any, status: any) => {
          setCalculatingRoute(false);
          if (status === g.maps.DirectionsStatus.OK) {
            const route = result.routes[0];
            const leg = route.legs[0];
            const distanceInKm = Math.round(leg.distance.value / 100) / 10; // 1 decimal place accuracy
            setAmount(distanceInKm);
            
            // Auto populate description with route summary
            const startName = leg.start_address.split(',')[0];
            const destName = leg.end_address.split(',')[0];
            setDescription(`Commute from ${startName} to ${destName}`);
            
            setSuccessMsg(`Route calculated: ${distanceInKm} km via ${subtype === 'public_transport' ? 'Transit' : 'Road'}.`);
          } else {
            console.error("Directions query status:", status);
            setErrorMsg(`Could not calculate route: ${status}. Check addresses or use manual entry.`);
          }
        }
      );
    } catch (error) { const err = error as Error;
      setCalculatingRoute(false);
      console.error(err);
      setErrorMsg("Error communicating with Google Directions API. Use manual input.");
    }
  };


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
      const ft = activeTab === 'transport' ? fuelType : undefined;
      const rg = activeTab === 'energy' ? region : undefined;
      await onLog(activeTab, subtype, amount, desc, ft, rg);
      setSuccessMsg("Activity logged successfully!");
      // Reset amount to category default
      resetAmountForTab(activeTab);
      setDescription('');
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to log activity. Log saved locally.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAmountForTab = (tab: 'transport' | 'food' | 'energy' | 'flights') => {
    if (tab === 'transport') setAmount(15);
    else if (tab === 'food') setAmount(1);
    else if (tab === 'energy') setAmount(4);
    else if (tab === 'flights') setAmount(1);
  };

  const handleTabChange = (tab: 'transport' | 'food' | 'energy' | 'flights') => {
    setActiveTab(tab);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (tab === 'transport') {
      setSubtype('car');
      setFuelType('petrol');
      setAmount(15);
    } else if (tab === 'food') {
      setSubtype('balanced');
      setAmount(1);
    } else if (tab === 'energy') {
      setSubtype('ac');
      setRegion('IN-national-avg');
      setAmount(4);
    } else if (tab === 'flights') {
      setSubtype('flight_short');
      setAmount(1);
    }
  };

  // Helper limits for range slider
  const getLimits = () => {
    switch (activeTab) {
      case 'transport': return { min: 0, max: 500, step: 5 };
      case 'food': return { min: 0, max: 10, step: 1 };
      case 'energy': return { min: 0, max: 24, step: 1 };
      case 'flights': return { min: 0, max: 5, step: 1 };
    }
  };

  const limits = getLimits();

  const increment = () => {
    setAmount(prev => Math.min(limits.max, prev + limits.step));
  };

  const decrement = () => {
    setAmount(prev => Math.max(limits.min, prev - limits.step));
  };

  return (
    <div className="min-h-screen bg-bg-base py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Page Title & Desc */}
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-text-charcoal font-display">Log Daily Activity</h1>
          <p className="text-xs text-text-grey font-semibold">
            Every choice you make shapes the sky. Log your commuting, food, and home habits.
          </p>
        </div>

        {/* Segmented Control Tab Bar in Solid Blue */}
        <div 
          role="tablist" 
          aria-label="Activity category" 
          className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl border border-gray-200/50"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pt-4">
          
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-10">
            
            {/* Subtype Selection */}
            <div className="space-y-4">
              <label className="block text-xs uppercase font-bold text-text-grey tracking-wider">
                Select Specific Type
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
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Fuel Type Selector — shown only for car/motorbike transport */}
              {activeTab === 'transport' && (subtype === 'car' || subtype === 'motorbike') && (
                <div className="mt-3 p-4 rounded-2xl border border-accent-blue/10 bg-accent-blue/3 space-y-2">
                  <label className="block text-[11px] uppercase font-bold text-accent-blue tracking-wider">
                    ⛽ Fuel Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'petrol', label: 'Petrol', emoji: '🟠' },
                      { id: 'diesel', label: 'Diesel', emoji: '⚫' },
                      { id: 'hybrid', label: 'Hybrid', emoji: '🟢' },
                      { id: 'electric', label: 'Electric', emoji: '⚡' },
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFuelType(f.id)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          fuelType === f.id
                            ? 'border-accent-blue bg-accent-blue text-white'
                            : 'border-gray-200 text-text-charcoal hover:border-accent-blue/40'
                        }`}
                      >
                        <span>{f.emoji}</span>
                        <span>{f.label}</span>
                      </button>
                    ))}
                  </div>
                  {fuelType === 'electric' && (
                    <p className="text-[10px] text-accent-blue/70 font-semibold pt-1">
                      Electric emissions are scaled by your selected grid region below.
                    </p>
                  )}
                </div>
              )}

              {/* Google Maps Route Calculator Widget */}
              {activeTab === 'transport' && (
                <div className="mt-6 p-5 rounded-2xl border border-gray-100 bg-gray-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-accent-blue" />
                      <span className="text-xs font-bold text-text-charcoal">Use Google Maps Route Calculator</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={useRouteCalc}
                        onChange={(e) => setUseRouteCalc(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent-blue"></div>
                    </label>
                  </div>

                  <AnimatePresence>
                    {useRouteCalc && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="space-y-3 pt-2 overflow-hidden"
                      >
                        {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
                          <div className="text-[10px] text-text-grey font-bold bg-amber-50 border border-amber-200/50 p-3 rounded-lg">
                            ⚠️ Google Maps API Key is not set in environment settings. Please configure key or enter distance manually below.
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-text-grey" />
                              <input
                                type="text"
                                ref={startInputRef}
                                placeholder="Enter starting location..."
                                value={startLoc}
                                onChange={(e) => setStartLoc(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-accent-blue bg-white text-text-charcoal"
                              />
                            </div>

                            <div className="relative">
                              <Navigation className="absolute left-3.5 top-3.5 h-4 w-4 text-text-grey" />
                              <input
                                type="text"
                                ref={destInputRef}
                                placeholder="Enter destination location..."
                                value={destLoc}
                                onChange={(e) => setDestLoc(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-accent-blue bg-white text-text-charcoal"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleCalculateRoute}
                              disabled={calculatingRoute}
                              className="w-full py-3 rounded-xl bg-accent-blue text-white text-xs font-bold hover:bg-blue-600 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                            >
                              {calculatingRoute ? 'Calculating Route...' : 'Calculate Route & Distance'}
                            </button>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
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
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
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
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Regional Grid Selector — shown for all energy types */}
              {activeTab === 'energy' && (
                <div className="mt-3 p-4 rounded-2xl border border-accent-green/10 bg-accent-green/3 space-y-2">
                  <label className="block text-[11px] uppercase font-bold text-accent-green tracking-wider">
                    🔌 Your Electricity Grid Region
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'IN-coal-heavy', label: 'Coal-Heavy', sub: '0.85 kg/kWh', emoji: '🏭' },
                      { id: 'IN-national-avg', label: 'National Avg', sub: '0.78 kg/kWh', emoji: '🇮🇳' },
                      { id: 'IN-green-grid', label: 'Green Grid', sub: '0.62 kg/kWh', emoji: '🌿' },
                      { id: 'Global-average', label: 'Global Avg', sub: '0.45 kg/kWh', emoji: '🌍' },
                    ].map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRegion(r.id)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-left flex items-start gap-2 transition-all cursor-pointer ${
                          region === r.id
                            ? 'border-accent-green bg-accent-green text-white'
                            : 'border-gray-200 text-text-charcoal hover:border-accent-green/40'
                        }`}
                      >
                        <span className="text-base mt-0.5">{r.emoji}</span>
                        <div>
                          <div className="text-xs font-bold leading-tight">{r.label}</div>
                          <div className={`text-[10px] font-semibold ${region === r.id ? 'text-white/70' : 'text-text-grey'}`}>{r.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
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
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input Selection & Inline Equivalent Chip */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs uppercase font-bold text-text-grey tracking-wider">
                  {activeTab === 'transport' && 'Distance Traveled (km)'}
                  {activeTab === 'food' && 'Servings / Meals'}
                  {activeTab === 'energy' && 'Hours of Operation'}
                  {activeTab === 'flights' && 'Passenger Trips'}
                </label>
                <div className="flex items-center gap-1.5">
                  <button 
                    type="button" 
                    onClick={decrement}
                    className="p-1 border border-gray-200 hover:bg-gray-100 rounded-md text-text-charcoal cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  
                  {/* Clean number input to support testing and typing exact values */}
                  <input
                    type="number"
                    min="0"
                    max={limits.max}
                    value={amount === 0 ? '' : amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-16 px-2 py-1 text-center text-xs font-bold border border-gray-200 rounded-md focus:outline-none focus:border-accent-blue bg-bg-base text-accent-blue"
                  />

                  <button 
                    type="button" 
                    onClick={increment}
                    className="p-1 border border-gray-200 hover:bg-gray-100 rounded-md text-text-charcoal cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Slider Component */}
              <div className="space-y-4">
                <input
                  type="range"
                  min={limits.min}
                  max={limits.max}
                  step={limits.step}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full accent-accent-blue h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />

                {/* Inline Highlight Callout Chip */}
                {amount > 0 && (
                  <div className="flex items-start gap-2.5 px-4 py-3 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue rounded-xl text-xs font-bold leading-normal">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-text-charcoal text-xs font-semibold focus:outline-none focus:border-accent-blue"
              />
            </div>

            {/* Error and Success Alert Messages */}
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
              className="w-full py-4 rounded-xl bg-accent-green hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-accent-green/15 cursor-pointer transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Carbon Record'}
            </button>
          </form>

          {/* Right Column (Airy info card) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="premium-card p-6 space-y-6 bg-white">
              <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider block">Live Equivalent Summary</span>
              
              <div className="space-y-1">
                <span className="text-xs text-text-grey block">Calculated Carbon Output</span>
                <div className="text-5xl font-black text-text-charcoal leading-none tracking-tight font-display">
                  {clientCalc.co2Kg.toFixed(1)} <span className="text-lg font-normal text-text-grey">kg CO₂</span>
                </div>
              </div>

              <div className="p-4 bg-bg-base border border-gray-200/50 rounded-2xl space-y-2">
                <span className="text-xs font-bold uppercase text-accent-blue tracking-wider block">Visualized Impact</span>
                <p className="text-xs text-text-charcoal leading-relaxed font-semibold">
                  This logged activity matches the environmental cost of <span className="text-accent-blue font-bold">{equivalenceText}</span>.
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 text-[10px] text-text-grey flex items-center gap-1.5 font-bold">
                <HelpCircle className="h-4 w-4 text-text-grey shrink-0" />
                <span>Standard local emission calculations.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

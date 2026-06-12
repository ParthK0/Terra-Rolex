import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBaselineClient } from '../lib/co2calc';
import { AWARENESS_BENCHMARKS } from '../lib/benchmarks';

interface OnboardingProps {
  onComplete: (data: {
    transportKm: number;
    transportType: string;
    dietType: string;
    acHours: number;
    flightsCount: number;
    shoppingFreq: string;
  }) => Promise<any>;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [transportType, setTransportType] = useState('car');
  const [transportKm, setTransportKm] = useState(300);
  const [dietType, setDietType] = useState('balanced');
  const [acHours, setAcHours] = useState(15);
  const [flightsCount, setFlightsCount] = useState(1);
  const [shoppingFreq, setShoppingFreq] = useState('average');
  const [submitting, setSubmitting] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);

  // Compute live local baseline on the fly for feedback
  const localCalc = calculateBaselineClient(
    transportKm,
    transportType,
    dietType,
    acHours,
    flightsCount,
    shoppingFreq
  );

  // Benchmark references
  const indianResident = AWARENESS_BENCHMARKS.find(b => b.id === 'indian_resident');
  const globalResident = AWARENESS_BENCHMARKS.find(b => b.id === 'global_resident');

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const res = await onComplete({
        transportKm,
        transportType,
        dietType,
        acHours,
        flightsCount,
        shoppingFreq
      });
      setOnboardingResult(res);
      setStep(6);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const stepsInfo = [
    { title: "Transport", desc: "How do you commute?" },
    { title: "Diet", desc: "What does your typical diet look like?" },
    { title: "Energy", desc: "How much do you run your AC?" },
    { title: "Flights", desc: "How many flights do you take per year?" },
    { title: "Shopping", desc: "What are your shopping habits?" },
    { title: "Result", desc: "Your Baseline Carbon Footprint" }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8">
      {/* Progress indicators */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase font-semibold text-emerald-400 tracking-wider">
            Step {step} of 6: {stepsInfo[step - 1].title}
          </span>
          <span className="text-xs text-gray-400">
            {Math.round((step / 6) * 100)}% Complete
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <div className="w-full max-w-2xl min-h-[400px] glass-card glow-green p-6 md:p-10 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{stepsInfo[0].title}</h2>
                <p className="text-sm text-gray-400">{stepsInfo[0].desc}</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm text-gray-300">Mode of Transport</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { id: 'car', label: 'Petrol Car', icon: '🚗' },
                    { id: 'electric_car', label: 'Electric Car', icon: '⚡' },
                    { id: 'motorbike', label: 'Motorbike', icon: '🛵' },
                    { id: 'public_transport', label: 'Bus / Train', icon: '🚌' },
                    { id: 'bicycle', label: 'Bicycle / Walk', icon: '🚲' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setTransportType(mode.id)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        transportType === mode.id
                          ? 'border-emerald-400 bg-emerald-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{mode.icon}</span>
                      <span className="text-xs font-semibold">{mode.label}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Monthly Distance Commuted:</span>
                    <span className="font-semibold text-emerald-400">{transportKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={transportKm}
                    onChange={(e) => setTransportKm(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 km</span>
                    <span>1,500 km</span>
                    <span>3,000+ km</span>
                  </div>
                </div>
              </div>

              {/* Real-time comparison */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">Awareness Pulse</span>
                <p className="text-sm text-gray-300">
                  Your monthly commute generates <strong className="text-white">{(transportKm * (transportType === 'car' ? 0.18 : transportType === 'electric_car' ? 0.05 : transportType === 'motorbike' ? 0.10 : transportType === 'public_transport' ? 0.04 : 0)).toFixed(1)} kg CO2</strong>.
                </p>
                {transportType === 'car' && (
                  <p className="text-xs text-amber-300/80">
                    💡 Swapping this commute to public transit would save around {Math.round(transportKm * 0.14)} kg CO2 per month!
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{stepsInfo[1].title}</h2>
                <p className="text-sm text-gray-400">{stepsInfo[1].desc}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'heavy_meat', label: 'Heavy Meat Eater', desc: 'Frequent beef, lamb, pork, or poultry meals.', icon: '🥩' },
                  { id: 'balanced', label: 'Balanced Mix', desc: 'Average amount of meats, poultry, dairy, and plants.', icon: '🍽️' },
                  { id: 'low_meat', label: 'Low Meat / Fish', desc: 'Mostly fish, chicken, dairy, and vegetables.', icon: '🐟' },
                  { id: 'vegetarian', label: 'Vegetarian', desc: 'Dairy, eggs, plants. No meats or seafood.', icon: '🧀' },
                  { id: 'vegan', label: 'Strict Vegan', desc: 'Strictly plant-based nutrition, zero animal products.', icon: '🥗' }
                ].map(diet => (
                  <button
                    key={diet.id}
                    onClick={() => setDietType(diet.id)}
                    className={`p-4 rounded-xl border text-left flex gap-4 items-start transition-all cursor-pointer ${
                      dietType === diet.id
                        ? 'border-emerald-400 bg-emerald-500/10 text-white'
                        : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-3xl mt-1">{diet.icon}</span>
                    <div>
                      <h4 className="text-sm font-semibold">{diet.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">{diet.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-400">Awareness Pulse</span>
                <p className="text-sm text-gray-300">
                  Your diet produces <strong className="text-white">{(90 * (dietType === 'heavy_meat' ? 3.0 : dietType === 'balanced' ? 1.5 : dietType === 'low_meat' ? 0.8 : dietType === 'vegetarian' ? 0.5 : 0.3)).toFixed(0)} kg CO2</strong> per month.
                </p>
                {dietType === 'heavy_meat' && (
                  <p className="text-xs text-amber-300/80">
                    💡 Red meat generation factors are massive. Going low-meat saves 198 kg of CO2 per month—equivalent to driving 1,100 km.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{stepsInfo[2].title}</h2>
                <p className="text-sm text-gray-400">{stepsInfo[2].desc}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">AC Usage Hours per Week:</span>
                    <span className="font-semibold text-emerald-400">{acHours} hours</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={acHours}
                    onChange={(e) => setAcHours(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 hours (No AC)</span>
                    <span>50 hours</span>
                    <span>100 hours (24/7)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                    <h4 className="text-xs font-semibold text-gray-400 mb-1">Grid Carbon Haze</h4>
                    <p className="text-sm text-gray-300">
                      Typical Indian urban air conditioning runs on coal-heavy grids, translating directly to substantial greenhouse emissions.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                    <h4 className="text-xs font-semibold text-gray-400 mb-1">Your AC Cost</h4>
                    <p className="text-sm text-white font-semibold">
                      {(acHours * 4 * 1.2).toFixed(1)} kg CO2 per month
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Same as running a typical household fan for 4,800 hours.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{stepsInfo[3].title}</h2>
                <p className="text-sm text-gray-400">{stepsInfo[3].desc}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Annual Flights Taken (Short/Medium):</span>
                    <span className="font-semibold text-emerald-400">{flightsCount} flights</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={flightsCount}
                    onChange={(e) => setFlightsCount(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0 flights</span>
                    <span>5 flights</span>
                    <span>10+ flights</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-amber-400">Benchmark Reality Check</span>
                  <p className="text-sm text-gray-300">
                    A single flight from Delhi to Mumbai generates <strong>90 kg of CO2</strong>. That equals <strong>4 months of electricity</strong> for an average Indian household!
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{stepsInfo[4].title}</h2>
                <p className="text-sm text-gray-400">{stepsInfo[4].desc}</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm text-gray-300">Shopping Frequency & Consumer Style</label>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'minimalist', label: 'Eco Minimalist', desc: 'Buy only essentials, second-hand first, zero impulse purchases.', icon: '🌱' },
                    { id: 'average', label: 'Average Consumer', desc: 'Regular purchases, buy clothes/electronics occasionally.', icon: '🛍️' },
                    { id: 'shopaholic', label: 'High Consumer / Shopaholic', desc: 'Frequent online deliveries, fast fashion, gadget upgrades.', icon: '📦' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setShoppingFreq(style.id)}
                      className={`p-4 rounded-xl border text-left flex gap-4 items-center transition-all cursor-pointer ${
                        shoppingFreq === style.id
                          ? 'border-emerald-400 bg-emerald-500/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-2xl">{style.icon}</span>
                      <div>
                        <h4 className="text-sm font-semibold">{style.label}</h4>
                        <p className="text-xs text-gray-400">{style.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-5xl mb-4">🌍</span>
                <h2 className="text-3xl font-extrabold text-white">Baseline Assessment</h2>
                <p className="text-sm text-emerald-400 mt-1 font-semibold">Assessment Complete</p>
              </div>

              <div className="py-6 border-y border-white/5 space-y-4">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">Estimated Carbon Footprint</span>
                  <div className="text-5xl font-black text-white mt-1">
                    {onboardingResult ? (onboardingResult.monthly_baseline_kg * 12 / 1000).toFixed(1) : (localCalc.annualTonnes).toFixed(1)} <span className="text-xl font-normal text-gray-400">tonnes/yr</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 max-w-lg mx-auto">
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {onboardingResult ? onboardingResult.benchmark_context : localCalc.benchmarkContext}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-md mx-auto text-left text-xs">
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 block">Avg Indian Resident</span>
                  <span className="font-semibold text-emerald-400 text-sm">{((indianResident?.co2EquivalentKg || 1800) / 1000).toFixed(1)} tonnes/yr</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400 block">Global Average</span>
                  <span className="font-semibold text-amber-400 text-sm">{((globalResident?.co2EquivalentKg || 4000) / 1000).toFixed(1)} tonnes/yr</span>
                </div>
                <div className="p-3 bg-white/5 rounded-lg col-span-2 md:col-span-1">
                  <span className="text-gray-400 block">US Average</span>
                  <span className="font-semibold text-red-400 text-sm">15.0 tonnes/yr</span>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic max-w-sm mx-auto">
                Next, we will head to the Living World dashboard, where your virtual earth dynamically changes health based on your lifestyle choices!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-white/5">
          {step > 1 && step < 6 ? (
            <button
              onClick={prevStep}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 font-semibold text-sm cursor-pointer"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Continue
            </button>
          ) : step === 5 ? (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-gray-950 font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Generating Baseline...' : 'Get Assessment'}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:brightness-110 text-gray-950 font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer text-center"
            >
              Enter Living World Dashboard 🌍
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

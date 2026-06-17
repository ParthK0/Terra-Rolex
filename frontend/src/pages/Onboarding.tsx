import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBaselineClient } from '../lib/co2calc';
import { Car, Zap, Leaf, Plane, ShoppingBag, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

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

  const annualTonnes = localCalc.annualTonnes;

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

  // Helper component to render benchmark bars
  const BenchmarkChart = () => {
    const maxVal = Math.max(annualTonnes, 6.0);
    const estimateWidth = `${Math.max(8, Math.min(100, (annualTonnes / maxVal) * 100))}%`;
    const indianWidth = `${Math.min(100, (1.8 / maxVal) * 100)}%`;
    const globalWidth = `${Math.min(100, (4.0 / maxVal) * 100)}%`;

    return (
      <div className="space-y-4 pt-4 border-t border-gray-200/50">
        <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider block">Live Estimate Comparison</span>
        
        <div className="space-y-3">
          {/* Estimate */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-text-charcoal">
              <span>Your current estimate</span>
              <span className="text-accent-blue font-bold">{annualTonnes.toFixed(2)} tons / yr</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-blue transition-all duration-300" 
                style={{ width: estimateWidth }}
              />
            </div>
          </div>

          {/* India average */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-text-charcoal">
              <span>Average Indian urban resident</span>
              <span className="text-accent-green font-bold">1.8 tons / yr</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-green" 
                style={{ width: indianWidth }}
              />
            </div>
          </div>

          {/* Global average */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-text-charcoal">
              <span>Global average limit</span>
              <span className="text-accent-amber font-bold">4.0 tons / yr</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent-amber" 
                style={{ width: globalWidth }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen sky-hero-container flex flex-col items-center justify-center p-6 md:p-12 relative">
      
      {/* Floating White Quiz Card */}
      <div className="w-full max-w-2xl bg-white border border-gray-200/60 rounded-3xl shadow-xl p-8 md:p-12 flex flex-col justify-between min-h-[520px] relative z-10">
        
        {/* Segmented Top Progress Bar */}
        <div className="w-full mb-8" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={6}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase font-bold text-accent-blue tracking-wider">
              Step {step} of 6: {stepsInfo[step - 1].title}
            </span>
            <span className="text-xs text-text-grey font-semibold">
              {Math.round((step / 6) * 100)}%
            </span>
          </div>
          <div className="flex gap-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className={`h-full flex-1 transition-all duration-300 rounded-full ${
                  i <= step ? 'bg-accent-blue' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-text-charcoal mb-1">{stepsInfo[0].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[0].desc}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'car', label: 'Petrol Car', icon: Car },
                    { id: 'electric_car', label: 'Electric Car', icon: Zap },
                    { id: 'motorbike', label: 'Motorbike', icon: Car },
                    { id: 'public_transport', label: 'Bus / Train', icon: Car },
                    { id: 'bicycle', label: 'Bicycle / Walk', icon: Leaf }
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = transportType === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setTransportType(mode.id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                            : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-accent-blue' : 'text-text-grey'}`} />
                        <span className="text-xs font-bold">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-text-charcoal">
                    <span>Monthly Distance:</span>
                    <span className="text-accent-blue">{transportKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={transportKm}
                    onChange={(e) => setTransportKm(Number(e.target.value))}
                    className="w-full accent-accent-blue cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-grey font-bold">
                    <span>0 km</span>
                    <span>1,500 km</span>
                    <span>3,000+ km</span>
                  </div>
                </div>
              </div>

              <BenchmarkChart />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-text-charcoal mb-1">{stepsInfo[1].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[1].desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'heavy_meat', label: 'Heavy Meat', desc: 'Frequent beef, pork, or poultry.' },
                  { id: 'balanced', label: 'Balanced Mix', desc: 'Average amount of meat and dairy.' },
                  { id: 'low_meat', label: 'Low Meat', desc: 'Mostly fish, dairy, and plants.' },
                  { id: 'vegetarian', label: 'Vegetarian', desc: 'Dairy, eggs, plants. No meat.' },
                  { id: 'vegan', label: 'Strict Vegan', desc: 'Strictly plant-based nutrition.' }
                ].map(diet => {
                  const isSelected = dietType === diet.id;
                  return (
                    <button
                      key={diet.id}
                      onClick={() => setDietType(diet.id)}
                      className={`p-4 rounded-xl border-2 text-left flex gap-3 items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <Leaf className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-accent-blue' : 'text-text-grey'}`} />
                      <div>
                        <h4 className="text-xs font-bold">{diet.label}</h4>
                        <p className="text-[10px] text-text-grey mt-0.5 leading-tight">{diet.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <BenchmarkChart />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-text-charcoal mb-1">{stepsInfo[2].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[2].desc}</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-text-charcoal">
                    <span>AC Usage:</span>
                    <span className="text-accent-blue">{acHours} hours / week</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={acHours}
                    onChange={(e) => setAcHours(Number(e.target.value))}
                    className="w-full accent-accent-blue cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-text-grey font-bold">
                    <span>0 hrs</span>
                    <span>50 hrs</span>
                    <span>100+ hrs</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-200 bg-bg-base flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-grey">Equiv. Power</span>
                    <span className="text-lg font-bold text-text-charcoal mt-1">
                      {Math.round(acHours * 1.2)} kWh / wk
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-200 bg-bg-base flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-grey">Co2 output</span>
                    <span className="text-lg font-bold text-accent-blue mt-1">
                      {(acHours * 1.2).toFixed(1)} kg / wk
                    </span>
                  </div>
                </div>
              </div>

              <BenchmarkChart />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-text-charcoal mb-1">{stepsInfo[3].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[3].desc}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 3, 5, 8, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => setFlightsCount(num)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        flightsCount === num
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <Plane className={`h-5 w-5 ${flightsCount === num ? 'text-accent-blue' : 'text-text-grey'}`} />
                      <span className="text-sm">{num} {num === 1 ? 'Flight' : 'Flights'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <BenchmarkChart />
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-text-charcoal mb-1">{stepsInfo[4].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[4].desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'minimalist', label: 'Minimalist', desc: 'Rarely buy new items.' },
                  { id: 'average', label: 'Average', desc: 'Standard shopping habits.' },
                  { id: 'shopaholic', label: 'Shopaholic', desc: 'Frequent weekly shopping.' }
                ].map(item => {
                  const isSelected = shoppingFreq === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setShoppingFreq(item.id)}
                      className={`p-5 rounded-xl border-2 text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal hover:bg-bg-base'
                      }`}
                    >
                      <ShoppingBag className={`h-5 w-5 ${isSelected ? 'text-accent-blue' : 'text-text-grey'}`} />
                      <div>
                        <h4 className="text-xs font-bold">{item.label}</h4>
                        <p className="text-[10px] text-text-grey mt-0.5 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <BenchmarkChart />
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-accent-green/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent-green" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-charcoal">Setup Completed Successfully</h2>
                <p className="text-xs text-text-grey max-w-md mx-auto">
                  Your baseline calculations are processed. You are all set to track your daily footprint.
                </p>
              </div>

              <div className="bg-bg-base rounded-2xl border border-gray-200/60 p-6 max-w-md mx-auto space-y-4">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider">Your Baseline Footprint</span>
                  <div className="text-4xl font-black text-accent-blue mt-1">
                    {onboardingResult ? onboardingResult.monthly_baseline_kg : Math.round(localCalc.monthlyBaselineKg)}
                    <span className="text-sm font-normal text-text-grey"> kg CO₂ / mo</span>
                  </div>
                </div>

                <div className="text-xs text-text-charcoal font-medium border-t border-gray-200/50 pt-3">
                  {onboardingResult ? onboardingResult.benchmark_context : localCalc.benchmarkContext}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200/50 mt-8">
          {step > 1 && step < 6 ? (
            <button
              onClick={prevStep}
              className="flex items-center gap-1 px-4 py-2 text-xs font-bold text-text-charcoal border border-gray-200 rounded-xl hover:bg-bg-base cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-1 px-5 py-2.5 bg-accent-blue hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-blue/10 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : step === 5 ? (
            <button
              onClick={handleFinish}
              disabled={submitting}
              className="flex items-center gap-1 px-5 py-2.5 bg-accent-green hover:bg-green-600 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-green/10 cursor-pointer disabled:opacity-50"
            >
              <span>{submitting ? 'Generating...' : 'Calculate Baseline'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="mx-auto flex items-center justify-center px-6 py-2.5 bg-accent-blue hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-blue/10 cursor-pointer"
            >
              <span>Go to Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

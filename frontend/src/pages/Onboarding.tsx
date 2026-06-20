import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateBaselineClient } from '../lib/co2calc';
import { Car, Zap, Bike, Plane, ShoppingBag, CheckCircle2, ChevronRight, ChevronLeft, Leaf } from 'lucide-react';

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

interface BenchmarkChartProps {
  annualTonnes: number;
}

// Helper component to render benchmark bars
function BenchmarkChart({ annualTonnes }: BenchmarkChartProps) {
  const maxVal = Math.max(annualTonnes, 6.0);
  const estimateWidth = `${Math.max(8, Math.min(100, (annualTonnes / maxVal) * 100))}%`;
  const indianWidth = `${Math.min(100, (1.8 / maxVal) * 100)}%`;
  const globalWidth = `${Math.min(100, (4.0 / maxVal) * 100)}%`;

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="space-y-4 pt-5 border-t border-gray-100 mt-4 overflow-hidden"
    >
      <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider block">Live Estimate Comparison</span>
      
      <div className="space-y-3">
        {/* Estimate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-semibold text-text-charcoal">
            <span>your estimate</span>
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
            <span>average Indian urban resident</span>
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
            <span>global average</span>
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
    </motion.div>
  );
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [transportType, setTransportType] = useState('');
  const [transportKm, setTransportKm] = useState(300);
  const [dietType, setDietType] = useState('');
  const [acHours, setAcHours] = useState(15);
  const [flightsCount, setFlightsCount] = useState<number | null>(null);
  const [shoppingFreq, setShoppingFreq] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<any>(null);

  // Track if a step has been answered/interacted with
  const [answeredSteps, setAnsweredSteps] = useState<Record<number, boolean>>({});

  const handleAnswer = (stepNum: number, answerValue: any, setter: (val: any) => void) => {
    setter(answerValue);
    setAnsweredSteps(prev => ({ ...prev, [stepNum]: true }));
  };



  // Compute live local baseline on the fly for feedback
  const localCalc = calculateBaselineClient(
    transportKm,
    transportType || 'car',
    dietType || 'balanced',
    acHours,
    flightsCount || 0,
    shoppingFreq || 'average'
  );

  const annualTonnes = localCalc.annualTonnes;

  const nextStep = () => setStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      const res = await onComplete({
        transportKm,
        transportType: transportType || 'car',
        dietType: dietType || 'balanced',
        acHours,
        flightsCount: flightsCount || 0,
        shoppingFreq: shoppingFreq || 'average'
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
    { title: "Energy", desc: "How many hours do you run your AC per week?" },
    { title: "Flights", desc: "How many flights do you take per year?" },
    { title: "Shopping", desc: "What are your shopping habits?" },
    { title: "Result", desc: "Your Baseline Carbon Footprint" }
  ];



  return (
    <div className="min-h-screen sky-hero-container flex flex-col items-center justify-center p-6 md:p-12 relative bg-bg-base">
      
      {/* Floating White Quiz Card */}
      <div className="w-full max-w-2xl bg-white border border-gray-200/60 rounded-3xl shadow-xl p-8 md:p-10 flex flex-col justify-between min-h-[500px] relative z-10">
        
        {/* Segmented Top Progress Bar */}
        <div className="w-full mb-6" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={5}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] uppercase font-bold text-accent-blue tracking-wider">
              {step <= 5 ? `Step ${step} of 5: ${stepsInfo[step - 1].title}` : 'Summary'}
            </span>
            {step <= 5 && (
              <span className="text-xs text-text-grey font-semibold">
                {Math.round((step / 5) * 100)}%
              </span>
            )}
          </div>
          <div className="flex gap-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
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
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-text-charcoal mb-1">{stepsInfo[0].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[0].desc}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'car', label: 'Petrol Car', icon: Car },
                    { id: 'electric_car', label: 'Electric Car', icon: Zap },
                    { id: 'motorbike', label: 'Motorbike', icon: Bike },
                    { id: 'public_transport', label: 'Bus / Train', icon: Car }, // Using Car as clean generic line transit
                    { id: 'bicycle', label: 'Bicycle / Walk', icon: Leaf }
                  ].map(mode => {
                    const Icon = mode.icon;
                    const isSelected = transportType === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => handleAnswer(1, mode.id, setTransportType)}
                        className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                            : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-accent-blue' : 'text-text-grey'}`} />
                        <span className="text-xs font-bold">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-xs font-bold text-text-charcoal">
                    <span>Monthly Distance:</span>
                    <span className="text-accent-blue font-bold">{transportKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="50"
                    value={transportKm}
                    onChange={(e) => {
                      setTransportKm(Number(e.target.value));
                      setAnsweredSteps(prev => ({ ...prev, 1: true }));
                    }}
                    className="w-full accent-accent-blue cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-text-grey font-bold">
                    <span>0 km</span>
                    <span>1,500 km</span>
                    <span>3,000+ km</span>
                  </div>
                </div>
              </div>

              {answeredSteps[1] && <BenchmarkChart annualTonnes={annualTonnes} />}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-text-charcoal mb-1">{stepsInfo[1].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[1].desc}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'heavy_meat', label: 'Heavy Meat', desc: 'Frequent beef, pork, or poultry.' },
                  { id: 'balanced', label: 'Balanced Mix', desc: 'Average meat, fish, and dairy.' },
                  { id: 'low_meat', label: 'Low Meat', desc: 'Mostly fish, dairy, and plants.' },
                  { id: 'vegetarian', label: 'Vegetarian', desc: 'Dairy, eggs, plants. No meat.' },
                  { id: 'vegan', label: 'Strict Vegan', desc: 'Strictly plant-based nutrition.' }
                ].map(diet => {
                  const isSelected = dietType === diet.id;
                  return (
                    <button
                      key={diet.id}
                      onClick={() => handleAnswer(2, diet.id, setDietType)}
                      className={`p-4 rounded-xl border text-left flex gap-3 items-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
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

              {answeredSteps[2] && <BenchmarkChart annualTonnes={annualTonnes} />}
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-text-charcoal mb-1">{stepsInfo[2].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[2].desc}</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-text-charcoal">
                    <span>AC Usage:</span>
                    <span className="text-accent-blue font-bold">{acHours} hours / week</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={acHours}
                    onChange={(e) => {
                      setAcHours(Number(e.target.value));
                      setAnsweredSteps(prev => ({ ...prev, 3: true }));
                    }}
                    className="w-full accent-accent-blue cursor-pointer h-1.5 bg-gray-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-text-grey font-bold">
                    <span>0 hrs</span>
                    <span>50 hrs</span>
                    <span>100+ hrs</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-gray-100 bg-bg-base flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-grey">Equiv. Power</span>
                    <span className="text-lg font-bold text-text-charcoal mt-1">
                      {Math.round(acHours * 1.2)} kWh / wk
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-gray-100 bg-bg-base flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-text-grey">CO₂ Output</span>
                    <span className="text-lg font-bold text-accent-blue mt-1">
                      {(acHours * 1.2).toFixed(1)} kg / wk
                    </span>
                  </div>
                </div>
              </div>

              {answeredSteps[3] && <BenchmarkChart annualTonnes={annualTonnes} />}
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-text-charcoal mb-1">{stepsInfo[3].title}</h2>
                <p className="text-xs text-text-grey">{stepsInfo[3].desc}</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 3, 5, 8, 12].map(num => (
                    <button
                      key={num}
                      onClick={() => handleAnswer(4, num, setFlightsCount)}
                      className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                        flightsCount === num
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
                      }`}
                    >
                      <Plane className={`h-5 w-5 ${flightsCount === num ? 'text-accent-blue' : 'text-text-grey'}`} />
                      <span className="text-xs">{num} {num === 1 ? 'Flight' : 'Flights'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {answeredSteps[4] && <BenchmarkChart annualTonnes={annualTonnes} />}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-xl font-bold text-text-charcoal mb-1">{stepsInfo[4].title}</h2>
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
                      onClick={() => handleAnswer(5, item.id, setShoppingFreq)}
                      className={`p-4 rounded-xl border text-center flex flex-col items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-blue bg-accent-blue/5 text-accent-blue font-bold'
                          : 'border-gray-200 hover:border-gray-300 text-text-charcoal'
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

              {answeredSteps[5] && <BenchmarkChart annualTonnes={annualTonnes} />}
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-5 text-center"
            >
              <div className="mx-auto h-12 w-12 rounded-full bg-accent-green/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent-green" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-charcoal font-display">Setup Completed Successfully</h2>
                <p className="text-xs text-text-grey max-w-md mx-auto">
                  Your baseline carbon footprint is calculated. You are all set to track your daily choices.
                </p>
              </div>

              <div className="bg-bg-base rounded-2xl border border-gray-200/60 p-6 max-w-md mx-auto space-y-4">
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-text-grey tracking-wider">Your Baseline Footprint</span>
                  <div className="text-4xl font-black text-accent-blue mt-1 font-display">
                    {onboardingResult ? onboardingResult.monthly_baseline_kg : Math.round(localCalc.monthlyBaselineKg)}
                    <span className="text-sm font-normal text-text-grey"> kg CO₂ / mo</span>
                  </div>
                </div>

                <div className="text-xs text-text-charcoal font-semibold border-t border-gray-200/50 pt-3">
                  {onboardingResult ? onboardingResult.benchmark_context : localCalc.benchmarkContext}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
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
              disabled={!answeredSteps[step]}
              className="flex items-center gap-1 px-5 py-2.5 bg-accent-blue hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-blue/10 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : step === 5 ? (
            <button
              onClick={handleFinish}
              disabled={submitting || !answeredSteps[5]}
              className="flex items-center gap-1 px-5 py-2.5 bg-accent-green hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-green/10 cursor-pointer"
            >
              <span>{submitting ? 'Generating...' : 'Calculate Baseline'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="mx-auto flex items-center justify-center px-6 py-2.5 bg-accent-blue hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md shadow-accent-blue/15 cursor-pointer"
            >
              <span>Go to Dashboard</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

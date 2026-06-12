export const TRANSPORT_FACTORS: Record<string, number> = {
  car: 0.18,          // per km
  electric_car: 0.05, // per km
  motorbike: 0.10,    // per km
  public_transport: 0.04, // per km
  bicycle: 0.0,       // per km
};

export const FOOD_FACTORS: Record<string, number> = {
  heavy_meat: 3.0,     // per serving (beef/lamb heavy)
  balanced: 1.5,       // per serving (average mix)
  low_meat: 0.8,       // per serving (fish, chicken, dairy)
  vegetarian: 0.5,     // per serving
  vegan: 0.3,          // per serving
};

export const ENERGY_FACTORS: Record<string, number> = {
  ac: 1.2,             // per hour of use
  appliances: 0.3,     // per hour
  lighting: 0.05,      // per hour
};

export const FLIGHT_FACTORS: Record<string, number> = {
  flight_short: 90.0,    // e.g., Delhi-Mumbai (approx 2h flight)
  flight_medium: 250.0,  // e.g., Mumbai-Singapore (approx 5h flight)
  flight_long: 800.0,    // e.g., Delhi-London (approx 9h flight)
};

export interface CalculationResult {
  co2Kg: number;
  equivalent: string;
}

export function calculateCO2Client(category: string, subtype: string, amount: number): CalculationResult {
  let co2Kg = 0;
  let equivalent = "";

  const cat = category.toLowerCase();
  const sub = subtype.toLowerCase();

  if (cat === "transport") {
    const factor = TRANSPORT_FACTORS[sub] !== undefined ? TRANSPORT_FACTORS[sub] : 0.12;
    co2Kg = factor * amount;
    if (co2Kg > 0) {
      if (sub === "car") {
        equivalent = `Equivalent to charging a smartphone ${Math.round(co2Kg * 120)} times.`;
      } else if (sub === "electric_car") {
        equivalent = `Saves ${Math.round((TRANSPORT_FACTORS.car - factor) * amount)} kg CO2 compared to a petrol car.`;
      } else {
        equivalent = `Equivalent to ${co2Kg.toFixed(1)} kg of burning coal.`;
      }
    } else {
      equivalent = "Zero carbon commute! Thriving planet vibes.";
    }
  } else if (cat === "food") {
    const factor = FOOD_FACTORS[sub] !== undefined ? FOOD_FACTORS[sub] : 1.0;
    co2Kg = factor * amount;
    if (sub === "heavy_meat") {
      equivalent = `Equivalent to driving a medium petrol car for ${Math.round(co2Kg / 0.18)} km.`;
    } else if (sub === "vegetarian" || sub === "vegan") {
      const saved = (FOOD_FACTORS.balanced - factor) * amount;
      equivalent = `Saved ${saved.toFixed(1)} kg CO2 compared to a standard meal (same as planting ${Math.round(saved * 0.1)} tree seedlings).`;
    } else {
      equivalent = `Equivalent to ${co2Kg.toFixed(1)} kg of CO2 generated.`;
    }
  } else if (cat === "energy") {
    const factor = ENERGY_FACTORS[sub] !== undefined ? ENERGY_FACTORS[sub] : 0.4;
    co2Kg = factor * amount;
    if (sub === "ac") {
      equivalent = `Equivalent to running a refrigerator for ${Math.round(amount * 12)} hours.`;
    } else {
      equivalent = `Equivalent to ${co2Kg.toFixed(1)} kg of CO2 emissions from the grid.`;
    }
  } else if (cat === "flights") {
    const factor = FLIGHT_FACTORS[sub] !== undefined ? FLIGHT_FACTORS[sub] : 100.0;
    co2Kg = factor * amount;
    equivalent = `Equivalent to ${Math.round(co2Kg / 22)} months of electricity for an average Indian household.`;
  } else {
    co2Kg = 1.0 * amount;
    equivalent = `Generated ${co2Kg.toFixed(1)} kg CO2.`;
  }

  return {
    co2Kg: Number(co2Kg.toFixed(2)),
    equivalent
  };
}

export function calculateBaselineClient(
  transportKm: number,
  transportType: string,
  dietType: string,
  acHours: number,
  flightsCount: number,
  shoppingFreq: string
): { monthlyBaselineKg: number; annualTonnes: number; benchmarkContext: string } {
  const transportFactor = TRANSPORT_FACTORS[transportType] !== undefined ? TRANSPORT_FACTORS[transportType] : 0.12;
  const transportCo2 = transportKm * transportFactor;

  const dietFactor = FOOD_FACTORS[dietType] !== undefined ? FOOD_FACTORS[dietType] : 1.5;
  const dietCo2 = 90 * dietFactor;

  const acCo2 = acHours * 4 * ENERGY_FACTORS.ac;

  const flightCo2 = (flightsCount * FLIGHT_FACTORS.flight_short) / 12;

  const shoppingFactors: Record<string, number> = { minimalist: 10.0, average: 40.0, shopaholic: 150.0 };
  const shoppingCo2 = shoppingFactors[shoppingFreq] || 40.0;

  const monthlyBaselineKg = transportCo2 + dietCo2 + acCo2 + flightCo2 + shoppingCo2;
  const annualTonnes = (monthlyBaselineKg * 12) / 1000;

  let benchmarkContext = "";
  if (annualTonnes < 2.0) {
    benchmarkContext = `Your baseline of ${annualTonnes.toFixed(1)} tonnes/year is close to the Indian urban average (1.5-2.0 tonnes), and well below the global average (4.0 tonnes).`;
  } else if (annualTonnes < 5.0) {
    benchmarkContext = `Your baseline of ${annualTonnes.toFixed(1)} tonnes/year is slightly above the Indian average (1.8 tonnes), but close to the global average (4.0 tonnes).`;
  } else {
    benchmarkContext = `Your baseline of ${annualTonnes.toFixed(1)} tonnes/year is high compared to the Indian average (1.8 tonnes), representing ${Math.round(annualTonnes / 1.8)}x the average household footprint.`;
  }

  return {
    monthlyBaselineKg: Number(monthlyBaselineKg.toFixed(2)),
    annualTonnes: Number(annualTonnes.toFixed(2)),
    benchmarkContext
  };
}

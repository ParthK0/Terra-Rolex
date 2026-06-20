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

export const FUEL_FACTORS: Record<string, number> = {
  petrol: 0.19,
  diesel: 0.17,
  hybrid: 0.11,
  electric: 0.05,
};

export const GRID_FACTORS: Record<string, number> = {
  "IN-coal-heavy": 0.85,
  "IN-national-avg": 0.78,
  "IN-green-grid": 0.62,
  "Global-average": 0.45,
};

export const DEVICE_KW: Record<string, number> = {
  ac: 1.2 / 0.78,
  appliances: 0.3 / 0.78,
  lighting: 0.05 / 0.78,
};

export function calculateCO2Client(
  category: string,
  subtype: string,
  amount: number,
  fuelType?: string,
  region?: string
): CalculationResult {
  let co2Kg = 0;
  let equivalent = "";

  const cat = category.toLowerCase();
  const sub = subtype.toLowerCase();
  const ft = fuelType ? fuelType.toLowerCase() : undefined;
  const rg = region ? region.trim() : undefined;

  const gridFactor = GRID_FACTORS[rg || ""] !== undefined ? GRID_FACTORS[rg || ""] : GRID_FACTORS["IN-national-avg"];

  if (cat === "transport") {
    let factor = TRANSPORT_FACTORS[sub] !== undefined ? TRANSPORT_FACTORS[sub] : 0.12;

    if (sub === "car") {
      if (ft === "electric") {
        factor = 0.18 * gridFactor;
      } else if (ft && FUEL_FACTORS[ft] !== undefined) {
        factor = FUEL_FACTORS[ft];
      } else {
        factor = 0.18; // default / petrol car
      }
    } else if (sub === "electric_car") {
      // support legacy electric_car subtype mapping
      factor = 0.05;
    } else if (sub === "motorbike") {
      if (ft === "electric") {
        factor = 0.05 * gridFactor;
      } else {
        factor = 0.10;
      }
    } else if (sub === "public_transport") {
      if (ft === "bus") {
        factor = 0.06;
      } else if (ft === "metro") {
        factor = 0.04 * (gridFactor / 0.78);
      } else {
        factor = 0.04;
      }
    }

    co2Kg = factor * amount;
    const regionSuffix = rg ? ` in ${rg} grid zone` : "";
    if (co2Kg > 0) {
      if (sub === "car") {
        const ftStr = ft || "petrol";
        equivalent = `Logged as ${ftStr} car${regionSuffix}. Equivalent to charging a smartphone ${Math.round(co2Kg * 120)} times.`;
      } else if (sub === "electric_car" || ft === "electric") {
        const savings = (0.19 - factor) * amount;
        equivalent = `Saved ${savings.toFixed(1)} kg CO2 compared to a petrol car${regionSuffix}.`;
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
    const deviceKw = DEVICE_KW[sub] !== undefined ? DEVICE_KW[sub] : 0.4 / 0.78;
    const factor = deviceKw * gridFactor;
    co2Kg = factor * amount;
    const regionDesc = rg || "National Average";
    if (sub === "ac") {
      equivalent = `Powered by ${regionDesc} grid (${gridFactor} kg/kWh). Equivalent to running a refrigerator for ${Math.round(amount * 12)} hours.`;
    } else {
      equivalent = `Powered by ${regionDesc} grid. Generated ${co2Kg.toFixed(1)} kg CO2.`;
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

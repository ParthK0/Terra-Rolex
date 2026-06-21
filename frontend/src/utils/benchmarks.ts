export interface BenchmarkItem {
  id: string;
  label: string;
  co2EquivalentKg: number;
  description: string;
  visceralComparison: string;
}

export const AWARENESS_BENCHMARKS: BenchmarkItem[] = [
  {
    id: "indian_resident",
    label: "Urban Indian average (annual)",
    co2EquivalentKg: 1800,
    description: "An average urban resident in India generates 1.5–2 tons of CO2 per year.",
    visceralComparison: "Equivalent to driving a petrol car for 10,000 km."
  },
  {
    id: "global_resident",
    label: "Global average (annual)",
    co2EquivalentKg: 4000,
    description: "The average human generates 4.0 tons of CO2 per year.",
    visceralComparison: "Equivalent to burning 2,000 kg of coal."
  },
  {
    id: "us_resident",
    label: "US resident average (annual)",
    co2EquivalentKg: 15000,
    description: "The average US resident generates 14–16 tons of CO2 per year.",
    visceralComparison: "Equivalent to 8 trans-atlantic flights."
  },
  {
    id: "flight_delhi_mumbai",
    label: "Delhi-Mumbai Flight",
    co2EquivalentKg: 90,
    description: "A single passenger flight from Delhi to Mumbai generates 80–100 kg of CO2.",
    visceralComparison: "Equivalent to 4 months of electricity for an average Indian household."
  },
  {
    id: "meat_serving",
    label: "Beef/Lamb meal serving",
    co2EquivalentKg: 3.0,
    description: "One single serving of heavy red meat generates ~3.0 kg of CO2.",
    visceralComparison: "Equivalent to leaving a standard lightbulb on for 300 hours."
  },
  {
    id: "ac_hour",
    label: "Air Conditioning (per hour)",
    co2EquivalentKg: 1.2,
    description: "Running a 1.5-ton AC unit on a standard coal-powered grid mix for an hour.",
    visceralComparison: "Equivalent to running a typical kitchen refrigerator for 12 hours."
  }
];

export function getVisceralComparison(co2Kg: number): string {
  if (co2Kg >= 15000) {
    return "equivalent to the annual footprint of a US resident";
  } else if (co2Kg >= 4000) {
    return "equivalent to the global average carbon footprint of 1 human for an entire year";
  } else if (co2Kg >= 1800) {
    return "equivalent to the annual carbon footprint of an urban resident in India";
  } else if (co2Kg >= 90) {
    const householdMonths = Math.round(co2Kg / 22);
    return `equivalent to the electricity usage of an average Indian household for ${householdMonths || 1} month(s)`;
  } else if (co2Kg >= 10) {
    return `equivalent to burning ${Math.round(co2Kg * 0.5)} kg of coal`;
  } else if (co2Kg >= 1.5) {
    return `equivalent to leaving a 100W lightbulb turned on for ${Math.round(co2Kg * 10)} hours`;
  } else {
    return `equivalent to charging a modern smartphone ${Math.round(co2Kg * 120)} times`;
  }
}

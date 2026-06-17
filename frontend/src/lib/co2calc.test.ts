import { describe, it, expect } from 'vitest';
import { calculateCO2Client, calculateBaselineClient } from './co2calc';

// ─────────────────────────────────────────────────────────────────────────────
// calculateCO2Client
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateCO2Client — transport', () => {
  it('petrol car: 100km should return 18.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('transport', 'car', 100);
    expect(co2Kg).toBe(18.0);
  });

  it('petrol car equivalent should mention smartphone', () => {
    const { equivalent } = calculateCO2Client('transport', 'car', 100);
    expect(equivalent.toLowerCase()).toContain('smartphone');
  });

  it('bicycle: any distance should return 0 kg CO2', () => {
    const { co2Kg, equivalent } = calculateCO2Client('transport', 'bicycle', 50);
    expect(co2Kg).toBe(0.0);
    expect(equivalent.toLowerCase()).toContain('zero carbon');
  });

  it('electric car: 100km should return 5 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('transport', 'electric_car', 100);
    expect(co2Kg).toBe(5.0);
  });

  it('public transport: 50km should return 2 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('transport', 'public_transport', 50);
    expect(co2Kg).toBe(2.0);
  });
});

describe('calculateCO2Client — food', () => {
  it('heavy meat: 2 servings should return 6.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('food', 'heavy_meat', 2);
    expect(co2Kg).toBe(6.0);
  });

  it('heavy meat equivalent should mention petrol car', () => {
    const { equivalent } = calculateCO2Client('food', 'heavy_meat', 2);
    expect(equivalent.toLowerCase()).toContain('petrol car');
  });

  it('vegan: 3 servings should return 0.90 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('food', 'vegan', 3);
    expect(co2Kg).toBe(0.9);
  });

  it('vegan equivalent should mention savings', () => {
    const { equivalent } = calculateCO2Client('food', 'vegan', 1);
    expect(equivalent.toLowerCase()).toContain('saved');
  });

  it('vegetarian: 1 serving should return 0.5 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('food', 'vegetarian', 1);
    expect(co2Kg).toBe(0.5);
  });
});

describe('calculateCO2Client — energy', () => {
  it('AC: 5 hours should return 6.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('energy', 'ac', 5);
    expect(co2Kg).toBe(6.0);
  });

  it('AC equivalent should mention refrigerator', () => {
    const { equivalent } = calculateCO2Client('energy', 'ac', 5);
    expect(equivalent.toLowerCase()).toContain('refrigerator');
  });

  it('lighting: 10 hours should return 0.5 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('energy', 'lighting', 10);
    expect(co2Kg).toBe(0.5);
  });
});

describe('calculateCO2Client — flights', () => {
  it('short flight: 1 trip should return 90.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('flights', 'flight_short', 1);
    expect(co2Kg).toBe(90.0);
  });

  it('medium flight: 1 trip should return 250.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('flights', 'flight_medium', 1);
    expect(co2Kg).toBe(250.0);
  });

  it('long flight: 1 trip should return 800.00 kg CO2', () => {
    const { co2Kg } = calculateCO2Client('flights', 'flight_long', 1);
    expect(co2Kg).toBe(800.0);
  });

  it('flight equivalent should mention Indian household', () => {
    const { equivalent } = calculateCO2Client('flights', 'flight_short', 1);
    expect(equivalent.toLowerCase()).toContain('indian household');
  });
});

describe('calculateCO2Client — unknown category fallback', () => {
  it('unknown category should return 1 kg CO2 per unit', () => {
    const { co2Kg } = calculateCO2Client('unknown', 'something', 5);
    expect(co2Kg).toBe(5.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateBaselineClient
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateBaselineClient', () => {
  it('average profile should return 320.5 kg/month baseline', () => {
    const result = calculateBaselineClient(500, 'car', 'balanced', 10, 1, 'average');
    // 90 (transport) + 135 (diet) + 48 (AC) + 7.5 (flights) + 40 (shopping) = 320.5
    expect(result.monthlyBaselineKg).toBe(320.5);
  });

  it('annual tonnes should be (monthly * 12) / 1000', () => {
    const result = calculateBaselineClient(500, 'car', 'balanced', 10, 1, 'average');
    expect(result.annualTonnes).toBeCloseTo((320.5 * 12) / 1000, 2);
  });

  it('zero footprint lifestyle should return low baseline', () => {
    const result = calculateBaselineClient(0, 'bicycle', 'vegan', 0, 0, 'minimalist');
    // 0 + 27 (vegan diet: 90*0.3) + 0 + 0 + 10 = 37
    expect(result.monthlyBaselineKg).toBeCloseTo(37.0, 1);
  });

  it('high footprint lifestyle should have context mentioning baseline', () => {
    const result = calculateBaselineClient(3000, 'car', 'heavy_meat', 100, 10, 'shopaholic');
    expect(result.benchmarkContext.toLowerCase()).toContain('baseline');
  });

  it('low annual tonnes should mention Indian urban average', () => {
    const result = calculateBaselineClient(0, 'bicycle', 'vegan', 0, 0, 'minimalist');
    expect(result.benchmarkContext.toLowerCase()).toContain('indian');
  });
});

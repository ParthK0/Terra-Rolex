from typing import Tuple

# Standard base fallback factors
TRANSPORT_FACTORS = {
    "car": 0.18,          # per km
    "electric_car": 0.05, # per km
    "motorbike": 0.10,    # per km
    "public_transport": 0.04, # per km
    "bicycle": 0.0,       # per km
}

FOOD_FACTORS = {
    "heavy_meat": 3.0,     # per serving (beef/lamb heavy)
    "balanced": 1.5,       # per serving (average mix)
    "low_meat": 0.8,       # per serving (fish, chicken, dairy)
    "vegetarian": 0.5,     # per serving
    "vegan": 0.3,          # per serving
}

FLIGHT_FACTORS = {
    "flight_short": 90.0,    # e.g., Delhi-Mumbai (approx 2h flight)
    "flight_medium": 250.0,  # e.g., Mumbai-Singapore (approx 5h flight)
    "flight_long": 800.0,    # e.g., Delhi-London (approx 9h flight)
}

# Granular vehicle fuel factors (kg CO2 per km)
FUEL_FACTORS = {
    "petrol": 0.19,
    "diesel": 0.17,
    "hybrid": 0.11,
    "electric": 0.05, # will be scaled by grid factor
    "none": 0.0,
}

# Regional grid factors (kg CO2 per kWh)
GRID_FACTORS = {
    "IN-coal-heavy": 0.85,
    "IN-national-avg": 0.78,
    "IN-green-grid": 0.62,
    "Global-average": 0.45,
}

# Power ratings of home devices in kW scaled so national average (0.78) matches legacy factors
DEVICE_KW = {
    "ac": 1.2 / 0.78,          # matches 1.2 kg/hour at 0.78 grid factor
    "appliances": 0.3 / 0.78,  # matches 0.3 kg/hour
    "lighting": 0.05 / 0.78    # matches 0.05 kg/hour
}

def calculate_co2(
    category: str,
    subtype: str,
    amount: float,
    fuel_type: str = None,
    region: str = None
) -> Tuple[float, str]:
    """
    Calculates carbon footprint in kg CO2 and returns a human-friendly context equivalent.
    """
    co2_kg = 0.0
    eq_text = ""

    category = category.lower()
    subtype = subtype.lower()
    if fuel_type:
        fuel_type = fuel_type.lower()
    if region:
        region = region.strip()

    # Resolve grid factor (defaults to Indian national average)
    grid_factor = GRID_FACTORS.get(region, GRID_FACTORS["IN-national-avg"])

    if category == "transport":
        factor = TRANSPORT_FACTORS.get(subtype, 0.12)
        
        # Calculate with fuel/subtype granularity
        if subtype == "car":
            if fuel_type == "electric":
                # Electric car: 0.18 kWh per km times the grid emission factor
                factor = 0.18 * grid_factor
            elif fuel_type in FUEL_FACTORS:
                factor = FUEL_FACTORS[fuel_type]
            else:
                factor = 0.18
        elif subtype == "motorbike":
            if fuel_type == "electric":
                # Electric motorbike: 0.05 kWh per km times the grid factor
                factor = 0.05 * grid_factor
            else:
                factor = 0.10
        elif subtype == "public_transport":
            if fuel_type == "bus":
                factor = 0.06
            elif fuel_type == "metro":
                # Metro is electric: 0.04 kWh per km scaled by grid factor relative to baseline
                factor = 0.04 * (grid_factor / 0.78)
            else:
                factor = 0.04

        co2_kg = factor * amount
        
        # Build equivalent text
        region_suffix = f" in {region} grid zone" if region else ""
        if co2_kg > 0:
            if subtype == "car":
                ft_str = fuel_type or "petrol"
                eq_text = f"Logged as {ft_str} car{region_suffix}. Equivalent to charging a smartphone {int(co2_kg * 120)} times."
            elif subtype == "electric_car" or fuel_type == "electric":
                savings = (FUEL_FACTORS["petrol"] - factor) * amount
                eq_text = f"Saved {savings:.1f} kg CO2 compared to a petrol car{region_suffix}."
            else:
                eq_text = f"Equivalent to {co2_kg:.1f} kg of burning coal."
        else:
            eq_text = "Zero carbon commute! Thriving planet vibes."

    elif category == "food":
        factor = FOOD_FACTORS.get(subtype, 1.5)
        co2_kg = factor * amount
        if subtype == "heavy_meat":
            eq_text = f"Equivalent to driving a petrol car for {int(co2_kg / 0.19)} km."
        elif subtype in ["vegetarian", "vegan"]:
            saved = (FOOD_FACTORS["balanced"] - factor) * amount
            eq_text = f"Saved {saved:.1f} kg CO2 compared to standard meals (planting {int(saved * 0.1)} tree seedlings)."
        else:
            eq_text = f"Equivalent to {co2_kg:.1f} kg of CO2 generated."

    elif category == "energy":
        # Scale devices by regional grid factors
        device_kw = DEVICE_KW.get(subtype, 0.4)
        factor = device_kw * grid_factor
        co2_kg = factor * amount
        
        region_desc = region or "National Average"
        if subtype == "ac":
            eq_text = f"Powered by {region_desc} grid ({grid_factor} kg/kWh). Equivalent to running a refrigerator for {int(amount * 12)} hours."
        else:
            eq_text = f"Powered by {region_desc} grid. Generated {co2_kg:.1f} kg CO2."

    elif category == "flights":
        factor = FLIGHT_FACTORS.get(subtype, 100.0)
        co2_kg = factor * amount
        eq_text = f"Equivalent to {int(co2_kg / 22)} months of electricity for an average Indian household."

    else:
        co2_kg = 1.0 * amount
        eq_text = f"Generated {co2_kg:.1f} kg CO2."

    if not eq_text:
        eq_text = f"{co2_kg:.1f} kg CO2 emission recorded."

    return round(co2_kg, 2), eq_text

def calculate_onboarding_baseline(
    transport_km: float,
    transport_type: str,
    diet_type: str,
    ac_hours: float,
    flights_count: int,
    shopping_freq: str
) -> Tuple[float, str]:
    """
    Calculates initial monthly baseline in kg CO2 and gives context.
    """
    # Transport (monthly)
    transport_factor = TRANSPORT_FACTORS.get(transport_type, 0.12)
    transport_co2 = transport_km * transport_factor

    # Diet (monthly - assuming 90 meals per month)
    diet_factor = FOOD_FACTORS.get(diet_type, 1.5)
    diet_co2 = 90 * diet_factor

    # Energy (monthly AC - assuming 4 weeks per month)
    ac_co2 = ac_hours * 4 * (DEVICE_KW["ac"] * GRID_FACTORS["IN-national-avg"])

    # Flights (monthly share of annual flights)
    flight_co2 = (flights_count * FLIGHT_FACTORS["flight_short"]) / 12

    # Shopping (monthly addition)
    shopping_factors = {"minimalist": 10.0, "average": 40.0, "shopaholic": 150.0}
    shopping_co2 = shopping_factors.get(shopping_freq, 40.0)

    total_monthly_co2 = transport_co2 + diet_co2 + ac_co2 + flight_co2 + shopping_co2
    annual_tonnes = (total_monthly_co2 * 12) / 1000

    if annual_tonnes < 2.0:
        context = f"Your baseline of {annual_tonnes:.1f} tonnes/year is close to the Indian urban average (1.5-2.0 tonnes), and well below the global average (4.0 tonnes)."
    elif annual_tonnes < 5.0:
        context = f"Your baseline of {annual_tonnes:.1f} tonnes/year is slightly above the Indian average (1.8 tonnes), but close to the global average (4.0 tonnes)."
    else:
        context = f"Your baseline of {annual_tonnes:.1f} tonnes/year is high compared to the Indian average (1.8 tonnes), representing {int(annual_tonnes / 1.8)}x the average household footprint."

    return round(total_monthly_co2, 2), context

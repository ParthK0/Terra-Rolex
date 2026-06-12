from typing import Tuple

# Carbon emission factors (kg CO2 per unit)
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

ENERGY_FACTORS = {
    "ac": 1.2,             # per hour of use
    "appliances": 0.3,     # per hour
    "lighting": 0.05,      # per hour
}

FLIGHT_FACTORS = {
    "flight_short": 90.0,    # e.g., Delhi-Mumbai (approx 2h flight)
    "flight_medium": 250.0,  # e.g., Mumbai-Singapore (approx 5h flight)
    "flight_long": 800.0,    # e.g., Delhi-London (approx 9h flight)
}

def calculate_co2(category: str, subtype: str, amount: float) -> Tuple[float, str]:
    """
    Calculates carbon footprint in kg CO2 and returns a human-friendly context equivalent.
    """
    co2_kg = 0.0
    eq_text = ""

    category = category.lower()
    subtype = subtype.lower()

    if category == "transport":
        factor = TRANSPORT_FACTORS.get(subtype, 0.12)
        co2_kg = factor * amount
        if co2_kg > 0:
            if subtype == "car":
                eq_text = f"Equivalent to charging a smartphone {int(co2_kg * 120)} times."
            elif subtype == "electric_car":
                eq_text = f"Saves {int((TRANSPORT_FACTORS['car'] - factor) * amount)} kg CO2 compared to a petrol car."
            else:
                eq_text = f"Equivalent to {co2_kg:.1f} kg of burning coal."
        else:
            eq_text = "Zero carbon commute! Thriving planet vibes."

    elif category == "food":
        factor = FOOD_FACTORS.get(subtype, 1.0)
        co2_kg = factor * amount
        if subtype == "heavy_meat":
            eq_text = f"Equivalent to driving a medium petrol car for {int(co2_kg / 0.18)} km."
        elif subtype in ["vegetarian", "vegan"]:
            saved = (FOOD_FACTORS["balanced"] - factor) * amount
            eq_text = f"Saved {saved:.1f} kg CO2 compared to a standard meal (same as planting {int(saved * 0.1)} tree seedlings)."
        else:
            eq_text = f"Equivalent to {co2_kg:.1f} kg of CO2 generated."

    elif category == "energy":
        factor = ENERGY_FACTORS.get(subtype, 0.4)
        co2_kg = factor * amount
        if subtype == "ac":
            eq_text = f"Equivalent to running a refrigerator for {int(amount * 12)} hours."
        else:
            eq_text = f"Equivalent to {co2_kg:.1f} kg of CO2 emissions from the electricity grid."

    elif category == "flights":
        factor = FLIGHT_FACTORS.get(subtype, 100.0)
        co2_kg = factor * amount
        # Base flight reference (e.g. Delhi-Mumbai is 90kg)
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
    ac_co2 = ac_hours * 4 * ENERGY_FACTORS["ac"]

    # Flights (monthly share of annual flights)
    # Average flight is assumed medium (250 kg) if count is positive
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

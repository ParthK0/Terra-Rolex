import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.co2_engine import calculate_co2, calculate_onboarding_baseline

def test_transport_calculation():
    # Petrol Car commute: 100km * 0.18 = 18.0kg CO2
    co2, eq = calculate_co2("transport", "car", 100)
    assert co2 == 18.0
    assert "smartphone" in eq

    # Bicycle commute: 50km * 0.0 = 0.0kg CO2
    co2, eq = calculate_co2("transport", "bicycle", 50)
    assert co2 == 0.0
    assert "Zero carbon" in eq

def test_food_calculation():
    # Heavy meat: 2 meals * 3.0 = 6.0kg CO2
    co2, eq = calculate_co2("food", "heavy_meat", 2)
    assert co2 == 6.0
    assert "petrol car" in eq

    # Vegan: 3 meals * 0.3 = 0.9kg CO2
    co2, eq = calculate_co2("food", "vegan", 3)
    assert co2 == 0.9
    assert "Saved" in eq

def test_energy_calculation():
    # AC: 5 hours * 1.2 = 6.0kg CO2
    co2, eq = calculate_co2("energy", "ac", 5)
    assert co2 == 6.0
    assert "refrigerator" in eq

def test_flight_calculation():
    # Short flight (Delhi-Mumbai): 1 flight * 90.0 = 90.0kg CO2
    co2, eq = calculate_co2("flights", "flight_short", 1)
    assert co2 == 90.0
    assert "Indian household" in eq

def test_onboarding_baseline():
    # Test average monthly onboarding baseline calculation
    co2, context = calculate_onboarding_baseline(
        transport_km=500,        # 500 * 0.18 = 90kg
        transport_type="car",
        diet_type="balanced",     # 90 * 1.5 = 135kg
        ac_hours=10,              # 10 * 4 * 1.2 = 48kg
        flights_count=1,          # (1 * 90) / 12 = 7.5kg
        shopping_freq="average"   # 40kg
    )
    # Total monthly = 90 + 135 + 48 + 7.5 + 40 = 320.5kg
    assert co2 == 320.5
    assert "320.5" in str(co2)
    assert "baseline" in context

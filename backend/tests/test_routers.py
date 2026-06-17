"""
Integration tests for Terra-Rolex FastAPI routers.
Uses TestClient (synchronous) with a unique test user ID per test run.
"""
import sys
import os
import uuid
import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# A unique user ID for each test session so tests don't cross-contaminate data
TEST_USER_ID = f"test_{uuid.uuid4().hex[:8]}"
HEADERS = {"x-user-id": TEST_USER_ID}


# ─────────────────────────────────────────────────────────────────────────────
# /log router
# ─────────────────────────────────────────────────────────────────────────────

class TestLogRouter:
    def test_create_log_transport(self):
        """POST /log should persist a transport log and return correct CO2."""
        payload = {
            "category": "transport",
            "subtype": "car",
            "amount": 100,
            "description": "Integration test commute"
        }
        res = client.post("/log", json=payload, headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert data["category"] == "transport"
        assert data["subtype"] == "car"
        assert data["co2_kg"] == 18.0          # 100km * 0.18
        assert "smartphone" in data["equivalent"]
        assert data["userId"] == TEST_USER_ID

    def test_create_log_flight(self):
        """POST /log for a short flight should return 90 kg CO2."""
        payload = {"category": "flights", "subtype": "flight_short", "amount": 1}
        res = client.post("/log", json=payload, headers=HEADERS)
        assert res.status_code == 200
        assert res.json()["co2_kg"] == 90.0

    def test_create_log_vegan_meal(self):
        """POST /log for a vegan meal should return 0.3 kg CO2."""
        payload = {"category": "food", "subtype": "vegan", "amount": 1}
        res = client.post("/log", json=payload, headers=HEADERS)
        assert res.status_code == 200
        assert res.json()["co2_kg"] == 0.3

    def test_get_logs_returns_list(self):
        """GET /log should return a list with at least 1 entry after seeding one."""
        # Use a unique user so this test is fully self-contained
        local_user = f"test_log_{uuid.uuid4().hex[:6]}"
        local_headers = {"x-user-id": local_user}
        client.post("/log", json={"category": "food", "subtype": "vegan", "amount": 1}, headers=local_headers)
        res = client.get("/log", headers=local_headers)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_logs_are_users_own(self):
        """GET /log should only return logs belonging to the requesting user."""
        res = client.get("/log", headers=HEADERS)
        assert res.status_code == 200
        for log in res.json():
            assert log["userId"] == TEST_USER_ID

    def test_create_log_invalid_amount(self):
        """POST /log with negative or zero amount should fail validation with 422."""
        payload = {"category": "transport", "subtype": "car", "amount": -10}
        res = client.post("/log", json=payload, headers=HEADERS)
        assert res.status_code == 422

        payload = {"category": "transport", "subtype": "car", "amount": 0}
        res = client.post("/log", json=payload, headers=HEADERS)
        assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# /insights router
# ─────────────────────────────────────────────────────────────────────────────

class TestInsightsRouter:
    def test_get_insights_shape(self):
        """GET /insights should return rolling_score_kg, streak, nudges, status."""
        res = client.get("/insights", headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert "rolling_score_kg" in data
        assert "streak" in data
        assert "nudges" in data
        assert "living_world_status" in data

    def test_insights_nudges_are_list_of_three(self):
        """Gemini nudges should always be exactly 3 strings."""
        res = client.get("/insights", headers=HEADERS)
        nudges = res.json()["nudges"]
        assert isinstance(nudges, list)
        assert len(nudges) == 3
        for n in nudges:
            assert isinstance(n, str)

    def test_insights_status_is_valid(self):
        """living_world_status must be one of the four valid states."""
        res = client.get("/insights", headers=HEADERS)
        status = res.json()["living_world_status"]
        assert status in ["thriving", "healthy", "threatened", "degraded"]

    def test_onboarding_saves_baseline(self):
        """POST /insights/onboarding should compute and return a monthly baseline."""
        payload = {
            "transport_km_per_month": 500,
            "transport_type": "car",
            "diet_type": "balanced",
            "ac_hours_per_week": 10,
            "flights_per_year": 1,
            "shopping_frequency": "average"
        }
        res = client.post("/insights/onboarding", json=payload, headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert "monthly_baseline_kg" in data
        assert "annual_tonnes" in data
        assert "benchmark_context" in data
        assert data["monthly_baseline_kg"] == 320.5  # matches test_co2.py expected value

    def test_onboarding_updates_profile_baseline(self):
        """After a low-footprint onboarding, the living world status should not be degraded."""
        payload = {
            "transport_km_per_month": 0,
            "transport_type": "bicycle",
            "diet_type": "vegan",
            "ac_hours_per_week": 0,
            "flights_per_year": 0,
            "shopping_frequency": "minimalist"
        }
        client.post("/insights/onboarding", json=payload, headers=HEADERS)
        res = client.get("/insights", headers=HEADERS)
        assert res.json()["living_world_status"] in ["thriving", "healthy", "threatened"]

    def test_onboarding_invalid_data(self):
        """POST /insights/onboarding with negative values should fail validation with 422."""
        payload = {
            "transport_km_per_month": -10,
            "transport_type": "car",
            "diet_type": "balanced",
            "ac_hours_per_week": 10,
            "flights_per_year": 1,
            "shopping_frequency": "average"
        }
        res = client.post("/insights/onboarding", json=payload, headers=HEADERS)
        assert res.status_code == 422


# ─────────────────────────────────────────────────────────────────────────────
# /actions router
# ─────────────────────────────────────────────────────────────────────────────

class TestActionsRouter:
    def test_get_challenges_returns_list(self):
        """GET /actions should return a list of challenges."""
        res = client.get("/actions", headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_challenges_have_required_fields(self):
        """Each challenge must have id, title, description, co2_savings_kg, completed."""
        res = client.get("/actions", headers=HEADERS)
        for c in res.json():
            assert "id" in c
            assert "title" in c
            assert "description" in c
            assert "co2_savings_kg" in c
            assert "completed" in c

    def test_complete_challenge_returns_reaction(self):
        """POST /actions/complete should return success=True and a reaction string."""
        res = client.post("/actions/complete", json={"challenge_id": "c1"}, headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert isinstance(data["reaction"], str)
        assert len(data["reaction"]) > 10

    def test_complete_invalid_challenge_returns_404(self):
        """POST /actions/complete with a non-existent challenge_id should return 404."""
        res = client.post("/actions/complete", json={"challenge_id": "nonexistent"}, headers=HEADERS)
        assert res.status_code == 404

    def test_completed_challenge_marked_done(self):
        """After completing c2 for a fresh user, GET /actions marks c2 as completed=True."""
        fresh_user = f"test_c2_{uuid.uuid4().hex[:8]}"
        fresh_headers = {"x-user-id": fresh_user}
        # Complete the challenge for this fresh user
        complete_res = client.post("/actions/complete", json={"challenge_id": "c2"}, headers=fresh_headers)
        assert complete_res.status_code == 200
        # Now verify the challenge list reflects completion
        res = client.get("/actions", headers=fresh_headers)
        assert res.status_code == 200
        c2 = next((c for c in res.json() if c["id"] == "c2"), None)
        assert c2 is not None, "Challenge c2 not found in response"
        assert c2["completed"] is True


# ─────────────────────────────────────────────────────────────────────────────
# /leaderboard router
# ─────────────────────────────────────────────────────────────────────────────

class TestLeaderboardRouter:
    def test_get_leaderboard_returns_list(self):
        """GET /leaderboard should return a sorted list of users."""
        res = client.get("/leaderboard")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)

    def test_leaderboard_sorted_ascending_by_score(self):
        """Lower score (lower emissions) should appear first."""
        res = client.get("/leaderboard")
        scores = [u["score"] for u in res.json()]
        assert scores == sorted(scores)

    def test_get_teams_leaderboard(self):
        """GET /leaderboard/teams should return team aggregates."""
        res = client.get("/leaderboard/teams")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, list)
        for team in data:
            assert "teamName" in team
            assert "score" in team
            assert "memberCount" in team

    def test_join_team(self):
        """POST /leaderboard/join should update the user's team."""
        res = client.post(
            "/leaderboard/join",
            params={"team_name": "Green Team"},
            headers=HEADERS
        )
        assert res.status_code == 200
        assert res.json()["success"] is True
        assert res.json()["teamName"] == "Green Team"

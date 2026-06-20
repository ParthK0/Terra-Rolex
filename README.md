# TerraWatch: Carbon Modeling & Gamified Sustainability Platform

![TerraWatch Overview](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

TerraWatch is a full-stack, progressive web application (PWA) designed to track, calculate, and gamify personal and team-based carbon footprints. Built for sustainability challenges, the platform aligns high-fidelity environmental data with psychological "nudges" and AI-driven insights to promote lasting behavioral change.

## 🎯 Problem Statement Alignment

While many tools simply estimate carbon emissions, they fail to drive continued user engagement. **TerraWatch solves this by combining granular scientific tracking with gamified action loops.**

- **Accurate Calculations**: Leverages specific fuel types and regional emission factors for transportation, food, energy, and flights.
- **AI Insights**: Generates personalized "nudges" based on rolling 7-day habits to proactively encourage greener choices.
- **Gamification**: Includes challenges, badges, streaks, and an interactive Leaderboard to incentivize teams and individuals.
- **Offline Capabilities**: Fully functional PWA with offline log queuing, allowing users to track emissions in remote or signal-deprived areas without data loss.

## 🚀 Tech Stack

### Frontend
- **React (Vite) + TypeScript**: Blazing fast client-side rendering with strong type safety.
- **Tailwind CSS**: Utility-first CSS for a responsive, modern "airy" light theme.
- **PWA (Service Workers)**: Offline support and caching.
- **Recharts & React-Globe**: Interactive data visualization of carbon emissions.

### Backend
- **FastAPI (Python)**: High-performance asynchronous API for managing carbon models and user data.
- **Firebase / Firestore**: NoSQL data storage for user profiles, logs, and leaderboards.
- **Google Gemini AI**: Generates personalized sustainability nudges and contextual feedback based on user logs.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Firebase Account (for Firestore)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables (copy `.env.example` to `.env` and fill in API keys).
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 🧪 Testing and Code Quality
TerraWatch maintains a high standard of code reliability:
- **Frontend Testing**: `vitest` and `@testing-library/react` ensure UI components and offline queuing logic work flawlessly.
- **Backend Testing**: `pytest` handles API integration testing and verifies the mathematical accuracy of the `co2_engine`.
- **Linting**: Strict `eslint` configuration for TypeScript/React hooks.

## 🤝 Contributing
Feel free to open an issue or submit a pull request if you have ideas on expanding the carbon models or improving the gamification logic.

---
*Built to make sustainability measurable and engaging.*

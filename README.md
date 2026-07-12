# 🎬 NoirGen AI: The Autonomous Cinematic Art Director
**A Pre-Production Tool Engineered by Velyron**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![AMD Developer Cloud](https://img.shields.io/badge/Powered%20By-AMD%20Developer%20Cloud-black?logo=amd)](https://amd.com)
[![Fireworks AI](https://img.shields.io/badge/Engine-Fireworks%20AI-orange)](#)
[![Gemini 1.5](https://img.shields.io/badge/Engine-Gemini%201.5%20Flash-blue)](#)

## 📖 About What We Built
Translating raw script ideas into production-ready visual treatments—whether for short films, high-end editorial shoots, or digital ad campaigns—is traditionally an expensive and time-consuming process for design and UI/UX studios.

**NoirGen AI** was built to solve this bottleneck. Designed with the cinematic aesthetic requirements of professional production houses in mind, we bridge the gap between raw creative ideation and technical execution, allowing directors to generate highly structured, studio-grade cinematic lookbooks in seconds.

---

## ⚡ The Dual-Engine "Hybrid" Architecture
To achieve lightning-fast response times without sacrificing the deep contextual reasoning required for cinematography, NoirGen AI employs a custom **Hybrid Routing Architecture**. 

We split the workload between two powerful models working concurrently:

1.  **The Reasoning Engine (Gemini 1.5 Flash):** Handles the heavy lifting. It parses the scene prompt to generate a complex, structured JSON treatment including exact camera metadata (lens, aperture), VFX/HDRI lighting setups, and distinct color palettes with exact hex codes.
2.  **The Reflex Engine (Fireworks AI / Llama 3.1):** Operates on high-speed compute to instantly generate a punchy, emotionally resonant 1-sentence cinematic tagline to anchor the visual mood.

> **⚡ AMD & Fireworks AI Usage:**
> We specifically utilize **Fireworks AI (powered by AMD compute infrastructure)** for our Reflex Engine. By routing the lightweight NLP tasks to Llama 3.1 via Fireworks, we leverage AMD's low-latency inference to ensure the tagline is generated almost instantaneously, acting as a rapid cache while the heavier JSON payload is being computed.

---

## 🌟 Core Features & Visual Standards
*   **Structured Output Engine:** Generates categorized data for Mood, Color Palette, Camera Settings, and VFX/3D setups.
*   **Strict Editorial Aesthetic:** Under the hood, NoirGen enforces a high-end visual standard (clean subjects, integration of modern contemporary elements like headphones, specific lighting ratios like Chiaroscuro).
*   **Bulletproof Uptime (Graceful Failover):** Built for high-stakes pitches. If external APIs rate-limit (503) or authentication drops (401), the serverless backend instantly falls back to a locally cached, premium cinematic payload. The UI never breaks.

---

## 🛠️ Architecture & Tech Stack

*   **Frontend UI/UX:** React, Vite (Tailored for cinematic aesthetics).
*   **Hybrid Backend Engine:** 
    *   Google Gemini 1.5 Flash (Complex JSON Structuring & Image Generation)
    *   Llama 3.1 8B Instruct via Fireworks AI (High-speed tagline generation)
*   **Hosting & Serverless:** Vercel (Edge-optimized API routes).

---

## 🗺️ Code Path & Implementation Details
For judges and reviewers evaluating the logic, the core routing and hybrid execution can be found in a single, clean serverless function.

*   **Main Code Path:** 📂 `api/generate.ts`
*   **Key Implementations:**
    *   Concurrent API fetching using `Promise.all`.
    *   Strict JSON schema enforcement for predictable UI mapping.
    *   Custom `try/catch` failover cascades.

---

## 🚀 Setup Instructions

Follow these steps to run NoirGen AI on your local machine.

### 1. Clone the repository
```bash
git clone [PROJECT](https://github.com/ashishshrivastava2004/noirgen-ai-frontend)

npm install

GEMINI_API_KEY=your_gemini_api_key_here
FIREWORKS_API_KEY=your_fireworks_api_key_here

npm run dev


Developer: Ashish Shrivastava (B.Tech CSE, KVIT Raipur,Chhatisgarh,India)

Built with passion for the AMD ACT II Developer Hackathon.
# <p align="center">🔍 TruthGuard AI</p>

<p align="center">
  <strong>The Ultimate Multi-Modal AI Fraud & Manipulation Detection Suite</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
</p>

---

## 🌟 Overview

**TruthGuard AI** is a cutting-edge forensic analysis platform designed to combat the rising tide of digital misinformation and AI-generated deception. Leveraging **Google's Gemini 2.5 Flash** and advanced behavioral biometrics, TruthGuard provides a centralized suite for verifying everything from viral news and deepfake audio to fraudulent job postings and scientific research.

> [!IMPORTANT]
> This project is designed for researchers, fact-checkers, and everyday users who need reliable, AI-powered verification in a world increasingly filled with synthetic content.

---

## 🎥 Demo Video

👉 [Watch Demo](https://drive.google.com/file/d/1sGNdWI5lcVmBTA6u5bx9k9ct7RX4ZFk8/view?t=7s)

---

## 🚀 Key Detection Modules

TruthGuard AI features 7 specialized engines to ensure digital integrity:

| Module | Engine | Description |
| :--- | :--- | :--- |
| **📰 Fake News** | Advanced AI | Real-time fact-checking and source credibility analysis. |
| **🖼️ AI Image** | Vision AI | Pixel forensics to detect AI-generated artifacts and deepfakes. |
| **🎤 Deepfake Voice** | Audio Analysis | MFA and MFCC feature extraction to identify synthetic speech. |
| **💼 Fake Job** | Pattern AI | Domain verification and urgency pattern detection in job offers. |
| **🕵️ Fraud Behavior** | Biometrics AI | Detects suspicious user activity through behavioral biometrics. |
| **🔬 Fake Research** | Scientific AI | Verifies the methodology and credibility of research claims. |
| **🌤️ Weather Check** | Hybrid AI | Cross-references predictions against real-time OpenWeather data. |

---

## ✨ Advanced Features

*   **🌌 Dynamic 3D Environment**: Powered by **Three.js**, featuring a neural network background, drifting mesh orbs, and rotating halo rings for a truly premium feel.
*   **📊 Interactive Analytics**: Real-time confidence scores and forensic breakdowns visualized via **Chart.js**.
*   **🌓 Dual-Theme OS**: Seamless transition between high-contrast Dark Mode and crystal-clear Light Mode.
*   **⚡ Zero-Latency UI**: Built with **Vite** and **Framer Motion** for lightning-fast transitions and micro-interactions.
*   **🛡️ Multi-Layer Security**: Integrated safety checks for NSFW content and automated forensic reporting.

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 18 (Hooks, Context, Web Audio API)
- **Styling**: Tailwind CSS & Framer Motion
- **Visuals**: Three.js (Background System), Chart.js (Forensics)
- **Components**: Lucide-React & Custom SVG Animations

### **Backend**
- **Runtime**: Node.js & Express.js
- **AI Core**: Google Gemini 1.5/2.5 Pro & Flash
- **APIs**: OpenWeatherMap API, Axios Integration

---

## ⚙️ Setup & Installation

Follow these steps to get your own instance of TruthGuard AI running locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Thuyavan28/Fake-Dectector.git
cd Fake-Dectector
```

### 2. Install Dependencies
This project uses `concurrently` to manage both the React frontend and Express backend.
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_google_gemini_api_key
OPENWEATHER_API_KEY=your_openweather_api_key
PORT=5000
```

### 4. Launch Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

---

## 🧩 How It Works

1.  **Input Layer**: Users upload images, audio, or paste text/data into the specialized module interfaces.
2.  **AI Orchestrator**: The backend routes requests to specific Gemini models optimized for that data type (e.g., Vision Pro for images).
3.  **Forensic Analysis**: The system performs sub-pixel analysis (for images) or behavioral pattern matching (for fraud).
4.  **Verdict Generation**: A comprehensive report is generated, including a **VERDICT (REAL/FAKE)** and a **Confidence Score**.
5.  **Visualization**: Data is piped to interactive charts for deep-dive inspection.

---

## 👨‍💻 Meet the Team

| [<img src="https://github.com/Thuyavan28.png?size=100" width="100"><br><sub>Thuyavan M.</sub>](https://github.com/Thuyavan28) | [<img src="https://github.com/SandhiyaA.png?size=100" width="100" alt="Sandhiya A."><br><sub>Sandhiya A.</sub>](https://github.com/SandhiyaA) |
| :---: | :---: |
| Lead Developer | AI Research & UI Design |

---

## 🤝 Contributing

We welcome contributions! If you have ideas for new detection modules or UI improvements:
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="center">🚀 Created with ❤️ by the TruthGuard AI Team</p>

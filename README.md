# 🔍 TruthGuard AI (Fake Detection System)

TruthGuard AI is a powerful, full-stack web application designed to detect AI-generated and manipulated images with high accuracy. Built with React and Node.js, and powered by Google's Gemini Vision API, it provides professional-grade forensic analysis, safety checks, and confidence scores for any uploaded image.

## ✨ Features

- **🤖 AI Image Detection**: Accurately analyzes whether an image was human-created or AI-generated using the Gemini Multimodal API.
- **🛡️ Safety & Content Moderation**: Automatically scans for NSFW, deepfake, or violent content.
- **📊 Confidence Analytics**: Visual breakdowns of AI likelihood, displaying confidence meters with interactive charts using Chart.js.
- **✨ Stunning UI/UX**: Premium user interface featuring interactive drag-and-drop elements (`react-dropzone`) and fluid animations (`framer-motion`).
- **🚀 Full-Stack Architecture**: Lightning-fast React frontend built with Vite paired with a secure Express.js backend.

## 🛠️ Tech Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, Framer Motion, Chart.js
- **Backend**: Node.js, Express.js, CORS, Axios
- **AI Engine**: Google Gemini Multimodal API

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Thuyavan28/Fake-Dectector.git
   cd Fake-Dectector
   ```

2. **Install dependencies:**
   This project uses `concurrently` to run both the frontend and backend together.
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   Start both the Node.js backend and the Vite frontend simultaneously:
   ```bash
   npm run dev
   ```

5. **Open the app:**
   Visit `http://localhost:5173` in your browser.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Thuyavan28/Fake-Dectector/issues) if you want to contribute.

## 👨‍💻 Author

**Thuyavan**
- GitHub: [@Thuyavan28](https://github.com/Thuyavan28)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

# 🎓 Lumina AI Tutor

> **Your Next-Gen Adaptive AI-Powered Learning Companion**

[![Live Demo](https://img.shields.io/badge/Live%20App-lumina--ai--tutor.vercel.app-7c3aed?style=for-the-badge&logo=vercel)](https://lumina-ai-tutor.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-VaishnaviThapekar%2FLumina--AI--Tutor-181717?style=for-the-badge&logo=github)](https://github.com/VaishnaviThapekar/Lumina-AI-Tutor)
[![Status](https://img.shields.io/badge/Status-Active%20Production-success?style=for-the-badge)]()
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

An intelligent, adaptive tutoring platform that personalizes education through Retrieval-Augmented Generation (RAG), Socratic voice AI conversations, interactive concept maps, audio overview podcasts, spaced repetition, and real-time competency analytics.

---

## ✨ Core Features & Highlights

### 🎙️ 1. AI Audio Podcast Studio ("NotebookLM Style")
- **Conversational Audio Summaries**: Generates a 2-person Socratic podcast dialog (Host Alex & Co-Host Maya) breaking down complex concepts from uploaded documents.
- **Web Speech Audio Player**: Native voice synthesis with play, pause, segment navigation, speed adjustment (`1.0x`, `1.25x`, `1.5x`, `2.0x`), and downloadable transcript scripts.

### 📺 2. YouTube Video Recommendations Hub
- **Topic-Based Video Tutorials**: Automatically curates top-rated YouTube educational tutorials matching document concepts (*Networking*, *BGP Routing*, *OSI 7 Layers*, *Vector RAG*, *Calculus*).
- **Inline Modal Video Player**: Watch tutorials directly inside Lumina without leaving the workspace.

### 📚 3. Multi-Document Synthesis Workspace
- **Cross-Document Search**: Select multiple uploaded PDFs simultaneously using multi-select checkboxes.
- **Comparative Analysis**: Generates unified Socratic summaries, overlapping core themes, and file comparison matrices across your entire document library.

### 📝 4. Socratic Open-Response & Essay Evaluator
- **Active Recall Evaluator**: Type or paste written summaries to receive instant Socratic AI evaluation.
- **Academic Rubric Scoring**: Grades responses across **Conceptual Depth**, **Factual Accuracy**, **Structure & Clarity**, and **Key Term Coverage**, identifying missing concepts and awarding XP.

### ⚡ 5. 60-Second "Speed Study Sprint" Challenge Mode
- **High-Energy Gamification**: Rapid-fire True/False concept testing under a 60-second countdown.
- **Streak Multipliers**: Build streak combos to unlock up to **5x XP Multipliers** and track high scores.

### 📊 6. Dynamic Concept Map Visualizer
- **Mermaid Dependency Graphs**: Automatically extracts topic nodes and renders interactive dependency trees.
- **Action Shortcuts**: Click any node to instantly launch targeted Quizzes, Flashcards, or YouTube Video recommendations.

### 🧠 7. Smart Flashcards & 1-Click Anki Export
- **SM-2 Spaced Repetition**: Rate card recall using SM-2 intervals (*Again*, *Hard*, *Good*, *Easy*).
- **Anki CSV Export**: Export generated flashcards directly into Anki desktop or mobile app format.

### 💾 8. Persistent Multi-Session Saved Chat Drawer
- **Multi-Session Registry**: Browser registry (`lumina_all_chat_sessions`) saves all past Socratic AI chat sessions so conversation history persists seamlessly across tab switches.

### 🎨 9. Glassmorphism UI & Smooth Section Entrance Animations
- **Hardware-Accelerated Transitions**: Smooth cubic-bezier slide-up and fade-in animations (`animate-fade-in-slide-up`) on all section tab switches.
- **Custom Brand Identity**: Custom vector blue/purple open-book SVG favicon and adaptive Dark/Light mode theme engine.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** 18+ and `npm`
- **Python** 3.11+
- **Google AI API Key** (Free from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/VaishnaviThapekar/Lumina-AI-Tutor.git
cd Lumina-AI-Tutor
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from template
cp .env.example .env
# Edit .env and add your GOOGLE_API_KEY / GEMINI_API_KEY

# Start FastAPI backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start Next.js development server
npm run dev
```

### 4. Access the Platform

- 🌐 **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- ⚙️ **Backend FastAPI Server**: [http://localhost:8000](http://localhost:8000)
- 📖 **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🔧 Environment Configuration

### Backend Environment Variables (`backend/.env`)

```env
# Google AI API Key
GOOGLE_API_KEY=your_google_gemini_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here

# Pinecone Vector Store (Optional for Cloud RAG)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=us-west1-gcp-free

# Database Configuration
DATABASE_URL=sqlite:///./lumina.db

# Authentication Security
SECRET_KEY=your-jwt-secret-key-here
ALGORITHM=HS256
```

### Frontend Environment Variables (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000
```

---

## 📁 Repository Structure

```
Lumina-AI-Tutor/
├── backend/
│   ├── app/
│   │   ├── api/          # FastAPI REST Endpoints (Auth, Documents, Vector RAG, Quizzes)
│   │   ├── models/       # SQLAlchemy Data Schemas
│   │   ├── services/     # Socratic AI Engine & Pinecone Vector Store Retrieval
│   │   ├── config.py     # Environment Configuration
│   │   └── main.py       # Application Entrypoint
│   ├── requirements.txt  # Python Dependencies
│   └── .env.example
├── frontend/
│   ├── app/              # Next.js 14 App Router (pages, layout, favicons)
│   ├── components/       # 25+ Glassmorphic React Components (Podcast, MultiDoc, Sprint, Quiz, Chat)
│   ├── lib/              # Event Bus, Study Tracker, Auth, and XP Trigger Utilities
│   ├── public/           # Static Brand SVG Favicons & Assets
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Next.js 14 (React 18), TypeScript, Tailwind CSS, Lucide Icons, NextAuth.js |
| **Backend** | FastAPI, Python 3.11, Pydantic, SQLAlchemy |
| **AI Models & RAG** | Google Gemini API, Pinecone Vector Embeddings, Local CPU Vector Fallback Engine |
| **Audio & Speech** | Web Speech API Text-to-Speech & Speech Recognition |
| **State & Sync** | Custom Event Bus (`eventBus.ts`), Browser LocalStorage Registry |
| **Deployment** | Vercel (Frontend), Uvicorn/Render (Backend) |

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 📧 Contact & Links

- **Author**: Vaishnavi Thapekar — [vaishnavithapekar@gmail.com](mailto:vaishnavithapekar@gmail.com)
- **Live Platform**: [lumina-ai-tutor.vercel.app](https://lumina-ai-tutor.vercel.app/)
- **GitHub Repository**: [github.com/VaishnaviThapekar/Lumina-AI-Tutor](https://github.com/VaishnaviThapekar/Lumina-AI-Tutor)

---

**Built with ❤️ for adaptive, accessible learning worldwide.**

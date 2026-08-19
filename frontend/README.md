# 🎓 Lumina AI Tutor

> Your Adaptive AI-Powered Learning Companion

An intelligent tutoring platform that personalizes education through AI-powered conversations, voice interaction, and adaptive learning techniques.

![Lumina AI Tutor](https://img.shields.io/badge/Status-Active-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green)
![Python](https://img.shields.io/badge/Python-3.11-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

---

## ✨ Features

### 🤖 AI-Powered Learning
- **Voice-Controlled Chat**: Hands-free learning with speech recognition and text-to-speech
- **Document Q&A**: Upload PDFs and ask questions using RAG (Retrieval-Augmented Generation)
- **Adaptive Responses**: AI adjusts explanations based on your understanding level

### 📚 Study Tools
- **Smart Quizzes**: Auto-generated questions with adaptive difficulty
- **Flashcards**: Spaced repetition system for better retention
- **Pomodoro Timer**: Built-in focus timer with break reminders
- **Note Taking**: Rich text editor with AI-powered suggestions

### 📊 Analytics & Progress
- **Real-time Statistics**: Track study time, topics mastered, quiz scores
- **Advanced Analytics**: Visualize learning patterns and progress
- **Mastery Levels**: Gamified progression system (Beginner → Intermediate → Advanced)
- **XP & Rewards**: Earn points for completing activities

### 👥 Social Features
- **Study Groups**: Collaborate with peers
- **Leaderboards**: Compete with other learners
- **Progress Sharing**: Share achievements

### 🎯 Additional Features
- **AI Study Planner**: Automatically schedule study sessions
- **Multi-Document Support**: Work with multiple documents simultaneously
- **Dark/Light Mode**: Comfortable viewing in any environment
- **Responsive Design**: Works on desktop, tablet, and mobile

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **Google AI API Key** (free from [Google AI Studio](https://makersuite.google.com/app/apikey))

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lumina-ai-tutor.git
cd lumina-ai-tutor
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your API keys

# Start backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Start frontend
npm run dev
```

#### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 🔧 Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# Google AI API Keys (get from https://makersuite.google.com/app/apikey)
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_API_KEY=your_google_api_key_here

# Database
DATABASE_URL=sqlite:///./lumina.db

# Optional: OpenAI
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
lumina-ai-tutor/
├── backend/
│   ├── app/
│   │   ├── api/          # API routes
│   │   ├── models/       # Database models
│   │   ├── services/     # Business logic
│   │   ├── config.py     # Configuration
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   ├── public/           # Static files
│   ├── package.json
│   └── .env.local
└── README.md
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **API Client**: Axios
- **Authentication**: NextAuth.js

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: SQLite (development), PostgreSQL (production)
- **AI Models**: Google Gemini, OpenAI GPT-4
- **Vector Store**: Pinecone (optional)
- **Authentication**: JWT

---

## 📖 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎯 Usage

### 1. Upload a Document
- Click "Upload" tab
- Drag & drop or select a PDF
- Wait for processing

### 2. Start Learning
- Click "Learn" tab
- Use voice or text to ask questions
- AI responds with explanations

### 3. Take Quizzes
- Click "Quiz" tab
- Auto-generated questions based on your document
- Get instant feedback

### 4. Track Progress
- View "Stats" for study statistics
- Check "Analytics" for detailed insights
- Monitor "Rewards" for achievements



---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI** for powerful language models
- **OpenAI** for GPT models
- **Next.js** team for the amazing framework
- **FastAPI** for the fast and modern Python API framework

---

## 📧 Contact

Your Name - vaishnavithapekar@gmail.com

Project Link: [https://github.com/VaishnaviThapekar/lumina-ai-tutor](https://github.com/VaishnaviThapekar/lumina-ai-tutor)

---

## 🌟 Star History

If you find this project helpful, please consider giving it a ⭐!


**Built with ❤️**
 

# Quiz Dojo (formerly Quiz Cult)

A real-time multiplayer quiz application with AI-powered question generation, document upload capabilities, and comprehensive analytics.

![Quiz Dojo Logo](frontend/public/logo-lockup.png)

## 🌟 Live Demo

**Visit:** [quizdojo.live](https://quizdojo.live)

## 🚀 Features

### **Core Quiz Functionality**
- **Real-time Multiplayer**: Create rooms and compete with friends in live quiz sessions
- **AI-Powered Questions**: Generate questions using OpenAI or fallback to sample questions
- **Two Question Modes**:
  - **Topic-based**: General knowledge questions about specific topics
  - **Document-based**: Questions generated from uploaded PDF/Word documents
- **Three Difficulty Levels**: Easy, Medium, Hard with time-based scoring
- **Live Scoring**: Real-time leaderboards and performance tracking

### **More Features**
- **Document Upload**: Upload PDF and Word documents to create custom quizzes
- **Host Controls**: Kick players, manage game flow, and control room settings
- **Multi-language Support**: Internationalization with i18next
- **Analytics Dashboard**: Google Analytics integration with custom event tracking

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19.1.0 + TypeScript
- **Build Tool**: Vite 6.1.0
- **Styling**: Tailwind CSS 4.1.10 with custom color palette
- **Routing**: React Router DOM 7.6.2
- **State Management**: Firebase Realtime Database
- **Real-time**: Socket.io Client 4.8.1
- **Internationalization**: i18next 25.3.1
- **Analytics**: Google Analytics 4
- **Icons**: React Icons 5.5.0

### **Backend**
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js 4.18.2
- **Real-time**: Socket.io 4.7.4
- **Database**: Firebase Realtime Database
- **AI Integration**: OpenAI
- **File Processing**: PDF parsing, Word document processing
- **CORS**: Multi-environment deployment support


## 📁 Project Structure

```
quiz-cult/
├── frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   ├── components/      # Reusable UI components
│   │   ├── api/            # API client and presence management
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript type definitions
│   ├── public/             # Static assets
│   └── dist/               # Production build output
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── config/         # Configuration and environment setup
│   │   └── types/          # TypeScript type definitions
├── shared/                  # Shared TypeScript types
└── docs/                    # Documentation files
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Firebase project (for database)
- OpenAI API key (optional, for AI question generation)

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd quiz-cult

# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### **Individual Commands**
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Build for production
npm run build

# Start production backend
npm run start:backend
```

## ⚙️ Configuration

### **Environment Variables**

#### **Backend (.env)**
```env
# OpenAI (Optional - app works with sample questions if not configured)
OPENAI_API_KEY=your-openai-api-key

# Firebase (Required)
FIREBASE_DATABASE_URL=your-firebase-database-url
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### **Frontend (.env.local)**
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Backend API
VITE_API_URL=http://localhost:3001
```

## 🎮 How It Works

### **1. Room Creation**
- Host creates a room with topic/difficulty or uploads a document
- AI generates questions (or uses sample questions as fallback)
- 6-digit room code is generated for players to join

### **2. Player Joining**
- Players enter the 6-digit room code
- Real-time presence shows who's in the room
- Host can kick players before game starts

### **3. Quiz Gameplay**
- Questions are displayed with multiple choice options
- Timer counts down for each question
- Players submit answers in real-time
- Scores calculated based on correctness and speed

### **4. Results & Analytics**
- Final leaderboard shows rankings
- Detailed analytics track performance
- Google Analytics captures user behavior


## 📊 Analytics

### **Google Analytics Integration**
- **Tracking ID**: G-24XN0CK5HB
- **Custom Events**: Room creation, quiz completion, user interactions
- **User Identification**: Anonymous user IDs with session tracking
- **Development Dashboard**: Mock analytics in development mode

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Live Site**: [quizdojo.live](https://quizdojo.live)
- **Issues**: Create an issue in the GitHub repository
- **Documentation**: Check the `/docs` folder for detailed guides


---

**Built with ❤️ using React, Node.js, and OpenAI**

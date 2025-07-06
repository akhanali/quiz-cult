# Quiz Cult

A real-time multiplayer quiz application with AI-powered question generation.

## Features

- Real-time multiplayer quiz sessions
- AI question generation using OpenAI GPT (with fallback to sample questions)
- Three difficulty levels with time-based scoring
- Live scoring and leaderboards
- Responsive web interface

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Firebase Realtime Database
- **AI**: OpenAI GPT-4o-mini

## Project Structure

```
quiz-cult/
├── frontend/         
├── backend/          
├── shared/            # Shared TypeScript types
└── package.json       # Root scripts
```

## Development Setup



### Getting Started
```bash
# Install dependencies
npm run install:all

# Start development servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Individual Commands
```bash
# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Build for production
npm run build
```

## Configuration

### OpenAI (Optional)
Create `backend/.env`:
```env
OPENAI_API_KEY=your-api-key-here
```

The application works with sample questions if OpenAI is not configured.

### Firebase
Create `frontend/.env.local`:
```env
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=your-database-url
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

## How It Works

1. Host creates a room with a topic and difficulty level
2. Players join using a 6-digit room code  
3. Questions are generated (AI or samples based on configuration)
4. Players answer questions in real-time
5. Scores are calculated based on correctness and response time
6. Final results show leaderboard and statistics

## API Endpoints

- `GET /health` - Health check
- `POST /api/rooms` - Create room
- `POST /api/rooms/join` - Join room
- `POST /api/rooms/:id/start` - Start game
- `POST /api/questions/generate` - Generate questions


## License

MIT

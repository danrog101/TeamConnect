# AGENTS.md - TeamConnects

## Commands
- **Backend dev**: `cd backend && npm run dev` (uses nodemon)
- **Backend start**: `cd backend && npm start`
- **Frontend dev**: `cd teamconnect-app && npm start`
- **Frontend build**: `cd teamconnect-app && npm run build`
- **Frontend test**: `cd teamconnect-app && npm test`
- **Single test**: `cd teamconnect-app && npm test -- --testPathPattern="<pattern>"`

## Architecture
- **backend/**: Express.js REST API with Socket.io for real-time chat
  - PostgreSQL via Supabase (config in `config/database.js`)
  - JWT auth with bcryptjs, routes in `routes/`, controllers in `controllers/`
  - File uploads via Multer + Cloudinary
- **teamconnect-app/**: React 19 frontend (Create React App)
  - Pages in `src/pages/`, components in `src/components/`, API calls in `src/services/`

## Code Style
- Use CommonJS (`require`/`module.exports`) in backend
- Use ES6 imports in React frontend
- Environment variables: `.env` (backend), `.env.local` (frontend)
- Error handling via `middleware/errorHandler.js`, logging via Winston
- Croatian comments are common in this codebase

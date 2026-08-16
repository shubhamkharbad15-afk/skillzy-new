# Skillzy - Deployment Preparation Guide

## Project Structure

This project has been reorganized for clean deployment with a clear separation between frontend and backend:

```
SKILZY/
├── frontend/                 # React + Vite frontend application
│   ├── src/                 # React source code
│   ├── public/              # Static assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS config
│   ├── index.html           # HTML entry point
│   └── dist/                # Production build output
│
├── backend/                 # FastAPI + Python backend
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration (loads from .env)
│   ├── database.py          # MongoDB connection setup
│   ├── auth.py              # Authentication logic
│   ├── crud.py              # Database operations
│   ├── models.py            # Pydantic models
│   ├── schemas.py           # API schemas
│   ├── requirements.txt      # Python dependencies
│   ├── .env                 # Environment variables (never commit!)
│   └── .env.example         # Example .env template
│
├── .gitignore               # Git ignore rules
├── README.md                # Main project documentation
└── DEPLOYMENT.md            # This file

```

## Technology Stack

- **Frontend**: React 19 + Vite + TailwindCSS + React Router
- **Backend**: FastAPI + Uvicorn + Motor (async MongoDB driver)
- **Database**: MongoDB
- **Authentication**: JWT + Google OAuth 2.0
- **Python Version**: 3.9+

## Local Development Setup

### Frontend

```bash
cd frontend
npm install
npm run dev              # Start dev server at http://localhost:5173
npm run build            # Build for production to dist/
npm run lint             # Run ESLint
npm run preview          # Preview production build
```

### Backend

```bash
cd backend

# Create virtual environment (if not already done)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Copy .env.example to .env and update values
cp .env.example .env
# Edit .env with your MongoDB URL, Google OAuth credentials, etc.

# Run the backend
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

## Environment Variables

### Backend (.env file)

Create `backend/.env` with the following variables (see `backend/.env.example`):

```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MONGO_DATABASE_URL=mongodb://localhost:27017/skillzydb
FRONTEND_BASE_URL=http://localhost:5173
ADMINS=admin@example.com
```

### Frontend Configuration

The frontend uses these environment variables (optional, for build-time configuration):

- `VITE_API_BASE_URL`: Backend API base URL (defaults to `http://localhost:8000`)

Set during build:
```bash
cd frontend
VITE_API_BASE_URL=http://your-api-domain.com npm run build
```

Or set in `.env` file in frontend directory:
```
VITE_API_BASE_URL=http://your-api-domain.com
```

## API Endpoints

The backend exposes the following main endpoints:

- **Auth**
  - `POST /auth/signup` - User registration
  - `POST /auth/token` - User login
  - `GET /auth/google/login` - Google OAuth login
  - `GET /auth/google/callback` - Google OAuth callback

- **Users**
  - `GET /users/me` - Get current user profile
  - `POST /users/me/profile` - Update user profile

- **Search & Recommendations**
  - `GET /api/search?query=...` - Search users
  - `GET /match/recommendations` - Get user recommendations

CORS is configured for:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

## Deployment Checklist

Before deploying to Docker or production:

- [ ] Backend
  - [ ] Update `backend/.env` with production values
  - [ ] Ensure MongoDB is accessible
  - [ ] Generate strong `SECRET_KEY`
  - [ ] Configure Google OAuth credentials
  - [ ] Update `FRONTEND_BASE_URL` to production URL
  - [ ] Update CORS origins in `backend/main.py` for production domain

- [ ] Frontend
  - [ ] Set `VITE_API_BASE_URL` to production backend URL
  - [ ] Run `npm run build` to create optimized production build
  - [ ] Test the production build with `npm run preview`

- [ ] General
  - [ ] Verify `.env` is NOT committed to git
  - [ ] Verify `.gitignore` excludes sensitive files
  - [ ] Review and update API endpoints as needed
  - [ ] Test end-to-end authentication flow

## Key Files for Deployment

### Important Configuration Files

- `backend/.env` - **MUST** be kept secret, never commit to git
- `backend/requirements.txt` - All Python dependencies
- `frontend/package.json` - All Node.js dependencies
- `frontend/vite.config.js` - Build configuration
- `.gitignore` - Ensures secrets aren't committed

### Application Entry Points

- **Backend**: `backend/main.py` - FastAPI app
- **Frontend**: `frontend/src/main.jsx` - React entry point
- **Frontend Build Output**: `frontend/dist/index.html` - Serves to users

## Database Schema

MongoDB database: `skillzydb`

Main collections:
- `users` - User profiles and authentication
- Other collections as defined in models

## Notes for Docker Deployment

When creating Dockerfile/docker-compose.yml:

1. **Backend Dockerfile** should:
   - Use Python 3.9+ base image
   - Install dependencies from `backend/requirements.txt`
   - Set working directory to `/app/backend`
   - Expose port 8000
   - Run: `uvicorn main:app --host 0.0.0.0 --port 8000`

2. **Frontend Dockerfile** should:
   - Use Node.js base image for build stage
   - Run `npm install && npm run build` in `frontend/`
   - Copy `frontend/dist` to web server (nginx)
   - Expose port 80/3000

3. **docker-compose.yml** should:
   - Define backend service (port 8000)
   - Define frontend service (port 80/3000)
   - Define MongoDB service or use external MongoDB
   - Set environment variables from `.env`
   - Configure network for inter-service communication

## Troubleshooting

### Frontend build fails
- Ensure Node.js version >= 16
- Delete `frontend/node_modules` and run `npm install` again
- Check `frontend/vite.config.js` for path issues

### Backend fails to start
- Check MongoDB connection in `.env` (MONGO_DATABASE_URL)
- Verify Python version is 3.9+
- Run `pip install -r requirements.txt` to ensure all dependencies
- Check `.env` file has all required variables

### CORS errors
- Verify `FRONTEND_BASE_URL` matches the frontend's actual URL
- Update CORS origins in `backend/main.py` for your domain
- Check browser console for specific error details

## Next Steps

After local testing, the project is ready for:
1. Docker containerization
2. CI/CD pipeline setup
3. Production deployment
4. Database migration to production MongoDB instance

---

**Last Updated**: 2026-08-16
**Project**: Skillzy
**Frontend**: React + Vite
**Backend**: FastAPI + Motor + MongoDB

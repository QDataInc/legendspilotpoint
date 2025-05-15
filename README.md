# Legends Pilot Point

## Project Overview
A full-stack hotel booking system with room management, built with React (Vite) for the frontend and Express.js for the backend. Backend is deployed on Render, frontend on Vercel.

---

## Directory Structure
- `frontend/` — React (Vite) app
- `backend/` — Express.js API server

---

## Local Development

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd legendspilotpoint
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` with:
```
PORT=3001
SQUARE_ACCESS_TOKEN=your_square_token
SQUARE_LOCATION_ID=your_square_location_id
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
ADMIN_EMAIL=admin_email_to_notify
ENVIRONMENT=production # or sandbox
NEXT_PUBLIC_APP_URL=http://localhost:5173 # or your deployed frontend URL
```
Run the backend:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env` file in `frontend/` with:
```
VITE_API_URL=http://localhost:3001 # or your deployed backend URL
```
Run the frontend:
```bash
npm run dev
```

---

## Deployment

### Backend (Render)
- Deploy the `backend/` folder as a Node.js service on Render.
- Set all environment variables in the Render dashboard.
- Make sure CORS in `server.js` allows your frontend domain(s):
  ```js
  app.use(cors({
    origin: [
      'https://www.legendspilotpoint.com',
      'https://legendspilotpoint.vercel.app'
    ]
  }));
  ```

### Frontend (Vercel)
- Deploy the `frontend/` folder to Vercel.
- In Vercel dashboard, set the environment variable:
  - `VITE_API_URL=https://legendspilotpoint-backend.onrender.com`
- Redeploy after any environment variable changes.

---

## Troubleshooting
- **CORS errors:** Ensure the backend CORS config matches your deployed frontend domain.
- **API errors:** Double-check your environment variables and backend URL.

---

## License
MIT 
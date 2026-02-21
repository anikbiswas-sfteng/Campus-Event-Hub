# Campus Event Hub

Full-stack web app for college event management with role-based access for `student` and `organizer`.

## Tech Stack

- Frontend: React (Vite), Tailwind CSS, React Router, Axios, html5-qrcode
- Backend: Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs, qrcode, csv-writer

## Project Structure

```text
college-event-manager/
  client/
    pages/
    components/
    context/
    services/
    App.jsx
    main.jsx
  server/
    config/
    models/
    routes/
    controllers/
    middleware/
    server.js
```

## Features

- Authentication (register/login)
- Password hashing with bcryptjs
- JWT authentication and protected routes
- Role-based authorization (`student`, `organizer`)
- Organizer can create/edit/delete events
- Student can register for events and get personal QR code
- Prevent duplicate registration
- Stop registration when max participants is reached
- Organizer QR scanner marks attendance
- Organizer can export event registrations to CSV

## Local Setup

## 1. Open project

```bash
cd college-event-manager
```

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Set values in `server/.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/college_event_manager
JWT_SECRET=your_strong_secret
CLIENT_URL=http://localhost:5173
```

Run backend:

```bash
npm run server
```

Optional backend utilities:

```bash
npm run check
npm run seed
```

## 3. Frontend setup

Open a second terminal:

```bash
cd college-event-manager/client
npm install
cp .env.example .env
```

Set value in `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run frontend:

```bash
npm run dev
```

## 4. Open app

Visit `http://localhost:5173`

## API Endpoints (Core)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/events`
- `POST /api/events` (organizer)
- `PUT /api/events/:id` (organizer)
- `DELETE /api/events/:id` (organizer)
- `POST /api/registrations/events/:eventId/register` (student)
- `GET /api/registrations/my` (student)
- `GET /api/registrations/events/:eventId` (organizer)
- `GET /api/registrations/events/:eventId/export-csv` (organizer)
- `POST /api/registrations/attendance/scan` (organizer)

## Notes

- MongoDB must be running locally before starting backend.
- Use Postman for backend route testing if needed.
- QR token is generated server-side and encoded into student QR image.

## Deploy Live

### Backend (Render)

1. Push this repo to GitHub.
2. In Render, create a new Blueprint service and select this repo (it uses `render.yaml`).
3. Set env vars in Render:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = strong random secret
   - `CLIENT_URLS` = your frontend URL (example: `https://your-app.vercel.app`)
4. Deploy and verify health endpoint:
   - `https://your-backend-domain.com/api/health`

### Frontend (Vercel)

1. Import the `client` folder as a Vercel project.
2. Set:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_API_URL=https://your-backend-domain.com/api`
3. Deploy.

### Final wiring

1. Copy your Vercel frontend URL.
2. Update Render `CLIENT_URLS` with that URL.
3. Redeploy backend once.

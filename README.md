# 🌾 Krishi Mitra (MERN Refactor)

This project now includes a proper MERN-style structure with:

- **Backend:** Express + MongoDB (Mongoose) + Socket.IO
- **Frontend:** React (Vite) + Axios + Socket.IO client

Your original static files (`index.html`, `server.js`) are still present as legacy code.

---

## 📂 Project Structure

```bash
Agrimandi-Project/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── cropController.js
│   ├── models/
│   │   └── Crop.js
│   ├── routes/
│   │   └── cropRoutes.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── socket.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── index.html          # legacy static frontend
├── server.js           # legacy monolithic backend
├── .env
└── package.json        # workspace scripts
```

---

## 🧩 Crop API (MVC)

Base URL: `http://localhost:5000/api`

### Farmer APIs

- `POST /addCrop`
- `PUT /updateCrop/:id`
- `DELETE /deleteCrop/:id`

### Buyer APIs

- `GET /allCrops`
- `GET /crop/:id`

### Content APIs

- `GET /mandi`
- `GET /schemes`
- `GET /news`

### Auth APIs

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/login/farmer`
- `POST /auth/login/buyer`
- `POST /auth/login/admin`
- `GET /auth/me` (Bearer token required)

### Admin Content APIs

- `POST /admin/news` (admin token required)
- `DELETE /admin/news/:id` (admin token required)
- `POST /admin/schemes` (admin token required)
- `DELETE /admin/schemes/:id` (admin token required)

### Weather API

- `GET /weather?lat=<latitude>&lon=<longitude>`

### Query Params for `GET /allCrops`

- `crop_name`
- `location`
- `minPrice`
- `maxPrice`

---

## 🔴 Real-Time Events (Socket.IO)

The backend emits:

- `cropAdded`
- `cropUpdated`
- `cropDeleted`

Frontend dashboards subscribe to these events and auto-refresh crop data.

---

## ⚙️ Environment Variables

Use your existing `.env` file at the project root:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_secure_secret
```

---

## 🚀 Run the MERN App

From project root:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

---

## 👨‍🌾 Frontend Dashboards

- **Farmer Dashboard**
  - Add crop form
  - Update crop
  - Delete crop

- **Buyer Dashboard**
  - Crop listing page
  - Search by crop name
  - Filter by price
  - Filter by location

- **Home**
  - Carousel
  - Navigation tiles
  - Weather card
  - Quick tips
  - News section (API-backed with fallback)

- **Mandi Prices**
  - State and crop filters
  - Dynamic mandi table

- **Schemes**
  - Dynamic schemes list (API-backed with fallback)

- **Auth**
  - Register / Login / Logout
  - JWT session persisted in localStorage

- **Admin**
  - Add/Delete News
  - Add/Delete Schemes
  - Admin role guarded via JWT

---

## 👨‍💻 Author

- Polepalli Pramodini

---

## 🌐 Deploy On Render

This repo now includes a Render Blueprint file at [render.yaml](render.yaml), so you can deploy backend + frontend together.

### 1. Push this repo to GitHub

Render will deploy from your GitHub repository.

### 2. Create services using Blueprint

1. Open Render Dashboard.
2. Click **New** → **Blueprint**.
3. Select this repository.
4. Render will detect [render.yaml](render.yaml) and create:
   - `agrimandi-backend` (Node Web Service)
   - `agrimandi-frontend` (Static Site)

### 3. Set backend environment variables

In Render service `agrimandi-backend`, set:

- `MONGO_URI` = your MongoDB connection string
- `JWT_SECRET` = strong secret key
- `CLIENT_URL` = your frontend Render URL (example: `https://agrimandi-frontend.onrender.com`)
- `OPENAI_API_KEY` = optional (only needed for voice transcription/TTS)

### 4. Set frontend environment variables

In Render service `agrimandi-frontend`, set:

- `VITE_API_BASE_URL` = your backend URL + `/api`
  - example: `https://agrimandi-backend.onrender.com/api`
- `VITE_SOCKET_URL` = your backend URL
  - example: `https://agrimandi-backend.onrender.com`

### 5. Redeploy both services

After setting env vars, trigger redeploy for both services.

### 6. Verify

- Backend health: `https://<your-backend>.onrender.com/api/health`
- Open frontend URL and test:
  - login/register
  - crop list
  - socket updates/chat

### Notes

- Backend CORS now supports comma-separated origins in `CLIENT_URL`.
  - Example: `https://agrimandi-frontend.onrender.com,http://localhost:5173`
- Render free instances may sleep after inactivity, causing first request delay.
  


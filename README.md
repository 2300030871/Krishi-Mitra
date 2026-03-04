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
  


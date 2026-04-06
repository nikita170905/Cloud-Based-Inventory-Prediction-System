# Cloud-Based Inventory Prediction System

Inventory dashboard built with Vite (frontend), Firebase Firestore (data), and a lightweight Node/Express API (backend).

This project helps move inventory management from reactive stock handling to proactive forecasting using weighted usage trends.

## Key Features

- Real-time cloud sync with Firebase Firestore.
- Weighted moving average prediction for stock-out estimation.
- Chart.js visual usage trends.
- CSV data seeding script for quick initial setup.
- Bulk actions and stock alert status (Healthy, Low Stock, Urgent Refill).

## Tech Stack

- Frontend: Vite + Vanilla JavaScript
- Backend: Node.js + Express
- Database: Firebase Firestore
- Visualization: Chart.js
- CSV parsing: PapaParse

## Project Structure

- Frontend: [index.html](index.html), [src/main.js](src/main.js)
- Backend API: [backend/server.js](backend/server.js)
- Render Blueprint: [render.yaml](render.yaml)

## Local Run

Create a local env file before running the app:

1. Copy `.env.example` to `.env`
2. Fill all Firebase values in `.env`

`.env` is ignored by git and will not be committed.

### 1) Frontend

```bash
npm install
npm run dev
```

### 2) Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:10000` by default.

## Deploy Entire Project On Render

This repo is configured for Render Blueprint deployment using [render.yaml](render.yaml).

### What gets deployed

- `ccl-frontend`: Static site (Vite build output in `dist`)
- `ccl-backend`: Node web service (`backend/server.js`)

### Steps

1. Push this repository to GitHub.
2. Open Render Dashboard.
3. Click **New** -> **Blueprint**.
4. Connect your GitHub repo.
5. Render detects [render.yaml](render.yaml) and shows two services.
6. Open the `ccl-frontend` service settings and set all required environment variables:
	- VITE_FIREBASE_API_KEY
	- VITE_FIREBASE_AUTH_DOMAIN
	- VITE_FIREBASE_PROJECT_ID
	- VITE_FIREBASE_STORAGE_BUCKET
	- VITE_FIREBASE_MESSAGING_SENDER_ID
	- VITE_FIREBASE_APP_ID
	- VITE_FIREBASE_MEASUREMENT_ID
7. Click **Apply** to create and deploy both.
8. If needed, trigger a manual redeploy after setting frontend env vars.

### Health Check

After deployment, verify backend health:

`GET https://<your-backend-service>.onrender.com/health`

Expected response:

```json
{ "ok": true, "service": "ccl-backend" }
```

## Backend API

### POST `/api/predict`

Request body:

```json
{
	"currentStock": 120,
	"minThreshold": 20,
	"usageHistory": [4, 5, 4, 6, 5]
}
```

Response body:

```json
{
	"currentStock": 120,
	"minThreshold": 20,
	"weightedAverageUsage": 5.133333333333334,
	"remainingDays": 23.376623376623378,
	"alert": {
		"label": "Healthy",
		"tone": "ok"
	}
}
```

## Notes

- The frontend currently reads/writes inventory directly from Firebase Firestore.
- The backend service is deployable independently and can be used for server-side prediction APIs.
- Never commit `.env` to source control. Keep secrets only in local `.env` and Render environment settings.

## Future Improvements

- Move prediction reads fully through backend API endpoints.
- Add authentication and role-based access.
- Add PWA support for mobile-first inventory operations.

# Cloud-Based Inventory Prediction System

This project is a professional-grade, smart inventory management platform designed to shift from reactive stock-keeping to **proactive forecasting**. It leverages cloud-native technologies to track daily consumption patterns and predict exactly when supplies will be exhausted using mathematical modeling.

---

## 🚀 Key Features

* **Real-time Cloud Sync:** Fully integrated with **Firebase Firestore** to ensure data is persistent across devices and updates instantly via live listeners (`onSnapshot`).
* **Predictive Analytics:** Uses a **Weighted Moving Average (WMA)** algorithm to prioritize recent usage data over older records for highly accurate stock-out predictions.
* **Visual Data Insights:** Integrated **Chart.js** modules render historical usage trends directly on product cards.
* **Automated Data Seeding:** A dedicated Node.js script (`seed.js`) that processes large CSV datasets (like `FashionDataset.csv`) to pre-load the database with realistic scale.
* **Enterprise Utility:** Includes bulk deletion, custom alert thresholds (Low Stock/Urgent Refill), skeleton loading states, and CSV report exporting.

---

## 🛠️ Tech Stack

* **Bundler:** Vite
* **Language:** Vanilla JavaScript (ES Modules)
* **Database:** Firebase Firestore (v12 SDK)
* **Visualization:** Chart.js
* **Data Parsing:** Papaparse (for CSV handling)

---

## 📂 Project Structure

```text
├── index.html          # Main dashboard entry point
├── seed.js             # CSV-to-Firestore data seeder
├── src/
│   ├── main.js         # UI Controller & Firestore subscribers
│   ├── firebase.js     # Cloud configuration
│   ├── prediction.js   # WMA & depletion logic
│   ├── product.js      # Firestore CRUD operations
│   ├── chart.js        # Visualization logic
│   ├── export.js       # CSV report generator
│   └── style.css       # Modern UI design
└── FashionDataset.csv  # Sample retail data for seeding
```

## 🧠 Prediction Logic

The "Brain" of this system relies on the `calculateWeightedAverageUsage` function. Unlike a simple average, it assigns increasing weights to recent entries to adapt to changing behavior.

The core depletion formula is:

$$Remaining Days = \frac{Current Stock}{Weighted Average Usage}$$

If the predicted `remainingDays` is less than **3**, the system automatically triggers an **Urgent Refill** status.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js** installed on your machine.

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Database Configuration
Update the firebaseConfig in both src/firebase.js and seed.js with your unique Firebase credentials.

### 4. Data Seeding (Optional)
To populate your dashboard with the sample retail dataset:
```bash
npm run seed
```

### 5. Start Development
Launch the local development server:
```bash
npm run dev
```

---


📈 Future Roadmap
* **Advanced AI Integration:** Replace WMA with a Linear Regression model for seasonal trend forecasting.
* **Authentication:** Multi-user support with secure Firebase Auth login.
* **Mobile App:** Conversion to a Progressive Web App (PWA) for native mobile inventory tracking.


# PropManager Pro — Property Management System

## 🚀 Setup Guide

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project" → name it → Create
3. Click the Web icon (</>)  to add a web app
4. Copy the firebaseConfig object shown

### Step 2: Enable Authentication
Firebase Console → Authentication → Get Started:
- Enable Email/Password
- Enable Google

### Step 3: Set Up Firestore
Firebase Console → Firestore Database → Create database → Production mode

Paste these Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
    }
  }
}
```

### Step 4: Create Composite Indexes
Firestore → Indexes → Composite. Create for each collection:
- properties: uid ASC, createdAt DESC
- tenants: uid ASC, createdAt DESC
- leases: uid ASC, createdAt DESC
- payments: uid ASC, createdAt DESC

(Firebase will also prompt links in browser console when you first run the app)

### Step 5: Add Your Config
Open src/firebase.js and replace all YOUR_* values with your actual Firebase config.

### Step 6: Add Authorized Domain
Firebase Console → Authentication → Settings → Authorized domains → Add localhost

## Install & Run
```
npm install
npm run dev
```

## Build for Production
```
npm run build
```

## Deploy to Firebase Hosting
```
npm install -g firebase-tools
firebase login
firebase init hosting  (select dist, configure as SPA)
npm run build
firebase deploy
```

## Features
- Login/Register + Google Sign-In
- Properties: Add, edit, delete, filter (Rented/Vacant)
- Property Detail: Tenant info, lease status, payment history
- Tenants: Full profiles, rent status, filters
- Leases: Expiry tracking, progress bars, alerts
- Payments: Monthly records, collected vs pending
- Dashboard: Charts, stats cards, expiry alerts
- Dark/Light mode toggle
- Fully responsive (mobile + desktop)

## Tech Stack
React 18 + Vite, Tailwind CSS v3, React Router DOM v6,
Firebase Auth + Firestore, Recharts, date-fns, Lucide React

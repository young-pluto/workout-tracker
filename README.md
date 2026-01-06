# Workout Tracker

A modern, mobile-first workout tracking app built with React, TypeScript, and Firebase.

![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Firebase](https://img.shields.io/badge/Firebase-9-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan)

## Features

- 📱 **Mobile-first PWA** - Installable on iOS/Android
- 🏋️ **Exercise Library** - Create and manage custom exercises
- 📝 **Workout Tracking** - Log sets, reps, and weights
- 📊 **Progress Charts** - Visualize strength gains over time
- 🌙 **Dark Mode** - System-aware theme switching
- 💾 **Auto-save** - Never lose your workout data
- ⏱️ **Workout Timer** - Track workout duration

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Framer Motion
- **Backend**: Firebase (Auth + Realtime Database)
- **Charts**: Chart.js + react-chartjs-2

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Realtime Database

### Installation

```bash
# Clone the repo
git clone https://github.com/young-pluto/workout-tracker.git
cd workout-tracker

# Install dependencies
npm install

# Copy env example and add your Firebase config
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

Deploy the `dist` folder to any static hosting:

- Vercel
- Netlify
- Firebase Hosting
- GitHub Pages

## License

MIT

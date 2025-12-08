# IT Student Logger System

A modern, biometric attendance and log management system designed for educational institutions. This application utilizes facial recognition technology to securely log student attendance and provides comprehensive dashboards for both students and administrators.

## 🚀 Overview

The **IT Student Logger System** streamlines the traditional attendance process by replacing manual logs with a secure, AI-powered facial recognition interface. Students can mark their attendance simply by scanning their face, while administrators gain real-time insights into student activities and logs.

### Key Features

*   **🤖 Facial Recognition Authentication**: Secure login and attendance marking using `@vladmandic/face-api` (TensorFlow.js).
*   **📊 Dynamic Dashboards**:
    *   **Student Dashboard**: View personal attendance history, profile status, and announcements.
    *   **Admin Dashboard**: Manage student registrations, view global logs, and export reports.
*   **⏱️ Real-time Attendance**: Instant logging with timestamp and geolocation validation (optional).
*   **📱 Responsive UI**: A fully responsive interface built with **React 19** and **Tailwind CSS**.
*   **☁️ Cloud Backend**: Powered by **Supabase** for managed database, authentication, and security.

---

## 🛠️ Technology Stack

This project is built using a modern frontend-first architecture:

### Frontend Core
*   **[React 19](https://react.dev/)**: The latest version of the core UI library for building component-based interfaces.
*   **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for ultra-fast development and optimized production builds.
*   **[TypeScript](https://www.typescriptlang.org/)**: Ensures type safety and code reliability throughout the application.

### AI & Biometrics
*   **[Face-API.js](https://github.com/vladmandic/face-api)**: Browser-based facial recognition library built on top of TensorFlow.js.
    *   *Capabilities*: Face detection, 68-point face landmark detection, and face descriptor extraction (128-dimensional embeddings).

### Styling & Design
*   **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for rapid UI development.
*   **[Lucide React](https://lucide.dev/)**: Beautiful, consistent icon set.

### Backend & Database
*   **[Supabase](https://supabase.com/)**: An open-source Firebase alternative providing:
    *   PostgreSQL Database
    *   Authentication (integrated with custom Face ID logic)
    *   Row Level Security (RLS)

---

## 📂 Project Structure

A quick look at the top-level files and directories:

```
.
├── public/
│   └── models/          # Pre-trained AI models for face recognition
├── src/
│   ├── components/      # Reusable UI components (Modals, Icons, Cards)
│   ├── layouts/         # Layout wrappers (MainLayout, AuthLayout)
│   ├── lib/             # Third-party library configurations (Supabase client)
│   ├── pages/           # Main application views (Login, StudentDashboard, etc.)
│   ├── utils/           # Helper functions & core logic
│   │   └── faceRecognition.ts  # Core biometric logic
│   ├── App.tsx          # Main routing configuration
│   └── main.tsx         # Application entry point
└── package.json         # Project dependencies and scripts
```

---

## ⚡ Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** or **yarn**

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/it-student-logger.git
    cd it-student-logger
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    This project connects to Supabase. Ensure your API keys are configured in `src/lib/supabase.ts` or a `.env` file (recommended).

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will launch at `http://localhost:5173`.

---

## 📖 Usage Guide

### For Students
1.  **Registration**: New students must be registered by an admin to have their face data stored.
2.  **Login**: Use the "Face Login" feature to access your dashboard.
3.  **Mark Attendance**: Navigate to the Attendance page and scan your face to log your entry/exit.

### For Admins
1.  **Dashboard**: Monitor all student logs in real-time.
2.  **User Management**: Register new students and capture their initial face biometrics.
3.  **Reports**: Filter and view attendance logs by date or student ID.

---

## 🤝 Contributing

Contributions are welcome! Please run the linter before submitting a pull request:

```bash
npm run lint
```

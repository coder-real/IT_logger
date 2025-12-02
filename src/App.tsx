import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Attendance from "./pages/Attendance"; // NEW

// Custom hook for page titles
function useDocumentTitle(title: string) {
  React.useEffect(() => {
    document.title = `${title} - IT Logger System`;
  }, [title]);
}

// Page wrapper component
interface PageProps {
  title: string;
  children: React.ReactNode;
}

function Page({ title, children }: PageProps) {
  useDocumentTitle(title);
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* Default route */}
          <Route
            path="/"
            element={
              <Page title="Login">
                <Login />
              </Page>
            }
          />

          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <Page title="Login">
                <Login />
              </Page>
            }
          />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <Page title="Student Dashboard">
                <StudentDashboard />
              </Page>
            }
          />

          {/* NEW: Attendance Page */}
          <Route
            path="/student/attendance"
            element={
              <Page title="Mark Attendance">
                <Attendance />
              </Page>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <Page title="Admin Dashboard">
                <AdminDashboard />
              </Page>
            }
          />

          {/* Admin Only Route */}
          <Route
            path="/admin/register-student"
            element={
              <Page title="Register Student">
                <Register />
              </Page>
            }
          />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;

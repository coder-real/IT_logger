## Project Code Compilation

## App.tsx
---
> Path: App.tsx

```tsx
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

```

## images.d.ts
---
> Path: images.d.ts

```typescript
// src/types/images.d.ts
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.webp" {
  const value: string;
  export default value;
}

```

## main.jsx
---
> Path: main.jsx

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

```

## types.ts
---
> Path: types.ts

```typescript
export enum UserRole {
  STUDENT = "STUDENT",
  SIWES_COORDINATOR = "SIWES_COORDINATOR",
  IT_SUPERVISOR = "IT_SUPERVISOR",
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LogEntry {
  id: string;
  studentId: string;
  date: string;
  activities: string;
  submittedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

```

## AlertModal.tsx
---
> Path: components\AlertModal.tsx

```tsx
// src/components/AlertModal.tsx
import React from "react";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  cancelText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  confirmText = "OK",
  onConfirm,
  cancelText = "Cancel",
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "error":
        return <AlertCircle className="w-12 h-12 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      case "info":
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 animate-slideUp">
        {/* Icon Header */}
        <div
          className={`px-6 pt-8 pb-4 flex flex-col items-center ${getColors()} border-b`}
        >
          {getIcon()}
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {onConfirm && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${
              type === "error"
                ? "bg-red-500 hover:bg-red-600 text-white"
                : type === "success"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : type === "warning"
                ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

// Hook for easier usage
export const useAlert = () => {
  const [alert, setAlert] = React.useState<{
    isOpen: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlert({ isOpen: true, type, title, message, onConfirm });
  };

  const closeAlert = () => {
    setAlert({ ...alert, isOpen: false });
  };

  return { alert, showAlert, closeAlert };
};

```

## LogEntryModal.tsx
---
> Path: components\LogEntryModal.tsx

```tsx
import React, { useState } from "react";
import { X, Loader2, Info } from "lucide-react";

interface LogEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    hours: number;
    date: string;
  }) => Promise<void>;
  isSubmitting: boolean;
}

const LogEntryModal: React.FC<LogEntryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hours: 8,
    date: new Date().toISOString().split("T")[0],
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form
    setFormData({
      title: "",
      description: "",
      hours: 8,
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Header - GitHub Style */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Add new log</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6">
          <form id="log-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="block w-full rounded-md border border-gray-300 px-4 py-2.5 text-gray-900 placeholder:text-gray-500 focus:border-[#28a745] focus:ring-2 focus:ring-green-500/20 text-lg font-medium shadow-sm transition-all"
                placeholder="Add a title"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Description */}
              <div className="flex-1 min-w-0">
                <div className="relative rounded-md border border-gray-300 shadow-sm bg-white">
                  {/* Fake Tabs */}
                  <div className="border-b border-gray-200 bg-gray-50/50 px-2 pt-2 flex gap-1 rounded-t-md">
                    <div className="px-3 py-2 text-sm font-medium text-gray-900 bg-white border-t border-l border-r border-gray-200 rounded-t-md -mb-px z-10">
                      Write
                    </div>
                    <div className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-not-allowed">
                      Preview
                    </div>
                  </div>

                  {/* Textarea */}
                  <textarea
                    required
                    rows={8}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="block w-full border-0 p-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 text-sm min-h-[200px] resize-y rounded-b-md"
                    placeholder="Describe what you learned and accomplished today..."
                  />

                  {/* Footer Hint */}
                  <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/50 rounded-b-md flex justify-between items-center">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      Markdown styling is supported
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata Sidebar */}
              <div className="w-full md:w-64 space-y-6 pt-1">
                {/* Hours */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Hours Worked
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0.5"
                      max="24"
                      step="0.5"
                      required
                      value={formData.hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hours: parseFloat(e.target.value),
                        })
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28a745] focus:ring-[#28a745] text-sm py-1.5 px-3"
                    />
                    <span className="text-sm text-gray-600 font-medium">
                      hrs
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="pb-4 border-b border-gray-200">
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Log Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#28a745] focus:ring-[#28a745] text-sm py-1.5 px-3 text-gray-700"
                  />
                </div>

                <div className="text-xs text-gray-400">
                  <p>
                    Ensure logs are accurate. Submissions are reviewed by your
                    supervisor.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="log-form"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#28a745] hover:bg-[#218838] border border-transparent rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit new log
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogEntryModal;

```

## LogPreviewModal.tsx
---
> Path: components\LogPreviewModal.tsx

```tsx
// src/components/LogPreviewModal.tsx
import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface LogPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    id: string;
    activity_title: string;
    activity_description: string;
    hours_logged: number;
    date: string;
    created_at: string;
    status: string;
    students: {
      full_name: string;
      matric_no: string;
      department: string;
    };
  } | null;
  onApprove?: (logId: string) => Promise<void>;
  onReject?: (logId: string) => Promise<void>;
}

const LogPreviewModal: React.FC<LogPreviewModalProps> = ({
  isOpen,
  onClose,
  log,
  onApprove,
  onReject,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "raw">("preview");

  if (!isOpen || !log) return null;

  const handleAction = async (action: "approve" | "reject") => {
    setIsProcessing(true);
    try {
      if (action === "approve" && onApprove) {
        await onApprove(log.id);
      } else if (action === "reject" && onReject) {
        await onReject(log.id);
      }
      onClose();
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-linear-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Daily Log Entry
              </h3>
              <p className="text-xs text-gray-500">
                Review student activity submission
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metadata Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Student</div>
              <div className="text-sm font-medium text-gray-900">
                {log.students.full_name}
              </div>
              <div className="text-xs text-gray-400">
                {log.students.matric_no}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Log Date</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(log.date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <div className="text-xs text-gray-500">Hours Logged</div>
              <div className="text-sm font-medium text-gray-900">
                {log.hours_logged} hours
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                log.status === "APPROVED"
                  ? "bg-green-500"
                  : log.status === "REJECTED"
                  ? "bg-red-500"
                  : "bg-yellow-500"
              }`}
            />
            <div>
              <div className="text-xs text-gray-500">Status</div>
              <div className="text-sm font-medium text-gray-900">
                {log.status}
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {log.activity_title}
            </h2>
            <div className="text-sm text-gray-500">
              Submitted on {new Date(log.created_at).toLocaleString()}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "preview"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === "raw"
                    ? "border-green-500 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Raw Text
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none">
            {activeTab === "preview" ? (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-xl font-bold mt-5 mb-2" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-4 text-gray-700" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-6 mb-4 space-y-1"
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal pl-6 mb-4 space-y-1"
                        {...props}
                      />
                    ),
                    code: ({ node, inline, ...props }: any) =>
                      inline ? (
                        <code
                          className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600"
                          {...props}
                        />
                      ) : (
                        <code
                          className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono"
                          {...props}
                        />
                      ),
                  }}
                >
                  {log.activity_description}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="bg-gray-900 text-gray-100 rounded-xl p-6 font-mono text-sm whitespace-pre-wrap overflow-x-auto">
                {log.activity_description}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        {log.status === "PENDING" && (onApprove || onReject) && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              This log is pending your review
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAction("reject")}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Reject
              </button>
              <button
                onClick={() => handleAction("approve")}
                disabled={isProcessing}
                className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Approve
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPreviewModal;

```

## Navbar.tsx
---
> Path: components\Navbar.tsx

```tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Terminal, LogIn, LogOut, User } from "lucide-react";
import logo from "../assets/uam-logo.png";

const Navbar: React.FC = () => {
  const location = useLocation();
  const isAuthenticated =
    location.pathname.includes("dashboard") ||
    location.pathname.includes("register-student");

  // Try to retrieve user from local storage
  const savedUser = localStorage.getItem("it_logger_user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <nav className="bg-[#28a745] border-b border-[#28a745] sticky top-0 z-50 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="">
                <img src={logo} width={50} height={50} alt="" />
              </div>

              <span className="font-bold text-xl tracking-tight">
                IT Logger System
              </span>
            </Link>
          </div>

          {!isAuthenticated && (
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-green-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors hover:bg-[#28a745]/20"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2">
                <span className="text-sm font-medium text-white">
                  {user.full_name || "User"}
                </span>
                <span className="text-xs text-green-200 capitalize">
                  {user.userRole === "STUDENT" ? "Student" : "Administrator"}
                </span>
              </div>

              <div className="h-9 w-9 rounded-full bg-[#28a745] flex items-center justify-center text-white font-bold border-2 border-[#1e5c30] shadow-lg overflow-hidden relative">
                {user.photo_url ? (
                  <img
                    src={user.photo_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs">{getInitials(user.full_name)}</span>
                )}
              </div>

              <Link
                to="/login"
                onClick={() => localStorage.removeItem("it_logger_user")}
                className="ml-4 text-green-200 hover:text-white p-2 rounded-full hover:bg-[#28a745]/20 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

```

## useCurrentTime.ts
---
> Path: hooks\useCurrentTime.ts

```typescript
import { useState, useEffect } from "react";
import { getCurrentTime } from "../utils/date";

export const useCurrentTime = () => {
  const [time, setTime] = useState<string>(getCurrentTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return time;
};

```

## MainLayout.tsx
---
> Path: layouts\MainLayout.tsx

```tsx
import React from "react";
import Navbar from "../components/Navbar";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="grow">{children}</main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} IT Student Logger System. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;

```

## supabase.ts
---
> Path: lib\supabase.ts

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ntbglzejaczqccetnkti.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmdsemVqYWN6cWNjZXRua3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mzk4NzUsImV4cCI6MjA3OTAxNTg3NX0.-oVAOea2ekn1hYbx88E2xIhbF13ZI-TgQ6FTQUUYJj0";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Always return true since keys are hardcoded
export const isSupabaseConfigured = () => {
  return true;
};

```

## AdminDashboard.tsx
---
> Path: pages\AdminDashboard.tsx

```tsx
// src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Users,
  FileText,
  CalendarCheck,
  LayoutDashboard,
  Search,
  RefreshCcw,
  UserPlus,
  Trash2,
  Eye,
  CheckCircle,
} from "lucide-react";
import { UserRole } from "../types";
import { supabase } from "../lib/supabase";
import AlertModal, { useAlert } from "../components/AlertModal";
import LogPreviewModal from "../components/LogPreviewModal";
import { LogOut } from "lucide-react";

const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const userRole = (location.state as any)?.role || UserRole.SIWES_COORDINATOR;
  const isCoordinator = userRole === UserRole.SIWES_COORDINATOR;

  const [activeTab, setActiveTab] = useState<
    "overview" | "students" | "logs" | "attendance"
  >("overview");

  // Data States
  const [studentList, setStudentList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Alert and Preview
  const { alert, showAlert, closeAlert } = useAlert();
  const [previewLog, setPreviewLog] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch Data
  useEffect(() => {
    if (activeTab === "students" || activeTab === "overview") {
      fetchStudents();
    }
    if (activeTab === "logs" || activeTab === "overview") {
      fetchLogs();
    }
    if (activeTab === "attendance" || activeTab === "overview") {
      fetchAttendance();
    }
  }, [activeTab]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedStudents = data.map((s: any) => ({
          id: s.id,
          name: s.full_name,
          matric: s.matric_no,
          dept: s.department,
          status: "Active",
          email: s.email,
          phone: s.phone,
          photoUrl: s.photo_url,
        }));
        setStudentList(mappedStudents);
      }
    } catch (err: any) {
      showAlert("error", "Error", `Failed to fetch students: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null); // State for user profile

  // Function to handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Logout successful, Supabase handles redirection/session cleanup
    } catch (error) {
      console.error("Error during logout:", (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select(
          `
          *,
          students (
            full_name,
            matric_no,
            department
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLogsList(data || []);
    } catch (err: any) {
      showAlert("error", "Error", `Failed to fetch logs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          *,
          students (
            full_name,
            matric_no,
            department
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttendanceList(data || []);
    } catch (err: any) {
      showAlert("error", "Error", `Failed to fetch attendance: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    showAlert(
      "warning",
      "Confirm Deletion",
      `Are you sure you want to remove ${name}? This will delete all their logs and attendance records.`,
      async () => {
        try {
          const { error } = await supabase
            .from("students")
            .delete()
            .eq("id", id);
          if (error) throw error;

          setStudentList((prev) => prev.filter((s) => s.id !== id));
          showAlert("success", "Deleted", "Student removed successfully");
        } catch (err: any) {
          showAlert("error", "Error", `Failed to delete: ${err.message}`);
        }
      }
    );
  };

  const handleLogAction = async (
    logId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      const { error } = await supabase
        .from("daily_logs")
        .update({ status: newStatus })
        .eq("id", logId);

      if (error) throw error;

      setLogsList((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, status: newStatus } : log
        )
      );

      showAlert(
        "success",
        newStatus === "APPROVED" ? "Approved" : "Rejected",
        `Log has been ${newStatus.toLowerCase()}`
      );
    } catch (err: any) {
      showAlert("error", "Error", `Failed to update log: ${err.message}`);
      fetchLogs(); // Revert
    }
  };

  // Filters
  const filteredStudents = studentList.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.matric.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = logsList.filter(
    (log) =>
      log.activity_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAttendance = attendanceList.filter((att) =>
    att.students?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavItem = ({
    id,
    icon: Icon,
    label,
  }: {
    id: typeof activeTab;
    icon: any;
    label: string;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        activeTab === id
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${
          activeTab === id ? "text-[#28a745]" : "text-slate-400"
        }`}
      />
      {label}
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-100/50 border-r border-slate-200/60 p-6 flex flex-col gap-1 h-auto md:min-h-[calc(100vh-4rem)]">
        <div className="mb-8 px-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            {isCoordinator ? "Coordinator Portal" : "Supervisor Portal"}
          </h2>
          <div className="font-semibold text-slate-900">IT Logging System</div>
        </div>

        <NavItem id="overview" icon={LayoutDashboard} label="Dashboard" />
        <NavItem id="students" icon={Users} label="Students" />
        <NavItem id="logs" icon={FileText} label="Daily Logs" />
        <NavItem id="attendance" icon={CalendarCheck} label="Attendance" />

        {isCoordinator && (
          <div className="mt-auto pt-6">
            <Link
              to="/admin/register-student"
              className="flex items-center justify-center gap-2 w-full bg-[#28a745] hover:bg-[#218838] text-white px-4 py-3 rounded-xl font-medium transition-all shadow-lg shadow-green-900/20"
            >
              <UserPlus className="w-4 h-4" />
              Enroll Student
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight capitalize">
              {activeTab === "overview" ? "Dashboard Overview" : activeTab}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage {activeTab} data and records
            </p>
          </div>

          {(activeTab === "students" ||
            activeTab === "logs" ||
            activeTab === "attendance") && (
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search records..."
                  className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all w-64"
                />
              </div>
              <button
                onClick={() => {
                  if (activeTab === "students") fetchStudents();
                  if (activeTab === "logs") fetchLogs();
                  if (activeTab === "attendance") fetchAttendance();
                }}
                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                title="Refresh Data"
              >
                <RefreshCcw
                  className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          )}
        </header>

        {/* Content */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                {[
                  {
                    label: "Total Students",
                    val: studentList.length.toString(),
                    icon: Users,
                    color: "text-[#28a745]",
                    bg: "bg-green-50",
                  },
                  {
                    label: "Total Logs",
                    val: logsList.length.toString(),
                    icon: FileText,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    label: "Today's Attendance",
                    val: attendanceList
                      .filter(
                        (a) => a.date === new Date().toISOString().split("T")[0]
                      )
                      .length.toString(),
                    icon: CalendarCheck,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-slate-100 bg-slate-50/30 flex items-center gap-4"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">
                        {stat.val}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">
                        {stat.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-slate-50 p-8 text-center border border-dashed border-slate-200">
                <p className="text-slate-500">
                  Select a category from the sidebar to manage details.
                </p>
              </div>
            </div>
          )}

          {/* STUDENTS */}
          {activeTab === "students" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-8 py-5">Student</th>
                    <th className="px-6 py-5">Matric No</th>
                    <th className="px-6 py-5">Department</th>
                    <th className="px-6 py-5">Contact</th>
                    <th className="px-6 py-5">Status</th>
                    {isCoordinator && (
                      <th className="px-6 py-5 text-right">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCcw className="animate-spin h-5 w-5" />
                          Loading students...
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            {student.photoUrl ? (
                              <img
                                src={student.photoUrl}
                                alt={student.name}
                                className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-600 font-semibold text-sm">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">
                                {student.name}
                              </div>
                              <div className="text-xs text-slate-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                          {student.matric}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {student.dept}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {student.phone || "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Active
                          </span>
                        </td>
                        {isCoordinator && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() =>
                                handleDeleteStudent(student.id, student.name)
                              }
                              className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Remove Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* LOGS */}
          {activeTab === "logs" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-6 py-5">Student</th>
                    <th className="px-6 py-5">Activity</th>
                    <th className="px-6 py-5">Hours</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.length === 0 && !isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        No logs found.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4 text-sm text-slate-600">
                          {new Date(log.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">
                            {log.students?.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {log.students?.matric_no}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          <div className="font-medium text-slate-900 text-sm truncate">
                            {log.activity_title}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {log.activity_description?.substring(0, 50)}...
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {log.hours_logged} hrs
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              log.status === "APPROVED"
                                ? "bg-green-50 text-green-700 border-green-100"
                                : log.status === "REJECTED"
                                ? "bg-red-50 text-red-700 border-red-100"
                                : "bg-yellow-50 text-yellow-700 border-yellow-100"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setPreviewLog(log);
                              setIsPreviewOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-6 py-5">Student</th>
                    <th className="px-6 py-5">Check In Time</th>
                    <th className="px-6 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.length === 0 && !isLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.map((att) => (
                      <tr
                        key={att.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4 text-sm text-slate-600">
                          {new Date(att.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 text-sm">
                            {att.students?.full_name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {att.students?.matric_no}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">
                          {att.check_in_time}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <CheckCircle className="w-3 h-3" />
                            Present
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />

      <LogPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        log={previewLog}
        onApprove={async (id) => {
          await handleLogAction(id, "APPROVED");
          setIsPreviewOpen(false);
        }}
        onReject={async (id) => {
          await handleLogAction(id, "REJECTED");
          setIsPreviewOpen(false);
        }}
      />
    </div>
  );
};

export default AdminDashboard;

```

## Attendance.tsx
---
> Path: pages\Attendance.tsx

```tsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  Clock,
} from "lucide-react";
import { supabase } from "../lib/supabase"; // Ensure this path is correct
import { getFaceEmbedding, loadModels } from "../utils/faceRecognition"; // Ensure this path is correct

// Type definition for the student data returned from the RPC
interface StudentMatch {
  student_id: string;
  full_name: string;
  similarity: number;
}

// Supabase search RPC call (must match the SQL function created in Step 3.3)
async function findStudentByEmbedding(
  embedding: number[]
): Promise<StudentMatch | null> {
  // Call the 'find_closest_student' PostgreSQL function
  const { data, error } = await supabase.rpc("find_closest_student", {
    query_embedding: embedding,
    match_threshold: 0.85, // Adjust confidence threshold (0.0 to 1.0)
    match_limit: 1,
  });

  if (error) {
    console.error("Vector Search Error:", error);
    throw new Error(`Database search failed: ${error.message}`);
  }

  // Returns the closest student object or null if no good match
  return data?.[0] || null;
}

const Attendance: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [user, setUser] = useState<any>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraMode, setCameraMode] = useState<
    "inactive" | "active" | "processing"
  >("inactive");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // NEW STATE: To track if face-api.js models are ready
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // --- Core Logic: Authentication, Attendance Check, and Model Loading ---
  useEffect(() => {
    // 1. Authentication Check
    const currentUser = (location.state as any)?.user;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    checkTodayAttendance(currentUser.id);

    // 2. Load Face Models
    const loadFaceRecognitionModels = async () => {
      try {
        setResultMessage({
          type: "warning",
          message: "Loading face recognition models...",
        });
        await loadModels(); // Calls face-api.js model loading
        setModelsLoaded(true);
        setResultMessage(null); // Clear message once loaded
        console.log("Face models loaded successfully.");
      } catch (error) {
        console.error("Failed to load face models:", error);
        setResultMessage({
          type: "error",
          message:
            "Failed to load face recognition models. Check console for details.",
        });
      }
    };

    loadFaceRecognitionModels();

    // Cleanup function: stop camera on component unmount
    return () => {
      stopCamera();
    };
  }, [location, navigate]);

  // --- Helper Functions ---

  const checkTodayAttendance = async (studentId: string) => {
    // Implementation kept the same: Fetches today's attendance for the user
    try {
      const today = new Date();
      const todayDate = today.toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .eq("date", todayDate)
        .maybeSingle();

      if (error) throw error;

      setTodayAttendance(data || null);
    } catch (err) {
      console.error("Error checking attendance:", err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    if (!modelsLoaded) {
      setResultMessage({
        type: "warning",
        message: "Please wait for models to finish loading.",
      });
      return;
    }

    try {
      stopCamera();
      setCapturedPhoto(null);
      setResultMessage(null);

      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = media;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
      }

      setStream(media);
      setCameraMode("active");
    } catch (error) {
      console.error("Camera failed:", error);
      setResultMessage({
        type: "error",
        message: "Camera access denied. Please allow camera access.",
      });
    }
  };

  // --- New Core Recognition Logic (Vector Search) ---
  const captureAndRecognize = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    setIsProcessing(true);
    setCameraMode("processing");
    setResultMessage(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      // 1. Get Face Embedding (Local Processing using face-api.js)
      const embedding = await getFaceEmbedding(video);

      if (!embedding) {
        setResultMessage({
          type: "warning",
          message:
            "No face detected. Please position your face clearly in the camera.",
        });
        return; // Stay in active mode
      }

      // Optional: Capture photo for UI feedback
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          setCapturedPhoto(canvas.toDataURL("image/jpeg"));
        }
      }

      // 2. Vector Similarity Search (Supabase RPC)
      const studentMatch = await findStudentByEmbedding(embedding);

      if (!studentMatch) {
        setResultMessage({
          type: "error",
          message: "Face not recognized. Please ensure you are enrolled.",
        });
        return; // Stay in active mode
      }

      // Found a match, now mark attendance
      const studentId = studentMatch.student_id;
      const studentName = studentMatch.full_name;

      // Get current time in correct format
      const now = new Date();
      const todayDate = now.toISOString().split("T")[0];
      const checkInTime = now.toLocaleTimeString("en-US", { hour12: false });

      // 3. Mark Attendance (Direct Database Insert)
      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert({
          student_id: studentId,
          status: "PRESENT",
          date: todayDate,
          check_in_time: checkInTime,
        });

      if (attendanceError) {
        // Handle unique constraint violation (student already checked in today)
        if (attendanceError.code === "23505") {
          setResultMessage({
            type: "warning",
            message: `${studentName}: Attendance already marked today.`,
          });
        } else {
          throw new Error(
            `Failed to save attendance: ${attendanceError.message}`
          );
        }
      } else {
        // Success
        setResultMessage({
          type: "success",
          message: `Welcome, ${studentName}! Attendance marked successfully.`,
        });

        // Refresh attendance status and stop camera
        await checkTodayAttendance(user.id);
        stopCamera();
        setCameraMode("inactive");
      }
    } catch (error: any) {
      console.error("Recognition/Attendance Error:", error);
      setResultMessage({
        type: "error",
        message: `Failed to complete check-in: ${error.message}`,
      });
      // Set back to active mode to allow retry
      setCameraMode("active");
    } finally {
      setIsProcessing(false);
    }
  };

  const retryCapture = () => {
    setCapturedPhoto(null);
    setResultMessage(null);
    setCameraMode("inactive"); // Will prompt to start camera again
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
          Mark Attendance
        </h2>
        <p className="mt-1 text-gray-500">
          Use face recognition to check in for today
        </p>
      </div>

      {/* Today's Status Card (No change) */}
      {todayAttendance ? (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 bg-green-100 rounded-xl p-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Already Checked In Today
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Check-in time: {todayAttendance.check_in_time}
              </p>
              <p className="text-xs text-green-600 mt-2">
                You've successfully marked your attendance for today.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 bg-blue-100 rounded-xl p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900">
                Attendance Not Marked
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Please check in using face recognition below
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result Message (No change) */}
      {resultMessage && (
        <div
          className={`mb-6 rounded-2xl p-4 border ${
            resultMessage.type === "success"
              ? "bg-green-50 border-green-200"
              : resultMessage.type === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <div className="flex items-start gap-3">
            {resultMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : resultMessage.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                resultMessage.type === "success"
                  ? "text-green-700"
                  : resultMessage.type === "warning"
                  ? "text-yellow-700"
                  : "text-red-700"
              }`}
            >
              {resultMessage.message}
            </p>
          </div>
        </div>
      )}

      {/* Camera Section */}
      <div className="bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 rounded-2xl overflow-hidden">
        <div className="p-8 flex flex-col items-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Face Recognition Check-In
          </h3>

          {/* Camera View */}
          <div className="relative w-full max-w-xl aspect-video rounded-2xl bg-slate-900 shadow-lg overflow-hidden mb-6">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className={`w-full h-full object-cover ${
                cameraMode === "active" ? "opacity-100" : "opacity-0"
              }`}
            />

            {capturedPhoto && (
              <img
                src={capturedPhoto}
                alt="Captured"
                className="w-full h-full object-cover absolute inset-0"
              />
            )}

            <canvas ref={canvasRef} className="hidden" />

            {cameraMode === "inactive" && !capturedPhoto && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Camera className="w-20 h-20 mb-4" />
                <p className="text-sm">Camera Ready</p>
              </div>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                <Loader2 className="w-12 h-12 animate-spin mb-3" />
                <p className="text-sm">Recognizing face...</p>
              </div>
            )}
          </div>

          {/* Camera Controls */}
          <div className="w-full max-w-xl space-y-3">
            {cameraMode === "inactive" && !todayAttendance && (
              <button
                type="button"
                onClick={startCamera}
                disabled={!modelsLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#28a745] hover:bg-[#218838] text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50"
              >
                {modelsLoaded ? (
                  <>
                    <Camera className="w-5 h-5" />
                    Start Camera
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading Models...
                  </>
                )}
              </button>
            )}

            {cameraMode === "active" && (
              <button
                type="button"
                onClick={captureAndRecognize}
                disabled={isProcessing || !modelsLoaded}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture & Check In
                  </>
                )}
              </button>
            )}

            {/* Retry button logic remains the same */}
            {resultMessage && resultMessage.type !== "success" && (
              <button
                type="button"
                onClick={retryCapture}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-all"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </button>
            )}
          </div>

          {/* Instructions (No change) */}
          <div className="mt-8 w-full max-w-xl bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <strong className="font-semibold">Check-in Tips:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Face the camera directly</li>
                  <li>Ensure good lighting</li>
                  <li>Remove glasses or hats if possible</li>
                  <li>Keep a neutral expression</li>
                  <li>Stay still during recognition</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

```

## Home.tsx
---
> Path: pages\Home.tsx

```tsx
import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ShieldCheck, Clock } from "lucide-react";

const Home: React.FC = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto pt-20 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-8">
          Streamline Your <span className="text-indigo-600">IT Internship</span>{" "}
          Journey
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 mb-10">
          The ultimate platform for IT students to log daily activities, track
          attendance via biometric data, and manage submissions effortlessly.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/login"
            className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 shadow-lg"
          >
            Get Started
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 shadow-sm"
          >
            Register Now
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Daily Logs
              </h3>
              <p className="text-gray-500">
                Record your daily tasks and learnings with our intuitive editor
                before the 11:59 PM deadline.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Secure Attendance
              </h3>
              <p className="text-gray-500">
                Verified attendance tracking using ESP32-CAM and fingerprint
                technology for absolute accuracy.
              </p>
            </div>
            <div className="text-center p-6 rounded-xl bg-gray-50">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Real-time Tracking
              </h3>
              <p className="text-gray-500">
                Students and Admins can view accumulated hours and submission
                status in real-time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

```

## Login.tsx
---
> Path: pages\Login.tsx

```tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { UserRole } from "../types";
import { supabase } from "../lib/supabase";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);

  // Clear previous session on mount
  useEffect(() => {
    localStorage.removeItem("it_logger_user");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (role === UserRole.STUDENT) {
        // Real Supabase Authentication for Students
        const { data, error } = await supabase
          .from("students")
          .select("*")
          .eq("email", email)
          .single();

        if (error || !data) {
          throw new Error("Student not found. Please check your email.");
        }

        // Check if password matches Matric Number (Case insensitive)
        if (
          data.matric_no.trim().toUpperCase() !== password.trim().toUpperCase()
        ) {
          throw new Error(
            "Invalid credentials. Use your Matric Number as password."
          );
        }

        // Login Success
        const userObj = { ...data, userRole: "STUDENT" };
        localStorage.setItem("it_logger_user", JSON.stringify(userObj));
        navigate("/student/dashboard", { state: { user: data } });
      } else {
        // Admin Login
        let adminUser = null;
        if (role === UserRole.SIWES_COORDINATOR) {
          if (email === "coordinator@JOSTUM.edu" && password === "admin123") {
            adminUser = {
              role: UserRole.SIWES_COORDINATOR,
              full_name: "SIWES Coordinator",
              userRole: "ADMIN",
            };
            localStorage.setItem("it_logger_user", JSON.stringify(adminUser));
            navigate("/admin/dashboard", {
              state: { role: UserRole.SIWES_COORDINATOR },
            });
          } else {
            throw new Error("Invalid Coordinator credentials");
          }
        } else if (role === UserRole.IT_SUPERVISOR) {
          if (
            email === "supervisor@SOLARPLANT.com" &&
            password === "securepass"
          ) {
            adminUser = {
              role: UserRole.IT_SUPERVISOR,
              full_name: "IT Supervisor",
              userRole: "ADMIN",
            };
            localStorage.setItem("it_logger_user", JSON.stringify(adminUser));
            navigate("/admin/dashboard", {
              state: { role: UserRole.IT_SUPERVISOR },
            });
          } else {
            throw new Error("Invalid Supervisor credentials");
          }
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMsg(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setEmail("");
    setPassword("");
    setErrorMsg(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50/50 backdrop-blur-sm">
      <div className="w-full max-w-md">
        {/* Apple-style Card */}
        <div className="bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 rounded-3xl p-8 sm:p-10">
          <div className="text-center mb-10">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1b4d2e] shadow-lg mb-6">
              <ShieldCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome Back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {role === UserRole.STUDENT
                ? "Sign in with your Email and Matric Number"
                : "Sign in to the administrative portal"}
            </p>
          </div>

          {/* Role Toggles */}
          <div className="bg-slate-100/80 p-1.5 rounded-xl flex mb-8 relative">
            <button
              type="button"
              onClick={() => switchRole(UserRole.STUDENT)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-200 ${
                role === UserRole.STUDENT
                  ? "bg-white text-[#28a745] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => switchRole(UserRole.SIWES_COORDINATOR)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-200 ${
                role === UserRole.SIWES_COORDINATOR
                  ? "bg-white text-[#28a745] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Coordinator
            </button>
            <button
              type="button"
              onClick={() => switchRole(UserRole.IT_SUPERVISOR)}
              className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all duration-200 ${
                role === UserRole.IT_SUPERVISOR
                  ? "bg-white text-[#28a745] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Supervisor
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#28a745]">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all text-sm"
                    placeholder={
                      role === UserRole.STUDENT
                        ? "student@uni.edu"
                        : "admin@uni.edu"
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                  {role === UserRole.STUDENT ? "Matric Number" : "Password"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#28a745]">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3.5 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all text-sm"
                    placeholder={
                      role === UserRole.STUDENT
                        ? "e.g. CS/2024/001"
                        : "••••••••"
                    }
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-[#28a745] px-4 py-4 text-sm font-semibold text-white hover:bg-[#218838] hover:shadow-lg hover:shadow-green-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-8"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
              {!isLoading && (
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-8">
          Protected by University IT Security • v1.0.3
        </p>
      </div>
    </div>
  );
};

export default Login;

```

## Register.tsx
---
> Path: pages\Register.tsx

```tsx
// src/pages/Register.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Building2,
  ArrowLeft,
  Loader2,
  CreditCard,
  Phone,
  CheckCircle,
  AlertCircle,
  Camera,
  RotateCcw,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import AlertModal, { useAlert } from "../components/AlertModal";
import { getFaceEmbedding, loadModels } from "../utils/faceRecognition";

// Prevent autoplay block on Chrome
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia;

const Register: React.FC = () => {
  // Prevent React from re-rendering video DOM and killing the stream
  const [cameraReady, setCameraReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false); // Track model loading status

  const navigate = useNavigate();
  const { alert, showAlert, closeAlert } = useAlert();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<
    "idle" | "uploading_photo" | "saving_db" | "complete"
  >("idle");

  const [cameraMode, setCameraMode] = useState<
    "inactive" | "active" | "captured"
  >("inactive");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedEmbedding, setCapturedEmbedding] = useState<number[] | null>(
    null
  ); // Store embedding

  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    department: "Computer Science",
    phone: "",
    email: "",
  });

  // ======== INIT: LOAD MODELS & CLEANUP ========
  useEffect(() => {
    // Load face-api models on mount
    const initModels = async () => {
      try {
        await loadModels();
        setModelsLoaded(true);
        console.log("Face models loaded for enrollment.");
      } catch (error) {
        console.error("Failed to load models:", error);
        showAlert(
          "error",
          "System Error",
          "Face recognition models failed to load. Please refresh."
        );
      }
    };
    initModels();

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ======== START CAMERA ========
  const startCamera = async () => {
    if (!modelsLoaded) {
      showAlert("warning", "Please Wait", "Face models are still loading...");
      return;
    }

    try {
      stopCamera(); // cleanup old streams
      setCapturedPhoto(null);
      setPhotoBlob(null);
      setCapturedEmbedding(null);

      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = media;

        // Wait until video stream actually loads
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true);
        };
      }

      setStream(media);
      setCameraMode("active");
    } catch (error) {
      console.error("Camera failed:", error);
      showAlert("error", "Camera Access Denied", "Please allow webcam access.");
    }
  };

  // ======== CAPTURE PHOTO & GENERATE EMBEDDING ========
  const capturePhoto = async () => {
    // Webcam capture
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Draw video frame to canvas
    ctx.drawImage(video, 0, 0);

    // 2. Generate Face Embedding from the video element directly (better accuracy)
    try {
      // Show loading state if needed, or rely on fast processing
      const embedding = await getFaceEmbedding(video);

      if (!embedding) {
        showAlert(
          "warning",
          "No Face Detected",
          "Could not detect a face. Please try again."
        );
        return;
      }

      console.log("Face embedding generated successfully.");
      setCapturedEmbedding(embedding);

      // 3. Create Blob for storage
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          setPhotoBlob(blob);
          setCapturedPhoto(canvas.toDataURL("image/jpeg"));
          setCameraMode("captured");
          stopCamera();
        },
        "image/jpeg",
        0.95
      );
    } catch (error) {
      console.error("Embedding generation failed:", error);
      showAlert("error", "Processing Error", "Failed to process face data.");
    }
  };

  // ======== RETAKE ========
  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setCapturedEmbedding(null);
    stopCamera();
    setCameraMode("inactive");
  };

  // ======== UPLOAD TO SUPABASE STORAGE ========
  const uploadPhoto = async (blob: Blob): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.jpg`;

      const { error } = await supabase.storage
        .from("student-photos")
        .upload(fileName, blob);

      if (error) {
        console.error(error);
        return null;
      }

      const { data } = supabase.storage
        .from("student-photos")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  // ======== SUBMIT ========
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photoBlob || !capturedEmbedding) {
      showAlert(
        "warning",
        "Photo Required",
        "Please capture a valid photo with a face first."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload Photo
      setEnrollmentStep("uploading_photo");
      const photoUrl = await uploadPhoto(photoBlob);
      if (!photoUrl) throw new Error("Photo upload failed");

      // Step 2: Create Student Record
      setEnrollmentStep("saving_db");

      const { data: student, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            full_name: formData.fullName,
            matric_no: formData.matricNumber,
            department: formData.department,
            email: formData.email,
            phone: formData.phone || null,
            role: "STUDENT",
            photo_url: photoUrl,
          },
        ])
        .select()
        .single();

      if (studentError) throw studentError;

      // Step 3: Save Face Embedding
      // Note: We upsert into 'face_embeddings' linked to the new student_id
      const { error: embeddingError } = await supabase
        .from("face_embeddings")
        .insert({
          student_id: student.id,
          embedding: capturedEmbedding, // Vector data
        });

      if (embeddingError)
        throw new Error(
          "Failed to save biometric data: " + embeddingError.message
        );

      setEnrollmentStep("complete");
      showAlert(
        "success",
        "Enrollment Complete",
        "Student has been successfully enrolled."
      );

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1600);
    } catch (err: any) {
      console.error("Enrollment error:", err);
      showAlert("error", "Enrollment Failed", err.message);
      setEnrollmentStep("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepMessage = () => {
    switch (enrollmentStep) {
      case "uploading_photo":
        return "Uploading photo to storage...";
      case "saving_db":
        return "Saving student record & biometrics...";
      case "complete":
        return "Done!";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Enroll New Student
            </h2>
            <p className="mt-2 text-slate-500">
              Add a new intern to the attendance system
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/dashboard")}
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </button>
        </div>

        {/* Progress Indicator */}
        {isSubmitting && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900">
                  {getStepMessage()}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Please wait, this may take a few moments...
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 rounded-3xl overflow-hidden">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-3"
          >
            {/* Left: Camera Capture */}
            <div className="p-8 lg:p-10 bg-slate-50/80 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col items-center text-center space-y-6">
              <div className="w-full">
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Capture Photo *
                </h3>

                {/* Camera Mode Toggle */}
                <div className="flex gap-2 items-center justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraMode("inactive"); // Reset
                      // We only support webcam for this direct enrollment flow now
                    }}
                    disabled={true} // Fixed to Webcam for now as per plan
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-green-600 text-white shadow-sm cursor-default`}
                  >
                    💻 Webcam Enrollment
                  </button>
                </div>

                {/* Camera View */}
                <div className="relative mx-auto w-64 h-64 rounded-2xl bg-slate-900 shadow-lg overflow-hidden mb-4">
                  {/* Webcam Box */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300 
      ${cameraMode === "active" && cameraReady ? "opacity-100" : "opacity-0"}
    `}
                  />

                  {/* Captured image */}
                  {cameraMode === "captured" && capturedPhoto ? (
                    <img
                      src={capturedPhoto}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  ) : null}

                  {/* Hidden canvas */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Overlay when inactive */}
                  {cameraMode === "inactive" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-16 h-16 mb-3" />
                      <p className="text-sm">
                        {modelsLoaded ? "Camera Ready" : "Loading Models..."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Camera Controls */}
                <div className="space-y-2">
                  {cameraMode === "inactive" && (
                    <button
                      type="button"
                      onClick={startCamera}
                      disabled={isSubmitting || !modelsLoaded}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {modelsLoaded ? (
                        <>
                          <Camera className="w-4 h-4" />
                          Start Camera
                        </>
                      ) : (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading Models...
                        </>
                      )}
                    </button>
                  )}

                  {cameraMode === "active" && (
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                      Capture Photo
                    </button>
                  )}

                  {cameraMode === "captured" && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={retakePhoto}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-500 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Retake Photo
                      </button>
                      <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        Face captured successfully
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700">
                      <strong>Photo Tips:</strong>
                      <ul className="mt-1 space-y-0.5 list-disc list-inside">
                        <li>Face the camera directly</li>
                        <li>Remove glasses/hats</li>
                        <li>Ensure good lighting</li>
                        <li>Keep a neutral expression</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Steps */}
              {enrollmentStep !== "idle" && (
                <div className="w-full pt-6 border-t border-slate-200">
                  <div className="space-y-2">
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        enrollmentStep === "uploading_photo"
                          ? "text-blue-600"
                          : "text-green-600"
                      }`}
                    >
                      {enrollmentStep === "uploading_photo" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Upload Photo
                    </div>
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        enrollmentStep === "saving_db"
                          ? "text-blue-600"
                          : enrollmentStep === "complete"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      {enrollmentStep === "saving_db" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : enrollmentStep === "complete" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                      Save Record & Biometrics
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Form Inputs (Unchanged structure) */}
            <div className="lg:col-span-2 p-8 lg:p-10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3 text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all disabled:opacity-50"
                      placeholder="Student's Legal Name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                    Matric Number *
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="matricNumber"
                      required
                      value={formData.matricNumber}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3 text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all disabled:opacity-50"
                      placeholder="CS/2024/001"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                    Department *
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3 text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all appearance-none disabled:opacity-50"
                    >
                      <option>Computer Science</option>
                      <option>Cyber Security</option>
                      <option>Software Engineering</option>
                      <option>Information Technology</option>
                      <option>Data Science</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3 text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all disabled:opacity-50"
                      placeholder="student@university.edu"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 pl-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="block w-full rounded-2xl border-slate-200 bg-slate-50/50 pl-11 py-3 text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-[#28a745] transition-all disabled:opacity-50"
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-4">
                <button
                  type="submit"
                  disabled={
                    isSubmitting || !capturedPhoto || !capturedEmbedding
                  }
                  className="px-8 py-3.5 bg-[#28a745] text-white rounded-xl font-semibold shadow-lg shadow-green-900/20 hover:bg-[#218838] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
                  {isSubmitting ? "Enrolling..." : "Complete Enrollment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={alert.isOpen}
        onClose={closeAlert}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        onConfirm={alert.onConfirm}
      />
    </div>
  );
};

export default Register;

```

## StudentDashboard.tsx
---
> Path: pages\StudentDashboard.tsx

```tsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { formatDate } from "../utils/date";
import {
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  ScanFace,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import LogEntryModal from "../components/LogEntryModal";

const StudentDashboard: React.FC = () => {
  const currentTime = useCurrentTime();
  const today = new Date();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [stats, setStats] = useState({
    totalHours: 0,
    approved: 0,
    pending: 0,
  });
  const [todayAttendance, setTodayAttendance] = useState<any>(null);

  // 1. Check Authentication & Fetch Logs
  useEffect(() => {
    const currentUser = (location.state as any)?.user;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    fetchLogs(currentUser.id);
    checkTodayAttendance(currentUser.id);
  }, [location, navigate]);

  const checkTodayAttendance = async (studentId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .eq("date", today)
        .single();

      if (data && !error) {
        setTodayAttendance(data);
      }
    } catch (err) {
      console.error("Error checking attendance:", err);
    }
  };

  const fetchLogs = async (studentId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setLogs(data);
        const approved = data.filter((l) => l.status === "APPROVED").length;
        const pending = data.filter((l) => l.status === "PENDING").length;
        const hours = data.reduce(
          (acc, curr) => acc + (curr.hours_logged || 0),
          0
        );

        setStats({
          totalHours: hours,
          approved,
          pending,
        });
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLog = async (logData: {
    title: string;
    description: string;
    hours: number;
    date: string;
  }) => {
    setIsSubmittingLog(true);
    try {
      const { error } = await supabase.from("daily_logs").insert([
        {
          student_id: user.id,
          date: new Date(logData.date).toISOString(),
          hours_logged: logData.hours,
          activity_title: logData.title,
          activity_description: logData.description,
          status: "PENDING",
        },
      ]);

      if (error) throw error;

      await fetchLogs(user.id);
      setIsModalOpen(false);
    } catch (err: any) {
      alert("Failed to create log: " + err.message);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Student Dashboard
          </h2>
          <p className="mt-1 text-gray-500">
            Welcome back,{" "}
            <span className="font-semibold text-slate-700">
              {user.full_name}
            </span>{" "}
            ({user.matric_no})
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">{formatDate(today)}</span>
            <span className="text-2xl font-mono font-bold text-[#28a745]">
              {currentTime}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Attendance Check-in Card */}
      {!todayAttendance && (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 bg-blue-100 rounded-xl p-3">
                <ScanFace className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Mark Today's Attendance
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  You haven't checked in yet. Use face recognition to mark your
                  attendance.
                </p>
              </div>
            </div>
            <Link
              to="/student/attendance"
              state={{ user }}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-md"
            >
              Check In Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="shrink-0 bg-blue-50 rounded-xl p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Hours Logged
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.totalHours}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="shrink-0 bg-green-50 rounded-xl p-3">
              <CheckCircle className="h-6 w-6 text-[#28a745]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Approved Logs
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.approved}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-50 rounded-xl p-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pending Logs
                </dt>
                <dd className="text-2xl font-semibold text-gray-900">
                  {stats.pending}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-50 rounded-xl p-3">
              <FileText className="h-6 w-6 text-[#28a745]" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Attendance Status
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {todayAttendance ? "Checked In" : "Not Marked"}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 rounded-2xl overflow-hidden mb-8">
        <div className="px-6 py-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold leading-6 text-gray-900">
              Today's Submission
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>
                Submissions close automatically at midnight. Ensure your daily
                activities are recorded.
              </p>
            </div>
          </div>
          <div className="mt-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#28a745] px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#218838] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create Log Entry
            </button>
          </div>
        </div>
      </div>

      {/* Recent Logs List */}
      <div className="bg-white shadow-[0_2px_10px_rgb(0,0,0,0.03)] border border-gray-100 rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-semibold text-gray-900">
            Recent History
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5" /> Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No logs found. Start by creating your first entry!
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {logs.map((log) => (
              <li
                key={log.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-[#28a745] truncate">
                      {log.activity_title || "Daily Log"}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5 line-clamp-1">
                      {log.activity_description}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                      <span>
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{log.hours_logged || 0} hrs</span>
                    </p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        log.status === "APPROVED"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : log.status === "REJECTED"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      <LogEntryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLog}
        isSubmitting={isSubmittingLog}
      />
    </div>
  );
};

export default StudentDashboard;

```

## date.ts
---
> Path: utils\date.ts

```typescript
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

export const getCurrentTime = (): string => {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

```

## faceRecognition.ts
---
> Path: utils\faceRecognition.ts

```typescript
// src/utils/faceRecognition.ts
import * as faceapi from '@vladmandic/face-api';

// Configuration
const MODEL_URL = '/models';

let modelsLoadedFlag = false;

/**
 * Initialize and load face-api models
 * Uses @vladmandic/face-api modern API
 */
export const loadModels = async (): Promise<void> => {
  if (modelsLoadedFlag) {
    console.log('Models already loaded');
    return;
  }

  try {
    console.log('Initializing @vladmandic/face-api environment...');

    // Load all required models
    // Backend initialization happens automatically in @vladmandic/face-api
    console.log('Loading Face API models...');

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoadedFlag = true;
    console.log('✅ @vladmandic/face-api models loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
    modelsLoadedFlag = false;
    throw new Error('Failed to load face recognition models');
  }
};

/**
 * Get face embedding (descriptor) from video/image/canvas element
 * Returns a 128-dimensional vector representing the face
 */
export const getFaceEmbedding = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<number[] | null> => {
  try {
    if (!modelsLoadedFlag) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }

    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log('No face detected in input');
      return null;
    }

    // Get the descriptor (embedding)
    const descriptor = detection.descriptor;
    
    if (!descriptor || descriptor.length !== 128) {
      console.error('Invalid descriptor length:', descriptor?.length);
      return null;
    }

    // Convert Float32Array to regular number array for database storage
    const embedding = Array.from(descriptor);
    console.log(`✅ Face embedding generated: ${embedding.length} dimensions`);
    
    return embedding;
    
  } catch (error) {
    console.error('❌ Error generating face embedding:', error);
    return null;
  }
};

/**
 * Detect all faces in an image (useful for multi-face scenarios)
 * Returns array of face detections with landmarks and descriptors
 */
export const detectAllFaces = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
) => {
  try {
    if (!modelsLoadedFlag) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }

    const detections = await faceapi
      .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.5 
      }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
    
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
};

/**
 * Compare two face embeddings and return similarity score (0-100)
 * Uses Euclidean distance calculation
 */
export const compareFaceEmbeddings = (
  embedding1: number[],
  embedding2: number[]
): number => {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error(`Invalid embedding dimensions: ${embedding1.length}, ${embedding2.length}`);
  }

  // Calculate Euclidean distance
  let sumSquaredDiff = 0;
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i];
    sumSquaredDiff += diff * diff;
  }
  
  const distance = Math.sqrt(sumSquaredDiff);
  
  // Convert distance to similarity percentage
  // Face-api.js typical matching threshold is 0.6
  // Distance of 0 = 100% similar
  // Distance of 0.6 = 0% similar (threshold)
  const threshold = 0.6;
  const similarity = Math.max(0, 100 * (1 - distance / threshold));
  
  return Math.min(100, similarity);
};

/**
 * Alternative comparison using face-api's built-in distance calculation
 */
export const compareFaceEmbeddingsAdvanced = (
  embedding1: number[],
  embedding2: number[]
): { distance: number; similarity: number; isMatch: boolean } => {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error(`Invalid embedding dimensions: ${embedding1.length}, ${embedding2.length}`);
  }

  // Calculate Euclidean distance manually
  let sumSquaredDiff = 0;
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i];
    sumSquaredDiff += diff * diff;
  }
  const distance = Math.sqrt(sumSquaredDiff);
  
  // Standard threshold for face matching (lower = more similar)
  const threshold = 0.6;
  const isMatch = distance < threshold;
  
  // Convert to similarity percentage
  const similarity = Math.max(0, 100 * (1 - distance / threshold));
  
  return {
    distance,
    similarity: Math.min(100, similarity),
    isMatch
  };
};

/**
 * Draw face detection boxes on canvas (useful for debugging)
 */
export const drawDetections = (
  canvas: HTMLCanvasElement,
  detections: any[]
): void => {
  const displaySize = { width: canvas.width, height: canvas.height };
  faceapi.matchDimensions(canvas, displaySize);
  
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  // Draw detection boxes
  if (resizedDetections && resizedDetections.length > 0) {
    resizedDetections.forEach((detection: any) => {
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { 
        label: `${Math.round(detection.detection.score * 100)}%` 
      });
      drawBox.draw(canvas);
    });
  }
};

/**
 * Get optimal input dimensions for face detection
 */
export const getOptimalDimensions = (
  videoWidth: number,
  videoHeight: number
): { width: number; height: number } => {
  // Optimal dimensions for face detection (balance between speed and accuracy)
  const maxDimension = 640;
  
  const aspectRatio = videoWidth / videoHeight;
  
  if (videoWidth > videoHeight) {
    return {
      width: Math.min(maxDimension, videoWidth),
      height: Math.min(maxDimension / aspectRatio, videoHeight)
    };
  } else {
    return {
      width: Math.min(maxDimension * aspectRatio, videoWidth),
      height: Math.min(maxDimension, videoHeight)
    };
  }
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => {
  return modelsLoadedFlag;
};

/**
 * Warm up the model (run dummy prediction to initialize GPU)
 */
export const warmupModel = async (): Promise<void> => {
  try {
    console.log('Warming up face detection model...');
    
    // Create a small dummy canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill with gray (simulating a face-like input)
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);
      
      // Run a dummy detection
      await faceapi.detectSingleFace(
        canvas, 
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      );
      
      console.log('✅ Model warmup complete');
    }
  } catch (error) {
    console.warn('Model warmup failed (non-critical):', error);
  }
};

/**
 * Extract face embedding from an image blob/file
 * Useful for processing uploaded images
 */
export const getFaceEmbeddingFromFile = async (
  file: File | Blob
): Promise<number[] | null> => {
  try {
    // Create image element from file
    const img = await faceapi.bufferToImage(file);
    
    // Get embedding from image
    return await getFaceEmbedding(img);
  } catch (error) {
    console.error('Error processing image file:', error);
    return null;
  }
};
```


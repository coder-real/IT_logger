========================================
Face++ Configuration
Generated: 12/02/2025 08:09:25
========================================

API_KEY=xGhIJ0cABz-hh3okt1N0vGjUItdwnvLk
API_SECRET=KFzkTcIwKGdtO8NgzhNkaeDOVZURsA56
FACESET_TOKEN=f7a4a95bbc987c37964d09ec81e725b5
OUTER_ID=jostum_students_2024

========================================
Use these values in:

1. Supabase Edge Function secrets
2. React web app
3. # ESP32-CAM firmware

// src/utils/faceRecognition.ts
import \* as faceapi from 'face-api.js';

// Configuration
const MODEL_URL = '/models';

// Helper to load models
export const loadModels = async () => {
try {
console.log('Setting Face API backend and loading models...');

    // Set backend first. This starts the WebGL initialization process.
    // We rely on the model loading Promise to ensure it completes.
    faceapi.tf.setBackend('webgl');

    // The Promise.all below will block execution until ALL model files
    // are successfully downloaded AND loaded into memory. This serves
    // as the "ready" gate that prevents the runtime crash.
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    console.log('Face API models loaded successfully.');

} catch (error) {
console.error('Error loading models:', error);
throw new Error('Failed to load face recognition models');
}
};

// Helper to get face embedding from video/image
export const getFaceEmbedding = async (
input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<number[] | null> => {
try {
// Detect single face with landmarks and descriptor
const detection = await faceapi
.detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
.withFaceLandmarks()
.withFaceDescriptor();

    if (!detection) {
      return null;
    }

    // Convert Float32Array to normal number array for Supabase (128-dimensional vector)
    return Array.from(detection.descriptor);

} catch (error) {
console.error('Error generating embedding:', error);
return null;
}
};

dashboard

import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import {
Users,
FileText,
CalendarCheck,
LayoutDashboard,
Search,
Filter,
MoreHorizontal,
UserPlus,
CheckCircle,
XCircle,
Clock,
Trash2,
RefreshCcw,
MapPin,
Cpu,
ScanFace,
} from "lucide-react";
import { UserRole } from "../types";
import { supabase } from "../lib/supabase";
import { formatDate } from "../utils/date";

const AdminDashboard: React.FC = () => {
const location = useLocation();
const userRole = (location.state as any)?.role || UserRole.SIWES_COORDINATOR;
const isCoordinator = userRole === UserRole.SIWES_COORDINATOR;

const [activeTab, setActiveTab] = useState<
"overview" | "students" | "logs" | "attendance"

> ("overview");

// Data States
const [studentList, setStudentList] = useState<any[]>([]);
const [logsList, setLogsList] = useState<any[]>([]);
const [attendanceList, setAttendanceList] = useState<any[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [searchQuery, setSearchQuery] = useState("");

// --- EFFECT: Fetch Data based on Tab ---
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

// --- API CALLS ---
const fetchStudents = async () => {
setIsLoading(true);
try {
const { data, error } = await supabase
.from("students")
.select("\*")
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
          faceId: s.face_id,
        }));
        setStudentList(mappedStudents);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setIsLoading(false);
    }

};

const fetchLogs = async () => {
setIsLoading(true);
try {
const { data, error } = await supabase
.from("daily_logs")
.select(
`    *,
                students (
                    full_name,
                    matric_no
                )`
)
.order("created_at", { ascending: false });

      if (error) throw error;
      setLogsList(data || []);
    } catch (err) {
      console.error("Error fetching logs:", err);
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
`    *,
                students (
                    full_name,
                    matric_no,
                    department
                )`
)
.order("created_at", { ascending: false });

      if (error) throw error;
      setAttendanceList(data || []);
    } catch (err) {
      console.error("Error fetching attendance", err);
    } finally {
      setIsLoading(false);
    }

};

const handleDeleteStudent = async (id: string) => {
if (
!window.confirm(
"Are you sure you want to remove this student? This will also delete their logs."
)
)
return;

    // Optimistic update
    setStudentList((prev) => prev.filter((s) => s.id !== id));

    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      alert("Failed to delete from database");
      fetchStudents(); // Revert
    }

};

const handleAssignFaceId = async (
studentId: string,
currentId: number | null
) => {
const input = window.prompt(
"Enter ESP32 Face ID (0-100):\n(Check the OLED screen on the device after enrolling)",
currentId?.toString() || ""
);
if (input === null) return; // Cancelled

    if (input.trim() === "") {
      // Clear ID
      setStudentList((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, faceId: null } : s))
      );
      await supabase
        .from("students")
        .update({ face_id: null })
        .eq("id", studentId);
      return;
    }

    const newFaceId = parseInt(input);
    if (isNaN(newFaceId)) {
      alert("Please enter a valid number.");
      return;
    }

    // Optimistic update
    setStudentList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, faceId: newFaceId } : s))
    );

    const { error } = await supabase
      .from("students")
      .update({ face_id: newFaceId })
      .eq("id", studentId);

    if (error) {
      alert(
        "Error linking Face ID (ID might be taken by another student): " +
          error.message
      );
      fetchStudents(); // Revert
    }

};

const handleLogAction = async (
logId: string,
newStatus: "APPROVED" | "REJECTED"
) => {
// Optimistic update
setLogsList((prev) =>
prev.map((log) =>
log.id === logId ? { ...log, status: newStatus } : log
)
);

    const { error } = await supabase
      .from("daily_logs")
      .update({ status: newStatus })
      .eq("id", logId);

    if (error) {
      alert("Failed to update log status");
      fetchLogs(); // Revert
    }

};

// --- FILTERS ---
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

// --- UI HELPERS ---
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
      }`} >
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
{/_ Sidebar _/}
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

      {/* Main Content Area */}
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

        {/* Content Container */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
          {/* VIEW: OVERVIEW */}
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

          {/* VIEW: STUDENTS */}
          {activeTab === "students" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-8 py-5">Name</th>
                    <th className="px-6 py-5">Matric No</th>
                    <th className="px-6 py-5">Department</th>
                    <th className="px-6 py-5">Device ID</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-right">Action</th>
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
                          <div className="font-medium text-slate-900">
                            {student.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {student.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-sm">
                          {student.matric}
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">
                          {student.dept}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              handleAssignFaceId(student.id, student.faceId)
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                              student.faceId !== null &&
                              student.faceId !== undefined
                                ? "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                            }`}
                          >
                            <ScanFace className="w-3 h-3" />
                            {student.faceId !== null &&
                            student.faceId !== undefined
                              ? `ID: ${student.faceId}`
                              : "Assign ID"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isCoordinator && (
                            <button
                              onClick={() => handleDeleteStudent(student.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Remove Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: LOGS */}
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
                  {filteredLogs.map((log) => (
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
                          {log.activity_description}
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
                        <div className="flex justify-end gap-2">
                          {log.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleLogAction(log.id, "APPROVED")
                                }
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleLogAction(log.id, "REJECTED")
                                }
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {log.status !== "PENDING" && (
                            <span className="text-xs text-slate-400 italic">
                              Reviewed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        No logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-8 py-5">Date</th>
                    <th className="px-6 py-5">Student</th>
                    <th className="px-6 py-5">Check In Time</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Verified By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAttendance.map((att) => (
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
                      <td className="px-6 py-4 text-sm text-slate-500 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-400" />
                        Biometric Device
                      </td>
                    </tr>
                  ))}
                  {filteredAttendance.length === 0 && !isLoading && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-8 py-12 text-center text-slate-500"
                      >
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>

);
};

export default AdminDashboard;

student dashboard

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentTime } from "../hooks/useCurrentTime";
import { formatDate } from "../utils/date";
import {
Clock,
FileText,
CheckCircle,
AlertCircle,
Plus,
Loader2,
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

// 1. Check Authentication & Fetch Logs
useEffect(() => {
const currentUser = (location.state as any)?.user;
if (!currentUser) {
navigate("/login");
return;
}
setUser(currentUser);
fetchLogs(currentUser.id);
}, [location, navigate]);

const fetchLogs = async (studentId: string) => {
setIsLoading(true);
try {
const { data, error } = await supabase
.from("daily_logs")
.select("\*")
.eq("student_id", studentId)
.order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        setLogs(data);
        // Calculate Stats
        const approved = data.filter((l) => l.status === "APPROVED").length;
        const pending = data.filter((l) => l.status === "PENDING").length;
        // Sum hours_logged column
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
date: new Date(logData.date).toISOString(), // Ensure correct ISO format
hours_logged: logData.hours,
activity_title: logData.title,
activity_description: logData.description,
status: "PENDING",
},
]);

      if (error) throw error;

      // Refresh logs and close modal
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
{/_ Header Section _/}
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
                  Next Due
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  Today 11:59 PM
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

log entry modal

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
{/_ Header - GitHub Style _/}
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

types.ts

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

app.tsx

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
{/_ Default route _/}
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

          {/* Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <Page title="Student Dashboard">
                <StudentDashboard />
              </Page>
            }
          />

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

supabase.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ntbglzejaczqccetnkti.supabase.co";
const supabaseKey =
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmdsemVqYWN6cWNjZXRua3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mzk4NzUsImV4cCI6MjA3OTAxNTg3NX0.-oVAOea2ekn1hYbx88E2xIhbF13ZI-TgQ6FTQUUYJj0";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Always return true since keys are hardcoded
export const isSupabaseConfigured = () => {
return true;
};

layout

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

home

import React from "react";
import { Link } from "react-router-dom";
import { ClipboardList, ShieldCheck, Clock } from "lucide-react";

const Home: React.FC = () => {
return (

<div className="relative overflow-hidden">
{/_ Hero Section _/}
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

register
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
// Prevent autoplay block on Chrome
navigator.mediaDevices.getUserMedia = navigator.mediaDevices.getUserMedia;

// Face++ Configuration
const FACEPP_API_KEY = "xGhIJ0cABz-hh3okt1N0vGjUItdwnvLk";
const FACEPP_API_SECRET = "KFzkTcIwKGdtO8NgzhNkaeDOVZURsA56";
const FACEPP_FACESET_TOKEN = "f7a4a95bbc987c37964d09ec81e725b5";

const Register: React.FC = () => {
// Prevent React from re-rendering video DOM and killing the stream
const [cameraReady, setCameraReady] = useState(false);

const navigate = useNavigate();
const { alert, showAlert, closeAlert } = useAlert();

const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

const [isSubmitting, setIsSubmitting] = useState(false);
const [enrollmentStep, setEnrollmentStep] = useState<
"idle" | "uploading_photo" | "enrolling_face" | "saving_db" | "complete"

> ("idle");

const [cameraMode, setCameraMode] = useState<
"inactive" | "active" | "captured"

> ("inactive");
> const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
> const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
> const [stream, setStream] = useState<MediaStream | null>(null);

const [captureMode, setCaptureMode] = useState<"webcam" | "esp32">("webcam");
const [esp32Ip, setEsp32Ip] = useState<string>("192.168.4.1");

const espPollingTimer = useRef<number | null>(null);
const espLastObjectUrl = useRef<string | null>(null);

const [formData, setFormData] = useState({
fullName: "",
matricNumber: "",
department: "Computer Science",
phone: "",
email: "",
});

// ======== CLEANUP ON UNMOUNT ========
useEffect(() => {
return () => {
if (videoRef.current) {
videoRef.current.srcObject = null;
}
stopCamera();
stopPollingEsp32();
};
}, []);

const stopCamera = () => {
if (stream) {
stream.getTracks().forEach((t) => t.stop());
setStream(null);
}
};

const stopPollingEsp32 = () => {
if (espPollingTimer.current) {
clearTimeout(espPollingTimer.current);
espPollingTimer.current = null;
}

    if (espLastObjectUrl.current) {
      URL.revokeObjectURL(espLastObjectUrl.current);
      espLastObjectUrl.current = null;
    }

};

const handleChange = (
e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

// ======== ESP32 POLLING LIVE PREVIEW ========
const startPollingEsp32 = () => {
stopPollingEsp32();

    const poll = async () => {
      try {
        const res = await fetch(`http://${esp32Ip}/capture`, {
          cache: "no-store",
        });

        if (!res.ok) throw new Error("Bad ESP32 response");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        if (espLastObjectUrl.current) {
          URL.revokeObjectURL(espLastObjectUrl.current);
        }
        espLastObjectUrl.current = url;

        setCapturedPhoto(url);
      } catch (err) {
        console.warn("ESP preview error:", err);
      } finally {
        espPollingTimer.current = window.setTimeout(poll, 700);
      }
    };

    poll();

};

// ======== START CAMERA (OPTIMIZED FOR SPEED) ========
const startCamera = async () => {
try {
stopCamera(); // cleanup old streams
stopPollingEsp32();
setCapturedPhoto(null);
setPhotoBlob(null);

      if (captureMode === "esp32") {
        setCameraMode("active");
        startPollingEsp32();
        return;
      }

      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          facingMode: "user",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = media;

        // Wait until video stream actually loads
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraReady(true); // Tell React the webcam is visible now
        };
      }

      setStream(media);
      setCameraMode("active");
    } catch (error) {
      console.error("Camera failed:", error);
      showAlert("error", "Camera Access Denied", "Please allow webcam access.");
    }

};

// ======== CAPTURE PHOTO ========
const capturePhoto = async () => {
if (captureMode === "esp32") {
// Freeze current ESP frame
stopPollingEsp32();

      const url = espLastObjectUrl.current;
      if (!url) {
        showAlert("warning", "No Image", "ESP32 did not provide an image.");
        return;
      }

      const blob = await fetch(url).then((r) => r.blob());
      setPhotoBlob(blob);
      setCapturedPhoto(url);
      setCameraMode("captured");
      return;
    }

    // Webcam capture
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setPhotoBlob(blob);
        setCapturedPhoto(canvas.toDataURL("image/jpeg"));
        setCameraMode("captured");
        stopCamera();
      },
      "image/jpeg",
      0.92 // Slightly lower quality for faster processing
    );
    console.log("BASE64: ", capturedPhoto);

};

// ======== RETAKE ========
const retakePhoto = () => {
setCapturedPhoto(null);
setPhotoBlob(null);
stopCamera();
stopPollingEsp32();
setCameraMode("inactive");
};

// ======== UPLOAD TO SUPABASE ========
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

// ======== FACE++ ENROLLMENT ========
const enrollFaceInFacePP = async (blob: Blob, studentId: string) => {
const base64 = await blobToBase64(blob);

    // 1. Detect
    const detectForm = new URLSearchParams();
    detectForm.append("api_key", FACEPP_API_KEY);
    detectForm.append("api_secret", FACEPP_API_SECRET);
    detectForm.append("image_base64", base64);

    const detect = await fetch(
      "https://api-us.faceplusplus.com/facepp/v3/detect",
      { method: "POST", body: detectForm }
    ).then((r) => r.json());

    if (!detect.faces || detect.faces.length === 0)
      throw new Error("No face detected");

    const faceToken = detect.faces[0].face_token;

    // 2. Add face
    const addForm = new URLSearchParams();
    addForm.append("api_key", FACEPP_API_KEY);
    addForm.append("api_secret", FACEPP_API_SECRET);
    addForm.append("faceset_token", FACEPP_FACESET_TOKEN);
    addForm.append("face_tokens", faceToken);
    addForm.append("user_id", studentId);

    const add = await fetch(
      "https://api-us.faceplusplus.com/facepp/v3/faceset/addface",
      { method: "POST", body: addForm }
    ).then((r) => r.json());

    if (add.face_added === 0)
      throw new Error(add.error_message || "Face enrollment failed");

};

const blobToBase64 = (blob: Blob): Promise<string> =>
new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => resolve((reader.result as string).split(",")[1]);
reader.onerror = reject;
reader.readAsDataURL(blob);
});

// ======== SUBMIT ========
const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

    if (!photoBlob) {
      showAlert("warning", "Photo Required", "Please capture a photo first.");
      return;
    }

    setIsSubmitting(true);

    try {
      setEnrollmentStep("uploading_photo");
      const photoUrl = await uploadPhoto(photoBlob);
      if (!photoUrl) throw new Error("Upload failed");

      setEnrollmentStep("saving_db");

      const { data: student, error } = await supabase
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

      if (error) throw error;

      setEnrollmentStep("enrolling_face");
      await enrollFaceInFacePP(photoBlob, student.id);

      setEnrollmentStep("complete");
      showAlert("success", "Enrollment Complete", "Student has been enrolled.");

      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 1600);
    } catch (err: any) {
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
return "Saving student record...";
case "enrolling_face":
return "Registering face in recognition engine...";
case "complete":
return "Done!";
default:
return "";
}
};

return (

<div className="min-h-screen bg-slate-50/50 py-12 px-4 sm:px-6 lg:px-8">
<div className="max-w-4xl mx-auto">
{/_ Header _/}
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
className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50" >
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
                      setCaptureMode("webcam");
                      if (cameraMode === "active") {
                        stopCamera();
                        stopPollingEsp32();
                        setCameraMode("inactive");
                      }
                    }}
                    disabled={isSubmitting || cameraMode === "captured"}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      captureMode === "webcam"
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:opacity-50`}
                  >
                    💻 Webcam (Test)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCaptureMode("esp32");
                      if (cameraMode === "active") {
                        stopCamera();
                        stopPollingEsp32();
                        setCameraMode("inactive");
                      }
                    }}
                    disabled={isSubmitting || cameraMode === "captured"}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      captureMode === "esp32"
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    } disabled:opacity-50`}
                  >
                    📷 ESP32-CAM
                  </button>
                </div>

                {/* ESP32 IP Input (shown only in ESP32 mode) */}
                {captureMode === "esp32" && cameraMode === "inactive" && (
                  <div className="mb-4">
                    <input
                      type="text"
                      value={esp32Ip}
                      onChange={(e) => setEsp32Ip(e.target.value)}
                      placeholder="ESP32 IP Address"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Default: 192.168.4.1
                    </p>
                  </div>
                )}

                {/* Camera View */}
                <div className="relative mx-auto w-64 h-64 rounded-2xl bg-slate-900 shadow-lg overflow-hidden mb-4">
                  {/* TRUE Webcam Box */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className={`w-full h-full object-cover transition-opacity duration-300
      ${
        captureMode === "webcam" && cameraMode === "active" && cameraReady
          ? "opacity-100"
          : "opacity-0"
      }
    `}
                  />

                  {/* ESP32 or Captured image */}
                  {(captureMode === "esp32" &&
                    cameraMode === "active" &&
                    capturedPhoto) ||
                  (cameraMode === "captured" && capturedPhoto) ? (
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
                        {captureMode === "webcam"
                          ? "Webcam Ready"
                          : "ESP32 Ready"}
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
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      Start {captureMode === "webcam" ? "Webcam" : "ESP32-CAM"}
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
                        Photo captured successfully
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
                          : enrollmentStep === "enrolling_face" ||
                            enrollmentStep === "complete"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      {enrollmentStep === "saving_db" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : enrollmentStep === "enrolling_face" ||
                        enrollmentStep === "complete" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                      Create Record
                    </div>
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        enrollmentStep === "enrolling_face"
                          ? "text-blue-600"
                          : enrollmentStep === "complete"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      {enrollmentStep === "enrolling_face" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : enrollmentStep === "complete" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                      Enroll Face
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Form Inputs */}
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
                  disabled={isSubmitting || !capturedPhoto}
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

login

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
{/_ Apple-style Card _/}
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

image.d.ts

// src/types/images.d.ts
declare module "\*.png" {
const value: string;
export default value;
}

declare module "\*.jpg" {
const value: string;
export default value;
}

declare module "\*.jpeg" {
const value: string;
export default value;
}

declare module "\*.svg" {
const value: string;
export default value;
}

declare module "\*.gif" {
const value: string;
export default value;
}

declare module "\*.webp" {
const value: string;
export default value;
}

// Attendance

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
import { supabase } from "../lib/supabase";

const Attendance: React.FC = () => {
const location = useLocation();
const navigate = useNavigate();
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

const [user, setUser] = useState<any>(null);
const [stream, setStream] = useState<MediaStream | null>(null);
const [cameraMode, setCameraMode] = useState<
"inactive" | "active" | "processing"

> ("inactive");
> const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
> const [isProcessing, setIsProcessing] = useState(false);
> const [resultMessage, setResultMessage] = useState<{

    type: "success" | "error" | "warning";
    message: string;

} | null>(null);

const [todayAttendance, setTodayAttendance] = useState<any>(null);

// Check Authentication & Today's Attendance
useEffect(() => {
const currentUser = (location.state as any)?.user;
if (!currentUser) {
navigate("/login");
return;
}
setUser(currentUser);
checkTodayAttendance(currentUser.id);

    return () => {
      stopCamera();
    };

}, [location, navigate]);

const checkTodayAttendance = async (studentId: string) => {
try {
const today = new Date().toISOString().split("T")[0];
const { data, error } = await supabase
.from("attendance")
.select("\*")
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

const stopCamera = () => {
if (stream) {
stream.getTracks().forEach((t) => t.stop());
setStream(null);
}
};

const startCamera = async () => {
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

const captureAndRecognize = async () => {
if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    setCameraMode("processing");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL("image/jpeg").split(",")[1];
      setCapturedPhoto(canvas.toDataURL("image/jpeg"));

      // Call Edge Function for Recognition
      const response = await fetch(
        "https://ntbglzejaczqccetnkti.supabase.co/functions/v1/super-responder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50YmdsemVqYWN6cWNjZXRua3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Mzk4NzUsImV4cCI6MjA3OTAxNTg3NX0.-oVAOea2ekn1hYbx88E2xIhbF13ZI-TgQ6FTQUUYJj0`,
          },
          body: JSON.stringify({
            image: base64Image,
            device_id: "web_app",
          }),
        }
      );

      const result = await response.json();

      if (result.status === "success") {
        setResultMessage({
          type: "success",
          message: `Welcome, ${result.student}! Attendance marked successfully.`,
        });
        // Refresh today's attendance
        await checkTodayAttendance(user.id);
        stopCamera();
        setCameraMode("inactive");
      } else if (result.status === "no_face") {
        setResultMessage({
          type: "warning",
          message:
            "No face detected. Please position your face clearly in the camera.",
        });
        setCameraMode("active");
      } else if (result.status === "unknown") {
        setResultMessage({
          type: "error",
          message:
            "Face not recognized. Please ensure you're registered in the system.",
        });
        setCameraMode("active");
      } else {
        setResultMessage({
          type: "error",
          message: result.message || "Recognition failed. Please try again.",
        });
        setCameraMode("active");
      }
    } catch (error: any) {
      console.error("Recognition error:", error);
      setResultMessage({
        type: "error",
        message: "Failed to process recognition. Please try again.",
      });
      setCameraMode("active");
    } finally {
      setIsProcessing(false);
    }

};

const retryCapture = () => {
setCapturedPhoto(null);
setResultMessage(null);
setCameraMode("inactive");
};

if (!user) return null;

return (

<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
{/_ Header _/}
<div className="mb-8">
<h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
Mark Attendance
</h2>
<p className="mt-1 text-gray-500">
Use face recognition to check in for today
</p>
</div>

      {/* Today's Status Card */}
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

      {/* Result Message */}
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
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#28a745] hover:bg-[#218838] text-white rounded-xl font-medium transition-all shadow-lg"
              >
                <Camera className="w-5 h-5" />
                Start Camera
              </button>
            )}

            {cameraMode === "active" && (
              <button
                type="button"
                onClick={captureAndRecognize}
                disabled={isProcessing}
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

          {/* Instructions */}
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

NEw updated App.tsx

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
{/_ Default route _/}
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

new register paeg

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

> ("idle");

const [cameraMode, setCameraMode] = useState<
"inactive" | "active" | "captured"

> ("inactive");
> const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
> const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
> const [stream, setStream] = useState<MediaStream | null>(null);
> const [capturedEmbedding, setCapturedEmbedding] = useState<number[] | null>(

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
{/_ Header _/}
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
className="flex items-center px-4 py-2 text-sm font-medium text-slate-600 bg-white/80 backdrop-blur rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50" >
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

new admin dashboard

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

const AdminDashboard: React.FC = () => {
const location = useLocation();
const userRole = (location.state as any)?.role || UserRole.SIWES_COORDINATOR;
const isCoordinator = userRole === UserRole.SIWES_COORDINATOR;

const [activeTab, setActiveTab] = useState<
"overview" | "students" | "logs" | "attendance"

> ("overview");

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
.select("\*")
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

const fetchLogs = async () => {
setIsLoading(true);
try {
const { data, error } = await supabase
.from("daily_logs")
.select(
`          *,
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
`          *,
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
      }`} >
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
{/_ Sidebar _/}
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

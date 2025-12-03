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

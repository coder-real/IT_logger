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

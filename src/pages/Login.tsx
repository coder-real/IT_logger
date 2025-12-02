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

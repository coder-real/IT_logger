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

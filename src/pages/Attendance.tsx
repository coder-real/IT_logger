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
  LogOut as CheckOutIcon,
  LogIn as CheckInIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { getFaceEmbedding, loadModels } from "../utils/faceRecognition";

interface StudentMatch {
  student_id: string;
  full_name: string;
  similarity: number;
}

async function findStudentByEmbedding(
  embedding: number[]
): Promise<StudentMatch | null> {
  const { data, error } = await supabase.rpc("find_closest_student", {
    query_embedding: embedding,
    match_threshold: 0.85,
    match_limit: 1,
  });

  if (error) {
    console.error("Vector Search Error:", error);
    throw new Error(`Database search failed: ${error.message}`);
  }

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [attendanceAction, setAttendanceAction] = useState<
    "check-in" | "check-out"
  >("check-in");

  useEffect(() => {
    const currentUser = (location.state as any)?.user;
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    checkTodayAttendance(currentUser.id);

    const loadFaceRecognitionModels = async () => {
      try {
        setResultMessage({
          type: "warning",
          message: "Loading face recognition models...",
        });
        await loadModels();
        setModelsLoaded(true);
        setResultMessage(null);
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

    return () => {
      stopCamera();
    };
  }, [location, navigate]);

  const checkTodayAttendance = async (studentId: string) => {
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

      // Determine action based on attendance status
      if (data) {
        setAttendanceAction(data.check_out_time ? "check-in" : "check-out");
      } else {
        setAttendanceAction("check-in");
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

  const captureAndRecognize = async () => {
    if (!videoRef.current || !modelsLoaded) return;

    setIsProcessing(true);
    setCameraMode("processing");
    setResultMessage(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      const embedding = await getFaceEmbedding(video);

      if (!embedding) {
        setResultMessage({
          type: "warning",
          message:
            "No face detected. Please position your face clearly in the camera.",
        });
        setCameraMode("active");
        setIsProcessing(false);
        return;
      }

      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          setCapturedPhoto(canvas.toDataURL("image/jpeg"));
        }
      }

      const studentMatch = await findStudentByEmbedding(embedding);

      if (!studentMatch) {
        setResultMessage({
          type: "error",
          message: "Face not recognized. Please ensure you are enrolled.",
        });
        setCameraMode("active");
        setIsProcessing(false);
        return;
      }

      const studentId = studentMatch.student_id;
      const studentName = studentMatch.full_name;

      const now = new Date();
      const todayDate = now.toISOString().split("T")[0];
      const currentTime = now.toLocaleTimeString("en-US", { hour12: false });

      if (attendanceAction === "check-in") {
        // Check-In Logic
        const { error: attendanceError } = await supabase
          .from("attendance")
          .insert({
            student_id: studentId,
            status: "PRESENT",
            date: todayDate,
            check_in_time: currentTime,
          });

        if (attendanceError) {
          if (attendanceError.code === "23505") {
            setResultMessage({
              type: "warning",
              message: `${studentName}: Already checked in today.`,
            });
          } else {
            throw new Error(
              `Failed to save attendance: ${attendanceError.message}`
            );
          }
        } else {
          setResultMessage({
            type: "success",
            message: `Welcome, ${studentName}! Check-in successful at ${currentTime}.`,
          });

          await checkTodayAttendance(user.id);
          stopCamera();
          setCameraMode("inactive");
        }
      } else {
        // Check-Out Logic
        const { error: checkoutError } = await supabase
          .from("attendance")
          .update({
            check_out_time: currentTime,
            status: "COMPLETED",
          })
          .eq("student_id", studentId)
          .eq("date", todayDate)
          .is("check_out_time", null);

        if (checkoutError) {
          throw new Error(`Failed to check out: ${checkoutError.message}`);
        }

        setResultMessage({
          type: "success",
          message: `Goodbye, ${studentName}! Check-out successful at ${currentTime}.`,
        });

        await checkTodayAttendance(user.id);
        stopCamera();
        setCameraMode("inactive");
      }
    } catch (error: any) {
      console.error("Recognition/Attendance Error:", error);
      setResultMessage({
        type: "error",
        message: `Failed to complete ${attendanceAction}: ${error.message}`,
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
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:tracking-tight">
          Mark Attendance
        </h2>
        <p className="mt-1 text-gray-500">
          Use face recognition to{" "}
          {attendanceAction === "check-in" ? "check in" : "check out"} for today
        </p>
      </div>

      {/* Attendance Status Cards */}
      {todayAttendance ? (
        todayAttendance.check_out_time ? (
          <div className="mb-8 bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 bg-purple-100 rounded-xl p-3">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-purple-900">
                  Attendance Completed for Today
                </h3>
                <div className="mt-2 space-y-1 text-sm text-purple-700">
                  <p>Check-in: {todayAttendance.check_in_time}</p>
                  <p>Check-out: {todayAttendance.check_out_time}</p>
                </div>
                <p className="text-xs text-purple-600 mt-2">
                  You've completed your attendance cycle for today.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 bg-amber-100 rounded-xl p-3">
                <CheckOutIcon className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900">
                  Ready to Check Out
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Check-in time: {todayAttendance.check_in_time}
                </p>
                <p className="text-xs text-amber-600 mt-2">
                  Use face recognition below to mark your departure.
                </p>
              </div>
            </div>
          </div>
        )
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
          <div className="flex items-center gap-3 mb-6">
            {attendanceAction === "check-in" ? (
              <CheckInIcon className="w-6 h-6 text-green-600" />
            ) : (
              <CheckOutIcon className="w-6 h-6 text-amber-600" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Face Recognition{" "}
              {attendanceAction === "check-in" ? "Check-In" : "Check-Out"}
            </h3>
          </div>

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
            {cameraMode === "inactive" && !todayAttendance?.check_out_time && (
              <button
                type="button"
                onClick={startCamera}
                disabled={!modelsLoaded}
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 ${
                  attendanceAction === "check-in"
                    ? "bg-[#28a745] hover:bg-[#218838]"
                    : "bg-amber-500 hover:bg-amber-600"
                } text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50`}
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
                className={`w-full flex items-center justify-center gap-2 px-6 py-4 ${
                  attendanceAction === "check-in"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-orange-500 hover:bg-orange-600"
                } text-white rounded-xl font-medium transition-all shadow-lg disabled:opacity-50`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture &{" "}
                    {attendanceAction === "check-in" ? "Check In" : "Check Out"}
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
                <strong className="font-semibold">
                  {attendanceAction === "check-in" ? "Check-In" : "Check-Out"}{" "}
                  Tips:
                </strong>
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

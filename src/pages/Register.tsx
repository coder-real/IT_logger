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
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import AlertModal, { useAlert } from "../components/AlertModal";
import { getFaceEmbedding, loadModels } from "../utils/faceRecognition";
import { esp32Camera, useESP32Camera } from "../utils/esp32Camera";

type CameraSource = "webcam" | "esp32";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { alert, showAlert, closeAlert } = useAlert();

  const videoRef = useRef<HTMLVideoElement>(null);
  const esp32ImgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState<
    "idle" | "uploading_photo" | "saving_db" | "complete"
  >("idle");

  const [cameraSource, setCameraSource] = useState<CameraSource>("webcam");
  const [cameraMode, setCameraMode] = useState<
    "inactive" | "active" | "captured"
  >("inactive");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedEmbedding, setCapturedEmbedding] = useState<number[] | null>(
    null
  );

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // ESP32 state
  const [esp32IP, setEsp32IP] = useState("192.168.1.100");
  const [showESP32Config, setShowESP32Config] = useState(false);
  const esp32 = useESP32Camera();

  const [formData, setFormData] = useState({
    fullName: "",
    matricNumber: "",
    department: "Computer Science",
    phone: "",
    email: "",
  });

  useEffect(() => {
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
      esp32.disconnect();
    };
  }, []);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (cameraSource === "esp32") {
      esp32.stopStream();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const connectESP32 = async () => {
    try {
      const connected = await esp32.connect({
        ipAddress: esp32IP,
        port: 80,
        streamEndpoint: "/stream",
        captureEndpoint: "/capture",
      });

      if (connected) {
        showAlert("success", "Connected", "ESP32-CAM connected successfully!");
        setShowESP32Config(false);
      } else {
        showAlert(
          "error",
          "Connection Failed",
          "Could not connect to ESP32-CAM. Check IP address and network."
        );
      }
    } catch (error) {
      showAlert(
        "error",
        "Error",
        "Failed to connect to ESP32-CAM: " + (error as Error).message
      );
    }
  };

  const startCamera = async () => {
    if (!modelsLoaded) {
      showAlert("warning", "Please Wait", "Face models are still loading...");
      return;
    }

    try {
      stopCamera();
      setCapturedPhoto(null);
      setPhotoBlob(null);
      setCapturedEmbedding(null);

      if (cameraSource === "webcam") {
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
            setCameraReady(true);
          };
        }

        setStream(media);
      } else {
        // ESP32-CAM
        if (!esp32.status.connected) {
          showAlert(
            "warning",
            "Not Connected",
            "Please connect to ESP32-CAM first"
          );
          setShowESP32Config(true);
          return;
        }

        if (esp32ImgRef.current) {
          const started = await esp32.startStream(esp32ImgRef.current);
          if (!started) {
            showAlert("error", "Stream Failed", "Could not start ESP32 stream");
            return;
          }
          setCameraReady(true);
        }
      }

      setCameraMode("active");
    } catch (error) {
      console.error("Camera failed:", error);
      showAlert("error", "Camera Access Denied", "Please allow camera access.");
    }
  };

  const capturePhoto = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    try {
      let inputElement: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

      if (cameraSource === "webcam") {
        if (!videoRef.current) return;
        inputElement = videoRef.current;

        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(videoRef.current, 0, 0);
      } else {
        // ESP32-CAM capture
        const captured = await esp32.captureToCanvas(canvas);
        if (!captured) {
          showAlert(
            "error",
            "Capture Failed",
            "Could not capture from ESP32-CAM"
          );
          return;
        }
        inputElement = canvas;
      }

      // Generate face embedding
      const embedding = await getFaceEmbedding(inputElement);

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

      // Create blob for storage
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

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoBlob(null);
    setCapturedEmbedding(null);
    stopCamera();
    setCameraMode("inactive");
  };

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
      setEnrollmentStep("uploading_photo");
      const photoUrl = await uploadPhoto(photoBlob);
      if (!photoUrl) throw new Error("Photo upload failed");

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

      const { error: embeddingError } = await supabase
        .from("face_embeddings")
        .insert({
          student_id: student.id,
          embedding: capturedEmbedding,
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

                {/* Camera Source Toggle */}
                <div className="flex gap-2 items-center justify-center mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraSource("webcam");
                      setCameraMode("inactive");
                      stopCamera();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      cameraSource === "webcam"
                        ? "bg-green-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    💻 Webcam
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraSource("esp32");
                      setCameraMode("inactive");
                      stopCamera();
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      cameraSource === "esp32"
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    📷 ESP32-CAM
                  </button>
                </div>

                {/* ESP32 Connection Status */}
                {cameraSource === "esp32" && (
                  <div className="mb-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">
                        ESP32 Status
                      </span>
                      {esp32.status.connected ? (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <Wifi className="w-3 h-3" />
                          Connected
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <WifiOff className="w-3 h-3" />
                          Disconnected
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowESP32Config(!showESP32Config)}
                      className="w-full text-xs text-blue-600 hover:text-blue-700 underline"
                    >
                      {showESP32Config ? "Hide" : "Show"} Configuration
                    </button>

                    {showESP32Config && (
                      <div className="mt-3 space-y-2">
                        <input
                          type="text"
                          value={esp32IP}
                          onChange={(e) => setEsp32IP(e.target.value)}
                          placeholder="192.168.1.100"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={connectESP32}
                          className="w-full px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                        >
                          Connect
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Camera View */}
                <div className="relative mx-auto w-64 h-64 rounded-2xl bg-slate-900 shadow-lg overflow-hidden mb-4">
                  {/* Webcam */}
                  {cameraSource === "webcam" && (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        cameraMode === "active" && cameraReady
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  )}

                  {/* ESP32 Stream */}
                  {cameraSource === "esp32" && (
                    <img
                      ref={esp32ImgRef}
                      alt="ESP32 Stream"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        cameraMode === "active" && cameraReady
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  )}

                  {/* Captured Photo */}
                  {cameraMode === "captured" && capturedPhoto && (
                    <img
                      src={capturedPhoto}
                      alt="Captured"
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  )}

                  <canvas ref={canvasRef} className="hidden" />

                  {/* Inactive Overlay */}
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

                {/* Tips */}
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

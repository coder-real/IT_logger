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

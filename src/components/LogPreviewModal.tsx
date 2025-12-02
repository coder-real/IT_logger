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

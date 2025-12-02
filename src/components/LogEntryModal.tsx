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

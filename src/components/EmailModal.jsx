import React, { useState } from "react";
import { IoClose, IoMail } from "react-icons/io5";
import { toast } from "sonner";
import CONFIG from "../config";
import Spinner from "./Spinner";

function EmailModal({ isOpen, onClose, reportId }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/report/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          reportId: reportId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to send report");
      }

      if (data.success) {
        toast.success("Report has been sent to your email");
        setEmail("");
        onClose();
      } else {
        throw new Error(data.error || "Failed to send report");
      }
    } catch (err) {
      console.error("Error sending report email:", err);
      setError(err.message || "Failed to send report. Please try again.");
      toast.error(err.message || "Failed to send report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--card-bg)] rounded-2xl shadow-2xl max-w-md w-full border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
              <IoMail className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Receive Report via Email
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-[var(--text-muted)] hover:text-[var(--text)] p-1 rounded-lg hover:bg-[var(--hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-[var(--text-muted)] mb-6">
            Enter your email address to receive the equity research report as a PDF attachment.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--text)] mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Enter your email to receive the report"
                disabled={loading}
                className="
                  w-full px-4 py-3 rounded-xl
                  bg-[var(--bg)] border border-[var(--border)]
                  text-[var(--text)] placeholder-[var(--text-muted)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                "
                autoFocus
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="
                  flex-1 px-4 py-3 rounded-xl
                  border border-[var(--border)] bg-[var(--bg)]
                  text-[var(--text)] font-medium
                  hover:bg-[var(--hover)] transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="
                  flex-1 px-4 py-3 rounded-xl
                  bg-[var(--accent)] text-white font-medium
                  hover:brightness-110 active:scale-95 transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  "Send Report"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EmailModal;

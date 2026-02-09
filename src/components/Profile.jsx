import React, { useState } from "react";
import CONFIG from "../config";
import Spinner from "./Spinner";
import { toast } from "sonner";
import { showConfirmToast } from "../utils/confirmToast";
import {IoTrashOutline} from "react-icons/io5";


function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeletingReports, setIsDeletingReports] = useState(false);
  const [profile, setProfile] = useState({
    name: "Demo User",
    email: "demo@sagealpha.ai",
    role: "Equity Research Analyst",
    organization: "Independent Analyst",
    experience: "Senior",
    sectorFocus: ["IT", "Banking", "Energy"],
    market: "India (NSE/BSE)",
    bio: "Passionate about uncovering deep insights in the equity markets. Specializing in financial modeling and long-term trend analysis.",
    analysisDepth: "Deep Analysis",
    outputStyle: "Tables + Bullet Points",
    timeRange: "Last 3 Years",
    currency: "INR"
  });

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, you'd call an API here
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const performClearChatHistory = async () => {
    setIsClearing(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/chat/clear-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success("All chat history has been cleared successfully.");
        // Optionally refresh the page or update UI
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to clear chat history. Please try again.");
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast.error("An error occurred while clearing chat history. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearChatHistory = () => {
    showConfirmToast({
      message: "Clear all chat history?",
      description: "This will permanently delete all your chat sessions and messages.",
      confirmLabel: "Clear",
      onConfirm: performClearChatHistory,
    });
  };

  const performDeleteAllReports = async () => {
    setIsDeletingReports(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/delete-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success("All generated reports and portfolio items have been deleted successfully.");
        // Optionally refresh the page or update UI
        window.location.reload();
      } else {
        toast.error(data.error || "Failed to delete reports and portfolio. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting reports and portfolio:", error);
      toast.error("An error occurred while deleting reports and portfolio. Please try again.");
    } finally {
      setIsDeletingReports(false);
    }
  };

  const handleDeleteAllReports = () => {
    showConfirmToast({
      message: "Delete all reports?",
      description: "This will permanently delete all generated reports and clear your portfolio.",
      confirmLabel: "Delete",
      onConfirm: performDeleteAllReports,
    });
  };

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)] px-6 py-8 overflow-y-auto">
      {/* Header with quick actions */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--border)] pb-10">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text)] leading-tight">
            Account Settings
          </h1>
          {/* <p className="text-xl text-[var(--text-muted)] mt-2">
            Configure your professional profile and research engine.
          </p> */}
        </div>
        <div className="flex gap-4">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-sm font-bold hover:bg-[var(--hover)] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90 transition active:scale-95"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-8 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-bold hover:opacity-90 transition active:scale-95"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Essential Info */}
        <div className="lg:col-span-4 space-y-8">
          <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8 text-center">
            <div className="relative inline-block mx-auto mb-6">
              <div className="h-32 w-32 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] text-4xl font-black border-2 border-[var(--accent)]/20">
                {profile.name.split(" ").map(n => n[0]).join("")}
              </div>
            </div>
            {isEditing ? (
              <input
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="w-full text-center text-2xl font-bold bg-transparent border-b border-blue-500 focus:outline-none mb-2"
              />
            ) : (
              <h2 className="text-2xl font-bold">{profile.name}</h2>
            )}
            <p className="text-[var(--text-muted)] text-sm mb-4">{profile.email}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {/* <span className="px-3 py-1 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold uppercase tracking-wider">
                {profile.experience}
              </span> */}
              {/* <span className="px-3 py-1 rounded-full bg-[var(--hover)] text-[var(--text-muted)] text-xs font-bold uppercase tracking-wider">
                {profile.organization}
              </span> */}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">Usage Stats</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-3xl font-bold">124</p>
                <p className="text-xs text-[var(--text-muted)]">Research sessions</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">46</p>
                <p className="text-xs text-[var(--text-muted)]">Companies analyzed</p>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Detailed Config */}
        <div className="lg:col-span-8 space-y-8">
          {/* Bio Section */}
          {/* <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">Professional Bio</h3>
            {isEditing ? (
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 text-sm focus:border-[var(--accent)] outline-none transition"
              />
            ) : (
              <p className="text-lg leading-relaxed text-[var(--text)] italic opacity-90">
                "{profile.bio}"
              </p>
            )}
          </section> */}

          {/* Core Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Professional Details">
              <EditableField
                label="Organization"
                name="organization"
                value={profile.organization}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Role"
                name="role"
                value={profile.role}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Market Focus"
                name="market"
                value={profile.market}
                isEditing={isEditing}
                onChange={handleChange}
              />
            </Card>

            <Card title="Research Preferences">
              <EditableField
                label="Analysis Depth"
                name="analysisDepth"
                value={profile.analysisDepth}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Output Style"
                name="outputStyle"
                value={profile.outputStyle}
                isEditing={isEditing}
                onChange={handleChange}
              />
              <EditableField
                label="Currency"
                name="currency"
                value={profile.currency}
                isEditing={isEditing}
                onChange={handleChange}
              />
            </Card>
          </div>

         

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Chat History</h3>
              <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase">Data Management</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">🗑️</div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">Clear All Chat History</p>
                  <p className="text-xs text-[var(--text-muted)]">Permanently delete all your chat sessions and messages</p>
                </div>
              </div>
              <button 
                onClick={handleClearChatHistory}
                disabled={isClearing}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-red-500/50 bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isClearing ? (
                  <>
                    <Spinner size="sm" />
                    Clearing...
                  </>
                ) : (
                 <IoTrashOutline className="w-5 h-5" />
                )}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)]">Generated Reports</h3>
              <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase">Data Management</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">📄</div>
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">Delete All Generated Reports</p>
                  <p className="text-xs text-[var(--text-muted)]">Permanently delete all your generated reports and clear your portfolio</p>
                </div>
              </div>
              <button 
                onClick={handleDeleteAllReports}
                disabled={isDeletingReports}
                className="w-full md:w-auto px-6 py-2.5 rounded-xl border border-red-500/50 bg-red-500/10 text-red-500 text-sm font-bold hover:bg-red-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingReports ? (
                  <>
                    <Spinner size="sm" />
                    Deleting...
                  </>
                ) : (
                <IoTrashOutline className="w-5 h-5" />
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--sidebar-bg)] p-8">
      <h3 className="text-sm font-black uppercase tracking-widest text-[var(--text-muted)] mb-6">{title}</h3>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  );
}

function EditableField({ label, name, value, isEditing, onChange }) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tight">{label}</p>
      {isEditing ? (
        <input
          name={name}
          value={value}
          onChange={onChange}
          className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:border-[var(--accent)] outline-none transition"
        />
      ) : (
        <p className="text-base font-medium">{value}</p>
      )}
    </div>
  );
}

export default Profile;

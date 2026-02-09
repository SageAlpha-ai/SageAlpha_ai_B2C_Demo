import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HiUser, HiMagnifyingGlass, HiPaperAirplane, HiClock, HiEnvelope } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import CONFIG from "../config";
import Spinner from "./Spinner";
import { toast } from "sonner";
import { showConfirmToast } from "../utils/confirmToast";

function Subscribers() {
  const location = useLocation();
  const navigate = useNavigate();
  const [subscribers, setSubscribers] = useState([]);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null); // Changed to single selection
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", mobile: "", risk_profile: "Medium" });
  const [editingSubscriber, setEditingSubscriber] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: "", email: "", mobile: "", risk_profile: "Medium" });
  const [selectedHistorySubscriber, setSelectedHistorySubscriber] = useState(null);
  const [reportHistory, setReportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState({}); // Track WhatsApp sending per subscriber
  const [addingSubscriber, setAddingSubscriber] = useState(false);
  const [updatingSubscriber, setUpdatingSubscriber] = useState(false);
  const [deletingSubscriberId, setDeletingSubscriberId] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documentFileName, setDocumentFileName] = useState("");
  const fileInputRef = useRef(null);
  const historySectionRef = useRef(null);
  const report = location.state?.report || null;
  const reports = location.state?.reports || null; // Multiple reports

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.API_BASE_URL}/subscribers`, {
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch subscribers");
      }

      const data = await response.json();
      console.log("Fetched subscribers:", data); // Debug log
      
      if (data.subscribers && Array.isArray(data.subscribers)) {
        // Ensure all subscribers have proper _id field (convert ObjectId to string if needed)
        const normalizedSubscribers = data.subscribers.map(sub => ({
          ...sub,
          _id: sub._id?.toString() || sub.id?.toString() || sub._id || sub.id
        }));
        console.log("Normalized subscribers:", normalizedSubscribers); // Debug log
        setSubscribers(normalizedSubscribers);
      } else {
        console.warn("Unexpected subscribers data format:", data);
        setSubscribers([]);
      }
    } catch (err) {
      console.error("Error fetching subscribers:", err);
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(subscriber => {
    const subscriberId = subscriber._id?.toString() || subscriber.id?.toString() || subscriber._id || subscriber.id;
    return (
      subscriber.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscriber.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subscriber.mobile?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const toggleSubscriber = (subscriberId) => {
    // Single selection: if clicking the same subscriber, deselect; otherwise select new one
    setSelectedSubscriber(prev => 
      prev === subscriberId ? null : subscriberId
    );
  };

  const handleDocumentSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size exceeds 10MB limit. Please select a smaller file.");
        e.target.value = "";
        return;
      }
      setSelectedDocument(file);
      setDocumentFileName(file.name);
    } else {
      setSelectedDocument(null);
      setDocumentFileName("");
    }
  };

  const handleRemoveDocument = () => {
    setSelectedDocument(null);
    setDocumentFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendReport = async () => {
    const reportsToSend = reports || (report ? [report] : null);
    
    if (!reportsToSend || reportsToSend.length === 0) {
      toast.error("No report selected. Please go back to Portfolio and select a report.");
      return;
    }

    if (!selectedSubscriber) {
      toast.error("Please select a subscriber.");
      return;
    }

    setSendingReport(true);
    
    try {
      // Get selected subscriber details and extract email (single selection)
      const selectedSubscriberDetails = subscribers.find(s => {
        const subscriberId = s._id?.toString() || s.id?.toString() || s._id || s.id;
        return subscriberId === selectedSubscriber;
      });
      const subscriberEmails = selectedSubscriberDetails ? [selectedSubscriberDetails.email] : [];
      
      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append("subscriber_emails", JSON.stringify(subscriberEmails));
      formData.append("reports", JSON.stringify(reportsToSend));
      
      // Add document if selected
      if (selectedDocument) {
        formData.append("additional_document", selectedDocument);
      }
      
      // Call the API to send reports
      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/send`, {
        method: "POST",
        // Don't set Content-Type header - browser will set it with boundary for FormData
        credentials: "include",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send reports");
      }

      const result = await response.json();
      
      // Show success message with details
      if (result.success) {
        const successMessage = result.errors && result.errors.length > 0
          ? `Sent ${result.sent} report(s) successfully. ${result.failed} failed.`
          : `Successfully sent ${result.sent} report(s) to ${subscriberEmails.length} subscriber(s)!`;

        toast.success(successMessage);
        
        // Log errors if any
        if (result.errors && result.errors.length > 0) {
          console.warn("Some reports failed to send:", result.errors);
        }
      } else {
        throw new Error("Unexpected response from server");
      }
      
      // Clear selection and document after sending
      setSelectedSubscriber(null);
      setSelectedDocument(null);
      setDocumentFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Optionally navigate back to portfolio
      // navigate("/portfolio");
    } catch (err) {
      console.error("Error sending report:", err);
      toast.error(err.message || "Failed to send reports. Please try again.");
    } finally {
      setSendingReport(false);
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and email are required.");
      return;
    }

    setAddingSubscriber(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/subscribers/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          risk_profile: formData.risk_profile
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to add subscriber");
      }

      const result = await response.json();
      console.log("Add subscriber response:", result); // Debug log
      
      // Reset form
      setFormData({ name: "", email: "", mobile: "", risk_profile: "Medium" });
      
      // Refresh list immediately
      await fetchSubscribers();
      
      // Show success message after refresh
      toast.success("Subscriber added successfully!");
    } catch (err) {
      console.error("Error adding subscriber:", err);
      toast.error(err.message || "Failed to add subscriber. Please try again.");
    } finally {
      setAddingSubscriber(false);
    }
  };

  const handleEditSubscriber = (subscriber) => {
    setEditingSubscriber(subscriber._id || subscriber.id);
    setEditFormData({
      name: subscriber.name || "",
      email: subscriber.email || "",
      mobile: subscriber.mobile || "",
      risk_profile: subscriber.risk_profile || "Medium"
    });
  };

  const handleUpdateSubscriber = async (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.email) {
      toast.error("Name and email are required.");
      return;
    }

    setUpdatingSubscriber(true);
    try {
      const subscriberId = editingSubscriber;
      const response = await fetch(`${CONFIG.API_BASE_URL}/subscribers/${subscriberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: editFormData.name,
          email: editFormData.email,
          mobile: editFormData.mobile,
          risk_profile: editFormData.risk_profile
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update subscriber");
      }

      const result = await response.json();
      console.log("Update subscriber response:", result);
      
      // Reset edit form and close
      setEditingSubscriber(null);
      setEditFormData({ name: "", email: "", mobile: "", risk_profile: "Medium" });
      
      // Refresh list immediately
      await fetchSubscribers();
      
      // Show success message
      toast.success("Subscriber updated successfully!");
    } catch (err) {
      console.error("Error updating subscriber:", err);
      toast.error(err.message || "Failed to update subscriber. Please try again.");
    } finally {
      setUpdatingSubscriber(false);
    }
  };

  const performDeleteSubscriber = async (subscriberId) => {
    setDeletingSubscriberId(subscriberId);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/subscribers/${subscriberId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete subscriber");
      }

      const result = await response.json();
      console.log("Delete subscriber response:", result);
      
      // Remove from selected if it was selected
      setSelectedSubscriber(prev => prev === subscriberId ? null : prev);
      
      // Refresh list immediately
      await fetchSubscribers();
      
      // Show success message
      toast.success("Subscriber deleted successfully!");
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      toast.error(err.message || "Failed to delete subscriber. Please try again.");
    } finally {
      setDeletingSubscriberId(null);
    }
  };

  const handleDeleteSubscriber = (subscriberId) => {
    showConfirmToast({
      message: "Delete this subscriber?",
      description: "This will permanently remove the subscriber from your list.",
      confirmLabel: "Delete",
      onConfirm: () => performDeleteSubscriber(subscriberId),
    });
  };

  const handleCancelEdit = () => {
    setEditingSubscriber(null);
    setEditFormData({ name: "", email: "", mobile: "", risk_profile: "Medium" });
  };

  const handleViewHistory = async (subscriber) => {
    setSelectedHistorySubscriber(subscriber);
    setHistoryLoading(true);
    setReportHistory([]);
    
    // Scroll to history section
    setTimeout(() => {
      historySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    try {
      const subscriberId = subscriber._id?.toString() || subscriber.id?.toString() || subscriber._id || subscriber.id;
      
      const response = await fetch(`${CONFIG.API_BASE_URL}/subscribers/${subscriberId}/history`, {
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch report history");
      }

      const data = await response.json();
      
      if (data.success && data.history) {
        setReportHistory(data.history);
      } else {
        setReportHistory([]);
      }
    } catch (err) {
      console.error("Error fetching report history:", err);
      setReportHistory([]);
      toast.error("Failed to load report history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setSelectedHistorySubscriber(null);
    setReportHistory([]);
  };

  const handleSendWhatsApp = async (subscriber) => {
    // Get the report to send (use first report from reports array, or single report)
    const reportToSend = reports && reports.length > 0 ? reports[0] : report;
    
    if (!reportToSend) {
      toast.error("No report selected. Please go back to Portfolio and select a report.");
      return;
    }

    // Check WhatsApp opt-in
    if (subscriber.whatsappOptIn !== true) {
      toast.error("This subscriber has not opted in for WhatsApp notifications.");
      return;
    }

    // Check phone number
    const phone = subscriber.phone || subscriber.mobile;
    if (!phone) {
      toast.error("Subscriber phone number is missing.");
      return;
    }

    // Format phone: remove all non-digits
    const formattedPhone = phone.replace(/[^\d]/g, '');
    if (formattedPhone.length < 10) {
      toast.error("Invalid phone number format.");
      return;
    }

    const subscriberId = subscriber._id?.toString() || subscriber.id?.toString() || subscriber._id || subscriber.id;
    const reportId = reportToSend.report_data || reportToSend._id?.toString() || reportToSend.id?.toString() || reportToSend._id || reportToSend.id;

    // Set loading state for this subscriber
    setSendingWhatsApp(prev => ({ ...prev, [subscriberId]: true }));

    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/whatsapp/send-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          subscriberId,
          phone: formattedPhone,
          reportId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send report on WhatsApp");
      }

      const result = await response.json();
      toast.success("Report sent on WhatsApp");
    } catch (err) {
      console.error("Error sending WhatsApp report:", err);
      toast.error(err.message || "Failed to send report on WhatsApp. Please try again.");
    } finally {
      // Clear loading state for this subscriber
      setSendingWhatsApp(prev => {
        const newState = { ...prev };
        delete newState[subscriberId];
        return newState;
      });
    }
  };

  // Calculate statistics from history
  const getHistoryStats = () => {
    if (!reportHistory || reportHistory.length === 0) {
      return {
        totalReports: 0,
        companyWise: {},
        totalCompanies: 0
      };
    }

    const companyWise = {};
    reportHistory.forEach(item => {
      const company = item.company_name || "Unknown";
      companyWise[company] = (companyWise[company] || 0) + 1;
    });

    return {
      totalReports: reportHistory.length,
      companyWise,
      totalCompanies: Object.keys(companyWise).length
    };
  };

  const historyStats = getHistoryStats();

  return (
    <section className="h-full w-full bg-[var(--bg)] text-[var(--text)] px-6 py-4 flex flex-col overflow-y-auto">

      {/* Header */}
      <div className="flex-shrink-0 mb-4 border-b border-[var(--border)] pb-3">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text)]">
          Subscribers
        </h1>
        {reports && reports.length > 0 && (
          <div className="mt-2 p-2 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <p className="text-xs font-bold text-[var(--accent)]">
              📄 Selected Reports ({reports.length}):
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {reports.map((r, idx) => (
                <span
                  key={r._id || idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-md bg-[var(--accent)]/20 text-[10px] font-medium text-[var(--accent)]"
                >
                  {r.company_name || r.title.replace("Equity Research Note – ", "").trim()}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
              Select subscriber below to send these reports
            </p>
          </div>
        )}
        {report && !reports && (
          <div className="mt-2 p-2 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
            <p className="text-xs font-bold text-[var(--accent)]">
              📄 Selected Report: {report.company_name || report.title}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Select subscriber below to send this report
            </p>
          </div>
        )}
      </div>

      {/* Main Content: Two Columns */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-hidden">

        {/* Left Col: Add/Edit Form */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <div className="flex-shrink-0 rounded-2xl bg-[var(--card-bg)] p-4">
            <h2 className="text-sm font-bold mb-3 text-[var(--text)]">
              {editingSubscriber ? "Edit Subscriber" : "Add Subscriber"}
            </h2>
            {editingSubscriber ? (
              <form onSubmit={handleUpdateSubscriber} className="space-y-2.5">
                <Input 
                  label="Full Name" 
                  placeholder="e.g. John Doe" 
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
                <Input 
                  label="Email Address" 
                  placeholder="e.g. john@sage.com" 
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
                <Input 
                  label="Mobile Number" 
                  placeholder="e.g. +91..." 
                  value={editFormData.mobile}
                  onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                />
                <Select
                  label="Risk Profile"
                  value={editFormData.risk_profile}
                  onChange={(e) => setEditFormData({ ...editFormData, risk_profile: e.target.value })}
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" }
                  ]}
                />
                <div className="flex gap-2 mt-4">
                  <button 
                    type="submit"
                    disabled={updatingSubscriber}
                    className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {updatingSubscriber ? (
                      <>
                        <Spinner size="sm" />
                        Updating...
                      </>
                    ) : (
                      "Update Subscriber"
                    )}
                  </button>
                  <button 
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={updatingSubscriber}
                    className="flex-1 rounded-lg bg-[var(--hover)] px-3 py-2 text-xs font-bold text-[var(--text)] hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddSubscriber} className="space-y-2.5">
                <Input 
                  label="Full Name" 
                  placeholder="e.g. John Doe" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input 
                  label="Email Address" 
                  placeholder="e.g. john@sage.com" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input 
                  label="Mobile Number" 
                  placeholder="e.g. +91..." 
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
                <Select
                  label="Risk Profile"
                  value={formData.risk_profile}
                  onChange={(e) => setFormData({ ...formData, risk_profile: e.target.value })}
                  options={[
                    { value: "Low", label: "Low" },
                    { value: "Medium", label: "Medium" },
                    { value: "High", label: "High" }
                  ]}
                />
                <button 
                  type="submit"
                  disabled={addingSubscriber}
                  className="w-full mt-4 rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-bold text-white hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addingSubscriber ? (
                    <>
                      <Spinner size="sm" />
                      Adding...
                    </>
                  ) : (
                    "Add New Subscriber"
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="flex-shrink-0 rounded-2xl bg-[var(--sidebar-bg)]/70 p-3 flex flex-col justify-center items-center text-center opacity-80">
            <p className="text-[10px] text-[var(--text-muted)]">Batch import from CSV coming soon</p>
          </div>
        </div>

        {/* Right Col: Subscriber List */}
        <div className="lg:col-span-8 flex flex-col min-h-0 max-h-full rounded-2xl bg-[var(--card-bg)] overflow-hidden">

          {/* List Header with Search & Send */}
          <div className="flex-shrink-0 p-2.5 bg-[var(--bg)]/40">
            {/* Top row: Checkbox, Search, Send */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--sidebar-bg)] text-[var(--text)]">
                  <HiUser className="text-[var(--accent)]" />
                  <span className="text-xs font-bold leading-none">{selectedSubscriber ? 1 : 0}</span>
                </div>
              </div>

              <div className="flex-1 relative">
                <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg)]/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0"
                />
              </div>

              <button 
                onClick={handleSendReport}
                disabled={(!report && !reports) || !selectedSubscriber || sendingReport}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.95] ${
                  (report || reports) && selectedSubscriber && !sendingReport
                    ? "bg-[var(--accent)] text-white hover:opacity-90"
                    : "bg-[var(--hover)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
              >
                {sendingReport ? (
                  <>
                    <Spinner size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <HiEnvelope className="w-4 h-4" />
                    Send Report{(reports && reports.length > 1) ? `s (${reports.length})` : ''}
                  </>
                )}
              </button>
            </div>

            {/* Bottom row: Document Attachment */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleDocumentSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--hover)] transition text-xs font-medium"
              >
                <span>📎</span>
                {selectedDocument ? "Change Document" : "Attach Document"}
              </button>
              {selectedDocument && (
                <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                  <span className="text-xs text-[var(--accent)] font-medium truncate max-w-[200px]">
                    {documentFileName}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveDocument}
                    className="text-[var(--accent)] hover:text-red-500 transition text-xs font-bold"
                    title="Remove document"
                  >
                    ×
                  </button>
                </div>
              )}
              {selectedDocument && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  ({(selectedDocument.size / 1024).toFixed(1)} KB)
                </span>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)] custom-scrollbar min-h-0">
            {loading ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                Loading subscribers...
              </div>
            ) : filteredSubscribers.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                {searchQuery ? "No subscribers found matching your search." : "No subscribers yet. Add your first subscriber using the form on the left."}
              </div>
            ) : (
              filteredSubscribers.map((subscriber) => {
                const subscriberId = subscriber._id?.toString() || subscriber.id?.toString() || subscriber._id || subscriber.id;
                return (
                  <SubscriberRow 
                    key={subscriberId}
                    id={subscriberId}
                    subscriber={subscriber}
                    name={subscriber.name}
                    email={subscriber.email}
                    phone={subscriber.mobile || subscriber.phone}
                    isSelected={selectedSubscriber === subscriberId}
                    onToggle={() => toggleSubscriber(subscriberId)}
                    onEdit={handleEditSubscriber}
                    onDelete={handleDeleteSubscriber}
                    onViewHistory={handleViewHistory}
                    onSendWhatsApp={handleSendWhatsApp}
                    sendingWhatsApp={sendingWhatsApp[subscriberId] || false}
                    hasReport={!!(report || (reports && reports.length > 0))}
                    deletingSubscriberId={deletingSubscriberId}
                  />
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Report History Section */}
      {selectedHistorySubscriber && (
        <div ref={historySectionRef} className="mt-8 mb-4 flex-shrink-0">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--sidebar-bg)]">
            {/* History Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Report Sent History
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {selectedHistorySubscriber.name} ({selectedHistorySubscriber.email})
                </p>
              </div>
              <button
                onClick={handleCloseHistory}
                className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--hover)] transition text-sm font-bold"
              >
                Close
              </button>
            </div>

            {/* Statistics */}
            {!historyLoading && (
              <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-3">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">
                      Total Reports
                    </p>
                    <p className="text-2xl font-bold text-[var(--accent)]">
                      {historyStats.totalReports}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-3">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">
                      Companies
                    </p>
                    <p className="text-2xl font-bold text-[var(--accent)]">
                      {historyStats.totalCompanies}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20 p-3">
                    <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold mb-1">
                      Last Sent
                    </p>
                    <p className="text-sm font-bold text-[var(--accent)]">
                      {reportHistory.length > 0 
                        ? new Date(reportHistory[0].sent_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Company-wise breakdown */}
                {Object.keys(historyStats.companyWise).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
                      Reports by Company
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(historyStats.companyWise).map(([company, count]) => (
                        <div
                          key={company}
                          className="px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)] flex items-center gap-2"
                        >
                          <span className="text-xs font-bold text-[var(--text)]">{company}</span>
                          <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History List */}
            <div className="p-4">
              {historyLoading ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  Loading history...
                </div>
              ) : reportHistory.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  No reports sent to this subscriber yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {reportHistory.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:bg-[var(--hover)]/30 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-[var(--text)]">
                            {item.company_name || "Unknown Company"}
                          </p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            {item.status || "sent"}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          {item.report_title || item.company_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[var(--text-muted)]">
                          {new Date(item.sent_date).toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                          {new Date(item.sent_date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

function Input({ label, placeholder, type = "text", value, onChange, required = false }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/50 outline-none focus:border-[var(--accent)] transition-all"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required = false }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className="w-full rounded-lg bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1.5 text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition-all"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SubscriberRow({ id, subscriber, name, email, phone, isSelected, onToggle, onEdit, onDelete, onViewHistory, onSendWhatsApp, sendingWhatsApp, hasReport, deletingSubscriberId }) {
  const riskProfile = subscriber?.risk_profile || "Medium";
  const getRiskProfileColor = (risk) => {
    switch(risk) {
      case "Low":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "High":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    }
  };

  // Check if WhatsApp button should be disabled
  const whatsappDisabled = !hasReport || subscriber.whatsappOptIn !== true || !phone || sendingWhatsApp;

  return (
    <div className="group flex items-center justify-between px-4 py-3 hover:bg-[var(--hover)]/30 transition-all">
      <div className="flex items-center gap-4">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)]" 
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[var(--text)] leading-none">{name}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskProfileColor(riskProfile)}`}>
              {riskProfile} Risk
            </span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">{email}</span>
            {phone && (
              <>
                <span className="h-1 w-1 rounded-full bg-[var(--border)]" />
                <span className="text-[11px] font-medium text-[var(--text-muted)]">{phone}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasReport && (
          <button 
            onClick={() => onSendWhatsApp(subscriber)}
            disabled={whatsappDisabled}
            className={`p-1.5 rounded-md transition-all ${
              whatsappDisabled
                ? "text-[var(--text-muted)]/50 cursor-not-allowed opacity-50"
                : "text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]"
            }`}
            title={
              !hasReport 
                ? "No report selected"
                : subscriber.whatsappOptIn !== true
                ? "Subscriber has not opted in for WhatsApp"
                : !phone
                ? "Phone number missing"
                : "Send on WhatsApp"
            }
          >
            {sendingWhatsApp ? (
              <Spinner size="sm" />
            ) : (
              <FaWhatsapp className="w-4 h-4" />
            )}
          </button>
        )}
        <button 
          onClick={() => onViewHistory(subscriber)}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
          title="View report history"
        >
          <HiClock className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onEdit(subscriber)}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--hover)] transition-all"
          title="Edit subscriber"
        >
          <span className="text-base leading-none">✎</span>
        </button>
        <button 
          onClick={() => onDelete(id)}
          disabled={deletingSubscriberId === id}
          className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete subscriber"
        >
          {deletingSubscriberId === id ? (
            <Spinner size="sm" />
          ) : (
            <span className="text-base leading-none">🗑</span>
          )}
        </button>
      </div>
    </div>
  );
}

export default Subscribers;

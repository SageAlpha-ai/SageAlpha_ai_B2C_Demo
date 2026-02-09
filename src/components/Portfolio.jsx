import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CONFIG from "../config";
import { IoClose, IoEyeOutline, IoCheckmarkCircle, IoPaperPlaneOutline, IoTrashOutline, IoImageOutline, IoSparkles, IoTrendingUpOutline } from "react-icons/io5";
import { HiShoppingCart } from "react-icons/hi2";
import { getMarketIntelligence } from "../api/marketIntelligence";
import Spinner from "./Spinner";
import { toast } from "sonner";
import { showConfirmToast } from "../utils/confirmToast";

function Portfolio() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, approved
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedReports, setSelectedReports] = useState([]); // For multiple report selection
  const [previewReport, setPreviewReport] = useState(null); // Store report to preview
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState("pdf"); // "pdf" or "edit"

  // Performance Dashboard modal state
  const [performanceDashboardOpen, setPerformanceDashboardOpen] = useState(false);
  const [performanceDashboardLoading, setPerformanceDashboardLoading] = useState(false);
  const [performanceDashboardError, setPerformanceDashboardError] = useState(null);
  const [performanceDashboardData, setPerformanceDashboardData] = useState([]); // Array of { companyName, approvedDate, recommendedPrice, targetPrice, currentPrice, performance }
  
  // Loading states for individual report actions
  const [approvingReportId, setApprovingReportId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${CONFIG.API_BASE_URL}/portfolio`, {
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }

      const data = await response.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };


  const openPerformanceDashboard = () => {
    setPerformanceDashboardOpen(true);
  };

  const closePerformanceDashboard = () => {
    setPerformanceDashboardOpen(false);
    setPerformanceDashboardData([]);
    setPerformanceDashboardError(null);
  };

  // Fetch performance dashboard data for ALL portfolio items when modal opens
  useEffect(() => {
    const fetchPerformanceDashboardData = async () => {
      if (!performanceDashboardOpen) return;

      try {
        setPerformanceDashboardLoading(true);
        setPerformanceDashboardError(null);
        // Fetch all data from backend (includes current prices from Yahoo Finance)
        const res = await fetch(
          `${CONFIG.API_BASE_URL}/portfolio/price-analysis`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          throw new Error(errText || "Failed to load performance data");
        }

        const data = await res.json();
        const items = data.items || [];

        console.log(`[Performance Dashboard] Received ${items.length} items from backend`);

        // Process items and calculate performance
        const enrichedItems = items.map((item) => {
          const recommendedPrice = item.recommendedPrice;
          const currentPrice = item.currentPrice;
          
          // Calculate performance percentage - ONLY when both values exist
          let performance = null;
          if (recommendedPrice !== null && recommendedPrice !== undefined && 
              currentPrice !== null && currentPrice !== undefined &&
              typeof recommendedPrice === 'number' && typeof currentPrice === 'number' &&
              !isNaN(recommendedPrice) && !isNaN(currentPrice) && recommendedPrice > 0) {
            performance = ((currentPrice - recommendedPrice) / recommendedPrice) * 100;
          }

          return {
            companyName: item.companyName,
            approvedDate: item.approvedDate,
            recommendedPrice: recommendedPrice,
            targetPrice: item.targetPrice,
            currentPrice: currentPrice,
            performance: performance,
          };
        });

        // Remove duplicates (same company should appear only once)
        const uniqueItems = enrichedItems.reduce((acc, item) => {
          const existing = acc.find(i => i.companyName === item.companyName);
          if (!existing) {
            acc.push(item);
          } else {
            // Keep the one with the latest approved date
            if (new Date(item.approvedDate) > new Date(existing.approvedDate)) {
              const index = acc.indexOf(existing);
              acc[index] = item;
            }
          }
          return acc;
        }, []);

        // Sort by Approved Date (latest first)
        uniqueItems.sort((a, b) => {
          const dateA = a.approvedDate ? new Date(a.approvedDate) : new Date(0);
          const dateB = b.approvedDate ? new Date(b.approvedDate) : new Date(0);
          return dateB - dateA;
        });

        console.log(`[Performance Dashboard] Processed ${uniqueItems.length} unique items`);
        setPerformanceDashboardData(uniqueItems);
      } catch (e) {
        console.error("[Performance Dashboard] fetch error:", e);
        setPerformanceDashboardError(
          e?.message || "Failed to load performance dashboard. Please try again."
        );
      } finally {
        setPerformanceDashboardLoading(false);
      }
    };

    fetchPerformanceDashboardData();
  }, [performanceDashboardOpen]);

  const handleApprove = async (reportId) => {
    setApprovingReportId(reportId);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/${reportId}/approve`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to approve report");
      }

      // Refresh the reports list
      await fetchReports();
    } catch (err) {
      console.error("Error approving report:", err);
      toast.error("Failed to approve report. Please try again.");
    } finally {
      setApprovingReportId(null);
    }
  };

  const performDeleteReport = async (reportId) => {
    setDeletingReportId(reportId);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/${reportId}/delete`, {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      // Refresh the reports list
      await fetchReports();
    } catch (err) {
      console.error("Error deleting report:", err);
      toast.error("Failed to delete report. Please try again.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const handleDelete = (reportId) => {
    showConfirmToast({
      message: "Delete this report?",
      description: "This will permanently delete the report from your portfolio.",
      confirmLabel: "Delete",
      onConfirm: () => performDeleteReport(reportId),
    });
  };

  const handleSend = (report) => {
    // Navigate to subscribers page with single report data
    navigate("/subscribers", { state: { report } });
  };

  const handleSendMultiple = () => {
    if (selectedReports.length === 0) {
      toast.error("Please select at least one approved report to send.");
      return;
    }

    // Get full report objects for selected IDs
    const selectedReportObjects = reports.filter(r =>
      selectedReports.includes(r._id) && r.status === "approved"
    );

    // Navigate to subscribers page with multiple reports
    navigate("/subscribers", { state: { reports: selectedReportObjects } });
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const toggleAllApprovedReports = () => {
    const approvedReportIds = filteredReports
      .filter(r => r.status === "approved")
      .map(r => r._id);

    const allSelected = approvedReportIds.length > 0 &&
      approvedReportIds.every(id => selectedReports.includes(id));

    if (allSelected) {
      setSelectedReports(prev => prev.filter(id => !approvedReportIds.includes(id)));
    } else {
      setSelectedReports(prev => {
        const newSelections = [...prev];
        approvedReportIds.forEach(id => {
          if (!newSelections.includes(id)) {
            newSelections.push(id);
          }
        });
        return newSelections;
      });
    }
  };

  const handlePreview = async (report) => {
    if (!report || !report.download_url) {
      toast.error("Report URL not available");
      return;
    }

    try {
      setPreviewLoading(true);
      setPreviewReport(report);
    } catch (err) {
      console.error("Error opening preview:", err);
      toast.error("Failed to open preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewClose = () => {
    setPreviewReport(null);
    setPreviewMode("pdf"); // Reset to PDF mode when closing
  };

  const handleEditReport = () => {
    setPreviewMode("edit");
  };

  const handleSaveAndReturnToPdf = async () => {
    // This will be called from ReportEditorModal after save
    await fetchReports(); // Refresh reports list first
    setPreviewMode("pdf"); // Then switch to PDF view (this will trigger PDF refresh)
  };


  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  // Helper function to compare dates (ignoring time)
  const isSameDate = (reportDate, selectedDateString) => {
    if (!reportDate || !selectedDateString) return false;

    // Convert report date to YYYY-MM-DD format for comparison
    const reportDateObj = new Date(reportDate);
    const reportDateStr = reportDateObj.toISOString().split('T')[0];

    // Compare date strings directly
    return reportDateStr === selectedDateString;
  };

  // Clear selected reports when filter changes away from approved
  useEffect(() => {
    if (filter !== "approved") {
      setSelectedReports([]);
    }
  }, [filter]);

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === "all" || report.status === filter;
    const matchesSearch = searchQuery === "" ||
      report.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate === "" || isSameDate(report.created_at, selectedDate);
    return matchesFilter && matchesSearch && matchesDate;
  });

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)] overflow-y-auto">

      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text)]">
              Portfolio
            </h1>
            {/* <p className="text-lg text-[var(--text-muted)] mt-2">
              Manage your researched companies and generated reports.
            </p> */}
          </div>

          <div className="flex items-center gap-3">
            {/* Performance Dashboard Button */}
            <button
              onClick={openPerformanceDashboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
              title="Performance Dashboard"
            >
              <IoTrendingUpOutline className="w-5 h-5 text-[var(--accent)]" />
              <span className="text-sm font-medium hidden sm:inline">Performance Dashboard</span>
            </button>

          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-[var(--bg)] border-t border-[var(--border)] py-4 flex flex-wrap items-center justify-between gap-4 px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-5 py-2.5 text-sm font-bold transition ${filter === "all"
              ? "bg-[var(--accent)] text-white hover:opacity-90"
              : "border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--hover)]"
              }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${filter === "pending"
              ? "bg-[var(--accent)] text-white hover:opacity-90"
              : "border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--hover)]"
              }`}
          >
            Pending Approval ({reports.filter(r => r.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("approved")}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition ${filter === "approved"
              ? "bg-[var(--accent)] text-white hover:opacity-90"
              : "border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text)] hover:bg-[var(--hover)]"
              }`}
          >
            Approved ({reports.filter(r => r.status === "approved").length})
          </button>

          {/* Send Multiple Button - Only show when approved filter is active */}
          {filter === "approved" && (
            <button
              onClick={handleSendMultiple}
              disabled={selectedReports.length === 0}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition ${selectedReports.length > 0
                ? "bg-[var(--accent)] text-[var(--bg)] hover:opacity-90"
                : "bg-[var(--hover)] text-[var(--text-muted)] cursor-not-allowed"
                }`}
            >
              <HiShoppingCart className="w-5 h-5" />
              Send {selectedReports.length > 0 && `(${selectedReports.length})`}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by company or report title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 md:w-80 rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-all"
          />
          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl bg-[var(--card-bg)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-all"
          />

        </div>
      </div>

      {/* Reports List */}
      <div className="px-6 pb-8 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            Loading reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            {searchQuery || selectedDate
              ? "No reports found matching your filters."
              : "No reports yet. Generate a report from the chatbot to see it here."}
          </div>
        ) : (
          filteredReports.map((report) => (
            <ReportCard
              key={report._id}
              report={report}
              isSelected={selectedReports.includes(report._id)}
              onToggleSelect={() => toggleReportSelection(report._id)}
              onApprove={() => handleApprove(report._id)}
              onDelete={() => handleDelete(report._id)}
              onPreview={() => handlePreview(report)}
              onSend={() => handleSend(report)}
              formatDate={formatDate}
              filter={filter}
              approvingReportId={approvingReportId}
              deletingReportId={deletingReportId}
            />
          ))
        )}
      </div>

      {/* PDF Preview Modal or Editor Modal */}
      {previewReport && (
        previewMode === "pdf" ? (
          <PdfPreviewModal
            report={previewReport}
            onClose={handlePreviewClose}
            onEdit={handleEditReport}
          />
        ) : (
          <ReportEditorModal
            report={previewReport}
            onClose={handlePreviewClose}
            onSave={handleSaveAndReturnToPdf}
            onCancel={() => setPreviewMode("pdf")}
          />
        )
      )}

      {/* Performance Dashboard Modal */}
      {performanceDashboardOpen && (
        <PerformanceDashboardModal
          onClose={closePerformanceDashboard}
          loading={performanceDashboardLoading}
          error={performanceDashboardError}
          data={performanceDashboardData}
        />
      )}

    </div>
  );
}

// PDF Preview Modal Component - Shows HTML report in preview format
function PdfPreviewModal({ report, onClose, onEdit }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (report) {
      fetchHtmlContent();
    }
  }, [report]);

  const fetchHtmlContent = async () => {
    try {
      setError(null);
      setLoading(true);

      // Extract report ID from download URL or use report_data
      let reportId = null;
      if (report.download_url) {
        const parts = report.download_url.split('/download/');
        if (parts.length > 1) {
          reportId = parts[1];
        }
      }
      // Fallback to report_data if available
      if (!reportId && report.report_data) {
        reportId = report.report_data;
      }

      if (!reportId) {
        setError("Report ID not found");
        setLoading(false);
        return;
      }

      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/edit/${reportId}`, {
        headers: {
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to load report content");
      }

      const data = await response.json();
      const bodyContent = data.html || "";

      // Construct full HTML document with styles from reportTemplate.js
      // This ensures the preview shows the report with all formatting, colors, and styling
      const fullHtmlDocument = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SageAlpha Capital | Report Preview</title>
<style>
@page {
  size: A4;
  margin: 0;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  background: #fff;
  font-family: 'Segoe UI', Roboto, sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.report-wrapper {
  width: 770px;
  margin: 0 auto;
  padding: 28px;
  box-sizing: border-box;
}

/* HEADER */
.header {
  width: 100%;
  border-bottom: 3px solid #083154;
  padding-bottom: 10px;
  margin-bottom: 12px;
}

.header-row {
  display: flex;
  justify-content: space-between;
}

.logo-text {
  font-size: 26px;
  font-weight: 800;
  font-family: Georgia, serif;
  color: #083154;
  margin: 0;
}
.logo-text span { color: #2e8b57; }
.sub-title {
  font-size: 12px;
  font-weight: 700;
  color: #083154;
  text-transform: uppercase;
}
.date-info {
  font-size: 11px;
  text-align: right;
}

/********** FIXED TWO COLUMN LAYOUT **********/
.columns-table {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
}

.col-left {
  width: 65%;
  vertical-align: top;
  padding-right: 20px;
}

.col-right {
  width: 35%;
  vertical-align: top;
  padding-left: 20px;
  border-left: 1.5px solid #e0e0e0;
}

.sidebar-col {
  page-break-inside: avoid;
  break-inside: avoid;
  -webkit-region-break-inside: avoid;
}

/********* CONTENT STYLES *********/
.company-name {
  font-size: 22px;
  font-weight: 700;
  color: #083154;
  margin-bottom: 6px;
}
.ticker {
  font-weight: 400;
  color: #666;
}
.company-subtitle {
  font-size: 13px;
  color: #555;
  font-style: italic;
  margin-bottom: 16px;
}

.section-title {
  margin-top: 20px;
  margin-bottom: 8px;
  padding-bottom: 3px;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  color: #083154;
  border-bottom: 2px solid #083154;
}

ul { padding-left: 18px; margin: 0; }
li { font-size: 12px; margin-bottom: 8px; line-height: 1.5; }

/********** SIDEBAR **********/
.recommendation-box {
  background: #eef8f2;
  border: 2px solid #2e8b57;
  border-radius: 6px;
  padding: 14px;
  text-align: center;
  margin-bottom: 18px;
}
.rating-text {
  font-size: 18px;
  font-weight: 800;
  color: #2e8b57;
}
.price-target {
  font-size: 26px;
  font-weight: 900;
  color: #083154;
}

.metric-row {
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid #e7e7e7;
}

.fin-table {
  width: 100%;
  font-size: 11px;
  border-collapse: collapse;
}
.fin-table th {
  text-align: right;
  border-bottom: 2px solid #083154;
  color: #083154;
  text-transform: uppercase;
}
.fin-table td {
  text-align: right;
  padding: 4px;
  border-bottom: 1px solid #e7e7e7;
}
.fin-table td:first-child,
.fin-table th:first-child {
  text-align: left;
  font-weight: 700;
}

/******** FOOTER ********/
.footer {
  font-size: 12px;
  text-align: left;
  margin-top: 20px;
  padding-top: 8px;
  border-top: 1px solid #d0d0d0;
  color: #555;
}

.report-image-section {
  margin-top: 24px;
  text-align: center;
  page-break-inside: avoid;
}
.report-image-section img {
  max-width: 100%;
  height: auto;
}
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;

      setHtmlContent(fullHtmlDocument);
      setLoading(false);
    } catch (err) {
      console.error("Error loading HTML:", err);
      setError("Failed to load report content. Please try again.");
      setLoading(false);
    }
  };

  const generateMarketIntelligenceHTML = (intelligenceData) => {
    const {
      ticker,
      sentiment,
      bullCase,
      bearCase,
      riskAssessment,
      dataQuality,
      analysisDate
    } = intelligenceData;

    // Get sentiment color
    const getSentimentColor = (label) => {
      const normalized = (label || "neutral").toLowerCase();
      if (normalized === "bullish" || normalized === "positive") return "#2e8b57";
      if (normalized === "bearish" || normalized === "negative") return "#dc3545";
      return "#ffc107";
    };

    const sentimentColor = getSentimentColor(sentiment.label);

    return `
<div class="section-title" style="margin-top: 30px; page-break-before: auto;">Market Intelligence</div>
<div style="margin-bottom: 20px; padding: 16px; background: #f8f9fa; border-left: 4px solid ${sentimentColor}; border-radius: 4px;">
  <div style="margin-bottom: 12px;">
    <strong style="color: #083154; font-size: 13px;">Analysis Date:</strong> 
    <span style="color: #555; font-size: 12px;">${analysisDate || 'N/A'}</span>
  </div>
  
  <div style="margin-bottom: 12px;">
    <strong style="color: #083154; font-size: 13px;">Market Sentiment:</strong> 
    <span style="color: ${sentimentColor}; font-weight: 700; font-size: 13px; text-transform: uppercase;">${sentiment.label || 'NEUTRAL'}</span>
    <span style="color: #666; font-size: 12px; margin-left: 8px;">(${(sentiment.score * 100).toFixed(1)}%)</span>
  </div>
  
  ${sentiment.summary ? `
  <div style="margin-bottom: 12px;">
    <strong style="color: #083154; font-size: 13px;">Summary:</strong>
    <p style="color: #555; font-size: 12px; margin: 4px 0 0 0; line-height: 1.5;">${sentiment.summary}</p>
  </div>
  ` : ''}

  ${!dataQuality.financialsAvailable ? `
  <div style="margin-bottom: 12px; padding: 8px; background: #fff3cd; border-left: 3px solid #ffc107; border-radius: 3px;">
    <strong style="color: #856404; font-size: 12px;">⚠ Limited Financial Data:</strong>
    <p style="color: #856404; font-size: 11px; margin: 4px 0 0 0;">${dataQuality.reason || 'Some insights are based on limited financial data.'}</p>
  </div>
  ` : ''}
</div>

${bullCase && bullCase.summary ? `
<div style="margin-bottom: 16px; padding: 14px; background: #e8f5e9; border-left: 4px solid #2e8b57; border-radius: 4px;">
  <div style="margin-bottom: 8px;">
    <strong style="color: #2e8b57; font-size: 13px;">Bull Case:</strong>
  </div>
  <p style="color: #2d5016; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">${bullCase.summary}</p>
  ${bullCase.signals && bullCase.signals.length > 0 ? `
  <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #2d5016; font-size: 11px;">
    ${bullCase.signals.slice(0, 3).map(signal => {
      const signalText = typeof signal === 'string' ? signal : signal.description || JSON.stringify(signal);
      return `<li style="margin-bottom: 4px;">${signalText}</li>`;
    }).join('')}
  </ul>
  ` : ''}
</div>
` : ''}

${bearCase && bearCase.summary ? `
<div style="margin-bottom: 16px; padding: 14px; background: #ffebee; border-left: 4px solid #dc3545; border-radius: 4px;">
  <div style="margin-bottom: 8px;">
    <strong style="color: #dc3545; font-size: 13px;">Bear Case & Risks:</strong>
  </div>
  <p style="color: #721c24; font-size: 12px; margin: 0 0 8px 0; line-height: 1.5;">${bearCase.summary}</p>
  ${bearCase.risks && bearCase.risks.length > 0 ? `
  <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #721c24; font-size: 11px;">
    ${bearCase.risks.slice(0, 3).map(risk => {
      const riskText = typeof risk === 'string' ? risk : risk.description || JSON.stringify(risk);
      return `<li style="margin-bottom: 4px;">${riskText}</li>`;
    }).join('')}
  </ul>
  ` : ''}
</div>
` : ''}

${riskAssessment ? `
<div style="margin-bottom: 16px; padding: 14px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
  <div style="margin-bottom: 8px;">
    <strong style="color: #083154; font-size: 13px;">Risk Assessment:</strong>
    <span style="color: #1976d2; font-weight: 700; font-size: 12px; margin-left: 8px; text-transform: uppercase;">${riskAssessment.overallRisk || 'UNKNOWN'}</span>
  </div>
  ${riskAssessment.suitability && riskAssessment.suitability.explanation ? `
  <p style="color: #1565c0; font-size: 12px; margin: 4px 0 0 0; line-height: 1.5;">${riskAssessment.suitability.explanation}</p>
  ${riskAssessment.suitability.warning ? `
  <p style="color: #f57c00; font-size: 11px; margin: 6px 0 0 0; font-style: italic;">⚠️ ${riskAssessment.suitability.warning}</p>
  ` : ''}
  ` : ''}
</div>
` : ''}
`;
  };

  // Inject market intelligence HTML before footer
  const injectMarketIntelligence = (html, marketIntelligenceHTML) => {
    // Indent the market intelligence HTML to match report structure (2 spaces for content inside report-wrapper)
    const indentedHTML = marketIntelligenceHTML
      .split('\n')
      .map(line => line.trim() ? '  ' + line : line)
      .join('\n');

    // Find the footer div and inject before it
    const footerPattern = /(\s*<div class="footer">)/i;
    if (footerPattern.test(html)) {
      return html.replace(footerPattern, indentedHTML + '\n\n$1');
    }
    // Fallback: if footer not found, append before closing report-wrapper
    const wrapperClosePattern = /(\s*<\/div>\s*<\/div>\s*<\/body>)/i;
    if (wrapperClosePattern.test(html)) {
      return html.replace(wrapperClosePattern, indentedHTML + '\n\n$1');
    }
    // Last resort: append at end of body
    return html.replace(/(<\/body>)/i, indentedHTML + '\n\n$1');
  };


  if (!report) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-[var(--bg)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--sidebar-bg)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              {report.company_name || report.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Report Preview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onEdit}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 transition font-bold text-sm"
            >
              Edit Report
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="Close preview"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--bg)]">
          {loading && (
            <div className="flex-1 flex items-center justify-center bg-[var(--card-bg)]">
              <div className="text-[var(--text-muted)]">Loading report...</div>
            </div>
          )}

          {error && !loading && (
            <div className="flex-1 flex items-center justify-center bg-[var(--card-bg)]">
              <div className="text-red-500 text-center p-4">{error}</div>
            </div>
          )}

          {!loading && !error && htmlContent && (
            <div
              className="w-full h-full overflow-auto"
              style={{
                backgroundColor: '#f5f5f5',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                padding: '20px'
              }}
            >
              {/* Render the full HTML document including styles in an iframe for proper isolation */}
              <iframe
                key={htmlContent.length} // Force re-render when content changes
                srcDoc={htmlContent}
                style={{
                  width: '826px', // 770px content + 56px padding (28px * 2)
                  minHeight: '1000px',
                  border: 'none',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: '4px'
                }}
                title="Report Preview"
                onLoad={(e) => {
                  // Auto-resize iframe to content height
                  try {
                    const iframe = e.target;
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    if (iframeDoc && iframeDoc.body) {
                      iframe.style.height = Math.max(iframeDoc.body.scrollHeight + 40, 1000) + 'px';
                    }
                  } catch (err) {
                    // Cross-origin or other error, use default height
                    console.log('Could not auto-resize iframe');
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// HTML Editor Modal Component
function ReportEditorModal({ report, onClose, onSave, onCancel }) {
  const [htmlContent, setHtmlContent] = useState("");
  const [originalContent, setOriginalContent] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    if (report) {
      // Extract report ID from download URL or use report_data
      let reportId = null;
      if (report.download_url) {
        const parts = report.download_url.split('/download/');
        if (parts.length > 1) {
          reportId = parts[1];
        }
      }
      // Fallback to report_data if available
      if (!reportId && report.report_data) {
        reportId = report.report_data;
      }

      if (reportId) {
        fetchHtmlContent(reportId);
      } else {
        setError("Report ID not found");
        setLoading(false);
      }
    }
  }, [report]);

  // Function to add CSS styles to HTML if not present
  const ensureImageStyles = (html) => {
    const styles = `<style>
  .report-image-section {
    margin-top: 24px;
    text-align: center;
    page-break-inside: avoid;
  }
  .report-image-section img {
    max-width: 100%;
    height: auto;
  }
</style>`;

    // Check if styles already exist
    if (html.includes('.report-image-section {')) {
      return html; // Styles already present
    }

    // Only add styles if image section exists
    if (html.includes('report-image-section')) {
      // Insert styles in head or at the beginning
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${styles}\n`);
      } else if (html.includes('</head>')) {
        html = html.replace('</head>', `\n${styles}\n</head>`);
      } else {
        // No head tag, add at the beginning before any content
        html = styles + '\n' + html;
      }
    }
    return html;
  };

  // Decode HTML entities (e.g., &amp; -> &)
  const decodeHtml = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Escape HTML entities for safe insertion
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Parse HTML into sections with editable content
  const parseHtmlIntoSections = (html) => {
    const sections = [];
    const sectionTitles = [
      'Investment Thesis',
      'Key Highlights',
      'Valuation Methodology',
      'Catalysts',
      'Risks'
    ];

    sectionTitles.forEach((title) => {
      // Find the section title using regex
      const titleRegex = new RegExp(`<div[^>]*class="section-title"[^>]*>\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</div>`, 'i');
      const titleMatch = html.match(titleRegex);

      if (titleMatch) {
        const titleEndIndex = titleMatch.index + titleMatch[0].length;
        const afterTitle = html.substring(titleEndIndex);

        // Find the next <ul> tag
        const ulMatch = afterTitle.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);

        if (ulMatch) {
          const ulContent = ulMatch[1];
          // Extract all <li> items
          const liMatches = ulContent.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          const items = [];

          for (const liMatch of liMatches) {
            const liContent = liMatch[1].trim();
            // Check if it has a bold label (like <b>Method:</b> content)
            const labelMatch = liContent.match(/<b>([^<]+):<\/b>\s*(.+)/i);

            if (labelMatch) {
              // For sections with labels (Valuation Methodology, Catalysts, Risks)
              // Decode HTML entities in both label and content
              items.push({
                id: `${title}-${items.length}`,
                label: decodeHtml(labelMatch[1].trim()),
                content: decodeHtml(labelMatch[2].trim()),
                hasLabel: true
              });
            } else {
              // For simple list items (Investment Thesis, Key Highlights)
              // Remove any HTML tags for content and decode entities
              const textContent = liContent.replace(/<[^>]+>/g, '').trim();
              items.push({
                id: `${title}-${items.length}`,
                content: decodeHtml(textContent),
                hasLabel: false
              });
            }
          }

          if (items.length > 0) {
            sections.push({
              title,
              items,
              originalHtml: ulMatch[0]
            });
          }
        }
      }
    });

    return { sections, fullHtml: html };
  };


  // Reconstruct HTML from edited sections
  const reconstructHtmlFromSections = (originalHtml, editedSections) => {
    let updatedHtml = originalHtml;

    editedSections.forEach((editedSection) => {
      const title = editedSection.title;
      // Find the section title
      const titleRegex = new RegExp(`<div[^>]*class="section-title"[^>]*>\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</div>`, 'i');
      const titleMatch = updatedHtml.match(titleRegex);

      if (titleMatch) {
        const titleEndIndex = titleMatch.index + titleMatch[0].length;
        const beforeTitle = updatedHtml.substring(0, titleEndIndex);
        const afterTitle = updatedHtml.substring(titleEndIndex);

        // Find the <ul> tag that follows (non-greedy match)
        const ulMatch = afterTitle.match(/(<ul[^>]*>)([\s\S]*?)(<\/ul>)/i);

        if (ulMatch) {
          const ulStartTag = ulMatch[1]; // <ul> or <ul class="...">
          const ulEndTag = ulMatch[3]; // </ul>

          // Build new <ul> content with edited items
          // Preserve original indentation by matching the pattern

          const indentMatch = ulMatch[2].match(/^(\s*)/);
          const indent = indentMatch ? indentMatch[1] : '        ';

          const newItemsHtml = editedSection.items.map(item => {
            if (item.hasLabel && item.label) {
              // Escape HTML entities in content, but keep label as-is since it's simple text
              const escapedContent = item.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
              return `${indent}<li><b>${item.label}:</b> ${escapedContent}</li>`;
            } else {
              // Escape HTML entities in content
              const escapedContent = item.content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
              return `${indent}<li>${escapedContent}</li>`;
            }
          }).join('\n');

          const newUl = `${ulStartTag}\n${newItemsHtml}\n${indent}${ulEndTag}`;

          // Replace the old <ul> with the new one
          updatedHtml = beforeTitle + afterTitle.replace(ulMatch[0], newUl);
        }
      }
    });

    return updatedHtml;
  };


  const fetchHtmlContent = async (reportId) => {
    try {
      setError(null);
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/edit/${reportId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Failed to load report content");
      }

      const data = await response.json();
      let loadedHtml = data.html || "";
      // Ensure styles are added if image section exists
      if (loadedHtml.includes('report-image-section')) {
        loadedHtml = ensureImageStyles(loadedHtml);
      }
      setHtmlContent(loadedHtml);
      setOriginalContent(loadedHtml);

      // Parse HTML into sections
      const { sections: parsedSections } = parseHtmlIntoSections(loadedHtml);
      setSections(parsedSections);

      setLoading(false);
    } catch (err) {
      console.error("Error loading HTML:", err);
      setError("Failed to load report content. Please try again.");
      setLoading(false);
    }
  };

  const handleSectionChange = (sectionIndex, itemIndex, field, value) => {
    const updatedSections = [...sections];
    if (field === 'content') {
      updatedSections[sectionIndex].items[itemIndex].content = value;
    } else if (field === 'label') {
      updatedSections[sectionIndex].items[itemIndex].label = value;
    }
    setSections(updatedSections);

    // Reconstruct HTML from sections only
    const reconstructedHtml = reconstructHtmlFromSections(originalContent, updatedSections);
    setHtmlContent(reconstructedHtml);
  };

  const handleSave = async () => {
    if (!report) return;

    // Extract report ID from download URL or use report_data
    let reportId = null;
    if (report.download_url) {
      const parts = report.download_url.split('/download/');
      if (parts.length > 1) {
        reportId = parts[1];
      }
    }
    // Fallback to report_data if available
    if (!reportId && report.report_data) {
      reportId = report.report_data;
    }

    if (!reportId) {
      setError("Report ID not found");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      // Reconstruct HTML from current sections only
      const finalHtml = reconstructHtmlFromSections(originalContent, sections);

      const response = await fetch(`${CONFIG.API_BASE_URL}/reports/edit/${reportId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ html: finalHtml })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save report");
      }

      const data = await response.json();
      setOriginalContent(finalHtml);
      setHtmlContent(finalHtml);
      setSaveSuccess(true);

      // Refresh reports list and return to PDF view immediately
      if (onSave) {
        // Small delay to show success message, then return to PDF
        setTimeout(async () => {
          await onSave();
        }, 1500);
      }
    } catch (err) {
      console.error("Error saving report:", err);
      setError(err.message || "Failed to save report. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = htmlContent !== originalContent;

  // Function to insert or update image in HTML
  const insertImageIntoHtml = (base64Image) => {
    const imageHtml = `<div class="report-image-section">
  <img src="${base64Image}" />
</div>`;

    let updatedHtml = htmlContent;

    // Check if report-wrapper exists
    if (!updatedHtml.includes('class="report-wrapper"')) {
      // If no report-wrapper, wrap the entire content
      updatedHtml = `<div class="report-wrapper">\n${updatedHtml}\n</div>`;
    }

    // Check if report-image-section already exists
    const imageSectionRegex = /<div class="report-image-section">[\s\S]*?<\/div>/;

    if (imageSectionRegex.test(updatedHtml)) {
      // Replace existing image section
      updatedHtml = updatedHtml.replace(imageSectionRegex, imageHtml);
    } else {
      // Find the closing tag of report-wrapper
      const wrapperMatch = updatedHtml.match(/<div class="report-wrapper">([\s\S]*?)<\/div>/);
      if (wrapperMatch) {
        // Insert image before the closing </div> of report-wrapper
        const contentInsideWrapper = wrapperMatch[1];
        updatedHtml = updatedHtml.replace(
          /<div class="report-wrapper">([\s\S]*?)<\/div>/,
          `<div class="report-wrapper">$1\n${imageHtml}\n</div>`
        );
      } else {
        // Fallback: append at the end
        updatedHtml = updatedHtml + '\n' + imageHtml;
      }
    }

    // Ensure styles are present
    updatedHtml = ensureImageStyles(updatedHtml);

    setHtmlContent(updatedHtml);
  };

  const handleImageInsert = () => {
    fileInputRef.current?.click();
  };

  const handleImageFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please select a PNG, JPG, JPEG, or WEBP image.');
      return;
    }

    // Validate file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      setError('Image size exceeds 1MB limit. Please select a smaller image.');
      return;
    }

    // Convert to Base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Image = e.target.result;
      // Insert/update image (this function also handles styles)
      insertImageIntoHtml(base64Image);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!report) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-[var(--bg)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--sidebar-bg)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              {report.company_name || report.title}
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Edit Report Content
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Close editor"
          >
            <IoClose className="w-6 h-6" />
          </button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-[var(--text-muted)]">Loading report content...</div>
            </div>
          )}

          {error && !loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-red-500 text-center p-4">{error}</div>
            </div>
          )}

          {!loading && !error && (
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* Toolbar */}
              <div className="p-4 border-b border-[var(--border)] bg-[var(--sidebar-bg)] flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-xs text-yellow-600 font-medium">● Unsaved changes</span>
                  )}
                  {saveSuccess && (
                    <span className="text-xs text-blue-600 font-medium">✓ Saved successfully</span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  Edit content sections below
                </div>
              </div>

              {/* Sections Editor */}
              <div className="flex-1 p-6 space-y-8 overflow-y-auto">
                {/* Main Content Sections */}
                {sections.length > 0 ? (
                  sections.map((section, sectionIndex) => (
                    <div key={section.title} className="border border-[var(--border)] rounded-lg p-6 bg-[var(--card-bg)]">
                      {/* Section Title - Uneditable */}
                      <div className="mb-4 pb-2 border-b-2 border-[var(--accent)]">
                        <h3 className="text-base font-bold text-[var(--accent)] uppercase">
                          {section.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Edit the content below. Section heading cannot be changed.
                        </p>
                      </div>

                      {/* Editable Items */}
                      <div className="space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div key={item.id} className="space-y-2">
                            {item.hasLabel ? (
                              <>
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-semibold text-[var(--text)] min-w-[120px]">
                                    Label:
                                  </label>
                                  <input
                                    type="text"
                                    value={item.label || ''}
                                    onChange={(e) => handleSectionChange(sectionIndex, itemIndex, 'label', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    placeholder="Label (e.g., DCF, P/E Ratio)"
                                  />
                                </div>
                                <div className="flex items-start gap-2">
                                  <label className="text-sm font-semibold text-[var(--text)] min-w-[120px] mt-2">
                                    Content:
                                  </label>
                                  <textarea
                                    value={item.content || ''}
                                    onChange={(e) => handleSectionChange(sectionIndex, itemIndex, 'content', e.target.value)}
                                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[60px] resize-y"
                                    placeholder="Enter content..."
                                  />
                                </div>
                              </>
                            ) : (
                              <textarea
                                value={item.content || ''}
                                onChange={(e) => handleSectionChange(sectionIndex, itemIndex, 'content', e.target.value)}
                                className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[60px] resize-y"
                                placeholder="Enter content..."
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-[var(--text-muted)] py-12">
                    No editable sections found in this report.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Save and Download buttons */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--sidebar-bg)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel || onClose}
              className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--hover)] transition"
            >
              {onCancel ? "Cancel" : "Close"}
            </button>
            {report.download_url && (
              <button
                onClick={() => {
                  let reportId = null;
                  if (report.download_url) {
                    const parts = report.download_url.split('/download/');
                    if (parts.length > 1) reportId = parts[1];
                  }
                  if (!reportId && report.report_data) reportId = report.report_data;

                  if (reportId) {
                    const finalUrl = `${CONFIG.API_BASE_URL}/reports/download/${reportId}`;
                    console.log("[PDF Download] Opening:", finalUrl);
                    window.open(finalUrl, "_blank", "noopener,noreferrer");
                  } else {
                    toast.error("Could not determine report ID for download");
                  }
                }}
                className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] hover:bg-[var(--hover)] transition font-bold"
              >
                Download PDF
              </button>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges || loading}
            className={`px-6 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition font-bold ${saving || !hasChanges || loading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report, isSelected, onToggleSelect, onApprove, onDelete, onPreview, onSend, formatDate, filter, approvingReportId, deletingReportId }) {
  const isApproved = report.status === "approved";
  const companyName = report.company_name || report.title.replace("Equity Research Note – ", "").trim();
  const isApproving = approvingReportId === report._id;
  const isDeleting = deletingReportId === report._id;

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 shadow-sm hover:border-[var(--accent)] transition-all">

      {/* Left */}
      <div className="flex items-center gap-5">
        {/* Checkbox - Only show for approved reports and when NOT on "All Reports" tab */}
        {isApproved && filter !== "all" && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="h-5 w-5 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer"
          />
        )}
        <div 
          onClick={report.download_url ? onPreview : undefined}
          className={`${report.download_url ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
          <h3 className="text-lg font-bold text-[var(--text)] leading-none">{companyName}</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1.5">{report.title}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1 opacity-70">
            Created on {formatDate(report.created_at)}
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${isApproved
            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
            : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            }`}
        >
          {report.status === "approved" ? "Approved" : "Pending"}
        </span>

        <div className="flex items-center gap-2">
          {report.download_url && (
            <button
              onClick={onPreview}
              className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all"
              title="Preview report"
              aria-label="Preview report"
            >
              <IoEyeOutline className="w-5 h-5" />
            </button>
          )}

          {!isApproved ? (
            <button
              onClick={onApprove}
              disabled={isApproving || isDeleting}
              className="p-2.5 rounded-lg text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Approve report"
              aria-label="Approve report"
            >
              {isApproving ? (
                <Spinner size="sm" />
              ) : (
                <IoCheckmarkCircle className="w-5 h-5" />
              )}
            </button>
          ) : (
            <button
              onClick={() => onSend(report)}
              className="p-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 transition-all"
              title="Send report"
              aria-label="Send report"
            >
              <IoPaperPlaneOutline className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onDelete}
            disabled={isDeleting || isApproving}
            className="p-2.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete report"
            aria-label="Delete report"
          >
            {isDeleting ? (
              <Spinner size="sm" />
            ) : (
              <IoTrashOutline className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PerformanceDashboardModal({ onClose, loading, error, data }) {
  const formatDateSafe = (dateValue) => {
    if (!dateValue) return "—";
    const d = new Date(dateValue);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price) || typeof price !== 'number') {
      return "—";
    }
    return `₹${price.toFixed(2)}`;
  };

  const formatPerformance = (performance) => {
    if (performance === null || performance === undefined || isNaN(performance) || typeof performance !== 'number') {
      return "—";
    }
    const sign = performance >= 0 ? "+" : "";
    return `${sign}${performance.toFixed(2)}%`;
  };

  const getPerformanceColor = (performance) => {
    if (performance === null || performance === undefined) return "text-[var(--text-muted)]";
    if (performance > 0) return "text-green-600 dark:text-green-400";
    if (performance < 0) return "text-red-600 dark:text-red-400";
    return "text-[var(--text)]";
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--sidebar-bg)] flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)]">Performance Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Close Performance Dashboard"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-[var(--text-muted)]">Loading performance data...</div>
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 text-center py-12">
              {error}
              <div className="mt-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-[var(--hover)] text-[var(--text)] font-bold text-sm hover:opacity-90 transition"
                >
                  Close
                </button>
              </div>
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              No portfolio items found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[var(--border)] rounded-xl overflow-hidden">
                <thead className="bg-[var(--sidebar-bg)]">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Company Name
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Approved Date
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Recommended Price
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Target Price
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Current Date Price
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[var(--text)] border-b border-[var(--border)]">
                      Performance (%)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index} className="hover:bg-[var(--hover)]/30 transition-colors">
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="font-semibold text-[var(--text)]">
                          {item.companyName || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="text-[var(--text)]">
                          {formatDateSafe(item.approvedDate)}
                            </div>
                      </td>
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="text-[var(--text)]">
                          {formatPrice(item.recommendedPrice)}
                            </div>
                      </td>
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="text-[var(--text)]">
                          {formatPrice(item.targetPrice)}
                          </div>
                      </td>
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className="text-[var(--text)]">
                          {formatPrice(item.currentPrice)}
                        </div>
                      </td>
                      <td className="px-4 py-4 border-b border-[var(--border)]">
                        <div className={`font-semibold ${getPerformanceColor(item.performance)}`}>
                          {formatPerformance(item.performance)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;

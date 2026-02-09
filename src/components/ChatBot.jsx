import React, { useState, useEffect, useRef } from "react";
import { IoDocumentText, IoCheckmark, IoTrendingUp, IoShieldCheckmark, IoSparkles, IoArrowForward } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import CONFIG from "../config";
import Spinner from "./Spinner";
import { toast } from "sonner";
import EmailModal from "./EmailModal";
import { getDemoHeaders } from "../utils/demoId";

function ChatBot() {
  const [tickerInput, setTickerInput] = useState("");
  const [reportContent, setReportContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);
  const reportRef = useRef(null);
  const navigate = useNavigate();

  // Fetch usage status function (reusable)
  const fetchUsageStatus = async () => {
    try {
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/usage/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...demoHeaders
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        const chatUsage = data.chat?.usageCount || 0;
        setUsageCount(chatUsage);
        
        if (chatUsage >= 5) {
          setIsUsageLimitReached(true);
        } else {
          setIsUsageLimitReached(false);
        }
      }
    } catch (error) {
      console.error("Error fetching usage status:", error);
    }
  };

  // Fetch usage status on component mount
  useEffect(() => {
    fetchUsageStatus();
  }, []);

  // Scroll to report when generated
  useEffect(() => {
    if (reportContent && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [reportContent]);

  // Render message content (for displaying reports)
  const renderMessageContent = (content) => {
    if (typeof content !== 'string') return content;

    const lines = content.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;

    const processText = (text) => {
      if (!text) return null;
      const parts = [];

      // Process markdown links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let lastIndex = 0;
      let match;
      const linkMatches = [];

      while ((match = linkRegex.exec(text)) !== null) {
        linkMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[1],
          url: match[2]
        });
      }

      // Process bold text **text** or __text__
      const boldRegex = /\*\*([^*]+)\*\*|__([^_]+)__/g;
      const boldMatches = [];
      while ((match = boldRegex.exec(text)) !== null) {
        boldMatches.push({
          index: match.index,
          length: match[0].length,
          text: match[1] || match[2]
        });
      }

      const allMatches = [
        ...linkMatches.map(m => ({ ...m, type: 'link' })),
        ...boldMatches.map(m => ({ ...m, type: 'bold' }))
      ].sort((a, b) => a.index - b.index);

      const filteredMatches = [];
      let currentEnd = 0;
      for (const m of allMatches) {
        if (m.index >= currentEnd) {
          filteredMatches.push(m);
          currentEnd = m.index + m.length;
        }
      }

      lastIndex = 0;
      filteredMatches.forEach((m, idx) => {
        if (m.index > lastIndex) {
          parts.push(text.substring(lastIndex, m.index));
        }
        if (m.type === 'link') {
          const isDownloadLink = m.url.includes('/reports/download/');
          if (isDownloadLink) {
            const urlParts = m.url.split('/reports/download/');
            const reportId = urlParts[1];
            parts.push(
              <button
                key={`link-${idx}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedReportId(reportId);
                  setEmailModalOpen(true);
                }}
                className="text-[var(--accent)] underline font-bold hover:brightness-110 inline-block"
              >
                {m.text}
              </button>
            );
          } else {
            parts.push(
              <a
                key={`link-${idx}`}
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline font-bold hover:brightness-110"
              >
                {m.text}
              </a>
            );
          }
        } else if (m.type === 'bold') {
          parts.push(<strong key={`bold-${idx}`}>{m.text}</strong>);
        }
        lastIndex = m.index + m.length;
      });

      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    };

    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();

      // Handle headers
      if (trimmedLine.match(/^#{1,6}\s+/)) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-sm">{processText(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }

        const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
        if (headerMatch) {
          const level = Math.min(headerMatch[1].length, 6);
          const headerText = headerMatch[2].trim();
          const className = `font-bold ${level === 1 ? 'text-lg mt-4 mb-2' : level === 2 ? 'text-base mt-3 mb-2' : 'text-sm mt-2 mb-1'}`;
          const headerTag = `h${level}`;
          elements.push(
            React.createElement(
              headerTag,
              { key: `header-${lineIdx}`, className },
              processText(headerText)
            )
          );
        }
        return;
      }

      // Handle list items
      if (trimmedLine.match(/^[-*]\s+/) || trimmedLine.match(/^\d+\.\s+/)) {
        const listText = trimmedLine.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '');
        listItems.push(listText);
        inList = true;
        return;
      }

      // Handle horizontal rule
      if (trimmedLine.match(/^---+$/)) {
        if (inList && listItems.length > 0) {
          elements.push(
            <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
              {listItems.map((item, idx) => (
                <li key={idx} className="text-sm">{processText(item)}</li>
              ))}
            </ul>
          );
          listItems = [];
          inList = false;
        }
        elements.push(<hr key={`hr-${lineIdx}`} className="my-3 border-[var(--border)]" />);
        return;
      }

      // Regular paragraph
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${lineIdx}`} className="list-disc list-inside space-y-1 my-2 ml-4">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-sm">{processText(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }

      if (trimmedLine) {
        elements.push(
          <p key={`para-${lineIdx}`} className="text-sm my-2 leading-relaxed">
            {processText(trimmedLine)}
          </p>
        );
      } else if (lineIdx > 0 && lines[lineIdx - 1].trim()) {
        elements.push(<br key={`br-${lineIdx}`} />);
      }
    });

    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-final`} className="list-disc list-inside space-y-1 my-2 ml-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm">{processText(item)}</li>
          ))}
        </ul>
      );
    }

    return elements.length > 0 ? elements : content;
  };

  // Handle report generation (preserved from original)
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    const tickerToSend = tickerInput.trim();
    if (!tickerToSend || loading || isUsageLimitReached) return;

    setLoading(true);
    setReportContent(null);

    try {
      const url = `${CONFIG.API_BASE_URL}/chat/create-report`;
      const body = { company_name: tickerToSend, session_id: sessionId };

      const demoHeaders = getDemoHeaders();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...demoHeaders
        },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        let errorCode = null;
        try {
          const errorData = await response.json();
          errorCode = errorData.code;
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          if (errorCode === "USAGE_LIMIT_REACHED") {
            setIsUsageLimitReached(true);
            setUsageCount(5);
            toast.error("You've reached the free usage limit. Upgrade to continue.");
            return;
          }
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();

      if (data.code === "USAGE_LIMIT_REACHED") {
        setIsUsageLimitReached(true);
        setUsageCount(5);
        toast.error("You've reached the free usage limit. Upgrade to continue.");
        return;
      }

      if (data.success && data.response) {
        setReportContent(data.response);
        if (data.session_id) setSessionId(data.session_id);
        fetchUsageStatus();
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error("Unexpected response format.");
      }
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Success stories data
  const successStories = [
    {
      quote: "SageAlpha helped me understand ICICI Bank's financials before investing. The report was clear and easy to follow.",
      author: "Retail Investor",
      location: "Mumbai"
    },
    {
      quote: "As an independent analyst, I use SageAlpha to quickly generate research reports. Saves me hours of work.",
      author: "Independent Analyst",
      location: "Delhi"
    },
    {
      quote: "The AI-powered insights are impressive. I can now make informed investment decisions faster.",
      author: "Individual Investor",
      location: "Bangalore"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text)] mb-4 sm:mb-6">
            Confused about which stock to buy?
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
            Enter any stock ticker and receive a clear, AI-powered equity research report covering fundamentals, risks, and market outlook.
          </p>

          {/* Primary CTA */}
          <form onSubmit={handleGenerateReport} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-[var(--card-bg)] rounded-2xl p-2 sm:p-3 border-2 border-[var(--border)] shadow-lg">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 sm:py-4 bg-[var(--bg)] rounded-xl">
                <IoDocumentText className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent)] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Enter ticker (e.g. TATA, INFY, ICICI)"
                  value={tickerInput}
                  onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                  disabled={loading || isUsageLimitReached}
                  className="flex-1 bg-transparent text-base sm:text-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <button
                type="submit"
                disabled={!tickerInput.trim() || loading || isUsageLimitReached}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[var(--accent)] text-white font-bold text-base sm:text-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" className="border-white/30 border-t-white" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    Get Equity Report
                    <IoArrowForward className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Usage Counter */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`text-xs sm:text-sm font-medium ${usageCount >= 5 ? 'text-red-500' : usageCount >= 4 ? 'text-orange-500' : 'text-[var(--text-muted)]'}`}>
                Uses: {usageCount} / 5
              </span>
            </div>

            {/* Usage Limit Message */}
            {isUsageLimitReached && (
              <div className="mt-4 max-w-md mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <p className="text-sm text-red-600 font-medium flex-1">
                    You've reached the free usage limit. Upgrade to continue.
                  </p>
                  <button
                    onClick={() => navigate("/plans")}
                    className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Report Display Section */}
      {reportContent && (
        <section ref={reportRef} className="py-8 sm:py-12 px-4 sm:px-6 bg-[var(--card-bg)] border-y border-[var(--border)]">
          <div className="max-w-4xl mx-auto">
            <div className="bg-[var(--bg)] rounded-2xl p-6 sm:p-8 shadow-lg">
              <div className="mb-6 pb-4 border-b border-[var(--border)]">
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--text)] mb-2">
                  Equity Research Report
                </h2>
                <p className="text-sm text-[var(--text-muted)]">
                  Generated for: <span className="font-semibold text-[var(--text)]">{tickerInput}</span>
                </p>
              </div>
              <div className="prose prose-sm max-w-none text-[var(--text)]">
                {renderMessageContent(reportContent)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust & Value Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-[var(--text)] mb-8 sm:mb-12">
            Why SageAlpha?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                <IoCheckmark className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-2">No Jargon</h3>
              <p className="text-sm text-[var(--text-muted)]">Clear, investor-friendly language</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                <IoTrendingUp className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-2">Research-Style Insights</h3>
              <p className="text-sm text-[var(--text-muted)]">Professional-grade analysis</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                <IoShieldCheckmark className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-2">Designed for Real Investors</h3>
              <p className="text-sm text-[var(--text-muted)]">Built with your needs in mind</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-xl p-6 border border-[var(--border)] text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                <IoSparkles className="w-6 h-6 text-[var(--accent)]" />
              </div>
              <h3 className="font-bold text-[var(--text)] mb-2">AI-Powered</h3>
              <p className="text-sm text-[var(--text-muted)]">Instant, accurate analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[var(--card-bg)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-[var(--text)] mb-8 sm:mb-12">
            Trusted by investors and analysts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {successStories.map((story, idx) => (
              <div key={idx} className="bg-[var(--bg)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
                <p className="text-sm sm:text-base text-[var(--text)] mb-4 leading-relaxed italic">
                  "{story.quote}"
                </p>
                <div className="pt-4 border-t border-[var(--border)]">
                  <p className="font-semibold text-sm text-[var(--text)]">{story.author}</p>
                  <p className="text-xs text-[var(--text-muted)]">{story.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center text-[var(--text)] mb-8 sm:mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                1
              </div>
              <h3 className="font-bold text-lg text-[var(--text)] mb-2">Enter Stock Ticker</h3>
              <p className="text-sm text-[var(--text-muted)]">Type any company ticker symbol</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                2
              </div>
              <h3 className="font-bold text-lg text-[var(--text)] mb-2">AI Analyzes</h3>
              <p className="text-sm text-[var(--text-muted)]">Our AI processes company data</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                3
              </div>
              <h3 className="font-bold text-lg text-[var(--text)] mb-2">Get Report</h3>
              <p className="text-sm text-[var(--text-muted)]">Receive ready-to-read equity research</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[var(--card-bg)]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text)] mb-4">
            Ready to analyze a stock?
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-muted)] mb-8">
            Get instant equity research on any company
          </p>
          <form onSubmit={handleGenerateReport} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="Enter ticker (e.g. TATA, INFY, ICICI)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
              disabled={loading || isUsageLimitReached}
              className="flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-xl bg-[var(--bg)] border-2 border-[var(--border)] text-base sm:text-lg text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!tickerInput.trim() || loading || isUsageLimitReached}
              className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[var(--accent)] text-white font-bold text-base sm:text-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="border-white/30 border-t-white" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  Get Report
                  <IoArrowForward className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <footer className="py-6 px-4 sm:px-6 border-t border-[var(--border)]">
        <p className="text-xs text-center text-[var(--text-muted)] max-w-2xl mx-auto">
          SageAlpha.ai may produce inaccurate information. Always verify important financial data.
        </p>
      </footer>

      {/* Email Modal */}
      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedReportId(null);
        }}
        reportId={selectedReportId}
      />
    </div>
  );
}

export default ChatBot;

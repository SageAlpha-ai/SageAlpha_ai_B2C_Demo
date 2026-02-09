import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CONFIG from "../config";
import { IoSearch, IoSparkles, IoClose } from "react-icons/io5";
import { getDemoHeaders } from "../utils/demoId";

function MarketChatter() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [usageCount, setUsageCount] = useState(0);
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setError("Please enter a company name or ticker");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Call backend endpoint which proxies to Azure Market Chatter AI
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/market-chatter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...demoHeaders
        },
        credentials: "include",
        body: JSON.stringify({
          query: companyName.trim(),
          lookback_hours: 24,
          max_results: 20
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle usage limit error
        if (errorData.code === "USAGE_LIMIT_REACHED") {
          setIsUsageLimitReached(true);
          setUsageCount(5); // Set to max to show limit reached
          setError("You've reached the free usage limit. Upgrade to continue using SageAlpha services.");
          return;
        }
        
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Validate response structure (must have status: success and claims array)
      if (result.status !== "success") {
        throw new Error(result.message || "API returned an error");
      }

      if (!result.claims || !Array.isArray(result.claims)) {
        throw new Error("Invalid response structure: claims array missing");
      }

      // Refetch usage status to get updated count from backend
      fetchUsageStatus();
      
      setData(result);
    } catch (err) {
      console.error("Error fetching market chatter:", err);
      setError(err.message || "Failed to fetch market chatter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        // Update usage count for market chatter
        const marketUsage = data.market?.usageCount || 0;
        setUsageCount(marketUsage);
        
        // Check if limit is reached
        if (marketUsage >= 5) {
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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateString;
    }
  };

  const getStanceColor = (stance) => {
    switch (stance?.toLowerCase()) {
      case 'bullish': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'bearish': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const StanceIndicator = ({ stance }) => {
    const styles = getStanceColor(stance);
    return (
      <div className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 ${styles} transition-all`}>
        <span className="text-xs uppercase tracking-widest font-bold opacity-80 mb-2">Market Stance</span>
        <span className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
          {stance || "NEUTRAL"}
        </span>
      </div>
    );
  };



  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] overflow-hidden font-sans">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--card-bg)] border-b border-[var(--border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center border border-[var(--accent)]/20">
              <IoSparkles className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">Market Chatter</h1>
              <p className="text-xs text-[var(--text-muted)]">Real-time AI Market Intelligence</p>
            </div>
          </div>

          {/* Search Bar - Compact in Header */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-lg w-full md:ml-auto">
            <div className="relative group">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Search ticker or company (e.g. AAPL, NVIDIA)..."
                className="w-full pl-9 pr-32 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || isUsageLimitReached}
              />
              
              {/* Usage Counter */}
              <div className="absolute top-1 right-20 flex items-center">
                <span className={`
                  text-[10px] sm:text-xs font-medium
                  ${usageCount >= 5 ? 'text-red-500' : usageCount >= 4 ? 'text-orange-500' : 'text-[var(--text-muted)]'}
                `}>
                  Uses: {usageCount} / 5
                </span>
              </div>
              
              <button
                type="submit"
                disabled={loading || !companyName.trim() || isUsageLimitReached}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-md bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {loading ? "..." : "Analyze"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {error && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              isUsageLimitReached 
                ? 'bg-red-500/10 border-red-500/20' 
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              <div className="flex items-center gap-3 flex-1">
                <IoClose className="w-5 h-5 flex-shrink-0 text-red-600" />
                <span className="text-sm font-medium text-red-600">{error}</span>
              </div>
              {isUsageLimitReached && (
                <button
                  onClick={() => navigate("/plans")}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Upgrade
                </button>
              )}
            </div>
          )}

          {!data && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
              <IoSparkles className="w-16 h-16 text-[var(--text-muted)] mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-[var(--text)]">Ready to Analyze</h3>
              <p className="text-sm text-[var(--text-muted)]">Enter a ticker symbol above to generate signals.</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[var(--text-muted)] animate-pulse">Scanning market signals...</p>
            </div>
          )}

          {/* Results Dashboard */}
          {data && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

              {/* Top Section: Stance & Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">

                {/* 1. Market Stance Badge (Left - 4 cols) */}
                <div className="md:col-span-4 lg:col-span-3 flex flex-col">
                  <div className="h-full bg-[var(--card-bg)] rounded-2xl p-2 shadow-sm border border-[var(--border)]">
                    <StanceIndicator stance={data.market_stance} />
                  </div>
                </div>

                {/* 2. Key Metrics & Summary (Right - 8 cols) */}
                <div className="md:col-span-8 lg:col-span-9 flex flex-col gap-4">
                  {/* Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)] text-center">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Confidence</p>
                      <p className="text-2xl font-bold text-[var(--text)]">{data.confidence || "0%"}</p>
                    </div>
                    <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)] text-center">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Signal Strength</p>
                      <p className="text-2xl font-bold text-[var(--text)]">{data.confidence?.replace('%', '') > 70 ? 'High' : 'Med'}</p>
                    </div>
                    <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)] text-center">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Claims</p>
                      <p className="text-2xl font-bold text-[var(--text)]">{data.claims?.length || 0}</p>
                    </div>
                    <div className="bg-[var(--card-bg)] p-4 rounded-xl border border-[var(--border)] text-center">
                      <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-1">Sources</p>
                      <p className="text-2xl font-bold text-[var(--text)]">
                        {data.claims?.reduce((acc, curr) => acc + (curr.sources?.length || 0), 0)}
                      </p>
                    </div>
                  </div>

                  {/* AI Summary Chat Bubble */}
                  <div className="flex-1 bg-[var(--card-bg)] rounded-2xl p-5 md:p-6 border border-[var(--border)] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-5">
                      <IoSparkles className="w-24 h-24 rotate-12" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                      AI Market Insight
                    </h3>
                    <p className="text-[15px] sm:text-base leading-relaxed text-[var(--text)] max-w-3xl">
                      {data.chatter_summary || "No summary available."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Evidence Grid Header */}
              <div className="flex items-center justify-between pt-4">
                <h3 className="text-lg font-bold text-[var(--text)]">Captured Signals & Evidence</h3>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--text-muted)]/10 text-[var(--text-muted)] font-medium">
                  {data.claims?.length || 0} items
                </span>
              </div>

              {/* Evidence Claims Grid */}
              <div className="grid grid-cols-1 gap-4">
                {data.claims?.map((claim, idx) => (
                  <div key={idx} className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full group">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${claim.classification === 'Fact'
                        ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30'
                        : 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/30'
                        }`}>
                        {claim.classification || 'Signal'}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-medium font-mono">
                        {formatDate(claim.extracted_at).split(',')[0]}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-[var(--text)] leading-snug mb-4 flex-1">
                      {claim.claim_text}
                    </p>

                    {/* Sources Compact View */}
                    <div className="mt-auto pt-3 border-t border-[var(--border)]">
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <div className="flex -space-x-1.5">
                          {claim.sources?.slice(0, 3).map((s, i) => (
                            <div key={i} className="w-5 h-5 rounded-full bg-[var(--hover)] border border-[var(--card-bg)] flex items-center justify-center text-[8px] font-bold uppercase truncate">
                              {s.source_name?.[0]}
                            </div>
                          ))}
                          {claim.sources?.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-[var(--hover)] border border-[var(--card-bg)] flex items-center justify-center text-[7px] font-bold">
                              +{claim.sources.length - 3}
                            </div>
                          )}
                        </div>
                        <span onClick={() => { }} className="text-[var(--accent)] hover:underline cursor-pointer ml-auto">
                          {claim.sources?.length || 0} Source{claim.sources?.length !== 1 && 's'}
                        </span>
                      </div>

                      {/* Expanded Source Details (Hover styled optional) */}
                      <div className="mt-2 space-y-2 animate-in fade-in duration-200">
                        {claim.sources?.slice(0, 2).map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded bg-[var(--bg)] hover:bg-[var(--hover)] transition-colors">
                            <p className="text-xs font-semibold text-[var(--text)] truncate">{s.source_name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{s.snippet}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketChatter;

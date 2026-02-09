import React from "react";

/**
 * Market Intelligence Display Component
 * Displays normalized market intelligence data in a clean, organized format
 */
function MarketIntelligence({ data, ticker }) {
  if (!data) {
    return (
      <div className="text-sm text-[var(--text-muted)]">
        No market intelligence data available.
      </div>
    );
  }

  const {
    sentiment,
    bullCase,
    bearCase,
    riskAssessment,
    dataQuality,
    metadata
  } = data;

  // Get sentiment color based on label
  const getSentimentColor = (label) => {
    const normalized = (label || "neutral").toLowerCase();
    if (normalized === "bullish" || normalized === "positive") return "text-blue-500";
    if (normalized === "bearish" || normalized === "negative") return "text-red-500";
    return "text-yellow-500";
  };

  // Get risk badge color
  const getRiskBadgeColor = (risk) => {
    const normalized = (risk || "UNKNOWN").toUpperCase();
    if (normalized === "LOW") return "bg-blue-100 text-blue-800 border-blue-300";
    if (normalized === "HIGH") return "bg-red-100 text-red-800 border-red-300";
    return "bg-yellow-100 text-yellow-800 border-yellow-300";
  };

  // Format sentiment score for display
  const formatSentimentScore = (score) => {
    if (score === null || score === undefined) return "N/A";
    return (score * 100).toFixed(1) + "%";
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <h3 className="text-lg font-bold text-[var(--text)]">
          Market Intelligence: {ticker || data.ticker || "Unknown"}
        </h3>
        {data.analysisDate && (
          <span className="text-xs text-[var(--text-muted)]">
            Analysis Date: {data.analysisDate}
          </span>
        )}
      </div>

      {/* Data Quality Warning */}
      {!dataQuality.financialsAvailable && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Limited Financial Data Available
              </p>
              <p className="mt-1 text-sm text-yellow-700">
                {dataQuality.reason || "Some insights are based on limited financial data. Please verify important information from official sources."}
              </p>
              {dataQuality.suggestions && dataQuality.suggestions.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
                  {dataQuality.suggestions.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Market Sentiment Section */}
      <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl p-4 space-y-3">
        <h4 className="text-base font-semibold text-[var(--text)]">Market Sentiment</h4>
        <div className="flex items-center gap-4">
          <div className={`text-2xl font-bold ${getSentimentColor(sentiment.label)}`}>
            {sentiment.label?.toUpperCase() || "NEUTRAL"}
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            Score: <span className="font-semibold text-[var(--text)]">{formatSentimentScore(sentiment.score)}</span>
          </div>
        </div>
        {sentiment.summary && (
          <p className="text-sm text-[var(--text)] leading-relaxed">
            {sentiment.summary}
          </p>
        )}
      </div>

      {/* Risk Assessment Section */}
      {riskAssessment && (
        <div className="bg-[var(--sidebar-bg)] border border-[var(--border)] rounded-xl p-4 space-y-3">
          <h4 className="text-base font-semibold text-[var(--text)]">Risk Assessment</h4>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskBadgeColor(riskAssessment.overallRisk)}`}>
              {riskAssessment.overallRisk || "UNKNOWN"} RISK
            </span>
          </div>
          {riskAssessment.suitability && (
            <div className="space-y-2">
              <div className={`flex items-start gap-2 ${riskAssessment.suitability.isMatch ? 'text-blue-700' : 'text-yellow-700'}`}>
                <svg className={`h-5 w-5 flex-shrink-0 mt-0.5 ${riskAssessment.suitability.isMatch ? 'text-blue-500' : 'text-yellow-500'}`} fill="currentColor" viewBox="0 0 20 20">
                  {riskAssessment.suitability.isMatch ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  )}
                </svg>
                <div>
                  <p className="text-sm font-medium">
                    {riskAssessment.suitability.explanation || "Risk assessment completed"}
                  </p>
                  {riskAssessment.suitability.warning && (
                    <p className="text-xs mt-1 text-yellow-700 italic">
                      ⚠️ {riskAssessment.suitability.warning}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bull Case Section */}
      {bullCase && (
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-4 space-y-3">
          <h4 className="text-base font-semibold text-blue-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            Bull Case
          </h4>
          {bullCase.summary && (
            <p className="text-sm text-blue-800 leading-relaxed">
              {bullCase.summary}
            </p>
          )}
          {bullCase.signals && bullCase.signals.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Key Signals:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                {bullCase.signals.map((signal, idx) => (
                  <li key={idx}>
                    {typeof signal === 'string' ? signal : signal.description || JSON.stringify(signal)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bear Case Section */}
      {bearCase && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-4 space-y-3">
          <h4 className="text-base font-semibold text-red-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Bear Case & Risks
          </h4>
          {bearCase.summary && (
            <p className="text-sm text-red-800 leading-relaxed">
              {bearCase.summary}
            </p>
          )}
          {bearCase.risks && bearCase.risks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-red-900 uppercase tracking-wide">Key Risks:</p>
              <ul className="space-y-2">
                {bearCase.risks.map((risk, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    <div className="flex items-start gap-2">
                      <span className="flex-shrink-0 text-red-600 font-bold">•</span>
                      <div>
                        {typeof risk === 'string' ? (
                          <span>{risk}</span>
                        ) : (
                          <>
                            {risk.description && <p>{risk.description}</p>}
                            {risk.signal_type && (
                              <p className="text-xs text-red-600 mt-0.5">
                                Type: {risk.signal_type}
                              </p>
                            )}
                            {risk.citation && (
                              <p className="text-xs text-red-600 mt-0.5 italic">
                                {risk.citation}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Metadata Footer */}
      {metadata && (metadata.processingTimeMs > 0 || metadata.ingestionTriggered) && (
        <div className="text-xs text-[var(--text-muted)] border-t border-[var(--border)] pt-3 space-y-1">
          {metadata.processingTimeMs > 0 && (
            <p>Processing time: {(metadata.processingTimeMs / 1000).toFixed(2)}s</p>
          )}
          {metadata.ingestionTriggered && (
            <p className="text-blue-600">✓ Data ingestion triggered for latest information</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MarketIntelligence;


import React, { useState, useRef, useEffect } from "react";
import { IoSend, IoShieldCheckmark, IoDocumentText, IoBulb, IoCopyOutline, IoCheckmarkOutline, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { HiSparkles } from "react-icons/hi2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useNavigate } from "react-router-dom";
import CONFIG from "../config";
import { getDemoHeaders } from "../utils/demoId";

function Compliance() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState(new Set());
  const [expandedAnswers, setExpandedAnswers] = useState(new Set());
  const [copiedStates, setCopiedStates] = useState({});
  const [usageCount, setUsageCount] = useState(0);
  const [isUsageLimitReached, setIsUsageLimitReached] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Categorized suggested questions
  const suggestedQuestions = {
    "SEBI Rules": [
      "What is public shareholding under SEBI?",
      "Latest SEBI disclosure requirements",
      "Minimum public shareholding rules"
    ],
    "Disclosures": [
      "What disclosures are required for listed companies?",
      "SEBI disclosure format requirements"
    ],
    "Promoters & Shareholding": [
      "Who is considered a promoter?",
      "Promoter shareholding lock-in period"
    ],
    "Listed Companies": [
      "Listing obligations for companies",
      "SEBI listing agreement requirements"
    ]
  };

  // Follow-up question templates
  const getFollowUpQuestions = (content) => {
    const followUps = [
      "Are there any exceptions?",
      "Latest amendment?",
      "Does this apply to LLPs?",
      "What are the penalties for non-compliance?"
    ];
    return followUps.slice(0, 3); // Show 3 follow-ups
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, []);

  const handleSend = async (e, question = null) => {
    e?.preventDefault();
    const query = question || inputValue.trim();
    if (!query || loading) return;

    // Add user message
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const demoHeaders = getDemoHeaders();
      const response = await fetch(`${CONFIG.API_BASE_URL}/compliance/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...demoHeaders
        },
        credentials: "include",
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle usage limit error
        if (errorData.code === "USAGE_LIMIT_REACHED") {
          setIsUsageLimitReached(true);
          setUsageCount(5); // Set to max to show limit reached
          const errorMessage = {
            role: "assistant",
            content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
            isUsageLimit: true
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
        
        throw new Error(errorData.message || errorData.error || `Failed to get response: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for usage limit in response data
      if (data.code === "USAGE_LIMIT_REACHED") {
        setIsUsageLimitReached(true);
        setUsageCount(5); // Set to max to show limit reached
        const errorMessage = {
          role: "assistant",
          content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
          isUsageLimit: true
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }
      
      // Refetch usage status to get updated count from backend
      fetchUsageStatus();
      
      let replyContent = data.reply || "Sorry, I couldn't process your request.";
      
      // Remove References section
      replyContent = replyContent.replace(/\n*References:?\s*\n[\s\S]*?(?=\n\s*(?:SOURCES|Sources|$))/i, '');
      
      // Normalize sources to ensure proper format
      let normalizedSources = null;
      if (data.sources && Array.isArray(data.sources)) {
        normalizedSources = data.sources.map(source => {
          if (typeof source === 'string') {
            return { url: source, title: source };
          } else if (typeof source === 'object' && source !== null) {
            return {
              url: source.url || source.link || source.href || '',
              title: source.title || source.name || source.url || source.link || source.href || 'Source',
              page: source.page || source.pageNumber || null
            };
          }
          return { url: '', title: 'Source' };
        }).filter(source => source.url);
      }

      const botMessage = {
        role: "assistant",
        content: replyContent,
        sources: normalizedSources,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Compliance chat error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInputValue(question);
    setTimeout(() => handleSend(null, question), 100);
  };

  const handleCopyAnswer = async (messageIdx, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates(prev => ({ ...prev, [`answer-${messageIdx}`]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [`answer-${messageIdx}`]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopySourceLink = async (messageIdx, sourceIdx, url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedStates(prev => ({ ...prev, [`source-${messageIdx}-${sourceIdx}`]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [`source-${messageIdx}-${sourceIdx}`]: false }));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleAnswerExpansion = (messageIdx) => {
    setExpandedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageIdx)) {
        newSet.delete(messageIdx);
      } else {
        newSet.add(messageIdx);
      }
      return newSet;
    });
  };

  const shouldCollapseAnswer = (content) => {
    // Collapse if content is longer than 500 characters
    return content && content.length > 500;
  };

  const getPreviewText = (content) => {
    if (!content || content.length <= 500) return content;
    return content.substring(0, 500) + "...";
  };

  return (
    <div className="h-full w-full bg-[var(--bg)] text-[var(--text)] flex flex-col overflow-hidden">
      {/* Header - Only visible when no messages */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 bg-gradient-to-br from-[var(--sidebar-bg)] via-[var(--sidebar-bg)] to-[var(--bg)] border-b border-[var(--border)]">
          <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
                  <IoShieldCheckmark className="w-5 h-5 text-[var(--accent)]" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-[var(--text)]">
            Compliance Assistant
          </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-medium">
                    Source-backed from official SEBI publications
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                  SEBI-aligned regulatory guidance and compliance support
          </p>
        </div>
      </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`max-w-[900px] mx-auto px-4 sm:px-6 ${messages.length === 0 ? 'py-4 sm:py-5' : 'py-6 sm:py-8'} min-h-full flex flex-col`}>
          {messages.length === 0 ? (
            // Enhanced Empty State
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-2xl">
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--accent)]/10 mb-3">
                      <IoBulb className="w-7 h-7 text-[var(--accent)]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2">
                      Welcome to Compliance Assistant
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed px-2 mb-4">
                      Get instant answers to your regulatory and compliance questions. 
                      Ask about SEBI rules, disclosure requirements, or legal obligations.
                    </p>
                    
                    {/* What I can help with */}
                    <div className="text-left bg-[var(--bg)] rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                        What I can help with:
                      </p>
                      <ul className="text-xs text-[var(--text-muted)] space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--accent)] mt-0.5">•</span>
                          <span>SEBI rules & regulations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--accent)] mt-0.5">•</span>
                          <span>Disclosure requirements</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--accent)] mt-0.5">•</span>
                          <span>Promoter & shareholding rules</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-[var(--accent)] mt-0.5">•</span>
                          <span>Listing obligations & relaxations</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Categorized Suggested Questions */}
                  <div className="space-y-4">
                    {Object.entries(suggestedQuestions).map(([category, questions]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                          {category}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {questions.map((question, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedQuestion(question)}
                              className="group text-left px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--hover)] transition-all duration-200 hover:shadow-sm"
                            >
                              <div className="flex items-start gap-2.5">
                                <HiSparkles className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                                <span className="text-xs sm:text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                                  {question}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Chat Messages
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg, idx) => (
              <div
                key={idx}
                  className={`flex items-start gap-3 transition-opacity duration-300 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "user" ? (
                    // User Message
                    <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-3 bg-[var(--accent)] text-white shadow-md">
                      <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                    </div>
                  ) : (
                    // Assistant Message
                    <div className="max-w-[95%] sm:max-w-[85%] w-full" style={{ position: 'relative', zIndex: 1 }}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                            <IoShieldCheckmark className="w-4 h-4 text-[var(--accent)]" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                              Compliance Assistant
                            </span>
                            <button
                              onClick={() => handleCopyAnswer(idx, msg.content)}
                              className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--accent)]"
                              title="Copy answer"
                            >
                              {copiedStates[`answer-${idx}`] ? (
                                <IoCheckmarkOutline className="w-4 h-4" />
                              ) : (
                                <IoCopyOutline className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          
                          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                            <div className="text-sm sm:text-base text-[var(--text)] leading-relaxed">
                              {shouldCollapseAnswer(msg.content) && !expandedAnswers.has(idx) ? (
                                <>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      text: ({ children }) => <>{children}</>,
                                      p: ({ children }) => (
                                        <p className="whitespace-pre-wrap break-words leading-relaxed my-3 first:mt-0 last:mb-0">
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc pl-5 my-3 space-y-2 first:mt-0 last:mb-0">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal pl-5 my-3 space-y-2 first:mt-0 last:mb-0">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li className="leading-relaxed">{children}</li>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-semibold text-[var(--text)]">
                                          {children}
                                        </strong>
                                      ),
                                      em: ({ children }) => (
                                        <em className="italic">{children}</em>
                                      ),
                                      code: ({ children }) => (
                                        <code className="px-2 py-1 rounded-md bg-[var(--sidebar-bg)] border border-[var(--border)] text-[0.9em] font-mono">
                                          {children}
                                        </code>
                                      ),
                                      a: ({ children }) => <span>{children}</span>,
                                      h1: ({ children }) => (
                                        <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-base font-semibold mt-3 mb-2 first:mt-0">
                                          {children}
                                        </h3>
                                      ),
                                    }}
                                  >
                                    {getPreviewText(msg.content)}
                                  </ReactMarkdown>
                                  <button
                                    onClick={() => toggleAnswerExpansion(idx)}
                                    className="mt-3 text-sm text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
                                  >
                                    Read full explanation
                                    <IoChevronDown className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      text: ({ children }) => <>{children}</>,
                                      p: ({ children }) => (
                                        <p className="whitespace-pre-wrap break-words leading-relaxed my-3 first:mt-0 last:mb-0">
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc pl-5 my-3 space-y-2 first:mt-0 last:mb-0">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal pl-5 my-3 space-y-2 first:mt-0 last:mb-0">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li className="leading-relaxed">{children}</li>
                                      ),
                                      strong: ({ children }) => (
                                        <strong className="font-semibold text-[var(--text)]">
                                          {children}
                                        </strong>
                                      ),
                                      em: ({ children }) => (
                                        <em className="italic">{children}</em>
                                      ),
                                      code: ({ children }) => (
                                        <code className="px-2 py-1 rounded-md bg-[var(--sidebar-bg)] border border-[var(--border)] text-[0.9em] font-mono">
                                          {children}
                                        </code>
                                      ),
                                      a: ({ children }) => <span>{children}</span>,
                                      h1: ({ children }) => (
                                        <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-lg font-bold mt-4 mb-2 first:mt-0">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-base font-semibold mt-3 mb-2 first:mt-0">
                                          {children}
                                        </h3>
                                      ),
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                  {shouldCollapseAnswer(msg.content) && (
                                    <button
                                      onClick={() => toggleAnswerExpansion(idx)}
                                      className="mt-3 text-sm text-[var(--accent)] hover:underline flex items-center gap-1 font-medium"
                                    >
                                      Show less
                                      <IoChevronUp className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Follow-up Questions */}
                            {!loading && (
                              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                                  Follow-up questions:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {getFollowUpQuestions(msg.content).map((followUp, fIdx) => (
                                    <button
                                      key={fIdx}
                                      onClick={() => handleSuggestedQuestion(followUp)}
                                      className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)] hover:bg-[var(--hover)] transition-all text-[var(--text-muted)] hover:text-[var(--accent)]"
                                    >
                                      {followUp}
                                    </button>
                                  ))}
                </div>
              </div>
                            )}

                            {/* SOURCES - Source Cards */}
                            {msg.sources && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <button
                                  onClick={() => {
                                    const messageId = idx;
                                    setExpandedSources(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(messageId)) {
                                        newSet.delete(messageId);
                                      } else {
                                        newSet.add(messageId);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--hover)] transition-all duration-200 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--accent)] mb-3"
                                  aria-label={`Toggle sources (${msg.sources.length} sources)`}
                                >
                                  <IoDocumentText className="w-4 h-4" />
                                  <span>Sources ({msg.sources.length})</span>
                                  {expandedSources.has(idx) ? (
                                    <IoChevronUp className="w-3 h-3" />
                                  ) : (
                                    <IoChevronDown className="w-3 h-3" />
                                  )}
                                </button>

                                {/* Expanded Source Cards */}
                                {expandedSources.has(idx) && (
                                  <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {msg.sources.map((source, sourceIdx) => {
                                      const sourceUrl = source?.url || source?.link || source?.href || '';
                                      const sourceTitle = source?.title || source?.name || sourceUrl || 'Source';
                                      const sourcePage = source?.page || source?.pageNumber || null;

                                      if (!sourceUrl) return null;

                                      return (
                                        <div
                                          key={sourceIdx}
                                          className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 hover:border-[var(--accent)] transition-colors"
                                        >
                                          <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs font-semibold text-[var(--text)] mb-1 truncate">
                                                {sourceTitle}
                                              </p>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                                                  SEBI.gov.in
                                                </span>
                                                {sourcePage && (
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--sidebar-bg)] border border-[var(--border)] text-[var(--text-muted)]">
                                                    Page {sourcePage}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <button
                                              onClick={() => handleCopySourceLink(idx, sourceIdx, sourceUrl)}
                                              className="p-1.5 rounded hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--accent)] flex-shrink-0"
                                              title="Copy source link"
                                            >
                                              {copiedStates[`source-${idx}-${sourceIdx}`] ? (
                                                <IoCheckmarkOutline className="w-3.5 h-3.5" />
                                              ) : (
                                                <IoCopyOutline className="w-3.5 h-3.5" />
                                              )}
                                            </button>
                                          </div>
                                          <a
                                            href={sourceUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              window.open(sourceUrl, '_blank', 'noopener,noreferrer');
                                            }}
                                          >
                                            View source →
                                          </a>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Enhanced Loading Indicator */}
          {loading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                      <IoShieldCheckmark className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                  </div>
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl rounded-tl-sm px-4 sm:px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                    <span
                          className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                          className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                          className="w-2 h-2 bg-[var(--accent)] rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                      </div>
                      <span className="text-sm text-[var(--text-muted)] font-medium">
                        Searching SEBI regulations...
                </span>
                    </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Sticky at bottom */}
      <div className="flex-shrink-0 border-t border-[var(--border)] bg-[var(--sidebar-bg)] shadow-lg">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about compliance, regulations, or SEBI requirements..."
              disabled={loading || isUsageLimitReached}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !isUsageLimitReached) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              className="
                  w-full
                  rounded-full
                bg-[var(--bg)]
                  border-2 border-[var(--border)]
                  px-5 sm:px-6 py-3 sm:py-3.5
                  text-sm sm:text-base
                text-[var(--text)]
                placeholder-[var(--text-muted)]
                outline-none
                focus:border-[var(--accent)]
                  transition-all duration-200
                disabled:opacity-50
                disabled:cursor-not-allowed
                  shadow-sm focus:shadow-md
              "
                aria-label="Compliance question input"
            />
            
            {/* Usage Counter */}
            <div className="absolute top-1 right-14 flex items-center">
              <span className={`
                text-[10px] sm:text-xs font-medium
                ${usageCount >= 5 ? 'text-red-500' : usageCount >= 4 ? 'text-orange-500' : 'text-[var(--text-muted)]'}
              `}>
                Uses: {usageCount} / 5
              </span>
            </div>
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || loading || isUsageLimitReached}
              className="
                h-11 w-11 sm:h-12 sm:w-12
                rounded-full
                bg-[var(--accent)]
                text-white
                hover:opacity-90
                active:scale-95
                transition-all duration-200
                disabled:opacity-40
                disabled:cursor-not-allowed
                disabled:hover:opacity-40
                flex items-center justify-center
                flex-shrink-0
                shadow-md hover:shadow-lg
              "
              aria-label="Send message"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <IoSend className="w-5 h-5" />
              )}
            </button>
          </form>
          
          {/* Usage Limit Message */}
          {isUsageLimitReached && (
            <div className="mt-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <p className="text-sm text-red-600 font-medium flex-1">
                  You've reached the free usage limit. Upgrade to continue using SageAlpha services.
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
          
          {/* Disclaimer */}
          <p className="mt-3 text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            This assistant provides informational guidance based on SEBI publications and does not constitute legal advice.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Compliance;

import React, { useState, useRef, useEffect } from "react";
import { IoSend, IoShieldCheckmark, IoChevronDown, IoChevronUp } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CONFIG from "../config";
import Spinner from "./Spinner";

function DefenderAI() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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

  const handleSend = async (e) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || loading) return;

    // Add user message
    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      // Call backend proxy endpoint (not Defender AI directly)
      const response = await fetch(`${CONFIG.API_BASE_URL}/defender/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle usage limit error
        if (errorData.code === "USAGE_LIMIT_REACHED") {
          const errorMessage = {
            role: "assistant",
            content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
            isUsageLimit: true
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
        
        throw new Error(errorData.error || errorData.message || `Failed to get response: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Check for usage limit in response data
      if (data.code === "USAGE_LIMIT_REACHED") {
        const errorMessage = {
          role: "assistant",
          content: "You've reached the free usage limit. Upgrade to continue using SageAlpha services.",
          isUsageLimit: true
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const botMessage = {
        role: "assistant",
        content: data.answer || "Sorry, I couldn't process your request.",
        confidence: data.confidence,
        sources: data.sources || [],
        flags: data.flags || [],
        disclaimer: data.disclaimer || "",
        method: data.method || "rag",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Defender AI error:", error);
      
      // Extract error message from backend response if available
      let errorContent = "Sorry, there was an error processing your request. Please try again.";
      
      if (error.message) {
        errorContent = error.message;
      }
      
      const errorMessage = {
        role: "assistant",
        content: errorContent,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSources = (messageIdx) => {
    setExpandedSources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageIdx)) {
        newSet.delete(messageIdx);
      } else {
        newSet.add(messageIdx);
      }
      return newSet;
    });
  };

  const formatConfidence = (confidence) => {
    if (confidence === null || confidence === undefined) return "N/A";
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)] flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 bg-[var(--card-bg)] border-b border-[var(--border)] px-4 sm:px-6 py-4">
        <div className="max-w-[900px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
              <IoShieldCheckmark className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text)]">
                Defender AI
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                Regulatory / Risk-Aware Assistant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className={`max-w-[900px] mx-auto px-4 sm:px-6 ${messages.length === 0 ? 'py-4 sm:py-5' : 'py-6 sm:py-8'} min-h-full flex flex-col`}>
          {messages.length === 0 ? (
            // Empty State
            <div className="flex-1 flex items-center justify-center py-4">
              <div className="w-full max-w-2xl">
                <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl p-6 sm:p-7 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[var(--accent)]/10 mb-3">
                      <IoShieldCheckmark className="w-7 h-7 text-[var(--accent)]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] mb-2">
                      Welcome to Defender AI
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed px-2 mb-4">
                      Ask risky, regulatory, or compliance-sensitive questions. 
                      Get expert guidance on complex regulatory matters.
                    </p>
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
                    <div className="max-w-[95%] sm:max-w-[85%] w-full">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                            <IoShieldCheckmark className="w-4 h-4 text-[var(--accent)]" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                              Defender AI (Regulatory / Risk-Aware Assistant)
                            </span>
                            {msg.confidence !== null && msg.confidence !== undefined && (
                              <span className="ml-3 text-xs text-[var(--text-muted)]">
                                Confidence: {formatConfidence(msg.confidence)}
                              </span>
                            )}
                          </div>
                          
                          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                            <div className="text-sm sm:text-base text-[var(--text)] leading-relaxed">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
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
                            </div>

                            {/* Sources Section */}
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <button
                                  onClick={() => toggleSources(idx)}
                                  className="flex items-center gap-2 text-xs font-semibold text-[var(--accent)] hover:text-[var(--accent)]/80 transition-colors mb-2"
                                >
                                  {expandedSources.has(idx) ? (
                                    <>
                                      <IoChevronUp className="w-4 h-4" />
                                      Hide Sources ({msg.sources.length})
                                    </>
                                  ) : (
                                    <>
                                      <IoChevronDown className="w-4 h-4" />
                                      Show Sources ({msg.sources.length})
                                    </>
                                  )}
                                </button>
                                {expandedSources.has(idx) && (
                                  <div className="space-y-2 mt-2">
                                    {msg.sources.map((source, sourceIdx) => (
                                      <div
                                        key={sourceIdx}
                                        className="p-3 rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border)]"
                                      >
                                        <div className="text-xs font-semibold text-[var(--text)] mb-1">
                                          {source.title || source.source || "Source"}
                                        </div>
                                        {source.source && (
                                          <div className="text-xs text-[var(--text-muted)] mb-1">
                                            Authority: {source.source}
                                          </div>
                                        )}
                                        {source.year && (
                                          <div className="text-xs text-[var(--text-muted)] mb-1">
                                            Year: {source.year}
                                          </div>
                                        )}
                                        {source.confidence !== null && source.confidence !== undefined && (
                                          <div className="text-xs text-[var(--text-muted)]">
                                            Confidence: {formatConfidence(source.confidence)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Disclaimer */}
                            {msg.disclaimer && (
                              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                                <p className="text-xs text-[var(--text-muted)] italic leading-relaxed">
                                  {msg.disclaimer}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                      <IoShieldCheckmark className="w-4 h-4 text-[var(--accent)]" />
                    </div>
                  </div>
                  <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span className="text-sm text-[var(--text-muted)]">Defender AI is thinking...</span>
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
      <div className="flex-shrink-0 bg-[var(--card-bg)] border-t border-[var(--border)] p-4 sm:p-6">
        <div className="max-w-[900px] mx-auto">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              disabled={loading}
              placeholder="Ask a risky or regulatory question..."
              className="flex-1 px-4 py-3 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="
                px-4 py-3 rounded-xl
                bg-[var(--accent)] text-white
                hover:opacity-90
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all
                flex items-center justify-center
                min-w-[100px]
              "
              aria-label="Send message"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <IoSend className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default DefenderAI;

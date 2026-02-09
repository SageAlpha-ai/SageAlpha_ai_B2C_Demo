import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoArrowBack, IoShieldCheckmark } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CONFIG from "../config";

function SharedChatView() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatData, setChatData] = useState(null);

  useEffect(() => {
    const fetchSharedChat = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${CONFIG.API_BASE_URL}/api/share/${shareId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 404) {
            throw new Error("Shared chat not found");
          } else if (response.status === 410) {
            throw new Error("This shared chat has expired");
          }
          throw new Error(errorData.error || "Failed to load shared chat");
        }

        const data = await response.json();
        setChatData(data);
      } catch (err) {
        console.error("Error fetching shared chat:", err);
        setError(err.message || "Failed to load shared chat");
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedChat();
    }
  }, [shareId]);

  const renderMessageContent = (content) => {
    if (!content) return null;

    // Check if content is markdown
    if (content.includes('**') || content.includes('*') || content.includes('`') || content.includes('[')) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => (
              <p className="whitespace-pre-wrap break-words leading-relaxed my-2">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-2 space-y-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-2 space-y-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            code: ({ children }) => (
              <code className="px-2 py-1 rounded-md bg-[var(--sidebar-bg)] border border-[var(--border)] text-[0.9em] font-mono">
                {children}
              </code>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] underline hover:opacity-80"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }

    // Plain text
    return (
      <p className="whitespace-pre-wrap break-words leading-relaxed">
        {content}
      </p>
    );
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-[var(--text)]">Shared Chat</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent)] mx-auto mb-4"></div>
            <p className="text-[var(--text-muted)]">Loading shared chat...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)]">
        <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-[var(--text)]">Shared Chat</h1>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <IoShieldCheckmark className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">Error Loading Chat</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--border)] bg-[var(--sidebar-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
                aria-label="Go back"
              >
                <IoArrowBack className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold text-[var(--text)]">Shared Chat</h1>
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2 ml-12">
            This is a read-only shared conversation
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {chatData && chatData.messages && chatData.messages.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {chatData.messages.map((msg, idx) => (
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
                              Assistant
                            </span>
                          </div>
                          <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl p-4 sm:p-5">
                            <div className="text-sm sm:text-base text-[var(--text)] leading-relaxed">
                              {renderMessageContent(msg.content)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-muted)]">No messages in this shared chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SharedChatView;


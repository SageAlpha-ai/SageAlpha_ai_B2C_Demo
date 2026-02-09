import React, { useEffect, useRef } from "react";
import { IoClose, IoShieldCheckmark, IoSparkles } from "react-icons/io5";
import { useNavigate, useLocation } from "react-router-dom";

// AI Tools configuration
const aiTools = [
  {
    id: "compliance",
    name: "Compliance AI",
    description: "Ask compliance-safe finance questions",
    icon: IoShieldCheckmark,
    path: "/compliance",
  },
  {
    id: "market-chatter",
    name: "Market Chatter AI",
    description: "Track market sentiment & news trends",
    icon: IoSparkles,
    path: "/market-chatter"
  },
  {
    id: "defender",
    name: "Defender AI",
    description: "Ask high-risk or sensitive finance questions",
    icon: IoShieldCheckmark,
    path: "/defender-ai"
  }
];

function AIAssistantsPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef(null);

  // Determine selected tool based on current path
  const selectedToolId = aiTools.find(tool => tool.path === location.pathname)?.id || null;

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleToolSelect = (tool) => {
    navigate(tool.path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-16 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] shadow-2xl"
        style={{
          animation: 'slideDown 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-bold text-[var(--text)]">
            SageAlpha AI Assistants
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--hover)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
            aria-label="Close panel"
          >
            <IoClose className="w-5 h-5" />
          </button>
        </div>

        {/* AI Tools List */}
        <div className="p-4 space-y-2">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            const isSelected = selectedToolId === tool.id;
            
            return (
              <button
                key={tool.id}
                onClick={() => handleToolSelect(tool)}
                className={`
                  w-full p-4 rounded-xl border-2 transition-all duration-200
                  text-left
                  ${isSelected 
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                    : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/50 hover:bg-[var(--hover)]'
                  }
                  active:scale-[0.98]
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-lg
                    flex items-center justify-center
                    ${isSelected 
                      ? 'bg-[var(--accent)] text-white' 
                      : 'bg-[var(--hover)] text-[var(--text)]'
                    }
                    transition-colors
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-[var(--text)] mb-1">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AIAssistantsPanel;

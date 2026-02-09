import React from "react";

/**
 * Reusable Spinner Component
 * Displays a circular loading indicator with SageAlpha blue accent color
 * 
 * @param {string} size - Size of the spinner: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
function Spinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-3 h-3 border-2",
    md: "w-4 h-4 border-2",
    lg: "w-6 h-6 border-3"
  };

  return (
    <div
      className={`${sizeClasses[size]} border-[var(--accent)]/30 border-t-[var(--accent)] rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;


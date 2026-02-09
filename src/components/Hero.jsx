import React from "react";
import { useNavigate } from "react-router-dom";

function Hero() {

  const navigate = useNavigate();

  return (
    <section className="relative h-full w-full overflow-hidden bg-[var(--bg)]">

      {/* Animated Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-[var(--accent)]/10 dark:bg-[var(--accent)]/5 blur-[120px] animate-pulse" />
        <div className="absolute top-1/3 -right-40 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/10 dark:bg-[var(--accent)]/5 blur-[120px] animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/3 h-[300px] w-[300px] rounded-full bg-[var(--accent)]/10 dark:bg-[var(--accent)]/5 blur-[100px] animate-pulse delay-2000" />
      </div>

      {/* Grid Overlay - Theme aware */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 text-center">

        {/* Badge */}
        <span className="inline-block mb-6 px-4 py-1 text-sm text-[var(--accent)] font-medium">
          Built for Research Analysts
        </span>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-[var(--text)] leading-[0.9]">
          AI-Powered Intelligence for <br />
          <span className="text-[var(--accent)]">
            Smarter Company Research
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-xl text-[var(--text-muted)] max-w-2xl mx-auto">
          Analyze financials, filings, disclosures, and company performance
          using a single AI research agent — faster, deeper, and without noise.
        </p>

        {/* CTA */}
        <div className="mt-10 flex justify-center gap-4">
          <button
            className="
              relative rounded-xl px-8 py-4
              text-lg font-bold text-white
              bg-[var(--accent)]
              transition-all duration-300
              hover:opacity-90
            "
            onClick={() => navigate('/chatbot')}
          >
            Get Started
          </button>
          {/* <button
            className="
              relative rounded-xl border border-[var(--border)] bg-[var(--card-bg)] px-8 py-4
              text-lg font-bold text-[var(--text)]
              hover:bg-[var(--hover)] transition
            "
            onClick={() => navigate('/demo')} // Assuming a demo route
          >
            View Demo
          </button> */}
        </div>

      </div>
    </section>
  );
}

export default Hero;

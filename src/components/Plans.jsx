import React from "react";
import { useNavigate } from "react-router-dom";
import { IoCheckmark } from "react-icons/io5";

function Plans() {
  const navigate = useNavigate();

  const plans = [
    {
      id: "free",
      badge: "FREE",
      title: "Evaluate the Engine",
      price: "$0",
      priceSubtext: "",
      bestFor: "First-time users who want to experience SageAlpha's AI capabilities.",
      color: "green",
      features: [
        "Generate up to 2 equity research reports (total)",
        "Access to Compliance AI",
        "Access to Market Chatter AI",
        "Access to Defender AI",
        "Preview SageAlpha's research quality and AI workflows"
      ],
      limitations: [
        "Limited report generation",
        "No report delivery via email or WhatsApp",
        "No subscriber or performance analytics"
      ],
      ctaText: "Explore SageAlpha AI",
      ctaAction: () => {
        window.open("https://sagealpha.ai", "_blank");
      },
      isRecommended: false
    },
    {
      id: "pro",
      badge: "PRO",
      title: "Research & Deliver",
      price: "$19",
      priceSubtext: "/ month",
      bestFor: "Individual analysts, advisors, and early-stage research professionals.",
      color: "blue",
      features: [
        "Unlimited equity report generation",
        "Email delivery of reports to subscribers",
        "WhatsApp delivery of reports",
        "Subscriber management dashboard",
        "Performance metrics of Research Analyst (RA)",
        "Subscriber usage & engagement analysis",
        "Access to Compliance AI",
        "Access to Market Chatter AI",
        "Access to Defender AI"
      ],
      limitations: [],
      ctaText: "Upgrade to Pro",
      ctaAction: () => navigate("/upgrade-plan"),
      isRecommended: true
    },
    {
      id: "advanced",
      badge: "ADVANCED",
      title: "Scale & Optimize",
      price: "Custom",
      priceSubtext: "Pricing",
      bestFor: "Research firms, fintech platforms, and growing advisory teams.",
      color: "purple",
      features: [
        "Everything in PRO, plus:",
        "Advanced subscriber analytics & segmentation",
        "Detailed performance matrix across reports & analysts",
        "Usage insights and conversion analytics",
        "Priority processing for report generation",
        "Higher usage limits & scalability",
        "Dedicated onboarding & priority support",
        "Custom integrations (on request)"
      ],
      limitations: [],
      ctaText: "Contact Sales",
      ctaAction: () => {
        // You can update this to navigate to a contact page or open email
        window.location.href = "mailto:sales@sagealpha.ai?subject=Advanced Plan Inquiry";
      },
      isRecommended: false
    }
  ];

  const getPlanColors = (color) => {
    const colors = {
      green: {
        badge: "bg-green-500/10 text-green-600 border-green-500/20",
        accent: "text-green-600",
        button: "bg-green-600 hover:bg-green-700",
        border: "border-green-500/20"
      },
      blue: {
        badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
        accent: "text-blue-600",
        button: "bg-[var(--accent)] hover:opacity-90",
        border: "border-blue-500/20"
      },
      purple: {
        badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        accent: "text-purple-600",
        button: "bg-purple-600 hover:bg-purple-700",
        border: "border-purple-500/20"
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="h-full w-full overflow-y-auto overflow-x-hidden bg-[var(--bg)]">
      <div className="py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text)] mb-3 sm:mb-4">
            Choose Your <span className="text-[var(--accent)]">SageAlpha</span> Plan
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Start free. Upgrade when you're ready. Scale when it matters.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const colors = getPlanColors(plan.color);
            
            return (
              <div
                key={plan.id}
                className={`
                  relative bg-[var(--card-bg)] rounded-2xl border-2 p-6 sm:p-8
                  ${plan.isRecommended 
                    ? 'border-[var(--accent)] shadow-lg md:scale-105 md:-mt-2' 
                    : 'border-[var(--border)] shadow-md hover:shadow-lg'
                  }
                  transition-all duration-200
                  flex flex-col
                `}
              >
                {/* Recommended Badge */}
                {plan.isRecommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[var(--accent)] text-white text-xs font-bold px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}

                {/* Plan Badge */}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold mb-4 w-fit ${colors.badge}`}>
                  {plan.badge}
                </div>

                {/* Plan Title */}
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text)] mb-2">
                  {plan.title}
                </h2>

                {/* Price */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl sm:text-4xl font-black ${colors.accent}`}>
                      {plan.price}
                    </span>
                    {plan.priceSubtext && (
                      <span className="text-sm sm:text-base text-[var(--text-muted)] font-medium">
                        {plan.priceSubtext}
                      </span>
                    )}
                  </div>
                </div>

                {/* Best For */}
                <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">
                  <span className="font-semibold text-[var(--text)]">Best for:</span> {plan.bestFor}
                </p>

                {/* Features List */}
                <div className="flex-1 mb-6">
                  <h3 className="text-sm font-bold text-[var(--text)] mb-3 uppercase tracking-wide">
                    What you get:
                  </h3>
                  <ul className="space-y-2.5">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <IoCheckmark className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.accent}`} />
                        <span className="text-sm text-[var(--text)] leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[var(--border)]">
                      <h3 className="text-sm font-bold text-[var(--text-muted)] mb-3 uppercase tracking-wide">
                        Limitations:
                      </h3>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="text-[var(--text-muted)] text-xs">•</span>
                            <span className="text-sm text-[var(--text-muted)] leading-relaxed">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={plan.ctaAction}
                  className={`
                    w-full py-3 sm:py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base
                    text-white transition-all duration-200
                    ${colors.button}
                    active:scale-95
                    shadow-md hover:shadow-lg
                    mt-auto
                  `}
                >
                  {plan.ctaText}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--text-muted)]">
            All plans include access to SageAlpha's AI-powered research tools. 
            <br className="hidden sm:block" />
            Upgrade or downgrade at any time. No long-term commitments.
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Plans;

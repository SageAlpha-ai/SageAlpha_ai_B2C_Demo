import React, { useState } from "react";
import { IoCheckmark } from "react-icons/io5";

function UpgradePlan({ currentPlan = "free" }) {
  const [planType, setPlanType] = useState("personal"); // personal or business

  const plans = {
    personal: [
      {
        id: "go",
        name: "Go",
        price: 150,
        tagline: "Do more with smarter AI",
        current: currentPlan === "go",
        features: [
          "Go deep on harder questions",
          "Chat longer and upload more content",
          "Make realistic images for your projects"
        ]
      },
      {
        id: "plus",
        name: "Plus",
        price: 350,
        tagline: "Unlock the full experience",
        current: currentPlan === "plus",
        features: [
          "Solve complex problems",
          "Have long chats over multiple sessions",
          "Create more images, faster"
        ]
      },
      {
        id: "pro",
        name: "Pro",
        price: 1000,
        tagline: "Maximize your productivity",
        current: currentPlan === "pro",
        features: [
          "Master advanced tasks and topics",
          "Tackle big projects with unlimited messages",
          "Create high-quality images at any scale"
        ]
      }
    ],
    business: [
      {
        id: "go",
        name: "Go",
        price: 500,
        tagline: "Do more with smarter AI",
        current: currentPlan === "go",
        features: [
          "Go deep on harder questions",
          "Chat longer and upload more content",
          "Make realistic images for your projects"
        ]
      },
      {
        id: "plus",
        name: "Plus",
        price: 1350,
        tagline: "Unlock the full experience",
        current: currentPlan === "plus",
        features: [
          "Solve complex problems",
          "Have long chats over multiple sessions",
          "Create more images, faster"
        ]
      },
      {
        id: "pro",
        name: "Pro",
        price: 11350,
        tagline: "Maximize your productivity",
        current: currentPlan === "pro",
        features: [
          "Master advanced tasks and topics",
          "Tackle big projects with unlimited messages",
          "Create high-quality images at any scale"
        ]
      }
    ]
  };

  const handlePlanSelect = (planId) => {
    // Handle plan upgrade logic here
    console.log(`Upgrading to ${planId} plan`);
  };

  return (
    <div className="flex-1 bg-[var(--bg)] text-[var(--text)] px-6 py-8 overflow-y-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text)]">
          Upgrade your plan
        </h1>
        <p className="text-lg text-[var(--text-muted)] mt-2">
          Choose the perfect plan for your needs and unlock advanced features.
        </p>
      </div>

      {/* Plan Type Toggle */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex rounded-lg bg-[var(--sidebar-bg)] border border-[var(--border)] p-1">
          <button
            onClick={() => setPlanType("personal")}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
              planType === "personal"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Personal
          </button>
          <button
            onClick={() => setPlanType("business")}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
              planType === "business"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            Business
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans[planType].map((plan) => (
              <div
                key={plan.id}
                className="relative rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6 flex flex-col hover:border-[var(--accent)] transition-all"
              >
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-[var(--text)] mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[var(--text)]">
                    ₹{plan.price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] ml-2">
                    / month
                  </span>
                </div>

                {/* Tagline */}
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  {plan.tagline}
                </p>

                {/* Features */}
                <div className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <IoCheckmark className="w-5 h-5 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-[var(--text)]">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  className={`w-full py-3 px-4 rounded-lg text-sm font-bold transition-colors ${
                    plan.current
                      ? "bg-[var(--hover)] text-[var(--text-muted)] cursor-not-allowed border border-[var(--border)]"
                      : plan.id === "plus"
                      ? "bg-white text-black hover:opacity-90"
                      : "bg-[var(--hover)] text-[var(--text)] hover:bg-[var(--border)]"
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? "Your current plan" : `Get ${plan.name}`}
                </button>
              </div>
            ))}
      </div>
    </div>
  );
}

export default UpgradePlan;

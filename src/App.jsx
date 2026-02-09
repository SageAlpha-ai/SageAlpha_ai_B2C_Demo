import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import ChatBot from "./components/ChatBot";
import Profile from "./components/Profile";
import Portfolio from "./components/Portfolio";
import Subscribers from "./components/Subscribers";
import AppLayout from "./Layouts/AppLayout";
import UpgradePlan from "./components/UpgradePlan";
import Plans from "./components/Plans";
import Compliance from "./components/Compliance";
import MarketChatter from "./components/MarketChatter";
import DefenderAI from "./components/DefenderAI";
import SharedChatView from "./components/SharedChatView";

export default function App() {
  return (
    <AppLayout>
      <Toaster position="top-center" richColors offset="35px" />
      <Routes>
        {/* Default route redirects to chatbot */}
        <Route path="/" element={<Navigate to="/chatbot" replace />} />

        {/* Public share route */}
        <Route path="/share/:shareId" element={<SharedChatView />} />

        {/* Demo routes - all accessible without auth */}
        <Route path="/chatbot" element={<ChatBot />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/subscribers" element={<Subscribers />} />
        <Route path="/upgrade-plan" element={<UpgradePlan />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/market-chatter" element={<MarketChatter />} />
        <Route path="/defender-ai" element={<DefenderAI />} />
      </Routes>
    </AppLayout>
  );
}

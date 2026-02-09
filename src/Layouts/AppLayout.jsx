import React from "react";
import Navbar from "../components/Navbar";

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen h-screen bg-[var(--bg)] overflow-hidden w-full max-w-full">
      <Navbar />
      {/* Offset for fixed navbar (64px / 4rem) */}
      <main className="flex-1 pt-16 flex flex-col overflow-y-auto w-full max-w-full">
        {children}
      </main>
    </div>
  );
}

export default AppLayout;

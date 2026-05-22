"use client";

import React, { Suspense } from "react";
import AIChatBot from "@/components/AIChatBot";
import { ChatProvider } from "@/hooks/useChat";
import { useWallet } from "@/lib/useWallet";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { address } = useWallet();

  return (
    <ChatProvider walletAddress={address || undefined}>
      {children}
      <Suspense fallback={null}>
        <AIChatBot />
      </Suspense>
    </ChatProvider>
  );
}


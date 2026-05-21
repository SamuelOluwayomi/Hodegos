import React, { Suspense } from "react";
import AIChatBot from "@/components/AIChatBot";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <AIChatBot />
      </Suspense>
    </>
  );
}

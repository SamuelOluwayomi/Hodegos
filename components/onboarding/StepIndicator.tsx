"use client";

import React from "react";
import { HandWaving, User, ChatCircle, ChartBar, BookOpen, Brain, ChartLineUp, Trophy, Lightning, Check, Medal } from "@phosphor-icons/react";

const STEPS = [
  { key: "welcome", label: "Welcome", icon: <HandWaving size={16} weight="fill" /> },
  { key: "profile", label: "Profile", icon: <User size={16} weight="fill" /> },
  { key: "tone", label: "AI Tone", icon: <ChatCircle size={16} weight="fill" /> },
  { key: "level", label: "Level", icon: <ChartBar size={16} weight="fill" /> },
  { key: "learn", label: "Learn", icon: <BookOpen size={16} weight="fill" /> },
  { key: "quiz", label: "Quiz", icon: <Brain size={16} weight="fill" /> },
  { key: "demo", label: "Demo", icon: <ChartLineUp size={16} weight="fill" /> },
  { key: "complete", label: "Done!", icon: <Trophy size={16} weight="fill" /> },
];

interface StepIndicatorProps {
  currentStep: string;
  xp: number;
  badges: string[];
}

export default function StepIndicator({ currentStep, xp, badges }: StepIndicatorProps) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep);

  return (
    <div className="border-b-4 border-black bg-white px-5 py-4">
      {/* XP Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-neo-yellow border-2 border-black rounded-full flex items-center justify-center text-black">
            <Lightning size={12} weight="fill" />
          </div>
          <span className="font-black text-[11px] uppercase tracking-widest">{xp} XP</span>
        </div>
        {badges.length > 0 && (
          <div className="flex items-center gap-1">
            {badges.map((b, i) => (
              <span key={i} className="flex items-center justify-center w-6 h-6 bg-neo-lime border-2 border-black rounded-full text-black" title={b}>
                <Medal size={12} weight="fill" />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isActive = i === currentIdx;
          const isDone = i < currentIdx;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`w-8 h-8 border-[3px] border-black rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-all ${
                  isActive
                    ? "bg-neo-orange shadow-[2px_2px_0px_0px_#000] scale-110"
                    : isDone
                    ? "bg-neo-lime"
                    : "bg-[#EAE8E0]"
                }`}
                title={step.label}
              >
                {isDone ? <Check size={14} weight="bold" /> : step.icon}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-[3px] ${isDone ? "bg-neo-lime" : "bg-black/20"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

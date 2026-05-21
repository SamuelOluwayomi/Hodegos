"use client";

import React from "react";
import { Plant, ChartLineUp, Trophy, Check } from "@phosphor-icons/react";

const LEVELS = [
  {
    id: "beginner" as const,
    label: "Beginner",
    icon: <Plant size={32} weight="fill" />,
    desc: "I'm new to trading — teach me everything!",
    color: "bg-neo-lime",
    xpBonus: "+10 XP",
  },
  {
    id: "intermediate" as const,
    label: "Intermediate",
    icon: <ChartLineUp size={32} weight="fill" />,
    desc: "I know the basics but want to level up",
    color: "bg-neo-yellow",
    xpBonus: "+20 XP",
  },
  {
    id: "master" as const,
    label: "Master",
    icon: <Trophy size={32} weight="fill" />,
    desc: "I'm experienced — challenge me!",
    color: "bg-neo-orange",
    xpBonus: "+30 XP",
  },
];

interface LevelSelectorProps {
  selected: string;
  onSelect: (level: 'beginner' | 'intermediate' | 'master') => void;
}

export default function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
  return (
    <div className="p-5">
      <h3 className="font-black text-sm uppercase tracking-widest mb-1">Your Trading Level</h3>
      <p className="font-bold text-[11px] text-black/60 mb-4">Where do you think you stand?</p>
      <div className="flex flex-col gap-3">
        {LEVELS.map((level) => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className={`${level.color} border-[3px] border-black p-4 flex items-center gap-4 text-left transition-all ${
              selected === level.id
                ? "shadow-[6px_6px_0px_0px_#000] scale-[1.01]"
                : "shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
            }`}
          >
            <div className="text-black shrink-0">{level.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-black text-sm uppercase tracking-widest">{level.label}</p>
                <span className="bg-black text-white px-2 py-0.5 font-black text-[8px] uppercase tracking-widest">
                  {level.xpBonus}
                </span>
              </div>
              <p className="font-bold text-[11px] text-black/70 mt-1">{level.desc}</p>
            </div>
            {selected === level.id && (
              <div className="w-7 h-7 bg-black text-white rounded-full flex items-center justify-center font-black shrink-0">
                <Check size={16} weight="bold" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

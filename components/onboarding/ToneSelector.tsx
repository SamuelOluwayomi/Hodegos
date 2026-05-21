"use client";

import React from "react";
import { Smiley, Target, Lightning, Brain, Check } from "@phosphor-icons/react";

const TONES = [
  {
    id: "friendly" as const,
    label: "Friendly",
    icon: <Smiley size={24} weight="fill" />,
    desc: "Warm, encouraging, celebrates your wins",
    color: "bg-neo-lime",
  },
  {
    id: "disciplined" as const,
    label: "Disciplined",
    icon: <Target size={24} weight="fill" />,
    desc: "Focused, structured, keeps you on track",
    color: "bg-neo-yellow",
  },
  {
    id: "straight" as const,
    label: "Straight-Shooter",
    icon: <Lightning size={24} weight="fill" />,
    desc: "Direct, no fluff, just the facts",
    color: "bg-neo-orange",
  },
  {
    id: "socratic" as const,
    label: "Socratic",
    icon: <Brain size={24} weight="fill" />,
    desc: "Asks questions to help you discover answers",
    color: "bg-white",
  },
];

interface ToneSelectorProps {
  selected: string;
  onSelect: (tone: 'friendly' | 'disciplined' | 'straight' | 'socratic') => void;
}

export default function ToneSelector({ selected, onSelect }: ToneSelectorProps) {
  return (
    <div className="p-5">
      <h3 className="font-black text-sm uppercase tracking-widest mb-1">Choose Your AI Tone</h3>
      <p className="font-bold text-[11px] text-black/60 mb-4">How should Hodegos talk to you?</p>
      <div className="grid grid-cols-2 gap-3">
        {TONES.map((tone) => (
          <button
            key={tone.id}
            onClick={() => onSelect(tone.id)}
            className={`${tone.color} border-[3px] border-black p-4 text-left transition-all ${
              selected === tone.id
                ? "shadow-[4px_4px_0px_0px_#000] scale-[1.02]"
                : "shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            }`}
          >
            <div className="mb-2 text-black">{tone.icon}</div>
            <p className="font-black text-[11px] uppercase tracking-widest">{tone.label}</p>
            <p className="font-bold text-[10px] text-black/60 mt-1 leading-snug">{tone.desc}</p>
            {selected === tone.id && (
              <div className="mt-2 inline-flex items-center gap-1 bg-black text-white px-2 py-0.5 font-black text-[8px] uppercase tracking-widest">
                <span>Selected</span> <Check size={10} weight="bold" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";

export interface QuizQuestion {
  type: "mcq" | "explain";
  question: string;
  options?: { label: string; text: string }[];
  answered?: boolean;
  selectedAnswer?: string;
}

/**
 * Parse the last AI message to extract a quiz question.
 * 
 * MCQ format:
 * [MCQ]
 * Question text here?
 * A) Option text
 * B) Option text
 * C) Option text
 * D) Option text
 * [/MCQ]
 * 
 * Explain format:
 * [EXPLAIN]
 * Question text here?
 * [/EXPLAIN]
 */
export function parseQuizQuestion(content: string): QuizQuestion | null {
  const hasMcqTag = content.includes("[MCQ]");
  const hasExplainTag = content.includes("[EXPLAIN]");

  if (hasMcqTag) {
    const mcqStart = content.indexOf("[MCQ]") + 5;
    const mcqEnd = content.indexOf("[/MCQ]");
    const block = mcqEnd !== -1 
      ? content.slice(mcqStart, mcqEnd).trim() 
      : content.slice(mcqStart).trim();

    const lines = block.split("\n").map(l => l.trim()).filter(Boolean);
    const options: { label: string; text: string }[] = [];
    const questionLines: string[] = [];

    for (const line of lines) {
      const optMatch = line.match(/^([A-D])\)\s*(.+)/i);
      if (optMatch) {
        options.push({ label: optMatch[1].toUpperCase(), text: optMatch[2] });
      } else {
        // Exclude generic footer lines that the AI sometimes outputs inside/after choices
        const lowerLine = line.toLowerCase();
        if (!lowerLine.includes("please choose") && 
            !lowerLine.includes("remember, you'll get") && 
            !lowerLine.includes("good luck") &&
            !lowerLine.includes("correct answer") &&
            !lowerLine.includes("correct_answer") &&
            !lowerLine.includes("answer:") &&
            !/^\s*answer\s*is/i.test(line) &&
            !/^\s*correct\s*option/i.test(line)) {
          questionLines.push(line);
        }
      }
    }

    if (options.length >= 2) {
      return {
        type: "mcq",
        question: questionLines.join("\n"),
        options,
      };
    }
  }

  if (hasExplainTag) {
    const explainStart = content.indexOf("[EXPLAIN]") + 9;
    const explainEnd = content.indexOf("[/EXPLAIN]");
    const question = explainEnd !== -1
      ? content.slice(explainStart, explainEnd).trim()
      : content.slice(explainStart).trim();

    return {
      type: "explain",
      question,
    };
  }

  return null;
}

/**
 * Strips quiz tags and all quiz options from message content for clean display.
 */
export function stripQuizTags(content: string): string {
  let clean = content;
  
  // Strip MCQ block completely
  const mcqIndex = clean.indexOf("[MCQ]");
  if (mcqIndex !== -1) {
    const mcqEnd = clean.indexOf("[/MCQ]");
    if (mcqEnd !== -1) {
      clean = clean.slice(0, mcqIndex) + clean.slice(mcqEnd + 6);
    } else {
      clean = clean.slice(0, mcqIndex);
    }
  }

  // Strip EXPLAIN block completely
  const explainIndex = clean.indexOf("[EXPLAIN]");
  if (explainIndex !== -1) {
    const explainEnd = clean.indexOf("[/EXPLAIN]");
    if (explainEnd !== -1) {
      clean = clean.slice(0, explainIndex) + clean.slice(explainEnd + 10);
    } else {
      clean = clean.slice(0, explainIndex);
    }
  }

  return clean.trim();
}

interface MCQRendererProps {
  question: QuizQuestion;
  onSubmit: (answer: string) => void;
  disabled: boolean;
}

export function MCQRenderer({ question, onSubmit, disabled }: MCQRendererProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleToggle = (label: string) => {
    if (disabled || submitted) return;
    // Toggle: click same option to deselect, or pick a different one
    setSelected(prev => (prev === label ? null : label));
  };

  const handleSubmit = () => {
    if (!selected || disabled || submitted) return;
    const opt = question.options?.find(o => o.label === selected);
    if (!opt) return;
    setSubmitted(true);
    onSubmit(`${opt.label}) ${opt.text}`);
  };

  const colors = [
    "bg-neo-lime",
    "bg-neo-yellow",
    "bg-neo-orange",
    "bg-neo-cyan",
  ];

  return (
    <div className="px-5 pb-4">
      {/* Question card */}
      <div className="bg-white border-[3px] border-black p-4 mb-3 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-neo-orange border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase tracking-widest">
            Multiple Choice
          </span>
          {!submitted && (
            <span className="font-bold text-[9px] uppercase tracking-widest text-black/40">
              Click to select, then submit
            </span>
          )}
        </div>
        <p className="font-bold text-sm leading-relaxed">{question.question}</p>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {question.options?.map((opt, i) => {
          const isSelected = selected === opt.label;
          const isLockedOut = submitted && !isSelected;

          return (
            <button
              key={opt.label}
              onClick={() => handleToggle(opt.label)}
              disabled={submitted || disabled}
              className={`
                relative text-left p-3 border-[3px] border-black font-bold text-[12px] leading-snug
                transition-all duration-150
                ${isSelected
                  ? "translate-x-[3px] translate-y-[3px] shadow-none ring-2 ring-black ring-offset-1"
                  : "shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none"
                }
                ${isLockedOut ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                ${submitted && !isSelected ? "opacity-30" : ""}
                ${colors[i % colors.length]}
              `}
            >
              <span className="inline-flex items-center justify-center w-6 h-6 bg-black text-white font-black text-[10px] mr-2 shrink-0 border border-black">
                {opt.label}
              </span>
              {opt.text}
              {isSelected && (
                <span className="absolute top-2 right-2 font-black text-[10px] uppercase tracking-widest bg-black text-white px-1.5 py-0.5">
                  {submitted ? "Submitted" : "Selected"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit button — only visible when an option is selected but not yet submitted */}
      {selected && !submitted && !disabled && (
        <button
          onClick={handleSubmit}
          className="mt-3 w-full bg-black text-white border-[3px] border-black p-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#D0EE51] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
        >
          Submit Answer →
        </button>
      )}
    </div>
  );
}

interface ExplainRendererProps {
  question: QuizQuestion;
}

export function ExplainRenderer({ question }: ExplainRendererProps) {
  return (
    <div className="px-5 pb-2">
      {/* Question card */}
      <div className="bg-white border-[3px] border-black p-4 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-neo-cyan border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase tracking-widest">
            Explain
          </span>
        </div>
        <p className="font-bold text-sm leading-relaxed">{question.question}</p>
        <p className="font-bold text-[10px] uppercase tracking-widest text-black/50 mt-2">
          Type your answer below and hit send
        </p>
      </div>
    </div>
  );
}

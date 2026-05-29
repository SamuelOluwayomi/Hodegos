"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Message } from "@/hooks/useChat";
import {
  parseQuizQuestion,
  stripQuizTags,
  MCQRenderer,
  ExplainRenderer,
  QuizQuestion,
} from "./QuizRenderer";

import { ArrowCounterClockwise } from "@phosphor-icons/react";

interface OnboardingChatProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onRetry?: () => void;
  quickActions?: { label: React.ReactNode; value: string; color: string }[];
  hideInput?: boolean;
}

const renderMarkdown = (text: string) => {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let isBullet = false;
    let cleanLine = line.trim();
    if (cleanLine.startsWith('***')) {
      isBullet = true;
      cleanLine = cleanLine.substring(1);
    } else if (cleanLine.startsWith('* ')) {
      isBullet = true;
      cleanLine = cleanLine.substring(2);
    } else if (cleanLine.startsWith('- ')) {
      isBullet = true;
      cleanLine = cleanLine.substring(2);
    }

    const imageMatch = cleanLine.match(/\[IMAGE[-_ ]PLACEHOLDER:\s*(.*?)\]/i);
    if (imageMatch) {
      const desc = imageMatch[1].trim().toLowerCase();
      let src = "";
      let alt = "Trading Illustration";
      
      if (desc.includes("trading") || desc.includes("intro") || desc.includes("buy")) {
        src = "/trading_intro.png";
        alt = "Introduction to Trading";
      } else if (desc.includes("exchange") || desc.includes("order book")) {
        src = "/crypto_exchanges.png";
        alt = "Crypto Exchanges & Order Books";
      } else if (desc.includes("pair") || desc.includes("pairs")) {
        src = "/trading_pairs.png";
        alt = "Trading Pairs";
      } else if (desc.includes("order") || desc.includes("market") || desc.includes("limit")) {
        src = "/market_limit.png";
        alt = "Market vs Limit Orders";
      } else if (desc.includes("chart") || desc.includes("candle") || desc.includes("basics")) {
        src = "/charts_basics.png";
        alt = "Reading Charts & Candlesticks";
      } else if (desc.includes("risk") || desc.includes("management") || desc.includes("stop loss")) {
        src = "/risk_management.jpg";
        alt = "Risk Management";
      } else if (desc.includes("spot") || desc.includes("perpetual") || desc.includes(" perp")) {
        src = "/spot_perpetual.png";
        alt = "Spot vs Perpetual Trading";
      } else {
        src = "/trading_intro.png";
      }
      
      return (
        <div key={i} className="my-3 border-[3px] border-black bg-white p-2 neo-shadow-sm max-w-md mx-auto text-center">
          <img src={src} alt={alt} className="w-full h-auto object-cover border-[3px] border-black" />
          <p className="font-black text-[9px] uppercase tracking-widest text-center mt-2 text-black/60 bg-neo-yellow border-t-2 border-black py-1">
            {alt}
          </p>
        </div>
      );
    }

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-black text-black">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });

    if (isBullet) {
      return (
        <div key={i} className="flex gap-2 mb-1.5 items-start">
          <span className="text-[12px] leading-none mt-1 font-black text-neo-lime drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">•</span>
          <div className="flex-1 leading-relaxed">{renderedParts}</div>
        </div>
      );
    }
    if (cleanLine === '') {
      return <div key={i} className="h-2"></div>;
    }
    return <div key={i} className="mb-2 leading-relaxed last:mb-0">{renderedParts}</div>;
  });
};

export default function OnboardingChat({ messages, isLoading, onSendMessage, onRetry, quickActions, hideInput }: OnboardingChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  // Track which message indices have had their MCQ answered (so we disable after selection)
  const [answeredMCQs, setAnsweredMCQs] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    const sanitized = input.replace(/<[^>]*>?/gm, "").trim();
    if (!sanitized || isLoading) return;
    onSendMessage(sanitized);
    setInput("");
  };

  // Detect the active quiz question from the LAST assistant message
  const activeQuiz: { question: QuizQuestion; msgIndex: number } | null = useMemo(() => {
    if (messages.length === 0) return null;
    // Find the last assistant message
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant" && msg.content) {
        const parsed = parseQuizQuestion(msg.content);
        if (parsed) {
          return { question: parsed, msgIndex: i };
        }
        break; // Only check the last assistant message
      }
    }
    return null;
  }, [messages]);

  // Determine if the user has requested to ask a question
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content;
  const isUserAskingQuestion = lastUserMsg === "I have a question about this...";

  // Determine input visibility:
  // - hideInput prop takes priority
  // - If there's an active MCQ that hasn't been answered yet, hide the text input
  // - If there's an active EXPLAIN question, show the text input
  // - If the user is in the middle of asking a question, show the text input
  // - If there are quick actions available, hide the text input (user should use buttons)
  // - Otherwise, show normally
  const isMCQActive = activeQuiz?.question.type === "mcq" && !answeredMCQs.has(activeQuiz.msgIndex);
  const isExplainActive = activeQuiz?.question.type === "explain";
  const hasQuickActions = quickActions && quickActions.length > 0;
  
  const shouldShowInput = 
    !hideInput && 
    !isMCQActive && 
    (isExplainActive || isUserAskingQuestion || !hasQuickActions);

  const shouldHideInput = !shouldShowInput;

  // Determine quick action visibility:
  // - Hide if loading
  // - Hide if an MCQ is active
  // - Hide if the user is in the middle of typing a question
  const shouldShowQuickActions = 
    hasQuickActions && 
    !isLoading && 
    !isMCQActive && 
    !isUserAskingQuestion;

  const handleMCQSelect = (answer: string) => {
    if (!activeQuiz) return;
    setAnsweredMCQs(prev => new Set(prev).add(activeQuiz.msgIndex));
    onSendMessage(answer);
  };

  // Filter + process messages for display
  const displayMessages = messages.filter((m, i) => {
    if (m.content.startsWith('[SYSTEM]')) return false;
    // Hide empty assistant messages unless it is the last message and we are loading
    if (m.role === 'assistant' && m.content === '') {
      const isLast = i === messages.length - 1;
      return isLast && isLoading;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4" style={{ scrollBehavior: "smooth" }}>
        {displayMessages.map((msg, i) => {
          // Find the original index in the full messages array
          const originalIndex = messages.indexOf(msg);
          const quizInThisMsg = msg.role === "assistant" ? parseQuizQuestion(msg.content) : null;
          const cleanContent = quizInThisMsg ? stripQuizTags(msg.content) : msg.content;

          return (
            <React.Fragment key={i}>
              <div className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <span className="font-black text-[9px] uppercase tracking-widest text-black/40 mx-1">
                  {msg.role === "user" ? "You" : "Hodegos AI"}
                </span>
                 <div
                  className={`px-4 py-3 text-[13px] font-bold leading-relaxed max-w-[85%] border-[3px] border-black ${
                    msg.role === "user"
                      ? "bg-neo-lime rounded-xl rounded-tr-none shadow-[3px_3px_0px_0px_#000]"
                      : msg.content.includes("Something went wrong")
                        ? "bg-rose-100 text-rose-800 rounded-xl rounded-tl-none shadow-[3px_3px_0px_0px_#000]"
                        : "bg-white rounded-xl rounded-tl-none shadow-[3px_3px_0px_0px_#000]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    cleanContent ? renderMarkdown(cleanContent) : (isLoading && i === displayMessages.length - 1 ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : "")
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{cleanContent}</span>
                  )}

                  {msg.role === "assistant" && msg.content.includes("Something went wrong") && onRetry && (
                    <div className="mt-2 border-t-2 border-black/10 pt-2 flex items-center">
                      <button
                        onClick={onRetry}
                        className="bg-neo-orange text-black border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer inline-flex items-center gap-1"
                      >
                        <ArrowCounterClockwise size={12} weight="bold" /> Try Again / Resend
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Render quiz UI inline after the assistant message */}
              {quizInThisMsg && quizInThisMsg.type === "mcq" && (
                <MCQRenderer
                  question={quizInThisMsg}
                  onSubmit={handleMCQSelect}
                  disabled={isLoading || answeredMCQs.has(originalIndex)}
                />
              )}
              {quizInThisMsg && quizInThisMsg.type === "explain" && (
                <ExplainRenderer question={quizInThisMsg} />
              )}
            </React.Fragment>
          );
        })}
        {isLoading && displayMessages.length > 0 && displayMessages[displayMessages.length - 1].role === "user" && (
          <div className="flex flex-col gap-1 items-start">
            <span className="font-black text-[9px] uppercase tracking-widest text-black/40 mx-1">
              Hodegos AI
            </span>
            <div className="px-4 py-3 text-[13px] font-bold leading-relaxed max-w-[85%] border-[3px] border-black bg-white rounded-xl rounded-tl-none shadow-[3px_3px_0px_0px_#000]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick action buttons */}
      {shouldShowQuickActions && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(action.value)}
              className={`${action.color} border-[3px] border-black px-3 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input — hidden for MCQ, shown for explain and normal chat */}
      {!shouldHideInput && (
        <div className="border-t-4 border-black bg-white p-4">
          <div className="relative">
            {isExplainActive && (
              <div className="absolute -top-8 left-0 right-0">
                <span className="bg-neo-cyan border-2 border-black border-b-0 px-2 py-0.5 font-black text-[9px] uppercase tracking-widest inline-block">
                  Your explanation
                </span>
              </div>
            )}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isExplainActive ? "Explain in your own words..." : "Type your message..."}
              disabled={isLoading}
              className={`w-full bg-[#EAE8E0] border-[3px] border-black p-3 pr-14 font-bold text-xs outline-none focus:bg-white transition-colors disabled:opacity-50 ${
                isExplainActive ? "ring-2 ring-neo-cyan" : ""
              }`}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white flex items-center justify-center hover:bg-neo-orange hover:text-black border-2 border-transparent hover:border-black transition-all disabled:opacity-30"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

import {
  ArrowCounterClockwise,
  CheckCircle,
  XCircle,
  Warning,
  Info,
  TrendUp,
  TrendDown,
  ChartLine,
  ChartBar,
  Lightning,
  Star,
  Trophy,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Fire,
  ThumbsUp,
  HandWaving,
  BookOpen,
  Lightbulb,
  Target,
  Coins,
  Wallet,
  Question,
  Smiley,
  SmileyWink,
  Lock,
  ShieldCheck,
  Scales,
  Eye,
  SealCheck,
  Clock,
  Notepad,
  Globe,
  ArrowsLeftRight,
} from "@phosphor-icons/react";

// Map of icon names the AI can output via [ICON:Name] to Phosphor components
const ICON_MAP: Record<string, React.ReactElement> = {
  CheckCircle:    <CheckCircle    size={16} weight="fill" className="inline text-green-600 align-middle" />,
  XCircle:        <XCircle        size={16} weight="fill" className="inline text-rose-600 align-middle" />,
  Warning:        <Warning        size={16} weight="fill" className="inline text-amber-500 align-middle" />,
  Info:           <Info           size={16} weight="fill" className="inline text-sky-500 align-middle" />,
  TrendUp:        <TrendUp        size={16} weight="bold" className="inline text-green-600 align-middle" />,
  TrendDown:      <TrendDown      size={16} weight="bold" className="inline text-rose-600 align-middle" />,
  ChartLine:      <ChartLine      size={16} weight="bold" className="inline text-black align-middle" />,
  ChartBar:       <ChartBar       size={16} weight="bold" className="inline text-black align-middle" />,
  Lightning:      <Lightning      size={16} weight="fill" className="inline text-neo-orange align-middle" />,
  Star:           <Star           size={16} weight="fill" className="inline text-neo-yellow align-middle" />,
  Trophy:         <Trophy         size={16} weight="fill" className="inline text-neo-orange align-middle" />,
  ArrowRight:     <ArrowRight     size={16} weight="bold" className="inline align-middle" />,
  ArrowUp:        <ArrowUp        size={16} weight="bold" className="inline text-green-600 align-middle" />,
  ArrowDown:      <ArrowDown      size={16} weight="bold" className="inline text-rose-600 align-middle" />,
  Fire:           <Fire           size={16} weight="fill" className="inline text-neo-orange align-middle" />,
  ThumbsUp:       <ThumbsUp       size={16} weight="fill" className="inline text-neo-lime align-middle" />,
  HandWaving:     <HandWaving     size={16} weight="fill" className="inline text-neo-yellow align-middle" />,
  BookOpen:       <BookOpen       size={16} weight="bold" className="inline text-black align-middle" />,
  Lightbulb:      <Lightbulb      size={16} weight="fill" className="inline text-neo-yellow align-middle" />,
  Target:         <Target         size={16} weight="bold" className="inline text-black align-middle" />,
  Coins:          <Coins          size={16} weight="fill" className="inline text-neo-orange align-middle" />,
  Wallet:         <Wallet         size={16} weight="fill" className="inline text-black align-middle" />,
  Question:       <Question       size={16} weight="fill" className="inline text-sky-500 align-middle" />,
  Smiley:         <Smiley         size={16} weight="fill" className="inline text-neo-yellow align-middle" />,
  SmileyWink:     <SmileyWink     size={16} weight="fill" className="inline text-neo-yellow align-middle" />,
  Lock:           <Lock           size={16} weight="fill" className="inline text-black align-middle" />,
  ShieldCheck:    <ShieldCheck    size={16} weight="fill" className="inline text-green-600 align-middle" />,
  Scales:         <Scales         size={16} weight="bold" className="inline text-black align-middle" />,
  Eye:            <Eye            size={16} weight="bold" className="inline text-black align-middle" />,
  SealCheck:      <SealCheck      size={16} weight="fill" className="inline text-green-600 align-middle" />,
  Clock:          <Clock          size={16} weight="bold" className="inline text-black align-middle" />,
  Notepad:        <Notepad        size={16} weight="bold" className="inline text-black align-middle" />,
  Globe:          <Globe          size={16} weight="bold" className="inline text-black align-middle" />,
  ArrowsLeftRight:<ArrowsLeftRight size={16} weight="bold" className="inline text-black align-middle" />,
};

/** Replace [ICON:Name] tokens in a string with Phosphor icon elements */
function renderWithIcons(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/\[ICON:([A-Za-z]+)\]/g);
  const result: React.ReactNode[] = [];
  parts.forEach((part, idx) => {
    if (idx % 2 === 1) {
      // Odd indices are captured icon names
      const icon = ICON_MAP[part];
      if (icon) {
        result.push(React.cloneElement(icon, { key: `${keyPrefix}-icon-${idx}` }));
      } else {
        result.push(<span key={`${keyPrefix}-unknown-${idx}`}>[{part}]</span>);
      }
    } else if (part) {
      result.push(<span key={`${keyPrefix}-text-${idx}`}>{part}</span>);
    }
  });
  return result;
}

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

    // Handle markdown image syntax anywhere in the line: ![alt text](path)
    // Normalize common relative paths (./public/, ./, public/) to root '/'
    const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    const images: Array<{ alt: string; src: string }> = [];
    let imgMatch: RegExpExecArray | null;
    while ((imgMatch = mdImageRegex.exec(cleanLine)) !== null) {
      let alt = imgMatch[1] || 'Trading Illustration'
      let src = imgMatch[2].trim()
      // Strip surrounding quotes if present
      if ((src.startsWith('"') && src.endsWith('"')) || (src.startsWith("'") && src.endsWith("'"))) {
        src = src.slice(1, -1)
      }
      // Normalize common prefixes
      src = src.replace(/^\.\/public\//, '/').replace(/^public\//, '/').replace(/^\.\//, '/')
      // If no leading slash, assume public root
      if (!src.startsWith('/')) src = '/' + src
      images.push({ alt, src })
    }

    if (images.length > 0) {
      // Known public assets — only render images that exist in the public/ folder.
      const PUBLIC_IMAGES = new Set([
        '/crypto_exchanges.png', '/hero-guide.png', '/main.png', '/market_limit.png', '/risk_management.jpg',
        '/spot_perpetual.png', '/trading_intro.png', '/trading_pairs.png', '/hack.png', '/me.png'
      ])

      return (
        <div key={i} className="my-3 border-[3px] border-black bg-white p-2 max-w-md mx-auto text-center">
          {images.map((im, idx) => {
            const filename = '/' + im.src.split('?')[0].split('/').pop()
            const srcToUse = PUBLIC_IMAGES.has(filename) ? filename : null
            return (
              <div key={idx} className="mb-3">
                {srcToUse ? (
                  <img
                    src={srcToUse}
                    alt={im.alt}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/hero-guide.png' }}
                    className="w-full h-auto object-cover border-[3px] border-black" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center border-[3px] border-black bg-[#F3F3F3]">
                    <span className="font-black text-sm text-black/60">{im.alt}</span>
                  </div>
                )}
                <p className="font-black text-[9px] uppercase tracking-widest text-center mt-2 text-black/60 bg-neo-yellow border-t-2 border-black py-1">
                  {im.alt}
                </p>
              </div>
            )
          })}
        </div>
      )
    }

    // Fallback: legacy [IMAGE_PLACEHOLDER: ...] support
    const imageMatch = cleanLine.match(/\[IMAGE[-_ ]PLACEHOLDER:\s*(.*?)\]/i);
    if (imageMatch) {
      const desc = imageMatch[1].trim().toLowerCase();
      let src = "/trading_intro.png";
      let alt = "Trading Illustration";
      if (desc.includes("exchange") || desc.includes("order book")) { src = "/crypto_exchanges.png"; alt = "Crypto Exchanges"; }
      else if (desc.includes("pair")) { src = "/trading_pairs.png"; alt = "Trading Pairs"; }
      else if (desc.includes("market") || desc.includes("limit") || desc.includes("order")) { src = "/market_limit.png"; alt = "Market vs Limit Orders"; }
      else if (desc.includes("risk") || desc.includes("stop loss")) { src = "/risk_management.jpg"; alt = "Risk Management"; }
      else if (desc.includes("spot") || desc.includes("perpetual")) { src = "/spot_perpetual.png"; alt = "Spot vs Perpetual"; }
      return (
        <div key={i} className="my-3 border-[3px] border-black bg-white p-2 max-w-md mx-auto text-center">
          <img src={src} alt={alt} className="w-full h-auto object-cover border-[3px] border-black" />
          <p className="font-black text-[9px] uppercase tracking-widest text-center mt-2 text-black/60 bg-neo-yellow border-t-2 border-black py-1">{alt}</p>
        </div>
      );
    }

    // Render bold (**text**) and [ICON:Name] tokens inline
    const boldParts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = boldParts.flatMap((part, j): React.ReactNode[] => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return [<strong key={`b-${i}-${j}`} className="font-black text-black">{renderWithIcons(inner, `b-${i}-${j}`)}</strong>];
      }
      return renderWithIcons(part, `t-${i}-${j}`);
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
  const displayMessages = messages.filter((m) => {
    if (m.content.startsWith('[SYSTEM]')) return false;
    // Hide empty assistant messages unless we are currently loading
    if (m.role === 'assistant' && m.content === '') {
      return isLoading;
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
                        className="bg-neo-orange text-black border-2 border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer inline-flex items-center gap-1"
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
              className={`${action.color} border-[3px] border-black px-3 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-[3px_3px_0px_0px_#000] hover:translate-x-0.75 hover:translate-y-0.75 hover:shadow-none transition-all`}
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

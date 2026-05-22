"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useChat } from "@/hooks/useChat";
import StepIndicator from "./StepIndicator";
import ToneSelector from "./ToneSelector";
import LevelSelector from "./LevelSelector";
import OnboardingChat from "./OnboardingChat";
import DemoTrading from "./DemoTrading";
import { Confetti, ArrowLeft, FileText, ArrowCounterClockwise } from "@phosphor-icons/react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}

type OnboardingStep = "welcome" | "profile" | "tone" | "level" | "learn" | "quiz" | "demo" | "complete";

export default function OnboardingModal({ open, onClose, walletAddress }: OnboardingModalProps) {
  const { messages, isLoading, sendMessage, retryLastMessage, profile, updateProfile, addXP, awardBadge } = useChat(walletAddress);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [nameInput, setNameInput] = useState("");
  const [hasTriggeredWelcome, setHasTriggeredWelcome] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [hasInitializedStep, setHasInitializedStep] = useState(false);

  // Auto-trigger welcome message
  useEffect(() => {
    if (open && !hasTriggeredWelcome && messages.length === 0 && !profile.userName) {
      setHasTriggeredWelcome(true);
      sendMessage(
        "[SYSTEM] The user just connected their wallet and opened onboarding. Introduce yourself as Hodegos AI. Explain that Hodegos means 'Guide' in Greek. Welcome them warmly. Ask what they'd like to be called. DO NOT ask about their trading experience yet, as they will select that in the UI."
      );
    }
  }, [open, hasTriggeredWelcome, messages.length, sendMessage, profile.userName]);

  // Sync state with profile exactly once on load to support resuming
  useEffect(() => {
    if (!hasInitializedStep && profile.walletAddress) {
      if (profile.onboardingComplete) {
        setStep("complete");
        setHasInitializedStep(true);
      } else if (profile.onboardingStep && profile.onboardingStep !== "welcome") {
        setStep(profile.onboardingStep as OnboardingStep);
        setHasInitializedStep(true);
      } else if (profile.userName) {
        setStep("tone");
        setHasInitializedStep(true);
      } else {
        // If it's a fresh user, we have initialized at 'welcome'
        setHasInitializedStep(true);
      }
    }
  }, [profile, hasInitializedStep]);

  const goToStep = useCallback((nextStep: OnboardingStep) => {
    setStep(nextStep);
    updateProfile({ onboardingStep: nextStep });
  }, [updateProfile]);

  const handleBack = useCallback(() => {
    if (step === "tone") {
      goToStep("welcome");
    } else if (step === "level") {
      goToStep("tone");
    } else if (step === "learn") {
      goToStep("level");
    } else if (step === "quiz") {
      if (profile.tradingLevel === "beginner") {
        goToStep("learn");
      } else {
        goToStep("level");
      }
    } else if (step === "demo") {
      goToStep("quiz");
    }
  }, [step, profile.tradingLevel, goToStep]);

  const handleNameSubmit = () => {
    const sanitizedName = nameInput.replace(/<[^>]*>?/gm, "").trim();
    if (!sanitizedName) return;
    updateProfile({ userName: sanitizedName });
    addXP(10);
    awardBadge("First Steps");
    sendMessage(sanitizedName);
    goToStep("tone");
  };

  const handleToneSelect = (tone: 'friendly' | 'disciplined' | 'straight' | 'socratic') => {
    updateProfile({ aiTone: tone });
    addXP(5);
  };

  const handleToneContinue = () => {
    goToStep("level");
  };

  const handleLevelSelect = (level: 'beginner' | 'intermediate' | 'master') => {
    updateProfile({ tradingLevel: level });
    const xpBonus = level === "beginner" ? 10 : level === "intermediate" ? 20 : 30;
    addXP(xpBonus);

    if (level === "beginner") {
      sendMessage(
        `[SYSTEM] User selected BEGINNER level. Start teaching them trading fundamentals step by step. Begin with: "What is trading?" Use simple language, real-world analogies. Ask if they have any questions before moving to the next topic. Topics to cover in order: 1) What is trading 2) What are crypto exchanges 3) Trading pairs 4) Market vs Limit orders 5) Reading charts basics 6) Risk management 7) Spot vs Perpetual. Cover ONE topic at a time. Prefix each new topic with "Topic X of 7: [Name]" so they know their progress. Keep it digestible. Use [IMAGE_PLACEHOLDER: description] when a visual would help.`
      );
      goToStep("learn");
    } else {
      sendMessage(
        `[SYSTEM] User selected ${level.toUpperCase()} level. Ask them ${level === "intermediate" ? "3 intermediate" : "3 advanced"} trading questions to verify their knowledge. Ask ONE question at a time. Prefix each question with "Question X of 3". Mix multiple-choice and explain questions — use [MCQ] tags for multiple choice (with exactly 4 options A/B/C/D) and [EXPLAIN] tags for open-ended questions. If they answer correctly, award XP. After all 3 questions, summarize their score. If they got the majority right, explicitly say "You passed!" so they can proceed. If they failed, explicitly say "You didn't pass this time, let's review" and offer to try again.`
      );
      goToStep("quiz");
    }
  };

  const handleDemoComplete = () => {
    addXP(50);
    awardBadge("Paper Trader");
    updateProfile({ demoCompleted: true });
    goToStep("complete");
  };

  const handleSkipDemo = () => {
    awardBadge("Chain Ready");
    updateProfile({ demoCompleted: true });
    goToStep("complete");
  };

  const handleFinish = () => {
    updateProfile({ onboardingComplete: true });
    awardBadge("Chain Ready");
    onClose();
  };

  const handleChatSend = (msg: string) => {
    sendMessage(msg);
  };

  // Determine quick actions based on current step
  const getQuickActions = () => {
    if (step === "learn") {
      // Find the active topic number by looking at the first "Topic X" header in messages from the end
      let currentTopicNumber = 1;
      for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i];
        if (m.role === "assistant" && m.content) {
          const match = m.content.match(/Topic\s+(\d)\s*(?:of\s+\d+|:)/i);
          if (match) {
            currentTopicNumber = parseInt(match[1], 10);
            break;
          }
        }
      }

      const hasReachedLastTopic = currentTopicNumber === 7;

      const actions = [];

      // Only show Next Topic if we haven't reached the final topic yet
      if (!hasReachedLastTopic) {
        actions.push({ label: "Next Topic →", value: "Let's move to the next topic!", color: "bg-neo-lime" });
      }

      actions.push({ label: "I have a question", value: "I have a question about this...", color: "bg-neo-yellow" });
      
      // Let the user skip to quiz at any point if they feel confident
      actions.push({
        label: (
          <span className="flex items-center gap-1">
            Quiz Me! <FileText size={12} weight="bold" />
          </span>
        ),
        value: "I think I'm ready for the quiz!",
        color: "bg-neo-orange"
      });

      return actions;
    }
    if (step === "quiz") {
      if (quizPassed) {
        return [
          { label: "Ready for Demo →", value: "I'm ready for the demo trade!", color: "bg-neo-lime" },
        ];
      }
      return [
        { label: "Proceed to Demo →", value: "Let's skip the quiz and go to the demo trade.", color: "bg-neo-lime" },
        {
          label: (
            <span className="flex items-center gap-1">
              Retake Quiz <ArrowCounterClockwise size={12} weight="bold" />
            </span>
          ),
          value: "I want to retake the quiz.",
          color: "bg-neo-yellow"
        },
      ];
    }
    return [];
  };

  // Watch for quiz/learn step transitions in AI messages
  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== "assistant") return;

    const content = lastMsg.content.toLowerCase();

    if (step === "learn" && (content.includes("ready for the quiz") || content.includes("quiz time") || content.includes("let's test"))) {
      // AI suggested quiz — user can click the quick action
    }

    if (step === "quiz" && (content.includes("passed") || content.includes("all correct") || content.includes("great job"))) {
      setQuizPassed(true);
      awardBadge("Quick Learner");
    }
  }, [messages, step, awardBadge]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="fixed z-101 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[85vh] max-h-[850px] flex flex-col">
        {/* Neo-brutalist offset shadow */}
        <div className="absolute inset-0 translate-x-[10px] translate-y-[10px] bg-neo-orange border-4 border-black" />

        {/* Main modal container */}
        <div className="relative bg-[#EAE8E0] border-4 border-black flex flex-col h-full">
          {/* Modal header */}
          <div className="flex items-center justify-between border-b-4 border-black px-5 py-3 bg-neo-yellow shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center overflow-hidden border-2 border-black">
                <img src="/hero-guide.png" alt="Hodegos AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="font-black uppercase tracking-widest text-sm leading-none">Hodegos Onboarding</h2>
                <p className="font-bold text-[9px] uppercase tracking-widest text-black/60 mt-0.5">
                  {step === "complete" ? "All done!" : `Step: ${step}`}
                </p>
              </div>
            </div>

            {step !== "welcome" && step !== "complete" && (
              <button
                onClick={handleBack}
                className="px-3 py-1.5 border-[3px] border-black bg-white font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-1.5"
              >
                <ArrowLeft size={14} weight="bold" /> Back
              </button>
            )}
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={step} xp={profile.xp} badges={profile.badges} />

          {/* Content area — scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* WELCOME + PROFILE step: Chat + name input */}
            {(step === "welcome" || step === "profile") && (
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <OnboardingChat
                    messages={messages}
                    isLoading={isLoading}
                    onSendMessage={handleChatSend}
                    onRetry={retryLastMessage}
                    quickActions={[]}
                    hideInput={step === "welcome"}
                  />
                </div>
                {/* Name input bar (shown after AI intro) */}
                {step === "welcome" && messages.length >= 2 && !isLoading && !profile.userName && (
                  <div className="border-t-4 border-black bg-white p-4 shrink-0">
                    <label className="font-black text-[10px] uppercase tracking-widest block mb-2">What should I call you?</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                        placeholder="Enter your name..."
                        className="flex-1 bg-[#EAE8E0] border-[3px] border-black p-3 font-bold text-sm outline-none focus:bg-white transition-colors"
                      />
                      <button
                        onClick={handleNameSubmit}
                        disabled={!nameInput.trim()}
                        className="bg-neo-lime border-[3px] border-black px-5 font-black uppercase tracking-widest text-[11px] shadow-[3px_3px_0px_0px_#000] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all disabled:opacity-30"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TONE SELECTION step */}
            {step === "tone" && (
              <div>
                <ToneSelector selected={profile.aiTone} onSelect={handleToneSelect} />
                <div className="px-5 pb-5">
                  <button
                    onClick={handleToneContinue}
                    className="w-full bg-black text-white border-[3px] border-black p-3 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#FF9B3F] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
                  >
                    Continue with {profile.aiTone} tone →
                  </button>
                </div>
              </div>
            )}

            {/* LEVEL SELECTION step */}
            {step === "level" && (
              <LevelSelector selected={profile.tradingLevel} onSelect={handleLevelSelect} />
            )}

            {/* LEARN step (beginners): AI teaches step by step */}
            {step === "learn" && (
              <div className="flex flex-col h-full">
                <OnboardingChat
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={(msg) => {
                    const lower = msg.toLowerCase();
                    if (lower.includes("ready for the quiz") || lower.includes("ready!") || lower.includes("take the quiz") || lower.includes("quiz me")) {
                      sendMessage("[SYSTEM] User wants to take the quiz now. Start the beginner quiz. Ask 5 questions covering the 7 topics, one at a time. Prefix each question with 'Question X of 5'. Mix multiple-choice and explain questions — use [MCQ] tags for multiple choice (with exactly 4 options A/B/C/D) and [EXPLAIN] tags for open-ended questions. Aim for roughly 3 MCQ and 2 explain questions. Award +15 XP for each correct answer, +5 XP for trying. After all 5 questions, summarize their score. If they got at least 3 correct, explicitly say 'You passed! Great job!' so they can proceed. If they got fewer than 3 correct, explicitly say 'You didn't pass this time, but that's okay!' and offer to review the topics they missed before trying again.");
                      goToStep("quiz");
                    } else {
                      handleChatSend(msg);
                    }
                  }}
                  onRetry={retryLastMessage}
                  quickActions={getQuickActions()}
                />
              </div>
            )}

            {/* QUIZ step */}
            {step === "quiz" && (
              <div className="flex flex-col h-full">
                <OnboardingChat
                  messages={messages}
                  isLoading={isLoading}
                  onSendMessage={(msg) => {
                    const lower = msg.toLowerCase();
                    if (lower.includes("ready for the demo") || lower.includes("skip the quiz") || lower.includes("proceed to demo")) {
                      goToStep("demo");
                    } else if (lower.includes("retake the quiz")) {
                      setQuizPassed(false);
                      const level = profile.tradingLevel || "intermediate";
                      sendMessage(
                        `[SYSTEM] Reset and restart the quiz. User wants to retake the quiz. Ask them a new set of ${level === "beginner" ? "5 beginner" : level === "intermediate" ? "3 intermediate" : "3 advanced"} trading questions to verify their knowledge. Ask ONE question at a time. Prefix each question with "Question X of ${level === "beginner" ? "5" : "3"}". Mix multiple-choice and explain questions — use [MCQ] tags for multiple choice (with exactly 4 options A/B/C/D) and [EXPLAIN] tags for open-ended questions. If they answer correctly, award XP. After all questions, summarize their score. If they got the majority right, explicitly say "You passed!" so they can proceed. If they failed, explicitly say "You didn't pass this time, let's review" and offer to try again.`
                      );
                    } else {
                      handleChatSend(msg);
                    }
                  }}
                  onRetry={retryLastMessage}
                  quickActions={getQuickActions()}
                />
              </div>
            )}

            {/* DEMO step */}
            {step === "demo" && (
              <DemoTrading
                onComplete={handleDemoComplete}
                onSkip={profile.tradingLevel !== "beginner" ? handleSkipDemo : undefined}
                canSkip={profile.tradingLevel !== "beginner"}
              />
            )}

            {/* COMPLETE step */}
            {step === "complete" && (
              <div className="min-h-full overflow-y-auto flex flex-col items-center justify-center p-6 pb-8 text-center gap-4">
                <div className="text-black">
                  <Confetti size={48} weight="fill" />
                </div>
                <h3 className="font-black text-xl uppercase tracking-widest">Onboarding Complete!</h3>
                <p className="font-bold text-sm text-black/70 max-w-sm">
                  You&apos;re all set, <span className="font-black text-black">{profile.userName || "trader"}</span>!
                  Hodegos AI will be with you every step of the way.
                </p>

                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2">
                  <div className="bg-neo-lime border-[3px] border-black p-3 text-center">
                    <p className="font-black text-2xl">{profile.xp}</p>
                    <p className="font-black text-[9px] uppercase tracking-widest">Total XP</p>
                  </div>
                  <div className="bg-neo-yellow border-[3px] border-black p-3 text-center">
                    <p className="font-black text-2xl">{profile.badges.length}</p>
                    <p className="font-black text-[9px] uppercase tracking-widest">Badges</p>
                  </div>
                </div>

                {/* Badges display */}
                {profile.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {profile.badges.map((badge, i) => (
                      <div key={i} className="bg-white border-[3px] border-black px-3 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
                        {badge}
                      </div>
                    ))}
                  </div>
                )}

                {/* Level */}
                <div className="bg-neo-orange border-[3px] border-black px-6 py-2 font-black uppercase tracking-widest text-sm shadow-[3px_3px_0px_0px_#000]">
                  Level: {profile.tradingLevel}
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full max-w-xs bg-black text-white border-[3px] border-black p-4 font-black uppercase tracking-widest text-sm shadow-[4px_4px_0px_0px_#D0EE51] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all mt-2"
                >
                  Start Trading →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

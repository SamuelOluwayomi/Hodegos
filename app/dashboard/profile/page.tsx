"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useWallet, WalletId } from "@/lib/useWallet";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useChat } from "@/hooks/useChat";

const WALLET_LABELS: Partial<Record<WalletId, string>> = {
  keplr: "Keplr", leap: "Leap", ninji: "Ninji", metamask: "MetaMask",
};

import { getTierProgress, TIER_THRESHOLDS } from "@/lib/tiers";

function getBadgeIcon(badge: string) {
  const norm = badge.toLowerCase().trim();
  if (norm.includes("step") || norm.includes("first")) {
    return (
      <svg className="w-8 h-8 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    );
  }
  if (norm.includes("learner") || norm.includes("quiz")) {
    return (
      <svg className="w-8 h-8 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    );
  }
  if (norm.includes("paper") || norm.includes("demo") || norm.includes("trader")) {
    return (
      <svg className="w-8 h-8 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    );
  }
  if (norm.includes("chain") || norm.includes("ready") || norm.includes("native")) {
    return (
      <svg className="w-8 h-8 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  }
  return (
    <svg className="w-8 h-8 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
    </svg>
  );
}

function getTierIcon(index: number) {
  switch (index) {
    case 0:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 22c1.25-3.87 4-6 8-6s6.75 2.13 8 6" />
          <path d="M12 2v14" />
          <path d="M12 6c4-1.5 6-3 6-3s-1 4-3 6" />
          <path d="M12 9c-3.5-1-5-2.5-5-2.5s1 3.5 2.5 5" />
        </svg>
      );
    case 1:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 2:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
      );
    case 3:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
        </svg>
      );
    case 4:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
          <path d="M12 12l9-9-9 9z" />
          <path d="M14 6.5L17.5 10" />
          <path d="M9 15l-3-3" />
          <path d="M9 15a5 5 0 1 1 7.07-7.07L21 3s-3.5 1-7.07 4.57A5 5 0 0 1 9 15z" />
        </svg>
      );
    case 5:
    default:
      return (
        <svg className="w-6 h-6 mx-auto text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <path d="M3 20h18" />
        </svg>
      );
  }
}

export default function ProfilePage() {
  const { address, wallet, isConnected, disconnect, truncateAddress, isInitialized } = useWallet();
  const router = useRouter();
  const { profile, updateProfile } = useChat(address || undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const compressImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement("img");
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = (e) => reject(e);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await compressImage(file, 200, 200);
      updateProfile({ avatarUrl: base64 });
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDisconnect = () => { disconnect(); router.replace("/"); };

  if (!isInitialized || !isConnected || !address) return null;

  const displayAddress = truncateAddress(address);
  const walletLabel = WALLET_LABELS[wallet!] ?? wallet;

  const { currentTier, nextTier, xpToNext, progress: tierProgress } = getTierProgress(profile.xp);

  return (
    <div className="h-screen w-screen bg-[#FEFDF9] font-sans flex overflow-hidden">
      <DashboardSidebar onDisconnect={handleDisconnect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-[76px] bg-[#EAE8E0] border-b-4 border-black flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/main.png" alt="Hodegos" width={120} height={24} className="object-contain" style={{ height: "auto" }} />
            </Link>
            <div className="h-6 w-[2px] bg-black/20" />
            <span className="font-black text-xs uppercase tracking-widest bg-neo-lime px-2 py-0.5 border-2 border-black">
              Profile
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 font-bold text-[10px]">
              <span className="font-black uppercase">{walletLabel}</span>
              <span className="text-black/60">{displayAddress}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Profile hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main profile card */}
            <div className="lg:col-span-2 border-4 border-black bg-white neo-shadow overflow-hidden">
              <div className="bg-black h-24 relative">
                <div className="absolute inset-0 opacity-20"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, #D0EE51 0, #D0EE51 1px, transparent 0, transparent 50%)", backgroundSize: "8px 8px" }}
                />
                <div className="absolute bottom-0 left-6 translate-y-1/2 group cursor-pointer z-10" onClick={handleAvatarClick}>
                  <div className="w-20 h-20 rounded-full border-4 border-white bg-neo-lime flex items-center justify-center overflow-hidden relative shadow-[3px_3px_0px_0px_#000] hover:scale-105 transition-all">
                    <img src={profile.avatarUrl || "/hero-guide.png"} alt="Avatar" className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white text-[8px] font-black uppercase text-center leading-none p-1">
                      {uploading ? (
                        <span>Saving...</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mb-0.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                          <span>Upload</span>
                        </>
                      )}
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
              </div>
              <div className="pt-14 px-6 pb-6">
                <div className="flex items-end justify-between">
                  <div>
                    <h1 className="font-black text-2xl uppercase">{profile.userName || "Trader"}</h1>
                    <div className="font-bold text-xs text-black/50 mt-1 font-mono">{address}</div>
                  </div>
                  <div className={`${currentTier.color} border-[3px] border-black px-4 py-2 font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_0px_#000]`}>
                    {currentTier.level}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-4">
                  {[
                    { label: "XP Points", value: profile.xp, bg: "bg-neo-lime" },
                    { label: "Badges", value: profile.badges.length, bg: "bg-neo-yellow" },
                    { label: "Trading Level", value: currentTier.level, bg: "bg-neo-orange" },
                  ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} border-[3px] border-black p-4 neo-shadow`}>
                      <div className="font-black text-[9px] uppercase tracking-widest text-black/60 mb-1">{stat.label}</div>
                      <div className="font-black text-xl capitalize">{stat.value}</div>
                    </div>
                  ))}
                </div>

                {/* XP Progress */}
                <div className="mt-5">
                  <div className="flex justify-between font-black text-[10px] uppercase tracking-widest mb-2">
                    <span>{currentTier.level}</span>
                    <span>{nextTier ? `${xpToNext} XP to ${nextTier.level}` : "Max Level!"}</span>
                  </div>
                  <div className="h-4 bg-[#EAE8E0] border-[3px] border-black overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-700"
                      style={{ width: `${tierProgress}%` }}
                    >
                    </div>
                  </div>
                  <div className="flex justify-between font-bold text-[9px] text-black/40 mt-1">
                    <span>{profile.xp} XP</span>
                    <span>{nextTier ? `${nextTier.min} XP` : "∞"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallet info */}
            <div className="flex flex-col gap-4">
              <div className="bg-black text-white border-4 border-black p-5 neo-shadow">
                <div className="font-black text-[10px] uppercase tracking-widest text-white/40 mb-3">Wallet</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-neo-lime border-2 border-white flex items-center justify-center font-black text-black text-xs uppercase">
                    {walletLabel?.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-black text-sm">{walletLabel}</div>
                    <div className="font-bold text-[9px] text-white/40">Connected</div>
                  </div>
                </div>
                <div className="bg-white/10 border border-white/20 p-2 font-mono text-[9px] break-all">{address}</div>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="font-black text-[9px] uppercase text-neo-lime">Injective Testnet</span>
                </div>
              </div>
              <div className="bg-neo-orange border-4 border-black p-5 neo-shadow">
                <div className="font-black text-[10px] uppercase tracking-widest text-black/60 mb-2">Onboarding</div>
                <div className={`font-black text-xl ${profile.onboardingComplete ? "text-black" : "text-black/40"}`}>
                  {profile.onboardingComplete ? "✓ Complete" : "In Progress"}
                </div>
                {!profile.onboardingComplete && (
                  <Link href="/dashboard" className="block mt-3 bg-black text-white px-3 py-1.5 font-black text-[9px] uppercase text-center">
                    Continue →
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Badges section */}
          <div className="mb-8">
            <h2 className="font-black text-sm uppercase tracking-widest mb-4">Achievement Badges</h2>
            {profile.badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {profile.badges.map((badge, i) => (
                  <div key={i} className="border-4 border-black bg-white p-4 text-center neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col justify-between items-center min-h-[110px]">
                    <div className="mb-2 h-10 flex items-center justify-center">{getBadgeIcon(badge)}</div>
                    <div className="font-black text-[9px] uppercase tracking-widest leading-tight">{badge}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-4 border-black bg-[#EAE8E0] p-8 text-center neo-shadow">
                <div className="mb-3 h-12 flex items-center justify-center">
                  <svg className="w-12 h-12 stroke-current text-black" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                    <path d="M4 22h16" />
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                    <path d="M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
                  </svg>
                </div>
                <div className="font-black text-sm uppercase tracking-widest mb-2">No badges yet</div>
                <div className="font-bold text-xs text-black/50 mb-4">Complete the onboarding quiz to earn your first badges</div>
                <Link href="/dashboard" className="inline-block bg-black text-white px-6 py-2 font-black text-xs uppercase border-[3px] border-black shadow-[3px_3px_0px_0px_#D0EE51] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all">
                  Start Earning →
                </Link>
              </div>
            )}
          </div>

          {/* All tiers progression */}
          <div>
            <h2 className="font-black text-sm uppercase tracking-widest mb-4">Trading Tier Progression</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {TIER_THRESHOLDS.map((tier, i) => {
                const reached = profile.xp >= tier.min;
                const isCurrent = tier.level === currentTier.level;
                return (
                  <div
                    key={tier.level}
                    className={`border-4 border-black p-4 text-center relative transition-all ${
                      isCurrent ? "neo-shadow" : ""
                    } ${reached ? tier.color : "bg-[#EAE8E0] opacity-60"}`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 bg-neo-orange border-2 border-black px-1.5 py-0.5 font-black text-[7px] uppercase">You</div>
                    )}
                    <div className="mb-2 h-8 flex items-center justify-center">{getTierIcon(i)}</div>
                    <div className="font-black text-[9px] uppercase tracking-widest">{tier.level}</div>
                    <div className="font-bold text-[8px] mt-1 opacity-60">{tier.min === 0 ? "0" : `${tier.min}`}+ XP</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

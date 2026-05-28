"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/useWallet";
import WalletConnectModal from "@/components/WalletConnectModal";

export default function Home() {
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const { isConnected, isInitialized } = useWallet();
  const router = useRouter();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // If already connected (persisted session), skip landing page
  useEffect(() => {
    if (isInitialized && isConnected) {
      router.replace("/dashboard");
    }
  }, [isInitialized, isConnected, router]);

  return (
    <div className="min-h-screen bg-[#EAE8E0] overflow-x-hidden flex flex-col w-full relative">
      
      {/* Global Noise Overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-50" 
        style={{ 
          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIi8+PC9zdmc+')", 
          opacity: 0.12, 
          mixBlendMode: "multiply" 
        }}
      ></div>

      {/* Hero Frame */}
      <div className="h-dvh flex flex-col shrink-0">

      {/* Navbar */}
      <header
        className="sticky top-0 w-full flex items-center px-6 shrink-0 bg-[#EAE8E0] z-100 border-b-4 border-black"
        style={{ height: "76px" }}
      >
        {/* Beta Bookmark */}
        <div className="absolute left-8 top-0 z-50 cursor-pointer group">
          <svg
            className="w-10 h-[128px] group-hover:translate-y-1 transition-transform"
            viewBox="0 0 28 90"
            fill="none"
          >
            <path d="M1.5 0V87L14 75L26.5 87V0" fill="#FFD23F" stroke="black" strokeWidth="2.5"/>
            <text
              x="14" y="44"
              transform="rotate(90 14 44)"
              fill="black" fontWeight="900" fontSize="7.5"
              textAnchor="middle" dominantBaseline="middle"
              letterSpacing="2"
            >BETA</text>
          </svg>
        </div>

        {/* Logo Group */}
        <div className="flex items-center gap-3 ml-20 shrink-0">
          <Image src="/main.png" alt="Hodegos" width={150} height={30} className="object-contain" priority />
          <div className="h-6 w-[2px] bg-black" />
          <Image src="/injective-logo.svg" alt="Injective" width={26} height={26} className="object-contain" />
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2 font-black text-xs uppercase tracking-widest whitespace-nowrap">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="border-2 border-black bg-white rounded-full px-4 py-1.5 shadow-[2px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
          >
            Home
          </button>
          <span className="text-black/40 font-thin">/</span>
          <button 
            onClick={() => scrollToSection("how-it-works")}
            className="hover:underline underline-offset-4 decoration-2 cursor-pointer"
          >
            Features
          </button>
          <span className="text-black/40 font-thin">/</span>
          <button 
            onClick={() => scrollToSection("why-injective")}
            className="hover:underline underline-offset-4 decoration-2 cursor-pointer"
          >
            Why Injective
          </button>
          <span className="text-black/40 font-thin">/</span>
          <button 
            onClick={() => scrollToSection("bounty")}
            className="hover:underline underline-offset-4 decoration-2 cursor-pointer"
          >
            Hackathon
          </button>
        </nav>

        {/* Call to Action */}
        <button
          onClick={() => setWalletModalOpen(true)}
          className="ml-auto flex items-center gap-1 px-5 py-2 bg-neo-orange text-white border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] font-black uppercase tracking-wider text-[11px] hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all shrink-0 whitespace-nowrap"
        >
          Get Started
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex min-h-0 overflow-hidden">

        {/* Left Section */}
        <div className="w-[55%] shrink-0 flex flex-col justify-center border-r-4 border-black relative overflow-hidden" style={{ padding: "2.5% 5%", background: "linear-gradient(135deg, #FF9B3F 0%, #FF2A00 100%)" }}>

          {/* Stars */}
          <svg className="absolute top-[8%] right-[6%] w-5 h-5" viewBox="0 0 24 24" fill="black">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
          </svg>
          <svg className="absolute bottom-[12%] right-[12%] w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
          </svg>

          {/* Squiggly */}
          <svg className="absolute top-[14%] left-[4%] w-12 h-6 opacity-70" viewBox="0 0 100 40" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round">
            <path d="M0 20 Q 12.5 0,25 20 T 50 20 T 75 20 T 100 20"/>
          </svg>

          {/* Headline */}
          <h1
            className="font-black uppercase leading-[0.93] mb-[3%] text-black"
            style={{ fontSize: "clamp(1.5rem, 4.2vw, 4rem)" }}
          >
            Your First<br />
            <span className="relative inline-block">
              Trading
              <svg
                className="absolute left-0 w-full"
                style={{ bottom: "-5%" }}
                height="10"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path d="M0 8 Q 50 0 100 8" fill="none" stroke="black" strokeWidth="4"/>
              </svg>
            </span>
            {" "}<br />Experience
          </h1>

          <p className="font-bold text-black mb-1" style={{ fontSize: "clamp(0.7rem, 1.2vw, 1rem)" }}>
            Hodegos. Your guide into trading.
          </p>
          <p className="font-medium text-black/80 max-w-[90%] mb-[5%]" style={{ fontSize: "clamp(0.65rem, 1vw, 0.9rem)", lineHeight: 1.45 }}>
            Learn the basics, simulate real trades, and execute on Injective — with an AI companion every step of the way.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setWalletModalOpen(true)}
              className="flex items-center gap-2 bg-neo-lime border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] font-bold uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer"
              style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)", padding: "10px 22px" }}
            >
              Start Trading
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex-1 bg-neo-lime relative flex items-center justify-center overflow-hidden">

          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
          />
          <div className="absolute -top-8 -right-8 w-36 h-36 border-2 border-dashed border-black/40 rounded-full pointer-events-none" />
          <div className="absolute bottom-8 left-6 w-8 h-8 bg-neo-yellow neo-border rounded-full pointer-events-none" />
          <svg className="absolute top-10 right-14 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="black">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
          </svg>

          {/* Arch Container */}
          <div className="relative z-10 w-[min(56%,280px)] h-[88%]">
            
            {/* The Arch Background */}
            <div
              className="absolute inset-0 neo-border neo-shadow-lg"
              style={{
                borderTopLeftRadius: "9999px",
                borderTopRightRadius: "9999px",
                background: "#FF9B3F",
              }}
            ></div>
            
            {/* The Bot Image */}
            <img 
              src="/hero-guide.png" 
              alt="AI Guide" 
              className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-auto max-w-none h-[88%] z-20 pointer-events-none drop-shadow-md"
            />

            {/* The Label Box */}
            <div className="absolute bottom-3 left-2 right-2 bg-white p-2 text-center z-30" style={{ border: "2.5px solid black", boxShadow: "3px 3px 0 #000" }}>
              <p className="font-black uppercase" style={{ fontSize: "9px", letterSpacing: "0.05em" }}>Meet your AI Guide</p>
              <p className="font-medium text-black/70 leading-tight mt-0.5" style={{ fontSize: "8px" }}>
                "Have you traded before? Let's walk through your first spot trade."
              </p>
            </div>
          </div>

          {/* Spinning badge */}
          <div className="absolute bottom-4 right-4 w-16 h-16 bg-white neo-border rounded-full neo-shadow animate-spin-slow hidden lg:flex items-center justify-center">
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <path id="bc2" d="M50,50 m-30,0 a30,30 0 1,1 60,0 a30,30 0 1,1 -60,0" fill="transparent"/>
              <text fontSize="10" fontWeight="bold" fill="black" letterSpacing="1.5">
                <textPath href="#bc2">★ LEARN ★ TRADE ★ GROW</textPath>
              </text>
            </svg>
          </div>
        </div>
      </main>

      {/* Marquee Ticker */}
      <div className="shrink-0 border-t-4 border-black bg-neo-yellow overflow-hidden flex whitespace-nowrap" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
        <div className="animate-marquee font-black uppercase flex items-center gap-10" style={{ fontSize: "11px", letterSpacing: "0.12em" }}>
          {[
            "✦ START YOUR JOURNEY","✦ GUIDED BY AI","✦ BUILT ON INJECTIVE",
            "✦ ZERO INTIMIDATION","✦ SIMULATE FIRST","✦ SPOT & PERP",
            "✦ START YOUR JOURNEY","✦ GUIDED BY AI","✦ BUILT ON INJECTIVE",
            "✦ ZERO INTIMIDATION","✦ SIMULATE FIRST","✦ SPOT & PERP",
          ].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>
      </div>
      
      {/* Additional Sections */}
      <section id="how-it-works" className="flex flex-col lg:flex-row items-center border-t-4 border-black shrink-0 bg-[#EAE8E0] py-16 px-6 lg:px-16 overflow-hidden relative min-h-[700px]">
        
        {/* Background Dot Grid (subtle) */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)", backgroundSize: "32px 32px" }}
        />

        {/* About Left */}
        <div className="flex-1 flex flex-col justify-center relative z-10 w-full lg:pr-10 pt-10 lg:pt-0">
          
          {/* Pills */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="border-[3px] border-black bg-white px-4 py-1.5 font-black text-[11px] uppercase tracking-widest -rotate-3 neo-shadow-sm">
              Zero Jargon
            </div>
            <div className="border-[3px] border-black bg-neo-lime px-4 py-1.5 font-black text-[11px] uppercase tracking-widest rotate-2 neo-shadow-sm">
              AI Guided
            </div>
          </div>

          <h2 className="font-black uppercase text-6xl lg:text-[5.5rem] leading-[0.9] text-black relative inline-block z-10 tracking-tight mb-8">
            The<br/>Missing<br/>
            <span className="relative inline-block">
              <span className="relative z-10">Link.</span>
              <div className="absolute bottom-2 left-[-2%] right-[-10%] h-5 lg:h-7 bg-neo-lime z-[-1]"></div>
            </span>
          </h2>
          
          <p className="font-bold text-base lg:text-lg text-black max-w-md leading-relaxed">
            Every trading app assumes you already know what you're doing. We turn your curiosity into custom <span className="text-neo-orange font-black">learning, simulation, and execution</span> paths guided by an AI companion.
          </p>

          <button 
            onClick={() => setWalletModalOpen(true)}
            className="mt-10 self-start bg-neo-orange text-white border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] px-10 py-3.5 font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all">
            Login to Start
          </button>
        </div>

        {/* About Right - Scattered Cards */}
        <div className="flex-[1.2] relative w-full min-h-[600px] mt-16 lg:mt-0 flex items-center justify-center">
          
          <div className="relative w-full max-w-[550px] h-[550px]">
            {/* Learn Card - Orange Square */}
            <div className="absolute top-[8%] left-[2%] w-[48%] bg-neo-orange border-[3px] border-black p-6 neo-shadow-lg -rotate-6 z-20 hover:rotate-0 hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 border-[3px] border-black rounded-full mb-3 flex items-center justify-center font-black text-sm bg-neo-yellow">1</div>
              <h3 className="font-black uppercase text-xl mb-3 leading-tight">Learn Before You Touch</h3>
              <p className="font-bold text-black/90 text-xs leading-snug">
                Start with absolute basics. No intimidating charts. Just clear, AI-guided lessons.
              </p>
            </div>

            {/* Simulate Card - White Box */}
            <div className="absolute top-[0%] right-[2%] w-[48%] bg-white border-[3px] border-black p-6 neo-shadow-lg rotate-[5deg] z-10 hover:rotate-0 hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 border-[3px] border-black rounded-full mb-3 flex items-center justify-center font-black text-sm bg-neo-yellow">2</div>
              <h3 className="font-black uppercase text-xl mb-3">Simulate & Practice</h3>
              <p className="font-bold text-black/80 text-xs leading-snug">
                Practice in a <span className="text-neo-orange">risk-free environment</span>. Execute mock spot and perp trades safely.
              </p>
            </div>

            {/* Execute Card - White Box */}
            <div className="absolute bottom-[10%] right-[6%] w-[55%] bg-white border-[3px] border-black p-6 neo-shadow-lg rotate-[-4deg] z-30 hover:rotate-0 hover:scale-105 transition-transform duration-300">
              <div className="w-8 h-8 border-[3px] border-black rounded-full mb-3 flex items-center justify-center font-black text-sm bg-neo-lime">3</div>
              <h3 className="font-black uppercase text-xl mb-3">Execute On-Chain</h3>
              <p className="font-bold text-black/80 text-xs leading-snug">
                Step into the real market. Built on <span className="text-neo-orange">Injective</span>, giving you fast, zero-intimidation trades.
              </p>
            </div>

            {/* Circular Badge */}
            <div className="absolute bottom-[15%] left-[10%] w-36 h-36 bg-neo-lime border-4 border-black rounded-full flex items-center justify-center z-40 rotate-12 neo-shadow-lg hover:rotate-180 transition-transform duration-700">
              <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 animate-spin-slow">
                <path id="badgeTextPath" d="M 50, 50 m -35, 0 a 35,35 0 1,1 70,0 a 35,35 0 1,1 -70,0" fill="transparent"/>
                <text fontSize="11" fontWeight="900" fill="black" letterSpacing="1">
                  <textPath href="#badgeTextPath">★ 100% BEGINNER FRIENDLY</textPath>
                </text>
              </svg>
            </div>
          </div>

        </div>

      </section>

      {/* ── Why Injective Section ── */}
      <section id="why-injective" className="relative border-t-4 border-black bg-black overflow-hidden">

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }}
        />

        {/* Decorative elements */}
        <svg className="absolute top-12 right-16 w-6 h-6 opacity-20" viewBox="0 0 24 24" fill="#D0EE51">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
        </svg>
        <svg className="absolute bottom-20 left-10 w-4 h-4 opacity-15" viewBox="0 0 24 24" fill="none" stroke="#FFD23F" strokeWidth="2">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
        </svg>

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-16 py-20">

          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/injective-logo.svg" alt="Injective" width={20} height={20} className="object-contain opacity-60" />
                <span className="font-black text-[10px] uppercase tracking-[0.2em] text-white/40">The Infrastructure</span>
              </div>
              <h2 className="font-black uppercase text-4xl lg:text-6xl leading-[0.93] text-white tracking-tight">
                Why<br />
                <span className="relative inline-block">
                  <span className="relative z-10">Injective?</span>
                  <div className="absolute bottom-1 left-0 right-0 h-3 lg:h-5 bg-neo-lime z-[-1]" />
                </span>
              </h2>
            </div>
            <p className="font-bold text-white/50 text-sm max-w-xs leading-relaxed lg:text-right">
              Hodegos was built specifically for Injective because the chain&apos;s architecture enables things that are impossible on most other networks.
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-0 border-[3px] border-white/10 mb-12 overflow-hidden">
            {[
              { value: "< 1s", label: "Block Finality", sub: "Orders settle in under one second" },
              { value: "0%", label: "Maker Fees", sub: "No fees on most spot market maker orders" },
              { value: "100%", label: "On-Chain", sub: "Fully decentralised orderbook, no central server" },
            ].map((stat, i) => (
              <div key={i} className={`p-8 ${i < 2 ? "border-r-[3px] border-white/10" : ""}`}>
                <div className="font-black text-4xl lg:text-5xl text-neo-lime mb-2">{stat.value}</div>
                <div className="font-black text-xs uppercase tracking-widest text-white mb-1">{stat.label}</div>
                <div className="font-bold text-[11px] text-white/40 leading-snug">{stat.sub}</div>
              </div>
            ))}
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Left — tall feature card */}
            <div className="bg-white/5 border-[3px] border-white/10 p-8 flex flex-col gap-6 hover:border-neo-lime/40 transition-colors duration-300">
              <div className="w-10 h-10 bg-neo-lime border-2 border-black flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <div>
                <h3 className="font-black uppercase text-xl text-white mb-3 tracking-tight">Native DEX Orderbook</h3>
                <p className="font-bold text-white/50 text-sm leading-relaxed">
                  Injective runs a fully on-chain, decentralised orderbook. Every order Hodegos users place goes through the same infrastructure that institutional traders use. There is no intermediary, no custodial risk, and no hidden spread. Hodegos connects to this orderbook directly using the Injective SDK — no bridge, no wrapper.
                </p>
              </div>
              <div className="mt-auto pt-6 border-t border-white/10">
                <div className="font-black text-[9px] uppercase tracking-widest text-white/30 mb-2">Hodegos uses this for</div>
                <div className="flex flex-wrap gap-2">
                  {["MsgCreateSpotMarketOrder", "MsgCreateSpotLimitOrder", "TxGrpcApi broadcast"].map(tag => (
                    <span key={tag} className="bg-white/5 border border-white/10 px-2 py-1 font-black text-[9px] uppercase tracking-widest text-white/40">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — stacked cards */}
            <div className="flex flex-col gap-6">
              <div className="bg-neo-lime border-[3px] border-black p-6 flex gap-5 hover:translate-x-1 hover:translate-y-1 transition-transform duration-200">
                <div className="w-8 h-8 bg-black border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#D0EE51" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black uppercase text-base text-black mb-2 tracking-tight">Sub-Second Execution</h3>
                  <p className="font-bold text-black/70 text-xs leading-relaxed">
                    Injective&apos;s Tendermint-based consensus produces blocks in approximately 1 second. When Hodegos users submit a trade, it is confirmed and final before they can second-guess it. For a beginner learning market orders, this removes the anxiety of pending state.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border-[3px] border-white/10 p-6 flex gap-5 hover:border-neo-orange/40 transition-colors duration-300">
                <div className="w-8 h-8 bg-neo-orange border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black uppercase text-base text-white mb-2 tracking-tight">Subaccount Architecture</h3>
                  <p className="font-bold text-white/50 text-xs leading-relaxed">
                    Injective&apos;s subaccount system allows Hodegos to isolate testnet trading activity from the user&apos;s main wallet. Beginners practice in a contained environment without touching their primary holdings. The same address structure works identically on Mainnet when they are ready.
                  </p>
                </div>
              </div>

              <div className="bg-white/5 border-[3px] border-white/10 p-6 flex gap-5 hover:border-neo-lime/40 transition-colors duration-300">
                <div className="w-8 h-8 bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#D0EE51" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-black uppercase text-base text-white mb-2 tracking-tight">Real Markets, Zero Fees</h3>
                  <p className="font-bold text-white/50 text-xs leading-relaxed">
                    Injective charges zero maker fees on most spot markets. For a beginner-focused product, this means users are not penalised for learning. Hodegos surfaces this fact directly in the trade panel so users understand what they are paying before they sign.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom rule */}
        <div className="border-t-4 border-white/10 relative z-10" />
      </section>

      {/* ── Hackathon Section ── */}
      <section id="bounty" className="relative border-t-4 border-black bg-neo-yellow overflow-hidden">

        {/* Obvious Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.12]" 
          style={{ 
            backgroundImage: "linear-gradient(#000 2px, transparent 2px), linear-gradient(90deg, #000 2px, transparent 2px)", 
            backgroundSize: "64px 64px" 
          }} 
        />

        {/* Section header */}
        <div className="relative z-10 text-center pt-14 pb-2 px-6">
          <div className="inline-flex items-center gap-3 mb-4">
            <Image src="/injective-logo.svg" alt="Injective" width={22} height={22} className="object-contain" />
            <span className="font-black text-[11px] uppercase tracking-[0.2em] text-black/50">Injective Solo AI Builder Sprint</span>
          </div>
          <h2 className="font-black uppercase text-4xl lg:text-[3.8rem] leading-[0.95] text-black tracking-tight">
            Hodegos was built<br />
            <span className="relative inline-block">
              <span className="relative z-10">for this sprint.</span>
              <div className="absolute bottom-1 left-0 right-0 h-4 lg:h-6 bg-white z-[-1]" />
            </span>
          </h2>

        </div>

        {/* ── Scatter arena ── */}
        <div className="relative z-10 mx-auto w-full max-w-5xl" style={{ height: "680px" }}>

          {/* ── Reading-order arrows — thick, orange, unmistakable ── */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 680" preserveAspectRatio="none">
            <defs>
              <marker id="arr" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#FF9B3F" />
              </marker>
            </defs>
            {/* 1 → 2 */}
            <path d="M 230 100 Q 280 70 330 90" fill="none" stroke="#FF9B3F" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#arr)" strokeLinecap="round" />
            {/* 2 → 3 */}
            <path d="M 540 100 Q 650 60 760 90" fill="none" stroke="#FF9B3F" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#arr)" strokeLinecap="round" />
            {/* 3 → 4 */}
            <path d="M 850 180 Q 880 230 840 280" fill="none" stroke="#FF9B3F" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#arr)" strokeLinecap="round" />
            {/* 4 → 5 */}
            <path d="M 820 420 Q 750 480 670 510" fill="none" stroke="#FF9B3F" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#arr)" strokeLinecap="round" />
            {/* 5 → 6 */}
            <path d="M 490 550 Q 380 590 240 560" fill="none" stroke="#FF9B3F" strokeWidth="4" strokeDasharray="10 8" markerEnd="url(#arr)" strokeLinecap="round" />
          </svg>

          {/* ── CARD 1 — Sprint Goal (top-left) ── */}
          <div className="absolute z-30" style={{ top: "8%", left: "-1%", transform: "rotate(4deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">1</div>
            <div className="bg-white border-[3px] border-black neo-shadow p-4 w-48 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">The Mission</p>
              <p className="font-bold text-[11px] leading-snug text-black">
                Build something <span className="font-black">useful, ship it,</span> and make it usable by real users.
              </p>
            </div>
          </div>

          {/* ── CARD 2 — Hodegos Bridge (top-center-left) ── */}
          <div className="absolute z-30" style={{ top: "7%", left: "33%", transform: "rotate(-3deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">2</div>
            <div className="bg-neo-lime border-[3px] border-black neo-shadow-lg p-4 w-48 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">The Idea</p>
              <p className="font-bold text-[11px] leading-snug text-black">
                Hodegos is the <span className="font-black">bridge</span> from curiosity to your first on-chain trade.
              </p>
            </div>
          </div>

          {/* ── CARD 3 — Sprint Dates (top-right) ── */}
          <div className="absolute z-30" style={{ top: "3%", right: "0%", transform: "rotate(5deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">3</div>
            <div className="bg-neo-orange border-[3px] border-black neo-shadow-lg p-4 w-40 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">Sprint Window</p>
              <p className="font-black text-base leading-tight">May 11 -<br />May 31, 2026</p>
              <div className="mt-2 inline-block bg-black text-neo-lime px-2 py-0.5 font-black text-[8px] uppercase tracking-wider">ONLINE</div>
            </div>
          </div>

          {/* ── Prize pool — mid-left big stat ── */}
          <div className="absolute z-30" style={{ top: "32%", left: "-3%", transform: "rotate(-4deg)" }}>
            <div className="bg-neo-orange border-[3px] border-black neo-shadow-lg p-5 w-36 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/60 mb-1">Prize Pool</p>
              <p className="font-black text-4xl leading-none">$500</p>
              <p className="font-bold text-[10px] mt-1 opacity-80">USD Total</p>
            </div>
          </div>

          {/* ── CARD 4 — AI Copilot (right-mid) ── */}
          <div className="absolute z-30" style={{ top: "38%", right: "-1%", transform: "rotate(-3deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">4</div>
            <div className="bg-white border-[3px] border-black neo-shadow-lg p-4 w-52 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">The Product</p>
              <p className="font-bold text-[11px] leading-snug text-black">
                An <span className="font-black">AI copilot</span> that walks newcomers through spot trades, step by step, with zero jargon.
              </p>
            </div>
          </div>

          {/* ── CARD 5 — Injective native (bottom-center-right) ── */}
          <div className="absolute z-30" style={{ bottom: "14%", right: "29%", transform: "rotate(3deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">5</div>
            <div className="bg-white border-[3px] border-black neo-shadow p-4 w-48 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">The Chain</p>
              <p className="font-bold text-[11px] leading-snug text-black">
                Built on <span className="font-black text-neo-orange">Injective</span> — lightning-fast execution and zero gas fees for users.
              </p>
            </div>
          </div>

          {/* ── CARD 6 — Evaluation (bottom-left) ── */}
          <div className="absolute z-30" style={{ bottom: "8%", left: "0%", transform: "rotate(-4deg)" }}>
            <div className="absolute -top-3 -left-3 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center font-black text-[10px] z-40 border-2 border-black">6</div>
            <div className="bg-neo-lime border-[3px] border-black neo-shadow p-4 w-48 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-black/50 mb-1">Judged On</p>
              <p className="font-bold text-[11px] leading-snug text-black">
                <span className="font-black">Usefulness, execution quality</span> and real usability for everyday people.
              </p>
            </div>
          </div>

          {/* ── Category sticker — bottom-right ── */}
          <div className="absolute z-30" style={{ bottom: "6%", right: "1%", transform: "rotate(4deg)" }}>
            <div className="bg-black text-white border-[3px] border-black neo-shadow-lg p-4 w-40 hover:rotate-0 transition-transform duration-300 cursor-default">
              <p className="font-black text-[9px] uppercase tracking-widest text-white/50 mb-1">Category</p>
              <p className="font-black text-sm leading-tight uppercase">Consumer<br />AI App</p>
              <p className="font-bold text-[9px] mt-1 text-neo-orange">+ AI Copilot / Trading</p>
            </div>
          </div>

          {/* ── Decorative accents only ── */}
          {/* 4-point star top-centre */}
          <svg className="absolute" style={{ top: "6%", left: "46%", width: 16, opacity: 0.55 }} viewBox="0 0 24 24" fill="black">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41Z"/>
          </svg>
          {/* outline star right-upper */}
          <svg className="absolute" style={{ top: "26%", right: "20%", width: 13, opacity: 0.35 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41Z"/>
          </svg>
          {/* small filled star bottom-left zone */}
          <svg className="absolute" style={{ bottom: "32%", left: "26%", width: 11, opacity: 0.45 }} viewBox="0 0 24 24" fill="black">
            <path d="M12 0L13.5 10.5L24 12L13.5 13.5L12 24L10.5 13.5L0 12L10.5 10.5Z"/>
          </svg>
          {/* Flower asterisk — far left */}
          <svg className="absolute opacity-35" style={{ top: "60%", left: "3%", width: 20 }} viewBox="0 0 40 40" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
            <line x1="20" y1="2" x2="20" y2="38"/><line x1="2" y1="20" x2="38" y2="20"/>
            <line x1="6" y1="6" x2="34" y2="34"/><line x1="34" y1="6" x2="6" y2="34"/>
          </svg>
          {/* Squiggly wave — bottom-left zone */}
          <svg className="absolute opacity-40" style={{ bottom: "22%", left: "18%", width: 42 }} viewBox="0 0 100 40" fill="none" stroke="black" strokeWidth="3.5" strokeLinecap="round">
            <path d="M0 20 Q 12.5 0,25 20 T 50 20 T 75 20 T 100 20"/>
          </svg>
          {/* small orange dot */}
          <div className="absolute w-3 h-3 rounded-full bg-neo-orange border-2 border-black" style={{ bottom: "34%", right: "25%" }} />
          {/* Plus — mid-left between card 1 and prize */}
          <svg className="absolute opacity-35" style={{ top: "28%", left: "14%", width: 13 }} viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>


          {/* ── Central image ── */}
          <div
            className="absolute z-20"
            style={{
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(420px, 56%)",
            }}
          >
            {/* Red offset shadow block */}
            <div
              className="absolute inset-0"
              style={{ background: "#FF2A00", border: "4px solid black", transform: "translate(12px,12px)", borderRadius: 0 }}
            />
            {/* Window frame */}
            <div className="relative bg-[#EAE8E0] border-4 border-black flex flex-col">
              {/* Window Title Bar */}
              <div className="h-9 border-b-4 border-black bg-[#E5E5E5] flex items-center px-3 gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-black bg-white" />
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-black bg-white" />
                <div className="w-3.5 h-3.5 rounded-full border-[2.5px] border-black bg-white" />
              </div>
              <div className="p-3 bg-white">
                <div className="border-[3px] border-black overflow-hidden relative">
                  <Image
                    src="/hack.png"
                    alt="Injective Solo AI Builder Sprint"
                    width={420}
                    height={260}
                    className="w-full h-auto block"
                  />
                  {/* Subtle inner shadow/border overlay on the image */}
                  <div className="absolute inset-0 border border-black/10 pointer-events-none" />
                </div>
              </div>
              {/* Injective logo circle badge on frame */}
              <div
                className="absolute -top-5 -left-5 w-14 h-14 bg-white border-[3px] border-black rounded-full flex items-center justify-center neo-shadow z-30"
                style={{ transform: "rotate(-8deg)" }}
              >
                <Image src="/injective-logo.svg" alt="Injective" width={28} height={28} className="object-contain" />
              </div>
              {/* "We're in it" sticker */}
              <div
                className="absolute -bottom-4 -right-4 bg-neo-lime border-[3px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest neo-shadow z-30"
                style={{ transform: "rotate(3deg)" }}
              >
                ✦ We&apos;re in it
              </div>
            </div>
          </div>

          {/* Spinning circular badge — bottom of arena */}
          <div
            className="absolute bottom-4 right-[calc(50%-52px)] w-[104px] h-[104px] bg-black border-4 border-black rounded-full flex items-center justify-center neo-shadow-lg animate-spin-slow z-30"
          >
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              <path id="hbp2" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" fill="transparent"/>
              <text fontSize="10.5" fontWeight="900" fill="#FFD23F" letterSpacing="1.5">
                <textPath href="#hbp2">★ Bounty ★ 2026 ★</textPath>
              </text>
            </svg>
          </div>
        </div>

        {/* View Hackathon CTA */}
        <div className="relative z-10 flex justify-center pb-14">
          <a
            href="https://www.hackquest.io/hackathons/Injective-Solo-AI-Builder-Sprint"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-neo-orange text-black border-[3px] border-black rounded-full px-8 py-3.5 shadow-[4px_4px_0px_0px_#000] font-black uppercase tracking-widest text-sm hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all"
          >
            <Image src="/injective-logo.svg" alt="Injective" width={18} height={18} className="object-contain" />
            View Bounty  →
          </a>
        </div>

        {/* Bottom marquee — hackathon-themed */}
        <div className="border-t-4 border-black bg-black overflow-hidden flex whitespace-nowrap" style={{ paddingTop: "9px", paddingBottom: "9px" }}>
          <div className="animate-marquee font-black uppercase flex items-center gap-10" style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#FFD23F" }}>
            {[
              "\u2756 INJECTIVE SOLO AI BUILDER SPRINT","\u2756 $500 PRIZE POOL","\u2756 MAY 11-31 2026",
              "\u2756 AI-POWERED ONCHAIN","\u2756 HODEGOS IS COMPETING","\u2756 BUILT ON INJECTIVE",
              "\u2756 INJECTIVE SOLO AI BUILDER SPRINT","\u2756 $500 PRIZE POOL","\u2756 MAY 11-31 2026",
              "\u2756 AI-POWERED ONCHAIN","\u2756 HODEGOS IS COMPETING","\u2756 BUILT ON INJECTIVE",
            ].map((t, i) => <span key={i}>{t}</span>)}
          </div>
        </div>

      </section>

      {/* ── Footer ── */}
      <footer className="border-t-4 border-black bg-[#EAE8E0] relative overflow-hidden">

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)", backgroundSize: "28px 28px" }}
        />

        {/* Main footer body */}
        <div className="relative z-10 flex flex-col lg:flex-row gap-12 lg:gap-0 px-6 lg:px-16 py-14">

          {/* Left — Project info */}
          <div className="flex-1 flex flex-col justify-center lg:pr-20">
            <Image src="/main.png" alt="Hodegos" width={140} height={28} className="object-contain mb-5" />

            <p className="font-bold text-black/70 text-sm max-w-xs leading-relaxed mb-8">
              This project was built by{" "}
              <span className="font-black text-black">Samuel Oluwayomi</span> for the{" "}
              <span className="font-black text-black">Injective Solo AI Builder Sprint 2026</span>.
            </p>

          </div>

          {/* Right — Builder card */}
          <div className="flex items-center justify-start lg:justify-end">
            <div
              className="bg-white border-[3px] border-black neo-shadow-lg p-6 flex items-center gap-6 max-w-sm w-full"
            >
              {/* Photo */}
              <div className="shrink-0 relative">
                <div className="w-20 h-20 rounded-full border-[3px] border-black overflow-hidden neo-shadow">
                  <Image
                    src="/me.png"
                    alt="Samuel Oluwayomi"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Small lime dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neo-lime border-2 border-black rounded-full" />
              </div>

              {/* Info */}
              <div className="flex flex-col gap-1">
                {/* Label */}
                <div className="inline-block bg-neo-orange border-2 border-black px-2 py-0.5 font-black text-[9px] uppercase tracking-widest self-start mb-1">
                  Built by
                </div>

                <p className="font-black text-xl uppercase leading-tight tracking-tight text-black">
                  Samuel<br />Oluwayomi
                </p>

                <div className="flex flex-col gap-1.5 mt-2">
                  {/* GitHub */}
                  <a
                    href="https://github.com/SamuelOluwayomi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold text-xs text-black hover:text-neo-orange transition-colors group"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    github.com/SamuelOluwayomi
                  </a>

                  {/* X / Twitter */}
                  <a
                    href="https://x.com/The_devsam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold text-xs text-black hover:text-neo-orange transition-colors group"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.258 5.63 5.906-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @The_devsam
                  </a>

                  {/* Telegram */}
                  <a
                    href="https://t.me/DevSam01"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-bold text-xs text-black hover:text-neo-orange transition-colors group"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    @DevSam01
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[3px] bg-black mx-6 lg:mx-16" />

        {/* Bottom bar */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between px-6 lg:px-16 py-5 gap-3">
          <p className="font-bold text-xs text-black/60 uppercase tracking-widest">
            © 2026 Hodegos. Built on Injective.
          </p>
          <p className="font-black text-xs uppercase tracking-widest text-black">
            Learn it. <span className="text-neo-orange">Simulate it.</span> Trade it.
          </p>
        </div>
      </footer>

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />
    </div>
  );
}
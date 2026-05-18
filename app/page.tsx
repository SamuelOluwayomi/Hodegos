import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FEFDF9] overflow-x-hidden flex flex-col w-full relative">
      
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
        className="relative flex items-center px-6 shrink-0 bg-[#FEFDF9] z-30 border-b-4 border-black"
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
          <Link href="#" className="border-2 border-black bg-white rounded-full px-4 py-1.5 shadow-[2px_4px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all">
            Home
          </Link>
          <span className="text-black/40 font-thin">/</span>
          <Link href="#" className="hover:underline underline-offset-4 decoration-2">Simulate</Link>
          <span className="text-black/40 font-thin">/</span>
          <Link href="#" className="hover:underline underline-offset-4 decoration-2">Trade</Link>
        </nav>

        {/* Call to Action */}
        <button className="ml-auto flex items-center gap-1 px-5 py-2 bg-neo-orange text-white border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] font-black uppercase tracking-wider text-[11px] hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all shrink-0 whitespace-nowrap">
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
              className="flex items-center gap-2 bg-neo-lime border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] font-bold uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all"
              style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)", padding: "10px 22px" }}
            >
              Start Learning
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
            <button
              className="flex items-center bg-white border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] font-bold uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all"
              style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)", padding: "10px 22px" }}
            >
              Simulate Trade
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
      <section className="flex flex-col lg:flex-row items-center border-t-4 border-black shrink-0 bg-[#FEFDF9] py-16 px-6 lg:px-16 overflow-hidden relative min-h-[700px]">
        
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

          <button className="mt-10 self-start bg-neo-orange text-white border-2 border-black rounded-full shadow-[2px_4px_0px_0px_#000] px-10 py-3.5 font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[4px] hover:shadow-none transition-all">
            Start My Baseline
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
    </div>
  );
}
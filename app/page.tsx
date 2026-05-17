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
            <path d="M1.5 0V87L14 75L26.5 87V0" fill="#C8A2C8" stroke="black" strokeWidth="2.5"/>
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
        <div className="flex items-center gap-3 ml-12 shrink-0">
          <Image src="/Hodegos.png" alt="Hodegos" width={115} height={30} className="object-contain" priority />
          <div className="h-6 w-[2px] bg-black" />
          <Image src="/injective-logo.svg" alt="Injective" width={26} height={26} className="object-contain" />
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 absolute left-1/2 -translate-x-1/2 font-black text-xs uppercase tracking-widest whitespace-nowrap">
          <Link href="#" className="border-2 border-black bg-white px-3 py-1 neo-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
            Home
          </Link>
          <span className="text-black/40 font-thin">/</span>
          <Link href="#" className="hover:underline underline-offset-4 decoration-2">Simulate</Link>
          <span className="text-black/40 font-thin">/</span>
          <Link href="#" className="hover:underline underline-offset-4 decoration-2">Trade</Link>
        </nav>

        {/* Call to Action */}
        <button className="ml-auto flex items-center gap-1 px-4 py-1.5 bg-neo-orange text-white neo-border neo-shadow font-black uppercase tracking-wider text-[11px] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0 whitespace-nowrap">
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
              className="flex items-center gap-2 bg-neo-lime neo-border neo-shadow font-bold uppercase tracking-wider hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)", padding: "9px 18px" }}
            >
              Start Learning
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
            <button
              className="flex items-center bg-white neo-border neo-shadow font-bold uppercase tracking-wider hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
              style={{ fontSize: "clamp(0.6rem, 0.9vw, 0.8rem)", padding: "9px 18px" }}
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
          <div className="absolute bottom-8 left-6 w-8 h-8 bg-neo-cyan neo-border rounded-full pointer-events-none" />
          <svg className="absolute top-10 right-14 w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="black">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"/>
          </svg>

          {/* Arch Image */}
          <div
            className="relative z-10 neo-border neo-shadow-lg overflow-hidden"
            style={{
              width: "min(56%, 280px)",
              height: "88%",
              borderTopLeftRadius: "9999px",
              borderTopRightRadius: "9999px",
              background: "#C8A2C8",
            }}
          >
            <img src="/hero-guide.png" alt="AI Guide" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-3 left-2 right-2 bg-white p-2 text-center" style={{ border: "2.5px solid black", boxShadow: "3px 3px 0 #000" }}>
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
      <section className="flex flex-col lg:flex-row border-t-4 border-black shrink-0">
        
        {/* About Left */}
        <div className="flex-1 bg-neo-cyan border-b-4 lg:border-b-0 lg:border-r-4 border-black p-10 lg:p-16 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-8 left-8 w-12 h-12 bg-white rounded-full neo-border"></div>
          <svg className="absolute bottom-12 right-12 w-8 h-8 opacity-40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3">
             <rect x="3" y="3" width="18" height="18" />
          </svg>
          <svg className="absolute top-[40%] right-[-10%] w-32 h-32 opacity-20 rotate-45" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2">
            <path d="M12 2L2 22h20L12 2z" />
          </svg>
          
          <h2 className="font-black uppercase text-5xl lg:text-7xl mb-8 leading-[0.9] text-black">
            The<br/>Missing<br/>Link
          </h2>
          <div className="w-24 h-3 bg-black mb-8 neo-shadow"></div>
          <p className="font-bold text-lg lg:text-xl text-black max-w-md uppercase tracking-wide">
            Every trading app assumes you already know what you're doing. We don't.
          </p>
        </div>

        {/* About Right */}
        <div className="flex-[1.2] bg-white p-10 lg:p-16 flex flex-col justify-center gap-8 relative overflow-hidden">
          {/* Dot Grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle, #000 1.5px, transparent 1.5px)", backgroundSize: "26px 26px" }}
          />

          {/* Learn Card */}
          <div className="bg-neo-yellow p-6 lg:p-8 neo-border neo-shadow transition-all relative z-10 max-w-xl hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-default">
            <h3 className="font-black uppercase text-2xl mb-3 tracking-wider">1. Learn Before You Touch</h3>
            <p className="font-medium text-black/80 text-sm md:text-base leading-relaxed">
              Start with the absolute basics. No jargon, no intimidating charts. Just clear, AI-guided lessons on how the crypto market actually works.
            </p>
          </div>
          
          {/* Simulate Card */}
          <div className="bg-neo-purple p-6 lg:p-8 neo-border neo-shadow transition-all relative z-10 ml-0 lg:ml-12 max-w-xl hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-default">
            <h3 className="font-black uppercase text-2xl mb-3 tracking-wider">2. Simulate & Practice</h3>
            <p className="font-medium text-black/80 text-sm md:text-base leading-relaxed">
              Practice in a safe, risk-free environment. Execute mock spot and perp trades, and see how they perform before you ever connect a real wallet.
            </p>
          </div>
          
          {/* Execute Card */}
          <div className="bg-neo-lime p-6 lg:p-8 neo-border neo-shadow transition-all relative z-10 ml-0 lg:ml-24 max-w-xl hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none cursor-default">
            <h3 className="font-black uppercase text-2xl mb-3 tracking-wider">3. Execute On-Chain</h3>
            <p className="font-medium text-black/80 text-sm md:text-base leading-relaxed">
              When you're ready, step into the real market. Hodegos is built on Injective, giving you lightning-fast, zero-intimidation trades with your AI companion right beside you.
            </p>
          </div>
        </div>

      </section>

    </div>
  );
}

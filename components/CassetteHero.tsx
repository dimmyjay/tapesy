"use client";

import { ArrowRight, Play } from "lucide-react";

function Screw({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute z-20 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-black/70 shadow-[inset_0_0_10px_rgba(255,255,255,.15)] ${className}`}>
      <div className="h-5 w-5 rounded-full border border-white/20">
        <div className="mx-auto mt-[8px] h-1 w-1 rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function TapeReel({ className = "", reverse = false, isPlaying = false }: { className?: string; reverse?: boolean; isPlaying?: boolean }) {
  return (
    <div 
      className={`absolute flex h-[145px] w-[145px] items-center justify-center rounded-full border-[5px] border-[#d6c9bb]/70 bg-gradient-to-br from-[#e9e1d8] via-[#82766c] to-[#292622] shadow-[inset_0_0_25px_rgba(0,0,0,.8),0_5px_15px_rgba(0,0,0,.6)] ${isPlaying ? 'animate-spin' : ''} ${className}`}
      style={isPlaying ? { animationDuration: '3s', animationDirection: reverse ? 'reverse' : 'normal' } : {}}
    >
      <div className={`absolute h-[108px] w-[108px] rounded-full border-[16px] border-[#262320] ${reverse ? "rotate-45" : ""}`}>
        <div className="absolute left-1/2 top-0 h-[25px] w-[7px] -translate-x-1/2 rounded-full bg-[#25211e]" />
        <div className="absolute bottom-0 left-1/2 h-[25px] w-[7px] -translate-x-1/2 rounded-full bg-[#25211e]" />
        <div className="absolute left-0 top-1/2 h-[7px] w-[25px] -translate-y-1/2 rounded-full bg-[#25211e]" />
        <div className="absolute right-0 top-1/2 h-[7px] w-[25px] -translate-y-1/2 rounded-full bg-[#25211e]" />
      </div>
      <div className="relative h-8 w-8 rounded-full border-4 border-[#ddd2c6] bg-[#302c28] shadow-inner" />
    </div>
  );
}

export function Cassette({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="relative mx-auto w-full max-w-[1120px] animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="absolute inset-x-[10%] top-[15%] h-[70%] rounded-full bg-pink-500/10 blur-[100px]" />
      
      {/* Main Cassette Body */}
      <div className="relative min-h-[570px] overflow-hidden rounded-[38px] border-[3px] border-white/20 bg-gradient-to-br from-[#343230]/90 via-[#11100f]/95 to-[#292725]/95 p-5 shadow-[0_40px_100px_rgba(0,0,0,.8),inset_0_0_60px_rgba(255,255,255,.05)] backdrop-blur-xl sm:p-8 group">
        
        {/* Animated Plastic Sheen */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_15%,rgba(255,255,255,.08)_35%,transparent_45%,transparent_75%,rgba(255,255,255,.04)_85%,transparent_95%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]" />

        <Screw className="left-4 top-4" />
        <Screw className="right-4 top-4" />
        <Screw className="bottom-4 left-4" />
        <Screw className="bottom-4 right-4" />

        {/* Side A Label */}
        <div className="relative z-10 flex items-center justify-between px-2 pt-5">
          <div className="rotate-[-4deg] bg-[#e5d6c3] px-4 py-2 font-black italic text-black shadow-lg hover:rotate-0 transition-transform duration-300 cursor-pointer">SIDE A</div>
          <div className="rotate-[3deg] text-[11px] font-bold uppercase tracking-[.35em] text-white/40">GOSPEL HITS</div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 mt-4 flex items-center justify-between px-4">
          <div>
            <h1 className="rotate-[-3deg] text-6xl font-black italic tracking-[-0.09em] text-[#ff168c] drop-shadow-[5px_5px_0_#9eff00] sm:text-8xl">TAPESY</h1>
            <div className="mt-1 rotate-[-2deg] font-mono text-xl font-bold italic text-white/80 sm:text-2xl">Faith lives longer ♡</div>
          </div>
          <div className="hidden rotate-[4deg] rounded-sm bg-[#caff00] px-5 py-3 font-black italic text-black shadow-lg sm:block hover:rotate-0 transition-transform duration-300">WORSHIP.<br />WORD.<br />WITNESS.</div>
        </div>

        {/* Cassette Window & Reels */}
        <div className="relative z-10 mx-auto mt-7 h-[190px] max-w-[790px] rounded-[100px] border-[5px] border-[#a9a19a]/50 bg-gradient-to-b from-[#111] via-[#302925] to-[#090909] shadow-[inset_0_0_40px_black,0_10px_30px_rgba(0,0,0,.8)] sm:h-[210px]">
          
          {/* Animated Tape Ribbon */}
          <div className={`absolute left-[16%] right-[16%] top-1/2 h-[30px] -translate-y-1/2 rounded-full bg-gradient-to-b from-[#080706] via-[#4d3327] to-[#080706] shadow-[0_0_15px_rgba(255,150,70,.15)] transition-all duration-700 ${isPlaying ? 'scale-y-110 brightness-110' : ''}`} />
          
          <TapeReel className="left-[4%] top-1/2 -translate-y-1/2 scale-[.72] sm:left-[7%] sm:scale-100" isPlaying={isPlaying} />
          <TapeReel reverse className="right-[4%] top-1/2 -translate-y-1/2 scale-[.72] sm:right-[7%] sm:scale-100" isPlaying={isPlaying} />
          
          {/* Animated Waveform Visualizer */}
          <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[3px]">
            {Array.from({ length: 34 }).map((_, i) => (
              <span 
                key={i} 
                className={`w-[3px] rounded-full bg-[#ff168c] shadow-[0_0_7px_#ff168c] transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} 
                style={{ 
                  height: isPlaying ? `${12 + ((i * 19 + Date.now() / 50) % 45)}px` : `${12 + ((i * 19) % 45)}px`,
                  animationDelay: `${i * 50}ms`
                }} 
              />
            ))}
          </div>
          
          <div className="absolute bottom-[-32px] left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-black/70 px-5 py-2 text-[9px] font-black uppercase tracking-[.25em] text-white/50 hover:text-white/80 transition-colors cursor-help">More than a music app ♡</div>
        </div>

        {/* CTA Section */}
        <div className="relative z-10 mt-10 flex flex-col items-center justify-between gap-5 sm:flex-row sm:px-12">
          <div className="max-w-[390px] rotate-[-2deg] bg-[#dfd0be] px-5 py-3 font-black italic leading-tight text-black shadow-xl hover:rotate-0 transition-transform duration-300">
            YOUR FAVORITE HYMNS,<br /><span className="underline decoration-[#b4ff00] decoration-4">IN A BETTER TIMELINE.</span>
          </div>
          <div className="flex gap-3">
            <a href="#trending" className="group flex items-center gap-3 rounded-lg border-2 border-[#ff168c] bg-[#ff168c] px-6 py-4 font-black uppercase text-white shadow-[0_0_25px_rgba(255,22,140,.25)] transition hover:scale-105 hover:shadow-[0_0_35px_rgba(255,22,140,.4)]">
              <Play size={17} fill="currentColor" className="group-hover:animate-pulse" /> Start Listening
            </a>
            <a href="#discover" className="hidden items-center gap-2 rounded-lg border border-white/30 px-5 py-4 text-xs font-bold uppercase text-white transition hover:bg-white hover:text-black sm:flex hover:translate-x-1">
              Explore <ArrowRight size={15} />
            </a>
          </div>
        </div>

        {/* Graffiti Smile */}
        <div className="pointer-events-none absolute right-5 top-[43%] hidden rotate-12 text-[#ff168c] lg:block animate-bounce-slow">
          <div className="text-7xl font-black">×</div>
          <div className="-mt-8 ml-4 text-7xl font-black">×</div>
          <div className="mt-[-20px] text-5xl font-black">⌣</div>
        </div>
        
        {/* Bottom Details */}
        <div className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-14 text-[10px] uppercase tracking-[.35em] text-white/20 sm:flex">
          <span>HIGH FIDELITY</span><span>BLESSED DAYS</span><span>TAPESY</span>
        </div>
      </div>
    </div>
  );
}
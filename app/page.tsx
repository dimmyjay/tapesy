"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Music2,
  Play,
  Pause,
  Sparkles,
  Volume2,
  Upload,
  FileText,
  Download,
  Share2,
  BadgeCheck,
  MessageCircle,
  Search,
  LogOut,
  Menu,
  X,
  Trash2,
  Disc3,
  Headphones,
  Radio,
  Waves,
  ArrowUpRight,
  Clock3,
  Mic2,
  Flame,
  Crown,
} from "lucide-react";
import { IoLogoInstagram, IoLogoYoutube } from "react-icons/io5";

import { useSongs } from "@/hooks/useSongs";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { Song } from "@/types/song";

import {
  genres,
  seasons,
  UploadModal,
  LoginModal,
  JoinModal,
  LyricsModal,
  TipModal,
  ShareModal,
} from "@/components/Modals";

import { Cassette } from "@/components/CassetteHero";

export default function Home() {
  const { songs, loading, error } = useSongs();

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const [showLyrics, setShowLyrics] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTip, setShowTip] = useState(false);

  const [showUpload, setShowUpload] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");

  const [user, setUser] = useState<any>(null);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  
  const trendingContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollLeft = () => {
    if (trendingContainerRef.current) {
      trendingContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (trendingContainerRef.current) {
      trendingContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const togglePlay = (song: Song) => {
    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    setCurrentSong(song);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!currentSong || !audioRef.current) return;

    audioRef.current.src = currentSong.audioUrl;

    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
      });

    if (lyricsContainerRef.current) {
      lyricsContainerRef.current.scrollTop = 0;
    }
  }, [currentSong]);

  useEffect(() => {
    if (!currentSong?.syncedLyrics || !lyricsContainerRef.current) {
      return;
    }

    const activeIndex = currentSong.syncedLyrics.findIndex(
      (line, i, arr) =>
        currentTime >= line.time &&
        (i === arr.length - 1 || currentTime < arr[i + 1].time)
    );

    if (activeIndex === -1) return;

    const wrapper = lyricsContainerRef.current.firstElementChild;

    if (wrapper) {
      const activeElement = wrapper.children[activeIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [currentTime, currentSong]);

  const toggleLike = (id: string) => {
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDownload = async (song: Song) => {
    try {
      const response = await fetch(song.audioUrl);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const safeName = `${song.artist.replace(/[^a-z0-9]/gi, "_")}_${song.title.replace(/[^a-z0-9]/gi, "_")}.mp3`;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(song.audioUrl, "_blank");
    }
  };

  const handleDelete = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const confirmed = confirm("Are you sure you want to delete this tape? This action cannot be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch("/api/delete-song", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          songId: song.id,
          userId: user.uid,
          audioUrl: song.audioUrl,
          imageUrl: song.imageUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "Failed to delete song");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting.");
    }
  };

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        song.genre.toLowerCase().includes(query) ||
        Boolean(song.testimony?.toLowerCase().includes(query));
      const matchesSeason = !selectedSeason || song.season === selectedSeason;
      return matchesSearch && matchesSeason;
    });
  }, [songs, searchQuery, selectedSeason]);

  const trendingSongs = filteredSongs;
  const featuredSong = songs[0];

  const shareWhatsApp = (song: Song) => {
    const text = `🎵 Listening to "${song.title}" by ${song.artist} on TAPESY ♡\n${window.location.origin}/?song=${song.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remaining}`;
  };

  return (
    <main id="home" className="relative min-h-screen overflow-hidden bg-[#070706] text-white selection:bg-[#ff168c] selection:text-white">
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)} />

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[20%] -top-[15%] h-[700px] w-[700px] rounded-full bg-[#ff168c]/10 blur-[180px]" />
        <div className="absolute right-[-15%] top-[20%] h-[650px] w-[650px] rounded-full bg-[#caff00]/[0.055] blur-[180px]" />
        <div className="absolute bottom-[-20%] left-[25%] h-[600px] w-[600px] rounded-full bg-purple-600/[0.04] blur-[180px]" />
      </div>

      <div className="pointer-events-none fixed inset-0 z-[60] opacity-[0.035] [background-image:url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%22.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} user={user} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSwitchToJoin={() => { setShowLogin(false); setShowJoin(true); }} />}
      {showJoin && <JoinModal onClose={() => setShowJoin(false)} onSwitchToLogin={() => { setShowJoin(false); setShowLogin(true); }} />}
      {showLyrics && <LyricsModal song={currentSong} onClose={() => setShowLyrics(false)} />}
      {showShare && <ShareModal song={currentSong} onClose={() => setShowShare(false)} />}
      {showTip && <TipModal song={currentSong} onClose={() => setShowTip(false)} />}

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070706]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between px-4 sm:px-8">
          <a href="#home" className="group flex items-center gap-4">
            <div className="relative flex h-10 w-10 rotate-[-7deg] items-center justify-center rounded-xl border border-[#ff168c]/50 bg-[#ff168c]/10 shadow-[4px_4px_0_#caff00] transition group-hover:rotate-0">
              <Disc3 size={22} className="text-[#ff168c]" />
            </div>
            <div>
              <div className="text-xl font-black italic tracking-[-.12em] text-[#ff168c]">TAPESY</div>
              <div className="hidden font-mono text-[7px] uppercase tracking-[.3em] text-white/30 sm:block">Faith on repeat</div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {["Home", "Discover", "Trending", "Radio"].map((label, index) => (
              <a key={label} href={`#${label.toLowerCase()}`} className={`text-[11px] font-bold uppercase tracking-[.15em] transition ${index === 0 ? "text-[#ff168c]" : "text-white/40 hover:text-white"}`}>
                {label}
              </a>
            ))}
          </nav>

          <div className="hidden h-10 w-[220px] items-center rounded-full border border-white/10 bg-white/[0.035] px-4 transition focus-within:border-[#ff168c]/50 focus-within:bg-[#ff168c]/[0.05] sm:flex">
            <Search size={14} className="text-white/30" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Find your sound..." className="ml-3 w-full bg-transparent text-xs text-white outline-none placeholder:text-white/20" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-white/30 hover:text-white">
                <X size={13} />
              </button>
            )}
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            {user ? (
              <>
                <div className="max-w-[130px] truncate rounded-full border border-[#caff00]/20 bg-[#caff00]/[0.05] px-3 py-2 font-mono text-[9px] text-[#caff00]">{user.email}</div>
                <button onClick={() => signOut(auth)} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400">
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setShowLogin(true)} className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/60 transition hover:border-white hover:bg-white hover:text-black">Login</button>
                <button onClick={() => setShowJoin(true)} className="rounded-full bg-[#ff168c] px-5 py-2.5 text-[10px] font-black uppercase tracking-wider shadow-[0_0_25px_rgba(255,22,140,.25)] transition hover:scale-105">Join TAPESY</button>
              </>
            )}
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="rounded-full border border-white/10 p-2.5 text-white/70 lg:hidden">
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-[#080807] px-5 py-6 lg:hidden">
            <div className="mb-6 flex items-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-3">
              <Search size={15} className="text-white/30" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search gospel music..." className="ml-3 w-full bg-transparent text-sm outline-none placeholder:text-white/20" />
            </div>
            <nav className="flex flex-col gap-5 text-sm font-bold uppercase tracking-wider">
              {["Home", "Discover", "Trending", "Radio"].map((label) => (
                <a key={label} href={`#${label.toLowerCase()}`} onClick={() => setIsMobileMenuOpen(false)} className="text-white/60 hover:text-[#ff168c]">
                  {label}
                </a>
              ))}
            </nav>
            {!user && (
              <div className="mt-7 flex gap-2 border-t border-white/10 pt-6">
                <button onClick={() => { setShowLogin(true); setIsMobileMenuOpen(false); }} className="flex-1 rounded-xl border border-white/15 py-3 text-xs font-bold">LOGIN</button>
                <button onClick={() => { setShowJoin(true); setIsMobileMenuOpen(false); }} className="flex-1 rounded-xl bg-[#ff168c] py-3 text-xs font-black">JOIN TAPESY</button>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8">
        <section className="relative flex min-h-[calc(100vh-72px)] flex-col justify-center py-16">
          <div className="absolute left-0 top-20 hidden rotate-[-8deg] border-l-2 border-[#ff168c] pl-4 font-mono text-[9px] uppercase tracking-[.3em] text-white/30 md:block">
            Gospel / Culture<br />Worship / Stories
          </div>
          <div className="absolute right-0 top-32 hidden rotate-[8deg] text-right font-mono text-[9px] uppercase tracking-[.3em] text-white/20 md:block">
            Est. 2026<br />Music that matters
          </div>
          <div className="mb-[-30px]">
            <Cassette isPlaying={isPlaying} />
          </div>
          <div className="relative z-10 mx-auto mt-10 max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#caff00]/20 bg-[#caff00]/[0.04] px-4 py-2 font-mono text-[9px] uppercase tracking-[.25em] text-[#caff00]">
              <Waves size={12} /> Your faith. Your sound. Your story.
            </div>
            <h1 className="text-[16vw] font-black italic leading-[.78] tracking-[-.1em] sm:text-[110px] lg:text-[150px]">
              GOSPEL<br /><span className="text-[#ff168c] drop-shadow-[7px_7px_0_#caff00]">ON REPEAT.</span>
            </h1>
            <p className="mx-auto mt-10 max-w-xl font-mono text-xs leading-7 text-white/40 sm:text-sm">
              Discover songs that strengthen your faith, stories that move your heart, and artists carrying the sound of heaven into tomorrow.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => trendingSongs[0] && togglePlay(trendingSongs[0])} className="group flex items-center gap-3 rounded-full bg-[#ff168c] px-7 py-4 text-xs font-black uppercase tracking-wider shadow-[6px_6px_0_#caff00] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#caff00]">
                <Play size={15} fill="currentColor" /> Start Listening <ArrowUpRight size={14} className="transition group-hover:rotate-45" />
              </button>
              <button onClick={() => setShowUpload(true)} className="flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-7 py-4 text-xs font-black uppercase tracking-wider text-white/70 backdrop-blur-xl transition hover:border-white/40 hover:text-white">
                <Upload size={15} /> Drop a Tape
              </button>
            </div>
          </div>
          <div className="mx-auto mt-20 grid w-full max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
            {[[songs.length, "Tapes"], ["∞", "Faith"], ["24/7", "Worship"], ["1", "Family"]].map(([number, label]) => (
              <div key={label as string} className="bg-[#0b0b0a] px-5 py-5 text-center">
                <div className="text-2xl font-black italic text-white">{number}</div>
                <div className="mt-1 font-mono text-[8px] uppercase tracking-[.25em] text-white/25">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {featuredSong && (
          <section className="pb-24">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#11110f]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,22,140,.18),transparent_35%),radial-gradient(circle_at_20%_80%,rgba(202,255,0,.08),transparent_35%)]" />
              <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[.8fr_1.2fr]">
                <div className="relative min-h-[330px] overflow-hidden rounded-[25px]">
                  <img src={featuredSong.imageUrl} alt={featuredSong.title} className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-black/60 px-3 py-2 font-mono text-[8px] uppercase tracking-wider backdrop-blur-xl">
                    <Flame size={12} className="text-[#ff168c]" /> Featured Tape
                  </div>
                  <button onClick={() => togglePlay(featuredSong)} className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-white text-black shadow-2xl transition hover:scale-110">
                    {currentSong?.id === featuredSong.id && isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <div className="absolute bottom-5 left-5 right-24">
                    <p className="font-mono text-[9px] uppercase tracking-[.25em] text-white/50">{featuredSong.genre}</p>
                    <h2 className="mt-1 text-3xl font-black italic tracking-[-.06em]">{featuredSong.title}</h2>
                  </div>
                </div>
                <div className="flex flex-col justify-center px-2 sm:px-5">
                  <div className="mb-5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.3em] text-[#caff00]">
                    <Crown size={13} /> Tape of the moment
                  </div>
                  <h2 className="max-w-xl text-5xl font-black italic leading-[.9] tracking-[-.08em] sm:text-7xl">
                    LET THE<br /><span className="text-[#ff168c]">SOUND</span><br />SPEAK.
                  </h2>
                  <p className="mt-7 max-w-lg text-sm leading-7 text-white/40">
                    {featuredSong.testimony || "A worship experience created to encourage hearts, strengthen faith and remind us that every story matters."}
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => togglePlay(featuredSong)} className="rounded-xl bg-[#caff00] px-5 py-3 text-xs font-black uppercase text-black shadow-[4px_4px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1">Listen now</button>
                    <button onClick={() => { setCurrentSong(featuredSong); setShowLyrics(true); }} className="rounded-xl border border-white/10 px-5 py-3 text-xs font-black uppercase text-white/60 transition hover:border-white/30 hover:text-white">Read lyrics</button>
                  </div>
                  <div className="mt-10 flex items-center gap-5 border-t border-white/[0.08] pt-5">
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-white/20">Artist</p>
                      <p className="mt-1 text-sm font-bold">{featuredSong.artist}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <p className="font-mono text-[8px] uppercase tracking-wider text-white/20">Season</p>
                      <p className="mt-1 text-sm font-bold">{featuredSong.season}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="seasons" className="py-24">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.3em] text-[#ff168c]">
                <Sparkles size={12} /> Mood library
              </div>
              <h2 className="text-4xl font-black italic tracking-[-.07em] sm:text-6xl">
                WHERE ARE YOU<br /><span className="text-[#caff00]">RIGHT NOW?</span>
              </h2>
            </div>
            <p className="max-w-xs font-mono text-[10px] leading-5 text-white/25">Every season carries a sound. Choose the one that matches your current chapter.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {seasons.map((season) => {
              const count = songs.filter((s) => s.season === season.name).length;
              const isActive = selectedSeason === season.name;
              return (
                <button key={season.name} onClick={() => setSelectedSeason(isActive ? "" : season.name)} className={`group relative min-h-[170px] overflow-hidden rounded-[20px] border p-5 text-left transition duration-300 hover:-translate-y-2 ${isActive ? "border-[#caff00] bg-[#caff00]/10 shadow-[0_0_40px_rgba(202,255,0,.12)]" : "border-white/10 bg-[#11110f] hover:border-white/30"}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${season.color} opacity-20`} />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <span className="text-3xl">{season.emoji}</span>
                      <ArrowUpRight size={15} className="text-white/20 transition group-hover:text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase">{season.name}</h3>
                      <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/25">{count} tapes</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {selectedSeason && (
            <button onClick={() => setSelectedSeason("")} className="mt-5 rounded-full border border-[#ff168c]/30 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-[#ff168c]">Clear season ×</button>
          )}
        </section>

        <section id="trending" className="py-24">
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[.3em] text-[#caff00]">
                <Flame size={12} /> What's moving
              </div>
              <h2 className="text-5xl font-black italic leading-[.9] tracking-[-.08em] sm:text-7xl">
                {searchQuery ? <>SEARCH<br /><span className="text-[#ff168c]">FOUND.</span></> : <>BIG<br /><span className="text-[#ff168c]">FAITH.</span></>}
              </h2>
              {searchQuery && <p className="mt-4 font-mono text-[10px] text-white/30">{filteredSongs.length} tapes matched your search</p>}
            </div>
            <button onClick={() => setShowUpload(true)} className="flex w-fit items-center gap-2 rounded-xl bg-[#caff00] px-5 py-3 text-xs font-black uppercase text-black shadow-[5px_5px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1">
              <Upload size={14} /> Upload Tape
            </button>
          </div>

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-white/30">
                <Waves size={16} className="animate-pulse" /> Loading tapes...
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-5 font-mono text-xs text-red-400">Unable to load tapes: {error}</div>
          )}
          {!loading && !error && trendingSongs.length === 0 && (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 text-center">
              <Music2 size={45} className="mb-4 text-white/10" />
              <p className="font-mono text-xs text-white/30">{searchQuery ? "No tapes found." : "No tapes yet. Be the first to drop one."}</p>
            </div>
          )}

          <div className="relative">
            <button onClick={handleScrollLeft} className="absolute -left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 backdrop-blur-xl md:flex hover:bg-[#ff168c] hover:border-[#ff168c] transition-colors">
              <ChevronLeft size={17} />
            </button>

            <div ref={trendingContainerRef} className="relative flex w-full gap-5 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              <div className="pointer-events-none absolute right-0 top-0 bottom-8 w-16 bg-gradient-to-l from-[#070706] to-transparent" />
              {trendingSongs.map((song, index) => (
                <article key={song.id} className="group relative flex-shrink-0 w-[280px] min-w-[280px] overflow-hidden rounded-[22px] border border-white/10 bg-[#11110f] transition duration-500 hover:-translate-y-3 hover:border-white/20 snap-center">
                  <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-[#ff168c]/[0.04] opacity-0 transition group-hover:opacity-100" />
                  <div className="relative m-2 aspect-square overflow-hidden rounded-[17px]">
                    <img src={song.imageUrl} alt={song.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 font-mono text-[9px] font-bold backdrop-blur-xl">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {user && song.uploadedBy === user.uid && (
                      <button onClick={(e) => handleDelete(song, e)} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 shadow-xl transition group-hover:opacity-100 hover:scale-110">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <button onClick={() => togglePlay(song)} className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:opacity-100 hover:scale-110">
                      {currentSong?.id === song.id && isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
                    </button>
                    <div className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-wider text-white/60 backdrop-blur-xl">
                      {song.genre}
                    </div>
                  </div>
                  <div className="relative px-4 pb-4 pt-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="flex items-center gap-1 truncate text-base font-black">
                          <span className="truncate">{song.title}</span>
                          {song.verified && <BadgeCheck size={14} className="shrink-0 fill-[#caff00] text-[#caff00]" />}
                        </h3>
                        <p className="mt-1 truncate text-xs text-white/30">{song.artist}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleLike(song.id); }} className="shrink-0">
                        <Heart size={17} className={`transition ${likedSongs.has(song.id) ? "fill-[#ff168c] text-[#ff168c]" : "text-white/20 hover:text-[#ff168c]"}`} />
                      </button>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <div className="flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider text-white/20">
                        <Clock3 size={10} />
                        {/* ✅ FIXED: Added fallback || 0 to satisfy TypeScript */}
                        {formatTime(song.duration || 0)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => shareWhatsApp(song)} className="rounded-full p-2 text-white/20 transition hover:bg-green-500/10 hover:text-green-400" title="WhatsApp">
                          <MessageCircle size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setCurrentSong(song); setShowShare(true); }} className="rounded-full p-2 text-white/20 transition hover:bg-[#ff168c]/10 hover:text-[#ff168c]">
                          <Share2 size={15} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDownload(song); }} className="rounded-full p-2 text-white/20 transition hover:bg-[#caff00]/10 hover:text-[#caff00]">
                          <Download size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button onClick={handleScrollRight} className="absolute -right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/80 backdrop-blur-xl md:flex hover:bg-[#ff168c] hover:border-[#ff168c] transition-colors">
              <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <section id="discover" className="py-24">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[.3em] text-[#ff168c]">Explore the sound</div>
              <h2 className="text-4xl font-black italic tracking-[-.07em] sm:text-6xl">FIND YOUR<br /><span className="text-[#caff00]">VIBE.</span></h2>
            </div>
            <p className="max-w-sm font-mono text-[9px] uppercase leading-5 tracking-wider text-white/20">From worship to Afro-gospel, every sound has a place at the table.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {genres.map((genre, index) => (
              <button key={genre} onClick={() => setSearchQuery(genre)} className={`group relative overflow-hidden rounded-xl border px-6 py-4 text-xs font-black uppercase tracking-wider transition hover:-translate-y-1 ${index === 0 ? "border-[#caff00] bg-[#caff00] text-black shadow-[5px_5px_0_#ff168c]" : index === 3 ? "border-[#ff168c]/50 text-[#ff168c] hover:bg-[#ff168c] hover:text-white" : "border-white/10 bg-[#11110f] text-white/50 hover:border-white/30 hover:text-white"}`}>
                {genre}
              </button>
            ))}
            <button onClick={() => { setSearchQuery(""); setSelectedSeason(""); }} className="rounded-xl border border-dashed border-white/10 px-6 py-4 text-xs font-black uppercase tracking-wider text-white/20 transition hover:border-[#ff168c]/40 hover:text-[#ff168c]">Reset</button>
          </div>
        </section>

        <section id="radio" className="py-24">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff168c]/10 text-[#ff168c]">
              <Radio size={18} />
            </div>
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[.3em] text-white/25">TAPESY radio</p>
              <h2 className="text-xl font-black uppercase">The listening room</h2>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0e0e0d] shadow-[0_30px_100px_rgba(0,0,0,.5)]">
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] [background-size:50px_50px]" />
            <div className="relative grid lg:grid-cols-[.7fr_1.3fr]">
              <div className="border-b border-white/[0.08] p-6 sm:p-10 lg:border-b-0 lg:border-r">
                <div className="relative mx-auto max-w-[360px] lg:mx-0">
                  <div className="relative aspect-square overflow-hidden rounded-[28px] border border-white/10 bg-black">
                    {currentSong?.imageUrl ? (
                      <img src={currentSong.imageUrl} alt={currentSong.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff168c]/10 to-[#caff00]/5">
                        <Music2 size={70} className="text-[#ff168c]/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <div className="absolute bottom-5 left-5">
                      <div className="mb-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.25em] text-white/40">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff168c]" />
                        {isPlaying ? "Now playing" : "Paused"}
                      </div>
                      <h3 className="max-w-[240px] truncate text-3xl font-black italic tracking-[-.06em]">{currentSong?.title || "Choose a tape"}</h3>
                      {currentSong && <p className="mt-1 text-sm text-white/40">{currentSong.artist}</p>}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <button onClick={() => currentSong && setShowLyrics(true)} disabled={!currentSong} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-[#caff00] hover:text-[#caff00] disabled:opacity-20">
                      <FileText size={18} />
                    </button>
                    <button onClick={() => currentSong && setShowShare(true)} disabled={!currentSong} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-[#ff168c] hover:text-[#ff168c] disabled:opacity-20">
                      <Share2 size={18} />
                    </button>
                    <button onClick={() => currentSong && handleDownload(currentSong)} disabled={!currentSong} className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/50 transition hover:border-[#caff00] hover:text-[#caff00] disabled:opacity-20">
                      <Download size={18} />
                    </button>
                    <button onClick={() => currentSong && setShowTip(true)} disabled={!currentSong} className="flex h-12 w-12 items-center justify-center rounded-full border border-[#ff168c]/30 bg-[#ff168c]/10 text-[#ff168c] transition hover:scale-105 disabled:opacity-20">
                      <Heart size={18} fill="currentColor" />
                    </button>
                    <button onClick={() => currentSong && togglePlay(currentSong)} disabled={!currentSong} className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff168c] text-white shadow-[0_0_35px_rgba(255,22,140,.25)] transition hover:scale-110 disabled:opacity-20">
                      {isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}
                    </button>
                  </div>

                  {currentSong && (
                    <div className="mt-7">
                      <div className="mb-2 flex justify-between font-mono text-[8px] text-white/25">
                        <span>{formatTime(currentTime)}</span>
                        {/* ✅ FIXED: Added fallback || 0 to satisfy TypeScript */}
                        <span>{formatTime(currentSong.duration || 0)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[#ff168c] transition-all" style={{ width: `${currentSong.duration ? Math.min(100, (currentTime / currentSong.duration) * 100) : 0}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative min-h-[520px]">
                <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0e0e0d]/80 px-6 py-4 backdrop-blur-xl sm:px-8">
                  <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[.25em] text-white/25">
                    <Mic2 size={12} /> Live lyrics
                  </div>
                  {currentSong && (
                    <span className="rounded-full border border-[#caff00]/20 px-3 py-1.5 font-mono text-[7px] uppercase tracking-wider text-[#caff00]">Synced</span>
                  )}
                </div>

                <div ref={lyricsContainerRef} className="h-[520px] overflow-y-auto px-6 py-24 text-center [scrollbar-width:none] sm:px-10">
                  {currentSong ? (
                    currentSong.syncedLyrics && currentSong.syncedLyrics.length > 0 ? (
                      <div className="space-y-8 pb-24 pt-16">
                        {currentSong.syncedLyrics.map((line, i) => {
                          const isActive = currentTime >= line.time && (i === currentSong.syncedLyrics!.length - 1 || currentTime < currentSong.syncedLyrics![i + 1].time);
                          return (
                            <p key={i} className={`cursor-default transition-all duration-500 ${isActive ? "scale-105 text-2xl font-black italic text-white drop-shadow-[0_0_18px_rgba(255,255,255,.35)] sm:text-3xl" : "text-lg text-white/15 hover:text-white/35 sm:text-xl"}`}>
                              {line.text}
                            </p>
                          );
                        })}
                      </div>
                    ) : currentSong.lyrics ? (
                      <div className="flex h-full flex-col items-center justify-center">
                        <Sparkles size={45} className="mb-5 animate-pulse text-[#ff168c]" />
                        <p className="text-lg font-black">Your lyrics are waiting.</p>
                        <p className="mt-2 max-w-xs text-xs leading-6 text-white/30">Open the full lyrics view to read the complete song.</p>
                        <button onClick={() => setShowLyrics(true)} className="mt-6 rounded-full bg-[#ff168c] px-5 py-3 text-[9px] font-black uppercase">Open lyrics</button>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center">
                        <Waves size={45} className="mb-5 animate-pulse text-[#caff00]" />
                        <p className="text-lg font-black">AI is preparing this tape.</p>
                        <p className="mt-2 max-w-xs text-xs leading-6 text-white/30">Lyrics and transcription will appear here when ready.</p>
                      </div>
                    )
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">
                      <Headphones size={55} className="mb-5 text-white/10" />
                      <p className="text-lg font-black text-white/40">Your listening room is empty.</p>
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-white/20">Select a tape to begin</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {currentSong && (currentSong.testimony || currentSong.chords) && (
              <div className="grid gap-4 border-t border-white/[0.08] bg-black/20 p-6 sm:p-8 md:grid-cols-2">
                {currentSong.testimony && (
                  <div className="rounded-2xl border border-[#caff00]/15 bg-[#caff00]/[0.025] p-5">
                    <div className="mb-3 flex items-center gap-2 text-[#caff00]">
                      <Sparkles size={15} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[.2em]">Testimony</span>
                    </div>
                    <p className="text-sm leading-7 text-white/60">{currentSong.testimony}</p>
                  </div>
                )}
                {currentSong.chords && (
                  <div className="rounded-2xl border border-[#ff168c]/15 bg-[#ff168c]/[0.025] p-5">
                    <div className="mb-3 flex items-center gap-2 text-[#ff168c]">
                      <Music2 size={15} />
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[.2em]">Chord chart</span>
                    </div>
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-7 text-white/60">{currentSong.chords}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="relative overflow-hidden py-32 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff168c]/10 blur-[150px]" />
          <div className="relative">
            <div className="mx-auto mb-7 flex h-14 w-14 rotate-[-8deg] items-center justify-center rounded-2xl border border-[#caff00]/30 bg-[#caff00]/10 text-[#caff00] shadow-[5px_5px_0_#ff168c]">
              <Mic2 size={23} />
            </div>
            <p className="font-mono text-[9px] uppercase tracking-[.4em] text-white/25">For artists · worshippers · storytellers</p>
            <h2 className="mt-6 text-[13vw] font-black italic leading-[.8] tracking-[-.1em] sm:text-[90px]">
              YOUR VOICE<br /><span className="text-[#ff168c]">MATTERS.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-lg text-sm leading-7 text-white/30">Turn your worship into a tape. Share your testimony. Give people something they can carry into their next season.</p>
            <button onClick={() => setShowUpload(true)} className="mt-9 rounded-xl bg-[#caff00] px-8 py-4 text-xs font-black uppercase tracking-wider text-black shadow-[6px_6px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[3px_3px_0_#ff168c]">Create your first tape →</button>
          </div>
        </section>

        <footer className="relative mb-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#11110f]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-3 lg:items-center">
            <div>
              <div className="text-3xl font-black italic tracking-[-.12em] text-[#ff168c]">TAPESY</div>
              <p className="mt-2 max-w-xs font-mono text-[9px] uppercase leading-5 tracking-[.2em] text-white/20">Gospel music.<br />Greater stories.<br />Eternal impact.</p>
            </div>
            <div className="flex items-center justify-center gap-3 lg:justify-center">
              <a href="https://instagram.com/dimmyjaynanre" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/30 transition hover:border-[#ff168c] hover:bg-[#ff168c]/10 hover:text-[#ff168c]">
                <IoLogoInstagram size={18} />
              </a>
              <a href="https://youtube.com/@dimejifalayi2073" target="_blank" rel="noopener noreferrer" className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/30 transition hover:border-red-500 hover:bg-red-500/10 hover:text-red-400">
                <IoLogoYoutube size={18} />
              </a>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 text-white/20">
                <Music2 size={17} />
              </div>
            </div>
            <div className="text-center lg:text-right">
              <p className="font-mono text-[8px] uppercase tracking-[.25em] text-white/20">© 2026 TAPESY</p>
              <p className="mt-2 text-xs font-bold text-white/40">Faith today.<span className="text-[#ff168c]"> Legends tomorrow.</span></p>
            </div>
          </div>
          <div className="border-t border-white/[0.06] px-6 py-4 text-center font-mono text-[7px] uppercase tracking-[.4em] text-white/15">Worship · Word · Witness · Wisdom · Forever ♡</div>
        </footer>
      </div>
    </main>
  );
}

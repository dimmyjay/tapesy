"use client";

import { useState, FormEvent } from "react";
import { 
  Music2, 
  Upload, 
  X, 
  Search, 
  Sparkles, 
  Heart, 
  ExternalLink, 
  Check,
  Share2 
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import type { Song } from "@/types/song";

// Shared Genres for Gospel Focus
export const genres = [
  "CONTEMPORARY GOSPEL",
  "WORSHIP & PRAISE",
  "CHORAL",
  "AFRO-GOSPEL",
  "HYMNS",
  "INSTRUMENTAL",
];

// Spiritual Seasons
export const seasons = [
  { name: "MORNING DEVOTION", emoji: "🌅", color: "from-orange-500/20 to-yellow-500/20" },
  { name: "BREAKTHROUGH", emoji: "⚔️", color: "from-red-500/20 to-orange-500/20" },
  { name: "QUIET PRAYER", emoji: "🕊️", color: "from-blue-500/20 to-purple-500/20" },
  { name: "HIGH PRAISE", emoji: "🙌", color: "from-yellow-500/20 to-pink-500/20" },
  { name: "HEALING", emoji: "💚", color: "from-green-500/20 to-teal-500/20" },
  { name: "GRATITUDE", emoji: "🙏", color: "from-pink-500/20 to-purple-500/20" },
];

/* ─── Upload Modal (2-Step Process) ─── */
export function UploadModal({ onClose, user }: { onClose: () => void; user?: any }) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [season, setSeason] = useState("");
  const [testimony, setTestimony] = useState("");
  const [chords, setChords] = useState("");
  const [tipLink, setTipLink] = useState("");
  const [verified, setVerified] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const uploadToCloudinary = async (file: File, resourceType: 'image' | 'video') => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    // 🔍 DEBUG LOG: Check your browser console (F12) to see if this is undefined
    console.log("☁️ Cloudinary Cloud Name:", cloudName);

    if (!cloudName || cloudName.trim() === "" || cloudName === "your_cloud_name_here") {
      throw new Error("Cloudinary Cloud Name is missing. Please check your .env.local file and restart the server.");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'tapesy_uploads'); 
    formData.append('folder', `tapesy/${resourceType === 'video' ? 'audio' : 'covers'}`);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    console.log("📤 Uploading to URL:", url);

    try {
      const res = await fetch(url, { 
        method: 'POST', 
        body: formData 
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("❌ Cloudinary API Error:", err);
        throw new Error(err.error?.message || `Upload failed with status ${res.status}`);
      }
      
      const data = await res.json();
      console.log("✅ Upload Success:", data.secure_url);
      return data;
    } catch (error: any) {
      console.error("🚨 Fetch Error Details:", error);
      
      // Specific, helpful error message for network failures
      if (error.message === "Failed to fetch" || error.name === "TypeError") {
        throw new Error("Network blocked: Could not connect to Cloudinary. Please disable ad-blockers, check your internet, and ensure your .env.local has the correct NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME.");
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !imageFile || !title || !artist || !genre) {
      setStatus("✗ Please fill in all required fields.");
      return;
    }

    setUploading(true);
    try {
      setStatus("Uploading Cover Art...");
      const imageResult = await uploadToCloudinary(imageFile, 'image');
      
      setStatus("Uploading Audio... (This may take a moment)");
      const audioResult = await uploadToCloudinary(audioFile, 'video');

      setStatus("Saving to database...");
      const payload = {
        title, artist, genre, season,
        audioUrl: audioResult.secure_url,
        imageUrl: imageResult.secure_url,
        duration: audioResult.duration || 0,
        testimony, chords, tipLink, verified,
        audioPublicId: audioResult.public_id,
        imagePublicId: imageResult.public_id,
      };

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": user?.uid || "anonymous" 
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("✓ Tape added! Starting AI Transcription...");
        await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioUrl: audioResult.secure_url, songId: data.song.id }),
        }).catch(err => console.error("Transcription failed", err));
        
        setStatus("✓ Tape & Lyrics added successfully!");
        setTimeout(onClose, 2000);
      } else {
        setStatus(`✗ Database Error: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setStatus(`✗ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-[#5d5751] bg-[#11100f] p-6 shadow-[0_25px_80px_rgba(0,0,0,.8)] my-8">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition"><X size={20} /></button>
        <h3 className="mb-2 rotate-[-2deg] text-2xl font-black italic text-[#ff168c]">UPLOAD A TAPE ♡</h3>
        <p className="mb-6 text-xs text-white/40 font-mono">Step {step} of 2</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {step === 1 ? (
            <>
              <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Song Title *" required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c]" />
              <input value={artist} onChange={(e) => setArtist(e.target.value)} type="text" placeholder="Artist / Ministry Name *" required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c]" />
              <select value={genre} onChange={(e) => setGenre(e.target.value)} required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white/70 outline-none focus:border-[#ff168c]">
                <option value="">Select Gospel Genre *</option>
                {genres.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
              <select value={season} onChange={(e) => setSeason(e.target.value)} className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white/70 outline-none focus:border-[#ff168c]">
                <option value="">Select Spiritual Season (optional)</option>
                {seasons.map((s) => (<option key={s.name} value={s.name}>{s.emoji} {s.name}</option>))}
              </select>
              
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-black/40 px-4 py-6 text-center text-xs transition hover:border-[#caff00] hover:text-[#caff00]">
                <Music2 size={24} />
                <span className="font-bold text-white break-all">{audioFile ? audioFile.name : "Audio File (.mp3, .wav) *"}</span>
                <input type="file" accept="audio/*" required className="hidden" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} />
              </label>

              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-black/40 px-4 py-6 text-center text-xs transition hover:border-[#ff168c] hover:text-[#ff168c]">
                <Upload size={24} />
                <span className="font-bold text-white break-all">{imageFile ? imageFile.name : "Cover Art (.jpg, .png) *"}</span>
                <input type="file" accept="image/*" required className="hidden" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </label>

              <button type="button" onClick={() => setStep(2)} className="mt-2 rounded-lg bg-[#caff00] px-6 py-3 font-black uppercase italic text-black shadow-[4px_4px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#ff168c]">
                Next: Add the Story →
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-mono text-[#caff00] mb-2 block">📖 THE TESTIMONY (Story behind the song)</label>
                <textarea 
                  value={testimony} 
                  onChange={(e) => setTestimony(e.target.value)}
                  placeholder="Share the scripture, struggle, or divine inspiration behind this song..."
                  rows={4}
                  className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c] resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#caff00] mb-2 block">🎸 CHORD CHART (for worship leaders)</label>
                <textarea 
                  value={chords} 
                  onChange={(e) => setChords(e.target.value)}
                  placeholder="e.g. Intro: G D Em C&#10;Verse: G D Em C&#10;Chorus: C G D Em"
                  rows={3}
                  className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c] resize-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-[#caff00] mb-2 block">💝 TIP / LOVE OFFERING LINK (optional)</label>
                <input 
                  value={tipLink} 
                  onChange={(e) => setTipLink(e.target.value)}
                  type="url"
                  placeholder="https://paypal.me/yourministry or CashApp link"
                  className="w-full rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c]"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer hover:text-white transition">
                <input 
                  type="checkbox" 
                  checked={verified} 
                  onChange={(e) => setVerified(e.target.checked)}
                  className="rounded border-white/20 bg-black/60 accent-[#caff00]"
                />
                I am a verified ministry / artist
              </label>

              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 rounded-lg border-2 border-white/20 px-6 py-3 font-black uppercase italic text-white/70 transition hover:bg-white/5">
                  ← Back
                </button>
                <button type="submit" disabled={uploading} className="flex-1 rounded-lg bg-[#ff168c] px-6 py-3 font-black uppercase italic text-white shadow-[4px_4px_0_#caff00] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#caff00] disabled:opacity-50">
                  {uploading ? "Uploading..." : "Drop the Tape →"}
                </button>
              </div>
              {status && <p className="text-center font-mono text-xs text-white/60 mt-2">{status}</p>}
            </>
          )}
        </form>
      </div>
    </div>
  );
}

/* ─── Tip the Artist Modal ─── */
export function TipModal({ song, onClose }: { song: Song | null; onClose: () => void }) {
  if (!song) return null;

  const tipLink = song.tipLink || `https://paypal.me/${song.artist.replace(/\s+/g, '')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-[#caff00] bg-[#11100f] p-6 shadow-[0_25px_80px_rgba(0,0,0,.8)] animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition"><X size={20} /></button>
        
        <div className="text-center mb-6">
          <Heart size={40} className="mx-auto mb-3 text-[#ff168c] fill-[#ff168c] animate-pulse" />
          <h3 className="text-2xl font-black italic text-[#caff00]">LOVE OFFERING ♡</h3>
          <p className="text-sm text-white/60 mt-2">Support <span className="text-white font-bold">{song.artist}</span> directly</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/40 p-5 mb-6">
          <p className="font-mono text-xs text-white/40 mb-2">YOUR GIFT ENABLES:</p>
          <ul className="space-y-2 text-sm text-white/80">
            <li>🎤 More anointed music</li>
            <li>📖 Continued ministry</li>
            <li>🙏 Direct support to the artist</li>
          </ul>
        </div>

        <a 
          href={tipLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#caff00] py-4 font-black uppercase italic text-black shadow-[4px_4px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#ff168c]"
        >
          <ExternalLink size={18} /> Give a Love Offering
        </a>
        <p className="text-center text-[10px] text-white/30 mt-4 font-mono">
          100% goes to the artist · TAPESY takes no cut
        </p>
      </div>
    </div>
  );
}

/* ─── Share Modal Component ─── */
export function ShareModal({ song, onClose }: { song: Song | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  
  if (!song) return null;

  const handleCopy = () => {
    const url = `${window.location.origin}/?song=${song.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-sm rounded-2xl border-2 border-[#5d5751] bg-[#11100f] p-6 shadow-[0_25px_80px_rgba(0,0,0,.8)] animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition"><X size={20} /></button>
        
        <h3 className="mb-6 text-center font-black italic text-[#caff00] text-xl">SHARE THIS TAPE ♡</h3>
        
        <div className="mb-6 rounded-xl border-2 border-[#ff168c]/30 bg-black/40 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_15%,rgba(255,255,255,.05)_35%,transparent_45%)] pointer-events-none" />
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#ff168c] bg-[#ff168c]/10 shadow-[0_0_20px_rgba(255,22,140,0.3)]">
            <Music2 size={32} className="text-[#ff168c]" />
          </div>
          <p className="font-black italic text-white text-xl truncate px-2">{song.title}</p>
          <p className="text-sm text-white/50 truncate px-2">{song.artist}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-mono text-[#caff00] uppercase tracking-widest">
            <span className="animate-pulse">▶</span> TAPESY.GOSPEL
          </div>
        </div>

        <button 
          onClick={handleCopy}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-black uppercase italic text-white shadow-[4px_4px_0_#caff00] transition hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_#caff00] ${copied ? 'bg-[#caff00] text-black' : 'bg-[#ff168c]'}`}
        >
          {copied ? <Check size={20} /> : <Share2 size={20} />}
          {copied ? "Link Copied to Clipboard!" : "Copy Tape Link"}
        </button>
      </div>
    </div>
  );
}

/* ─── Auth & Search Modals ─── */
export function LoginModal({ onClose, onSwitchToJoin }: { onClose: () => void; onSwitchToJoin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await signInWithEmailAndPassword(auth, email, password); onClose(); } 
    catch (err: any) { setError(err.message || "Failed to login"); } 
    finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setLoading(true); setError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); onClose(); } 
    catch (err: any) { setError(err.message || "Failed to authenticate with Google"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-[#5d5751] bg-[#11100f] p-6 shadow-[0_25px_80px_rgba(0,0,0,.8)]">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition"><X size={20} /></button>
        <h3 className="mb-6 rotate-[-2deg] text-2xl font-black italic text-[#ff168c]">LOG IN ♡</h3>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c]" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#ff168c]" />
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <button type="submit" disabled={loading} className="mt-2 rounded-lg bg-[#ff168c] px-6 py-3 font-black uppercase italic text-white shadow-[4px_4px_0_#caff00] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#caff00] disabled:opacity-50">{loading ? "Loading..." : "Log In"}</button>
          <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[#11100f] px-2 text-white/40">Or continue with</span></div></div>
          <button type="button" onClick={handleGoogleAuth} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-black/40 px-6 py-3 font-black uppercase italic text-white transition hover:bg-white/10 disabled:opacity-50">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Google
          </button>
          <p className="text-center text-xs text-white/40 mt-4">New to TAPESY? <button type="button" onClick={onSwitchToJoin} className="text-[#caff00] underline hover:text-white">Join Now</button></p>
        </form>
      </div>
    </div>
  );
}

export function JoinModal({ onClose, onSwitchToLogin }: { onClose: () => void; onSwitchToLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault(); setLoading(true); setError("");
    try { await createUserWithEmailAndPassword(auth, email, password); onClose(); } 
    catch (err: any) { setError(err.message || "Failed to create account"); } 
    finally { setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    setLoading(true); setError("");
    try { await signInWithPopup(auth, new GoogleAuthProvider()); onClose(); } 
    catch (err: any) { setError(err.message || "Failed to authenticate with Google"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border-2 border-[#5d5751] bg-[#11100f] p-6 shadow-[0_25px_80px_rgba(0,0,0,.8)]">
        <button onClick={onClose} className="absolute right-4 top-4 text-white/40 hover:text-white transition"><X size={20} /></button>
        <h3 className="mb-6 rotate-[-2deg] text-2xl font-black italic text-[#caff00]">JOIN TAPESY ♡</h3>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#caff00]" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-lg border border-white/20 bg-black/60 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#caff00]" />
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <button type="submit" disabled={loading} className="mt-2 rounded-lg bg-[#caff00] px-6 py-3 font-black uppercase italic text-black shadow-[4px_4px_0_#ff168c] transition hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0_#ff168c] disabled:opacity-50">{loading ? "Creating..." : "Create Account"}</button>
          <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-[#11100f] px-2 text-white/40">Or continue with</span></div></div>
          <button type="button" onClick={handleGoogleAuth} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-black/40 px-6 py-3 font-black uppercase italic text-white transition hover:bg-white/10 disabled:opacity-50">
             <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Google
          </button>
          <p className="text-center text-xs text-white/40 mt-4">Already have a tape deck? <button type="button" onClick={onSwitchToLogin} className="text-[#ff168c] underline hover:text-white">Log In</button></p>
        </form>
      </div>
    </div>
  );
}

export function SearchModal({ onClose, onSearch }: { onClose: () => void; onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); onSearch(query); onClose(); };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/90 backdrop-blur-md pt-32 p-4">
      <div className="relative w-full max-w-2xl">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white/40 hover:text-white transition"><X size={32} /></button>
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff168c]" size={24} />
          <input autoFocus type="text" placeholder="Search gospel songs, artists..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-xl border-2 border-[#5d5751] bg-[#11100f] py-6 pl-14 pr-6 text-2xl font-black italic text-white placeholder-white/20 outline-none focus:border-[#ff168c] shadow-[0_0_50px_rgba(255,22,140,0.1)]" />
        </form>
        <p className="mt-4 text-center font-mono text-xs text-white/30">Press ENTER to search the archives</p>
      </div>
    </div>
  );
}

export function LyricsModal({ song, onClose }: { song: Song | null; onClose: () => void }) {
  if (!song) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl h-[80vh] rounded-2xl border-2 border-[#5d5751] bg-[#11100f] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,.8)]">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div><h3 className="text-2xl font-black italic text-[#caff00]">{song.title}</h3><p className="text-sm text-white/40">{song.artist}</p></div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition"><X size={24} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 font-mono text-lg leading-loose text-white/80 whitespace-pre-wrap custom-scrollbar">
          {song.lyrics ? (
            <div className="space-y-4">{song.lyrics.split('\n').map((line, i) => (<p key={i} className={line.trim() === "" ? "h-4" : ""}>{line}</p>))}</div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30">
              <Sparkles size={48} className="mb-4 animate-pulse" />
              <p>AI is currently transcribing this tape...</p>
              <p className="text-xs mt-2">Check back in a few minutes!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
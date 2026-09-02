export interface SyncedLyric {
  time: number; // Time in seconds
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioUrl: string;
  imageUrl: string;
  lyrics?: string; // Fallback plain text
  syncedLyrics?: SyncedLyric[]; // Time-synced lyrics
  testimony?: string;
  chords?: string;
  season?: string;
  verified?: boolean;
  tipLink?: string;
  uploadedBy?: string; // ✅ NEW: User ID of the uploader (fixes the build error)
  duration?: number;
  createdAt: number;
}

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import type { Song } from "@/types/song";

export function useSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const songsRef = ref(db, "songs");

    const unsubscribe = onValue(
      songsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsed: Song[] = Object.values(data) as Song[];
          // Sort by newest first
          parsed.sort((a, b) => b.createdAt - a.createdAt);
          setSongs(parsed);
        } else {
          setSongs([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Firebase read error:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { songs, loading, error };
}
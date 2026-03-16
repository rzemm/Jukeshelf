"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { VotingScreen } from "@/components/voting-screen";
import { subscribeToActiveRound, subscribeToNowPlaying, subscribeToVotingRound } from "@/lib/firestore";
import { ActiveRound, Song } from "@/lib/types";

export default function Home() {
  const searchParams = useSearchParams();
  const roundId = searchParams.get("round");
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);
  const [nowPlayingSong, setNowPlayingSong] = useState<Song | null>(null);
  const [nowPlayingStartedAtMs, setNowPlayingStartedAtMs] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = roundId
      ? subscribeToVotingRound(roundId, setActiveRound)
      : subscribeToActiveRound(setActiveRound);

    return unsubscribe;
  }, [roundId]);

  useEffect(() => {
    return subscribeToNowPlaying((song, startedAtMs) => {
      setNowPlayingSong(song);
      setNowPlayingStartedAtMs(startedAtMs);
    });
  }, []);

  if (!activeRound || !activeRound.isActive || activeRound.songs.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-100">
        <h1 className="text-2xl font-semibold">Brak aktywnego głosowania</h1>
        <p className="mt-2 text-sm text-zinc-300">Wejdź na panel admina i kliknij „Rozpocznij", aby uruchomić nową rundę.</p>
        <Link
          href="/admin"
          className="mt-4 inline-block rounded-full border border-cyan-300/40 bg-cyan-500/20 px-4 py-2 text-sm text-white"
        >
          Przejdź do panelu admina
        </Link>
        {nowPlayingSong ? <p className="mt-4 text-xs text-emerald-200">Teraz gra: {nowPlayingSong.title}</p> : null}
      </main>
    );
  }

  return (
    <main>
      <VotingScreen
        songs={activeRound.songs}
        initialVoteCounts={{}}
        nowPlayingSong={nowPlayingSong}
        nowPlayingStartedAtMs={nowPlayingStartedAtMs}
        roundId={activeRound.id}
      />
    </main>
  );
}

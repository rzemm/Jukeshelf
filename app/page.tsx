"use client";

import { useEffect, useState } from "react";
import { VotingScreen } from "@/components/voting-screen";
import { subscribeToActiveRound } from "@/lib/firestore";
import { ActiveRound } from "@/lib/types";

export default function Home() {
  const [activeRound, setActiveRound] = useState<ActiveRound | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveRound((round) => {
      setActiveRound(round);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!activeRound || !activeRound.isActive || activeRound.songs.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12 text-center text-zinc-100">
        <h1 className="text-2xl font-semibold">Brak aktywnego głosowania</h1>
        <p className="mt-2 text-sm text-zinc-300">Wejdź na panel admina i kliknij „Rozpocznij”, aby uruchomić nową rundę.</p>
      </main>
    );
  }

  return (
    <main>
      <VotingScreen
        songs={activeRound.songs}
        initialVoteCounts={{}}
        previousWinnerSong={null}
        roundId={activeRound.id}
      />
    </main>
  );
}

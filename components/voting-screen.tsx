"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Song } from "@/lib/types";

type VotingScreenProps = {
  songs: Song[];
};

export function VotingScreen({ songs }: VotingScreenProps) {
  const [votedSongId, setVotedSongId] = useState<string | null>(null);

  const votedSong = useMemo(
    () => songs.find((song) => song.id === votedSongId) ?? null,
    [songs, votedSongId],
  );

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">JukeShelf 🎵</h1>
        <p className="text-sm text-zinc-600">Wybierz utwór, który ma zagrać jako następny.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {songs.map((song) => (
          <li key={song.id} className="rounded-xl border border-zinc-200 p-3 shadow-sm">
            <Image
              src={song.thumbnail}
              alt={song.title}
              width={320}
              height={180}
              className="h-auto w-full rounded-md"
            />
            <p className="mt-2 text-sm font-medium">{song.title}</p>
            <button
              type="button"
              onClick={() => setVotedSongId(song.id)}
              disabled={votedSongId !== null}
              className="mt-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              Głosuj
            </button>
          </li>
        ))}
      </ul>

      {votedSong ? (
        <p className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">
          Dzięki! Twój głos został zapisany dla: <strong>{votedSong.title}</strong>.
        </p>
      ) : null}
    </section>
  );
}

"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Song } from "@/lib/types";

type VoteCountMap = Record<string, number>;

type VotingScreenProps = {
  songs: Song[];
  initialVoteCounts: VoteCountMap;
  previousWinnerSong: Song | null;
};

function getTotalVotes(voteCountMap: VoteCountMap): number {
  return Object.values(voteCountMap).reduce((sum, votes) => sum + votes, 0);
}

function getVotePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0) {
    return 0;
  }

  return Math.round((votes / totalVotes) * 100);
}

export function VotingScreen({ songs, initialVoteCounts, previousWinnerSong }: VotingScreenProps) {
  const [votedSongId, setVotedSongId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCountMap>(initialVoteCounts);

  const votedSong = useMemo(
    () => songs.find((song) => song.id === votedSongId) ?? null,
    [songs, votedSongId],
  );

  const totalVotes = useMemo(() => getTotalVotes(voteCounts), [voteCounts]);

  function handleVote(songId: string) {
    if (votedSongId !== null) {
      return;
    }

    setVotedSongId(songId);
    setVoteCounts((currentCounts) => ({
      ...currentCounts,
      [songId]: (currentCounts[songId] ?? 0) + 1,
    }));
  }

  return (
    <section className="relative mx-auto max-w-3xl space-y-6 p-6">
      {previousWinnerSong ? (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl opacity-20">
          <iframe
            title="Poprzednio wybrany utwór"
            src={`https://www.youtube.com/embed/${previousWinnerSong.youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${previousWinnerSong.youtubeId}`}
            className="h-full w-full"
            allow="autoplay"
          />
        </div>
      ) : null}

      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">JukeShelf 🎵</h1>
        <p className="text-sm text-zinc-600">Wybierz utwór, który ma zagrać jako następny.</p>
        {previousWinnerSong ? (
          <p className="text-xs text-zinc-500">W tle: poprzedni zwycięzca — {previousWinnerSong.title}</p>
        ) : null}
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {songs.map((song) => {
          const votes = voteCounts[song.id] ?? 0;
          const percentage = getVotePercentage(votes, totalVotes);

          return (
            <li key={song.id} className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
              <Image
                src={song.thumbnail}
                alt={song.title}
                width={320}
                height={180}
                className="h-auto w-full rounded-md"
              />
              <p className="mt-2 text-sm font-medium">{song.title}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Głosy: <strong>{votes}</strong> ({percentage}%)
              </p>
              <button
                type="button"
                onClick={() => handleVote(song.id)}
                disabled={votedSongId !== null}
                className="mt-3 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
              >
                Głosuj
              </button>
            </li>
          );
        })}
      </ul>

      {votedSong ? (
        <p className="rounded-md bg-emerald-100 p-3 text-sm text-emerald-900">
          Dzięki! Twój głos został zapisany dla: <strong>{votedSong.title}</strong>.
        </p>
      ) : null}
    </section>
  );
}

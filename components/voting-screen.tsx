"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ensureAnonymousAuth } from "@/lib/auth";
import { saveVoteToFirestore, subscribeToRoundVotes } from "@/lib/firestore";
import { Song } from "@/lib/types";

type VoteCountMap = Record<string, number>;

type VotingScreenProps = {
  songs: Song[];
  initialVoteCounts: VoteCountMap;
  previousWinnerSong: Song | null;
  roundId: string;
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

export function VotingScreen({ songs, initialVoteCounts, previousWinnerSong, roundId }: VotingScreenProps) {
  const [votedSongId, setVotedSongId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCountMap>(initialVoteCounts);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  useEffect(() => {
    let unsubscribeVotes: (() => void) | undefined;

    ensureAnonymousAuth()
      .then((user) => {
        unsubscribeVotes = subscribeToRoundVotes(roundId, (votes) => {
          const nextVoteCounts = votes.reduce<VoteCountMap>((voteMap, vote) => {
            voteMap[vote.songId] = (voteMap[vote.songId] ?? 0) + 1;
            return voteMap;
          }, {});

          setVoteCounts(nextVoteCounts);

          const userVote = votes.find((vote) => vote.voterId === user.uid);
          setVotedSongId(userVote?.songId ?? null);
        });
      })
      .catch((error) => {
        console.error("Anonymous auth failed:", error);
      });

    return () => {
      if (unsubscribeVotes) {
        unsubscribeVotes();
      }
    };
  }, [roundId]);

  const votedSong = useMemo(
    () => songs.find((song) => song.id === votedSongId) ?? null,
    [songs, votedSongId],
  );

  const totalVotes = useMemo(() => getTotalVotes(voteCounts), [voteCounts]);

  async function handleVote(songId: string) {
    if (votedSongId !== null || isSubmittingVote) {
      return;
    }

    setIsSubmittingVote(true);

    try {
      const user = await ensureAnonymousAuth();

      await saveVoteToFirestore({
        roundId,
        songId,
        voterId: user.uid,
      });

      setVotedSongId(songId);
      setVoteCounts((currentCounts) => ({
        ...currentCounts,
        [songId]: (currentCounts[songId] ?? 0) + 1,
      }));
    } catch (error) {
      console.error("Vote save failed:", error);
    } finally {
      setIsSubmittingVote(false);
    }
  }

  return (
    <section className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="absolute inset-x-6 top-5 -z-20 h-64 rounded-full bg-fuchsia-500/30 blur-3xl" />
      <div className="absolute inset-x-20 top-28 -z-20 h-56 rounded-full bg-cyan-400/30 blur-3xl" />

      {previousWinnerSong ? (
        <div className="pointer-events-none absolute inset-0 -z-30 overflow-hidden rounded-3xl opacity-20">
          <iframe
            title="Poprzednio wybrany utwór"
            src={`https://www.youtube.com/embed/${previousWinnerSong.youtubeId}?autoplay=1&controls=1&loop=1&playlist=${previousWinnerSong.youtubeId}`}
            className="h-full w-full"
            allow="autoplay; encrypted-media"
          />
        </div>
      ) : null}

      <header className="mb-6 rounded-3xl border border-fuchsia-300/30 bg-[#1c1238]/80 p-5 text-center shadow-[0_0_30px_rgba(236,72,153,0.25)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-fuchsia-200">SzafaGrająca</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">JukeShelf 🎵</h1>
        <p className="mt-2 text-sm text-fuchsia-100">Wybierz utwór, który ma zagrać jako następny.</p>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs">
          <Link href="/" className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-1 text-white">
            Głosowanie
          </Link>
          <Link href="/admin" className="rounded-full border border-cyan-300/40 bg-cyan-500/20 px-3 py-1 text-white">
            Panel admina
          </Link>
        </div>
        {previousWinnerSong ? (
          <p className="mt-3 text-xs text-fuchsia-200">W tle odtwarzany jest utwór: {previousWinnerSong.title}</p>
        ) : null}
      </header>

      <ul className="grid gap-4 sm:grid-cols-3">
        {songs.map((song) => {
          const votes = voteCounts[song.id] ?? 0;
          const percentage = getVotePercentage(votes, totalVotes);

          return (
            <li
              key={song.id}
              className="rounded-2xl border border-cyan-200/20 bg-[#181034]/85 p-3 shadow-[0_0_25px_rgba(34,211,238,0.18)] backdrop-blur"
            >
              <Image
                src={song.thumbnail}
                alt={song.title}
                width={320}
                height={180}
                className="h-auto w-full rounded-lg border border-white/15 bg-black/30"
              />
              <p className="mt-2 text-sm font-semibold text-white">{song.title}</p>

              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${percentage}%` }} />
              </div>
              <p className="mt-1 text-xs text-fuchsia-100">
                Głosy: <strong>{votes}</strong> ({percentage}%)
              </p>

              <button
                type="button"
                onClick={() => handleVote(song.id)}
                disabled={votedSongId !== null || isSubmittingVote}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Głosuj
              </button>
            </li>
          );
        })}
      </ul>

      {votedSong ? (
        <p className="mt-4 rounded-xl border border-emerald-300/40 bg-emerald-500/15 p-3 text-sm text-emerald-100">
          Dzięki! Twój głos został zapisany dla: <strong>{votedSong.title}</strong>.
        </p>
      ) : null}
    </section>
  );
}

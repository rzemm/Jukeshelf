"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ensureAnonymousAuth } from "@/lib/auth";
import { saveVoteToFirestore, subscribeToRoundVotes } from "@/lib/firestore";
import { Song } from "@/lib/types";
import { loadYouTubeApi } from "@/lib/youtube";

type VoteCountMap = Record<string, number>;

type VotingScreenProps = {
  songs: Song[];
  initialVoteCounts: VoteCountMap;
  nowPlayingSong: Song | null;
  nowPlayingStartedAtMs: number | null;
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

export function VotingScreen({ songs, initialVoteCounts, nowPlayingSong, nowPlayingStartedAtMs, roundId }: VotingScreenProps) {
  const [votedSongId, setVotedSongId] = useState<string | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCountMap>(initialVoteCounts);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(false);

  const bgWrapperRef = useRef<HTMLDivElement>(null);
  const bgPlayerRef = useRef<any>(null);

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

  useEffect(() => {
    const cleanup = () => {
      if (bgPlayerRef.current) {
        bgPlayerRef.current.destroy();
        bgPlayerRef.current = null;
      }
      if (bgWrapperRef.current) {
        bgWrapperRef.current.innerHTML = "";
      }
    };

    if (!nowPlayingSong) {
      cleanup();
      return;
    }

    const videoId = nowPlayingSong.youtubeId;
    const startedAtMs = nowPlayingStartedAtMs;
    let isCurrent = true;

    loadYouTubeApi().then(() => {
      if (!isCurrent || !bgWrapperRef.current) return;

      cleanup();

      const container = document.createElement("div");
      bgWrapperRef.current.appendChild(container);

      bgPlayerRef.current = new window.YT.Player(container, {
        videoId,
        playerVars: { autoplay: 1, mute: 1, controls: 0, rel: 0 },
        events: {
          onReady: () => {
            const player = bgPlayerRef.current;
            if (!isCurrent || !player) return;

            if (startedAtMs) {
              const elapsed = (Date.now() - startedAtMs) / 1000;
              const duration = player.getDuration();
              if (duration > 0) {
                player.seekTo(elapsed % duration, true);
              }
            }

            player.playVideo();
          },
          onStateChange: (event: { data: number }) => {
            // 0 = ended — loop manually so it restarts from 0, not from the original offset
            if (event.data === 0 && bgPlayerRef.current) {
              bgPlayerRef.current.seekTo(0, true);
              bgPlayerRef.current.playVideo();
            }
          },
        },
      });
    });

    return () => {
      isCurrent = false;
      cleanup();
    };
  }, [nowPlayingSong?.youtubeId, nowPlayingStartedAtMs]);

  useEffect(() => {
    if (!bgPlayerRef.current) return;
    if (backgroundSoundEnabled) {
      bgPlayerRef.current.unMute();
    } else {
      bgPlayerRef.current.mute();
    }
  }, [backgroundSoundEnabled]);

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

      {/* Hidden background audio player */}
      <div ref={bgWrapperRef} className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" />

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
        {nowPlayingSong ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-fuchsia-200">W tle leci: {nowPlayingSong.title}</p>
            <button
              type="button"
              onClick={() => setBackgroundSoundEnabled((enabled) => !enabled)}
              className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs text-white"
            >
              {backgroundSoundEnabled ? "Wycisz tło" : "Włącz dźwięk w tle"}
            </button>
          </div>
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

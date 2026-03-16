"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  activeRoundSongs,
  activeRoundVotes,
  createEmptyVoteMap,
  createNextRoundSongs,
  getTotalVotes,
  pickRoundWinner,
} from "@/lib/round";
import { createSong, getYoutubeIdFromUrl, songs } from "@/lib/songs";
import { Song } from "@/lib/types";

export default function AdminPage() {
  const [songLibrary, setSongLibrary] = useState<Song[]>(songs);
  const [roundSongs, setRoundSongs] = useState<Song[]>(activeRoundSongs);
  const [voteCounts, setVoteCounts] = useState(activeRoundVotes);
  const [currentPlayingSong, setCurrentPlayingSong] = useState<Song | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [songTitleInput, setSongTitleInput] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const totalVotes = useMemo(() => getTotalVotes(voteCounts), [voteCounts]);

  function handleAddSong() {
    const youtubeId = getYoutubeIdFromUrl(youtubeUrlInput.trim());

    if (!youtubeId) {
      setFormMessage("Nieprawidłowy link YouTube. Wklej pełny URL z YouTube.");
      return;
    }

    const songId = `song-${Date.now()}`;
    const songTitle = songTitleInput.trim() || `Nowy utwór (${youtubeId})`;

    const newSong = createSong(songId, songTitle, youtubeUrlInput.trim());
    setSongLibrary((currentSongs) => [...currentSongs, newSong]);
    setYoutubeUrlInput("");
    setSongTitleInput("");
    setFormMessage("Dodano utwór do biblioteki.");
  }

  function handleStartNextRound() {
    const winnerSong = pickRoundWinner(roundSongs, voteCounts);

    if (!winnerSong) {
      return;
    }

    setCurrentPlayingSong(winnerSong);

    const nextRoundSongs = createNextRoundSongs(songLibrary);
    setRoundSongs(nextRoundSongs);
    setVoteCounts(createEmptyVoteMap(nextRoundSongs));
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-cyan-300/30 bg-[#1c1238]/85 p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Panel sterowania</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Admin — SzafaGrająca</h1>
        <p className="mt-2 text-sm text-cyan-100">Dodawaj piosenki, uruchamiaj zwycięzcę i resetuj głosy co rundę.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/" className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-1 text-xs text-white">
            ← Wróć do głosowania
          </Link>
          <button
            type="button"
            onClick={handleStartNextRound}
            disabled={roundSongs.length === 0}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Uruchom zwycięzcę i zacznij nowe głosowanie
          </button>
        </div>
      </header>

      <section className="rounded-3xl border border-cyan-300/30 bg-[#181034]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Dodaj utwór z YouTube</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={songTitleInput}
            onChange={(event) => setSongTitleInput(event.target.value)}
            placeholder="Tytuł (opcjonalnie)"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-300"
          />
          <input
            value={youtubeUrlInput}
            onChange={(event) => setYoutubeUrlInput(event.target.value)}
            placeholder="Link YouTube"
            className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-300"
          />
        </div>
        <button
          type="button"
          onClick={handleAddSong}
          className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-400"
        >
          Dodaj piosenkę
        </button>
        {formMessage ? <p className="mt-2 text-xs text-cyan-100">{formMessage}</p> : null}

        <p className="mt-4 text-xs text-zinc-300">Liczba piosenek w bibliotece: {songLibrary.length}</p>
      </section>

      {currentPlayingSong ? (
        <section className="rounded-3xl border border-emerald-300/30 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-semibold text-emerald-100">Teraz gra</h2>
          <p className="mt-1 text-sm text-emerald-50">{currentPlayingSong.title}</p>
          <a
            href={currentPlayingSong.youtubeUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-emerald-100 underline"
          >
            Otwórz na YouTube
          </a>
          <div className="mt-3 overflow-hidden rounded-xl border border-emerald-200/30">
            <iframe
              title="Aktualnie odtwarzany utwór"
              src={`https://www.youtube.com/embed/${currentPlayingSong.youtubeId}?autoplay=1&controls=1&rel=0`}
              className="aspect-video w-full"
              allow="autoplay; encrypted-media"
            />
          </div>
          <p className="mt-2 text-xs text-emerald-200">W przypadku remisu zwycięzca jest losowany spośród liderów. Głosy resetują się co piosenkę.</p>
        </section>
      ) : null}

      <section className="rounded-3xl border border-fuchsia-300/30 bg-[#181034]/85 p-5 shadow-[0_0_28px_rgba(236,72,153,0.2)]">
        <h2 className="text-lg font-semibold text-white">Aktywna runda — liczba głosów</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {roundSongs.map((song) => {
            const votes = voteCounts[song.id] ?? 0;
            const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            return (
              <li key={song.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-zinc-100">{song.title}</span>
                  <strong className="text-fuchsia-200">{votes} głosów</strong>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${percentage}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-sm text-cyan-100">
          Łącznie oddanych głosów w tej rundzie: <strong className="text-white">{totalVotes}</strong>
        </p>
      </section>
    </main>
  );
}

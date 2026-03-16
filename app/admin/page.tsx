"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addSongToPlaylist,
  createPlaylist,
  endVotingAndPlayWinner,
  fetchPlaylistSongs,
  fetchPlaylists,
  getActiveRound,
  startRoundFromPlaylist,
  subscribeToNowPlayingSong,
  subscribeToRoundVotes,
  subscribeToVotingRound,
} from "@/lib/firestore";
import { createSong, getYoutubeIdFromUrl } from "@/lib/songs";
import { Playlist, Song, Vote } from "@/lib/types";

import { loadYouTubeApi } from "@/lib/youtube";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdminPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistNameInput, setPlaylistNameInput] = useState("");
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [songTitleInput, setSongTitleInput] = useState("");
  const [votingLink, setVotingLink] = useState<string | null>(null);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const [nowPlayingSong, setNowPlayingSong] = useState<Song | null>(null);
  const [roundSongs, setRoundSongs] = useState<Song[]>([]);
  const [roundVotes, setRoundVotes] = useState<Vote[]>([]);
  const [playerEnabled, setPlayerEnabled] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const activePlayerRef = useRef<any>(null);
  const activeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedPlaylist = useMemo(
    () => playlists.find((playlist) => playlist.id === selectedPlaylistId) ?? null,
    [playlists, selectedPlaylistId],
  );

  useEffect(() => {
    fetchPlaylists()
      .then((loadedPlaylists) => {
        setPlaylists(loadedPlaylists);
        if (loadedPlaylists.length > 0) {
          setSelectedPlaylistId((currentSelectedId) => currentSelectedId || loadedPlaylists[0].id);
        }
      })
      .catch((error) => {
        console.error("Playlists fetch failed:", error);
        setFormMessage("Nie udało się pobrać playlist.");
      });

    getActiveRound()
      .then((round) => {
        if (round?.isActive) {
          setActiveRoundId(round.id);
          setVotingLink(`${window.location.origin}/?round=${round.id}`);
        }
      })
      .catch((error) => {
        console.error("Active round fetch failed:", error);
      });
  }, []);

  useEffect(() => {
    return subscribeToNowPlayingSong(setNowPlayingSong);
  }, []);

  useEffect(() => {
    if (!activeRoundId) {
      setRoundSongs([]);
      return;
    }
    return subscribeToVotingRound(activeRoundId, (round) => {
      setRoundSongs(round?.songs ?? []);
    });
  }, [activeRoundId]);

  useEffect(() => {
    if (!activeRoundId) {
      setRoundVotes([]);
      return;
    }
    return subscribeToRoundVotes(activeRoundId, setRoundVotes);
  }, [activeRoundId]);

  useEffect(() => {
    if (!selectedPlaylistId) return;
    fetchPlaylistSongs(selectedPlaylistId)
      .then(setPlaylistSongs)
      .catch((error) => {
        console.error("Playlist songs fetch failed:", error);
        setFormMessage("Nie udało się pobrać utworów playlisty.");
      });
  }, [selectedPlaylistId]);

  useEffect(() => {
    const cleanup = () => {
      if (activeTimerRef.current) {
        clearInterval(activeTimerRef.current);
        activeTimerRef.current = null;
      }
      if (activePlayerRef.current) {
        activePlayerRef.current.destroy();
        activePlayerRef.current = null;
      }
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
      setTimeRemaining(null);
    };

    if (!playerEnabled || !nowPlayingSong) {
      cleanup();
      return;
    }

    const videoId = nowPlayingSong.youtubeId;
    let isCurrent = true;

    loadYouTubeApi().then(() => {
      if (!isCurrent || !wrapperRef.current) return;

      cleanup();

      const container = document.createElement("div");
      wrapperRef.current.appendChild(container);

      const player = new window.YT.Player(container, {
        videoId,
        playerVars: { autoplay: 1, controls: 1, rel: 0 },
        events: {
          onReady: () => {
            if (!isCurrent) return;
            activeTimerRef.current = setInterval(() => {
              const duration = player.getDuration();
              const current = player.getCurrentTime();
              if (duration > 0) {
                setTimeRemaining(Math.max(0, Math.round(duration - current)));
              }
            }, 1000);
          },
        },
      });

      activePlayerRef.current = player;
    });

    return () => {
      isCurrent = false;
      cleanup();
    };
  }, [playerEnabled, nowPlayingSong?.youtubeId]);

  async function handleCreatePlaylist() {
    const playlistName = playlistNameInput.trim();
    if (!playlistName) {
      setFormMessage("Podaj nazwę playlisty.");
      return;
    }
    try {
      const playlistId = await createPlaylist(playlistName);
      const nextPlaylist: Playlist = { id: playlistId, name: playlistName };
      setPlaylists((current) => [...current, nextPlaylist]);
      setSelectedPlaylistId(playlistId);
      setPlaylistNameInput("");
      setFormMessage("Utworzono nową playlistę.");
    } catch (error) {
      console.error("Playlist create failed:", error);
      setFormMessage("Nie udało się utworzyć playlisty.");
    }
  }

  async function handleAddSong() {
    if (!selectedPlaylistId) {
      setFormMessage("Najpierw utwórz lub wybierz playlistę.");
      return;
    }
    const youtubeId = getYoutubeIdFromUrl(youtubeUrlInput.trim());
    if (!youtubeId) {
      setFormMessage("Nieprawidłowy link YouTube. Wklej pełny URL z YouTube.");
      return;
    }
    const songId = `song-${Date.now()}`;
    const songTitle = songTitleInput.trim() || `Nowy utwór (${youtubeId})`;
    const newSong = createSong(songId, songTitle, youtubeUrlInput.trim());
    try {
      await addSongToPlaylist(selectedPlaylistId, newSong);
      setPlaylistSongs((current) => [...current, newSong]);
      setYoutubeUrlInput("");
      setSongTitleInput("");
      setFormMessage("Dodano utwór do playlisty i zapisano w bazie.");
    } catch (error) {
      console.error("Song save failed:", error);
      setFormMessage("Nie udało się zapisać utworu do bazy.");
    }
  }

  async function handleStartRound() {
    if (!selectedPlaylistId) {
      setFormMessage("Wybierz playlistę, aby rozpocząć głosowanie.");
      return;
    }
    try {
      const round = await startRoundFromPlaylist(selectedPlaylistId);
      const nextVotingLink = `${window.location.origin}/?round=${round.id}`;
      setActiveRoundId(round.id);
      setVotingLink(nextVotingLink);
      setFormMessage("Rozpoczęto rundę głosowania. Link jest gotowy.");
    } catch (error) {
      console.error("Start round failed:", error);
      setFormMessage("Ta playlista musi mieć minimum 3 utwory, aby rozpocząć.");
    }
  }

  async function handleEndVoting() {
    if (!activeRoundId) {
      setFormMessage("Brak aktywnej rundy do zakończenia.");
      return;
    }
    try {
      const winnerSong = await endVotingAndPlayWinner(activeRoundId);
      setActiveRoundId(null);
      setVotingLink(null);
      setFormMessage(`Zakończono głosowanie. Teraz gra: ${winnerSong.title}`);
    } catch (error) {
      console.error("End voting failed:", error);
      setFormMessage("Nie udało się zakończyć głosowania.");
    }
  }

  const voteCounts = useMemo(
    () =>
      roundVotes.reduce<Record<string, number>>((acc, vote) => {
        acc[vote.songId] = (acc[vote.songId] ?? 0) + 1;
        return acc;
      }, {}),
    [roundVotes],
  );

  const totalVotes = roundVotes.length;

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-cyan-300/30 bg-[#1c1238]/85 p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Panel sterowania</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Admin — SzafaGrająca</h1>
        <p className="mt-2 text-sm text-cyan-100">Twórz playlisty i uruchamiaj głosowanie z wybranych utworów.</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href="/" className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-1 text-xs text-white">
            ← Wróć do głosowania
          </Link>
          <button
            type="button"
            onClick={handleStartRound}
            disabled={!selectedPlaylistId}
            className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Rozpocznij
          </button>
          <button
            type="button"
            onClick={handleEndVoting}
            disabled={!activeRoundId}
            className="rounded-full border border-emerald-300/40 bg-emerald-500/20 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            Zakończ głosowanie i puść nową piosenkę
          </button>
        </div>

        {nowPlayingSong ? (
          <p className="mt-3 text-xs text-emerald-100">Teraz gra: {nowPlayingSong.title}</p>
        ) : null}

        {votingLink ? (
          <div className="mt-4 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            <p className="font-semibold">Link do panelu głosowania:</p>
            <a href={votingLink} className="mt-1 block break-all underline" target="_blank" rel="noreferrer">
              {votingLink}
            </a>
          </div>
        ) : null}
      </header>

      {nowPlayingSong ? (
        <section className="rounded-3xl border border-emerald-300/30 bg-[#181034]/85 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Teraz gra</h2>
              <p className="mt-1 text-sm text-emerald-100">{nowPlayingSong.title}</p>
              {timeRemaining !== null ? (
                <p className="mt-1 text-xs text-zinc-300">
                  Pozostało:{" "}
                  <strong className={timeRemaining < 60 ? "text-red-400" : "text-white"}>
                    {formatTime(timeRemaining)}
                  </strong>
                </p>
              ) : playerEnabled ? (
                <p className="mt-1 text-xs text-zinc-400">Ładowanie odtwarzacza…</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setPlayerEnabled((v) => !v)}
              className="shrink-0 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1 text-xs text-white transition hover:brightness-110"
            >
              {playerEnabled ? "Wyłącz odtwarzacz" : "Włącz odtwarzacz"}
            </button>
          </div>

          <div
            ref={wrapperRef}
            className={`mt-4 w-full overflow-hidden rounded-xl ${playerEnabled ? "aspect-video" : "hidden"}`}
          />
        </section>
      ) : null}

      {activeRoundId && roundSongs.length > 0 ? (
        <section className="rounded-3xl border border-fuchsia-300/30 bg-[#181034]/85 p-5">
          <h2 className="text-lg font-semibold text-white">Bieżące głosowanie</h2>
          <p className="mt-1 text-xs text-zinc-400">Łącznie głosów: {totalVotes}</p>
          <ul className="mt-4 space-y-3">
            {roundSongs.map((song) => {
              const votes = voteCounts[song.id] ?? 0;
              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
              return (
                <li key={song.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white">{song.title}</span>
                    <span className="text-fuchsia-200">
                      {votes} głos{votes === 1 ? "" : votes >= 2 && votes <= 4 ? "y" : "ów"} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-cyan-300/30 bg-[#181034]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Utwórz nową playlistę</h2>
        <div className="mt-3 flex gap-3">
          <input
            value={playlistNameInput}
            onChange={(event) => setPlaylistNameInput(event.target.value)}
            placeholder="Nazwa playlisty"
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-300"
          />
          <button
            type="button"
            onClick={handleCreatePlaylist}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-400"
          >
            Utwórz
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-cyan-300/30 bg-[#181034]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Wybrana playlista</h2>
        <select
          value={selectedPlaylistId}
          onChange={(event) => setSelectedPlaylistId(event.target.value)}
          className="mt-3 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white"
        >
          <option value="">Wybierz playlistę</option>
          {playlists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.name}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-3xl border border-cyan-300/30 bg-[#181034]/85 p-5">
        <h2 className="text-lg font-semibold text-white">Dodaj utwór do playlisty</h2>
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

        <p className="mt-4 text-xs text-zinc-300">
          Utwory w playliście {selectedPlaylist ? <strong>{selectedPlaylist.name}</strong> : ""}: {playlistSongs.length}
        </p>

        {playlistSongs.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-zinc-100">
            {playlistSongs.map((song) => (
              <li key={song.id} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                {song.title}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

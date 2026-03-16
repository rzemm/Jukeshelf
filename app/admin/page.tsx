"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addSongToPlaylist, createPlaylist, fetchPlaylistSongs, fetchPlaylists, startRoundFromPlaylist } from "@/lib/firestore";
import { createSong, getYoutubeIdFromUrl } from "@/lib/songs";
import { Playlist, Song } from "@/lib/types";

export default function AdminPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [playlistNameInput, setPlaylistNameInput] = useState("");
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [songTitleInput, setSongTitleInput] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);

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
  }, []);

  useEffect(() => {
    if (!selectedPlaylistId) {
      return;
    }

    fetchPlaylistSongs(selectedPlaylistId)
      .then((songs) => {
        setPlaylistSongs(songs);
      })
      .catch((error) => {
        console.error("Playlist songs fetch failed:", error);
        setFormMessage("Nie udało się pobrać utworów playlisty.");
      });
  }, [selectedPlaylistId]);

  async function handleCreatePlaylist() {
    const playlistName = playlistNameInput.trim();

    if (!playlistName) {
      setFormMessage("Podaj nazwę playlisty.");
      return;
    }

    try {
      const playlistId = await createPlaylist(playlistName);
      const nextPlaylist: Playlist = {
        id: playlistId,
        name: playlistName,
      };

      setPlaylists((currentPlaylists) => [...currentPlaylists, nextPlaylist]);
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
      setPlaylistSongs((currentSongs) => [...currentSongs, newSong]);
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
      await startRoundFromPlaylist(selectedPlaylistId);
      setFormMessage("Rozpoczęto rundę głosowania na stronie głównej.");
    } catch (error) {
      console.error("Start round failed:", error);
      setFormMessage("Ta playlista musi mieć minimum 3 utwory, aby rozpocząć.");
    }
  }

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
        </div>
      </header>

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
      </section>
    </main>
  );
}

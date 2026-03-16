import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ActiveRound, Playlist, Song, Vote } from "@/lib/types";

const PLAYLISTS_COLLECTION = "playlists";
const VOTES_COLLECTION = "votes";
const ACTIVE_ROUNDS_COLLECTION = "activeRounds";
const ACTIVE_ROUND_DOC_ID = "current";

function normalizeSong(id: string, data: Partial<Song>): Song | null {
  if (!data.youtubeUrl || !data.youtubeId || !data.title || !data.thumbnail) {
    return null;
  }

  return {
    id,
    youtubeUrl: data.youtubeUrl,
    youtubeId: data.youtubeId,
    title: data.title,
    thumbnail: data.thumbnail,
  };
}

function normalizePlaylist(id: string, data: Partial<Playlist>): Playlist | null {
  if (!data.name) {
    return null;
  }

  return {
    id,
    name: data.name,
  };
}

function drawRandomSongs(list: Song[], count: number): Song[] {
  const randomized = [...list].sort(() => Math.random() - 0.5);
  return randomized.slice(0, count);
}

export async function createPlaylist(name: string) {
  const playlistId = `playlist-${Date.now()}`;

  await setDoc(doc(db, PLAYLISTS_COLLECTION, playlistId), {
    name,
    createdAt: serverTimestamp(),
  });

  return playlistId;
}

export async function fetchPlaylists() {
  const snapshot = await getDocs(collection(db, PLAYLISTS_COLLECTION));

  return snapshot.docs
    .map((playlistDoc) => normalizePlaylist(playlistDoc.id, playlistDoc.data() as Partial<Playlist>))
    .filter((playlist): playlist is Playlist => playlist !== null);
}

export async function addSongToPlaylist(playlistId: string, song: Song) {
  await setDoc(doc(db, PLAYLISTS_COLLECTION, playlistId, "songs", song.id), {
    ...song,
    createdAt: serverTimestamp(),
  });
}

export async function fetchPlaylistSongs(playlistId: string) {
  const snapshot = await getDocs(collection(db, PLAYLISTS_COLLECTION, playlistId, "songs"));

  return snapshot.docs
    .map((songDoc) => normalizeSong(songDoc.id, songDoc.data() as Partial<Song>))
    .filter((song): song is Song => song !== null);
}

export async function startRoundFromPlaylist(playlistId: string) {
  const playlistSongs = await fetchPlaylistSongs(playlistId);

  if (playlistSongs.length < 3) {
    throw new Error("Playlist must contain at least 3 songs to start voting.");
  }

  const selectedSongs = drawRandomSongs(playlistSongs, 3);
  const roundId = `round-${Date.now()}`;

  await setDoc(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID), {
    id: roundId,
    playlistId,
    songIds: selectedSongs.map((song) => song.id),
    songs: selectedSongs,
    isActive: true,
    startedAt: serverTimestamp(),
  });

  return {
    id: roundId,
    playlistId,
    songIds: selectedSongs.map((song) => song.id),
    songs: selectedSongs,
    isActive: true,
  } satisfies ActiveRound;
}

export function subscribeToActiveRound(onRoundChange: (round: ActiveRound | null) => void) {
  return onSnapshot(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID), (snapshot) => {
    if (!snapshot.exists()) {
      onRoundChange(null);
      return;
    }

    const data = snapshot.data();
    const songsData = Array.isArray(data.songs) ? data.songs : [];
    const songs = songsData
      .map((song, index) => normalizeSong(`song-${index}`, song as Partial<Song>))
      .filter((song): song is Song => song !== null);

    const round: ActiveRound = {
      id: typeof data.id === "string" ? data.id : ACTIVE_ROUND_DOC_ID,
      playlistId: typeof data.playlistId === "string" ? data.playlistId : "",
      songIds: Array.isArray(data.songIds) ? (data.songIds as string[]) : songs.map((song) => song.id),
      songs,
      isActive: Boolean(data.isActive),
    };

    onRoundChange(round);
  });
}

export async function getActiveRound() {
  const snapshot = await getDoc(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();
  const songsData = Array.isArray(data.songs) ? data.songs : [];
  const songs = songsData
    .map((song, index) => normalizeSong(`song-${index}`, song as Partial<Song>))
    .filter((song): song is Song => song !== null);

  return {
    id: typeof data.id === "string" ? data.id : ACTIVE_ROUND_DOC_ID,
    playlistId: typeof data.playlistId === "string" ? data.playlistId : "",
    songIds: Array.isArray(data.songIds) ? (data.songIds as string[]) : songs.map((song) => song.id),
    songs,
    isActive: Boolean(data.isActive),
  } satisfies ActiveRound;
}

export async function saveVoteToFirestore(vote: Vote) {
  const voteDocId = `${vote.roundId}_${vote.voterId}`;

  await setDoc(
    doc(db, VOTES_COLLECTION, voteDocId),
    {
      ...vote,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeToRoundVotes(roundId: string, onVotes: (votes: Vote[]) => void) {
  const votesQuery = query(collection(db, VOTES_COLLECTION), where("roundId", "==", roundId));

  return onSnapshot(votesQuery, (snapshot) => {
    const votes = snapshot.docs.map((voteDoc) => voteDoc.data() as Vote);
    onVotes(votes);
  });
}

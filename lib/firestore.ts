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
const VOTING_ROUNDS_COLLECTION = "votingRounds";

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

function normalizeSongOrNull(data: unknown): Song | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  return normalizeSong("now-playing", data as Partial<Song>);
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

function mapRoundData(roundId: string, data: Record<string, unknown>): ActiveRound {
  const songsData = Array.isArray(data.songs) ? data.songs : [];
  const songs = songsData
    .map((song, index) => normalizeSong(`song-${index}`, song as Partial<Song>))
    .filter((song): song is Song => song !== null);

  return {
    id: typeof data.id === "string" ? data.id : roundId,
    playlistId: typeof data.playlistId === "string" ? data.playlistId : "",
    songIds: Array.isArray(data.songIds) ? (data.songIds as string[]) : songs.map((song) => song.id),
    songs,
    isActive: Boolean(data.isActive),
  };
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

  await setDoc(doc(db, VOTING_ROUNDS_COLLECTION, roundId), {
    id: roundId,
    playlistId,
    songIds: selectedSongs.map((song) => song.id),
    songs: selectedSongs,
    isActive: true,
    startedAt: serverTimestamp(),
  });

  const activeSnapshot = await getDoc(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID));
  const hasNowPlaying = activeSnapshot.exists() && activeSnapshot.data().nowPlayingSong;

  if (hasNowPlaying) {
    await setDoc(
      doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID),
      { roundId, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } else {
    const nonVotingSongs = playlistSongs.filter((s) => !selectedSongs.find((vs) => vs.id === s.id));
    const autoSong = nonVotingSongs.length > 0
      ? nonVotingSongs[Math.floor(Math.random() * nonVotingSongs.length)]
      : selectedSongs[0];

    await setDoc(
      doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID),
      {
        roundId,
        nowPlayingSong: autoSong,
        nowPlayingStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  return {
    id: roundId,
    playlistId,
    songIds: selectedSongs.map((song) => song.id),
    songs: selectedSongs,
    isActive: true,
  } satisfies ActiveRound;
}

export function subscribeToVotingRound(roundId: string, onRoundChange: (round: ActiveRound | null) => void) {
  return onSnapshot(doc(db, VOTING_ROUNDS_COLLECTION, roundId), (snapshot) => {
    if (!snapshot.exists()) {
      onRoundChange(null);
      return;
    }

    onRoundChange(mapRoundData(roundId, snapshot.data()));
  });
}

export function subscribeToActiveRound(onRoundChange: (round: ActiveRound | null) => void) {
  return onSnapshot(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID), (snapshot) => {
    if (!snapshot.exists()) {
      onRoundChange(null);
      return;
    }

    const data = snapshot.data();
    const roundId = typeof data.roundId === "string" ? data.roundId : null;

    if (!roundId) {
      onRoundChange(null);
      return;
    }

    getDoc(doc(db, VOTING_ROUNDS_COLLECTION, roundId)).then((roundSnapshot) => {
      if (!roundSnapshot.exists()) {
        onRoundChange(null);
        return;
      }

      onRoundChange(mapRoundData(roundId, roundSnapshot.data()));
    });
  });
}

export async function getActiveRound() {
  const activeSnapshot = await getDoc(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID));

  if (!activeSnapshot.exists()) {
    return null;
  }

  const activeData = activeSnapshot.data();
  const roundId = typeof activeData.roundId === "string" ? activeData.roundId : null;

  if (!roundId) {
    return null;
  }

  const roundSnapshot = await getDoc(doc(db, VOTING_ROUNDS_COLLECTION, roundId));

  if (!roundSnapshot.exists()) {
    return null;
  }

  return mapRoundData(roundId, roundSnapshot.data());
}


export async function endVotingAndPlayWinner(roundId: string) {
  const roundSnapshot = await getDoc(doc(db, VOTING_ROUNDS_COLLECTION, roundId));

  if (!roundSnapshot.exists()) {
    throw new Error("Round not found.");
  }

  const round = mapRoundData(roundId, roundSnapshot.data());

  if (round.songs.length === 0) {
    throw new Error("Round has no songs.");
  }

  const votesSnapshot = await getDocs(query(collection(db, VOTES_COLLECTION), where("roundId", "==", roundId)));

  const voteCountMap = votesSnapshot.docs.reduce<Record<string, number>>((acc, voteDoc) => {
    const vote = voteDoc.data() as Vote;
    acc[vote.songId] = (acc[vote.songId] ?? 0) + 1;
    return acc;
  }, {});

  const highestVoteCount = Math.max(...round.songs.map((song) => voteCountMap[song.id] ?? 0));
  const leaders = round.songs.filter((song) => (voteCountMap[song.id] ?? 0) === highestVoteCount);
  const winner = leaders[Math.floor(Math.random() * leaders.length)] ?? round.songs[0];

  await setDoc(
    doc(db, VOTING_ROUNDS_COLLECTION, roundId),
    {
      isActive: false,
      endedAt: serverTimestamp(),
      winnerSongId: winner.id,
    },
    { merge: true },
  );

  await setDoc(
    doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID),
    {
      roundId: null,
      nowPlayingSong: winner,
      nowPlayingStartedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return winner;
}

export function subscribeToNowPlayingSong(onSongChange: (song: Song | null) => void) {
  return onSnapshot(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID), (snapshot) => {
    if (!snapshot.exists()) {
      onSongChange(null);
      return;
    }

    const data = snapshot.data();
    onSongChange(normalizeSongOrNull(data.nowPlayingSong));
  });
}

export function subscribeToNowPlaying(
  onChange: (song: Song | null, startedAtMs: number | null) => void,
) {
  return onSnapshot(doc(db, ACTIVE_ROUNDS_COLLECTION, ACTIVE_ROUND_DOC_ID), (snapshot) => {
    if (!snapshot.exists()) {
      onChange(null, null);
      return;
    }

    const data = snapshot.data();
    const song = normalizeSongOrNull(data.nowPlayingSong);
    const startedAtMs = data.nowPlayingStartedAt?.toMillis?.() ?? null;
    onChange(song, startedAtMs);
  });
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

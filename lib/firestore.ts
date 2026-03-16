import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Song, Vote } from "@/lib/types";

const SONGS_COLLECTION = "songs";
const VOTES_COLLECTION = "votes";

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

export async function addSongToFirestore(song: Song) {
  await setDoc(doc(db, SONGS_COLLECTION, song.id), {
    ...song,
    createdAt: serverTimestamp(),
  });
}

export async function fetchSongsFromFirestore() {
  const snapshot = await getDocs(collection(db, SONGS_COLLECTION));

  return snapshot.docs
    .map((songDoc) => normalizeSong(songDoc.id, songDoc.data() as Partial<Song>))
    .filter((song): song is Song => song !== null);
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

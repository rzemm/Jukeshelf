import { drawRandomSongs, songs } from "./songs";
import { Song } from "./types";

export type VoteCountMap = Record<string, number>;

export const activeRoundSongIds = ["song-1", "song-3", "song-4"];

export const previousWinnerSongId = "song-2";

export const activeRoundVotes: VoteCountMap = {
  "song-1": 5,
  "song-3": 3,
  "song-4": 2,
};

function getSongsByIds(songIds: string[]): Song[] {
  return songIds
    .map((songId) => songs.find((song) => song.id === songId) ?? null)
    .filter((song): song is Song => song !== null);
}

export const activeRoundSongs = getSongsByIds(activeRoundSongIds);

export const previousWinnerSong = songs.find((song) => song.id === previousWinnerSongId) ?? null;

export function getTotalVotes(voteCountMap: VoteCountMap): number {
  return Object.values(voteCountMap).reduce((sum, votes) => sum + votes, 0);
}

export function createEmptyVoteMap(roundSongs: Song[]): VoteCountMap {
  return roundSongs.reduce<VoteCountMap>((voteMap, song) => {
    voteMap[song.id] = 0;
    return voteMap;
  }, {});
}

export function pickRoundWinner(roundSongs: Song[], voteCountMap: VoteCountMap): Song | null {
  if (roundSongs.length === 0) {
    return null;
  }

  const highestVoteCount = Math.max(...roundSongs.map((song) => voteCountMap[song.id] ?? 0));
  const leaderSongs = roundSongs.filter((song) => (voteCountMap[song.id] ?? 0) === highestVoteCount);

  if (leaderSongs.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * leaderSongs.length);
  return leaderSongs[randomIndex];
}

export function createNextRoundSongs(songLibrary: Song[]): Song[] {
  return drawRandomSongs(songLibrary, 3);
}

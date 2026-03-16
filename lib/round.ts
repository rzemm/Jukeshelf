import { songs } from "./songs";
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

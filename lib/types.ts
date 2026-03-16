export type Song = {
  id: string;
  youtubeUrl: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
};

export type Playlist = {
  id: string;
  name: string;
};

export type ActiveRound = {
  id: string;
  playlistId: string;
  songIds: string[];
  songs: Song[];
  isActive: boolean;
};

export type VotingRound = {
  id: string;
  songIds: string[];
  isActive: boolean;
  startedAt: string | null;
  endedAt: string | null;
  winnerSongId: string | null;
};

export type Vote = {
  roundId: string;
  songId: string;
  voterId: string;
};

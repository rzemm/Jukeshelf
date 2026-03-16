import { Song } from "./types";

const PLACEHOLDER_THUMBNAIL = "/window.svg";

export function getYoutubeIdFromUrl(youtubeUrl: string): string | null {
  try {
    const url = new URL(youtubeUrl);

    if (url.hostname === "youtu.be") {
      return url.pathname.replace("/", "");
    }

    if (url.hostname.includes("youtube.com")) {
      return url.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

export function createSong(id: string, title: string, youtubeUrl: string): Song {
  const youtubeId = getYoutubeIdFromUrl(youtubeUrl) ?? id;

  return {
    id,
    title,
    youtubeUrl,
    youtubeId,
    thumbnail: PLACEHOLDER_THUMBNAIL,
  };
}

export const songs: Song[] = [
  createSong("song-1", "Daft Punk - One More Time", "https://www.youtube.com/watch?v=FGBhQbmPwH8"),
  createSong("song-2", "AC/DC - Thunderstruck", "https://www.youtube.com/watch?v=v2AC41dglnM"),
  createSong("song-3", "Queen - Don’t Stop Me Now", "https://www.youtube.com/watch?v=HgzGwKwLmgM"),
  createSong("song-4", "The Weeknd - Blinding Lights", "https://www.youtube.com/watch?v=4NRXx6U8ABQ"),
  createSong("song-5", "Dua Lipa - Houdini", "https://www.youtube.com/watch?v=suAR1PYFNYA"),
];

export function drawRandomSongs(list: Song[], count: number): Song[] {
  const randomized = [...list].sort(() => Math.random() - 0.5);
  return randomized.slice(0, count);
}

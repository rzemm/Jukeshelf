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

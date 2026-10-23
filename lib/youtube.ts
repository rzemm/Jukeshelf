export interface YouTubePlayer {
  destroy(): void;
  getDuration(): number;
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  mute(): void;
  unMute(): void;
}

interface YouTubeApi {
  Player: new (element: HTMLElement, options: {
    videoId: string;
    playerVars: Record<string, number>;
    events: { onReady?: () => void; onStateChange?: (event: { data: number }) => void };
  }) => YouTubePlayer;
}

declare global {
  interface Window {
    YT: YouTubeApi;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

export function loadYouTubeApi(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (typeof window !== "undefined" && window.YT?.Player) {
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = resolve;
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

import { VotingScreen } from "@/components/voting-screen";
import { drawRandomSongs, songs } from "@/lib/songs";

export default function Home() {
  const activeSongs = drawRandomSongs(songs, 3);

  return (
    <main>
      <VotingScreen songs={activeSongs} />
    </main>
  );
}

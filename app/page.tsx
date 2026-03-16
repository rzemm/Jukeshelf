import { VotingScreen } from "@/components/voting-screen";
import { activeRoundSongs, activeRoundVotes, previousWinnerSong } from "@/lib/round";

export default function Home() {
  const activeSongs = drawRandomSongs(songs, 3);

  return (
    <main>
      <VotingScreen songs={activeRoundSongs} initialVoteCounts={activeRoundVotes} previousWinnerSong={previousWinnerSong} />
    </main>
  );
}

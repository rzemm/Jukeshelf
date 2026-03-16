import { VotingScreen } from "@/components/voting-screen";
import { activeRoundSongs, activeRoundVotes, previousWinnerSong } from "@/lib/round";

export default function Home() {
  return (
    <main>
      <VotingScreen songs={activeRoundSongs} initialVoteCounts={activeRoundVotes} previousWinnerSong={previousWinnerSong} />
    </main>
  );
}

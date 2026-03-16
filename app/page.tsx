import { VotingScreen } from "@/components/voting-screen";
import { activeRoundSongs, activeRoundVotes, previousWinnerSong } from "@/lib/round";
import { songs } from "@/lib/songs";

export default function Home() {
  const songsForVoting = activeRoundSongs.length > 0 ? activeRoundSongs : songs.slice(0, 3);

  return (
    <main>
      <VotingScreen
        songs={songsForVoting}
        initialVoteCounts={activeRoundVotes}
        previousWinnerSong={previousWinnerSong}
        roundId="round-1"
      />
    </main>
  );
}

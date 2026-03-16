import { VotingScreen } from "@/components/voting-screen";
import { activeRoundSongs, activeRoundVotes, previousWinnerSong } from "@/lib/round";
import { drawRandomSongs, songs } from "@/lib/songs";

export default function Home() {
  const songsForVoting = activeRoundSongs.length > 0 ? activeRoundSongs : drawRandomSongs(songs, 3);

  return (
    <main>
      <VotingScreen
        songs={songsForVoting}
        initialVoteCounts={activeRoundVotes}
        previousWinnerSong={previousWinnerSong}
      />
    </main>
  );
}

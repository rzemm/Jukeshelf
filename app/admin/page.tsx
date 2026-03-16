import { activeRoundSongs, activeRoundVotes, getTotalVotes } from "@/lib/round";

export default function AdminPage() {
  const totalVotes = getTotalVotes(activeRoundVotes);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">Panel admina</h1>
        <p className="text-sm text-zinc-600">MVP: podgląd aktywnej rundy i aktualnej liczby głosów.</p>
      </header>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">Aktywna runda — liczba głosów</h2>
        <ul className="space-y-2 text-sm">
          {activeRoundSongs.map((song) => {
            const votes = activeRoundVotes[song.id] ?? 0;

            return (
              <li key={song.id} className="flex items-center justify-between rounded-md bg-zinc-100 px-3 py-2">
                <span>{song.title}</span>
                <strong>{votes} głosów</strong>
              </li>
            );
          })}
        </ul>

        <p className="text-sm text-zinc-600">
          Łącznie oddanych głosów w tej rundzie: <strong>{totalVotes}</strong>
        </p>
      </section>
    </main>
  );
}

import Link from "next/link";
import { activeRoundSongs, activeRoundVotes, getTotalVotes } from "@/lib/round";

export default function AdminPage() {
  const totalVotes = getTotalVotes(activeRoundVotes);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-cyan-300/30 bg-[#1c1238]/85 p-6 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">Panel sterowania</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Admin — SzafaGrająca</h1>
        <p className="mt-2 text-sm text-cyan-100">Podgląd aktywnej rundy i aktualnej liczby głosów.</p>
        <div className="mt-4">
          <Link href="/" className="rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 px-3 py-1 text-xs text-white">
            ← Wróć do głosowania
          </Link>
        </div>
      </header>

      <section className="rounded-3xl border border-fuchsia-300/30 bg-[#181034]/85 p-5 shadow-[0_0_28px_rgba(236,72,153,0.2)]">
        <h2 className="text-lg font-semibold text-white">Aktywna runda — liczba głosów</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {activeRoundSongs.map((song) => {
            const votes = activeRoundVotes[song.id] ?? 0;
            const percentage = totalVotes === 0 ? 0 : Math.round((votes / totalVotes) * 100);

            return (
              <li key={song.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-zinc-100">{song.title}</span>
                  <strong className="text-fuchsia-200">{votes} głosów</strong>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${percentage}%` }} />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-sm text-cyan-100">
          Łącznie oddanych głosów w tej rundzie: <strong className="text-white">{totalVotes}</strong>
        </p>
      </section>
    </main>
  );
}

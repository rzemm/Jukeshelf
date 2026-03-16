import { drawRandomSongs, songs } from "@/lib/songs";

export default function AdminPage() {
  const roundSongs = drawRandomSongs(songs, 3);

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-bold">Panel admina</h1>
        <p className="text-sm text-zinc-600">Pierwszy krok MVP: podstawowy podgląd listy i losowania.</p>
      </header>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">Lista piosenek</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {songs.map((song) => (
            <li key={song.id}>{song.title}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-xl border border-zinc-200 p-4">
        <h2 className="text-lg font-semibold">Wylosowane 3 piosenki (podgląd)</h2>
        <ul className="list-decimal space-y-1 pl-5 text-sm">
          {roundSongs.map((song) => (
            <li key={song.id}>{song.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

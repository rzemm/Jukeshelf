# Plan MVP — JukeShelf

## 1) Ocena obecnej struktury

Stan początkowy repo był bardzo dobry na start (czysty Next.js App Router), ale brakowało:
- rozdzielenia logiki domenowej od widoków,
- osobnego widoku `/admin`,
- wspólnych typów danych pod MVP.

## 2) Najprostsze MVP

MVP bez logowania i bez backendu realtime:
- admin widzi listę piosenek,
- admin widzi podgląd losowania 3 utworów,
- użytkownik widzi 3 utwory i może oddać jeden głos w interfejsie,
- po głosie użytkownik widzi potwierdzenie.

Na tym etapie dane są mockowane w kodzie, aby szybko domknąć przepływ UI.

## 3) Proponowana struktura folderów

```text
app/
  page.tsx                # widok użytkownika (/)
  admin/
    page.tsx              # panel admina (/admin)
components/
  voting-screen.tsx       # UI głosowania (client component)
lib/
  types.ts                # typy domenowe
  songs.ts                # mock danych + pomocnicze funkcje
docs/
  mvp-plan.md             # opis decyzji MVP
```

## 4) Pierwszy krok implementacji

Wykonany pierwszy krok:
1. dodane typy domenowe,
2. dodane mockowe dane piosenek i losowanie 3 utworów,
3. dodany ekran głosowania użytkownika,
4. dodany podstawowy panel admina.

To tworzy prosty, działający szkielet MVP pod kolejne iteracje.

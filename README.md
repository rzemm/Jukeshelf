# JukeShelf (SzafaGrająca)

Prosty MVP aplikacji do głosowania na następny utwór z YouTube.

## Aktualny status

Pierwszy krok wdrożony:
- podstawowe modele domenowe (`Song`, `VotingRound`, `Vote`)
- prosta warstwa danych mockowych
- widok użytkownika (`/`) z 3 piosenkami i prostym oddaniem głosu po stronie klienta
- widok admina (`/admin`) z listą piosenek i podglądem losowania 3 utworów

## Uruchomienie

```bash
npm install
npm run dev
```

## Następne kroki MVP

1. Dodać formularz admina do dodawania linku YouTube.
2. Przechowywać stan rundy głosowania (aktywna/nieaktywna, zwycięzca).
3. Dodać prosty mechanizm „1 głos na rundę” oparty o `localStorage`.
4. Zastąpić mocki trwałym storage (docelowo Firebase).

# AGENTS.md

## Project overview
This project is a simple web app called JukeShelf (working name: SzafaGrająca).

The app is a live voting jukebox:
- an admin creates and manages a list of YouTube songs
- the system selects 3 random songs from the list
- users joining from their phones vote for the next song to play
- the song with the highest number of votes wins the round

## Main goals
Build a simple MVP first.
Do not overengineer.
Keep the code easy to understand and easy to extend.

## Tech stack
- Next.js
- TypeScript
- App Router
- Tailwind CSS
- Firebase planned for realtime data
- Vercel planned for deployment

## MVP scope
### Admin features
- add YouTube song links
- display the list of songs
- randomly choose 3 songs for a voting round
- start and end voting
- show the winning song

### User features
- open a simple voting page on mobile
- see 3 song options
- vote for one song
- see confirmation after voting

## Routes
- `/` — user voting screen
- `/admin` — admin panel

## Data model (initial idea)
### Song
- id
- youtubeUrl
- youtubeId
- title
- thumbnail

### VotingRound
- id
- songIds
- isActive
- startedAt
- endedAt
- winnerSongId

### Vote
- roundId
- songId
- voterId

## Engineering rules
- Make small, safe changes
- Avoid unnecessary dependencies
- Prefer simple solutions over advanced abstractions
- Keep components small and readable
- Explain what files were changed and why
- Propose a plan before making bigger changes
- Prioritize MVP over polish

## Notes
- No user login in MVP
- Admin auth can be added later
- Voting can initially use a simple client/session-based mechanism
- Firebase integration can be added after the basic UI and flow are ready
# Impostor

**Impostor** is a party game you play in the browser: one player is the impostor, everyone else shares a secret word. Ask questions, watch for slips, and vote out the intruder before they blend in too well.

There is no app to install. Host a room, share the code, and play together in person or over voice chat—your table, your rules.

## How it works

- **Host** creates a short room code and waits for at least three players.
- **Join** with a name and avatar, then enter the code to enter the lobby.
- When the round **starts**, civilians see the word; the impostor does not (they are told they are the impostor). Optional **ghost hints** can give the impostor a related clue so they can bluff without guessing blindly.
- Use discussion and deduction to find the impostor, then **end the round** and start a **new game** when you are ready for another word.

The UI is tuned for both desktop and mobile, with real-time updates so everyone sees joins, leaves, and game state as it happens.

## Features

- Room creation and join by code, with player avatars and names  
- Live lobby and game updates (Pusher channels)  
- Room and game state stored in Firebase  
- Rounds with roles, words, optional impostor hints, and word rotation across games  
- Host controls: start game, end round, new game, toggle hints, kick player  
- Responsive layout and touch-friendly room experience

## Tech stack


| Layer         | Choice                                                                              |
| ------------- | ----------------------------------------------------------------------------------- |
| Framework     | [Next.js](https://nextjs.org) (App Router), React 19, TypeScript                    |
| Styling       | [Tailwind CSS](https://tailwindcss.com) v4                                          |
| Motion        | [Framer Motion](https://www.framer.com/motion/)                                     |
| Realtime      | [Pusher](https://pusher.com)                                                        |
| Data          | [Firebase](https://firebase.google.com) (Firestore-style usage via project helpers) |
| Notifications | [react-toastify](https://fkhadra.github.io/react-toastify/)                         |


## Getting started locally

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root with your Firebase client config and Pusher credentials (server and client where noted):


| Variable                                   | Purpose                   |
| ------------------------------------------ | ------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase web API key      |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Auth domain               |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Project ID                |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Storage bucket            |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID       |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | App ID                    |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`      | Analytics (optional)      |
| `NEXT_PUBLIC_PUSHER_KEY`                   | Pusher app key (client)   |
| `NEXT_PUBLIC_PUSHER_CLUSTER`               | Pusher cluster, e.g. `eu` |
| `PUSHER_APP_ID`                            | Pusher app ID (server)    |
| `PUSHER_SECRET`                            | Pusher secret (server)    |


Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If the dev cache misbehaves (missing `.next` files), use:

```bash
npm run dev:fresh
```

Other scripts:


| Script                  | Command             |
| ----------------------- | ------------------- |
| Production build        | `npm run build`     |
| Start production server | `npm run start`     |
| Lint                    | `npm run lint`      |
| Clean `.next`           | `npm run clean`     |
| Dev with Turbopack      | `npm run dev:turbo` |


## Deploying

Build a production bundle with `npm run build`, then run `npm run start` or deploy to a host that supports Next.js (for example [Vercel](https://vercel.com)). Set the same environment variables in your hosting dashboard; keep `PUSHER_SECRET` and any server-only keys out of the client bundle.

---

Have fun, and trust no one—except maybe your friends. Briefly.
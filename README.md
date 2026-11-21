# Leonida Platinum — GTA VI Trophy Guide & Tracker

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Dungkrawww/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Dungkrawww/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

A complete trophy companion for Grand Theft Auto VI on PlayStation 5: the
whole official set of 55 trophies — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze,
of which 28 are hidden and 11 missable — each with its own written guide.
It is a plain static site that runs entirely offline in the browser: no
account, no network requests, nothing uploaded anywhere.

What it does:

- A checklist for all 55 trophies, saved in the browser, with export and
  import so progress survives a new device or a cleared cache
- Search plus filters by grade, category, earned state, and missable
- Hidden trophies stay spoiler-safe until you choose to reveal them
- A five-phase roadmap that orders the hunt toward the platinum
- A dedicated missables page so nothing locks you out of 100%
- Personal notes and counters on individual trophies, and a short
  "Next up" list of what to chase next

## Run it

Open `app/index.html` in a browser, or serve the folder locally:

```sh
node serve.ts
```

To produce the hand-in bundle (the same files plus a dossier summary):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide"
bounty, $250 in USDC.

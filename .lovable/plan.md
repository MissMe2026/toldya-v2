# ToldYa — Remaining build (Prompts 2–5)

Prompt 1 is done: brand design system, 30 seeded fictional artists, swipeable Discover deck with filters, auras, hype meter, "CALLED ©" stamp, tab bar and placeholder tabs. This plan covers everything else in the build plan and PRD, in the plan's order.

## Phase A — Accounts + demo login (moved first, since calls need a user)
- Email + password sign-in/sign-up page in the brand style, with a big red "Try the demo" button.
- Pre-seeded demo account (handle, 6 calls, 2 of which hit TOLD YA after +6 months).
- Profiles: handle, avatar aura, favorite genres.
- Discover stays browsable signed-out; "Call it" asks to sign in.

## Phase B — Calls, Receipts, Fast-forward
- Calls saved with listeners + timestamp; no duplicate calls; confirmation "Called it. [Artist] at 8.2K listeners on Oct 16, 2026."
- My Calls as printed receipts: then vs now, multiplier, Rising / Flat / Cooling chip, star up to 3 Big Calls (pinned), sort by date or growth.
- Fast-forward control (+1m, +3m, +6m, +1y, Reset) on Profile and floating on My Calls; banner "Simulated: +6 months". Simulated time is per user so judges don't affect each other.

## Phase C — Badges, TOLD YA moment, Share card, Leaderboard
- Badges: TOLD YA (5x), Before the Hype (<1K → 50K+), Golden Ears (3 TOLD YAs), First 100. Stamp-style designs.
- Full-screen red TOLD YA takeover: aura snaps blur→sharp, multiplier counts up, mono receipt line.
- Square share card (Download image, Copy link) and public page /r/:callId that works signed-out.
- Leaderboard by Ear Score, This week / All time, 15 seeded fictional users, your row highlighted.

## Phase D — Top 8, Connected Apps, Taste Profile
- Top 8 grid (add, remove, drag to reorder; search catalog, imports, or free text).
- Connected Apps: Spotify, Apple Music, YouTube Music, Pandora, SoundCloud, Tidal — simulated "Allow ToldYa" sheet, syncing animation, sample history import, "Demo mode — live sync coming soon." label.
- Taste Profile: top genres bars, "your sound" in 3 words, mainstream vs underground meter, sources.
- Discover weights toward your genres with "Because you listen to [genre]".
- Demo account: Spotify + Apple Music connected, Top 8 filled, YouTube Music left unconnected.

## Phase E — Onboarding, Profile, About, polish
- 3-screen onboarding (red split-screen style) + genre picker + optional Top 8 / Connect steps.
- Profile: Ear Score, badges, Top 3 Big Calls, stats (calls, hit rate, earliest call).
- About page: problem, how it works, what's next.
- Empty/loading/error states, focus states, mobile + desktop check, security scan, run the judge checklist.

## Technical details
- Tables: profiles, calls, user_sim (months elapsed + per-artist simulated listeners computed deterministically from growth_rate + seeded noise), badges, listening_imports, connected_apps, top8. RLS: own-row for user data; public read for artists, leaderboard view, and share-card data via a safe server function.
- "Now" listeners = f(artist, user's sim_months) computed client/server-side, so no global artist mutation.
- Demo login: fixed demo credentials in a server function that signs in; seeded via migration-time inserts plus a one-time setup server function for the auth user.
- Provider adapters in one module each with fetchTopArtists() / fetchRecent().
- Share image rendered with html-to-image.
- Auth: email/password only (per the plan), no Google, unless you want it.

## Question
Do you want Google sign-in too, or email + demo only?

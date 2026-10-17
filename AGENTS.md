<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## ToldYa architecture
- Simulated time is per-user (`profiles.sim_months`); "now" listeners are computed deterministically in `src/lib/toldya.ts` — never mutate artist listener counts, so judges don't affect each other.
- Badges, Ear Score and receipts are derived client-side from calls + artists + sim months; no badge table, so they always match the current simulated time.
- Listening-app connections are demo adapters in `src/lib/providers.ts` behind a `fetchTopArtists()/fetchRecent()` interface so real APIs can be swapped in later; imports live in `profiles.connected`.
- The demo account is created/reset by the public `prepareDemo` server function, which only touches the demo user.
- Auth and Discover use `useTryDemo` as the single demo reset/sign-in flow so entry points cannot drift.
- Discover ordering lives in a browser-safe pure helper, tested independently, so taste priority and growth ordering stay deterministic.
- Discover uses a viewport-height PageShell with a flexible aura and intrinsic card details, reserving safe-area-aware space for tabs and actions.

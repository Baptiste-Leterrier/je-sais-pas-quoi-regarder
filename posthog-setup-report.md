<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into the *Je c'pas koi regarder* Vite/vanilla-JS movie tournament app. PostHog (`posthog-js`) was installed and initialised alongside the existing Umami analytics. A new `src/analytics/posthog.js` module was created to wrap initialisation and event capture, mirroring the Umami module's pattern. `src/main.js` was updated to call `initPostHog()` on startup. PostHog capture calls were added next to every existing Umami `track()` call across all five screen files.

| Event | Description | File |
|---|---|---|
| `mode_started` | User selects tournament or discover mode from the home screen | `src/screens/home.js` |
| `candidate_added` | User adds a movie or series to the tournament basket | `src/screens/select.js` |
| `tournament_started` | User launches the tournament with their selected candidates | `src/screens/select.js` |
| `duel_choice` | User makes a choice during a tournament duel (click, indifferent, none, timeout) | `src/screens/tournament.js` |
| `tournament_completed` | Tournament finishes with a single winner | `src/screens/tournament.js` |
| `tournament_restart` | User restarts the tournament after all candidates were eliminated | `src/screens/tournament.js` |
| `final_choice` | User confirms the tournament winner and returns to home | `src/screens/result.js` |
| `discover_step` | User completes a step in the discover quiz (type, genres, era, themes) | `src/screens/discover.js` |
| `discover_completed` | User finishes all discover quiz steps and a tournament is generated | `src/screens/discover.js` |
| `discover_relaunch` | User requests new discover suggestions from the result screen | `src/screens/result.js` |

## Next steps

We've built some insights and a dashboard to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/690260)
- [Tournament completion funnel](/insights/EmGmjHgk) — conversion from mode selection → tournament start → completion → final choice
- [Mode usage over time](/insights/Dy39hASa) — daily breakdown of tournament vs discover mode usage
- [Discover quiz completion funnel](/insights/Elh031th) — conversion from discover mode → quiz completed → final choice
- [Duel choice breakdown](/insights/5nKfdlNK) — how users make duel choices (click, indifferent, none, timeout)
- [Total sessions over time](/insights/Bdf130dt) — daily active users trend

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>

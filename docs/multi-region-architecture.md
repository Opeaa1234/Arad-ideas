# Multi-region foundation

The shared Explorer engine will support separate regional catalogues while preserving Arad's existing experience and player data.

## Region identities

| Region ID | Country / area | Locale | Catalogue | Status |
| --- | --- | --- | --- | --- |
| `ro-arad` | Romania · Arad | `ro-RO` | `data/game-data.json` | Enabled |
| `ng-lagos` | Nigeria · Lagos State | `en-NG` | `data/regions/ng-lagos/game-data.json` | Disabled pending content and backend verification |

The pure configuration lives in `js/regions.js`. This PR does not switch the running app's loader or alter the Arad catalogue.

## Selection and safety rules

- Keep Arad as the default for existing visitors.
- A future region selector or explicit URL parameter may select a region by its stable ID.
- Never infer or change the selected region from GPS coordinates. GPS is for navigation and discovery only.
- Unknown and disabled regions fail closed; they must not silently fall back to a different region.
- Keep each region's catalogue, map centre, language, interaction radius and arrival threshold in its own config.

## Player data isolation

- Preserve the current Arad local-storage namespace: `arad-explorer:v3:<userId>:`.
- Reserve a separate Lagos namespace: `explorer:ng-lagos:v1:user:<userId>:`.
- Before enabling Lagos, enforce `region_id` in the server-side score schema and RPCs. UI filtering alone is not account/data isolation.
- Keep Arad scores, first-blood results, route choices and local progress unchanged.
- Reuse the existing Supabase project only after its schema and access are verified. Do not create a second project as part of this work.

## Lagos release gates

Lagos remains disabled until its catalogue has verified coordinates, content sources, photo rights, access conditions and safe pedestrian routing. The corresponding backend region allowlist and filtered leaderboard must also be reviewed and tested. No Lagos catalogue or live database change is included here.

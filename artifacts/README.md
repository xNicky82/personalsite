# Artifacts

Standalone pages published to claude.ai as Artifacts. They are not part of the
Next.js app and are not routed by it — the source lives here so the queries and
the layout are reviewable and diffable.

## oura-promo-desk.html

Live tracker for the Oura Ring demo giveaway that runs on `/promo-oura-ring`.

Published at https://claude.ai/code/artifact/84135af8-c012-40db-be76-24f05017ee5c

The page declares the `mcp` runtime capability and reads the viewer's own
HubSpot and Snowflake connectors. On load it:

1. Pulls live membership and stage for HubSpot list `15738`
   ("Oura Ring Promo - Demos/Deals") via `query_crm_data`.
2. Feeds those deal IDs into four Snowflake `sql_exec` queries — the segment
   summary (with the Jan 2025–May 2026 team benchmarks and Facebook ad spend on
   Oura creatives), the daily cohort series, the SAL roster, and the
   organizations roster.
3. Computes every ratio and dollar figure in the page from those results plus
   the editable ring price.

Picking a day (chips above the table, or clicking a bar in either chart)
re-registers the summary watch with `CREATE_DATE` pinned to that day and
narrows ad spend to that day's Facebook spend, so the cost columns stay
honest. Benchmark columns never change — they are mature cohorts.

Clicking a SALs count opens the roster for that segment: person, company,
owner, stage and a link to the deal. The roster is fetched live per viewer
through their own connector and is deliberately absent from `SNAPSHOT`, so no
contact data is baked into the published page.

The Organizations panel, low on the page, runs off the promo **form fills**
rather than the demo list, so an account appears at Contact before it books
anything — which is how Stripe shows up while it still has no demo. Each row
is ranked on the signals HubSpot already carries (ICP tier, target account,
existing ARR, headcount) and tracked Contact → Booked → Held → Trial → Won.
Its tabs sort best / newest / oldest / furthest along, and the funnel table's
day chips also narrow it, on the day the account came in.

Like the SAL roster, it is fetched live per viewer and kept out of `SNAPSHOT`,
so no account or contact data is baked into the published page.

HubSpot and the summary query refresh every 60s; the SAL and organization
rosters every 120s; the daily series every 180s.
The warehouse itself pulls from HubSpot and the ad platforms about hourly.

`SNAPSHOT` near the top of the script is the embedded fallback, rendered
instantly so the page is never blank and used whenever connectors are
unavailable. A scheduled job refreshes it hourly.

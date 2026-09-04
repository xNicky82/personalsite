# Oura Ring Promo demo alerts

When a new HubSpot deal is created for a contact carrying the `Oura Ring Promo`
marketing tag, this service researches the lead, grades it, and posts a
formatted Slack DM. It replaces a scheduled task that only ran while a laptop
was open, so the point of it is that it runs unattended.

Portal `20853254`, new business pipeline `109689417`.

## How it runs

HubSpot posts to `POST /api/hubspot-webhook` within seconds of the deal being
created. The handler verifies `X-HubSpot-Signature-v3`, answers 200 immediately,
and does the work in `after()`, because HubSpot retries on slow responses and an
overlapping retry double-sends.

A webhook rather than a schedule, deliberately. Vercel Cron caps a Hobby plan at
once per day, and any polling design reintroduces the exact failure this
replaces: a gap while nothing runs, then the whole backlog delivered at once.

```
route.ts        signature check, fast 200, fan out to after()
pipeline.ts     filters, enrichment, grading, delivery, dedupe write
hubspot.ts      deal, contact, company and owner reads
meeting.ts      who is hosting the demo and when, resolved in code
lead-name.ts    name rendering, including the records the form polluted
prompt.ts       the grading prompt
grade.ts        the Anthropic call, web search on
slack.ts        chat.postMessage and shadow/live routing
dedupe.ts       deal ids already alerted on
```

## Filters

The webhook fires on every new deal, roughly 160 a day, of which about half are
promo tagged, arriving in bursts after campaign sends rather than evenly. So the
filters run cheapest first and only a fraction of deals ever reach a model call:

1. drop anything not in pipeline `109689417`
2. drop anything whose deal id is already in the dedupe store
3. drop anything whose contact `marketing_tags` does not contain `Oura Ring Promo`

Enrichment and grading happen only after all three pass.

## Setup

**HubSpot private app.** Scopes `crm.objects.deals.read`,
`crm.objects.contacts.read`, `crm.objects.companies.read`,
`crm.objects.owners.read`. Add a webhook subscription on `deal.creation`
pointing at `https://<deployment>/api/hubspot-webhook`. Put the app token in
`HUBSPOT_PRIVATE_APP_TOKEN` and the app's client secret in
`HUBSPOT_WEBHOOK_SECRET`.

**Slack app.** Bot scope `chat:write`, plus `users:read` only if you ever want
to resolve AE names to ids dynamically rather than from the map in `config.ts`.
Token goes in `SLACK_BOT_TOKEN`.

**Dedupe store.** Vercel KV or Upstash Redis. Either naming pair works
(`KV_REST_API_URL` + `KV_REST_API_TOKEN`, or `UPSTASH_REDIS_REST_URL` +
`UPSTASH_REDIS_REST_TOKEN`). Without one the store falls back to process memory,
which is not a dedupe store on a platform that runs a cold lambda most of the
time; the handler logs a warning when that happens.

All variables are listed in `.env.example`.

## Shadow mode and going live

`SHADOW_MODE` defaults to on, and anything other than the literal string
`false` keeps it on. In shadow mode every alert goes to `SHADOW_RECIPIENT`
(`U0BAPSYFLSV`, Nick) and nobody else. The message still `@`-mentions the AE,
which is safe because a mention does not notify someone who is not in that
conversation.

Setting `SHADOW_MODE=false` sends to the meeting host and copies Nick as the
audit trail. When the host could not be resolved, or the meeting looks like it
belongs to a different lead, the alert goes to Nick alone and a human routes it.

## What the model decides and what it does not

The model grades the lead, reads the decision maker signal and runs the claim
check, with web search enabled (`max_uses: 3`) so it can establish an unfamiliar
employer from a domain. That is the judgement, and it is worth a strong model:
`geodesicllp.com` is a geospatial analytics company, `autoglassadvocates.com`
processes insurance claims, and `mcguirewoods.com` is a 1,000 lawyer firm.

The display name and the Demo line are resolved in TypeScript and handed to the
model to print verbatim. Both are mechanical (string matching plus a timezone
conversion), both are covered by tests, and the Demo line is the one an AE
actually acts on, so neither is left to drift.

## Known risks

**The meeting properties are flagged for deletion.** `hs_next_meeting_name` and
`hs_next_meeting_start_time` are both labelled "Scheduled for
Deletion/Archiving" in this portal, and the whole Demo line depends on them.
Meetings do not appear in the `MEETING_EVENT` object here, at least not through
the standard connector, so there is no second source today. If those properties
are archived, every alert degrades silently to "not on a calendar yet" rather
than erroring. Worth chasing whoever owns that cleanup, and worth reading
meetings through the engagements API as a fallback if it goes ahead.

**The form writes full names into `firstname`.** Records exist with
`firstname: "Zane Jones", lastname: "Jones"`. `lead-name.ts` handles it and
`lead-name.test.ts` pins it, but the real fix is upstream in the form.

**Batch size against the function ceiling.** HubSpot batches events, so a burst
after a campaign send can arrive as one large payload. The handler grades four
leads at a time and `maxDuration` is set to 300 seconds, which Vercel clamps to
the plan ceiling (60 seconds on Hobby). A batch large enough to outrun that
ceiling loses its tail, and because the response already returned 200 HubSpot
will not retry it. If campaign bursts start arriving in payloads of more than a
handful of deals, the fix is a queue between the webhook and the grading rather
than a bigger timeout.

**`associations.deal` is not a valid contacts search filter.** It fails with
"the app returned Error with no further details". Every hop from a deal goes
through the v4 associations endpoints instead.

## Tests

```bash
npm test
```

Covers the filters (a non-promo deal and an already-alerted deal are both
dropped before any model call), the dedupe ordering (a Slack failure writes
nothing, so the lead is retried), name rendering, the Demo line in all of its
shapes including the missing meeting and the meeting linked from another lead,
signature verification, and that shadow mode never posts anywhere except
`SHADOW_RECIPIENT`.

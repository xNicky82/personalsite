// Slack delivery.
//
// Slack renders mrkdwn, not Markdown: bold is *single asterisks*, links are
// <url|label> and mentions are <@U01234567>. Double asterisks render literally
// and look broken, so the grading prompt is strict about it and nothing here
// reformats the model's output.

import { DEFAULT_SHADOW_RECIPIENT, env } from './config'

export type SlackPostResult =
  | { ok: true; channel: string }
  | { ok: false; error: string }

export async function postMessage(
  channel: string,
  text: string,
): Promise<SlackPostResult> {
  const token = env().slackBotToken
  if (!token) return { ok: false, error: 'SLACK_BOT_TOKEN is not set' }

  let res: Response
  try {
    res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ channel, text, unfurl_links: false }),
      signal: AbortSignal.timeout(10_000),
    })
  } catch (err) {
    return { ok: false, error: `slack request failed: ${String(err)}` }
  }

  if (!res.ok) return { ok: false, error: `slack http ${res.status}` }

  // Slack answers 200 with ok:false for application errors, so the HTTP status
  // alone is not a confirmed send.
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean
    error?: string
  }
  if (!body.ok) return { ok: false, error: body.error ?? 'unknown slack error' }
  return { ok: true, channel }
}

// Who the alert actually goes to.
//
// Shadow mode sends only to Nick. The message still @-mentions the AE, which is
// safe because a mention does not notify someone who is not in the
// conversation. Live mode sends to the host and copies Nick as the audit trail,
// and falls back to Nick alone whenever the host could not be resolved or the
// meeting looks like it belongs to a different lead.
export function recipients(hostSlackId: string | null): string[] {
  const { shadowMode, shadowRecipient } = env()
  const audit = shadowRecipient || DEFAULT_SHADOW_RECIPIENT

  if (shadowMode) return [audit]
  if (!hostSlackId || hostSlackId === audit) return [audit]
  return [hostSlackId, audit]
}

export async function deliver(
  text: string,
  hostSlackId: string | null,
): Promise<{
  delivered: string[]
  failures: Array<{ channel: string; error: string }>
}> {
  const delivered: string[] = []
  const failures: Array<{ channel: string; error: string }> = []

  for (const channel of recipients(hostSlackId)) {
    const result = await postMessage(channel, text)
    if (result.ok) delivered.push(channel)
    else failures.push({ channel, error: result.error })
  }

  return { delivered, failures }
}
